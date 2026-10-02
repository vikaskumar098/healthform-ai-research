"""
DocumentTypeValidator — HealthForm AI
======================================
Deterministic multi-signal scoring engine that validates whether an extracted
document is a genuine laboratory / medical test report.

Design philosophy:
  - Deterministic first: keyword/pattern/structure evidence is computed WITHOUT
    any LLM call so the gate is cheap and cannot be bypassed.
  - Multi-signal: no single keyword can pass the gate. Multiple independent
    evidence categories must collectively exceed the threshold.
  - Configurable threshold: VALIDATION_THRESHOLD controls strictness.
  - The LLM is NEVER called for documents that fail this gate.

Evidence categories (each independently scored, then summed):
  S1 – Lab report header/title indicators
  S2 – Known test-name hits
  S3 – Numeric result + unit pairs (structured data)
  S4 – Reference range patterns
  S5 – Laboratory metadata (patient, date, lab name, specimen)
  S6 – Table/column structure signals
  S7 – Lab flag markers (H/L/HIGH/LOW)

Scoring rules:
  Each category contributes 0 to its max_score.
  Total score >= VALIDATION_THRESHOLD → VALID.
  Each category has a cap so one very strong signal cannot alone pass the gate.

Rejection codes (internal):
  EMPTY_DOCUMENT          – extracted text is empty/too short
  NO_TEXT_DETECTED        – OCR returned nothing
  NOT_A_LAB_REPORT        – score below threshold after full evaluation
  INSUFFICIENT_LAB_EVIDENCE – some signals present but not enough
  NO_TEST_RESULTS_FOUND   – no numeric+unit pairs detected
"""

import re
import logging
from dataclasses import dataclass, field
from typing import List, Tuple, Optional

logger = logging.getLogger("healthform.document_validator")

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────

# Minimum total score out of MAX_POSSIBLE_SCORE (55) required for VALID
VALIDATION_THRESHOLD: float = 18.0

# Minimum number of distinct test-name hits required (hard gate, not score-based)
MIN_TEST_NAME_HITS: int = 1

# Minimum number of numeric result + unit pairs required (hard gate)
MIN_NUMERIC_UNIT_PAIRS: int = 1

# Minimum text length before we even start scoring (characters)
MIN_TEXT_LENGTH: int = 30

# ──────────────────────────────────────────────────────────────────────────────
# Signal vocabulary
# ──────────────────────────────────────────────────────────────────────────────

# S1 — Lab header / report title keywords (case-insensitive, word-boundary)
LAB_HEADER_KEYWORDS: List[str] = [
    r"\blaboratory\b", r"\blab report\b", r"\bclinical laboratory\b",
    r"\bpathology\b", r"\bdiagnostics\b", r"\bmedical laboratory\b",
    r"\bblood test\b", r"\btest report\b", r"\bhaematology\b", r"\bhematology\b",
    r"\bcomplete blood count\b", r"\bcbc\b", r"\bcmp\b",
    r"\bcomprehensive metabolic\b", r"\blipid profile\b", r"\bthyroid function\b",
    r"\blft\b", r"\bkft\b", r"\brft\b", r"\burinalysis\b", r"\burine routine\b",
    r"\bhepatology\b", r"\bbiochemistry\b", r"\bmicrobiology\b",
    r"\bcoagulation\b", r"\bserology\b", r"\bimmunology\b",
    r"\bglucose tolerance\b", r"\bhba1c\b", r"\bvitamin\b",
    r"\btyroid\b", r"\bmetabolic panel\b", r"\belectrolyte\b",
    r"\baccreditation\b", r"\bclia\b", r"\bnabl\b", r"\bcap accredited\b",
]

# S2 — Known lab test names (a comprehensive but not exhaustive set)
KNOWN_TEST_NAMES: List[str] = [
    # CBC
    r"\bhemoglobin\b", r"\bhgb\b", r"\bhematocrit\b", r"\bhct\b",
    r"\bwbc\b", r"\bwhite blood cell\b", r"\bleukocytes?\b",
    r"\brbc\b", r"\bred blood cell\b", r"\berythrocytes?\b",
    r"\bplatelets?\b", r"\bplt\b", r"\bmcv\b", r"\bmch\b", r"\bmchc\b",
    r"\bneutrophils?\b", r"\blymphocytes?\b", r"\bmonocytes?\b",
    r"\beosinophils?\b", r"\bbasophils?\b", r"\bband cells?\b",
    # Metabolic
    r"\bglucose\b", r"\bblood sugar\b", r"\bfasting glucose\b",
    r"\bblood urea nitrogen\b", r"\bbun\b", r"\bcreatinine\b",
    r"\bsodium\b", r"\bpotassium\b", r"\bchloride\b", r"\bcalcium\b",
    r"\bbicarbonate\b", r"\bco2\b", r"\bphosphorus\b", r"\bmagnesium\b",
    r"\buric acid\b", r"\bgfr\b", r"\begfr\b",
    # Lipids
    r"\bcholesterol\b", r"\btriglycerides?\b", r"\bhdl\b", r"\bldl\b",
    r"\bvldl\b", r"\bnon-hdl\b",
    # Liver / Hepatic
    r"\balt\b", r"\bsgpt\b", r"\bast\b", r"\bsgot\b",
    r"\balkaline phosphatase\b", r"\balp\b", r"\bggt\b",
    r"\bbilirubin\b", r"\balbumin\b", r"\btotal protein\b",
    r"\bglobulin\b", r"\bpt\b",
    # Thyroid
    r"\btsh\b", r"\bthyroid stimulating hormone\b",
    r"\bt3\b", r"\bt4\b", r"\bfree t3\b", r"\bfree t4\b", r"\bft3\b", r"\bft4\b",
    # Vitamins / iron
    r"\bvitamin d\b", r"\bvitamin b12\b", r"\bferritin\b", r"\bserum iron\b",
    r"\btibc\b", r"\bfolate\b",
    # Diabetes
    r"\bhba1c\b", r"\bglycated hemoglobin\b",
    # Coagulation
    r"\bpt\b", r"\baptt\b", r"\binr\b", r"\bfibrinogen\b",
    # Urine
    r"\bspecific gravity\b", r"\burine ph\b", r"\bproteinuria\b",
    r"\bhematuria\b", r"\bketonuria\b",
    # Infection / inflammation
    r"\bcrp\b", r"\bc-reactive protein\b", r"\besr\b",
    r"\bprocalcitonin\b", r"\bwidal\b",
    # Hormones
    r"\bcortisol\b", r"\binsulin\b", r"\bestrogen\b", r"\btestosterone\b",
    r"\bprolactin\b", r"\bfsh\b", r"\blh\b", r"\bdheas\b",
]

# S3 — Numeric result + medical unit combos (value immediately followed by unit)
NUMERIC_UNIT_PATTERN = re.compile(
    r'\b(\d+\.?\d*)\s*'
    r'(g/d[Ll]|mg/d[Ll]|mmol/[Ll]|µmol/[Ll]|umol/[Ll]|mEq/[Ll]|'
    r'IU/[Ll]|U/[Ll]|mIU/[Ll]|uIU/m[Ll]|uIU/[Ll]|mIU/m[Ll]|ng/m[Ll]|pg/m[Ll]|'
    r'10\^3/u[Ll]|10\*3/u[Ll]|K/u[Ll]|fL|pg|%|'
    r'mg/L|g/L|mmHg|mL/min|ng/dL|µg/dL|ug/dL|'
    r'/[Hh][Pp][Ff]|/[Ll][Pp][Ff]|cells?/[Hh][Pp][Ff]|cells?/u[Ll]|'
    r'/cumm|/cmm|sec|seconds?|ratio|index|mOsm/kg)\b',
    re.IGNORECASE,
)

# S4 — Reference range patterns  e.g. "13.0 - 17.0"  "< 200"  "> 50"
REF_RANGE_PATTERN = re.compile(
    r'(\d+\.?\d*)\s*[-–—to]+\s*(\d+\.?\d*)'   # 13.0 - 17.0
    r'|[<≤]\s*\d+\.?\d*'                        # < 200
    r'|[>≥]\s*\d+\.?\d*',                       # > 50
    re.IGNORECASE,
)

# S5 — Lab metadata patterns
LAB_METADATA_PATTERNS: List[re.Pattern] = [
    re.compile(r'patient\s*(name|id|no|number)\s*[:\-]', re.IGNORECASE),
    re.compile(r'(collection|specimen|sample)\s*(date|time|type)\s*[:\-]', re.IGNORECASE),
    re.compile(r'(physician|doctor|dr\.?|referred by)\s*[:\-]', re.IGNORECASE),
    re.compile(r'(lab|laboratory|accession|report)\s*(no|number|id|#)\s*[:\-]', re.IGNORECASE),
    re.compile(r'date\s*(of|:)\s*(birth|collection|report)', re.IGNORECASE),
    re.compile(r'(gender|sex|age)\s*[:\-/]', re.IGNORECASE),
    re.compile(r'(report|specimen|barcode)\s*[:\-]?\s*[A-Z0-9\-]{4,}', re.IGNORECASE),
]

# S6 — Table/column structure signals
TABLE_STRUCTURE_PATTERNS: List[re.Pattern] = [
    re.compile(r'(test\s*name|parameter|analyte)\s+.*(result|value).*(unit|reference|range)', re.IGNORECASE | re.DOTALL),
    re.compile(r'\b(normal|reference|reported)\s+range\b', re.IGNORECASE),
    re.compile(r'\b(flag|status|interpretation)\b', re.IGNORECASE),
    re.compile(r'\b(result|value|reading)\b', re.IGNORECASE),
    re.compile(r'\b(panel|profile|examination|assay)\b', re.IGNORECASE),
]

# S7 — Lab flag markers
LAB_FLAG_PATTERN = re.compile(
    r'\b(HIGH|LOW|H|L|\[H\]|\[L\]|CRITICAL|ABNORMAL|NORMAL|WITHIN|OUTSIDE|'
    r'positive|negative|reactive|non-?reactive)\b',
    re.IGNORECASE,
)

# ──────────────────────────────────────────────────────────────────────────────
# Scoring weights per category (cap = max contribution from that category)
# ──────────────────────────────────────────────────────────────────────────────
SCORE_WEIGHTS = {
    "s1_header":      {"per_hit": 2.0,  "cap": 8.0},   # max 8
    "s2_test_names":  {"per_hit": 3.0,  "cap": 15.0},  # max 15
    "s3_numeric_unit":{"per_hit": 2.5,  "cap": 12.5},  # max 12.5
    "s4_ref_range":   {"per_hit": 2.0,  "cap": 8.0},   # max 8
    "s5_metadata":    {"per_hit": 1.5,  "cap": 6.0},   # max 6
    "s6_table_struct":{"per_hit": 1.0,  "cap": 4.0},   # max 4
    "s7_flags":       {"per_hit": 0.5,  "cap": 1.5},   # max 1.5
}
# MAX_POSSIBLE_SCORE = 55.5   THRESHOLD = 18  (~33%)


# ──────────────────────────────────────────────────────────────────────────────
# Result dataclass
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class ValidationResult:
    is_valid_report: bool
    document_type: str          # "laboratory_report" | "unknown" | "non_medical_document"
    confidence: float           # 0.0 – 1.0
    total_score: float
    threshold: float
    rejection_code: Optional[str]        # internal code e.g. "NOT_A_LAB_REPORT"
    rejection_reason: str                # developer-readable
    user_message: str                    # safe user-facing message
    signals: dict = field(default_factory=dict)   # per-category breakdown


# ──────────────────────────────────────────────────────────────────────────────
# Main validator
# ──────────────────────────────────────────────────────────────────────────────

class DocumentTypeValidator:
    """
    Stateless, deterministic document-type validator.
    Call validate(text) after OCR extraction.
    """

    @classmethod
    def validate(cls, text: str) -> ValidationResult:
        """
        Run all evidence signals and return a ValidationResult.
        The LLM must NOT be called if is_valid_report is False.
        """
        text = text or ""
        stripped = text.strip()

        # ── Hard gate 1: empty / too short ──────────────────────────────────
        if not stripped or len(stripped) < MIN_TEXT_LENGTH:
            return ValidationResult(
                is_valid_report=False,
                document_type="unknown",
                confidence=0.0,
                total_score=0.0,
                threshold=VALIDATION_THRESHOLD,
                rejection_code="EMPTY_DOCUMENT",
                rejection_reason="Extracted text is empty or too short to evaluate.",
                user_message=(
                    "We couldn't read any text from your file. "
                    "Please upload a clearer PDF or image of your lab report."
                ),
                signals={},
            )

        signals: dict = {}

        # ── S1: Lab header / title indicators ───────────────────────────────
        s1_hits = sum(
            1 for pat in LAB_HEADER_KEYWORDS
            if re.search(pat, stripped, re.IGNORECASE)
        )
        s1_score = min(s1_hits * SCORE_WEIGHTS["s1_header"]["per_hit"],
                       SCORE_WEIGHTS["s1_header"]["cap"])
        signals["s1_header"] = {"hits": s1_hits, "score": s1_score}

        # ── S2: Known test names ─────────────────────────────────────────────
        s2_hits = sum(
            1 for pat in KNOWN_TEST_NAMES
            if re.search(pat, stripped, re.IGNORECASE)
        )
        s2_score = min(s2_hits * SCORE_WEIGHTS["s2_test_names"]["per_hit"],
                       SCORE_WEIGHTS["s2_test_names"]["cap"])
        signals["s2_test_names"] = {"hits": s2_hits, "score": s2_score}

        # ── S3: Numeric result + unit pairs ─────────────────────────────────
        s3_matches = NUMERIC_UNIT_PATTERN.findall(stripped)
        s3_hits = len(s3_matches)
        s3_score = min(s3_hits * SCORE_WEIGHTS["s3_numeric_unit"]["per_hit"],
                       SCORE_WEIGHTS["s3_numeric_unit"]["cap"])
        signals["s3_numeric_unit"] = {"hits": s3_hits, "score": s3_score}

        # ── S4: Reference range patterns ─────────────────────────────────────
        s4_matches = REF_RANGE_PATTERN.findall(stripped)
        s4_hits = len(s4_matches)
        s4_score = min(s4_hits * SCORE_WEIGHTS["s4_ref_range"]["per_hit"],
                       SCORE_WEIGHTS["s4_ref_range"]["cap"])
        signals["s4_ref_range"] = {"hits": s4_hits, "score": s4_score}

        # ── S5: Lab metadata ─────────────────────────────────────────────────
        s5_hits = sum(1 for pat in LAB_METADATA_PATTERNS if pat.search(stripped))
        s5_score = min(s5_hits * SCORE_WEIGHTS["s5_metadata"]["per_hit"],
                       SCORE_WEIGHTS["s5_metadata"]["cap"])
        signals["s5_metadata"] = {"hits": s5_hits, "score": s5_score}

        # ── S6: Table / column structure ─────────────────────────────────────
        s6_hits = sum(1 for pat in TABLE_STRUCTURE_PATTERNS if pat.search(stripped))
        s6_score = min(s6_hits * SCORE_WEIGHTS["s6_table_struct"]["per_hit"],
                       SCORE_WEIGHTS["s6_table_struct"]["cap"])
        signals["s6_table_struct"] = {"hits": s6_hits, "score": s6_score}

        # ── S7: Lab flags ─────────────────────────────────────────────────────
        s7_hits = len(LAB_FLAG_PATTERN.findall(stripped))
        s7_score = min(s7_hits * SCORE_WEIGHTS["s7_flags"]["per_hit"],
                       SCORE_WEIGHTS["s7_flags"]["cap"])
        signals["s7_flags"] = {"hits": s7_hits, "score": s7_score}

        total_score = s1_score + s2_score + s3_score + s4_score + s5_score + s6_score + s7_score

        # ── Hard gate 2: test names ──────────────────────────────────────────
        if s2_hits < MIN_TEST_NAME_HITS:
            code = "NOT_A_LAB_REPORT"
            reason = (
                f"No recognized laboratory test names detected in document. "
                f"(score={total_score:.1f}, threshold={VALIDATION_THRESHOLD})"
            )
            logger.info(f"[DocValidator] REJECTED {code}: {reason} | signals={signals}")
            return ValidationResult(
                is_valid_report=False,
                document_type="non_medical_document",
                confidence=round(total_score / VALIDATION_THRESHOLD * 0.5, 2),
                total_score=total_score,
                threshold=VALIDATION_THRESHOLD,
                rejection_code=code,
                rejection_reason=reason,
                user_message=_user_message(code),
                signals=signals,
            )

        # ── Hard gate 3: numeric + unit pairs ────────────────────────────────
        # Laboratory reports typically have numeric results with units. However, qualitative panels
        # (e.g. urinalysis dipsticks, serology) may report text ratings (Negative, Positive, Trace)
        # alongside reference ranges and recognized analyte names.
        has_qualitative_evidence = (s4_hits >= 2 and s2_hits >= 2)
        if s3_hits < MIN_NUMERIC_UNIT_PAIRS and not has_qualitative_evidence:
            code = "NO_TEST_RESULTS_FOUND"
            reason = (
                f"No structured test result values with medical units found. "
                f"(score={total_score:.1f}, threshold={VALIDATION_THRESHOLD})"
            )
            logger.info(f"[DocValidator] REJECTED {code}: {reason} | signals={signals}")
            return ValidationResult(
                is_valid_report=False,
                document_type="non_medical_document",
                confidence=round(total_score / VALIDATION_THRESHOLD * 0.5, 2),
                total_score=total_score,
                threshold=VALIDATION_THRESHOLD,
                rejection_code=code,
                rejection_reason=reason,
                user_message=_user_message(code),
                signals=signals,
            )

        # ── Threshold check ───────────────────────────────────────────────────
        if total_score < VALIDATION_THRESHOLD:
            code = "INSUFFICIENT_LAB_EVIDENCE"
            reason = (
                f"Multi-signal lab-report evidence score ({total_score:.1f}) is below "
                f"required threshold ({VALIDATION_THRESHOLD}). "
                f"Possible non-lab document or low-quality scan."
            )
            logger.info(f"[DocValidator] REJECTED {code}: {reason} | signals={signals}")
            return ValidationResult(
                is_valid_report=False,
                document_type="non_medical_document",
                confidence=round(total_score / VALIDATION_THRESHOLD * 0.5, 2),
                total_score=total_score,
                threshold=VALIDATION_THRESHOLD,
                rejection_code=code,
                rejection_reason=reason,
                user_message=_user_message(code),
                signals=signals,
            )

        # ── VALID ─────────────────────────────────────────────────────────────
        max_possible = sum(w["cap"] for w in SCORE_WEIGHTS.values())
        confidence = min(total_score / max_possible, 1.0)
        logger.info(
            f"[DocValidator] VALID laboratory_report: "
            f"score={total_score:.1f}/{VALIDATION_THRESHOLD}, "
            f"confidence={confidence:.2f} | signals={signals}"
        )
        return ValidationResult(
            is_valid_report=True,
            document_type="laboratory_report",
            confidence=round(confidence, 2),
            total_score=total_score,
            threshold=VALIDATION_THRESHOLD,
            rejection_code=None,
            rejection_reason="",
            user_message="",
            signals=signals,
        )


# ──────────────────────────────────────────────────────────────────────────────
# User-facing message mapper  (no technical details exposed)
# ──────────────────────────────────────────────────────────────────────────────

def _user_message(code: str) -> str:
    messages = {
        "EMPTY_DOCUMENT": (
            "We couldn't read any text from your file. "
            "Please upload a clearer PDF or image of your lab report."
        ),
        "NO_TEXT_DETECTED": (
            "We couldn't extract text from this file. "
            "Please upload a higher-resolution scan or a text-based PDF."
        ),
        "CORRUPTED_DOCUMENT": (
            "Your file appears to be damaged or unreadable. "
            "Please try uploading a different copy."
        ),
        "NOT_A_LAB_REPORT": (
            "We couldn't identify enough laboratory test information in this file. "
            "Please upload a PDF or image containing laboratory test results, "
            "values, units, or reference ranges."
        ),
        "INSUFFICIENT_LAB_EVIDENCE": (
            "We couldn't identify enough laboratory test information in this file. "
            "Please upload a PDF or image containing laboratory test results, "
            "values, units, or reference ranges."
        ),
        "NO_TEST_RESULTS_FOUND": (
            "We couldn't find structured test results in this file. "
            "Please upload a lab report that contains test names, result values, and units."
        ),
    }
    return messages.get(
        code,
        "Please upload a valid laboratory report containing test results and reference ranges.",
    )


# ──────────────────────────────────────────────────────────────────────────────
# Module-level singleton
# ──────────────────────────────────────────────────────────────────────────────
document_type_validator = DocumentTypeValidator()

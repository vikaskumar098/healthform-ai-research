import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from app.schemas.parameter import LaboratoryParameter, ReferenceRange, SourceInfo

logger = logging.getLogger("healthform.extraction")

KNOWN_TESTS = [
    ("Hemoglobin", ["hemoglobin", "hgb", "hb"]),
    ("Hematocrit", ["hematocrit", "hct"]),
    ("WBC Count", ["wbc count", "wbc", "white blood cell", "leukocytes"]),
    ("Platelets", ["platelets", "platelet count", "plt"]),
    ("MCV", ["mcv", "mean corpuscular volume"]),
    ("MCH", ["mch", "mean corpuscular hemoglobin"]),
    ("MCHC", ["mchc"]),
    ("Fasting Glucose", ["fasting glucose", "glucose, fasting", "glucose", "blood sugar"]),
    ("Blood Urea Nitrogen", ["blood urea nitrogen", "bun", "urea nitrogen"]),
    ("Serum Creatinine", ["serum creatinine", "creatinine"]),
    ("Sodium", ["sodium", "na"]),
    ("Potassium", ["potassium", "k"]),
    ("Chloride", ["chloride", "cl"]),
    ("Calcium", ["calcium", "ca"]),
    ("HDL Cholesterol", ["hdl cholesterol", "hdl-c", "hdl"]),
    ("LDL Cholesterol", ["ldl cholesterol", "ldl-c", "ldl"]),
    ("Total Cholesterol", ["total cholesterol", "cholesterol, total", "cholesterol"]),
    ("Triglycerides", ["triglycerides", "trig"]),
    ("ALT (Alanine Aminotransferase)", ["alt (alanine aminotransferase)", "alanine aminotransferase", "alt", "sgpt"]),
    ("AST (Aspartate Aminotransferase)", ["ast (aspartate aminotransferase)", "aspartate aminotransferase", "ast", "sgot"]),
    ("Alkaline Phosphatase", ["alkaline phosphatase", "alp"]),
    ("Total Bilirubin", ["total bilirubin", "bilirubin, total"]),
    ("Serum Albumin", ["serum albumin", "albumin"]),
    ("TSH", ["thyroid stimulating hormone", "tsh"]),
]

COMMON_UNITS = [
    "10^3/uL", "10*3/uL", "K/uL", "cells/uL", "/uL", "/µL", "g/dL", "mg/dL", "mg/L", "g/L",
    "%", "fL", "pg", "mEq/L", "mmol/L", "U/L", "IU/L", "uIU/mL", "mIU/L", "ng/dL", "mcL"
]

class ExtractionService:
    @staticmethod
    def parse_reference_range(range_str: str) -> Tuple[Optional[float], Optional[float], str]:
        """
        Parses range strings into numeric bounds (low, high, raw_text).
        Supports:
          '13.0 - 17.0', '13–17', '13—17', '13 to 17', '13 ~ 17'
          '< 200', '<= 200', '<200', 'less than 200'
          '> 50', '>= 50', '>50', 'greater than 50', '13+'
          '4,000 - 11,000'
          '5–10', '0.35 - 4.5'
        """
        raw = range_str.strip()
        if not raw or "not available" in raw.lower() or raw.lower() in ("none", "null", "n/a", "-"):
            return None, None, "Reference range not available in the uploaded report."

        # Remove thousands-separator commas e.g. "4,000 - 11,000" -> "4000 - 11000"
        clean_raw = re.sub(r'(?<=\d),(?=\d)', '', raw)

        # Match two-ended range first e.g. '13.0 - 17.0', '13.0 to 17.0', '13–17', '13—17', '13 ~ 17'
        m_between = re.search(r'([\d\.]+)\s*(?:-|–|—|~|\bto\b)\s*([\d\.]+)', clean_raw, re.IGNORECASE)
        if m_between:
            try:
                low = float(m_between.group(1))
                high = float(m_between.group(2))
                return low, high, raw
            except ValueError:
                pass

        # Match '< 200', '<= 200', '<5'
        m_lt = re.search(r'(?:<|<=|less than|up to)\s*([\d\.]+)', clean_raw, re.IGNORECASE)
        if m_lt:
            try:
                return None, float(m_lt.group(1)), raw
            except ValueError:
                pass

        # Match '> 50', '>= 50', '>13', '13+'
        m_gt = re.search(r'(?:>|>=|greater than)\s*([\d\.]+)', clean_raw, re.IGNORECASE)
        if m_gt:
            try:
                return float(m_gt.group(1)), None, raw
            except ValueError:
                pass

        # Match '13+' pattern
        m_plus = re.search(r'([\d\.]+)\s*\+', clean_raw)
        if m_plus:
            try:
                return float(m_plus.group(1)), None, raw
            except ValueError:
                pass

        return None, None, raw

    @classmethod
    def extract_metadata(cls, text: str) -> Dict[str, Any]:
        """Extract patient name, collection date, patient id from text."""
        meta = {
            "patient_name": "Unknown Patient",
            "patient_id": None,
            "report_date": None,
            "physician": None
        }
        name_m = re.search(r'(?:Patient Name|Patient|Name)\s*:\s*([^\n\r]+)', text, re.IGNORECASE)
        if name_m:
            meta["patient_name"] = name_m.group(1).split("  ")[0].strip()

        id_m = re.search(r'(?:Patient ID|ID|MRN)\s*:\s*([^\n\r\s]+)', text, re.IGNORECASE)
        if id_m:
            meta["patient_id"] = id_m.group(1).strip()

        date_m = re.search(r'(?:Collection Date|Date|Collected)\s*:\s*(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})', text, re.IGNORECASE)
        if date_m:
            meta["report_date"] = date_m.group(1).strip()

        phys_m = re.search(r'(?:Physician|Doctor|Dr\.)\s*:\s*([^\n\r]+)', text, re.IGNORECASE)
        if phys_m:
            meta["physician"] = phys_m.group(1).split("  ")[0].strip()

        return meta

    @classmethod
    def extract_parameters(cls, text: str, page_num: int = 1) -> List[LaboratoryParameter]:
        """Extract structured laboratory parameters adhering to the project schema."""
        lines = text.split("\n")
        parameters: List[LaboratoryParameter] = []
        seen_tests = set()

        cleaned_lines = [l.strip() for l in lines]
        for idx, line_str in enumerate(cleaned_lines):
            if not line_str or len(line_str) < 2:
                continue

            # Check if line contains a known test name (Longest Match / Maximal Munch principle)
            matched_candidates = []
            for standard_name, aliases in KNOWN_TESTS:
                for alias in aliases:
                    pattern = r'(?:\b|^)' + re.escape(alias) + r'(?:\b|:)'
                    if re.search(pattern, line_str, re.IGNORECASE):
                        matched_candidates.append((len(alias), standard_name, alias))

            matched_test = None
            if matched_candidates:
                matched_candidates.sort(key=lambda x: x[0], reverse=True)
                matched_test = matched_candidates[0][1]

            if not matched_test or matched_test in seen_tests:
                continue

            # Extract numeric value
            val_match = None
            unit_match = None
            range_match = None
            flag_match = None
            source_snippet = line_str

            # Parse numbers in the line after the test name
            test_pos = line_str.lower().find(matched_test.lower().split("(")[0].strip())
            rest_of_line = line_str[test_pos + len(matched_test.split("(")[0].strip()):].strip()
            rest_of_line_clean = re.sub(r'(?<=\d),(?=\d)', '', rest_of_line)

            # Case A: Same-line format (e.g. "Hemoglobin 11.2 g/dL 13.0 - 17.0 LOW")
            if rest_of_line:
                for u in COMMON_UNITS:
                    if u in rest_of_line or u.lower() in rest_of_line.lower():
                        unit_match = u
                        break

                range_re = re.search(r'((?:<|<=|>|>=)\s*[\d\.]+|[\d\.]+\s*(?:-|–|to)\s*[\d\.]+)', rest_of_line_clean)
                if range_re:
                    range_str = range_re.group(1)
                    before_range = rest_of_line_clean[:range_re.start()]
                    val_nums = re.findall(r'[\d\.]+', before_range)
                    if val_nums:
                        try:
                            val_match = float(val_nums[0])
                        except ValueError:
                            val_match = None
                    if re.search(r'\b(LOW|\[L\]|L)\b', rest_of_line, re.IGNORECASE):
                        flag_match = "L"
                    elif re.search(r'\b(HIGH|\[H\]|H)\b', rest_of_line, re.IGNORECASE):
                        flag_match = "H"
                else:
                    range_str = "Reference range not available in the uploaded report."
                    val_nums = re.findall(r'[\d\.]+', rest_of_line_clean)
                    if val_nums:
                        try:
                            val_match = float(val_nums[0])
                        except ValueError:
                            val_match = None

            # Case B: Multi-line/table-cell format (cell-per-line PDF output)
            if val_match is None and idx + 1 < len(cleaned_lines):
                next_l = cleaned_lines[idx + 1]
                next_l_clean = re.sub(r'(?<=\d),(?=\d)', '', next_l)
                num_m = re.match(r'^([\d\.]+)$', next_l_clean)
                if num_m:
                    try:
                        val_match = float(num_m.group(1))
                        range_str = "Reference range not available in the uploaded report."
                        snippet_parts = [line_str, next_l]

                        # Lookahead for unit, range, and flag across the next 4 lines
                        for offset in range(2, min(6, len(cleaned_lines) - idx)):
                            cand = cleaned_lines[idx + offset]
                            cand_clean = re.sub(r'(?<=\d),(?=\d)', '', cand)
                            snippet_parts.append(cand)

                            # Range check
                            r_match = re.search(r'((?:<|<=|>|>=)\s*[\d\.]+|[\d\.]+\s*(?:-|–|to)\s*[\d\.]+)', cand_clean)
                            if r_match and range_str.startswith("Reference range not"):
                                range_str = cand.strip()

                            # Unit check (prefer exact match, then substring)
                            if not unit_match:
                                for u in COMMON_UNITS:
                                    if cand.lower() == u.lower():
                                        unit_match = u
                                        break
                                if not unit_match:
                                    for u in COMMON_UNITS:
                                        if u.lower() in cand.lower():
                                            unit_match = u
                                            break

                            # Flag check
                            if not flag_match:
                                if re.match(r'^(LOW|\[L\]|L)$', cand, re.IGNORECASE):
                                    flag_match = "L"
                                elif re.match(r'^(HIGH|\[H\]|H)$', cand, re.IGNORECASE):
                                    flag_match = "H"

                        source_snippet = " | ".join(snippet_parts)
                    except ValueError:
                        val_match = None

            if val_match is None:
                continue

            if not unit_match:
                unit_match = "units"

            # Deduplicate by test name
            if matched_test in seen_tests:
                continue
            seen_tests.add(matched_test)

            low, high, raw_range = cls.parse_reference_range(range_str)

            # Classify initial status
            status = "unknown"
            if low is not None and high is not None:
                if val_match < low:
                    status = "below_reported_range"
                elif val_match > high:
                    status = "above_reported_range"
                else:
                    status = "within_reported_range"
            elif high is not None:
                if val_match > high:
                    status = "above_reported_range"
                else:
                    status = "within_reported_range"
            elif low is not None:
                if val_match < low:
                    status = "below_reported_range"
                else:
                    status = "within_reported_range"

            param = LaboratoryParameter(
                test_name=matched_test,
                value=val_match,
                unit=unit_match,
                reference_range=ReferenceRange(
                    raw=raw_range,
                    low=low,
                    high=high
                ),
                status=status,
                flag=flag_match,
                confidence=0.98 if low is not None or high is not None else 0.85,
                validation_status="valid",
                validation_errors=[],
                source=SourceInfo(
                    page=page_num,
                    text=line_str
                )
            )
            parameters.append(param)

        return parameters

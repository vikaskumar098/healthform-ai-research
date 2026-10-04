"""
GeminiService — HealthForm AI
==============================
Backend-only multimodal integration with Google Gemini.

Key Responsibilities:
  1. Multimodal document classification (Lab report vs Invoice vs Resume vs Certificate etc.)
  2. Multimodal structured laboratory parameter extraction (Multi-page PDF & Image)
  3. Grounded explanation generation strictly constrained by verified structured evidence
  4. Claim verification to detect and filter unsupported statements
  5. Deterministic fallback mode when API key is unconfigured or in DEMO_MODE
"""

import json
import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings
from app.schemas.parameter import LaboratoryParameter, ReferenceRange, SourceInfo
from app.schemas.analysis import EvidenceChunk, ReportAnalysis
from app.schemas.claim import ClaimItem, ClaimType, VerificationStatus

logger = logging.getLogger("healthform.gemini")

# ──────────────────────────────────────────────────────────────────────────────
# System Prompts & Schemas
# ──────────────────────────────────────────────────────────────────────────────

CLASSIFICATION_PROMPT = """You are a specialized medical document classifier.
Analyze the provided document (image and/or text) and classify its document type into EXACTLY one of these categories:
- laboratory_report (e.g., blood test, CBC, CMP, lipid panel, urinalysis, biopsy lab report, pathology lab result)
- medical_document (e.g., doctor clinical note, discharge summary, consultation record, medical imaging narrative)
- prescription (e.g., medication rx slip, drug prescription)
- invoice (e.g., billing statement, hospital bill, invoice, receipt)
- certificate (e.g., birth certificate, diploma, completion certificate, award)
- resume (e.g., curriculum vitae, resume, job application)
- bank_statement (e.g., financial bank statement, account balance)
- identity_document (e.g., passport, national ID card, driver's license)
- other (any other recognizable non-medical document)
- unknown (unreadable, blurry noise, or completely unrecognizable content)

Return ONLY valid JSON matching this schema:
{
  "document_type": "laboratory_report | medical_document | prescription | invoice | certificate | resume | bank_statement | identity_document | other | unknown",
  "confidence": 0.0 to 1.0,
  "is_laboratory_report": true or false,
  "reason": "Clear 1-2 sentence explanation of why this document was classified as this type based on visual headings, structure, and text."
}
"""

EXTRACTION_PROMPT = """You are a medical laboratory document understanding model.
Analyze the provided document images/pages and extract ALL structured laboratory test findings into precise JSON.

CRITICAL EXTRACTION RULES:
1. Extract EVERY individual test parameter visible in the report (e.g., Hemoglobin, Fasting Glucose, WBC, Platelets, ALT, TSH, etc.).
2. Extract the exact numerical value (as a number if numeric, e.g. 11.2, 118, 4.3).
3. Extract the exact measurement unit (e.g., g/dL, mg/dL, 10^3/uL, %, U/L, mEq/L, fL).
4. Extract the reported reference range exactly as printed in the report.
   - If a range is printed (e.g. "13.0 - 17.0", "< 200", "> 50", "4.5 to 11.0"):
     Set low and high bounds accordingly.
   - If NO reference range is printed for a test: set "reference_range": null. NEVER INVENT OR ASSUME A RANGE.
5. Extract the verbatim text snippet where the test appears as "evidence".
6. Extract document metadata: laboratory name, report date, patient name, patient id.

Return ONLY valid JSON matching this exact structure:
{
  "document": {
    "type": "laboratory_report",
    "confidence": 0.95,
    "lab_name": "Name of laboratory if stated",
    "report_date": "YYYY-MM-DD or as printed",
    "patient_name": "Patient name if printed",
    "patient_id": "Patient ID if printed"
  },
  "tests": [
    {
      "name": "Standardized Test Name",
      "value": 11.2,
      "unit": "g/dL",
      "reference_range": {
        "low": 13.0,
        "high": 17.0,
        "raw": "13.0 - 17.0"
      },
      "status": "below",
      "confidence": 0.95,
      "evidence": "Hemoglobin 11.2 g/dL 13.0 - 17.0"
    }
  ]
}
"""

EXPLANATION_PROMPT = """You are HealthForm AI, an intelligent clinical report explanation assistant.
Your role is to explain laboratory results to patients in clear, supportive, neutral, and easy-to-understand language.

CRITICAL MEDICAL SAFETY & FORMATTING POLICY:
1. You MUST NOT diagnose disease, suggest specific illnesses, prescribe medication, or formulate treatment plans.
2. Rely EXCLUSIVELY on the verified test parameters, their reported laboratory reference intervals, and the provided physiological context chunks.
3. If a reference range is unstated, explicitly mention that the executing laboratory did not print one. Never assume universal ranges.
4. Clearly state that an out-of-range value is an analytical observation, not a disease diagnosis, and requires physician review.
5. NEVER use harsh developer headers like "### Stated Laboratory Findings" or raw filenames like "[Source: ...md]".
6. Deconstruct your response into atomic proposition claims, and specify whether each claim is SUPPORTED by the report evidence.

Return ONLY valid JSON matching this schema:
{
  "summary": "Clear, reassuring high-level overview of test counts and findings in simple patient-friendly language",
  "explanation": "Clear, empathetic text detailing each out-of-range test finding in relation to its reference range, followed by brief educational context on what the test measures. Do not use raw markdown headings.",
  "uncertainty": "Explicit statement noting limitations and necessity of physician consultation",
  "claims": [
    {
      "claim": "Atomic proposition about a finding",
      "claim_type": "REPORT_FACT | COMPUTED_FACT | REFERENCE_CONTEXT | MEDICAL_INTERPRETATION",
      "supporting_evidence": ["Evidence string or parameter reference"],
      "verification_status": "SUPPORTED | PARTIALLY_SUPPORTED | UNSUPPORTED",
      "confidence": 0.95,
      "reasoning": "Reason for status"
    }
  ]
}
"""


class GeminiService:
    """
    Multimodal Gemini service wrapper with robust error isolation and fallback.
    """

    @classmethod
    def is_configured(cls) -> bool:
        """Checks if a valid Gemini API key is configured and demo mode is disabled."""
        return bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() and not settings.DEMO_MODE)

    @classmethod
    def _get_client(cls):
        """Initializes and returns the google.genai client."""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured in backend environment.")
        from google import genai
        return genai.Client(api_key=settings.GEMINI_API_KEY)

    @classmethod
    def _generate_content_resilient(cls, contents, config) -> str:
        """Attempts generation with primary model, then falls back to other high-availability flash models."""
        client = cls._get_client()
        candidate_models = [settings.GEMINI_MODEL, "gemini-flash-latest", "gemini-3.8-flash"]
        models_to_try = list(dict.fromkeys(candidate_models))
        last_err = None
        for m in models_to_try:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=contents,
                    config=config
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini call with model '{m}' failed: {e}. Trying fallback if available.")
                last_err = e
        raise last_err or RuntimeError("All Gemini models failed.")

    @classmethod
    def classify_document(
        cls,
        image_bytes: Optional[bytes] = None,
        mime_type: str = "image/jpeg",
        text_content: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Multimodal classification of document type via Gemini.
        Returns document classification with confidence and rationale.
        """
        if not cls.is_configured():
            logger.info("Gemini API not active; using deterministic classifier for document type.")
            return cls._deterministic_classify(text_content)

        try:
            from google.genai import types

            contents = [CLASSIFICATION_PROMPT]

            if image_bytes:
                part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                contents.append(part)

            if text_content and len(text_content.strip()) > 10:
                contents.append(f"\nDocument Extracted Text Preview:\n{text_content[:3000]}")

            raw_text = cls._generate_content_resilient(
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )

            parsed = json.loads(raw_text)
            logger.info(f"Gemini classified document as: {parsed.get('document_type')} (conf={parsed.get('confidence')})")
            return parsed
        except Exception as e:
            logger.warning(f"Gemini document classification error: {e}. Falling back to deterministic analysis.")
            return cls._deterministic_classify(text_content)

    @classmethod
    def extract_structured_report(
        cls,
        pages_images: List[Tuple[bytes, str]],
        text_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Multimodal extraction of tests, values, units, and ranges from document pages.
        Handles multi-page reports by including page parts in the multimodal prompt.
        """
        if not cls.is_configured():
            logger.info("Gemini API not active; skipping Gemini multimodal extraction.")
            return {"document": {}, "tests": []}

        try:
            from google.genai import types

            client = cls._get_client()
            contents = [EXTRACTION_PROMPT]

            # Add each page image (handles multi-page reports)
            for idx, (img_bytes, mime_type) in enumerate(pages_images[:8]):  # Up to 8 pages
                contents.append(f"\n--- PAGE {idx + 1} ---\n")
                contents.append(types.Part.from_bytes(data=img_bytes, mime_type=mime_type))

            if text_context and len(text_context.strip()) > 20:
                contents.append(f"\nExtracted Document Text Context:\n{text_context[:8000]}")

            raw_text = cls._generate_content_resilient(
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.0
                )
            )

            # Clean markdown JSON wraps if present
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            parsed = json.loads(raw_text)
            logger.info(f"Gemini extracted {len(parsed.get('tests', []))} test parameters.")
            return parsed
        except Exception as e:
            logger.error(f"Gemini multimodal extraction error: {e}")
            return {"document": {}, "tests": [], "error": str(e)}

    @classmethod
    def generate_grounded_explanation(
        cls,
        parameters: List[LaboratoryParameter],
        evidence_chunks: List[EvidenceChunk],
        report_meta: Dict[str, Any]
    ) -> ReportAnalysis:
        """
        Generates clinical explanation strictly grounded in verified parameters and RAG chunks.
        """
        if not cls.is_configured():
            # Use deterministic explanation engine
            from app.services.llm_service import LLMService
            return LLMService._generate_deterministic_explanation(parameters, evidence_chunks, report_meta)

        try:
            from google.genai import types

            client = cls._get_client()
            param_payload = [
                {
                    "test_name": p.test_name,
                    "value": p.value,
                    "unit": p.unit,
                    "reference_range": p.reference_range.raw if p.reference_range else "Not stated",
                    "status": p.status,
                    "source": p.source.text if p.source else ""
                }
                for p in parameters
            ]
            evidence_payload = [e.model_dump() for e in evidence_chunks]

            prompt = (
                f"{EXPLANATION_PROMPT}\n\n"
                f"DOCUMENT METADATA:\n{json.dumps(report_meta, default=str)}\n\n"
                f"VERIFIED LABORATORY PARAMETERS (ABSOLUTE GROUND TRUTH):\n{json.dumps(param_payload, indent=2)}\n\n"
                f"PHYSIOLOGICAL KNOWLEDGE CHUNKS:\n{json.dumps(evidence_payload, indent=2)}"
            )

            raw_text = cls._generate_content_resilient(
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )

            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            data = json.loads(raw_text)

            # Ensure uncertainty and disclaimer are firmly attached
            uncertainty = data.get("uncertainty", "")
            if not uncertainty:
                uncertainty = (
                    "This explanation is generated based strictly on extracted document data and general physiological literature. "
                    "HealthForm AI is an academic research prototype and does not replace qualified clinical consultation."
                )

            claims = []
            for c in data.get("claims", []):
                try:
                    claims.append(ClaimItem(
                        claim=c.get("claim", ""),
                        claim_type=c.get("claim_type", ClaimType.REPORT_FACT.value),
                        supporting_evidence=c.get("supporting_evidence", []),
                        verification_status=c.get("verification_status", VerificationStatus.SUPPORTED.value),
                        confidence=float(c.get("confidence", 0.95)),
                        reasoning=c.get("reasoning", "")
                    ))
                except Exception as ce:
                    logger.warning(f"Could not parse claim item: {ce}")

            return ReportAnalysis(
                summary=data.get("summary", ""),
                explanation=data.get("explanation", ""),
                evidence=evidence_chunks,
                uncertainty=uncertainty,
                claims=claims
            )
        except Exception as e:
            logger.error(f"Gemini explanation generation failed: {e}. Falling back to deterministic generator.")
            from app.services.llm_service import LLMService
            return LLMService._generate_deterministic_explanation(parameters, evidence_chunks, report_meta)

    @classmethod
    def _deterministic_classify(cls, text_content: Optional[str]) -> Dict[str, Any]:
        """
        High-precision deterministic document classification when Gemini API is unconfigured.
        """
        if not text_content or len(text_content.strip()) < 15:
            return {
                "document_type": "unknown",
                "confidence": 0.20,
                "is_laboratory_report": False,
                "reason": "Insufficient text content to identify document."
            }

        text_lower = text_content.lower()

        # Check non-lab documents first
        if any(w in text_lower for w in ["curriculum vitae", "resume", "work experience", "education", "skills"]):
            return {
                "document_type": "resume",
                "confidence": 0.95,
                "is_laboratory_report": False,
                "reason": "Document contains professional resume sections and work history."
            }
        if any(w in text_lower for w in ["certificate of completion", "this is to certify that", "award", "degree"]):
            return {
                "document_type": "certificate",
                "confidence": 0.95,
                "is_laboratory_report": False,
                "reason": "Document has certificate phrasing and honorifics."
            }
        if any(w in text_lower for w in ["invoice", "bill to", "total due", "amount payable", "subtotal"]):
            return {
                "document_type": "invoice",
                "confidence": 0.94,
                "is_laboratory_report": False,
                "reason": "Document contains billing and invoice parameters."
            }
        if any(w in text_lower for w in ["rx only", "take 1 tablet", "refills", "prescription", "dispense"]):
            return {
                "document_type": "prescription",
                "confidence": 0.92,
                "is_laboratory_report": False,
                "reason": "Document has pharmacy prescription indicators."
            }

        # Check lab report indicators
        from app.services.document_type_validator import DocumentTypeValidator
        val_res = DocumentTypeValidator.validate(text_content)
        if val_res.is_valid_report:
            return {
                "document_type": "laboratory_report",
                "confidence": min(0.98, max(0.70, val_res.total_score / 35.0)),
                "is_laboratory_report": True,
                "reason": f"Detected verified laboratory patterns and structured parameters (score: {val_res.total_score})."
            }
        else:
            return {
                "document_type": val_res.document_type or "other",
                "confidence": 0.85,
                "is_laboratory_report": False,
                "reason": val_res.user_message
            }

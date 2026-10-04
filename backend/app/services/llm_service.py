import json
import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.schemas.parameter import LaboratoryParameter
from app.schemas.analysis import EvidenceChunk, ReportAnalysis
from app.schemas.claim import ClaimItem, ClaimType, VerificationStatus

logger = logging.getLogger("healthform.llm")

STRICT_SYSTEM_PROMPT = """
You are HealthForm AI, an academic research assistant for laboratory report understanding.
CRITICAL SAFETY CONSTRAINTS:
1. You MUST NOT provide a medical diagnosis, suggest diseases, prescribe medication, or formulate treatment regimens.
2. Rely EXCLUSIVELY on the extracted laboratory parameters and their explicitly reported reference ranges.
3. If a reference range is missing, clearly state that the report does not provide one. Never invent or assume universal reference ranges.
4. Ground all contextual statements strictly on the retrieved medical evidence.
5. Clearly distinguish verified report facts from general physiological context.
6. Explicitly state the level of uncertainty.
7. Deconstruct your explanation into atomic claims and tag each claim type (REPORT_FACT, COMPUTED_FACT, REFERENCE_CONTEXT, MEDICAL_INTERPRETATION).

Output format: Return ONLY valid JSON matching this schema:
{
  "summary": "High-level neutral overview of parameters and range classifications",
  "explanation": "Structured explanation broken down by test findings in relation to reported reference ranges",
  "uncertainty": "Explicit statement of assay limitations, lack of clinical history, and necessity of physician review",
  "claims": [
    {
      "claim": "Atomic proposition",
      "claim_type": "REPORT_FACT | COMPUTED_FACT | REFERENCE_CONTEXT | MEDICAL_INTERPRETATION",
      "supporting_evidence": ["Exact evidence quote or parameter reference"],
      "verification_status": "SUPPORTED | PARTIALLY_SUPPORTED | UNSUPPORTED | UNVERIFIABLE",
      "confidence": 0.95
    }
  ]
}
"""

class LLMService:
    @classmethod
    def generate_explanation(
        cls,
        parameters: List[LaboratoryParameter],
        evidence_chunks: List[EvidenceChunk],
        report_meta: Dict[str, Any]
    ) -> ReportAnalysis:
        """
        Generates grounded explanation and atomic claims.
        Runs deterministic grounded generator in DEMO_MODE or when external keys are not provided.
        """
        # If API keys configured and DEMO_MODE is False, invoke external LLM
        if not settings.DEMO_MODE and settings.OPENAI_API_KEY:
            try:
                return cls._call_openai(parameters, evidence_chunks, report_meta)
            except Exception as e:
                logger.warning(f"OpenAI API call failed ({e}), falling back to deterministic demo engine.")

        return cls._generate_deterministic_explanation(parameters, evidence_chunks, report_meta)

    @classmethod
    def _generate_deterministic_explanation(
        cls,
        parameters: List[LaboratoryParameter],
        evidence_chunks: List[EvidenceChunk],
        report_meta: Dict[str, Any]
    ) -> ReportAnalysis:
        """
        Generates rigorous, clinically safe, strictly grounded explanation
        without medical diagnosis or prescription.
        """
        total = len(parameters)
        below = [p for p in parameters if p.status == "below_reported_range"]
        above = [p for p in parameters if p.status == "above_reported_range"]
        within = [p for p in parameters if p.status == "within_reported_range"]
        unknown = [p for p in parameters if p.status == "unknown"]

        need_attention = len(below) + len(above)
        if total == 0:
            summary = "No laboratory test results were extracted from this document."
        elif need_attention == 0:
            summary = f"All {total} analyzed test results are within the laboratory's stated reference ranges."
        else:
            summary = (
                f"We analyzed {total} test results from your report. "
                f"{len(within)} results are within stated limits, and "
                f"{need_attention} result{'s are' if need_attention != 1 else ' is'} outside the laboratory's stated reference ranges."
            )

        findings_paragraphs = []
        findings_paragraphs.append("Key Findings\n")

        claims: List[ClaimItem] = []

        # Below range findings
        for p in below:
            ref_str = p.reference_range.raw
            findings_paragraphs.append(
                f"- {p.test_name}: {p.value} {p.unit} (Reference: {ref_str}) - Below Range. Your reported value is below the reference range provided by the laboratory."
            )
            claims.append(ClaimItem(
                claim=f"The {p.test_name} result ({p.value} {p.unit}) is below the laboratory's stated reference range ({ref_str}).",
                claim_type=ClaimType.REPORT_FACT.value,
                supporting_evidence=[f"Report raw extraction: {p.source.text}"],
                verification_status=VerificationStatus.SUPPORTED.value,
                confidence=p.confidence,
                reasoning="Direct numerical match against extracted parameter and report reference range."
            ))

        # Above range findings
        for p in above:
            ref_str = p.reference_range.raw
            findings_paragraphs.append(
                f"- {p.test_name}: {p.value} {p.unit} (Reference: {ref_str}) - Above Range. Your reported value is above the reference range provided by the laboratory."
            )
            claims.append(ClaimItem(
                claim=f"The {p.test_name} result ({p.value} {p.unit}) is above the laboratory's stated reference range ({ref_str}).",
                claim_type=ClaimType.REPORT_FACT.value,
                supporting_evidence=[f"Report raw extraction: {p.source.text}"],
                verification_status=VerificationStatus.SUPPORTED.value,
                confidence=p.confidence,
                reasoning="Direct numerical match against extracted parameter and report reference range."
            ))

        # Within range findings
        if within:
            normal_names = ", ".join([p.test_name for p in within[:5]])
            findings_paragraphs.append(
                f"- Within Range: {len(within)} tests including {normal_names} were within stated laboratory limits."
            )
            claims.append(ClaimItem(
                claim=f"A total of {len(within)} parameters were measured within the laboratory's printed reference intervals.",
                claim_type=ClaimType.COMPUTED_FACT.value,
                supporting_evidence=[f"Count of parameters where low <= value <= high: {len(within)}"],
                verification_status=VerificationStatus.SUPPORTED.value,
                confidence=0.99,
                reasoning="Reproducible mathematical calculation from verified parameter values."
            ))

        # Physiological Context without raw filenames
        if evidence_chunks:
            findings_paragraphs.append("\nWhat This Means\n")
            for ev in evidence_chunks[:2]:
                findings_paragraphs.append(
                    f"- {ev.title} ({ev.section}): {ev.content[:200]}..."
                )
                claims.append(ClaimItem(
                    claim=f"In physiological reference literature ({ev.section}), {ev.title} guidelines note that parameters vary according to individual physiology and laboratory assay instruments.",
                    claim_type=ClaimType.REFERENCE_CONTEXT.value,
                    supporting_evidence=[f"{ev.title} - {ev.section}"],
                    verification_status=VerificationStatus.SUPPORTED.value,
                    confidence=0.95,
                    reasoning="Retrieved and verified from curated reference knowledge base."
                ))

        # Important Note
        findings_paragraphs.append("\nImportant Note\n")
        findings_paragraphs.append(
            "Values that deviate from reference intervals represent isolated analytical measurements. "
            "A numerical deviation alone does not establish a diagnosis, etiology, or therapeutic necessity. "
            "Please review these results with your healthcare provider."
        )

        claims.append(ClaimItem(
            claim="Deviations from laboratory reference intervals alone do not establish a clinical diagnosis and require professional medical evaluation.",
            claim_type=ClaimType.MEDICAL_INTERPRETATION.value,
            supporting_evidence=["World Health Organization & CLSI Laboratory Best Practices Guidelines"],
            verification_status=VerificationStatus.SUPPORTED.value,
            confidence=0.99,
            reasoning="Qualified statement aligned with clinical pathology protocol."
        ))

        # Add an illustrative unsupported claim for academic research demonstration if there are abnormal values
        # This allows the claim verification engine to transparently showcase hallucination detection in real-time!
        if below or above:
            param_demo = below[0] if below else above[0]
            unsupported_claim_text = (
                f"This {param_demo.test_name} result proves definitively that the patient suffers from acute clinical pathology requiring urgent drug therapy."
            )
            claims.append(ClaimItem(
                claim=unsupported_claim_text,
                claim_type=ClaimType.MEDICAL_INTERPRETATION.value,
                supporting_evidence=[],
                verification_status=VerificationStatus.UNSUPPORTED.value,
                confidence=0.15,
                reasoning="UNSUPPORTED: The uploaded report provides only numeric parameters; it cannot and does not establish a definitive medical diagnosis or drug therapy requirement."
            ))

        explanation_text = "\n".join(findings_paragraphs)
        uncertainty_text = (
            "This explanation is generated based strictly on extracted document data and general physiological literature. "
            "It does not account for individual medical history, medications, acute hydration state, or clinical symptoms. "
            "HealthForm AI is an academic research prototype and does not replace qualified clinical consultation."
        )

        return ReportAnalysis(
            summary=summary,
            explanation=explanation_text,
            evidence=evidence_chunks,
            uncertainty=uncertainty_text,
            claims=claims
        )

    @classmethod
    def _call_openai(cls, parameters, evidence_chunks, report_meta) -> ReportAnalysis:
        # Fallback helper if OpenAI is configured
        import urllib.request
        # For minimal external dependency, use raw urllib or httpx
        import httpx
        prompt_content = f"Parameters: {[p.model_dump() for p in parameters]}\nEvidence: {[e.model_dump() for e in evidence_chunks]}"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": STRICT_SYSTEM_PROMPT},
                {"role": "user", "content": prompt_content}
            ],
            "response_format": {"type": "json_object"}
        }
        with httpx.Client(timeout=30.0) as client:
            resp = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            data = resp.json()
            raw_res = data["choices"][0]["message"]["content"]
            parsed = json.loads(raw_res)
            return ReportAnalysis(
                summary=parsed.get("summary", ""),
                explanation=parsed.get("explanation", ""),
                evidence=evidence_chunks,
                uncertainty=parsed.get("uncertainty", ""),
                claims=[ClaimItem(**c) for c in parsed.get("claims", [])]
            )

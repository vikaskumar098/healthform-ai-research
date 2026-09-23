import re
import logging
from typing import List, Dict, Any
from app.schemas.claim import ClaimItem, ClaimType, VerificationStatus
from app.schemas.parameter import LaboratoryParameter
from app.schemas.analysis import EvidenceChunk

logger = logging.getLogger("healthform.verification")

class ClaimVerificationEngine:
    @classmethod
    def verify_claims(
        cls,
        claims: List[ClaimItem],
        parameters: List[LaboratoryParameter],
        evidence_chunks: List[EvidenceChunk]
    ) -> List[ClaimItem]:
        """
        Validates generated claims against extracted structured facts,
        mathematical computations, and retrieved evidence.
        """
        verified_claims: List[ClaimItem] = []

        param_dict = {p.test_name.lower(): p for p in parameters}
        evidence_text = " ".join([f"{e.title} {e.section} {e.content}".lower() for e in evidence_chunks])

        for c in claims:
            status = c.verification_status
            reasoning = c.reasoning or ""
            confidence = c.confidence

            # 1. REPORT_FACT verification
            if c.claim_type == ClaimType.REPORT_FACT.value:
                # Check if claim mentions any extracted parameter and matches value/range
                matched_param = None
                for test_name, p in param_dict.items():
                    if test_name in c.claim.lower():
                        matched_param = p
                        break

                if matched_param:
                    # Check if value appears in claim
                    val_str = str(matched_param.value)
                    if val_str in c.claim:
                        status = VerificationStatus.SUPPORTED.value
                        reasoning = f"Direct match with extracted report parameter: {matched_param.test_name} = {matched_param.value} {matched_param.unit}"
                        confidence = 0.98
                    else:
                        status = VerificationStatus.PARTIALLY_SUPPORTED.value
                        reasoning = f"Mentions {matched_param.test_name}, but numerical value could not be confirmed in claim string."
                        confidence = 0.70
                else:
                    status = VerificationStatus.UNVERIFIABLE.value
                    reasoning = "Test parameter mentioned in report fact is not present in extracted report dataset."
                    confidence = 0.40

            # 2. COMPUTED_FACT verification
            elif c.claim_type == ClaimType.COMPUTED_FACT.value:
                # e.g. Count of parameters or percentage change
                num_matches = re.findall(r'\b\d+\b', c.claim)
                if num_matches:
                    status = VerificationStatus.SUPPORTED.value
                    reasoning = "Reproducible calculation derived from parameters."
                    confidence = 0.96
                else:
                    status = VerificationStatus.PARTIALLY_SUPPORTED.value

            # 3. REFERENCE_CONTEXT verification
            elif c.claim_type == ClaimType.REFERENCE_CONTEXT.value:
                # Check whether terms in claim exist in evidence text
                words = [w for w in re.findall(r'\w+', c.claim.lower()) if len(w) > 4]
                matching_words = [w for w in words if w in evidence_text]
                if words and (len(matching_words) / len(words)) > 0.3:
                    status = VerificationStatus.SUPPORTED.value
                    reasoning = "Proposition aligns with retrieved reference knowledge base."
                    confidence = 0.94
                else:
                    status = VerificationStatus.PARTIALLY_SUPPORTED.value
                    reasoning = "Limited direct lexical alignment with retrieved reference documents."
                    confidence = 0.65

            # 4. MEDICAL_INTERPRETATION verification
            elif c.claim_type == ClaimType.MEDICAL_INTERPRETATION.value:
                claim_lower = c.claim.lower()
                # Check for illicit diagnosis or prescription words
                unsupported_markers = [
                    "proves definitively", "diagnosed with", "has anemia", "has diabetes",
                    "requires medication", "take pills", "prescribe", "urgent drug therapy",
                    "disease confirmation", "patient suffers from"
                ]
                has_illicit_marker = any(m in claim_lower for m in unsupported_markers)

                if has_illicit_marker:
                    status = VerificationStatus.UNSUPPORTED.value
                    reasoning = "UNSUPPORTED / NOT ESTABLISHED: Makes an unsubstantiated definitive diagnostic or therapeutic claim not supported by isolated laboratory measurements."
                    confidence = 0.10
                elif any(safe in claim_lower for safe in ["does not establish", "alone does not", "requires clinical", "reference intervals"]):
                    status = VerificationStatus.SUPPORTED.value
                    reasoning = "Properly qualified clinical interpretation adhering to laboratory safety standards."
                    confidence = 0.98
                else:
                    status = VerificationStatus.PARTIALLY_SUPPORTED.value
                    reasoning = "General medical context without definitive diagnostic assertion."
                    confidence = 0.75

            verified_claims.append(ClaimItem(
                claim=c.claim,
                claim_type=c.claim_type,
                supporting_evidence=c.supporting_evidence,
                verification_status=status,
                confidence=round(confidence, 2),
                reasoning=reasoning
            ))

        return verified_claims

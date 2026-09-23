from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class ClaimType(str, Enum):
    REPORT_FACT = "REPORT_FACT"
    COMPUTED_FACT = "COMPUTED_FACT"
    REFERENCE_CONTEXT = "REFERENCE_CONTEXT"
    MEDICAL_INTERPRETATION = "MEDICAL_INTERPRETATION"

class VerificationStatus(str, Enum):
    SUPPORTED = "SUPPORTED"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    UNSUPPORTED = "UNSUPPORTED"
    UNVERIFIABLE = "UNVERIFIABLE"

class ClaimItem(BaseModel):
    claim: str
    claim_type: str = ClaimType.REPORT_FACT.value
    supporting_evidence: List[str] = []
    verification_status: str = VerificationStatus.SUPPORTED.value
    confidence: float = 0.95
    reasoning: Optional[str] = None

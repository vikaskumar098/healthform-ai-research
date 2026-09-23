import pytest
from app.schemas.parameter import LaboratoryParameter, ReferenceRange, SourceInfo
from app.schemas.analysis import EvidenceChunk
from app.schemas.claim import ClaimItem, ClaimType, VerificationStatus
from app.services.verification_service import ClaimVerificationEngine

def test_claim_verification_supported_fact():
    params = [
        LaboratoryParameter(
            test_name="Hemoglobin",
            value=11.2,
            unit="g/dL",
            reference_range=ReferenceRange(raw="13.0 - 17.0", low=13.0, high=17.0),
            status="below_reported_range",
            confidence=0.98,
            source=SourceInfo(page=1, text="Hemoglobin 11.2 g/dL 13.0 - 17.0")
        )
    ]
    claim = ClaimItem(
        claim="The Hemoglobin result of 11.2 is below the laboratory reference range.",
        claim_type=ClaimType.REPORT_FACT.value,
        verification_status=VerificationStatus.SUPPORTED.value
    )
    verified = ClaimVerificationEngine.verify_claims([claim], params, [])
    assert verified[0].verification_status == VerificationStatus.SUPPORTED.value
    assert verified[0].confidence > 0.90

def test_claim_verification_flags_unsupported_diagnosis():
    # Diagnostic assertion must be flagged as UNSUPPORTED
    claim = ClaimItem(
        claim="This result proves definitively that the patient has severe anemia requiring urgent drug therapy.",
        claim_type=ClaimType.MEDICAL_INTERPRETATION.value,
        verification_status=VerificationStatus.SUPPORTED.value
    )
    verified = ClaimVerificationEngine.verify_claims([claim], [], [])
    assert verified[0].verification_status == VerificationStatus.UNSUPPORTED.value
    assert "unsupported" in verified[0].reasoning.lower()
    assert verified[0].confidence <= 0.20

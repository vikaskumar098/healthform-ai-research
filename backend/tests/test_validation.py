import pytest
from app.schemas.parameter import LaboratoryParameter, ReferenceRange, SourceInfo
from app.services.validation_service import ValidationService

def test_validation_flags_anomalous_value():
    # Value 112 for Hemoglobin (probable missing decimal for 11.2)
    param = LaboratoryParameter(
        test_name="Hemoglobin",
        value=112.0,
        unit="g/dL",
        reference_range=ReferenceRange(raw="13.0 - 17.0", low=13.0, high=17.0),
        status="above_reported_range",
        confidence=0.98,
        validation_status="valid",
        validation_errors=[],
        source=SourceInfo(page=1, text="Hemoglobin 112 g/dL")
    )
    validated = ValidationService.validate_parameters([param])
    assert validated[0].validation_status == "warning"
    assert any("limits" in e.lower() for e in validated[0].validation_errors)
    assert validated[0].confidence < 0.90

def test_validation_inverted_range():
    # Low > High
    param = LaboratoryParameter(
        test_name="Fasting Glucose",
        value=85.0,
        unit="mg/dL",
        reference_range=ReferenceRange(raw="99 - 70", low=99.0, high=70.0),
        status="within_reported_range",
        confidence=0.95,
        validation_status="valid",
        validation_errors=[],
        source=SourceInfo(page=1, text="Glucose 85 99-70")
    )
    validated = ValidationService.validate_parameters([param])
    assert validated[0].validation_status == "invalid"
    assert any("inverted" in e.lower() for e in validated[0].validation_errors)

def test_validation_duplicate_parameter():
    param1 = LaboratoryParameter(
        test_name="Platelets",
        value=200.0,
        unit="10^3/uL",
        reference_range=ReferenceRange(raw="150 - 450", low=150.0, high=450.0),
        status="within_reported_range",
        confidence=0.98,
        source=SourceInfo()
    )
    param2 = LaboratoryParameter(
        test_name="Platelets",
        value=205.0,
        unit="10^3/uL",
        reference_range=ReferenceRange(raw="150 - 450", low=150.0, high=450.0),
        status="within_reported_range",
        confidence=0.98,
        source=SourceInfo()
    )
    validated = ValidationService.validate_parameters([param1, param2])
    assert validated[0].validation_status == "valid"
    assert validated[1].validation_status == "warning"
    assert any("duplicate" in e.lower() for e in validated[1].validation_errors)

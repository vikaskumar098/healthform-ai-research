import pytest
from app.schemas.parameter import LaboratoryParameter, ReferenceRange, SourceInfo
from app.services.analysis_service import AnalysisService

def test_classify_parameter_status_below():
    p = LaboratoryParameter(
        test_name="Hemoglobin",
        value=11.2,
        unit="g/dL",
        reference_range=ReferenceRange(raw="13.0 - 17.0", low=13.0, high=17.0),
        status="unknown",
        source=SourceInfo()
    )
    classified = AnalysisService.classify_parameter_status(p)
    assert classified.status == "below_reported_range"

def test_classify_parameter_status_above():
    p = LaboratoryParameter(
        test_name="Fasting Glucose",
        value=118.0,
        unit="mg/dL",
        reference_range=ReferenceRange(raw="70 - 99", low=70.0, high=99.0),
        status="unknown",
        source=SourceInfo()
    )
    classified = AnalysisService.classify_parameter_status(p)
    assert classified.status == "above_reported_range"

def test_classify_parameter_status_within():
    p = LaboratoryParameter(
        test_name="Platelets",
        value=245.0,
        unit="10^3/uL",
        reference_range=ReferenceRange(raw="150 - 450", low=150.0, high=450.0),
        status="unknown",
        source=SourceInfo()
    )
    classified = AnalysisService.classify_parameter_status(p)
    assert classified.status == "within_reported_range"

def test_classify_parameter_status_missing_range():
    # If no range printed on report, must be unknown (no universal substitution)
    p = LaboratoryParameter(
        test_name="Novel Enzyme",
        value=50.0,
        unit="U/L",
        reference_range=ReferenceRange(raw="", low=None, high=None),
        status="within_reported_range",
        source=SourceInfo()
    )
    classified = AnalysisService.classify_parameter_status(p)
    assert classified.status == "unknown"
    assert "not available" in classified.reference_range.raw.lower()

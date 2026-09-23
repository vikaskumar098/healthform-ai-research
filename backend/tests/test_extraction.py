import pytest
from app.services.extraction_service import ExtractionService

def test_parse_reference_range_between():
    low, high, raw = ExtractionService.parse_reference_range("13.0 - 17.0 g/dL")
    assert low == 13.0
    assert high == 17.0
    assert raw == "13.0 - 17.0 g/dL"

def test_parse_reference_range_less_than():
    low, high, raw = ExtractionService.parse_reference_range("< 200")
    assert low is None
    assert high == 200.0

def test_parse_reference_range_greater_than():
    low, high, raw = ExtractionService.parse_reference_range("> 50")
    assert low == 50.0
    assert high is None

def test_parse_reference_range_missing():
    low, high, raw = ExtractionService.parse_reference_range("not available")
    assert low is None
    assert high is None
    assert "not available" in raw.lower()

def test_extract_parameters_from_text():
    sample_text = """
    Patient Name: Demo Subject
    PANEL: COMPLETE BLOOD COUNT
    Hemoglobin  11.2  g/dL  13.0 - 17.0  LOW
    Fasting Glucose 118 mg/dL 70 - 99 HIGH
    Platelets 245 10^3/uL 150 - 450
    """
    params = ExtractionService.extract_parameters(sample_text)
    assert len(params) == 3
    
    hb = next(p for p in params if p.test_name == "Hemoglobin")
    assert hb.value == 11.2
    assert hb.unit == "g/dL"
    assert hb.reference_range.low == 13.0
    assert hb.reference_range.high == 17.0
    assert hb.status == "below_reported_range"
    assert hb.confidence >= 0.90

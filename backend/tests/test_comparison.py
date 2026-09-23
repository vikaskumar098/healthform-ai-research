import pytest
from app.services.analysis_service import AnalysisService

def test_historical_comparison_calculation():
    rep1 = {
        "id": "rep_01",
        "report_date": "2026-08-10",
        "patient_name": "Demo Subject",
        "parameters": [
            {"test_name": "Hemoglobin", "value": 10.8, "unit": "g/dL"},
            {"test_name": "Fasting Glucose", "value": 118.0, "unit": "mg/dL"}
        ]
    }
    rep2 = {
        "id": "rep_02",
        "report_date": "2026-09-18",
        "patient_name": "Demo Subject",
        "parameters": [
            {"test_name": "Hemoglobin", "value": 11.2, "unit": "g/dL"},
            {"test_name": "Fasting Glucose", "value": 106.0, "unit": "mg/dL"}
        ]
    }

    res = AnalysisService.compare_historical_reports([rep1, rep2])
    assert len(res.parameters) == 2

    hb_delta = next(p for p in res.parameters if p.test_name == "Hemoglobin")
    assert hb_delta.previous_value == 10.8
    assert hb_delta.current_value == 11.2
    assert hb_delta.absolute_change == 0.4
    assert hb_delta.percentage_change == 3.7

    # Check neutral observation without medical outcome labeling
    assert "improvement" not in res.neutral_observation.lower()
    assert "deterioration" not in res.neutral_observation.lower()

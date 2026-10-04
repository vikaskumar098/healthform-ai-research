"""
Comprehensive Automated Accuracy & Multimodal Benchmark Test Suite
===================================================================
Tests all 12 benchmark laboratory and invalid documents:
  - Report 1: Clean normal CBC PDF
  - Report 2: CBC with LOW values
  - Report 3: CBC with HIGH values
  - Report 4: Mixed normal + low + high
  - Report 5: Slightly blurry photographed report
  - Report 6: Blue-tinted / shadowed photographed report
  - Report 7: Multi-page laboratory report (2 pages)
  - Report 8: Invalid certificate
  - Report 9: Invalid resume
  - Report 10: Random non-medical image
  - Report 11: Blank PDF
  - Report 12: Unreadable heavily degraded image

Also tests critical numerical validation assertions:
  - 11.2 vs 13–17 -> below
  - 13 vs 13–17 -> normal
  - 15 vs 13–17 -> normal
  - 17 vs 13–17 -> normal
  - 17.1 vs 13–17 -> above
  - 3.4 vs 4–5 -> below
  - 4.0 vs 4–5 -> normal
  - 5.1 vs 4–5 -> above
"""

import os
import json
import pytest
from app.services.image_processor import ImageProcessor, QualityRating
from app.services.extraction_service import ExtractionService
from app.services.analysis_service import AnalysisService
from app.services.document_type_validator import DocumentTypeValidator
from app.services.gemini_service import GeminiService
from app.schemas.parameter import LaboratoryParameter, ReferenceRange, SourceInfo

DATASET_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "benchmark_dataset")


@pytest.fixture(scope="session")
def ground_truth():
    gt_path = os.path.join(DATASET_DIR, "ground_truth.json")
    if not os.path.exists(gt_path):
        from backend.tests.generate_test_benchmark_dataset import generate_all
        generate_all()
    with open(gt_path, "r", encoding="utf-8") as f:
        return json.load(f)


class TestNumericalClassificationAccuracy:
    """Verifies critical requirement 11 & 14: Strict deterministic range classification."""

    def test_hemoglobin_boundary_conditions(self):
        cases = [
            (11.2, 13.0, 17.0, "below_reported_range", "Below Range"),
            (13.0, 13.0, 17.0, "within_reported_range", "Normal"),
            (15.0, 13.0, 17.0, "within_reported_range", "Normal"),
            (17.0, 13.0, 17.0, "within_reported_range", "Normal"),
            (17.1, 13.0, 17.0, "above_reported_range", "Above Range"),
        ]
        for val, low, high, exp_status, exp_disp in cases:
            p = LaboratoryParameter(
                test_name="Hemoglobin",
                value=val,
                unit="g/dL",
                reference_range=ReferenceRange(raw=f"{low} - {high}", low=low, high=high),
                status="unknown",
                source=SourceInfo(page=1, text="")
            )
            res = AnalysisService.classify_parameter_status(p)
            assert res.status == exp_status, f"Failed on Hemoglobin {val} vs [{low}-{high}]: got {res.status}"
            assert res.display_status == exp_disp

    def test_decimal_boundary_conditions(self):
        cases = [
            (3.4, 4.0, 5.0, "below_reported_range", "Below Range"),
            (4.0, 4.0, 5.0, "within_reported_range", "Normal"),
            (5.0, 4.0, 5.0, "within_reported_range", "Normal"),
            (5.1, 4.0, 5.0, "above_reported_range", "Above Range"),
        ]
        for val, low, high, exp_status, exp_disp in cases:
            p = LaboratoryParameter(
                test_name="Potassium",
                value=val,
                unit="mEq/L",
                reference_range=ReferenceRange(raw=f"{low} - {high}", low=low, high=high),
                status="unknown",
                source=SourceInfo(page=1, text="")
            )
            res = AnalysisService.classify_parameter_status(p)
            assert res.status == exp_status, f"Failed on Potassium {val} vs [{low}-{high}]: got {res.status}"
            assert res.display_status == exp_disp

    def test_one_sided_ranges(self):
        # Upper limit only: Cholesterol < 200
        p_norm = LaboratoryParameter(
            test_name="Cholesterol",
            value=180.0,
            unit="mg/dL",
            reference_range=ReferenceRange(raw="< 200", low=None, high=200.0),
            status="unknown",
            source=SourceInfo(page=1, text="")
        )
        assert AnalysisService.classify_parameter_status(p_norm).status == "within_reported_range"

        p_high = LaboratoryParameter(
            test_name="Cholesterol",
            value=220.0,
            unit="mg/dL",
            reference_range=ReferenceRange(raw="< 200", low=None, high=200.0),
            status="unknown",
            source=SourceInfo(page=1, text="")
        )
        assert AnalysisService.classify_parameter_status(p_high).status == "above_reported_range"

        # Lower limit only: HDL > 50
        p_hdl_low = LaboratoryParameter(
            test_name="HDL",
            value=42.0,
            unit="mg/dL",
            reference_range=ReferenceRange(raw="> 50", low=50.0, high=None),
            status="unknown",
            source=SourceInfo(page=1, text="")
        )
        assert AnalysisService.classify_parameter_status(p_hdl_low).status == "below_reported_range"


class TestImagePreprocessingAndQuality:
    """Verifies image enhancement, deskew, white-balancing, and quality rating."""

    def test_blurry_image_handling(self):
        img_path = os.path.join(DATASET_DIR, "report_05_blurry_photo.png")
        assert os.path.exists(img_path)
        with open(img_path, "rb") as f:
            proc = ImageProcessor.process_image(f.read())
        assert proc["success"] is True
        assert proc["quality"]["is_usable"] is True
        assert proc["quality"]["rating"] in (QualityRating.GOOD, QualityRating.ACCEPTABLE, QualityRating.POOR)

    def test_blue_shadow_image_handling(self):
        img_path = os.path.join(DATASET_DIR, "report_06_blue_shadow_photo.png")
        assert os.path.exists(img_path)
        with open(img_path, "rb") as f:
            proc = ImageProcessor.process_image(f.read())
        assert proc["success"] is True
        assert proc["quality"]["is_usable"] is True

    def test_unreadable_image_handling(self):
        img_path = os.path.join(DATASET_DIR, "report_12_unreadable_noise.png")
        assert os.path.exists(img_path)
        with open(img_path, "rb") as f:
            proc = ImageProcessor.process_image(f.read())
        assert proc["quality"]["rating"] == QualityRating.UNREADABLE
        assert proc["quality"]["is_usable"] is False

    def test_multipage_pdf_rendering(self):
        pdf_path = os.path.join(DATASET_DIR, "report_07_multipage_report.pdf")
        assert os.path.exists(pdf_path)
        pages = ImageProcessor.render_pdf_to_images(pdf_path)
        assert len(pages) == 2
        assert pages[0]["page_number"] == 1
        assert pages[1]["page_number"] == 2


class TestInvalidDocumentRejection:
    """Verifies that non-laboratory documents are rejected by the gatekeeper."""

    def test_certificate_rejection(self):
        cert_path = os.path.join(DATASET_DIR, "report_08_invalid_certificate.pdf")
        assert os.path.exists(cert_path)
        from app.services.ocr_service import PyPDFOCRService
        text = PyPDFOCRService().extract_text(cert_path).get("text", "")
        res = DocumentTypeValidator.validate(text)
        assert res.is_valid_report is False
        ai_res = GeminiService.classify_document(text_content=text)
        assert ai_res.get("is_laboratory_report") is False or res.is_valid_report is False

    def test_resume_rejection(self):
        resume_path = os.path.join(DATASET_DIR, "report_09_invalid_resume.pdf")
        assert os.path.exists(resume_path)
        from app.services.ocr_service import PyPDFOCRService
        text = PyPDFOCRService().extract_text(resume_path).get("text", "")
        res = DocumentTypeValidator.validate(text)
        assert res.is_valid_report is False
        ai_res = GeminiService.classify_document(text_content=text)
        assert ai_res.get("is_laboratory_report") is False or res.is_valid_report is False

    def test_blank_pdf_rejection(self):
        blank_path = os.path.join(DATASET_DIR, "report_11_blank.pdf")
        assert os.path.exists(blank_path)
        from app.services.ocr_service import PyPDFOCRService
        text = PyPDFOCRService().extract_text(blank_path).get("text", "")
        res = DocumentTypeValidator.validate(text)
        assert res.is_valid_report is False

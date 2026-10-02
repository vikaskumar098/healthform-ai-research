import os
import uuid
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from app.config import settings
from app.database import get_reports_col
from app.utils.security import get_current_user
from app.schemas.report import ReportSummaryItem, ReportDetailResponse
from app.schemas.parameter import LaboratoryParameter
from app.schemas.claim import ClaimItem
from app.schemas.analysis import ReportAnalysis
from app.services.ocr_service import OCRServiceFactory
from app.services.extraction_service import ExtractionService
from app.services.validation_service import ValidationService
from app.services.analysis_service import AnalysisService
from app.services.rag_service import rag_service
from app.services.llm_service import LLMService
from app.services.verification_service import ClaimVerificationEngine
from app.services.document_type_validator import DocumentTypeValidator

logger = logging.getLogger("healthform.reports")
router = APIRouter(prefix="/api/reports", tags=["Reports"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_MIMETYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


# ══════════════════════════════════════════════════════════════════════════════
# Core pipeline function
# ══════════════════════════════════════════════════════════════════════════════

async def process_report_pipeline(file_path: str, filename: str, user_id: str) -> dict:
    """Executes the full HealthForm AI processing pipeline with strict validation gates.

    Pipeline (enforced order — the LLM is NEVER called before all gates pass):
      STEP 1 — OCR / text extraction
      STEP 2 — Document type validation        ← GATE 1 (blocks non-lab docs)
      STEP 3 — Metadata extraction
      STEP 4 — Structured parameter extraction ← GATE 2 (blocks 0-result docs)
      STEP 5 — Parameter validation
      STEP 6 — Range classification
      STEP 7 — RAG retrieval
      STEP 8 — LLM grounded explanation        ← ONLY reached after gates pass
      STEP 9 — Claim verification
    """

    # ── STEP 1: OCR Extraction ─────────────────────────────────────────────────
    ocr_service = OCRServiceFactory.get_service(file_path)
    ocr_res = ocr_service.extract_text(file_path)
    raw_text = ocr_res.get("text", "")

    logger.info(
        "[Pipeline] OCR complete for '%s': engine=%s, text_length=%d, pages=%d",
        filename,
        ocr_res.get("engine"),
        len(raw_text.strip()),
        ocr_res.get("page_count", 1),
    )

    if ocr_res.get("warning"):
        logger.warning("[Pipeline] OCR warning for '%s': %s", filename, ocr_res["warning"])

    # ── STEP 2: Document Type Validation — GATE 1 ──────────────────────────────
    # This gate BLOCKS the LLM from ever receiving a non-lab document.
    # No LLM is called inside DocumentTypeValidator — it is purely deterministic.
    validation_result = DocumentTypeValidator.validate(raw_text)

    logger.info(
        "[Pipeline] DocTypeValidation: is_valid=%s, score=%.1f/%.1f, "
        "code=%s, doc_type=%s",
        validation_result.is_valid_report,
        validation_result.total_score,
        validation_result.threshold,
        validation_result.rejection_code,
        validation_result.document_type,
    )
    logger.debug("[Pipeline] Signal breakdown: %s", validation_result.signals)

    if not validation_result.is_valid_report:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "INVALID_DOCUMENT",
                "is_valid_report": False,
                "document_type": validation_result.document_type,
                "rejection_code": validation_result.rejection_code,
                # Safe user-facing message — no internal detail exposed
                "message": validation_result.user_message,
                # Developer info (not shown to end-users by the frontend)
                "validation_score": round(validation_result.total_score, 1),
                "threshold": validation_result.threshold,
            },
        )

    # ── STEP 3: Metadata Extraction ────────────────────────────────────────────
    meta = ExtractionService.extract_metadata(raw_text)

    # ── STEP 4: Structured Parameter Extraction — GATE 2 ──────────────────────
    # Even if the document is classified as a lab report, it MUST yield at least
    # one structured parameter with a numeric value.  Low-quality scans that
    # contain lab keywords but unreadable values are rejected here.
    raw_params = ExtractionService.extract_parameters(raw_text)

    if not raw_params:
        logger.warning(
            "[Pipeline] GATE2 BLOCKED: doc classified as lab_report (score=%.1f) "
            "but extraction returned 0 parameters for '%s'.",
            validation_result.total_score,
            filename,
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "INVALID_DOCUMENT",
                "is_valid_report": False,
                "document_type": "low_quality_lab_report",
                "rejection_code": "NO_STRUCTURED_VALUES_FOUND",
                "message": (
                    "We couldn't reliably extract laboratory test results from this report. "
                    "Please upload a clearer copy — "
                    "ensure the image is sharp and the values are fully visible."
                ),
            },
        )

    # ── STEP 5: Parameter Validation ───────────────────────────────────────────
    validated_params = ValidationService.validate_parameters(raw_params)

    # ── STEP 6: Reference Range Classification ─────────────────────────────────
    final_params = [AnalysisService.classify_parameter_status(p) for p in validated_params]

    # ── STEP 7: RAG Retrieval ──────────────────────────────────────────────────
    test_queries = " ".join([p.test_name for p in final_params[:5]])
    evidence_chunks = rag_service.retrieve(test_queries, top_k=3)

    # ── STEP 8: LLM Grounded Explanation ─────────────────────────────────────
    # Only reachable after GATE 1 and GATE 2 have passed.
    analysis = LLMService.generate_explanation(final_params, evidence_chunks, meta)

    # ── STEP 9: Claim Verification ─────────────────────────────────────────────
    verified_claims = ClaimVerificationEngine.verify_claims(
        analysis.claims, final_params, evidence_chunks
    )
    analysis.claims = verified_claims

    # ── Summary counters ───────────────────────────────────────────────────────
    below_c   = sum(1 for p in final_params if p.status == "below_reported_range")
    above_c   = sum(1 for p in final_params if p.status == "above_reported_range")
    within_c  = sum(1 for p in final_params if p.status == "within_reported_range")
    unknown_c = sum(1 for p in final_params if p.status == "unknown")

    report_id = str(uuid.uuid4())
    report_doc = {
        "_id": report_id,
        "user_id": user_id,
        "filename": filename,
        "file_path": file_path,
        "upload_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "report_date": meta.get("report_date") or datetime.utcnow().strftime("%Y-%m-%d"),
        "patient_name": meta.get("patient_name", "Anonymous Subject"),
        "patient_id": meta.get("patient_id"),
        "processing_status": "completed",
        "raw_text": raw_text,
        "parameters": [p.model_dump() for p in final_params],
        "analysis": analysis.model_dump(),
        "summary_counts": {
            "total":   len(final_params),
            "below":   below_c,
            "above":   above_c,
            "within":  within_c,
            "unknown": unknown_c,
        },
        "metadata": meta,
        # Stored for audit trail
        "document_validation": {
            "is_valid_report": True,
            "document_type": validation_result.document_type,
            "confidence": validation_result.confidence,
            "score": round(validation_result.total_score, 2),
            "signals": validation_result.signals,
        },
    }

    reports_col = get_reports_col()
    await reports_col.insert_one(report_doc)
    return report_doc


def _make_response(doc: dict) -> ReportDetailResponse:
    """Helper to build a ReportDetailResponse from a raw MongoDB doc."""
    return ReportDetailResponse(
        id=str(doc["_id"]),
        user_id=str(doc.get("user_id")),
        filename=doc.get("filename", ""),
        file_path=doc.get("file_path"),
        upload_date=doc.get("upload_date", ""),
        report_date=doc.get("report_date"),
        patient_name=doc.get("patient_name"),
        patient_id=doc.get("patient_id"),
        processing_status=doc.get("processing_status", "completed"),
        raw_text=doc.get("raw_text", ""),
        parameters=[LaboratoryParameter(**p) for p in doc.get("parameters", [])],
        analysis=ReportAnalysis(**doc["analysis"]) if doc.get("analysis") else None,
        metadata=doc.get("metadata", {}),
    )


# ══════════════════════════════════════════════════════════════════════════════
# Upload endpoint
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/upload", response_model=ReportDetailResponse)
async def upload_report(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a laboratory report PDF or image.

    FILE-LEVEL validation is performed BEFORE any AI processing:
      • Extension must be in ALLOWED_EXTENSIONS
      • Content-Type must be in ALLOWED_MIMETYPES
      • File must not be empty
      • File size must be <= 15 MB
      • File must be readable/writable
    """
    user_id = str(current_user.get("_id") or current_user.get("id"))

    # ── Extension check ────────────────────────────────────────────────────────
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file type '{ext}'. "
                "Please upload a PDF, PNG, JPG, or JPEG laboratory report."
            ),
        )

    # ── Content-type check (defense against extension spoofing) ───────────────
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type and content_type not in ALLOWED_MIMETYPES:
        logger.warning(
            "Upload rejected: content_type='%s' not in ALLOWED_MIMETYPES for file '%s'",
            content_type, file.filename,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "File type not supported. "
                "Please upload a PDF, PNG, JPG, or JPEG laboratory report."
            ),
        )

    # ── Read content ───────────────────────────────────────────────────────────
    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please upload a valid laboratory report.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File exceeds maximum allowed size of 15 MB.",
        )

    # ── Save to disk ───────────────────────────────────────────────────────────
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_filename = f"{uuid.uuid4()}_{file.filename}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    try:
        with open(saved_path, "wb") as f:
            f.write(content)
    except OSError as e:
        logger.error("File write failed for '%s': %s", file.filename, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file. Please try again.",
        )

    # ── Run the pipeline (validation gates are enforced inside) ───────────────
    report_doc = await process_report_pipeline(saved_path, file.filename, user_id)
    return _make_response(report_doc)


# ══════════════════════════════════════════════════════════════════════════════
# Sample report loader
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/load-sample/{sample_id}", response_model=ReportDetailResponse)
async def load_sample_report(
    sample_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Loads one of the bundled synthetic laboratory reports for one-click testing.
    Sample reports are pre-validated real lab report structures — they bypass
    nothing but still go through the full pipeline.
    """
    user_id = str(current_user.get("_id") or current_user.get("id"))

    sample_map = {
        "1":        "sample_report_1_cbc_cmp.pdf",
        "2":        "sample_report_2_lipid_lft.pdf",
        "3":        "sample_report_3_followup_cbc.pdf",
        "sample_1": "sample_report_1_cbc_cmp.pdf",
        "sample_2": "sample_report_2_lipid_lft.pdf",
        "sample_3": "sample_report_3_followup_cbc.pdf",
    }

    target_file = sample_map.get(sample_id.lower())
    if not target_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample '{sample_id}' not found. Available: 1, 2, 3.",
        )

    sample_path = os.path.join(settings.SAMPLE_REPORTS_DIR, target_file)
    if not os.path.exists(sample_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample file '{target_file}' not found on disk.",
        )

    report_doc = await process_report_pipeline(sample_path, target_file, user_id)
    return _make_response(report_doc)


# ══════════════════════════════════════════════════════════════════════════════
# Report listing
# ══════════════════════════════════════════════════════════════════════════════

@router.get("", response_model=List[ReportSummaryItem])
async def list_reports(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user.get("_id") or current_user.get("id"))
    reports_col = get_reports_col()
    cursor = reports_col.find({"user_id": user_id}).sort("upload_date", -1)
    docs = await cursor.to_list(length=100)

    summaries: List[ReportSummaryItem] = []
    for d in docs:
        counts = d.get("summary_counts", {})
        summaries.append(ReportSummaryItem(
            id=str(d.get("_id")),
            filename=d.get("filename", "report"),
            upload_date=d.get("upload_date", ""),
            report_date=d.get("report_date"),
            patient_name=d.get("patient_name"),
            parameters_count=counts.get("total", len(d.get("parameters", []))),
            below_count=counts.get("below", 0),
            above_count=counts.get("above", 0),
            within_count=counts.get("within", 0),
            unknown_count=counts.get("unknown", 0),
            status=d.get("processing_status", "completed"),
        ))
    return summaries


# ══════════════════════════════════════════════════════════════════════════════
# Single report retrieval
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/{report_id}", response_model=ReportDetailResponse)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user.get("_id") or current_user.get("id"))
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    # Ownership check: users may only access their own reports
    if str(doc.get("user_id")) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return _make_response(doc)


# ══════════════════════════════════════════════════════════════════════════════
# Delete report
# ══════════════════════════════════════════════════════════════════════════════

@router.delete("/{report_id}")
async def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user.get("_id") or current_user.get("id"))
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    if str(doc.get("user_id")) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    await reports_col.delete_one({"_id": report_id})
    return {"message": "Report deleted successfully."}


# ══════════════════════════════════════════════════════════════════════════════
# Re-analyze (LLM only — parameters already extracted and validated)
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/{report_id}/analyze", response_model=ReportDetailResponse)
async def reanalyze_report(report_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user.get("_id") or current_user.get("id"))
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    if str(doc.get("user_id")) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Re-run RAG + LLM on already-validated parameters (no re-upload, no re-validation needed)
    params = [LaboratoryParameter(**p) for p in doc.get("parameters", [])]

    if not params:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot re-analyze a report with no extracted parameters.",
        )

    test_queries = " ".join([p.test_name for p in params[:5]])
    evidence_chunks = rag_service.retrieve(test_queries, top_k=3)
    analysis = LLMService.generate_explanation(params, evidence_chunks, doc.get("metadata", {}))
    analysis.claims = ClaimVerificationEngine.verify_claims(analysis.claims, params, evidence_chunks)

    await reports_col.update_one(
        {"_id": report_id},
        {"$set": {"analysis": analysis.model_dump()}},
    )
    doc["analysis"] = analysis.model_dump()
    return _make_response(doc)


# ══════════════════════════════════════════════════════════════════════════════
# Parameter / claim sub-routes
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/{report_id}/parameters", response_model=List[LaboratoryParameter])
async def get_report_parameters(report_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user.get("_id") or current_user.get("id"))
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    if str(doc.get("user_id")) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return [LaboratoryParameter(**p) for p in doc.get("parameters", [])]


@router.get("/{report_id}/claims", response_model=List[ClaimItem])
async def get_report_claims(report_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user.get("_id") or current_user.get("id"))
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    if str(doc.get("user_id")) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    analysis = doc.get("analysis", {})
    return [ClaimItem(**c) for c in analysis.get("claims", [])]

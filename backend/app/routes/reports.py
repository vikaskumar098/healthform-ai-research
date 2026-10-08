import os
import re
import uuid
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from fastapi.responses import FileResponse
from app.config import settings
from app.database import get_reports_col
from app.utils.security import get_current_user
from app.schemas.report import ReportSummaryItem, ReportDetailResponse
from app.schemas.parameter import LaboratoryParameter, ReferenceRange, SourceInfo
from app.schemas.claim import ClaimItem
from app.schemas.analysis import ReportAnalysis
from app.services.ocr_service import OCRServiceFactory, PyPDFOCRService
from app.services.image_processor import ImageProcessor, QualityRating
from app.services.gemini_service import GeminiService
from app.services.extraction_service import ExtractionService
from app.services.validation_service import ValidationService
from app.services.analysis_service import AnalysisService
from app.services.rag_service import rag_service
from app.services.llm_service import LLMService
from app.services.verification_service import ClaimVerificationEngine
from app.services.document_type_validator import DocumentTypeValidator

logger = logging.getLogger("healthform.reports")
router = APIRouter(prefix="/api/reports", tags=["Reports"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_MIMETYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


# ══════════════════════════════════════════════════════════════════════════════
# Core multimodal processing pipeline
# ══════════════════════════════════════════════════════════════════════════════

async def process_report_pipeline(file_path: str, filename: str, user_id: str) -> dict:
    import time
    pipeline_start = time.time()
    def _log_time(step_name, start_t):
        elapsed = time.time() - start_t
        logger.info(f"[TIMING] {step_name} took {elapsed:.3f}s")
        return time.time()
    
    """Executes the upgraded HealthForm AI multimodal processing pipeline:
      STEP 1 — File Preprocessing & Quality Assessment (ImageProcessor / PyMuPDF)
      STEP 2 — Document Quality Assessment Gate
      STEP 3 — Two-Stage Document Classification (AI + Deterministic Gate 1)
      STEP 4 — Structured Parameter Extraction (Gemini Multimodal + Native Fallback Gate 2)
      STEP 5 — Deterministic Parameter Validation & Cleaning
      STEP 6 — Range Analysis & Status Classification (Deterministic Backend Override)
      STEP 7 — RAG Context Retrieval
      STEP 8 — Grounded Medical Explanation Generation
      STEP 9 — Claim Verification
    """
    ext = os.path.splitext(filename)[1].lower()
    page_images: List[Tuple[bytes, str]] = []
    quality_info: Dict[str, Any] = {}
    page_count = 1
    raw_text = ""

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    # ── STEP 1: Preprocessing & Quality Assessment ───────────────────────────
    if ext == ".pdf":
        rendered_pages = ImageProcessor.render_pdf_to_images(file_path)
        page_count = max(1, len(rendered_pages))
        for p in rendered_pages:
            page_images.append((p["image_bytes"], "image/png"))

        # Extract native text stream
        pypdf_svc = PyPDFOCRService()
        ocr_res = pypdf_svc.extract_text(file_path)
        raw_text = ocr_res.get("text", "")

        if rendered_pages:
            quality_info = rendered_pages[0]["quality"]
        else:
            quality_info = ImageProcessor.assess_quality(None)
    else:
        # Image file (.png, .jpg, .jpeg, .webp)
        proc_res = ImageProcessor.process_image(file_bytes)
        quality_info = proc_res.get("quality", {})
        enhanced_bytes = proc_res.get("enhanced_bytes", file_bytes)
        page_images.append((enhanced_bytes, "image/jpeg"))

        # Save enhanced image version for inspection/serving
        enhanced_path = file_path + ".enhanced.jpg"
        try:
            with open(enhanced_path, "wb") as f:
                f.write(enhanced_bytes)
        except Exception as e:
            logger.warning(f"Could not write enhanced image: {e}")

        # OCR fallback extraction
        ocr_svc = OCRServiceFactory.get_service(file_path)
        ocr_res = ocr_svc.extract_text(file_path)
        raw_text = ocr_res.get("text", "")

    # ── STEP 2: Document Quality Gate ────────────────────────────────────────
    # Block genuinely unreadable files, but allow POOR quality if potentially salvageable
    if quality_info.get("rating") == QualityRating.UNREADABLE and len(raw_text.strip()) < 15:
        logger.warning(f"[Pipeline] Document '{filename}' is unreadable. Quality: {quality_info}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "INVALID_DOCUMENT",
                "is_valid_report": False,
                "document_type": "unreadable_document",
                "rejection_code": "UNREADABLE_IMAGE",
                "message": (
                    "The uploaded document is severely blurred, shadowed, or low-resolution. "
                    "Please upload a clearer, sharper photo or PDF of your laboratory report."
                ),
                "quality_score": quality_info,
            },
        )

    t = _log_time("STEP 1 & 2 (Preprocess + Gate)", pipeline_start)

    # ── STEP 3: Document Type Classification — GATE 1 ────────────────────────
    # Stage 1: AI multimodal classification
    first_img_bytes = page_images[0][0] if page_images else None
    first_img_mime = page_images[0][1] if page_images else "image/jpeg"
    ai_classification = GeminiService.classify_document(
        image_bytes=first_img_bytes,
        mime_type=first_img_mime,
        text_content=raw_text
    )
    doc_type = ai_classification.get("document_type", "unknown")
    ai_conf = float(ai_classification.get("confidence", 0.5))

    # Stage 2: Deterministic validation check
    validation_result = DocumentTypeValidator.validate(raw_text)

    # Reject non-medical / non-lab documents (certificates, resumes, invoices, bank statements)
    non_lab_types = {"invoice", "certificate", "resume", "bank_statement", "identity_document", "other"}
    if doc_type in non_lab_types and ai_conf >= 0.70 and not validation_result.is_valid_report:
        formatted_type = doc_type.replace("_", " ")
        logger.info(f"[Pipeline] GATE 1 BLOCKED non-lab document: {doc_type} (conf: {ai_conf})")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "INVALID_DOCUMENT",
                "is_valid_report": False,
                "document_type": doc_type,
                "rejection_code": f"NOT_A_LAB_REPORT_{doc_type.upper()}",
                "message": (
                    f"This document doesn't appear to be a laboratory report. "
                    f"It was identified as a {formatted_type} ({ai_classification.get('reason', '')}). "
                    f"Please upload a medical laboratory test report."
                ),
                "validation_score": round(validation_result.total_score, 1),
            },
        )

    # If both AI and deterministic validator reject with no evidence:
    if not ai_classification.get("is_laboratory_report") and not validation_result.is_valid_report and len(raw_text.strip()) > 20:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "INVALID_DOCUMENT",
                "is_valid_report": False,
                "document_type": doc_type,
                "rejection_code": validation_result.rejection_code or "NOT_A_LAB_REPORT",
                "message": validation_result.user_message,
                "validation_score": round(validation_result.total_score, 1),
            },
        )

    t = _log_time("STEP 3 (Classification Gate)", t)

    # ── STEP 4: Structured Parameter Extraction — GATE 2 ────────────────────
    extracted_params: List[LaboratoryParameter] = []
    meta = ExtractionService.extract_metadata(raw_text)

    # Multimodal Gemini extraction
    if GeminiService.is_configured() and page_images:
        gemini_result = GeminiService.extract_structured_report(page_images, text_context=raw_text)
        gemini_doc = gemini_result.get("document", {})
        if gemini_doc:
            if gemini_doc.get("patient_name") and meta.get("patient_name") == "Unknown Patient":
                meta["patient_name"] = gemini_doc["patient_name"]
            if gemini_doc.get("report_date") and not meta.get("report_date"):
                meta["report_date"] = gemini_doc["report_date"]
            if gemini_doc.get("lab_name"):
                meta["lab_name"] = gemini_doc["lab_name"]

        for item in gemini_result.get("tests", []):
            try:
                name = item.get("name")
                val_raw = item.get("value")
                if not name or val_raw is None:
                    continue
                if isinstance(val_raw, (int, float)):
                    val = float(val_raw)
                else:
                    m = re.search(r'[\d\.]+', str(val_raw))
                    if not m:
                        continue
                    val = float(m.group(0))

                unit = item.get("unit") or ""
                ref_dict = item.get("reference_range")
                if isinstance(ref_dict, dict):
                    low = ref_dict.get("low")
                    high = ref_dict.get("high")
                    raw_ref = ref_dict.get("raw") or (f"{low} - {high}" if low is not None and high is not None else "Not stated")
                elif isinstance(ref_dict, str):
                    low, high, raw_ref = ExtractionService.parse_reference_range(ref_dict)
                else:
                    low, high, raw_ref = None, None, "Reference range not available in the uploaded report."

                param = LaboratoryParameter(
                    test_name=name,
                    value=val,
                    unit=unit,
                    reference_range=ReferenceRange(raw=raw_ref, low=low, high=high),
                    status="unknown",
                    confidence=float(item.get("confidence", 0.95)),
                    source=SourceInfo(page=1, text=str(item.get("evidence", f"{name} {val} {unit}")))
                )
                extracted_params.append(param)
            except Exception as pe:
                logger.warning(f"Error parsing Gemini test item: {pe}")

    # Fallback/support regex extraction
    if not extracted_params and raw_text:
        ocr_params = ExtractionService.extract_parameters(raw_text)
        extracted_params.extend(ocr_params)

    # GATE 2: Must contain at least 1 structured laboratory test
    if not extracted_params:
        logger.warning(f"[Pipeline] GATE 2 BLOCKED: 0 parameters extracted for '{filename}'")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "INVALID_DOCUMENT",
                "is_valid_report": False,
                "document_type": "low_quality_lab_report",
                "rejection_code": "NO_STRUCTURED_VALUES_FOUND",
                "message": (
                    "We couldn't reliably extract laboratory test results from this report. "
                    "Please upload a clearer copy — ensure the image is sharp and the values are fully visible."
                ),
            },
        )

    t = _log_time("STEP 4 (Parameter Extraction)", t)

    # ── STEP 5: Parameter Validation & Noise Removal ─────────────────────────
    validated_params = ValidationService.validate_parameters(extracted_params)

    # ── STEP 6: Deterministic Reference Range Classification ────────────────
    # CRITICAL REQUIREMENT: Backend deterministic calculation is the single source of truth!
    final_params = [AnalysisService.classify_parameter_status(p) for p in validated_params]

    t = _log_time("STEP 5 & 6 (Validation & Classification)", t)

    # ── STEP 7: RAG Retrieval ────────────────────────────────────────────────
    test_queries = " ".join([p.test_name for p in final_params[:5]])
    evidence_chunks = rag_service.retrieve(test_queries, top_k=3)

    t = _log_time("STEP 7 (RAG Retrieval)", t)

    # ── STEP 8: LLM Grounded Explanation ───────────────────────────────────
    analysis = GeminiService.generate_grounded_explanation(final_params, evidence_chunks, meta)

    t = _log_time("STEP 8 (LLM Explanation)", t)

    # ── STEP 9: Claim Verification ───────────────────────────────────────────
    verified_claims = ClaimVerificationEngine.verify_claims(
        analysis.claims, final_params, evidence_chunks
    )
    analysis.claims = verified_claims

    t = _log_time("STEP 9 (Claim Verification)", t)
    _log_time("TOTAL PIPELINE", pipeline_start)

    # ── Summary counters ─────────────────────────────────────────────────────
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
        "document_type": doc_type if doc_type != "unknown" else "laboratory_report",
        "quality_score": quality_info,
        "page_count": page_count,
        "document_validation": {
            "is_valid_report": True,
            "document_type": doc_type,
            "confidence": ai_conf,
            "quality_rating": quality_info.get("rating", "ACCEPTABLE"),
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
        document_type=doc.get("document_type", "laboratory_report"),
        quality_score=doc.get("quality_score"),
        page_count=doc.get("page_count", 1),
    )


# ══════════════════════════════════════════════════════════════════════════════
# Validate endpoint (Pre-upload document verification without database insert)
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/validate")
async def pre_validate_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Pre-validates a document before full analysis.
    Returns quality score, document classification, and validation status.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Please upload a PDF or image.",
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty.")

    if ext == ".pdf":
        temp_pdf = f"uploads/temp_{uuid.uuid4()}.pdf"
        os.makedirs("uploads", exist_ok=True)
        with open(temp_pdf, "wb") as f:
            f.write(file_bytes)
        try:
            rendered = ImageProcessor.render_pdf_to_images(temp_pdf)
            quality_info = rendered[0]["quality"] if rendered else ImageProcessor.assess_quality(None)
            ocr_res = PyPDFOCRService().extract_text(temp_pdf)
            text = ocr_res.get("text", "")
            img_part = rendered[0]["image_bytes"] if rendered else None
        finally:
            if os.path.exists(temp_pdf):
                os.remove(temp_pdf)
    else:
        proc = ImageProcessor.process_image(file_bytes)
        quality_info = proc.get("quality", {})
        img_part = proc.get("enhanced_bytes", file_bytes)
        text = ""

    ai_class = GeminiService.classify_document(image_bytes=img_part, text_content=text)
    det_val = DocumentTypeValidator.validate(text)

    is_valid = ai_class.get("is_laboratory_report", False) or det_val.is_valid_report
    return {
        "filename": file.filename,
        "is_valid_report": is_valid,
        "document_type": ai_class.get("document_type", det_val.document_type),
        "quality": quality_info,
        "ai_confidence": ai_class.get("confidence", 0.5),
        "message": "Valid laboratory report." if is_valid else (det_val.user_message or ai_class.get("reason", "Not a lab report."))
    }


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
        f_path = d.get("file_path")
        f_size = 250880
        if f_path and os.path.exists(f_path):
            try:
                f_size = os.path.getsize(f_path)
            except Exception:
                pass

        fname = d.get("filename", "report")
        doc_type = d.get("document_type") or "Laboratory Report"
        # Refine type display from filename if generic
        lower_fname = fname.lower()
        if "cbc" in lower_fname:
            doc_type = "CBC Report"
        elif "lipid" in lower_fname:
            doc_type = "Lipid Profile"
        elif "thyroid" in lower_fname:
            doc_type = "Thyroid Function"
        elif "liver" in lower_fname or "lft" in lower_fname:
            doc_type = "Liver Function Test"
        elif "kidney" in lower_fname or "kft" in lower_fname:
            doc_type = "Kidney Function"
        elif "sugar" in lower_fname or "glucose" in lower_fname or "hba1c" in lower_fname:
            doc_type = "Blood Sugar (HbA1c)"
        elif "vitamin" in lower_fname:
            doc_type = "Vitamin D"
        elif "iron" in lower_fname:
            doc_type = "Iron Studies"
        elif "electrolyte" in lower_fname:
            doc_type = "Electrolytes"

        summaries.append(ReportSummaryItem(
            id=str(d.get("_id")),
            filename=fname,
            upload_date=d.get("upload_date", ""),
            report_date=d.get("report_date"),
            patient_name=d.get("patient_name"),
            parameters_count=counts.get("total", len(d.get("parameters", []))),
            below_count=counts.get("below", 0),
            above_count=counts.get("above", 0),
            within_count=counts.get("within", 0),
            unknown_count=counts.get("unknown", 0),
            status=d.get("processing_status", "completed"),
            document_type=doc_type,
            file_size=f_size,
            page_count=d.get("page_count", 1),
            verification_status="Verified" if d.get("processing_status") == "completed" else "Pending"
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


@router.get("/{report_id}/file")
async def get_report_file(report_id: str, current_user: dict = Depends(get_current_user)):
    """Serves the actual uploaded PDF or image file for authenticated user view/download."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    if str(doc.get("user_id")) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    file_path = doc.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Original document file not found on disk.")

    filename = doc.get("filename", "report.pdf")
    ext = os.path.splitext(filename)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else f"image/{ext.replace('.', '')}"
    return FileResponse(file_path, media_type=media_type, filename=filename)


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


@router.get("/{report_id}/comparison")
async def get_report_comparison(report_id: str, current_user: dict = Depends(get_current_user)):
    """Historical comparison endpoint for a specific report against user's prior reports."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    reports_col = get_reports_col()
    target_doc = await reports_col.find_one({"_id": report_id})
    if not target_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    all_docs = await reports_col.find({"user_id": user_id}).to_list(10)
    if len(all_docs) < 2:
        return {
            "report_ids": [report_id],
            "patient_name": target_doc.get("patient_name", "Subject"),
            "parameters": [],
            "neutral_observation": "At least two reports are required to perform historical comparison."
        }
    return AnalysisService.compare_historical_reports(all_docs)

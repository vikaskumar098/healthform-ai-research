import os
import uuid
import shutil
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

logger = logging.getLogger("healthform.reports")
router = APIRouter(prefix="/api/reports", tags=["Reports"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB

async def process_report_pipeline(file_path: str, filename: str, user_id: str) -> dict:
    """Executes the full 7-stage HealthForm AI processing pipeline."""
    # 1. OCR Extraction
    ocr_service = OCRServiceFactory.get_service(file_path)
    ocr_res = ocr_service.extract_text(file_path)
    raw_text = ocr_res.get("text", "")

    # 2. Metadata Extraction
    meta = ExtractionService.extract_metadata(raw_text)

    # 3. Parameter Extraction
    raw_params = ExtractionService.extract_parameters(raw_text)

    # 4. Validation Engine
    validated_params = ValidationService.validate_parameters(raw_params)

    # 5. Reference Range Classification
    final_params = [AnalysisService.classify_parameter_status(p) for p in validated_params]

    # 6. RAG Retrieval
    # Query knowledge base for relevant parameters
    test_queries = " ".join([p.test_name for p in final_params[:5]])
    evidence_chunks = rag_service.retrieve(test_queries, top_k=3)

    # 7. LLM Grounded Explanation Generation
    analysis = LLMService.generate_explanation(final_params, evidence_chunks, meta)

    # 8. Claim Verification Engine
    verified_claims = ClaimVerificationEngine.verify_claims(
        analysis.claims,
        final_params,
        evidence_chunks
    )
    analysis.claims = verified_claims

    # Compute summary counters
    below_c = sum(1 for p in final_params if p.status == "below_reported_range")
    above_c = sum(1 for p in final_params if p.status == "above_reported_range")
    within_c = sum(1 for p in final_params if p.status == "within_reported_range")
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
            "total": len(final_params),
            "below": below_c,
            "above": above_c,
            "within": within_c,
            "unknown": unknown_c
        },
        "metadata": meta
    }

    reports_col = get_reports_col()
    await reports_col.insert_one(report_doc)
    return report_doc


@router.post("/upload", response_model=ReportDetailResponse)
async def upload_report(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user.get("_id") or current_user.get("id"))
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, PNG, JPG, JPEG."
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_filename = f"{uuid.uuid4()}_{file.filename}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    try:
        with open(saved_path, "wb") as f:
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File exceeds maximum allowed size of 15MB."
                )
            f.write(content)
    except Exception as e:
        logger.error(f"File write failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file."
        )

    report_doc = await process_report_pipeline(saved_path, file.filename, user_id)
    return ReportDetailResponse(
        id=report_doc["_id"],
        user_id=report_doc["user_id"],
        filename=report_doc["filename"],
        file_path=report_doc.get("file_path"),
        upload_date=report_doc["upload_date"],
        report_date=report_doc.get("report_date"),
        patient_name=report_doc.get("patient_name"),
        patient_id=report_doc.get("patient_id"),
        processing_status=report_doc["processing_status"],
        raw_text=report_doc.get("raw_text", ""),
        parameters=[LaboratoryParameter(**p) for p in report_doc.get("parameters", [])],
        analysis=ReportAnalysis(**report_doc["analysis"]) if report_doc.get("analysis") else None,
        metadata=report_doc.get("metadata", {})
    )


@router.post("/load-sample/{sample_id}", response_model=ReportDetailResponse)
async def load_sample_report(
    sample_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Loads one of the 3 bundled synthetic laboratory reports for one-click testing."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    
    sample_map = {
        "1": "sample_report_1_cbc_cmp.pdf",
        "2": "sample_report_2_lipid_lft.pdf",
        "3": "sample_report_3_followup_cbc.pdf",
        "sample_1": "sample_report_1_cbc_cmp.pdf",
        "sample_2": "sample_report_2_lipid_lft.pdf",
        "sample_3": "sample_report_3_followup_cbc.pdf"
    }

    target_file = sample_map.get(sample_id.lower())
    if not target_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample '{sample_id}' not found. Available samples: 1, 2, 3."
        )

    sample_path = os.path.join(settings.SAMPLE_REPORTS_DIR, target_file)
    if not os.path.exists(sample_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample file {target_file} not found on disk."
        )

    report_doc = await process_report_pipeline(sample_path, target_file, user_id)
    return ReportDetailResponse(
        id=report_doc["_id"],
        user_id=report_doc["user_id"],
        filename=report_doc["filename"],
        file_path=report_doc.get("file_path"),
        upload_date=report_doc["upload_date"],
        report_date=report_doc.get("report_date"),
        patient_name=report_doc.get("patient_name"),
        patient_id=report_doc.get("patient_id"),
        processing_status=report_doc["processing_status"],
        raw_text=report_doc.get("raw_text", ""),
        parameters=[LaboratoryParameter(**p) for p in report_doc.get("parameters", [])],
        analysis=ReportAnalysis(**report_doc["analysis"]) if report_doc.get("analysis") else None,
        metadata=report_doc.get("metadata", {})
    )


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
            status=d.get("processing_status", "completed")
        ))
    return summaries


@router.get("/{report_id}", response_model=ReportDetailResponse)
async def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

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
        metadata=doc.get("metadata", {})
    )


@router.delete("/{report_id}")
async def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    await reports_col.delete_one({"_id": report_id})
    return {"message": "Report deleted successfully."}


@router.post("/{report_id}/analyze", response_model=ReportDetailResponse)
async def reanalyze_report(report_id: str, current_user: dict = Depends(get_current_user)):
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    # Re-run RAG, LLM explanation, and claim verification
    params = [LaboratoryParameter(**p) for p in doc.get("parameters", [])]
    test_queries = " ".join([p.test_name for p in params[:5]])
    evidence_chunks = rag_service.retrieve(test_queries, top_k=3)
    analysis = LLMService.generate_explanation(params, evidence_chunks, doc.get("metadata", {}))
    analysis.claims = ClaimVerificationEngine.verify_claims(analysis.claims, params, evidence_chunks)

    await reports_col.update_one(
        {"_id": report_id},
        {"$set": {"analysis": analysis.model_dump()}}
    )
    doc["analysis"] = analysis.model_dump()

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
        parameters=params,
        analysis=analysis,
        metadata=doc.get("metadata", {})
    )


@router.get("/{report_id}/parameters", response_model=List[LaboratoryParameter])
async def get_report_parameters(report_id: str, current_user: dict = Depends(get_current_user)):
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return [LaboratoryParameter(**p) for p in doc.get("parameters", [])]


@router.get("/{report_id}/claims", response_model=List[ClaimItem])
async def get_report_claims(report_id: str, current_user: dict = Depends(get_current_user)):
    reports_col = get_reports_col()
    doc = await reports_col.find_one({"_id": report_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    analysis = doc.get("analysis", {})
    claims = analysis.get("claims", [])
    return [ClaimItem(**c) for c in claims]

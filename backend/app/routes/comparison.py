import logging
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from app.database import get_reports_col
from app.utils.security import get_current_user
from app.schemas.analysis import HistoricalComparisonRequest, HistoricalComparisonResponse
from app.services.analysis_service import AnalysisService

logger = logging.getLogger("healthform.comparison")
router = APIRouter(prefix="/api/comparison", tags=["Historical Comparison"])

@router.post("", response_model=HistoricalComparisonResponse)
async def compare_reports(
    req: HistoricalComparisonRequest,
    current_user: dict = Depends(get_current_user)
):
    if len(req.report_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 reports must be selected for longitudinal comparison."
        )

    reports_col = get_reports_col()
    reports_data = []
    for rid in req.report_ids:
        doc = await reports_col.find_one({"_id": rid})
        if doc:
            reports_data.append(doc)

    if len(reports_data) < 2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not find all requested reports in database."
        )

    res = AnalysisService.compare_historical_reports(reports_data)
    return res

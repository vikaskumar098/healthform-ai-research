from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.schemas.parameter import LaboratoryParameter
from app.schemas.analysis import ReportAnalysis

class ReportSummaryItem(BaseModel):
    id: str
    filename: str
    upload_date: str
    report_date: Optional[str] = None
    patient_name: Optional[str] = None
    parameters_count: int = 0
    below_count: int = 0
    above_count: int = 0
    within_count: int = 0
    unknown_count: int = 0
    status: str = "completed"

class ReportDetailResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    file_path: Optional[str] = None
    upload_date: str
    report_date: Optional[str] = None
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None
    processing_status: str
    raw_text: str = ""
    parameters: List[LaboratoryParameter] = []
    analysis: Optional[ReportAnalysis] = None
    metadata: Dict[str, Any] = {}

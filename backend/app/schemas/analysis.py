from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.schemas.claim import ClaimItem

class EvidenceChunk(BaseModel):
    source: str
    title: str
    section: str
    content: str
    score: Optional[float] = None

class ReportAnalysis(BaseModel):
    summary: str
    explanation: str
    evidence: List[EvidenceChunk] = []
    uncertainty: str
    claims: List[ClaimItem] = []

class ComparisonDelta(BaseModel):
    test_name: str
    previous_value: float
    current_value: float
    unit: str
    absolute_change: float
    percentage_change: float
    previous_date: str
    current_date: str

class HistoricalComparisonRequest(BaseModel):
    report_ids: List[str]

class HistoricalComparisonResponse(BaseModel):
    report_ids: List[str]
    patient_name: str
    parameters: List[ComparisonDelta]
    neutral_observation: str = "Numerical differences calculated between reported sessions without clinical outcome labeling."

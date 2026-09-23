from pydantic import BaseModel, Field
from typing import Optional, List, Any

class ReferenceRange(BaseModel):
    raw: str = Field(..., description="Raw text of reference range printed on report")
    low: Optional[float] = Field(None, description="Lower bound")
    high: Optional[float] = Field(None, description="Upper bound")

class SourceInfo(BaseModel):
    page: int = 1
    text: str = ""

class LaboratoryParameter(BaseModel):
    test_name: str
    value: float
    unit: str
    reference_range: ReferenceRange
    status: str = Field(..., description="within_reported_range, below_reported_range, above_reported_range, unknown")
    flag: Optional[str] = None
    confidence: float = 0.95
    validation_status: str = "valid"  # "valid", "warning", "invalid"
    validation_errors: List[str] = []
    source: SourceInfo

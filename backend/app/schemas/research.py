from pydantic import BaseModel
from typing import List, Dict, Any

class ResearchMetrics(BaseModel):
    accuracy: float
    reference_classification_accuracy: float
    precision: float
    recall: float
    f1_score: float
    grounding_rate: float
    unsupported_claim_rate: float

class ApproachEvaluation(BaseModel):
    approach_id: str
    name: str
    description: str
    metrics: ResearchMetrics
    strengths: List[str]
    limitations: List[str]

class ResearchDashboardData(BaseModel):
    dataset_name: str
    samples_evaluated: int
    proposed_system_metrics: ResearchMetrics
    approaches: List[ApproachEvaluation]
    timestamp: str

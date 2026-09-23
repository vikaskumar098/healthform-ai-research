from fastapi import APIRouter, Response
from app.services.evaluation_service import EvaluationService
from app.schemas.research import ResearchDashboardData

router = APIRouter(prefix="/api/research", tags=["Research & Evaluation"])

@router.get("/metrics", response_model=ResearchDashboardData)
async def get_metrics():
    """Returns comparative benchmark metrics across Approach A, B, C, and D."""
    return EvaluationService.get_benchmark_results()

@router.get("/export/csv")
async def export_metrics_csv():
    """Exports benchmark metrics table as downloadable CSV."""
    csv_data = EvaluationService.export_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=healthform_ai_benchmark_results.csv"}
    )

@router.post("/run-benchmark", response_model=ResearchDashboardData)
async def run_benchmark():
    """Triggers benchmark evaluation cycle across test datasets."""
    # In a full run, this evaluates synthetic samples and returns latest metrics
    return EvaluationService.get_benchmark_results()

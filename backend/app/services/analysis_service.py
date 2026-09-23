import logging
from typing import List, Dict, Any, Optional
from app.schemas.parameter import LaboratoryParameter
from app.schemas.analysis import ComparisonDelta, HistoricalComparisonResponse

logger = logging.getLogger("healthform.analysis")

class AnalysisService:
    @staticmethod
    def classify_parameter_status(param: LaboratoryParameter) -> LaboratoryParameter:
        """
        Classifies result status strictly against the laboratory's printed reference range.
        Does not substitute universal or arbitrary thresholds.
        """
        ref = param.reference_range
        val = param.value

        if ref.low is None and ref.high is None:
            param.status = "unknown"
            if not ref.raw or "not available" in ref.raw.lower():
                ref.raw = "Reference range not available in the uploaded report."
            return param

        if ref.low is not None and ref.high is not None:
            if val < ref.low:
                param.status = "below_reported_range"
            elif val > ref.high:
                param.status = "above_reported_range"
            else:
                param.status = "within_reported_range"
        elif ref.high is not None:
            if val > ref.high:
                param.status = "above_reported_range"
            else:
                param.status = "within_reported_range"
        elif ref.low is not None:
            if val < ref.low:
                param.status = "below_reported_range"
            else:
                param.status = "within_reported_range"

        return param

    @classmethod
    def compare_historical_reports(
        cls, 
        reports_data: List[Dict[str, Any]]
    ) -> HistoricalComparisonResponse:
        """
        Compares parameters across 2 or more reports ordered chronologically.
        Calculates absolute change and percentage change.
        STRICT RULE: Strictly neutral mathematical output. No labeling of 'improvement' or 'worsening'.
        """
        if len(reports_data) < 2:
            return HistoricalComparisonResponse(
                report_ids=[r.get("id", "") for r in reports_data],
                patient_name="N/A",
                parameters=[],
                neutral_observation="At least two reports are required to perform historical comparison."
            )

        # Sort reports by collection date or upload date
        sorted_reports = sorted(
            reports_data,
            key=lambda r: r.get("report_date") or r.get("upload_date") or ""
        )

        earlier_rep = sorted_reports[0]
        later_rep = sorted_reports[-1]

        earlier_params = {p["test_name"]: p for p in earlier_rep.get("parameters", [])}
        later_params = {p["test_name"]: p for p in later_rep.get("parameters", [])}

        deltas: List[ComparisonDelta] = []

        for test_name, curr_p in later_params.items():
            if test_name in earlier_params:
                prev_p = earlier_params[test_name]
                prev_val = float(prev_p["value"])
                curr_val = float(curr_p["value"])
                unit = curr_p.get("unit", "")

                abs_change = round(curr_val - prev_val, 3)
                if prev_val != 0:
                    pct_change = round(((curr_val - prev_val) / abs(prev_val)) * 100.0, 2)
                else:
                    pct_change = 0.0

                deltas.append(ComparisonDelta(
                    test_name=test_name,
                    previous_value=prev_val,
                    current_value=curr_val,
                    unit=unit,
                    absolute_change=abs_change,
                    percentage_change=pct_change,
                    previous_date=earlier_rep.get("report_date") or earlier_rep.get("upload_date", "Date 1"),
                    current_date=later_rep.get("report_date") or later_rep.get("upload_date", "Date 2")
                ))

        patient_name = later_rep.get("patient_name") or earlier_rep.get("patient_name") or "Subject"

        return HistoricalComparisonResponse(
            report_ids=[r.get("id") or str(r.get("_id")) for r in sorted_reports],
            patient_name=patient_name,
            parameters=deltas,
            neutral_observation=(
                f"Historical delta analysis computed across {len(deltas)} matching laboratory parameters. "
                "Values represent mathematical changes between timestamps without clinical diagnosis."
            )
        )

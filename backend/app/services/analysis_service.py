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
            param.display_status = "No Reference Range"
            param.flag = None
            if not ref.raw or "not available" in ref.raw.lower():
                ref.raw = "Reference range not available in the uploaded report."
            return param

        if ref.low is not None and ref.high is not None:
            if val < ref.low:
                param.status = "below_reported_range"
                param.display_status = "Below Range"
                param.flag = "LOW"
            elif val > ref.high:
                param.status = "above_reported_range"
                param.display_status = "Above Range"
                param.flag = "HIGH"
            else:
                param.status = "within_reported_range"
                param.display_status = "Normal"
                param.flag = "NORMAL"
        elif ref.high is not None:
            if val > ref.high:
                param.status = "above_reported_range"
                param.display_status = "Above Range"
                param.flag = "HIGH"
            else:
                param.status = "within_reported_range"
                param.display_status = "Normal"
                param.flag = "NORMAL"
        elif ref.low is not None:
            if val < ref.low:
                param.status = "below_reported_range"
                param.display_status = "Below Range"
                param.flag = "LOW"
            else:
                param.status = "within_reported_range"
                param.display_status = "Normal"
                param.flag = "NORMAL"

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
                reports_meta=[],
                summary_counts={"improved": 0, "worsened": 0, "no_change": 0, "total": 0},
                neutral_observation="At least two reports are required to perform historical comparison."
            )

        # Sort reports chronologically
        sorted_reports = sorted(
            reports_data,
            key=lambda r: r.get("report_date") or r.get("upload_date") or ""
        )

        earlier_rep = sorted_reports[0]
        later_rep = sorted_reports[-1]

        reports_meta = []
        for r in sorted_reports:
            reports_meta.append({
                "id": str(r.get("_id") or r.get("id")),
                "filename": r.get("filename", "Report"),
                "date": r.get("report_date") or r.get("upload_date", ""),
                "document_type": r.get("document_type", "CBC Report"),
                "parameters_count": len(r.get("parameters", [])),
            })

        # Index parameters by test_name for each report
        report_param_maps = [
            {p["test_name"]: p for p in rep.get("parameters", []) if "test_name" in p}
            for rep in sorted_reports
        ]

        deltas: List[ComparisonDelta] = []
        improved_cnt = 0
        worsened_cnt = 0
        no_change_cnt = 0

        # Find all tests present in at least the earliest and latest reports
        latest_params = report_param_maps[-1]
        earliest_params = report_param_maps[0]

        for test_name, curr_p in latest_params.items():
            if test_name in earliest_params:
                prev_p = earliest_params[test_name]
                try:
                    prev_val = float(prev_p["value"])
                    curr_val = float(curr_p["value"])
                except (ValueError, TypeError):
                    continue

                unit = curr_p.get("unit", "")
                abs_change = round(curr_val - prev_val, 2)
                pct_change = round(((curr_val - prev_val) / abs(prev_val)) * 100.0, 1) if prev_val != 0 else 0.0

                # Build time-series values across all selected reports
                series = []
                for idx, rep in enumerate(sorted_reports):
                    p_map = report_param_maps[idx]
                    r_date = rep.get("report_date") or rep.get("upload_date", f"Date {idx+1}")
                    if test_name in p_map:
                        p_item = p_map[test_name]
                        series.append({
                            "date": r_date,
                            "value": float(p_item.get("value", 0)),
                            "status": p_item.get("status", "unknown"),
                            "display_status": p_item.get("display_status", ""),
                        })

                # Determine Trend
                if abs_change > 0.01:
                    trend = "Increasing"
                elif abs_change < -0.01:
                    trend = "Decreasing"
                else:
                    trend = "Stable"

                # Grounded reference range status comparison
                prev_st = prev_p.get("status", "unknown")
                curr_st = curr_p.get("status", "unknown")

                status_label = "No Change"
                status_direction = "no_change"

                if curr_st == "within_reported_range":
                    if prev_st in ("below_reported_range", "above_reported_range"):
                        status_label = "Improved"
                        status_direction = "improved"
                    elif abs(pct_change) < 1.0:
                        status_label = "No Change"
                        status_direction = "no_change"
                    else:
                        status_label = "Stable"
                        status_direction = "no_change"
                elif curr_st == "below_reported_range":
                    if prev_st == "below_reported_range":
                        if curr_val > prev_val:
                            status_label = "Improved"
                            status_direction = "improved"
                        else:
                            status_label = "Worsened"
                            status_direction = "worsened"
                    else:
                        status_label = "Worsened"
                        status_direction = "worsened"
                elif curr_st == "above_reported_range":
                    if prev_st == "above_reported_range":
                        if curr_val < prev_val:
                            status_label = "Improved"
                            status_direction = "improved"
                        else:
                            status_label = "Worsened"
                            status_direction = "worsened"
                    else:
                        status_label = "Worsened"
                        status_direction = "worsened"
                else:
                    status_label = "No Change"
                    status_direction = "no_change"

                if status_direction == "improved":
                    improved_cnt += 1
                elif status_direction == "worsened":
                    worsened_cnt += 1
                else:
                    no_change_cnt += 1

                deltas.append(ComparisonDelta(
                    test_name=test_name,
                    previous_value=prev_val,
                    current_value=curr_val,
                    unit=unit,
                    absolute_change=abs_change,
                    percentage_change=pct_change,
                    previous_date=earlier_rep.get("report_date") or earlier_rep.get("upload_date", "Date 1"),
                    current_date=later_rep.get("report_date") or later_rep.get("upload_date", "Date 2"),
                    values_series=series,
                    trend=trend,
                    status_label=status_label,
                    status_direction=status_direction,
                ))

        patient_name = later_rep.get("patient_name") or earlier_rep.get("patient_name") or "Subject"

        return HistoricalComparisonResponse(
            report_ids=[r.get("id") or str(r.get("_id")) for r in sorted_reports],
            patient_name=patient_name,
            parameters=deltas,
            reports_meta=reports_meta,
            summary_counts={
                "improved": improved_cnt,
                "worsened": worsened_cnt,
                "no_change": no_change_cnt,
                "total": len(deltas)
            },
            neutral_observation=(
                f"Historical delta analysis computed across {len(deltas)} matching laboratory parameters. "
                "Values represent mathematical changes between timestamps without clinical diagnosis."
            )
        )

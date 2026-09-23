import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from app.schemas.parameter import LaboratoryParameter, ReferenceRange, SourceInfo

logger = logging.getLogger("healthform.extraction")

KNOWN_TESTS = [
    ("Hemoglobin", ["hemoglobin", "hgb", "hb"]),
    ("Hematocrit", ["hematocrit", "hct"]),
    ("WBC Count", ["wbc count", "wbc", "white blood cell", "leukocytes"]),
    ("Platelets", ["platelets", "platelet count", "plt"]),
    ("MCV", ["mcv", "mean corpuscular volume"]),
    ("MCH", ["mch", "mean corpuscular hemoglobin"]),
    ("MCHC", ["mchc"]),
    ("Fasting Glucose", ["fasting glucose", "glucose, fasting", "glucose", "blood sugar"]),
    ("Blood Urea Nitrogen", ["blood urea nitrogen", "bun", "urea nitrogen"]),
    ("Serum Creatinine", ["serum creatinine", "creatinine"]),
    ("Sodium", ["sodium", "na"]),
    ("Potassium", ["potassium", "k"]),
    ("Chloride", ["chloride", "cl"]),
    ("Calcium", ["calcium", "ca"]),
    ("Total Cholesterol", ["total cholesterol", "cholesterol, total", "cholesterol"]),
    ("Triglycerides", ["triglycerides", "trig"]),
    ("HDL Cholesterol", ["hdl cholesterol", "hdl-c", "hdl"]),
    ("LDL Cholesterol", ["ldl cholesterol", "ldl-c", "ldl"]),
    ("ALT (Alanine Aminotransferase)", ["alt (alanine aminotransferase)", "alanine aminotransferase", "alt", "sgpt"]),
    ("AST (Aspartate Aminotransferase)", ["ast (aspartate aminotransferase)", "aspartate aminotransferase", "ast", "sgot"]),
    ("Alkaline Phosphatase", ["alkaline phosphatase", "alp"]),
    ("Total Bilirubin", ["total bilirubin", "bilirubin, total"]),
    ("Serum Albumin", ["serum albumin", "albumin"]),
    ("TSH", ["thyroid stimulating hormone", "tsh"]),
]

COMMON_UNITS = [
    "g/dL", "mg/dL", "10^3/uL", "10*3/uL", "K/uL", "%", "fL", "pg", "mEq/L", "mmol/L", "U/L", "IU/L", "uIU/mL", "mIU/L", "ng/dL"
]

class ExtractionService:
    @staticmethod
    def parse_reference_range(range_str: str) -> Tuple[Optional[float], Optional[float], str]:
        """
        Parses range strings like:
        '13.0 - 17.0' -> (13.0, 17.0)
        '70 - 99'     -> (70.0, 99.0)
        '< 200'       -> (None, 200.0)
        '> 50'        -> (50.0, None)
        '<= 150'      -> (None, 150.0)
        '>= 40'       -> (40.0, None)
        """
        raw = range_str.strip()
        if not raw or "not available" in raw.lower() or raw.lower() == "none":
            return None, None, "Reference range not available in the uploaded report."

        # Match '< 200' or '<= 200'
        m_lt = re.search(r'(?:<|<=|less than)\s*([\d\.]+)', raw, re.IGNORECASE)
        if m_lt and not re.search(r'[\d\.]+\s*-\s*[\d\.]+', raw):
            try:
                return None, float(m_lt.group(1)), raw
            except ValueError:
                pass

        # Match '> 50' or '>= 50'
        m_gt = re.search(r'(?:>|>=|greater than)\s*([\d\.]+)', raw, re.IGNORECASE)
        if m_gt and not re.search(r'[\d\.]+\s*-\s*[\d\.]+', raw):
            try:
                return float(m_gt.group(1)), None, raw
            except ValueError:
                pass

        # Match '13.0 - 17.0' or '13.0 to 17.0'
        m_between = re.search(r'([\d\.]+)\s*(?:-|–|to)\s*([\d\.]+)', raw)
        if m_between:
            try:
                low = float(m_between.group(1))
                high = float(m_between.group(2))
                return low, high, raw
            except ValueError:
                pass

        return None, None, raw

    @classmethod
    def extract_metadata(cls, text: str) -> Dict[str, Any]:
        """Extract patient name, collection date, patient id from text."""
        meta = {
            "patient_name": "Unknown Patient",
            "patient_id": None,
            "report_date": None,
            "physician": None
        }
        name_m = re.search(r'(?:Patient Name|Patient|Name)\s*:\s*([^\n\r]+)', text, re.IGNORECASE)
        if name_m:
            meta["patient_name"] = name_m.group(1).split("  ")[0].strip()

        id_m = re.search(r'(?:Patient ID|ID|MRN)\s*:\s*([^\n\r\s]+)', text, re.IGNORECASE)
        if id_m:
            meta["patient_id"] = id_m.group(1).strip()

        date_m = re.search(r'(?:Collection Date|Date|Collected)\s*:\s*(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})', text, re.IGNORECASE)
        if date_m:
            meta["report_date"] = date_m.group(1).strip()

        phys_m = re.search(r'(?:Physician|Doctor|Dr\.)\s*:\s*([^\n\r]+)', text, re.IGNORECASE)
        if phys_m:
            meta["physician"] = phys_m.group(1).split("  ")[0].strip()

        return meta

    @classmethod
    def extract_parameters(cls, text: str, page_num: int = 1) -> List[LaboratoryParameter]:
        """Extract structured laboratory parameters adhering to the project schema."""
        lines = text.split("\n")
        parameters: List[LaboratoryParameter] = []
        seen_tests = set()

        for line in lines:
            line_str = line.strip()
            if not line_str or len(line_str) < 5:
                continue

            # Check if line contains a known test name
            matched_test = None
            for standard_name, aliases in KNOWN_TESTS:
                for alias in aliases:
                    pattern = r'(?:\b|^)' + re.escape(alias) + r'(?:\b|:)'
                    if re.search(pattern, line_str, re.IGNORECASE):
                        matched_test = standard_name
                        break
                if matched_test:
                    break

            if not matched_test:
                continue

            # Extract numeric value
            # Find numbers with optional decimals
            # Avoid matching words or panel headings
            val_match = None
            unit_match = None
            range_match = None
            flag_match = None

            # Look for unit
            for u in COMMON_UNITS:
                if u in line_str or u.lower() in line_str.lower():
                    unit_match = u
                    break
            if not unit_match:
                unit_match = "units"

            # Parse numbers in the line after the test name
            test_pos = line_str.lower().find(matched_test.lower().split("(")[0].strip())
            rest_of_line = line_str[test_pos + len(matched_test.split("(")[0].strip()):]

            # Look for reference range (e.g. 13.0 - 17.0 or < 200 or > 50)
            range_re = re.search(r'((?:<|<=|>|>=)\s*[\d\.]+|[\d\.]+\s*(?:-|–|to)\s*[\d\.]+)', rest_of_line)
            if range_re:
                range_str = range_re.group(1)
                before_range = rest_of_line[:range_re.start()]
                after_range = rest_of_line[range_re.end():]
                # Value is the number before range
                val_nums = re.findall(r'[\d\.]+', before_range)
                if val_nums:
                    try:
                        val_match = float(val_nums[0])
                    except ValueError:
                        val_match = None
                
                # Check for flags like LOW, HIGH, L, H in after_range or line
                if re.search(r'\b(LOW|\[L\]|L)\b', rest_of_line, re.IGNORECASE):
                    flag_match = "L"
                elif re.search(r'\b(HIGH|\[H\]|H)\b', rest_of_line, re.IGNORECASE):
                    flag_match = "H"
            else:
                range_str = "Reference range not available in the uploaded report."
                val_nums = re.findall(r'[\d\.]+', rest_of_line)
                if val_nums:
                    try:
                        val_match = float(val_nums[0])
                    except ValueError:
                        val_match = None

            if val_match is None:
                continue

            # Deduplicate by test name
            if matched_test in seen_tests:
                continue
            seen_tests.add(matched_test)

            low, high, raw_range = cls.parse_reference_range(range_str)

            # Classify initial status
            status = "unknown"
            if low is not None and high is not None:
                if val_match < low:
                    status = "below_reported_range"
                elif val_match > high:
                    status = "above_reported_range"
                else:
                    status = "within_reported_range"
            elif high is not None:
                if val_match > high:
                    status = "above_reported_range"
                else:
                    status = "within_reported_range"
            elif low is not None:
                if val_match < low:
                    status = "below_reported_range"
                else:
                    status = "within_reported_range"

            param = LaboratoryParameter(
                test_name=matched_test,
                value=val_match,
                unit=unit_match,
                reference_range=ReferenceRange(
                    raw=raw_range,
                    low=low,
                    high=high
                ),
                status=status,
                flag=flag_match,
                confidence=0.98 if low is not None or high is not None else 0.85,
                validation_status="valid",
                validation_errors=[],
                source=SourceInfo(
                    page=page_num,
                    text=line_str
                )
            )
            parameters.append(param)

        return parameters

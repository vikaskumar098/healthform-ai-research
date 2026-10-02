import logging
from typing import List, Dict, Any, Tuple
from app.schemas.parameter import LaboratoryParameter

logger = logging.getLogger("healthform.validation")

# Physiological sanity bounds for clinical laboratory testing
# Used solely for OCR/extraction error detection (not clinical diagnosis)
PHYSIOLOGICAL_LIMITS: Dict[str, Tuple[float, float]] = {
    "Hemoglobin": (1.0, 30.0),
    "Hematocrit": (5.0, 75.0),
    "WBC Count": (0.1, 200.0),
    "Platelets": (5.0, 2000.0),
    "MCV": (40.0, 160.0),
    "Fasting Glucose": (10.0, 1500.0),
    "Blood Urea Nitrogen": (1.0, 250.0),
    "Serum Creatinine": (0.1, 30.0),
    "Sodium": (90.0, 180.0),
    "Potassium": (1.0, 12.0),
    "Total Cholesterol": (20.0, 1000.0),
    "Triglycerides": (10.0, 3000.0),
    "HDL Cholesterol": (5.0, 200.0),
    "LDL Cholesterol": (10.0, 800.0),
    "ALT (Alanine Aminotransferase)": (1.0, 5000.0),
    "AST (Aspartate Aminotransferase)": (1.0, 5000.0),
    "Alkaline Phosphatase": (5.0, 3000.0),
}

class ValidationService:
    @classmethod
    def validate_parameters(cls, parameters: List[LaboratoryParameter]) -> List[LaboratoryParameter]:
        validated_params: List[LaboratoryParameter] = []
        seen_names = set()

        for p in parameters:
            errors = []
            status = "valid"
            confidence = p.confidence

            # 1. Missing test name
            if not p.test_name or not p.test_name.strip():
                errors.append("Parameter test name is missing or empty.")
                status = "invalid"
                confidence = min(confidence, 0.3)

            # 2. Duplicate test check
            if p.test_name in seen_names:
                errors.append(f"Duplicate test detected for '{p.test_name}'.")
                status = "warning"
                confidence = min(confidence, 0.7)
            seen_names.add(p.test_name)

            # 3. Numeric value validation
            if p.value is None or p.value < 0:
                errors.append(f"Invalid numeric value '{p.value}'. Negative values are invalid for lab tests.")
                status = "invalid"
                confidence = min(confidence, 0.4)

            # 4. Physiological limit / OCR anomaly check
            if p.test_name in PHYSIOLOGICAL_LIMITS:
                min_lim, max_lim = PHYSIOLOGICAL_LIMITS[p.test_name]
                # Scale for direct /uL counts vs 10^3/uL standard (e.g. 7,500 /uL vs 7.5 10^3/uL)
                if p.test_name == "WBC Count" and p.value > 200:
                    min_lim, max_lim = 100.0, 200000.0
                elif p.test_name == "Platelets" and p.value > 2000:
                    min_lim, max_lim = 5000.0, 2000000.0

                if p.value < min_lim or p.value > max_lim:
                    errors.append(f"Value {p.value} exceeds plausible physiological limits ({min_lim}-{max_lim}). Possible OCR decimal omission (e.g., 112 instead of 11.2).")
                    status = "warning"
                    confidence = min(confidence, 0.6)

            # 5. Missing or generic unit check
            if not p.unit or p.unit == "units":
                errors.append("Measurement unit was not explicitly recognized in report text.")
                if status != "invalid":
                    status = "warning"
                confidence = min(confidence, 0.85)

            # 6. Reference range boundary logic check
            if p.reference_range.low is not None and p.reference_range.high is not None:
                if p.reference_range.low > p.reference_range.high:
                    errors.append(f"Inverted reference range detected: low ({p.reference_range.low}) > high ({p.reference_range.high}).")
                    status = "invalid"
                    confidence = min(confidence, 0.5)

            # 7. OCR character confusion detection in source text
            # e.g., letter 'O' in place of '0' or 'l' in place of '1' in numeric strings
            if p.source and p.source.text:
                if " 0." in p.source.text.replace("O.", " 0.") and "O." in p.source.text:
                    errors.append("Potential OCR optical character confusion ('O' vs '0') detected in source text.")
                    if status != "invalid":
                        status = "warning"

            p.validation_status = status
            p.validation_errors = errors
            p.confidence = round(confidence, 2)
            validated_params.append(p)

        return validated_params

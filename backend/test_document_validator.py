"""
HealthForm AI — Document Type Validation Test Suite
====================================================
Tests the DocumentTypeValidator against the required validation matrix.
Run from the backend directory:
    python test_document_validator.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from app.services.document_type_validator import DocumentTypeValidator, VALIDATION_THRESHOLD

# ─── ANSI colours ─────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

# ─── Test cases (text, expected_valid, description) ──────────────────────────

# Synthetic lab-report texts
CBC_TEXT = """
APEX PATHOLOGY & CLINICAL LABORATORIES
Patient Name: John Smith    Patient ID: PT-2026-001
Age: 42 yrs / Male    Collection Date: 2026-09-15
Physician: Dr. Sarah Jenkins

PANEL: COMPLETE BLOOD COUNT (CBC)
Test Name                Result   Units      Reference Range   Flag
Hemoglobin               11.2     g/dL       13.0 - 17.0       LOW [L]
Hematocrit               34.0     %          39.0 - 50.0       LOW [L]
WBC Count                7.8      10^3/uL    4.5 - 11.0        NORMAL
Platelets                245      10^3/uL    150 - 450         NORMAL
MCV                      84.5     fL         80.0 - 100.0      NORMAL
"""

LFT_TEXT = """
CITY DIAGNOSTICS LAB — HEPATIC FUNCTION PANEL
Patient Name: Priya Patel   Patient ID: LAB-9921
Collection Date: 2026-08-25   Physician: Dr. Marcus Vance

Test Name                        Result   Unit   Reference Range   Interpretation
ALT (Alanine Aminotransferase)   58       U/L    7 - 56            HIGH [H]
AST (Aspartate Aminotransferase) 44       U/L    10 - 40           HIGH [H]
Alkaline Phosphatase             88       U/L    44 - 147          NORMAL
Total Bilirubin                  0.8      mg/dL  0.2 - 1.2         NORMAL
Serum Albumin                    4.1      g/dL   3.5 - 5.2         NORMAL
"""

LIPID_TEXT = """
COMPREHENSIVE LABORATORY SERVICES
Patient: Rajesh Kumar  DOB: 1975-03-10  Lab No: CLS-20260912
Specimen: Blood (fasting)  Collection: 2026-09-12

LIPID PROFILE RESULTS
Total Cholesterol    235  mg/dL   < 200     HIGH [H]
Triglycerides        185  mg/dL   < 150     HIGH [H]
HDL Cholesterol       42  mg/dL   > 50      LOW  [L]
LDL Cholesterol      156  mg/dL   < 100     HIGH [H]
"""

THYROID_TEXT = """
NATIONAL MEDICAL LABORATORY — THYROID FUNCTION TESTS
Patient Name: Ananya Sharma    Sample: Serum
Barcode: NMLB-2026-0834       Collected: 2026-10-01

Test              Result   Units     Reported Reference Range   Status
TSH               4.8      uIU/mL    0.4 - 4.0                  HIGH [H]
Free T4           0.9      ng/dL     0.8 - 1.8                  NORMAL
Free T3           2.5      pg/mL     2.3 - 4.2                  NORMAL
"""

HBA1C_TEXT = """
CLINICAL BIOCHEMISTRY — DIABETES MONITORING PANEL
Name: Patient Demo  Lab No: DB-2026-0455
Date: 2026-09-30

HbA1c (Glycated Hemoglobin)   7.4  %    < 5.7 (Normal)    HIGH
Fasting Glucose               126  mg/dL  70 - 99          HIGH [H]
"""

URINE_TEXT = """
URINE ROUTINE EXAMINATION
Patient: Test Patient   Specimen: Urine (midstream)
Date: 2026-09-20        Lab Accession: UR-20260920

Test             Result    Reference Range
Specific Gravity 1.025     1.010 - 1.030   Normal
Urine pH         6.0       4.5 - 8.0       Normal
Glucose          Negative  Negative        Normal
Protein          Trace     Negative        Abnormal
WBC              3-5/hpf   0-5/hpf         Normal
"""

# ─── Reject cases ─────────────────────────────────────────────────────────────

EMPTY = ""

VERY_SHORT = "Hello world"

SELFIE_EXIF = "JPEG image data, Exif Canon EOS R5 f/2.8 ISO 200 2026:09:01"

RESUME = """
John Doe
Software Engineer
Email: john@example.com  Phone: +1 555 123 4567

EXPERIENCE
Senior Developer, TechCorp (2020-2026)
  - Built REST APIs using FastAPI and Django
  - Managed AWS infrastructure

EDUCATION
B.Tech Computer Science, IIT Delhi (2016-2020)

SKILLS
Python, JavaScript, React, Docker, Kubernetes
"""

INVOICE = """
INVOICE #INV-2026-0042
Date: 2026-09-15
Bill To: Acme Corp, 123 Business Street

Item                    Qty   Unit Price   Total
Consulting Services      40   $150/hr      $6,000
Software License          1   $2,500       $2,500
Support (1 month)         1   $500         $500

Subtotal: $9,000
GST (18%): $1,620
Total Due: $10,620

Payment due in 30 days. Bank transfer preferred.
"""

CERTIFICATE = """
CERTIFICATE OF ACHIEVEMENT

This is to certify that

JANE SMITH

has successfully completed the course

"Advanced Machine Learning with Python"

Duration: 40 hours
Grade: Distinction

Issued by: Online Learning Institute
Date: September 2026
Director: Prof. Robert Brown
"""

NEWSPAPER = """
THE DAILY HERALD — SCIENCE & TECHNOLOGY

Researchers Discover New Treatment for Chronic Pain
Scientists at MIT have announced a breakthrough in pain management that could
transform how doctors treat chronic conditions. The study, published in Nature
Medicine, involved 500 patients over three years.

Meanwhile, the stock market closed higher on Friday, with tech stocks leading gains.
Apple rose 2.3% while Microsoft gained 1.8%. Analysts predict further growth.

Sports: Local team wins championship after dramatic overtime finish.
"""

BANK_STATEMENT = """
NATIONAL BANK
Account Statement — September 2026
Account: XXXX-XXXX-1234  Customer: John Doe

Date        Description                    Debit      Credit     Balance
2026-09-01  Opening Balance                                       $5,234.50
2026-09-03  Supermarket                    $45.20                 $5,189.30
2026-09-10  Salary Credit                             $3,500.00  $8,689.30
2026-09-15  Electricity Bill               $120.00               $8,569.30
2026-09-20  Restaurant                     $67.80                 $8,501.50
"""

FOOD_MENU = """
THE GRAND RESTAURANT
--- DINNER MENU ---

STARTERS
Soup of the Day          $8
Bruschetta               $10
Garlic Bread             $6

MAINS
Grilled Salmon          $28  (served with seasonal vegetables)
Chicken Parmigiana      $24
Pasta Primavera         $18

DESSERTS
Chocolate Fondant       $12
Gelato                  $8

All prices include tax. Allergen info available on request.
"""

RANDOM_TEXT = """
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
"""

CODE_SNIPPET = """
def calculate_bmi(weight_kg: float, height_m: float) -> float:
    if height_m <= 0:
        raise ValueError("Height must be positive")
    return weight_kg / (height_m ** 2)

class Patient:
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age
    
    def get_bmi(self, weight, height):
        return calculate_bmi(weight, height)

# Example usage
p = Patient("John", 30)
bmi = p.get_bmi(70, 1.75)
print(f"BMI: {bmi:.1f}")
"""

ONLY_BLOOD_WORD = """
I gave blood today at the local donation center.
The staff were friendly and professional.
It was a quick process — took about an hour in total.
I felt tired afterward but overall it was a positive experience.
Blood donation saves lives and I encourage everyone to try it.
"""

WEATHER = """
WEATHER FORECAST — NEW DELHI
Tuesday, October 2, 2026

Current: 34°C | Partly Cloudy
Humidity: 68% | Wind: 12 km/h NE

Hourly Forecast:
09:00  30°C  Sunny
12:00  35°C  Hot
15:00  33°C  Partly Cloudy
18:00  29°C  Clear
21:00  26°C  Cool

7-Day Outlook:
Thu: High 36°C, Low 24°C
Fri: High 33°C, Low 22°C — Rain expected
"""

# ─── Test matrix ──────────────────────────────────────────────────────────────

TEST_CASES = [
    # (text, should_pass, label)
    # SHOULD PASS
    (CBC_TEXT,       True,  "CBC Blood Report"),
    (LFT_TEXT,       True,  "Liver Function Test (LFT)"),
    (LIPID_TEXT,     True,  "Lipid Profile"),
    (THYROID_TEXT,   True,  "Thyroid Function Tests"),
    (HBA1C_TEXT,     True,  "HbA1c / Diabetes Panel"),
    (URINE_TEXT,     True,  "Urine Routine Examination"),

    # SHOULD REJECT
    (EMPTY,          False, "Empty text"),
    (VERY_SHORT,     False, "Very short / random text (< 30 chars)"),
    (SELFIE_EXIF,    False, "Camera EXIF metadata / selfie info"),
    (RESUME,         False, "Resume / CV"),
    (INVOICE,        False, "Invoice / bill"),
    (CERTIFICATE,    False, "Certificate of achievement"),
    (NEWSPAPER,      False, "Newspaper article"),
    (BANK_STATEMENT, False, "Bank statement"),
    (FOOD_MENU,      False, "Food / restaurant menu"),
    (RANDOM_TEXT,    False, "Lorem ipsum / random text"),
    (CODE_SNIPPET,   False, "Python code snippet"),
    (ONLY_BLOOD_WORD,False, "Text with word 'blood' only (not a report)"),
    (WEATHER,        False, "Weather forecast"),
]


def run_tests():
    print(f"\n{BOLD}{CYAN}═══════════════════════════════════════════════════════════{RESET}")
    print(f"{BOLD}{CYAN}  HealthForm AI — DocumentTypeValidator Test Suite{RESET}")
    print(f"{BOLD}{CYAN}  Threshold: {VALIDATION_THRESHOLD} / ~55.5 max possible score{RESET}")
    print(f"{BOLD}{CYAN}═══════════════════════════════════════════════════════════{RESET}\n")

    passed = 0
    failed = 0
    total  = len(TEST_CASES)

    header = f"{'#':<3}  {'Label':<42}  {'Expected':<8}  {'Got':<8}  {'Score':<7}  {'Code':<30}  {'Result'}"
    print(header)
    print("─" * len(header))

    for i, (text, expected, label) in enumerate(TEST_CASES, 1):
        result = DocumentTypeValidator.validate(text)
        got    = result.is_valid_report
        ok     = (got == expected)

        exp_str = f"{GREEN}PASS{RESET}" if expected else f"{RED}REJECT{RESET}"
        got_str = f"{GREEN}PASS{RESET}" if got       else f"{RED}REJECT{RESET}"
        score   = f"{result.total_score:.1f}"
        code    = result.rejection_code or "—"

        if ok:
            status_str = f"{GREEN}✓ CORRECT{RESET}"
            passed += 1
        else:
            status_str = f"{RED}✗ WRONG{RESET}"
            failed += 1

        print(f"{i:<3}  {label:<42}  {exp_str:<17}  {got_str:<17}  {score:<7}  {code:<30}  {status_str}")
        if not ok:
            print(f"     {YELLOW}→ rejection_reason: {result.rejection_reason[:80]}{RESET}")
            print(f"     {YELLOW}→ signals: {result.signals}{RESET}")

    print()
    print("─" * len(header))
    print(f"\n{BOLD}Results: {GREEN}{passed}/{total} passed{RESET}  {RED}{failed}/{total} failed{RESET}\n")

    if failed == 0:
        print(f"{GREEN}{BOLD}✅  ALL TESTS PASSED — DocumentTypeValidator is working correctly.{RESET}\n")
    else:
        print(f"{RED}{BOLD}❌  {failed} test(s) FAILED — review signal weights or thresholds.{RESET}\n")

    return failed == 0


if __name__ == "__main__":
    ok = run_tests()
    sys.exit(0 if ok else 1)

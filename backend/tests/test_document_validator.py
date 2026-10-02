import pytest
from app.services.document_type_validator import DocumentTypeValidator, VALIDATION_THRESHOLD

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

INVOICE_TEXT = """
VERTEX ENTERPRISE CLOUD CONSULTING LLC
Commercial IT & Cloud Infrastructure Services | Tax ID: 84-9921039
INVOICE: INV-2026-9041 | Date: October 1, 2026 | Due: Net 30
Billed Client: Apex Global Logistics Corp | Accounts Payable

Service Item                                   Hours    Rate        Total
Kubernetes Multi-Region Cluster Deployment      40 hrs   $175.00/hr  $7,000.00
PostgreSQL High-Availability Audit              16 hrs   $185.00/hr  $2,960.00
Enterprise Network Security Penetration Testing 24 hrs   $190.00/hr  $4,560.00
Terraform Infrastructure as Code Pipelines      20 hrs   $160.00/hr  $3,200.00
TOTAL DUE: $17,720.00
Please remit payment via ACH or Wire to Silicon Valley Bank, Routing: 121000358.
"""

RESUME_TEXT = """
Jane Doe — Senior Software Engineer
jane.doe@example.com | +1 (555) 234-5678 | San Francisco, CA
GitHub: github.com/janedoe | LinkedIn: linkedin.com/in/janedoe

EXPERIENCE
Lead Systems Engineer — CloudScale Technologies (2021 – Present)
- Designed and maintained multi-region distributed microservices in Go and Python.
- Reduced p99 latency by 35% through Redis caching and query indexing.

EDUCATION
B.S. in Computer Science — University of California, Berkeley (2017 – 2021)
"""

def test_validator_accepts_valid_cbc():
    result = DocumentTypeValidator.validate(CBC_TEXT)
    assert result.is_valid_report is True
    assert result.total_score >= VALIDATION_THRESHOLD
    assert result.document_type == "laboratory_report"

def test_validator_accepts_valid_lft():
    result = DocumentTypeValidator.validate(LFT_TEXT)
    assert result.is_valid_report is True
    assert result.total_score >= VALIDATION_THRESHOLD

def test_validator_rejects_empty():
    result = DocumentTypeValidator.validate("")
    assert result.is_valid_report is False
    assert result.rejection_code == "EMPTY_DOCUMENT"

def test_validator_rejects_invoice():
    result = DocumentTypeValidator.validate(INVOICE_TEXT)
    assert result.is_valid_report is False
    assert result.rejection_code in ("NOT_A_LAB_REPORT", "INSUFFICIENT_LAB_EVIDENCE")

def test_validator_rejects_resume():
    result = DocumentTypeValidator.validate(RESUME_TEXT)
    assert result.is_valid_report is False
    assert result.rejection_code in ("NOT_A_LAB_REPORT", "INSUFFICIENT_LAB_EVIDENCE")

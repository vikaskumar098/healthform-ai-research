"""
HealthForm AI — Synthetic Laboratory Report & Artifact Generator
Creates realistic synthetic medical test reports and invalid documents in both PDF and PNG format,
along with a standardized Ground Truth JSON manifest for automated evaluation.
All patient data is strictly fictional.
"""

import os
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─────────────────────────────────────────────────────────────────────────────
# Report Definitions
# ─────────────────────────────────────────────────────────────────────────────

REPORTS_DATA = [
    {
        "id": "report_1_normal_cbc",
        "title": "Complete Blood Count (CBC) Routine Panel",
        "doc_type": "laboratory_report",
        "expected_valid": True,
        "lab_name": "METROPOLITAN CLINICAL PATHOLOGY LABORATORIES",
        "lab_sub": "CLIA ID: 99D8881234 | CAP Accredited Clinical Laboratory",
        "patient": {
            "name": "Eleanor Vance",
            "id": "SYN-CBC-NORM-01",
            "age": "36",
            "sex": "Female",
            "date": "2026-10-01",
            "physician": "Dr. Marcus Sterling, MD"
        },
        "tests": [
            {
                "test_name": "Hemoglobin",
                "value": 14.6,
                "unit": "g/dL",
                "range_raw": "13.0 - 17.0",
                "range_low": 13.0,
                "range_high": 17.0,
                "expected_status": "within_reported_range",
                "flag": ""
            },
            {
                "test_name": "Hematocrit",
                "value": 42.0,
                "unit": "%",
                "range_raw": "37.0 - 48.0",
                "range_low": 37.0,
                "range_high": 48.0,
                "expected_status": "within_reported_range",
                "flag": ""
            },
            {
                "test_name": "WBC Count",
                "value": 7.5,
                "unit": "10^3/uL",
                "range_raw": "4.0 - 11.0",
                "range_low": 4.0,
                "range_high": 11.0,
                "expected_status": "within_reported_range",
                "flag": ""
            },
            {
                "test_name": "Platelets",
                "value": 250.0,
                "unit": "10^3/uL",
                "range_raw": "150 - 450",
                "range_low": 150.0,
                "range_high": 450.0,
                "expected_status": "within_reported_range",
                "flag": ""
            },
            {
                "test_name": "MCV",
                "value": 88.0,
                "unit": "fL",
                "range_raw": "80.0 - 100.0",
                "range_low": 80.0,
                "range_high": 100.0,
                "expected_status": "within_reported_range",
                "flag": ""
            }
        ]
    },
    {
        "id": "report_2_mixed_cbc",
        "title": "Complete Blood Count (CBC) Follow-up Evaluation",
        "doc_type": "laboratory_report",
        "expected_valid": True,
        "lab_name": "METROPOLITAN CLINICAL PATHOLOGY LABORATORIES",
        "lab_sub": "CLIA ID: 99D8881234 | CAP Accredited Clinical Laboratory",
        "patient": {
            "name": "Eleanor Vance",
            "id": "SYN-CBC-NORM-01",
            "age": "36",
            "sex": "Female",
            "date": "2026-10-15",
            "physician": "Dr. Marcus Sterling, MD"
        },
        "tests": [
            {
                "test_name": "Hemoglobin",
                "value": 11.2,
                "unit": "g/dL",
                "range_raw": "13.0 - 17.0",
                "range_low": 13.0,
                "range_high": 17.0,
                "expected_status": "below_reported_range",
                "flag": "L"
            },
            {
                "test_name": "Hematocrit",
                "value": 33.5,
                "unit": "%",
                "range_raw": "37.0 - 48.0",
                "range_low": 37.0,
                "range_high": 48.0,
                "expected_status": "below_reported_range",
                "flag": "L"
            },
            {
                "test_name": "WBC Count",
                "value": 7.5,
                "unit": "10^3/uL",
                "range_raw": "4.0 - 11.0",
                "range_low": 4.0,
                "range_high": 11.0,
                "expected_status": "within_reported_range",
                "flag": ""
            },
            {
                "test_name": "Platelets",
                "value": 500.0,
                "unit": "10^3/uL",
                "range_raw": "150 - 450",
                "range_low": 150.0,
                "range_high": 450.0,
                "expected_status": "above_reported_range",
                "flag": "H"
            },
            {
                "test_name": "MCV",
                "value": 84.0,
                "unit": "fL",
                "range_raw": "80.0 - 100.0",
                "range_low": 80.0,
                "range_high": 100.0,
                "expected_status": "within_reported_range",
                "flag": ""
            }
        ]
    },
    {
        "id": "report_3_lipid_profile",
        "title": "Cardiovascular Lipid Profile & Risk Index",
        "doc_type": "laboratory_report",
        "expected_valid": True,
        "lab_name": "BIOQUEST DIAGNOSTICS & CARDIOVASCULAR CENTER",
        "lab_sub": "Division of Biochemical Medicine | Lab Certification #BQD-2026-X",
        "patient": {
            "name": "David Chen",
            "id": "BQ-2026-LIP-771",
            "age": "52",
            "sex": "Male",
            "date": "2026-09-28",
            "physician": "Dr. Allison Becker, MD"
        },
        "tests": [
            {
                "test_name": "Total Cholesterol",
                "value": 245.0,
                "unit": "mg/dL",
                "range_raw": "< 200",
                "range_low": None,
                "range_high": 200.0,
                "expected_status": "above_reported_range",
                "flag": "H"
            },
            {
                "test_name": "Triglycerides",
                "value": 195.0,
                "unit": "mg/dL",
                "range_raw": "< 150",
                "range_low": None,
                "range_high": 150.0,
                "expected_status": "above_reported_range",
                "flag": "H"
            },
            {
                "test_name": "HDL Cholesterol",
                "value": 38.0,
                "unit": "mg/dL",
                "range_raw": "> 50",
                "range_low": 50.0,
                "range_high": None,
                "expected_status": "below_reported_range",
                "flag": "L"
            },
            {
                "test_name": "LDL Cholesterol",
                "value": 168.0,
                "unit": "mg/dL",
                "range_raw": "< 100",
                "range_low": None,
                "range_high": 100.0,
                "expected_status": "above_reported_range",
                "flag": "H"
            }
        ]
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# PDF Generation Functions
# ─────────────────────────────────────────────────────────────────────────────

def create_lab_report_pdf(rep: dict, out_pdf_path: str):
    """Generates a high-quality clinical laboratory report PDF using ReportLab."""
    doc = SimpleDocTemplate(
        out_pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()

    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )
    banner_style = ParagraphStyle(
        'BannerStyle',
        parent=styles['Normal'],
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#DC2626'),
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    sub_style = ParagraphStyle(
        'SubStyle',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#64748B')
    )
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Normal'],
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica-Bold'
    )
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0F172A')
    )
    cell_regular = ParagraphStyle(
        'CellRegular',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        fontName='Helvetica',
        textColor=colors.HexColor('#334155')
    )
    cell_high = ParagraphStyle(
        'CellHigh',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#DC2626')
    )
    cell_low = ParagraphStyle(
        'CellLow',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#D97706')
    )

    story = []

    # Research notice banner
    story.append(Paragraph(
        "*** SYNTHETIC RESEARCH DATASET — FOR DEMONSTRATION & BENCHMARKING ONLY — NOT A CLINICAL RECORD ***",
        banner_style
    ))
    story.append(Spacer(1, 6))

    # Laboratory Header
    story.append(Paragraph(rep["lab_name"], header_style))
    story.append(Paragraph(rep["lab_sub"], sub_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=2, spaceAfter=8))

    # Patient Metadata Table
    p = rep["patient"]
    patient_data = [
        [
            Paragraph(f"<b>Patient Name:</b> {p['name']}", cell_regular),
            Paragraph(f"<b>Patient ID:</b> {p['id']}", cell_regular),
            Paragraph(f"<b>Collection Date:</b> {p['date']}", cell_regular)
        ],
        [
            Paragraph(f"<b>Age / Sex:</b> {p['age']} yrs / {p['sex']}", cell_regular),
            Paragraph(f"<b>Physician:</b> {p['physician']}", cell_regular),
            Paragraph(f"<b>Report Date:</b> {p['date']}", cell_regular)
        ]
    ]
    p_table = Table(patient_data, colWidths=[200, 180, 160])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 12))

    # Section / Panel Title
    story.append(Paragraph(rep["title"], title_style))
    story.append(Spacer(1, 6))

    # Test Results Table
    # Headers
    headers = [
        Paragraph("<b>Test Name</b>", cell_bold),
        Paragraph("<b>Result</b>", cell_bold),
        Paragraph("<b>Units</b>", cell_bold),
        Paragraph("<b>Reported Reference Range</b>", cell_bold),
        Paragraph("<b>Flag</b>", cell_bold)
    ]
    table_rows = [headers]

    for t in rep["tests"]:
        val_str = f"{t['value']:.1f}" if isinstance(t['value'], float) and t['value'] % 1 != 0 else str(int(t['value']) if isinstance(t['value'], float) and t['value'] % 1 == 0 else t['value'])
        flag = t.get("flag", "")
        if flag == "H":
            flag_para = Paragraph("<b>HIGH [H]</b>", cell_high)
            val_para = Paragraph(f"<b>{val_str}</b>", cell_high)
        elif flag == "L":
            flag_para = Paragraph("<b>LOW [L]</b>", cell_low)
            val_para = Paragraph(f"<b>{val_str}</b>", cell_low)
        else:
            flag_para = Paragraph("NORMAL", cell_regular)
            val_para = Paragraph(val_str, cell_regular)

        row = [
            Paragraph(t["test_name"], cell_regular),
            val_para,
            Paragraph(t["unit"], cell_regular),
            Paragraph(t["range_raw"], cell_regular),
            flag_para
        ]
        table_rows.append(row)

    res_table = Table(table_rows, colWidths=[180, 80, 80, 140, 60])
    res_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
        ('TOPPADDING', (0, 0), (-1, 0), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(res_table)
    story.append(Spacer(1, 16))

    # Analytical Disclaimer / Clinical Notice
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#64748B'),
        alignment=TA_LEFT
    )
    story.append(Paragraph(
        "<b>LABORATORY ACCREDITATION & INTERPRETATION POLICY:</b><br/>"
        "Reference intervals are assay-specific and calibrated to the executing instrumentation core. "
        "Analytical values outside reported boundaries represent isolated laboratory measurements and "
        "do not alone establish clinical diagnoses. Medical decisions require clinical correlation by a "
        "licensed medical physician.",
        disclaimer_style
    ))

    doc.build(story)
    print(f"Generated PDF: {out_pdf_path}")


def create_invalid_invoice_pdf(out_pdf_path: str):
    """Generates an unrelated commercial invoice document (Report 4) with zero medical parameters."""
    doc = SimpleDocTemplate(
        out_pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()

    header_style = ParagraphStyle(
        'InvHeader',
        parent=styles['Normal'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica-Bold'
    )
    body_style = ParagraphStyle(
        'InvBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    story = [
        Paragraph("VERTEX ENTERPRISE CLOUD CONSULTING LLC", header_style),
        Paragraph("Commercial IT & Cloud Infrastructure Services | Tax ID: 84-9921039", body_style),
        Paragraph("100 Corporate Plaza Suite 400, Chicago, IL 60601 | accounts@vertexcloud.io", body_style),
        Spacer(1, 10),
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3B82F6'), spaceBefore=2, spaceAfter=10),
        Paragraph("<b>INVOICE & STATEMENT OF SERVICES</b>", ParagraphStyle('Sub', parent=header_style, fontSize=12)),
        Paragraph("<b>Invoice Number:</b> INV-2026-9041 | <b>Date:</b> October 1, 2026 | <b>Payment Terms:</b> Net 30", body_style),
        Paragraph("<b>Billed Client:</b> Apex Global Logistics Corp | Accounts Payable Dept.", body_style),
        Spacer(1, 12),
    ]

    items = [
        ["Item #", "Service Description", "Hours / Qty", "Rate (USD)", "Line Total"],
        ["SVC-101", "Kubernetes Multi-Region Cluster Architecture & Deployment", "40 hrs", "$175.00/hr", "$7,000.00"],
        ["SVC-102", "PostgreSQL High-Availability Replication Audit", "16 hrs", "$185.00/hr", "$2,960.00"],
        ["SVC-103", "Enterprise Network Security & Penetration Testing", "24 hrs", "$190.00/hr", "$4,560.00"],
        ["SVC-104", "Terraform Infrastructure as Code (IaC) Pipelines", "20 hrs", "$160.00/hr", "$3,200.00"],
        ["", "", "", "SUBTOTAL:", "$17,720.00"],
        ["", "", "", "TAX (0% B2B Services):", "$0.00"],
        ["", "", "", "TOTAL DUE:", "$17,720.00"]
    ]

    table_data = []
    for row in items:
        table_data.append([Paragraph(f"<b>{c}</b>" if "TOTAL" in row[3] or row == items[0] else c, body_style) for c in row])

    inv_table = Table(table_data, colWidths=[60, 240, 80, 80, 80])
    inv_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -4), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(inv_table)
    story.append(Spacer(1, 16))
    story.append(Paragraph(
        "<b>Remittance Instructions:</b> Please remit payment via ACH or Wire Transfer to Silicon Valley Bank, "
        "Routing: 121000358, Account: 99482019284. Thank you for your business!",
        body_style
    ))

    doc.build(story)
    print(f"Generated PDF: {out_pdf_path}")


def create_low_quality_blurry_pdf(out_pdf_path: str):
    """Generates a degraded, illegible document that lacks identifiable test results (Report 5)."""
    doc = SimpleDocTemplate(
        out_pdf_path,
        pagesize=letter,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )
    styles = getSampleStyleSheet()
    noise_style = ParagraphStyle(
        'Noise',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#94A3B8')
    )

    story = [
        Paragraph("SCAN ERROR — UNREADABLE ARTIFACT", ParagraphStyle('H', parent=styles['Normal'], fontSize=12, textColor=colors.HexColor('#64748B'))),
        Spacer(1, 10),
        Paragraph("--- [UNRECOGNIZED OPTICAL NOISE STREAM] ---", noise_style),
        Paragraph(".. :: :: ~~~~ ~~ ~~~ ?? ?? ## @@@ $$$ ^^^^ &&&&", noise_style),
        Paragraph("Image acquisition sensor timeout. Resolution 42 DPI. Contrast loss 94%.", noise_style),
        Paragraph("No distinct tabular structure or character boundaries detected.", noise_style),
        Spacer(1, 10),
        Paragraph("~~~ .. .. __ ___ ____ ~~~ ...", noise_style)
    ]
    doc.build(story)
    print(f"Generated PDF: {out_pdf_path}")


# ─────────────────────────────────────────────────────────────────────────────
# PNG Generation Functions (High-Fidelity Rendered Images)
# ─────────────────────────────────────────────────────────────────────────────

def create_lab_report_png(rep: dict, out_png_path: str):
    """Renders a clean, high-resolution PNG image mimicking a digitized laboratory report."""
    width, height = 1200, 1550
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Use default bitmap font
    font_large = ImageFont.load_default()
    font_bold = ImageFont.load_default()
    font_regular = ImageFont.load_default()

    # Draw Banner
    draw.rectangle([30, 20, width - 30, 45], fill="#FEF2F2", outline="#DC2626", width=1)
    draw.text((60, 26), "*** SYNTHETIC RESEARCH DATASET — FOR DEMONSTRATION & BENCHMARKING ONLY ***", fill="#DC2626")

    # Header
    draw.text((50, 60), rep["lab_name"], fill="#0F172A")
    draw.text((50, 85), rep["lab_sub"], fill="#64748B")
    draw.line([(50, 115), (width - 50, 115)], fill="#0284C7", width=3)

    # Patient Box
    draw.rectangle([50, 130, width - 50, 220], fill="#F8FAFC", outline="#CBD5E1", width=1)
    p = rep["patient"]
    draw.text((65, 145), f"Patient Name: {p['name']}", fill="#0F172A")
    draw.text((450, 145), f"Patient ID: {p['id']}", fill="#0F172A")
    draw.text((800, 145), f"Collection Date: {p['date']}", fill="#0F172A")

    draw.text((65, 180), f"Age / Sex: {p['age']} yrs / {p['sex']}", fill="#0F172A")
    draw.text((450, 180), f"Physician: {p['physician']}", fill="#0F172A")
    draw.text((800, 180), f"Report Date: {p['date']}", fill="#0F172A")

    # Panel Title
    draw.text((50, 245), rep["title"], fill="#1E293B")

    # Table Header
    y_start = 280
    draw.rectangle([50, y_start, width - 50, y_start + 35], fill="#0F172A")
    draw.text((65, y_start + 10), "Test Name", fill="#FFFFFF")
    draw.text((420, y_start + 10), "Result", fill="#FFFFFF")
    draw.text((560, y_start + 10), "Units", fill="#FFFFFF")
    draw.text((720, y_start + 10), "Reported Reference Range", fill="#FFFFFF")
    draw.text((1020, y_start + 10), "Flag", fill="#FFFFFF")

    # Table Rows
    curr_y = y_start + 35
    for idx, t in enumerate(rep["tests"]):
        row_bg = "#FFFFFF" if idx % 2 == 0 else "#F8FAFC"
        draw.rectangle([50, curr_y, width - 50, curr_y + 40], fill=row_bg, outline="#E2E8F0", width=1)

        val_str = f"{t['value']:.1f}" if isinstance(t['value'], float) and t['value'] % 1 != 0 else str(int(t['value']) if isinstance(t['value'], float) and t['value'] % 1 == 0 else t['value'])
        flag = t.get("flag", "")
        flag_text = "NORMAL"
        val_color = "#0F172A"
        flag_color = "#334155"

        if flag == "H":
            flag_text = "HIGH [H]"
            val_color = "#DC2626"
            flag_color = "#DC2626"
        elif flag == "L":
            flag_text = "LOW [L]"
            val_color = "#D97706"
            flag_color = "#D97706"

        draw.text((65, curr_y + 12), t["test_name"], fill="#0F172A")
        draw.text((420, curr_y + 12), val_str, fill=val_color)
        draw.text((560, curr_y + 12), t["unit"], fill="#334155")
        draw.text((720, curr_y + 12), t["range_raw"], fill="#334155")
        draw.text((1020, curr_y + 12), flag_text, fill=flag_color)

        curr_y += 40

    # Policy footer
    draw.text((50, curr_y + 40), "LABORATORY ACCREDITATION & INTERPRETATION POLICY:", fill="#475569")
    draw.text((50, curr_y + 60), "Reference intervals are assay-specific and calibrated to the executing instrumentation core.", fill="#64748B")
    draw.text((50, curr_y + 80), "Values outside reported bounds do not establish clinical diagnosis. Consult a licensed physician.", fill="#64748B")

    img.save(out_png_path, "PNG")
    print(f"Generated PNG: {out_png_path}")


def create_invalid_invoice_png(out_png_path: str):
    """Renders a commercial invoice PNG image (Report 4)."""
    width, height = 1200, 1500
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    draw.text((50, 50), "VERTEX ENTERPRISE CLOUD CONSULTING LLC", fill="#1E293B")
    draw.text((50, 80), "Commercial IT & Cloud Infrastructure Services | Tax ID: 84-9921039", fill="#64748B")
    draw.line([(50, 110), (width - 50, 110)], fill="#3B82F6", width=2)

    draw.text((50, 130), "INVOICE: INV-2026-9041 | Date: October 1, 2026 | Due: Net 30", fill="#0F172A")
    draw.text((50, 160), "Billed Client: Apex Global Logistics Corp | Accounts Payable", fill="#334155")

    y = 200
    draw.rectangle([50, y, width - 50, y + 35], fill="#1E293B")
    draw.text((65, y + 10), "Service Item", fill="#FFFFFF")
    draw.text((500, y + 10), "Hours", fill="#FFFFFF")
    draw.text((700, y + 10), "Rate", fill="#FFFFFF")
    draw.text((900, y + 10), "Total", fill="#FFFFFF")

    rows = [
        ("Kubernetes Multi-Region Cluster Deployment", "40 hrs", "$175.00/hr", "$7,000.00"),
        ("PostgreSQL High-Availability Audit", "16 hrs", "$185.00/hr", "$2,960.00"),
        ("Enterprise Network Security Penetration Testing", "24 hrs", "$190.00/hr", "$4,560.00"),
        ("Terraform Infrastructure as Code Pipelines", "20 hrs", "$160.00/hr", "$3,200.00"),
    ]
    curr_y = y + 35
    for item, hrs, rate, tot in rows:
        draw.rectangle([50, curr_y, width - 50, curr_y + 35], outline="#CBD5E1", width=1)
        draw.text((65, curr_y + 10), item, fill="#0F172A")
        draw.text((500, curr_y + 10), hrs, fill="#334155")
        draw.text((700, curr_y + 10), rate, fill="#334155")
        draw.text((900, curr_y + 10), tot, fill="#0F172A")
        curr_y += 35

    draw.text((700, curr_y + 20), "TOTAL DUE: $17,720.00", fill="#0F172A")
    draw.text((50, curr_y + 80), "Please remit payment via ACH or Wire to Silicon Valley Bank, Routing: 121000358.", fill="#64748B")

    img.save(out_png_path, "PNG")
    print(f"Generated PNG: {out_png_path}")


def create_low_quality_blurry_png(out_png_path: str):
    """Renders a severely degraded, low-resolution, blurred image (Report 5)."""
    width, height = 800, 1000
    img = Image.new("RGB", (width, height), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)

    for i in range(15):
        draw.line([(50, 100 + i * 40), (width - 50, 100 + i * 40)], fill=(200, 200, 200), width=15)

    draw.text((60, 80), "SCANNED DOCUMENT ARTIFACT - CORRUPTED SENSOR", fill=(100, 100, 100))
    # Apply severe Gaussian Blur to make text completely unreadable
    blurred = img.filter(ImageFilter.GaussianBlur(radius=14))
    blurred.save(out_png_path, "PNG")
    print(f"Generated PNG: {out_png_path}")


# ─────────────────────────────────────────────────────────────────────────────
# Ground Truth JSON Generator
# ─────────────────────────────────────────────────────────────────────────────

def generate_ground_truth_manifest(out_json_path: str):
    ground_truth = {
        "benchmark_suite": "HealthForm AI Real End-to-End Evaluation Matrix",
        "version": "1.0.0",
        "date_created": "2026-10-02",
        "reports": [
            {
                "report_id": "report_1_normal_cbc",
                "filename_pdf": "report_1_normal_cbc.pdf",
                "filename_png": "report_1_normal_cbc.png",
                "description": "Report 1 — Normal CBC (all values strictly within reported ranges)",
                "valid_report": True,
                "document_type": "laboratory_report",
                "patient": {
                    "name": "Eleanor Vance",
                    "id": "SYN-CBC-NORM-01",
                    "collection_date": "2026-10-01"
                },
                "expected_summary_counts": {
                    "total": 5,
                    "within": 5,
                    "below": 0,
                    "above": 0,
                    "unknown": 0
                },
                "parameters": [
                    {
                        "test_name": "Hemoglobin",
                        "value": 14.6,
                        "unit": "g/dL",
                        "reference_low": 13.0,
                        "reference_high": 17.0,
                        "expected_status": "within_reported_range"
                    },
                    {
                        "test_name": "Hematocrit",
                        "value": 42.0,
                        "unit": "%",
                        "reference_low": 37.0,
                        "reference_high": 48.0,
                        "expected_status": "within_reported_range"
                    },
                    {
                        "test_name": "WBC Count",
                        "value": 7.5,
                        "unit": "10^3/uL",
                        "reference_low": 4.0,
                        "reference_high": 11.0,
                        "expected_status": "within_reported_range"
                    },
                    {
                        "test_name": "Platelets",
                        "value": 250.0,
                        "unit": "10^3/uL",
                        "reference_low": 150.0,
                        "reference_high": 450.0,
                        "expected_status": "within_reported_range"
                    },
                    {
                        "test_name": "MCV",
                        "value": 88.0,
                        "unit": "fL",
                        "reference_low": 80.0,
                        "reference_high": 100.0,
                        "expected_status": "within_reported_range"
                    }
                ]
            },
            {
                "report_id": "report_2_mixed_cbc",
                "filename_pdf": "report_2_mixed_cbc.pdf",
                "filename_png": "report_2_mixed_cbc.png",
                "description": "Report 2 — Mixed CBC (below, within, and above range values)",
                "valid_report": True,
                "document_type": "laboratory_report",
                "patient": {
                    "name": "Eleanor Vance",
                    "id": "SYN-CBC-NORM-01",
                    "collection_date": "2026-10-15"
                },
                "expected_summary_counts": {
                    "total": 5,
                    "within": 2,
                    "below": 2,
                    "above": 1,
                    "unknown": 0
                },
                "parameters": [
                    {
                        "test_name": "Hemoglobin",
                        "value": 11.2,
                        "unit": "g/dL",
                        "reference_low": 13.0,
                        "reference_high": 17.0,
                        "expected_status": "below_reported_range"
                    },
                    {
                        "test_name": "Hematocrit",
                        "value": 33.5,
                        "unit": "%",
                        "reference_low": 37.0,
                        "reference_high": 48.0,
                        "expected_status": "below_reported_range"
                    },
                    {
                        "test_name": "WBC Count",
                        "value": 7.5,
                        "unit": "10^3/uL",
                        "reference_low": 4.0,
                        "reference_high": 11.0,
                        "expected_status": "within_reported_range"
                    },
                    {
                        "test_name": "Platelets",
                        "value": 500.0,
                        "unit": "10^3/uL",
                        "reference_low": 150.0,
                        "reference_high": 450.0,
                        "expected_status": "above_reported_range"
                    },
                    {
                        "test_name": "MCV",
                        "value": 84.0,
                        "unit": "fL",
                        "reference_low": 80.0,
                        "reference_high": 100.0,
                        "expected_status": "within_reported_range"
                    }
                ],
                "expected_deltas_vs_report_1": {
                    "Hemoglobin": {"prev": 14.6, "curr": 11.2, "abs_change": -3.4},
                    "Hematocrit": {"prev": 42.0, "curr": 33.5, "abs_change": -8.5},
                    "WBC Count": {"prev": 7.5, "curr": 7.5, "abs_change": 0.0},
                    "Platelets": {"prev": 250.0, "curr": 500.0, "abs_change": 250.0},
                    "MCV": {"prev": 88.0, "curr": 84.0, "abs_change": -4.0}
                }
            },
            {
                "report_id": "report_3_lipid_profile",
                "filename_pdf": "report_3_lipid_profile.pdf",
                "filename_png": "report_3_lipid_profile.png",
                "description": "Report 3 — Different Lab Format: Lipid Profile with inequality ranges (< and >)",
                "valid_report": True,
                "document_type": "laboratory_report",
                "patient": {
                    "name": "David Chen",
                    "id": "BQ-2026-LIP-771",
                    "collection_date": "2026-09-28"
                },
                "expected_summary_counts": {
                    "total": 4,
                    "within": 0,
                    "below": 1,
                    "above": 3,
                    "unknown": 0
                },
                "parameters": [
                    {
                        "test_name": "Total Cholesterol",
                        "value": 245.0,
                        "unit": "mg/dL",
                        "reference_low": None,
                        "reference_high": 200.0,
                        "expected_status": "above_reported_range"
                    },
                    {
                        "test_name": "Triglycerides",
                        "value": 195.0,
                        "unit": "mg/dL",
                        "reference_low": None,
                        "reference_high": 150.0,
                        "expected_status": "above_reported_range"
                    },
                    {
                        "test_name": "HDL Cholesterol",
                        "value": 38.0,
                        "unit": "mg/dL",
                        "reference_low": 50.0,
                        "reference_high": None,
                        "expected_status": "below_reported_range"
                    },
                    {
                        "test_name": "LDL Cholesterol",
                        "value": 168.0,
                        "unit": "mg/dL",
                        "reference_low": None,
                        "reference_high": 100.0,
                        "expected_status": "above_reported_range"
                    }
                ]
            },
            {
                "report_id": "report_4_invalid_invoice",
                "filename_pdf": "report_4_invalid_invoice.pdf",
                "filename_png": "report_4_invalid_invoice.png",
                "description": "Report 4 — Invalid Document: Enterprise Consulting Statement & Invoice",
                "valid_report": False,
                "document_type": "non_medical_document",
                "expected_http_status": 422,
                "expected_rejection_code": "NOT_A_LAB_REPORT",
                "expected_error": "INVALID_DOCUMENT",
                "llm_must_not_execute": True,
                "database_must_not_store": True,
                "parameters": []
            },
            {
                "report_id": "report_5_low_quality_blurry",
                "filename_pdf": "report_5_low_quality_blurry.pdf",
                "filename_png": "report_5_low_quality_blurry.png",
                "description": "Report 5 — Low Quality Document: Illegible blurred scan with zero extractable parameters",
                "valid_report": False,
                "document_type": "low_quality_or_corrupted",
                "expected_http_status": 422,
                "llm_must_not_execute": True,
                "database_must_not_store": True,
                "parameters": []
            }
        ]
    }

    with open(out_json_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, indent=2)
    print(f"Generated Ground Truth: {out_json_path}")


def main():
    print("Generating synthetic laboratory reports & test artifacts...")
    for rep in REPORTS_DATA:
        pdf_path = os.path.join(OUTPUT_DIR, f"{rep['id']}.pdf")
        png_path = os.path.join(OUTPUT_DIR, f"{rep['id']}.png")
        create_lab_report_pdf(rep, pdf_path)
        create_lab_report_png(rep, png_path)

    # Report 4: Invalid Invoice
    inv_pdf = os.path.join(OUTPUT_DIR, "report_4_invalid_invoice.pdf")
    inv_png = os.path.join(OUTPUT_DIR, "report_4_invalid_invoice.png")
    create_invalid_invoice_pdf(inv_pdf)
    create_invalid_invoice_png(inv_png)

    # Report 5: Low Quality / Blurry
    low_pdf = os.path.join(OUTPUT_DIR, "report_5_low_quality_blurry.pdf")
    low_png = os.path.join(OUTPUT_DIR, "report_5_low_quality_blurry.png")
    create_low_quality_blurry_pdf(low_pdf)
    create_low_quality_blurry_png(low_png)

    # Ground Truth Manifest
    gt_path = os.path.join(OUTPUT_DIR, "ground_truth_manifest.json")
    generate_ground_truth_manifest(gt_path)

    print("All artifacts generated successfully.")


if __name__ == "__main__":
    main()

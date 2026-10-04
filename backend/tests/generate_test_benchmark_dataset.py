"""
HealthForm AI — Benchmark Test Dataset Generator
=================================================
Generates the 12 comprehensive laboratory and invalid test reports required by
the architectural specification:

  REPORT 1:  Clean normal CBC PDF
  REPORT 2:  CBC with LOW values PDF
  REPORT 3:  CBC with HIGH values PDF
  REPORT 4:  Mixed normal + low + high PDF
  REPORT 5:  Slightly blurry photographed report (PNG)
  REPORT 6:  Blue-tinted / shadowed photographed report (PNG)
  REPORT 7:  Multi-page laboratory report PDF (2 pages: Hematology + Metabolic)
  REPORT 8:  Invalid certificate PDF
  REPORT 9:  Invalid resume PDF
  REPORT 10: Random non-medical image (PNG)
  REPORT 11: Blank PDF
  REPORT 12: Unreadable heavily degraded image (PNG)

Also generates ground_truth.json detailing expected parameters, reference ranges,
and deterministic status classifications.
"""

import os
import json
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

DATASET_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tests", "benchmark_dataset")
os.makedirs(DATASET_DIR, exist_ok=True)


def build_lab_pdf(pdf_path, header_title, patient_info, test_sections):
    """Builds a structured clinical laboratory report PDF with ReportLab."""
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_CENTER
    )
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    sec_style = ParagraphStyle(
        'SecHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1e40af'),
        spaceBefore=10,
        spaceAfter=6
    )

    story = []
    # Lab Header
    story.append(Paragraph("<b>METROPOLITAN CLINICAL PATHOLOGY LABORATORIES</b>", title_style))
    story.append(Paragraph("CLIA ID: 99D8881234 | CAP Accredited Clinical Laboratory", ParagraphStyle('Sub', parent=title_style, fontSize=9, textColor=colors.HexColor('#64748b'))))
    story.append(Spacer(1, 10))

    # Patient Metadata Table
    meta_data = [
        [
            Paragraph(f"<b>Patient Name:</b> {patient_info.get('name', 'N/A')}", meta_style),
            Paragraph(f"<b>Patient ID:</b> {patient_info.get('id', 'N/A')}", meta_style),
        ],
        [
            Paragraph(f"<b>Age / Sex:</b> {patient_info.get('age', 'N/A')} / {patient_info.get('sex', 'N/A')}", meta_style),
            Paragraph(f"<b>Collection Date:</b> {patient_info.get('date', '2026-10-01')}", meta_style),
        ],
        [
            Paragraph(f"<b>Physician:</b> {patient_info.get('physician', 'Dr. Marcus Sterling, MD')}", meta_style),
            Paragraph(f"<b>Examination:</b> {header_title}", meta_style),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    for sec_idx, sec in enumerate(test_sections):
        if sec.get("page_break_before"):
            story.append(PageBreak())
        story.append(Paragraph(f"<b>PANEL: {sec['name'].upper()}</b>", sec_style))
        
        table_rows = [["Test Name", "Result", "Units", "Reported Reference Range", "Flag"]]
        for r in sec['rows']:
            table_rows.append([
                Paragraph(f"<b>{r[0]}</b>", meta_style),
                Paragraph(str(r[1]), meta_style),
                Paragraph(str(r[2]), meta_style),
                Paragraph(str(r[3]), meta_style),
                Paragraph(str(r[4]), meta_style)
            ])

        t = Table(table_rows, colWidths=[180, 70, 75, 145, 70])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        story.append(t)
        story.append(Spacer(1, 10))

    story.append(Spacer(1, 15))
    story.append(Paragraph("<i>End of laboratory examination. Findings correlate with analytical instrumentation limits.</i>", ParagraphStyle('Foot', parent=meta_style, fontSize=8, textColor=colors.HexColor('#94a3b8'))))

    doc.build(story)


def generate_all():
    print(f"Generating benchmark test dataset in {DATASET_DIR}...")
    ground_truth = {}

    # REPORT 1: Clean normal CBC PDF
    p1 = os.path.join(DATASET_DIR, "report_01_clean_normal_cbc.pdf")
    build_lab_pdf(
        p1,
        "Complete Blood Count (CBC) Routine Panel",
        {"name": "Eleanor Vance", "id": "SYN-CBC-NORM-01", "age": "36 yrs", "sex": "Female", "date": "2026-10-01"},
        [
            {
                "name": "Complete Blood Count (CBC)",
                "rows": [
                    ["Hemoglobin", "14.6", "g/dL", "13.0 - 17.0", "NORMAL"],
                    ["Hematocrit", "42.0", "%", "37.0 - 48.0", "NORMAL"],
                    ["WBC Count", "7.5", "10^3/uL", "4.0 - 11.0", "NORMAL"],
                    ["Platelets", "250.0", "10^3/uL", "150 - 450", "NORMAL"],
                    ["MCV", "88.0", "fL", "80.0 - 100.0", "NORMAL"],
                ]
            }
        ]
    )
    ground_truth["report_01_clean_normal_cbc.pdf"] = {
        "is_valid_report": True,
        "document_type": "laboratory_report",
        "parameters": {
            "Hemoglobin": {"value": 14.6, "unit": "g/dL", "low": 13.0, "high": 17.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
            "Hematocrit": {"value": 42.0, "unit": "%", "low": 37.0, "high": 48.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
            "WBC Count": {"value": 7.5, "unit": "10^3/uL", "low": 4.0, "high": 11.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
            "Platelets": {"value": 250.0, "unit": "10^3/uL", "low": 150.0, "high": 450.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
            "MCV": {"value": 88.0, "unit": "fL", "low": 80.0, "high": 100.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
        }
    }

    # REPORT 2: CBC with LOW values
    p2 = os.path.join(DATASET_DIR, "report_02_cbc_low_values.pdf")
    build_lab_pdf(
        p2,
        "Complete Blood Count (CBC) Diagnostic Review",
        {"name": "Robert Miller", "id": "SYN-CBC-LOW-02", "age": "52 yrs", "sex": "Male", "date": "2026-10-02"},
        [
            {
                "name": "Complete Blood Count (CBC)",
                "rows": [
                    ["Hemoglobin", "11.2", "g/dL", "13.0 - 17.0", "LOW [L]"],
                    ["Hematocrit", "34.0", "%", "39.0 - 50.0", "LOW [L]"],
                    ["WBC Count", "7.0", "10^3/uL", "4.5 - 11.0", "NORMAL"],
                    ["Platelets", "125.0", "10^3/uL", "150 - 450", "LOW [L]"],
                ]
            }
        ]
    )
    ground_truth["report_02_cbc_low_values.pdf"] = {
        "is_valid_report": True,
        "document_type": "laboratory_report",
        "parameters": {
            "Hemoglobin": {"value": 11.2, "unit": "g/dL", "low": 13.0, "high": 17.0, "expected_status": "below_reported_range", "expected_display": "Below Range"},
            "Hematocrit": {"value": 34.0, "unit": "%", "low": 39.0, "high": 50.0, "expected_status": "below_reported_range", "expected_display": "Below Range"},
            "WBC Count": {"value": 7.0, "unit": "10^3/uL", "low": 4.5, "high": 11.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
            "Platelets": {"value": 125.0, "unit": "10^3/uL", "low": 150.0, "high": 450.0, "expected_status": "below_reported_range", "expected_display": "Below Range"},
        }
    }

    # REPORT 3: CBC with HIGH values
    p3 = os.path.join(DATASET_DIR, "report_03_cbc_high_values.pdf")
    build_lab_pdf(
        p3,
        "Blood & Metabolic Panel Analysis",
        {"name": "James Thornton", "id": "SYN-CBC-HIGH-03", "age": "48 yrs", "sex": "Male", "date": "2026-10-02"},
        [
            {
                "name": "Complete Blood Count & Metabolic",
                "rows": [
                    ["Hemoglobin", "18.2", "g/dL", "13.0 - 17.0", "HIGH [H]"],
                    ["WBC Count", "14.8", "10^3/uL", "4.0 - 11.0", "HIGH [H]"],
                    ["Fasting Glucose", "138.0", "mg/dL", "70 - 99", "HIGH [H]"],
                    ["Platelets", "280.0", "10^3/uL", "150 - 450", "NORMAL"],
                ]
            }
        ]
    )
    ground_truth["report_03_cbc_high_values.pdf"] = {
        "is_valid_report": True,
        "document_type": "laboratory_report",
        "parameters": {
            "Hemoglobin": {"value": 18.2, "unit": "g/dL", "low": 13.0, "high": 17.0, "expected_status": "above_reported_range", "expected_display": "Above Range"},
            "WBC Count": {"value": 14.8, "unit": "10^3/uL", "low": 4.0, "high": 11.0, "expected_status": "above_reported_range", "expected_display": "Above Range"},
            "Fasting Glucose": {"value": 138.0, "unit": "mg/dL", "low": 70.0, "high": 99.0, "expected_status": "above_reported_range", "expected_display": "Above Range"},
            "Platelets": {"value": 280.0, "unit": "10^3/uL", "low": 150.0, "high": 450.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
        }
    }

    # REPORT 4: Mixed normal + low + high
    p4 = os.path.join(DATASET_DIR, "report_04_mixed_normal_low_high.pdf")
    build_lab_pdf(
        p4,
        "Comprehensive Metabolic Examination",
        {"name": "Clara Oswald", "id": "SYN-MIX-04", "age": "29 yrs", "sex": "Female", "date": "2026-10-03"},
        [
            {
                "name": "Comprehensive Metabolic Panel (CMP)",
                "rows": [
                    ["Hemoglobin", "10.8", "g/dL", "12.0 - 16.0", "LOW [L]"],
                    ["Fasting Glucose", "124.0", "mg/dL", "70 - 99", "HIGH [H]"],
                    ["Serum Creatinine", "0.90", "mg/dL", "0.60 - 1.20", "NORMAL"],
                    ["Potassium", "4.2", "mEq/L", "3.5 - 5.0", "NORMAL"],
                    ["Total Cholesterol", "225.0", "mg/dL", "< 200", "HIGH [H]"],
                ]
            }
        ]
    )
    ground_truth["report_04_mixed_normal_low_high.pdf"] = {
        "is_valid_report": True,
        "document_type": "laboratory_report",
        "parameters": {
            "Hemoglobin": {"value": 10.8, "unit": "g/dL", "low": 12.0, "high": 16.0, "expected_status": "below_reported_range", "expected_display": "Below Range"},
            "Fasting Glucose": {"value": 124.0, "unit": "mg/dL", "low": 70.0, "high": 99.0, "expected_status": "above_reported_range", "expected_display": "Above Range"},
            "Serum Creatinine": {"value": 0.90, "unit": "mg/dL", "low": 0.60, "high": 1.20, "expected_status": "within_reported_range", "expected_display": "Normal"},
            "Potassium": {"value": 4.2, "unit": "mEq/L", "low": 3.5, "high": 5.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
            "Total Cholesterol": {"value": 225.0, "unit": "mg/dL", "low": None, "high": 200.0, "expected_status": "above_reported_range", "expected_display": "Above Range"},
        }
    }

    # REPORT 5: Slightly blurry photographed report (PNG)
    p5 = os.path.join(DATASET_DIR, "report_05_blurry_photo.png")
    img5 = np.ones((900, 700, 3), dtype=np.uint8) * 248
    cv2.putText(img5, "METROPOLITAN CLINICAL LABORATORY", (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 20, 20), 2)
    cv2.putText(img5, "Patient: John Doe | ID: SYN-BLUR-05", (40, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 60, 60), 1)
    cv2.putText(img5, "Complete Blood Count (CBC) Panel", (40, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (150, 40, 20), 2)
    cv2.putText(img5, "Test Name          Result   Units    Reference", (40, 175), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
    cv2.putText(img5, "Hemoglobin         11.2     g/dL     13.0 - 17.0", (40, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 1)
    cv2.putText(img5, "Hematocrit         34.0     %        39.0 - 50.0", (40, 255), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 1)
    cv2.putText(img5, "WBC Count          7.8      10^3/uL  4.5 - 11.0", (40, 295), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 1)
    cv2.putText(img5, "Platelets          245      10^3/uL  150 - 450", (40, 335), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 1)
    # Apply slight blur (kernel 5x5) to simulate camera out-of-focus
    blurred_img5 = cv2.GaussianBlur(img5, (5, 5), sigmaX=1.6)
    cv2.imwrite(p5, blurred_img5)
    ground_truth["report_05_blurry_photo.png"] = {
        "is_valid_report": True,
        "document_type": "laboratory_report",
        "parameters": {
            "Hemoglobin": {"value": 11.2, "unit": "g/dL", "low": 13.0, "high": 17.0, "expected_status": "below_reported_range", "expected_display": "Below Range"},
            "WBC Count": {"value": 7.8, "unit": "10^3/uL", "low": 4.5, "high": 11.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
        }
    }

    # REPORT 6: Blue-tinted / shadowed photographed report (PNG)
    p6 = os.path.join(DATASET_DIR, "report_06_blue_shadow_photo.png")
    img6 = np.ones((900, 700, 3), dtype=np.uint8) * 240
    # Add heavy blue color cast
    img6[:, :, 0] = np.clip(img6[:, :, 0].astype(np.int32) + 45, 0, 255).astype(np.uint8)  # Blue channel in BGR
    img6[:, :, 2] = np.clip(img6[:, :, 2].astype(np.int32) - 40, 0, 255).astype(np.uint8)  # Red channel reduced
    # Add gradient shadow from top-right to bottom-left
    for y in range(900):
        for x in range(700):
            factor = 1.0 - 0.35 * (x / 700.0)
            img6[y, x] = np.clip(img6[y, x].astype(np.float32) * factor, 0, 255).astype(np.uint8)

    cv2.putText(img6, "CLINICAL PATHOLOGY LABORATORY", (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 20, 50), 2)
    cv2.putText(img6, "Patient: Sarah Connor | SYN-TINT-06", (40, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (40, 40, 60), 1)
    cv2.putText(img6, "Complete Blood Count & Liver Panel", (40, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (30, 30, 80), 2)
    cv2.putText(img6, "Hemoglobin         14.2     g/dL     13.0 - 17.0", (40, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 40), 2)
    cv2.putText(img6, "WBC Count          6.8      10^3/uL  4.0 - 11.0", (40, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 40), 2)
    cv2.putText(img6, "Fasting Glucose    118.0    mg/dL    70 - 99", (40, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 40), 2)
    cv2.imwrite(p6, img6)
    ground_truth["report_06_blue_shadow_photo.png"] = {
        "is_valid_report": True,
        "document_type": "laboratory_report",
        "parameters": {
            "Hemoglobin": {"value": 14.2, "unit": "g/dL", "low": 13.0, "high": 17.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
            "Fasting Glucose": {"value": 118.0, "unit": "mg/dL", "low": 70.0, "high": 99.0, "expected_status": "above_reported_range", "expected_display": "Above Range"},
        }
    }

    # REPORT 7: Multi-page laboratory report (PDF, 2 pages)
    p7 = os.path.join(DATASET_DIR, "report_07_multipage_report.pdf")
    build_lab_pdf(
        p7,
        "Comprehensive Multi-Panel Health Examination",
        {"name": "Arthur Dent", "id": "SYN-MULTI-07", "age": "42 yrs", "sex": "Male", "date": "2026-10-03"},
        [
            {
                "name": "Complete Blood Count (Page 1)",
                "rows": [
                    ["Hemoglobin", "14.0", "g/dL", "13.0 - 17.0", "NORMAL"],
                    ["Hematocrit", "42.5", "%", "39.0 - 50.0", "NORMAL"],
                    ["WBC Count", "7.2", "10^3/uL", "4.0 - 11.0", "NORMAL"],
                ]
            },
            {
                "name": "Metabolic & Hepatic Profile (Page 2)",
                "page_break_before": True,
                "rows": [
                    ["Fasting Glucose", "92.0", "mg/dL", "70 - 99", "NORMAL"],
                    ["Serum Creatinine", "0.95", "mg/dL", "0.60 - 1.20", "NORMAL"],
                    ["ALT (Alanine Aminotransferase)", "65.0", "U/L", "7 - 56", "HIGH [H]"],
                    ["Total Bilirubin", "0.7", "mg/dL", "0.2 - 1.2", "NORMAL"],
                ]
            }
        ]
    )
    ground_truth["report_07_multipage_report.pdf"] = {
        "is_valid_report": True,
        "document_type": "laboratory_report",
        "page_count": 2,
        "parameters": {
            "Hemoglobin": {"value": 14.0, "unit": "g/dL", "low": 13.0, "high": 17.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
            "Fasting Glucose": {"value": 92.0, "unit": "mg/dL", "low": 70.0, "high": 99.0, "expected_status": "within_reported_range", "expected_display": "Normal"},
            "ALT (Alanine Aminotransferase)": {"value": 65.0, "unit": "U/L", "low": 7.0, "high": 56.0, "expected_status": "above_reported_range", "expected_display": "Above Range"},
        }
    }

    # REPORT 8: Invalid certificate (PDF)
    p8 = os.path.join(DATASET_DIR, "report_08_invalid_certificate.pdf")
    doc8 = SimpleDocTemplate(p8, pagesize=letter)
    st8 = getSampleStyleSheet()
    story8 = [
        Paragraph("<b>CERTIFICATE OF COMPLETION</b>", ParagraphStyle('C1', parent=st8['Heading1'], alignment=TA_CENTER, fontSize=22, spaceAfter=20)),
        Paragraph("This is to certify that", ParagraphStyle('C2', alignment=TA_CENTER, fontSize=14, spaceAfter=15)),
        Paragraph("<b>ALEXANDER SMITH</b>", ParagraphStyle('C3', alignment=TA_CENTER, fontSize=18, spaceAfter=15)),
        Paragraph("has successfully completed the professional training program in", ParagraphStyle('C4', alignment=TA_CENTER, fontSize=12, spaceAfter=10)),
        Paragraph("<b>Advanced Cybersecurity Architecture and Cloud Compliance</b>", ParagraphStyle('C5', alignment=TA_CENTER, fontSize=14, spaceAfter=30)),
        Paragraph("Awarded on October 4, 2026 | Certificate ID: CERT-883921-CS", ParagraphStyle('C6', alignment=TA_CENTER, fontSize=10, textColor=colors.HexColor('#64748b'))),
    ]
    doc8.build(story8)
    ground_truth["report_08_invalid_certificate.pdf"] = {
        "is_valid_report": False,
        "document_type": "certificate",
        "rejection_code": "NOT_A_LAB_REPORT"
    }

    # REPORT 9: Invalid resume (PDF)
    p9 = os.path.join(DATASET_DIR, "report_09_invalid_resume.pdf")
    doc9 = SimpleDocTemplate(p9, pagesize=letter)
    st9 = getSampleStyleSheet()
    story9 = [
        Paragraph("<b>SARAH JENKINS, Ph.D.</b>", ParagraphStyle('R1', parent=st9['Heading1'], fontSize=18)),
        Paragraph("Senior Principal Software Architect | Distributed Systems & AI Infrastructure", st9['Normal']),
        Spacer(1, 10),
        Paragraph("<b>WORK EXPERIENCE</b>", st9['Heading2']),
        Paragraph("<b>Staff Infrastructure Engineer</b> — Global Cloud Corp (2022 – Present)", st9['Normal']),
        Paragraph("Led architecture of petabyte-scale distributed database streaming pipelines.", st9['Normal']),
        Spacer(1, 10),
        Paragraph("<b>EDUCATION</b>", st9['Heading2']),
        Paragraph("Ph.D. Computer Science — Stanford University", st9['Normal']),
        Spacer(1, 10),
        Paragraph("<b>TECHNICAL SKILLS</b>", st9['Heading2']),
        Paragraph("Python, Go, Rust, Kubernetes, Distributed consensus, Vector indexing.", st9['Normal']),
    ]
    doc9.build(story9)
    ground_truth["report_09_invalid_resume.pdf"] = {
        "is_valid_report": False,
        "document_type": "resume",
        "rejection_code": "NOT_A_LAB_REPORT"
    }

    # REPORT 10: Random non-medical image (PNG)
    p10 = os.path.join(DATASET_DIR, "report_10_random_image.png")
    img10 = np.zeros((600, 600, 3), dtype=np.uint8)
    # Generate abstract gradient / geometry
    for y in range(600):
        for x in range(600):
            img10[y, x] = [int(128 + 127 * np.sin(x / 50.0)), int(128 + 127 * np.cos(y / 50.0)), int((x + y) % 255)]
    cv2.putText(img10, "Abstract Graphic Wallpaper", (120, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
    cv2.imwrite(p10, img10)
    ground_truth["report_10_random_image.png"] = {
        "is_valid_report": False,
        "document_type": "other",
        "rejection_code": "NOT_A_LAB_REPORT"
    }

    # REPORT 11: Blank PDF
    p11 = os.path.join(DATASET_DIR, "report_11_blank.pdf")
    doc11 = SimpleDocTemplate(p11, pagesize=letter)
    doc11.build([Spacer(1, 10)])
    ground_truth["report_11_blank.pdf"] = {
        "is_valid_report": False,
        "document_type": "unknown",
        "rejection_code": "EMPTY_DOCUMENT"
    }

    # REPORT 12: Unreadable heavily degraded image (PNG)
    p12 = os.path.join(DATASET_DIR, "report_12_unreadable_noise.png")
    # Low resolution, high noise, very dark
    noise = np.random.normal(30, 10, (200, 200, 3)).astype(np.uint8)
    cv2.imwrite(p12, noise)
    ground_truth["report_12_unreadable_noise.png"] = {
        "is_valid_report": False,
        "document_type": "unreadable_document",
        "rejection_code": "UNREADABLE_IMAGE"
    }

    gt_file = os.path.join(DATASET_DIR, "ground_truth.json")
    with open(gt_file, "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, indent=2)

    print(f"Generated 12 benchmark reports and ground truth in {DATASET_DIR}")


if __name__ == "__main__":
    generate_all()

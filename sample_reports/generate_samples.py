"""
Synthetic Laboratory Report Generator
Generates realistic PDF and PNG test laboratory reports for HealthForm AI research and demo.
All data is strictly synthetic and labeled for research/educational use.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

REPORTS = [
    {
        "id": "sample_report_1_cbc_cmp",
        "title": "Comprehensive Blood & Metabolic Examination",
        "patient": {
            "name": "DEMO PATIENT A (SYNTHETIC)",
            "id": "SYN-2026-0810-A",
            "age": "42",
            "sex": "Male",
            "date": "2026-08-10",
            "physician": "Dr. Sarah Jenkins, MD (Demo)"
        },
        "sections": [
            {
                "name": "Complete Blood Count (CBC)",
                "rows": [
                    ["Hemoglobin", "11.2", "g/dL", "13.0 - 17.0", "L", "98%"],
                    ["Hematocrit", "34.0", "%", "39.0 - 50.0", "L", "97%"],
                    ["WBC Count", "7.8", "10^3/uL", "4.5 - 11.0", "", "99%"],
                    ["Platelets", "245", "10^3/uL", "150 - 450", "", "98%"],
                    ["MCV", "84.5", "fL", "80.0 - 100.0", "", "96%"],
                    ["MCH", "28.1", "pg", "27.0 - 33.0", "", "95%"]
                ]
            },
            {
                "name": "Comprehensive Metabolic Panel (CMP)",
                "rows": [
                    ["Fasting Glucose", "118", "mg/dL", "70 - 99", "H", "99%"],
                    ["Blood Urea Nitrogen", "16.0", "mg/dL", "7.0 - 20.0", "", "97%"],
                    ["Serum Creatinine", "0.95", "mg/dL", "0.60 - 1.20", "", "98%"],
                    ["Sodium", "141", "mEq/L", "135 - 145", "", "99%"],
                    ["Potassium", "4.3", "mEq/L", "3.5 - 5.0", "", "98%"],
                    ["Calcium", "9.4", "mg/dL", "8.5 - 10.2", "", "96%"]
                ]
            }
        ]
    },
    {
        "id": "sample_report_2_lipid_lft",
        "title": "Lipid Profile & Hepatic Function Panel",
        "patient": {
            "name": "DEMO PATIENT B (SYNTHETIC)",
            "id": "SYN-2026-0825-B",
            "age": "55",
            "sex": "Female",
            "date": "2026-08-25",
            "physician": "Dr. Marcus Vance, MD (Demo)"
        },
        "sections": [
            {
                "name": "Lipid Profile",
                "rows": [
                    ["Total Cholesterol", "235", "mg/dL", "< 200", "H", "99%"],
                    ["Triglycerides", "185", "mg/dL", "< 150", "H", "98%"],
                    ["HDL Cholesterol", "42", "mg/dL", "> 50", "L", "97%"],
                    ["LDL Cholesterol", "156", "mg/dL", "< 100", "H", "98%"]
                ]
            },
            {
                "name": "Hepatic Function Panel",
                "rows": [
                    ["ALT (Alanine Aminotransferase)", "58", "U/L", "7 - 56", "H", "97%"],
                    ["AST (Aspartate Aminotransferase)", "44", "U/L", "10 - 40", "H", "96%"],
                    ["Alkaline Phosphatase", "88", "U/L", "44 - 147", "", "98%"],
                    ["Total Bilirubin", "0.8", "mg/dL", "0.2 - 1.2", "", "97%"],
                    ["Serum Albumin", "4.1", "g/dL", "3.5 - 5.2", "", "99%"]
                ]
            }
        ]
    },
    {
        "id": "sample_report_3_followup_cbc",
        "title": "Follow-up Hematology & Metabolic Review",
        "patient": {
            "name": "DEMO PATIENT A (SYNTHETIC)",
            "id": "SYN-2026-0810-A",
            "age": "42",
            "sex": "Male",
            "date": "2026-09-18",
            "physician": "Dr. Sarah Jenkins, MD (Demo)"
        },
        "sections": [
            {
                "name": "Complete Blood Count (Follow-up)",
                "rows": [
                    ["Hemoglobin", "11.6", "g/dL", "13.0 - 17.0", "L", "98%"],
                    ["Hematocrit", "35.5", "%", "39.0 - 50.0", "L", "98%"],
                    ["WBC Count", "7.2", "10^3/uL", "4.5 - 11.0", "", "99%"],
                    ["Platelets", "250", "10^3/uL", "150 - 450", "", "98%"],
                    ["MCV", "85.2", "fL", "80.0 - 100.0", "", "97%"]
                ]
            },
            {
                "name": "Metabolic Follow-up Panel",
                "rows": [
                    ["Fasting Glucose", "106", "mg/dL", "70 - 99", "H", "99%"],
                    ["Blood Urea Nitrogen", "15.0", "mg/dL", "7.0 - 20.0", "", "97%"],
                    ["Serum Creatinine", "0.92", "mg/dL", "0.60 - 1.20", "", "98%"]
                ]
            }
        ]
    }
]

def generate_pdf(rep_data, filename):
    doc = SimpleDocTemplate(
        filename,
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
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#DC2626'),
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    sub_style = ParagraphStyle(
        'SubStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569')
    )
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica-Bold'
    )

    story = []

    # Research Banner
    story.append(Paragraph("*** SYNTHETIC DATASET — STRICTLY FOR RESEARCH & DEMO USE ONLY — NOT A CLINICAL RECORD ***", banner_style))
    story.append(Spacer(1, 8))

    # Lab Header
    story.append(Paragraph("APEX PATHOLOGY & CLINICAL RESEARCH LABORATORIES", header_style))
    story.append(Paragraph("CLIA Accreditation: #99D9999999 | ISO 15189 Certified Pathology Core", sub_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F172A'), spaceBefore=2, spaceAfter=8))

    # Patient Details Table
    p = rep_data["patient"]
    p_data = [
        [Paragraph(f"<b>Patient Name:</b> {p['name']}", sub_style), Paragraph(f"<b>MRN / ID:</b> {p['id']}", sub_style)],
        [Paragraph(f"<b>Age / Sex:</b> {p['age']} yrs / {p['sex']}", sub_style), Paragraph(f"<b>Collection Date:</b> {p['date']}", sub_style)],
        [Paragraph(f"<b>Referring Physician:</b> {p['physician']}", sub_style), Paragraph(f"<b>Report Title:</b> {rep_data['title']}", sub_style)]
    ]
    p_table = Table(p_data, colWidths=[270, 270])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 14))

    # Sections & Tables
    for section in rep_data["sections"]:
        story.append(Paragraph(section["name"], section_style))
        story.append(Spacer(1, 4))
        
        table_rows = [["Test Name", "Result", "Units", "Reported Reference Range", "Flag"]]
        for r in section["rows"]:
            flag_text = r[4]
            flag_display = flag_text
            table_rows.append([r[0], r[1], r[2], r[3], flag_display])

        t = Table(table_rows, colWidths=[200, 75, 75, 140, 50])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0F172A')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8.5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
            ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))

    # Footer
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#94A3B8'), spaceBefore=8, spaceAfter=6))
    story.append(Paragraph("<b>Notice:</b> Reference ranges printed are calibrated to this laboratory's automated analyzers. HealthForm AI parses parameters against these printed ranges for explainable academic evaluation. This system does not diagnose.", sub_style))

    doc.build(story)
    print(f"Generated PDF: {filename}")


def generate_png(rep_data, filename):
    # Generates a realistic high-resolution laboratory report image
    width, height = 1200, 1600
    img = Image.new('RGB', (width, height), color='#FFFFFF')
    draw = ImageDraw.Draw(img)

    # Use default PIL font with scaled layout
    # Draw top banner
    draw.rectangle([0, 0, width, 36], fill='#FEE2E2')
    draw.text((250, 10), "SYNTHETIC RESEARCH DATASET — FOR DEMONSTRATION & BENCHMARKING ONLY", fill='#DC2626')

    # Lab Header
    draw.text((50, 60), "APEX PATHOLOGY & CLINICAL RESEARCH LABORATORIES", fill='#0F172A')
    draw.text((50, 85), "Accreditation: CLIA #99D9999999 | Automated Analytical Core", fill='#64748B')
    draw.line([(50, 115), (width - 50, 115)], fill='#0F172A', width=2)

    # Patient Box
    draw.rectangle([50, 130, width - 50, 230], outline='#CBD5E1', fill='#F8FAFC', width=1)
    p = rep_data["patient"]
    draw.text((70, 145), f"Patient Name: {p['name']}", fill='#0F172A')
    draw.text((650, 145), f"Patient ID: {p['id']}", fill='#0F172A')
    draw.text((70, 175), f"Age / Sex: {p['age']} yrs / {p['sex']}", fill='#0F172A')
    draw.text((650, 175), f"Collection Date: {p['date']}", fill='#0F172A')
    draw.text((70, 205), f"Physician: {p['physician']}", fill='#0F172A')
    draw.text((650, 205), f"Exam: {rep_data['title']}", fill='#0F172A')

    curr_y = 260
    for section in rep_data["sections"]:
        draw.text((50, curr_y), f"PANEL: {section['name'].upper()}", fill='#1E293B')
        curr_y += 25

        # Table header
        draw.rectangle([50, curr_y, width - 50, curr_y + 30], fill='#E2E8F0')
        draw.text((70, curr_y + 8), "Test Name", fill='#0F172A')
        draw.text((450, curr_y + 8), "Result", fill='#0F172A')
        draw.text((600, curr_y + 8), "Units", fill='#0F172A')
        draw.text((750, curr_y + 8), "Reported Reference Range", fill='#0F172A')
        draw.text((1050, curr_y + 8), "Flag", fill='#0F172A')
        curr_y += 32

        for r in section["rows"]:
            draw.line([(50, curr_y), (width - 50, curr_y)], fill='#F1F5F9', width=1)
            draw.text((70, curr_y + 8), r[0], fill='#1E293B')
            draw.text((450, curr_y + 8), r[1], fill='#0F172A')
            draw.text((600, curr_y + 8), r[2], fill='#475569')
            draw.text((750, curr_y + 8), r[3], fill='#334155')
            
            flag = r[4]
            if flag == 'L':
                draw.text((1055, curr_y + 8), "LOW [L]", fill='#2563EB')
            elif flag == 'H':
                draw.text((1055, curr_y + 8), "HIGH [H]", fill='#DC2626')
            else:
                draw.text((1055, curr_y + 8), "NORMAL", fill='#16A34A')

            curr_y += 32
        curr_y += 25

    # Footer
    draw.line([(50, height - 120), (width - 50, height - 120)], fill='#94A3B8', width=1)
    draw.text((50, height - 100), "Safety Notice: HealthForm AI parses values against the explicitly reported reference range above.", fill='#64748B')
    draw.text((50, height - 80), "This synthetic report is created solely for research benchmarks and technical validation.", fill='#64748B')

    img.save(filename)
    print(f"Generated PNG: {filename}")


if __name__ == "__main__":
    for rep in REPORTS:
        pdf_path = os.path.join(OUTPUT_DIR, f"{rep['id']}.pdf")
        png_path = os.path.join(OUTPUT_DIR, f"{rep['id']}.png")
        generate_pdf(rep, pdf_path)
        generate_png(rep, png_path)
    print("All synthetic laboratory reports generated successfully!")

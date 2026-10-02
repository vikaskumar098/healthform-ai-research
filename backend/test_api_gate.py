import urllib.request
import urllib.error
import mimetypes
import uuid
import json

def upload_file_bytes(filename, content_bytes, content_type="text/plain"):
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8"))
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.extend(content_bytes)
    body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))
    
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/reports/upload",
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, err_body

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io

def create_pdf(text_lines):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    y = 750
    for line in text_lines:
        c.drawString(50, y, line)
        y -= 25
    c.save()
    return buffer.getvalue()

# Test 1: Upload an invoice PDF (Non-medical document)
invoice_lines = [
    "ACME CONSULTING SERVICES LLC - INVOICE",
    "Invoice Number: INV-2026-9041",
    "Date: October 1, 2026",
    "Bill To: Global Tech Enterprises",
    "Item 1: Cloud Architecture Consulting - $3,500.00",
    "Item 2: Security Assessment - $2,200.00",
    "Subtotal: $5,700.00",
    "Total Due: $5,700.00",
    "Thank you for your business!"
]
invoice_pdf = create_pdf(invoice_lines)
status_code, resp = upload_file_bytes("invoice.pdf", invoice_pdf, "application/pdf")
print("Invoice PDF Upload Test:")
print(f"Status Code: {status_code} (Expected 422)")
print(f"Response: {resp}\n")

# Test 2: Upload a Resume PDF (Non-medical document)
resume_lines = [
    "Alex Morgan - Senior Frontend Architect",
    "Email: alex.morgan@example.com | San Francisco, CA",
    "Experience: Lead UI Engineer at Stripe (2021-2025)",
    "Skills: React, TypeScript, Next.js, WebGL, Performance Optimization",
    "Education: B.S. in Computer Science, Stanford University",
    "Publications and Patents in User Experience Architecture"
]
resume_pdf = create_pdf(resume_lines)
status_code, resp = upload_file_bytes("resume.pdf", resume_pdf, "application/pdf")
print("Resume PDF Upload Test:")
print(f"Status Code: {status_code} (Expected 422)")
print(f"Response: {resp}\n")

# Test 3: Upload a real sample report via load-sample API
req = urllib.request.Request(
    "http://127.0.0.1:8000/api/reports/load-sample/1",
    data=b"",
    method="POST"
)
try:
    with urllib.request.urlopen(req) as resp:
        print("Sample CBC Test:")
        print(f"Status Code: {resp.status} (Expected 200)")
        data = json.loads(resp.read().decode("utf-8"))
        print(f"Report ID: {data.get('id')}, Patient: {data.get('patient_name')}")
        print(f"Extracted Params: {len(data.get('parameters', []))}")
        print(f"Summary: {data.get('patient_friendly_summary', '')[:100]}...")
except urllib.error.HTTPError as e:
    print(f"Sample CBC Test Failed: {e.code} {e.read().decode('utf-8')}")

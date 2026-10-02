"""
HealthForm AI — Comprehensive Real End-to-End Test Suite
Executes real HTTP requests against the running application stack, validates all pipeline
stages against Ground Truth, identifies defects, measures performance, and logs results.
"""

import os
import sys
import time
import json
import uuid
import httpx
from datetime import datetime

BACKEND_URL = "http://127.0.0.1:8000"
TEST_REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_reports"))
GROUND_TRUTH_FILE = os.path.join(TEST_REPORTS_DIR, "ground_truth_manifest.json")

class TestSuiteRunner:
    def __init__(self):
        self.client = httpx.Client(base_url=BACKEND_URL, timeout=60.0)
        self.auth_token = None
        self.user_info = None
        self.results = {
            "test_run": datetime.now().isoformat(),
            "environment": {
                "backend_url": BACKEND_URL,
                "mongodb": "Connected (localhost:27017)",
                "ai_mode": "DEMO_MODE (Deterministic Grounded Engine)",
            },
            "reports_tested": [],
            "api_tests": [],
            "extraction_tests": [],
            "classification_tests": [],
            "llm_tests": [],
            "security_tests": [],
            "performance_metrics": {},
            "failed_tests": [],
            "passed_tests": []
        }
        with open(GROUND_TRUTH_FILE, "r", encoding="utf-8") as f:
            self.ground_truth = json.load(f)

    def log(self, msg, status="INFO"):
        prefix = f"[{status}]"
        print(f"{prefix:8s} {msg}")

    def authenticate(self):
        """Authenticates with the backend and obtains a valid JWT token."""
        self.log("Authenticating via /api/auth/demo-login...")
        start = time.perf_counter()
        resp = self.client.post("/api/auth/demo-login")
        duration = round((time.perf_counter() - start) * 1000, 2)
        assert resp.status_code == 200, f"Auth failed: {resp.text}"
        data = resp.json()
        self.auth_token = data["access_token"]
        self.user_info = data["user"]
        self.client.headers.update({"Authorization": f"Bearer {self.auth_token}"})
        self.results["api_tests"].append({
            "endpoint": "/api/auth/demo-login",
            "method": "POST",
            "status_code": resp.status_code,
            "duration_ms": duration,
            "result": "PASS"
        })
        self.log(f"Authenticated as {self.user_info['full_name']} ({self.user_info['email']}) in {duration}ms")

    def test_file_validation_security(self):
        """Tests file extension, MIME type, empty file, and size limits (STEP 4 & STEP 17)."""
        self.log("--- Testing File Upload Validation & Security Gates ---")

        # 1. Unsupported extension (.exe)
        files = {"file": ("malicious.exe", b"MZ\x90\x00executable", "application/octet-stream")}
        resp = self.client.post("/api/reports/upload", files=files)
        passed = (resp.status_code == 400 and "Unsupported file type" in resp.text)
        self.record_test("Security Gate: Disallow .exe upload", passed, {
            "status_code": resp.status_code, "response": resp.json() if resp.status_code == 400 else resp.text
        })

        # 2. Unsupported extension (.txt)
        files = {"file": ("notes.txt", b"Patient feels fine today", "text/plain")}
        resp = self.client.post("/api/reports/upload", files=files)
        passed = (resp.status_code == 400)
        self.record_test("Security Gate: Disallow .txt upload", passed, {
            "status_code": resp.status_code, "response": resp.text
        })

        # 3. Empty file
        files = {"file": ("empty.pdf", b"", "application/pdf")}
        resp = self.client.post("/api/reports/upload", files=files)
        passed = (resp.status_code == 400 and "empty" in resp.text.lower())
        self.record_test("Security Gate: Disallow empty file", passed, {
            "status_code": resp.status_code, "response": resp.text
        })

        # 4. MIME type mismatch / spoofing
        files = {"file": ("spoofed.pdf", b"fake binary", "application/x-msdownload")}
        resp = self.client.post("/api/reports/upload", files=files)
        passed = (resp.status_code == 400)
        self.record_test("Security Gate: Disallow invalid MIME type", passed, {
            "status_code": resp.status_code, "response": resp.text
        })

    def upload_and_process_file(self, filename: str, content_type: str = "application/pdf"):
        """Performs actual multipart upload to /api/reports/upload and returns result dict."""
        file_path = os.path.join(TEST_REPORTS_DIR, filename)
        assert os.path.exists(file_path), f"File {file_path} does not exist"
        with open(file_path, "rb") as f:
            content = f.read()

        files = {"file": (filename, content, content_type)}
        start = time.perf_counter()
        resp = self.client.post("/api/reports/upload", files=files)
        duration = round((time.perf_counter() - start) * 1000, 2)
        try:
            body = resp.json()
        except Exception:
            body = resp.text

        self.results["api_tests"].append({
            "endpoint": "/api/reports/upload",
            "file": filename,
            "method": "POST",
            "status_code": resp.status_code,
            "duration_ms": duration,
            "result": "PASS" if resp.status_code in (200, 422) else "FAIL"
        })
        return resp.status_code, body, duration

    def test_report_1_normal_cbc(self):
        """Runs end-to-end evaluation for Report 1 — Normal CBC (PDF and PNG)."""
        self.log("--- Testing REPORT 1: Normal CBC (All Values Within Reported Range) ---")
        gt = next(r for r in self.ground_truth["reports"] if r["report_id"] == "report_1_normal_cbc")

        # 1. PDF Upload
        status, body, duration = self.upload_and_process_file(gt["filename_pdf"])
        self.results["performance_metrics"]["report_1_pdf_duration_ms"] = duration

        doc_valid = (status == 200 and body.get("processing_status") == "completed")
        self.record_test("Report 1 PDF: Pipeline Success (HTTP 200)", doc_valid, {"status": status})

        if not doc_valid:
            self.log(f"Report 1 PDF failed: {body}", "ERROR")
            return

        report_id = body.get("id")
        params = body.get("parameters", [])
        self.log(f"Report 1 uploaded successfully (ID: {report_id}, Extracted {len(params)} parameters)")

        # Verify Ground Truth vs Actual Extraction
        self.verify_extracted_parameters("Report 1 PDF", gt["parameters"], params)

        # Verify Range Classifications (All must be within_reported_range)
        all_within = all(p.get("status") == "within_reported_range" for p in params)
        self.record_test("Report 1 PDF: All Parameters Within Reported Range", all_within, {
            "statuses": {p.get("test_name"): p.get("status") for p in params}
        })

        # Verify LLM Explanation
        analysis = body.get("analysis", {})
        self.verify_llm_analysis("Report 1 PDF", analysis, expected_abnormal=False)

        # Verify Database Retrieval
        db_resp = self.client.get(f"/api/reports/{report_id}")
        db_pass = (db_resp.status_code == 200 and db_resp.json().get("id") == report_id)
        self.record_test("Report 1 PDF: Database Persistence & Retrieval", db_pass, {"status": db_resp.status_code})

        # 2. PNG Upload (STEP 14: PDF + Image Testing)
        self.log("Testing Report 1 PNG Image Upload (STEP 14)...")
        status_img, body_img, duration_img = self.upload_and_process_file(gt["filename_png"], "image/png")
        self.results["performance_metrics"]["report_1_png_duration_ms"] = duration_img
        img_success = (status_img == 200)
        self.record_test("Report 1 PNG: Image Upload & OCR Processing", img_success, {
            "status": status_img, "duration_ms": duration_img
        })

        if img_success:
            img_params = body_img.get("parameters", [])
            self.log(f"Report 1 PNG extracted {len(img_params)} parameters")
            # Verify equivalent extraction
            eq_count = (len(img_params) == len(params))
            self.record_test("Report 1: PDF vs PNG Extraction Equivalence", eq_count, {
                "pdf_count": len(params), "png_count": len(img_params)
            })

    def test_report_2_mixed_cbc(self):
        """Runs end-to-end evaluation for Report 2 — Mixed CBC (Classification Test)."""
        self.log("--- Testing REPORT 2: Mixed CBC (Below, Within, and Above Values) ---")
        gt = next(r for r in self.ground_truth["reports"] if r["report_id"] == "report_2_mixed_cbc")

        status, body, duration = self.upload_and_process_file(gt["filename_pdf"])
        self.results["performance_metrics"]["report_2_pdf_duration_ms"] = duration
        doc_valid = (status == 200 and body.get("processing_status") == "completed")
        self.record_test("Report 2 PDF: Pipeline Success (HTTP 200)", doc_valid, {"status": status})

        if not doc_valid:
            self.log(f"Report 2 PDF failed: {body}", "ERROR")
            return

        report_id = body.get("id")
        params = body.get("parameters", [])
        self.log(f"Report 2 uploaded successfully (ID: {report_id}, Extracted {len(params)} parameters)")

        # Verify Ground Truth vs Actual Extraction
        self.verify_extracted_parameters("Report 2 PDF", gt["parameters"], params)

        # Verify Specific Classifications
        expected_classifications = {
            "Hemoglobin": "below_reported_range",
            "Hematocrit": "below_reported_range",
            "WBC Count": "within_reported_range",
            "Platelets": "above_reported_range",
            "MCV": "within_reported_range"
        }
        actual_classifications = {p["test_name"]: p["status"] for p in params}

        for test_name, exp_st in expected_classifications.items():
            act_st = actual_classifications.get(test_name)
            is_match = (act_st == exp_st)
            self.record_test(
                f"Report 2 Classification: {test_name} (Expected: {exp_st})",
                is_match,
                {"expected": exp_st, "actual": act_st}
            )

        # Verify LLM Explanation for mixed findings
        analysis = body.get("analysis", {})
        self.verify_llm_analysis("Report 2 PDF", analysis, expected_abnormal=True)

        return report_id

    def test_historical_comparison(self, rep1_id: str, rep2_id: str):
        """Tests historical comparison delta calculation between Report 1 and Report 2 (STEP 15)."""
        self.log("--- Testing STEP 15: Historical Comparison Delta ---")
        start = time.perf_counter()
        resp = self.client.post("/api/comparison", json={"report_ids": [rep1_id, rep2_id]})
        duration = round((time.perf_counter() - start) * 1000, 2)
        self.results["performance_metrics"]["historical_comparison_duration_ms"] = duration

        passed = (resp.status_code == 200)
        self.record_test("Historical Comparison API (HTTP 200)", passed, {"status": resp.status_code, "duration_ms": duration})

        if passed:
            data = resp.json()
            deltas = {d["test_name"]: d for d in data.get("parameters", [])}

            # Ground truth deltas:
            # Hemoglobin: 14.6 -> 11.2 (change: -3.4)
            hgb = deltas.get("Hemoglobin", {})
            hgb_match = (hgb.get("previous_value") == 14.6 and hgb.get("current_value") == 11.2 and round(hgb.get("absolute_change"), 1) == -3.4)
            self.record_test("Historical Delta: Hemoglobin (-3.4 g/dL)", hgb_match, hgb)

            # Platelets: 250 -> 500 (change: +250)
            plt = deltas.get("Platelets", {})
            plt_match = (plt.get("previous_value") == 250.0 and plt.get("current_value") == 500.0 and plt.get("absolute_change") == 250.0)
            self.record_test("Historical Delta: Platelets (+250 10^3/uL)", plt_match, plt)

            # Verify Neutral Observation (no clinical diagnosis or labeling as cured / health improved)
            neutral_obs = data.get("neutral_observation", "")
            neutral_check = ("cured" not in neutral_obs.lower() and "health improved" not in neutral_obs.lower() and "worsened" not in neutral_obs.lower())
            self.record_test("Historical Comparison: Strictly Neutral Mathematical Output", neutral_check, {
                "observation": neutral_obs
            })

    def test_report_3_different_lab_format(self):
        """Runs end-to-end evaluation for Report 3 — Different Lab Format (Lipid Profile)."""
        self.log("--- Testing REPORT 3: Different Lab Format (Lipid Profile) ---")
        gt = next(r for r in self.ground_truth["reports"] if r["report_id"] == "report_3_lipid_profile")

        status, body, duration = self.upload_and_process_file(gt["filename_pdf"])
        self.results["performance_metrics"]["report_3_pdf_duration_ms"] = duration
        doc_valid = (status == 200 and body.get("processing_status") == "completed")
        self.record_test("Report 3 PDF: Pipeline Success (HTTP 200)", doc_valid, {"status": status})

        if not doc_valid:
            self.log(f"Report 3 PDF failed: {body}", "ERROR")
            return

        report_id = body.get("id")
        params = body.get("parameters", [])
        self.log(f"Report 3 uploaded successfully (ID: {report_id}, Extracted {len(params)} parameters)")

        # Verify Ground Truth vs Actual Extraction
        self.verify_extracted_parameters("Report 3 PDF", gt["parameters"], params)

        # Expected counts: 4 parameters (Total Cholesterol, Triglycerides, HDL, LDL)
        count_match = (len(params) == len(gt["parameters"]))
        self.record_test("Report 3: Extracted All 4 Lipid Analytes", count_match, {
            "expected_count": len(gt["parameters"]),
            "actual_count": len(params),
            "actual_names": [p["test_name"] for p in params]
        })

    def test_report_4_invalid_document(self):
        """Runs end-to-end evaluation for Report 4 — Invalid Document (STEP 16 & STEP 17)."""
        self.log("--- Testing REPORT 4: Invalid Document (Commercial Invoice) ---")
        gt = next(r for r in self.ground_truth["reports"] if r["report_id"] == "report_4_invalid_invoice")

        status, body, duration = self.upload_and_process_file(gt["filename_pdf"])
        self.results["performance_metrics"]["report_4_pdf_duration_ms"] = duration

        # Gate 1: HTTP Status must be 422 Unprocessable Entity
        is_422 = (status == 422)
        self.record_test("Report 4: Server-Side Rejection (HTTP 422)", is_422, {"status": status, "response": body})

        # Gate 2: Error code is INVALID_DOCUMENT
        detail = body.get("detail", {}) if isinstance(body, dict) else {}
        err_code = detail.get("error") == "INVALID_DOCUMENT"
        self.record_test("Report 4: Error Code is INVALID_DOCUMENT", err_code, {"detail": detail})

        # Gate 3: is_valid_report is False
        is_valid_flag = (detail.get("is_valid_report") is False)
        self.record_test("Report 4: is_valid_report is FALSE", is_valid_flag, {"detail": detail})

        # Gate 4: Safe user message shown
        user_msg = detail.get("message", "")
        has_safe_msg = ("upload" in user_msg.lower() and "lab" in user_msg.lower())
        self.record_test("Report 4: User-Facing Safe Rejection Message", has_safe_msg, {"message": user_msg})

        # Gate 5: CRITICAL — Check that the report was NOT saved in database as an analyzed medical report
        reports_list = self.client.get("/api/reports").json()
        saved_names = [r.get("filename") for r in reports_list]
        not_saved = (gt["filename_pdf"] not in saved_names)
        self.record_test("Report 4: CRITICAL — Document NOT Saved in Analyzed Reports DB", not_saved, {
            "db_reports_count": len(reports_list),
            "saved_filenames": saved_names
        })

    def test_report_5_low_quality_blurry(self):
        """Runs evaluation for Report 5 — Low Quality / Blurry Document."""
        self.log("--- Testing REPORT 5: Low Quality / Blurry Document ---")
        gt = next(r for r in self.ground_truth["reports"] if r["report_id"] == "report_5_low_quality_blurry")

        status, body, duration = self.upload_and_process_file(gt["filename_pdf"])
        self.results["performance_metrics"]["report_5_pdf_duration_ms"] = duration

        # Must reject or not invent parameters
        rejected = (status == 422)
        self.record_test("Report 5: Low-Quality Document Rejection (HTTP 422)", rejected, {
            "status": status, "response": body
        })

    def test_user_isolation_security(self):
        """Verifies that User A cannot view User B's reports (STEP 8 / Security)."""
        self.log("--- Testing Multi-Tenant Data Isolation ---")
        # 1. Register User B
        user_b_email = f"user_b_{uuid.uuid4().hex[:6]}@example.com"
        reg_resp = self.client.post("/api/auth/register", json={
            "email": user_b_email,
            "password": "Password123!",
            "full_name": "Test User B"
        })
        assert reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"
        user_b_token = reg_resp.json()["access_token"]

        # 2. Get User A's reports
        user_a_reports = self.client.get("/api/reports").json()
        if not user_a_reports:
            self.log("No reports in User A account to test isolation", "WARN")
            return

        target_report_id = user_a_reports[0]["id"]

        # 3. Attempt to access User A's report using User B's token
        headers_b = {"Authorization": f"Bearer {user_b_token}"}
        cross_resp = self.client.get(f"/api/reports/{target_report_id}", headers=headers_b)
        isolation_passed = (cross_resp.status_code == 403)
        self.record_test("Security Gate: Cross-User Report Access Blocked (HTTP 403)", isolation_passed, {
            "status": cross_resp.status_code, "response": cross_resp.text
        })

    def verify_extracted_parameters(self, label: str, gt_params: list, act_params: list):
        """Compares extracted parameters against ground truth."""
        act_dict = {p["test_name"]: p for p in act_params}

        for gt_p in gt_params:
            t_name = gt_p["test_name"]
            if t_name not in act_dict:
                self.record_test(f"{label}: Extraction of '{t_name}'", False, {
                    "error": "Parameter missing from extracted results",
                    "ground_truth": gt_p
                })
                continue

            act_p = act_dict[t_name]

            # 1. Numeric Value Accuracy
            val_match = (act_p.get("value") == gt_p.get("value"))
            self.record_test(f"{label}: Value accuracy '{t_name}' ({gt_p['value']})", val_match, {
                "ground_truth": gt_p["value"], "actual": act_p.get("value")
            })

            # 2. Unit Accuracy
            unit_match = (act_p.get("unit") == gt_p.get("unit"))
            self.record_test(f"{label}: Unit accuracy '{t_name}' ({gt_p['unit']})", unit_match, {
                "ground_truth": gt_p["unit"], "actual": act_p.get("unit")
            })

            # 3. Range Classification Accuracy
            status_match = (act_p.get("status") == gt_p.get("expected_status"))
            self.record_test(f"{label}: Range status '{t_name}' ({gt_p['expected_status']})", status_match, {
                "ground_truth": gt_p["expected_status"], "actual": act_p.get("status")
            })

    def verify_llm_analysis(self, label: str, analysis: dict, expected_abnormal: bool):
        """Verifies safety, non-diagnostic constraints, and claim verification."""
        summary = analysis.get("summary", "")
        explanation = analysis.get("explanation", "")
        claims = analysis.get("claims", [])

        # Constraint 1: Must not provide clinical diagnosis
        diag_terms = ["you are diagnosed with", "prescribe", "take medication", "urgent surgery", "has acute disease"]
        has_diag = any(t in explanation.lower() for t in diag_terms)
        self.record_test(f"{label} LLM: Non-Diagnostic Safety Constraint", not has_diag, {
            "has_diagnostic_prescriptions": has_diag
        })

        # Constraint 2: Contains structured claims
        has_claims = (len(claims) > 0)
        self.record_test(f"{label} LLM: Generates Structured Atomic Claims", has_claims, {
            "claim_count": len(claims)
        })

        # Constraint 3: Claim verification engine processed claims
        all_verified = all(c.get("verification_status") in ("SUPPORTED", "PARTIALLY_SUPPORTED", "UNSUPPORTED") for c in claims)
        self.record_test(f"{label} LLM: Claim Verification Engine Status Assignment", all_verified, {
            "claims_summary": [{"claim": c["claim"][:50], "status": c["verification_status"]} for c in claims[:3]]
        })

    def record_test(self, test_name: str, passed: bool, details: dict):
        status = "PASS" if passed else "FAIL"
        entry = {
            "test_name": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if passed:
            self.results["passed_tests"].append(entry)
            self.log(f"PASS: {test_name}", "PASS")
        else:
            self.results["failed_tests"].append(entry)
            self.log(f"FAIL: {test_name} — Details: {details}", "FAIL")

    def run_all(self):
        self.log("=================================================================")
        self.log(" STARTING HEALTHFORM AI REAL END-TO-END VALIDATION SUITE        ")
        self.log("=================================================================")

        # Step 1: Auth
        self.authenticate()

        # Step 2: File Validation & Security
        self.test_file_validation_security()

        # Step 3: Report 1 (Normal CBC)
        self.test_report_1_normal_cbc()

        # Step 4: Report 2 (Mixed CBC)
        rep2_id = self.test_report_2_mixed_cbc()

        # Step 5: Historical Comparison (Report 1 vs Report 2)
        # Fetch report 1 id from user list
        rep_list = self.client.get("/api/reports").json()
        rep1_id = next((r["id"] for r in rep_list if "report_1" in r.get("filename", "")), None)
        if rep1_id and rep2_id:
            self.test_historical_comparison(rep1_id, rep2_id)

        # Step 6: Report 3 (Different Lab Format)
        self.test_report_3_different_lab_format()

        # Step 7: Report 4 (Invalid Document)
        self.test_report_4_invalid_document()

        # Step 8: Report 5 (Low Quality Scan)
        self.test_report_5_low_quality_blurry()

        # Step 9: Multi-tenant Isolation Security
        self.test_user_isolation_security()

        # Print Summary
        total = len(self.results["passed_tests"]) + len(self.results["failed_tests"])
        passed = len(self.results["passed_tests"])
        failed = len(self.results["failed_tests"])

        self.log("=================================================================")
        self.log(f" TEST RUN COMPLETE: {passed}/{total} PASSED, {failed}/{total} FAILED")
        self.log("=================================================================")

        # Save initial results
        out_path = os.path.join(os.path.dirname(__file__), "initial_e2e_results.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(self.results, f, indent=2)
        self.log(f"Initial results saved to {out_path}")
        return self.results

if __name__ == "__main__":
    runner = TestSuiteRunner()
    runner.run_all()

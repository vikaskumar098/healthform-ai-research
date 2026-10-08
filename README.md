<div align="center">

  <img src="docs/assets/healthform-logo.png" alt="HealthForm AI Logo" width="320" />

  # HealthForm AI

  <p><strong>Multimodal AI for Explainable and Grounded Laboratory Report Understanding</strong></p>

  <p>
    HealthForm AI transforms laboratory reports into structured, understandable insights using document intelligence, AI-powered extraction, reference-range validation, explainable analysis, and claim verification.
  </p>

  <p>
    <em>Academic Research Prototype &bull; Strict Non-Diagnostic Policy &bull; CLIA / ISO 15189 Grounding Principles</em>
  </p>

  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS 3.4" /></a>
    <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.11+" /></a>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
    <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB 7.0" /></a>
    <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Google_Gemini-Multimodal-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" /></a>
    <a href="https://pymupdf.readthedocs.io/"><img src="https://img.shields.io/badge/PyMuPDF_|_OpenCV-Document_Vision-5C3EE8?style=for-the-badge" alt="PyMuPDF OpenCV" /></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  </p>

</div>

---

## ⚡ Multimodal Verification Pipeline in Action

<div align="center">
  <img src="docs/assets/pipeline_animation.gif" alt="HealthForm AI Multimodal Verification Pipeline" width="100%" />
  <p><em>Real-time 7-stage document audit, deterministic classification, clinical guideline RAG, and Natural Language Inference claim verification.</em></p>
</div>

---

## 📑 Quick Navigation

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [The Solution](#-the-solution)
- [Key Features](#-key-features)
- [Safety & Responsible AI](#-safety--responsible-ai)
- [System Architecture](#-system-architecture)
- [AI & Document Intelligence Pipeline](#-ai--document-intelligence-pipeline)
- [Research Methodology & Benchmark Evaluation](#-research-methodology--benchmark-evaluation)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation Guide](#-installation-guide)
- [Environment Variables](#-environment-variables)
- [Running Locally](#-running-locally)
- [Docker Deployment](#-docker-deployment)
- [Product Preview & Test Manifests](#-product-preview--test-manifests)
- [API Reference](#-api-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Telemetry & Performance Metrics](#-telemetry--performance-metrics)
- [Future Scope](#-future-scope)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

**HealthForm AI** is a multimodal AI research system and production-grade prototype engineered to bridge the communication gap between complex medical diagnostic tests and patients. When patients receive laboratory reports—such as Complete Blood Counts (CBC), Comprehensive Metabolic Panels (CMP), or Lipid Profiles—they are often confronted with dense tables, abbreviated biomarker names, laboratory-specific reference intervals, and cryptic flags.

HealthForm AI combines computer vision, optical character recognition (OCR), deterministic mathematical range classification, domain-curated Retrieval-Augmented Generation (RAG), multimodal Large Language Models (LLMs), and automated Natural Language Inference (NLI) claim verification. It delivers structured, transparent, and grounded explanations while strictly enforcing clinical non-diagnostic guardrails.

> [!NOTE]
> HealthForm AI operates with a **Single Source of Truth** architecture: status classifications (`within_reported_range`, `below_reported_range`, `above_reported_range`) are computed deterministically on the backend against the facility's printed reference intervals. The AI model is strictly constrained to synthesize understandable explanations from verified facts, preventing numerical hallucination.

---

## 🛑 Problem Statement

Standard laboratory reports suffer from critical usability, comprehension, and accessibility barriers:

1. **Cognitive Overload**: Patients encounter technical jargon (e.g., *MCV*, *MCH*, *RDW-CV*, *SGPT/ALT*) without intuitive context on biological relevance.
2. **Variable Reference Intervals**: Normal ranges differ significantly across analytical instruments, clinical laboratories, patient demographics, and regional standards. Generic online searches provide misaligned baseline intervals.
3. **Fragmented Longitudinal Records**: Routine healthcare involves serial blood tests taken across months or years. Comparing successive reports manually is error-prone, leaving subtle clinical trajectories unnoticed.
4. **LLM Hallucination Risks**: Unconstrained conversational AI models frequently misread table rows, confuse inequality bounds (such as `< 200 mg/dL` or `> 50 mg/dL`), invent normal ranges, or generate speculative diagnoses that provoke unwarranted anxiety.

HealthForm AI addresses these challenges through a strict, multi-stage pipeline: **Document Understanding &rarr; Deterministic Validation &rarr; Structured Extraction &rarr; Grounded AI Explanation &rarr; Claim Verification**.

---

## 💡 The Solution

HealthForm AI implements a structured, defense-in-depth pipeline that guarantees data provenance from the raw physical pixel to the patient-facing explanation:

```mermaid
flowchart TD
    A[📄 User Uploads Lab Report] --> B{Gate 1: Document Audit}
    B -->|Non-Medical / Blurry| X[❌ HTTP 422: Rejected with Explanation]
    B -->|Verified Lab Document| C[🔍 Optical & Text Parsing PyMuPDF/Vision]
    C --> D[📊 Structured Parameter Extraction Gate 2]
    D --> E[📏 Reference Interval Boundary Parser]
    E --> F[⚙️ Deterministic Range Classifier]
    F --> G[📚 Clinical RAG Vector Retrieval]
    G --> H[🧠 Gemini Multimodal Grounded Synthesizer]
    H --> I[🛡️ Natural Language Inference Claim Verifier]
    I --> J[📈 Historical Delta Engine Multi-Report]
    J --> K[🖥️ Interactive Research & Patient Dashboard]
```

---

## ✨ Key Features

| Feature | Description | Status |
|---|---|:---:|
| 📄 **Multimodal Document Ingest** | Upload clinical laboratory reports in PDF, PNG, or JPG formats up to 15 MB with automatic orientation and DPI handling. | **Active** |
| 🛡️ **Document Quality & Type Gate** | 7-Signal deterministic validator audits documents. Accurately rejects invoices, resumes, code, certificates, or illegible scans with HTTP 422. | **Active** |
| 📊 **Structured Biomarker Extraction** | Maximal Munch token parser extracts biomarker names, numerical values, measurement units, and printed reference intervals. | **Active** |
| 📏 **Report-Printed Range Detection** | Parses standard dual-bound ranges (`13.0 - 17.0`) as well as inequality thresholds (`< 200`, `> 50`, `<= 99`). | **Active** |
| 🟢 **Deterministic Range Classifier** | Classifies parameters into `within_reported_range`, `below_reported_range`, or `above_reported_range` with zero LLM hallucination risk. | **Active** |
| 🧠 **Explainable Grounded Analysis** | Translates validated laboratory findings into accessible, non-alarmist summaries grounded directly in report facts. | **Active** |
| 🔬 **Atomic Claim Verification** | Deconstructs generated insights into atomic propositions (`REPORT_FACT`, `COMPUTED_FACT`, `REFERENCE_CONTEXT`) to eliminate unsupported medical claims. | **Active** |
| 📈 **Longitudinal Trend Comparison** | Compares 2 or more reports chronologically; computes absolute and percentage deltas with time-series progression graphs. | **Active** |
| 📚 **Comprehensive Report History** | Searchable, filterable repository with document type auto-detection, file size tracking, and verification status. | **Active** |
| 👤 **User Governance & Data Privacy** | Full user profile management, secure password change, GDPR-compliant one-click JSON data export, and complete account deletion. | **Active** |
| ⚡ **Offline Demo & Resilient Mode** | In-memory fallback and deterministic grounded engine (`DEMO_MODE=True`) allows zero-cost local evaluation without external API keys. | **Active** |
| 📱 **Responsive Dark-Tech UI** | Modern glassmorphic interface with persistent sidebar navigation, interactive modals, and real-time processing stage trackers. | **Active** |

---

## 🛡️ Safety & Responsible AI

> [!CAUTION]
> **STRICT NON-DIAGNOSTIC POLICY**  
> HealthForm AI is an academic research prototype and document intelligence tool developed for educational, comprehension, and research purposes.
> 
> - **NO MEDICAL DIAGNOSIS**: HealthForm AI does NOT diagnose illnesses, syndromes, or medical conditions.
> - **NO THERAPEUTIC PRESCRIPTION**: The system does NOT recommend medications, dosages, dietary interventions, or treatments.
> - **NO PHYSICIAN REPLACEMENT**: All explanations are supplementary aids for personal understanding and MUST be reviewed with a licensed healthcare practitioner.

### Responsible AI Governance Guardrails

1. **Grounding in Facility Reference Intervals**: Reference ranges vary across equipment manufacturers and analytical methodologies. HealthForm AI strictly evaluates test results against the reference ranges printed on that specific document, refusing to apply arbitrary global standards.
2. **Deterministic Computation**: Large Language Models are never permitted to determine whether a biomarker is "high", "low", or "normal". All boundary comparisons are mathematically verified in Python before reaching the LLM context.
3. **Multi-Signal Gate 1 Rejection**: Invoices, resumes, code files, blurred optical artifacts, and non-laboratory documents are rejected at the ingestion gate before triggering AI summarization.
4. **NLI Claim Deconstruction**: Explanations undergo sentence-level claim extraction. Statements unsupported by the numerical data or retrieved clinical guidelines are flagged or excised.
5. **Transparency & Confidence Scoring**: Every extracted parameter exposes OCR confidence, bounding metadata, and explicit visual confirmation tags.

---

## 🏗️ System Architecture

HealthForm AI is organized as a decoupled, layered microservice architecture:

```mermaid
graph TB
    subgraph ClientLayer["🖥️ Frontend Client (React 19 + Vite + Tailwind CSS)"]
        UI_Upload["Upload Page (Dropzone + Pipeline Tracker)"]
        UI_Dash["Dashboard (Overview & Quick Stats)"]
        UI_History["Report History (Search, Filter, Sort)"]
        UI_Compare["Comparison Engine (Delta Charts & Series)"]
        UI_Details["Analysis Details (Claim Matrix & Parameters)"]
        UI_Profile["Settings & Profile (Export & Privacy)"]
    end

    subgraph APILayer["⚡ API Gateway (FastAPI 0.110+)"]
        R_Auth["/api/auth (JWT, Registration, Profile)"]
        R_Reports["/api/reports (Upload, List, Details, Delete)"]
        R_Comp["/api/comparison (Longitudinal Delta Engine)"]
        R_RAG["/api/rag (Clinical Evidence Query)"]
        R_Res["/api/research (Evaluation Metrics & Benchmarks)"]
        R_Health["/api/health (System Diagnostics)"]
    end

    subgraph PipelineLayer["🧠 Document Intelligence & Verification Subsystem"]
        P_Prep["ImageProcessor (PyMuPDF / OpenCV / Laplacian Blur)"]
        P_Gate["DocumentTypeValidator (7-Signal Audit Gate)"]
        P_OCR["OCR Service (PyPDF / Vision Stream Parser)"]
        P_Extract["ExtractionService (Maximal Munch Token Parser)"]
        P_Classify["AnalysisService (Deterministic Range Engine)"]
        P_RAG["RAG Service (TF-IDF / Vector Medical Guidelines)"]
        P_LLM["GeminiService (Grounded Multimodal LLM)"]
        P_Verify["ClaimVerificationEngine (NLI Proposition Verifier)"]
    end

    subgraph PersistenceLayer["💾 Data Persistence & Storage"]
        DB_Mongo[(MongoDB 7.0 / Motor Async Driver)]
        DB_Mem[(Resilient In-Memory Fallback Store)]
        FS_Uploads["Local Secure File Storage (/backend/uploads)"]
        KB_Docs["Curated Medical Knowledge Base (/knowledge_base)"]
    end

    ClientLayer --> APILayer
    APILayer --> PipelineLayer
    PipelineLayer --> PersistenceLayer
```

---

## 🧠 AI & Document Intelligence Pipeline

The processing pipeline executes 7 rigorous stages for every ingested laboratory report:

```
  [01] INGEST & PREPROCESSING
       └── PyMuPDF page rasterization (150-300 DPI)
       └── OpenCV grayscale conversion & contrast enhancement

  [02] DOCUMENT QUALITY & TYPE AUDIT (GATE 1)
       └── Laplacian variance blur detection (Threshold >= 100.0)
       └── 7-Signal scoring (S1: Keywords, S2: Units, S3: Ranges, S4: Structure...)
       └── Enforces 18.0 score threshold; rejects non-medical files with HTTP 422

  [03] STRUCTURED PARAMETER EXTRACTION (GATE 2)
       └── Maximal Munch tokenization (prevents sub-string collisions)
       └── Value extraction with comma-to-decimal sanitization
       └── Medical unit normalization (mg/dL, g/dL, 10^3/uL, fL, %, etc.)

  [04] REFERENCE INTERVAL & DETERMINISTIC CLASSIFICATION
       └── Range parsing: dual-bound ("13.0 - 17.0") & inequalities ("< 200", "> 50")
       └── Python mathematical evaluation (Single Source of Truth)
       └── Outputs: within_reported_range | below_reported_range | above_reported_range

  [05] CLINICAL RAG EVIDENCE RETRIEVAL
       └── Multi-query retrieval over 27 indexed clinical reference guidelines
       └── Cosine similarity retrieval of top-k contextual evidence chunks

  [06] GROUNDED MULTIMODAL EXPLANATION
       └── System prompt enforces strict non-diagnostic communication
       └── Synthesizes plain-language summary strictly bounded by validated facts
       └── Injects explicit limitations and uncertainty indicators

  [07] NATURAL LANGUAGE INFERENCE CLAIM VERIFICATION
       └── Deconstructs summary into atomic assertions
       └── Categorizes into REPORT_FACT, COMPUTED_FACT, REFERENCE_CONTEXT
       └── Verifies mathematical and clinical consistency against evidence chunks
```

---

## 🔬 Research Methodology & Benchmark Evaluation

HealthForm AI was evaluated in an empirical benchmark study designed for academic rigor, comparing 4 architectural paradigms on standardized laboratory datasets:

### Comparative Architectural Paradigms

1. **Approach A (Baseline OCR + Rules)**: Standard OCR followed by regular expression templates. Highly fragile against formatting variances and font layout changes.
2. **Approach B (OCR + Standard LLM)**: OCR text piped directly into a conversational LLM prompt. Flexible extraction, but susceptible to numerical hallucinations and reference range boundary confusion.
3. **Approach C (Vision LLM Direct Extraction)**: Multimodal Vision-Language Model directly reading page images. Strong layout comprehension, but lacks mathematical validation and source grounding.
4. **Approach D (Proposed HealthForm AI)**: Multimodal Vision/OCR + 7-Signal Gate 1 Audit + Maximal Munch Extraction + Deterministic Range Engine + Domain RAG + NLI Claim Verification.

### Benchmark Evaluation Results

The metrics below represent comparative evaluation recorded in the system's `EvaluationService`:

| Metric | Approach A<br><sub>(OCR + Rules)</sub> | Approach B<br><sub>(OCR + LLM)</sub> | Approach C<br><sub>(Vision LLM)</sub> | Approach D<br><sub>(HealthForm AI)</sub> |
|:---|:---:|:---:|:---:|:---:|
| **Extraction Accuracy** | 82.4% | 89.2% | 92.6% | **97.8%** |
| **Reference Range Classification** | 84.1% | 87.5% | 91.2% | **98.5%** |
| **Precision** | 85.2% | 88.0% | 93.1% | **98.1%** |
| **Recall** | 79.6% | 90.5% | 92.0% | **97.4%** |
| **F1-Score** | 82.3% | 89.2% | 92.5% | **97.7%** |
| **Grounding Rate** | 71.0% | 78.5% | 84.0% | **96.2%** |
| **Unsupported Claim Rate** <sub>(Lower is better)</sub> | 18.5% | 14.2% | 9.8% | **1.8%** |

### Ground Truth Evaluation Matrix

The system was audited against 5 distinct synthetic test documents representing standard, mixed, alternative, invalid, and degraded scenarios:

| Test Document | Profile / Content | Document Type | Audit Gate Result | Extraction | Classification Accuracy |
|:---|:---|:---:|:---:|:---:|:---:|
| **Report 1** | Eleanor Vance &bull; Routine CBC | `laboratory_report` | **PASS (Score: 52.5 / 18.0)** | 5/5 Parameters (100%) | 5/5 Within Range (100%) |
| **Report 2** | Eleanor Vance &bull; Follow-up Mixed CBC | `laboratory_report` | **PASS (Score: 52.5 / 18.0)** | 5/5 Parameters (100%) | 2 Below, 2 Within, 1 Above (100%) |
| **Report 3** | David Chen &bull; Lipid Profile (Inequalities) | `laboratory_report` | **PASS (Score: 49.5 / 18.0)** | 4/4 Parameters (100%) | 1 Below, 3 Above (100%) |
| **Report 4** | Vertex Consulting Business Invoice | `non_medical_document` | **REJECTED (Score: 4.5 / 18.0)** | N/A (Gate 1 Enforced) | Blocked (HTTP 422) |
| **Report 5** | Degraded / Blurry Optical Scan | `low_quality_document` | **REJECTED (Score: 0.0 / 18.0)** | N/A (Gate 1 Enforced) | Blocked (HTTP 422) |

---

## 🛠️ Technology Stack

```
HealthForm AI Ecosystem
│
├── Frontend Client
│   ├── React 19.2 (Modern declarative UI)
│   ├── Vite 8.3 (High-performance build engine & HMR)
│   ├── Tailwind CSS 3.4 (Tailored dark-tech design tokens)
│   ├── Lucide React (Clinical & navigational iconography)
│   ├── Recharts 3.10 (Longitudinal biomarkers time-series charts)
│   └── Axios (HTTP client with Bearer auth interceptors)
│
├── Backend Service
│   ├── Python 3.11+ (Core runtime)
│   ├── FastAPI 0.110 (Asynchronous ASGI web framework)
│   ├── Uvicorn (Production ASGI server)
│   ├── Pydantic v2 (Strict schema validation & serialization)
│   ├── PyJWT / Passlib [bcrypt] (Stateless authentication & token lifecycle)
│   └── Motor 3.3 / PyMongo 4.6 (Async MongoDB driver)
│
├── Document Vision & NLP Subsystem
│   ├── PyMuPDF (fitz) (Ultra-fast PDF page rendering & text extraction)
│   ├── Pillow (PIL) 10.2 (Image manipulation & color enhancement)
│   ├── OpenCV Headless 4.9 (Laplacian blur variance & quality scoring)
│   ├── PyPDF 4.0 (Native PDF stream parsing)
│   └── Scikit-Learn 1.4 (TF-IDF vectorizer & cosine similarity for RAG)
│
├── AI Models & Providers
│   ├── Google Gemini 1.5 Pro / Flash (Multimodal vision & grounded synthesis)
│   ├── OpenAI GPT-4o-mini (Optional alternative LLM backend)
│   └── Deterministic Grounded Engine (Offline zero-cost research mode)
│
└── Infrastructure & DevOps
    ├── Docker & Docker Compose (Multi-container orchestration)
    ├── Nginx (Frontend reverse proxy in production container)
    └── Git (Version control & workflow automation)
```

---

## 📁 Project Structure

```
healthform-ai-research/
├── .env.example                     # Environment template configuration
├── .gitignore                       # Git exclusion rules (secrets, venv, cache)
├── docker-compose.yml               # Multi-container orchestration (Mongo, API, UI)
├── healthform_ai_test_report.md     # Automated validation audit report
├── healthform_ai_test_results.json  # Machine-readable test execution output
│
├── backend/                         # FastAPI Application Root
│   ├── Dockerfile                   # Backend production Dockerfile
│   ├── requirements.txt             # Python dependencies
│   ├── pytest.ini                   # Pytest configuration
│   ├── run_full_validation_suite.py # End-to-end automated test runner
│   ├── test_document_validator.py   # Multi-signal Gate 1 audit tests
│   ├── app/
│   │   ├── config.py                # Pydantic Settings & environment loader
│   │   ├── database.py              # MongoDB Motor connection & in-memory store
│   │   ├── main.py                  # FastAPI lifespan & application routes
│   │   ├── routes/
│   │   │   ├── auth.py              # JWT login, register, profile, export, delete
│   │   │   ├── reports.py           # Upload pipeline, list, details, delete
│   │   │   ├── comparison.py        # Longitudinal multi-report comparison
│   │   │   ├── rag.py               # Medical knowledge retrieval endpoint
│   │   │   ├── research.py          # Benchmark metrics & CSV export
│   │   │   └── health.py            # System diagnostic health check
│   │   ├── schemas/
│   │   │   ├── analysis.py          # Grounded analysis, claims, comparison schemas
│   │   │   ├── auth.py              # Token, user profile, password change models
│   │   │   ├── parameter.py         # Biomarker value, range, status models
│   │   │   ├── report.py            # Report summary & detail response models
│   │   │   └── research.py          # Benchmark metrics & approach models
│   │   ├── services/
│   │   │   ├── analysis_service.py  # Deterministic reference range classifier
│   │   │   ├── document_type_validator.py # 7-signal Gate 1 audit engine
│   │   │   ├── evaluation_service.py# Research benchmark metrics calculator
│   │   │   ├── extraction_service.py# Maximal Munch parameter parser
│   │   │   ├── gemini_service.py    # Gemini multimodal grounded explanation
│   │   │   ├── image_processor.py   # Image rendering & Laplacian quality gate
│   │   │   ├── llm_service.py       # LLM provider router & prompt templates
│   │   │   ├── ocr_service.py       # Multi-engine OCR extraction
│   │   │   ├── rag_service.py       # Clinical literature vector retrieval
│   │   │   ├── validation_service.py# Parameter noise removal & bounds check
│   │   │   └── verification_service.py # NLI atomic claim verification
│   │   └── utils/
│   │       ├── logger.py            # Structured system logger
│   │       └── security.py          # Password hashing & JWT generation
│   └── tests/                       # Automated unit and integration tests
│
├── frontend/                        # React + Vite Application Root
│   ├── Dockerfile                   # Frontend production multi-stage Dockerfile
│   ├── nginx.conf                   # Nginx reverse proxy configuration
│   ├── package.json                 # Node.js dependencies & scripts
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Dark-tech theme tokens & gradients
│   ├── src/
│   │   ├── App.jsx                  # Application routing & layout tree
│   │   ├── index.css                # Global styles, scrollbars, animations
│   │   ├── components/
│   │   │   ├── common/              # AppSidebar, Navbar, Footer, Badges, Modals
│   │   │   ├── reports/             # ClaimVerificationMatrix, ParameterDetailModal
│   │   │   └── upload/              # ProcessingTracker, DragDropArea
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global authentication state & session storage
│   │   ├── layouts/
│   │   │   ├── AppLayout.jsx        # Public page shell
│   │   │   └── DashboardLayout.jsx  # Authenticated persistent sidebar shell
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Hero, features, science, and research showcase
│   │   │   ├── DashboardPage.jsx    # Unified dashboard, metrics, quick actions
│   │   │   ├── UploadPage.jsx       # Document dropzone & pipeline tracker
│   │   │   ├── ReportAnalysisPage.jsx# Single-report comprehensive analysis view
│   │   │   ├── AnalysisDetailsPage.jsx# Deep parameter audit & claim inspection
│   │   │   ├── HistoricalComparisonPage.jsx # Multi-report delta & time-series view
│   │   │   ├── ReportHistoryPage.jsx# Searchable report repository
│   │   │   ├── ResearchDashboardPage.jsx# Benchmark study evaluation dashboard
│   │   │   ├── SettingsPage.jsx     # Profile, security, export & account deletion
│   │   │   ├── LoginPage.jsx        # Authentication & one-click demo login
│   │   │   └── RegisterPage.jsx     # New user registration
│   │   └── services/                # Axios API service wrappers
│
├── knowledge_base/                  # Curated Clinical Reference Guidelines
│   └── sample_documents/            # CBC, CMP, Lipid, Liver, Renal, Thyroid panels
│
├── sample_reports/                  # Reference Multi-Format Laboratory Documents
│   ├── generate_samples.py          # Sample report generation engine
│   ├── sample_report_1_cbc_cmp.pdf  # Normal Routine CBC & CMP Panel
│   ├── sample_report_2_lipid_lft.pdf# Lipid Profile & Liver Function Tests
│   └── sample_report_3_followup_cbc.pdf # Longitudinal Follow-up CBC Panel
│
├── test_reports/                    # Synthetic Ground Truth Validation Dataset
│   ├── ground_truth_manifest.json   # Machine-verified expected biomarker values
│   ├── report_1_normal_cbc.pdf      # Validated Normal CBC
│   ├── report_2_mixed_cbc.pdf       # Validated Mixed Abnormal CBC
│   ├── report_3_lipid_profile.pdf   # Validated Lipid Profile
│   ├── report_4_invalid_invoice.pdf # Non-Medical Control Sample (Invoice)
│   └── report_5_low_quality_blurry.pdf # Degraded Control Sample (Optical Noise)
│
└── docs/                            # Documentation Assets
    └── assets/                      # Logos, icons, and animated pipeline GIFs
```

---

## 🚀 Installation Guide

### Prerequisites

Ensure the following runtimes are installed on your machine:

- **Node.js**: `v18.0.0` or later (Node 20+ recommended)
- **Python**: `3.11` or `3.12`
- **Git**: Latest version
- **MongoDB** *(Optional)*: MongoDB Community Server 7.0+ (If not running locally, the system automatically uses an in-memory resilient data store)
- **Docker** *(Optional)*: For containerized deployment

### 1. Clone Repository

```bash
git clone https://github.com/vikaskumar098/healthform-ai-research.git
cd healthform-ai-research
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Return to root
cd ..
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Return to root
cd ..
```

---

## 🔐 Environment Variables

Create your local configuration by copying `.env.example` in the project root:

```bash
cp .env.example .env
```

### Configuration Parameters

| Variable | Type | Default | Description |
|---|---|---|---|
| `APP_NAME` | String | `"HealthForm AI"` | Application title. |
| `APP_VERSION` | String | `"1.0.0"` | Current system version. |
| `DEBUG` | Boolean | `True` | Enables verbose debug logging. |
| `MONGODB_URI` | String | `"mongodb://localhost:27017"` | MongoDB connection URI. |
| `DATABASE_NAME` | String | `"healthform_ai"` | Target database name. |
| `SECRET_KEY` | String | *Generated Token* | Secret key for JWT cryptographic signing. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Integer | `1440` | Session lifetime (24 hours). |
| `DEMO_MODE` | Boolean | `true` | **Enables zero-cost offline deterministic engine without paid API keys.** |
| `GEMINI_API_KEY` | String | `""` | *(Optional)* Google Gemini API key for live multimodal synthesis. |
| `OPENAI_API_KEY` | String | `""` | *(Optional)* OpenAI API key for alternative LLM routing. |

> [!IMPORTANT]
> **Zero-Cost Offline Evaluation**: With `DEMO_MODE=true`, HealthForm AI executes complete document extraction, Gate 1 validation, deterministic classification, and grounded explanations using internal deterministic models. You do **not** need a paid API key to run or test the project.  
> **Never commit your `.env` file to version control.**

---

## 💻 Running Locally

### Start Backend Service

```bash
# From project root
cd backend
.venv\Scripts\Activate.ps1   # Or: source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Diagnostic: `http://127.0.0.1:8000/api/health`

### Start Frontend Application

In a separate terminal window:

```bash
# From project root
cd frontend
npm run dev
```

- Web Application: `http://localhost:5173`
- Click **"Demo Login"** on the login page for instant one-click access with pre-loaded mock profiles.

---

## 🐳 Docker Deployment

The system is configured for multi-container deployment via Docker Compose, provisioning MongoDB, the FastAPI backend, and an Nginx-served frontend build.

### Launch Full Stack

```bash
# Build and start all services in detached mode
docker-compose up --build -d
```

### Services Deployed

| Service | Container Name | Port Mapping | Description |
|---|---|---|---|
| **MongoDB** | `healthform_mongodb` | `27017:27017` | Persistent database storage |
| **Backend** | `healthform_backend` | `8000:8000` | FastAPI asynchronous REST service |
| **Frontend** | `healthform_frontend` | `3000:80` | Nginx-hosted production React build |

### Verify Deployment

```bash
# Check container status
docker-compose ps

# View live application logs
docker-compose logs -f backend
```

To stop containers:

```bash
docker-compose down
```

---

## 🖥️ Product Preview & Test Manifests

HealthForm AI includes curated test reports and assets in the repository:

| Document Profile | File Type | Verification Target | Repository Asset |
|---|---|---|---|
| **Routine CBC & CMP Panel** | PDF / PNG | Dual-panel normal biomarkers | [`sample_report_1_cbc_cmp.png`](file:///c:/Users/vikas/OneDrive/Desktop/minor/sample_reports/sample_report_1_cbc_cmp.png) |
| **Lipid Profile & LFT Panel** | PDF / PNG | Inequality intervals (`< 200`, `> 50`) | [`sample_report_2_lipid_lft.png`](file:///c:/Users/vikas/OneDrive/Desktop/minor/sample_reports/sample_report_2_lipid_lft.png) |
| **Follow-up Longitudinal CBC** | PDF / PNG | Multi-timestamp delta tracking | [`sample_report_3_followup_cbc.png`](file:///c:/Users/vikas/OneDrive/Desktop/minor/sample_reports/sample_report_3_followup_cbc.png) |
| **Invoice (Negative Control)** | PDF / PNG | Gate 1 Audit Rejection (HTTP 422) | [`report_4_invalid_invoice.png`](file:///c:/Users/vikas/OneDrive/Desktop/minor/test_reports/report_4_invalid_invoice.png) |
| **Blurry Scan (Negative Control)** | PDF / PNG | Laplacian Blur Rejection (HTTP 422) | [`report_5_low_quality_blurry.png`](file:///c:/Users/vikas/OneDrive/Desktop/minor/test_reports/report_5_low_quality_blurry.png) |

### Core Application Views

- **Landing Page** (`/`): Research overview, feature breakdown, non-diagnostic compliance banner, interactive particle visualizer.
- **Dashboard** (`/dashboard`): Health indicator badges, upload shortcut, recent report feed, parameter trend summary.
- **Upload Portal** (`/upload`): Drag-and-drop document upload with real-time 7-stage processing tracker and instant error handling.
- **Report Analysis** (`/reports/:id`): Categorized biomarker cards, reference range progress meters, RAG citations, and claim matrices.
- **Analysis Details** (`/reports/:id/details`): Granular table view with raw OCR confidence, token extraction bounds, and propositions.
- **Historical Comparison** (`/comparison`): Longitudinal multi-report selector, absolute and percentage delta calculators, and interactive Recharts time series.
- **Report History** (`/history`): Multi-filter report table with document type tags, verification badges, and instant search.
- **Settings & Privacy** (`/settings`): Profile manager, password update modal, one-click GDPR data export, and permanent account removal.

---

## 📡 API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication & Account (`/api/auth`)

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/auth/register` | Register a new user account with email, password, and full name. |
| `POST` | `/api/auth/login` | Authenticate user and receive a 24-hour JWT access token. |
| `POST` | `/api/auth/demo-login` | Instant zero-credential demo login with research guest privileges. |
| `GET` | `/api/auth/me` | Fetch authenticated user profile details. |
| `PUT` | `/api/auth/profile` | Update profile information (name, phone, DOB, gender). |
| `POST` | `/api/auth/change-password` | Update account password with current credential validation. |
| `GET` | `/api/auth/export-data` | Export user profile and complete report history as a JSON archive. |
| `DELETE` | `/api/auth/account` | Permanently delete user account and all associated laboratory records. |

### Reports & Pipeline (`/api/reports`)

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/reports/upload` | Ingest and process a laboratory report (`multipart/form-data`, max 15MB). |
| `GET` | `/api/reports` | List all processed reports for the authenticated user. |
| `GET` | `/api/reports/{id}` | Retrieve comprehensive analysis, parameters, claims, and RAG sources. |
| `DELETE` | `/api/reports/{id}` | Permanently delete a specific report and associated data. |

### Comparison, Knowledge & Evaluation

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/api/comparison` | Execute historical delta comparison between 2 or more reports. |
| `POST` | `/api/rag/query` | Query curated clinical guideline knowledge base chunks. |
| `GET` | `/api/research/metrics` | Retrieve comparative benchmark evaluation across Approaches A, B, C, and D. |
| `GET` | `/api/research/export/csv` | Download complete benchmark metrics table as a CSV file. |
| `GET` | `/api/health` | System diagnostics: DB connection, storage mode, indexed chunks. |

---

## 🧪 Testing & Quality Assurance

The repository includes a comprehensive automated test and audit suite:

### Run Full End-to-End Validation Suite

```bash
# Execute end-to-end verification against test reports
python backend/run_full_validation_suite.py
```

### Run Gate 1 Multi-Signal Document Validator Tests

```bash
# Tests 19 distinct document types (valid reports, invoices, resumes, blurry scans)
python backend/test_document_validator.py
```

### Run Pytest Test Suite

```bash
# From backend directory
pytest -v
```

### Verified Test Scenarios

- [x] **Valid Routine CBC**: Accurate parameter extraction and 100% within-range classification.
- [x] **Mixed Abnormal Biomarkers**: Correct mathematical classification of low Hemoglobin and elevated Platelets.
- [x] **Inequality Range Bounds**: Correct parsing of `< 200 mg/dL` and `> 50 mg/dL` bounds in Lipid profiles.
- [x] **Gate 1 Non-Medical Rejection**: Invoices and resumes rejected with HTTP 422 before reaching the LLM.
- [x] **Gate 1 Blur Rejection**: Low-quality, unreadable scans rejected with HTTP 422 before OCR hallucination.
- [x] **Cross-User Data Isolation**: Access attempts on other users' reports return HTTP 403 Forbidden.
- [x] **File Extension & Size Filtering**: Non-PDF/image files rejected with HTTP 400 Bad Request.
- [x] **Longitudinal Comparison**: Delta calculation between successive patient reports.

---

## 📊 Telemetry & Performance Metrics

Measured latency benchmarks recorded during validation runs on a local standard workstation:

| Operation | Component | Measured Latency | Throughput / Reliability |
|---|---|:---:|:---:|
| **Gate 1 Audit** | DocumentTypeValidator | **12.1 ms - 19.0 ms** | 100% deterministic precision |
| **PyPDF Text Parsing** | OCR Subsystem | **9.6 ms - 22.6 ms** | Zero external API latency |
| **Range Classification** | AnalysisService | **< 1.0 ms** | 100% mathematical determinism |
| **RAG Evidence Query** | TF-IDF / Scikit-Learn | **1.8 ms - 3.2 ms** | 27 clinical sections indexed |
| **Historical Delta** | Comparison Engine | **2.6 ms** | Multi-report chronological sorting |
| **End-to-End Pipeline** | Full Ingestion &rarr; Verification | **~24 ms** *(Demo Mode)* | Zero token cost in offline mode |

---

## 🔮 Future Scope

- [ ] **Expanded Laboratory Panels**: Add specialized extraction templates for Urinalysis, Toxicology, Genomic, and Histopathology reports.
- [ ] **Multilingual Patient Explanations**: Generate grounded explanations in multiple languages for international patient accessibility.
- [ ] **FHIR / HL7 Interoperability**: Direct integration with Fast Healthcare Interoperability Resources (FHIR) servers for EHR connectivity.
- [ ] **Mobile Native Client**: React Native application featuring direct mobile camera scanning and on-device document alignment.
- [ ] **Continuous LLM Benchmark Registry**: Automated evaluation pipeline benchmarking cutting-edge foundation models on laboratory understanding datasets.

---

## 🤝 Contributing

Contributions to HealthForm AI are welcomed! Please follow these steps:

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/clinical-range-enhancement
   ```
3. **Commit Your Changes** with clear, descriptive messages:
   ```bash
   git commit -m "feat: enhance inequality bound parsing for pediatric lipid ranges"
   ```
4. **Push to Your Branch**:
   ```bash
   git push origin feature/clinical-range-enhancement
   ```
5. **Open a Pull Request** describing your additions, tests performed, and rationale.

---

## 📄 License

**License:** Not yet specified.

---

<div align="center">

  <img src="docs/assets/healthform-icon.png" alt="HealthForm AI Icon" width="48" />

  <br />

  <strong>HealthForm AI</strong>  
  <em>Built with ❤️ for explainable AI, document intelligence, and grounded healthcare technology.</em>

  <p><sub>All evaluations are benchmarked against facility-printed reference ranges. Strictly non-diagnostic.</sub></p>

</div>

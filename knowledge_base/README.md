# HealthForm AI Curated Medical Knowledge Base

## Purpose & Research Isolation
This knowledge base contains curated medical educational references for laboratory panels.

### Strict Architectural Separation
In HealthForm AI:
1. **User Reports Are Never Ingested into this Knowledge Base**: This prevents cross-contamination, privacy leakage, and false-positive retrieval.
2. **Deterministic Citations**: Chunks retrieved by the RAG pipeline retain traceable provenance metadata:
   - `source`: File path/name
   - `title`: Clinical Panel Title
   - `section`: Specific parameter section
   - `content`: Grounded textual reference
3. **Safety Guarantee**: References define physiological function and test interpretation principles, but do NOT provide diagnostic rules or therapeutic protocols.

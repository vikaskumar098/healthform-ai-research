import os
import glob
import re
import math
import logging
from collections import Counter
from typing import List, Dict, Any, Optional
from app.config import settings
from app.schemas.analysis import EvidenceChunk

logger = logging.getLogger("healthform.rag")

class RAGService:
    """
    Production-grade, zero-cold-start RAG retrieval service.
    Implements fast Term-Frequency/IDF vector matching over curated reference clinical documents,
    ensuring deterministic, explainable, and instantaneous retrieval without external API latencies.
    """
    def __init__(self, knowledge_dir: Optional[str] = None):
        self.knowledge_dir = knowledge_dir or settings.KNOWLEDGE_BASE_DIR
        self.chunks: List[Dict[str, Any]] = []
        self.idf: Dict[str, float] = {}
        self.chunk_vectors: List[Dict[str, float]] = []
        self._initialized = False

    def _tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r'[a-zA-Z0-9\-\%]+', text) if len(w) > 2]

    def initialize(self):
        if self._initialized:
            return

        if not os.path.exists(self.knowledge_dir):
            logger.warning(f"Knowledge base directory '{self.knowledge_dir}' does not exist.")
            self._initialized = True
            return

        doc_files = glob.glob(os.path.join(self.knowledge_dir, "*.md"))
        all_chunks = []

        for fpath in doc_files:
            fname = os.path.basename(fpath)
            if fname.lower() == "readme.md":
                continue

            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()

                title_m = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                doc_title = title_m.group(1).strip() if title_m else fname.replace(".md", "").replace("_", " ").title()

                sections = re.split(r'\n(?=#{2,3}\s+)', content)
                for sec in sections:
                    sec = sec.strip()
                    if not sec:
                        continue
                    sec_title_m = re.search(r'^#{2,3}\s+(.+)$', sec, re.MULTILINE)
                    sec_title = sec_title_m.group(1).strip() if sec_title_m else "Overview"
                    
                    clean_content = re.sub(r'^#{1,4}\s+.*$', '', sec, flags=re.MULTILINE).strip()
                    if len(clean_content) < 20:
                        continue

                    all_chunks.append({
                        "source": fname,
                        "title": doc_title,
                        "section": sec_title,
                        "content": clean_content
                    })
            except Exception as e:
                logger.error(f"Error reading knowledge doc {fpath}: {e}")

        self.chunks = all_chunks
        num_docs = len(self.chunks)

        if num_docs > 0:
            # Build inverted doc frequency (IDF)
            df = Counter()
            for chunk in self.chunks:
                tokens = set(self._tokenize(f"{chunk['title']} {chunk['section']} {chunk['content']}"))
                for t in tokens:
                    df[t] += 1

            self.idf = {t: math.log((num_docs + 1) / (count + 1)) + 1.0 for t, count in df.items()}

            # Build normalized TF-IDF vector for each chunk
            for chunk in self.chunks:
                tokens = self._tokenize(f"{chunk['title']} {chunk['section']} {chunk['content']}")
                tf = Counter(tokens)
                vec = {t: (cnt / len(tokens)) * self.idf.get(t, 1.0) for t, cnt in tf.items()}
                # Norm
                norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
                vec = {t: v / norm for t, v in vec.items()}
                self.chunk_vectors.append(vec)

            logger.info(f"RAG Knowledge Engine indexed {len(self.chunks)} clinical sections from {len(doc_files)} reference files.")

        self._initialized = True

    def retrieve(self, query: str, top_k: int = 3, min_similarity: float = 0.05) -> List[EvidenceChunk]:
        """
        Retrieves top relevant evidence chunks with traceable provenance metadata.
        """
        if not self._initialized:
            self.initialize()

        if not self.chunks or not self.chunk_vectors:
            return []

        q_tokens = self._tokenize(query)
        if not q_tokens:
            return []

        q_tf = Counter(q_tokens)
        q_vec = {t: (cnt / len(q_tokens)) * self.idf.get(t, 1.0) for t, cnt in q_tf.items()}
        q_norm = math.sqrt(sum(v * v for v in q_vec.values())) or 1.0
        q_vec = {t: v / q_norm for t, v in q_vec.items()}

        scores = []
        for idx, c_vec in enumerate(self.chunk_vectors):
            dot = sum(val * c_vec.get(term, 0.0) for term, val in q_vec.items())
            scores.append((dot, idx))

        scores.sort(key=lambda x: x[0], reverse=True)
        results: List[EvidenceChunk] = []

        for score, idx in scores[:top_k]:
            if score >= min_similarity:
                chunk = self.chunks[idx]
                results.append(EvidenceChunk(
                    source=chunk["source"],
                    title=chunk["title"],
                    section=chunk["section"],
                    content=chunk["content"],
                    score=round(float(score), 4)
                ))

        return results

rag_service = RAGService()

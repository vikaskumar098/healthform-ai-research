from pydantic import BaseModel
from typing import List, Optional
from fastapi import APIRouter
from app.services.rag_service import rag_service
from app.schemas.analysis import EvidenceChunk

router = APIRouter(prefix="/api/rag", tags=["RAG Retrieval"])

class RAGQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class RAGQueryResponse(BaseModel):
    query: str
    chunks_found: int
    evidence: List[EvidenceChunk]

@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(req: RAGQueryRequest):
    chunks = rag_service.retrieve(req.query, top_k=req.top_k or 3)
    return RAGQueryResponse(
        query=req.query,
        chunks_found=len(chunks),
        evidence=chunks
    )

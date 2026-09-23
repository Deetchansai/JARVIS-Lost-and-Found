"""Campus Lost and Found - AI Matching Microservice

FastAPI application providing image embedding extraction, text metadata similarity,
and hybrid multimodal pairing endpoints for the Express backend.
"""

from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.feature_extraction import feature_extractor
from src.text_matcher import text_matcher
from src.hybrid_match import hybrid_matcher

app = FastAPI(
    title="Campus Lost & Found - AI Engine",
    description="Multimodal hybrid matching service for lost and found item pairing",
    version="1.0.0",
)

# Enable CORS for backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class ImageEmbeddingResponse(BaseModel):
    dimension: int
    embedding: List[float]


class TextMatchRequest(BaseModel):
    text_a: str = Field(..., description="First text snippet or title")
    text_b: str = Field(..., description="Second text snippet or title")


class TextMatchResponse(BaseModel):
    similarity: float


class ItemPayload(BaseModel):
    id: Optional[str] = None
    title: str
    description: str = ""
    category: str = "Other"
    location: Optional[str] = ""
    imageUrl: Optional[str] = ""
    imageEmbedding: Optional[List[float]] = []


class HybridMatchRequest(BaseModel):
    target: ItemPayload
    candidates: List[ItemPayload]
    threshold: Optional[float] = 0.35


class MatchResultItem(BaseModel):
    candidateId: str
    hybridScore: float
    textSimilarity: float
    imageSimilarity: float
    hasMultimodalData: bool
    confidenceLevel: str
    details: Dict[str, Any]


class HybridMatchResponse(BaseModel):
    targetId: Optional[str]
    totalCandidates: int
    matchesFound: int
    matches: List[MatchResultItem]


# --- Endpoints ---

@app.get("/health", response_model=HealthResponse, tags=["Diagnostics"])
def health_check():
    return {
        "status": "healthy",
        "service": "campus-lost-and-found-ai-module",
        "version": "1.0.0",
    }


@app.post("/embed/image", response_model=ImageEmbeddingResponse, tags=["Feature Extraction"])
async def extract_image_embedding(file: UploadFile = File(...)):
    """Extracts 512-dimensional visual vector embedding from uploaded image."""
    try:
        content = await file.read()
        embedding = feature_extractor.extract_from_bytes(content)
        return {
            "dimension": len(embedding),
            "embedding": embedding,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image feature extraction failed: {str(e)}")


@app.post("/match/text", response_model=TextMatchResponse, tags=["Matching"])
def match_text(payload: TextMatchRequest):
    """Calculates text cosine similarity between two descriptions or titles."""
    score = text_matcher.compute_similarity(payload.text_a, payload.text_b)
    return {"similarity": round(score, 4)}


@app.post("/match/hybrid", response_model=HybridMatchResponse, tags=["Matching"])
def match_hybrid(payload: HybridMatchRequest):
    """Ranks candidate items against a target lost/found item using multimodal matching."""
    target_dict = payload.target.model_dump()
    candidates_dicts = [c.model_dump() for c in payload.candidates]

    results = hybrid_matcher.rank_candidates(
        target_item=target_dict,
        candidates=candidates_dicts,
        threshold=payload.threshold or 0.35,
    )

    return {
        "targetId": payload.target.id,
        "totalCandidates": len(payload.candidates),
        "matchesFound": len(results),
        "matches": results,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

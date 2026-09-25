"""Text Matching & Metadata Comparison Module

Semantic NLP similarity for item titles, descriptions, categories, and locations
using the open-source sentence-transformers/all-MiniLM-L6-v2 model.
Falls back to TF-IDF if the model cannot be loaded.
"""

from typing import Dict, Any, List, Optional
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class TextMatcher:
    def __init__(self):
        self.model = None
        self.backend = "tfidf"
        self.model_name = "tfidf-ngram"
        self.embedding_dim = 0
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            analyzer="word",
            token_pattern=r"(?u)\b\w+\b",
            lowercase=True,
        )
        self._init_model()

    def _init_model(self):
        """Load open-source MiniLM sentence embedding model for NLP."""
        try:
            from sentence_transformers import SentenceTransformer

            # Lightweight open-source BERT variant (Apache-2.0)
            self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            self.embedding_dim = int(self.model.get_embedding_dimension())
            self.backend = "sentence-transformers"
            self.model_name = "sentence-transformers/all-MiniLM-L6-v2"
            print(f"[TextMatcher] Loaded {self.model_name} (dim={self.embedding_dim})")
        except Exception as exc:
            self.model = None
            self.backend = "tfidf"
            self.model_name = "tfidf-ngram"
            print(f"[TextMatcher] MiniLM unavailable ({exc}); using TF-IDF fallback")

    @property
    def model_info(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "type": "sentence-embedding" if self.backend == "sentence-transformers" else "lexical",
            "family": "MiniLM / BERT (Hugging Face)" if self.backend == "sentence-transformers" else "TF-IDF",
            "architecture": "all-MiniLM-L6-v2" if self.backend == "sentence-transformers" else "word-bigram",
            "backend": self.backend,
            "embedding_dim": self.embedding_dim,
            "task": "NLP semantic similarity for title, description, category, location",
        }

    def clean_text(self, text: str) -> str:
        """Sanitizes text by removing non-alphanumeric noise."""
        if not text:
            return ""
        return re.sub(r"\s+", " ", text.strip().lower())

    def encode(self, text: str) -> Optional[np.ndarray]:
        """Encode a single text string into a normalized embedding (when MiniLM is available)."""
        cleaned = self.clean_text(text)
        if not cleaned or self.model is None:
            return None
        embedding = self.model.encode(cleaned, convert_to_numpy=True, normalize_embeddings=True)
        return np.asarray(embedding, dtype=np.float32)

    def compute_similarity(self, text_a: str, text_b: str) -> float:
        """Computes semantic (or TF-IDF) cosine similarity between two text snippets."""
        cleaned_a = self.clean_text(text_a)
        cleaned_b = self.clean_text(text_b)

        if not cleaned_a or not cleaned_b:
            return 0.0

        if cleaned_a == cleaned_b:
            return 1.0

        if self.model is not None:
            return self._semantic_similarity(cleaned_a, cleaned_b)

        return self._tfidf_similarity(cleaned_a, cleaned_b)

    def _semantic_similarity(self, text_a: str, text_b: str) -> float:
        """Cosine similarity of MiniLM sentence embeddings."""
        embeddings = self.model.encode(
            [text_a, text_b],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        sim = float(np.dot(embeddings[0], embeddings[1]))
        return max(0.0, min(1.0, sim))

    def _tfidf_similarity(self, cleaned_a: str, cleaned_b: str) -> float:
        """Lexical fallback when sentence-transformers is unavailable."""
        try:
            tfidf_matrix = self.vectorizer.fit_transform([cleaned_a, cleaned_b])
            sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
            return max(0.0, min(1.0, sim))
        except Exception:
            set_a = set(cleaned_a.split())
            set_b = set(cleaned_b.split())
            if not set_a or not set_b:
                return 0.0
            return len(set_a & set_b) / len(set_a | set_b)

    def match_metadata(self, item_a: Dict[str, Any], item_b: Dict[str, Any]) -> Dict[str, float]:
        """Calculates detailed field-level text similarities between two items."""
        cat_a = item_a.get("category", "").lower()
        cat_b = item_b.get("category", "").lower()
        category_sim = 1.0 if cat_a and cat_b and cat_a == cat_b else 0.2

        title_sim = self.compute_similarity(
            item_a.get("title", ""), item_b.get("title", "")
        )
        desc_sim = self.compute_similarity(
            item_a.get("description", ""), item_b.get("description", "")
        )
        loc_sim = self.compute_similarity(
            item_a.get("location", ""), item_b.get("location", "")
        )

        overall_text_sim = (
            (category_sim * 0.35)
            + (title_sim * 0.40)
            + (desc_sim * 0.20)
            + (loc_sim * 0.05)
        )

        return {
            "category_similarity": round(category_sim, 4),
            "title_similarity": round(title_sim, 4),
            "description_similarity": round(desc_sim, 4),
            "location_similarity": round(loc_sim, 4),
            "overall_text_similarity": round(min(1.0, overall_text_sim), 4),
        }


# Singleton instance
text_matcher = TextMatcher()

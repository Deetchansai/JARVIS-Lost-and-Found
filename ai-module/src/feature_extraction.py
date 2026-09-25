"""Image Feature Extraction Module

Computes visual embeddings from item photos using open-source CLIP
(clip-ViT-B-32 via sentence-transformers). Falls back to a lightweight
color/spatial signature only if the model cannot be loaded.
"""

from typing import List, Dict, Any, Optional
import io
import numpy as np
from PIL import Image


class ImageFeatureExtractor:
    def __init__(self, embedding_dim: int = 512):
        self.embedding_dim = embedding_dim
        self.model = None
        self.backend = "baseline"
        self.model_name = "color-histogram-baseline"
        self._init_model()

    def _init_model(self):
        """Load open-source CLIP for image recognition embeddings."""
        try:
            from sentence_transformers import SentenceTransformer

            # Open-source CLIP ViT-B/32 weights (Apache-2.0 / MIT community packaging)
            self.model = SentenceTransformer("clip-ViT-B-32")
            self.embedding_dim = int(self.model.get_embedding_dimension())
            self.backend = "clip"
            self.model_name = "clip-ViT-B-32"
            print(f"[ImageFeatureExtractor] Loaded {self.model_name} (dim={self.embedding_dim})")
        except Exception as exc:
            self.model = None
            self.backend = "baseline"
            self.model_name = "color-histogram-baseline"
            print(f"[ImageFeatureExtractor] CLIP unavailable ({exc}); using baseline fallback")

    @property
    def model_info(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "type": "vision-language" if self.backend == "clip" else "statistical-baseline",
            "family": "CLIP (open-source weights)" if self.backend == "clip" else "histogram",
            "architecture": "ViT-B/32" if self.backend == "clip" else "color+spatial",
            "backend": self.backend,
            "embedding_dim": self.embedding_dim,
            "task": "image recognition / visual similarity embeddings",
        }

    def extract_from_bytes(self, image_bytes: bytes) -> List[float]:
        """Extracts normalized feature vector from raw image byte stream."""
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            return self.extract_from_image(image)
        except Exception:
            return [0.0] * self.embedding_dim

    def extract_from_image(self, image: Image.Image) -> List[float]:
        """Processes PIL Image into a normalized embedding vector."""
        if self.model is not None:
            return self._extract_clip(image)
        return self._extract_baseline(image)

    def _extract_clip(self, image: Image.Image) -> List[float]:
        """Encode image with open-source CLIP."""
        embedding = self.model.encode(image, convert_to_numpy=True, normalize_embeddings=True)
        vector = np.asarray(embedding, dtype=np.float32).flatten()
        self.embedding_dim = len(vector)
        return vector.tolist()

    def _extract_baseline(self, image: Image.Image) -> List[float]:
        """Deterministic color/spatial signature used only when CLIP is unavailable."""
        resized = image.resize((64, 64))
        img_array = np.asarray(resized, dtype=np.float32) / 255.0

        r_hist, _ = np.histogram(img_array[:, :, 0], bins=32, range=(0, 1), density=True)
        g_hist, _ = np.histogram(img_array[:, :, 1], bins=32, range=(0, 1), density=True)
        b_hist, _ = np.histogram(img_array[:, :, 2], bins=32, range=(0, 1), density=True)
        grid_feats = img_array.reshape(8, 8, 8, 8, 3).mean(axis=(1, 3)).flatten()

        combined = np.concatenate([r_hist, g_hist, b_hist, grid_feats])
        if len(combined) < self.embedding_dim:
            padded = np.zeros(self.embedding_dim, dtype=np.float32)
            padded[: len(combined)] = combined
            vector = padded
        else:
            vector = combined[: self.embedding_dim]

        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.tolist()

    @staticmethod
    def compute_similarity(vector_a: List[float], vector_b: List[float]) -> float:
        """Computes cosine similarity between two feature vectors."""
        va = np.array(vector_a, dtype=np.float32)
        vb = np.array(vector_b, dtype=np.float32)

        norm_a = np.linalg.norm(va)
        norm_b = np.linalg.norm(vb)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        dot_product = float(np.dot(va, vb))
        return max(0.0, min(1.0, dot_product / (norm_a * norm_b)))


# Singleton instance
feature_extractor = ImageFeatureExtractor()

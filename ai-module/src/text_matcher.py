"""Text Matching & Metadata Comparison Module

Provides semantic and syntactic similarity calculations for item titles, descriptions,
categories, and location metadata.
"""

from typing import Dict, Any, List
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class TextMatcher:
    def __init__(self):
        # Character & word n-gram vectorizer for robust misspelling and partial word matching
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            analyzer="word",
            token_pattern=r"(?u)\b\w+\b",
            lowercase=True,
        )

    def clean_text(self, text: str) -> str:
        """Sanitizes text by removing non-alphanumeric noise."""
        if not text:
            return ""
        return re.sub(r"\s+", " ", text.strip().lower())

    def compute_similarity(self, text_a: str, text_b: str) -> float:
        """Computes TF-IDF cosine similarity between two text snippets."""
        cleaned_a = self.clean_text(text_a)
        cleaned_b = self.clean_text(text_b)

        if not cleaned_a or not cleaned_b:
            return 0.0

        if cleaned_a == cleaned_b:
            return 1.0

        try:
            tfidf_matrix = self.vectorizer.fit_transform([cleaned_a, cleaned_b])
            sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
            return max(0.0, min(1.0, sim))
        except Exception:
            # Fallback token Jaccard similarity if vocabulary cannot be extracted
            set_a = set(cleaned_a.split())
            set_b = set(cleaned_b.split())
            if not set_a or not set_b:
                return 0.0
            return len(set_a & set_b) / len(set_a | set_b)

    def match_metadata(self, item_a: Dict[str, Any], item_b: Dict[str, Any]) -> Dict[str, float]:
        """Calculates detailed field-level text similarities between two items."""
        # 1. Category exact match / alignment
        cat_a = item_a.get("category", "").lower()
        cat_b = item_b.get("category", "").lower()
        category_sim = 1.0 if cat_a and cat_b and cat_a == cat_b else 0.2

        # 2. Title similarity
        title_sim = self.compute_similarity(
            item_a.get("title", ""), item_b.get("title", "")
        )

        # 3. Description similarity
        desc_sim = self.compute_similarity(
            item_a.get("description", ""), item_b.get("description", "")
        )

        # 4. Location overlap
        loc_sim = self.compute_similarity(
            item_a.get("location", ""), item_b.get("location", "")
        )

        # Weighted aggregate text similarity
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

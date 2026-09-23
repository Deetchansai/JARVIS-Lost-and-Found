"""Hybrid Matcher Module

Combines visual embeddings from `feature_extraction` and semantic textual signals
from `text_matcher` into a unified multimodal similarity score.
"""

from typing import Dict, Any, List
from .feature_extraction import feature_extractor
from .text_matcher import text_matcher


class HybridMatcher:
    def __init__(self, text_weight: float = 0.55, image_weight: float = 0.45):
        self.default_text_weight = text_weight
        self.default_image_weight = image_weight

    def match_pair(self, item_a: Dict[str, Any], item_b: Dict[str, Any]) -> Dict[str, Any]:
        """Computes multimodal similarity between two specific items."""
        # 1. Text Similarity
        text_breakdown = text_matcher.match_metadata(item_a, item_b)
        text_sim = text_breakdown["overall_text_similarity"]

        # 2. Image Similarity
        vec_a = item_a.get("imageEmbedding") or []
        vec_b = item_b.get("imageEmbedding") or []

        has_both_images = len(vec_a) > 0 and len(vec_b) > 0
        if has_both_images:
            image_sim = feature_extractor.compute_similarity(vec_a, vec_b)
            w_text = self.default_text_weight
            w_img = self.default_image_weight
        else:
            # Fallback to pure text weighting if one or both items lack image features
            image_sim = 0.0
            w_text = 1.0
            w_img = 0.0

        hybrid_score = round((text_sim * w_text) + (image_sim * w_img), 4)

        return {
            "hybrid_score": min(1.0, max(0.0, hybrid_score)),
            "text_similarity": text_sim,
            "image_similarity": image_sim,
            "has_multimodal_data": has_both_images,
            "details": text_breakdown,
        }

    def rank_candidates(
        self,
        target_item: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        threshold: float = 0.40,
    ) -> List[Dict[str, Any]]:
        """Ranks candidate items against a target item in descending order of match confidence."""
        results = []

        for candidate in candidates:
            scoring = self.match_pair(target_item, candidate)
            cand_id = candidate.get("id") or candidate.get("_id", "")

            if scoring["hybrid_score"] >= threshold:
                results.append({
                    "candidateId": str(cand_id),
                    "hybridScore": scoring["hybrid_score"],
                    "textSimilarity": scoring["text_similarity"],
                    "imageSimilarity": scoring["image_similarity"],
                    "hasMultimodalData": scoring["has_multimodal_data"],
                    "confidenceLevel": (
                        "HIGH" if scoring["hybrid_score"] >= 0.75
                        else "MEDIUM" if scoring["hybrid_score"] >= 0.55
                        else "LOW"
                    ),
                    "details": scoring["details"],
                })

        # Sort descending by hybrid score
        results.sort(key=lambda x: x["hybridScore"], reverse=True)
        return results


# Singleton instance
hybrid_matcher = HybridMatcher()

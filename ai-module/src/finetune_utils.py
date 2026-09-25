"""Helpers for LlamaIndex embedding fine-tuning without broken package imports."""

from __future__ import annotations

import importlib.util
import sys
import types
from pathlib import Path
from typing import Any, Type


def _find_finetuning_root() -> Path:
    """Locate installed llama_index/finetuning package directory."""
    # Prefer importlib resources / module specs over llama_index.__file__
    # (llama_index may be a namespace package with __file__ = None).
    try:
        import llama_index.finetuning as ft  # may fail due to mistralai side-import
        if getattr(ft, "__file__", None):
            return Path(ft.__file__).resolve().parent
        if getattr(ft, "__path__", None):
            return Path(list(ft.__path__)[0]).resolve()
    except Exception:
        pass

    for entry in sys.path:
        candidate = Path(entry) / "llama_index" / "finetuning"
        if (candidate / "embeddings" / "sentence_transformer.py").exists():
            return candidate.resolve()

    raise ImportError(
        "llama-index-finetuning is not installed. "
        "Run: pip install llama-index-finetuning"
    )


def load_llamaindex_finetune_engine() -> tuple[Type[Any], Type[Any]]:
    """
    Load SentenceTransformersFinetuneEngine + EmbeddingQAFinetuneDataset.

    llama-index-finetuning's top-level __init__ eagerly imports a broken
    mistralai client, so we load the embedding modules directly.
    """
    base = _find_finetuning_root()

    def ensure_pkg(name: str, path: Path) -> None:
        existing = sys.modules.get(name)
        if existing is not None and getattr(existing, "__path__", None):
            return
        pkg = types.ModuleType(name)
        pkg.__path__ = [str(path)]
        pkg.__file__ = str(path / "__init__.py")
        pkg.__package__ = name
        sys.modules[name] = pkg

    ensure_pkg("llama_index.finetuning", base)
    ensure_pkg("llama_index.finetuning.embeddings", base / "embeddings")

    for mod_name, file in [
        ("llama_index.finetuning.embeddings.common", base / "embeddings" / "common.py"),
        (
            "llama_index.finetuning.embeddings.sentence_transformer",
            base / "embeddings" / "sentence_transformer.py",
        ),
    ]:
        if mod_name in sys.modules and hasattr(sys.modules[mod_name], "EmbeddingQAFinetuneDataset" if "common" in mod_name else "SentenceTransformersFinetuneEngine"):
            continue
        spec = importlib.util.spec_from_file_location(mod_name, file)
        if spec is None or spec.loader is None:
            raise ImportError(f"Cannot load {mod_name}")
        mod = importlib.util.module_from_spec(spec)
        sys.modules[mod_name] = mod
        spec.loader.exec_module(mod)

    dataset_cls = sys.modules["llama_index.finetuning.embeddings.common"].EmbeddingQAFinetuneDataset
    engine_cls = sys.modules[
        "llama_index.finetuning.embeddings.sentence_transformer"
    ].SentenceTransformersFinetuneEngine
    return engine_cls, dataset_cls

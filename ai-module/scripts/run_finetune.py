#!/usr/bin/env python3
"""Build synthetic campus lost/found fine-tune datasets and train MiniLM + CLIP."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "finetune"
IMG_DIR = DATA / "images"
MODELS = ROOT / "models"
MINILM_OUT = MODELS / "finetuned-minilm"
CLIP_OUT = MODELS / "finetuned-clip"

sys.path.insert(0, str(ROOT))

# --- Synthetic lost/found paraphrase pairs (query = lost report, corpus = found report) ---
PAIRS = [
    ("Lost black Nike backpack with laptop sleeve near Central Library",
     "Found dark Nike bag for laptop by the campus library entrance"),
    ("Misplaced navy blue Hydro Flask water bottle in Engineering block",
     "Found dark blue metal flask outside Engineering building"),
    ("Lost silver MacBook Pro 14-inch with sticker of a cat",
     "Found grey Apple laptop with cat sticker in lecture hall"),
    ("Missing red student ID card near cafeteria",
     "Picked up crimson campus ID badge by the food court"),
    ("Lost leather wallet with university logo at sports complex",
     "Found brown wallet with campus crest in gym lobby"),
    ("Cannot find black Sony WH-1000XM headphones in dorm laundry",
     "Found over-ear Sony noise cancelling headphones in laundry room"),
    ("Lost set of room keys with blue keychain at parking lot B",
     "Found keys on blue fob near Parking Lot B"),
    ("Misplaced green umbrella in Chemistry lab",
     "Found lime green umbrella outside Chemistry department"),
    ("Lost Apple AirPods case with initials PD engraved",
     "Found white AirPods charging case engraved PD"),
    ("Missing calculus textbook by Stewart near study hall",
     "Found Stewart Calculus book in the study lounge"),
    ("Lost grey North Face jacket in auditorium",
     "Found gray outdoor jacket (North Face) in main auditorium"),
    ("Misplaced pink iPhone 13 with cracked screen protector",
     "Found damaged-screen pink iPhone near bus stop"),
    ("Lost bicycle helmet matt black at bike rack",
     "Found matte black bike helmet by the bike stands"),
    ("Missing USB-C charger brick 65W in computer lab",
     "Found 65 watt USB-C power adapter in CS lab"),
    ("Lost brown leather belt in locker room",
     "Found tan leather belt in the locker area"),
    ("Misplaced transparent geometry box in math tutorial",
     "Found clear geometry set after math class"),
    ("Lost black Dell laptop bag with shoulder strap",
     "Found Dell branded laptop messenger bag"),
    ("Missing prescription glasses with round gold frames",
     "Found round gold-rimmed eyeglasses in cafe"),
    ("Lost red scarf near winter bus shelter",
     "Found crimson scarf at the bus shelter"),
    ("Misplaced scientific calculator Casio fx-991 in exam hall",
     "Found Casio fx-991 calculator after exams"),
]


def build_text_dataset() -> dict:
    queries, corpus, relevant = {}, {}, {}
    for i, (lost, found) in enumerate(PAIRS):
        qid, did = f"q{i}", f"d{i}"
        queries[qid] = lost
        corpus[did] = found
        relevant[qid] = [did]
        # also add reverse direction for found->lost matching
        qid2, did2 = f"qr{i}", f"dr{i}"
        queries[qid2] = found
        corpus[did2] = lost
        relevant[qid2] = [did2]
    return {"queries": queries, "corpus": corpus, "relevant_docs": relevant, "mode": "text"}


COLORS = {
    "black backpack": ((20, 20, 20), (60, 60, 60)),
    "navy water bottle": ((20, 40, 100), (40, 70, 150)),
    "silver laptop": ((180, 180, 185), (210, 210, 215)),
    "red ID card": ((180, 30, 40), (220, 60, 70)),
    "brown wallet": ((110, 70, 40), (140, 95, 55)),
    "black headphones": ((15, 15, 15), (45, 45, 45)),
    "blue keys": ((30, 90, 180), (70, 130, 220)),
    "green umbrella": ((30, 140, 60), (60, 180, 90)),
    "white earbuds": ((235, 235, 235), (250, 250, 250)),
    "textbook": ((90, 50, 30), (130, 80, 50)),
    "grey jacket": ((100, 100, 105), (140, 140, 145)),
    "pink phone": ((220, 120, 160), (240, 160, 190)),
}


def make_item_image(name: str, colors: tuple, seed: int, path: Path) -> None:
    rng = np.random.default_rng(seed)
    img = Image.new("RGB", (224, 224), colors[0])
    draw = ImageDraw.Draw(img)
    # object-like rectangle with accent
    draw.rounded_rectangle((40, 40, 184, 184), radius=24, fill=colors[1], outline=(255, 255, 255), width=3)
    noise = rng.integers(0, 25, (224, 224, 3), dtype=np.uint8)
    base = np.asarray(img, dtype=np.int16)
    blended = np.clip(base + noise - 12, 0, 255).astype(np.uint8)
    img = Image.fromarray(blended)
    draw = ImageDraw.Draw(img)
    draw.text((50, 100), name.split()[0][:10], fill=(255, 255, 255))
    img.save(path)


def build_clip_pairs() -> list[dict]:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    pairs = []
    for i, (name, colors) in enumerate(COLORS.items()):
        lost_path = IMG_DIR / f"{i:02d}_lost.png"
        found_path = IMG_DIR / f"{i:02d}_found.png"
        make_item_image(name, colors, seed=100 + i, path=lost_path)
        make_item_image(name, colors, seed=200 + i, path=found_path)
        # image <-> text captions for contrastive fine-tuning
        captions = [
            f"a photo of a {name}",
            f"campus lost and found item: {name}",
            f"found {name} on campus",
        ]
        for cap in captions:
            pairs.append({"image": str(lost_path.relative_to(ROOT)), "text": cap})
            pairs.append({"image": str(found_path.relative_to(ROOT)), "text": cap})
    return pairs


def finetune_minilm(dataset_dict: dict) -> None:
    from src.finetune_utils import load_llamaindex_finetune_engine

    Engine, Dataset = load_llamaindex_finetune_engine()
    MINILM_OUT.mkdir(parents=True, exist_ok=True)

    # small holdout
    q_ids = list(dataset_dict["queries"].keys())
    split = max(2, len(q_ids) // 5)
    val_ids = set(q_ids[:split])
    train = {
        "queries": {k: v for k, v in dataset_dict["queries"].items() if k not in val_ids},
        "corpus": dataset_dict["corpus"],
        "relevant_docs": {k: v for k, v in dataset_dict["relevant_docs"].items() if k not in val_ids},
        "mode": "text",
    }
    val = {
        "queries": {k: v for k, v in dataset_dict["queries"].items() if k in val_ids},
        "corpus": dataset_dict["corpus"],
        "relevant_docs": {k: v for k, v in dataset_dict["relevant_docs"].items() if k in val_ids},
        "mode": "text",
    }

    train_ds = Dataset(**train)
    val_ds = Dataset(**val)

    engine = Engine(
        dataset=train_ds,
        model_id="sentence-transformers/all-MiniLM-L6-v2",
        model_output_path=str(MINILM_OUT),
        batch_size=8,
        val_dataset=val_ds,
        epochs=2,
        show_progress_bar=True,
        evaluation_steps=20,
    )
    print("[MiniLM] Fine-tuning with LlamaIndex SentenceTransformersFinetuneEngine...")
    engine.finetune()
    # finetune() already writes weights to model_output_path; get_finetuned_model()
    # returns a LlamaIndex HuggingFaceEmbedding wrapper (no .save()).
    if not (MINILM_OUT / "modules.json").exists():
        # Fallback: reload underlying ST model from output dir if present
        from sentence_transformers import SentenceTransformer

        st = SentenceTransformer(str(MINILM_OUT))
        st.save(str(MINILM_OUT))
    print(f"[MiniLM] Saved -> {MINILM_OUT}")


def finetune_clip(pairs: list[dict]) -> None:
    """
    CLIP fine-tune via sentence-transformers (LlamaIndex has no CLIP image finetune engine).
    Uses the same contrastive objective style as LlamaIndex's embedding finetune path.
    """
    from torch.utils.data import DataLoader
    from sentence_transformers import SentenceTransformer, InputExample, losses

    CLIP_OUT.mkdir(parents=True, exist_ok=True)
    model = SentenceTransformer("clip-ViT-B-32")

    examples = []
    for p in pairs:
        img = Image.open(ROOT / p["image"]).convert("RGB")
        examples.append(InputExample(texts=[img, p["text"]]))

    loader = DataLoader(examples, shuffle=True, batch_size=4)
    loss = losses.MultipleNegativesRankingLoss(model)

    print("[CLIP] Fine-tuning clip-ViT-B-32 on campus image-text pairs...")
    model.fit(
        train_objectives=[(loader, loss)],
        epochs=1,
        warmup_steps=5,
        show_progress_bar=True,
        output_path=str(CLIP_OUT),
    )
    model.save(str(CLIP_OUT))
    print(f"[CLIP] Saved -> {CLIP_OUT}")


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    text_ds = build_text_dataset()
    (DATA / "text_qa_dataset.json").write_text(json.dumps(text_ds, indent=2))
    clip_pairs = build_clip_pairs()
    (DATA / "clip_image_text_pairs.json").write_text(json.dumps(clip_pairs, indent=2))
    print(f"Wrote text QA pairs: {len(text_ds['queries'])} queries")
    print(f"Wrote CLIP pairs: {len(clip_pairs)}")

    finetune_minilm(text_ds)
    finetune_clip(clip_pairs)
    print("DONE")


if __name__ == "__main__":
    main()

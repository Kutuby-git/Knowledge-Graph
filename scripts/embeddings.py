"""
Phase 4: Generate word embeddings using multilingual-e5-small (384d)
and store them in pgvector column.

Requires: pip install sentence-transformers
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

MODEL_NAME = "intfloat/multilingual-e5-small"


def main():
    print("=== Embedding Generation Pipeline ===\n")

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("ERROR: Install sentence-transformers: pip install sentence-transformers")
        return

    # Load model
    print(f"Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    print(f"Embedding dimension: {model.get_sentence_embedding_dimension()}")

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch all words
    all_words = []
    offset = 0
    while True:
        resp = sb.table("words").select("id, arabic, transliteration, kids_glossary").range(offset, offset + 999).execute()
        if not resp.data:
            break
        all_words.extend(resp.data)
        offset += 1000

    print(f"Words to embed: {len(all_words)}")

    # Build text representations for embedding
    # Use "query: " prefix as required by E5 models
    texts = []
    for w in all_words:
        parts = [w["arabic"]]
        if w.get("transliteration"):
            parts.append(w["transliteration"])
        if w.get("kids_glossary"):
            parts.append(w["kids_glossary"])
        texts.append("query: " + " ".join(parts))

    # Generate embeddings in batches
    print("Generating embeddings...")
    batch_size = 64
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        embeddings = model.encode(batch, normalize_embeddings=True)
        all_embeddings.extend(embeddings)
        print(f"  Batch {i // batch_size + 1}/{(len(texts) + batch_size - 1) // batch_size}")

    # Store in database
    print("Storing embeddings in database...")
    for i, word in enumerate(all_words):
        embedding = all_embeddings[i].tolist()
        sb.table("words").update({"embedding": embedding}).eq("id", word["id"]).execute()

        if (i + 1) % 100 == 0:
            print(f"  Stored {i + 1}/{len(all_words)}")

    print(f"\n=== EMBEDDINGS COMPLETE: {len(all_words)} words embedded ===")


if __name__ == "__main__":
    main()

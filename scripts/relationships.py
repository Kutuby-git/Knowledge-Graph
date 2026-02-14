"""
Phase 4: Compute semantic_similar edges from embeddings.
Finds word pairs with cosine similarity > 0.8.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

SIMILARITY_THRESHOLD = 0.8


def main():
    print("=== Semantic Relationship Builder ===\n")

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch all words with embeddings
    all_words = []
    offset = 0
    while True:
        resp = sb.table("words").select("id, arabic, embedding").not_.is_("embedding", "null").range(offset, offset + 999).execute()
        if not resp.data:
            break
        all_words.extend(resp.data)
        offset += 1000

    print(f"Words with embeddings: {len(all_words)}")

    if len(all_words) == 0:
        print("No embeddings found. Run embeddings.py first.")
        return

    # For each word, find similar words using pgvector
    print(f"Finding similar pairs (threshold > {SIMILARITY_THRESHOLD})...")
    rel_count = 0
    seen_pairs = set()

    for i, word in enumerate(all_words):
        if not word.get("embedding"):
            continue

        # Use pgvector similarity search
        resp = sb.rpc("search_similar_words", {
            "query_embedding": word["embedding"],
            "match_count": 15,
        }).execute()

        for match in (resp.data or []):
            if match["word_id"] == word["id"]:
                continue
            if match["similarity"] < SIMILARITY_THRESHOLD:
                continue

            pair = tuple(sorted([word["id"], match["word_id"]]))
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)

            try:
                sb.table("word_relationships").insert({
                    "word_id_1": pair[0],
                    "word_id_2": pair[1],
                    "relationship_type": "semantic_similar",
                    "weight": round(match["similarity"], 3),
                    "metadata": {"cosine_similarity": round(match["similarity"], 4)},
                }).execute()
                rel_count += 1
            except Exception:
                pass  # Skip duplicates

        if (i + 1) % 100 == 0:
            print(f"  Processed {i + 1}/{len(all_words)}, found {rel_count} pairs")

    print(f"\n=== COMPLETE: {rel_count} semantic_similar relationships created ===")


if __name__ == "__main__":
    main()

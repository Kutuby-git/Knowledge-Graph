"""
Phase 3: Data Enrichment Pipeline

1. Root Letter Extraction via LLM (Claude API)
2. Difficulty Score Computation
3. Creates root records and links words

Expects ANTHROPIC_API_KEY in .env.local
"""

import json
import os
import re
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# Difficulty scoring factors
DIFFICULTY_WEIGHTS = {
    "char_count": 0.2,       # More chars = harder
    "has_shaddah": 0.15,     # Shaddah = harder
    "has_hamza": 0.1,        # Hamza = harder
    "multi_word": 0.2,       # Multi-word phrases = harder
    "is_advanced": 0.2,      # From Advanced sheet = harder
    "part_2": 0.15,          # Part 2 = harder
}


def compute_difficulty(word: dict) -> tuple[int, dict]:
    """Compute difficulty score 1-5 from word attributes."""
    factors = {}
    raw_score = 0

    arabic = word.get("arabic", "")

    # Character count (excluding spaces and diacritics)
    bare_chars = len(re.sub(r'[\s\u064B-\u0670]', '', arabic))
    if bare_chars <= 3:
        factors["char_count"] = 0
    elif bare_chars <= 5:
        factors["char_count"] = 0.3
    elif bare_chars <= 8:
        factors["char_count"] = 0.6
    else:
        factors["char_count"] = 1.0
    raw_score += factors["char_count"] * DIFFICULTY_WEIGHTS["char_count"]

    # Shaddah presence
    factors["has_shaddah"] = 1.0 if '\u0651' in arabic else 0
    raw_score += factors["has_shaddah"] * DIFFICULTY_WEIGHTS["has_shaddah"]

    # Hamza presence
    hamza_chars = set('ءأإؤئ')
    factors["has_hamza"] = 1.0 if any(c in hamza_chars for c in arabic) else 0
    raw_score += factors["has_hamza"] * DIFFICULTY_WEIGHTS["has_hamza"]

    # Multi-word phrase
    factors["multi_word"] = 1.0 if ' ' in arabic.strip() else 0
    raw_score += factors["multi_word"] * DIFFICULTY_WEIGHTS["multi_word"]

    # Advanced sheet origin
    factors["is_advanced"] = 1.0 if word.get("is_advanced") else 0
    raw_score += factors["is_advanced"] * DIFFICULTY_WEIGHTS["is_advanced"]

    # Part 2
    factors["part_2"] = 1.0 if word.get("part_2") else 0
    raw_score += factors["part_2"] * DIFFICULTY_WEIGHTS["part_2"]

    # Map 0-1 to 1-5
    score = max(1, min(5, round(raw_score * 5) + 1))

    return score, factors


def extract_roots_batch_llm(words: list[dict]) -> dict[int, dict]:
    """Use Claude to extract roots for a batch of words."""
    if not ANTHROPIC_API_KEY:
        print("  WARNING: No ANTHROPIC_API_KEY set, skipping LLM root extraction")
        return {}

    try:
        import anthropic
    except ImportError:
        print("  WARNING: anthropic package not installed. Run: pip install anthropic")
        return {}

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # Build the prompt with word list
    word_list = "\n".join(
        f"{w['id']}: {w['arabic']} ({w.get('transliteration', '')} - {w.get('kids_glossary', '')})"
        for w in words
    )

    prompt = f"""For each Arabic word below, extract the trilateral (3-letter) Arabic root.
Return ONLY a JSON object mapping word ID to root info.

Words:
{word_list}

Return format (JSON only, no markdown):
{{
  "123": {{"root": "ك ت ب", "root_transliteration": "k-t-b", "root_meaning": "to write"}},
  ...
}}

Rules:
- Use Arabic letters with spaces between them for the root
- If the word is a proper noun (name of a person/place), set root to null
- If uncertain, set root to null
- Keep root_meaning very brief (2-4 words)"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()
        # Strip markdown code blocks if present
        if text.startswith("```"):
            text = re.sub(r'^```\w*\n', '', text)
            text = re.sub(r'\n```$', '', text)

        result = json.loads(text)
        return {int(k): v for k, v in result.items() if v and v.get("root")}

    except Exception as e:
        print(f"  LLM error: {e}")
        return {}


def main():
    print("=== Enrichment Pipeline ===\n")

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch all words
    all_words = []
    offset = 0
    while True:
        resp = sb.table("words").select("*").range(offset, offset + 999).execute()
        if not resp.data:
            break
        all_words.extend(resp.data)
        offset += 1000

    print(f"Total words: {len(all_words)}")

    # ========================================
    # STEP 1: Compute difficulty scores
    # ========================================
    print("\nComputing difficulty scores...")
    updates_count = 0
    for word in all_words:
        score, factors = compute_difficulty(word)
        sb.table("words").update({
            "difficulty_score": score,
            "difficulty_factors": factors,
        }).eq("id", word["id"]).execute()
        updates_count += 1

    print(f"  Difficulty scores set: {updates_count}")

    # Distribution
    dist = {}
    for word in all_words:
        score, _ = compute_difficulty(word)
        dist[score] = dist.get(score, 0) + 1
    print(f"  Distribution: {dict(sorted(dist.items()))}")

    # ========================================
    # STEP 2: Extract roots via LLM
    # ========================================
    print("\nExtracting roots via LLM...")

    # Process in batches of 30
    batch_size = 30
    all_roots = {}  # word_id -> {root, transliteration, meaning}
    words_needing_roots = [w for w in all_words if not w.get("root_id")]

    for i in range(0, len(words_needing_roots), batch_size):
        batch = words_needing_roots[i:i + batch_size]
        print(f"  Batch {i // batch_size + 1}/{(len(words_needing_roots) + batch_size - 1) // batch_size}...")

        roots = extract_roots_batch_llm(batch)
        all_roots.update(roots)

        # Rate limit
        time.sleep(1)

    print(f"  Roots extracted: {len(all_roots)}")

    # ========================================
    # STEP 3: Create root records and link
    # ========================================
    if all_roots:
        print("\nCreating root records...")

        # Collect unique roots
        unique_roots = {}
        for word_id, info in all_roots.items():
            root_letters = info["root"].replace(" ", "")  # Remove spaces
            if root_letters not in unique_roots:
                unique_roots[root_letters] = {
                    "letters": root_letters,
                    "transliteration": info.get("root_transliteration"),
                    "meaning": info.get("root_meaning"),
                }

        # Insert roots
        for root_data in unique_roots.values():
            try:
                sb.table("roots").upsert(root_data, on_conflict="letters").execute()
            except Exception:
                pass

        # Fetch root IDs
        roots_resp = sb.table("roots").select("*").execute()
        root_id_map = {r["letters"]: r["id"] for r in roots_resp.data}

        # Link words to roots
        linked = 0
        for word_id, info in all_roots.items():
            root_letters = info["root"].replace(" ", "")
            root_id = root_id_map.get(root_letters)
            if root_id:
                sb.table("words").update({"root_id": root_id}).eq("id", word_id).execute()
                linked += 1

        print(f"  Unique roots created: {len(unique_roots)}")
        print(f"  Words linked to roots: {linked}")

        # Create same_root relationships
        print("\nCreating same_root relationships...")
        rel_count = 0
        for root_letters, root_id in root_id_map.items():
            words_with_root = sb.table("words").select("id").eq("root_id", root_id).execute()
            ids = [w["id"] for w in words_with_root.data]
            for a in range(len(ids)):
                for b in range(a + 1, len(ids)):
                    try:
                        sb.table("word_relationships").insert({
                            "word_id_1": ids[a],
                            "word_id_2": ids[b],
                            "relationship_type": "same_root",
                            "weight": 0.9,
                        }).execute()
                        rel_count += 1
                    except Exception:
                        pass

        print(f"  Same-root relationships: {rel_count}")

    print("\n=== ENRICHMENT COMPLETE ===")


if __name__ == "__main__":
    main()

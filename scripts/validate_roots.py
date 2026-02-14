"""
Phase 3: Validate extracted roots using CAMeL Tools morphological analyzer.
Cross-checks LLM-extracted roots against linguistic analysis.

Requires: pip install camel-tools
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def main():
    print("=== Root Validation Pipeline ===\n")

    try:
        from camel_tools.morphology.analyzer import Analyzer
        from camel_tools.morphology.database import MorphologyDB
    except ImportError:
        print("CAMeL Tools not installed. Install with: pip install camel-tools")
        print("Then download data: camel_data -i morphology-db-msa-r13")
        return

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Load morphological analyzer
    print("Loading CAMeL Tools morphological analyzer...")
    db = MorphologyDB.builtin_db()
    analyzer = Analyzer(db)

    # Fetch words with roots
    all_words = []
    offset = 0
    while True:
        resp = (
            sb.from_("words")
            .select("id, arabic, arabic_bare, root_id, roots(letters)")
            .not_.is_("root_id", "null")
            .range(offset, offset + 999)
            .execute()
        )
        if not resp.data:
            break
        all_words.extend(resp.data)
        offset += 1000

    print(f"Words with roots: {len(all_words)}")

    matched = 0
    mismatched = 0
    no_analysis = 0

    for word in all_words:
        bare = word["arabic_bare"]
        llm_root = word.get("roots", {}).get("letters", "") if word.get("roots") else ""

        # Analyze with CAMeL Tools
        analyses = analyzer.analyze(bare)

        if not analyses:
            no_analysis += 1
            continue

        # Check if any analysis matches the LLM root
        camel_roots = set()
        for a in analyses:
            root = a.get("root", "")
            if root:
                camel_roots.add(root.replace(".", ""))

        if llm_root in camel_roots:
            matched += 1
        else:
            mismatched += 1
            print(f"  MISMATCH: {word['arabic']} - LLM: {llm_root}, CAMeL: {camel_roots}")

    print(f"\n=== VALIDATION RESULTS ===")
    print(f"  Matched: {matched}")
    print(f"  Mismatched: {mismatched}")
    print(f"  No analysis: {no_analysis}")
    accuracy = matched / (matched + mismatched) * 100 if (matched + mismatched) > 0 else 0
    print(f"  Accuracy: {accuracy:.1f}%")


if __name__ == "__main__":
    main()

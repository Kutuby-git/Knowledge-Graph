import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/recommendations?wordId=123&limit=10
 * Returns recommended words based on multiple signals:
 * - Same root (0.9 weight)
 * - Same theme (0.7 weight)
 * - Explicit pairs (0.8 weight)
 * - Semantic similarity (0.6 weight)
 * - Similar difficulty (0.5 weight)
 */
export async function GET(request: NextRequest) {
  const wordId = request.nextUrl.searchParams.get("wordId");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");

  if (!wordId) {
    return NextResponse.json({ error: "wordId required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const targetId = parseInt(wordId);

  // Fetch target word
  const { data: targetWord } = await supabase
    .from("words")
    .select("*")
    .eq("id", targetId)
    .single();

  if (!targetWord) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  // Collect recommendations with scores
  const scores = new Map<number, { score: number; reasons: string[] }>();

  function addScore(id: number, score: number, reason: string) {
    if (id === targetId) return;
    const existing = scores.get(id) || { score: 0, reasons: [] };
    existing.score += score;
    existing.reasons.push(reason);
    scores.set(id, existing);
  }

  // 1. Same root (weight 0.9)
  if (targetWord.root_id) {
    const { data: rootSiblings } = await supabase
      .from("words")
      .select("id")
      .eq("root_id", targetWord.root_id)
      .neq("id", targetId);

    for (const w of rootSiblings || []) {
      addScore(w.id, 0.9, "same_root");
    }
  }

  // 2. Explicit relationships (weight 0.8)
  const { data: rels } = await supabase.rpc("get_word_connections" , {
    target_word_id: targetId,
  });
  for (const r of (rels || []) as Array<{ word_id: number; relationship_type: string; weight: number }>) {
    addScore(r.word_id, r.weight, r.relationship_type);
  }

  // 3. Same theme (weight 0.7)
  const { data: siblings } = await supabase.rpc("get_theme_siblings" , {
    target_word_id: targetId,
  });
  for (const s of (siblings || []) as Array<{ word_id: number }>) {
    addScore(s.word_id, 0.7, "same_theme");
  }

  // 4. Similar difficulty (weight 0.5)
  if (targetWord.difficulty_score) {
    const { data: diffWords } = await supabase
      .from("words")
      .select("id")
      .gte("difficulty_score", targetWord.difficulty_score - 1)
      .lte("difficulty_score", targetWord.difficulty_score + 1)
      .neq("id", targetId)
      .limit(20);

    for (const w of diffWords || []) {
      addScore(w.id, 0.5, "similar_difficulty");
    }
  }

  // Sort by score and get top N
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit);

  if (ranked.length === 0) {
    return NextResponse.json({ recommendations: [] });
  }

  // Fetch full word data
  const { data: words } = await supabase
    .from("words")
    .select("*")
    .in(
      "id",
      ranked.map(([id]) => id)
    );

  const wordsById = new Map((words || []).map((w) => [w.id, w]));

  const recommendations = ranked
    .map(([id, { score, reasons }]) => ({
      word: wordsById.get(id),
      score,
      reasons,
    }))
    .filter((r) => r.word);

  return NextResponse.json({ recommendations });
}

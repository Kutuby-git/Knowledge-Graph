import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * POST /api/chat
 * Body: { message: string }
 *
 * Structured retrieval + LLM: searches words first, then generates
 * a kid-friendly response using Claude.
 */
export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Chat not configured. Set ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  const { message } = await request.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Step 1: Search for relevant words
  const { data: searchResults } = await supabase.rpc("search_words", {
    query_text: message.trim(),
  });

  const topWords = ((searchResults || []) as Array<{
    id: number;
    arabic: string;
    transliteration: string;
    kids_glossary: string;
    surah_ayah: string;
    difficulty_score: number;
  }>).slice(0, 5);

  // Step 2: Get context about these words
  let context = "";
  if (topWords.length > 0) {
    const wordDetails = topWords
      .map(
        (w) =>
          `- ${w.arabic} (${w.transliteration}): "${w.kids_glossary}" [Surah:Ayah ${w.surah_ayah || "N/A"}]`
      )
      .join("\n");
    context = `\nRelevant Quranic Arabic words found:\n${wordDetails}\n`;
  }

  // Step 3: Call Claude for response
  const systemPrompt = `You are a friendly, encouraging Arabic vocabulary tutor for kids learning Quranic Arabic.
You have access to a database of 768 Quranic Arabic words across 15 themes.

Guidelines:
- Use simple, age-appropriate language (for ages 6-12)
- Be encouraging and positive
- When discussing Arabic words, always mention the Arabic text, transliteration, and meaning
- Reference Surah:Ayah when available
- Keep responses concise (2-4 sentences for simple questions)
- If asked about a word not in the database, say so honestly
- Never make up Quranic references`;

  const userPrompt = `${context}\nUser question: ${message}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const result = await response.json();
    const assistantMessage =
      result.content?.[0]?.text || "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      message: assistantMessage,
      relatedWords: topWords,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

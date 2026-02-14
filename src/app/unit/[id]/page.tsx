import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { UNIT_COLORS, UNIT_ICONS } from "@/lib/graph/colors";
import { WordCard } from "@/components/word/WordCard";

export const dynamic = "force-dynamic";

interface UnitPageProps {
  params: Promise<{ id: string }>;
}

export default async function UnitPage({ params }: UnitPageProps) {
  const { id: unitCode } = await params;
  const supabase = createServerClient();

  // Fetch unit
  const { data: unit } = await supabase
    .from("units")
    .select("*")
    .eq("code", unitCode.toUpperCase())
    .single();

  if (!unit) notFound();

  // Fetch sub-themes with their words
  const { data: subThemes } = await supabase
    .from("sub_themes")
    .select("*")
    .eq("unit_id", unit.id)
    .order("display_order");

  // Fetch all words for this unit via word_themes
  const subThemeIds = (subThemes || []).map((st) => st.id);
  const { data: wordThemes } = await supabase
    .from("word_themes")
    .select("word_id, sub_theme_id")
    .in("sub_theme_id", subThemeIds);

  const wordIds = [...new Set((wordThemes || []).map((wt) => wt.word_id))];
  const { data: words } = await supabase
    .from("words")
    .select("*")
    .in("id", wordIds.length > 0 ? wordIds : [0]);

  const wordsById = new Map((words || []).map((w) => [w.id, w]));
  const wordsByTheme = new Map<number, typeof words>();
  for (const wt of wordThemes || []) {
    const list = wordsByTheme.get(wt.sub_theme_id) || [];
    const word = wordsById.get(wt.word_id);
    if (word) list.push(word);
    wordsByTheme.set(wt.sub_theme_id, list);
  }

  const color = unit.color || UNIT_COLORS[unit.code];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="text-white py-10 px-4"
        style={{ backgroundColor: color }}
      >
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="text-white/70 hover:text-white text-sm mb-4 inline-block"
          >
            ← Back to all themes
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-5xl">
              {UNIT_ICONS[unit.code] || "📚"}
            </span>
            <div>
              <h1 className="font-[family-name:var(--font-nunito)] font-extrabold text-3xl">
                {unit.full_name}
              </h1>
              <p className="text-white/80 mt-1">{unit.description}</p>
              <p className="text-white/60 text-sm mt-1">
                {wordIds.length} words · {subThemes?.length || 0} sub-themes
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Sub-themes */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-3 mb-6">
          <Link
            href={`/explore?unit=${unit.code}`}
            className="px-4 py-2 bg-white rounded-lg shadow-sm border text-sm
                       font-medium hover:shadow-md transition-shadow"
          >
            View in Graph
          </Link>
        </div>

        {(subThemes || []).map((st) => {
          const themeWords = wordsByTheme.get(st.id) || [];
          return (
            <div key={st.id} className="mb-8">
              <h2
                className="font-[family-name:var(--font-nunito)] font-bold text-lg mb-3 pb-2 border-b-2"
                style={{ borderColor: color + "40" }}
              >
                {st.label}
                <span className="text-gray-400 text-sm font-normal ml-2">
                  {themeWords.length} words
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {themeWords.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    unitCode={unit.code}
                    compact
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

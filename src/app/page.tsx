import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { UnitGrid } from "@/components/unit/UnitGrid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServerClient();

  const [unitsRes, countsRes] = await Promise.all([
    supabase.from("units").select("*").order("display_order"),
    supabase.rpc("get_unit_word_counts"),
  ]);

  const units = unitsRes.data || [];

  // Build word counts per unit
  const wordCounts: Record<string, number> = {};
  if (countsRes.data) {
    for (const row of countsRes.data as Array<{ code: string; count: number }>) {
      wordCounts[row.code] = row.count;
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="text-center py-10 px-4">
        <h1 className="font-[family-name:var(--font-nunito)] font-extrabold text-4xl md:text-5xl text-gray-900 mb-3">
          Quranic Arabic Explorer
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Discover 768 Arabic words from the Quran across 15 beautiful themes.
          Tap a theme to start exploring!
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <Link
            href="/explore"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold
                       hover:bg-blue-700 transition-colors shadow-md"
          >
            Knowledge Graph
          </Link>
          <Link
            href="/search"
            className="px-6 py-2.5 bg-white text-gray-700 rounded-xl font-semibold
                       border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Search Words
          </Link>
        </div>
      </header>

      {/* Unit Grid */}
      <section className="max-w-5xl mx-auto pb-16">
        <UnitGrid units={units} wordCounts={wordCounts} />
      </section>

      {/* Stats */}
      <section className="bg-white border-t py-8">
        <div className="max-w-3xl mx-auto flex justify-around text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">768</p>
            <p className="text-sm text-gray-500">Arabic Words</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">15</p>
            <p className="text-sm text-gray-500">Themes</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">988</p>
            <p className="text-sm text-gray-500">Connections</p>
          </div>
        </div>
      </section>
    </main>
  );
}

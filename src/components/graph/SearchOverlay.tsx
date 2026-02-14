"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface SearchResult {
  id: number;
  arabic: string;
  transliteration: string | null;
  kids_glossary: string | null;
}

interface SearchOverlayProps {
  onSelectWord: (wordId: number) => void;
}

export function SearchOverlay({ onSelectWord }: SearchOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase.rpc("search_words", { query_text: q });
    setResults((data as SearchResult[])?.slice(0, 8) || []);
    setSearching(false);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  // Keyboard shortcut: Ctrl/Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Search toggle */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => setIsOpen(true)}
        className="absolute top-3 right-4 z-20 w-9 h-9 rounded-full
                   bg-[#0A0E1A]/80 backdrop-blur-lg border border-white/5
                   flex items-center justify-center
                   text-[#7A82A0] hover:text-[#F5F0E8] transition-colors"
        title="Search (Ctrl+K)"
      >
        <Search size={15} />
      </motion.button>

      {/* Search panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 z-30 bg-black/40"
            />

            {/* Search box */}
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-40
                         w-full max-w-md"
            >
              <div className="mx-4 rounded-xl bg-[#0F1628]/95 backdrop-blur-xl
                              border border-white/10 shadow-2xl overflow-hidden">
                {/* Input */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <Search size={16} className="text-[#7A82A0] shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleInput(e.target.value)}
                    placeholder="Search Arabic or English..."
                    className="flex-1 bg-transparent text-[#F5F0E8] text-sm
                               placeholder:text-[#7A82A0]/50 outline-none
                               font-[family-name:var(--font-nunito)]"
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-[#7A82A0] hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Results */}
                {results.length > 0 && (
                  <div className="max-h-64 overflow-y-auto">
                    {results.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          onSelectWord(r.id);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5
                                   hover:bg-white/5 transition-colors text-left"
                      >
                        <span
                          className="text-lg text-[#F5F0E8] shrink-0"
                          style={{ fontFamily: "var(--font-amiri), serif", direction: "rtl" }}
                        >
                          {r.arabic}
                        </span>
                        <span className="text-xs text-[#A0A8C0] truncate">
                          {r.kids_glossary || r.transliteration}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {query.length >= 2 && results.length === 0 && !searching && (
                  <div className="px-4 py-6 text-center text-xs text-[#7A82A0]">
                    No words found
                  </div>
                )}

                {/* Searching */}
                {searching && (
                  <div className="px-4 py-4 text-center text-xs text-[#7A82A0]">
                    Searching...
                  </div>
                )}

                {/* Hint */}
                {query.length < 2 && results.length === 0 && (
                  <div className="px-4 py-4 text-center text-xs text-[#7A82A0]/50">
                    Type at least 2 characters to search
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Word } from "@/types/database";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  relatedWords?: Partial<Word>[];
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: ChatMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });

        const data = await res.json();

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.message || data.error || "Something went wrong.",
          relatedWords: data.relatedWords,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again!",
          },
        ]);
      }

      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    },
    [loading]
  );

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600
                   text-white shadow-lg hover:bg-blue-700 transition-colors
                   flex items-center justify-center text-2xl z-50"
      >
        {isOpen ? "×" : "💬"}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[380px] max-h-[500px]
                       bg-white rounded-2xl shadow-2xl border overflow-hidden z-50
                       flex flex-col"
          >
            {/* Header */}
            <div className="bg-blue-600 text-white px-4 py-3">
              <h3 className="font-[family-name:var(--font-nunito)] font-bold">
                Arabic Word Helper
              </h3>
              <p className="text-blue-200 text-xs">
                Ask me about Quranic Arabic words!
              </p>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[320px]"
            >
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <p className="mb-2">Try asking:</p>
                  <div className="space-y-1">
                    {[
                      "What does بَقَرَة mean?",
                      "Tell me about animals in the Quran",
                      "What words share the root ك-ت-ب?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="block w-full text-left px-3 py-1.5 rounded-lg
                                   hover:bg-blue-50 text-blue-500 text-xs"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {msg.relatedWords && msg.relatedWords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.relatedWords.map((w) => (
                          <span
                            key={w.id}
                            className="inline-block bg-white/20 px-2 py-0.5 rounded-full text-xs"
                          >
                            <span className="font-[family-name:var(--font-amiri)]">
                              {w.arabic}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="border-t p-3 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a word..."
                className="flex-1 px-3 py-2 rounded-xl border focus:outline-none
                           focus:border-blue-400 text-sm"
                dir="auto"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm
                           font-medium disabled:opacity-50 hover:bg-blue-700"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { RELATIONSHIP_COLORS } from "@/lib/graph/colors";

interface GraphLegendProps {
  zoomLevel: 1 | 2 | 3;
}

export function GraphLegend({ zoomLevel }: GraphLegendProps) {
  const [isOpen, setIsOpen] = useState(false);

  const nodeLegend =
    zoomLevel === 1
      ? [
          { color: "#E74C3C", label: "Thematic Unit", shape: "circle-lg" },
          { color: "#4A5580", label: "Shared Words Bridge", shape: "line-dash" },
        ]
      : zoomLevel === 2
      ? [
          { color: "#E74C3C", label: "Unit Center", shape: "circle-lg" },
          { color: "#E74C3C80", label: "Sub-theme", shape: "circle-md" },
          { color: "#E74C3C", label: "Word", shape: "circle-sm" },
        ]
      : [
          { color: "#E74C3C", label: "Focus Word", shape: "circle-lg" },
          { color: "#96CEB4", label: "Connected Word", shape: "circle-sm" },
        ];

  const linkLegend =
    zoomLevel >= 2
      ? [
          { color: RELATIONSHIP_COLORS.same_root, label: "Same Root", dashed: false },
          { color: RELATIONSHIP_COLORS.opposite, label: "Opposites", dashed: true },
          { color: RELATIONSHIP_COLORS.virtue_pair, label: "Virtue Pair", dashed: false },
          { color: RELATIONSHIP_COLORS.same_theme, label: "Same Theme", dashed: false },
        ]
      : [];

  const tip =
    zoomLevel === 1
      ? "Tap a constellation to explore its words!"
      : zoomLevel === 2
      ? "Tap a word to see its connections!"
      : "Tap connected words to explore further!";

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="absolute bottom-3 left-3 z-20 max-w-[220px]"
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   bg-[#0A0E1A]/80 backdrop-blur-lg border border-white/5
                   text-[#7A82A0] hover:text-[#A0A8C0] text-xs transition-colors"
      >
        <HelpCircle size={13} />
        Legend
        {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {/* Expanded legend */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mt-2 p-3 rounded-lg bg-[#0A0E1A]/90 backdrop-blur-xl
                       border border-white/5 space-y-3"
          >
            {/* Node types */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-[#7A82A0] uppercase tracking-wider font-medium">
                Nodes
              </p>
              {nodeLegend.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.shape === "circle-lg" && (
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  {item.shape === "circle-md" && (
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  {item.shape === "circle-sm" && (
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  {item.shape === "line-dash" && (
                    <div
                      className="w-4 h-0 border-t border-dashed shrink-0"
                      style={{ borderColor: item.color }}
                    />
                  )}
                  <span className="text-[10px] text-[#A0A8C0]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Link types */}
            {linkLegend.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-[#7A82A0] uppercase tracking-wider font-medium">
                  Connections
                </p>
                {linkLegend.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-0 shrink-0 ${
                        item.dashed ? "border-t border-dashed" : "border-t"
                      }`}
                      style={{ borderColor: item.color }}
                    />
                    <span className="text-[10px] text-[#A0A8C0]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tip */}
            <p className="text-[10px] text-[#F5F0E8]/50 italic pt-1 border-t border-white/5">
              {tip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

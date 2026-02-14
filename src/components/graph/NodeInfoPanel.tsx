"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import type { GraphNode } from "@/lib/graph/transform";
import { UNIT_ICONS, UNIT_NAMES, UNIT_COLORS } from "@/lib/graph/colors";
import Link from "next/link";

interface NodeInfoPanelProps {
  node: GraphNode | null;
  onClose: () => void;
  onExploreUnit?: (unitCode: string) => void;
}

export function NodeInfoPanel({
  node,
  onClose,
  onExploreUnit,
}: NodeInfoPanelProps) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute top-14 right-0 bottom-0 w-72 z-30
                     bg-[#0A0E1A]/90 backdrop-blur-xl border-l overflow-y-auto"
          style={{ borderColor: `${node.color}30` }}
        >
          {/* Colored accent bar */}
          <div
            className="absolute top-0 left-0 bottom-0 w-1"
            style={{ backgroundColor: node.color }}
          />

          <div className="p-5 pl-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full
                         bg-white/5 hover:bg-white/10 flex items-center justify-center
                         text-[#7A82A0] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>

            {/* Unit info */}
            {node.type === "unit" && node.unitCode && (
              <div className="space-y-4">
                <div className="text-3xl">{UNIT_ICONS[node.unitCode]}</div>
                <div>
                  <h3 className="text-lg font-bold text-[#F5F0E8] font-[family-name:var(--font-nunito)]">
                    {UNIT_NAMES[node.unitCode] || node.label}
                  </h3>
                  <p className="text-xs text-[#7A82A0] mt-1">
                    Unit {node.unitCode}
                  </p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-[#F5F0E8] font-semibold">
                      {node.wordCount ?? "—"}
                    </span>
                    <span className="text-[#7A82A0] ml-1">words</span>
                  </div>
                  {node.subThemeCount !== undefined && (
                    <div>
                      <span className="text-[#F5F0E8] font-semibold">
                        {node.subThemeCount}
                      </span>
                      <span className="text-[#7A82A0] ml-1">themes</span>
                    </div>
                  )}
                </div>
                {onExploreUnit && (
                  <button
                    onClick={() => onExploreUnit(node.unitCode!)}
                    className="w-full py-2 px-4 rounded-lg text-sm font-medium
                               text-white transition-all hover:brightness-110"
                    style={{ backgroundColor: `${node.color}CC` }}
                  >
                    Explore Unit
                  </button>
                )}
              </div>
            )}

            {/* Word info */}
            {node.type === "word" && (
              <div className="space-y-4">
                {node.arabicLabel && (
                  <p
                    className="text-3xl text-[#F5F0E8] leading-relaxed"
                    style={{ fontFamily: "var(--font-amiri), serif", direction: "rtl" }}
                  >
                    {node.arabicLabel}
                  </p>
                )}
                <div>
                  <h3 className="text-base font-semibold text-[#F5F0E8] font-[family-name:var(--font-nunito)]">
                    {node.label}
                  </h3>
                </div>
                {node.unitCode && (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: `${UNIT_COLORS[node.unitCode]}20`,
                        color: UNIT_COLORS[node.unitCode],
                      }}
                    >
                      {UNIT_ICONS[node.unitCode]} {UNIT_NAMES[node.unitCode]}
                    </span>
                  </div>
                )}
                <Link
                  href={`/word/${node.id.replace("word-", "")}`}
                  className="flex items-center gap-2 w-full py-2 px-4 rounded-lg text-sm
                             font-medium bg-white/5 hover:bg-white/10
                             text-[#A0A8C0] hover:text-white transition-colors"
                >
                  Open Detail <ExternalLink size={14} />
                </Link>
              </div>
            )}

            {/* Sub-theme info */}
            {node.type === "sub_theme" && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-[#F5F0E8] font-[family-name:var(--font-nunito)]">
                  {node.label}
                </h3>
                <p className="text-xs text-[#7A82A0]">Sub-theme</p>
                {node.unitCode && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: `${UNIT_COLORS[node.unitCode]}20`,
                      color: UNIT_COLORS[node.unitCode],
                    }}
                  >
                    {UNIT_ICONS[node.unitCode]} {UNIT_NAMES[node.unitCode]}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

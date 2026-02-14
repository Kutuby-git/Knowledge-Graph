"use client";

import { UNIT_COLORS, UNIT_NAMES } from "@/lib/graph/colors";

interface GraphControlsProps {
  zoomLevel: 1 | 2 | 3;
  onZoomChange: (level: 1 | 2 | 3) => void;
  activeUnit?: string;
  onUnitFilter?: (code: string | null) => void;
  onBack?: () => void;
}

export function GraphControls({
  zoomLevel,
  onZoomChange,
  activeUnit,
  onUnitFilter,
  onBack,
}: GraphControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl shadow-sm border">
      {/* Back button */}
      {zoomLevel > 1 && onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100
                     hover:bg-gray-200 text-sm font-medium transition-colors"
        >
          <span>←</span> Back
        </button>
      )}

      {/* Zoom level indicator */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
        {([1, 2, 3] as const).map((level) => (
          <button
            key={level}
            onClick={() => onZoomChange(level)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              zoomLevel === level
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {level === 1 ? "Units" : level === 2 ? "Themes" : "Words"}
          </button>
        ))}
      </div>

      {/* Unit filter chips */}
      {onUnitFilter && (
        <div className="flex flex-wrap gap-1.5 ml-auto">
          {Object.entries(UNIT_NAMES).map(([code, name]) => (
            <button
              key={code}
              onClick={() =>
                onUnitFilter(activeUnit === code ? null : code)
              }
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                activeUnit === code
                  ? "text-white scale-110"
                  : "text-gray-600 hover:text-white bg-gray-100 hover:scale-105"
              }`}
              style={{
                backgroundColor:
                  activeUnit === code
                    ? UNIT_COLORS[code]
                    : undefined,
                ...(activeUnit !== code
                  ? {}
                  : {}),
              }}
              onMouseEnter={(e) => {
                if (activeUnit !== code) {
                  e.currentTarget.style.backgroundColor = UNIT_COLORS[code];
                }
              }}
              onMouseLeave={(e) => {
                if (activeUnit !== code) {
                  e.currentTarget.style.backgroundColor = "";
                }
              }}
              title={name}
            >
              {code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GraphData, GraphNode, GraphLink } from "@/lib/graph/transform";

// Dynamic import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface KnowledgeGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  zoomLevel?: 1 | 2 | 3;
}

export function KnowledgeGraph({
  data,
  width,
  height = 600,
  onNodeClick,
  zoomLevel = 1,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: width || 800, height });

  useEffect(() => {
    if (!containerRef.current || width) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [width, height]);

  const nodeCanvasObject = useCallback(
    (node: GraphNode & { x: number; y: number }, ctx: CanvasRenderingContext2D) => {
      const { x, y, label, arabicLabel, type, color, size } = node;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (type === "unit") {
        // Unit nodes: white border, larger label
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Label below
        ctx.font = `bold ${Math.max(10, size / 2.5)}px "Nunito", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#333";
        ctx.fillText(label, x, y + size + 4);
      } else if (type === "sub_theme") {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = `${Math.max(8, size / 1.5)}px "Nunito", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#555";
        ctx.fillText(label, x, y + size + 3);
      } else {
        // Word nodes: show Arabic text
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();

        if (arabicLabel && size >= 6) {
          const fontSize = Math.max(10, size * 1.2);
          ctx.font = `${fontSize}px "Amiri", serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#1a1a1a";
          ctx.fillText(arabicLabel, x, y);
        }

        // English label below
        if (label && zoomLevel >= 2) {
          ctx.font = `${Math.max(6, size * 0.7)}px "Nunito", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#777";
          ctx.fillText(label, x, y + size + 2);
        }
      }
    },
    [zoomLevel]
  );

  const linkCanvasObject = useCallback(
    (link: GraphLink & { source: { x: number; y: number }; target: { x: number; y: number } }, ctx: CanvasRenderingContext2D) => {
      const { source, target } = link;
      if (!source.x || !target.x) return;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);

      if (link.dashed) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = link.color + "80";
      ctx.lineWidth = link.width || 1;
      ctx.stroke();
      ctx.setLineDash([]);
    },
    []
  );

  return (
    <div ref={containerRef} className="w-full rounded-xl overflow-hidden bg-gray-50">
      {typeof window !== "undefined" && (
        <ForceGraph2D
          graphData={data as { nodes: object[]; links: object[] }}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={nodeCanvasObject as (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => void}
          linkCanvasObject={linkCanvasObject as (link: object, ctx: CanvasRenderingContext2D, globalScale: number) => void}
          onNodeClick={(node) => onNodeClick?.(node as GraphNode)}
          nodeRelSize={1}
          linkDirectionalParticles={0}
          d3AlphaDecay={0.05}
          d3VelocityDecay={0.3}
          cooldownTime={3000}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      )}
    </div>
  );
}

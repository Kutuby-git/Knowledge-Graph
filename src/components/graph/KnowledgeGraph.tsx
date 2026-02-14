"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GraphData, GraphNode, GraphLink } from "@/lib/graph/transform";
import { generateStarField, drawStarField } from "@/lib/graph/stars";
import {
  drawUnitNode,
  drawSubThemeNode,
  drawWordNode,
  drawCentralWordNode,
  drawLink,
  paintNodePointerArea,
} from "@/lib/graph/renderers";
import { COSMIC } from "@/lib/graph/colors";

// Dynamic import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForceGraphMethods = any;

interface KnowledgeGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  zoomLevel: 1 | 2 | 3;
  highlightedNodes?: Set<string>;
  graphRef?: React.RefObject<ForceGraphMethods | null>;
}

export function KnowledgeGraph({
  data,
  width,
  height = 600,
  onNodeClick,
  onNodeHover,
  zoomLevel = 1,
  highlightedNodes,
  graphRef: externalRef,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalGraphRef = useRef<ForceGraphMethods>(null);
  const graphRef = externalRef || internalGraphRef;
  const starsRef = useRef(generateStarField(200, 4000));
  const timeRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const hoveredNodeRef = useRef<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: width || 800, height });

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current || width) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [width, height]);

  // Time counter for animations
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      timeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Opacity fade-in for new nodes/links
  useEffect(() => {
    const fadeIn = () => {
      let needsUpdate = false;
      for (const node of data.nodes) {
        if ((node._opacity ?? 0) < 1) {
          node._opacity = Math.min(1, (node._opacity ?? 0) + 0.05);
          needsUpdate = true;
        }
      }
      for (const link of data.links) {
        if ((link._opacity ?? 0) < 0.6) {
          link._opacity = Math.min(0.6, (link._opacity ?? 0) + 0.03);
          needsUpdate = true;
        }
      }
      if (needsUpdate) {
        graphRef.current?.d3ReheatSimulation?.();
      }
    };
    const interval = setInterval(fadeIn, 16);
    return () => clearInterval(interval);
  }, [data, graphRef]);

  // Force simulation configuration per zoom level
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;

    const charge = fg.d3Force("charge");
    const center = fg.d3Force("center");
    const link = fg.d3Force("link");

    if (charge) {
      charge.strength(zoomLevel === 1 ? -400 : zoomLevel === 2 ? -200 : -150);
      charge.distanceMax(zoomLevel === 1 ? 600 : 400);
    }
    if (center) {
      center.strength(zoomLevel === 1 ? 0.05 : 0.03);
    }
    if (link) {
      link.distance(
        zoomLevel === 1 ? 180 : zoomLevel === 2 ? 80 : 60
      );
    }

    fg.d3ReheatSimulation?.();
  }, [zoomLevel, graphRef, data]);

  // Star field background
  const onRenderFramePre = useCallback(
    (ctx: CanvasRenderingContext2D, globalScale: number) => {
      drawStarField(starsRef.current, ctx, globalScale, timeRef.current);
    },
    []
  );

  // Node rendering dispatch
  const nodeCanvasObject = useCallback(
    (
      node: GraphNode & { x: number; y: number },
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => {
      const isHovered = hoveredNodeRef.current === node.id;
      const isHighlighted = !highlightedNodes || highlightedNodes.has(node.id);

      // Dim non-highlighted nodes
      if (highlightedNodes && !isHighlighted && !isHovered) {
        const saved = node._opacity;
        node._opacity = (node._opacity ?? 1) * 0.15;
        renderNode(node, ctx, globalScale, isHovered);
        node._opacity = saved;
        return;
      }

      renderNode(node, ctx, globalScale, isHovered);
    },
    [highlightedNodes, zoomLevel]
  );

  function renderNode(
    node: GraphNode & { x: number; y: number },
    ctx: CanvasRenderingContext2D,
    globalScale: number,
    isHovered: boolean
  ) {
    const time = timeRef.current;
    if (node.type === "unit") {
      // In L3, the central word uses drawCentralWordNode, but units still use drawUnitNode
      drawUnitNode(node, ctx, globalScale, time, isHovered);
    } else if (node.type === "sub_theme") {
      drawSubThemeNode(node, ctx, globalScale, isHovered);
    } else if (node.type === "word") {
      // Central word in L3
      if (zoomLevel === 3 && node.size >= 20 && node.fx === 0 && node.fy === 0) {
        drawCentralWordNode(node, ctx, globalScale, time);
      } else {
        drawWordNode(node, ctx, globalScale, isHovered);
      }
    }
  }

  // Link rendering
  const linkCanvasObject = useCallback(
    (
      link: GraphLink & {
        source: { x: number; y: number };
        target: { x: number; y: number };
      },
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => {
      drawLink(link, ctx, globalScale);
    },
    []
  );

  // Hit testing
  const nodePointerAreaPaint = useCallback(
    (
      node: GraphNode & { x: number; y: number },
      color: string,
      ctx: CanvasRenderingContext2D
    ) => {
      paintNodePointerArea(node, color, ctx);
    },
    []
  );

  // Hover handler
  const handleNodeHover = useCallback(
    (node: (GraphNode & { x: number; y: number }) | null) => {
      hoveredNodeRef.current = node?.id ?? null;
      onNodeHover?.(node as GraphNode | null);
    },
    [onNodeHover]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: COSMIC.bg }}
    >
      {typeof window !== "undefined" && (
        <ForceGraph2D
          ref={graphRef}
          graphData={data as { nodes: object[]; links: object[] }}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={COSMIC.bg}
          nodeCanvasObject={
            nodeCanvasObject as (
              node: object,
              ctx: CanvasRenderingContext2D,
              globalScale: number
            ) => void
          }
          nodeCanvasObjectMode={() => "replace"}
          nodePointerAreaPaint={
            nodePointerAreaPaint as (
              node: object,
              color: string,
              ctx: CanvasRenderingContext2D
            ) => void
          }
          linkCanvasObject={
            linkCanvasObject as (
              link: object,
              ctx: CanvasRenderingContext2D,
              globalScale: number
            ) => void
          }
          linkCanvasObjectMode={() => "replace"}
          linkCurvature={((link: object) => (link as GraphLink).curvature || 0) as (link: object) => number}
          linkDirectionalParticles={((link: object) =>
            (link as GraphLink).type === "cross_unit" ? 2 : 0) as (link: object) => number}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleColor={((link: object) => (link as GraphLink).color) as (link: object) => string}
          linkDirectionalParticleWidth={2}
          onNodeClick={(node: object) =>
            onNodeClick?.(node as GraphNode)
          }
          onNodeHover={
            handleNodeHover as (node: object | null) => void
          }
          onRenderFramePre={
            onRenderFramePre as (
              ctx: CanvasRenderingContext2D,
              globalScale: number
            ) => void
          }
          nodeRelSize={1}
          d3AlphaDecay={0.04}
          d3VelocityDecay={0.3}
          cooldownTime={4000}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          autoPauseRedraw={true}
        />
      )}
    </div>
  );
}

/**
 * Canvas rendering functions for each node and link type in the cosmic graph.
 * All renderers paint directly onto the ForceGraph2D canvas.
 */

import type { GraphNode, GraphLink } from "./transform";
import { hexToRgba, COSMIC, RELATIONSHIP_COLORS } from "./colors";

// ─── Unit Node (Level 1 Galaxy) ─────────────────────────────────────────────

export function drawUnitNode(
  node: GraphNode & { x: number; y: number },
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  time: number,
  isHovered: boolean
): void {
  const { x, y, color, size } = node;
  const opacity = node._opacity ?? 1;
  if (opacity <= 0.01) return;

  const r = size;
  const pulse = isHovered ? 1 + 0.05 * Math.sin(time * 0.003) : 1;
  const drawR = r * pulse;

  // Outer glow halo
  const glowRadius = drawR * (isHovered ? 2.2 : 1.6);
  const glow = ctx.createRadialGradient(x, y, drawR * 0.5, x, y, glowRadius);
  glow.addColorStop(0, hexToRgba(color, 0.3 * opacity));
  glow.addColorStop(0.6, hexToRgba(color, 0.08 * opacity));
  glow.addColorStop(1, hexToRgba(color, 0));
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Main orb with radial gradient
  const grad = ctx.createRadialGradient(
    x - drawR * 0.25,
    y - drawR * 0.25,
    drawR * 0.1,
    x,
    y,
    drawR
  );
  grad.addColorStop(0, hexToRgba(color, 0.95 * opacity));
  grad.addColorStop(0.7, hexToRgba(color, 0.7 * opacity));
  grad.addColorStop(1, hexToRgba(color, 0.4 * opacity));
  ctx.beginPath();
  ctx.arc(x, y, drawR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Thin ring
  ctx.strokeStyle = hexToRgba(color, 0.6 * opacity);
  ctx.lineWidth = isHovered ? 2 : 1;
  ctx.stroke();

  // Emoji icon centered
  if (node.emoji) {
    const emojiSize = Math.max(14, drawR * 0.6);
    ctx.font = `${emojiSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = opacity;
    ctx.fillText(node.emoji, x, y - 2);
    ctx.globalAlpha = 1;
  }

  // Unit name below orb
  if (node.label) {
    const fontSize = Math.max(10, Math.min(14, drawR * 0.35));
    ctx.font = `600 ${fontSize}px "Nunito", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = hexToRgba(COSMIC.text, 0.9 * opacity);
    ctx.fillText(node.label, x, y + drawR + 6);
  }

  // Word count below name
  if (node.wordCount !== undefined) {
    const countFontSize = Math.max(8, Math.min(11, drawR * 0.25));
    ctx.font = `${countFontSize}px "Nunito", sans-serif`;
    ctx.fillStyle = hexToRgba(COSMIC.textDim, 0.7 * opacity);
    ctx.fillText(`${node.wordCount} words`, x, y + drawR + 22);
  }
}

// ─── Sub-Theme Node (Level 2 Cluster) ───────────────────────────────────────

export function drawSubThemeNode(
  node: GraphNode & { x: number; y: number },
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  isHovered: boolean
): void {
  const { x, y, color, size, label } = node;
  const opacity = node._opacity ?? 1;
  if (opacity <= 0.01) return;

  const r = size;

  // Soft glow
  if (isHovered) {
    const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2);
    glow.addColorStop(0, hexToRgba(color, 0.2 * opacity));
    glow.addColorStop(1, hexToRgba(color, 0));
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Semi-transparent circle
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(color, (isHovered ? 0.35 : 0.2) * opacity);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(color, 0.5 * opacity);
  ctx.lineWidth = isHovered ? 1.5 : 0.8;
  ctx.stroke();

  // Label
  if (label && globalScale > 0.6) {
    const fontSize = Math.max(8, Math.min(12, r * 0.8));
    ctx.font = `500 ${fontSize}px "Nunito", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = hexToRgba(COSMIC.textMid, 0.85 * opacity);
    ctx.fillText(label, x, y + r + 3);
  }
}

// ─── Word Node (Level 2/3) ──────────────────────────────────────────────────

export function drawWordNode(
  node: GraphNode & { x: number; y: number },
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  isHovered: boolean
): void {
  const { x, y, color, size, arabicLabel, label } = node;
  const opacity = node._opacity ?? 1;
  if (opacity <= 0.01) return;

  const r = size;

  // Glow on hover
  if (isHovered) {
    const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 3);
    glow.addColorStop(0, hexToRgba(color, 0.35 * opacity));
    glow.addColorStop(1, hexToRgba(color, 0));
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Glowing dot
  const dotGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
  dotGrad.addColorStop(0, hexToRgba(color, 0.95 * opacity));
  dotGrad.addColorStop(0.7, hexToRgba(color, 0.6 * opacity));
  dotGrad.addColorStop(1, hexToRgba(color, 0.2 * opacity));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = dotGrad;
  ctx.fill();

  // Secondary color ring for cross-unit words
  if (node.secondaryUnitCode) {
    ctx.strokeStyle = hexToRgba(color, 0.4 * opacity);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Arabic text (Amiri)
  if (arabicLabel && (globalScale > 1.2 || isHovered || r >= 8)) {
    const fontSize = Math.max(10, Math.min(16, r * 1.4));
    const font = `${fontSize}px "Amiri", serif`;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = hexToRgba(COSMIC.text, 0.95 * opacity);
    ctx.fillText(arabicLabel, x, y - r - 8);
  }

  // English label at higher zoom
  if (label && globalScale > 2) {
    const fontSize = Math.max(7, Math.min(10, r * 0.8));
    ctx.font = `${fontSize}px "Nunito", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = hexToRgba(COSMIC.textDim, 0.7 * opacity);
    ctx.fillText(label, x, y + r + 3);
  }
}

// ─── Central Word Node (Level 3 Star View) ──────────────────────────────────

export function drawCentralWordNode(
  node: GraphNode & { x: number; y: number },
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  time: number
): void {
  const { x, y, color, size, arabicLabel, label } = node;
  const opacity = node._opacity ?? 1;
  if (opacity <= 0.01) return;

  const r = size;
  const pulse = 1 + 0.03 * Math.sin(time * 0.002);
  const drawR = r * pulse;

  // Spotlight glow - large
  const spotlight = ctx.createRadialGradient(x, y, drawR * 0.3, x, y, drawR * 4);
  spotlight.addColorStop(0, hexToRgba(color, 0.25 * opacity));
  spotlight.addColorStop(0.4, hexToRgba(color, 0.08 * opacity));
  spotlight.addColorStop(1, hexToRgba(color, 0));
  ctx.beginPath();
  ctx.arc(x, y, drawR * 4, 0, Math.PI * 2);
  ctx.fillStyle = spotlight;
  ctx.fill();

  // Animated ring
  const ringProgress = (time * 0.001) % (Math.PI * 2);
  ctx.beginPath();
  ctx.arc(x, y, drawR + 6, ringProgress, ringProgress + Math.PI * 1.5);
  ctx.strokeStyle = hexToRgba(color, 0.4 * opacity);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Main orb
  const grad = ctx.createRadialGradient(
    x - drawR * 0.2,
    y - drawR * 0.2,
    drawR * 0.1,
    x,
    y,
    drawR
  );
  grad.addColorStop(0, hexToRgba(color, 0.95 * opacity));
  grad.addColorStop(0.6, hexToRgba(color, 0.7 * opacity));
  grad.addColorStop(1, hexToRgba(color, 0.35 * opacity));
  ctx.beginPath();
  ctx.arc(x, y, drawR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Large Arabic text
  if (arabicLabel) {
    const fontSize = Math.max(18, drawR * 0.9);
    ctx.font = `700 ${fontSize}px "Amiri", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = hexToRgba(COSMIC.text, 0.95 * opacity);
    ctx.fillText(arabicLabel, x, y);
  }

  // English label below
  if (label) {
    const fontSize = Math.max(10, drawR * 0.35);
    ctx.font = `600 ${fontSize}px "Nunito", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = hexToRgba(COSMIC.textMid, 0.8 * opacity);
    ctx.fillText(label, x, y + drawR + 10);
  }
}

// ─── Link Renderer ──────────────────────────────────────────────────────────

export function drawLink(
  link: GraphLink & {
    source: { x: number; y: number };
    target: { x: number; y: number };
  },
  ctx: CanvasRenderingContext2D,
  globalScale: number
): void {
  const { source, target } = link;
  if (!source.x || !target.x) return;

  const opacity = link._opacity ?? 0.6;
  if (opacity <= 0.01) return;

  const color = link.color || RELATIONSHIP_COLORS[link.type] || "#334155";
  const width = (link.width || 1) / Math.max(1, globalScale * 0.5);

  ctx.beginPath();
  ctx.moveTo(source.x, source.y);

  // Curved links for cross-unit bridges
  if (link.curvature && link.curvature !== 0) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2;
    const cpx = mx - dy * link.curvature;
    const cpy = my + dx * link.curvature;
    ctx.quadraticCurveTo(cpx, cpy, target.x, target.y);
  } else {
    ctx.lineTo(target.x, target.y);
  }

  // Dashed for opposites and semantic_similar
  if (link.dashed) {
    ctx.setLineDash([4 / globalScale, 4 / globalScale]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.strokeStyle = hexToRgba(color, opacity);
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.setLineDash([]);

  // Glow effect for relationship links (not "contains")
  if (link.type !== "contains" && link.type !== "cross_unit" && opacity > 0.3) {
    ctx.strokeStyle = hexToRgba(color, 0.1 * opacity);
    ctx.lineWidth = width * 3;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  }
}

// ─── Hit-Test Area ──────────────────────────────────────────────────────────

export function paintNodePointerArea(
  node: GraphNode & { x: number; y: number },
  color: string,
  ctx: CanvasRenderingContext2D
): void {
  const { x, y, size, type } = node;
  // Generous hit area for small nodes
  const hitR = type === "word" ? Math.max(size, 8) : size;
  ctx.beginPath();
  ctx.arc(x, y, hitR + 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

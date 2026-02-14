/**
 * Star field background for the cosmic graph visualization.
 * Pre-generated once, rendered every frame with twinkle animation.
 */

export interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkle: boolean;
  twinkleSpeed: number;
  twinklePhase: number;
}

/** Generate a random star field spread across the canvas coordinate space */
export function generateStarField(count = 200, spread = 4000): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      radius: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.6 + 0.2,
      twinkle: Math.random() > 0.6,
      twinkleSpeed: Math.random() * 0.002 + 0.001,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

/** Render the star field onto the canvas with twinkle animation */
export function drawStarField(
  stars: Star[],
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  time: number
): void {
  for (const star of stars) {
    let alpha = star.opacity;
    if (star.twinkle) {
      alpha *= 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
    }
    // Fade stars at very high zoom so they don't dominate
    if (globalScale > 3) {
      alpha *= Math.max(0, 1 - (globalScale - 3) / 5);
    }
    if (alpha <= 0.01) continue;

    const r = star.radius / Math.max(1, globalScale * 0.5);
    ctx.beginPath();
    ctx.arc(star.x, star.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 210, 240, ${alpha})`;
    ctx.fill();
  }
}

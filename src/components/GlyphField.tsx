"use client";

import { useEffect, useRef } from "react";

const CELL = 14;
const FRAME_MS = 50;
const LEVELS = 6;
/** One colour string per brightness level, parsed once. */
const TONES = Array.from({ length: LEVELS }, (_, i) => `rgb(232 234 238 / ${((i + 1) / LEVELS) * 0.5})`);

/** 0..1, smooth in space and time; cheap stand-in for noise. */
function field(x: number, y: number, t: number): number {
  const a = Math.sin(x * 0.11 + t * 0.5 + 1.7 * Math.sin(y * 0.07 - t * 0.3));
  const b = Math.sin(y * 0.13 - t * 0.4 + 1.3 * Math.sin(x * 0.05 + t * 0.2));
  const c = Math.sin((x + y) * 0.23 + t * 0.7);
  return 0.5 + 0.22 * a + 0.2 * b + 0.08 * c;
}

const smooth = (lo: number, hi: number, v: number) => {
  const k = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
  return k * k * (3 - 2 * k);
};

/**
 * Decorative backdrop: a grid of small glyphs whose size follows a drifting
 * field. "hero" keeps the middle clear for centred text; "corner" gathers the
 * glyphs top right, away from left-aligned text. The clear zones are CSS masks
 * in globals.css. Pauses when off screen or hidden, and draws one still frame
 * under reduced motion.
 */
export function GlyphField({ variant = "hero", className = "" }: { variant?: "hero" | "corner"; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cols = 0;
    let rows = 0;
    let weights = new Float32Array(0);
    let raf = 0;
    let last = 0;
    let visible = true;

    // Where glyphs may appear depends only on the cell, so it is worked out
    // once per resize rather than on every frame.
    const weigh = () => {
      weights = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let w = 0.5 + 0.75 * smooth(0.35, 1, x / cols) * (1 - smooth(0.25, 1, y / rows));
          if (variant === "hero") {
            const side = smooth(0.2, 0.95, Math.abs(x / cols - 0.5) * 2);
            const top = 1 - smooth(0, 0.5, y / rows);
            w = 0.3 + 0.7 * Math.max(side, top * 0.8);
          }
          weights[y * cols + x] = w;
        }
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      weigh();
      draw(performance.now());
    };

    // Glyphs are grouped by brightness level so a frame is a dozen draw calls,
    // not one per glyph.
    const draw = (now: number) => {
      const t = still ? 4 : now / 1000;
      const fills = Array.from({ length: LEVELS }, () => new Path2D());
      const rings = Array.from({ length: LEVELS }, () => new Path2D());
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // The corner keeps a floor so a trough in the field never empties it.
          const n = field(x, y, t);
          const v = (variant === "corner" ? 0.45 + 0.55 * n : n) * weights[y * cols + x]!;
          if (v < 0.3) continue;
          const level = Math.min(LEVELS - 1, Math.floor(Math.min(0.5, (v - 0.3) * 1.3) * 2 * LEVELS));
          const cx = x * CELL + CELL / 2;
          const cy = y * CELL + CELL / 2;
          const fill = fills[level]!;
          if (v < 0.44) fill.rect(cx - 0.5, cy - 0.5, 1, 1);
          else if (v < 0.56) fill.rect(cx - 1, cy - 1, 2, 2);
          else if (v < 0.7) {
            fill.rect(cx - 2.5, cy - 0.5, 5, 1);
            fill.rect(cx - 0.5, cy - 2.5, 1, 5);
          } else {
            rings[level]!.moveTo(cx + 3, cy);
            rings[level]!.arc(cx, cy, 3, 0, Math.PI * 2);
          }
        }
      }
      ctx.clearRect(0, 0, cols * CELL, rows * CELL);
      ctx.lineWidth = 1;
      for (let i = 0; i < LEVELS; i++) {
        ctx.fillStyle = ctx.strokeStyle = TONES[i]!;
        ctx.fill(fills[i]!);
        ctx.stroke(rings[i]!);
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden || now - last < FRAME_MS) return;
      last = now;
      draw(now);
    };

    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    const seen = new IntersectionObserver(([entry]) => (visible = entry?.isIntersecting ?? true));
    seen.observe(canvas);
    if (!still) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      sizes.disconnect();
      seen.disconnect();
    };
  }, [variant]);

  return (
    <div aria-hidden="true" className={`glyphs-fade pointer-events-none absolute inset-0 ${className}`}>
      <canvas ref={ref} className={`glyphs-${variant} size-full`} />
    </div>
  );
}

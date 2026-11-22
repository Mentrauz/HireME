"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { useEffect, useState } from "react";

/** Height of the sticky header, so in-page links don't land underneath it. */
const HEADER_OFFSET = -80;

/**
 * Site-wide Lenis smooth scrolling, skipped under reduced motion.
 */
export function SmoothScroll() {
  const [smooth, setSmooth] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSmooth(!reduced.matches);
    update();
    reduced.addEventListener("change", update);
    return () => reduced.removeEventListener("change", update);
  }, []);

  if (!smooth) return null;
  return <ReactLenis root options={{ lerp: 0.08, anchors: { offset: HEADER_OFFSET } }} />;
}

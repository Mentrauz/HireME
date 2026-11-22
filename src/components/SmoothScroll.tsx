"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { useEffect, useState } from "react";

/** Height of the sticky header, so in-page links don't land underneath it. */
const HEADER_OFFSET = -80;
/** How close to the right edge counts as "over the scrollbar", in px. */
const EDGE = 18;

/**
 * Site-wide scroll feel: Lenis smooth scrolling (skipped under reduced
 * motion), and a scrollbar that only shows while the pointer is over it.
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

  useEffect(() => {
    const root = document.documentElement;
    const show = (on: boolean) => root.toggleAttribute("data-scrollbar", on);
    // Browsers send no mouse events while the pointer is on the scrollbar
    // itself, so reveal it as the mouse nears it and keep it until the mouse
    // moves back into the page or leaves the window. That also covers drags.
    const move = (e: PointerEvent) => e.pointerType === "mouse" && show(e.clientX >= root.clientWidth - EDGE);
    const leave = () => show(false);

    window.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      root.removeEventListener("mouseleave", leave);
      show(false);
    };
  }, []);

  if (!smooth) return null;
  return <ReactLenis root options={{ anchors: { offset: HEADER_OFFSET } }} />;
}

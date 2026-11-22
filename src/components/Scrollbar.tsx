"use client";

import { useLenis } from "lenis/react";
import { useEffect, useRef } from "react";

/** Gap between the thumb and the window's top and bottom edges, in px. */
const PAD = 4;
const MIN_THUMB = 48;
/** How close to the right edge the mouse must be to reveal the bar, in px. */
const EDGE = 24;
/** How long the bar stays after scrolling stops, in ms. */
const IDLE_MS = 900;

/**
 * Replaces the browser's page scrollbar (hidden in globals.css) with a thin
 * floating thumb. It shows while scrolling or when the mouse nears the right
 * edge, can be dragged, and scrolls through Lenis when Lenis is running.
 * Decorative for assistive tech: keyboard and wheel scrolling are unchanged.
 */
export function Scrollbar() {
  const bar = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useEffect(() => {
    const root = document.documentElement;
    const track = bar.current;
    const knob = thumb.current;
    if (!track || !knob) return;

    let hideTimer = 0;
    let dragging = false;
    let near = false;
    let grabOffset = 0;

    const geometry = () => {
      const view = window.innerHeight;
      const total = root.scrollHeight;
      const height = Math.max(MIN_THUMB, (view * view) / total);
      return { height, maxScroll: total - view, maxTop: view - height - PAD * 2 };
    };

    const render = () => {
      const { height, maxScroll, maxTop } = geometry();
      track.toggleAttribute("data-off", maxScroll <= 1);
      knob.style.height = `${height}px`;
      const top = maxScroll > 0 ? (window.scrollY / maxScroll) * maxTop : 0;
      knob.style.transform = `translate3d(0, ${top}px, 0)`;
    };

    const show = () => {
      window.clearTimeout(hideTimer);
      track.dataset.active = "";
    };
    const hideSoon = () => {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (!dragging && !near) delete track.dataset.active;
      }, IDLE_MS);
    };

    const scrollTo = (y: number, immediate: boolean) => {
      const smooth = lenisRef.current;
      if (smooth) smooth.scrollTo(y, { immediate });
      else window.scrollTo({ top: y, behavior: "instant" });
    };

    const onScroll = () => {
      render();
      show();
      hideSoon();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const isNear = e.clientX >= window.innerWidth - EDGE;
      if (isNear === near) return;
      near = isNear;
      if (near) show();
      else hideSoon();
    };

    const onLeaveWindow = () => {
      near = false;
      hideSoon();
    };

    const onThumbDown = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      grabOffset = e.clientY - knob.getBoundingClientRect().top;
      knob.setPointerCapture(e.pointerId);
      track.dataset.drag = "";
      show();
    };

    const onThumbMove = (e: PointerEvent) => {
      if (!dragging) return;
      const { maxScroll, maxTop } = geometry();
      const top = Math.min(maxTop, Math.max(0, e.clientY - PAD - grabOffset));
      scrollTo(maxTop > 0 ? (top / maxTop) * maxScroll : 0, true);
    };

    const onThumbUp = () => {
      if (!dragging) return;
      dragging = false;
      delete track.dataset.drag;
      hideSoon();
    };

    // A press on the empty strip centres the thumb on that point.
    const onTrackDown = (e: PointerEvent) => {
      if (e.target !== track) return;
      const { height, maxScroll, maxTop } = geometry();
      const top = Math.min(maxTop, Math.max(0, e.clientY - PAD - height / 2));
      scrollTo(maxTop > 0 ? (top / maxTop) * maxScroll : 0, false);
    };

    const sizes = new ResizeObserver(render);
    sizes.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", render, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("mouseleave", onLeaveWindow);
    knob.addEventListener("pointerdown", onThumbDown);
    knob.addEventListener("pointermove", onThumbMove);
    knob.addEventListener("pointerup", onThumbUp);
    knob.addEventListener("pointercancel", onThumbUp);
    track.addEventListener("pointerdown", onTrackDown);
    render();

    return () => {
      window.clearTimeout(hideTimer);
      sizes.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", render);
      window.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("mouseleave", onLeaveWindow);
      knob.removeEventListener("pointerdown", onThumbDown);
      knob.removeEventListener("pointermove", onThumbMove);
      knob.removeEventListener("pointerup", onThumbUp);
      knob.removeEventListener("pointercancel", onThumbUp);
      track.removeEventListener("pointerdown", onTrackDown);
    };
  }, []);

  return (
    <div ref={bar} aria-hidden="true" className="scrollbar" data-off="">
      <div ref={thumb} className="scrollbar-thumb" />
    </div>
  );
}

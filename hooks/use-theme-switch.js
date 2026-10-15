"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

// Switching light/dark restyles the whole page at once, which looks like a
// flash. Where the browser can, the new theme spreads out in a circle from the
// button that was pressed; elsewhere, colours ease over for a moment.
export function useThemeSwitch() {
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setIsMounted(true), []);

  const isDark = !isMounted || resolvedTheme !== "light";

  const toggleTheme = (event) => {
    const next = isDark ? "light" : "dark";
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // next-themes sets the class after render; set it now so the new page is
    // ready when the browser takes its "after" picture.
    const apply = () => {
      root.classList.remove("light", "dark");
      root.classList.add(next);
      root.style.colorScheme = next;
      flushSync(() => setTheme(next));
    };

    if (reduced) {
      setTheme(next);
    } else if (document.startViewTransition) {
      // Centre of the button pressed, or the middle of the screen.
      const rect = event?.currentTarget?.getBoundingClientRect?.();
      const x = rect ? rect.left + rect.width / 2 : innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : innerHeight / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

      const transition = document.startViewTransition(apply);
      transition.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" }
          );
        })
        // A quick second click skips this transition; the theme still changes.
        .catch(() => {});
    } else {
      root.classList.add("theme-fading");
      apply();
      setTimeout(() => root.classList.remove("theme-fading"), 400);
    }
  };

  return { isDark, toggleTheme };
}

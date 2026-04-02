import { useEffect } from "react";
import Lenis from "lenis";
import { setLenisInstance } from "./lenisInstance";
import "lenis/dist/lenis.css";

/** Matches Abhyantar Designs — fixed nav clearance for hash targets */
const NAV_SCROLL_OFFSET = -96;

export default function SmoothScroll({ children }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.92,
    });
    setLenisInstance(lenis);

    const onAnchorClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: NAV_SCROLL_OFFSET });
    };

    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      lenis.destroy();
      setLenisInstance(null);
    };
  }, []);

  return children;
}

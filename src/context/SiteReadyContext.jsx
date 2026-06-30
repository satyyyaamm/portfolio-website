import { createContext, useContext } from 'react';
import { useReducedMotion } from 'framer-motion';

export const SiteReadyContext = createContext(true);

/** True once the loading screen has fully finished. */
export function useSiteReady() {
  return useContext(SiteReadyContext);
}

/** True when mount / scroll animations are allowed to run. */
export function useSiteAnimationsEnabled() {
  const ready = useSiteReady();
  const reducedMotion = useReducedMotion();
  return ready || reducedMotion;
}

/** Props for scroll-triggered section reveals gated on loader completion. */
export function scrollRevealProps(animating, reducedMotion, viewport = { once: true, amount: 0.45 }) {
  if (reducedMotion) {
    return { initial: false };
  }
  return {
    initial: 'hidden',
    animate: animating ? undefined : 'hidden',
    whileInView: animating ? 'visible' : undefined,
    viewport,
  };
}

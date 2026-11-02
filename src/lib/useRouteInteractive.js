import { useEffect, useRef } from 'react';

/**
 * After a route curtain covers and bumps `readyRequestId`, wait until the
 * destination can take input, then call `onInteractive`.
 */
export function useRouteInteractive(readyRequestId, onInteractive, isReady) {
  const isReadyRef = useRef(isReady);
  const onInteractiveRef = useRef(onInteractive);
  isReadyRef.current = isReady;
  onInteractiveRef.current = onInteractive;

  useEffect(() => {
    if (!readyRequestId || !onInteractiveRef.current) return undefined;
    let cancelled = false;
    let tries = 0;
    let raf = 0;
    let timer = 0;

    const tick = () => {
      if (cancelled) return;
      tries += 1;
      const check = isReadyRef.current;
      const ok = typeof check === 'function' ? check() : true;
      if (ok || tries > 120) {
        onInteractiveRef.current?.();
        return;
      }
      timer = window.setTimeout(() => {
        raf = window.requestAnimationFrame(tick);
      }, 40);
    };

    raf = window.requestAnimationFrame(() => {
      raf = window.requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [readyRequestId]);
}

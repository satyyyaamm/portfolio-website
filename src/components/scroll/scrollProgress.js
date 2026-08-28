import { createContext, useContext } from 'react';

export const ScrollProgressContext = createContext(null);

export function useScrollProgress() {
  const ctx = useContext(ScrollProgressContext);
  if (!ctx) throw new Error('useScrollProgress must be used inside ScrollComposition');
  return ctx;
}

/** Non-throwing — for components that may render outside the scroll canvas. */
export function useOptionalScrollProgress() {
  return useContext(ScrollProgressContext);
}

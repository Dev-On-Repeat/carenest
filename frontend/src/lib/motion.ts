import { useReducedMotion } from 'framer-motion';

/** Shared motion vocabulary. Every entrance is a short vertical rise; nothing
 *  bounces, spins for decoration, or moves horizontally. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function useMotionPresets() {
  const reduce = useReducedMotion();
  const d = reduce ? 0 : 1;

  return {
    reduced: reduce === true,
    fadeUp: {
      initial: reduce ? undefined : { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.42 * d || 0.001, ease: EASE_OUT },
    },
    staggerChildren: reduce ? 0 : 0.055,
    pageTransition: {
      initial: reduce ? undefined : { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: reduce ? undefined : { opacity: 0 },
      transition: { duration: 0.3 * d || 0.001, ease: EASE_OUT },
    },
    hoverLift: reduce ? undefined : { y: -2 },
  };
}

/** Sequential delay helper for lists. */
export function rise(index: number, step = 0.05) {
  return { transition: { delay: index * step } };
}

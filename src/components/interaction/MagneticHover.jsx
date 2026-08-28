import { createElement } from 'react';
import { useMagneticHover } from './useMagneticHover.js';

/**
 * Wrapper form of `useMagneticHover` for surfaces you don't own the markup of:
 *
 *   <MagneticHover preset="media"><Card /></MagneticHover>
 *
 * Prefer the hook directly when you can put the ref on the real element — it
 * avoids the extra wrapper node.
 */
export function MagneticHover({
  preset = 'media',
  as = 'div',
  className = '',
  children,
  ...rest
}) {
  const ref = useMagneticHover(preset);

  return createElement(
    as,
    { ref, className: `magnetic ${className}`.trim(), ...rest },
    children
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';

// Start rendering a section this far before it scrolls into view, so it is ready on arrival
const PRELOAD_MARGIN = '600px 0px';

/**
 * Below-the-fold section that renders only once the user scrolls near it (Swiggy-style): a
 * screen switch then builds and paints just the first screen, so it is ready almost at once.
 * Once rendered it stays rendered (kept with the page when Next.js hides it), and
 * content-visibility lets the browser skip painting it while it is off screen.
 *
 * `minHeight` reserves roughly the section's height so the scrollbar and scroll position don't
 * jump when it fills in.
 */
export function LazySection({ minHeight = 320, children }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      className="lazy-section"
      style={shown ? { containIntrinsicSize: `auto ${minHeight}px` } : { minHeight }}
    >
      {shown ? children : null}
    </div>
  );
}

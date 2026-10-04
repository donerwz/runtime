import React, { useEffect, useRef, useState } from 'react';

interface Props {
  children: React.ReactNode;
  /** Caps the visible height; the rest becomes scrollable. */
  maxHeight?: string;
}

/**
 * Clips tall content to a maximum height and makes the overflow scrollable. A
 * bottom fade is shown only while there is genuinely more content below, so the
 * hint never appears on a list that already fits.
 */
export default function ScrollPanel({ children, maxHeight = '50vh' }: Props) {
  const inner = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div className="scroll-region">
      <div className="scroll-region-inner" ref={inner} style={{ maxHeight }}>
        {children}
      </div>
      {overflowing && <div className="scroll-region-fade" aria-hidden="true" />}
    </div>
  );
}

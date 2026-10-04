import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Fades page content in on every route change.
 *
 * The wrapper is keyed on the pathname, so React unmounts and remounts it on
 * each navigation. That remount is what re-triggers the CSS animation — an
 * animation cannot re-run on an element that merely re-renders.
 *
 * Covers sign-in and sign-out too, since both are route changes
 * (/login <-> /). Motion is suppressed under prefers-reduced-motion.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="page-transition" key={pathname}>
      {children}
    </div>
  );
}
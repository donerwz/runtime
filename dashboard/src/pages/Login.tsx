// Login page. Supervisors paste their bearer token to authenticate.
//
// No auth call on submit — the token is validated by the backend on the first
// real API call, and a 401 anywhere drops it and bounces back here. Keep the
// login simple for the demo.

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MOTIF_CELLS = 21;
const MOTIF_GRAY = '#f0f0f1';
// Green steps mirror HoursHeatmap's scale so the motif reads as the same product.
const MOTIF_GREENS = ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#16a34a'];
const MOTIF_GRAY_RGB = [240, 240, 241];

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const pickGreen = () => MOTIF_GREENS[Math.floor(Math.random() * MOTIF_GREENS.length)];

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: Rgb, b: Rgb, t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/**
 * Colour a cell should show at `p` (0..1) through one cycle. Used to paint the
 * resting colour before the animation takes over, so the first painted frame
 * already matches the phase the cell is starting from. Without this the grid
 * opens on 21 full-strength greens and then visibly drains as the animations
 * resolve — the load flash.
 */
function shadeAt(
  p: number,
  to: string,
  dwellEnd: number,
  upEnd: number,
  holdEnd: number
): string {
  const target = hexToRgb(to);
  if (p <= dwellEnd) return MOTIF_GRAY;
  if (p < upEnd) return mix(MOTIF_GRAY_RGB as Rgb, target, (p - dwellEnd) / (upEnd - dwellEnd));
  if (p <= holdEnd) return to;
  return mix(target, MOTIF_GRAY_RGB as Rgb, (p - holdEnd) / Math.max(1e-6, 1 - holdEnd));
}

/**
 * Drives the decorative heatmap: every cell runs gray -> a random green -> gray,
 * then re-rolls both the shade and the timings before cycling again.
 *
 * CSS keyframes cannot re-randomise between iterations, so each cell gets its
 * own Web Animation chained off `finished`.
 *
 * Three details keep the grid calm rather than pulsing:
 *  - Each cell is assigned one personal period for the lifetime of the page. If
 *    every cycle drew a fully independent duration, the phases would random-walk
 *    and could drift back into step; a stable per-cell period means they separate
 *    and stay separated.
 *  - The gray->green, hold and green->gray phases are re-rolled every cycle, and
 *    a randomised pause sits at gray, so blocks do not all drain back to the
 *    empty colour at the same moment.
 *  - The opening phase is bounded to under a full cycle, so no animation is
 *    created already-finished, and each cell is pre-painted at its own phase so
 *    load looks like steady state instead of a flash of full-strength green.
 */
function useMotifCells(motionAllowed: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    const cells = Array.from(grid.querySelectorAll<HTMLElement>('.auth-motif-cell'));
    if (cells.length === 0) return;

    if (!motionAllowed) {
      // No animation: settle each block on its own random shade.
      cells.forEach((c) => {
        c.style.backgroundColor = pickGreen();
      });
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    // Personal rhythm per cell, drawn once. The wide spread is what keeps the
    // phases from drifting back together.
    const periods = cells.map(() => rand(2200, 6000));
    const started = cells.map(() => false);

    const cycle = (cell: HTMLElement, index: number) => {
      if (cancelled) return;

      // Randomised speed, held within ±12% of this cell's own period so one
      // cell can never be dragged into step with a neighbour.
      const total = periods[index] * rand(0.88, 1.12);
      const to = pickGreen();
      // The dwell at gray lives INSIDE the animation rather than as a separate
      // pause between animations. That matters at load: if the gray time were
      // external, a cell's first cycle would contain no dwell at all, so the grid
      // would open noticeably more vivid than it ever gets in steady state.
      const dwell = total * rand(0.14, 0.3);
      const up = total * rand(0.22, 0.34);
      const down = total * rand(0.22, 0.34);
      const hold = Math.max(120, total - dwell - up - down);
      const dwellEnd = dwell / total;
      const upEnd = (dwell + up) / total;
      const holdEnd = (dwell + up + hold) / total;

      // The first cycle of each cell begins partway through, so nothing is ever
      // sitting at gray together on first paint. The phase is capped below the
      // cycle length: a delay at or past the duration creates an animation that
      // is already finished, which reads as a jolt rather than motion.
      const first = !started[index];
      started[index] = true;
      const phase = first ? rand(0, total * 0.92) : 0;

      if (first) {
        // Pre-paint the colour this cell is about to jump to, so the very first
        // painted frame is the steady state rather than a flash of full green.
        cell.style.backgroundColor = shadeAt(phase / total, to, dwellEnd, upEnd, holdEnd);
      }

      const anim = cell.animate(
        [
          { backgroundColor: MOTIF_GRAY, offset: 0 },
          { backgroundColor: MOTIF_GRAY, offset: dwellEnd },
          { backgroundColor: to, offset: upEnd },
          { backgroundColor: to, offset: holdEnd },
          { backgroundColor: MOTIF_GRAY, offset: 1 },
        ],
        {
          duration: total,
          easing: 'ease-in-out',
          ...(first ? { delay: -phase } : null),
        }
      );

      anim.finished
        .then(() => {
          if (cancelled) return;
          cycle(cell, index);
        })
        .catch(() => {
          /* cancelled on unmount */
        });
    };

    // Negligible stagger: the negative delay already scatters the phases, and
    // any real wait here would leave cells sitting on their base gray.
    cells.forEach((cell, i) => later(() => cycle(cell, i), rand(0, 120)));

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      cells.forEach((c) => c.getAnimations().forEach((a) => a.cancel()));
    };
  }, [motionAllowed]);

  return ref;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function Login() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const reducedMotion = usePrefersReducedMotion();
  const motifRef = useMotifCells(!reducedMotion);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Paste your API token to continue.');
      return;
    }
    localStorage.setItem('tracker_token', trimmed);
    navigate('/', { replace: true });
  }

  return (
    <div className="auth-split">
      <section className="auth-pane">
        <div className="auth-form">
          <div className="brand">
            <img className="brand-logo" src="/weblogo.webp" alt="Runtime" />
          </div>
          <p className="tagline">Volunteer program dashboard for supervisors</p>

          <form onSubmit={submit} noValidate>
            <p className="auth-section-label">Sign in</p>

            {error && <p className="error-text">{error}</p>}

            <label className="field">
              API token
              <input
                type="text"
                value={token}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                placeholder="Paste supervisor token"
                onChange={(e) => {
                  setToken(e.target.value);
                  if (error) setError('');
                }}
              />
            </label>

            <button type="submit" className="btn-primary auth-submit">
              Sign in
            </button>
          </form>

          <p className="note">
            Generate a token with <code>python -m backend.auth &lt;user_id&gt;</code>. It is
            stored in this browser only.
          </p>
        </div>
      </section>

      <aside className="auth-aside">
        <div className="auth-aside-inner">
          <div>
            <p className="auth-eyebrow">Volunteer program</p>
            <h2 className="auth-headline">
              See your volunteers&rsquo; tracked hours and get AI-analyzed feedback on their work
            </h2>
            <p className="auth-lede">
              Runtime turns a volunteer&rsquo;s tracked activity into feedback, so supervisors can have an easier way to manage their volunteers
              chasing spreadsheets.
            </p>
          </div>

          <div className="auth-motif" ref={motifRef} aria-hidden="true">
            {[0, 1, 2].map((row) => (
              <div className="auth-motif-row" key={row}>
                {Array.from({ length: MOTIF_CELLS / 3 }, (_, i) => (
                  <span className="auth-motif-cell" key={i} />
                ))}
              </div>
            ))}
          </div>

          <ul className="auth-points">
            <li>Tracked hours per day, per volunteer</li>
            <li>AI-analyzed scores of each volunteer's work</li>
            <li>Facilitate coding volunteering tracking</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
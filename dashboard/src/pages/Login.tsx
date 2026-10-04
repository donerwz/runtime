// Login page. Supervisors paste their bearer token to authenticate.
//
// No auth call on submit — the token is validated by the backend on the first
// real API call, and a 401 anywhere drops it and bounces back here. Keep the
// login simple for the demo.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Decorative motif on the right: a slice of the cohort heatmap. Purely
// illustrative — shade steps mirror HoursHeatmap's scale so the two read as
// the same product, but none of these are real volunteers.
const MOTIF_ROWS = [
  ['#dcfce7', '#dcfce7', '#86efac', '#86efac', '#16a34a', '#dcfce7', '#86efac'],
  ['#dcfce7', '#86efac', '#16a34a', '#f0f0f1', '#16a34a', '#16a34a', '#dcfce7'],
  ['#f0f0f1', '#dcfce7', '#86efac', '#86efac', '#dcfce7', '#86efac', '#f0f0f1'],
];

export default function Login() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Paste your API token to continue.');
      return;
    }
    localStorage.setItem('tracker_token', trimmed);
    navigate('/cohort', { replace: true });
  }

  return (
    <div className="auth-split">
      <section className="auth-pane">
        <div className="auth-form">
          <div className="brand">Runtime</div>
          <p className="tagline">Volunteer program supervisor dashboard.</p>

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
              Runtime turns a volunteer&rsquo;s tracked activity into advisory feedback with a
              citation behind every score, so supervisors spend their time coaching instead of
              chasing spreadsheets.
            </p>
          </div>

          <div className="auth-motif" aria-hidden="true">
            {MOTIF_ROWS.map((row, ri) => (
              <div className="auth-motif-row" key={ri}>
                {row.map((color, ci) => (
                  <span className="auth-motif-cell" key={ci} style={{ background: color }} />
                ))}
              </div>
            ))}
          </div>

          <ul className="auth-points">
            <li>Tracked hours per day, per volunteer</li>
            <li>AI-generated scores of each volunteer's work</li>
            <li>Facilitate coding volunteering tracking</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
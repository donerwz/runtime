import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

const LINKS: Array<{ to: string; label: string }> = [
  { to: '/', label: 'Home' },
  { to: '/cohort', label: 'Full cohort' },
  { to: '/shifts', label: 'Shifts' },
];

export default function Layout({ children }: Props) {
  const navigate = useNavigate();

  function signOut() {
    localStorage.removeItem('tracker_token');
    // Navigate straight to /login. Going to '/' instead is a no-op when the user
    // is already on the home page: the router fires no navigation, so
    // ProtectedRoute never re-runs its token check and the protected page stays
    // on screen with no token — the next API call then 401s and bounces them
    // here anyway, one click later than expected.
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <nav className="topnav">
        <div className="brand">
          <img className="brand-logo" src="/weblogo.webp" alt="Runtime" />
          <span>· supervisor</span>
        </div>
        <div className="links">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              // "/" would otherwise stay active on every route, since NavLink
              // matches prefixes unless `end` is set.
              end={l.to === '/'}
              className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="spacer" />
        <button type="button" className="signout" onClick={signOut}>
          Sign out
        </button>
      </nav>
      <main className="page">{children}</main>
    </div>
  );
}
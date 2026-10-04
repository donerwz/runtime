import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

const LINKS: Array<{ to: string; label: string }> = [
  { to: '/cohort', label: 'Cohort' },
  { to: '/shifts', label: 'Shifts' },
  { to: '/digest', label: 'Digest' },
];

export default function Layout({ children }: Props) {
  const navigate = useNavigate();

  function signOut() {
    localStorage.removeItem('tracker_token');
    navigate('/', { replace: true });
  }

  return (
    <div className="app-shell">
      <nav className="topnav">
        <div className="brand">
          Runtime <span>· supervisor</span>
        </div>
        <div className="links">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
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
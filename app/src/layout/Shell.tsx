import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppAtmosphere } from "./AppAtmosphere";

const links = [
  { to: "/", label: "Home" },
  { to: "/notes", label: "Notes" },
  { to: "/moments", label: "Moments" },
  { to: "/insights", label: "Insights" },
  { to: "/memories", label: "Memories" },
  { to: "/profile", label: "Profile" },
];

export function Shell({ children }: { children: ReactNode }) {
  const { user, logOut } = useAuth();
  return (
    <div className="shell">
      <AppAtmosphere />
      <header className="shell-header">
        <a className="shell-brand" href="#/">
          <span className="shell-logo">Oria AI</span>
          <span className="shell-sub">Web</span>
        </a>
        <nav className="shell-nav" aria-label="Main">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="shell-user">
          <a className="shell-site-link muted small" href="https://oria.me/" target="_blank" rel="noreferrer">
            oria.me
          </a>
          <span className="muted small shell-email">{user?.email ?? user?.uid}</span>
          <button type="button" className="btn ghost" onClick={() => void logOut()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="shell-main">{children}</main>
    </div>
  );
}

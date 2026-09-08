import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Matches `HomeGreetingHeaderView.greetingText` in the iOS app (local hour + first word of display name). */
function homeGreetingAt(date: Date, displayName: string | null | undefined): string {
  const trimmed = displayName?.trim();
  const name = trimmed ? (trimmed.split(/\s+/)[0] ?? "there") : "there";
  const hour = date.getHours();
  let period: string;
  if (hour >= 5 && hour < 12) period = "Good Morning";
  else if (hour >= 12 && hour < 17) period = "Good Afternoon";
  else if (hour >= 17 && hour < 22) period = "Good Evening";
  else period = "Good Night";
  return `${period}, ${name}!`;
}

/** Matches `HomeGreetingHeaderView.formattedDate` (`EEEE, MMMM d`). */
function formattedHomeDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(date);
}

export function HomePage() {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const greeting = homeGreetingAt(now, user?.displayName);
  const dateLine = formattedHomeDate(now);

  return (
    <div className="page page-wide">
      <header className="page-hero">
        <p className="eyebrow">{dateLine}</p>
        <h1 className="page-title">{greeting}</h1>
        <p className="page-lede muted">
          Everything here mirrors your Oria iOS app — notes, moments,
          insights, and memories in one calm surface.
        </p>
      </header>
      <ul className="tile-grid">
        <li>
          <Link className="tile" to="/notes">
            <h2>Notes</h2>
            <p>Write and edit notes stored in Firestore.</p>
          </Link>
        </li>
        <li>
          <Link className="tile" to="/moments">
            <h2>Moments</h2>
            <p>Browse your posts and captions.</p>
          </Link>
        </li>
        <li>
          <Link className="tile" to="/insights">
            <h2>Insights</h2>
            <p>Read cached insight documents by category.</p>
          </Link>
        </li>
        <li>
          <Link className="tile" to="/memories">
            <h2>Memories</h2>
            <p>Long-term memories (same limits as the app).</p>
          </Link>
        </li>
        <li>
          <Link className="tile" to="/profile">
            <h2>Profile</h2>
            <p>Edit profile fields stored under your user.</p>
          </Link>
        </li>
      </ul>
    </div>
  );
}

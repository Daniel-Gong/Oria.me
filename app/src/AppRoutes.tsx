import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppAtmosphere } from "./layout/AppAtmosphere";
import { Shell } from "./layout/Shell";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { NotesPage } from "./pages/NotesPage";
import { MomentsPage } from "./pages/MomentsPage";
import { InsightsPage } from "./pages/InsightsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MemoriesPage } from "./pages/MemoriesPage";

function ProtectedLayout() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="login-page">
        <AppAtmosphere />
        <p className="muted">Loading…</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/moments" element={<MomentsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/memories" element={<MemoriesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

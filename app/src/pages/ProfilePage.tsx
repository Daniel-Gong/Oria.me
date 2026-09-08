import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { getDb } from "../firebase";

type ProfileForm = {
  username: string;
  displayName: string;
  gender: string;
  dateOfBirth: string;
  homeAddress: string;
  workAddress: string;
  height: string;
  weight: string;
  emergencyContact: string;
};

export function ProfilePage() {
  const { user, deleteAccount } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    username: "",
    displayName: "",
    gender: "",
    dateOfBirth: "",
    homeAddress: "",
    workAddress: "",
    height: "",
    weight: "",
    emergencyContact: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ref = doc(getDb(), "users", user.uid, "profile", "info");
      const snap = await getDoc(ref);
      const data = snap.data();
      if (!data) {
        setForm((f) => ({ ...f, displayName: user.displayName ?? "" }));
        setLoading(false);
        return;
      }
      const dobTs = data["dateOfBirth"] as Timestamp | undefined;
      const dob =
        dobTs && typeof dobTs.toDate === "function"
          ? dobTs.toDate().toISOString().slice(0, 10)
          : "";
      setForm({
        username: (data["username"] as string) ?? "",
        displayName: (data["displayName"] as string) ?? "",
        gender: (data["gender"] as string) ?? "",
        dateOfBirth: dob,
        homeAddress: (data["homeAddress"] as string) ?? "",
        workAddress: (data["workAddress"] as string) ?? "",
        height: String(data["height"] ?? ""),
        weight: String(data["weight"] ?? ""),
        emergencyContact: (data["emergencyContact"] as string) ?? "",
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const displayName = form.displayName.trim();
      const displayNameSearch = displayName.toLowerCase();
      const height = Number(form.height) || 0;
      const weight = Number(form.weight) || 0;
      const dob = form.dateOfBirth ? new Date(`${form.dateOfBirth}T12:00:00`) : new Date(0);

      await setDoc(
        doc(getDb(), "users", user.uid, "profile", "info"),
        {
          displayName,
          displayNameSearch,
          gender: form.gender,
          dateOfBirth: Timestamp.fromDate(dob),
          homeAddress: form.homeAddress,
          workAddress: form.workAddress,
          height,
          weight,
          emergencyContact: form.emergencyContact,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      if (displayName) {
        await updateProfile(user, { displayName });
      }
      setMessage("Profile saved.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page-hero">
        <p className="eyebrow">Account</p>
        <h1 className="page-title">Profile</h1>
        <p className="page-lede muted">Edit the same profile fields stored with your Oria account.</p>
      </header>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <form className="card stack" onSubmit={(e) => void onSave(e)}>
          <label className="field">
            <span>Username (read-only)</span>
            <input value={form.username} readOnly className="readonly" />
          </label>
          <label className="field">
            <span>Display name</span>
            <input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Gender</span>
            <input value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} />
          </label>
          <label className="field">
            <span>Date of birth</span>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
            />
          </label>
          <label className="field">
            <span>Home address</span>
            <input value={form.homeAddress} onChange={(e) => setForm((f) => ({ ...f, homeAddress: e.target.value }))} />
          </label>
          <label className="field">
            <span>Work address</span>
            <input value={form.workAddress} onChange={(e) => setForm((f) => ({ ...f, workAddress: e.target.value }))} />
          </label>
          <label className="field">
            <span>Height (cm)</span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.height}
              onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
            />
          </label>
          <label className="field">
            <span>Weight (kg)</span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
            />
          </label>
          <label className="field">
            <span>Emergency contact</span>
            <textarea
              rows={2}
              value={form.emergencyContact}
              onChange={(e) => setForm((f) => ({ ...f, emergencyContact: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      )}
      {loading ? null : <section className="card stack danger-zone">
        <h2>Delete account</h2>
        <p className="muted">
          Permanently delete your Oria AI account and associated data. This cannot be undone.{" "}
          <a href="https://oria.me/delete-account">What is deleted</a>
        </p>
        {confirmDelete ? (
          <div className="row gap">
            <button
              type="button"
              className="btn danger"
              disabled={deleting}
              onClick={() => {
                void (async () => {
                  setDeleting(true);
                  setError(null);
                  try {
                    await deleteAccount();
                  } catch (e: unknown) {
                    const code = e && typeof e === "object" && "code" in e ? String(e.code) : "";
                    setError(
                      code === "auth/requires-recent-login"
                        ? "Sign out, sign in again, then retry. Or use oria.me/delete-account."
                        : e instanceof Error
                          ? e.message
                          : "Delete failed",
                    );
                    setDeleting(false);
                  }
                })();
              }}
            >
              {deleting ? "Deleting…" : "Confirm delete"}
            </button>
            <button type="button" className="btn ghost" disabled={deleting} onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="btn danger ghost" onClick={() => setConfirmDelete(true)}>
            Delete account
          </button>
        )}
      </section>}
    </div>
  );
}

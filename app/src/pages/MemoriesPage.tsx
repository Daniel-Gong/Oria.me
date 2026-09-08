import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { getDb } from "../firebase";

type MemoryRow = {
  id: string;
  content: string;
  type: string;
  categories: string[];
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

const MEMORY_TYPES = ["factual", "episodic", "inferred"] as const;

export function MemoriesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<MemoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("factual");
  const [categories, setCategories] = useState("global");

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(getDb(), "users", user.uid, "memories"), orderBy("updatedAt", "desc"), limit(100));
      const snap = await getDocs(q);
      const list: MemoryRow[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        const source = (data["source"] as string) || "user";
        if (source === "profile") {
          continue;
        }
        const c = data["createdAt"];
        const u = data["updatedAt"];
        list.push({
          id: d.id,
          content: (data["content"] as string) || "",
          type: (data["type"] as string) || "factual",
          categories: (data["categories"] as string[]) || [],
          source,
          createdAt: c && typeof c.toDate === "function" ? c.toDate() : new Date(0),
          updatedAt: u && typeof u.toDate === "function" ? u.toDate() : new Date(0),
        });
      }
      setRows(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load memories");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !content.trim()) {
      return;
    }
    setError(null);
    try {
      const cats = categories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const ref = doc(collection(getDb(), "users", user.uid, "memories"));
      await setDoc(ref, {
        content: content.trim(),
        type,
        categories: cats.length ? cats : ["global"],
        source: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setContent("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not add memory");
    }
  }

  return (
    <div className="page">
      <header className="page-hero">
        <p className="eyebrow">Long-term</p>
        <h1 className="page-title">Memories</h1>
        <p className="page-lede muted">
          User-managed memories (profile-synced entries are hidden here, same as the iOS app).
        </p>
      </header>
      {error ? <p className="error">{error}</p> : null}
      <section className="card stack">
        <h2>Add memory</h2>
        <form className="stack" onSubmit={(e) => void onAdd(e)}>
          <label className="field">
            <span>Content</span>
            <textarea required rows={3} value={content} onChange={(e) => setContent(e.target.value)} />
          </label>
          <label className="field">
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {MEMORY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Categories (comma-separated)</span>
            <input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="global" />
          </label>
          <button type="submit" className="btn primary">
            Add
          </button>
        </form>
      </section>
      <section style={{ marginTop: "2rem" }}>
        <h2>Your memories</h2>
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && rows.length === 0 ? <p className="muted">No memories yet.</p> : null}
        <ul className="stack gap">
          {rows.map((m) => (
            <MemoryEditor key={m.id} memory={m} onChanged={load} onError={setError} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function MemoryEditor({
  memory,
  onChanged,
  onError,
}: {
  memory: MemoryRow;
  onChanged: () => Promise<void>;
  onError: (s: string | null) => void;
}) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(memory.content);
  const [cats, setCats] = useState(memory.categories.join(", "));

  async function save() {
    if (!user) {
      return;
    }
    onError(null);
    try {
      const categories = cats
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await updateDoc(doc(getDb(), "users", user.uid, "memories", memory.id), {
        content: content.trim(),
        categories: categories.length ? categories : ["global"],
        updatedAt: serverTimestamp(),
      });
      setEditing(false);
      await onChanged();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function remove() {
    if (!user || !confirm("Delete this memory?")) {
      return;
    }
    onError(null);
    try {
      await deleteDoc(doc(getDb(), "users", user.uid, "memories", memory.id));
      await onChanged();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (!editing) {
    return (
      <li className="card">
        <p>{memory.content}</p>
        <p className="muted small">
          {memory.type} · {memory.categories.join(", ")} · {memory.source}
        </p>
        <div className="row gap">
          <button type="button" className="btn ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="btn danger ghost" onClick={() => void remove()}>
            Delete
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="card stack">
      <label className="field">
        <span>Content</span>
        <textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} />
      </label>
      <label className="field">
        <span>Categories</span>
        <input value={cats} onChange={(e) => setCats(e.target.value)} />
      </label>
      <div className="row gap">
        <button type="button" className="btn primary" onClick={() => void save()}>
          Save
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setEditing(false);
            setContent(memory.content);
            setCats(memory.categories.join(", "));
          }}
        >
          Cancel
        </button>
      </div>
    </li>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDb } from "../firebase";
import { createNote, deleteNote, listNotes, updateNote, type NoteDoc } from "../lib/notes";

export function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listNotes(getDb(), user.uid);
      setNotes(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !content.trim()) {
      return;
    }
    setError(null);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await createNote(getDb(), user.uid, {
        title: title.trim() || null,
        content: content.trim(),
        tags: tagList,
      });
      setTitle("");
      setContent("");
      setTags("");
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create note");
    }
  }

  async function onSaveEdit(n: NoteDoc) {
    if (!user) {
      return;
    }
    setError(null);
    try {
      const tagList = n.tags ?? [];
      await updateNote(getDb(), user.uid, n.id, {
        title: n.title,
        content: n.content,
        tags: tagList,
      });
      setEditingId(null);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update note");
    }
  }

  return (
    <div className="page">
      <header className="page-hero">
        <p className="eyebrow">Writing</p>
        <h1 className="page-title">Notes</h1>
        <p className="page-lede muted">Write and edit notes stored with your Oria account.</p>
      </header>
      {error ? <p className="error">{error}</p> : null}
      <section className="card stack">
        <h2>New note</h2>
        <form className="stack" onSubmit={(e) => void onCreate(e)}>
          <label className="field">
            <span>Title (optional)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="field">
            <span>Content</span>
            <textarea required rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
          </label>
          <label className="field">
            <span>Tags (comma-separated)</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="work, ideas" />
          </label>
          <button type="submit" className="btn primary">
            Save note
          </button>
        </form>
      </section>
      <section style={{ marginTop: "2rem" }}>
        <h2>Recent</h2>
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && notes.length === 0 ? <p className="muted">No notes yet.</p> : null}
        <ul className="note-list">
          {notes.map((n) => (
            <li key={n.id} className="card note-item">
              {editingId === n.id ? (
                <NoteEditor
                  note={n}
                  onCancel={() => setEditingId(null)}
                  onSave={(updated) => void onSaveEdit(updated)}
                />
              ) : (
                <>
                  <div className="note-meta muted small">
                    {n.date} · {n.noteType}
                  </div>
                  {n.title ? <h3>{n.title}</h3> : null}
                  <p className="note-content">{n.content}</p>
                  {n.tags?.length ? (
                    <p className="muted small">{n.tags.join(", ")}</p>
                  ) : null}
                  <div className="row gap">
                    <button type="button" className="btn ghost" onClick={() => setEditingId(n.id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn danger ghost"
                      onClick={() => {
                        if (!user || !confirm("Delete this note?")) {
                          return;
                        }
                        void deleteNote(getDb(), user.uid, n.id).then(refresh).catch((e: unknown) => {
                          setError(e instanceof Error ? e.message : "Delete failed");
                        });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function NoteEditor({
  note,
  onCancel,
  onSave,
}: {
  note: NoteDoc;
  onCancel: () => void;
  onSave: (n: NoteDoc) => void;
}) {
  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState((note.tags ?? []).join(", "));

  return (
    <div className="stack">
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="field">
        <span>Content</span>
        <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
      </label>
      <label className="field">
        <span>Tags</span>
        <input value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>
      <div className="row gap">
        <button
          type="button"
          className="btn primary"
          onClick={() =>
            onSave({
              ...note,
              title: title.trim() || null,
              content: content.trim(),
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
        >
          Save
        </button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

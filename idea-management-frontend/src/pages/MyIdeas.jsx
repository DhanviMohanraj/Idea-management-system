import { useEffect, useState } from "react";
import { getMyIdeas, updateMyIdea } from "../api/ideas";
import { getEmail, getName } from "../utils/auth";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "Submitted", label: "Submitted" },
  { value: "In Review", label: "In Review" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

function MyIdeas() {
  const [ideas, setIdeas] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const email = getEmail();
  const name = getName();

  const refresh = async () => {
    const data = await getMyIdeas(email);
    setIdeas(data);
  };

  useEffect(() => {
    const fetchIdeas = async () => {
      await refresh();
    };
    fetchIdeas();
  }, []);

  const filteredIdeas = ideas
    .filter((idea) => {
      if (statusFilter !== "all" && idea.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        (idea.title || "").toLowerCase().includes(q) ||
        (idea.description || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const startEdit = (idea) => {
    setError("");
    setEditingId(idea.id);
    setEditTitle(idea.title);
    setEditDescription(idea.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const saveEdit = async (ideaId) => {
    setError("");
    try {
      await updateMyIdea({
        id: ideaId,
        ownerEmail: email,
        title: editTitle,
        description: editDescription,
      });
      cancelEdit();
      await refresh();
    } catch (e) {
      setError(e?.message || "Could not update idea");
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="page-title-row">
          <div>
            <h2 className="card-title">My ideas</h2>
            <p className="card-subtitle">Ideas you submitted, with status and feedback.</p>
          </div>
          <div className="page-actions">
            <div className="field" style={{ margin: 0 }}>
              <label className="field-label">Search</label>
              <input
                className="field-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search my ideas…"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pill-row" style={{ marginBottom: 10 }}>
        <div className="pill-group" role="tablist" aria-label="Filter my ideas by status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`pill ${statusFilter === s.value ? "active" : ""}`}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="pill-help">Showing {filteredIdeas.length} of {ideas.length}</div>
      </div>

      {ideas.length === 0 ? (
        <p className="field-helper">You haven&apos;t submitted any ideas yet.</p>
      ) : (
        <ul className="stack-sm" style={{ padding: 0, listStyle: "none" }}>
          {filteredIdeas.map((idea) => (
            <li
              key={idea.id}
              className="idea-card"
            >
              {editingId === idea.id ? (
                <div className="stack-sm" style={{ width: "100%" }}>
                  <div className="field">
                    <label className="field-label">Title</label>
                    <input
                      className="field-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">Description</label>
                    <textarea
                      className="field-textarea"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>

                  <div className="field-row">
                    <button type="button" className="btn btn-primary btn-full" onClick={() => saveEdit(idea.id)}>
                      Save
                    </button>
                    <button type="button" className="btn btn-secondary btn-full" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="stack-sm" style={{ width: "100%" }}>
                  <div className="idea-title">
                    {idea.title}
                    <span
                      className={`badge badge-${(idea.status || "").toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {idea.status}
                    </span>
                  </div>

                  <div className="idea-meta">
                    <span>
                      Submitted by <strong>{name || email}</strong>
                    </span>
                    <span className="muted">•</span>
                    <span className="muted">
                      {idea.createdAt ? new Date(idea.createdAt).toLocaleString() : ""}
                    </span>
                  </div>

                  <div className="idea-desc">{idea.description}</div>

                  {Array.isArray(idea.comments) && idea.comments.length > 0 && (
                    <div className="field-helper">
                      Latest comment: {idea.comments[idea.comments.length - 1].text}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => startEdit(idea)}
                      disabled={["Approved", "Rejected"].includes(idea.status)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="field-helper" style={{ color: "#b91c1c", marginTop: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default MyIdeas;

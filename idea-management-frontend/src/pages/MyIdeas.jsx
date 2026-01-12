import { useEffect, useState } from "react";
import { getMyIdeas, updateMyIdea } from "../api/ideas";
import { getEmail } from "../utils/auth";

function MyIdeas() {
  const [ideas, setIdeas] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [error, setError] = useState("");

  const email = getEmail();

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
        <h2 className="card-title">My ideas</h2>
        <p className="card-subtitle">
          All ideas you have submitted, with their current status.
        </p>
      </div>

      {ideas.length === 0 ? (
        <p className="field-helper">You haven&apos;t submitted any ideas yet.</p>
      ) : (
        <ul className="stack-sm" style={{ padding: 0, listStyle: "none" }}>
          {ideas.map((idea) => (
            <li
              key={idea.id}
              style={{
                padding: "12px 14px",
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
              }}
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
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{idea.title}</div>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "#eef2ff",
                        border: "1px solid #c7d2fe",
                        color: "#3730a3",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {idea.status}
                    </span>
                  </div>

                  <div className="field-helper" style={{ color: "#4b5563" }}>
                    {idea.description}
                  </div>

                  {Array.isArray(idea.comments) && idea.comments.length > 0 && (
                    <div className="field-helper" style={{ color: "#6b7280" }}>
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

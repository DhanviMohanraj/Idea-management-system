import { useEffect, useMemo, useState } from "react";
import { addIdeaComment, getAllIdeas, setIdeaStatus } from "../api/ideas";

function Dashboard() {
  const [ideas, setIdeas] = useState([]);
  const [commentDraft, setCommentDraft] = useState({});
  const [error, setError] = useState("");

  const refresh = async () => {
    const all = await getAllIdeas();
    setIdeas(all);
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => {
    const total = ideas.length;
    const submitted = ideas.filter((i) => i.status === "Submitted").length;
    const inReview = ideas.filter((i) => i.status === "In Review").length;
    const approved = ideas.filter((i) => i.status === "Approved").length;
    const rejected = ideas.filter((i) => i.status === "Rejected").length;
    return { total, submitted, inReview, approved, rejected };
  }, [ideas]);

  const updateStatus = async (id, status) => {
    setError("");
    try {
      await setIdeaStatus({ id, status });
      await refresh();
    } catch (e) {
      setError(e?.message || "Could not update status");
    }
  };

  const submitComment = async (id) => {
    const text = (commentDraft[id] || "").trim();
    if (!text) return;

    setError("");
    try {
      await addIdeaComment({ id, byRole: "team_lead", text });
      setCommentDraft((prev) => ({ ...prev, [id]: "" }));
      await refresh();
    } catch (e) {
      setError(e?.message || "Could not add comment");
    }
  };

  return (
    <div className="card stack-md" style={{ maxWidth: 920 }}>
      <div className="card-header">
        <h2 className="card-title">Team lead dashboard</h2>
        <p className="card-subtitle">Review team ideas, add comments, and approve or reject.</p>
      </div>

      <div className="field-row">
        <div className="btn btn-secondary btn-full" style={{ cursor: "default" }}>
          Total: {stats.total}
        </div>
        <div className="btn btn-secondary btn-full" style={{ cursor: "default" }}>
          Submitted: {stats.submitted}
        </div>
        <div className="btn btn-secondary btn-full" style={{ cursor: "default" }}>
          In review: {stats.inReview}
        </div>
        <div className="btn btn-secondary btn-full" style={{ cursor: "default" }}>
          Approved: {stats.approved}
        </div>
      </div>

      {ideas.length === 0 ? (
        <p className="field-helper">No ideas submitted yet.</p>
      ) : (
        <div className="stack-sm">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: "14px",
                background: "#ffffff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{idea.title}</div>
                  <div className="field-helper" style={{ color: "#6b7280" }}>
                    From: {idea.ownerName || "(no name)"} {idea.ownerEmail ? `(${idea.ownerEmail})` : ""}
                  </div>
                </div>
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

              <div className="field-helper" style={{ color: "#374151", marginTop: 6 }}>
                {idea.description}
              </div>

              {Array.isArray(idea.comments) && idea.comments.length > 0 && (
                <div className="field-helper" style={{ color: "#6b7280", marginTop: 6 }}>
                  Comments: {idea.comments.map((c, idx) => (
                    <span key={idx}>{idx ? " | " : ""}{c.text}</span>
                  ))}
                </div>
              )}

              <div className="field-row" style={{ marginTop: 10 }}>
                <button type="button" className="btn btn-secondary btn-full" onClick={() => updateStatus(idea.id, "In Review")}>
                  Mark In Review
                </button>
                <button type="button" className="btn btn-primary btn-full" onClick={() => updateStatus(idea.id, "Approved")}>
                  Approve
                </button>
                <button type="button" className="btn btn-secondary btn-full" onClick={() => updateStatus(idea.id, "Rejected")}>
                  Reject
                </button>
              </div>

              <div className="field" style={{ marginTop: 10 }}>
                <label className="field-label">Add comment</label>
                <div className="field-row">
                  <input
                    className="field-input"
                    value={commentDraft[idea.id] || ""}
                    onChange={(e) => setCommentDraft((prev) => ({ ...prev, [idea.id]: e.target.value }))}
                    placeholder="Write feedback for the team member"
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => submitComment(idea.id)}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="field-helper" style={{ color: "#b91c1c" }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

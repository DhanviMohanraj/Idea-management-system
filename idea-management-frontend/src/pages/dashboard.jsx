import { useEffect, useState } from "react";
import {
  addIdeaComment,
  getAllIdeas,
  getMetricsSummary,
  seedDemoIdeas,
  setIdeaStatus,
} from "../api/ideas";
import { getRole } from "../utils/auth";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "Submitted", label: "Submitted" },
  { value: "In Review", label: "In Review" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "status", label: "Status" },
];

const fmt = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
};

function Dashboard() {
  const [ideas, setIdeas] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [commentDraft, setCommentDraft] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState("");

  const refresh = async () => {
    const all = await getAllIdeas();
    setIdeas(all);
    const m = await getMetricsSummary();
    setMetrics(m);
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = metrics || {
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
    approved: 0,
    rejected: 0,
    last7Days: [],
    last4Weeks: [],
    byWhom: [],
  };

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
      await addIdeaComment({ id, byRole: getRole(), text });
      setCommentDraft((prev) => ({ ...prev, [id]: "" }));
      await refresh();
    } catch (e) {
      setError(e?.message || "Could not add comment");
    }
  };

  const filteredIdeas = ideas
    .filter((idea) => {
      if (statusFilter !== "all" && idea.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        (idea.title || "").toLowerCase().includes(q) ||
        (idea.description || "").toLowerCase().includes(q) ||
        (idea.ownerName || "").toLowerCase().includes(q) ||
        (idea.ownerEmail || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === "status") return (a.status || "").localeCompare(b.status || "");
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return sort === "oldest" ? da - db : db - da;
    });

  return (
    <div className="card stack-md" style={{ maxWidth: 1020 }}>
      <div className="card-header">
        <div className="page-title-row">
          <div>
            <h2 className="card-title">Team lead dashboard</h2>
            <p className="card-subtitle">Review ideas, add feedback, and set outcomes.</p>
          </div>

          <div className="page-actions">
            <div className="field" style={{ margin: 0 }}>
              <label className="field-label">Search</label>
              <input
                className="field-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, submitter, description…"
              />
            </div>

            <div className="field" style={{ margin: 0, minWidth: 160 }}>
              <label className="field-label">Sort</label>
              <select className="field-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total ideas</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Open ideas</div>
          <div className="kpi-value">{stats.open}</div>
          <div className="kpi-help">Submitted (not yet in review)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">In progress</div>
          <div className="kpi-value">{stats.inProgress}</div>
          <div className="kpi-help">In Review</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Completed</div>
          <div className="kpi-value">{stats.completed}</div>
          <div className="kpi-help">Approved + Rejected</div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div className="kpi-card">
          <div className="kpi-label">Ideas per day (last 7 days)</div>
          <div className="mini-chart">
            {stats.last7Days.map((d) => (
              <div key={d.key} className="mini-bar" title={`${d.key}: ${d.count}`}>
                <div
                  className="mini-bar-fill"
                  style={{ height: `${Math.max(6, d.count * 18)}px` }}
                />
                <div className="mini-bar-label">{d.key.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Ideas per week (last 4 weeks)</div>
          <div className="mini-chart">
            {stats.last4Weeks.map((w) => (
              <div key={w.key} className="mini-bar" title={`Week of ${w.key}: ${w.count}`}>
                <div
                  className="mini-bar-fill"
                  style={{ height: `${Math.max(6, w.count * 18)}px` }}
                />
                <div className="mini-bar-label">{w.key.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">Ideas by whom</div>
        {stats.byWhom.length === 0 ? (
          <div className="kpi-help">No ideas yet.</div>
        ) : (
          <div className="stack-sm">
            {stats.byWhom.map((u) => (
              <div
                key={u.ownerEmail}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  background: "#ffffff",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{u.ownerName || u.ownerEmail}</div>
                  <div className="field-helper" style={{ color: "#6b7280" }}>
                    {u.ownerName ? u.ownerEmail : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>{u.total}</div>
                  <div className="field-helper" style={{ color: "#6b7280" }}>
                    Open {u.open} • In progress {u.inProgress} • Completed {u.completed}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ideas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No ideas yet</div>
          <div className="empty-subtitle">Seed demo ideas to preview analytics and moderation UI.</div>
          <div className="field-row" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                setError("");
                try {
                  await seedDemoIdeas();
                  await refresh();
                } catch (e) {
                  setError(e?.message || "Could not seed demo ideas");
                }
              }}
            >
              Seed demo ideas
            </button>
            <button type="button" className="btn btn-secondary" onClick={refresh}>
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="pill-row" style={{ marginTop: 2 }}>
            <div className="pill-group" role="tablist" aria-label="Filter ideas by status">
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

          <div className="stack-sm">
            {filteredIdeas.map((idea) => {
              const expanded = expandedId === idea.id;
              const badgeKey = (idea.status || "").toLowerCase().replace(/\s+/g, "-");
              return (
                <div key={idea.id} className="idea-card">
                  <div className="idea-card-top">
                    <div className="idea-title">
                      {idea.title}
                      <span className={`badge badge-${badgeKey}`}>{idea.status}</span>
                    </div>
                    <div className="idea-meta">
                      <span>
                        Submitted by <strong>{idea.ownerName || idea.ownerEmail || "Unknown"}</strong>
                        {idea.ownerName && idea.ownerEmail ? (
                          <span className="muted"> ({idea.ownerEmail})</span>
                        ) : null}
                      </span>
                      <span className="muted">•</span>
                      <span className="muted">{fmt(idea.createdAt)}</span>
                    </div>
                  </div>

                  <div className="idea-desc">{idea.description}</div>

                  <div className="status-actions">
                    <div className="status-label">Set status</div>
                    <div className="pill-group" aria-label="Set idea status">
                      {["Submitted", "In Review", "Approved", "Rejected"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`pill ${idea.status === s ? "active" : ""}`}
                          onClick={() => updateStatus(idea.id, s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="idea-divider" />

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setExpandedId(expanded ? null : idea.id)}
                  >
                    {expanded ? "Hide" : "Show"} comments ({Array.isArray(idea.comments) ? idea.comments.length : 0})
                  </button>

                  {expanded && (
                    <div className="stack-sm" style={{ marginTop: 10 }}>
                      {Array.isArray(idea.comments) && idea.comments.length > 0 ? (
                        <div className="comment-list">
                          {idea.comments.map((c, idx) => (
                            <div key={idx} className="comment-item">
                              <div className="comment-meta">
                                <span className="badge badge-neutral">{c.byRole || "comment"}</span>
                                <span className="muted">{fmt(c.createdAt)}</span>
                              </div>
                              <div className="comment-text">{c.text}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="field-helper">No comments yet.</div>
                      )}

                      <div className="field">
                        <label className="field-label">Add comment</label>
                        <div className="field-row">
                          <input
                            className="field-input"
                            value={commentDraft[idea.id] || ""}
                            onChange={(e) =>
                              setCommentDraft((prev) => ({ ...prev, [idea.id]: e.target.value }))
                            }
                            placeholder="Write feedback for the submitter"
                          />
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => submitComment(idea.id)}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
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

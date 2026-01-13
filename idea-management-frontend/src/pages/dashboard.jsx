import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  addIdeaComment,
  getAllIdeas,
  getMetricsSummary,
  seedDemoIdeas,
  setIdeaStatus,
} from "../api/ideas";
import { getRole } from "../utils/auth";
import { buildIdeaTrendForecast } from "../utils/trendForecast";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

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

const STATUS_SERIES_ORDER = ["Submitted", "In Review", "Approved", "Rejected"];

const STATUS_SERIES_COLORS = {
  Submitted: "rgba(59, 130, 246, 0.95)",
  "In Review": "rgba(245, 158, 11, 0.95)",
  Approved: "rgba(16, 185, 129, 0.95)",
  Rejected: "rgba(239, 68, 68, 0.95)",
};

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
  const [trendWindow, setTrendWindow] = useState(30);
  const [forecastDays, setForecastDays] = useState(7);
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

  const trend = useMemo(
    () => buildIdeaTrendForecast(ideas, { daysBack: trendWindow, forecastDays }),
    [ideas, trendWindow, forecastDays]
  );

  const trendLabels = [...trend.labels, ...trend.forecastLabels];
  const datasets = [];

  if (forecastDays > 0) {
    // Interval band (shown only for forecast region)
    datasets.push({
      label: "Forecast low",
      data: [...Array(trend.labels.length).fill(null), ...(trend.lower || [])],
      borderColor: "rgba(245, 158, 11, 0)",
      backgroundColor: "rgba(245, 158, 11, 0.10)",
      pointRadius: 0,
      tension: 0.25,
    });
    datasets.push({
      label: "Forecast high",
      data: [...Array(trend.labels.length).fill(null), ...(trend.upper || [])],
      borderColor: "rgba(245, 158, 11, 0)",
      backgroundColor: "rgba(245, 158, 11, 0.10)",
      pointRadius: 0,
      tension: 0.25,
      fill: "-1",
    });
  }

  datasets.push({
    label: "Actual",
    data: [...trend.actual, ...Array(trend.forecastLabels.length).fill(null)],
    borderColor: "rgba(79, 70, 229, 0.95)",
    backgroundColor: "rgba(79, 70, 229, 0.15)",
    fill: true,
    tension: 0.25,
    pointRadius: 2,
  });

  if (forecastDays > 0) {
    datasets.push({
      label: `Forecast (+${forecastDays}d)`,
      data: [...Array(trend.labels.length).fill(null), ...trend.forecast],
      borderColor: "rgba(245, 158, 11, 0.95)",
      backgroundColor: "rgba(245, 158, 11, 0.00)",
      borderDash: [6, 6],
      fill: false,
      tension: 0.25,
      pointRadius: 2,
    });
  }

  const trendData = {
    labels: trendLabels.map((k) => k.slice(5)),
    datasets,
  };

  const statusTrend = useMemo(() => {
    const labels = trend.labels || [];
    const seriesMap = new Map();
    for (const status of STATUS_SERIES_ORDER) seriesMap.set(status, Array(labels.length).fill(0));

    const labelIndex = new Map(labels.map((k, idx) => [k, idx]));
    for (const idea of Array.isArray(ideas) ? ideas : []) {
      const created = new Date(idea?.createdAt);
      if (Number.isNaN(created.getTime())) continue;
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(
        created.getDate()
      ).padStart(2, "0")}`;
      const idx = labelIndex.get(key);
      if (idx === undefined) continue;

      const s = idea?.status || "Submitted";
      if (!seriesMap.has(s)) seriesMap.set(s, Array(labels.length).fill(0));
      const arr = seriesMap.get(s);
      arr[idx] = (arr[idx] || 0) + 1;
    }

    const known = STATUS_SERIES_ORDER.filter((s) => seriesMap.has(s));
    const extra = Array.from(seriesMap.keys())
      .filter((s) => !STATUS_SERIES_ORDER.includes(s))
      .sort((a, b) => String(a).localeCompare(String(b)));

    const allStatuses = [...known, ...extra];
    const datasets = allStatuses.map((s) => ({
      label: s,
      data: seriesMap.get(s) || [],
      borderColor: STATUS_SERIES_COLORS[s] || "rgba(99, 102, 241, 0.75)",
      backgroundColor: "rgba(99, 102, 241, 0.08)",
      fill: false,
      tension: 0.25,
      pointRadius: 2,
    }));

    return { labels, datasets };
  }, [ideas, trend.labels]);

  const statusTrendData = {
    labels: (statusTrend.labels || []).map((k) => k.slice(5)),
    datasets: statusTrend.datasets || [],
  };

  const statusTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: true, position: "bottom" },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            const n = Number(value);
            if (!Number.isFinite(n)) return value;
            return Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : n.toFixed(1);
          },
        },
        grid: { color: "rgba(148, 163, 184, 0.25)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: true, position: "bottom" },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            const n = Number(value);
            if (!Number.isFinite(n)) return value;
            return Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : n.toFixed(1);
          },
        },
        grid: { color: "rgba(148, 163, 184, 0.25)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

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
        <div className="kpi-row">
          <div>
            <div className="kpi-label">Trend & forecast (ML)</div>
          </div>

          <div className="trend-controls">
            <div className="pill-group" aria-label="Trend window">
              {[14, 30, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`pill ${trendWindow === d ? "active" : ""}`}
                  onClick={() => setTrendWindow(d)}
                  title={`Show last ${d} days`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <select
              className="field-select"
              value={forecastDays}
              onChange={(e) => setForecastDays(Number(e.target.value))}
              aria-label="Forecast horizon"
              style={{ height: 38 }}
            >
              {[0, 7, 14].map((d) => (
                <option key={d} value={d}>
                  Forecast {d}d
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chart-wrap">
          <Line data={trendData} options={trendOptions} />
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-row">
          <div>
            <div className="kpi-label">Ideas by status over time</div>
          </div>

          <div className="trend-controls">
            <div className="pill-group" aria-label="Trend window (status)">
              {[14, 30, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`pill ${trendWindow === d ? "active" : ""}`}
                  onClick={() => setTrendWindow(d)}
                  title={`Show last ${d} days`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-wrap">
          <Line data={statusTrendData} options={statusTrendOptions} />
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

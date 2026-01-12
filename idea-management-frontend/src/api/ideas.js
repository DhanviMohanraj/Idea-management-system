// Frontend-only ideas store (no backend).

const IDEAS_KEY = "ims_ideas";
const USERS_KEY = "ims_users";

const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
};

const findUserNameByEmail = (email) => {
  if (!email) return "";
  const users = readUsers();
  const u = users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
  return u?.name || "";
};

const normalizeIdea = (idea) => {
  const ownerEmail = idea?.ownerEmail || "";
  const ownerName = idea?.ownerName || findUserNameByEmail(ownerEmail) || "";
  const comments = Array.isArray(idea?.comments) ? idea.comments : [];
  return { ...idea, ownerEmail, ownerName, comments };
};

const readIdeas = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(IDEAS_KEY) || "[]");
    const ideas = Array.isArray(raw) ? raw.map(normalizeIdea) : [];

    // Persist hydration so older records get ownerName filled in.
    const mutated = ideas.some((i, idx) => {
      const before = raw[idx] || {};
      return (before.ownerName || "") !== (i.ownerName || "") || !Array.isArray(before.comments);
    });
    if (mutated) writeIdeas(ideas);

    return ideas;
  } catch {
    return [];
  }
};

const writeIdeas = (ideas) => {
  localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
};

const nextId = (ideas) => {
  const max = ideas.reduce((acc, idea) => Math.max(acc, Number(idea.id) || 0), 0);
  return max + 1;
};

export const createIdea = async ({ title, description, ownerEmail, ownerName }) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const ideas = readIdeas();
  const now = new Date().toISOString();
  const idea = {
    id: nextId(ideas),
    title,
    description,
    ownerEmail,
    ownerName,
    status: "Submitted",
    createdAt: now,
    updatedAt: now,
    comments: [],
  };
  ideas.unshift(idea);
  writeIdeas(ideas);
  return { ok: true, idea };
};

export const getMyIdeas = async (ownerEmail) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  const ideas = readIdeas();
  return ideas.filter((i) => (i.ownerEmail || "").toLowerCase() === ownerEmail.toLowerCase());
};

export const updateMyIdea = async ({ id, ownerEmail, title, description }) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const ideas = readIdeas();
  const idx = ideas.findIndex((i) => Number(i.id) === Number(id));
  if (idx === -1) throw new Error("Idea not found");
  if ((ideas[idx].ownerEmail || "").toLowerCase() !== ownerEmail.toLowerCase()) {
    throw new Error("Not allowed");
  }

  if (["Approved", "Rejected"].includes(ideas[idx].status)) {
    throw new Error("Cannot edit after final decision");
  }

  ideas[idx] = {
    ...ideas[idx],
    title,
    description,
    updatedAt: new Date().toISOString(),
  };
  writeIdeas(ideas);
  return { ok: true, idea: ideas[idx] };
};

export const getAllIdeas = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  return readIdeas();
};

export const setIdeaStatus = async ({ id, status }) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const ideas = readIdeas();
  const idx = ideas.findIndex((i) => Number(i.id) === Number(id));
  if (idx === -1) throw new Error("Idea not found");
  ideas[idx] = { ...ideas[idx], status, updatedAt: new Date().toISOString() };
  writeIdeas(ideas);
  return { ok: true, idea: ideas[idx] };
};

export const addIdeaComment = async ({ id, byRole, text }) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const ideas = readIdeas();
  const idx = ideas.findIndex((i) => Number(i.id) === Number(id));
  if (idx === -1) throw new Error("Idea not found");

  const comment = {
    byRole: byRole || "",
    text,
    createdAt: new Date().toISOString(),
  };
  ideas[idx] = {
    ...ideas[idx],
    comments: [...(ideas[idx].comments || []), comment],
    updatedAt: new Date().toISOString(),
  };
  writeIdeas(ideas);
  return { ok: true, idea: ideas[idx] };
};

export const seedDemoIdeas = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const ideas = readIdeas();
  if (ideas.length > 0) return { ok: true, seeded: 0 };

  const now = new Date();
  const demo = [
    {
      title: "Weekly demo day",
      description: "A 30-minute Friday slot to demo small improvements and share learnings.",
      ownerEmail: "alex@example.com",
      ownerName: "Alex",
      status: "Submitted",
    },
    {
      title: "Internal docs refresh",
      description: "Simplify onboarding with a single, searchable knowledge hub.",
      ownerEmail: "sam@example.com",
      ownerName: "Sam",
      status: "In Review",
    },
    {
      title: "Bug bash hour",
      description: "Monthly bug bash to reduce tech debt and improve stability.",
      ownerEmail: "taylor@example.com",
      ownerName: "Taylor",
      status: "Approved",
    },
  ];

  const seeded = demo.map((d, idx) => {
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - (demo.length - 1 - idx));
    const iso = createdAt.toISOString();
    return {
      id: nextId(ideas) + idx,
      title: d.title,
      description: d.description,
      ownerEmail: d.ownerEmail,
      ownerName: d.ownerName,
      status: d.status,
      createdAt: iso,
      updatedAt: iso,
      comments: [],
    };
  });

  writeIdeas([...seeded, ...ideas]);
  return { ok: true, seeded: seeded.length };
};

const pad2 = (n) => String(n).padStart(2, "0");

const toDateKey = (d) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

const startOfWeek = (date) => {
  // Monday-based weeks.
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
};

export const getMetricsSummary = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const ideas = readIdeas();
  const total = ideas.length;

  const open = ideas.filter((i) => i.status === "Submitted").length;
  const inProgress = ideas.filter((i) => i.status === "In Review").length;
  const approved = ideas.filter((i) => i.status === "Approved").length;
  const rejected = ideas.filter((i) => i.status === "Rejected").length;
  const completed = approved + rejected;

  // Last 7 days buckets (inclusive of today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - idx));
    const key = toDateKey(d);
    return { key, count: 0 };
  });
  const dayIndex = new Map(last7Days.map((d, idx) => [d.key, idx]));
  for (const idea of ideas) {
    const key = toDateKey(idea.createdAt);
    const idx = dayIndex.get(key);
    if (idx !== undefined) last7Days[idx].count += 1;
  }

  // Last 4 weeks buckets (Monday week start)
  const thisWeekStart = startOfWeek(new Date());
  const weekStarts = Array.from({ length: 4 }).map((_, idx) => {
    const d = new Date(thisWeekStart);
    d.setDate(thisWeekStart.getDate() - (3 - idx) * 7);
    const key = toDateKey(d);
    return { key, count: 0 };
  });
  const weekIndex = new Map(weekStarts.map((w, idx) => [w.key, idx]));
  for (const idea of ideas) {
    const wk = startOfWeek(idea.createdAt);
    const key = wk ? toDateKey(wk) : "";
    const idx = weekIndex.get(key);
    if (idx !== undefined) weekStarts[idx].count += 1;
  }

  // Group by owner
  const byOwner = new Map();
  for (const idea of ideas) {
    const ownerEmail = idea.ownerEmail || "";
    const ownerName = idea.ownerName || "";
    const key = ownerEmail.toLowerCase();
    if (!byOwner.has(key)) {
      byOwner.set(key, {
        ownerEmail,
        ownerName,
        total: 0,
        open: 0,
        inProgress: 0,
        completed: 0,
      });
    }
    const agg = byOwner.get(key);
    agg.total += 1;
    if (idea.status === "Submitted") agg.open += 1;
    else if (idea.status === "In Review") agg.inProgress += 1;
    else if (idea.status === "Approved" || idea.status === "Rejected") agg.completed += 1;
  }

  const byWhom = Array.from(byOwner.values()).sort((a, b) => b.total - a.total);

  return {
    total,
    open,
    inProgress,
    completed,
    approved,
    rejected,
    last7Days,
    last4Weeks: weekStarts,
    byWhom,
  };
};

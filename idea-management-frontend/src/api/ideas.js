// Frontend-only ideas store (no backend).

const IDEAS_KEY = "ims_ideas";

const readIdeas = () => {
  try {
    return JSON.parse(localStorage.getItem(IDEAS_KEY) || "[]");
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
    byRole,
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

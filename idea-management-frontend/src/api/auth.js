// Frontend-only auth (no backend). This intentionally allows login with any email.

const USERS_KEY = "ims_users";

const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const registerUser = async ({ name, email, role }) => {
  const users = readUsers();
  const exists = users.some((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!exists) {
    users.push({
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    });
    writeUsers(users);
  }

  return { ok: true };
};

export const loginUser = async (email) => {
  // Always “succeeds” in frontend-only mode.
  const users = readUsers();
  const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  return {
    user: existing ?? { name: "", email },
    access_token: `mock-${Math.random().toString(36).slice(2)}`,
    token_type: "bearer",
  };
};

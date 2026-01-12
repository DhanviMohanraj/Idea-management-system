export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export const getRole = () => {
  return localStorage.getItem("role");
};

export const isTeamLead = () => getRole() === "team_lead";

export const getEmail = () => localStorage.getItem("email") || "";

export const getName = () => localStorage.getItem("name") || "";

export const setSession = ({ token, role, email, name }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("email", email);
  localStorage.setItem("name", name || "");
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
  localStorage.removeItem("name");
};

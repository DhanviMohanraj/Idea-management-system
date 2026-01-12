const THEME_KEY = "ims_theme";

export const getTheme = () => {
  const t = (localStorage.getItem(THEME_KEY) || "light").toLowerCase();
  return t === "dark" ? "dark" : "light";
};

export const setTheme = (theme) => {
  const next = theme === "dark" ? "dark" : "light";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  return next;
};

export const toggleTheme = () => {
  const next = getTheme() === "dark" ? "light" : "dark";
  return setTheme(next);
};

export const applyTheme = (theme) => {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
};

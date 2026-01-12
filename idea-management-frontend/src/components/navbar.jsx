import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getRole, getName, logout } from "../utils/auth";
import { getTheme, toggleTheme } from "../utils/theme";

function Navbar() {
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const role = getRole();
  const lead = role === "team_lead";
  const displayName = getName();

  const [theme, setTheme] = useState(getTheme());

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <span>IdeaFlow</span>
          <span className="navbar-pill">Internal innovation</span>
        </div>

        <div className="navbar-links">
          {!authed && (
            <>
              <Link className="navbar-link" to="/register">
                Register
              </Link>
              <Link className="navbar-link" to="/login">
                Login
              </Link>
            </>
          )}

          {authed && (
            <>
              <div className="navbar-user">
                <div className="navbar-user-name">{displayName || "Signed in"}</div>
                <div className="navbar-user-role">{lead ? "Team lead" : "Team member"}</div>
              </div>

              <div className="toggle-row navbar-toggle">
                <span className="toggle-label">Dark</span>
                <label className="switch" aria-label="Toggle dark mode">
                  <input
                    type="checkbox"
                    checked={theme === "dark"}
                    onChange={() => setTheme(toggleTheme())}
                  />
                  <span className="slider" />
                </label>
              </div>

              {lead && (
                <Link className="navbar-link" to="/dashboard">
                  Dashboard
                </Link>
              )}
              {!lead && (
                <>
                  <Link className="navbar-link" to="/createidea">
                    Create idea
                  </Link>
                  <Link className="navbar-link navbar-link-primary" to="/myideas">
                    My ideas
                  </Link>
                </>
              )}
              <button
                type="button"
                className="navbar-link btn-ghost btn-sm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

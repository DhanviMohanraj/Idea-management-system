import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getRole, isTeamLead, logout } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const role = getRole();
  const lead = isTeamLead();

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

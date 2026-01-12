import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/auth";
import { setSession } from "../utils/auth";

const ROLE_OPTIONS = [
  { value: "team_member", label: "Team member" },
  { value: "team_lead", label: "Team lead" },
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleValue, setRoleValue] = useState("team_member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(email);
      setSession({
        token: response.access_token,
        role: roleValue,
        email,
        name: response.user?.name || "",
      });

      navigate(roleValue === "team_lead" ? "/dashboard" : "/myideas");
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="card auth-card">
        <div className="card-header">
          <h2 className="card-title">Welcome back</h2>
          <p className="card-subtitle">Sign in to continue</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">Email</label>
            <input
              type="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <div className="field-row">
              <input
                type={showPassword ? "text" : "password"}
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="field-helper">Frontend-only demo: any email/password works.</div>
          </div>

          <div className="field">
            <label className="field-label">Login as</label>
            <select
              className="field-select"
              value={roleValue}
              onChange={(e) => setRoleValue(e.target.value)}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error && (
          <div className="field-helper" style={{ color: "#b91c1c", marginTop: "8px" }}>
            {error}
          </div>
        )}

        <div className="card-footer">
          New here? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </section>
  );
}

export default Login;

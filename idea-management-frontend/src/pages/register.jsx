import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

const ROLE_OPTIONS = [
  { value: "team_member", label: "Team member" },
  { value: "team_lead", label: "Team lead" },
];

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleValue, setRoleValue] = useState("team_member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerUser({ name, email, role: roleValue });
      navigate("/login");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="card auth-card">
        <div className="card-header">
          <h2 className="card-title">Sign up</h2>
          <p className="card-subtitle">Create your account</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">Name</label>
            <input
              type="text"
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

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
                placeholder="Create a strong password"
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
            <div className="field-helper">Password is stored only for UI in this demo.</div>
          </div>

          <div className="field">
            <label className="field-label">Role</label>
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

          {error && <div className="field-helper" style={{ color: "#b91c1c" }}>{error}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="card-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </section>
  );
}

export default Register;

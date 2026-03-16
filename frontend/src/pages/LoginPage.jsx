import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const LoginPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      setCurrentPage("dashboard");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-root">

      {/* ── VIDEO BACKGROUND ── */}
      <video
        className="login-video-bg"
        src="/video/bg2.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* ── DARK OVERLAY ── */}
      <div className="login-overlay" />

      {/* ── HEADER ── */}
      <div className="login-header">
        <div className="login-header-logo">
          <div className="login-header-icon">S</div>
          <span className="login-header-name">StockSense</span>
        </div>
      </div>

      {/* ── CARD ── */}
      <div className="glass-card">

        <h1 className="glass-title" style={{ textAlign: "center", width: "100%" }}>
          LOGIN
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="glass-field">
            <input
              className="glass-input"
              type="email"
              placeholder="Email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="glass-field">
            <input
              className="glass-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ paddingRight: "3.5rem" }}
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="forgot-row">
            <button
              type="button"
              className="forgot-btn"
              onClick={() => setCurrentPage("forgot-password")}
            >
              Forgot password?
            </button>
          </div>

          {error && <div className="glass-error">{error}</div>}

          <button type="submit" className="glass-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="register-row">
          Don't have an account?{" "}
          <button
            type="button"
            className="register-link"
            onClick={() => setCurrentPage("register")}
          >
            Register
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
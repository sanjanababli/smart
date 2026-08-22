import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const AuthLandingPage = ({ setCurrentPage, initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode); // "login" | "register"

  // ---- login state ----
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // ---- register state ----
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("staff");

  // ---- shared state ----
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register, verifyRegistrationOtp } = useAuth();

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setOtpSent(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(loginEmail, loginPassword);
    if (result.success) {
      setCurrentPage("dashboard");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    const result = await register({ name, email, password, role });
    if (result.success) {
      setOtpSent(true);
      setSuccess(result.message || "OTP sent to your email.");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    const result = await verifyRegistrationOtp({ email, otp });
    if (result.success) {
      setSuccess("Registration complete. You can log in now.");
      setTimeout(() => {
        setMode("login");
        setOtpSent(false);
        setSuccess("");
        setLoginEmail(email);
      }, 1200);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const EyeIcon = ({ open }) =>
    open ? (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ) : (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.62 21.62 0 0 1 5.06-6.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );

  return (
    <div className="asl-page">
      <div className="asl-shell">
        {/* NAV — inside the card, doubles as the mode switcher */}
        <nav className="asl-nav">
          <div className="asl-brand">
            <div className="lp-logo-icon">S</div>
            <span>StockSense</span>
          </div>

          <div className="asl-nav-links">
            <a href="#home" className="asl-nav-link">Home</a>
            <button
              type="button"
              className={`asl-nav-link asl-nav-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Log In
            </button>
            <button
              type="button"
              className={`asl-nav-link asl-nav-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => switchMode("register")}
            >
              Join
            </button>
            <a href="#about" className="asl-nav-link">About Us</a>
          </div>

          <div className="asl-nav-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <span>Search</span>
          </div>
        </nav>

        <div className="asl-body">
          {/* LEFT — hero, inset dark art panel standing in for a photo */}
          <div className="asl-hero">
            <div className="asl-hero-art">

              <div className="asl-hero-eyebrow">
                <span className="asl-hero-eyebrow-dot" />
                Get Started Free
              </div>

              <h1 className="asl-hero-title">
                Unleash the manager<br />
                <em>inside YOU</em>, automate your<br />
                Daily Grind
              </h1>

              <p className="asl-hero-subtitle">
                Get started with the easiest and most secure way to manage your store.
              </p>

              <div className="asl-hero-cta-row">
                <button type="button" className="asl-hero-btn-ghost">Explore more</button>
                <button
                  type="button"
                  className="asl-hero-btn-solid"
                  onClick={() => switchMode("register")}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="asl-form-panel">
            {mode === "login" ? (
              <>
                <h2 className="asl-form-title">Welcome<span>.</span></h2>

                <form onSubmit={handleLogin} className="asl-form">
                  <div className="asl-field">
                    <label className="asl-field-label">Email</label>
                    <div className="asl-field-input">
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                      <svg className="asl-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22 6 12 13 2 6" /></svg>
                    </div>
                  </div>

                  <div className="asl-field">
                    <label className="asl-field-label">Password</label>
                    <div className="asl-field-input">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button type="button" className="asl-field-icon asl-eye-btn" onClick={() => setShowLoginPassword((v) => !v)} tabIndex={-1}>
                        <EyeIcon open={showLoginPassword} />
                      </button>
                    </div>
                  </div>

                  <div className="asl-form-row">
                    <button type="button" className="forgot-btn" onClick={() => setCurrentPage("forgot-password")}>
                      Forgot password?
                    </button>
                  </div>

                  {error && <div className="glass-error">{error}</div>}

                  <div className="asl-switch-row">
                    New here?{" "}
                    <button type="button" className="register-link" onClick={() => switchMode("register")}>
                      Create an account
                    </button>
                  </div>

                  <button type="submit" className="glass-submit" disabled={loading}>
                    {loading ? "Signing in..." : "Log In"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="asl-form-title">
                  {otpSent ? "Verify code" : <>Create account<span>.</span></>}
                </h2>

                <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="asl-form">
                  {!otpSent ? (
                    <>
                      <div className="asl-field">
                        <label className="asl-field-label">Full Name</label>
                        <div className="asl-field-input">
                          <input type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                          <svg className="asl-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                      </div>

                      <div className="asl-field">
                        <label className="asl-field-label">Email</label>
                        <div className="asl-field-input">
                          <input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                          <svg className="asl-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22 6 12 13 2 6" /></svg>
                        </div>
                      </div>

                      <div className="asl-field-grid">
                        <div className="asl-field">
                          <label className="asl-field-label">Password</label>
                          <div className="asl-field-input">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="Min 6 characters"
                              minLength="6"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              autoComplete="new-password"
                            />
                            <button type="button" className="asl-field-icon asl-eye-btn" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                              <EyeIcon open={showPassword} />
                            </button>
                          </div>
                        </div>

                        <div className="asl-field">
                          <label className="asl-field-label">Role</label>
                          <div className="asl-field-input">
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                              <option value="staff">Staff</option>
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="asl-field">
                      <label className="asl-field-label">6-digit OTP</label>
                      <div className="asl-field-input">
                        <input
                          type="text"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          maxLength="6"
                          style={{ letterSpacing: "0.3em", textAlign: "center", fontWeight: 700 }}
                        />
                      </div>
                    </div>
                  )}

                  {error && <div className="glass-error">{error}</div>}
                  {success && <div className="glass-success">{success}</div>}

                  <div className="asl-switch-row">
                    Already a member?{" "}
                    <button type="button" className="register-link" onClick={() => switchMode("login")}>
                      Log In
                    </button>
                  </div>

                  <button type="submit" className="glass-submit" disabled={loading}>
                    {loading
                      ? (otpSent ? "Verifying..." : "Sending OTP...")
                      : (otpSent ? "Verify & Register" : "Create Account")}
                  </button>

                  {otpSent && (
                    <button
                      type="button"
                      className="register-link"
                      style={{ display: "block", width: "100%", textAlign: "center", marginTop: 10 }}
                      onClick={() => { setOtpSent(false); setError(""); setSuccess(""); }}
                    >
                      Edit Details
                    </button>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLandingPage;
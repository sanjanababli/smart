import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const RegisterPage = ({ setCurrentPage }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("staff");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, verifyRegistrationOtp } = useAuth();

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await register({ name, email, password, role });

    if (result.success) {
      setOtpSent(true);
      setSuccess(result.message || "OTP sent to your email. Please verify to complete registration.");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await verifyRegistrationOtp({ email, otp });

    if (result.success) {
      setSuccess("Registration complete. You can log in now.");
      setTimeout(() => setCurrentPage("login"), 1000);
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
          {otpSent ? "VERIFY OTP" : "REGISTER"}
        </h1>

        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
          {!otpSent ? (
            <>
              <div className="glass-field">
                <input
                  className="glass-input"
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="glass-field">
                <input
                  className="glass-input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="glass-field">
                <input
                  className="glass-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  minLength="6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

              <div className="glass-field">
                <select
                  className="glass-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="staff">Staff</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          ) : (
            <div className="glass-field">
              <input
                className="glass-input"
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength="6"
              />
            </div>
          )}

          {error && <div className="glass-error">{error}</div>}
          {success && <div className="glass-success">{success}</div>}

          <button type="submit" className="glass-submit" disabled={loading}>
            {loading ? (otpSent ? "Verifying..." : "Sending OTP...") : otpSent ? "Verify & Register" : "Send OTP"}
          </button>

          {otpSent && (
            <button
              type="button"
              className="register-link"
              style={{ width: "100%", marginTop: "1rem", textAlign: "center" }}
              onClick={() => {
                setOtpSent(false);
                setError("");
                setSuccess("");
              }}
            >
              Edit Details
            </button>
          )}
        </form>

        <div className="register-row">
          Already have an account?{" "}
          <button
            type="button"
            className="register-link"
            onClick={() => setCurrentPage("login")}
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const ForgotPasswordPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { forgotPassword, resetPassword } = useAuth();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await forgotPassword(email);
    if (result.success) {
      setOtpSent(true);
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await resetPassword({ email, otp, newPassword });
    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => setCurrentPage("login"), 2000);
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
          {otpSent ? "RESET PASSWORD" : "FORGOT PASSWORD"}
        </h1>

        {!otpSent ? (
          <form onSubmit={handleRequestOtp}>
            <p className="glass-sub" style={{ textAlign: "center", marginBottom: "1.5rem", color: "rgba(255,255,255,0.7)" }}>
              Enter your email to receive a password reset OTP.
            </p>
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

            {error && <div className="glass-error">{error}</div>}
            {success && <div className="glass-success">{success}</div>}

            <button type="submit" className="glass-submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
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

            <div className="glass-field">
              <input
                className="glass-input"
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              <input
                className="glass-input"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="glass-error">{error}</div>}
            {success && <div className="glass-success">{success}</div>}

            <button type="submit" className="glass-submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              className="register-link"
              style={{ width: "100%", marginTop: "1rem", textAlign: "center" }}
              onClick={() => setOtpSent(false)}
            >
              Back to get OTP
            </button>
          </form>
        )}

        <div className="register-row">
          Suddenly remembered?{" "}
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

export default ForgotPasswordPage;

import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const ForgotPasswordPage = ({ setCurrentPage }) => {
  const [email,           setEmail]           = useState("");
  const [otp,             setOtp]             = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent,         setOtpSent]         = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [success,         setSuccess]         = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const { forgotPassword, resetPassword } = useAuth();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    const result = await forgotPassword(email);
    if (result.success) { setOtpSent(true); setSuccess(result.message); }
    else { setError(result.message); }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    const result = await resetPassword({ email, otp, newPassword });
    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => setCurrentPage("login"), 2000);
    } else { setError(result.message); }
    setLoading(false);
  };

  return (
    <div className="login-root">
      <div className="login-header">
        <div className="login-header-logo">
          <div className="login-header-icon">S</div>
          <span className="login-header-name">StockSense</span>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ marginBottom: 28 }}>
          <h1 className="glass-title">
            {otpSent ? "Reset " : "Forgot "}
            <span>{otpSent ? "Password" : "Password?"}</span>
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>
            {otpSent
              ? "Enter the OTP and choose a new password."
              : "Enter your email and we will send a reset OTP."}
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleRequestOtp}>
            <div className="glass-field">
              <input className="glass-input" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error   && <div className="glass-error">{error}</div>}
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
                style={{ letterSpacing: "0.25em", textAlign: "center", fontSize: 18, fontWeight: 700 }}
              />
            </div>
            <div className="glass-field">
              <input
                className="glass-input"
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ paddingRight: "3.5rem" }}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="glass-field">
              <input
                className="glass-input"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error   && <div className="glass-error">{error}</div>}
            {success && <div className="glass-success">{success}</div>}
            <button type="submit" className="glass-submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button
              type="button"
              className="register-link"
              style={{ display: "block", width: "100%", textAlign: "center", marginBottom: 16 }}
              onClick={() => { setOtpSent(false); setError(""); setSuccess(""); }}
            >
              Back to request OTP
            </button>
          </form>
        )}

        <div className="register-row">
          Remembered your password?{" "}
          <button type="button" className="register-link" onClick={() => setCurrentPage("login")}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
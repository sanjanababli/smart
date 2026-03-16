import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { authAPI } from "../services/api.js";

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

const StaffRegistrationPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deregisterEmail, setDeregisterEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!strongPasswordRegex.test(password)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, and special character.");
      return;
    }

    setLoading(true);

    try {
      await authAPI.registerStaff({ name, email, password });
      setSuccess("Staff member registered successfully!");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeregister = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!window.confirm(`Are you sure you want to deregister staff: ${deregisterEmail}?`)) {
      setLoading(false);
      return;
    }

    try {
      await authAPI.deregisterStaff({ email: deregisterEmail });
      setSuccess("Staff member deregistered successfully!");
      setDeregisterEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Deregistration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="db-root">
      {/* SIDEBAR */}
      <aside className="db-sidebar">
        <div className="db-logo">
          <div className="db-logo-icon">S</div>
          <span>StockSense</span>
        </div>
        <nav className="db-nav">
          <button className="db-nav-item" onClick={() => setCurrentPage(null)}>
            <span className="db-nav-icon">⊞</span><span>Dashboard</span>
          </button>
          <button className="db-nav-item" onClick={() => setCurrentPage("products")}>
            <span className="db-nav-icon">🏷️</span><span>Products</span>
          </button>
          <button className="db-nav-item" onClick={() => setCurrentPage("billing")}>
            <span className="db-nav-icon">🧾</span><span>Billing</span>
          </button>
          <button className="db-nav-item" onClick={() => setCurrentPage("sales")}>
            <span className="db-nav-icon">📊</span><span>Sales</span>
          </button>
          <button className="db-nav-item" onClick={() => setCurrentPage("reports")}>
            <span className="db-nav-icon">📋</span><span>Reports</span>
          </button>
          <button className="db-nav-item active" onClick={() => setCurrentPage("staff")}>
            <span className="db-nav-icon">👥</span><span>Staff</span>
          </button>
          <button 
            className="db-nav-item" 
            onClick={logout} 
            style={{ marginTop: "auto", color: "rgba(248,113,113,0.8)" }}
          >
            <span className="db-nav-icon">🚪</span><span>Logout</span>
          </button>
        </nav>
        <div 
          className="db-user-pill" 
          onClick={() => setCurrentPage("profile")}
          style={{ cursor: "pointer" }}
        >
          <div className="db-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <div className="db-user-name">{user?.name || "User"}</div>
            <div className="db-user-role">{user?.role || "staff"}</div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="db-main" style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "4rem" }}>
        
        <div className="db-glass-panel" style={{ width: "100%", maxWidth: "600px", padding: "2rem",marginLeft:"12rem" }}>
          <div className="pp-header" style={{ marginBottom: "1rem" }}>
            <h2 className="pp-title">Register Staff</h2>
          </div>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            Register a new employee under your account.
          </p>
          
          <form className="pp-form-grid" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="pp-form-group">
              <label className="pp-form-label">Name</label>
              <input 
                className="pp-form-input" 
                value={name} 
                onChange={(event) => setName(event.target.value)} 
                required 
                placeholder="Staff name"
              />
            </div>
            <div className="pp-form-group">
              <label className="pp-form-label">Email</label>
              <input 
                className="pp-form-input" 
                type="email" 
                value={email} 
                onChange={(event) => setEmail(event.target.value)} 
                required 
                placeholder="email@example.com"
              />
            </div>
            <div className="pp-form-group">
              <label className="pp-form-label">Password</label>
              <input
                className="pp-form-input"
                type="password"
                minLength="8"
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}"
                title="Minimum 8 characters with 1 uppercase, 1 lowercase, and 1 special character."
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Min 8 chars, 1 uppercase, 1 special character"
              />
            </div>
            
            <button type="submit" disabled={loading} className="pp-btn-primary" style={{ marginTop: "1rem" }}>
              {loading ? "Registering..." : "Register Staff"}
            </button>
          </form>

          <hr className="pp-divider" style={{ margin: "2.5rem 0", borderColor: "rgba(255,255,255,0.1)", opacity: 0.5 }} />

          <div className="pp-header" style={{ marginBottom: "1rem" }}>
            <h2 className="pp-title">Deregister Staff</h2>
          </div>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            Permanently remove an employee by their email.
          </p>
          
          <form className="pp-form-grid" onSubmit={handleDeregister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="pp-form-group">
              <label className="pp-form-label">Staff Email</label>
              <input
                className="pp-form-input"
                type="email"
                value={deregisterEmail}
                onChange={(event) => setDeregisterEmail(event.target.value)}
                required
                placeholder="staff@example.com"
              />
            </div>
            
            {(error || success) && (
              <div 
                className={error ? "pp-form-error" : ""} 
                style={{ 
                  color: error ? undefined : "#34d399", 
                  background: error ? undefined : "rgba(52,211,153,0.1)",
                  padding: success ? "0.75rem" : undefined,
                  borderRadius: success ? "8px" : undefined,
                  fontSize: success ? "0.85rem" : undefined,
                  border: success ? "1px solid rgba(52,211,153,0.2)" : undefined
                }}
              >
                {error || success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="pp-btn-secondary"
              style={{ marginTop: "1rem", color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}
            >
              {loading ? "Removing..." : "Deregister Staff"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default StaffRegistrationPage;

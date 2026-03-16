import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { API } from "../services/api.js";

const ProfilePage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get("/auth/me");
        setProfileData(response.data.data);
      } catch (err) {
        setError("Failed to load profile data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (!profileData || !profileData.createdAt) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [profileData]);

  if (loading) {
    return (
      <div className="db-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="pp-loading">Loading Profile...</div>
      </div>
    );
  }

  const joinDate = profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString("en-IN", {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : "N/A";

  return (
    <div className="db-root">
      {/* SIDEBAR */}
      <aside className="db-sidebar">
        <div className="db-logo">
          <div className="db-logo-icon">S</div>
          <span>StockSense</span>
        </div>
        <nav className="db-nav">
          <button className="db-nav-item" onClick={() => setCurrentPage("dashboard")}>
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
          {(user?.role === "owner" || user?.role === "admin") && (
            <button className="db-nav-item" onClick={() => setCurrentPage("staff")}>
              <span className="db-nav-icon">👥</span><span>Staff</span>
            </button>
          )}
          <button 
            className="db-nav-item" 
            onClick={logout} 
            style={{ marginTop: "auto", color: "rgba(248,113,113,0.8)" }}
          >
            <span className="db-nav-icon">🚪</span><span>Logout</span>
          </button>
        </nav>
        <div 
          className="db-user-pill active" 
          onClick={() => setCurrentPage("profile")}
          style={{ cursor: "pointer", border: "1px solid rgba(167,139,250,0.4)", background: "rgba(167,139,250,0.1)" }}
        >
          <div className="db-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <div className="db-user-name">{user?.name || "User"}</div>
            <div className="db-user-role">{user?.role || "staff"}</div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="db-main">
        <div className="pp-header">
          <div>
            <h1 className="pp-title">Owner Profile</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.25rem", fontSize: "0.9rem" }}>
              Manage your personal information and account settings.
            </p>
          </div>
        </div>

        {error && <div className="glass-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

        <div className="db-charts-row" style={{ alignItems: "flex-start", gap: "2rem" }}>
          {/* PROFILE CARD */}
          <div className="db-glass-panel" style={{ flex: 1.5, padding: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "3rem" }}>
              <div style={{ 
                width: "100px", 
                height: "100px", 
                borderRadius: "30px", 
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                fontWeight: "bold",
                boxShadow: "0 10px 30px rgba(124, 58, 237, 0.3)",
                border: "2px solid rgba(255,255,255,0.2)"
              }}>
                {profileData?.name?.[0]?.toUpperCase() || "O"}
              </div>
              <div>
                <h2 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem" }}>{profileData?.name}</h2>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <span className="pp-category-tag" style={{ fontSize: "0.9rem", padding: "0.4rem 1rem" }}>{profileData?.role?.toUpperCase()}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", display: "flex", alignItems: "center" }}>
                    Joined on {joinDate}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div className="pp-form-group">
                <label className="pp-form-label">Full Name</label>
                <div className="db-stat-value" style={{ fontSize: "1.1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                  {profileData?.name}
                </div>
              </div>
              <div className="pp-form-group">
                <label className="pp-form-label">Email Address</label>
                <div className="db-stat-value" style={{ fontSize: "1.1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                  {profileData?.email}
                </div>
              </div>
              <div className="pp-form-group">
                <label className="pp-form-label">User ID</label>
                <div style={{ fontSize: "0.9rem", opacity: 0.6, fontFamily: "monospace" }}>
                  {profileData?.id || profileData?._id}
                </div>
              </div>
              <div className="pp-form-group">
                <label className="pp-form-label">Account Status</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px #34d399" }}></div>
                  <span style={{ fontWeight: 600, color: "#34d399" }}>Active</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button 
                className="pp-btn-secondary" 
                style={{ opacity: 0.7 }}
                onClick={() => alert("Profile editing coming soon!")}
              >
                ⚙️ Account Settings
              </button>
            </div>
          </div>

          {/* STORE INFO / STATS */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
             <div className="db-glass-panel">
                <div className="db-panel-title" style={{ marginBottom: "1rem" }}>Store Presence</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.5, marginBottom: "0.25rem" }}>Primary Business</div>
                    <div style={{ fontWeight: 600 }}>Smart Inventory Systems</div>
                  </div>
                  <div style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "0.8rem", opacity: 0.5, marginBottom: "0.25rem" }}>Location</div>
                    <div style={{ fontWeight: 600 }}>Belgavi, Karnataka</div>
                  </div>
                </div>
             </div>

             <div className="db-glass-panel" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(52,211,153,0.1))" }}>
                <div className="db-panel-header" style={{ marginBottom: "1rem" }}>
                  <div className="db-panel-title">Security Status</div>
                  <div style={{ padding: "0.25rem 0.5rem", background: "rgba(52,211,153,0.2)", color: "#34d399", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>VERIFIED</div>
                </div>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                  Your account is protected with standard encryption. Last password change was recently.
                </p>
                <button 
                  className="pp-btn-primary" 
                  style={{ width: "100%", marginTop: "1.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onClick={() => setCurrentPage("forgot-password")}
                >
                  🔐 Change Password
                </button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;

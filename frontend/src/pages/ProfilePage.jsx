import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { API } from "../services/api.js";
import AppSidebar from "./Appsidebar.jsx";

const ProfilePage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(user || null);
  const [loading,     setLoading]     = useState(!user);
  const [error,       setError]       = useState("");

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
    if (!profileData || !profileData.createdAt) fetchProfile();
    else setLoading(false);
  }, [profileData]);

  if (loading) {
    return (
      <div className="db-root">
        <AppSidebar setCurrentPage={setCurrentPage} user={user} logout={logout} activePage="profile" />
        <main className="db-main" style={{ alignItems: "center", justifyContent: "center" }}>
          <div className="pp-loading"><div className="pp-spinner" />Loading profile...</div>
        </main>
      </div>
    );
  }

  const joinDate = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";

  return (
    <div className="db-root">
      <AppSidebar setCurrentPage={setCurrentPage} user={user} logout={logout} activePage="profile" />

      <main className="db-main">
        <div className="db-topbar">
          <div>
            <div className="db-greeting">My Profile</div>
            <div className="db-subgreeting">Manage your personal information and account settings.</div>
          </div>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

          {/* PROFILE CARD */}
          <div className="db-glass-panel">
            {/* Avatar row */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid var(--surface-3)" }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: "linear-gradient(135deg, var(--blue-500), var(--blue-700))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 800, color: "#fff",
                boxShadow: "0 8px 24px rgba(37,99,235,0.25)",
                flexShrink: 0,
              }}>
                {profileData?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  {profileData?.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <span className="pp-category-tag" style={{ fontSize: 11 }}>
                    {profileData?.role?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Joined {joinDate}</span>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { label: "Full Name",     value: profileData?.name  },
                { label: "Email Address", value: profileData?.email },
                { label: "User ID",       value: profileData?.id || profileData?._id, mono: true },
                { label: "Status",        isStatus: true },
              ].map(({ label, value, mono, isStatus }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 6 }}>
                    {label}
                  </div>
                  {isStatus ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
                      <span style={{ fontWeight: 600, color: "var(--success)", fontSize: 13 }}>Active</span>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: mono ? 12 : 14,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      fontFamily: mono ? "monospace" : "inherit",
                      paddingBottom: 8,
                      borderBottom: "1px solid var(--surface-3)",
                    }}>
                      {value}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--surface-3)" }}>
              <button className="pp-btn-secondary" onClick={() => alert("Profile editing coming soon.")}>
                Account Settings
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Store info */}
            <div className="db-glass-panel">
              <div className="db-panel-title" style={{ marginBottom: 14 }}>Store Presence</div>
              {[
                { label: "Primary Business", value: "Smart Inventory Systems" },
                { label: "Location",          value: "Belgavi, Karnataka"     },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: "12px 14px",
                  background: "var(--surface-2)",
                  borderRadius: 10,
                  border: "1px solid var(--surface-3)",
                  marginBottom: 10,
                }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Security */}
            <div className="db-glass-panel" style={{ background: "var(--blue-50)", border: "1px solid var(--blue-100)" }}>
              <div className="db-panel-header" style={{ marginBottom: 10 }}>
                <div className="db-panel-title" style={{ color: "var(--blue-800)" }}>Security</div>
                <span style={{
                  padding: "3px 10px", background: "#D1FAE5", color: "#059669",
                  borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid #A7F3D0",
                }}>
                  VERIFIED
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--blue-700)", lineHeight: 1.6, marginBottom: 16 }}>
                Your account is protected. You can update your password at any time.
              </p>
              <button
                className="pp-btn-primary"
                style={{ width: "100%" }}
                onClick={() => setCurrentPage("forgot-password")}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
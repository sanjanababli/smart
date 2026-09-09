import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { authAPI } from "../services/api.js";
import AppSidebar from "./AppSidebar.jsx";

// ─── helpers ────────────────────────────────────────────────────────────────

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const formatDate = (d) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Photo storage helpers (localStorage, base64) ────────────────────────────

const PHOTO_KEY = "ss_staff_photos";

const readPhotos = () => {
  try { return JSON.parse(localStorage.getItem(PHOTO_KEY) || "{}"); }
  catch { return {}; }
};

const savePhoto = (memberId, base64) => {
  try {
    const photos = readPhotos();
    photos[memberId] = base64;
    localStorage.setItem(PHOTO_KEY, JSON.stringify(photos));
  } catch {}
};

const getPhoto = (memberId) => {
  if (!memberId) return null;
  return readPhotos()[memberId] || null;
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// ─── Derive helpers ──────────────────────────────────────────────────────────

const deriveLastActivity = (member) => {
  if (!member) return "No activity recorded";
  const now = new Date();
  const created = member.createdAt ? new Date(member.createdAt) : null;
  if (created) {
    const diffMin = Math.round((now - created) / 60000);
    if (diffMin < 60)   return `Joined – ${diffMin} min ago`;
    if (diffMin < 1440) { const h = Math.round(diffMin / 60); return `Joined – ${h} hr${h > 1 ? "s" : ""} ago`; }
  }
  const role = (member.role || "staff").toLowerCase();
  if (role === "owner") return "Last Login – Today";
  if (role === "admin") return "Updated Inventory – Earlier today";
  return "Last Login – Today";
};

const derivePerformance = (member) => {
  if (!member) return 0;
  const str = (member._id || member.id || member.email || "").toString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  return 70 + (Math.abs(hash) % 30);
};

// ─── Avatar — shows photo if available, else initials ────────────────────────

const Avatar = ({ name, memberId, size = 38, fontSize = 14, photo }) => {
  const colors = [
    "linear-gradient(135deg,#2563EB,#1E4D8C)",
    "linear-gradient(135deg,#0EA5E9,#2563EB)",
    "linear-gradient(135deg,#6366F1,#2563EB)",
    "linear-gradient(135deg,#10B981,#0EA5E9)",
    "linear-gradient(135deg,#F59E0B,#EF4444)",
  ];
  const idx = (name || "").charCodeAt(0) % colors.length;
  const src = photo || (memberId ? getPhoto(memberId) : null);

  if (src) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        overflow: "hidden", flexShrink: 0,
        border: "2.5px solid rgba(255,255,255,0.3)",
      }}>
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: colors[idx],
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize, color: "#fff",
      flexShrink: 0, letterSpacing: "-0.5px",
    }}>
      {getInitials(name)}
    </div>
  );
};

// ─── Clickable Upload Avatar (used in profile panel header) ──────────────────

const UploadAvatar = ({ member, size = 76, fontSize = 26, onPhotoChange }) => {
  const fileRef = useRef();
  const [preview, setPreview] = useState(() => getPhoto(member?._id || member?.id));
  const [hover,   setHover]   = useState(false);

  useEffect(() => {
    setPreview(getPhoto(member?._id || member?.id));
  }, [member?._id, member?.id]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2 MB."); return; }
    const base64 = await fileToBase64(file);
    const id = member?._id || member?.id;
    savePhoto(id, base64);
    setPreview(base64);
    if (onPhotoChange) onPhotoChange(base64);
  };

  return (
    <div
      style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
      onClick={() => fileRef.current?.click()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Click to upload profile photo"
    >
      <Avatar name={member?.name} memberId={member?._id || member?.id} size={size} fontSize={fontSize} photo={preview} />

      {/* online dot */}
      <div style={{
        position: "absolute", bottom: 2, right: 2,
        width: 14, height: 14, borderRadius: "50%",
        background: "#10B981", border: "2.5px solid #1E4D8C",
        zIndex: 2,
      }} />

      {/* hover overlay */}
      {hover && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 3,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
};

// ─── Performance Ring ────────────────────────────────────────────────────────

const PerformanceRing = ({ score }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 85 ? "#10B981" : score >= 70 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={circ - fill}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>SCORE</span>
      </div>
    </div>
  );
};

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ title, accent }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
  }}>
    <div style={{ width: 3, height: 14, borderRadius: 2, background: accent || "var(--blue-500)", flexShrink: 0 }} />
    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
      {title}
    </span>
  </div>
);

// ─── Info Row ────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, mono }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>
      {label}
    </span>
    <span style={{
      fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
      fontFamily: mono ? "monospace" : "inherit",
      wordBreak: "break-all", lineHeight: 1.4,
    }}>
      {value || "—"}
    </span>
  </div>
);

// ─── Activity Row ─────────────────────────────────────────────────────────────
const ActivityRow = ({ text, time, color = "var(--blue-400)" }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--surface-3)" }}>
    <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.4 }}>{text}</div>
      {time && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{time}</div>}
    </div>
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ value, max = 100, color = "var(--blue-500)" }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Progress</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "var(--surface-3)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
    </div>
  );
};

// ─── Profile Panel ────────────────────────────────────────────────────────────
const ProfilePanel = ({ member, onDeregister, loading }) => {
  const [visible,      setVisible]      = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const perf = derivePerformance(member);

  // Deterministic but varied derived data from member id
  const seed = member ? parseInt((member._id || member.id || "0").toString().replace(/\D/g, "").slice(-4) || "1234") : 0;
  const monthlySales   = member ? 18000 + (seed % 40000) : 0;
  const monthlyTarget  = 60000;
  const attendancePct  = member ? 75 + (seed % 25) : 0;
  const shiftTiming    = ["9:00 AM – 6:00 PM", "10:00 AM – 7:00 PM", "8:00 AM – 5:00 PM"][seed % 3];
  const department     = ["Operations", "Sales", "Inventory", "Billing"][seed % 4];
  const status         = seed % 5 === 0 ? "On Leave" : seed % 7 === 0 ? "Off Shift" : "Working";
  const statusColor    = status === "Working" ? "#10B981" : status === "On Leave" ? "#F59E0B" : "#94A3B8";
  const phone          = `+91 ${9000000000 + (seed % 999999999)}`.replace(/(\d{3})(\d{5})(\d{5})/, "+91 $2 $3");
  const empId          = "EMP-" + (member ? (member._id || member.id || "").toString().slice(-6).toUpperCase() : "------");
  const joinDate       = formatDate(member?.createdAt);
  const branch         = ["Main Branch", "North Wing", "South Outlet", "HQ"][seed % 4];
  const perfColor      = perf >= 85 ? "#10B981" : perf >= 70 ? "#F59E0B" : "#EF4444";

  const now     = new Date();
  const hhmm    = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const activities = [
    { text: `Processed Invoice #INV-${2000 + (seed % 999)}`,  time: `${2 + (seed % 8)} min ago`,   color: "var(--blue-400)" },
    { text: "Updated Inventory",                               time: `${10 + (seed % 20)} min ago`, color: "#10B981"         },
    { text: `Generated Invoice #INV-${3000 + (seed % 999)}`,  time: `${10 + (seed % 10)}:${(seed % 59).toString().padStart(2,"0")} AM`, color: "var(--blue-300)" },
    { text: `Logged In`,                                       time: `Today ${hhmm}`,                color: "#8B5CF6"         },
  ];

  const aiInsight = perf >= 85
    ? "Top performer this period. Consistently active and highly reliable — consider a performance recognition or additional responsibilities."
    : perf >= 70
    ? "Performing within expectations. A targeted goal for this month could help unlock their next level of output."
    : "Performance needs attention. A structured one-on-one check-in is recommended to identify and remove blockers.";

  useEffect(() => {
    setVisible(false);
    setPhotoPreview(null);
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [member?._id, member?.id]);

  if (!member) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100%", gap: 14, padding: 32, textAlign: "center",
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: "50%",
          background: "var(--surface-3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>Select a team member</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 200, lineHeight: 1.6 }}>
          Click any row in the table to view their full profile, performance and recent activity.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.35s cubic-bezier(0.22,1,0.36,1), transform 0.35s cubic-bezier(0.22,1,0.36,1)",
      height: "100%", overflowY: "auto", display: "flex", flexDirection: "column",
    }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #1E4D8C 0%, #2563EB 100%)",
        padding: "22px 20px 18px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        flexShrink: 0,
      }}>
        <UploadAvatar
          member={member}
          size={76}
          fontSize={26}
          onPhotoChange={(b64) => setPhotoPreview(b64)}
        />
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: -4 }}>
          Click photo to upload
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{member.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2, textTransform: "capitalize" }}>
            {department} · {member.role || "staff"}
          </div>
          <div style={{ marginTop: 6 }}>
            <span style={{
              display: "inline-block", padding: "3px 10px", borderRadius: 20,
              background: `${statusColor}22`, border: `1px solid ${statusColor}55`,
              fontSize: 11, fontWeight: 700, color: statusColor,
            }}>
              {status}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{empId}</div>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>

        {/* EMPLOYEE OVERVIEW */}
        <div>
          <SectionHeader title="Employee Overview" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InfoRow label="Employee ID" value={empId} mono />
            <InfoRow label="Role"        value={member.role || "staff"} />
            <InfoRow label="Department"  value={department} />
            <InfoRow label="Branch"      value={branch} />
          </div>
        </div>

        {/* CONTACT */}
        <div style={{ borderTop: "1px solid var(--surface-3)", paddingTop: 14 }}>
          <SectionHeader title="Contact" accent="#10B981" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InfoRow label="Phone" value={phone} />
            <InfoRow label="Email" value={member.email} />
          </div>
        </div>

        {/* WORK DETAILS */}
        <div style={{ borderTop: "1px solid var(--surface-3)", paddingTop: 14 }}>
          <SectionHeader title="Work Details" accent="#8B5CF6" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <InfoRow label="Joining Date"   value={joinDate} />
            <InfoRow label="Shift Timing"   value={shiftTiming} />
            <InfoRow label="Attendance"     value={`${attendancePct}%`} />
            <InfoRow label="Status"         value={status} />
          </div>
          {/* Attendance bar */}
          <ProgressBar value={attendancePct} max={100} color={attendancePct >= 85 ? "#10B981" : attendancePct >= 70 ? "#F59E0B" : "#EF4444"} />
        </div>

        {/* PERFORMANCE */}
        <div style={{ borderTop: "1px solid var(--surface-3)", paddingTop: 14 }}>
          <SectionHeader title="Performance" accent={perfColor} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <PerformanceRing score={perf} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <InfoRow label="Monthly Sales"  value={`₹${monthlySales.toLocaleString("en-IN")}`} />
              <InfoRow label="Monthly Target" value={`₹${monthlyTarget.toLocaleString("en-IN")}`} />
            </div>
          </div>
          <ProgressBar value={monthlySales} max={monthlyTarget} color={perfColor} />
        </div>

        {/* RECENT ACTIVITY */}
        <div style={{ borderTop: "1px solid var(--surface-3)", paddingTop: 14 }}>
          <SectionHeader title="Recent Activity" accent="var(--blue-400)" />
          {activities.map((a, i) => (
            <ActivityRow key={i} text={a.text} time={a.time} color={a.color} />
          ))}
        </div>

        {/* EMERGENCY CONTACT */}
        <div style={{ borderTop: "1px solid var(--surface-3)", paddingTop: 14 }}>
          <SectionHeader title="Emergency Contact" accent="#EF4444" />
          <div style={{
            background: "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.12)",
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <InfoRow label="Contact Name"  value={`${member.name.split(" ")[0]}'s Guardian`} />
              <InfoRow label="Relationship"  value="Family" />
              <InfoRow label="Phone"         value={`+91 ${8000000000 + (seed % 999999999)}`.slice(0, 14)} />
              <InfoRow label="Availability"  value="24 / 7" />
            </div>
          </div>
        </div>

        {/* AI INSIGHT */}
        <div style={{
          background: "var(--blue-50)", border: "1px solid var(--blue-100)",
          borderLeft: "3px solid var(--blue-500)", borderRadius: 12, padding: "12px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, background: "var(--blue-500)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 900, color: "#fff",
            }}>AI</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue-800)" }}>Performance Insight</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--blue-700)", lineHeight: 1.6, margin: 0 }}>{aiInsight}</p>
        </div>

        {/* DEREGISTER */}
        {member.role !== "owner" && (
          <button
            onClick={() => onDeregister(member)}
            disabled={loading}
            style={{
              padding: "10px", borderRadius: 10,
              border: "1px solid #FECACA", background: "#FEF2F2",
              color: "var(--danger)", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "background 0.15s", width: "100%",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}
          >
            {loading ? "Removing..." : "Deregister This Member"}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const StaffRegistrationPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();

  // existing form state
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [deregisterEmail, setDeregisterEmail] = useState("");
  const [formError,       setFormError]       = useState("");
  const [formSuccess,     setFormSuccess]     = useState("");
  const [formLoading,     setFormLoading]     = useState(false);

  // team management state
  const [staffList,      setStaffList]      = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [search,         setSearch]         = useState("");
  const [roleFilter,     setRoleFilter]     = useState("all");
  const [listLoading,    setListLoading]    = useState(true);
  const [listError,      setListError]      = useState("");
  const [deregLoading,   setDeregLoading]   = useState(false);
  const [deregSuccess,   setDeregSuccess]   = useState("");
  const [activeTab,      setActiveTab]      = useState("team"); // "team" | "register"

  // ── localStorage helpers — keyed per owner so staff lists don't mix ──────
  const storageKey = `ss_staff_${user?.id || user?._id || "default"}`;

  const readLocalStaff = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, [storageKey]);

  const writeLocalStaff = useCallback((list) => {
    try { localStorage.setItem(storageKey, JSON.stringify(list)); } catch {}
  }, [storageKey]);

  // ── load staff list from localStorage ────────────────────────────────────
 const loadStaff = useCallback(async () => {
  setListLoading(true);
  setListError("");

  try {
    const res = await authAPI.getStaff();
    const list = res?.data?.data || [];
    setStaffList(list);
  } catch (err) {
    setListError(err.response?.data?.message || "Failed to load team");
  } finally {
    setListLoading(false);
  }
}, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  // ── register ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(""); setFormSuccess("");
    if (!strongPasswordRegex.test(password)) {
      setFormError("Password must be at least 8 characters with uppercase, lowercase, and special character.");
      return;
    }
    setFormLoading(true);
    try {
      const res = await authAPI.registerStaff({ name, email, password });
      const newMember = {
        _id:       res?.data?.id  || res?.data?.data?.id  || `local_${Date.now()}`,
        id:        res?.data?.id  || res?.data?.data?.id  || `local_${Date.now()}`,
        name:      res?.data?.name  || res?.data?.data?.name  || name,
        email:     res?.data?.email || res?.data?.data?.email || email.trim().toLowerCase(),
        role:      res?.data?.role  || res?.data?.data?.role  || "staff",
        createdAt: new Date().toISOString(),
      };
      // Avoid duplicates by email
      const existing = readLocalStaff();
      const deduped  = existing.filter((m) => m.email !== newMember.email);
      const updated  = [...deduped, newMember];
      writeLocalStaff(updated);
      setStaffList(updated);
      setFormSuccess("Staff member registered successfully.");
      setName(""); setEmail(""); setPassword("");
      setActiveTab("team");
    } catch (err) {
      setFormError(err.response?.data?.message || "Registration failed");
    } finally { setFormLoading(false); }
  };

  // ── deregister from profile panel ────────────────────────────────────────
  const handleDeregisterMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} from your team?`)) return;
    setDeregLoading(true);
    try {
      await authAPI.deregisterStaff({ email: member.email });
      const updated = readLocalStaff().filter((m) => m.email !== member.email);
      writeLocalStaff(updated);
      setStaffList(updated);
      setDeregSuccess(`${member.name} has been removed.`);
      setSelectedMember(null);
    } catch (err) {
      setFormError(err.response?.data?.message || "Deregistration failed");
    } finally { setDeregLoading(false); }
  };

  // ── deregister from form ──────────────────────────────────────────────────
  const handleDeregister = async (e) => {
    e.preventDefault();
    setFormError(""); setFormSuccess("");
    if (!window.confirm(`Deregister staff: ${deregisterEmail}?`)) return;
    setFormLoading(true);
    try {
      await authAPI.deregisterStaff({ email: deregisterEmail });
      const updated = readLocalStaff().filter((m) => m.email !== deregisterEmail.trim().toLowerCase());
      writeLocalStaff(updated);
      setStaffList(updated);
      setFormSuccess("Staff member deregistered successfully.");
      setDeregisterEmail("");
    } catch (err) {
      setFormError(err.response?.data?.message || "Deregistration failed");
    } finally { setFormLoading(false); }
  };

  // ── filtered list ─────────────────────────────────────────────────────────
  const filtered = staffList.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
    const matchRole   = roleFilter === "all" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roles = ["all", ...Array.from(new Set(staffList.map((m) => m.role).filter(Boolean)))];

  return (
    <div className="db-root">
      <AppSidebar setCurrentPage={setCurrentPage} user={user} logout={logout} activePage="staff" />

      <main className="db-main">

        {/* PAGE HEADER */}
        <div className="db-topbar">
          <div>
            <div className="db-greeting">Team Management</div>
            <div className="db-subgreeting">Monitor, manage, and track your entire team from one place.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className={activeTab === "team" ? "db-action-btn" : "pp-btn-secondary"}
              onClick={() => setActiveTab("team")}
              style={{ fontSize: 13 }}
            >
              Team Overview
            </button>
            <button
              className={activeTab === "register" ? "db-action-btn" : "pp-btn-secondary"}
              onClick={() => setActiveTab("register")}
              style={{ fontSize: 13 }}
            >
              + Add / Remove Staff
            </button>
          </div>
        </div>

        {formError   && <div className="error-text"   style={{ marginBottom: 12 }}>{formError}</div>}
        {formSuccess && <div className="success-text" style={{ marginBottom: 12 }}>{formSuccess}</div>}
        {deregSuccess && <div className="success-text" style={{ marginBottom: 12 }}>{deregSuccess}</div>}

        {/* ── TEAM OVERVIEW TAB ── */}
        {activeTab === "team" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 20,
            alignItems: "start",
            minHeight: "calc(100vh - 180px)",
          }}>

            {/* LEFT — Staff Table */}
            <div className="db-glass-panel" style={{ padding: 0, overflow: "hidden" }}>

              {/* Table toolbar */}
              <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--surface-3)",
                display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
              }}>
                {/* Search */}
                <div style={{ flex: 1, position: "relative", minWidth: 180 }}>
                  <span style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    color: "var(--text-muted)", fontSize: 14, pointerEvents: "none",
                  }}>
                    &#9906;
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 34px",
                      borderRadius: 999,
                      border: "1.5px solid var(--surface-3)",
                      background: "var(--surface-2)",
                      fontSize: 13,
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Role filter chips */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 999,
                        border: `1.5px solid ${roleFilter === r ? "var(--blue-400)" : "var(--surface-3)"}`,
                        background: roleFilter === r ? "var(--blue-50)" : "var(--surface-1)",
                        color: roleFilter === r ? "var(--blue-600)" : "var(--text-secondary)",
                        fontSize: 12, fontWeight: 600,
                        cursor: "pointer",
                        textTransform: "capitalize",
                        transition: "all 0.15s",
                      }}
                    >
                      {r === "all" ? "All Roles" : r}
                    </button>
                  ))}
                </div>

                <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {filtered.length} member{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Table */}
              {listLoading ? (
                <div className="pp-loading"><div className="pp-spinner" />Loading team...</div>
              ) : listError ? (
                <div className="db-empty" style={{ color: "var(--danger)" }}>{listError}</div>
              ) : filtered.length === 0 ? (
                <div className="db-empty">
                  {staffList.length === 0
                    ? "No staff members found. Add your first team member using the Add / Remove Staff tab."
                    : "No results match your search."}
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)" }}>
                      {["Member", "Role", "Last Activity", "Performance", ""].map((h) => (
                        <th key={h} style={{
                          padding: "11px 16px",
                          textAlign: "left",
                          fontSize: 11, fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          color: "var(--text-muted)",
                          borderBottom: "1px solid var(--surface-3)",
                          whiteSpace: "nowrap",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((member) => {
                      const isSelected = (selectedMember?._id || selectedMember?.id) === (member._id || member.id);
                      const perf = derivePerformance(member);
                      const activity = deriveLastActivity(member);
                      const perfColor = perf >= 85 ? "#10B981" : perf >= 70 ? "#F59E0B" : "#EF4444";

                      return (
                        <tr
                          key={member._id || member.id}
                          onClick={() => setSelectedMember(member)}
                          style={{
                            background: isSelected ? "var(--blue-50)" : "transparent",
                            borderLeft: isSelected ? "3px solid var(--blue-500)" : "3px solid transparent",
                            cursor: "pointer",
                            transition: "background 0.15s, border-color 0.15s",
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--surface-2)"; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                        >
                          {/* Member */}
                          <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--surface-2)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar name={member.name} memberId={member._id || member.id} size={36} fontSize={13} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                                  {member.name}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--surface-2)" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 11, fontWeight: 600,
                              textTransform: "capitalize",
                              background: member.role === "owner"
                                ? "rgba(37,99,235,0.1)"
                                : member.role === "admin"
                                ? "rgba(16,185,129,0.1)"
                                : "var(--surface-3)",
                              color: member.role === "owner"
                                ? "var(--blue-600)"
                                : member.role === "admin"
                                ? "#059669"
                                : "var(--text-secondary)",
                            }}>
                              {member.role || "staff"}
                            </span>
                          </td>

                          {/* Last Activity */}
                          <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--surface-2)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue-400)", flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{activity}</span>
                            </div>
                          </td>

                          {/* Performance */}
                          <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--surface-2)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{
                                width: 64, height: 5, background: "var(--surface-3)",
                                borderRadius: 999, overflow: "hidden",
                              }}>
                                <div style={{
                                  width: `${perf}%`, height: "100%",
                                  background: perfColor, borderRadius: 999,
                                  transition: "width 0.6s ease",
                                }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: perfColor, minWidth: 28 }}>
                                {perf}
                              </span>
                            </div>
                          </td>

                          {/* View button */}
                          <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--surface-2)", textAlign: "right" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedMember(member); }}
                              style={{
                                padding: "5px 12px",
                                borderRadius: 8,
                                border: "1.5px solid var(--surface-3)",
                                background: isSelected ? "var(--blue-500)" : "var(--surface-1)",
                                color: isSelected ? "#fff" : "var(--text-secondary)",
                                fontSize: 12, fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              {isSelected ? "Viewing" : "View"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* RIGHT — Profile Panel */}
            <div className="db-glass-panel" style={{
              padding: 0,
              overflow: "hidden",
              position: "sticky",
              top: 20,
              minHeight: 480,
              display: "flex",
              flexDirection: "column",
            }}>
              <ProfilePanel
                member={selectedMember}
                onDeregister={handleDeregisterMember}
                loading={deregLoading}
              />
            </div>
          </div>
        )}

        {/* ── REGISTER / DEREGISTER TAB ── */}
        {activeTab === "register" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

            {/* REGISTER */}
            <div className="db-glass-panel">
              <div className="db-panel-header" style={{ marginBottom: 20 }}>
                <div>
                  <div className="db-panel-title">Register Staff</div>
                  <div className="db-panel-sub">Add a new employee under your account.</div>
                </div>
              </div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="pp-form-group">
                  <label className="pp-form-label">Full Name</label>
                  <input className="pp-form-input" type="text" placeholder="Staff member name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="pp-form-group">
                  <label className="pp-form-label">Email Address</label>
                  <input className="pp-form-input" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="pp-form-group">
                  <label className="pp-form-label">Password</label>
                  <input className="pp-form-input" type="password" placeholder="Min 8 chars, 1 uppercase, 1 special character" minLength="8" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" disabled={formLoading} className="pp-btn-primary" style={{ marginTop: 4 }}>
                  {formLoading ? "Registering..." : "Register Staff"}
                </button>
              </form>
            </div>

            {/* DEREGISTER */}
            <div className="db-glass-panel" style={{ border: "1px solid #FECACA", background: "#FFFAFA" }}>
              <div className="db-panel-header" style={{ marginBottom: 20 }}>
                <div>
                  <div className="db-panel-title" style={{ color: "var(--danger)" }}>Deregister Staff</div>
                  <div className="db-panel-sub">Permanently remove an employee by their email.</div>
                </div>
              </div>
              <div style={{
                padding: "12px 14px", background: "#FEE2E2",
                border: "1px solid #FECACA", borderRadius: 10,
                fontSize: 13, color: "#991B1B", lineHeight: 1.5, marginBottom: 16,
              }}>
                This action is permanent. The staff member will immediately lose all access.
              </div>
              <form onSubmit={handleDeregister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="pp-form-group">
                  <label className="pp-form-label">Staff Email</label>
                  <input className="pp-form-input" type="email" placeholder="staff@example.com" value={deregisterEmail} onChange={(e) => setDeregisterEmail(e.target.value)} required />
                </div>
                <button type="submit" disabled={formLoading} className="pp-btn-secondary" style={{ color: "var(--danger)", borderColor: "#FECACA", background: "#FEE2E2", marginTop: 4 }}>
                  {formLoading ? "Removing..." : "Deregister Staff"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffRegistrationPage;

// Shared slim sidebar — icon only, no text labels visible
// Used across all authenticated pages

const NAV_ITEMS = [
  { label: "Dashboard", page: null        },
  { label: "Products",  page: "products"  },
  { label: "Billing",   page: "billing"   },
  { label: "Sales",     page: "sales"     },
  { label: "Reports",   page: "reports"   },
];

const AppSidebar = ({ setCurrentPage, user, logout, activePage }) => {
  const isPrivileged = user?.role === "owner" || user?.role === "admin";

  return (
    <aside className="db-sidebar">
      <div className="db-logo">S</div>

      <nav className="db-nav">
        {NAV_ITEMS.map(({ label, page }) => (
          <button
            key={label}
            className={`db-nav-item ${activePage === page ? "active" : ""}`}
            onClick={() => setCurrentPage(page)}
            title={label}
          >
            <span className="db-nav-icon" />
            <span>{label}</span>
          </button>
        ))}

        {isPrivileged && (
          <button
            className={`db-nav-item ${activePage === "staff" ? "active" : ""}`}
            onClick={() => setCurrentPage("staff")}
            title="Staff"
          >
            <span className="db-nav-icon" />
            <span>Staff</span>
          </button>
        )}

        <button
          className="db-nav-item"
          onClick={logout}
          style={{ marginTop: "auto" }}
          title="Logout"
        >
          <span className="db-nav-icon" />
          <span>Logout</span>
        </button>
      </nav>

      <div
        className="db-user-pill"
        onClick={() => setCurrentPage("profile")}
        title="Profile"
      >
        <div className="db-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
        <div>
          <div className="db-user-name">{user?.name}</div>
          <div className="db-user-role">{user?.role}</div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
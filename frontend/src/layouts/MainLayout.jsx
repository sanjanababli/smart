import { useAuth } from "../context/AuthContext.jsx";

const MainLayout = ({ children }) => {
  return (
    <div className="app-shell">
      <header className="topbar">
        <nav>
          {/* Navigation buttons removed */}
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
};

export default MainLayout;
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import AuthLandingPage from "../pages/AuthLandingPage.jsx";
import BillingPage from "../pages/BillingPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import InventoryPage from "../pages/InventoryPage.jsx";
import ProductsPage from "../pages/ProductsPage.jsx";
import SalesPage from "../pages/SalesPage.jsx";
import ReportsPage from "../pages/ReportsPage.jsx";
import StaffRegistrationPage from "../pages/StaffRegistrationPage.jsx";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";

const PUBLIC_PAGES = ["landing", "login", "register", "forgot-password"];

const App = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(isAuthenticated ? "dashboard" : "landing");

  useEffect(() => {
    if (!isAuthenticated && !PUBLIC_PAGES.includes(currentPage)) {
      setCurrentPage("landing");
    }

    if (isAuthenticated && PUBLIC_PAGES.includes(currentPage)) {
      setCurrentPage("dashboard");
    }
  }, [currentPage, isAuthenticated]);

  const renderPage = () => {
    if (!isAuthenticated && currentPage === "forgot-password") {
      return <ForgotPasswordPage setCurrentPage={setCurrentPage} />;
    }

    if (!isAuthenticated) {
      // "landing", "login", and "register" all render the same split page,
      // just starting on a different tab.
      const initialMode = currentPage === "register" ? "register" : "login";
      return <AuthLandingPage setCurrentPage={setCurrentPage} initialMode={initialMode} />;
    }

    if (currentPage === "inventory") {
      return <InventoryPage setCurrentPage={setCurrentPage} />;
    }

    if (currentPage === "products") {
      return <ProductsPage setCurrentPage={setCurrentPage} />;
    }

    if (currentPage === "billing") {
      return <BillingPage setCurrentPage={setCurrentPage} />;
    }

    if (currentPage === "sales") {
      return <SalesPage setCurrentPage={setCurrentPage} />;
    }

    if (currentPage === "reports") {
      return <ReportsPage setCurrentPage={setCurrentPage} />;
    }

    if (currentPage === "staff") {
      return <StaffRegistrationPage setCurrentPage={setCurrentPage} />;
    }

    if (currentPage === "profile") {
      return <ProfilePage setCurrentPage={setCurrentPage} />;
    }

    return <DashboardPage setCurrentPage={setCurrentPage} />;
  };

  return (
    <MainLayout currentPage={currentPage} isAuthenticated={isAuthenticated} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </MainLayout>
  );
};

export default App;
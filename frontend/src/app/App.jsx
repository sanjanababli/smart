import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import BillingPage from "../pages/BillingPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import InventoryPage from "../pages/InventoryPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import ProductsPage from "../pages/ProductsPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import SalesPage from "../pages/SalesPage.jsx";
import ReportsPage from "../pages/ReportsPage.jsx";
import StaffRegistrationPage from "../pages/StaffRegistrationPage.jsx";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";

const App = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(isAuthenticated ? "dashboard" : "login");

  useEffect(() => {
    if (!isAuthenticated && !["register", "forgot-password"].includes(currentPage)) {
      setCurrentPage("login");
    }

    if (isAuthenticated && (currentPage === "login" || currentPage === "register" || currentPage === "forgot-password")) {
      setCurrentPage("dashboard");
    }
  }, [currentPage, isAuthenticated]);

  const renderPage = () => {
    if (!isAuthenticated && currentPage === "register") {
      return <RegisterPage setCurrentPage={setCurrentPage} />;
    }

    if (!isAuthenticated && currentPage === "forgot-password") {
      return <ForgotPasswordPage setCurrentPage={setCurrentPage} />;
    }

    if (!isAuthenticated) {
      return <LoginPage setCurrentPage={setCurrentPage} />;
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

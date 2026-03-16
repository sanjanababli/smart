import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "smart_inventory_token";
const USER_KEY = "smart_inventory_user";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    const storedUser = window.localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const nextToken = response.data.token;
      const nextUser = response.data.user;

      window.localStorage.setItem(TOKEN_KEY, nextToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setToken(nextToken);
      setUser(nextUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed"
      };
    }
  };

  const register = async (payload) => {
    try {
      await authAPI.register(payload);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed"
      };
    }
  };

  const verifyRegistrationOtp = async ({ email, otp }) => {
    try {
      await authAPI.verifyRegistrationOtp({ email, otp });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "OTP verification failed"
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Forgot password request failed"
      };
    }
  };

  const resetPassword = async ({ email, otp, newPassword }) => {
    try {
      const response = await authAPI.resetPassword({ email, otp, newPassword });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Password reset failed"
      };
    }
  };

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token),
        login,
        register,
        verifyRegistrationOtp,
        forgotPassword,
        resetPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

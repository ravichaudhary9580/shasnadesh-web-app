import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("shasnadesh_token");
    if (token) {
      getMe()
        .then((res) => setAdmin(res.data))
        .catch(() => localStorage.removeItem("shasnadesh_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginAdmin = (token, adminData) => {
    localStorage.setItem("shasnadesh_token", token);
    setAdmin(adminData);
  };

  const logoutAdmin = () => {
    localStorage.removeItem("shasnadesh_token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, loginAdmin, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

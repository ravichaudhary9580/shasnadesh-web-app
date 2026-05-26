import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

import Home from "./pages/Home";
import BlogDetail from "./pages/BlogDetail";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import BlogEditor from "./pages/admin/BlogEditor";
import ManageBlogs from "./pages/admin/ManageBlogs";
import Analytics from "./pages/admin/Analytics";
import AdminLayout from "./components/admin/AdminLayout";

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-saffron-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return admin ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/blog/:slug" element={<BlogDetail />} />
      <Route path="/login" element={<Login />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="blogs" element={<ManageBlogs />} />
        <Route path="blogs/new" element={<BlogEditor />} />
        <Route path="blogs/edit/:id" element={<BlogEditor />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        {/* <PWAInstallPrompt /> */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'DM Sans', sans-serif",
              background: "#26201a",
              color: "#faf8f5",
              borderRadius: "10px",
            },
            success: { iconTheme: { primary: "#e8920a", secondary: "#faf8f5" } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

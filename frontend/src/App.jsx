import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import NotificationPrompt from "./components/NotificationPrompt";

// Synchronous imports for critical public routes (better LCP)
import Home from "./pages/Home";
import BlogDetail from "./pages/BlogDetail";
import AdminLayout from "./components/admin/AdminLayout";

import { Analytics as VercelAnalytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"

// Lazy-loaded routes to reduce main JS bundle payload
const About = lazy(() => import("./pages/About"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const Login = lazy(() => import("./pages/Login"));

// Admin pages (contains heavy libs like TipTap, Recharts, JSZip)
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const BlogEditor = lazy(() => import("./pages/admin/BlogEditor"));
const ManageBlogs = lazy(() => import("./pages/admin/ManageBlogs"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const SystemBackup = lazy(() => import("./pages/admin/SystemBackup"));

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-saffron-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return admin ? children : <Navigate to="/login" replace />;
}

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-saffron-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="blogs" element={<ManageBlogs />} />
          <Route path="blogs/new" element={<BlogEditor />} />
          <Route path="blogs/edit/:id" element={<BlogEditor />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="backup" element={<SystemBackup />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <VercelAnalytics/>
        <SpeedInsights/>
        <AppRoutes />
        <PWAInstallPrompt />
        <NotificationPrompt />
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

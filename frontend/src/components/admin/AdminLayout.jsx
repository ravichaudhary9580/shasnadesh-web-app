import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  ExternalLink,
  Zap,
} from "lucide-react";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/blogs", label: "Manage Posts", icon: FileText },
  { to: "/admin/blogs/new", label: "New Post", icon: PenSquare },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logoutAdmin();
    toast.success("Logged out");
    navigate("/login");
  };

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Logo */}
      <div
        className={`flex items-center border-b border-ink-800 transition-all duration-300 ${
          collapsed && !isMobile ? "px-3 py-4 justify-center" : "px-5 py-4 gap-3"
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white font-display font-bold text-lg shadow-lg flex-shrink-0">
          <Zap size={18} strokeWidth={2.5} />
        </div>
        {(!collapsed || isMobile) && (
          <div className="overflow-hidden">
            <p className="font-display font-bold text-white text-sm leading-none">Shasnadeshupdates.com</p>
            <p className="font-ui text-xs text-ink-400 mt-0.5">Admin Panel</p>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto p-1 rounded-lg text-ink-400 hover:text-white hover:bg-ink-700 transition-all"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed && !isMobile ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl font-ui text-sm font-medium transition-all duration-150 group relative ${
                collapsed && !isMobile ? "px-3 py-3 justify-center" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-saffron-500 text-white shadow-md shadow-saffron-900/30"
                  : "text-ink-300 hover:bg-ink-800 hover:text-white"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                {(!collapsed || isMobile) && <span>{label}</span>}
                {collapsed && !isMobile && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-ink-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-ink-800 space-y-1">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white font-ui text-sm font-bold flex-shrink-0">
              {admin?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-ui text-sm font-medium text-white truncate">{admin?.name}</p>
              <p className="font-ui text-xs text-ink-400 truncate">{admin?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed && !isMobile ? "Logout" : undefined}
          className={`w-full flex items-center gap-2 rounded-xl font-ui text-sm text-ink-400 hover:bg-red-950/40 hover:text-red-400 transition-colors group relative ${
            collapsed && !isMobile ? "px-3 py-3 justify-center" : "px-3 py-2.5"
          }`}
        >
          <LogOut size={17} strokeWidth={2} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Logout</span>}
          {collapsed && !isMobile && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-ink-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
              Logout
            </div>
          )}
        </button>
      </div>
    </>
  );

  const sidebarWidth = collapsed ? "w-[68px]" : "w-64";

  return (
    // ── FIX 1: overflow-x-hidden on root prevents any child from causing page-level scroll
    <div className="min-h-screen bg-ink-100 flex overflow-x-hidden">

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex ${sidebarWidth} bg-ink-950 flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300 overflow-hidden`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-ink-950 flex flex-col z-10 animate-slide-up">
            <SidebarContent isMobile />
          </aside>
        </div>
      )}

      {/* ── FIX 2: min-w-0 + w-full ensures this column never exceeds viewport */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 w-full transition-all duration-300 ${
          collapsed ? "lg:ml-[68px]" : "lg:ml-64"
        }`}
      >
        {/* Top bar */}
        <header className="h-12 sm:h-14 bg-white border-b border-ink-100 flex items-center px-3 sm:px-4 lg:px-6 gap-3 sm:gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-ink-100 transition-colors text-ink-600"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="font-ui text-xs sm:text-sm text-ink-500 hover:text-saffron-600 transition-colors flex items-center gap-1 sm:gap-1.5"
          >
            View Site
            <ExternalLink size={13} />
          </a>
        </header>

        {/* ── FIX 3: overflow-x-hidden + w-full on main so page content can't overflow */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
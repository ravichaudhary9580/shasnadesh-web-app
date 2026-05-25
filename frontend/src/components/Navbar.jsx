import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "होम",                    to: "/" },
  { label: "उत्तर प्रदेश शासनादेश", to: "/?category=up-government" },
  { label: "शिक्षा विभाग",           to: "/?category=education" },
  { label: "वैकेंस अलर्ट",           to: "/?category=vacancy" },
  { label: "छात्रवृत्ति",            to: "/?category=scholarship" },
  { label: "अन्य",                   to: "/?category=other" },
];

export default function Navbar({ onSearch }) {
  const [scrolled,     setScrolled]     = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [searchVal,    setSearchVal]    = useState("");

  const mobileInput   = useRef(null);
  const searchAreaRef = useRef(null); // wraps search icon + input row

  // Scroll shadow
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Auto-focus mobile search input when opened
  useEffect(() => {
    if (mobileSearch) mobileInput.current?.focus();
  }, [mobileSearch]);

  // Close mobile search on outside click
  useEffect(() => {
    if (!mobileSearch) return;
    const fn = (e) => {
      if (searchAreaRef.current && !searchAreaRef.current.contains(e.target)) {
        setMobileSearch(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [mobileSearch]);

  // Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleChange = (val) => {
    setSearchVal(val);
    onSearch?.(val);
  };

  return (
    <>
      {/* ── Navbar bar ─────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-ink-100"
          : "bg-white border-b border-ink-100"
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <span className="w-9 h-9 rounded-full bg-saffron-500 flex items-center justify-center text-white font-display font-bold text-base shadow-sm group-hover:scale-110 transition-transform">
              श
            </span>
          </Link>

          {/* Site name */}
          <span className="flex-1 font-display text-base sm:text-lg font-bold text-ink-900 leading-none truncate">
            Shasnadesh.com
          </span>

          {/* Desktop search — no X button */}
          <div className="hidden sm:flex items-center relative w-48 lg:w-64 flex-shrink-0">
            <Search size={14} className="absolute left-3 text-ink-400 pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="खोजें..."
              className="w-full pl-8 pr-4 py-2 bg-ink-100 border border-transparent rounded-xl font-ui text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-white focus:border-saffron-300 focus:ring-2 focus:ring-saffron-100 transition-all"
            />
          </div>

          {/* Mobile: search icon — ref wraps both icon + input row for outside-click */}
          <div ref={searchAreaRef} className="sm:hidden flex-shrink-0">
            <button
              onClick={() => { setMobileSearch((o) => !o); setSidebarOpen(false); }}
              className="p-2 rounded-xl hover:bg-ink-100 text-ink-600 transition-colors"
              aria-label="Search"
            >
              <Search size={19} />
            </button>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => { setSidebarOpen(true); setMobileSearch(false); }}
            className="p-2 rounded-xl hover:bg-ink-100 text-ink-600 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Mobile search row — no X button, closes on outside click */}
        {mobileSearch && (
          <div className="sm:hidden px-4 pb-3 animate-fade-in" ref={searchAreaRef}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input
                ref={mobileInput}
                type="text"
                value={searchVal}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="खोजें... / Search..."
                className="w-full pl-9 pr-4 py-2.5 bg-ink-100 rounded-xl font-ui text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-saffron-100 transition-all"
              />
            </div>
          </div>
        )}
      </nav>

      {/* ── Right sidebar ──────────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col"
            style={{ animation: "slideInRight 0.25s ease forwards" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-saffron-500 flex items-center justify-center text-white font-display font-bold text-sm">
                  श
                </span>
                <span className="font-display text-base font-bold text-ink-900">Shasnadesh</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500 transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-3">
              {NAV_ITEMS.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 font-hindi text-sm text-ink-700 hover:bg-saffron-50 hover:text-saffron-700 border-b border-ink-50 last:border-0 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-saffron-400 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-ink-100 space-y-3">
              <Link
                to="/login"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-ink-100 hover:bg-saffron-50 text-ink-600 hover:text-saffron-700 font-ui text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Admin Login
              </Link>
              <p className="font-hindi text-xs text-ink-400 text-center">
                सत्यमेव जयते · Satyameva Jayate
              </p>
            </div>
          </aside>
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
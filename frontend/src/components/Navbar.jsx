import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getSearchSuggestions } from "../services/api";
import { Search, Menu, X, Home as HomeIcon, Landmark, BookOpen, Briefcase, Award, LayoutGrid, FileText, CalendarDays } from "lucide-react";

const NAV_ITEMS = [
  { label: "होम",                    to: "/",                          icon: HomeIcon },
  { label: "उत्तर प्रदेश शासनादेश", to: "/?category=up-government", icon: Landmark },
  { label: "शिक्षा विभाग",           to: "/?category=education",     icon: BookOpen },
  { label: "वैकेंसी",           to: "/?category=vacancy",       icon: Briefcase },
  { label: "अवकाश कैलेंडर",      to: "/?category=holiday-calendar", icon: CalendarDays },
  { label: "छात्रवृत्ति",            to: "/?category=scholarship",   icon: Award },
  { label: "प्रारूप",                to: "/?category=praroop",       icon: FileText },
  { label: "अन्य",                   to: "/?category=other",         icon: LayoutGrid },
];

export default function Navbar({ onSearch }) {
  const [scrolled,     setScrolled]     = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [searchVal,    setSearchVal]    = useState("");
  const [suggestions,  setSuggestions]  = useState([]);
  const [showSuggest,  setShowSuggest]  = useState(false);

  const mobileInput   = useRef(null);
  const searchAreaRef = useRef(null); // wraps search icon + input row
  const desktopSearchRef = useRef(null);

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

  useEffect(() => {
    const q = searchVal.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await getSearchSuggestions(q, 8);
        setSuggestions(data || []);
        setShowSuggest(true);
      } catch {
        setSuggestions([]);
        setShowSuggest(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchVal]);

  useEffect(() => {
    const fn = (e) => {
      const inDesktop = desktopSearchRef.current?.contains(e.target);
      const inMobile = searchAreaRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) setShowSuggest(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleChange = (val) => {
    setSearchVal(val);
    onSearch?.(val);
  };

  const applySuggestion = (title) => {
    setSearchVal(title);
    onSearch?.(title);
    setShowSuggest(false);
  };

  return (
    <>
      {/* ── Navbar bar ─────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-ink-100"
          : "bg-white border-b border-ink-100"
      }`}>
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-3 transition-all duration-300 ${
          scrolled ? "h-12 sm:h-14" : "h-12 sm:h-16"
        }`}>

          {/* Hamburger */}
          <button
            onClick={() => { setSidebarOpen(true); setMobileSearch(false); }}
            className="p-2 -ml-2 rounded-xl hover:bg-ink-100 text-ink-600 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <img
              src={`${process.env.PUBLIC_URL}/logo192.png`}
              alt="Shasnadesh"
              className="w-9 h-9 rounded-full shadow-sm group-hover:scale-110 transition-transform"
              loading="eager"
            />

          </Link>

          {/* Site name */}
          <Link to="/" className="flex-1 font-display text-base sm:text-lg font-bold text-ink-900 leading-none truncate hover:text-saffron-600 transition-colors">
            Shasnadeshupdates.com
          </Link>

          {/* Desktop search — no X button */}
          <div ref={desktopSearchRef} className="hidden sm:flex items-center relative w-80 lg:w-96 flex-shrink-0">
            <Search size={14} className="absolute left-3 text-ink-400 pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              placeholder="खोजें..."
              className="w-full pl-8 pr-4 py-2 bg-ink-100 border border-transparent rounded-xl font-ui text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-white focus:border-saffron-300 focus:ring-2 focus:ring-saffron-100 transition-all"
            />
            {showSuggest && suggestions.length > 0 && searchVal.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-ink-100 rounded-xl shadow-lg overflow-hidden z-50">
                {suggestions.map((s) => (
                  <button
                    key={s._id || s.slug || s.title}
                    type="button"
                    onClick={() => applySuggestion(s.title)}
                    className="w-full text-left px-3 py-2 text-sm text-ink-800 hover:bg-ink-50 flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{s.title}</span>
                    {s.category && (
                      <span className="text-[11px] text-ink-500 bg-ink-100 rounded-full px-2 py-0.5 flex-shrink-0">
                        {s.category}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
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
                onFocus={() => setShowSuggest(true)}
                placeholder="खोजें... / Search..."
                className="w-full pl-9 pr-4 py-2.5 bg-ink-100 rounded-xl font-ui text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-saffron-100 transition-all"
              />
              {showSuggest && suggestions.length > 0 && searchVal.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-ink-100 rounded-xl shadow-lg overflow-hidden z-50">
                  {suggestions.map((s) => (
                    <button
                      key={s._id || s.slug || s.title}
                      type="button"
                      onClick={() => applySuggestion(s.title)}
                      className="w-full text-left px-3 py-2 text-sm text-ink-800 hover:bg-ink-50 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{s.title}</span>
                      {s.category && (
                        <span className="text-[11px] text-ink-500 bg-ink-100 rounded-full px-2 py-0.5 flex-shrink-0">
                          {s.category}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Left sidebar ──────────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col"
            style={{ animation: "slideInLeft 0.25s ease forwards" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-saffron-500 flex items-center justify-center text-white font-display font-bold text-sm">
                  श
                </span>
                <span className="font-display text-base font-bold text-ink-900">Shasnadeshupdates.com</span>
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
              {NAV_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-5 py-3.5 font-hindi text-sm text-ink-700 hover:bg-ink-100 hover:text-black border-b border-ink-50 last:border-0 transition-colors"
                  >
                    <Icon size={18} className="text-saffron-500 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Play Store App Download Box */}
              <div className="px-5 mt-3 mb-2">
                <div className="relative border border-ink-100 rounded-xl p-3 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* Decorative background shapes */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-saffron-50 rounded-full translate-x-1/3 -translate-y-1/3 opacity-80" />
                  <div className="absolute bottom-0 right-8 w-10 h-10 bg-orange-50 rounded-full translate-y-1/2 opacity-60" />

                  <div className="relative z-10">
                    {/* Rating & Tagline */}
                    <div className="flex items-center gap-1 text-[11px] text-ink-600 mb-1.5">
                      <span className="text-saffron-500 font-bold">★</span>
                      <span className="font-bold text-ink-800">4.8</span>
                      <span className="text-ink-300">|</span>
                      <span>🏆 UP's #1 Updates App!</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-bold text-base text-ink-900 mb-1">
                      Shasnadeshupdates.com App
                    </h3>

                    {/* Subtitle */}
                    <p className="text-[11px] text-ink-600 mb-2.5 max-w-[68%]">
                      सभी शासनादेश और अपडेट्स सबसे पहले अपने फोन पर पाएं
                    </p>

                    {/* Button */}
                    <a
                      href="https://play.google.com/store/apps/details?id=com.shasnadeshupdates"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-saffron-600 font-bold text-xs hover:text-saffron-700 transition-colors"
                    >
                      Download Now
                      <span className="bg-saffron-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] leading-none">
                        ❯
                      </span>
                    </a>
                  </div>

                  {/* Phone Mockup Illustration */}
                  <div className="absolute -right-2 -bottom-4 w-20 h-24 bg-ink-900 rounded-[10px] border-[2px] border-ink-800 shadow-lg rotate-[-12deg] z-0 opacity-90">
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-7 h-1.5 bg-ink-950 rounded-full" />
                    <div className="absolute inset-[2px] mt-3.5 bg-white rounded-[6px] overflow-hidden flex flex-col p-1">
                      <div className="w-full h-6 bg-saffron-100  mb-1 rounded-sm" />
                      <div className="w-full h-3 bg-ink-100  mb-1 rounded-sm" />
                      <div className="w-2/3 h-3 bg-ink-100   rounded-sm" />
                    </div>
                  </div>
                </div>
              </div>
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
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [searchVal,    setSearchVal]    = useState("");

  const dropdownRef  = useRef(null);
  const mobileInput  = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (mobileSearch) mobileInput.current?.focus();
  }, [mobileSearch]);

  const handleChange = (val) => {
    setSearchVal(val);
    onSearch?.(val);
  };

  const clearSearch = () => {
    setSearchVal("");
    onSearch?.("");
    setMobileSearch(false);
  };

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-ink-100" : "bg-white border-b border-ink-100"
    }`}>

      {/* ── Main bar ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">

        {/* Logo — tapping opens dropdown, NO chevron */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen((o) => !o); setMobileSearch(false); }}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            className="group focus:outline-none"
          >
            <span className="w-9 h-9 rounded-full bg-saffron-500 flex items-center justify-center text-white font-display font-bold text-base shadow-sm group-hover:scale-110 transition-transform">
              श
            </span>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-ink-100 py-2 z-50 animate-fade-in">
              {NAV_ITEMS.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.to}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 font-hindi text-sm text-ink-700 hover:bg-saffron-50 hover:text-saffron-700 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-saffron-400 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Site name — grows to fill space, pushes search to the right */}
        <span className="flex-1 font-display text-base sm:text-lg font-bold text-ink-900 leading-none truncate">
          Shasnadesh.com
        </span>

        {/* ── Desktop search — fixed small width, right side ── */}
        <div className="hidden sm:flex items-center relative w-48 lg:w-64 flex-shrink-0">
          <Search size={14} className="absolute left-3 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="खोजें..."
            className="w-full pl-8 pr-8 py-2 bg-ink-100 border border-transparent rounded-xl font-ui text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-white focus:border-saffron-300 focus:ring-2 focus:ring-saffron-100 transition-all"
          />
          {searchVal && (
            <button onClick={clearSearch} className="absolute right-2.5 text-ink-400 hover:text-ink-700">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Mobile search icon — right side */}
        <button
          onClick={() => { setMobileSearch((o) => !o); setDropdownOpen(false); }}
          className="sm:hidden p-2 rounded-xl hover:bg-ink-100 text-ink-600 transition-colors flex-shrink-0"
          aria-label="Search"
        >
          {mobileSearch ? <X size={19} /> : <Search size={19} />}
        </button>
      </div>

      {/* Mobile search row */}
      {mobileSearch && (
        <div className="sm:hidden px-4 pb-3 animate-fade-in">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
            <input
              ref={mobileInput}
              type="text"
              value={searchVal}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="खोजें... / Search..."
              className="w-full pl-9 pr-9 py-2.5 bg-ink-100 rounded-xl font-ui text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-saffron-100 transition-all"
            />
            {searchVal && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
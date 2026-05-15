import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);



  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-ink-50/95 backdrop-blur-md shadow-sm border-b border-ink-100" : "bg-transparent"
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-8 h-8 rounded-full bg-saffron-500 flex items-center justify-center text-white text-sm font-display font-bold shadow-sm group-hover:scale-110 transition-transform">
            श
          </span>
          <span className="font-display text-xl font-bold text-ink-900">Shasnadesh.Com</span>
        </Link>

        {/* Desktop nav */}
        {/* <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="font-ui text-sm text-ink-600 hover:text-ink-900 transition-colors">Home</Link>
          <Link to="/login" className="btn-primary text-sm py-2">Admin</Link>
        </div> */}

        {/* Mobile menu button */}
        {/* <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-ink-100 transition-colors">
          <div className="w-5 space-y-1.5">
            <span className={`block h-0.5 bg-ink-700 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 bg-ink-700 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 bg-ink-700 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button> */}
      </div>

      {/* Mobile menu */}
      {/* {menuOpen && (
        <div className="md:hidden bg-ink-50 border-b border-ink-100 px-4 py-4 space-y-3 animate-fade-in">
          <Link to="/login" className="btn-primary w-full justify-center mt-2">Admin Login</Link>
        </div>
      )} */}
    </nav>
  );
}

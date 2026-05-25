import { useState, useEffect } from "react";
import { getCategories } from "../services/api";

export default function SearchFilter({
  onSearch,
  onCategory,
  initialCategory = "All",
  hideSearch = false,
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [categories, setCategories] = useState(["All"]);

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(["All", ...data]))
      .catch(() => setCategories(["All", "hindi", "english", "news", "culture", "technology", "lifestyle", "opinion"]));
  }, []);

  const handleSearch = (e) => { setSearch(e.target.value); onSearch?.(e.target.value); };
  const handleCategory = (cat) => { setActiveCategory(cat); onCategory?.(cat === "All" ? "" : cat); };

  return (
    <div className="space-y-3">

      {/* Search — only when not owned by Navbar */}
      {!hideSearch && (
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">🔍</span>
          <input
            type="text"
            placeholder="Search blogs... / ब्लॉग खोजें..."
            value={search}
            onChange={handleSearch}
            className="input pl-11 text-base"
          />
        </div>
      )}

      {/* Category pills — horizontal scroll on mobile, wrap on desktop */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 w-max sm:w-auto sm:flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-ui font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                activeCategory === cat
                  ? "bg-saffron-500 text-white shadow-sm"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              {cat === "hindi" ? "हिंदी" : cat === "english" ? "English" : cat === "All" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
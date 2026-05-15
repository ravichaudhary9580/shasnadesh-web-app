import { useState, useEffect } from "react";

const CATEGORIES = ["All", "hindi", "english", "news", "culture", "technology", "lifestyle"];
const SORT_OPTIONS = [
  { label: "Latest", value: "-createdAt" },
  { label: "Oldest", value: "createdAt" },
  { label: "Most Viewed", value: "-views" },
];

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = ["All"];
  for (let year = currentYear; year >= 2020; year--) {
    years.push(year.toString());
  }
  return years;
}

export default function SearchFilter({ onSearch, onCategory, onSort, onYear, initialCategory = "All" }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sort, setSort] = useState("-createdAt");
  const [year, setYear] = useState("All");
  const [yearOptions] = useState(getYearOptions());

  const handleSearch = (e) => {
    setSearch(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    onCategory?.(cat === "All" ? "" : cat);
  };

  const handleSort = (val) => {
    setSort(val);
    onSort?.(val);
  };

  const handleYear = (val) => {
    setYear(val);
    onYear?.(val === "All" ? "" : val);
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 text-lg">🔍</span>
        <input
          type="text"
          placeholder="Search blogs... / ब्लॉग खोजें..."
          value={search}
          onChange={handleSearch}
          className="input pl-11 text-base"
        />
      </div>

      {/* Categories + Sort + Year */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-ui font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-saffron-500 text-white shadow-sm"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              {cat === "hindi" ? "हिंदी" : cat === "All" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Year + Sort */}
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => handleYear(e.target.value)}
            className="input w-auto py-1.5 text-sm cursor-pointer"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y === "All" ? "All Years" : y}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="input w-auto py-1.5 text-sm cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

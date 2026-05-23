import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BlogCard from "../components/BlogCard";
import SearchFilter from "../components/SearchFilter";
import { getBlogs } from "../services/api";
import { Newspaper } from "lucide-react";

const SORT_OPTIONS = [
  { label: "Latest",      value: "-createdAt" },
  { label: "Oldest",      value: "createdAt"  },
  { label: "Most Viewed", value: "-views"     },
];

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = ["All"];
  for (let y = currentYear; y >= 2020; y--) years.push(y.toString());
  return years;
}

const YEAR_OPTIONS = getYearOptions();

export default function Home() {
  const [blogs,   setBlogs]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchParams]        = useSearchParams();

  const [filters, setFilters] = useState({
    search:   searchParams.get("search")   || "",
    category: searchParams.get("category") || "",
    sort:     "-createdAt",
    year:     "",
  });

  const fetchBlogs = useCallback(async (f, p) => {
    setLoading(true);
    try {
      const { data } = await getBlogs({ ...f, page: p, limit: 12 });
      setBlogs(data.blogs);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlogs(filters, page); }, [filters, page, fetchBlogs]);

  const updateFilter = (key, val) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const featured = blogs[0];
  const rest     = blogs.slice(1);

  return (
    <div className="min-h-screen bg-white">

      <Navbar onSearch={(v) => updateFilter("search", v)} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-20">

        {/* Category pills only */}
        <div className="py-4 border-b border-ink-100 mb-6">
          <SearchFilter
            hideSearch
            onCategory={(v) => updateFilter("category", v)}
            initialCategory={filters.category || "All"}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-ink-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-ink-100 rounded w-3/4" />
                  <div className="h-3 bg-ink-100 rounded w-full" />
                  <div className="h-3 bg-ink-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-6 bg-ink-100 rounded-full flex items-center justify-center">
              <Newspaper className="w-10 h-10 text-ink-400" />
            </div>
            <p className="font-hindi text-2xl text-ink-600 mb-2">कोई आदेश नहीं मिला</p>
            <p className="font-body text-ink-400 text-sm">No orders found</p>
          </div>
        ) : (
          <>
            {/* Featured — centered */}
            {featured && !filters.search && (
              <div className="mb-10 animate-fade-in flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 mb-4 w-full">
                  <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-saffron-400" />
                  <p className="font-hindi text-sm font-medium text-saffron-600 whitespace-nowrap">फीचर्ड आदेश</p>
                  <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-saffron-400" />
                </div>
                <div className="w-full max-w-2xl">
                  <BlogCard blog={featured} featured />
                </div>
              </div>
            )}

            {/* ── Result count row + year & sort dropdowns ── */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <p className="font-hindi text-sm text-ink-500 flex-shrink-0">
                {total} आदेश मिले
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={filters.year || "All"}
                  onChange={(e) => updateFilter("year", e.target.value === "All" ? "" : e.target.value)}
                  className="input w-auto py-1.5 text-sm cursor-pointer"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y === "All" ? "All Years" : y}</option>
                  ))}
                </select>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="input w-auto py-1.5 text-sm cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Blog grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filters.search ? blogs : rest).map((blog, i) => (
                <div
                  key={blog._id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <BlogCard blog={blog} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost disabled:opacity-40"
                >
                  ← Prev
                </button>
                {[...Array(pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-lg font-ui text-sm font-medium transition-all ${
                      page === i + 1
                        ? "bg-saffron-500 text-white"
                        : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="btn-ghost disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="font-hindi text-ink-400 text-sm">सत्यमेव जयते · Satyameva Jayate</p>
              <p className="font-ui text-xs text-ink-300 mt-1">© 2025 Shasnadesh</p>
            </div>
            <a
              href="/login"
              className="font-ui text-xs text-ink-400 hover:text-saffron-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
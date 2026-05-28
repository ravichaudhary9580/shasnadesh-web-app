import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BlogCard from "../components/BlogCard";
import SearchFilter from "../components/SearchFilter";
import FeaturedSlideshow from "../components/FeaturedSlideshow";
import SEO from "../components/SEO";
import { getBlogs } from "../services/api";
import { Newspaper } from "lucide-react";
import { generateWebsiteSchema, generateOrganizationSchema, injectSchema } from "../utils/schemaUtils";

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
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const lastPageBeforeSearch = useRef(1);

  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page")) || 1;
    return p > 0 ? p : 1;
  });

  const [filters, setFilters] = useState({
    search:   searchParams.get("search")   || "",
    category: searchParams.get("category") || "",
    sort:     searchParams.get("sort")     || "-createdAt",
    year:     searchParams.get("year")     || "",
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

  const fetchFeaturedBlogs = useCallback(async () => {
    try {
      const { data } = await getBlogs({ featured: 'true', limit: 10 });
      setFeaturedBlogs(data.blogs);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchBlogs(filters, page); }, [filters, page, fetchBlogs]);

  useEffect(() => { fetchFeaturedBlogs(); }, [fetchFeaturedBlogs]);

  // Inject structured data
  useEffect(() => {
    const cleanup1 = injectSchema(generateWebsiteSchema());
    const cleanup2 = injectSchema(generateOrganizationSchema());
    return () => { cleanup1(); cleanup2(); };
  }, []);

  // Sync page and filters with URL params when they change (e.g., logo click)
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page")) || 1;
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category") || "";
    const urlSort = searchParams.get("sort") || "-createdAt";
    const urlYear = searchParams.get("year") || "";

    if (urlPage !== page) setPage(urlPage);
    if (urlSearch !== filters.search || urlCategory !== filters.category || 
        urlSort !== filters.sort || urlYear !== filters.year) {
      setFilters({
        search: urlSearch,
        category: urlCategory,
        sort: urlSort,
        year: urlYear,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    const currentParams = searchParams.toString();
    
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.sort !== "-createdAt") params.set("sort", filters.sort);
    if (filters.year) params.set("year", filters.year);
    if (page > 1) params.set("page", page);
    
    // Only update if params actually changed to avoid loops
    if (params.toString() !== currentParams) {
      setSearchParams(params, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const updateFilter = (key, val) => {
    if (key === "search") {
      if (val && !filters.search) {
        // Starting a search - save current page
        lastPageBeforeSearch.current = page;
        setPage(1);
      } else if (!val && filters.search) {
        // Clearing search - restore previous page
        setPage(lastPageBeforeSearch.current);
      }
      setFilters((prev) => ({ ...prev, [key]: val }));
    } else if (filters[key] !== val) {
      // Other filter changed - reset to page 1
      setPage(1);
      setFilters((prev) => ({ ...prev, [key]: val }));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Shasnadesh Updates - सरकारी आदेश और अपडेट | Government Orders & Schemes"
        description="भारत सरकार के नवीनतम आदेश, योजनाएं और अपडेट। Latest government orders, schemes and updates in Hindi and English. Sarkari Yojana, Government Schemes."
        keywords="सरकारी आदेश, शासनादेश, government orders, sarkari yojana, govt schemes, india updates, सरकारी योजना, government updates, भारत सरकार"
        url="https://shasnadeshupdates.com"
      />

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
            {/* Featured Slideshow */}
            {!filters.search && !filters.category && featuredBlogs.length > 0 && (
              <FeaturedSlideshow blogs={featuredBlogs} />
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
              {blogs.map((blog, i) => (
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
              <div className="mt-12 space-y-4">
                <div className="flex justify-center items-center gap-1 flex-wrap">
                  {/* Prev */}
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1.5 rounded-lg font-ui text-xs font-medium bg-ink-100 text-ink-600 hover:bg-ink-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ←
                  </button>

                  {/* Page numbers with ellipsis */}
                  {(() => {
                    const buttons = [];
                    const delta = 1; // pages around current
                    const range = [];

                    for (let i = 1; i <= pages; i++) {
                      if (
                        i === 1 ||
                        i === pages ||
                        (i >= page - delta && i <= page + delta)
                      ) {
                        range.push(i);
                      }
                    }

                    let prev = null;
                    range.forEach((i) => {
                      if (prev && i - prev > 1) {
                        buttons.push(
                          <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center font-ui text-xs text-ink-400">
                            …
                          </span>
                        );
                      }
                      buttons.push(
                        <button
                          key={i}
                          onClick={() => setPage(i)}
                          className={`w-7 h-7 rounded-lg font-ui text-xs font-medium transition-all ${
                            page === i
                              ? "bg-saffron-500 text-white shadow-sm"
                              : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                          }`}
                        >
                          {i}
                        </button>
                      );
                      prev = i;
                    });

                    return buttons;
                  })()}

                  {/* Next */}
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="px-2 py-1.5 rounded-lg font-ui text-xs font-medium bg-ink-100 text-ink-600 hover:bg-ink-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    →
                  </button>
                </div>

                {/* Go to page input */}
                <div className="flex justify-center items-center gap-2">
                  <label htmlFor="goto-page" className="font-ui text-xs text-ink-500">
                    Go to page:
                  </label>
                  <input
                    id="goto-page"
                    type="number"
                    min="1"
                    max={pages}
                    placeholder={page}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(e.target.value);
                        if (val >= 1 && val <= pages) {
                          setPage(val);
                          e.target.value = '';
                        }
                      }
                    }}
                    className="w-14 px-2 py-1 text-xs text-center border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent"
                  />
                  <span className="font-ui text-xs text-ink-400">of {pages}</span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-1">
              <p className="font-hindi text-ink-400 text-sm">सत्यमेव जयते · Satyameva Jayate</p>
              <p className="font-ui text-xs text-ink-300">© 2025 Shasnadeshupdates.com</p>
              <p className="font-ui text-xs text-ink-300">
                Designed by{" "}
                <a 
                  href="https://bharatwebservices.live/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-saffron-500 font-medium hover:text-saffron-600 transition-colors"
                >
                  dev
                </a>
                .
                <a 
                  href="https://ravichaudhary9580.github.io/Portfolio-New/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-saffron-500 font-medium hover:text-saffron-600 transition-colors"
                >
                  ravi
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
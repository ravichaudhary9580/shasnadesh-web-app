import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import BlogCard from "../components/BlogCard";
import SearchFilter from "../components/SearchFilter";
import FeaturedSlideshow from "../components/FeaturedSlideshow";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { getBlogs, getYears, getCategories } from "../services/api";
import { Newspaper, LayoutGrid, List, Table2, SlidersHorizontal, RotateCcw, Share2 } from "lucide-react";
import { shareBlog } from "../utils/shareUtils";
import { generateWebsiteSchema, generateOrganizationSchema, injectSchema } from "../utils/schemaUtils";

const SORT_OPTIONS = [
  { label: "Latest", value: "-createdAt" },
  { label: "Oldest", value: "createdAt" },
  { label: "Most Viewed", value: "-views" },
];

const MENU_ORDER = [
  "उत्तर प्रदेश शासनादेश",
  "वैकेंसी अलर्ट",
  "स्टूडेंट कॉर्नर",
  "शिक्षा विभाग",
  "अवकाश कैलेंडर",
  "छात्रवृत्ति",
  "प्रारूप",
  "अन्य",
];

export default function Home() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [allCategories, setAllCategories] = useState(MENU_ORDER);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [yearOptions, setYearOptions] = useState(["All"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const lastPageBeforeSearch = useRef(1);

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("shasnadesh_view_mode") || "card";
  });

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page")) || 1;
    return p > 0 ? p : 1;
  });

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    sort: searchParams.get("sort") || "-createdAt",
    year: searchParams.get("year") || "",
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("shasnadesh_view_mode", mode);
  };

  const handleSharePost = async (e, blog) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const nativeShared = await shareBlog(blog, window.location.origin);
      if (!nativeShared) {
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        toast.success("Link copied to clipboard!");
      }
    }
  };

  const handleShareCategory = async (e, category) => {
    e.preventDefault();
    e.stopPropagation();
    const categoryUrl = `${window.location.origin}/?category=${encodeURIComponent(category)}`;
    const shareData = {
      title: `${category} - शासनादेश व ताज़ा अपडेट्स | Shasnadesh Updates`,
      text: `${category} के सभी नवीनतम शासनादेश और अपडेट्स यहाँ देखें:`,
      url: categoryUrl,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(categoryUrl);
        toast.success(`"${category}" लिंक कॉपी हो गया!`);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        await navigator.clipboard.writeText(categoryUrl);
        toast.success(`"${category}" लिंक कॉपी हो गया!`);
      }
    }
  };

  // Group blogs by category for Table View - always shows ALL categories when "All" is active
  const categoryGroups = useMemo(() => {
    if (filters.category) {
      return [
        {
          category: filters.category,
          blogs: blogs.filter((b) => b.category === filters.category || !b.category),
        },
      ];
    }

    const groups = {};
    allCategories.forEach((cat) => {
      groups[cat] = [];
    });

    blogs.forEach((blog) => {
      const cat = blog.category || "अन्य";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(blog);
    });

    return allCategories.map((cat) => ({
      category: cat,
      blogs: groups[cat] || [],
    }));
  }, [blogs, allCategories, filters.category]);

  // Fetch all unique categories from API
  useEffect(() => {
    getCategories()
      .then(({ data }) => {
        const sorted = Array.from(new Set([...MENU_ORDER, ...data]));
        setAllCategories(sorted);
      })
      .catch(() => setAllCategories(MENU_ORDER));
  }, []);

  // Close filter popover on outside click or Escape key
  useEffect(() => {
    if (!filterOpen) return;
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterOpen]);

  const fetchBlogs = useCallback(async (f, p, vm) => {
    setLoading(true);
    try {
      const limit = vm === "table" ? 100 : 12;
      const { data } = await getBlogs({ ...f, page: p, limit });
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

  useEffect(() => { fetchBlogs(filters, page, viewMode); }, [filters, page, viewMode, fetchBlogs]);

  useEffect(() => { fetchFeaturedBlogs(); }, [fetchFeaturedBlogs]);

  useEffect(() => {
    getYears()
      .then(({ data }) => setYearOptions(["All", ...data]))
      .catch(() => setYearOptions(["All", new Date().getFullYear().toString()]));
  }, []);

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
          viewMode === "card" ? (
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
          ) : viewMode === "list" ? (
            <div className="flex flex-col gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-2.5 sm:p-3 flex gap-3 sm:gap-4 animate-pulse items-center">
                  <div className="w-28 sm:w-44 md:w-48 lg:w-52 aspect-video bg-ink-100 rounded-lg sm:rounded-xl flex-shrink-0 self-center" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-3.5 bg-ink-100 rounded w-1/4" />
                    <div className="h-4.5 bg-ink-100 rounded w-4/5" />
                    <div className="h-3 bg-ink-100 rounded w-1/3 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : filters.category ? (
            <div className="max-w-4xl mx-auto card overflow-hidden border border-ink-200/80 animate-pulse">
              <div className="bg-ink-200 h-12 w-full" />
              <div className="overflow-x-auto">
                <table className="w-full text-left font-ui text-sm">
                  <thead className="hidden sm:table-header-group bg-ink-100/75 border-b border-ink-200 text-ink-700 text-xs font-semibold">
                    <tr>
                      <th className="hidden sm:table-cell py-3 px-3.5 w-12 text-center">#</th>
                      <th className="py-3 px-4 min-w-[200px] sm:min-w-[300px]">Title</th>
                      <th className="hidden sm:table-cell py-3 px-4 w-36">Posted</th>
                      <th className="hidden sm:table-cell py-3 px-4 w-24 text-center">Views</th>
                      <th className="hidden sm:table-cell py-3 px-4 w-20 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {[...Array(8)].map((_, i) => (
                      <tr key={i}>
                        <td className="hidden sm:table-cell py-3 px-3.5 text-center"><div className="h-4 w-4 bg-ink-100 rounded mx-auto" /></td>
                        <td className="py-3 px-4"><div className="h-4 bg-ink-100 rounded w-4/5" /></td>
                        <td className="hidden sm:table-cell py-3 px-4"><div className="h-4 w-24 bg-ink-100 rounded" /></td>
                        <td className="hidden sm:table-cell py-3 px-4 text-center"><div className="h-4 w-10 bg-ink-100 rounded mx-auto" /></td>
                        <td className="hidden sm:table-cell py-3 px-4 text-center"><div className="h-7 w-14 bg-ink-100 rounded-lg mx-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card overflow-hidden border border-ink-200/80">
                  <div className="bg-ink-200 h-10 w-full" />
                  <div className="p-3.5 space-y-3">
                    <div className="h-4 bg-ink-100 rounded w-full" />
                    <div className="h-4 bg-ink-100 rounded w-5/6" />
                    <div className="h-4 bg-ink-100 rounded w-4/5" />
                    <div className="h-4 bg-ink-100 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )
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

            {/* ── Result count row + view mode toggle & year & sort dropdowns ── */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <p className="font-hindi text-sm text-ink-500 flex-shrink-0">
                {total} आदेश मिले
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Toggle: Card vs List vs Table */}
                <div className="flex items-center bg-ink-100 p-0.5 rounded-lg border border-ink-200/80" role="group" aria-label="View mode">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange("card")}
                    className={`p-1.5 rounded-md transition-all flex items-center justify-center ${viewMode === "card"
                        ? "bg-white text-saffron-600 shadow-sm font-semibold"
                        : "text-ink-500 hover:text-ink-800"
                      }`}
                    title="कार्ड दृश्य (Card View)"
                    aria-label="Card view"
                    aria-pressed={viewMode === "card"}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange("list")}
                    className={`p-1.5 rounded-md transition-all flex items-center justify-center ${viewMode === "list"
                        ? "bg-white text-saffron-600 shadow-sm font-semibold"
                        : "text-ink-500 hover:text-ink-800"
                      }`}
                    title="सूची दृश्य (List View)"
                    aria-label="List view"
                    aria-pressed={viewMode === "list"}
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange("table")}
                    className={`p-1.5 rounded-md transition-all flex items-center justify-center ${viewMode === "table"
                        ? "bg-white text-saffron-600 shadow-sm font-semibold"
                        : "text-ink-500 hover:text-ink-800"
                      }`}
                    title="तालिका दृश्य (Table View)"
                    aria-label="Table view"
                    aria-pressed={viewMode === "table"}
                  >
                    <Table2 size={16} />
                  </button>
                </div>

                {/* Filter Popover Button */}
                <div className="relative" ref={filterRef}>
                  {(() => {
                    const hasActiveFilters = Boolean(filters.year || (filters.sort && filters.sort !== "-createdAt"));
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setFilterOpen((o) => !o)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-ui text-sm font-medium transition-all ${filterOpen || hasActiveFilters
                              ? "bg-saffron-50 text-saffron-700 border-saffron-300 shadow-sm"
                              : "bg-ink-100 hover:bg-ink-200/80 text-ink-700 border-ink-200/70"
                            }`}
                          title="फ़िल्टर व क्रमबद्ध (Filter & Sort)"
                          aria-label="Filter and sort"
                          aria-expanded={filterOpen}
                        >
                          <SlidersHorizontal size={15} className={hasActiveFilters ? "text-saffron-600" : "text-ink-600"} />
                          <span>Filter</span>
                          {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
                          )}
                        </button>

                        {/* Filter Dropdown Popover */}
                        {filterOpen && (
                          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-ink-200 rounded-2xl shadow-xl p-4 z-40 animate-fade-in space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between pb-2.5 border-b border-ink-100">
                              <div className="flex items-center gap-1.5">
                                <SlidersHorizontal size={15} className="text-saffron-600" />
                                <span className="font-ui font-bold text-sm text-ink-900">Filter & Sort</span>
                              </div>
                              {hasActiveFilters && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateFilter("year", "");
                                    updateFilter("sort", "-createdAt");
                                  }}
                                  className="text-xs font-ui font-medium text-saffron-600 hover:text-saffron-700 hover:underline flex items-center gap-1"
                                >
                                  <RotateCcw size={12} />
                                  Reset
                                </button>
                              )}
                            </div>

                            {/* Year Filter */}
                            <div>
                              <label className="block font-ui text-xs font-semibold text-ink-700 mb-1.5">
                                Year / वर्ष
                              </label>
                              <select
                                value={filters.year || "All"}
                                onChange={(e) => updateFilter("year", e.target.value === "All" ? "" : e.target.value)}
                                className="input w-full py-2 text-sm cursor-pointer"
                                aria-label="Filter by year"
                              >
                                {yearOptions.map((y) => (
                                  <option key={y} value={y}>{y === "All" ? "All Years (सभी वर्ष)" : y}</option>
                                ))}
                              </select>
                            </div>

                            {/* Sort Options */}
                            <div>
                              <label className="block font-ui text-xs font-semibold text-ink-700 mb-1.5">
                                Sort by / क्रमबद्ध करें
                              </label>
                              <select
                                value={filters.sort}
                                onChange={(e) => updateFilter("sort", e.target.value)}
                                className="input w-full py-2 text-sm cursor-pointer"
                                aria-label="Sort articles"
                              >
                                {SORT_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Close / Apply button */}
                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setFilterOpen(false)}
                                className="btn-primary py-1.5 px-4 text-xs font-semibold rounded-lg"
                              >
                                Done / ठीक है
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Blog list / grid / table based on viewMode */}
            {viewMode === "card" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog, i) => (
                  <div
                    key={blog._id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <BlogCard blog={blog} viewMode="card" />
                  </div>
                ))}
              </div>
            ) : viewMode === "list" ? (
              <div className="flex flex-col gap-3">
                {blogs.map((blog, i) => (
                  <div
                    key={blog._id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <BlogCard blog={blog} viewMode="list" />
                  </div>
                ))}
              </div>
            ) : filters.category ? (
              <div className="max-w-4xl mx-auto card overflow-hidden border border-ink-200/90 shadow-sm animate-fade-in">
                {/* Category Table Header Banner */}
                <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 px-4 sm:px-6 py-3 text-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-hindi font-bold text-base sm:text-lg tracking-wide">
                      {filters.category}
                    </h2>
                    <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-ui">
                      {total} आदेश
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleShareCategory(e, filters.category)}
                    className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors flex items-center justify-center min-w-[32px] min-h-[32px]"
                    title={`${filters.category} शेयर करें`}
                    aria-label={`Share ${filters.category}`}
                  >
                    <Share2 size={15} />
                  </button>
                </div>

                {/* Detailed Table (up to 100 titles with Posted day ago, views, action on desktop; only title with bullet on mobile) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-ui text-sm">
                    <thead className="hidden sm:table-header-group bg-ink-100/85 border-b border-ink-200 text-ink-700 text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="hidden sm:table-cell py-3 px-3.5 w-12 text-center">#</th>
                        <th className="py-3 px-4 min-w-[200px] sm:min-w-[300px]">शासनादेश / शीर्षक (Title)</th>
                        <th className="hidden sm:table-cell py-3 px-4 w-36 whitespace-nowrap">अपलोड (Posted)</th>
                        <th className="hidden sm:table-cell py-3 px-4 w-24 text-center whitespace-nowrap">Views</th>
                        <th className="hidden sm:table-cell py-3 px-4 w-20 text-center whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100 bg-white">
                      {blogs.map((blog, idx) => {
                        const serialNum = (page - 1) * 100 + idx + 1;
                        const timeAgo = formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true });
                        return (
                          <tr
                            key={blog._id}
                            className="hover:bg-saffron-50/40 transition-colors group cursor-pointer"
                            onClick={() => navigate(`/blog/${blog.slug}`)}
                          >
                            <td className="hidden sm:table-cell py-3 px-3.5 text-center text-xs text-ink-400 font-mono">
                              {serialNum}
                            </td>
                            <td className="py-2.5 sm:py-3 px-3.5 sm:px-4">
                              <Link
                                to={`/blog/${blog.slug}`}
                                className="blog-card-title font-display font-medium text-ink-900 text-sm sm:text-base hover:text-saffron-600 transition-colors flex items-start gap-2 leading-snug sm:leading-relaxed"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="text-saffron-500 font-bold mt-0.5 text-sm select-none flex-shrink-0 sm:hidden">›</span>
                                <span className="flex-1">{blog.title}</span>
                              </Link>
                            </td>
                            <td className="hidden sm:table-cell py-3 px-4 text-xs sm:text-sm text-ink-500 whitespace-nowrap">
                              {timeAgo}
                            </td>
                            <td className="hidden sm:table-cell py-3 px-4 text-xs sm:text-sm text-ink-600 text-center font-mono whitespace-nowrap">
                              {blog.views ? blog.views.toLocaleString() : 0}
                            </td>
                            <td className="hidden sm:table-cell py-3 px-4 text-center">
                              <button
                                onClick={(e) => handleSharePost(e, blog)}
                                className="p-1.5 rounded-lg hover:bg-saffron-50 hover:text-saffron-600 text-ink-500 transition-colors inline-flex items-center justify-center"
                                title="Share"
                                aria-label="Share post"
                              >
                                <Share2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in items-start">
                {categoryGroups.map(({ category, blogs: catBlogs }) => (
                  <div
                    key={category}
                    className="card overflow-hidden border border-ink-200/90 shadow-sm flex flex-col hover:border-saffron-300 transition-colors"
                  >
                    {/* Category Box Header with Share Button */}
                    <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 px-4 py-2.5 text-white flex items-center justify-between shadow-sm">
                      <h3 className="font-hindi font-bold text-base sm:text-lg tracking-wide flex items-center gap-1.5 line-clamp-1">
                        <span>{category}</span>
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => handleShareCategory(e, category)}
                        className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors flex items-center justify-center min-w-[28px] min-h-[28px] flex-shrink-0 ml-2"
                        title={`${category} शेयर करें`}
                        aria-label={`Share ${category}`}
                      >
                        <Share2 size={15} />
                      </button>
                    </div>

                    {/* Category Titles List (Max 12 titles) */}
                    <ul className="divide-y divide-ink-100 flex-1 bg-white">
                      {catBlogs.length > 0 ? (
                        catBlogs.slice(0, 12).map((blog) => (
                          <li key={blog._id}>
                            <Link
                              to={`/blog/${blog.slug}`}
                              className="blog-card-title group px-3.5 py-2.5 font-display font-medium text-ink-900 text-[14.5px] sm:text-[15.5px] hover:text-saffron-600 hover:bg-saffron-50/50 transition-colors flex items-start gap-2 leading-snug sm:leading-relaxed"
                            >
                              <span className="text-saffron-500 font-bold mt-0.5 text-sm select-none flex-shrink-0">›</span>
                              <span className="flex-1 line-clamp-2">{blog.title}</span>
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li className="px-3.5 py-6 text-center text-sm text-ink-400 font-hindi">
                          कोई आदेश उपलब्ध नहीं है
                        </li>
                      )}
                    </ul>

                    {/* View More Button at Bottom of Category Box */}
                    <div className="p-2 bg-ink-50/80 border-t border-ink-100 text-center">
                      <button
                        type="button"
                        onClick={() => updateFilter("category", category)}
                        className="w-full py-1.5 px-3 rounded-lg text-xs sm:text-sm font-ui font-semibold text-saffron-600 hover:text-saffron-700 hover:bg-saffron-50 transition-colors flex items-center justify-center gap-1"
                        title={`${category} के सभी आदेश देखें`}
                      >
                        <span>और देखें (View More)</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                          className={`w-7 h-7 rounded-lg font-ui text-xs font-medium transition-all ${page === i
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

      <Footer />
    </div>
  );
}
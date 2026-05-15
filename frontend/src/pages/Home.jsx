import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BlogCard from "../components/BlogCard";
import SearchFilter from "../components/SearchFilter";
import { getBlogs } from "../services/api";
import { Newspaper, TrendingUp, Globe2, Users } from "lucide-react";

export default function Home() {
  const [blogs, setBlogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: "",
    category: searchParams.get("category") || "",
    sort: "-createdAt",
    year: "",
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

  useEffect(() => {
    fetchBlogs(filters, page);
  }, [filters, page, fetchBlogs]);

  const updateFilter = (key, val) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const featured = blogs[0];
  const rest = blogs.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e8920a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-saffron-50 border border-saffron-200 rounded-full mb-6 animate-fade-in">
              <Newspaper className="w-4 h-4 text-saffron-600" />
              <span className="font-hindi text-saffron-700 text-sm font-medium">शासनादेश • सरकारी आदेश पोर्टल</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up">
              <span className="bg-gradient-to-r from-saffron-600 to-crimson-600 bg-clip-text text-transparent">
                सरकारी आदेश
              </span>
              <br />
              <span className="text-ink-900">एक जगह</span>
            </h1>

            <p className="font-hindi text-xl md:text-2xl text-ink-600 mb-8 leading-relaxed animate-slide-up animate-delay-100">
              सभी सरकारी आदेश, नियम और अधिसूचनाएं हिंदी और अंग्रेजी में
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in animate-delay-200">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-ink-100">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Newspaper className="w-5 h-5 text-saffron-600" />
                  <p className="font-display text-2xl font-bold text-ink-900">{total}</p>
                </div>
                <p className="font-hindi text-sm text-ink-500">आदेश</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-ink-100">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <p className="font-display text-2xl font-bold text-ink-900">100%</p>
                </div>
                <p className="font-hindi text-sm text-ink-500">निशुल्क</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-ink-100">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Globe2 className="w-5 h-5 text-blue-600" />
                  <p className="font-display text-2xl font-bold text-ink-900">2</p>
                </div>
                <p className="font-hindi text-sm text-ink-500">भाषाएं</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-ink-100">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <p className="font-display text-2xl font-bold text-ink-900">24/7</p>
                </div>
                <p className="font-hindi text-sm text-ink-500">उपलब्ध</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {/* Search & Filter */}
        <div className="py-8 border-b border-ink-100 mb-8">
          <SearchFilter
            onSearch={(v) => updateFilter("search", v)}
            onCategory={(v) => updateFilter("category", v)}
            onSort={(v) => updateFilter("sort", v)}
            onYear={(v) => updateFilter("year", v)}
            initialCategory={filters.category || "All"}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            {/* Featured blog */}
            {featured && !filters.search && (
              <div className="mb-12 animate-fade-in">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-saffron-400" />
                  <p className="font-hindi text-sm font-medium text-saffron-600">फीचर्ड आदेश</p>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-saffron-400" />
                </div>
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl">
                    <BlogCard blog={featured} featured />
                  </div>
                </div>
              </div>
            )}

            {/* Result count */}
            <div className="flex items-center justify-between mb-6">
              <p className="font-hindi text-sm text-ink-500">
                {total} आदेश मिले
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filters.search ? blogs : rest).map((blog, i) => (
                <div key={blog._id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <BlogCard blog={blog} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-ghost disabled:opacity-40">← Prev</button>
                {[...Array(pages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-lg font-ui text-sm font-medium transition-all ${
                      page === i + 1 ? "bg-saffron-500 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                    }`}>{i + 1}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                  className="btn-ghost disabled:opacity-40">Next →</button>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

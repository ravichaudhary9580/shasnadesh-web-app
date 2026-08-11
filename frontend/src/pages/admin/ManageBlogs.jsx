import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminGetBlogs, deleteBlog, toggleStatus, toggleFeatured, getCategories, requestInstantIndexing } from "../../services/api";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const CATEGORIES = ["उत्तर प्रदेश शासनादेश", "शिक्षा विभाग", "अवकाश कैलेंडर", "वैकेंसी अलर्ट", "स्टूडेंट कॉर्नर", "छात्रवृत्ति", "प्रारूप", "अन्य"];

export default function ManageBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState(CATEGORIES);
  const [actionLoading, setActionLoading] = useState(null);
  const lastPageBeforeSearch = useRef(1);
  const limit = 15;

  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page")) || 1;
    return p > 0 ? p : 1;
  });

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");

  const fetchBlogs = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const { data } = await adminGetBlogs({ search, status: statusFilter, category: categoryFilter, page, limit });
      setBlogs(data.blogs);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, page]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data))
      .catch(() => setCategories(CATEGORIES));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (page > 1) params.set("page", page);
    setSearchParams(params, { replace: true });
  }, [search, statusFilter, categoryFilter, page, setSearchParams]);

  const handleDelete = async (e, id, title) => {
    e.preventDefault();
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActionLoading(`delete-${id}`);
    try {
      await deleteBlog(id);
      toast.success("Post deleted");
      setBlogs((prev) => prev.filter((b) => b._id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      toast.error("Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggle = async (e, id) => {
    e.preventDefault();
    setActionLoading(`toggle-${id}`);
    try {
      const { data } = await toggleStatus(id);
      toast.success(`Blog ${data.status === "published" ? "published" : "unpublished"}`);
      setBlogs((prev) => prev.map((b) => (b._id === id ? { ...b, status: data.status } : b)));
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (e, id) => {
    e.preventDefault();
    setActionLoading(`featured-${id}`);
    try {
      const { data } = await toggleFeatured(id);
      toast.success(data.featured ? "Marked as featured" : "Removed from featured");
      setBlogs((prev) => prev.map((b) => (b._id === id ? { ...b, featured: data.featured } : b)));
    } catch {
      toast.error("Failed to update featured status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleInstantIndex = async (e, blogId) => {
    e.preventDefault();
    setActionLoading(`index-${blogId}`);
    try {
      toast.loading("Sending Instant Indexing request...", { id: "indexing" });
      const { data } = await requestInstantIndexing({ blogId });
      toast.success(data.message || "Indexing request sent to Google & IndexNow!", { id: "indexing" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Indexing request failed", { id: "indexing" });
    } finally {
      setActionLoading(null);
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    // ── FIX: w-full + max-w-full replaces max-w-5xl which pushed content offscreen
    <div className="w-full max-w-full space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-900">Manage Posts</h1>
          <p className="font-ui text-sm text-ink-400 mt-0.5">{total} total posts</p>
        </div>
        <Link to="/admin/blogs/new" className="btn-primary text-sm">+ New Post</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Search — takes remaining width */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              if (val && !search) {
                // Starting a search - save current page
                lastPageBeforeSearch.current = page;
              } else if (!val && search) {
                // Clearing search - restore previous page
                setPage(lastPageBeforeSearch.current);
                setSearch(val);
                return;
              }
              setSearch(val);
              setPage(1);
            }}
            className="input pl-9 text-sm w-full"
          />
        </div>
        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input text-sm w-full sm:w-36 flex-shrink-0"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "hindi" ? "हिंदी" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input text-sm w-full sm:w-36 flex-shrink-0"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Blog list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-ink-100">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3 p-4 animate-pulse">
                <div className="w-12 h-12 bg-ink-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-ink-100 rounded w-3/4" />
                  <div className="h-3 bg-ink-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-ui text-ink-400 text-sm">No posts found</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {blogs.map((blog) => (
              <div key={blog._id} className="p-3 sm:p-4 hover:bg-ink-50 transition-colors">

                {/* Top row: thumbnail + info */}
                <div className="flex items-start gap-3 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
                    {blog.thumbnail ? (
                      <img src={blog.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-300 font-display text-lg">श</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-sm font-semibold text-ink-900 truncate leading-snug">
                      {blog.title}
                    </p>
                    {/* Badges row — wraps naturally */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className={`badge text-xs ${blog.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-ink-100 text-ink-500"
                        }`}>
                        {blog.status}
                      </span>
                      {blog.featured && (
                        <span className="badge bg-yellow-100 text-yellow-700 text-xs">
                          ⭐ Featured
                        </span>
                      )}
                      {blog.category && (
                        <span className="badge bg-saffron-100 text-saffron-700 text-xs">
                          {blog.category}
                        </span>
                      )}
                      <span className="font-ui text-xs text-ink-400">
                        {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                      </span>
                      <span className="font-ui text-xs text-ink-400">· 👁 {blog.views}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons — always on their own row, right-aligned */}
                {/* ── FIX: moved actions to a separate full-width row so they never
                          get pushed offscreen or cause overflow on narrow phones */}
                <div className="flex items-center gap-1.5 mt-2.5 justify-end flex-wrap">
                  <button
                    type="button"
                    disabled={actionLoading === `featured-${blog._id}`}
                    onClick={(e) => handleToggleFeatured(e, blog._id)}
                    className={`px-3 py-1.5 rounded-lg font-ui text-xs font-medium transition-all min-w-[100px] flex justify-center items-center ${blog.featured
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                      } disabled:opacity-50`}
                  >
                    {actionLoading === `featured-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : blog.featured ? "⭐ Featured" : "Mark Featured"}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === `toggle-${blog._id}`}
                    onClick={(e) => handleToggle(e, blog._id)}
                    className={`px-3 py-1.5 rounded-lg font-ui text-xs font-medium transition-all min-w-[80px] flex justify-center items-center ${blog.status === "published"
                        ? "bg-ink-100 text-ink-600 hover:bg-ink-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                      } disabled:opacity-50`}
                  >
                    {actionLoading === `toggle-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : blog.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === `index-${blog._id}`}
                    onClick={(e) => handleInstantIndex(e, blog._id)}
                    className="px-3 py-1.5 rounded-lg font-ui text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex items-center justify-center gap-1 min-w-[110px] disabled:opacity-50"
                    title="Send Instant Indexing request to Google & IndexNow"
                  >
                    {actionLoading === `index-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "⚡ Instant Index"}
                  </button>
                  <Link
                    to={`/admin/blogs/edit/${blog._id}`}
                    className="px-3 py-1.5 rounded-lg font-ui text-xs font-medium bg-ink-100 text-ink-600 hover:bg-ink-200 transition-all flex justify-center items-center"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={actionLoading === `delete-${blog._id}`}
                    onClick={(e) => handleDelete(e, blog._id, blog.title)}
                    className="px-3 py-1.5 rounded-lg font-ui text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all flex justify-center items-center min-w-[65px] disabled:opacity-50"
                  >
                    {actionLoading === `delete-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-8 space-y-4">
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
              const delta = 1;
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
    </div>
  );
}
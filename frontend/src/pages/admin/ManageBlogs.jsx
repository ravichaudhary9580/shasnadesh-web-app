import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminGetBlogs, deleteBlog, toggleStatus, toggleFeatured, getCategories, requestInstantIndexing } from "../../services/api";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { Loader2, Eye } from "lucide-react";
import { getImageUrl } from "../../utils/imageUtils";

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
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              if (val && !search) {
                lastPageBeforeSearch.current = page;
              } else if (!val && search) {
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
              <div key={i} className="flex items-center sm:items-start gap-3 p-3 sm:p-4 animate-pulse">
                <div className="w-20 sm:w-28 md:w-32 aspect-video bg-ink-100 rounded-lg sm:rounded-xl flex-shrink-0" />
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
              <div key={blog._id} className="p-3 sm:p-4 hover:bg-ink-50/70 transition-colors">
                {/* Top Section: Left (Thumbnail + Delete) & Right (Title + Badges) */}
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                  {/* Left Column: 16:9 Thumbnail + Delete button right under it */}
                  <div className="w-24 sm:w-32 md:w-36 flex-shrink-0 flex flex-col gap-1.5">
                    <div className="w-full aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
                      {blog.thumbnail ? (
                        <img
                          src={getImageUrl(blog.thumbnail)}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-300 font-display text-base sm:text-lg">श</div>
                      )}
                    </div>

                    {/* Delete button under thumbnail */}
                    <button
                      type="button"
                      disabled={actionLoading === `delete-${blog._id}`}
                      onClick={(e) => handleDelete(e, blog._id, blog.title)}
                      className="w-full py-1 px-1.5 rounded-lg font-ui text-[11px] sm:text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all flex justify-center items-center disabled:opacity-50"
                    >
                      {actionLoading === `delete-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
                    </button>
                  </div>

                  {/* Right Column: Title + Badges + Desktop Action Buttons */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-2">
                    <div>
                      <p className="font-ui text-xs sm:text-sm md:text-base font-semibold text-ink-900 line-clamp-2 leading-snug">
                        {blog.title}
                      </p>
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1 sm:mt-1.5">
                        <span className={`badge text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded ${blog.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-ink-100 text-ink-500"
                          }`}>
                          {blog.status}
                        </span>
                        <span className="badge bg-saffron-50 text-saffron-700 border border-saffron-200/60 text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded">
                          {blog.category}
                        </span>
                        <span className="font-ui text-[11px] sm:text-xs text-ink-400">
                          {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                        </span>
                        <span className="font-ui text-[11px] sm:text-xs text-ink-400">· 👁 {blog.views || 0}</span>
                      </div>
                    </div>

                    {/* Desktop Action Buttons: Placed inside right column to fill space */}
                    <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 flex-wrap pt-0.5">
                      <button
                        type="button"
                        disabled={actionLoading === `featured-${blog._id}`}
                        onClick={(e) => handleToggleFeatured(e, blog._id)}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-ui text-xs font-medium transition-all flex justify-center items-center flex-shrink-0 whitespace-nowrap ${blog.featured
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                          } disabled:opacity-50`}
                      >
                        {actionLoading === `featured-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : blog.featured ? "⭐ Featured" : "Mark Featured"}
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading === `index-${blog._id}`}
                        onClick={(e) => handleInstantIndex(e, blog._id)}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-ui text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex items-center justify-center gap-1 flex-shrink-0 disabled:opacity-50 whitespace-nowrap"
                        title="Send Instant Indexing request to Google & IndexNow"
                      >
                        {actionLoading === `index-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "⚡ Instant Index"}
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading === `toggle-${blog._id}`}
                        onClick={(e) => handleToggle(e, blog._id)}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-ui text-xs font-medium transition-all flex justify-center items-center flex-shrink-0 whitespace-nowrap ${blog.status === "published"
                            ? "bg-ink-100 text-ink-600 hover:bg-ink-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                          } disabled:opacity-50`}
                      >
                        {actionLoading === `toggle-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : blog.status === "published" ? "Unpublish" : "Publish"}
                      </button>

                      <a
                        href={`/blog/${blog.slug || blog._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-ui text-xs font-medium bg-saffron-50 text-saffron-700 hover:bg-saffron-100 transition-all flex items-center justify-center gap-1 flex-shrink-0"
                        title="View published blog on website"
                      >
                        <Eye size={13} /> View
                      </a>

                      <Link
                        to={`/admin/blogs/edit/${blog._id}`}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-ui text-xs font-medium bg-ink-100 text-ink-600 hover:bg-ink-200 transition-all flex justify-center items-center flex-shrink-0"
                      >
                        Edit Post
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Mobile Section: Action buttons in ONE horizontal line */}
                <div className="flex sm:hidden items-center gap-1.5 mt-2 pt-2 border-t border-ink-100/70 overflow-x-auto no-scrollbar flex-nowrap">
                  <a
                    href={`/blog/${blog.slug || blog._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg font-ui text-[11px] font-medium bg-saffron-50 text-saffron-700 hover:bg-saffron-100 transition-all flex items-center justify-center gap-1 flex-shrink-0 whitespace-nowrap"
                    title="View published blog on website"
                  >
                    <Eye size={12} /> View
                  </a>

                  <button
                    type="button"
                    disabled={actionLoading === `featured-${blog._id}`}
                    onClick={(e) => handleToggleFeatured(e, blog._id)}
                    className={`px-2.5 py-1 rounded-lg font-ui text-[11px] font-medium transition-all flex justify-center items-center flex-shrink-0 whitespace-nowrap ${blog.featured
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                      } disabled:opacity-50`}
                  >
                    {actionLoading === `featured-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : blog.featured ? "⭐ Featured" : "Mark Featured"}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading === `index-${blog._id}`}
                    onClick={(e) => handleInstantIndex(e, blog._id)}
                    className="px-2.5 py-1 rounded-lg font-ui text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex items-center justify-center gap-1 flex-shrink-0 disabled:opacity-50 whitespace-nowrap"
                    title="Send Instant Indexing request to Google & IndexNow"
                  >
                    {actionLoading === `index-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "⚡ Instant Index"}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading === `toggle-${blog._id}`}
                    onClick={(e) => handleToggle(e, blog._id)}
                    className={`px-2.5 py-1 rounded-lg font-ui text-[11px] font-medium transition-all flex justify-center items-center flex-shrink-0 whitespace-nowrap ${blog.status === "published"
                        ? "bg-ink-100 text-ink-600 hover:bg-ink-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                      } disabled:opacity-50`}
                  >
                    {actionLoading === `toggle-${blog._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : blog.status === "published" ? "Unpublish" : "Publish"}
                  </button>

                  <Link
                    to={`/admin/blogs/edit/${blog._id}`}
                    className="px-2.5 py-1 rounded-lg font-ui text-[11px] font-medium bg-ink-100 text-ink-600 hover:bg-ink-200 transition-all flex justify-center items-center flex-shrink-0 whitespace-nowrap"
                  >
                    Edit Post
                  </Link>
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
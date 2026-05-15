import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { adminGetBlogs, deleteBlog, toggleStatus } from "../../services/api";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

export default function ManageBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminGetBlogs({ search, status: statusFilter, page, limit });
      setBlogs(data.blogs);
      setTotal(data.total);
    } catch { toast.error("Failed to load blogs"); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteBlog(id);
      toast.success("Blog deleted");
      fetchBlogs();
    } catch { toast.error("Delete failed"); }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await toggleStatus(id);
      toast.success(`Blog ${data.status === "published" ? "published" : "unpublished"}`);
      fetchBlogs();
    } catch { toast.error("Failed to update status"); }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl space-y-4 sm:space-y-5 animate-fade-in px-2 sm:px-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Manage Blogs</h1>
          <p className="font-ui text-sm text-ink-400 mt-0.5">{total} total posts</p>
        </div>
        <Link to="/admin/blogs/new" className="btn-primary">+ New Blog</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">🔍</span>
          <input type="text" placeholder="Search..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9 text-sm w-full" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input text-sm w-full sm:w-auto">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-ink-100">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-ink-100 rounded w-2/3" />
                  <div className="h-3 bg-ink-100 rounded w-1/3" />
                </div>
                <div className="h-8 w-20 bg-ink-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-3xl sm:text-4xl mb-3">📭</p>
            <p className="font-ui text-ink-400">No blogs found</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {blogs.map((blog) => (
              <div key={blog._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 hover:bg-ink-50 transition-colors">
                {/* Thumbnail & Info */}
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
                    {blog.thumbnail ? (
                      <img src={blog.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-300 font-display text-base sm:text-lg">श</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-sm font-semibold text-ink-900 truncate">{blog.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                      <span className={`badge text-xs ${
                        blog.status === "published" ? "bg-green-100 text-green-700" : "bg-ink-100 text-ink-500"
                      }`}>
                        {blog.status}
                      </span>
                      {blog.category && <span className="badge bg-saffron-100 text-saffron-700 text-xs">{blog.category}</span>}
                      <span className="font-ui text-xs text-ink-400">
                        {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
                      </span>
                      <span className="font-ui text-xs text-ink-400">· 👁 {blog.views}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0 justify-end sm:justify-start">
                  <button onClick={() => handleToggle(blog._id)}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-ui text-xs font-medium transition-all ${
                      blog.status === "published"
                        ? "bg-ink-100 text-ink-600 hover:bg-ink-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}>
                    {blog.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <Link to={`/admin/blogs/edit/${blog._id}`}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-ui text-xs font-medium bg-ink-100 text-ink-600 hover:bg-ink-200 transition-all">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(blog._id, blog.title)}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg font-ui text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost disabled:opacity-40 text-sm">← Prev</button>
          <span className="font-ui text-sm text-ink-500 self-center">Page {page} of {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-ghost disabled:opacity-40 text-sm">Next →</button>
        </div>
      )}
    </div>
  );
}

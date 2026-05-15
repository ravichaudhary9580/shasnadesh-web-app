import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOverview, getPopular } from "../../services/api";
import {
  Eye,
  FileText,
  CheckCircle2,
  BarChart2,
  PenSquare,
  BookOpen,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color }) {
  const styles = {
    saffron: {
      bg: "bg-saffron-50",
      icon: "text-saffron-600",
      border: "border-saffron-100",
      ring: "ring-saffron-100",
    },
    crimson: {
      bg: "bg-red-50",
      icon: "text-red-500",
      border: "border-red-100",
      ring: "ring-red-100",
    },
    green: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      border: "border-emerald-100",
      ring: "ring-emerald-100",
    },
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      border: "border-blue-100",
      ring: "ring-blue-100",
    },
  };
  const s = styles[color] || styles.saffron;

  return (
    <div className="card p-4 sm:p-6 flex items-start gap-3 sm:gap-4 group hover:shadow-lg transition-all duration-300">
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border ${s.bg} ${s.border} ${s.icon} group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div>
        <p className="font-ui text-xs sm:text-sm text-ink-400">{label}</p>
        <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5 tabular-nums">
          {value?.toLocaleString() ?? "—"}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getPopular()])
      .then(([ov, pop]) => {
        setOverview(ov.data);
        setPopular(pop.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    {
      to: "/admin/blogs/new",
      icon: PenSquare,
      label: "Write Blog",
      desc: "Create new post",
      color: "text-saffron-600",
      bg: "bg-saffron-50 group-hover:bg-saffron-100",
    },
    {
      to: "/admin/blogs",
      icon: BookOpen,
      label: "Manage Blogs",
      desc: "Edit, delete, publish",
      color: "text-blue-600",
      bg: "bg-blue-50 group-hover:bg-blue-100",
    },
    {
      to: "/admin/analytics",
      icon: TrendingUp,
      label: "Analytics",
      desc: "Traffic & device stats",
      color: "text-emerald-600",
      bg: "bg-emerald-50 group-hover:bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl animate-fade-in px-2 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Dashboard</h1>
          <p className="font-ui text-sm text-ink-400 mt-0.5">Overview of your blog</p>
        </div>
        <Link to="/admin/blogs/new" className="btn-primary">
          <PenSquare size={16} strokeWidth={2} />
          New Blog
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 sm:p-6 h-24 sm:h-28 animate-pulse bg-ink-50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={Eye} label="Total Visits" value={overview?.totalVisits} color="blue" />
          <StatCard icon={FileText} label="Total Blogs" value={overview?.totalBlogs} color="saffron" />
          <StatCard icon={CheckCircle2} label="Published" value={overview?.published} color="green" />
          <StatCard icon={BarChart2} label="Total Views" value={overview?.totalViews} color="crimson" />
        </div>
      )}

      {/* Popular posts */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-saffron-500" />
          Most Viewed Posts
        </h2>
        {popular.length === 0 ? (
          <p className="font-ui text-sm text-ink-400">No data yet</p>
        ) : (
          <div className="space-y-3">
            {popular.map((blog, i) => (
              <div key={blog._id} className="flex items-center gap-3 group">
                <span className="w-7 h-7 rounded-xl bg-ink-100 text-ink-500 font-ui text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-sm font-medium text-ink-800 truncate group-hover:text-saffron-600 transition-colors">
                    {blog.title}
                  </p>
                  <p className="font-ui text-xs text-ink-400">/blog/{blog.slug}</p>
                </div>
                <span className="font-ui text-sm font-semibold text-saffron-600 whitespace-nowrap flex items-center gap-1.5">
                  <Eye size={13} />
                  {blog.views.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {quickActions.map(({ to, icon: Icon, label, desc, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="card p-4 sm:p-5 hover:border-saffron-200 transition-all duration-200 group"
          >
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors ${bg}`}
            >
              <Icon size={18} className={color} strokeWidth={1.8} />
            </div>
            <p className="font-ui font-semibold text-ink-800 group-hover:text-saffron-600 transition-colors flex items-center gap-1 text-sm sm:text-base">
              {label}
              <ArrowRight
                size={12}
                className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
              />
            </p>
            <p className="font-ui text-xs text-ink-400 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
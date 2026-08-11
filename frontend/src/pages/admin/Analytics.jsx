import { useState, useEffect } from "react";
import { 
  getOverview, getPopular, getDeviceSplit, 
  getAllTimeVisits, getTopCategories, getTrafficSources 
} from "../../services/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const COLORS = ["#e8920a", "#c93333", "#2563eb", "#16a34a", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

function ChartCard({ title, children, loading, action }) {
  return (
    <div className="card p-4 sm:p-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4">
        <h3 className="font-display text-sm sm:text-base font-bold text-ink-900">{title}</h3>
        {action && <div className="w-full sm:w-auto overflow-hidden">{action}</div>}
      </div>
      <div className="flex-1 min-h-[220px]">
        {loading ? (
          <div className="h-full w-full bg-ink-50 rounded-xl animate-pulse" />
        ) : children}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [popular, setPopular] = useState([]);
  const [devices, setDevices] = useState([]);
  const [allTime, setAllTime] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  const [timeRange, setTimeRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loadingVisits, setLoadingVisits] = useState(true);

  useEffect(() => {
    Promise.all([
      getOverview(), 
      getPopular(), 
      getDeviceSplit(), 
      getTopCategories(),
      getTrafficSources()
    ])
      .then(([ov, pop, dev, catRes, srcRes]) => {
        setOverview(ov.data);
        setPopular(pop.data);
        setDevices(dev.data.map((d) => ({ name: d._id || "unknown", value: d.count })));
        setCategories(catRes.data.map((d) => ({ name: d._id || "Uncategorized", views: d.views })));
        setSources(srcRes.data.map((d) => ({ name: d._id || "Direct", visits: d.count })));
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchVisits = () => {
    setLoadingVisits(true);
    getAllTimeVisits(timeRange, customStart, customEnd)
      .then((res) => {
        setAllTime(res.data.map((d) => ({ date: d._id, visits: d.count })));
      })
      .finally(() => setLoadingVisits(false));
  };

  useEffect(() => {
    if (timeRange !== 'custom') {
      fetchVisits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const statItems = [
    { label: "Total Visits", value: overview?.totalVisits, icon: "👁" },
    { label: "Total Posts",  value: overview?.totalBlogs,  icon: "📝" },
    { label: "Published",    value: overview?.published,   icon: "✅" },
    { label: "Total Views",  value: overview?.totalViews,  icon: "📊" },
  ];

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-900">Analytics Dashboard</h1>
        <p className="font-ui text-sm text-ink-400 mt-0.5">Comprehensive all-time traffic and content performance</p>
      </div>

      {/* Stats — 2×2 on mobile, 4-in-a-row on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statItems.map((s) => (
          <div key={s.label} className="card p-3 sm:p-4 text-center min-w-0">
            <p className="text-xl sm:text-2xl mb-1">{s.icon}</p>
            <p className="font-display text-xl sm:text-2xl font-bold text-ink-900 tabular-nums">
              {loading ? "—" : (s.value ?? 0).toLocaleString()}
            </p>
            <p className="font-ui text-xs text-ink-400 mt-0.5 truncate">{s.label}</p>
          </div>
        ))}
      </div>

      {/* All-Time Visits - Full Width */}
      <div className="w-full">
        <ChartCard 
          title="Visits Growth" 
          loading={loadingVisits}
          action={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap justify-end">
              {timeRange === 'custom' && (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <input 
                    type="date" 
                    value={customStart} 
                    onChange={(e) => setCustomStart(e.target.value)} 
                    className="input py-1 px-2 text-xs bg-white w-full sm:w-auto flex-1" 
                  />
                  <span className="text-ink-400 text-xs hidden sm:inline">to</span>
                  <input 
                    type="date" 
                    value={customEnd} 
                    onChange={(e) => setCustomEnd(e.target.value)} 
                    className="input py-1 px-2 text-xs bg-white w-full sm:w-auto flex-1" 
                  />
                  <button 
                    onClick={fetchVisits}
                    disabled={!customStart || !customEnd}
                    className="btn btn-primary py-1 px-3 text-xs w-full sm:w-auto"
                  >
                    Apply
                  </button>
                </div>
              )}
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input py-1 text-sm bg-white w-full sm:w-auto"
              >
                <option value="30days">Last 30 Days</option>
                <option value="thisYear">This Year</option>
                <option value="lastYear">Last Year</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
          }
        >
          {allTime.length === 0 ? (
            <p className="font-ui text-sm text-ink-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={allTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e8920a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e8920a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontFamily: "'DM Sans'", fontSize: 11 }} 
                  stroke="#a89070" 
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    if (parts.length === 3) return parts[2]; // Show '01' from '2026-08-01'
                    if (parts.length === 2) {
                      const date = new Date(val + '-01');
                      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    }
                    return val;
                  }}
                />
                <YAxis tick={{ fontFamily: "'DM Sans'", fontSize: 11 }} stroke="#a89070" />
                <Tooltip contentStyle={{ fontFamily: "'DM Sans'", fontSize: 12, borderRadius: 8, border: "1px solid #e0d5c3" }} />
                <Area type="monotone" dataKey="visits" stroke="#e8920a" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Analytics Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Category Performance */}
        <ChartCard title="Top Categories by Views" loading={loading}>
          {categories.length === 0 ? (
            <p className="font-ui text-sm text-ink-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={2} dataKey="views"
                  label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                  labelLine={false}
                  style={{ fontFamily: "'DM Sans'", fontSize: 10 }}
                >
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "'DM Sans'", fontSize: 11, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Traffic Sources */}
        <ChartCard title="Traffic Sources (Referrers)" loading={loading}>
          {sources.length === 0 ? (
            <p className="font-ui text-sm text-ink-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sources} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c3" horizontal={false} />
                <XAxis type="number" tick={{ fontFamily: "'DM Sans'", fontSize: 10 }} stroke="#a89070" />
                <YAxis 
                  dataKey="name" type="category" width={90}
                  tick={{ fontFamily: "'DM Sans'", fontSize: 10, fill: "#574432" }}
                  tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + "…" : v}
                  stroke="#a89070" 
                />
                <Tooltip contentStyle={{ fontFamily: "'DM Sans'", fontSize: 11, borderRadius: 6 }} />
                <Bar dataKey="visits" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Device Split */}
        <ChartCard title="Device Split" loading={loading}>
          {devices.length === 0 ? (
            <p className="font-ui text-sm text-ink-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={devices}
                  cx="50%" cy="50%"
                  outerRadius={80}
                  paddingAngle={0} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ fontFamily: "'DM Sans'", fontSize: 11 }}
                >
                  <Cell fill="#16a34a" />
                  <Cell fill="#64748b" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "'DM Sans'", fontSize: 11, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Most Viewed Posts (Top 10) */}
      <div className="w-full mt-4">
        <ChartCard title="Top 10 Most Viewed Posts" loading={loading}>
          {popular.length === 0 ? (
            <p className="font-ui text-sm text-ink-400 text-center py-10">No data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-ink-100 font-ui text-xs text-ink-400 uppercase tracking-wider">
                    <th className="pb-3 pr-4 font-semibold">Post Title</th>
                    <th className="pb-3 px-4 font-semibold">Category</th>
                    <th className="pb-3 pl-4 font-semibold text-right">Total Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {popular.map((post, index) => (
                    <tr key={post._id} className="hover:bg-ink-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-ui text-sm font-bold text-ink-300 w-4">{index + 1}.</span>
                          <span className="font-body text-sm font-medium text-ink-900 truncate max-w-xs sm:max-w-md">
                            {post.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-saffron-100 text-saffron-800">
                          {post.category || "General"}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <span className="font-ui text-sm font-bold text-ink-900 tabular-nums">
                          {post.views.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
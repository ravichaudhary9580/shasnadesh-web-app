import { useState, useEffect } from "react";
import { getOverview, getPopular, getDeviceSplit, getDailyVisits } from "../../services/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const COLORS = ["#e8920a", "#c93333", "#2563eb", "#16a34a"];

function ChartCard({ title, children, loading }) {
  return (
    <div className="card p-6">
      <h3 className="font-display text-base font-bold text-ink-900 mb-4">{title}</h3>
      {loading ? (
        <div className="h-48 bg-ink-50 rounded-xl animate-pulse" />
      ) : children}
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [popular, setPopular] = useState([]);
  const [devices, setDevices] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getPopular(), getDeviceSplit(), getDailyVisits()])
      .then(([ov, pop, dev, day]) => {
        setOverview(ov.data);
        setPopular(pop.data);
        setDevices(dev.data.map((d) => ({ name: d._id || "unknown", value: d.count })));
        setDaily(day.data.map((d) => ({ date: d._id.slice(5), visits: d.count })));
      })
      .finally(() => setLoading(false));
  }, []);

  const statItems = [
    { label: "Total Visits", value: overview?.totalVisits, icon: "👁" },
    { label: "Total Blogs", value: overview?.totalBlogs, icon: "📝" },
    { label: "Published", value: overview?.published, icon: "✅" },
    { label: "Total Views", value: overview?.totalViews, icon: "📊" },
  ];

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Analytics</h1>
        <p className="font-ui text-sm text-ink-400 mt-0.5">Traffic and content performance</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="font-display text-2xl font-bold text-ink-900">
              {loading ? "—" : (s.value ?? 0).toLocaleString()}
            </p>
            <p className="font-ui text-xs text-ink-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily visits — takes 2 cols */}
        <div className="lg:col-span-2">
          <ChartCard title="Daily Visits (Last 30 Days)" loading={loading}>
            {daily.length === 0 ? (
              <p className="font-ui text-sm text-ink-400 text-center py-12">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c3" />
                  <XAxis dataKey="date" tick={{ fontFamily: "'DM Sans'", fontSize: 11 }} stroke="#a89070" />
                  <YAxis tick={{ fontFamily: "'DM Sans'", fontSize: 11 }} stroke="#a89070" />
                  <Tooltip contentStyle={{ fontFamily: "'DM Sans'", fontSize: 12, borderRadius: 8, border: "1px solid #e0d5c3" }} />
                  <Line type="monotone" dataKey="visits" stroke="#e8920a" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Device split */}
        <ChartCard title="Device Split" loading={loading}>
          {devices.length === 0 ? (
            <p className="font-ui text-sm text-ink-400 text-center py-12">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={devices} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} style={{ fontFamily: "'DM Sans'", fontSize: 12 }}>
                  {devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "'DM Sans'", fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Popular posts chart */}
      <ChartCard title="Most Viewed Posts" loading={loading}>
        {popular.length === 0 ? (
          <p className="font-ui text-sm text-ink-400 text-center py-12">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={popular} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c3" horizontal={false} />
              <XAxis type="number" tick={{ fontFamily: "'DM Sans'", fontSize: 11 }} stroke="#a89070" />
              <YAxis dataKey="title" type="category" width={180}
                tick={{ fontFamily: "'DM Sans'", fontSize: 11, fill: "#574432" }}
                tickFormatter={(v) => v.length > 25 ? v.slice(0, 25) + "…" : v}
                stroke="#a89070" />
              <Tooltip contentStyle={{ fontFamily: "'DM Sans'", fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="views" fill="#e8920a" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

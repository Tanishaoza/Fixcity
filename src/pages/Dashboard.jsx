import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Mail,
  Shield,
  FileText,
  MapPin,
  Tag,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  Plus,
  Eye,
  History,
  Loader2,
  InboxIcon,
  WifiOff,
  ArrowRight,
  Activity,
  UserCheck,
  BarChart3,
  Sparkles,
  RefreshCw,
} from "lucide-react";

// ─── Safe localStorage ────────────────────────────────────────────────────────
const getLocal = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const getLocalJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

// ─── Badge configs ────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  Pending: "bg-orange-100 text-orange-700 border border-orange-200",
  "In Review": "bg-violet-100 text-violet-700 border border-violet-200",
  Assigned: "bg-blue-100   text-blue-700   border border-blue-200",
  Resolved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};
const STATUS_DOT = {
  Pending: "bg-orange-400",
  "In Review": "bg-violet-400",
  Assigned: "bg-blue-400",
  Resolved: "bg-emerald-400",
};
const PRIORITY_BADGE = {
  Critical: "bg-red-100    text-red-700    border border-red-200",
  Moderate: "bg-amber-100  text-amber-700  border border-amber-200",
  Minor: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};
const SEVERITY_BAR = {
  High: "bg-gradient-to-r from-red-500    to-rose-400",
  Medium: "bg-gradient-to-r from-amber-500  to-yellow-400",
  Low: "bg-gradient-to-r from-emerald-500 to-green-400",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const THEMES = {
    blue: {
      wrap: "bg-white border border-blue-100    hover:border-blue-300    hover:shadow-blue-100",
      icon: "bg-gradient-to-br from-blue-500    to-blue-700    shadow-blue-200",
      bar: "from-blue-500    to-blue-400",
      label: "text-blue-400",
      value: "text-blue-700",
      pct: "text-blue-400",
      glow: "bg-blue-400/10",
    },
    orange: {
      wrap: "bg-white border border-orange-100  hover:border-orange-300  hover:shadow-orange-100",
      icon: "bg-gradient-to-br from-orange-500  to-orange-700  shadow-orange-200",
      bar: "from-orange-500  to-amber-400",
      label: "text-orange-400",
      value: "text-orange-600",
      pct: "text-orange-400",
      glow: "bg-orange-400/10",
    },
    violet: {
      wrap: "bg-white border border-violet-100  hover:border-violet-300  hover:shadow-violet-100",
      icon: "bg-gradient-to-br from-violet-500  to-purple-700  shadow-violet-200",
      bar: "from-violet-500  to-purple-400",
      label: "text-violet-400",
      value: "text-violet-700",
      pct: "text-violet-400",
      glow: "bg-violet-400/10",
    },
    cyan: {
      wrap: "bg-white border border-cyan-100    hover:border-cyan-300    hover:shadow-cyan-100",
      icon: "bg-gradient-to-br from-cyan-500    to-sky-700     shadow-cyan-200",
      bar: "from-cyan-500    to-sky-400",
      label: "text-cyan-500",
      value: "text-cyan-700",
      pct: "text-cyan-500",
      glow: "bg-cyan-400/10",
    },
    emerald: {
      wrap: "bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100",
      icon: "bg-gradient-to-br from-emerald-500 to-green-700   shadow-emerald-200",
      bar: "from-emerald-500 to-green-400",
      label: "text-emerald-500",
      value: "text-emerald-700",
      pct: "text-emerald-500",
      glow: "bg-emerald-400/10",
    },
  };
  const t = THEMES[accent] || THEMES.blue;
  return (
    <div
      className={`relative rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-default overflow-hidden ${t.wrap}`}
    >
      <div
        className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl ${t.glow}`}
      />
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${t.icon}`}
        >
          <Icon size={19} className="text-white" strokeWidth={2} />
        </div>
        {total > 0 && (
          <div className="flex flex-col items-end">
            <span className={`text-xs font-bold ${t.pct}`}>{pct}%</span>
            <span className="text-[10px] text-slate-400">of total</span>
          </div>
        )}
      </div>
      <div className="relative z-10 mb-1">
        <span
          className={`text-4xl font-black tracking-tight leading-none ${t.value}`}
        >
          {value}
        </span>
      </div>
      <p
        className={`relative z-10 text-[11px] font-bold uppercase tracking-widest mb-3 ${t.label}`}
      >
        {label}
      </p>
      <div className="relative z-10 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${t.bar}`}
          style={{ width: `${pct || (label === "Total Issues" ? 100 : 0)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0">
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-slate-400 text-xs">{label}: </span>
        <span className={`text-slate-700 text-xs font-medium ${valueClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
}



// ─── Main Dashboard ───────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["All", "Pending", "In Review", "Assigned", "Resolved"];
const PROGRESS_MAP = {
  Pending: 25,
  "In Review": 50,
  Assigned: 75,
  Resolved: 100,
};
function IssueTable({ issues }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Issue", "Location", "Priority", "Status", "Date", "Progress"].map(
                (head) => (
                  <th
                    key={head}
                    className="px-5 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest"
                  >
                    {head}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {issues.map((issue) => {
              const progress = PROGRESS_MAP[issue.status] || 0;

              return (
                <tr
                  key={issue._id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Issue */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-1 h-11 rounded-full ${
                          issue.priority === "Critical"
                            ? "bg-red-500"
                            : issue.priority === "Moderate"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 font-mono">
                          {issue.issueId || issue._id}
                        </p>
                        <p className="font-bold text-slate-800">
                          {issue.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {issue.category}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={14} className="text-blue-500" />
                      <span className="font-medium">
                        {issue.location || "Location unavailable"}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                        PRIORITY_BADGE[issue.priority] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          issue.priority === "Critical"
                            ? "bg-red-500"
                            : issue.priority === "Moderate"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      {issue.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                        STATUS_BADGE[issue.status] || ""
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          STATUS_DOT[issue.status] || "bg-slate-400"
                        }`}
                      />
                      {issue.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(issue.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </td>

                  {/* Progress */}
                  <td className="px-5 py-4 min-w-[170px]">
                    <div className="flex items-center gap-3">
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-blue-600">
                        {progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const historyRef = useRef(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  const userToken = getLocal("userToken");
  const user = getLocalJSON("user");

  useEffect(() => {
    if (!userToken || !user) navigate("/login", { replace: true });
  }, []);

  if (!userToken || !user) return null;

  // ── State ───────────────────────────────────────────────────────────────────
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ── Fetch user's issues ─────────────────────────────────────────────────────
  const fetchIssues = async () => {
    setLoading(true);
    setError(false);
    try {
      console.log("Logged in user:", user);
console.log("Email:", user.email);
      const res = await fetch(`https://fixcity-0wi0.onrender.com/history/${user.email}`, {
        headers: { Authorization: `Bearer ${userToken}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setIssues(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === "Pending").length,
    inReview: issues.filter((i) => i.status === "In Review").length,
    assigned: issues.filter((i) => i.status === "Assigned").length,
    resolved: issues.filter((i) => i.status === "Resolved").length,
  };

  // ── Filter + search ─────────────────────────────────────────────────────────
  const filtered = issues.filter((issue) => {
    const matchStatus = statusFilter === "All" || issue.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      [
        issue.issueId,
        issue._id,
        issue.title,
        issue.category,
        issue.location,
      ].some((f) => f?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "FixCity Member";

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #f8faff 50%, #f0f7f4 100%)",
      }}
    >
      {/* ── Page Header ── */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="w-full px-8 px-6 py-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard size={18} className="text-blue-600" />
              <h1 className="text-xl font-black text-slate-800">
                My Dashboard
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Track your reported civic issues and resolution progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Welcome, {user.name?.split(" ")[0]} 👋
            </div>
            <button
              type="button"
              onClick={fetchIssues}
              disabled={loading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-7">
        {/* ── Profile + Quick Actions row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Profile card */}
          <div className="md:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-200 mb-3">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-bold text-slate-800 text-base">
                {user.name}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">{user.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                <Shield size={9} /> Citizen
              </span>
            </div>
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FileText size={12} /> Total Reports
                </span>
                <span className="font-bold text-slate-700">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Resolved
                </span>
                <span className="font-bold text-emerald-600">
                  {stats.resolved}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar size={12} /> Member Since
                </span>
                <span className="font-bold text-slate-700">{memberSince}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={13} /> Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: Plus,
                  label: "Report New Issue",
                  sub: "Submit a new complaint",
                  color: "from-blue-500 to-blue-700",
                  shadow: "shadow-blue-200",
                  action: () => navigate("/report"),
                },
                {
                  icon: Eye,
                  label: "My Issues",
                  sub: "View all reported issues",
                  color: "from-violet-500 to-purple-700",
                  shadow: "shadow-violet-200",
                  action: () =>
                    historyRef.current?.scrollIntoView({
                      behavior: "smooth",
                    }),
                },
                {
                  icon: History,
                  label: "View History",
                  sub: "Scroll to your issues",
                  color: "from-emerald-500 to-green-700",
                  shadow: "shadow-emerald-200",
                  action: () =>
                    historyRef.current?.scrollIntoView({ behavior: "smooth" }),
                },
              ].map(({ icon: Icon, label, sub, color, shadow, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className={`flex flex-col items-start gap-3 p-4 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg ${shadow} hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 active:scale-95 text-left`}
                >
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{label}</p>
                    <p className="text-white/70 text-[11px] mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Motivational note */}
            <div className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Activity size={14} className="text-white" />
              </div>
              <div>
                <p className="text-blue-800 text-xs font-semibold">
                  Your reports make a difference
                </p>
                <p className="text-blue-500 text-[11px]">
                  {stats.resolved > 0
                    ? `${stats.resolved} of your issues have been resolved by the city.`
                    : "Start reporting civic issues to help improve your city."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <BarChart3 size={13} /> Your Issue Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                label: "Total Issues",
                value: stats.total,
                icon: LayoutDashboard,
                accent: "blue",
                total: 0,
              },
              {
                label: "Pending",
                value: stats.pending,
                icon: Clock,
                accent: "orange",
                total: stats.total,
              },
              {
                label: "In Review",
                value: stats.inReview,
                icon: Activity,
                accent: "violet",
                total: stats.total,
              },
              {
                label: "Assigned",
                value: stats.assigned,
                icon: UserCheck,
                accent: "cyan",
                total: stats.total,
              },
              {
                label: "Resolved",
                value: stats.resolved,
                icon: CheckCircle2,
                accent: "emerald",
                total: stats.total,
              },
            ].map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </div>

        {/* ── Issue History ── */}
        <div ref={historyRef}>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <History size={13} /> Issue History
          </h3>

          {/* Search & filter */}
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-4 mb-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Search size={15} />
                </div>
                <input
                  type="text"
                  placeholder="Search by ID, title, category or location…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Filter size={14} />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer min-w-[160px]"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === "All" ? "All Statuses" : s}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
                <FileText size={13} />
                {filtered.length} of {issues.length}
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700">Loading your issues…</p>
                <p className="text-slate-400 text-xs mt-1">
                  Fetching your submission history
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                <WifiOff size={24} className="text-red-400" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700">
                  Unable to load your issue history.
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Check your connection or try again.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchIssues}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                <RefreshCw size={13} /> Try Again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && issues.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <InboxIcon size={24} className="text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700">
                  No issues reported yet.
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Be the first to report a civic issue in your area.
                </p>
              </div>
              <Link
                to="/report"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                <Plus size={13} /> Report Your First Issue
              </Link>
            </div>
          )}

          {/* No search results */}
          {!loading && !error && issues.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Search size={20} className="text-slate-400" />
              </div>
              <p className="font-bold text-slate-700 text-sm">
                No matching issues found
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Issue table */}
{!loading && !error && filtered.length > 0 && (
  <IssueTable issues={filtered} />
)}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4 border-t border-slate-100">
          FixCity · Smart Civic Issue Reporting Platform · © 2024
        </div>
      </div>
    </div>
  );
}

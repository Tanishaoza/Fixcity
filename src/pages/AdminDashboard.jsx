import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import {
  LayoutDashboard, Clock, UserCheck, CheckCircle2,
  Search, Filter, RefreshCw, MapPin, Calendar,
  Shield, ChevronDown, Loader2, InboxIcon, Building2,
  TrendingUp, Activity, BarChart3, Layers, Flame,
  AlertTriangle, Wifi, WifiOff,
} from "lucide-react";

const API_BASE = "https://fixcity-0wi0.onrender.com";
const STATUS_OPTIONS = ["Active","All","Pending","In Review","Assigned","Resolved"];

const STATUS_CONFIG = {
  Pending:    { bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200",   dot:"bg-amber-400",   ring:"ring-amber-200"   },
  "In Review":{ bg:"bg-violet-50",  text:"text-violet-700",  border:"border-violet-200",  dot:"bg-violet-400",  ring:"ring-violet-200"  },
  Assigned:   { bg:"bg-sky-50",     text:"text-sky-700",     border:"border-sky-200",     dot:"bg-sky-400",     ring:"ring-sky-200"     },
  Resolved:   { bg:"bg-emerald-50", text:"text-emerald-700", border:"border-emerald-200", dot:"bg-emerald-400", ring:"ring-emerald-200" },
};

const PRIORITY_CONFIG = {
  Critical: { bg:"bg-red-50",     text:"text-red-700",     border:"border-red-200",     dot:"bg-red-500",     bar:"bg-red-500"     },
  Moderate: { bg:"bg-amber-50",   text:"text-amber-700",   border:"border-amber-200",   dot:"bg-amber-500",   bar:"bg-amber-500"   },
  Minor:    { bg:"bg-emerald-50", text:"text-emerald-700", border:"border-emerald-200", dot:"bg-emerald-500", bar:"bg-emerald-500" },
};

const AI_STATUS_CONFIG = {
  Processing: { bg:"bg-purple-50",  text:"text-purple-700",  dot:"bg-purple-400"  },
  Completed:  { bg:"bg-emerald-50", text:"text-emerald-700", dot:"bg-emerald-400" },
  Failed:     { bg:"bg-red-50",     text:"text-red-700",     dot:"bg-red-400"     },
};

const STAT_CARDS = [
  { label:"Total Issues", key:"total",    icon:LayoutDashboard, grad:"from-slate-700 to-slate-900",   soft:"bg-slate-50  border-slate-200",  val:"text-slate-800",  bar:"bg-slate-600"  },
  { label:"Pending",      key:"pending",  icon:Clock,           grad:"from-amber-500 to-orange-600",  soft:"bg-amber-50  border-amber-100",  val:"text-amber-700",  bar:"bg-amber-500"  },
  { label:"In Review",    key:"inReview", icon:Activity,        grad:"from-violet-500 to-purple-700", soft:"bg-violet-50 border-violet-100", val:"text-violet-700", bar:"bg-violet-500" },
  { label:"Assigned",     key:"assigned", icon:UserCheck,       grad:"from-sky-500 to-blue-700",      soft:"bg-sky-50    border-sky-100",    val:"text-sky-700",    bar:"bg-sky-500"    },
  { label:"Resolved",     key:"resolved", icon:CheckCircle2,    grad:"from-emerald-500 to-green-700", soft:"bg-emerald-50 border-emerald-100",val:"text-emerald-700",bar:"bg-emerald-500"},
];

const cleanArea = (loc) => {
  if (!loc) return null;
  if (loc.startsWith("GPS Location") || loc.startsWith("Current Location")) return "Auto-detected Area";
  return loc;
};
const fmt = (d) => new Date(d).toLocaleDateString("en-IN",{ day:"numeric", month:"short", year:"numeric" });

// ─── Map icons ────────────────────────────────────────────────────────────────
const mkIcon = (color) => L.divIcon({
  className:"", iconAnchor:[12,28], popupAnchor:[0,-30],
  html:`<div style="position:relative;width:24px;height:28px;">
    <div style="position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:${color};opacity:.2;animation:pulse 2s infinite;"></div>
    <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
      <path d="M12 1C6.48 1 2 5.48 2 11c0 7 10 17 10 17s10-10 10-17c0-5.52-4.48-10-10-10z" fill="${color}" filter="drop-shadow(0 2px 4px ${color}88)"/>
      <circle cx="12" cy="11" r="4" fill="white" opacity=".9"/>
      <circle cx="12" cy="11" r="1.8" fill="${color}"/>
    </svg>
  </div>
  <style>@keyframes pulse{0%,100%{transform:scale(.8);opacity:.2}50%{transform:scale(2);opacity:0}}</style>`
});
const RED_ICON    = mkIcon("#ef4444");
const YELLOW_ICON = mkIcon("#f59e0b");
const GREEN_ICON  = mkIcon("#10b981");

// ─── Sub-components ───────────────────────────────────────────────────────────
function HeatLayer({ issues }) {
  const map = useMap();
  useEffect(() => {
    const pts = issues.filter(i => i.latitude && i.longitude).map(i => [+i.latitude, +i.longitude, 0.7]);
    if (!pts.length) return;
    const layer = L.heatLayer(pts, { radius:25, blur:15, maxZoom:17 }).addTo(map);
    return () => map.removeLayer(layer);
  }, [issues, map]);
  return null;
}

function Badge({ children, className="" }) {
  return <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${className}`}>{children}</span>;
}
function Dot({ className="" }) {
  return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${className}`} />;
}

function StatCard({ label, value, icon:Icon, grad, soft, val, bar, total, isTotal }) {
  const pct = total > 0 && !isTotal ? Math.round((value/total)*100) : 100;
  return (
    <div className={`relative rounded-2xl border p-4 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${soft}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-md`}>
          <Icon size={17} className="text-white" strokeWidth={2} />
        </div>
        {!isTotal && total > 0 && <span className={`text-xs font-black ${val}`}>{pct}%</span>}
      </div>
      <div className={`text-3xl font-black tracking-tight leading-none mb-0.5 ${val}`}>{value}</div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{label}</p>
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${bar}`} style={{width:`${pct}%`}} />
      </div>
    </div>
  );
}

function StatusDropdown({ issueId, currentStatus, onUpdate, updating }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top:0, left:0, width:0 });
  const cfg = STATUS_CONFIG[currentStatus] || {};

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top:r.bottom+4, left:r.left, width:Math.max(r.width,148) });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll",close,true); window.removeEventListener("resize",close); };
  }, [open]);

  return (
    <>
      <button ref={btnRef} onClick={handleOpen} disabled={updating}
        className={`w-full flex items-center justify-between text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${cfg.bg||"bg-slate-50"} ${cfg.text||"text-slate-600"} ${cfg.border||"border-slate-200"} ${cfg.ring||"ring-slate-200"}`}>
        <span className="flex items-center gap-1.5">
          <Dot className={cfg.dot||"bg-slate-300"} />{currentStatus}
        </span>
        {updating ? <Loader2 size={11} className="animate-spin" /> : <ChevronDown size={11} className={`transition-transform ${open?"rotate-180":""}`} />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1"
            style={{top:pos.top, left:pos.left, width:pos.width}}>
            {Object.entries(STATUS_CONFIG).map(([s,c]) => (
              <button key={s} onClick={() => { setOpen(false); if (s!==currentStatus) onUpdate(issueId,s); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-left transition-colors hover:bg-slate-50 ${s===currentStatus?"bg-slate-50":""}`}>
                <Dot className={c.dot} />
                <span className={s===currentStatus?c.text:"text-slate-600"}>{s}</span>
                {s===currentStatus && <CheckCircle2 size={10} className={`ml-auto ${c.text}`} />}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ─── Issue Row ─────────────────────────────────────────────────────────────────
function IssueRow({ issue, onUpdate, updating }) {
  const pri   = PRIORITY_CONFIG[issue.priority] || {};
  const aiCfg = AI_STATUS_CONFIG[issue.aiStatus || "Processing"] || AI_STATUS_CONFIG.Processing;

  

  return (
    <tr className="hover:bg-slate-50/60 transition-colors group border-b border-slate-100 last:border-0">

      {/* Issue */}
      <td className="px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <div className={`mt-1 w-1 h-8 rounded-full flex-shrink-0 ${pri.bar||"bg-slate-200"}`} />
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider block">{issue.issueId}</span>
            <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors block leading-snug truncate max-w-[180px]">{issue.title}</span>
            {issue.duplicateCount > 1 && (
  <div className="mt-1">
    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold px-2 py-0.5 rounded-full">
      🚨 {issue.duplicateCount} reports linked
    </span>
  </div>
)}
            <span className="text-[10px] text-slate-400 block mt-0.5">{issue.category}</span>
          </div>
        </div>
      </td>

      {/* Location */}
      <td className="px-4 py-3.5 max-w-[160px]">
        <div className="flex items-start gap-1">
          <MapPin size={11} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-700 leading-snug line-clamp-2">
              {issue.location?.startsWith("GPS") ? "Auto-detected" : issue.location || "Unavailable"}
            </p>
            {issue.latitude && issue.longitude && (
              <a href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                target="_blank" rel="noreferrer"
                className="text-[9px] text-blue-500 hover:text-blue-700 font-bold mt-0.5 inline-block">
                Open Maps →
              </a>
            )}
          </div>
        </div>
      </td>

      {/* Image */}
      <td className="px-4 py-3.5">
        {issue.image
          ? <a href={issue.image} target="_blank" rel="noreferrer">
              <img src={issue.image} alt="Issue" className="w-12 h-12 rounded-lg object-cover border border-slate-200 hover:scale-110 transition-transform shadow-sm" />
            </a>
          : <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
              <span className="text-[8px] text-slate-400 font-semibold text-center leading-tight px-1">No Image</span>
            </div>
        }
      </td>

      {/* Reporter */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 text-[10px] font-black">{issue.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-800 truncate max-w-[100px]">{issue.name}</p>
            <p className="text-[9px] text-slate-400 truncate max-w-[100px]">{issue.email}</p>
          </div>
        </div>
      </td>

      {/* Priority */}
      <td className="px-4 py-3.5">
        <Badge className={`${pri.bg||"bg-slate-50"} ${pri.text||"text-slate-600"} ${pri.border||"border-slate-200"}`}>
          <Dot className={pri.dot||"bg-slate-400"} />{issue.priority||"—"}
        </Badge>
      </td>

      {/* AI Analysis — compact */}
      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1.5">

          {/* Status row: badge + confidence on one line */}
          <div className="flex items-center gap-1.5">
            <Badge className={`${aiCfg.bg} ${aiCfg.text} border-transparent`}>
              <Dot className={aiCfg.dot} />
              {issue.aiStatus || "Processing"}
            </Badge>
            {issue.aiConfidence > 0 && (
              <span className="text-[10px] font-bold text-slate-400">{issue.aiConfidence}%</span>
            )}
          </div>

         {/* Show only mismatch */}
{issue.verificationStatus === "Mismatch" && (
  <Badge className="bg-red-50 text-red-700 border-red-200 w-fit">
    ⚠ Mismatch
  </Badge>
)}

         
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Calendar size={11} className="text-slate-400 flex-shrink-0" />
          {fmt(issue.createdAt)}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <div className="w-32">
          <StatusDropdown issueId={issue._id} currentStatus={issue.status} onUpdate={onUpdate} updating={updating} />
        </div>
      </td>
    </tr>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [issues,     setIssues]   = useState([]);
  const [loading,    setLoading]  = useState(true);
  const [error,      setError]    = useState(false);
  const [search,     setSearch]   = useState("");
  const [statusFilter, setStatus] = useState("Active");
  const [updatingId, setUpdating] = useState(null);
  const [lastSync,   setLastSync] = useState(new Date());

  const fetchIssues = async () => {
    setLoading(true); setError(false);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE}/issues`, {
        signal: AbortSignal.timeout(8000),
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setIssues(await res.json());
    } catch { setIssues([]); setError(true); }
    finally { setLoading(false); setLastSync(new Date()); }
  };

  useEffect(() => { fetchIssues(); }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    const prev = issues.map(i => ({...i}));
    setUpdating(id);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE}/issues/${id}/status`, {
        method:"PATCH",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setIssues(cur => cur.map(i => i._id === id ? updated : i));
    } catch { setIssues(prev); }
    finally { setUpdating(null); }
  };

  const stats = {
    total:    issues.length,
    pending:  issues.filter(i => i.status==="Pending").length,
    inReview: issues.filter(i => i.status==="In Review").length,
    assigned: issues.filter(i => i.status==="Assigned").length,
    resolved: issues.filter(i => i.status==="Resolved").length,
  };

  const topAreas = Object.entries(
    issues.reduce((acc,i) => { const a=cleanArea(i.location); if(a) acc[a]=(acc[a]||0)+1; return acc; }, {})
  ).sort((a,b)=>b[1]-a[1]).slice(0,3);

  const filtered = issues.filter(issue => {
    const q = search.toLowerCase();
    const matchStatus = statusFilter==="All" || (statusFilter==="Active"&&issue.status!=="Resolved") || issue.status===statusFilter;
    const matchSearch = !q || [issue.issueId,issue.title,issue.category,issue.location,issue.name,issue.email].some(f=>f?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const resRate = stats.total > 0 ? Math.round((stats.resolved/stats.total)*100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Building2 size={15} className="text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-slate-900 tracking-tight">FixCity</span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                <Shield size={8} /> Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {error
              ? <span className="flex items-center gap-1 text-red-500 text-[11px] font-semibold"><WifiOff size={12}/> Offline</span>
              : <span className="hidden md:flex items-center gap-1 text-slate-400 text-[11px]"><Wifi size={11} className="text-emerald-400"/> Synced {lastSync.toLocaleTimeString()}</span>
            }
            <button onClick={fetchIssues} disabled={loading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95">
              <RefreshCw size={11} className={loading?"animate-spin":""}/>Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-5 py-6 flex flex-col gap-6">

        {/* Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 shadow-lg overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"/>
            <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white rounded-full translate-y-1/2"/>
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                <span className="text-blue-200 text-[10px] font-bold tracking-widest uppercase">System Live</span>
              </div>
              <h1 className="text-white text-lg font-black mb-1">Welcome back, Authority 👋</h1>
              <p className="text-blue-200 text-sm">
                <span className="text-white font-bold">{stats.pending} pending</span> and{" "}
                <span className="text-white font-bold">{stats.inReview} in review</span> need your attention.
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              {[{label:"Total",value:stats.total,color:"text-white"},{label:"Resolved",value:stats.resolved,color:"text-emerald-300"},{label:"Pending",value:stats.pending,color:"text-amber-300"}].map(({label,value,color})=>(
                <div key={label} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm">
                  <div className={`text-2xl font-black ${color}`}>{value}</div>
                  <div className="text-[9px] text-blue-200 font-bold uppercase tracking-widest">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <section>
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <BarChart3 size={12}/> Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STAT_CARDS.map(c => <StatCard key={c.key} {...c} value={stats[c.key]} total={stats.total} isTotal={c.key==="total"}/>)}
          </div>
        </section>

        {/* Search + Filter */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input type="text" placeholder="Search by ID, title, reporter, category…"
              value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"/>
          </div>
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <select value={statusFilter} onChange={e=>setStatus(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer min-w-[152px]">
              {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s==="All"?"All Statuses":s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-semibold text-slate-500 whitespace-nowrap">
            <TrendingUp size={12}/>{filtered.length} of {issues.length} issues
          </div>
        </div>

        {/* Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Layers size={12}/> Reported Issues
            </h2>
            <div className="hidden sm:flex gap-2">
              {Object.entries(STATUS_CONFIG).map(([s,c])=>(
                <Badge key={s} className={`${c.bg} ${c.text} ${c.border}`}>
                  <Dot className={c.dot}/>{s}: {issues.filter(i=>i.status===s).length}
                </Badge>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 py-20 flex flex-col items-center gap-3 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-blue-500"/>
              </div>
              <p className="font-semibold text-slate-700 text-sm">Loading civic reports…</p>
              <p className="text-slate-400 text-xs">Connecting to FixCity server</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-xl border border-red-200 py-16 flex flex-col items-center gap-3">
              <AlertTriangle size={28} className="text-red-400"/>
              <p className="font-semibold text-red-700 text-sm">Could not load issues</p>
              <p className="text-red-400 text-xs">Server may be starting up. Try refreshing in 30s.</p>
              <button onClick={fetchIssues} className="mt-1 text-xs text-red-600 font-bold border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">Try Again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-20 flex flex-col items-center gap-3 shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <InboxIcon size={20} className="text-slate-400"/>
              </div>
              <p className="font-semibold text-slate-700 text-sm">No issues found</p>
              <p className="text-slate-400 text-xs">{search||statusFilter!=="All"?"Try adjusting your search or filter.":"No civic issues reported yet."}</p>
              {(search||statusFilter!=="All")&&(
                <button onClick={()=>{setSearch("");setStatus("All");}} className="text-xs text-blue-600 font-bold border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[860px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["Issue","Location","Image","Reporter","Priority","AI Analysis","Date","Status"].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(issue=>(
                      <IssueRow key={issue._id} issue={issue} onUpdate={handleStatusUpdate} updating={updatingId===issue._id}/>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">Showing {filtered.length} of {issues.length} issues</p>
                <p className="text-[11px] text-slate-400">Last synced: {lastSync.toLocaleTimeString()}</p>
              </div>
            </div>
          )}
        </section>

        {/* Map + Hotspots */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><MapPin size={14} className="text-blue-500"/> Issue Heatmap</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Brighter areas = more reports</p>
              </div>
              <div className="flex items-center gap-3">
                {[["Critical","bg-red-500"],["Moderate","bg-amber-500"],["Minor","bg-emerald-500"]].map(([l,c])=>(
                  <span key={l} className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${c}`}/>{l}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg overflow-hidden border border-slate-100">
              <MapContainer center={[19.076,72.8777]} zoom={12} style={{height:"260px",width:"100%"}}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                <HeatLayer issues={issues}/>
                {issues.map(issue=>issue.latitude&&issue.longitude?(
                  <Marker key={issue._id} position={[+issue.latitude,+issue.longitude]}
                    icon={issue.priority==="Critical"?RED_ICON:issue.priority==="Moderate"?YELLOW_ICON:GREEN_ICON}>
                    <Popup>
                      <div className="min-w-[160px] font-sans">
                        <p className="font-bold text-sm mb-1 leading-snug">{issue.title}</p>
                        <p className="text-xs text-slate-500 mb-0.5">📍 {issue.location}</p>
                        <p className="text-xs mb-0.5">Priority: <strong style={{color:issue.priority==="Critical"?"#dc2626":issue.priority==="Moderate"?"#d97706":"#16a34a"}}>{issue.priority}</strong></p>
                        <p className="text-xs">Status: <strong>{issue.status}</strong></p>
                        {issue.image&&<img src={issue.image} alt="Issue" className="w-full rounded-lg mt-2"/>}
                      </div>
                    </Popup>
                  </Marker>
                ):null)}
              </MapContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3"><Flame size={14} className="text-orange-500"/> Top Problem Areas</h3>
              {topAreas.length===0?(
                <p className="text-xs text-slate-400 text-center py-6">No location data available.</p>
              ):(
                <div className="flex flex-col gap-2">
                  {topAreas.map(([area,count],i)=>{
                    const cfgs=[
                      {bg:"bg-red-50",border:"border-red-100",text:"text-red-700",num:"from-red-500 to-rose-500"},
                      {bg:"bg-amber-50",border:"border-amber-100",text:"text-amber-700",num:"from-amber-500 to-yellow-500"},
                      {bg:"bg-sky-50",border:"border-sky-100",text:"text-sky-700",num:"from-sky-500 to-blue-500"},
                    ];
                    const c=cfgs[i]||cfgs[2];
                    const tag=count>=5?{label:"⚠ Major zone",cls:"text-red-600"}:count>=2?{label:"Monitor closely",cls:"text-amber-600"}:{label:"Normal activity",cls:"text-slate-400"};
                    return(
                      <div key={area} className={`flex items-center gap-2.5 p-3 rounded-lg border ${c.bg} ${c.border}`}>
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.num} flex items-center justify-center text-white font-black text-xs flex-shrink-0`}>#{i+1}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-xs line-clamp-1 ${c.text}`}>{area}</p>
                          <p className={`text-[9px] font-semibold mt-0.5 ${tag.cls}`}>{tag.label}</p>
                        </div>
                        <span className={`text-base font-black ${c.text}`}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 pt-3 mt-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Resolution Rate</span>
                <span className="text-[11px] font-black text-emerald-600">{resRate}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-1000" style={{width:`${resRate}%`}}/>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">{stats.resolved} of {stats.total} issues resolved</p>
            </div>
          </div>
        </div>

        <footer className="text-center text-[10px] text-slate-400 py-3 border-t border-slate-100">
          FixCity Admin Panel · Municipal Civic Issue Management · © {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}
import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import "leaflet.heat"
import {
  LayoutDashboard, Clock, UserCheck, CheckCircle2,
  Search, Filter, RefreshCw, MapPin, User, Mail,
  Tag, Calendar, Shield, ChevronDown, Loader2,
  InboxIcon, Building2, TrendingUp, Eye, Activity,
  BarChart3, Layers, AlertTriangle, Flame
} from "lucide-react"

// ─── Badge configs ────────────────────────────────────────────────────────────
const PRIORITY_BADGE = {
  Critical: "bg-red-100    text-red-700    border border-red-200",
  Moderate: "bg-amber-100  text-amber-700  border border-amber-200",
  Minor:    "bg-emerald-100 text-emerald-700 border border-emerald-200",
}
const PRIORITY_DOT = {
  Critical: "bg-red-500",
  Moderate: "bg-amber-500",
  Minor:    "bg-emerald-500",
}
const STATUS_BADGE = {
  Pending:    "bg-orange-100 text-orange-700 border border-orange-200",
  "In Review":"bg-violet-100 text-violet-700 border border-violet-200",
  Assigned:   "bg-blue-100   text-blue-700   border border-blue-200",
  Resolved:   "bg-emerald-100 text-emerald-700 border border-emerald-200",
}
const STATUS_DOT = {
  Pending:    "bg-orange-400",
  "In Review":"bg-violet-400",
  Assigned:   "bg-blue-400",
  Resolved:   "bg-emerald-400",
}
const SEVERITY_BAR = {
  High:   "bg-gradient-to-r from-red-500    to-rose-400",
  Medium: "bg-gradient-to-r from-amber-500  to-yellow-400",
  Low:    "bg-gradient-to-r from-emerald-500 to-green-400",
}

// ─── Custom SVG marker icons ──────────────────────────────────────────────────
const createPinIcon = (color, pulseColor) => L.divIcon({
  className: "",
  iconAnchor: [12, 30],
  popupAnchor: [0, -30],
  html: `
    <div style="position:relative;width:24px;height:32px;">
      <!-- Pulse ring -->
      <div style="
        position:absolute;top:2px;left:2px;
        width:20px;height:20px;border-radius:50%;
        background:${pulseColor};opacity:0.25;
        animation:pinPulse 2s ease-out infinite;
      "></div>
      <!-- Pin body -->
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="sh${color.replace('#','')}" x="-40%" y="-10%" width="180%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${color}" flood-opacity="0.4"/>
          </filter>
        </defs>
        <path d="M12 1C6.477 1 2 5.477 2 11c0 7.5 10 20 10 20s10-12.5 10-20C22 5.477 17.523 1 12 1z"
          fill="${color}" filter="url(#sh${color.replace('#','')})"/>
        <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.95"/>
        <circle cx="12" cy="11" r="2" fill="${color}"/>
      </svg>
    </div>
    <style>
      @keyframes pinPulse {
        0%   { transform:scale(0.8); opacity:0.4; }
        70%  { transform:scale(2);   opacity:0;   }
        100% { transform:scale(0.8); opacity:0;   }
      }
    </style>
  `
})

const redIcon    = createPinIcon("#ef4444", "#ef4444")
const yellowIcon = createPinIcon("#f59e0b", "#f59e0b")
const greenIcon  = createPinIcon("#10b981", "#10b981")

// ─── Heatmap layer ────────────────────────────────────────────────────────────
function IssueHeatMap({ issues }) {
  const map = useMap()
  useEffect(() => {
    const points = issues
      .filter(i => i.latitude && i.longitude)
      .map(i => [Number(i.latitude), Number(i.longitude), 0.7])
    if (!points.length) return
    const heat = L.heatLayer(points, { radius:25, blur:15, maxZoom:17 }).addTo(map)
    return () => map.removeLayer(heat)
  }, [issues, map])
  return null
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const T = {
    blue:    { bg:"from-blue-500    to-blue-700",    soft:"bg-blue-50   border-blue-100",   text:"text-blue-700",    sub:"text-blue-400",    bar:"bg-blue-500",    shadow:"shadow-blue-200"    },
    orange:  { bg:"from-orange-500  to-orange-700",  soft:"bg-orange-50  border-orange-100",  text:"text-orange-600",  sub:"text-orange-400",  bar:"bg-orange-500",  shadow:"shadow-orange-200"  },
    violet:  { bg:"from-violet-500  to-purple-700",  soft:"bg-violet-50  border-violet-100",  text:"text-violet-700",  sub:"text-violet-400",  bar:"bg-violet-500",  shadow:"shadow-violet-200"  },
    cyan:    { bg:"from-cyan-500    to-sky-700",     soft:"bg-cyan-50    border-cyan-100",    text:"text-cyan-700",    sub:"text-cyan-500",    bar:"bg-cyan-500",    shadow:"shadow-cyan-200"    },
    emerald: { bg:"from-emerald-500 to-green-700",   soft:"bg-emerald-50 border-emerald-100", text:"text-emerald-700", sub:"text-emerald-500", bar:"bg-emerald-500", shadow:"shadow-emerald-200" },
  }
  const t = T[accent] || T.blue
  return (
    <div className={`relative rounded-2xl border p-5 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default overflow-hidden ${t.soft}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.bg} flex items-center justify-center shadow-lg ${t.shadow}`}>
          <Icon size={20} className="text-white" strokeWidth={2} />
        </div>
        {total > 0 && (
          <div className="text-right">
            <div className={`text-sm font-black ${t.text}`}>{pct}%</div>
            <div className="text-[10px] text-slate-400">of total</div>
          </div>
        )}
      </div>
      <div className={`text-4xl font-black tracking-tight leading-none mb-1 ${t.text}`}>{value}</div>
      <p className={`text-[11px] font-extrabold uppercase tracking-[0.12em] mb-3 ${t.sub}`}>{label}</p>
      <div className="w-full h-[3px] bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${t.bar}`}
          style={{ width: `${label === "Total Issues" ? 100 : pct || 0}%` }} />
      </div>
    </div>
  )
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────
function StatusDropdown({ issueId, currentStatus, onUpdate, updating }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const [coords, setCoords] = useState({ top:0, left:0, width:0 })
  const statuses = ["Pending","In Review","Assigned","Resolved"]

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setCoords({ top: r.bottom + 6, left: r.left, width: r.width })
    }
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close) }
  }, [open])

  return (
    <>
      <button ref={btnRef} type="button" onClick={handleOpen} disabled={updating}
        className={`w-full flex items-center justify-between text-xs font-semibold pl-3 pr-2.5 py-2 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${STATUS_BADGE[currentStatus] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[currentStatus] || "bg-slate-400"}`} />
          {currentStatus}
        </span>
        {updating ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} className={`transition-transform ${open?"rotate-180":""}`} />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0" style={{zIndex:9998}} onClick={() => setOpen(false)} />
          <div className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden" style={{top:coords.top, left:coords.left, width:coords.width, zIndex:9999}}>
            {statuses.map(s => (
              <button key={s} type="button"
                onClick={() => { setOpen(false); if (s !== currentStatus) onUpdate(issueId, s) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-slate-50 ${s === currentStatus ? "bg-blue-50" : ""}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[s] || "bg-slate-300"}`} />
                <span className={s === currentStatus ? "text-blue-700" : "text-slate-700"}>{s}</span>
                {s === currentStatus && <CheckCircle2 size={11} className="ml-auto text-blue-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
const STATUS_OPTIONS = ["Active","All","Pending","In Review","Assigned","Resolved"]
const cleanAreaName = (location) => {
  if (!location) return "Location not available"

  if (
    location.startsWith("GPS Location") ||
    location.startsWith("Current Location")
  ) {
    return "Auto-detected Area"
  }

  return location
}

export default function AdminDashboard() {
  const [issues,       setIssues]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState("")
  const [statusFilter, setStatusFilter] = useState("Active")
  const [updatingId,   setUpdatingId]   = useState(null)
  const [lastRefresh,  setLastRefresh]  = useState(new Date())

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await fetch("https://fixcity-0wi0.onrender.com/issues", { signal: AbortSignal.timeout(5000) })
      if (!res.ok) throw new Error()
      setIssues(await res.json())
    } catch { setIssues([]) }
    finally { setLoading(false); setLastRefresh(new Date()) }
  }
  useEffect(() => { fetchIssues() }, [])

  const handleStatusUpdate = async (id, newStatus) => {
    const prev = issues.map(i => ({...i}))
    setUpdatingId(id)
    try {
      const res = await fetch(`https://fixcity-0wi0.onrender.com/issues/${id}/status`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setIssues(cur => cur.map(i => i._id === id ? updated : i))
    } catch { setIssues(prev) }
    finally { setUpdatingId(null) }
  }

  const stats = {
    total:    issues.length,
    pending:  issues.filter(i => i.status === "Pending").length,
    inReview: issues.filter(i => i.status === "In Review").length,
    assigned: issues.filter(i => i.status === "Assigned").length,
    resolved: issues.filter(i => i.status === "Resolved").length,
  }

  const topAreas = Object.entries(
  issues.reduce((acc, i) => {
    const area = cleanAreaName(i.location)
    acc[area] = (acc[area] || 0) + 1
    return acc
  }, {})
)
  .filter(([area]) => area !== "Location not available")
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)

  const filtered = issues.filter(issue => {
    const q = search.toLowerCase()
    const matchStatus = statusFilter==="All" || (statusFilter==="Active" && issue.status!=="Resolved") || issue.status===statusFilter
    const matchSearch = !q || [issue.issueId,issue.title,issue.category,issue.location,issue.name,issue.email].some(f=>f?.toLowerCase().includes(q))
    return matchStatus && matchSearch
  })

  const STAT_CARDS = [
    { label:"Total Issues", value:stats.total,    icon:LayoutDashboard, accent:"blue",    total:0           },
    { label:"Pending",      value:stats.pending,  icon:Clock,           accent:"orange",  total:stats.total },
    { label:"In Review",    value:stats.inReview, icon:Activity,        accent:"violet",  total:stats.total },
    { label:"Assigned",     value:stats.assigned, icon:UserCheck,       accent:"cyan",    total:stats.total },
    { label:"Resolved",     value:stats.resolved, icon:CheckCircle2,    accent:"emerald", total:stats.total },
  ]

  return (
    <div className="min-h-screen" style={{background:"linear-gradient(135deg,#f0f4ff 0%,#f8faff 50%,#f0f7f4 100%)"}}>

      {/* ── Sticky header ── */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <Building2 size={17} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-800 tracking-tight">Admin Dashboard</span>
                <span className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                  <Shield size={8} /> Authority Panel
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-none mt-0.5">FixCity · Municipal Civic Issue Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden md:block">Last synced {lastRefresh.toLocaleTimeString()}</span>
            <button type="button" onClick={fetchIssues} disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-blue-200 active:scale-95">
              <RefreshCw size={12} className={loading?"animate-spin":""} /> Sync
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-7">

        {/* ── Welcome banner ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-6 shadow-xl shadow-blue-200">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 right-32 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute top-4 right-16 w-16 h-16 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-blue-200 text-xs font-semibold tracking-widest uppercase">System Online</span>
              </div>
              <h2 className="text-white text-xl font-black mb-1">Welcome back, Authority 👋</h2>
              <p className="text-blue-200 text-sm">
                You have <span className="text-white font-bold">{stats.pending} pending</span> and{" "}
                <span className="text-white font-bold">{stats.inReview} in-review</span> issues requiring attention.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {[
                { label:"Total Reports", value:stats.total,    color:"text-white"         },
                { label:"Resolved",      value:stats.resolved, color:"text-emerald-300"   },
                { label:"Pending",       value:stats.pending,  color:"text-orange-300"    },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center border border-white/20">
                  <div className={`text-2xl font-black ${color}`}>{value}</div>
                  <div className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <BarChart3 size={13} /> Overview Statistics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {STAT_CARDS.map(card => <StatCard key={card.label} {...card} />)}
          </div>
        </div>

        {/* ── Search & filter ── */}
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Search size={15} />
              </div>
              <input type="text" placeholder="Search by ID, title, reporter, category or location…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all" />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Filter size={14} /></div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all appearance-none cursor-pointer min-w-[160px]">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={14} /></div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
              <TrendingUp size={13} /> {filtered.length} of {issues.length} issues
            </div>
          </div>
        </div>

        {/* ── Issues table ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
            <p className="font-bold text-slate-700">Loading civic reports…</p>
            <p className="text-slate-400 text-xs">Fetching all submitted issues</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
              <InboxIcon size={24} className="text-slate-400" />
            </div>
            <p className="font-bold text-slate-700">No issues found</p>
            <p className="text-slate-400 text-xs">{search || statusFilter !== "All" ? "Try adjusting your search or filter." : "No civic issues reported yet."}</p>
            {(search || statusFilter !== "All") && (
              <button type="button" onClick={() => { setSearch(""); setStatusFilter("All") }}
                className="text-xs text-blue-600 font-bold border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Status legend */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers size={13} /> Reported Civic Issues
              </h3>
              <div className="flex gap-2 flex-wrap">
                {["Pending","In Review","Assigned","Resolved"].map(s => (
                  <div key={s} className={`hidden sm:flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[s]}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                    {s}: {issues.filter(i => i.status === s).length}
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      {["Issue","Location","Image","Reporter","Priority","Date","Status"].map(h => (
                        <th key={h} className="px-5 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(issue => (
                      <tr key={issue._id} className="hover:bg-slate-50/80 transition-colors group">

                        {/* Issue */}
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-1.5 h-8 rounded-full flex-shrink-0 ${SEVERITY_BAR[issue.severity] || "bg-slate-200"}`} />
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 font-mono block mb-0.5">{issue.issueId}</span>
                              <span className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-700 transition-colors block">{issue.title}</span>
                              <span className="text-[11px] text-slate-400 mt-0.5 block">{issue.category}</span>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4 max-w-[180px]">
                          <div className="flex items-start gap-1.5">
                            <MapPin size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
<p className="text-xs font-semibold text-slate-700 leading-snug">
  {issue.location?.startsWith("GPS Location")
    ? "Auto-detected location"
    : issue.location || "Location unavailable"}
</p>                              {issue.latitude && issue.longitude && (
                                <a href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                                  target="_blank" rel="noreferrer"
                                  className="text-[10px] text-blue-500 hover:text-blue-700 font-bold mt-0.5 inline-block">
                                  Open Maps →
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Image */}
                        <td className="px-5 py-4">
                          {issue.image ? (
                            <a href={`https://fixcity-0wi0.onrender.com/uploads/${issue.image}`} target="_blank" rel="noreferrer">
                              <img src={issue.image} alt="Issue"
                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 hover:scale-110 transition-transform shadow-sm" />
                            </a>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                              <span className="text-[9px] text-slate-400 font-semibold text-center leading-tight px-1">No Image</span>
                            </div>
                          )}
                        </td>

                        {/* Reporter */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-700 text-xs font-black">{issue.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{issue.name}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{issue.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${PRIORITY_BADGE[issue.priority] || ""}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[issue.priority] || "bg-slate-400"}`} />
                            {issue.priority}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar size={12} className="text-slate-400" />
                            {new Date(issue.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                          </div>
                        </td>

                        {/* Status dropdown */}
                        <td className="px-5 py-4">
                          <div className="w-36">
                            <StatusDropdown issueId={issue._id} currentStatus={issue.status}
                              onUpdate={handleStatusUpdate} updating={updatingId === issue._id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Map + Hotspots row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Heatmap */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <MapPin size={15} className="text-blue-500" /> Issue Heatmap
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Areas with more reports glow brighter on the map.</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Critical</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Moderate</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Minor</span>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-100">
              <MapContainer center={[19.076,72.8777]} zoom={12} style={{height:"280px",width:"100%"}}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <IssueHeatMap issues={issues} />
                {issues.map(issue => issue.latitude && issue.longitude ? (
                  <Marker key={issue._id} position={[Number(issue.latitude), Number(issue.longitude)]}
                    icon={issue.priority==="Critical" ? redIcon : issue.priority==="Moderate" ? yellowIcon : greenIcon}>
                    <Popup>
                      <div className="min-w-[180px] font-sans">
                        <p className="font-bold text-sm mb-1">{issue.title}</p>
                        <p className="text-xs text-slate-500 mb-1">📍 {issue.location}</p>
                        <p className="text-xs mb-1">Priority: <strong style={{color:issue.priority==="Critical"?"#dc2626":issue.priority==="Moderate"?"#d97706":"#16a34a"}}>{issue.priority}</strong></p>
                        <p className="text-xs mb-2">Status: <strong>{issue.status}</strong></p>
                        {issue.image && <img src={issue.image} alt="Issue" className="w-full rounded-lg" />}
                      </div>
                    </Popup>
                  </Marker>
                ) : null)}
              </MapContainer>
            </div>
          </div>

          {/* Top hotspots */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Flame size={15} className="text-orange-500" /> Top Problem Areas
            </h3>
            <div className="flex flex-col gap-3">
              {topAreas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No location data available.</p>
              ) : topAreas.map(([area, count], i) => {
                const colors = ["from-red-500 to-rose-400","from-amber-500 to-yellow-400","from-blue-500 to-blue-400"]
                const bgs    = ["bg-red-50 border-red-100","bg-amber-50 border-amber-100","bg-blue-50 border-blue-100"]
                const texts  = ["text-red-700","text-amber-700","text-blue-700"]
                return (
                  <div key={area} className={`flex items-center gap-3 p-3.5 rounded-xl border ${bgs[i] || "bg-slate-50 border-slate-200"}`}>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[i] || "from-slate-400 to-slate-600"} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                      #{i+1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-xs leading-snug line-clamp-1 ${texts[i] || "text-slate-700"}`}>{area}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{count >= 5 ? (
  <p className="text-[10px] font-bold text-red-600 mt-1">
    🚨 Major complaint zone
  </p>
) : count >= 2 ? (
  <p className="text-[10px] font-bold text-amber-600 mt-1">
    ⚠ Needs monitoring
  </p>
) : (
  <p className="text-[10px] font-bold text-slate-400 mt-1">
    Normal activity
  </p>
)}</p>
                    </div>
                    <div className={`text-lg font-black ${texts[i] || "text-slate-500"}`}>{count}</div>
                  </div>
                )
              })}
              {/* Resolution rate */}
              <div className="mt-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">Resolution Rate</span>
                  <span className="text-[11px] font-black text-emerald-600">
                    {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700"
                    style={{width: stats.total > 0 ? `${Math.round((stats.resolved/stats.total)*100)}%` : "0%"}} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4 border-t border-slate-100">
          FixCity Admin Panel · Smart Civic Issue Management System · © 2024
        </div>
      </div>
    </div>
  )
}
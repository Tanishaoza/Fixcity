import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapPin,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  User,
  Mail,
  FileText,
  Tag,
  AlignLeft,
  Zap,
  Brain,
  BarChart2,
  ShieldCheck,
  X,
  ImagePlus,
  Loader2,
  Sparkles,
} from "lucide-react";

// Fix Leaflet default marker icon (broken in Vite/webpack builds)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─────────────────────────────────────────────────────────────────────────────
// SMART AI ENGINE
// Determines severity based on category + keyword analysis of description.
// This runs entirely on the frontend — no backend required for severity logic.
// ─────────────────────────────────────────────────────────────────────────────

// Step 1: Base severity per category (sensible civic defaults)
const CATEGORY_BASE_SEVERITY = {
  Pothole: "Medium",
  Garbage: "Low",
  "Water Leakage": "Medium",
  Flooding: "High",
  "Broken Streetlight": "Medium",
  "Road Damage": "High",
  Other: "Low",
};

// Step 2: Keywords that escalate severity UP to High
const HIGH_KEYWORDS = [
  "huge",
  "deep",
  "accident",
  "danger",
  "dangerous",
  "injury",
  "injured",
  "traffic",
  "blocked",
  "collapsed",
  "emergency",
  "overflowing",
  "severe",
  "critical",
  "urgent",
  "deadly",
  "flooding",
  "burst",
  "explosion",
  "fire",
  "falling",
];

// Step 3: Keywords that reduce severity DOWN to Low
const LOW_KEYWORDS = [
  "small",
  "minor",
  "little",
  "tiny",
  "slight",
  "barely",
  "not that bad",
  "manageable",
  "slow leak",
];

// Step 4: Priority label mapped from severity
const PRIORITY_MAP = {
  High: "Critical",
  Medium: "Moderate",
  Low: "Minor",
};

// Step 5: Confidence score range per severity
// Higher severity = AI is more certain (stronger signal words)
const CONFIDENCE_RANGE = {
  High: [90, 98],
  Medium: [80, 89],
  Low: [70, 79],
};


// ─────────────────────────────────────────────────────────────────────────────
// SEVERITY STYLES — Tailwind classes per severity level
// ─────────────────────────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  High: {
    badge: "bg-red-100 text-red-600",
    bar: "from-red-500 to-red-400",
    dot: "bg-red-500",
    label: "bg-red-50 border-red-200 text-red-700",
  },
  Medium: {
    badge: "bg-yellow-100 text-yellow-600",
    bar: "from-yellow-500 to-yellow-400",
    dot: "bg-yellow-500",
    label: "bg-yellow-50 border-yellow-200 text-yellow-700",
  },
  Low: {
    badge: "bg-green-100 text-green-600",
    bar: "from-green-500 to-green-400",
    dot: "bg-green-500",
    label: "bg-green-50 border-green-200 text-green-700",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function InputField({
  icon: Icon,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label} {required && <span className="text-blue-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Icon size={15} />
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
        />
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div
        className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}
      >
        <Icon size={14} />
      </div>
      <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
        {title}
      </h2>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI DETECTION CARD — sidebar component showing AI analysis results
// ─────────────────────────────────────────────────────────────────────────────
function AIDetectionCard({ aiResult, category, imageUploaded, aiAnalysing }) {
  const ai = aiResult;
  const active = !!(category || imageUploaded);
  const styles = ai
    ? SEVERITY_STYLES[ai.severity] || SEVERITY_STYLES.Low
    : null;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
          <Brain size={14} />
        </div>
        <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
          AI Detection
        </h2>
        <div
          className={`ml-auto flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
            aiAnalysing
              ? "bg-purple-50 text-purple-600"
              : active
                ? "bg-green-50 text-green-600"
                : "bg-slate-100 text-slate-400"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              aiAnalysing
                ? "bg-purple-500 animate-ping"
                : active
                  ? "bg-green-500 animate-pulse"
                  : "bg-slate-300"
            }`}
          />
          {aiAnalysing ? "Analysing…" : active ? "Active" : "Idle"}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Detected Issue */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Tag size={13} /> Detected Issue
          </div>
          <span className="text-sm font-semibold text-slate-800">
            {aiAnalysing ? "Analysing..." : ai?.category || category || "—"}
          </span>
        </div>

        {/* AI Severity */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Sparkles size={13} /> AI Severity
          </div>
          {ai && !aiAnalysing ? (
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${styles.label}`}
            >
              {ai.severity}
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              {aiAnalysing ? "Computing…" : "—"}
            </span>
          )}
        </div>

        {/* Priority Level */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <AlertTriangle size={13} /> Priority Level
          </div>
          {ai && !aiAnalysing ? (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                ai.priority === "Critical"
                  ? "bg-red-100 text-red-600"
                  : ai.priority === "Moderate"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-green-100 text-green-600"
              }`}
            >
              {ai.priority}
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              {aiAnalysing ? "…" : "—"}
            </span>
          )}
        </div>

        {/* Confidence Score bar */}
        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <BarChart2 size={13} /> Confidence Score
            </div>
            <span className="text-sm font-bold text-slate-800">
              {ai && !aiAnalysing ? `${ai.confidence}%` : "—"}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${
                styles ? styles.bar : "from-slate-300 to-slate-200"
              }`}
              style={{ width: ai && !aiAnalysing ? `${ai.confidence}%` : "0%" }}
            />
          </div>
        </div>

        {/* Detected keywords pill — shown when keywords influenced the result */}
        {ai && !aiAnalysing && ai.detectedKeywords?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 font-medium w-full mb-0.5">
              Keywords detected:
            </span>
            {ai.detectedKeywords.map((kw) => (
              <span
                key={kw}
                className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Status note */}
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-xs leading-relaxed transition-all ${
            ai && !aiAnalysing
              ? "bg-purple-50 text-purple-700"
              : active
                ? "bg-blue-50 text-blue-600"
                : "bg-slate-50 text-slate-400"
          }`}
        >
          <ShieldCheck size={13} className="mt-0.5 flex-shrink-0" />
          {ai && !aiAnalysing
            ? "Severity and priority automatically determined by AI using category and description analysis."
            : imageUploaded
  ? "AI analysis will start automatically after you submit the report."
  : "Upload an image and submit the report. AI will analyze it in the background."
          }
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAFLET MAP — auto-locates user and drops a marker with blue radius circle
// ─────────────────────────────────────────────────────────────────────────────

// Inner component: uses useMap() hook to fly to user's location
function LocationMarker({ setSelectedPosition, setForm }) {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    map.locate({
      setView: true,
      maxZoom: 15,
      enableHighAccuracy: true,
    });

    map.on("locationfound", async (e) => {
  setPosition(e.latlng);
  setSelectedPosition(e.latlng);

  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );

    const data = await response.json();

    const area =
      data.address.suburb ||
      data.address.neighbourhood ||
      data.address.city ||
      data.address.town ||
      data.address.village ||
      "Unknown Area";

    setForm((prev) => ({
      ...prev,
      location: area,
    }));
  } catch (err) {
    console.log(err);

    setForm((prev) => ({
      ...prev,
      location: "Location detected",
    }));
  }

  map.flyTo(e.latlng, 15);
});

    map.on("locationerror", () => {
      alert("Location permission denied. Please allow location access.");
    });
  }, [map, setSelectedPosition, setForm]);

  if (!position) return null;

  return (
    <>
      <Marker position={position}>
        <Popup>Your current location</Popup>
      </Marker>

      <Circle
        center={position}
        radius={120}
        pathOptions={{
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.3,
        }}
      />
    </>
  );
}

function MapPreview({ setSelectedPosition, setForm }) {
  return (
    <Card>
      <SectionTitle icon={MapPin} title="Live Location Map" />
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <MapContainer
          center={[19.076, 72.8777]}
          zoom={13}
          style={{ height: "260px", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            setSelectedPosition={setSelectedPosition}
            setForm={setForm}
          />{" "}
        </MapContainer>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESS BANNER
// ─────────────────────────────────────────────────────────────────────────────
function SuccessBanner({ onClose }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-white border border-green-200 shadow-xl shadow-green-100 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={18} className="text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">
            Issue Submitted Successfully!
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            Your report has been received. AI-assigned priority will be reviewed
            shortly.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Pothole",
  "Garbage",
  "Water Leakage",
  "Flooding",
  "Broken Streetlight",
  "Road Damage",
  "Other",
];

export default function ReportIssue() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const [form, setForm] = useState({
    name: loggedInUser?.name || "",
    email: loggedInUser?.email || "",
    title: "",
    category: "",
    description: "",
    location: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiAnalysing, setAiAnalysing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [customCategory, setCustomCategory] = useState("");
  const [selectedPosition, setSelectedPosition] = useState(null);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

 

  // ── Category change handler ───────────────────────────────────────────────
  const handleCategory = (e) => {
    const val = e.target.value;
    setCustomCategory("");
    setAiResult(null);
    setForm((prev) => ({ ...prev, category: val }));
    // AI will re-trigger automatically via the useEffect above
  };

  // ── Image upload: ALWAYS preview immediately, no blocking guards ──────────
  const handleImage = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setImageFile(file);
  setImagePreview(URL.createObjectURL(file));

  // Do not call AI here anymore.
  // AI will run in background after submit.
  setAiResult(null);
  setAiAnalysing(false);
};

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.title ||
      !form.category ||
      !form.description
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!selectedPosition) {
  alert("Please allow location access.")
  return
}
    if (form.category === "Other" && !customCategory.trim()) {
      alert("Please describe the issue type in the Other field.");
      return;
    }
    if (!imageFile) {
      alert("Please upload an image of the issue.");
      return;
    }

    setLoading(true);

    try {
      // Attempt backend submit — graceful fallback if offline
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append(
        "category",
        form.category === "Other" ? customCategory : form.category,
      );
      

      formData.append("location", form.location);
      formData.append("latitude", selectedPosition?.lat || "");
      formData.append("longitude", selectedPosition?.lng || "");
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("severity", "Medium");
formData.append("priority", "Moderate");

      const response = await fetch("https://fixcity-0wi0.onrender.com/submit", {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.severity) setAiResult(data);
      }
    } catch (error) {
  console.log("FRONTEND AI ERROR:", error);
}finally {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4500);
      // Reset form
      setForm({
        name: "",
        email: "",
        title: "",
        category: "",
        description: "",
        location: "",
      });
      setAiResult(null);
      setCustomCategory("");
      removeImage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      {submitted && <SuccessBanner onClose={() => setSubmitted(false)} />}

      {/* Page header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">
              Report Civic Issue
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Help improve your city by reporting problems around you.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            AI-Assisted Reporting
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left column (2/3 width) ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Reporter Info */}
              <Card>
                <SectionTitle icon={User} title="Your Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    icon={User}
                    label="Full Name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={set("name")}
                    required
                  />
                  <InputField
                    icon={Mail}
                    label="Email Address"
                    placeholder="john@email.com"
                    value={form.email}
                    onChange={set("email")}
                    required
                    type="email"
                  />
                </div>
              </Card>

              {/* Issue Details */}
              <Card>
                <SectionTitle icon={FileText} title="Issue Details" />
                <div className="flex flex-col gap-4">
                  {/* Title */}
                  <InputField
                    icon={FileText}
                    label="Issue Title"
                    placeholder="e.g. Large pothole on Main Street"
                    value={form.title}
                    onChange={set("title")}
                    required
                  />

                  {/* Category dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Issue Category <span className="text-blue-500">*</span>
                      <span className="ml-2 normal-case font-normal text-purple-500 inline-flex items-center gap-1">
                        <Sparkles size={10} /> AI auto-detects severity
                      </span>
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Tag size={15} />
                      </div>
                      <select
                        value={form.category}
                        onChange={handleCategory}
                        className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select a category</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown size={15} />
                      </div>
                    </div>

                    {/* Other — custom category text input */}
                    {form.category === "Other" && (
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <Tag size={15} />
                        </div>
                        <input
                          type="text"
                          placeholder="Describe the issue type (e.g. Noise Pollution, Stray Animals…)"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                        />
                      </div>
                    )}

                    {/* AI severity result pill — shown after AI completes */}
                    {(aiAnalysing || aiResult) && (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-300 ${
                          aiAnalysing
                            ? "bg-purple-50 border-purple-100 text-purple-600"
                            : aiResult
                              ? `border ${SEVERITY_STYLES[aiResult.severity]?.label || ""}`
                              : ""
                        }`}
                      >
                        {aiAnalysing ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> AI is
                            analysing severity…
                          </>
                        ) : (
                          <>
                            <div
                              className={`w-2 h-2 rounded-full ${SEVERITY_STYLES[aiResult?.severity]?.dot || "bg-slate-400"}`}
                            />
                            <span>
                              AI detected severity:{" "}
                              <strong>{aiResult.severity}</strong>
                            </span>
                            <span className="ml-auto text-[10px] opacity-60">
                              {aiResult.confidence}% confidence
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Description <span className="text-blue-500">*</span>
                      <span className="ml-2 normal-case font-normal text-slate-400 text-[10px]">
                        — AI reads this to assess severity
                      </span>
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <AlignLeft size={15} />
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Describe the issue — e.g. 'huge pothole causing traffic', 'small garbage pile near park'..."
                        value={form.description}
                        onChange={set("description")}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Location */}
              <Card>
                <SectionTitle icon={MapPin} title="Location" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Auto Detected Location{" "}
                    <span className="text-blue-500">*</span>
                  </label>

                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 text-sm font-medium">
                    <MapPin size={15} />
                    {form.location || "Detecting your current location..."}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Your exact GPS location will be sent to the authority.
                  </p>
                </div>
              </Card>

              {/* Image Upload */}
              <Card>
                <SectionTitle icon={ImagePlus} title="Upload Image" />

                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={imagePreview}
                      alt="Issue preview"
                      className="w-full max-h-56 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow border border-slate-200 text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-center gap-2">
                      <CheckCircle2
                        size={13}
                        className="text-green-400 flex-shrink-0"
                      />
                      <p className="text-white text-xs font-medium truncate">
                        {imageFile?.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl p-10 flex flex-col items-center gap-3 text-slate-400 hover:text-blue-500 transition-all group cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-slate-100 group-hover:bg-blue-100 rounded-2xl flex items-center justify-center transition-colors">
                      <Upload size={22} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold">
                        Click to upload image
                      </p>
                      <p className="text-xs mt-1 opacity-70">
                        JPG, PNG, WEBP — up to 10MB
                      </p>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full border border-blue-100 font-medium">
                      AI will analyse the image
                    </span>
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                />
              </Card>

              {/* Submit Button */}
              <button
  type="submit"
  disabled={loading}
  className={`w-full py-3.5 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg transition-all duration-200
    ${
      loading
        ? "bg-blue-400 cursor-not-allowed shadow-blue-200"
        : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-blue-300 hover:shadow-blue-400"
    }`}
>
  {loading ? (
    <>
      <Loader2 size={18} className="animate-spin" /> Submitting Report…
    </>
  ) : (
    <>
      <Zap size={18} /> Submit Report
    </>
  )}
</button>
            </div>

            {/* ── Right sidebar (1/3 width) ── */}
            <div className="flex flex-col gap-6">
              <AIDetectionCard
  aiResult={null}
  category={form.category}
  imageUploaded={!!imageFile}
  aiAnalysing={false}
/>

              <MapPreview
                setSelectedPosition={setSelectedPosition}
                setForm={setForm}
              />
              {/* Reporting Tips */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                    <Zap size={14} />
                  </div>
                  <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
                    Reporting Tips
                  </h2>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {[
                    "Upload a clear photo for better AI analysis",
                    "Use keywords like 'danger' or 'accident' in description for accurate AI severity",
                    "Be specific with the location address",
                    "AI automatically assigns severity — no manual input needed",
                  ].map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed"
                    >
                      <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-[9px] font-bold mt-0.5">
                        {i + 1}
                      </div>
                      {tip}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

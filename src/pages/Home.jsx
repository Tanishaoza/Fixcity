import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ─── Safe localStorage helper (avoids SSR/parse errors) ──────────────────────
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

// ─── Inline SVG Icon ─────────────────────────────────────────────────────────
const Icon = ({ d, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const icons = {
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  plus: "M12 5v14M5 12h14",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  brain:
    "M9.5 2a2.5 2.5 0 015 0M12 9v3m0 0v3m0-3h3m-3 0H9M5.5 7.5A4 4 0 014 11a8 8 0 008 8 8 8 0 008-8 4 4 0 00-1.5-3.5",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  map: "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16",
  bar: "M18 20V10M12 20V4M6 20v-6",
  clipboard:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  monitor: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  alert:
    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  check: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
  twitter:
    "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
  instagram:
    "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z",
  share: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13",
};

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const userToken = getLocal("userToken");
  const adminToken = getLocal("adminToken");

  const isUser = !!userToken;
  const isAdmin = !!adminToken;

  return (
    <section className="pt-16 pb-20 bg-gradient-to-br from-slate-50 via-blue-50/40 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
        {/* Text */}
        <div className="flex-1 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            AI-Powered Civic Tech
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight mb-4">
            Smart Civic Issue
            <br />
            <span className="text-blue-600">Reporting Platform</span>
          </h1>

          <p className="text-slate-500 text-base leading-relaxed mb-8">
            Empowering cities with AI-powered complaint management for faster,
            smarter resolution. Join thousands of citizens making their
            neighborhood better today.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to={isLoggedIn ? "/report" : "/login"}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Icon d={icons.plus} size={16} />
              Report Issue
            </Link>
            <Link
              to={
                isAdmin ? "/admin" : isUser ? "/dashboard" : "/login"
              }
              className="flex items-center gap-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-all"
            >
              <Icon d={icons.grid} size={16} />
              Explore Dashboard
            </Link>
          </div>
        </div>

        {/* Dashboard mockup illustration */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 bg-blue-200/30 rounded-3xl blur-3xl" />
            <div className="relative bg-white border border-slate-100 rounded-3xl shadow-xl p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 bg-slate-100 rounded-full h-2 ml-2" />
              </div>
              <div className="flex items-end gap-2 h-28 mb-4">
                {[60, 80, 45, 95, 70, 55, 85, 65, 90, 50, 75, 88].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        background:
                          i % 3 === 0
                            ? "linear-gradient(180deg,#3b82f6,#93c5fd)"
                            : i % 3 === 1
                              ? "linear-gradient(180deg,#60a5fa,#bfdbfe)"
                              : "#e0eaff",
                      }}
                    />
                  ),
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["12k+", "Resolved"],
                  ["50k", "Users"],
                  ["85", "Cities"],
                ].map(([n, l]) => (
                  <div
                    key={l}
                    className="bg-blue-50 rounded-xl p-2 text-center"
                  >
                    <div className="font-bold text-blue-700 text-sm">{n}</div>
                    <div className="text-slate-400 text-xs">{l}</div>
                  </div>
                ))}
              </div>
              <div className="absolute top-4 right-4 grid grid-cols-4 gap-1 opacity-20">
                {Array(16)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-blue-500" />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: "12,450+", label: "Complaints Resolved" },
    { value: "50k+", label: "Active Users" },
    { value: "85+", label: "Cities Covered" },
  ];
  return (
    <section className="bg-blue-50/70 border-y border-blue-100 py-12">
      <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <div className="text-3xl md:text-4xl font-extrabold text-blue-600 mb-1">
              {value}
            </div>
            <div className="text-slate-500 text-sm font-medium">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: icons.brain,
    title: "AI Issue Detection",
    desc: "Automated classification of reports using computer vision to prioritize critical safety concerns instantly.",
  },
  {
    icon: icons.activity,
    title: "Real-Time Tracking",
    desc: "Follow your report from start to finish with live status updates and direct notifications on progress.",
  },
  {
    icon: icons.map,
    title: "Heatmap Analytics",
    desc: "Visualize city hotspots and recurring trends to allocate municipal resources where they are needed most.",
  },
  {
    icon: icons.bar,
    title: "Smart Dashboard",
    desc: "Data-driven insights for authorities to monitor city-wide health and team response performance.",
  },
  {
    icon: icons.clipboard,
    title: "Complaint Management",
    desc: "Streamlined workflow for city staff to assign, manage, and close tickets without the bureaucratic noise.",
  },
  {
    icon: icons.monitor,
    title: "Social Monitoring",
    desc: "Listening to civic concerns everywhere by aggregating reports from public social media mentions.",
  },
];

function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
            Comprehensive Urban Management
          </h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
            Everything municipal teams and citizens need to collaborate on a
            cleaner, safer city environment.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="group border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/40 rounded-2xl p-6 transition-all duration-200 hover:shadow-md cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-500 mb-4 transition-colors">
                <Icon d={icon} size={18} />
              </div>
              <h3 className="font-bold text-slate-800 mb-2 text-base">
                {title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
const steps = [
  {
    icon: icons.alert,
    label: "Report Issue",
    desc: "Snap a photo and pin the location in seconds.",
  },
  {
    icon: icons.brain,
    label: "AI Analysis",
    desc: "Our AI categorizes and validates your report instantly.",
  },
  {
    icon: icons.monitor,
    label: "Authority Dashboard",
    desc: "Local authorities receive and triage the task.",
  },
  {
    icon: icons.check,
    label: "Resolution",
    desc: "The issue is fixed and you're notified of completion.",
  },
];

function HowItWorks() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
            How It Works
          </h2>
          <p className="text-slate-400 text-sm">
            Simple steps toward a better city.
          </p>
        </div>
        <div className="relative">
          <div className="hidden md:block absolute top-10 left-[calc(12.5%+1.25rem)] right-[calc(12.5%+1.25rem)] h-0.5 bg-blue-100" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {steps.map(({ icon, label, desc }, i) => (
              <div
                key={label}
                className="flex flex-col items-center text-center gap-3 relative"
              >
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 relative z-10">
                  <Icon d={icon} size={22} />
                </div>
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-white border border-blue-100 rounded-full text-blue-600 text-xs font-bold flex items-center justify-center shadow-sm z-20">
                  {i + 1}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm mb-1">
                    {label}
                  </div>
                  <div className="text-slate-400 text-xs leading-relaxed">
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Icon d={icons.home} size={15} />
              </div>
              FixCity
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Empowering smarter cities through citizen-led resolution. One
              report at a time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <div className="font-semibold text-slate-700 text-sm mb-4">
              Quick Links
            </div>
            {["Features", "Success Stories", "Pricing", "Support"].map((l) => (
              <a
                key={l}
                href="#"
                className="block text-slate-400 hover:text-blue-600 text-sm mb-2 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>

          {/* Legal */}
          <div>
            <div className="font-semibold text-slate-700 text-sm mb-4">
              Legal
            </div>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
              (l) => (
                <a
                  key={l}
                  href="#"
                  className="block text-slate-400 hover:text-blue-600 text-sm mb-2 transition-colors"
                >
                  {l}
                </a>
              ),
            )}
          </div>

          {/* Social */}
          <div className="hidden md:block">
            <div className="font-semibold text-slate-700 text-sm mb-4">
              Social Media
            </div>
            <div className="flex gap-3 text-slate-400">
              {[icons.twitter, icons.instagram, icons.share].map((d, i) => (
                <button
                  key={i}
                  className="w-8 h-8 rounded-full border border-slate-200 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center transition-colors"
                >
                  <Icon d={d} size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-10 pt-6 text-center text-slate-400 text-xs">
          © 2024 FixCity. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// ─── Home Page (no Navbar here — App.jsx renders it globally) ─────────────────
export default function Home() {
  return (
    <div className="min-h-screen font-sans antialiased text-slate-800 bg-white">
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Footer />
    </div>
  );
}

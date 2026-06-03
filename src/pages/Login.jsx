import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Eye, EyeOff, Mail, Lock, User, Shield,
  ArrowRight, Building2, Zap, MapPin, CheckCircle2
} from "lucide-react"

// ─── Reusable Input ──────────────────────────────────────────────────────────
function InputField({ icon: Icon, type = "text", placeholder, value, onChange, rightElement }) {
  return (
    <div className="relative group">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
        <Icon size={15} />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
        style={{ WebkitAppearance: "none" }}
      />
      {rightElement && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  )
}

// ─── Compact Brand Left Panel ─────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-5/12 flex-col justify-center p-10 relative overflow-hidden rounded-l-2xl"
      style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%)" }}
    >
      {/* Subtle circle pattern */}
      <div className="absolute top-[-60px] right-[-60px] w-64 h-64 bg-white/5 rounded-full" />
      <div className="absolute bottom-[-40px] left-[-40px] w-48 h-48 bg-white/5 rounded-full" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/30">
          <Building2 size={18} className="text-white" />
        </div>
        <span className="text-white text-xl font-bold tracking-tight">FixCity</span>
      </div>

      {/* Heading */}
      <div className="relative z-10 mb-6">
        <h2 className="text-white text-2xl font-bold leading-snug mb-2">
          Welcome to FixCity
        </h2>
        <p className="text-blue-200 text-sm leading-relaxed">
          AI-powered civic issue reporting and smart city management platform.
        </p>
      </div>

      {/* Small feature list */}
      <div className="relative z-10 flex flex-col gap-3">
        {[
          { icon: Zap,          text: "AI-powered issue detection" },
          { icon: MapPin,       text: "Real-time location tracking" },
          { icon: CheckCircle2, text: "Instant resolution updates" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Icon size={13} className="text-blue-200" />
            </div>
            <span className="text-blue-100 text-sm">{text}</span>
          </div>
        ))}
      </div>

      {/* Bottom badge */}
      <div className="relative z-10 mt-8">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white/80 text-xs">85+ cities using FixCity</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main AuthPage ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate()

  const [mode, setMode]                     = useState("login")
  const [role, setRole]                     = useState("user")
  const [showPass, setShowPass]             = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [rememberMe, setRememberMe]         = useState(false)
  const [loading, setLoading]               = useState(false)

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" })

  const handleChange = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value })

  const switchMode = (m) => {
    setMode(m)
    setForm({ name: "", email: "", password: "", confirmPassword: "" })
    setShowPass(false)
    setShowConfirmPass(false)
  }

  const handleSubmit = async () => {
  if (!form.email || !form.password) {
    alert("Please fill all fields")
    return
  }

  if (mode === "signup") {
    if (!form.name || !form.confirmPassword) {
      alert("Please fill all fields")
      return
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match")
      return
    }
  }

  setLoading(true)

  try {
    let url = ""
    let body = {}

    if (mode === "signup") {
      url = "http://localhost:5000/auth/signup"
      body = {
        name: form.name,
        email: form.email,
        password: form.password,
      }
    } else if (mode === "login" && role === "admin") {
      url = "http://localhost:5000/admin/login"
      body = {
        email: form.email,
        password: form.password,
      }
    } else {
      url = "http://localhost:5000/auth/login"
      body = {
        email: form.email,
        password: form.password,
      }
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || "Something went wrong")
      return
    }

    if (mode === "signup") {
      alert("Account created successfully. Please login now.")
      switchMode("login")
      return
    }

    if (role === "admin") {
      localStorage.setItem("adminToken", data.token)
      localStorage.setItem("admin", JSON.stringify(data.admin))
      navigate("/admin")
    } else {
      localStorage.setItem("userToken", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      navigate("/")
    }

  } catch (error) {
    console.log("Auth error:", error)
    alert("Server error. Please try again.")
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Suppress native browser password eye icon */}
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear,
        input::-webkit-credentials-auto-fill-button,
        input::-webkit-password-auto-fill-button { display: none !important; }
      `}</style>

      {/* Background blobs */}
      <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-blue-300/25 rounded-full blur-3xl" />
      <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-3xl bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-900/10 border border-white/60 flex overflow-hidden">

        <BrandPanel />

        {/* Right form panel */}
        <div className="flex-1 flex flex-col justify-center px-8 py-8 lg:px-10">

          {/* Back to home */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs text-slate-400 hover:text-blue-600 mb-5 flex items-center gap-1 transition-colors w-fit"
          >
            ← Back to Home
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 size={15} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">FixCity</span>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
            {["login", "signup"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize
                  ${mode === m
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"}`}
              >
                {m === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Role selector — login only */}
          {mode === "login" && (
            <div className="flex gap-2 mb-5">
              {[
                { key: "user",  label: "Citizen Login", icon: User },
                { key: "admin", label: "Admin Login",   icon: Shield },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all duration-200
                    ${role === key
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-500"}`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Heading */}
          <div className="mb-4">
            <h1 className="text-lg font-bold text-slate-800">
              {mode === "login"
                ? role === "admin" ? "Admin Sign In" : "Welcome back"
                : "Create your account"}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {mode === "login"
                ? "Enter your credentials to continue"
                : "Join thousands of citizens improving their city"}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
            className="flex flex-col gap-3"
          >
            {mode === "signup" && (
              <InputField
                icon={User}
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange("name")}
              />
            )}

            <InputField
              icon={Mail}
              type="email"
              placeholder={role === "admin" && mode === "login" ? "Admin Email" : "Email address"}
              value={form.email}
              onChange={handleChange("email")}
            />

            <InputField
              icon={Lock}
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange("password")}
              rightElement={
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="text-slate-400 hover:text-blue-500 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            {/* Password strength */}
            {mode === "signup" && form.password && (
              <p className="text-xs text-slate-400 -mt-1">
                Strength:
                <span className={`ml-1 font-semibold ${
                  form.password.length < 6 ? "text-red-500"
                  : form.password.length < 10 ? "text-yellow-500"
                  : "text-green-500"
                }`}>
                  {form.password.length < 6 ? "Weak"
                    : form.password.length < 10 ? "Medium"
                    : "Strong"}
                </span>
              </p>
            )}

            {mode === "signup" && (
              <InputField
                icon={Lock}
                type={showConfirmPass ? "text" : "password"}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                rightElement={
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="text-slate-400 hover:text-blue-500 transition-colors">
                    {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
            )}

            {/* Remember me + Forgot */}
            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                      ${rememberMe ? "bg-blue-600 border-blue-600" : "border-slate-300 group-hover:border-blue-400"}`}
                  >
                    {rememberMe && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`mt-1 w-full text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md
                ${loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-blue-500/25 hover:shadow-blue-500/30"}`}
            >
              {loading
                ? "Please wait..."
                : mode === "login" ? "Sign In" : "Create Account"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google SSO */}
          <button
            type="button"
            className="w-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-medium py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Switch mode */}
          <p className="text-center text-xs text-slate-400 mt-4">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="text-blue-500 hover:text-blue-700 font-semibold transition-colors"
            >
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      <p className="absolute bottom-4 text-slate-400 text-xs z-10">
        © 2024 FixCity · All rights reserved
      </p>
    </div>
  )
}
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

// Safe localStorage helpers — never throws
const getLocal    = (key) => { try { return localStorage.getItem(key) }        catch { return null } }
const getLocalJSON = (key) => { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } }

const Navbar = () => {
  const navigate  = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const userToken  = getLocal("userToken")
  const adminToken = getLocal("adminToken")
  const user       = getLocalJSON("user")
  const isLoggedIn = !!(userToken || adminToken)
  const isAdmin    = !!adminToken

  const handleLogout = () => {
    try {
      localStorage.removeItem("userToken")
      localStorage.removeItem("user")
      localStorage.removeItem("adminToken")
      localStorage.removeItem("admin")
    } catch {}
    navigate("/")
    window.location.reload()
  }

  return (
    <nav className="flex items-center justify-between px-8 py-4 shadow-sm bg-white relative">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 no-underline">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-blue-600">FixCity</h1>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex gap-6 items-center text-sm font-medium text-slate-600">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>

        {/* User links */}
        {userToken && (
          <>
            <Link to="/report"    className="hover:text-blue-600 transition-colors">Report Issue</Link>
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          </>
        )}

        {/* Admin link */}
        {isAdmin && (
          <Link to="/admin" className="hover:text-blue-600 transition-colors">Admin Panel</Link>
        )}

        {/* Auth buttons */}
        {!isLoggedIn ? (
          <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Login
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-slate-600 font-semibold text-sm">
              {isAdmin ? "Admin" : `Hi, ${user?.name?.split(" ")[0] || "User"} 👋`}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile burger */}
      <button
        type="button"
        className="md:hidden text-slate-600 p-1"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {menuOpen
            ? <path d="M18 6L6 18M6 6l12 12" />
            : <path d="M3 12h18M3 6h18M3 18h18" />}
        </svg>
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-md px-6 py-4 flex flex-col gap-4 text-sm font-medium text-slate-600 z-50 md:hidden">
          <Link to="/" onClick={() => setMenuOpen(false)} className="hover:text-blue-600 transition-colors">Home</Link>

          {userToken && (
            <>
              <Link to="/report"    onClick={() => setMenuOpen(false)} className="hover:text-blue-600 transition-colors">Report Issue</Link>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-blue-600 transition-colors">Dashboard</Link>
            </>
          )}

          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="hover:text-blue-600 transition-colors">Admin Panel</Link>
          )}

          <div className="pt-2 border-t border-slate-100">
            {!isLoggedIn ? (
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Login
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-slate-600 font-semibold">
                  {isAdmin ? "Admin" : `Hi, ${user?.name?.split(" ")[0] || "User"} 👋`}
                </span>
                <button type="button" onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
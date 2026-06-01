import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  "px-3 py-2 rounded-lg text-sm font-medium transition " +
  (isActive
    ? "bg-indigo-50 text-indigo-700"
    : "text-slate-600 hover:bg-slate-100");

export default function TopNavbar() {
  const { logout } = useAuth();
  const nav = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;           // "user" | "recruiter" | "admin"
  const isAdmin = user?.is_admin;    // true | false

  const doLogout = () => {
    logout();
    nav("/");
  };

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // ⭐ Role label dial user
  const roleLabel = isAdmin 
    ? "Admin" 
    : role === "recruiter" 
      ? "Recruiter" 
      : "Candidate";

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* LOGO */}
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white text-xs">
            JT
          </span>
          JobTracker
        </div>

        {/* NAVBAR */}
        <nav className="flex items-center gap-2">

          {/* ========== CANDIDATE (USER) LINKS ========== */}
          {role === "user" && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Tableau de bord
              </NavLink>

              <NavLink to="/applications" className={linkClass}>
                Candidatures
              </NavLink>

              <NavLink to="/ai" className={linkClass}>
                Assistant IA
              </NavLink>

              <NavLink to="/notifications" className={linkClass}>
                Notifications
              </NavLink>
            </>
          )}

          {/* ========== RECRUITER LINKS ========== */}
          {role === "recruiter" && (
            <>
              <NavLink to="/recruiter" className={linkClass}>
                Candidatures
              </NavLink>

              <NavLink to="/recruiter/analytics" className={linkClass}>
                Analytics
              </NavLink>
            </>
          )}

          {/* ========== ADMIN LINKS ========== */}
          {isAdmin && (
            <>
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            </>
          )}

          {/* ========== PROFILE (Candidate & Recruiter) ========== */}
          {(role === "user" || role === "recruiter") && (
            <button
              onClick={() => nav("/profile")}
              className="ml-3 flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-slate-100 transition"
            >
              <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                {initials}
              </div>

              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.full_name}
                </p>
                <p className="text-xs text-slate-500">
                  {roleLabel}  {/* ⭐ Candidate | Recruiter | Admin */}
                </p>
              </div>
            </button>
          )}

          {/* ========== ADMIN AVATAR (ma kaynch profile) ========== */}
          {isAdmin && (
            <div className="ml-3 flex items-center gap-3 px-3 py-2">
              <div className="h-10 w-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.full_name}
                </p>
                <p className="text-xs text-red-500 font-medium">
                  {roleLabel}
                </p>
              </div>
            </div>
          )}

          {/* LOGOUT */}
          <button
            onClick={doLogout}
            className="ml-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
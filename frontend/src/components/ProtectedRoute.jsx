// ProtectedRoute.jsx - VERSION SE7A7A
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ 
  children, 
  adminOnly = false,
  recruiterOnly = false,
  userOnly = false 
}) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // 1. Ma mlogich
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // 2. STRICT: Admin ghir /admin
  if (adminOnly && !user.is_admin) {
    return <Navigate to="/" replace />;  // ⭐ REDIRECT L-LOGIN
  }

  // 3. STRICT: Recruiter ghir /recruiter
  if (recruiterOnly && user.role !== "recruiter") {
    return <Navigate to="/" replace />;  // ⭐ REDIRECT L-LOGIN
  }

  // 4. STRICT: User (candidate) ghir user pages
  if (userOnly && user.role !== "user") {
    return <Navigate to="/" replace />;  // ⭐ REDIRECT L-LOGIN
  }

  // 5. EXTRA: Ila admin y7awel y-accessi /dashboard wla /recruiter
  if (user.is_admin && !adminOnly) {
    return <Navigate to="/admin" replace />;  // ⭐ REDIRECT L-ADMIN
  }

  // 6. EXTRA: Ila recruiter y7awel y-accessi /dashboard wla /admin
  if (user.role === "recruiter" && !recruiterOnly) {
    return <Navigate to="/recruiter" replace />;  // ⭐ REDIRECT L-RECRUITER
  }

  // 7. EXTRA: Ila user y7awel y-accessi /admin wla /recruiter
  if (user.role === "user" && (adminOnly || recruiterOnly)) {
    return <Navigate to="/dashboard" replace />;  // ⭐ REDIRECT L-DASHBOARD
  }

  return children;
}
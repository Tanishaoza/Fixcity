import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const userToken = localStorage.getItem("userToken");
  const adminToken = localStorage.getItem("adminToken");

  if (role === "user" && !userToken) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin" && !adminToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
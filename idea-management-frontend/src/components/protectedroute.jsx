import { Navigate } from "react-router-dom";
import { isAuthenticated, getRole } from "../utils/auth";

function ProtectedRoute({ children, requiredRole }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && getRole() !== requiredRole) {
    return <Navigate to={getRole() === "team_lead" ? "/dashboard" : "/myideas"} replace />;
  }

  return children;
}

export default ProtectedRoute;

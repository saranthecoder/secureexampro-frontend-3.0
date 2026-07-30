import { Navigate } from "react-router-dom";

const CoreAdminRoute = ({ children }: { children: JSX.Element }) => {
  const isCoreAdmin = localStorage.getItem("coreAdmin");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAuthenticated = isCoreAdmin === "true" || storedUser?.role === "examiner" || storedUser?.role === "admin";

  if (!isAuthenticated) {
    if (storedUser?.role === "examiner") {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/coreadmin-login" replace />;
  }

  return children;
};

export default CoreAdminRoute;

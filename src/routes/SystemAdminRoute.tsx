import { Navigate } from "react-router-dom";

const SystemAdminRoute = ({ children }: { children: JSX.Element }) => {
  const isCoreAdmin = localStorage.getItem("coreAdmin");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  if (!isCoreAdmin) {
    return <Navigate to="/coreadmin-login" replace />;
  }

  // Strictly restrict access to System Admin Panel for Examiners created by Admin
  if (storedUser && storedUser.role === "examiner") {
    return <Navigate to="/examiner" replace />;
  }

  return children;
};

export default SystemAdminRoute;

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ExamStoreProvider } from "@/contexts/ExamStoreContext";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const ExamPage = lazy(() => import("./pages/ExamPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SignupPage = lazy(() => import("./pages/Signup"));
const CoreAdminLogin = lazy(() => import("./pages/CoreAdminLogin"));

const CoreAdminRoute = lazy(() => import("@/routes/CoreAdminRoute"));

const queryClient = new QueryClient();

const ProtectedRoute = ({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "admin" | "student";
}) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ExamStoreProvider>
          <BrowserRouter>
            <Suspense fallback={
              <div className="h-screen w-screen bg-background flex flex-col items-center justify-center text-foreground font-sans">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30">
                    <span className="text-primary font-bold text-sm select-none">SEP</span>
                  </div>
                </div>
                <div className="mt-5 text-sm text-muted-foreground animate-pulse font-medium tracking-wide">
                  Configuring exam workstation...
                </div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/coreadmin-login" element={<CoreAdminLogin />} />
                <Route
                  path="/coreadmin"
                  element={
                    <CoreAdminRoute>
                      <AdminDashboard />
                    </CoreAdminRoute>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<Navigate to="/login" replace />} />
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute role="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/exam/:code" element={<ExamPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ExamStoreProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

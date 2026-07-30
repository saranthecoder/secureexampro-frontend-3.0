import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, Lock, Sparkles, LogIn, Hash, KeyRound, UserCheck, Mail, Cpu } from "lucide-react";
import Loader from "@/components/Loader";
import Swal from "sweetalert2";
import axiosInstance from "@/config/axiosClient";
import { User } from "@/types/exam";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState<"student" | "examiner" | "admin">("student");

  // Student Form State (Register ID + 6-digit PIN)
  const [registerId, setRegisterId] = useState("");
  const [pin, setPin] = useState("");

  // Examiner Form State
  const [examinerEmail, setExaminerEmail] = useState("");
  const [examinerPassword, setExaminerPassword] = useState("");

  // Admin Form State
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Handler for Candidate Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!registerId.trim() || !pin.trim()) {
      setError("Register ID / Roll Number and 6-digit PIN are required.");
      return;
    }

    if (pin.trim().length !== 6) {
      setError("PIN must be a 6-digit number assigned by your administrator.");
      return;
    }

    setLoading(true);
    try {
      const cleanReg = registerId.trim().toUpperCase();
      const cleanPin = pin.trim();

      const res = await axiosInstance.post("/auth/student-login", {
        registerId: cleanReg,
        rollNumber: cleanReg,
        pin: cleanPin,
      });

      if (res.data && res.data.user) {
        const userWithTimestamp = {
          ...res.data.user,
          loginTimestamp: Date.now(),
        };
        setUser(userWithTimestamp);
        localStorage.setItem("user", JSON.stringify(userWithTimestamp));

        Swal.fire({
          title: "Welcome Candidate",
          text: `Authenticated as ${res.data.user.name || cleanReg}`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        navigate("/student");
      } else {
        setError(res.data.message || "Failed to authenticate candidate credentials.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Network error. Could not connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for Examiner Personnel Login
  const handleExaminerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!examinerEmail.trim() || !examinerPassword.trim()) {
      setError("Examiner Email Address and Password are required.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = examinerEmail.toLowerCase().trim();

      const res = await axiosInstance.post("/auth/login", {
        email: cleanEmail,
        password: examinerPassword.trim(),
      });

      if (res.data && res.data.user) {
        const userObj = res.data.user;
        const userWithTimestamp = {
          ...userObj,
          loginTimestamp: Date.now(),
        };
        setUser(userWithTimestamp);
        localStorage.setItem("user", JSON.stringify(userWithTimestamp));

        Swal.fire({
          title: "Examiner Access Granted",
          text: `Logged in as ${userObj.name || cleanEmail}`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        localStorage.setItem("coreAdmin", "true");
        navigate("/examiner");
      } else {
        setError(res.data.message || "Invalid examiner credentials.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Invalid examiner credentials or server connection failure.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for Core System Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError("Admin Username/Email and Master Password are required.");
      return;
    }

    setLoading(true);
    try {
      const savedAdmin = JSON.parse(
        localStorage.getItem("adminCredentials") ||
        '{"username":"coreadmin","password":"Secure@123","email":"coreadmin@secureexam.com"}'
      );

      const isDefaultAdmin =
        (adminUsername.trim() === savedAdmin.username || adminUsername.trim() === savedAdmin.email) &&
        adminPassword.trim() === savedAdmin.password;

      if (isDefaultAdmin) {
        const adminUser: User = {
          id: "coreadmin_root",
          name: "Core System Admin",
          email: savedAdmin.email || "coreadmin@secureexam.com",
          role: "admin",
          loginTimestamp: Date.now(),
        };
        setUser(adminUser);
        localStorage.setItem("user", JSON.stringify(adminUser));
        localStorage.setItem("coreAdmin", "true");

        Swal.fire({
          title: "Core Admin Authenticated",
          text: "Opening SSMS 3.0 System Admin Console...",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        navigate("/system-admin");
        return;
      }

      // Fallback API login for database admins
      const res = await axiosInstance.post("/auth/login", {
        email: adminUsername.trim(),
        password: adminPassword.trim(),
      });

      if (res.data && res.data.user && res.data.user.role === "admin") {
        const adminUser = {
          ...res.data.user,
          loginTimestamp: Date.now(),
        };
        setUser(adminUser);
        localStorage.setItem("user", JSON.stringify(adminUser));
        localStorage.setItem("coreAdmin", "true");

        Swal.fire({
          title: "Core Admin Authenticated",
          text: "Opening SSMS 3.0 System Admin Console...",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        navigate("/system-admin");
      } else {
        setError("Invalid master admin credentials.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Invalid master admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader message="Authenticating portal session..." />}
      <div className="flex min-h-screen bg-slate-50 font-sans">
        {/* ================= LEFT BRAND SECTION ================= */}
        <div className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex flex-col justify-between text-white p-12">
          <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <img src="/logo.png" alt="SecureExam Pro Logo" className="h-9 w-9 object-contain" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-white text-lg leading-none tracking-tight">SecureExam Pro</span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                SSMS 3.0 Multi-Tier Portal
              </span>
            </div>
          </div>

          {/* Central Pitch */}
          <div className="relative z-10 max-w-md mx-auto space-y-6 my-auto text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs text-blue-400 font-semibold uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5" /> High-Availability Infrastructure
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Candidate, Examiner & Admin Workstations.
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Role-Isolated Operations.
              </span>
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed">
              Candidates access assessments with Register ID + 6-Digit PIN. Examiners author exams and evaluate candidates. Core System Admins manage SSMS 3.0 traffic control and bulk user provisioning.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                Candidate Login via Register ID & 6-Digit PIN
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-purple-400 flex-shrink-0" />
                Examiner Assessment Workstation & Result Release
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                Core System Admin SSMS 3.0 Cluster Traffic Control
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-slate-500 flex justify-between border-t border-slate-900 pt-4">
            <span>SR Ecosystem Development Team</span>
            <span>© 2026 SecureExam Pro</span>
          </div>
        </div>

        {/* ================= RIGHT FORM SECTION ================= */}
        <div className="flex w-full items-center justify-center px-6 lg:w-1/2 bg-slate-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-lg relative">
            <div className="absolute top-6 right-6 text-slate-300">
              <Lock className="h-5 w-5" />
            </div>

            {/* Role 3-Tab Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("student");
                  setError("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "student"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("examiner");
                  setError("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "examiner"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Examiner
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("admin");
                  setError("");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "admin"
                    ? "bg-white text-cyan-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Core Admin
              </button>
            </div>

            {/* Header Title & Description per Role */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
                {activeTab === "student" && (
                  <>
                    <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                    Candidate Portal Login
                  </>
                )}
                {activeTab === "examiner" && (
                  <>
                    <UserCheck className="h-5 w-5 text-purple-600" />
                    Examiner Workstation Access
                  </>
                )}
                {activeTab === "admin" && (
                  <>
                    <Cpu className="h-5 w-5 text-cyan-600" />
                    Core System Admin Console
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === "student" && "Enter your official Register ID / Roll Number and 6-digit PIN."}
                {activeTab === "examiner" && "Log in to manage assessment drives, proctor candidates, and evaluate scores."}
                {activeTab === "admin" && "Infrastructure Director access for SSMS 3.0 Traffic Control & Examiner provisioning."}
              </p>
            </div>

            {/* ================= TAB 1: CANDIDATE LOGIN ================= */}
            {activeTab === "student" && (
              <form onSubmit={handleStudentLogin} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                    Register ID / Roll Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 23691A3343"
                    value={registerId}
                    onChange={(e) => setRegisterId(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-11 text-sm font-bold text-slate-800 rounded-xl uppercase tracking-wider"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                    6-Digit Security PIN <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-11 text-sm font-black text-slate-800 rounded-xl tracking-widest text-center"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 p-3.5 text-xs text-red-600 border border-red-200 flex items-center gap-2 font-medium">
                    <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-12 text-sm shadow-md transition-all mt-6 rounded-xl flex items-center justify-center gap-2"
                >
                  <LogIn className="h-4 w-4" /> Login to Candidate Portal
                </Button>
              </form>
            )}

            {/* ================= TAB 2: EXAMINER LOGIN ================= */}
            {activeTab === "examiner" && (
              <form onSubmit={handleExaminerLogin} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Examiner Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    placeholder="examiner@secureexam.com"
                    value={examinerEmail}
                    onChange={(e) => setExaminerEmail(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-purple-500 h-11 text-sm font-semibold text-slate-800 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    Examiner Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={examinerPassword}
                    onChange={(e) => setExaminerPassword(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-purple-500 h-11 text-sm font-semibold text-slate-800 rounded-xl"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 p-3.5 text-xs text-red-600 border border-red-200 flex items-center gap-2 font-medium">
                    <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black h-12 text-sm shadow-md transition-all mt-6 rounded-xl flex items-center justify-center gap-2"
                >
                  <UserCheck className="h-4 w-4" /> Login to Examiner Workstation
                </Button>
              </form>
            )}

            {/* ================= TAB 3: CORE SYSTEM ADMIN LOGIN ================= */}
            {activeTab === "admin" && (
              <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-cyan-600" />
                    Admin Username or Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. coreadmin"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-cyan-500 h-11 text-sm font-bold text-slate-800 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    Master Security Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-cyan-500 h-11 text-sm font-semibold text-slate-800 rounded-xl"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 p-3.5 text-xs text-red-600 border border-red-200 flex items-center gap-2 font-medium">
                    <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-900 text-cyan-400 border border-slate-800 font-black h-12 text-sm shadow-md transition-all mt-6 rounded-xl flex items-center justify-center gap-2"
                >
                  <Cpu className="h-4 w-4 text-cyan-400" /> Access System Admin Console
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;

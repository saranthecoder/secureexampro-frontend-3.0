import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut, Laptop, Wifi, Video, CheckCircle2, FileText, Play } from "lucide-react";

import BASE_URL from "@/config/api";

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [examCode, setExamCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 Protect Route
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleJoinExam = async () => {
    const trimmedCode = examCode.trim().toUpperCase();

    if (!trimmedCode) {
      setError("Please enter exam code");
      return;
    }

    const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (!parsedUser?.email) {
      setError("User session expired. Please login again.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${BASE_URL}/exam/${trimmedCode}?email=${parsedUser.email}`,  
      );

      const data = await res.json();

      // 🚨 If already attempted (403)
      if (res.status === 403) {
        setError(data.message);
        return;
      }

      if (!res.ok) {
        setError(data.message || "Invalid exam code");
        return;
      }

      // Store exam code
      localStorage.setItem("currentExamCode", trimmedCode);

      navigate(`/exam/${trimmedCode}`);
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      
      {/* ================= HEADER ================= */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SecureExam Pro Logo" className="h-9 w-9 object-contain" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-900 text-base leading-none tracking-tight">SecureExam Pro</span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Placement Assessment</span>
            </div>
            <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold py-0 px-2 rounded ml-2">
              Candidate Portal
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">{user?.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600 hover:bg-slate-50 text-xs font-semibold gap-1.5" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* ================= BODY ================= */}
      <div className="container mx-auto px-6 py-12 flex-grow flex items-center">
        <div className="grid gap-8 lg:grid-cols-12 w-full items-stretch max-w-5xl mx-auto">
          
          {/* Left Column: Suitability Checklist & Guidelines */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs text-blue-600 font-semibold">
                <Laptop className="h-3.5 w-3.5" />
                System Suitability Checklist
              </div>
              <h2 className="text-xl font-bold text-slate-900">Configure Hardware Settings</h2>
              <p className="text-slate-500 text-xs leading-relaxed">
                Please verify that your hardware components conform to the corporate recruitment environment guidelines before entering the exam lobby.
              </p>

              {/* Hardware items checklist */}
              <div className="space-y-3 pt-2 text-xs">
                
                {/* Item 1 */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <Video className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      Webcam & Video Feed
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold uppercase">Required</span>
                    </div>
                    <p className="text-slate-500 text-[10.5px] mt-0.5">Used for real-time face matching and automated head-turn tracking.</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <Wifi className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800">Internet Connectivity Check</div>
                    <p className="text-slate-500 text-[10.5px] mt-0.5">Ensure a stable network connection of at least 1 Mbps to load question structures.</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800">Browser Security Lockout</div>
                    <p className="text-slate-500 text-[10.5px] mt-0.5">Strict tab switch limit (3 flags) and fullscreen enforcement are enabled.</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" /> Supported on Chrome, Edge, and Safari browser packages.
            </div>
          </div>

          {/* Right Column: Enter Key Card */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-white flex flex-col justify-center relative overflow-hidden shadow-xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />

            <div className="space-y-6 relative z-10 text-center">
              <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Play className="h-5 w-5 fill-current" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight">Access Assessment</h1>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Enter the exam access key provided by your examiner to initiate identity scan and load instructions.
                </p>
              </div>

              <div className="space-y-4 max-w-xs mx-auto">
                <Input
                  placeholder="ENTER ACCESS CODE"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                  className="bg-slate-950/80 border-slate-700/80 focus-visible:ring-blue-500 h-12 text-center font-mono text-lg font-bold tracking-widest text-blue-400 placeholder:text-slate-600"
                  onKeyDown={(e) => e.key === "Enter" && handleJoinExam()}
                />

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  onClick={handleJoinExam}
                  disabled={!examCode.trim() || loading}
                >
                  <FileText className="h-4 w-4" />
                  {loading ? "Checking Keys..." : "Verify & Launch"}
                </Button>
              </div>

              {error && (
                <div className="rounded-lg bg-red-950/40 p-3 text-xs text-red-400 border border-red-900/30 flex items-center gap-2 max-w-sm mx-auto text-left">
                  <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 text-xs text-slate-400 md:flex-row">
          <span>Candidate Session Active</span>
          <span className="text-center">
            SecureExam Pro • Developed under SR Ecosystem
          </span>
          <span>Version 2026.1</span>
        </div>
      </footer>
    </div>
  );
};

export default StudentDashboard;

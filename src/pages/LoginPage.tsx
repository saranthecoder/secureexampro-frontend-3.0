import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, Lock, UserCheck, Mail, Sparkles, LogIn, Hash, User } from "lucide-react";
import Loader from "@/components/Loader";
import Swal from "sweetalert2";
import BASE_URL from "@/config/api";

const AuthPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !rollNumber.trim()) {
      setError("Candidate Email Address and Roll Number are required.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const cleanRoll = rollNumber.trim().toUpperCase();

      const res = await fetch(`${BASE_URL}/auth/student-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          rollNumber: cleanRoll,
          name: name.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.user) {
        const userWithTimestamp = {
          ...data.user,
          loginTimestamp: Date.now()
        };
        setUser(userWithTimestamp);
        localStorage.setItem("user", JSON.stringify(userWithTimestamp));

        Swal.fire({
          title: "Welcome Candidate",
          text: `Logged in successfully as ${data.user.name || cleanEmail}`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });

        navigate("/student");
      } else {
        // Fallback to /auth/login
        const fallbackRes = await fetch(`${BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            rollNumber: cleanRoll,
            name: name.trim()
          })
        });
        const fallbackData = await fallbackRes.json();

        if (fallbackRes.ok && fallbackData.user) {
          const userWithTimestamp = {
            ...fallbackData.user,
            loginTimestamp: Date.now()
          };
          setUser(userWithTimestamp);
          localStorage.setItem("user", JSON.stringify(userWithTimestamp));
          navigate("/student");
        } else {
          setError(data.message || fallbackData.message || "Failed to authenticate candidate credentials.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Could not connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader message="Authenticating candidate credentials..." />}
      <div className="flex min-h-screen bg-slate-50 font-sans">
        
        {/* ================= LEFT BRAND SECTION ================= */}
        <div className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex flex-col justify-between text-white p-12">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <img src="/logo.png" alt="SecureExam Pro Logo" className="h-9 w-9 object-contain" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-white text-lg leading-none tracking-tight">SecureExam Pro</span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">SR Ecosystem Platform</span>
            </div>
          </div>

          {/* Central Pitch */}
          <div className="relative z-10 max-w-md mx-auto space-y-6 my-auto text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs text-blue-400 font-semibold uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5" />
              Direct Credential Authentication
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Candidate Portal
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Secure Exam Access.
              </span>
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed">
              Log in directly using your registered Email Address and Roll Number. Enter your credentials to access active assessment drives, lobby rooms, and exam reports.
            </p>

            {/* Checklist */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                Instant Email & Roll Number authentication
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                Live candidate telemetry and AI proctor monitoring
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                Automated scorecard and result distribution
              </div>
            </div>
          </div>

          {/* Footer Branding */}
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

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
                <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                Candidate Login
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Enter your Email Address and Roll Number to access your assessment dashboard.
              </p>
            </div>

            {/* Direct Login Form */}
            <form onSubmit={handleDirectLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Full Name (Optional)
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Lakshmi Sagar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-11 text-sm font-semibold text-slate-800 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Candidate Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-11 text-sm font-semibold text-slate-800 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                  Roll Number / Hall Ticket Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. 23691A3343"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-11 text-sm font-bold text-slate-800 rounded-xl uppercase tracking-wider"
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
                <LogIn className="h-4 w-4" /> Access Candidate Dashboard
              </Button>

              <div className="pt-4 text-center">
                <p className="text-[11px] text-slate-400">
                  Secured Candidate Authentication • No OTP Required
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;

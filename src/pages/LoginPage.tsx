import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, Lock, UserCheck } from "lucide-react";
import Loader from "@/components/Loader";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);

    let success = false;

    if (isLogin) {
      success = await login(email, password, "student");
    } else {
      success = await signup(name, email, password, "student");
    }

    if (success) {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      if (storedUser.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } else {
      setError(isLogin ? "Invalid email or password" : "Signup failed");
    }

    setLoading(false);
  };

  return (
    <>
      {loading && <Loader />}
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
              Anti-Cheat Framework
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              MNC-Grade Assessment
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Compliance Verification.
              </span>
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed">
              Log in with your candidate credentials to access the secure qualifier exams. The proctoring system requires camera connection, fullscreen mode, and direct head tracking.
            </p>

            {/* Checklist */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                AI Proctoring (Face tracking & coverage checks)
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                Keyboard & Tab switch monitoring
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                Instant sheet grading & Excel exports for administrators
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
            
            {/* Corner security icon badge */}
            <div className="absolute top-6 right-6 text-slate-300">
              <Lock className="h-5 w-5" />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {isLogin ? "Candidate Verification" : "Candidate Registration"}
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                {isLogin
                  ? "Enter registration details to access the assessment"
                  : "Register as a candidate to participate in qualifier exam pools"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                  <div className="relative">
                    <Input
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-10 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Candidate Email</Label>
                <Input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-10 text-sm"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 text-sm shadow-md transition-all mt-4"
              >
                {isLogin ? "Verify & Proceed" : "Register Candidate"}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center text-xs text-slate-500">
              {isLogin ? (
                <>
                  Need to register a new account?{" "}
                  <span
                    className="text-blue-600 font-bold cursor-pointer hover:underline"
                    onClick={() => setIsLogin(false)}
                  >
                    Create Profile
                  </span>
                </>
              ) : (
                <>
                  Already have a registered profile?{" "}
                  <span
                    className="text-blue-600 font-bold cursor-pointer hover:underline"
                    onClick={() => setIsLogin(true)}
                  >
                    Login here
                  </span>
                </>
              )}
            </div>
            
            {/* Developer watermark */}
            <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4 flex items-center justify-center gap-1.5">
              <UserCheck className="h-3 w-3" /> Powered by SR Ecosystem Assessment Portal
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, Lock, UserCheck, KeyRound, Mail, Sparkles } from "lucide-react";
import Loader from "@/components/Loader";
import Swal from "sweetalert2";
import BASE_URL from "@/config/api";

const AuthPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [otp, setOtp] = useState("");
  
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !rollNumber) {
      setError("Please enter Name, Email, and Roll Number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, rollNumber })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        Swal.fire({
          title: "OTP Dispatched",
          text: `A 6-digit OTP code has been sent to ${email}.`,
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
      } else if (res.status === 500 && data.message && data.message.includes("logged to the server console")) {
        // SMTP failed but OTP was saved in DB and logged to server console
        setOtpSent(true);
        Swal.fire({
          title: "Mail Service Unavailable",
          text: "The OTP has been generated. Please check the server console for the OTP code, or contact your exam administrator.",
          icon: "warning",
          confirmButtonColor: "#f59e0b"
        });
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to request OTP. Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/student");
      } else {
        setError(data.message || "Incorrect verification OTP.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to verify OTP. Network error.");
    } finally {
      setLoading(false);
    }
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
              OTP Secured Verification
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Identity Authentication.
              </span>
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed">
              Authenticate quickly using your credentials. No registration or password required. An OTP will be dispatched immediately to your email address to grant assessment access.
            </p>

            {/* Checklist */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                Dual-factor OTP mail verification
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                Live identity and head posture check
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                Instant results mailing system
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
                Candidate Lobby
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                {!otpSent 
                  ? "Enter assessment details to receive verification OTP" 
                  : "Input the 6-digit OTP code sent to your email"}
              </p>
            </div>

            {/* Form */}
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-10 text-sm font-semibold text-slate-800 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Candidate Email</Label>
                  <Input
                    type="email"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-10 text-sm font-semibold text-slate-800 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Roll Number</Label>
                  <Input
                    placeholder="e.g. 26CS104"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-10 text-sm font-semibold text-slate-800 rounded-xl uppercase tracking-wider"
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md transition-all mt-4 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Mail className="h-4 w-4" /> Send OTP to Mail
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-slate-700">Enter Verification OTP</Label>
                    <span 
                      className="text-[10px] text-blue-600 font-bold cursor-pointer hover:underline"
                      onClick={() => setOtpSent(false)}
                    >
                      Change Details
                    </span>
                  </div>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-11 text-center text-lg font-black tracking-[8px] text-slate-800 rounded-xl"
                    maxLength={6}
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md transition-all mt-4 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="h-4 w-4" /> Verify & Login
                </Button>
              </form>
            )}
            
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

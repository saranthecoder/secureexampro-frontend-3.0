import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, Lock, UserCheck, KeyRound, Mail, Sparkles, UserPlus, LogIn, AlertTriangle, RefreshCw } from "lucide-react";
import Loader from "@/components/Loader";
import Swal from "sweetalert2";
import BASE_URL from "@/config/api";

const AuthPage = () => {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [otp, setOtp] = useState("");
  
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("");

  const getOtpStaggerDelay = (emailStr: string) => {
    let hash = 0;
    for (let i = 0; i < emailStr.length; i++) {
      hash = emailStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 30;
  };

  // OTP Rate Limit tracking
  const [otpCount, setOtpCount] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setName("");
    setEmail("");
    setRollNumber("");
    setOtp("");
    setOtpSent(false);
    setError("");
    setOtpCount(0);
    setRemainingAttempts(5);
  };

  const switchMode = (mode: "login" | "signup", preserveEmail = false) => {
    if (mode !== authMode) {
      const currentEmail = email;
      resetForm();
      setAuthMode(mode);
      if (preserveEmail) {
        setEmail(currentEmail);
      }
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (authMode === "signup") {
      if (!name || !email || !rollNumber) {
        setError("Please enter Name, Email, and Roll Number.");
        return;
      }
    } else {
      if (!email) {
        setError("Please enter your Email address.");
        return;
      }
    }

    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const delaySeconds = getOtpStaggerDelay(cleanEmail);
      if (delaySeconds > 0) {
        for (let s = delaySeconds; s > 0; s--) {
          setLoaderMessage(`Queued to prevent server overload (${s}s remaining)...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      setLoaderMessage("");

      const payload: any = { email, mode: authMode };
      if (authMode === "signup") {
        payload.name = name;
        payload.rollNumber = rollNumber;
      }

      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.status === 429) {
        // Rate limit exceeded
        setError(data.message || "Maximum OTP attempts reached.");
        setOtpCount(data.otpCount || 5);
        setRemainingAttempts(data.remainingAttempts || 0);
        return;
      }

      // Intercept Student Not Found on Login -> Direct to Sign Up
      if (res.status === 404 || (data.message && data.message.includes("Sign Up"))) {
        const attemptedEmail = email;
        Swal.fire({
          title: "Account Not Registered",
          text: `No student account was found for ${attemptedEmail}. Redirecting you to Sign Up.`,
          icon: "warning",
          confirmButtonColor: "#3b82f6",
          confirmButtonText: "Go to Sign Up Form"
        }).then(() => {
          switchMode("signup", true);
          setError("Email not found in database. Please enter your Name & Roll Number to Sign Up.");
        });
        return;
      }

      if (res.ok) {
        setOtpSent(true);
        setOtpCount(data.otpCount || 0);
        setRemainingAttempts(data.remainingAttempts ?? 5);
        Swal.fire({
          title: "OTP Dispatched",
          text: `A 6-digit OTP code has been sent to ${email}. (${data.otpCount || 1}/5 attempts used)`,
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
      } else if (res.status === 500 && data.message && data.message.includes("logged to the server console")) {
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

  const handleResendOtp = async () => {
    if (remainingAttempts <= 0) {
      setError("Maximum 5 OTP email attempts reached for this email ID. Please try again after 12 hours.");
      return;
    }

    // Confirm resend with warning
    const result = await Swal.fire({
      title: "Resend OTP?",
      html: `
        <p style="font-size: 13px; color: #475569; margin-bottom: 8px;">A new OTP will be sent to <strong>${email}</strong>.</p>
        <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 10px; margin-top: 8px;">
          <p style="font-size: 12px; color: #92400e; font-weight: 600; margin: 0;">
            ⚠️ Warning: Maximum 5 OTP emails allowed per email ID.<br/>
            You have used <strong>${otpCount}/5</strong> attempts. Remaining: <strong>${remainingAttempts}</strong>.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Yes, Resend OTP"
    });

    if (!result.isConfirmed) return;

    setOtp("");
    setError("");
    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const delaySeconds = getOtpStaggerDelay(cleanEmail);
      if (delaySeconds > 0) {
        for (let s = delaySeconds; s > 0; s--) {
          setLoaderMessage(`Queued to prevent server overload (${s}s remaining)...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      setLoaderMessage("");

      const payload: any = { email, mode: authMode };
      if (authMode === "signup") {
        payload.name = name;
        payload.rollNumber = rollNumber;
      }

      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.status === 429) {
        setError(data.message || "Maximum OTP attempts reached.");
        setOtpCount(data.otpCount || 5);
        setRemainingAttempts(data.remainingAttempts || 0);
        return;
      }

      if (res.ok) {
        setOtpCount(data.otpCount || 0);
        setRemainingAttempts(data.remainingAttempts ?? 5);
        Swal.fire({
          title: "OTP Resent",
          text: `A new OTP has been sent to ${email}. (${data.otpCount}/5 attempts used)`,
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
      } else if (res.status === 500 && data.message && data.message.includes("logged to the server console")) {
        Swal.fire({
          title: "Mail Service Unavailable",
          text: "The OTP has been regenerated. Please check the server console for the OTP code.",
          icon: "warning",
          confirmButtonColor: "#f59e0b"
        });
      } else {
        setError(data.message || "Failed to resend OTP.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to resend OTP. Network error.");
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
      // Stagger queue to prevent 500 simultaneous verify-otp calls
      const cleanEmail = email.toLowerCase().trim();
      const delaySeconds = getOtpStaggerDelay(cleanEmail);
      if (delaySeconds > 0) {
        for (let s = delaySeconds; s > 0; s--) {
          setLoaderMessage(`Queued to prevent server overload (${s}s remaining)...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      setLoaderMessage("");

      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        const userWithTimestamp = {
          ...data.user,
          loginTimestamp: Date.now()
        };
        setUser(userWithTimestamp);
        localStorage.setItem("user", JSON.stringify(userWithTimestamp));
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
      {loading && <Loader message={loaderMessage} />}
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
              Authenticate quickly using your credentials. Sign up with your details or login with your email. An OTP will be dispatched immediately to your email address to grant assessment access.
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
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                5 OTP attempts limit per email (anti-abuse)
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
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
                <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                Candidate Lobby
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                {!otpSent 
                  ? (authMode === "signup" 
                    ? "Create your account to access the exam portal" 
                    : "Login with your email to receive a verification OTP")
                  : "Input the 6-digit OTP code sent to your email"}
              </p>
            </div>

            {/* Mode Toggle Tabs */}
            {!otpSent && (
              <div className="flex mb-6 bg-slate-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => switchMode("login")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                    authMode === "login"
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Log In
                </button>
                <button
                  onClick={() => switchMode("signup")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                    authMode === "signup"
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Sign Up
                </button>
              </div>
            )}

            {/* Form */}
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4 text-left">
                {authMode === "signup" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-10 text-sm font-semibold text-slate-800 rounded-xl"
                    />
                  </div>
                )}

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

                {authMode === "signup" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Roll Number</Label>
                    <Input
                      placeholder="e.g. 26CS104"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-10 text-sm font-semibold text-slate-800 rounded-xl uppercase tracking-wider"
                    />
                  </div>
                )}

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

                {/* Switch mode hint */}
                <p className="text-center text-[11px] text-slate-400 mt-3">
                  {authMode === "login" ? (
                    <>Don't have an account?{" "}
                      <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => switchMode("signup")}>Sign Up</span>
                    </>
                  ) : (
                    <>Already have an account?{" "}
                      <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => switchMode("login")}>Log In</span>
                    </>
                  )}
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                {/* OTP Rate Limit Warning */}
                {otpCount > 0 && (
                  <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">OTP Attempt Limit Warning</p>
                      <p className="mt-0.5">Maximum 5 OTP emails allowed per email ID. You have used <strong>{otpCount}/5</strong> attempts. Remaining: <strong>{remainingAttempts}</strong>.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-slate-700">Enter Verification OTP</Label>
                    <span 
                      className="text-[10px] text-blue-600 font-bold cursor-pointer hover:underline"
                      onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
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
                  <KeyRound className="h-4 w-4" /> Verify & {authMode === "signup" ? "Create Account" : "Login"}
                </Button>

                {/* Resend OTP */}
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={remainingAttempts <= 0}
                    className={`text-[11px] font-bold inline-flex items-center gap-1 transition-all ${
                      remainingAttempts > 0
                        ? "text-blue-600 hover:underline cursor-pointer"
                        : "text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Resend OTP {remainingAttempts > 0 ? `(${remainingAttempts} left)` : "(limit reached)"}
                  </button>
                </div>
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Home, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_ADMIN = {
  username: "coreadmin",
  password: "Secure@123"
};

const CoreAdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      username === DEFAULT_ADMIN.username &&
      password === DEFAULT_ADMIN.password
    ) {
      setLoading(true);
      localStorage.setItem("coreAdmin", "true");
      navigate("/coreadmin");
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-white font-sans items-center justify-center p-6 relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-teal-500/5 blur-[80px] pointer-events-none" />

      {/* Top Navbar Actions */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SecureExam Pro Logo" className="h-8 w-8 object-contain" />
          <span className="font-bold text-sm tracking-tight text-slate-200">SecureExam Pro</span>
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold gap-1.5"
        >
          <Home className="h-4 w-4" /> Home Page
        </Button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative">
        <div className="absolute top-6 right-6 text-slate-700">
          <Lock className="h-5 w-5" />
        </div>

        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Core Admin Access</h2>
          <p className="text-xs text-slate-500">
            Authorized examiner personnel credentials required
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <Label className="text-xs font-bold text-slate-400">Admin Username</Label>
            <Input
              placeholder="e.g. coreadmin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-900 border-slate-800 focus-visible:ring-blue-500 text-white h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-xs font-bold text-slate-400">Admin Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-900 border-slate-800 focus-visible:ring-blue-500 text-white h-10 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-950/40 p-3 text-xs text-red-400 border border-red-900/30 flex items-center gap-2 text-left">
              <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md transition-all mt-4 rounded-xl"
          >
            {loading ? "Verifying..." : "Access Admin Console"}
          </Button>
        </form>

        {/* Back button link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs text-slate-500 hover:text-slate-300 inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Back to student lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoreAdminLogin;

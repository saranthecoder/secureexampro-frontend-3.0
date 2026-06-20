import { Shield, Clock, Users, Lock, ArrowRight, CheckCircle2, BarChart2, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Shield,
    title: "AI Face Proctoring",
    description:
      "Real-time webcam tracking with head turn detection and auto-disqualification to maintain exam integrity.",
  },
  {
    icon: Lock,
    title: "Secure Browser Environment",
    description:
      "Fullscreen enforcement, tab-switch lockouts, and context menu/shortcut prevention to secure tests.",
  },
  {
    icon: Clock,
    title: "Smart Sequential Engine",
    description:
      "Strict sequential navigation with forward-only pacing and auto-submit timers for placement drives.",
  },
  {
    icon: BarChart2,
    title: "Admin Analytics",
    description:
      "Track live progress, export Excel sheets, clone question pools, and inspect proctor flags instantly.",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden">

      {/* ================= NAVBAR ================= */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50">
        <nav className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SecureExam Pro Logo" className="h-10 w-10 object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                SecureExam Pro
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                Placement Assessment
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              onClick={() => navigate("/coreadmin-login")}
            >
              Admin Dashboard
            </Button>

            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
              onClick={() => navigate("/login")}
            >
              Start Candidate Scan
            </Button>
          </div>
        </nav>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative py-24 md:py-32 bg-slate-900 text-white overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 h-[400px] w-[400px] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm text-blue-400 font-medium">
                <Shield className="h-4 w-4" />
                Enterprise Placement Drive Standards
              </div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-white">
                Assess Candidates
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                  With 100% Integrity.
                </span>
              </h1>

              <p className="max-w-xl text-lg text-slate-300 leading-relaxed">
                SecureExam Pro is a next-generation MNC-grade recruitment exam engine. Equipped with AI webcam face proctoring, secure lockouts, and forward-only sequential pacing.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 text-base font-bold shadow-md hover:shadow-lg transition-all"
                  onClick={() => navigate("/login")}
                >
                  Join Assessment Portal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right Proctor Preview Card Mock */}
            <div className="lg:col-span-5 relative">
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
                
                {/* Header of Mock */}
                <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                      Live Proctoring Feed
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-400 font-mono">
                    SECURE-SESSION-X9
                  </span>
                </div>

                {/* Webcam Mock */}
                <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 border border-blue-500/10 pointer-events-none grid grid-cols-3 grid-rows-3" />
                  
                  {/* Target Scanner */}
                  <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-dashed border-blue-500/20 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-blue-400 absolute top-0 left-0" />
                    <div className="w-6 h-6 border-t-2 border-r-2 border-blue-400 absolute top-0 right-0" />
                    <div className="w-6 h-6 border-b-2 border-l-2 border-blue-400 absolute bottom-0 left-0" />
                    <div className="w-6 h-6 border-b-2 border-r-2 border-blue-400 absolute bottom-0 right-0" />
                    
                    <div className="text-[10px] font-mono text-blue-400/60 uppercase">
                      Target Area
                    </div>
                  </div>

                  {/* Horizontal Scan Bar */}
                  <div className="absolute inset-x-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6] top-0 animate-[scan_2.5s_ease-in-out_infinite]" />

                  {/* Status Banner */}
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">Identity Scan</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-bold uppercase">
                      Verifying...
                    </span>
                  </div>
                </div>

                {/* Checklist Below Video */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-700/50">
                    <span className="text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Camera Permission
                    </span>
                    <span className="text-slate-300 font-semibold">Granted</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-700/50">
                    <span className="text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Keyboard Lock
                    </span>
                    <span className="text-slate-300 font-semibold">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Fullscreen Request
                    </span>
                    <span className="text-slate-300 font-semibold">Ready</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= STATISTICS BANNER ================= */}
      <section className="bg-blue-600 text-white py-8 border-y border-blue-700 shadow-inner">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-extrabold md:text-4xl">100%</div>
              <div className="text-xs text-blue-100 font-medium uppercase tracking-wider mt-1">
                Accuracy Rate
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold md:text-4xl">10K+</div>
              <div className="text-xs text-blue-100 font-medium uppercase tracking-wider mt-1">
                Assessments Done
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold md:text-4xl">0%</div>
              <div className="text-xs text-blue-100 font-medium uppercase tracking-wider mt-1">
                Bypass Incidents
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold md:text-4xl">Instant</div>
              <div className="text-xs text-blue-100 font-medium uppercase tracking-wider mt-1">
                Excel Sheet Export
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECURITY BANNER STRIP ================= */}
      <section className="relative overflow-hidden bg-slate-900 border-b border-slate-800 py-4 text-slate-400">
        <div className="relative flex overflow-hidden">
          <div className="flex min-w-full animate-marquee items-center gap-16 whitespace-nowrap">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-blue-400" /> Web Proctor Live Logs
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5 text-blue-400" /> Fullscreen Enforced
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5 text-blue-400" /> Copy/Paste Disabled
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-blue-400" /> Dynamic Section Timers
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Users className="h-3.5 w-3.5 text-blue-400" /> AI Asymmetry Scanning
            </span>
            {/* Duplicate for seamless marquee */}
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-blue-400" /> Web Proctor Live Logs
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5 text-blue-400" /> Fullscreen Enforced
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5 text-blue-400" /> Copy/Paste Disabled
            </span>
          </div>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Engineered for Placement Standards
            </h2>
            <p className="text-slate-500">
              High-security assessment platform tailored for recruitment drives, qualifier assessments, and high-stakes coding evaluations.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-8 hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6 inline-flex rounded-xl bg-blue-600/10 p-3.5 text-blue-600">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 font-bold text-lg text-slate-900">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PLATFORM SHOWCASE / TRUST ================= */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <Award className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="text-3xl font-extrabold text-slate-950">
              Robust. Flexible. Compliance-Ready.
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Designed from the ground up under the SR Ecosystem to manage high-throughput evaluations. Simply upload your questions spreadsheet, configure timing lockouts, and share code access keys with candidates instantly.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-6 text-sm text-slate-500 md:flex-row">
          
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SecureExam Pro Logo" className="h-8 w-8 object-contain opacity-85" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-800 leading-none">SecureExam Pro</span>
              <span className="text-[9px] text-slate-400 mt-0.5">SR Ecosystem Platform</span>
            </div>
          </div>

          <div className="text-center md:text-right">
            Developed by{" "}
            <span className="font-bold text-slate-800">
              Saran Velmurugan
            </span>
            <br />
            <span className="text-xs text-slate-400">
              Under SR Ecosystem • All Rights Reserved 2026
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

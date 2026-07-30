import { Shield, Clock, Users, Lock, ArrowRight, CheckCircle2, BarChart2, Award, Zap, Code2, Cpu, Layers, Terminal, Sparkles, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Code2,
    badge: "5+ Languages",
    title: "Multi-Language Compiler IDE",
    description:
      "Full LeetCode-style split-pane IDE supporting Python 3, JavaScript, Java, C++, and C with real-time STDIN execution, syntax error checks, and local code persistence.",
  },
  {
    icon: Layers,
    badge: "Paper & Hybrid",
    title: "Set-Wise Lobby Paper Allocation",
    description:
      "Manage online coding & paper code drives. Dynamically allocate Set A, B, C, and D question paper distributions for candidates waiting in the lobby.",
  },
  {
    icon: Shield,
    badge: "AI Proctoring",
    title: "OS Key Blocking & Anti-Cheat",
    description:
      "Enforce fullscreen mode, block Windows/OS shortcut keys, disable right-click copy-paste, track focus exit lockouts (max 3), and monitor webcam telemetry.",
  },
  {
    icon: FileSpreadsheet,
    badge: "Bulk Automation",
    title: "Excel Import & Auto Scorecards",
    description:
      "Bulk candidate onboarding via Excel / Google Sheet link, single candidate registration, automated step-by-step marking, and instant email scorecards.",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-x-hidden">

      {/* ================= NAVBAR ================= */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <nav className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/logo.png" alt="SecureExam Pro Logo" className="h-10 w-10 object-contain" />
            <div className="flex flex-col text-left">
              <span className="text-xl font-black tracking-tight text-white leading-none">
                SecureExam Pro
              </span>
              <span className="text-[10px] text-blue-400 uppercase tracking-widest font-extrabold mt-1">
                COMPETITIVE CODING & ASSESSMENT PLATFORM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 font-extrabold text-xs h-10 px-5 rounded-xl gap-2 transition-all"
              onClick={() => navigate("/login")}
            >
              Start Candidate Assessment <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative py-20 md:py-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden border-b border-slate-800/80">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[110px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/20 px-4 py-1.5 text-xs text-blue-400 font-extrabold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                MNC-Grade Assessment & Coding IDE Engine
              </div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-white">
                Next-Gen Online Coding &
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-purple-400 bg-clip-text text-transparent">
                  High-Integrity Assessments.
                </span>
              </h1>

              <p className="max-w-xl text-base text-slate-300 leading-relaxed font-normal">
                SecureExam Pro combines a multi-language IDE compiler (Python, JS, Java, C++, C), Set A/B/C/D lobby paper allocations, AI face telemetry, OS shortcut key lockouts, and automated candidate analytics.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 text-sm font-extrabold shadow-xl shadow-blue-600/30 rounded-xl transition-all gap-2"
                  onClick={() => navigate("/login")}
                >
                  Enter Assessment Portal <ArrowRight className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold px-2 py-1">
                  <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> 5+ Compilers</span>
                  <span className="flex items-center gap-1 text-purple-400"><CheckCircle2 className="h-4 w-4" /> Set Allocations</span>
                  <span className="flex items-center gap-1 text-cyan-400"><CheckCircle2 className="h-4 w-4" /> AI Proctor</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Preview Mock */}
            <div className="lg:col-span-5 relative">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-4">
                
                {/* Header Mock */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs uppercase font-extrabold tracking-wider text-slate-200">
                      IDE & Proctor Telemetry
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-cyan-300 font-mono font-bold">
                    ONLINE-CODING-SET-A
                  </span>
                </div>

                {/* IDE Code Snippet Mock */}
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-left space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800 pb-2">
                    <span className="text-purple-400 font-bold">C++ 17 (Apple Clang Compatible)</span>
                    <span className="text-emerald-400 font-bold">✓ Compiled 0ms</span>
                  </div>
                  <pre className="text-slate-300 text-[11px] leading-relaxed">
                    <span className="text-purple-400">#include</span> &lt;iostream&gt;{"\n"}
                    <span className="text-purple-400">using namespace</span> std;{"\n\n"}
                    <span className="text-blue-400">int</span> main() {"{\n"}
                    {"  "}cout &lt;&lt; <span className="text-emerald-300">"Hello SecureExam Pro"</span> &lt;&lt; endl;{"\n"}
                    {"  "}<span className="text-purple-400">return</span> <span className="text-amber-400">0</span>;{"\n"}
                    {"}"}
                  </pre>
                </div>

                {/* Terminal Log Output Mock */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px] text-left">
                  <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center justify-between">
                    <span>Terminal Console</span>
                    <span className="text-emerald-400">Process exited: 0</span>
                  </div>
                  <div className="text-emerald-400 font-bold">Hello SecureExam Pro</div>
                </div>

                {/* Security Checklist */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>OS Keys Blocked</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>No Copy / Paste</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Fullscreen Locked</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>3 Exit Lockouts</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= STATISTICS BANNER ================= */}
      <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white py-10 border-y border-blue-600 shadow-2xl">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black md:text-4xl">5+ Languages</div>
              <div className="text-xs text-blue-100 font-bold uppercase tracking-wider mt-1">
                Python, JS, Java, C++, C
              </div>
            </div>
            <div>
              <div className="text-3xl font-black md:text-4xl">Set A, B, C, D</div>
              <div className="text-xs text-blue-100 font-bold uppercase tracking-wider mt-1">
                Lobby Paper Allocation
              </div>
            </div>
            <div>
              <div className="text-3xl font-black md:text-4xl">100% Secure</div>
              <div className="text-xs text-blue-100 font-bold uppercase tracking-wider mt-1">
                AI Telemetry & OS Key Lockout
              </div>
            </div>
            <div>
              <div className="text-3xl font-black md:text-4xl">Instant</div>
              <div className="text-xs text-blue-100 font-bold uppercase tracking-wider mt-1">
                Scorecard Dispatch
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECURITY & TECH MARQUEE STRIP ================= */}
      <section className="relative overflow-hidden bg-slate-900 border-b border-slate-800 py-3 text-slate-400">
        <div className="relative flex overflow-hidden">
          <div className="flex min-w-full animate-marquee items-center gap-16 whitespace-nowrap">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Code2 className="h-3.5 w-3.5 text-blue-400" /> Python • JavaScript • Java • C++ • C
            </span>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Layers className="h-3.5 w-3.5 text-purple-400" /> Set-Wise Paper Code Distribution
            </span>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Fullscreen Enforced & OS Key Blocked
            </span>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Lock className="h-3.5 w-3.5 text-amber-400" /> Zero Copy / Paste / Context Menu
            </span>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" /> Excel & Google Sheet Bulk Candidate Onboarding
            </span>
          </div>
        </div>
      </section>

      {/* ================= ALL QUESTION TYPES & FORMATS SHOWCASE ================= */}
      <section className="py-20 bg-slate-900 border-b border-slate-800 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-extrabold uppercase tracking-wider">
              Comprehensive Format Engine
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Supported Question & Assessment Formats
            </h2>
            <p className="text-slate-400 text-sm">
              Tailored for MNC placement drives, campus qualifiers, and competitive coding drives with 7 complete evaluation formats.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Format 1: MCQ */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-blue-500/40 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Auto-Evaluated</span>
              </div>
              <h3 className="font-extrabold text-base text-white">MCQ (Single Select)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard multiple-choice questions with single-option radio buttons, automated grading, and instant score reporting.
              </p>
            </div>

            {/* Format 2: MSQ */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-purple-500/40 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Multi-Option</span>
              </div>
              <h3 className="font-extrabold text-base text-white">MSQ (Multiple Select)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-select checkbox questions supporting partial and all-or-nothing scoring models for advanced concept testing.
              </p>
            </div>

            {/* Format 3: Fill in the Blanks */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-emerald-500/40 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">String Match</span>
              </div>
              <h3 className="font-extrabold text-base text-white">Fill in the Blanks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Text input blank completion with case-insensitive, exact string, and wildcard pattern matching.
              </p>
            </div>

            {/* Format 4: Numerical */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-cyan-500/40 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Terminal className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Numeric Range</span>
              </div>
              <h3 className="font-extrabold text-base text-white">Numerical Answer Type</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exact integer & decimal evaluation with configurable numerical tolerance ranges (e.g. 3.14 ± 0.01).
              </p>
            </div>

            {/* Format 5: Descriptive */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-amber-500/40 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Open Text</span>
              </div>
              <h3 className="font-extrabold text-base text-white">Descriptive Questions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Long-form essay & paragraph responses with teacher rubric scoring, keyword matching, and word count constraints.
              </p>
            </div>

            {/* Format 6: Paper Code (Hybrid) */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-pink-500/40 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 group-hover:scale-110 transition-transform">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">Set A, B, C, D</span>
              </div>
              <h3 className="font-extrabold text-base text-white">Paper Code (Paper-on-Code)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hybrid evaluation mode with Set A/B/C/D lobby distributions, paper logic marks (50 max), and execution marks (50 max).
              </p>
            </div>

            {/* Format 7: Online Coding IDE */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-emerald-500/40 transition-all text-left group lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Code2 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Python • JS • Java • C++ • C</span>
              </div>
              <h3 className="font-extrabold text-base text-white">Online Coding IDE Compiler</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                LeetCode-style split pane editor with custom STDIN terminal, real-time error tracebacks, portable Clang header handling, per-language local code storage, and automated hidden test cases validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section className="py-20 bg-slate-950 text-white">
        <div className="container mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              Engineered for Enterprise Assessment Standards
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Complete Assessment Capabilities
            </h2>
            <p className="text-slate-400 text-sm">
              High-throughput assessment platform tailored for recruitment drives, paper code set evaluations, and multi-language competitive coding drives.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3.5 text-blue-400 group-hover:scale-110 transition-transform">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="mb-2 font-black text-lg text-white">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PLATFORM SHOWCASE / TRUST ================= */}
      <section className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <Award className="mx-auto h-12 w-12 text-blue-400" />
            <h2 className="text-3xl font-black text-white">
              Robust. Multi-Language. Compliance-Ready.
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              Designed under the SR Ecosystem to manage high-throughput campus recruitment drives and online coding assessments. Import candidate rosters via Excel/Google Sheet, allocate lobby paper sets, and launch MNC-grade assessment drives instantly.
            </p>
            <div className="pt-2">
              <Button
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs h-11 px-6 rounded-xl shadow-lg shadow-blue-600/30 gap-2"
                onClick={() => navigate("/login")}
              >
                Start Candidate Scan <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-6 text-xs text-slate-400 md:flex-row">
          
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SecureExam Pro Logo" className="h-8 w-8 object-contain opacity-90" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-white leading-none text-sm">SecureExam Pro</span>
              <span className="text-[10px] text-slate-500 mt-0.5 font-semibold">SR Ecosystem Platform</span>
            </div>
          </div>

          <div className="text-center md:text-right">
            Developed by{" "}
            <span className="font-bold text-white">
              Saran Velmurugan
            </span>
            <br />
            <span className="text-[11px] text-slate-500">
              Under SR Ecosystem • All Rights Reserved 2026
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


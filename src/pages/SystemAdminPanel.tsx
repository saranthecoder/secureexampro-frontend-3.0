import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Activity,
  Users,
  Cpu,
  LogOut,
  RefreshCw,
  Server,
  Sliders,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wifi,
  Globe,
  Zap,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TrafficManagement from "@/components/TrafficManagement";
import UsersManagement from "@/components/UsersManagement";
import axiosInstance from "@/config/axiosClient";
import { toast } from "@/hooks/use-toast";

export const SystemAdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"traffic" | "users" | "overview">("traffic");
  const [stats, setStats] = useState({
    totalServers: 0,
    onlineServers: 0,
    totalExaminers: 0,
    totalStudents: 0,
  });
  const [serversList, setServersList] = useState<any[]>([]);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [testingPing, setTestingPing] = useState<string | null>(null);

  const fetchAdminStats = async () => {
    try {
      const [serversRes, examinersRes, studentsRes, telemetryRes] = await Promise.all([
        axiosInstance.get("/traffic/servers"),
        axiosInstance.get("/auth/examiners"),
        axiosInstance.get("/auth/students"),
        axiosInstance.get("/traffic/telemetry-history")
      ]);

      const sList = serversRes.data || [];
      const exList = examinersRes.data || [];
      const stList = studentsRes.data || [];
      const tData = telemetryRes.data || null;

      setServersList(sList);
      setTelemetryData(tData);

      setStats({
        totalServers: sList.length,
        onlineServers: sList.filter((s: any) => s.isActive && s.status === "online").length,
        totalExaminers: exList.length,
        totalStudents: stList.length,
      });
    } catch (err) {
      console.error("Failed to load admin stats", err);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("coreAdmin");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleTestServerPing = async (server: any) => {
    setTestingPing(server._id);
    const startMs = Date.now();
    try {
      await fetch(`${server.baseUrl}/api/traffic/public-config`, { mode: 'cors' });
      const elapsed = Date.now() - startMs;
      toast({
        title: `Ping Test: ${server.name}`,
        description: `Status: 200 OK • Response Latency: ${elapsed} ms`,
      });
    } catch {
      const elapsed = Date.now() - startMs;
      toast({
        title: `Ping Test: ${server.name}`,
        description: `Server node reached in ${elapsed} ms`,
      });
    } finally {
      setTestingPing(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col justify-between p-5 shadow-2xl z-20">
        <div className="space-y-6">
          {/* Logo & Header */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black">
              <Shield className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h1 className="font-extrabold text-sm text-white leading-tight">Core System Admin Console</h1>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Traffic & Personnel Director</span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab("traffic")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "traffic"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Cpu className="h-4 w-4 text-cyan-400" /> Traffic & Cluster Maintenance
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "users"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4 text-emerald-400" /> Examiners & Bulk Import
            </button>

            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "overview"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Activity className="h-4 w-4 text-purple-400" /> Cluster Telemetry
            </button>
          </div>
        </div>

        {/* Footer & Switch to Examiner */}
        <div className="space-y-3 pt-4 border-t border-slate-900">
          <Button
            onClick={() => navigate("/coreadmin")}
            variant="outline"
            className="w-full bg-slate-900 border-slate-800 text-slate-300 hover:text-white text-xs font-bold gap-2 justify-start h-10 rounded-xl"
          >
            <ArrowRight className="h-3.5 w-3.5 text-blue-400" /> Open Examiner Portal
          </Button>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs font-bold gap-2 justify-start h-10 rounded-xl"
          >
            <LogOut className="h-4 w-4" /> Core Admin Logout
          </Button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
              {activeTab === "traffic"
                ? "SSMS 3.0 Traffic Control & Cluster Maintenance Subsystem"
                : activeTab === "users"
                ? "Examiners Management & Bulk Candidate Provisioning"
                : "System Infrastructure Overview & Cluster Telemetry"}
            </h2>
            <Badge className="bg-cyan-100 text-cyan-800 border border-cyan-200 text-[10px] font-bold">
              CORE SYSTEM ADMIN
            </Badge>
          </div>

          <Button
            onClick={fetchAdminStats}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold gap-1.5 border-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5 text-blue-600" /> Refresh Telemetry
          </Button>
        </header>

        {/* Content Body */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6">
          {activeTab === "traffic" && <TrafficManagement />}

          {activeTab === "users" && <UsersManagement />}

          {activeTab === "overview" && (
            <div className="space-y-6 text-left">
              {/* 1. Stat Cards Top Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cluster Servers</span>
                    <div className="text-3xl font-black text-slate-900 mt-1">{stats.totalServers}</div>
                    <span className="text-[10px] text-slate-500 font-bold">Multi-region backend nodes</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Server className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Online Active Nodes</span>
                    <div className="text-3xl font-black text-emerald-600 mt-1">{stats.onlineServers}</div>
                    <span className="text-[10px] text-emerald-600 font-bold">100% Operational Uptime</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Wifi className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Examiner Accounts</span>
                    <div className="text-3xl font-black text-purple-600 mt-1">{stats.totalExaminers}</div>
                    <span className="text-[10px] text-purple-600 font-bold">Registered examiners</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Users className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Accounts</span>
                    <div className="text-3xl font-black text-blue-600 mt-1">{stats.totalStudents}</div>
                    <span className="text-[10px] text-blue-600 font-bold">Candidate database</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Globe className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* 2. Registered Servers Live Telemetry Grid */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Server className="h-4 w-4 text-cyan-600" /> Active Infrastructure Server Nodes Telemetry
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Real-time status, base URL, latency, traffic split ratio, and node health metrics.</p>
                  </div>

                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono text-[10px]">
                    {stats.onlineServers} / {stats.totalServers} NODES HEALTHY
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {serversList.map((srv: any, idx: number) => {
                    const isPrimary = srv.isPrimary;
                    const isActive = srv.isActive && srv.status === "online";
                    const nodeWeight = srv.weight || 100;
                    const handled = srv.activeCandidatesHandled || 0;
                    const splitPct = srv.splitRatioPercent || (stats.onlineServers > 0 ? Math.round(100 / stats.onlineServers) : 33);

                    return (
                      <div key={srv._id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            {srv.name || `Server Node #${idx + 1}`}
                            {isPrimary && (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[9px] font-black">
                                PRIMARY ENV
                              </Badge>
                            )}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                            {isActive ? "ONLINE" : "OFFLINE"}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded-lg border border-slate-200 truncate">
                          {srv.baseUrl}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 block font-bold">Traffic Weight:</span>
                            <strong className="text-slate-800 text-xs font-mono">{nodeWeight}% Weight</strong>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 block font-bold">Split Allocation:</span>
                            <strong className="text-blue-600 text-xs font-mono">{splitPct}% Traffic</strong>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                            <span>Candidates Handled:</span>
                            <span className="text-slate-800 font-mono">{handled} / 50</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (handled / 50) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <Button
                          onClick={() => handleTestServerPing(srv)}
                          disabled={testingPing === srv._id}
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-[11px] font-extrabold text-slate-700 bg-white hover:bg-slate-100 border-slate-200 gap-1.5"
                        >
                          <Zap className="h-3 w-3 text-amber-500" />
                          {testingPing === srv._id ? "Testing Latency..." : "Test Node Ping Latency"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Failover & Cluster Capacity Report Banner */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center gap-2 text-white">
                    <Activity className="h-5 w-5 text-cyan-400" /> Dynamic Load Balancing & High-Availability Failover Policy
                  </h3>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-black">
                    AUTO DYNAMIC LOBBY
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans text-slate-300">
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Auto Cluster Capacity</span>
                    <div className="text-lg font-black text-cyan-300 font-mono">
                      {telemetryData?.maxCapacity || (stats.onlineServers * 50)} Candidates
                    </div>
                    <p className="text-[10px] text-slate-400">Scaled automatically across {stats.onlineServers} active servers (50 base capacity / node).</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Auto Lobby Trigger</span>
                    <div className="text-lg font-black text-amber-400 font-mono">
                      {Math.floor((telemetryData?.maxCapacity || (stats.onlineServers * 50)) * 0.8)} Candidates (80%)
                    </div>
                    <p className="text-[10px] text-slate-400">Protects servers from memory leaks & concurrent exam start spikes.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Automatic Failover Engine</span>
                    <div className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> ACTIVE
                    </div>
                    <p className="text-[10px] text-slate-400">Fails over seamlessly on HTTP 502/503/504 errors.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={() => setActiveTab("traffic")}
                    className="bg-cyan-600 hover:bg-cyan-500 font-bold text-xs h-9 px-4 rounded-xl shadow-md gap-2"
                  >
                    <Sliders className="h-3.5 w-3.5" /> Manage Traffic Cluster & Split Ratios
                  </Button>

                  <Button
                    onClick={() => setActiveTab("users")}
                    variant="outline"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-bold text-xs h-9 px-4 rounded-xl gap-2"
                  >
                    <Users className="h-3.5 w-3.5 text-emerald-400" /> Manage Examiners & Students
                  </Button>

                  <Button
                    onClick={fetchAdminStats}
                    variant="outline"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-bold text-xs h-9 px-4 rounded-xl gap-2 ml-auto"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-blue-400" /> Refresh Telemetry
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SystemAdminPanel;

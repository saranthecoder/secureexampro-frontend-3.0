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
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TrafficManagement from "@/components/TrafficManagement";
import UsersManagement from "@/components/UsersManagement";
import axiosInstance from "@/config/axiosClient";
import Swal from "sweetalert2";

export const SystemAdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"traffic" | "users" | "overview">("traffic");
  const [stats, setStats] = useState({
    totalServers: 0,
    onlineServers: 0,
    totalExaminers: 0,
    totalStudents: 0,
  });

  const fetchAdminStats = async () => {
    try {
      const [serversRes, examinersRes, studentsRes] = await Promise.all([
        axiosInstance.get("/traffic/servers"),
        axiosInstance.get("/auth/examiners"),
        axiosInstance.get("/auth/students"),
      ]);

      const sList = serversRes.data || [];
      const exList = examinersRes.data || [];
      const stList = studentsRes.data || [];

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
                : "System Infrastructure Overview & Telemetry"}
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
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Registered Servers</span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{stats.totalServers}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Online Cluster Nodes</span>
                  <div className="text-3xl font-black text-emerald-600 mt-1">{stats.onlineServers}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Examiner Accounts</span>
                  <div className="text-3xl font-black text-purple-600 mt-1">{stats.totalExaminers}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Student Accounts</span>
                  <div className="text-3xl font-black text-blue-600 mt-1">{stats.totalStudents}</div>
                </div>
              </div>

              {/* Health Report Card */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" /> High-Availability Infrastructure Health Report
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  The SSMS 3.0 Traffic Control system monitors response latency, CPU load, and RAM usage on all active backend nodes. In the event of primary server outage on Render/AWS, automatic failover switches API traffic seamlessly to online backup nodes.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setActiveTab("traffic")}
                    className="bg-cyan-600 hover:bg-cyan-700 font-bold text-xs h-9 px-4 rounded-xl"
                  >
                    Open Cluster Control
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

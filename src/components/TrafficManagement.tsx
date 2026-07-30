import React, { useState, useEffect } from "react";
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  RefreshCw,
  Plus,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  Check,
  Power,
  Trash2,
  Users,
  Gauge,
  Clock,
  ShieldAlert,
  Pencil
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Swal from "sweetalert2";
import axiosInstance, { TrafficNode, setTrafficNodesCache } from "@/config/axiosClient";

const POLICIES = [
  {
    id: "failover",
    title: "Active-Backup Failover",
    description: "All traffic goes to Primary Server. If primary fails, traffic auto-switches to backup nodes.",
    recommended: true,
  },
  {
    id: "cpu-adaptive",
    title: "Dynamic CPU Balancer",
    description: "Shifts traffic to lighter nodes when a server's CPU exceeds configured threshold (>70%).",
    recommended: false,
  },
  {
    id: "round-robin",
    title: "Round-Robin Rotation",
    description: "Distributes API requests uniformly across all active nodes.",
    recommended: false,
  },
  {
    id: "latency",
    title: "Latency-Optimized",
    description: "Routes requests to the node with the lowest ping response time.",
    recommended: false,
  },
  {
    id: "manual",
    title: "Static Node Assign",
    description: "Pins all API traffic to a single designated node for maintenance & debugging.",
    recommended: false,
  },
];

const NODE_COLOR_PALETTE = [
  { hex: "#0284c7", bg: "bg-sky-600", text: "text-sky-300", border: "border-sky-500/30", pillBg: "bg-sky-500/10" },
  { hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", pillBg: "bg-emerald-500/10" },
  { hex: "#8b5cf6", bg: "bg-purple-600", text: "text-purple-400", border: "border-purple-500/30", pillBg: "bg-purple-500/10" },
  { hex: "#f59e0b", bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", pillBg: "bg-amber-500/10" },
  { hex: "#ec4899", bg: "bg-pink-600", text: "text-pink-400", border: "border-pink-500/30", pillBg: "bg-pink-500/10" },
  { hex: "#06b6d4", bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500/30", pillBg: "bg-cyan-500/10" },
];

const getNodeColorStyle = (node: TrafficNode, idx: number) => {
  if (node.isPrimary) return NODE_COLOR_PALETTE[0];
  return NODE_COLOR_PALETTE[(idx % (NODE_COLOR_PALETTE.length - 1)) + 1];
};

export const TrafficManagement: React.FC = () => {
  const [servers, setServers] = useState<TrafficNode[]>([]);
  const [config, setConfig] = useState<{ policy: string; cpuThreshold: number; requestsPerPing: number }>({
    policy: "failover",
    cpuThreshold: 70,
    requestsPerPing: 2,
  });
  const [loading, setLoading] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // New Node Form state
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIsPrimary, setNewIsPrimary] = useState(false);

  // Edit Node Form state
  const [editingNode, setEditingNode] = useState<TrafficNode | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleOpenEditDialog = (node: TrafficNode) => {
    setEditingNode(node);
    setEditName(node.name);
    setEditUrl(node.url);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode || !editingNode._id || !editUrl || !editName) return;

    try {
      await axiosInstance.put(`/traffic/servers/${editingNode._id}`, {
        ...editingNode,
        name: editName,
        url: editUrl,
      });

      setIsEditDialogOpen(false);
      setEditingNode(null);
      fetchTrafficData();
      fetchTelemetry();

      Swal.fire({
        title: "Server Node Updated",
        text: `Server URL set to ${editUrl}`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to update server node URL", "error");
    }
  };

  // Telemetry & Traffic Capacity State
  const [telemetry, setTelemetry] = useState<any | null>(null);
  const [maxCapacityInput, setMaxCapacityInput] = useState<number>(50);
  const [lobbyModeInput, setLobbyModeInput] = useState<string>("auto");
  const [savingCapacity, setSavingCapacity] = useState(false);

  const fetchTelemetry = async () => {
    try {
      const res = await axiosInstance.get("/traffic/telemetry-history");
      if (res.data) {
        setTelemetry(res.data);
        if (res.data.servers && res.data.servers.length > 0) {
          setServers(res.data.servers);
        }
        if (res.data.config) {
          setMaxCapacityInput(res.data.config.maxCapacity || 50);
          setLobbyModeInput(res.data.config.lobbyMode || "auto");
        }
      }
    } catch (err) {
      console.error("Failed to load telemetry history:", err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateCapacityPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCapacity(true);
    try {
      await axiosInstance.put("/traffic/config", {
        maxCapacity: maxCapacityInput,
        lobbyMode: lobbyModeInput,
      });
      fetchTelemetry();
      fetchTrafficData();
      Swal.fire("Policy Updated", "Traffic Capacity & Dynamic Lobby Settings updated.", "success");
    } catch (err) {
      Swal.fire("Error", "Failed to update traffic policy.", "error");
    } finally {
      setSavingCapacity(false);
    }
  };

  const fetchTrafficData = async () => {
    setLoading(true);
    try {
      const [serversRes, configRes] = await Promise.all([
        axiosInstance.get("/traffic/servers"),
        axiosInstance.get("/traffic/config"),
      ]);
      setServers(serversRes.data || []);
      setTrafficNodesCache(serversRes.data || []);
      if (configRes.data) {
        setConfig(configRes.data);
      }
    } catch (err) {
      console.error("Failed to load traffic manager state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
  }, []);

  const handleRunHealthScan = async () => {
    setPinging(true);
    try {
      const res = await axiosInstance.post("/traffic/ping");
      if (res.data && res.data.servers) {
        setServers(res.data.servers);
        setTrafficNodesCache(res.data.servers);
      }
      Swal.fire({
        title: "Cluster Scan Complete",
        text: "All active backend nodes audited successfully.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Scan Error", err?.response?.data?.message || "Failed to complete health scan", "error");
    } finally {
      setPinging(false);
    }
  };

  const handleUpdatePolicy = async (policyId: string) => {
    try {
      const res = await axiosInstance.put("/traffic/config", { policy: policyId });
      setConfig(res.data);
      Swal.fire({
        title: "Routing Strategy Updated",
        text: `Active traffic policy set to: ${policyId.toUpperCase()}`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Error", "Failed to update routing policy", "error");
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;

    try {
      await axiosInstance.post("/traffic/servers", {
        name: newName,
        url: newUrl,
        isPrimary: newIsPrimary,
        isActive: true,
      });

      setNewName("");
      setNewUrl("");
      setNewIsPrimary(false);
      setIsAddDialogOpen(false);
      fetchTrafficData();

      Swal.fire({
        title: "Node Registered",
        text: "New backend server added to traffic cluster.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to register server node", "error");
    }
  };

  const handleToggleNodeActive = async (server: TrafficNode) => {
    try {
      await axiosInstance.put(`/traffic/servers/${server._id}`, {
        ...server,
        isActive: !server.isActive,
      });
      fetchTrafficData();
    } catch (err) {
      Swal.fire("Error", "Failed to toggle node standby state", "error");
    }
  };

  const handleDeleteNode = async (id: string) => {
    try {
      await axiosInstance.delete(`/traffic/servers/${id}`);
      fetchTrafficData();
    } catch (err) {
      Swal.fire("Error", "Failed to delete server node", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="h-4 w-4 animate-pulse" />
            SSMS 3.0 Traffic Control & Cluster Maintenance
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            High-Availability Server Nodes & Routing Balancer
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time server health scanning, dynamic Render/AWS failover, and adaptive load distribution for zero-downtime exam delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunHealthScan}
            disabled={pinging}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs shadow-md rounded-xl h-10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${pinging ? "animate-spin" : ""}`} />
            {pinging ? "Auditing Cluster..." : "Run Health Scan"}
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-md rounded-xl h-10">
                <Plus className="h-4 w-4" /> Add Server Node
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="h-5 w-5 text-emerald-400" /> Register Backend Node
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddServer} className="space-y-4 pt-2">
                <div className="space-y-1 text-left">
                  <Label className="text-xs font-semibold text-slate-300">Server Node Name</Label>
                  <Input
                    placeholder="e.g. Primary Render Node"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-sm"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <Label className="text-xs font-semibold text-slate-300">Server Base URL</Label>
                  <Input
                    placeholder="https://ssms3-0-be.onrender.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-sm"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={newIsPrimary}
                    onChange={(e) => setNewIsPrimary(e.target.checked)}
                    className="rounded border-slate-700 text-blue-600 bg-slate-800"
                  />
                  <Label htmlFor="isPrimary" className="text-xs text-slate-300 cursor-pointer">
                    Mark as Primary Cluster Node
                  </Label>
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-xs h-10 mt-4">
                  Save Backend Server Node
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* DYNAMIC TRAFFIC CAPACITY ALERT & LOBBY STATUS BANNER */}
      {telemetry && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md transition-all ${
              telemetry.isCapacityExceeded
                ? "bg-gradient-to-r from-red-600 to-amber-600 text-white border-red-500"
                : "bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${telemetry.isCapacityExceeded ? "bg-white/20 text-white animate-bounce" : "bg-emerald-500/20 text-emerald-400"}`}>
                {telemetry.isCapacityExceeded ? <ShieldAlert className="h-6 w-6" /> : <Gauge className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base">
                    {telemetry.isCapacityExceeded
                      ? "🚨 TRAFFIC CAPACITY EXCEEDED & DYNAMIC LOBBY ACTIVE"
                      : "🟢 TRAFFIC CAPACITY NORMAL - DIRECT ACCESS (LOBBY OFF)"}
                  </h3>
                  <Badge className={telemetry.isCapacityExceeded ? "bg-white text-red-700 font-extrabold" : "bg-emerald-500/30 text-emerald-300 border-emerald-400/40"}>
                    {telemetry.isCapacityExceeded ? "LOBBY ACTIVE" : "0s WAIT TIME"}
                  </Badge>
                </div>
                <p className="text-xs opacity-90 mt-0.5">
                  Active Concurrency: <strong>{telemetry.currentActiveCandidates}</strong> / <strong>{telemetry.maxCapacity}</strong> Max Capacity Threshold
                  {telemetry.isLobbyActive && ` | Dynamic Queue Delay: ${telemetry.currentQueueDelay} seconds`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-xl border border-white/10 text-xs shrink-0 font-mono">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Mode: <strong>{(telemetry.config?.lobbyMode || "auto").toUpperCase()}</strong></span>
            </div>
          </div>

          {/* TELEMETRY GRAPH & CONFIGURATION FORM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* TRAFFIC DATA GRAPH REPRESENTATION */}
            <Card className="lg:col-span-2 border border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" /> All Backend Server Nodes — Traffic Load & Capacity Graph
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-mono bg-slate-100">Live Cluster Sync (10s)</Badge>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Visual real-time graph rendering traffic concurrency and load across all server nodes (including Primary .env Server).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetry.graphData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="delayGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        dy={4}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <RechartsTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const formattedTime = typeof label === "number"
                              ? new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : String(label || "");
                            return (
                              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs font-sans text-white space-y-1.5 min-w-[200px] text-left">
                                <div className="font-extrabold text-cyan-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                                  <span>Time: {formattedTime}</span>
                                  <span className="text-[10px] text-slate-400">Local Telemetry</span>
                                </div>
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      {entry.name}:
                                    </span>
                                    <span className="font-mono font-bold text-white">{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <ReferenceLine
                        y={telemetry.maxCapacity}
                        label={{ value: `Max Capacity Limit (${telemetry.maxCapacity})`, fill: '#ef4444', fontSize: 11, position: 'top' }}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                      />
                      
                      {/* Overall Cluster Concurrency Line */}
                      <Area
                        type="monotone"
                        dataKey="activeCandidates"
                        name="Total Cluster Traffic"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#trafficGradient)"
                      />

                      {/* Per-Server Individual Node Traffic Lines */}
                      {servers.map((srv, idx) => {
                        const style = getNodeColorStyle(srv, idx);
                        return (
                          <Area
                            key={srv._id || srv.name}
                            type="monotone"
                            dataKey={srv.name}
                            name={`${srv.name}${srv.isPrimary ? " (Primary Node)" : ""}`}
                            stroke={style.hex}
                            strokeWidth={2.5}
                            fillOpacity={0}
                          />
                        );
                      })}

                      {/* Dynamic Lobby Delay Line */}
                      <Area
                        type="monotone"
                        dataKey="queueDelaySeconds"
                        name="Dynamic Lobby Delay (s)"
                        stroke="#f97316"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#delayGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* DYNAMIC LOBBY CAPACITY POLICY CONTROL PANEL */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-600" /> Dynamic Lobby Policy Settings
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Cluster max capacity is calculated automatically based on active servers & weights.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <form onSubmit={handleUpdateCapacityPolicy} className="space-y-4 text-left">
                  {/* Auto-Calculated Server Cluster Capacity Display */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Auto-Calculated Cluster Max Capacity</span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-black">
                        {telemetry?.maxCapacity || (Math.max(1, servers.filter(s => s.isActive).length) * 50)} Candidates
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1 font-sans border-t border-slate-800 pt-2">
                      <div className="flex items-center justify-between">
                        <span>Active Cluster Server Nodes:</span>
                        <strong className="text-cyan-300">{servers.filter(s => s.isActive).length} Active Nodes</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Base Node Capacity:</span>
                        <strong className="text-white">50 Candidates / Node (Scaled by Weight)</strong>
                      </div>
                      <div className="flex items-center justify-between pt-0.5">
                        <span>Auto Lobby Trigger Threshold:</span>
                        <strong className="text-amber-400 font-mono">
                          {lobbyModeInput === "force_enabled"
                            ? "0 Candidates (Always Enabled)"
                            : lobbyModeInput === "force_disabled"
                            ? "Disabled (Direct Access)"
                            : `${Math.floor((telemetry?.maxCapacity || (Math.max(1, servers.filter(s => s.isActive).length) * 50)) * 0.8)} Candidates (80% Load)`}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Lobby Waiting Mode
                    </Label>
                    <select
                      value={lobbyModeInput}
                      onChange={(e) => setLobbyModeInput(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="auto">Auto Dynamic (Lobby triggers automatically on Capacity Spikes)</option>
                      <option value="force_disabled">Force Lobby Off (Direct Access for All)</option>
                      <option value="force_enabled">Force Lobby On (Queue All Candidates)</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      In Auto Dynamic mode, traffic controller automatically queues candidates when concurrency hits 80% capacity.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingCapacity}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 rounded-xl shadow-md gap-2 mt-2"
                  >
                    <Check className="h-4 w-4" />
                    {savingCapacity ? "Saving Policy..." : "Update Lobby Waiting Mode Policy"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Cluster Nodes Live Status Grid & Traffic Split Breakdown */}
      <div className="space-y-4">
        {/* LIVE TRAFFIC SPLITTING BREAKDOWN CARD */}
        <Card className="border border-slate-800 bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden text-left">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-black text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-cyan-400" /> Cluster Traffic Distribution & Load Split
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Real-time split ratio calculated according to admin routing policy: <strong className="text-cyan-300 uppercase">{config.policy}</strong>
                </CardDescription>
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-extrabold py-1 px-3 self-start sm:self-auto">
                STRATEGY: {config.policy.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Visual Multi-Segment Split Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Live Candidate Traffic Allocation Split</span>
                <span className="font-mono text-cyan-300">
                  Total Active: {telemetry?.currentActiveCandidates || 0} Candidates
                </span>
              </div>
              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
                {servers.map((srv, idx) => {
                  const style = getNodeColorStyle(srv, idx);
                  const ratio = srv.splitRatioPercent !== undefined ? srv.splitRatioPercent : (srv.isActive ? Math.round(100 / Math.max(1, servers.filter(s => s.isActive).length)) : 0);
                  if (ratio === 0) return null;
                  return (
                    <div
                      key={srv._id || srv.name}
                      style={{ width: `${ratio}%`, backgroundColor: style.hex }}
                      className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full flex items-center justify-center text-[9px] font-black text-white px-1 truncate shadow-inner"
                      title={`${srv.name}: ${ratio}% (${srv.activeCandidatesHandled || 0} candidates)`}
                    >
                      {ratio >= 10 ? `${srv.name} (${ratio}%)` : `${ratio}%`}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Split Breakdown Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {servers.map((srv, idx) => {
                const style = getNodeColorStyle(srv, idx);
                const ratio = srv.splitRatioPercent !== undefined ? srv.splitRatioPercent : (srv.isActive ? Math.round(100 / Math.max(1, servers.filter(s => s.isActive).length)) : 0);
                const candidates = srv.activeCandidatesHandled !== undefined ? srv.activeCandidatesHandled : (srv.isActive ? Math.round((ratio / 100) * (telemetry?.currentActiveCandidates || 0)) : 0);

                return (
                  <div key={srv._id || srv.name} className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${style.text} ${style.border} ${style.pillBg}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black truncate max-w-[120px]">{srv.name}</span>
                      <Badge className="bg-slate-950 text-white text-[9px] font-extrabold border border-slate-800">
                        {ratio}% Split
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xl font-black text-white font-mono">{candidates}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Candidates Handled</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-white/10 pt-1">
                      <span>Latency: <strong className="text-white">{srv.responseTime || 0}ms</strong></span>
                      <span>Weight: <strong className="text-white">{srv.weight || 100}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CLUSTER NODES LIVE STATUS GRID */}
        <div className="flex items-center justify-between text-left pt-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-600" /> Registered Server Nodes ({servers.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">Primary node configured directly in .env</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {servers.length === 0 ? (
            <div className="col-span-3 p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
              No server nodes registered. Click "Add Server Node" to configure backend cluster instances.
            </div>
          ) : (
            servers.map((node) => (
              <Card
                key={node._id || node.name}
                className={`border transition-all text-left ${
                  node.isPrimary
                    ? "bg-slate-900 text-white border-blue-500/80 shadow-lg ring-1 ring-blue-500/30"
                    : !node.isActive
                    ? "bg-slate-50 border-slate-200 opacity-60 text-slate-900"
                    : "bg-white border-slate-200 shadow-sm hover:shadow-md text-slate-900"
                }`}
              >
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className={`text-sm font-black ${node.isPrimary ? "text-white" : "text-slate-900"}`}>
                        {node.name}
                      </CardTitle>
                      {node.isPrimary && (
                        <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-[10px] font-black tracking-wider">
                          PRIMARY (.ENV)
                        </Badge>
                      )}
                    </div>
                    <CardDescription className={`text-[11px] font-mono truncate max-w-[200px] ${node.isPrimary ? "text-cyan-300" : "text-slate-500"}`}>
                      {node.url}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={`text-[10px] font-black uppercase ${
                        !node.isActive
                          ? "bg-slate-200 text-slate-700"
                          : node.status === "online"
                          ? node.isPrimary ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {!node.isActive ? "STANDBY" : node.status.toUpperCase()}
                    </Badge>
                    
                    {node._id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditDialog(node)}
                        title="Edit Server Name & Base URL"
                        className={`h-7 w-7 ${node.isPrimary ? "text-slate-300 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-blue-600 hover:bg-blue-50"}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {node._id && !node.isPrimary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteNode(node._id!)}
                        className={`h-7 w-7 ${node.isPrimary ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Metrics Row */}
                  <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-xl text-center border ${node.isPrimary ? "bg-slate-950/80 border-slate-800 text-white" : "bg-slate-50 border-slate-100 text-slate-900"}`}>
                    <div>
                      <span className={`text-[10px] font-semibold uppercase block ${node.isPrimary ? "text-slate-400" : "text-slate-400"}`}>Split %</span>
                      <span className="text-xs font-black text-cyan-400">{node.splitRatioPercent || 0}%</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-semibold uppercase block ${node.isPrimary ? "text-slate-400" : "text-slate-400"}`}>Candidates</span>
                      <span className="text-xs font-black">{node.activeCandidatesHandled || 0}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-semibold uppercase block ${node.isPrimary ? "text-slate-400" : "text-slate-400"}`}>Latency</span>
                      <span className="text-xs font-black">{node.responseTime || 0} ms</span>
                    </div>
                  </div>

                  {/* Traffic Weight Adjustment Controls */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/30">
                    <span className={`text-[11px] font-bold ${node.isPrimary ? "text-slate-300" : "text-slate-600"}`}>
                      Traffic Weight %:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={10}
                        max={300}
                        defaultValue={node.weight || 100}
                        onBlur={async (e) => {
                          const val = Number(e.target.value);
                          if (val > 0 && node._id) {
                            await axiosInstance.put(`/traffic/servers/${node._id}`, { ...node, weight: val });
                            fetchTrafficData();
                            fetchTelemetry();
                          }
                        }}
                        className={`w-16 h-7 text-xs font-mono text-center px-1 font-bold ${node.isPrimary ? "bg-slate-950 border-slate-800 text-white" : "bg-white text-slate-900"}`}
                      />
                      <span className="text-[10px] text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleNodeActive(node)}
                      className={`h-8 text-xs font-semibold gap-1.5 rounded-lg ${node.isPrimary ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "border-slate-200"}`}
                    >
                      <Power className={`h-3.5 w-3.5 ${node.isActive ? "text-emerald-400" : "text-slate-400"}`} />
                      {node.isActive ? "Deactivate Node" : "Activate Node"}
                    </Button>

                    {!node.isPrimary && node._id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await axiosInstance.put(`/traffic/servers/${node._id}`, { ...node, isPrimary: true });
                          fetchTrafficData();
                          fetchTelemetry();
                          Swal.fire("Primary Node Updated", `${node.name} set as primary cluster node.`, "success");
                        }}
                        className="h-8 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Set Primary
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Traffic Routing Policy Control */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-600" /> Active Cluster Routing Policy
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Select how API traffic is balanced across backend servers during high concurrent exam events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {POLICIES.map((p) => {
              const isSelected = config.policy === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleUpdatePolicy(p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                      isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{p.title}</span>
                      {p.recommended && (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          RECOMMENDED
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* EDIT SERVER NODE DIALOG MODAL */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-400" /> Edit Server Node Details
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditedServer} className="space-y-4 pt-2">
            <div className="space-y-1 text-left">
              <Label className="text-xs font-semibold text-slate-300">Server Node Name</Label>
              <Input
                placeholder="e.g. Primary Render Server"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-sm"
                required
              />
            </div>
            <div className="space-y-1 text-left">
              <Label className="text-xs font-semibold text-slate-300">Server Base URL</Label>
              <Input
                placeholder="https://secureexampro-backend-3-0.onrender.com"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-sm"
                required
              />
              <p className="text-[10px] text-slate-400">
                Full base URL including protocol (https:// or http://).
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="text-xs font-bold text-slate-400 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 font-bold text-xs h-10 px-4">
                Save Updated Server URL
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrafficManagement;

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
  ShieldAlert
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
                    <Activity className="h-5 w-5 text-blue-600" /> Real-Time Candidate Traffic vs Capacity Threshold
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-mono">Live Sync (10s)</Badge>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Visual graph showing candidate concurrency against configured max capacity line.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetry.graphData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="delayGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <ReferenceLine
                        y={telemetry.maxCapacity}
                        label={{ value: `Max Capacity (${telemetry.maxCapacity})`, fill: '#ef4444', fontSize: 11, position: 'top' }}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="activeCandidates"
                        name="Active Candidate Traffic"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#trafficGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="queueDelaySeconds"
                        name="Dynamic Lobby Delay (s)"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#delayGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* TRAFFIC CAPACITY & LOBBY POLICY FORM */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-600" /> Dynamic Lobby Policy Settings
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Configure traffic capacity limits and lobby triggers.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleUpdateCapacityPolicy} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Max Candidate Capacity Threshold
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={5000}
                      value={maxCapacityInput}
                      onChange={(e) => setMaxCapacityInput(Number(e.target.value))}
                      required
                      className="bg-white text-xs font-mono"
                    />
                    <p className="text-[10px] text-slate-400">
                      Lobby activates automatically when candidate concurrency reaches this number.
                    </p>
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
                      <option value="auto">Auto Dynamic (Lobby triggers on Capacity Spikes)</option>
                      <option value="force_disabled">Force Lobby Off (Direct Access for All)</option>
                      <option value="force_enabled">Force Lobby On (Queue All Candidates)</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingCapacity}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 rounded-xl shadow-md gap-2 mt-2"
                  >
                    <Check className="h-4 w-4" />
                    {savingCapacity ? "Saving Policy..." : "Update Traffic Capacity Policy"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Cluster Nodes Live Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {servers.length === 0 ? (
          <div className="col-span-3 p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
            No server nodes registered. Click "Add Server Node" to configure backend cluster instances.
          </div>
        ) : (
          servers.map((node) => (
            <Card
              key={node._id}
              className={`border transition-all ${
                !node.isActive
                  ? "bg-slate-50 border-slate-200 opacity-60"
                  : node.status === "online"
                  ? "bg-white border-slate-200 shadow-sm hover:shadow-md"
                  : "bg-red-50/40 border-red-200"
              }`}
            >
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-slate-900">{node.name}</CardTitle>
                    {node.isPrimary && (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] font-bold">
                        PRIMARY NODE
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                    {node.url}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge
                    className={`text-[10px] font-black uppercase ${
                      !node.isActive
                        ? "bg-slate-200 text-slate-700"
                        : node.status === "online"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {!node.isActive ? "STANDBY" : node.status.toUpperCase()}
                  </Badge>
                  {node._id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNode(node._id!)}
                      className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Latency</span>
                    <span className="text-xs font-black text-slate-800">{node.responseTime || 0} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">CPU %</span>
                    <span className="text-xs font-black text-slate-800 flex items-center justify-center gap-0.5">
                      <Cpu className="h-3 w-3 text-amber-500" />
                      {node.cpuUsage || 15}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">RAM %</span>
                    <span className="text-xs font-black text-slate-800 flex items-center justify-center gap-0.5">
                      <HardDrive className="h-3 w-3 text-indigo-500" />
                      {node.memoryUsage || 30}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleNodeActive(node)}
                    className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-slate-200"
                  >
                    <Power className={`h-3.5 w-3.5 ${node.isActive ? "text-emerald-600" : "text-slate-400"}`} />
                    {node.isActive ? "Deactivate Node" : "Activate Node"}
                  </Button>

                  <span className="text-[10px] text-slate-400">
                    Weight: <strong>{node.weight || 100}%</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
    </div>
  );
};

export default TrafficManagement;

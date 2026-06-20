import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "@/config/api";
import CreateExamDialog from "@/components/CreateExamDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  LogOut,
  FileText,
  Users,
  BarChart3,
  Edit2,
  Copy,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  Search,
  Settings,
  Grid,
  Check,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"exams" | "settings">("exams");
  const [searchQuery, setSearchQuery] = useState("");

  // Monitor results modal state
  const [monitorExam, setMonitorExam] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Screen monitor modal states
  const [viewingStudentScreen, setViewingStudentScreen] = useState<{ examCode: string; email: string; name: string } | null>(null);
  const [liveScreenFrame, setLiveScreenFrame] = useState<string | null>(null);
  const [screenOffline, setScreenOffline] = useState(false);

  // Live Grid Proctoring states
  const [activeViewTab, setActiveViewTab] = useState<"table" | "grid">("table");
  const [liveScreenFramesGrid, setLiveScreenFramesGrid] = useState<{ [email: string]: { frame: string | null; isOffline: boolean } }>({});
  const [zoomedStudent, setZoomedStudent] = useState<{ email: string; name: string; frame: string | null; isOffline: boolean } | null>(null);

  // Edit exam modal state
  const [editingExam, setEditingExam] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [updating, setUpdating] = useState(false);

  // Clone exam modal state
  const [cloningExam, setCloningExam] = useState<any>(null);
  const [cloneTitle, setCloneTitle] = useState("");
  const [cloneCode, setCloneCode] = useState("");
  const [cloneDuration, setCloneDuration] = useState("");
  const [cloneStartTime, setCloneStartTime] = useState("");
  const [cloneEndTime, setCloneEndTime] = useState("");
  const [cloneCameraMonitor, setCloneCameraMonitor] = useState(false);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  // Poll screen frame updates from student screen stream
  useEffect(() => {
    if (!viewingStudentScreen) {
      setLiveScreenFrame(null);
      setScreenOffline(false);
      return;
    }

    const fetchScreenFrame = async () => {
      try {
        const res = await fetch(`${BASE_URL}/exam/screen-frame/${viewingStudentScreen.examCode}/${encodeURIComponent(viewingStudentScreen.email)}`);
        const data = await res.json();
        if (res.ok) {
          setLiveScreenFrame(data.frame);
          setScreenOffline(data.isOffline);
        }
      } catch (err) {
        console.error("Error fetching screen frame:", err);
      }
    };

    fetchScreenFrame();
    const intervalId = setInterval(fetchScreenFrame, 3000);

    return () => clearInterval(intervalId);
  }, [viewingStudentScreen]);

  const handleViewScreen = (examCode: string, email: string, name: string) => {
    setViewingStudentScreen({ examCode, email, name });
  };

  // Poll screen frames for ALL students in the active exam
  useEffect(() => {
    if (!monitorExam || activeViewTab !== "grid") {
      setLiveScreenFramesGrid({});
      return;
    }

    const fetchAllScreenFrames = async () => {
      try {
        const res = await fetch(`${BASE_URL}/exam/screen-frames/${monitorExam.examCode}`);
        const data = await res.json();
        if (res.ok) {
          setLiveScreenFramesGrid(data);

          // If zoomed student is active, update their specific frame in real-time
          setZoomedStudent((current) => {
            if (!current) return null;
            const updated = data[current.email.toLowerCase()];
            if (updated) {
              return {
                ...current,
                frame: updated.frame,
                isOffline: updated.isOffline,
              };
            }
            return current;
          });
        }
      } catch (err) {
        console.error("Error fetching all screen frames:", err);
      }
    };

    fetchAllScreenFrames();
    const intervalId = setInterval(fetchAllScreenFrames, 3000);

    return () => clearInterval(intervalId);
  }, [monitorExam, activeViewTab]);

  const fetchExams = async () => {
    try {
      const res = await fetch(`${BASE_URL}/exam/all`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setExams(data);
      } else if (Array.isArray(data.exams)) {
        setExams(data.exams);
      } else {
        setExams([]);
      }
    } catch (error) {
      console.error("Failed to fetch exams");
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("coreAdmin");
    navigate("/coreadmin-login");
  };

  const calculateTotalMarks = (questions: any[]) => {
    if (!questions) return 0;
    return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  };

  // 🔥 FETCH RESULTS FOR A SPECIFIC EXAM
  const handleOpenMonitor = async (exam: any) => {
    setMonitorExam(exam);
    setLoadingResults(true);
    try {
      const res = await fetch(`${BASE_URL}/exam/results/${exam.examCode}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Failed to fetch results", err);
      setResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  // 🔥 EXPORT RESULTS TO SPREADSHEET
  const handleExportResults = (examCode: string) => {
    if (!results.length) {
      alert("No results to export.");
      return;
    }

    const dataToExport = results.map((r, index) => ({
      "S.No": index + 1,
      "Student Name": r.studentName,
      "Student Email": r.studentEmail || "N/A",
      "Score Obtained": r.score,
      "Total Marks": r.totalMarks,
      "Tab Switches": r.tabSwitchCount || 0,
      "Face Warnings": r.faceWarningCount || 0,
      "AI Proctor Verdict": r.terminated 
        ? (r.faceTurnTerminated ? "TERMINATED (Face turns limit)" : "TERMINATED (Tab switches limit)")
        : (r.tabSwitched || (r.faceWarningCount && r.faceWarningCount > 0))
          ? "WARNING FLAGGED" 
          : "CLEAN",
      "Submission Date": r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Submissions");
    XLSX.writeFile(workbook, `Results_${examCode}.xlsx`);
  };

  // 🔥 OPEN EDIT MODAL
  const handleOpenEdit = (exam: any) => {
    setEditingExam(exam);
    setEditTitle(exam.title || "");
    setEditDuration(String(exam.duration || 60));
    setEditStartTime(exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : "");
    setEditEndTime(exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : "");
  };

  // 🔥 SAVE EXAM EDITS
  const handleSaveEdits = async () => {
    if (!editTitle || !editDuration) {
      alert("Title and duration are required.");
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/exam/update/${editingExam._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          duration: editDuration,
          startTime: editStartTime,
          endTime: editEndTime,
        }),
      });

      if (res.ok) {
        alert("Exam updated successfully!");
        setEditingExam(null);
        fetchExams();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update exam");
      }
    } catch (err) {
      alert("Server error updating exam");
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 OPEN CLONE MODAL
  const handleOpenClone = (exam: any) => {
    setCloningExam(exam);
    setCloneTitle(`Copy of ${exam.title}`);
    setCloneCode("");
    setCloneDuration(String(exam.duration || 60));
    setCloneStartTime(exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : "");
    setCloneEndTime(exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : "");
    setCloneCameraMonitor(exam.cameraMonitor || false);
  };

  // 🔥 CREATE CLONED EXAM
  const handleCloneExam = async () => {
    if (!cloneTitle || !cloneCode || !cloneDuration) {
      alert("All fields are required.");
      return;
    }
    setCloning(true);
    try {
      const formData = new FormData();
      formData.append("title", cloneTitle);
      formData.append("examCode", cloneCode.toUpperCase().trim());
      formData.append("duration", cloneDuration);
      formData.append("startTime", cloneStartTime ? new Date(cloneStartTime).toISOString() : "");
      formData.append("endTime", cloneEndTime ? new Date(cloneEndTime).toISOString() : "");
      formData.append("adminEmail", "coreadmin@secureexam.com");
      formData.append("cameraMonitor", String(cloneCameraMonitor));
      formData.append("questions", JSON.stringify(cloningExam.questions));

      const res = await fetch(`${BASE_URL}/exam/create`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert("Exam cloned successfully!");
        setCloningExam(null);
        fetchExams();
      } else {
        alert(data.message || "Failed to clone exam");
      }
    } catch (err) {
      alert("Server error cloning exam");
    } finally {
      setCloning(false);
    }
  };

  // Filter examinations based on query
  const filteredExams = exams.filter((exam) => {
    const titleMatch = exam.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const codeMatch = exam.examCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || codeMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* ======================================= */}
      {/* 📁 SIDEBAR NAVIGATION PANEL */}
      {/* ======================================= */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-6 flex-shrink-0 border-r border-slate-950">
        <div className="space-y-8">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="SecureExam Pro Logo" className="h-8 w-8 object-contain" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-white text-sm leading-none tracking-tight">SecureExam Pro</span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Control Center</span>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("exams")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "exams"
                  ? "bg-blue-600 text-white shadow"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Grid className="h-4 w-4" />
              Assessments
            </button>
            
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "settings"
                  ? "bg-blue-600 text-white shadow"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Settings className="h-4 w-4" />
              Proctor Configurations
            </button>
          </div>

        </div>

        {/* Footer profile status & Logout */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Examiner Profile</span>
              <span className="text-[10px] text-slate-500 font-mono">coreadmin</span>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-750 text-xs font-bold py-2 rounded-xl"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" /> Log Out
          </Button>
        </div>
      </aside>

      {/* ======================================= */}
      {/* 🖥 MAIN CONTENT PANEL */}
      {/* ======================================= */}
      <main className="flex-grow flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              {activeTab === "exams" ? "Assessment Management Dashboard" : "Platform Proctoring Controls"}
            </h1>
            <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-500 border border-slate-200 text-[10px] py-0 px-2 rounded font-semibold ml-2">
              Lobby Active
            </Badge>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="p-8 flex-grow overflow-y-auto space-y-8">
          
          {activeTab === "exams" ? (
            <>
              {/* Stats Panel Grid */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                
                {/* Stat 1 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Assessments</p>
                    <p className="text-3xl font-black text-slate-900">{exams.length}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Evaluated Pool</p>
                    <p className="text-3xl font-black text-slate-900">
                      {exams.reduce((sum, exam) => sum + (exam.questions?.length || 0), 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sum Aggregate Marks</p>
                    <p className="text-3xl font-black text-slate-900">
                      {exams.reduce((sum, exam) => sum + calculateTotalMarks(exam.questions), 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-blue-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>

              </div>

              {/* Table Section */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
                
                {/* Table Header controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  
                  {/* Search bar */}
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Filter by title or code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-slate-50/50 border-slate-200 text-xs h-10 w-full"
                    />
                  </div>

                  {/* Creation button */}
                  <CreateExamDialog onExamCreated={fetchExams} />
                </div>

                {/* Table element */}
                {loading ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                    Loading exam schedules...
                  </div>
                ) : filteredExams.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No active assessments match your filter query.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-slate-700 text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider text-left">
                          <th className="px-5 py-3.5">Assessment Title</th>
                          <th className="px-5 py-3.5">Exam Code</th>
                          <th className="px-5 py-3.5">Duration</th>
                          <th className="px-5 py-3.5">AI Proctor status</th>
                          <th className="px-5 py-3.5 text-center">Questions Count</th>
                          <th className="px-5 py-3.5 text-center">Total Marks</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredExams.map((exam) => (
                          <tr key={exam._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-900 text-left">{exam.title}</td>
                            <td className="px-5 py-4 font-mono font-bold text-slate-400 text-left uppercase">{exam.examCode}</td>
                            <td className="px-5 py-4 text-slate-500 text-left">{exam.duration} mins</td>
                            <td className="px-5 py-4 text-left">
                              {exam.cameraMonitor ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px] rounded py-0.5 px-2">
                                  Proctored
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-400 border border-slate-200 font-medium text-[10px] rounded py-0.5 px-2">
                                  Standard
                                </Badge>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center font-bold text-slate-500">{exam.questions?.length || 0}</td>
                            <td className="px-5 py-4 text-center font-black text-slate-900">{calculateTotalMarks(exam.questions)}</td>
                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex gap-1.5 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Monitor Results"
                                  className="h-8 px-2.5 text-xs gap-1 border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-blue-600 font-bold"
                                  onClick={() => handleOpenMonitor(exam)}
                                >
                                  <Eye className="h-3.5 w-3.5" /> Monitor
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Edit Details"
                                  className="h-8 px-2 text-xs gap-1 border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-amber-600 font-semibold"
                                  onClick={() => handleOpenEdit(exam)}
                                >
                                  <Edit2 className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Clone Pool"
                                  className="h-8 px-2 text-xs gap-1 border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-purple-600 font-semibold"
                                  onClick={() => handleOpenClone(exam)}
                                >
                                  <Copy className="h-3.5 w-3.5" /> Clone
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            </>
          ) : (
            /* System Settings / Configurations Panel Mock */
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm max-w-2xl text-left space-y-4">
              <h2 className="text-lg font-bold text-slate-900">AI Proctor Config Engine</h2>
              <p className="text-slate-500 text-xs leading-relaxed">
                Configure proctor monitoring thresholds, camera face scan variance checking margins, and secure lockouts.
              </p>
              
              <div className="space-y-4 pt-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-800">Face Asymmetry Tolerance</div>
                  <p className="text-slate-400 text-[11px]">Default threshold setting represents the allowable change ratio in pixels. Currently stabilized at 0.05.</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-800">Tab Switch Warning limits</div>
                  <p className="text-slate-400 text-[11px]">Maximum number of focus exits allowed before the test triggers automatic submission. Locked at 3 warnings.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ======================================= */}
      {/* 📊 MONITOR RESULTS MODAL */}
      {/* ======================================= */}
      <Dialog open={!!monitorExam} onOpenChange={(v) => { if (!v) { setMonitorExam(null); setActiveViewTab("table"); setLiveScreenFramesGrid({}); } }}>
        <DialogContent className="max-w-4xl w-full max-h-[85vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader className="flex flex-row justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <div className="text-left">
              <DialogTitle className="text-lg font-bold text-slate-900">Student Submissions</DialogTitle>
              <p className="text-xs text-slate-400 mt-1">
                Exam: <span className="font-semibold text-slate-700">{monitorExam?.title} ({monitorExam?.examCode})</span>
              </p>
            </div>
            {results.length > 0 && (
              <Button
                onClick={() => handleExportResults(monitorExam?.examCode)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 h-9 text-xs font-semibold rounded-xl px-4 shadow-sm"
              >
                <Download className="h-4 w-4" /> Export Results Sheet
              </Button>
            )}
          </DialogHeader>

          <div className="pt-2">
            {/* View Tab Toggle */}
            {monitorExam?.cameraMonitor && results.length > 0 && (
              <div className="flex gap-2 mb-4 border-b border-slate-100 pb-2">
                <Button
                  variant={activeViewTab === "table" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs font-bold px-4"
                  onClick={() => setActiveViewTab("table")}
                >
                  Table View
                </Button>
                <Button
                  variant={activeViewTab === "grid" ? "default" : "outline"}
                  size="sm"
                  className={`h-8 text-xs font-bold px-4 ${activeViewTab === "grid" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                  onClick={() => setActiveViewTab("grid")}
                >
                  Live Grid Proctoring
                </Button>
              </div>
            )}

            {loadingResults ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                Fetching submission records...
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                <p className="text-xs font-semibold">No submissions recorded for this assessment yet.</p>
              </div>
            ) : activeViewTab === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((r) => {
                  const studentData = liveScreenFramesGrid[r.studentEmail?.toLowerCase()];
                  const frame = studentData?.frame;
                  const isOffline = studentData ? studentData.isOffline : true;

                  return (
                    <div
                      key={r._id}
                      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col justify-between text-left text-white"
                    >
                      {/* Card Header info */}
                      <div className="p-3 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-100 truncate max-w-[150px]">{r.studentName}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{r.studentEmail}</div>
                        </div>
                        <div>
                          {isOffline ? (
                            <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold py-0.5 px-1.5 uppercase tracking-wider">
                              Offline
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold py-0.5 px-1.5 uppercase tracking-wider animate-pulse">
                              Live
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Live screen feed container */}
                      <div
                        className="bg-slate-950 aspect-video flex items-center justify-center border-b border-slate-850 overflow-hidden relative group cursor-pointer"
                        onClick={() => {
                          if (frame) {
                            setZoomedStudent({
                              email: r.studentEmail,
                              name: r.studentName,
                              frame,
                              isOffline
                            });
                          }
                        }}
                      >
                        {frame ? (
                          <>
                            <img
                              src={frame}
                              alt={`${r.studentName} Screen Feed`}
                              className="w-full h-full object-contain"
                            />
                            {/* Hover overlay indicator */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider">
                              <Search className="h-4 w-4 mr-1.5" /> Click to Zoom
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-slate-500 flex flex-col items-center gap-1 font-semibold">
                            <span className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                            Awaiting Stream...
                          </div>
                        )}
                      </div>

                      {/* Card Footer proctor indicators */}
                      <div className="p-3 bg-slate-950 text-[10px] space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Warnings (Tab/Face):</span>
                          <span className="font-bold font-mono text-slate-200">
                            {r.tabSwitchCount || 0} / {r.faceWarningCount || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Status Verdict:</span>
                          <span>
                            {r.terminated ? (
                              <span className="text-red-400 font-bold uppercase">Disqualified</span>
                            ) : (r.tabSwitched || (r.faceWarningCount && r.faceWarningCount > 0)) ? (
                              <span className="text-amber-400 font-bold uppercase">Warnings Flagged</span>
                            ) : (
                              <span className="text-emerald-400 font-bold uppercase">Clean</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-slate-700 text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-center">Warnings (Tab / Face)</th>
                      <th className="px-4 py-3 text-center">Proctor Status</th>
                      <th className="px-4 py-3 text-right">Submitted At</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800">{r.studentName}</td>
                        <td className="px-4 py-3 text-slate-500">{r.studentEmail || "N/A"}</td>
                        <td className="px-4 py-3 text-center font-extrabold text-blue-600">
                          {r.score} / {r.totalMarks}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">
                          {r.tabSwitchCount || 0} / {r.faceWarningCount || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.terminated ? (
                            <Badge className="bg-red-50 text-red-700 border border-red-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                              {r.faceTurnTerminated ? "Disqualified (Face)" : "Disqualified (Tab)"}
                            </Badge>
                          ) : (r.tabSwitched || (r.faceWarningCount && r.faceWarningCount > 0)) ? (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                              Warning Flagged
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                              Clean
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {monitorExam?.cameraMonitor && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[10px] gap-1 font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => handleViewScreen(monitorExam.examCode, r.studentEmail, r.studentName)}
                            >
                              <Eye className="h-3 w-3" /> View Screen
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ======================================= */}
      {/* 🖥️ LIVE SCREEN PROCTOR MONITOR MODAL */}
      {/* ======================================= */}
      <Dialog open={!!viewingStudentScreen} onOpenChange={(v) => !v && setViewingStudentScreen(null)}>
        <DialogContent className="max-w-xl w-full rounded-2xl p-6 bg-slate-955 text-white border border-slate-800">
          <DialogHeader className="border-b border-slate-900 pb-3 mb-4 flex flex-row justify-between items-center">
            <div className="text-left">
              <DialogTitle className="text-sm font-bold tracking-tight text-white uppercase">Live Screen Proctor Feed</DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Candidate: <span className="font-bold text-slate-200">{viewingStudentScreen?.name}</span> ({viewingStudentScreen?.email})
              </p>
            </div>
            {screenOffline ? (
              <Badge className="bg-red-500/10 text-red-400 border border-red-500/25 text-[9px] font-bold rounded py-0.5 px-2 uppercase tracking-wider">
                Offline / Paused
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] font-bold rounded py-0.5 px-2 uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live Streaming
              </Badge>
            )}
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
              {liveScreenFrame ? (
                <img
                  src={liveScreenFrame}
                  alt="Candidate Live Screen Feed"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                  <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Awaiting screen capture handshake...
                </div>
              )}
            </div>
            
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Screen recording frame updates dynamically every 3 seconds. The proctor session complies with candidate screen privacy regulations.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ======================================= */}
      {/* 🖥️ LIVE SCREEN ZOOM VIEW MODAL */}
      {/* ======================================= */}
      <Dialog open={!!zoomedStudent} onOpenChange={(v) => !v && setZoomedStudent(null)}>
        <DialogContent className="max-w-4xl w-full rounded-2xl p-6 bg-slate-955 text-white border border-slate-800">
          <DialogHeader className="border-b border-slate-900 pb-3 mb-4 flex flex-row justify-between items-center">
            <div className="text-left">
              <DialogTitle className="text-sm font-bold tracking-tight text-white uppercase">ZOOM FEED MONITOR</DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Candidate: <span className="font-bold text-slate-200">{zoomedStudent?.name}</span> ({zoomedStudent?.email})
              </p>
            </div>
            {zoomedStudent?.isOffline ? (
              <Badge className="bg-red-500/10 text-red-400 border border-red-500/25 text-[9px] font-bold rounded py-0.5 px-2 uppercase tracking-wider">
                Offline
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[9px] font-bold rounded py-0.5 px-2 uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Streaming Live
              </Badge>
            )}
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
              {zoomedStudent?.frame ? (
                <img
                  src={zoomedStudent.frame}
                  alt="Candidate Live Screen Zoomed Feed"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                  <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Connecting feed...
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ======================================= */}
      {/* ✏️ EDIT EXAM MODAL */}
      {/* ======================================= */}
      <Dialog open={!!editingExam} onOpenChange={(v) => !v && setEditingExam(null)}>
        <DialogContent className="max-w-md w-full rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-3 mb-3">
            <DialogTitle className="text-base font-bold text-slate-900">Edit Examination Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-left">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Exam Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Duration (minutes)</Label>
              <Input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Start Time</Label>
              <Input type="datetime-local" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="bg-slate-50 border-slate-200 text-xs h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">End Time</Label>
              <Input type="datetime-local" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="bg-slate-50 border-slate-200 text-xs h-10" />
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-xs shadow-md transition-all rounded-xl mt-4"
              onClick={handleSaveEdits}
              disabled={updating}
            >
              {updating ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ======================================= */}
      {/* 📋 CLONE EXAM MODAL */}
      {/* ======================================= */}
      <Dialog open={!!cloningExam} onOpenChange={(v) => !v && setCloningExam(null)}>
        <DialogContent className="max-w-md w-full rounded-2xl p-6">
          <DialogHeader className="border-b border-slate-100 pb-3 mb-3">
            <DialogTitle className="text-base font-bold text-slate-900">Clone Examination Drive</DialogTitle>
            <p className="text-[11px] text-slate-400 mt-1">
              Cloning questions from: <span className="font-semibold text-slate-700">{cloningExam?.title} ({cloningExam?.examCode})</span>
            </p>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-left">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">New Exam Title</Label>
              <Input value={cloneTitle} onChange={(e) => setCloneTitle(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">New Exam Code (Must be unique)</Label>
              <Input
                placeholder="e.g. CODESPRING2026"
                value={cloneCode}
                onChange={(e) => setCloneCode(e.target.value.toUpperCase())}
                className="bg-slate-50 border-slate-200 text-sm h-10 font-mono tracking-wider"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Duration (minutes)</Label>
              <Input type="number" value={cloneDuration} onChange={(e) => setCloneDuration(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Start Time</Label>
              <Input type="datetime-local" value={cloneStartTime} onChange={(e) => setCloneStartTime(e.target.value)} className="bg-slate-50 border-slate-200 text-xs h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">End Time</Label>
              <Input type="datetime-local" value={cloneEndTime} onChange={(e) => setCloneEndTime(e.target.value)} className="bg-slate-50 border-slate-200 text-xs h-10" />
            </div>
            <div className="flex items-center space-x-2.5 py-1">
              <input
                type="checkbox"
                id="cloneCameraMonitor"
                className="h-4.5 w-4.5 text-blue-600 rounded border-slate-350"
                checked={cloneCameraMonitor}
                onChange={(e) => setCloneCameraMonitor(e.target.checked)}
              />
              <Label htmlFor="cloneCameraMonitor" className="cursor-pointer font-bold text-slate-750 text-xs select-none leading-tight">
                Enable AI proctor webcam check for this clone
              </Label>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-xs shadow-md transition-all rounded-xl mt-4"
              onClick={handleCloneExam}
              disabled={cloning}
            >
              {cloning ? "Cloning Pool..." : "Clone Exam"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

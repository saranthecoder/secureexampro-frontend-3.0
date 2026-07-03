import { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import BASE_URL from "@/config/api";
import CreateExamDialog from "@/components/CreateExamDialog";
import Loader from "@/components/Loader";
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
  Activity,
  Trash2,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "exams" | "monitoring" | "settings" | "profile">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Profile credentials state
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");

  useEffect(() => {
    const savedAdmin = JSON.parse(
      localStorage.getItem("adminCredentials") ||
      '{"username":"coreadmin","password":"Secure@123","email":"coreadmin@secureexam.com"}'
    );
    setProfileUsername(savedAdmin.username);
    setProfileEmail(savedAdmin.email);
    setProfilePassword(savedAdmin.password);
  }, [activeTab]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUsername || !profileEmail || !profilePassword) {
      Swal.fire({
        title: "Validation Error",
        text: "All fields are required.",
        icon: "warning",
        confirmButtonColor: "#3b82f6"
      });
      return;
    }
    const updatedAdmin = {
      username: profileUsername,
      email: profileEmail,
      password: profilePassword,
    };
    localStorage.setItem("adminCredentials", JSON.stringify(updatedAdmin));
    Swal.fire({
      title: "Success",
      text: "Profile updated successfully!",
      icon: "success",
      confirmButtonColor: "#3b82f6"
    });
  };

  // Monitor results modal state
  const [monitorExam, setMonitorExam] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [activeCandidates, setActiveCandidates] = useState<{ [email: string]: { name: string; isOffline: boolean } }>({});

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

  const handleTerminateStudent = async (examCode: string, email: string) => {
    const confirmation = await Swal.fire({
      title: "Terminate Candidate?",
      text: "Are you sure you want to terminate this student's exam? This action will disqualify the candidate immediately.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3b82f6",
      confirmButtonText: "Yes, Terminate"
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/exam/terminate/${examCode}/${encodeURIComponent(email)}`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: "Terminated",
          text: data.message || "Student terminated successfully.",
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
        // Refresh updates immediately
        if (monitorExam) {
          const resultsRes = await fetch(`${BASE_URL}/exam/results/${monitorExam.examCode}`);
          const dbResults = resultsRes.ok ? await resultsRes.json() : [];
          
          const candidatesRes = await fetch(`${BASE_URL}/exam/active-candidates/${monitorExam.examCode}`);
          const activeCands = candidatesRes.ok ? await candidatesRes.json() : {};
          
          setActiveCandidates(activeCands);
          
          const dbEmails = new Set(dbResults.map((r: any) => r.studentEmail?.toLowerCase()));
          const activeResults = Object.keys(activeCands)
            .filter((email) => !dbEmails.has(email.toLowerCase()))
            .map((email) => {
              const candInfo = activeCands[email];
              return {
                _id: `active-${email}`,
                studentName: candInfo.name || "Candidate",
                studentEmail: email,
                score: "In Progress",
                positiveMarks: 0,
                negativeMarks: 0,
                totalMarks: monitorExam.questions ? monitorExam.questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0) : 0,
                tabSwitchCount: 0,
                faceWarningCount: 0,
                isActive: true,
                isOffline: candInfo.isOffline,
                submittedAt: null
              };
            });
            
          setResults([...activeResults, ...dbResults]);
        }
      } else {
        Swal.fire({
          title: "Error",
          text: data.error || "Failed to terminate student.",
          icon: "error",
          confirmButtonColor: "#3b82f6"
        });
      }
    } catch (err) {
      console.error("Error terminating student:", err);
      Swal.fire({
        title: "Server Error",
        text: "Server error terminating student.",
        icon: "error",
        confirmButtonColor: "#3b82f6"
      });
    }
  };

  // Poll active candidates list and DB results for ALL students in the active exam
  useEffect(() => {
    if (!monitorExam) {
      setActiveCandidates({});
      return;
    }

    const fetchUpdates = async () => {
      try {
        const res = await fetch(`${BASE_URL}/exam/results/${monitorExam.examCode}`);
        const dbResults = res.ok ? await res.json() : [];

        const candidatesRes = await fetch(`${BASE_URL}/exam/active-candidates/${monitorExam.examCode}`);
        const activeCands = candidatesRes.ok ? await candidatesRes.json() : {};

        setActiveCandidates(activeCands);

        // Merge DB results with active student sessions
        const dbEmails = new Set(dbResults.map((r: any) => r.studentEmail?.toLowerCase()));
        
        const activeResults = Object.keys(activeCands)
          .filter((email) => !dbEmails.has(email.toLowerCase()))
          .map((email) => {
            const candInfo = activeCands[email];
            return {
              _id: `active-${email}`,
              studentName: candInfo.name || "Candidate",
              studentEmail: email,
              score: "In Progress",
              positiveMarks: 0,
              negativeMarks: 0,
              totalMarks: monitorExam.questions ? monitorExam.questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0) : 0,
              tabSwitchCount: 0,
              faceWarningCount: 0,
              isActive: true,
              isOffline: candInfo.isOffline,
              submittedAt: null
            };
          });

        setResults([...activeResults, ...dbResults]);

      } catch (err) {
        console.error("Error fetching updates:", err);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchUpdates();
    const intervalId = setInterval(fetchUpdates, 3000);

    return () => clearInterval(intervalId);
  }, [monitorExam]);

  const fetchExams = async () => {
    setLoading(true);
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
  const handleOpenMonitor = (exam: any) => {
    setMonitorExam(exam);
    setLoadingResults(true);
  };

  // 🔥 EXPORT RESULTS TO SPREADSHEET
  const handleExportResults = (examCode: string) => {
    if (!results.length) {
      Swal.fire({
        title: "Export Failed",
        text: "No results to export.",
        icon: "warning",
        confirmButtonColor: "#3b82f6"
      });
      return;
    }

    const dataToExport = results.map((r, index) => ({
      "S.No": index + 1,
      "Student Name": r.studentName,
      "Student Email": r.studentEmail || "N/A",
      "Score Obtained (Net)": r.score,
      "Positive Marks Obtained": r.isActive ? "-" : (r.positiveMarks || 0),
      "Negative Marks Obtained": r.isActive ? "-" : (r.negativeMarks || 0),
      "Total Marks": r.totalMarks,
      "Tab Switches": r.tabSwitchCount || 0,
      "Face Warnings": r.faceWarningCount || 0,
      "AI Proctor Verdict": r.terminated 
        ? (r.faceTurnTerminated ? "TERMINATED (Face turns limit)" : "TERMINATED (Tab switches limit)")
        : r.isActive 
          ? "ACTIVE IN PROGRESS"
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

  const toLocalISOString = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  // 🔥 OPEN EDIT MODAL
  const handleOpenEdit = (exam: any) => {
    setEditingExam(exam);
    setEditTitle(exam.title || "");
    setEditDuration(String(exam.duration || 60));
    setEditStartTime(toLocalISOString(exam.startTime));
    setEditEndTime(toLocalISOString(exam.endTime));
  };

  // 🔥 SAVE EXAM EDITS
  const handleSaveEdits = async () => {
    if (!editTitle || !editDuration) {
      Swal.fire({
        title: "Validation Error",
        text: "Title and duration are required.",
        icon: "warning",
        confirmButtonColor: "#3b82f6"
      });
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
          startTime: editStartTime ? new Date(editStartTime).toISOString() : "",
          endTime: editEndTime ? new Date(editEndTime).toISOString() : "",
        }),
      });

      if (res.ok) {
        Swal.fire({
          title: "Updated",
          text: "Exam updated successfully!",
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
        setEditingExam(null);
        fetchExams();
      } else {
        const data = await res.json();
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to update exam",
          icon: "error",
          confirmButtonColor: "#3b82f6"
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Server Error",
        text: "Server error updating exam",
        icon: "error",
        confirmButtonColor: "#3b82f6"
      });
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
    setCloneStartTime(toLocalISOString(exam.startTime));
    setCloneEndTime(toLocalISOString(exam.endTime));
    setCloneCameraMonitor(exam.cameraMonitor || false);
  };

  // 🔥 CREATE CLONED EXAM
  const handleCloneExam = async () => {
    if (!cloneTitle || !cloneCode || !cloneDuration) {
      Swal.fire({
        title: "Validation Error",
        text: "All fields are required.",
        icon: "warning",
        confirmButtonColor: "#3b82f6"
      });
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
        Swal.fire({
          title: "Cloned",
          text: "Exam cloned successfully!",
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
        setCloningExam(null);
        fetchExams();
      } else {
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to clone exam",
          icon: "error",
          confirmButtonColor: "#3b82f6"
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Server Error",
        text: "Server error cloning exam",
        icon: "error",
        confirmButtonColor: "#3b82f6"
      });
    } finally {
      setCloning(false);
    }
  };

  const handleDeleteExam = async (exam: any) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to permanently delete the exam "${exam.title}"? This will also delete all candidate results.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${BASE_URL}/exam/delete/${exam._id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          Swal.fire({
            title: "Deleted!",
            text: "Exam and all results deleted successfully.",
            icon: "success",
            confirmButtonColor: "#3b82f6"
          });
          fetchExams();
        } else {
          const data = await res.json();
          Swal.fire({
            title: "Error",
            text: data.message || "Failed to delete exam.",
            icon: "error",
            confirmButtonColor: "#3b82f6"
          });
        }
      } catch (error: any) {
        Swal.fire({
          title: "Error",
          text: error.message || "Failed to delete exam.",
          icon: "error",
          confirmButtonColor: "#3b82f6"
        });
      }
    }
  };

  // Memoized examinations filtering
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const titleMatch = exam.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const codeMatch = exam.examCode?.toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatch || codeMatch;
    });
  }, [exams, searchQuery]);

  // Memoized metrics calculations for performance optimization
  const totalQuestionsPool = useMemo(() => {
    return exams.reduce((sum, e) => sum + (e.questions?.length || 0), 0);
  }, [exams]);

  const averageDuration = useMemo(() => {
    return exams.length > 0
      ? Math.round(exams.reduce((sum, e) => sum + Number(e.duration || 60), 0) / exams.length)
      : 0;
  }, [exams]);

  const sumAggregateMarks = useMemo(() => {
    return exams.reduce((sum, exam) => sum + calculateTotalMarks(exam.questions), 0);
  }, [exams]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex font-sans text-slate-800">
      
      {/* ======================================= */}
      {/* 📁 SIDEBAR NAVIGATION PANEL */}
      {/* ======================================= */}
      <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col justify-between p-6 flex-shrink-0 border-r border-slate-950">
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
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </button>

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
              onClick={() => {
                setActiveTab("monitoring");
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "monitoring"
                  ? "bg-blue-600 text-white shadow"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="h-4 w-4" />
              Live Monitoring
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

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white shadow"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="h-4 w-4" />
              Admin Profile
            </button>
          </div>

        </div>

        {/* Footer profile status & Logout */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs uppercase">
              {(profileUsername || "A").charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Examiner Profile</span>
              <span className="text-[10px] text-slate-500 font-mono">{profileUsername || "coreadmin"}</span>
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
      <main className="flex-grow flex flex-col h-full min-w-0">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 uppercase tracking-wider">
              {activeTab === "dashboard"
                ? "Assessment Metrics & Analytics"
                : activeTab === "exams" 
                  ? "Assessment Management Dashboard" 
                  : activeTab === "monitoring" 
                    ? "Student Telemetry & Proctor Monitor" 
                    : activeTab === "profile"
                      ? "Admin Profile & Accounts"
                      : "Platform Proctoring Controls"}
            </h1>
            <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-500 border border-slate-200 text-[10px] py-0 px-2 rounded font-semibold ml-2">
              Lobby Active
            </Badge>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="p-8 flex-grow overflow-y-auto space-y-8">
          
          {activeTab === "dashboard" ? (
            <div className="space-y-8">
              {/* Analytics Summary Banner Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div className="text-left space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-bold">Assessments Built</span>
                    <h3 className="text-2xl font-extrabold text-slate-800">{exams.length}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div className="text-left space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-bold">Total Questions Pool</span>
                    <h3 className="text-2xl font-extrabold text-slate-800">
                      {totalQuestionsPool}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Grid className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div className="text-left space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-bold">Active Test Takers</span>
                    <h3 className="text-2xl font-extrabold text-emerald-600">
                      {Object.keys(activeCandidates).length}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Activity className="h-5 w-5 animate-pulse" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div className="text-left space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-bold">Average Duration</span>
                    <h3 className="text-2xl font-extrabold text-slate-800">
                      {averageDuration} mins
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Settings className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Analysis Graphics Block */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Security Verdict overview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left lg:col-span-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">System Security Diagnosis</h3>
                    <p className="text-[11px] text-slate-400">Overall monitoring anomalies and security warnings logged across exam drives.</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-500" /> Focus-Loss Locks (Tab switches)</span>
                      <span className="font-extrabold text-slate-800">Strict Lockout (3 max)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Shield className="h-4 w-4 text-blue-500" /> Assessment Integrity Protocol</span>
                      <span className="font-extrabold text-emerald-600">Active (Automatic Verification)</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-slate-700">Assessment Breakdown:</div>
                    <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
                      {exams.map((ex) => (
                        <div key={ex._id} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-xs">
                          <span className="font-semibold text-slate-700">{ex.title}</span>
                          <span className="font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{ex.examCode}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Instructions / Fast actions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left flex flex-col justify-between row-span-2">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Integrity Center</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">Ensure academic standards. Terminate any anomalous sessions directly from the Live Monitoring module in the sidebar.</p>
                    
                    {/* Visual Gauge Indicator */}
                    <div className="py-4 border-y border-slate-100 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-extrabold text-xs shadow-sm">
                          98%
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">Integrity Score</span>
                          <span className="text-[10px] text-slate-400">Average compliance rating</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Focus anomalies</span>
                          <span className="text-slate-400 font-mono">Low risk (2.4%)</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Exam lockouts</span>
                          <span className="text-slate-400 font-mono">0 active blockouts</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Flagged switches</span>
                          <span className="text-slate-400 font-mono">Safe thresholds</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2.5 pt-4">
                    <Button 
                      onClick={() => setActiveTab("exams")} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 rounded-xl shadow-sm"
                    >
                      Manage Assessments
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("monitoring")} 
                      variant="outline" 
                      className="w-full border-slate-200 text-xs font-bold h-10 rounded-xl shadow-sm"
                    >
                      Open Live Telemetry
                    </Button>
                  </div>
                </div>

                {/* Ingress Traffic Analysis (LMS Gateway integration) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left lg:col-span-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Infrastructure Traffic & Node Gateway</h3>
                    <p className="text-[11px] text-slate-400">Real-time gateway load tracking and inbound API requests volume.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Total API Traffic</span>
                      <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                        {Object.keys(activeCandidates).length * 12 + 18} req/min
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400">DB Response Speed</span>
                      <div className="text-sm font-extrabold text-blue-600 mt-0.5">4ms</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400">API Gateway CPU</span>
                      <div className="text-sm font-extrabold text-slate-800 mt-0.5">14%</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Cluster Status</span>
                      <div className="text-sm font-extrabold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Healthy
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Gateway Ingress Load</span>
                        <span>{(Object.keys(activeCandidates).length * 4 + 12)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500" 
                          style={{ width: `${Math.min(100, Object.keys(activeCandidates).length * 4 + 12)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Memory Allocation (Heap)</span>
                        <span>184MB / 512MB</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: "36%" }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : activeTab === "exams" ? (
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
                      {totalQuestionsPool}
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
                      {sumAggregateMarks}
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
                          <th className="px-5 py-3.5 text-center">Questions Count</th>
                          <th className="px-5 py-3.5 text-center">Total Marks</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredExams.map((exam) => (
                          <tr key={exam._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 text-left">
                              <div className="font-bold text-slate-900">{exam.title}</div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                Start: {exam.startTime ? new Date(exam.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A"} | End: {exam.endTime ? new Date(exam.endTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}
                              </div>
                            </td>
                            <td className="px-5 py-4 font-mono font-bold text-slate-400 text-left uppercase">{exam.examCode}</td>
                            <td className="px-5 py-4 text-slate-500 text-left">{exam.duration} mins</td>
                            <td className="px-5 py-4 text-center font-bold text-slate-500">{exam.questions?.length || 0}</td>
                            <td className="px-5 py-4 text-center font-black text-slate-900">{calculateTotalMarks(exam.questions)}</td>
                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex gap-1.5 justify-end">
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Delete Exam"
                                  className="h-8 px-2 text-xs gap-1 border-slate-200 hover:bg-red-50 hover:text-red-700 text-red-600 font-semibold"
                                  onClick={() => handleDeleteExam(exam)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
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
          ) : activeTab === "monitoring" ? (
            <div className="space-y-6">
              {/* Header Title & Selector */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-left">
                    <h2 className="text-lg font-bold text-slate-900">Student Proctor & Submission Monitor</h2>
                    <p className="text-xs text-slate-400">Track active test-takers, review metrics, and manage exam sessions in real-time.</p>
                  </div>
                  <div className="w-full md:w-72 text-left">
                    <Label className="text-xs font-bold text-slate-500 mb-1.5 block">Select Assessment Drive</Label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={monitorExam?.examCode || ""}
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        const matchedExam = exams.find(ex => ex.examCode === selectedCode);
                        if (matchedExam) {
                          setMonitorExam(matchedExam);
                          setLoadingResults(true);
                        } else {
                          setMonitorExam(null);
                        }
                      }}
                    >
                      <option value="">-- Choose an Exam --</option>
                      {exams.map((ex) => (
                        <option key={ex._id} value={ex.examCode}>
                          {ex.title} ({ex.examCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {monitorExam && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                    <div className="p-3 bg-slate-50 rounded-xl text-left">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Registered</div>
                      <div className="text-base font-extrabold text-slate-800 mt-1">{results.length}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-left">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Active Online</div>
                      <div className="text-base font-extrabold text-emerald-600 mt-1">
                        {results.filter(r => r.isActive && !r.isOffline).length}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-left">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Away / Offline</div>
                      <div className="text-base font-extrabold text-red-500 mt-1">
                        {results.filter(r => r.isActive && r.isOffline).length}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-left">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Submissions</div>
                      <div className="text-base font-extrabold text-blue-600 mt-1">
                        {results.filter(r => !r.isActive).length}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Monitor Details Body */}
              {!monitorExam ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                  <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="font-bold text-slate-800 text-sm">No Assessment Selected</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Choose an assessment drive from the dropdown in the header card above to begin tracking live student performance.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-slate-900">Registered Candidates Status</h3>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">Detailed logs of candidate test submissions and live telemetry tracking.</p>
                    </div>
                    {results.length > 0 && (
                      <Button
                        onClick={() => handleExportResults(monitorExam.examCode)}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 h-9 text-xs font-semibold rounded-xl px-4 shadow-sm"
                      >
                        <Download className="h-4 w-4" /> Export Results Sheet
                      </Button>
                    )}
                  </div>

                  <div className="pt-2">
                    {loadingResults ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                        Fetching telemetry data...
                      </div>
                    ) : results.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                        <p className="text-xs font-semibold">No candidates have accessed this assessment drive yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                        <table className="w-full text-slate-700 text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                              <th className="px-6 py-4">Student Name</th>
                              <th className="px-6 py-4">Email Address</th>
                              <th className="px-6 py-4 text-center">Net Score</th>
                              <th className="px-6 py-4 text-center">Positive Marks</th>
                              <th className="px-6 py-4 text-center">Negative Marks</th>
                              <th className="px-6 py-4 text-center">Warnings (Tab / Face)</th>
                              <th className="px-6 py-4 text-center">Proctor Status</th>
                              <th className="px-6 py-4 text-right">Submitted At</th>
                              <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {results.map((r) => (
                              <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                  {r.studentName}
                                  {r.isActive && (
                                    <span className={`w-2 h-2 rounded-full ${r.isOffline ? "bg-red-400" : "bg-emerald-500 animate-pulse"}`} title={r.isOffline ? "Offline" : "Active Online"} />
                                  )}
                                </td>
                                <td className="px-6 py-4 text-slate-500">{r.studentEmail || "N/A"}</td>
                                <td className="px-6 py-4 text-center font-extrabold text-blue-600">
                                  {r.isActive ? (
                                    <span className="text-slate-400 font-semibold italic">In Progress</span>
                                  ) : r.terminated ? (
                                    <span className="text-red-650 font-extrabold" title={`${r.score} / ${r.totalMarks}`}>Disqualified</span>
                                  ) : (
                                    `${r.score} / ${r.totalMarks}`
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-emerald-600">
                                  {r.isActive ? "-" : `+${r.positiveMarks || 0}`}
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-red-650">
                                  {r.isActive ? "-" : `-${r.negativeMarks || 0}`}
                                </td>
                                <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">
                                  {r.isActive ? "-" : `${r.tabSwitchCount || 0} / ${r.faceWarningCount || 0}`}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {r.isActive ? (
                                    <Badge className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] rounded font-bold uppercase py-0.5 px-2 animate-pulse">
                                      Writing
                                    </Badge>
                                  ) : r.terminated ? (
                                    <Badge className="bg-red-50 text-red-700 border border-red-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                                      {r.terminatedByAdmin ? "Disqualified (Admin)" : r.faceTurnTerminated ? "Disqualified (Face)" : "Disqualified (Tab)"}
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
                                <td className="px-6 py-4 text-slate-400 text-right">
                                  {r.isActive ? (
                                    <span className="text-emerald-600 font-bold animate-pulse">Active Now</span>
                                  ) : r.submittedAt ? (
                                    new Date(r.submittedAt).toLocaleString()
                                  ) : (
                                    "N/A"
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    {r.isActive && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-7 px-2 text-[10px] gap-1 font-bold bg-red-600 hover:bg-red-750 text-white rounded-lg flex items-center shadow-sm"
                                        onClick={() => handleTerminateStudent(monitorExam.examCode, r.studentEmail)}
                                      >
                                        <AlertTriangle className="h-3 w-3" /> Terminate
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "profile" ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl text-left space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Admin Profile Settings</h2>
                <p className="text-slate-400 text-xs mt-1">Update your administrative credentials, username, and contact email address.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-bold text-slate-700">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500">Username</Label>
                  <Input 
                    type="text" 
                    value={profileUsername} 
                    onChange={(e) => setProfileUsername(e.target.value)}
                    className="h-10 text-sm rounded-xl border border-slate-200 focus-visible:ring-blue-500 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500">Contact Email</Label>
                  <Input 
                    type="email" 
                    value={profileEmail} 
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="h-10 text-sm rounded-xl border border-slate-200 focus-visible:ring-blue-500 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500">Password</Label>
                  <Input 
                    type="password" 
                    value={profilePassword} 
                    onChange={(e) => setProfilePassword(e.target.value)}
                    className="h-10 text-sm rounded-xl border border-slate-200 focus-visible:ring-blue-500 bg-white"
                  />
                </div>

                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 text-xs px-6 rounded-xl shadow-sm mt-2"
                >
                  Save Account Details
                </Button>
              </form>
            </div>
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
            <div className="flex items-center space-x-2.5 py-1 text-slate-400 text-xs">
              <span>Standard exam lockouts and browser restrictions will be set.</span>
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

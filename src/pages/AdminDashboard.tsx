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
  Plus,
  Mail,
  RotateCcw,
  Code2,
  Sparkles,
  Cpu,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "exams" | "monitoring" | "coding_eval" | "settings" | "profile" | "questions" | "analysis">("dashboard");
  const [selectedExamCodeForCodingEval, setSelectedExamCodeForCodingEval] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // 📐 Sidebar Collapse & Targeted Component Refresh States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [refreshingTab, setRefreshingTab] = useState<string | null>(null);

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

  // Auto-select first coding_hybrid exam when opening Coding Evaluator tab
  useEffect(() => {
    if (activeTab === "coding_eval" && exams.length > 0) {
      const codingExams = exams.filter((ex) => ex.assessmentType === "coding_hybrid");
      if (codingExams.length > 0) {
        if (!selectedExamCodeForCodingEval || !codingExams.some(e => e.examCode === selectedExamCodeForCodingEval)) {
          setSelectedExamCodeForCodingEval(codingExams[0].examCode);
          setMonitorExam(codingExams[0]);
        }
      }
    }
  }, [activeTab, exams, selectedExamCodeForCodingEval]);

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

  // Question Bank Editor modal state
  const [managingExamQuestions, setManagingExamQuestions] = useState<any>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [qEditorSection, setQEditorSection] = useState("");
  const [qEditorType, setQEditorType] = useState("MCQ");
  const [qEditorQuestion, setQEditorQuestion] = useState("");
  const [qEditorOptA, setQEditorOptA] = useState("");
  const [qEditorOptB, setQEditorOptB] = useState("");
  const [qEditorOptC, setQEditorOptC] = useState("");
  const [qEditorOptD, setQEditorOptD] = useState("");
  const [qEditorCorrectAnswer, setQEditorCorrectAnswer] = useState("");
  const [qEditorMarks, setQEditorMarks] = useState("1");
  const [qEditorNegMarks, setQEditorNegMarks] = useState("0");
  const [qEditorCodeSnippet, setQEditorCodeSnippet] = useState("");
  const [qEditorImageUrl, setQEditorImageUrl] = useState("");

  // Student Results details modal state
  const [viewingStudentResult, setViewingStudentResult] = useState<any>(null);

  // Exam Preview and Analysis states
  const [previewingExam, setPreviewingExam] = useState<any>(null);
  const [viewingExamAnalysis, setViewingExamAnalysis] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [selectedExamCodeForQuestions, setSelectedExamCodeForQuestions] = useState("");
  const [selectedExamCodeForAnalysis, setSelectedExamCodeForAnalysis] = useState("");
  const [scorecardSearchQuery, setScorecardSearchQuery] = useState("");
  const [scorecardStatusFilter, setScorecardStatusFilter] = useState("all");
  const [analysisSubTab, setAnalysisSubTab] = useState<"scorecard" | "matrix">("scorecard");
  const activeReviewExam = viewingExamAnalysis || monitorExam;

  // AI Proctor Config States
  const [configExamCode, setConfigExamCode] = useState("");
  const [proctorActive, setProctorActive] = useState(false);
  const [proctorCam, setProctorCam] = useState(false);
  const [proctorMic, setProctorMic] = useState(false);
  const [proctorScreen, setProctorScreen] = useState(false);
  const [proctorTab, setProctorTab] = useState(true);
  const [proctorFS, setProctorFS] = useState(true);
  const [proctorNet, setProctorNet] = useState(true);
  const [maxTabSwitches, setMaxTabSwitches] = useState(3);
  const [maxFullScreenExits, setMaxFullScreenExits] = useState(3);
  const [resultsDispatch, setResultsDispatch] = useState("none");
  const [savingConfig, setSavingConfig] = useState(false);

  const handleSelectConfigExam = (code: string) => {
    setConfigExamCode(code);
    const selected = exams.find((ex) => ex.examCode === code);
    if (selected) {
      setProctorActive(selected.aiProctorActive || false);
      setProctorCam(selected.cameraMonitor || false);
      setProctorMic(selected.micMonitor || false);
      setProctorScreen(selected.screenShareMonitor || false);
      setProctorTab(selected.trackTabSwitches !== false);
      setProctorFS(selected.trackFullScreenExit !== false);
      setProctorNet(selected.trackInternetIssues !== false);
      setMaxTabSwitches(selected.maxTabSwitches || 3);
      setMaxFullScreenExits(selected.maxFullScreenExits || 3);
      setResultsDispatch(selected.dispatchPolicy || "none");
    } else {
      setProctorActive(false);
      setProctorCam(false);
      setProctorMic(false);
      setProctorScreen(false);
      setProctorTab(true);
      setProctorFS(true);
      setProctorNet(true);
      setMaxTabSwitches(3);
      setMaxFullScreenExits(3);
      setResultsDispatch("none");
    }
  };

  const handleSaveProctorConfig = async () => {
    if (!configExamCode) return;
    setSavingConfig(true);
    try {
      const res = await fetch(`${BASE_URL}/exam/proctor-config/${configExamCode}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aiProctorActive: proctorActive,
          cameraMonitor: proctorCam,
          micMonitor: proctorMic,
          screenShareMonitor: proctorScreen,
          trackTabSwitches: proctorTab,
          trackFullScreenExit: proctorFS,
          trackInternetIssues: proctorNet,
          maxTabSwitches,
          maxFullScreenExits,
          dispatchPolicy: resultsDispatch,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: "Success",
          text: "AI Proctor configurations updated successfully!",
          icon: "success",
          confirmButtonColor: "#3b82f6",
        });
        // Refresh local exams
        if (typeof fetchExams === "function") fetchExams();
      } else {
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to save configurations.",
          icon: "error",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Server Error",
        text: "Could not save configurations.",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleOpenAnalysis = async (exam: any) => {
    setSelectedExamCodeForAnalysis(exam.examCode);
    setViewingExamAnalysis(exam);
    setActiveTab("analysis");
    setLoadingAnalysis(true);
    setAnalysisResults([]);
    try {
      const res = await fetch(`${BASE_URL}/exam/results/${exam.examCode}`);
      const data = await res.json();
      if (res.ok) {
        setAnalysisResults(data);
      } else {
        Swal.fire("Error", data.message || "Failed to load results for analysis", "error");
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", "Network error fetching analysis data", "error");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleExportToExcel = () => {
    if (!viewingExamAnalysis || !analysisResults.length || !analysisStats) return;

    const totalMarks = analysisStats.totalMarks;

    // Helper to escape XML special characters
    const escapeXml = (unsafe: any) => {
      if (unsafe === null || unsafe === undefined) return "";
      return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    // Helper to get formatted answer option text
    const getOptionText = (q: any, val: string | null) => {
      if (!val) return "(Unanswered)";
      const cleanVal = val.trim();
      
      const qType = q.questionType || (q.isMultipleCorrect ? "MSQ" : "MCQ");
      if (!["MCQ", "MSQ"].includes(qType)) {
        return cleanVal;
      }
      
      // Look up option strings in options object
      const parts = cleanVal.split(",").map(p => p.trim());
      const texts = parts.map(p => {
        const optionString = q.options?.[p];
        return optionString ? `${p}. ${optionString}` : p;
      });
      return texts.join(", ");
    };

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="HeaderLeft">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Correct">
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Color="#15803D" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Incorrect">
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Color="#B91C1C" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Suspicious">
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Color="#D97706" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Segoe UI" ss:Size="12" ss:Bold="1" ss:Color="#1E293B"/>
  </Style>
 </Styles>`;

    // ==========================================
    // WORKSHEET 1: Summary Overview
    // ==========================================
    xml += `
 <Worksheet ss:Name="Summary Overview">
  <Table ss:ExpandedColumnCount="3" ss:ExpandedRowCount="12" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:Width="200"/>
   <Column ss:Width="300"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="HeaderLeft"><Data ss:Type="String">Metric Parameters</Data></Cell>
    <Cell ss:StyleID="HeaderLeft"><Data ss:Type="String">Evaluation Value</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Assessment Title</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(viewingExamAnalysis.title)}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Exam Code</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(viewingExamAnalysis.examCode)}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Duration</Data></Cell>
    <Cell><Data ss:Type="String">${viewingExamAnalysis.duration} minutes</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Questions</Data></Cell>
    <Cell><Data ss:Type="Number">${viewingExamAnalysis.questions?.length || 0}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Marks</Data></Cell>
    <Cell><Data ss:Type="Number">${totalMarks}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Participants</Data></Cell>
    <Cell><Data ss:Type="Number">${analysisResults.length}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Average Score</Data></Cell>
    <Cell><Data ss:Type="String">${analysisStats.avgScore} / ${totalMarks}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Highest Score</Data></Cell>
    <Cell><Data ss:Type="String">${analysisStats.highestScore} / ${totalMarks}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Pass Rate (&gt;=50%)</Data></Cell>
    <Cell><Data ss:Type="String">${((analysisResults.filter(r => (r.score || 0) >= totalMarks * 0.5).length / analysisResults.length) * 100).toFixed(0)}%</Data></Cell>
   </Row>
  </Table>
 </Worksheet>`;

    // ==========================================
    // WORKSHEET 2: Candidate Scores
    // ==========================================
    xml += `
 <Worksheet ss:Name="Candidate Scores">
  <Table ss:ExpandedColumnCount="10" ss:ExpandedRowCount="${analysisResults.length + 2}" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:Width="150"/>
   <Column ss:Width="200"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="150"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Student Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Email Address</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Roll Number</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Score Obtained</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Marks</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Percentage (%)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tab Switches</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Head Turns</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Proctor Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Submitted At</Data></Cell>
   </Row>`;

    analysisResults.forEach((r) => {
      const pct = ((r.score / totalMarks) * 100).toFixed(1);
      const isTerminated = r.terminated;
      const isSuspicious = (r.tabSwitchCount || 0) > 3 || (r.faceWarningCount || 0) > 5;
      const statusStyle = isTerminated ? "Incorrect" : isSuspicious ? "Suspicious" : "Correct";
      const statusText = isTerminated ? "Terminated" : isSuspicious ? "Suspicious" : "Completed";

      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(r.studentName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.studentEmail)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.studentRollNumber || "N/A")}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.score}</Data></Cell>
    <Cell><Data ss:Type="Number">${totalMarks}</Data></Cell>
    <Cell><Data ss:Type="Number">${pct}</Data></Cell>
    <Cell ss:StyleID="${(r.tabSwitchCount || 0) > 2 ? "Incorrect" : "Default"}"><Data ss:Type="Number">${r.tabSwitchCount || 0}</Data></Cell>
    <Cell ss:StyleID="${(r.faceWarningCount || 0) > 4 ? "Incorrect" : "Default"}"><Data ss:Type="Number">${r.faceWarningCount || 0}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${statusText}</Data></Cell>
    <Cell><Data ss:Type="String">${r.submittedAt ? new Date(r.submittedAt).toLocaleString("en-IN") : "N/A"}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>`;

    // ==========================================
    // WORKSHEET 3: Question Breakdown
    // ==========================================
    xml += `
 <Worksheet ss:Name="Question Breakdown">
  <Table ss:ExpandedColumnCount="11" ss:ExpandedRowCount="${analysisStats.questionStats.length + 2}" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:Width="40"/>
   <Column ss:Width="100"/>
   <Column ss:Width="60"/>
   <Column ss:Width="250"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Q#</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Section</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Type</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Question Statement</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Attempts</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Correct Attempts</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Incorrect Attempts</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Correctness Rate (%)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Avg Time Spent (sec)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Assigned Difficulty</Data></Cell>
   </Row>`;

    analysisStats.questionStats.forEach((qs, idx) => {
      const difficultyStyle = qs.difficulty === "Easy" ? "Correct" : qs.difficulty === "Hard" ? "Incorrect" : "Suspicious";

      xml += `
   <Row>
    <Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(qs.section)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(qs.questionType)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(qs.question)}</Data></Cell>
    <Cell><Data ss:Type="Number">${qs.totalAttempts}</Data></Cell>
    <Cell><Data ss:Type="Number">${qs.correctAttempts}</Data></Cell>
    <Cell><Data ss:Type="Number">${qs.incorrectAttempts}</Data></Cell>
    <Cell><Data ss:Type="Number">${qs.correctnessRate}</Data></Cell>
    <Cell><Data ss:Type="Number">${qs.avgTimeSpent}</Data></Cell>
    <Cell ss:StyleID="${difficultyStyle}"><Data ss:Type="String">${qs.difficulty}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>`;

    // ==========================================
    // WORKSHEET 4: Response Matrix
    // ==========================================
    const matrixColsCount = 4 + (viewingExamAnalysis.questions?.length || 0) * 2;
    xml += `
 <Worksheet ss:Name="Response Matrix">
  <Table ss:ExpandedColumnCount="${matrixColsCount}" ss:ExpandedRowCount="${analysisResults.length + 2}" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:Width="150"/>
   <Column ss:Width="200"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>`;

    // Dynamic Columns for Questions
    viewingExamAnalysis.questions.forEach((_, idx) => {
      xml += `
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>`;
    });

    // Matrix Header Row
    xml += `
   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Student Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Email Address</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Roll Number</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Overall Score</Data></Cell>`;

    viewingExamAnalysis.questions.forEach((_, idx) => {
      xml += `
    <Cell ss:StyleID="Header"><Data ss:Type="String">Q${idx + 1} Answer + Option</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Q${idx + 1} Time Spent (s)</Data></Cell>`;
    });

    xml += `
   </Row>`;

    // Matrix Candidate Data Rows
    analysisResults.forEach((r) => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(r.studentName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.studentEmail)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.studentRollNumber || "N/A")}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.score}</Data></Cell>`;

      viewingExamAnalysis.questions.forEach((q: any) => {
        const ans = r.answers?.find((a: any) => a.questionId === q._id);
        const rawOption = ans ? ans.selectedOption || "" : "";
        const optText = getOptionText(q, rawOption);
        const timeSpentVal = ans ? ans.timeSpent || 0 : 0;

        // Judge correctness of this answer for background coloring
        let isCorrect = false;
        if (rawOption.trim()) {
          const selected = rawOption.trim();
          const qType = q.questionType || (q.isMultipleCorrect ? "MSQ" : "MCQ");
          const cleanCorrect = (q.correctAnswer || "").trim();

          if (qType === "MCQ") {
            const sel = selected.split(",").map((s: string) => s.trim().toUpperCase());
            const cor = cleanCorrect.split(",").map((c: string) => c.trim().toUpperCase());
            isCorrect = sel.length === 1 && sel[0] === cor[0];
          } else if (qType === "MSQ") {
            const sel = selected.split(",").map((s: string) => s.trim().toUpperCase());
            const cor = cleanCorrect.split(",").map((c: string) => c.trim().toUpperCase());
            const hasIncorrect = sel.some((s: string) => !cor.includes(s));
            isCorrect = !hasIncorrect && sel.length === cor.length;
          } else if (qType === "FIB") {
            const alts = cleanCorrect.split(/[|/,]/).map((a: string) => a.toLowerCase().trim().replace(/\s+/g, " "));
            const stud = selected.toLowerCase().trim().replace(/\s+/g, " ");
            isCorrect = alts.some((a: string) => stud === a) || stud === cleanCorrect.toLowerCase().trim().replace(/\s+/g, " ");
          } else if (qType === "NUM") {
            const sFloat = parseFloat(selected.replace(/\s+/g, ""));
            const cFloat = parseFloat(cleanCorrect.replace(/\s+/g, ""));
            isCorrect = !isNaN(sFloat) && !isNaN(cFloat) && sFloat === cFloat;
          } else if (qType === "DES") {
            const stud = selected.toLowerCase().trim().replace(/\s+/g, " ");
            const cor = cleanCorrect.toLowerCase().trim().replace(/\s+/g, " ");
            isCorrect = stud.includes(cor);
          }
        }

        const cellStyle = rawOption.trim() ? (isCorrect ? "Correct" : "Incorrect") : "Default";

        xml += `
    <Cell ss:StyleID="${cellStyle}"><Data ss:Type="String">${escapeXml(optText)}</Data></Cell>
    <Cell><Data ss:Type="Number">${timeSpentVal}</Data></Cell>`;
      });

      xml += `
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    // Download XML file with .xls extension
    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${viewingExamAnalysis.examCode}_Performance_Report.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
      title: "Data Exported!",
      text: "Excel performance analysis report downloaded successfully with full styling.",
      icon: "success",
      confirmButtonColor: "#3b82f6"
    });
  };

  const analysisStats = useMemo(() => {
    if (!viewingExamAnalysis || !analysisResults.length || !viewingExamAnalysis.questions) return null;

    const scores = analysisResults.map((r) => r.score || 0);
    const totalMarks = viewingExamAnalysis.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);

    const questionStats = viewingExamAnalysis.questions.map((q: any) => {
      const qType = q.questionType || (q.isMultipleCorrect ? "MSQ" : "MCQ");
      let correctAttempts = 0;
      let incorrectAttempts = 0;
      let totalAttempts = 0;
      let totalTimeSpent = 0;

      analysisResults.forEach((res: any) => {
        const answer = res.answers?.find((a: any) => a.questionId === q._id);
        if (answer) {
          const selected = (answer.selectedOption || "").trim();
          if (selected) {
            totalAttempts++;
            totalTimeSpent += (answer.timeSpent || 0);

            const cleanCorrect = (q.correctAnswer || "").trim();

            let isCorrect = false;
            if (qType === "MCQ") {
              const sel = selected.split(",").map((s: string) => s.trim().toUpperCase());
              const cor = cleanCorrect.split(",").map((c: string) => c.trim().toUpperCase());
              isCorrect = sel.length === 1 && sel[0] === cor[0];
            } else if (qType === "MSQ") {
              const sel = selected.split(",").map((s: string) => s.trim().toUpperCase());
              const cor = cleanCorrect.split(",").map((c: string) => c.trim().toUpperCase());
              const hasIncorrect = sel.some((s: string) => !cor.includes(s));
              isCorrect = !hasIncorrect && sel.length === cor.length;
            } else if (qType === "FIB") {
              const alts = cleanCorrect.split(/[|/,]/).map((a: string) => a.toLowerCase().trim().replace(/\s+/g, " "));
              const stud = selected.toLowerCase().trim().replace(/\s+/g, " ");
              isCorrect = alts.some((a: string) => stud === a) || stud === cleanCorrect.toLowerCase().trim().replace(/\s+/g, " ");
            } else if (qType === "NUM") {
              const sFloat = parseFloat(selected.replace(/\s+/g, ""));
              const cFloat = parseFloat(cleanCorrect.replace(/\s+/g, ""));
              isCorrect = !isNaN(sFloat) && !isNaN(cFloat) && sFloat === cFloat;
            } else if (qType === "DES") {
              const stud = selected.toLowerCase().trim().replace(/\s+/g, " ");
              const cor = cleanCorrect.toLowerCase().trim().replace(/\s+/g, " ");
              isCorrect = stud.includes(cor);
            }

            if (isCorrect) {
              correctAttempts++;
            } else {
              incorrectAttempts++;
            }
          }
        }
      });

      const avgTimeSpent = totalAttempts > 0 ? (totalTimeSpent / totalAttempts).toFixed(1) : "0";
      const correctnessRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

      let difficulty = "Medium";
      let difficultyColor = "bg-amber-50 text-amber-700 border-amber-200 text-[10px]";
      if (totalAttempts > 0) {
        if (correctnessRate >= 70) {
          difficulty = "Easy";
          difficultyColor = "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]";
        } else if (correctnessRate < 35) {
          difficulty = "Hard";
          difficultyColor = "bg-red-50 text-red-700 border-red-200 text-[10px]";
        }
      }

      return {
        _id: q._id,
        question: q.question,
        questionType: qType,
        section: q.section || "General",
        marks: q.marks || 1,
        totalAttempts,
        correctAttempts,
        incorrectAttempts,
        avgTimeSpent,
        correctnessRate: correctnessRate.toFixed(1),
        difficulty,
        difficultyColor
      };
    });

    return {
      avgScore: avgScore.toFixed(2),
      highestScore: highestScore.toFixed(2),
      totalMarks,
      questionStats
    };
  }, [viewingExamAnalysis, analysisResults]);

  const handleOpenQuestions = (exam: any) => {
    setSelectedExamCodeForQuestions(exam.examCode);
    setManagingExamQuestions(exam);
    setEditingQuestionIndex(null);
    setActiveTab("questions");
  };

  const handleStartAddQuestion = () => {
    setQEditorSection("General");
    setQEditorType("MCQ");
    setQEditorQuestion("");
    setQEditorOptA("");
    setQEditorOptB("");
    setQEditorOptC("");
    setQEditorOptD("");
    setQEditorCorrectAnswer("");
    setQEditorMarks("1");
    setQEditorNegMarks("0");
    setQEditorCodeSnippet("");
    setQEditorImageUrl("");
    setEditingQuestionIndex(-1);
  };

  const handleStartEditQuestion = (index: number, q: any) => {
    setQEditorSection(q.section || "General");
    setQEditorType(q.questionType || (q.isMultipleCorrect ? "MSQ" : "MCQ"));
    setQEditorQuestion(q.question || "");
    setQEditorOptA(q.options?.A || "");
    setQEditorOptB(q.options?.B || "");
    setQEditorOptC(q.options?.C || "");
    setQEditorOptD(q.options?.D || "");
    setQEditorCorrectAnswer(q.correctAnswer || "");
    setQEditorMarks(String(q.marks || 1));
    setQEditorNegMarks(String(q.negativeMarks || 0));
    setQEditorCodeSnippet(q.codeSnippet || "");
    setQEditorImageUrl(q.imageUrl || "");
    setEditingQuestionIndex(index);
  };

  const handleSaveQuestion = async () => {
    if (!managingExamQuestions) return;
    if (!qEditorQuestion || !qEditorCorrectAnswer) {
      Swal.fire("Validation Error", "Question Text and Correct Answer are required.", "warning");
      return;
    }
    const isOptionsType = ["MCQ", "MSQ"].includes(qEditorType);
    if (isOptionsType && (!qEditorOptA || !qEditorOptB || !qEditorOptC || !qEditorOptD)) {
      Swal.fire("Validation Error", "All four options (A, B, C, D) are required for MCQ/MSQ.", "warning");
      return;
    }

    const questionPayload: any = {
      question: qEditorQuestion,
      questionType: qEditorType,
      correctAnswer: qEditorCorrectAnswer,
      marks: Number(qEditorMarks) || 1,
      negativeMarks: Number(qEditorNegMarks) || 0,
      section: qEditorSection || "General",
      codeSnippet: qEditorCodeSnippet || "",
      imageUrl: qEditorImageUrl || "",
      options: {
        A: isOptionsType ? qEditorOptA : "",
        B: isOptionsType ? qEditorOptB : "",
        C: isOptionsType ? qEditorOptC : "",
        D: isOptionsType ? qEditorOptD : ""
      },
      isMultipleCorrect: qEditorType === "MSQ" || (qEditorType === "MCQ" ? false : qEditorCorrectAnswer.includes(","))
    };

    let updatedQuestions = [...(managingExamQuestions.questions || [])];
    if (editingQuestionIndex === -1) {
      updatedQuestions.push(questionPayload);
    } else if (editingQuestionIndex !== null && editingQuestionIndex >= 0) {
      const existingQ = updatedQuestions[editingQuestionIndex];
      if (existingQ && existingQ._id) {
        questionPayload._id = existingQ._id;
      }
      updatedQuestions[editingQuestionIndex] = questionPayload;
    }

    try {
      setUpdating(true);
      const res = await fetch(`${BASE_URL}/exam/update/${managingExamQuestions._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: updatedQuestions })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire("Saved", "Question saved successfully.", "success");
        setManagingExamQuestions(data.exam);
        fetchExams();
        setEditingQuestionIndex(null);
      } else {
        Swal.fire("Error", data.message || "Failed to save question.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error saving question.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    if (!managingExamQuestions) return;
    const confirmation = await Swal.fire({
      title: "Delete Question?",
      text: "Are you sure you want to delete this question?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Delete"
    });
    if (!confirmation.isConfirmed) return;

    let updatedQuestions = [...(managingExamQuestions.questions || [])];
    updatedQuestions.splice(index, 1);

    try {
      setUpdating(true);
      const res = await fetch(`${BASE_URL}/exam/update/${managingExamQuestions._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: updatedQuestions })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire("Deleted", "Question deleted successfully.", "success");
        setManagingExamQuestions(data.exam);
        fetchExams();
      } else {
        Swal.fire("Error", data.message || "Failed to delete question.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error deleting question.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleGraceMarks = async (index: number, question: any, isGrace: boolean) => {
    if (!managingExamQuestions) return;
    let updatedQuestions = [...(managingExamQuestions.questions || [])];
    const q = { ...updatedQuestions[index] };
    q.isGraceAwarded = isGrace;
    updatedQuestions[index] = q;

    try {
      setUpdating(true);
      const res = await fetch(`${BASE_URL}/exam/update/${managingExamQuestions._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: updatedQuestions })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire("Grace Marks", isGrace ? "Grace marks awarded successfully." : "Grace marks revoked successfully.", "success");
        setManagingExamQuestions(data.exam);
        fetchExams();
      } else {
        Swal.fire("Error", data.message || "Failed to toggle grace marks.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Network error.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleManualSendEmail = async (examCode: string, studentEmail: string) => {
    if (!examCode || !studentEmail) return;

    try {
      Swal.fire({
        title: "Sending Email",
        text: "Please wait while we dispatch the scorecard...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch(`${BASE_URL}/exam/send-result-email/${examCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ studentEmail })
      });
      const data = await res.json();
      Swal.close();

      if (res.ok) {
        Swal.fire({
          title: "Mail Dispatched",
          text: `Performance scorecard has been successfully sent to ${studentEmail}.`,
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
        setAnalysisResults((prev) =>
          prev.map((item) =>
            item.studentEmail.toLowerCase() === studentEmail.toLowerCase()
              ? { ...item, isEmailed: true }
              : item
          )
        );
        setViewingStudentResult((prev) => {
          if (prev && prev.studentEmail.toLowerCase() === studentEmail.toLowerCase()) {
            return { ...prev, isEmailed: true };
          }
          return prev;
        });
      } else {
        Swal.fire("Error", data.message || "Failed to dispatch email.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", "Failed to dispatch email. Network error.", "error");
    }
  };

  const handleResetAttempt = async (examCode: string, studentEmail: string, studentName: string) => {
    if (!examCode || !studentEmail) return;

    const confirm = await Swal.fire({
      title: "Allow Re-Attempt?",
      html: `This will <b>permanently delete</b> the submission of <b>${studentName}</b> (<code>${studentEmail}</code>).<br><br>The student will be able to re-take this exam. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Allow Re-Attempt",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b"
    });

    if (!confirm.isConfirmed) return;

    try {
      Swal.fire({
        title: "Resetting Attempt",
        text: "Removing the student's submission...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch(`${BASE_URL}/exam/reset-attempt/${examCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentEmail })
      });
      const data = await res.json();
      Swal.close();

      if (res.ok) {
        Swal.fire({
          title: "Re-Attempt Granted",
          text: `${studentName}'s submission has been removed. They can now re-attempt the exam.`,
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
        // Remove from local results list
        setAnalysisResults((prev) =>
          prev.filter((item) => item.studentEmail.toLowerCase() !== studentEmail.toLowerCase())
        );
      } else {
        Swal.fire("Error", data.message || "Failed to reset attempt.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", "Failed to reset attempt. Network error.", "error");
    }
  };

  const handleManualSendAllEmails = async (examCode: string) => {
    if (!examCode) return;

    const confirm = await Swal.fire({
      title: "Email All Scorecards?",
      text: `Are you sure you want to manually email the performance reports to all candidates who attempted exam ${examCode}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, send all",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444"
    });

    if (!confirm.isConfirmed) return;

    try {
      Swal.fire({
        title: "Sending Mass Emails",
        text: "Please wait while we email scorecards to all candidates...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch(`${BASE_URL}/exam/send-all-results/${examCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      Swal.close();

      if (res.ok) {
        Swal.fire({
          title: "Mass Mailing Finished",
          text: data.message || `Scorecards have been successfully emailed.`,
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
        setAnalysisResults((prev) => prev.map((item) => ({ ...item, isEmailed: true })));
      } else {
        Swal.fire("Error", data.message || "Failed to dispatch mass emails.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire("Error", "Failed to execute mass mailing. Network error.", "error");
    }
  };

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

  // 📌 TELEMETRY & RESULTS POLLING HOOK
  const fetchUpdates = useCallback(async () => {
    if (!monitorExam) {
      setActiveCandidates({});
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/exam/results/${monitorExam.examCode}`);
      const dbResults = res.ok ? await res.json() : [];

      const candidatesRes = await fetch(`${BASE_URL}/exam/active-candidates/${monitorExam.examCode}`);
      const activeCands = candidatesRes.ok ? await candidatesRes.json() : {};

      setActiveCandidates(activeCands);

      const dbEmails = new Set(dbResults.map((r: any) => r.studentEmail?.toLowerCase()));
      
      const activeResults = Object.keys(activeCands)
        .filter((email) => !dbEmails.has(email.toLowerCase()))
        .map((email) => {
          const candInfo = activeCands[email];
          const paperScore = candInfo.paperLogicMarks || 0;
          const execScore = candInfo.executionOutputMarks || 0;
          const totalScore = paperScore + execScore;

          return {
            _id: `active-${email}`,
            studentName: candInfo.name || "Candidate",
            studentEmail: email,
            score: totalScore > 0 ? totalScore : "In Progress",
            paperLogicMarks: paperScore,
            executionOutputMarks: execScore,
            totalCodingScore: totalScore,
            assignedSet: candInfo.assignedSet || "",
            allowLocalIdeSwitch: !!candInfo.allowLocalIdeSwitch,
            codingPhase: candInfo.codingPhase || "lobby",
            positiveMarks: totalScore,
            negativeMarks: 0,
            totalMarks: 100,
            tabSwitchCount: candInfo.tabSwitchCount || 0,
            faceWarningCount: candInfo.faceWarningCount || 0,
            noiseWarningCount: candInfo.noiseWarningCount || 0,
            internetIssueCount: candInfo.internetIssueCount || 0,
            fullScreenExitCount: candInfo.fullScreenExitCount || 0,
            screenShareViolationCount: candInfo.screenShareViolationCount || 0,
            isActive: true,
            isOffline: candInfo.isOffline,
            submittedAt: null
          };
        });

      // Overlay active session telemetry onto DB results for active candidates
      const mergedDbResults = dbResults.map((r: any) => {
        const emailKey = (r.studentEmail || "").toLowerCase();
        const candInfo = activeCands[emailKey] || activeCands[`${monitorExam.examCode.toUpperCase()}-${emailKey}`];

        if (candInfo) {
          const paperScore = candInfo.paperLogicMarks !== undefined ? candInfo.paperLogicMarks : r.paperLogicMarks || 0;
          const execScore = candInfo.executionOutputMarks !== undefined ? candInfo.executionOutputMarks : r.executionOutputMarks || 0;
          const totalScore = paperScore + execScore;

          return {
            ...r,
            assignedSet: candInfo.assignedSet || r.assignedSet || "",
            allowLocalIdeSwitch: candInfo.allowLocalIdeSwitch !== undefined ? !!candInfo.allowLocalIdeSwitch : !!r.allowLocalIdeSwitch,
            paperLogicMarks: paperScore,
            executionOutputMarks: execScore,
            totalCodingScore: totalScore,
            score: totalScore > 0 ? totalScore : (r.score || 0),
            codingPhase: candInfo.codingPhase || r.codingPhase || "lobby",
            isActive: true,
            isOffline: candInfo.isOffline
          };
        }
        return r;
      });

      setResults([...activeResults, ...mergedDbResults]);

    } catch (err) {
      console.error("Error fetching updates:", err);
    } finally {
      setLoadingResults(false);
    }
  }, [monitorExam]);

  useEffect(() => {
    if (!monitorExam) return;
    fetchUpdates();
    const intervalId = setInterval(fetchUpdates, 3000);
    return () => clearInterval(intervalId);
  }, [monitorExam, fetchUpdates]);

  // 📌 CODING HYBRID EVALUATION HANDLERS
  const handleAssignSet = async (examCode: string, email: string, assignedSet: string) => {
    try {
      if (!examCode || !email) return;
      const res = await fetch(`${BASE_URL}/exam/coding/assign-set/${examCode}/${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedSet })
      });
      if (res.ok) {
        await fetchUpdates();
        Swal.fire({
          title: "Question Set Assigned",
          text: `Question ${assignedSet} successfully assigned to ${email}`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error("Assign set error:", err);
    }
  };

  const handleUpdateCodingMarks = async (examCode: string, email: string, paperLogicMarks: number, executionOutputMarks: number) => {
    try {
      if (!examCode || !email) return;
      const res = await fetch(`${BASE_URL}/exam/coding/update-marks/${examCode}/${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperLogicMarks, executionOutputMarks })
      });
      if (res.ok) {
        await fetchUpdates();
        Swal.fire({
          title: "Marks Saved",
          text: `Updated marks for ${email}: Paper (${paperLogicMarks}) + Output (${executionOutputMarks}) = Total (${paperLogicMarks + executionOutputMarks})`,
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
      }
    } catch (err) {
      console.error("Update marks error:", err);
    }
  };

  const handleToggleIdeAccess = async (examCode: string, email: string, allowLocalIdeSwitch: boolean) => {
    try {
      if (!examCode || !email) return;
      const res = await fetch(`${BASE_URL}/exam/coding/toggle-ide-access/${examCode}/${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowLocalIdeSwitch })
      });
      if (res.ok) {
        await fetchUpdates();
        Swal.fire({
          title: allowLocalIdeSwitch ? "IDE Unlocked" : "IDE Locked",
          text: allowLocalIdeSwitch ? `Candidate ${email} can now switch to local IDE for code execution.` : `Local IDE switching locked for ${email}.`,
          icon: "info",
          confirmButtonColor: "#3b82f6"
        });
      }
    } catch (err) {
      console.error("Toggle IDE access error:", err);
    }
  };

  const handleCompleteCodingExam = async (examCode: string, email: string) => {
    if (!examCode || !email) return;
    const confirm = await Swal.fire({
      title: "Mark Exam Completed?",
      text: `Finalize evaluation and email performance scorecard report to ${email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      confirmButtonText: "Yes, Complete & Send Email"
    });
    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${BASE_URL}/exam/coding/complete-exam/${examCode}/${encodeURIComponent(email)}`, {
          method: "POST"
        });
        if (res.ok) {
          await fetchUpdates();
          Swal.fire({
            title: "Exam Completed",
            text: `Evaluation finalized and scorecard report emailed to ${email}!`,
            icon: "success",
            confirmButtonColor: "#10b981"
          });
        }
      } catch (err) {
        console.error("Complete coding exam error:", err);
      }
    }
  };

  const fetchExams = async (silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
  };

  const handleRefreshComponent = async (tabName: string, customTask?: () => Promise<void>) => {
    setRefreshingTab(tabName);
    try {
      if (customTask) {
        await customTask();
      } else {
        await fetchExams(true);
        if (monitorExam) await fetchUpdates();
      }
    } catch (err) {
      console.error("Component refresh error:", err);
    } finally {
      setRefreshingTab(null);
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
  const handleExportResults = async (examCode: string) => {
    if (!results.length) {
      Swal.fire({
        title: "Export Failed",
        text: "No results to export.",
        icon: "warning",
        confirmButtonColor: "#3b82f6"
      });
      return;
    }

    const XLSX = await import("xlsx");

    // Get questions from the exam for per-question time mapping
    const examData = exams.find((e: any) => e.examCode === examCode);
    const questions = examData?.questions || [];

    const dataToExport = results.map((r: any, index: number) => {
      const row: any = {
        "S.No": index + 1,
        "Student Name": r.studentName,
        "Roll Number": r.studentRollNumber || "N/A",
        "Student Email": r.studentEmail || "N/A",
        "Score Obtained (Net)": r.score,
        "Positive Marks Obtained": r.isActive ? "-" : (r.positiveMarks || 0),
        "Negative Marks Obtained": r.isActive ? "-" : (r.negativeMarks || 0),
        "Total Marks": r.totalMarks,
        "Tab Switches": r.tabSwitchCount || 0,
        "Face Warnings": r.faceWarningCount || 0,
        "Noise Warnings": r.noiseWarningCount || 0,
        "Fullscreen Exits": r.fullScreenExitCount || 0,
        "Internet Disconnections": r.internetIssueCount || 0,
        "Screen Share Violations": r.screenShareViolationCount || 0,
        "AI Proctor Verdict": r.terminated 
          ? (r.faceTurnTerminated ? "TERMINATED (Face turns limit)" : "TERMINATED (Tab switches limit)")
          : r.terminatedByAdmin 
            ? "TERMINATED (By Admin)"
            : r.isActive 
              ? "ACTIVE IN PROGRESS"
              : (r.tabSwitched || (r.faceWarningCount && r.faceWarningCount > 0))
                ? "WARNING FLAGGED" 
                : "CLEAN",
        "Email Sent": r.isEmailed ? "Yes" : "No",
        "Submission Date": r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "N/A"
      };

      // Per-question time spent columns
      if (r.answers && Array.isArray(r.answers)) {
        r.answers.forEach((ans: any, qIdx: number) => {
          const matchedQ = questions.find((q: any) => q._id === ans.questionId);
          const qLabel = matchedQ ? `Q${qIdx + 1} (${(matchedQ.questionText || "").substring(0, 30)}...)` : `Q${qIdx + 1}`;
          const seconds = ans.timeSpent || 0;
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          row[`Time - ${qLabel}`] = `${mins}m ${secs}s`;
        });
      }

      return row;
    });

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
    <>
      {updating && <Loader />}
      <div className="h-screen overflow-hidden bg-slate-50 flex font-sans text-slate-800">
      
      {/* ======================================= */}
      {/* 📁 SIDEBAR NAVIGATION PANEL */}
      {/* ======================================= */}
      {/* ======================================= */}
      {/* 📁 SIDEBAR NAVIGATION PANEL */}
      {/* ======================================= */}
      <aside className={`${isSidebarCollapsed ? "w-20 p-3" : "w-64 p-6"} h-full bg-slate-900 text-slate-300 flex flex-col justify-between flex-shrink-0 border-r border-slate-950 transition-all duration-300 relative z-20`}>
        <div className="space-y-6">
          
          {/* Logo Brand & Collapse Toggle */}
          <div className={`flex items-center ${isSidebarCollapsed ? "justify-center flex-col gap-2" : "justify-between"} pb-2 border-b border-slate-800/80`}>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="SecureExam Pro Logo" className="h-8 w-8 object-contain" />
              {!isSidebarCollapsed && (
                <div className="flex flex-col text-left">
                  <span className="font-bold text-white text-sm leading-none tracking-tight">SecureExam Pro</span>
                  <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Control Center</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab("dashboard")}
              title="Dashboard"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => setActiveTab("exams")}
              title="Assessments"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "exams"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Grid className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Assessments</span>}
            </button>

            <button
              onClick={() => setActiveTab("monitoring")}
              title="Live Monitoring"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "monitoring"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Live Monitoring</span>}
            </button>

            <button
              onClick={() => setActiveTab("coding_eval")}
              title="Coding Evaluator"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "coding_eval"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Coding Evaluator</span>}
            </button>

            <button
              onClick={() => setActiveTab("questions")}
              title="Question Banks"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "questions"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Question Banks</span>}
            </button>

            <button
              onClick={() => setActiveTab("analysis")}
              title="Exam Analysis"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "analysis"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Exam Analysis</span>}
            </button>
            
            <button
              onClick={() => setActiveTab("settings")}
              title="Proctor Configurations"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "settings"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Proctor Configs</span>}
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              title="Admin Profile"
              className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"} rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>Admin Profile</span>}
            </button>
          </div>

        </div>

        {/* Footer profile status & Logout */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3 text-left"}`}>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs uppercase shrink-0">
              {(profileUsername || "A").charAt(0)}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Examiner Profile</span>
                <span className="text-[10px] text-slate-500 font-mono">{profileUsername || "coreadmin"}</span>
              </div>
            )}
          </div>
          <Button
            onClick={handleLogout}
            title="Log Out"
            className={`w-full bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-750 text-xs font-bold py-2 rounded-xl flex items-center ${isSidebarCollapsed ? "justify-center px-0" : "justify-center gap-1.5"}`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" /> {!isSidebarCollapsed && "Log Out"}
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
                    : activeTab === "coding_eval"
                      ? "Coding Hybrid Assessment Evaluator"
                      : activeTab === "questions"
                        ? "Question Bank Manager"
                        : activeTab === "analysis"
                          ? "Exam Performance Analysis"
                          : activeTab === "profile"
                            ? "Admin Profile & Accounts"
                            : "Platform Proctoring Controls"}
            </h1>
            <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-500 border border-slate-200 text-[10px] py-0 px-2 rounded font-semibold ml-2">
              Lobby Active
            </Badge>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={refreshingTab === "all"}
            onClick={() => handleRefreshComponent("all")}
            className="h-8 text-xs font-bold border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-blue-600 ${refreshingTab === "all" ? "animate-spin" : ""}`} /> Refresh All Data
          </Button>
        </header>

        {/* Workspace Body */}
        <div className="p-8 flex-grow overflow-y-auto space-y-8">
          
          {activeTab === "dashboard" ? (
            <div className="space-y-8 text-left">
              {/* ✨ HERO WELCOME BANNER */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 p-8 text-white shadow-xl border border-slate-800/80">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Control Center Overview
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                      Secure Exam Pro Analytics & Management Hub
                    </h2>
                    <p className="text-slate-300 text-xs leading-relaxed font-normal">
                      Monitor live student candidate telemetry, manage Coding Hybrid Set-Wise question paper distributions, unlock local IDE access, and review automated performance reports.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <Button
                      disabled={refreshingTab === "dashboard"}
                      onClick={() => handleRefreshComponent("dashboard")}
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs h-10 px-4 rounded-xl gap-1.5"
                    >
                      <RotateCcw className={`h-4 w-4 text-blue-300 ${refreshingTab === "dashboard" ? "animate-spin" : ""}`} /> Refresh Metrics
                    </Button>
                    <CreateExamDialog onExamCreated={fetchExams} />
                    <Button
                      onClick={() => setActiveTab("coding_eval")}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs h-10 px-5 rounded-xl shadow-lg shadow-purple-600/30 gap-1.5"
                    >
                      <Code2 className="h-4 w-4" /> Coding Evaluator
                    </Button>
                    <Button
                      onClick={() => setActiveTab("monitoring")}
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs h-10 px-4 rounded-xl gap-1.5"
                    >
                      <Activity className="h-4 w-4 text-emerald-400" /> Live Monitor
                    </Button>
                  </div>
                </div>
              </div>

              {/* 📊 DYNAMIC METRICS OVERVIEW CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Metric 1: Total Assessments */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400">Assessments Built</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{exams.length}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-bold">
                      <span className="text-blue-600">{exams.filter(e => e.assessmentType === "coding_hybrid").length} Coding Hybrid</span>
                      <span>•</span>
                      <span>{exams.filter(e => e.assessmentType !== "coding_hybrid").length} Standard</span>
                    </div>
                  </div>
                </div>

                {/* Metric 2: Coding Hybrid Drives */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all border-l-4 border-l-purple-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold text-purple-700">Coding Hybrid Drives</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Code2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-purple-900">
                      {exams.filter(e => e.assessmentType === "coding_hybrid").length}
                    </h3>
                    <div className="text-[10px] text-purple-600 font-extrabold mt-1">
                      Set A, B, C, D Paper Allocation
                    </div>
                  </div>
                </div>

                {/* Metric 3: Active Test-Takers */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400">Live Active Candidates</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Activity className="h-4 w-4 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-emerald-600">
                      {Object.keys(activeCandidates).length}
                    </h3>
                    <div className="text-[10px] text-emerald-700 font-extrabold mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Real-Time Telemetry Active
                    </div>
                  </div>
                </div>

                {/* Metric 4: Total Questions Pool */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400">Questions Pool</span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Grid className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{totalQuestionsPool}</h3>
                    <div className="text-[10px] text-slate-400 font-bold mt-1">
                      Available across question banks
                    </div>
                  </div>
                </div>

                {/* Metric 5: Platform Integrity Score */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400">Integrity Rating</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Shield className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">98.6%</h3>
                    <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> AI Proctor Verified
                    </div>
                  </div>
                </div>
              </div>

              {/* 💻 CODING HYBRID FEATURE SPOTLIGHT CARD */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 text-white shadow-xl border border-purple-800/60 relative overflow-hidden space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-800/60 pb-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-400/30">
                      <Code2 className="h-3 w-3 text-purple-300" /> Dedicated Feature Architecture
                    </div>
                    <h3 className="text-lg font-black text-white">
                      Coding Assessment Mode (Set-Wise & Hybrid Paper / IDE Workflow)
                    </h3>
                  </div>
                  <Button
                    onClick={() => setActiveTab("coding_eval")}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs h-9 px-4 rounded-xl shadow-md gap-1.5 self-start md:self-center shrink-0"
                  >
                    Launch Coding Evaluator Desk <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-purple-800/40 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-purple-300 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-purple-400" /> Question Sets Distribution
                    </div>
                    <div className="text-xs text-slate-300 font-medium">Set A, B, C, D allocated manually by admin upon candidate lobby entry.</div>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-purple-800/40 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-amber-300 flex items-center gap-1">
                      <Unlock className="h-3.5 w-3.5 text-amber-400" /> Admin IDE Access Control
                    </div>
                    <div className="text-xs text-slate-300 font-medium">Unlocks candidate local IDE switching and pauses tab & focus lockouts dynamically.</div>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-purple-800/40 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Dual Step-by-Step Marking
                    </div>
                    <div className="text-xs text-slate-300 font-medium">Independent Paper Logic Marks (50 max) + Execution Output Marks (50 max).</div>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-purple-800/40 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-blue-300 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-blue-400" /> Automated Scorecard Email
                    </div>
                    <div className="text-xs text-slate-300 font-medium">Dispatches official performance evaluation scorecard report upon exam completion.</div>
                  </div>
                </div>
              </div>

              {/* 📋 LIVE ASSESSMENT DRIVES & SYSTEM HEALTH MATRIX */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (2 cols): Active Assessment Drives List */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Active Assessment Drives Registry</h3>
                      <p className="text-[11px] text-slate-400">Overview of configured examinations and active assessment modes.</p>
                    </div>
                    <Button
                      onClick={() => setActiveTab("exams")}
                      variant="outline"
                      className="text-xs font-bold border-slate-200 h-8 px-3 rounded-lg"
                    >
                      Manage All
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {exams.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                        No assessment drives created yet. Click "Create Assessment" to build one.
                      </div>
                    ) : (
                      exams.slice(0, 5).map((ex) => (
                        <div key={ex._id} className="p-4 border border-slate-150 rounded-xl hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/30">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">{ex.title}</span>
                              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">{ex.examCode}</span>
                              {ex.assessmentType === "coding_hybrid" ? (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] rounded font-extrabold uppercase py-0.5 px-2">
                                  Coding Hybrid
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                                  Standard
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
                              <span>Duration: {ex.duration || 60} mins</span>
                              <span>•</span>
                              <span>Questions: {ex.questions?.length || 0}</span>
                              {ex.assessmentType === "coding_hybrid" && (
                                <>
                                  <span>•</span>
                                  <span className="text-purple-600 font-bold">{ex.questionSets?.length || 4} Question Sets</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            {ex.assessmentType === "coding_hybrid" ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedExamCodeForCodingEval(ex.examCode);
                                  setMonitorExam(ex);
                                  setActiveTab("coding_eval");
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold h-8 px-3 rounded-lg shadow-sm"
                              >
                                Evaluator Desk
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setMonitorExam(ex);
                                  setActiveTab("monitoring");
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-8 px-3 rounded-lg shadow-sm"
                              >
                                Live Monitor
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Column (1 col): AI Proctoring Security Diagnostics */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">System Security & Proctor Diagnosis</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Real-time proctoring enforcement controls.</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-500" /> Focus Lockouts
                        </span>
                        <span className="font-extrabold text-slate-800 text-[11px]">3 Max Exits</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                          <Cpu className="h-4 w-4 text-purple-600" /> Head Motion Scan
                        </span>
                        <span className="font-extrabold text-purple-700 text-[11px]">Sub-pixel Heuristic</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                          <Shield className="h-4 w-4 text-blue-600" /> Local IDE Bypass
                        </span>
                        <span className="font-extrabold text-emerald-600 text-[11px]">Admin Controlled</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-600">
                        <span>Gateway Ingress Load</span>
                        <span className="text-blue-600 font-mono">{(Object.keys(activeCandidates).length * 4 + 12)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, Object.keys(activeCandidates).length * 4 + 12)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <Button
                      onClick={() => setActiveTab("settings")}
                      variant="outline"
                      className="w-full border-slate-200 text-xs font-bold h-9 rounded-xl shadow-sm gap-1.5"
                    >
                      <Settings className="h-3.5 w-3.5" /> Configure AI Proctor Controls
                    </Button>
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

                  {/* Creation button & Refresh */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={refreshingTab === "exams"}
                      onClick={() => handleRefreshComponent("exams")}
                      className="h-10 text-xs font-bold border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 text-blue-600 ${refreshingTab === "exams" ? "animate-spin" : ""}`} /> Refresh List
                    </Button>
                    <CreateExamDialog onExamCreated={fetchExams} />
                  </div>
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
                                  title="Manage Questions"
                                  className="h-8 px-2 text-xs gap-1 border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-blue-600 font-semibold"
                                  onClick={() => handleOpenQuestions(exam)}
                                >
                                  <FileText className="h-3.5 w-3.5" /> Questions
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
                        ))}`
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
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={refreshingTab === "monitoring"}
                        onClick={() => handleRefreshComponent("monitoring", fetchUpdates)}
                        className="h-9 px-3 text-xs font-bold border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 shadow-sm"
                      >
                        <RotateCcw className={`h-3.5 w-3.5 text-blue-600 ${refreshingTab === "monitoring" ? "animate-spin" : ""}`} /> Refresh Telemetry
                      </Button>
                      {results.length > 0 && (
                        <Button
                          onClick={() => handleExportResults(monitorExam.examCode)}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 h-9 text-xs font-semibold rounded-xl px-4 shadow-sm"
                        >
                          <Download className="h-4 w-4" /> Export Results Sheet
                        </Button>
                      )}
                    </div>
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
                              {monitorExam?.assessmentType === "coding_hybrid" && <th className="px-6 py-4 text-center">Assigned Set</th>}
                              <th className="px-6 py-4 text-center">Net Score</th>
                              <th className="px-6 py-4 text-center">Behavior Logs (Tab/Face/Noise/FS/Net)</th>
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

                                {/* ASSIGNED SET COLUMN & SELECTOR — Coding Hybrid only */}
                                {monitorExam?.assessmentType === "coding_hybrid" && (
                                <td className="px-6 py-4 text-center">
                                  <select
                                    value={r.assignedSet || ""}
                                    onChange={(e) => handleAssignSet(monitorExam?.examCode || "", r.studentEmail, e.target.value)}
                                    className={`px-2.5 py-1.5 text-xs font-extrabold rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm cursor-pointer transition-all ${
                                      r.assignedSet
                                        ? "bg-purple-600 text-white border-purple-700 font-black shadow"
                                        : "bg-amber-50 text-amber-900 border-amber-300 font-bold"
                                    }`}
                                  >
                                    <option value="" className="bg-white text-slate-700">-- Select Question Set --</option>
                                    {monitorExam?.questionSets?.length > 0 ? (
                                      monitorExam.questionSets.map((qs: any) => (
                                        <option key={qs.setName} value={qs.setName} className="bg-white text-slate-800 font-bold">{qs.setName}</option>
                                      ))
                                    ) : (
                                      <>
                                        <option value="Set A" className="bg-white text-slate-800 font-bold">Set A</option>
                                        <option value="Set B" className="bg-white text-slate-800 font-bold">Set B</option>
                                        <option value="Set C" className="bg-white text-slate-800 font-bold">Set C</option>
                                        <option value="Set D" className="bg-white text-slate-800 font-bold">Set D</option>
                                      </>
                                    )}
                                  </select>
                                </td>
                                )}

                                <td className="px-6 py-4 text-center font-extrabold text-blue-600">
                                  {monitorExam?.assessmentType === "coding_hybrid" ? (
                                    <div className="flex flex-col items-center justify-center gap-0.5 text-[11px]">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">Paper: {r.paperLogicMarks || 0}</span>
                                        <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold border border-purple-200">Exec: {r.executionOutputMarks || 0}</span>
                                      </div>
                                      <span className="text-slate-900 font-black text-xs mt-0.5">
                                        Total: {(r.paperLogicMarks || 0) + (r.executionOutputMarks || 0)} / 100
                                      </span>
                                    </div>
                                  ) : r.isActive ? (
                                    <span className="text-slate-400 font-semibold italic">In Progress</span>
                                  ) : r.terminated ? (
                                    <span className="text-red-650 font-extrabold" title={`${r.score} / ${r.totalMarks}`}>Disqualified</span>
                                  ) : (
                                    `${r.score} / ${r.totalMarks}`
                                  )}
                                </td>

                                <td className="px-6 py-4 text-center text-[10px] font-semibold text-slate-500">
                                  <div className="inline-flex flex-col items-start gap-0.5">
                                    <div>Tab Exits: <span className={r.tabSwitchCount > 0 ? "text-amber-600 font-black text-xs" : "font-mono"}>{r.tabSwitchCount || 0}</span></div>
                                    <div>Head Turns: <span className={r.faceWarningCount > 0 ? "text-amber-600 font-black text-xs" : "font-mono"}>{r.faceWarningCount || 0}</span></div>
                                    <div>Noise Flags: <span className={r.noiseWarningCount > 0 ? "text-amber-600 font-black text-xs" : "font-mono"}>{r.noiseWarningCount || 0}</span></div>
                                    <div>FS Exits: <span className={r.fullScreenExitCount > 0 ? "text-amber-600 font-black text-xs" : "font-mono"}>{r.fullScreenExitCount || 0}</span></div>
                                    <div>Net Drops: <span className={r.internetIssueCount > 0 ? "text-amber-600 font-black text-xs" : "font-mono"}>{r.internetIssueCount || 0}</span></div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {monitorExam?.assessmentType === "coding_hybrid" ? (
                                    r.codingPhase === "ide_unlocked" ? (
                                      <Badge className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] rounded font-extrabold uppercase py-0.5 px-2 animate-pulse">
                                        IDE Unlocked
                                      </Badge>
                                    ) : r.isActive ? (
                                      <Badge className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] rounded font-bold uppercase py-0.5 px-2 animate-pulse">
                                        {r.assignedSet ? `Writing (${r.assignedSet})` : "In Lobby"}
                                      </Badge>
                                    ) : r.terminated ? (
                                      <Badge className="bg-red-50 text-red-700 border border-red-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                                        {r.terminatedByAdmin ? "Disqualified (Admin)" : r.faceTurnTerminated ? "Disqualified (Face)" : "Disqualified (Tab)"}
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                                        Evaluated
                                      </Badge>
                                    )
                                  ) : (
                                    r.isActive ? (
                                      <Badge className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] rounded font-bold uppercase py-0.5 px-2 animate-pulse">
                                        Active
                                      </Badge>
                                    ) : r.terminated ? (
                                      <Badge className="bg-red-50 text-red-700 border border-red-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                                        {r.terminatedByAdmin ? "Disqualified (Admin)" : r.faceTurnTerminated ? "Disqualified (Face)" : "Disqualified (Tab)"}
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                                        Submitted
                                      </Badge>
                                    )
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
          ) : activeTab === "coding_eval" ? (
            /* ======================================= */
            /* 💻 DEDICATED CODING EVALUATOR PANEL */
            /* ======================================= */
            <div className="space-y-6 text-left">
              {/* EXAM SELECTION & BANNER */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-purple-600" />
                      Coding Hybrid Assessment Evaluator & Marks Desk
                    </h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed mt-0.5">
                      Control Local IDE unlocks, enter step-by-step paper/execution marks, and finalize candidate evaluations.
                    </p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-bold px-3 py-1 rounded-lg self-start md:self-center">
                    Coding Hybrid Drives Only
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600">Select Coding Hybrid Assessment Exam</Label>
                  {exams.filter(ex => ex.assessmentType === "coding_hybrid").length === 0 ? (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-900 flex items-center justify-between gap-4">
                      <span>No Coding Assessment Drives created yet. Create a new exam with type <strong>"Coding Assessment (Hybrid Set-Wise)"</strong>.</span>
                      <CreateExamDialog onExamCreated={fetchExams} />
                    </div>
                  ) : (
                    <select
                      value={selectedExamCodeForCodingEval || (monitorExam?.assessmentType === "coding_hybrid" ? monitorExam.examCode : "")}
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedExamCodeForCodingEval(code);
                        const found = exams.find(ex => ex.examCode === code);
                        if (found) setMonitorExam(found);
                      }}
                      className="w-full max-w-md h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm cursor-pointer"
                    >
                      {exams
                        .filter((ex) => ex.assessmentType === "coding_hybrid")
                        .map((ex) => (
                          <option key={ex._id} value={ex.examCode}>
                            {ex.title} ({ex.examCode}) — {ex.questionSets?.length || 4} Question Sets
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>

              {/* CANDIDATE EVALUATION CARDS & TABLE */}
              {monitorExam && monitorExam.assessmentType === "coding_hybrid" ? (
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  {/* TOP SUMMARY STATS FOR SELECTED CODING EXAM */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-2">
                    <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                      <span className="text-[9px] uppercase font-extrabold text-purple-600">Question Sets</span>
                      <div className="text-sm font-black text-purple-900 mt-0.5">
                        {monitorExam.questionSets?.length || 4} Sets (A, B, C, D)
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-extrabold text-slate-400">Total Registered</span>
                      <div className="text-sm font-black text-slate-800 mt-0.5">
                        {results.length} Candidates
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-extrabold text-slate-400">IDE Access Unlocked</span>
                      <div className="text-sm font-black text-purple-700 mt-0.5">
                        {results.filter(r => r.allowLocalIdeSwitch).length} Candidates
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-extrabold text-slate-400">Graded Submissions</span>
                      <div className="text-sm font-black text-emerald-600 mt-0.5">
                        {results.filter(r => (r.paperLogicMarks || 0) + (r.executionOutputMarks || 0) > 0).length} Candidates
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Candidate Grading Matrix: {monitorExam.title} ({monitorExam.examCode})
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        Manage IDE unlocks, paper logic (50 max), execution output (50 max), and complete exam dispatch.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={refreshingTab === "coding_eval"}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold h-8 px-3 rounded-lg shadow-sm gap-1"
                      onClick={() => handleRefreshComponent("coding_eval", fetchUpdates)}
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${refreshingTab === "coding_eval" ? "animate-spin" : ""}`} /> Refresh List
                    </Button>
                  </div>

                  {results.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                      No candidates have entered this coding assessment lobby yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-slate-700 text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                            <th className="px-6 py-4">Student Name</th>
                            <th className="px-6 py-4">Email Address</th>
                            <th className="px-6 py-4 text-center">Assigned Set</th>
                            <th className="px-6 py-4 text-center">Graded Marks Breakdown</th>
                            <th className="px-6 py-4 text-center">IDE & Phase Status</th>
                            <th className="px-6 py-4 text-right">Evaluation Controls</th>
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
                              <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">{r.studentEmail || "N/A"}</td>
                              
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 text-xs font-black rounded-lg border ${
                                  r.assignedSet
                                    ? "bg-purple-600 text-white border-purple-700 shadow-sm"
                                    : "bg-amber-50 text-amber-800 border-amber-250 font-bold"
                                }`}>
                                  {r.assignedSet || "Awaiting Set"}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <div className="flex items-center gap-2 text-[11px]">
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                                      Paper: {r.paperLogicMarks || 0} / 50
                                    </span>
                                    <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold border border-purple-200">
                                      Exec: {r.executionOutputMarks || 0} / 50
                                    </span>
                                  </div>
                                  <span className="text-slate-900 font-extrabold text-xs">
                                    Total: {(r.paperLogicMarks || 0) + (r.executionOutputMarks || 0)} / 100
                                  </span>
                                </div>
                              </td>

                              <td className="px-6 py-4 text-center">
                                {r.codingPhase === "completed" ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                                    Completed & Graded
                                  </Badge>
                                ) : r.allowLocalIdeSwitch ? (
                                  <Badge className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] rounded font-black uppercase py-0.5 px-2.5 animate-pulse">
                                    IDE Access Unlocked
                                  </Badge>
                                ) : r.isActive ? (
                                  <Badge className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                                    {r.assignedSet ? `Writing (${r.assignedSet})` : "In Lobby"}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] rounded font-bold uppercase py-0.5 px-2">
                                    Completed & Graded
                                  </Badge>
                                )}
                              </td>

                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end items-center gap-2">
                                  <Button
                                    size="sm"
                                    disabled={r.codingPhase === "completed"}
                                    className={`h-8 px-3 text-xs font-extrabold rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                      r.allowLocalIdeSwitch
                                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                                        : "bg-purple-600 hover:bg-purple-700 text-white"
                                    }`}
                                    onClick={() => handleToggleIdeAccess(monitorExam?.examCode || "", r.studentEmail, !r.allowLocalIdeSwitch)}
                                  >
                                    {r.allowLocalIdeSwitch ? "Lock IDE" : "Unlock IDE"}
                                  </Button>

                                  <Button
                                    size="sm"
                                    disabled={r.codingPhase === "completed"}
                                    className="h-8 px-3 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={async () => {
                                      const { value: formValues } = await Swal.fire({
                                        title: `Grade Candidate: ${r.studentName}`,
                                        html:
                                          `<div class="text-left text-xs space-y-3 font-bold text-slate-700">` +
                                          `<div><label class="block mb-1">Paper Logic Marks (Max: 50)</label><input id="swal-paper" type="number" class="w-full h-9 px-3 border rounded-lg text-sm bg-slate-50" value="${r.paperLogicMarks || 0}" /></div>` +
                                          `<div><label class="block mb-1">Execution Output Marks (Max: 50)</label><input id="swal-exec" type="number" class="w-full h-9 px-3 border rounded-lg text-sm bg-slate-50" value="${r.executionOutputMarks || 0}" /></div>` +
                                          `</div>`,
                                        focusConfirm: false,
                                        showCancelButton: true,
                                        confirmButtonText: "Save Marks",
                                        confirmButtonColor: "#3b82f6",
                                        preConfirm: () => {
                                          return [
                                            (document.getElementById("swal-paper") as HTMLInputElement).value,
                                            (document.getElementById("swal-exec") as HTMLInputElement).value
                                          ];
                                        }
                                      });

                                      if (formValues) {
                                        const pMarks = parseInt(formValues[0]) || 0;
                                        const eMarks = parseInt(formValues[1]) || 0;
                                        await handleUpdateCodingMarks(monitorExam?.examCode || "", r.studentEmail, pMarks, eMarks);
                                      }
                                    }}
                                  >
                                    Grade Marks
                                  </Button>

                                  <Button
                                    size="sm"
                                    disabled={r.codingPhase === "completed"}
                                    className="h-8 px-3 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleCompleteCodingExam(monitorExam?.examCode || "", r.studentEmail)}
                                  >
                                    {r.codingPhase === "completed" ? "Finalized" : "Complete"}
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
              ) : (
                <div className="text-center py-20 text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-semibold">
                  Please select a Coding Hybrid assessment exam above to open the Evaluation Desk.
                </div>
              )}
            </div>
          ) : activeTab === "questions" ? (
            /* ======================================= */
            /* 📂 INLINE QUESTION BANK EDITOR PANEL */
            /* ======================================= */
            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Choose Assessment Exam</label>
                    <select
                      value={selectedExamCodeForQuestions}
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedExamCodeForQuestions(code);
                        const selected = exams.find(ex => ex.examCode === code);
                        if (selected) {
                          setManagingExamQuestions(selected);
                          setEditingQuestionIndex(null);
                        } else {
                          setManagingExamQuestions(null);
                        }
                      }}
                      className="w-full min-w-[280px] max-w-md h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select an Assessment Exam --</option>
                      {exams.map((ex) => (
                        <option key={ex._id} value={ex.examCode}>
                          {ex.title} ({ex.examCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={refreshingTab === "questions"}
                    onClick={() => handleRefreshComponent("questions")}
                    className="h-10 text-xs font-bold border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 shadow-sm self-start sm:self-end"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 text-blue-600 ${refreshingTab === "questions" ? "animate-spin" : ""}`} /> Refresh Question Banks
                  </Button>
                </div>
              </div>

              {managingExamQuestions ? (
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3 mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                    <div>
                      <h2 className="text-base font-black text-slate-900">
                        Question Bank: {managingExamQuestions.title} ({managingExamQuestions.examCode})
                      </h2>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        Manage individual questions, types, options, correct answers, and marks scoring.
                      </p>
                    </div>
                    {editingQuestionIndex === null && (
                      <Button
                        onClick={handleStartAddQuestion}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-3 rounded-lg flex items-center gap-1 self-start md:self-center shrink-0"
                      >
                        <Plus className="h-4 w-4" /> Add Question
                      </Button>
                    )}
                  </div>

                  {editingQuestionIndex !== null ? (
                    <div className="space-y-4 pt-2 text-left text-xs font-bold text-slate-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500">Question Type</Label>
                          <select
                            value={qEditorType}
                            onChange={(e) => setQEditorType(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none"
                          >
                            <option value="MCQ">MCQ (Single Correct)</option>
                            <option value="MSQ">MSQ (Multiple Selection)</option>
                            <option value="FIB">Fill in the Blanks</option>
                            <option value="NUM">Numerical Answer</option>
                            <option value="DES">Descriptive / Essay</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500">Section Name</Label>
                          <Input value={qEditorSection} onChange={(e) => setQEditorSection(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500">Question Text</Label>
                        <textarea value={qEditorQuestion} onChange={(e) => setQEditorQuestion(e.target.value)} className="w-full min-h-[60px] p-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      {["MCQ", "MSQ"].includes(qEditorType) && (
                        <div className="p-3 bg-slate-50 border rounded-xl grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-slate-400">Option A</Label>
                            <Input value={qEditorOptA} onChange={(e) => setQEditorOptA(e.target.value)} className="bg-white border-slate-200 text-xs h-9 font-medium text-slate-800" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-slate-400">Option B</Label>
                            <Input value={qEditorOptB} onChange={(e) => setQEditorOptB(e.target.value)} className="bg-white border-slate-200 text-xs h-9 font-medium text-slate-800" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-slate-400">Option C</Label>
                            <Input value={qEditorOptC} onChange={(e) => setQEditorOptC(e.target.value)} className="bg-white border-slate-200 text-xs h-9 font-medium text-slate-800" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-slate-400">Option D</Label>
                            <Input value={qEditorOptD} onChange={(e) => setQEditorOptD(e.target.value)} className="bg-white border-slate-200 text-xs h-9 font-medium text-slate-800" />
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label className="text-xs font-bold text-slate-500">Correct Answer</Label>
                          <Input value={qEditorCorrectAnswer} onChange={(e) => setQEditorCorrectAnswer(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10 font-bold text-slate-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-bold text-slate-500">Marks</Label>
                            <Input type="number" value={qEditorMarks} onChange={(e) => setQEditorMarks(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-slate-500">Neg Marks</Label>
                            <Input type="number" step="0.01" value={qEditorNegMarks} onChange={(e) => setQEditorNegMarks(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-bold text-slate-500">Code Snippet (Optional)</Label>
                          <textarea value={qEditorCodeSnippet} onChange={(e) => setQEditorCodeSnippet(e.target.value)} className="w-full min-h-[40px] p-2 text-xs font-mono border rounded-xl bg-slate-900 text-green-400" />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-slate-500">Image URL (Optional)</Label>
                          <Input value={qEditorImageUrl} onChange={(e) => setQEditorImageUrl(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button variant="outline" onClick={() => setEditingQuestionIndex(null)} className="h-10 text-xs font-bold px-4 border rounded-xl">Cancel</Button>
                        <Button onClick={handleSaveQuestion} disabled={updating} className="bg-blue-600 text-white font-bold h-10 text-xs px-6 rounded-xl">Save</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2 text-left">
                      {(!managingExamQuestions.questions || managingExamQuestions.questions.length === 0) ? (
                        <div className="text-center py-12 text-slate-400 text-sm">No questions in this exam.</div>
                      ) : (
                        <div className="space-y-3">
                          {managingExamQuestions.questions.map((q: any, idx: number) => {
                            const qType = q.questionType || (q.isMultipleCorrect ? "MSQ" : "MCQ");
                            return (
                              <div key={q._id || idx} className="p-4 border rounded-xl bg-slate-50/20 hover:border-slate-300 transition-colors relative">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">Q{idx + 1}</span>
                                  <span className="text-[10px] bg-blue-150 text-blue-800 font-extrabold px-2 py-0.5 rounded uppercase">Section: {q.section || "General"}</span>
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded uppercase">{qType}</span>
                                  {q.isGraceAwarded && (
                                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-250 font-extrabold px-2 py-0.5 rounded animate-pulse">
                                      Grace Awarded
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-bold ml-auto">Marks: {q.marks || 1}</span>
                                </div>
                                <div className="text-slate-800 font-bold text-xs mb-3 pr-24">{q.question}</div>
                                {["MCQ", "MSQ"].includes(qType) && q.options && (
                                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mb-3 bg-white p-2 rounded border">
                                    <div><strong>A.</strong> {q.options.A}</div>
                                    <div><strong>B.</strong> {q.options.B}</div>
                                    <div><strong>C.</strong> {q.options.C}</div>
                                    <div><strong>D.</strong> {q.options.D}</div>
                                  </div>
                                )}
                                <div className="text-[11px] font-bold text-slate-500">Correct Answer: <span className="text-blue-600 font-black">{q.correctAnswer}</span></div>
                                <div className="absolute right-4 bottom-4 inline-flex gap-1">
                                  {q.isGraceAwarded ? (
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => handleToggleGraceMarks(idx, q, false)}>
                                      Revoke Grace
                                    </Button>
                                  ) : (
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-slate-500 hover:bg-slate-50" onClick={() => handleToggleGraceMarks(idx, q, true)}>
                                      Award Grace
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-amber-600" onClick={() => handleStartEditQuestion(idx, q)}>Edit</Button>
                                  <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-red-650" onClick={() => handleDeleteQuestion(idx)}>Delete</Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-24 text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-semibold">
                  Please select an assessment exam from the dropdown list to manage its question pool.
                </div>
              )}
            </div>
          ) : activeTab === "analysis" ? (
            /* ======================================= */
            /* 📊 INLINE EXAM PERFORMANCE ANALYSIS PANEL */
            /* ======================================= */
            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                  <div className="text-left">
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Choose Assessment Exam</label>
                    <select
                      value={selectedExamCodeForAnalysis}
                      onChange={(e) => {
                        const code = e.target.value;
                        setSelectedExamCodeForAnalysis(code);
                        const selected = exams.find(ex => ex.examCode === code);
                        if (selected) {
                          handleOpenAnalysis(selected);
                        } else {
                          setViewingExamAnalysis(null);
                          setAnalysisResults([]);
                        }
                      }}
                      className="w-full min-w-[320px] h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select an Assessment Exam --</option>
                      {exams.map((ex) => (
                        <option key={ex._id} value={ex.examCode}>
                          {ex.title} ({ex.examCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={refreshingTab === "analysis"}
                      onClick={() => handleRefreshComponent("analysis", async () => {
                        await fetchExams(true);
                        if (viewingExamAnalysis) await handleOpenAnalysis(viewingExamAnalysis);
                      })}
                      className="h-10 text-xs font-bold border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 text-blue-600 ${refreshingTab === "analysis" ? "animate-spin" : ""}`} /> Refresh Analysis
                    </Button>

                    {viewingExamAnalysis && analysisResults.length > 0 && (
                      <>
                        <Button
                          onClick={handleExportToExcel}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5 shadow"
                        >
                          <Download className="h-4 w-4" /> Export Performance Report
                        </Button>
                        <Button
                          onClick={() => handleManualSendAllEmails(selectedExamCodeForAnalysis)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-1.5 shadow"
                        >
                          <Mail className="h-4 w-4" /> Email All Scorecards
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {viewingExamAnalysis ? (
                loadingAnalysis ? (
                  <div className="text-center py-24 text-slate-400 bg-white border rounded-2xl shadow-sm text-xs font-semibold">
                    <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                    Generating performance metrics...
                  </div>
                ) : !analysisResults.length ? (
                  <div className="text-center py-24 text-slate-400 bg-white border rounded-2xl shadow-sm text-xs">
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                    <p className="font-semibold">No participants have submitted responses for this assessment yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* OVERVIEW SCORECARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Total Participants</div>
                        <div className="text-2xl font-black text-slate-800 mt-1">{analysisResults.length}</div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm border-l-4 border-l-indigo-500">
                        <div className="text-[10px] uppercase font-bold text-indigo-400 font-extrabold">Average Score</div>
                        <div className="text-2xl font-black text-indigo-600 mt-1">{analysisStats?.avgScore} / {analysisStats?.totalMarks}</div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm border-l-4 border-l-emerald-500">
                        <div className="text-[10px] uppercase font-bold text-emerald-400 font-extrabold">Highest Score</div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">{analysisStats?.highestScore} / {analysisStats?.totalMarks}</div>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm border-l-4 border-l-amber-500">
                        <div className="text-[10px] uppercase font-bold text-amber-400 font-extrabold">Pass Rate (&ge;50%)</div>
                        <div className="text-2xl font-black text-amber-600 mt-1">
                          {((analysisResults.filter(r => (r.score || 0) >= (analysisStats?.totalMarks || 0) * 0.5).length / analysisResults.length) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* TABULAR MARKS REPORT & BATCH MATRIX */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                          <button
                            onClick={() => setAnalysisSubTab("scorecard")}
                            type="button"
                            className={`px-3 py-1.5 text-[10px] font-extrabold uppercase rounded-lg transition-all ${
                              analysisSubTab === "scorecard"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Scorecard Report
                          </button>
                          <button
                            onClick={() => setAnalysisSubTab("matrix")}
                            type="button"
                            className={`px-3 py-1.5 text-[10px] font-extrabold uppercase rounded-lg transition-all ${
                              analysisSubTab === "matrix"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Batch Response Matrix
                          </button>
                        </div>

                        {analysisSubTab === "scorecard" && (
                          <div className="flex items-center gap-2">
                            <div className="relative w-64">
                              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                              <Input
                                placeholder="Search student by name or email..."
                                value={scorecardSearchQuery}
                                onChange={(e) => setScorecardSearchQuery(e.target.value)}
                                className="pl-8 h-9 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-blue-500 w-full"
                              />
                            </div>
                            <select
                              value={scorecardStatusFilter}
                              onChange={(e) => setScorecardStatusFilter(e.target.value)}
                              className="h-9 text-xs rounded-xl border border-slate-200 bg-white px-2.5 font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="all">All Candidates</option>
                              <option value="completed">Completed (Normal)</option>
                              <option value="terminated">Terminated</option>
                              <option value="suspicious">Suspicious Proctors</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {analysisSubTab === "scorecard" ? (
                        <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-[300px] overflow-y-auto">
                          <table className="w-full text-slate-700 text-[11px] text-left">
                            <thead>
                              <tr className="bg-slate-50 border-b text-slate-400 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10">
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Roll Number</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3 text-center">Score</th>
                                <th className="px-4 py-3 text-center">Behavior Logs (Tab/Face/Noise/FS/Net)</th>
                                <th className="px-4 py-3 text-center">Proctor Status</th>
                                <th className="px-4 py-3 text-center">Mail Delivery</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {analysisResults
                                .filter((r) => {
                                  const cleanSearch = scorecardSearchQuery.toLowerCase().trim();
                                  const matchesSearch =
                                    r.studentName.toLowerCase().includes(cleanSearch) ||
                                    r.studentEmail.toLowerCase().includes(cleanSearch) ||
                                    (r.studentRollNumber || "").toLowerCase().includes(cleanSearch);
                                  
                                  if (scorecardStatusFilter === "all") return matchesSearch;
                                  if (scorecardStatusFilter === "completed") return matchesSearch && !r.terminated && (r.tabSwitchCount || 0) <= 3 && (r.faceWarningCount || 0) <= 5;
                                  if (scorecardStatusFilter === "terminated") return matchesSearch && r.terminated;
                                  if (scorecardStatusFilter === "suspicious") return matchesSearch && ((r.tabSwitchCount || 0) > 3 || (r.faceWarningCount || 0) > 5 || (r.noiseWarningCount || 0) > 3 || (r.fullScreenExitCount || 0) > 3);
                                  return matchesSearch;
                                })
                                .map((r, i) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.studentName}</td>
                                    <td className="px-4 py-2.5 font-semibold text-slate-650 uppercase tracking-wider">{r.studentRollNumber || "N/A"}</td>
                                    <td className="px-4 py-2.5 font-mono text-slate-400">{r.studentEmail}</td>
                                    <td className="px-4 py-2.5 text-center font-black text-indigo-600">{r.score} / {analysisStats?.totalMarks}</td>
                                    <td className="px-4 py-2.5 text-center font-semibold text-slate-550 text-[10px]">
                                       Tab: <span className={r.tabSwitchCount > 0 ? "text-amber-600" : ""}>{r.tabSwitchCount || 0}</span> | Face: <span className={r.faceWarningCount > 0 ? "text-amber-650" : ""}>{r.faceWarningCount || 0}</span> | Noise: <span className={r.noiseWarningCount > 0 ? "text-amber-650" : ""}>{r.noiseWarningCount || 0}</span> | FS: <span className={r.fullScreenExitCount > 0 ? "text-amber-650" : ""}>{r.fullScreenExitCount || 0}</span> | Net: <span className={r.internetIssueCount > 0 ? "text-amber-650" : ""}>{r.internetIssueCount || 0}</span>
                                     </td>
                                    <td className="px-4 py-2.5 text-center">
                                      {r.terminated ? (
                                        <Badge className="bg-red-50 text-red-700 border border-red-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5">Terminated</Badge>
                                      ) : r.tabSwitchCount > 3 || r.faceWarningCount > 5 ? (
                                        <Badge className="bg-amber-50 text-amber-700 border border-amber-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5 animate-bounce">Suspicious</Badge>
                                      ) : (
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5">Completed</Badge>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                      {r.isEmailed ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5 flex items-center gap-1 justify-center w-fit mx-auto">
                                          <Mail className="h-2.5 w-2.5 text-emerald-650" /> Sent
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-slate-50 text-slate-500 border border-slate-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5 flex items-center gap-1 justify-center w-fit mx-auto">
                                          <Mail className="h-2.5 w-2.5 text-slate-400" /> Pending
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                      <div className="flex gap-1.5 justify-end">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-[10px] gap-1 font-bold border-slate-200 text-blue-600 hover:bg-slate-50 hover:text-slate-800 rounded-lg flex items-center shadow-sm"
                                          onClick={() => setViewingStudentResult(r)}
                                        >
                                          <Eye className="h-3 w-3" /> View Answers
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-[10px] gap-1 font-bold border-slate-200 text-emerald-600 hover:bg-slate-50 rounded-lg flex items-center shadow-sm"
                                          onClick={() => handleManualSendEmail(selectedExamCodeForAnalysis, r.studentEmail)}
                                        >
                                          <Mail className="h-3 w-3" /> Send Mail
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-[10px] gap-1 font-bold border-slate-200 text-amber-600 hover:bg-amber-50 rounded-lg flex items-center shadow-sm"
                                          onClick={() => handleResetAttempt(selectedExamCodeForAnalysis, r.studentEmail, r.studentName)}
                                        >
                                          <RotateCcw className="h-3 w-3" /> Re-Attempt
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-400 font-semibold">Horizontal grid displays every student's answer and time spent inline (Green = Correct, Red = Incorrect, Gray = Unanswered).</p>
                          <div className="overflow-x-auto border border-slate-150 rounded-xl max-h-[400px] overflow-y-auto">
                            <table className="w-full border-collapse text-left text-[11px] font-sans">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                  <th className="px-4 py-2.5 font-bold text-slate-700 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-slate-200">Candidate Name</th>
                                  <th className="px-3 py-2.5 font-bold text-slate-700 text-center border-r border-slate-200">Score</th>
                                  {viewingExamAnalysis.questions.map((q: any, qi: number) => {
                                    const qType = q.questionType || (q.isMultipleCorrect ? "MSQ" : "MCQ");
                                    return (
                                      <th
                                        key={q._id || qi}
                                        title={`${q.question}\n\nCorrect Key: ${q.correctAnswer}`}
                                        className="px-3 py-2.5 font-extrabold text-slate-700 text-center min-w-[120px] cursor-help border-r border-slate-200 hover:bg-slate-100 transition-colors"
                                      >
                                        Q{qi + 1} <span className="text-[8px] bg-slate-200 text-slate-500 px-1 py-0.5 rounded ml-0.5">{qType}</span>
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150">
                                {analysisResults.map((r, ri) => (
                                  <tr key={ri} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-2.5 font-extrabold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-slate-250">
                                      <div>{r.studentName}</div>
                                      <div className="text-[9px] font-normal text-slate-400">{r.studentEmail}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center font-black text-blue-600 border-r border-slate-200 bg-slate-50/10">
                                      {r.score}
                                    </td>
                                    {viewingExamAnalysis.questions.map((q: any) => {
                                      const ans = r.answers?.find((a: any) => a.questionId === q._id);
                                      const selected = ans ? (ans.selectedOption || "").trim() : "";
                                      const cleanCorrect = (q.correctAnswer || "").trim();
                                      const qType = q.questionType || (q.isMultipleCorrect ? "MSQ" : "MCQ");
                                      const time = ans ? ans.timeSpent || 0 : 0;

                                      let isCorrect = false;
                                      let isAnswered = selected !== "";

                                      if (isAnswered) {
                                        if (qType === "MCQ") {
                                          const sel = selected.split(",").map((s: string) => s.trim().toUpperCase());
                                          const cor = cleanCorrect.split(",").map((c: string) => c.trim().toUpperCase());
                                          isCorrect = sel.length === 1 && sel[0] === cor[0];
                                        } else if (qType === "MSQ") {
                                          const sel = selected.split(",").map((s: string) => s.trim().toUpperCase());
                                          const cor = cleanCorrect.split(",").map((c: string) => c.trim().toUpperCase());
                                          const hasIncorrect = sel.some((s: string) => !cor.includes(s));
                                          isCorrect = !hasIncorrect && sel.length === cor.length;
                                        } else if (qType === "FIB") {
                                          const alts = cleanCorrect.split(/[|/,]/).map((a: string) => a.toLowerCase().trim().replace(/\s+/g, " "));
                                          const stud = selected.toLowerCase().trim().replace(/\s+/g, " ");
                                          isCorrect = alts.some((a: string) => stud === a) || stud === cleanCorrect.toLowerCase().trim().replace(/\s+/g, " ");
                                        } else if (qType === "NUM") {
                                          const sFloat = parseFloat(selected.replace(/\s+/g, ""));
                                          const cFloat = parseFloat(cleanCorrect.replace(/\s+/g, ""));
                                          isCorrect = !isNaN(sFloat) && !isNaN(cFloat) && sFloat === cFloat;
                                        } else if (qType === "DES") {
                                          const stud = selected.toLowerCase().trim().replace(/\s+/g, " ");
                                          const cor = cleanCorrect.toLowerCase().trim().replace(/\s+/g, " ");
                                          isCorrect = stud.includes(cor);
                                        }
                                      }

                                      let cellBg = "bg-slate-50 text-slate-400 border-r border-slate-150";
                                      let formattedVal = "(Blank)";

                                      if (isAnswered) {
                                        cellBg = isCorrect 
                                          ? "bg-emerald-50 text-emerald-950 font-bold border-r border-emerald-150/50" 
                                          : "bg-red-50/70 text-red-950 border-r border-red-150/40";
                                        
                                        if (["MCQ", "MSQ"].includes(qType) && q.options) {
                                          formattedVal = selected;
                                        } else {
                                          formattedVal = selected.length > 20 ? selected.substring(0, 18) + "..." : selected;
                                        }
                                      }

                                      return (
                                        <td
                                          key={q._id}
                                          className={`px-3 py-2 text-center align-middle font-mono ${cellBg}`}
                                          title={`Candidate Choice: ${selected || "(Unanswered)"}\nCorrect Answer: ${cleanCorrect}\nTime spent: ${time}s`}
                                        >
                                          <div className="flex flex-col items-center justify-center gap-0.5">
                                            <span className="text-[10px] leading-none">{formattedVal}</span>
                                            <span className="text-[8px] opacity-60 font-semibold leading-none">{time}s</span>
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* QUESTION-WISE ANALYSIS AND DIFFICULTY */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Question-Wise Performance Breakdown</h3>
                      <div className="grid grid-cols-1 gap-3.5">
                        {analysisStats?.questionStats.map((qs, i) => (
                          <div key={qs._id || i} className="p-4 border border-slate-150 rounded-xl bg-slate-50/20 space-y-2 hover:border-indigo-200 hover:shadow-sm transition-all">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-2 py-0.5 rounded font-mono">Q{i + 1}</span>
                              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-extrabold px-2 py-0.5 rounded uppercase">{qs.section}</span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono uppercase">{qs.questionType}</span>
                              
                              <Badge className={`${qs.difficultyColor} border text-[9px] font-extrabold uppercase rounded-full py-0.5 px-2 ml-1`}>
                                {qs.difficulty}
                              </Badge>

                              <div className="ml-auto inline-flex items-center gap-3 text-[10px] font-bold text-slate-400">
                                <span>Marks: {qs.marks}</span>
                                <span>Avg Time: <strong className="text-slate-700 font-extrabold">{qs.avgTimeSpent}s</strong></span>
                              </div>
                            </div>

                            <div className="text-slate-800 font-bold text-xs leading-normal">{qs.question}</div>

                            {/* QUESTION PERFORMANCE BAR / BREAKDOWN */}
                            <div className="pt-2 text-[10px]">
                              <div className="flex justify-between font-bold text-slate-500 mb-1">
                                <span>Attempts: {qs.totalAttempts}</span>
                                <span>Correctness Rate: <strong className="text-indigo-600 font-black">{qs.correctnessRate}%</strong></span>
                              </div>
                              {/* Visual Progress Bar */}
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                <div className="bg-emerald-500 h-full" style={{ width: `${qs.totalAttempts > 0 ? (qs.correctAttempts / qs.totalAttempts) * 100 : 0}%` }} title="Correct" />
                                <div className="bg-red-400 h-full" style={{ width: `${qs.totalAttempts > 0 ? (qs.incorrectAttempts / qs.totalAttempts) * 100 : 0}%` }} title="Incorrect" />
                              </div>
                              <div className="flex gap-4 mt-1 font-bold text-slate-400">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Correct: {qs.correctAttempts}</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> Incorrect: {qs.incorrectAttempts}</span>
                              </div>
                            </div>

                            {/* DETAILED STUDENT RESPONSE TIMINGS */}
                            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px]">
                              <div className="text-slate-500 font-extrabold mb-1">Candidate Time Spent List:</div>
                              <div className="flex flex-wrap gap-1.5 max-h-[50px] overflow-y-auto">
                                {analysisResults.map((r, ri) => {
                                  const ans = r.answers?.find((a: any) => a.questionId === qs._id);
                                  const time = ans ? ans.timeSpent || 0 : 0;
                                  return (
                                    <span key={ri} className="bg-white border border-slate-150 px-2 py-0.5 rounded text-slate-600 font-mono text-[9px]" title={`${r.studentName} (${r.studentEmail})`}>
                                      {r.studentName.split(" ")[0]}: {time}s
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}`
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-24 text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-semibold">
                  Please select an assessment exam from the dropdown list to generate performance reports.
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
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm max-w-3xl text-left space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">AI Proctor Config Engine</h2>
                <p className="text-slate-400 text-xs leading-relaxed mt-0.5">
                  Configure real-time device restrictions, camera face scan variances, microphone ambient decibels tracking, and fullscreen lockouts.
                </p>
              </div>
              
              <div className="space-y-4 pt-2">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Choose Assessment Exam</label>
                    <select
                      value={configExamCode}
                      onChange={(e) => handleSelectConfigExam(e.target.value)}
                      className="w-full min-w-[280px] max-w-md h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-750 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select an Assessment Exam --</option>
                      {exams.map((ex) => (
                        <option key={ex._id} value={ex.examCode}>
                          {ex.title} ({ex.examCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={refreshingTab === "settings"}
                    onClick={() => handleRefreshComponent("settings", async () => {
                      await fetchExams(true);
                      if (configExamCode) handleSelectConfigExam(configExamCode);
                    })}
                    className="h-10 text-xs font-bold border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 shadow-sm self-start sm:self-end"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 text-blue-600 ${refreshingTab === "settings" ? "animate-spin" : ""}`} /> Refresh Configs
                  </Button>
                </div>

                {configExamCode ? (
                  <div className="space-y-4 pt-2 text-xs text-slate-700 font-semibold">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">Enable AI Proctor Config Engine</div>
                        <div className="text-[10px] text-slate-400 font-medium">Activate real-time browser security, gaze tracking, audio levels analysis, and screen share monitoring.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={proctorActive}
                        onChange={(e) => setProctorActive(e.target.checked)}
                        className="w-4.5 h-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {proctorActive && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column: Media Access Requirements */}
                        <div className="p-4 bg-white border rounded-xl space-y-3">
                          <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b pb-1.5 mb-2">Media &amp; Feed Restrictions</h3>
                          
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={proctorCam}
                              onChange={(e) => setProctorCam(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-[11px] font-bold text-slate-750 block">Mandate Camera Feed &amp; Identity Recognition Check</span>
                              <span className="text-[9px] text-slate-400 font-medium">Enforces candidate facial verification check and active eye-gaze tracking head-turn warnings.</span>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={proctorMic}
                              onChange={(e) => setProctorMic(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-[11px] font-bold text-slate-750 block">Mandate Microphone Audio Stream &amp; Noise Analysis</span>
                              <span className="text-[9px] text-slate-400 font-medium">Request mic access to track background volumes and log alerts if spikes exceed standard decibel parameters.</span>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={proctorScreen}
                              onChange={(e) => setProctorScreen(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-[11px] font-bold text-slate-750 block">Mandate Entire Screen Share Access</span>
                              <span className="text-[9px] text-slate-400 font-medium">Forced display projection sharing. Screen blocks exam and logs violation if stream is manually stopped.</span>
                            </div>
                          </label>
                        </div>

                        {/* Right Column: Focus & Connectivity Loggers */}
                        <div className="p-4 bg-white border rounded-xl space-y-3">
                          <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b pb-1.5 mb-2">Browser Focus &amp; Network Auditing</h3>
                          
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={proctorTab}
                              onChange={(e) => setProctorTab(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-[11px] font-bold text-slate-750 block">Track Tab Switching Warnings</span>
                              <span className="text-[9px] text-slate-400 font-medium">Monitor window blur events and tab switches, warning the candidate and updating the admin logs.</span>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={proctorFS}
                              onChange={(e) => setProctorFS(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-[11px] font-bold text-slate-750 block">Track Fullscreen Exits Warnings</span>
                              <span className="text-[9px] text-slate-400 font-medium">Enforce fullscreen environment. Any key escape drops exam blocker and logs warning.</span>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={proctorNet}
                              onChange={(e) => setProctorNet(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-[11px] font-bold text-slate-750 block">Track Network Offline Interruptions</span>
                              <span className="text-[9px] text-slate-400 font-medium">Detect browser connection dropouts and log network offline periods in the scorecard.</span>
                            </div>
                          </label>

                          {/* Warning Limit Controls */}
                            <div className="pt-3 border-t border-slate-200 space-y-2.5">
                              <h4 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Termination Threshold Limits</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-600 block">Max Tab Switch Warnings</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={maxTabSwitches}
                                    onChange={(e) => setMaxTabSwitches(parseInt(e.target.value) || 1)}
                                    className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-[9px] text-slate-400 block leading-tight">Exceeding this count auto-terminates &amp; submits test.</span>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-600 block">Max Fullscreen Exit Warnings</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={maxFullScreenExits}
                                    onChange={(e) => setMaxFullScreenExits(parseInt(e.target.value) || 1)}
                                    className="w-full text-xs font-bold px-2 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-[9px] text-slate-400 block leading-tight">Exceeding this count auto-terminates &amp; submits test.</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Email Dispatch Option */}
                    <div className="p-4 bg-slate-50 border rounded-xl space-y-2 text-left">
                      <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Results Dispatch & Email Delivery</h3>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        Choose whether candidate performance scorecards are automatically emailed to their registered inbox upon test submission, dispatched manually, or kept private.
                      </p>
                      <select
                        value={resultsDispatch}
                        onChange={(e) => setResultsDispatch(e.target.value)}
                        className="w-full max-w-md h-10 px-3 mt-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-750 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">Don't Send Results (Keep Private)</option>
                        <option value="automatic">Send Automatically after response is submitted</option>
                        <option value="manual">Send Manually from Admin dashboard</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handleSaveProctorConfig}
                        disabled={savingConfig}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 text-xs px-6 rounded-xl shadow-sm"
                      >
                        {savingConfig ? "Saving configurations..." : "Save configurations"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs font-semibold py-8 text-center bg-slate-50 border rounded-xl">
                    Please choose an assessment exam above to view and configure its AI proctor configuration settings.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ======================================= */}
      {/* 📂 QUESTION BANK EDITOR MODAL */}
      {/* ======================================= */}
      <Dialog open={false} onOpenChange={(v) => !v && setManagingExamQuestions(null)}>
        <DialogContent className="max-w-4xl w-full rounded-2xl p-6 max-h-[80vh] overflow-y-auto font-sans">
          {managingExamQuestions && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3 mb-3 flex flex-row items-center justify-between">
                <div className="text-left">
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Question Bank: {managingExamQuestions?.title} ({managingExamQuestions?.examCode})
                  </DialogTitle>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Manage individual questions, types, options, correct answers, and marks scoring.
                  </p>
                </div>
                {editingQuestionIndex === null && (
                  <Button
                    onClick={handleStartAddQuestion}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-3 rounded-lg flex items-center gap-1 shrink-0"
                  >
                    <Plus className="h-4 w-4" /> Add Question
                  </Button>
                )}
              </DialogHeader>

              {editingQuestionIndex !== null ? (
                <div className="space-y-4 pt-2 text-left text-xs font-bold text-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Question Type</Label>
                      <select
                        value={qEditorType}
                        onChange={(e) => setQEditorType(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="MCQ">MCQ (Single Correct)</option>
                        <option value="MSQ">MSQ (Multiple Selection)</option>
                        <option value="FIB">Fill in the Blanks</option>
                        <option value="NUM">Numerical Answer</option>
                        <option value="DES">Descriptive / Essay</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500">Section Name</Label>
                      <Input value={qEditorSection} onChange={(e) => setQEditorSection(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500">Question Text</Label>
                    <textarea value={qEditorQuestion} onChange={(e) => setQEditorQuestion(e.target.value)} className="w-full min-h-[60px] p-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800" />
                  </div>
                  {["MCQ", "MSQ"].includes(qEditorType) && (
                    <div className="p-3 bg-slate-50 border rounded-xl grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-400">Option A</Label>
                        <Input value={qEditorOptA} onChange={(e) => setQEditorOptA(e.target.value)} className="bg-white border-slate-200 text-xs h-9 font-medium text-slate-800" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-400">Option B</Label>
                        <Input value={qEditorOptB} onChange={(e) => setQEditorOptB(e.target.value)} className="bg-white border-slate-200 text-xs h-9 font-medium text-slate-800" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-400">Option C</Label>
                        <Input value={qEditorOptC} onChange={(e) => setQEditorOptC(e.target.value)} className="bg-white border-slate-200 text-xs h-9 font-medium text-slate-800" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-400">Option D</Label>
                        <Input value={qEditorOptD} onChange={(e) => setQEditorOptD(e.target.value)} className="bg-white border-slate-200 text-xs h-9 font-medium text-slate-800" />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label className="text-xs font-bold text-slate-500">Correct Answer</Label>
                      <Input value={qEditorCorrectAnswer} onChange={(e) => setQEditorCorrectAnswer(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10 font-bold text-slate-800" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-bold text-slate-500">Marks</Label>
                        <Input type="number" value={qEditorMarks} onChange={(e) => setQEditorMarks(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-500">Neg Marks</Label>
                        <Input type="number" step="0.01" value={qEditorNegMarks} onChange={(e) => setQEditorNegMarks(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-500">Code Snippet (Optional)</Label>
                      <textarea value={qEditorCodeSnippet} onChange={(e) => setQEditorCodeSnippet(e.target.value)} className="w-full min-h-[40px] p-2 text-xs font-mono border rounded-xl bg-slate-900 text-green-400" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-500">Image URL (Optional)</Label>
                      <Input value={qEditorImageUrl} onChange={(e) => setQEditorImageUrl(e.target.value)} className="bg-slate-50 border-slate-200 text-sm h-10" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setEditingQuestionIndex(null)} className="h-10 text-xs font-bold px-4 border rounded-xl">Cancel</Button>
                    <Button onClick={handleSaveQuestion} disabled={updating} className="bg-blue-600 text-white font-bold h-10 text-xs px-6 rounded-xl">Save</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2 text-left">
                  {(!managingExamQuestions.questions || managingExamQuestions.questions.length === 0) ? (
                    <div className="text-center py-12 text-slate-400 text-sm">No questions in this exam.</div>
                  ) : (
                    <div className="space-y-3">
                       {managingExamQuestions.questions.map((q: any, idx: number) => {
                        const qType = q.questionType || (q.isMultipleCorrect ? "MSQ" : "MCQ");
                        return (
                          <div key={q._id || idx} className="p-4 border rounded-xl bg-white relative">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">Q{idx + 1}</span>
                              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">Section: {q.section || "General"}</span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">{qType}</span>
                              {q.isGraceAwarded && (
                                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-250 font-extrabold px-2 py-0.5 rounded animate-pulse">
                                  Grace Awarded
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-bold ml-auto">Marks: {q.marks || 1}</span>
                            </div>
                            <div className="text-slate-800 font-semibold text-xs mb-3 pr-20">{q.question}</div>
                            {["MCQ", "MSQ"].includes(qType) && q.options && (
                              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mb-3 bg-slate-50 p-2 rounded border">
                                <div><strong>A.</strong> {q.options.A}</div>
                                <div><strong>B.</strong> {q.options.B}</div>
                                <div><strong>C.</strong> {q.options.C}</div>
                                <div><strong>D.</strong> {q.options.D}</div>
                              </div>
                            )}
                            <div className="text-[11px] font-bold text-slate-500">Correct Answer: <span className="text-blue-600">{q.correctAnswer}</span></div>
                            <div className="absolute right-4 bottom-4 inline-flex gap-1">
                              {q.isGraceAwarded ? (
                                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => handleToggleGraceMarks(idx, q, false)}>
                                  Revoke Grace
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-slate-500 hover:bg-slate-50" onClick={() => handleToggleGraceMarks(idx, q, true)}>
                                  Award Grace
                                </Button>
                              )}
                              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-amber-600" onClick={() => handleStartEditQuestion(idx, q)}>Edit</Button>
                              <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold text-red-650" onClick={() => handleDeleteQuestion(idx)}>Delete</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================= */}
      {/* 👁️ STUDENT SUBMISSION VIEWER MODAL */}
      {/* ======================================= */}
      <Dialog open={!!viewingStudentResult} onOpenChange={(v) => !v && setViewingStudentResult(null)}>
        <DialogContent className="max-w-4xl w-full rounded-2xl p-6 max-h-[80vh] overflow-y-auto font-sans">
          {viewingStudentResult && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3 mb-3">
                <DialogTitle className="text-base font-bold text-slate-900">
                  Candidate Submission Report
                </DialogTitle>
                <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 p-3 bg-slate-50 border border-slate-150 rounded-xl gap-3">
                  <div className="text-left flex flex-col gap-1.5">
                    <div className="text-xs font-black text-slate-800">{viewingStudentResult?.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-bold">Email: {viewingStudentResult?.studentEmail}</div>
                    {viewingStudentResult?.studentRollNumber && (
                      <div className="text-[10px] text-slate-400 font-bold">Roll No: {viewingStudentResult?.studentRollNumber}</div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[9px] gap-1 font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 mt-1 border-emerald-250 flex items-center shadow-sm w-fit"
                      onClick={() => handleManualSendEmail(selectedExamCodeForAnalysis, viewingStudentResult?.studentEmail)}
                    >
                      <Mail className="h-2.5 w-2.5" /> Email Scorecard
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-4 text-center md:justify-end flex-grow">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Score</div>
                      <div className="text-xs font-extrabold text-blue-600">
                        {viewingStudentResult?.score} / {viewingStudentResult?.totalMarks}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Tab Exits</div>
                      <div className={`text-xs font-extrabold ${viewingStudentResult?.tabSwitchCount > 0 ? "text-amber-600" : "text-slate-500"}`}>{viewingStudentResult?.tabSwitchCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Head Turns</div>
                      <div className={`text-xs font-extrabold ${viewingStudentResult?.faceWarningCount > 0 ? "text-amber-600" : "text-slate-500"}`}>{viewingStudentResult?.faceWarningCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Noise Flags</div>
                      <div className={`text-xs font-extrabold ${viewingStudentResult?.noiseWarningCount > 0 ? "text-amber-600" : "text-slate-500"}`}>{viewingStudentResult?.noiseWarningCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Fullscreen Exits</div>
                      <div className={`text-xs font-extrabold ${viewingStudentResult?.fullScreenExitCount > 0 ? "text-amber-600" : "text-slate-500"}`}>{viewingStudentResult?.fullScreenExitCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Net Dropouts</div>
                      <div className={`text-xs font-extrabold ${viewingStudentResult?.internetIssueCount > 0 ? "text-amber-600" : "text-slate-500"}`}>{viewingStudentResult?.internetIssueCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Email Status</div>
                      <div className={`text-xs font-extrabold ${viewingStudentResult?.isEmailed ? "text-emerald-650 font-black" : "text-slate-500"}`}>
                        {viewingStudentResult?.isEmailed ? "Sent" : "Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2 text-left">
                <h3 className="text-xs font-bold text-slate-600">Evaluated Response Breakdown</h3>
                {(!activeReviewExam || !activeReviewExam.questions || activeReviewExam.questions.length === 0) ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Unable to load exam questions for breakdown context.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeReviewExam.questions.map((q: any, idx: number) => {
                      const qType = q.questionType || (q.isMultipleCorrect ? "MSQ" : "MCQ");
                      const answerObj = viewingStudentResult?.answers?.find((a: any) => a.questionId === q._id);
                      const selectedVal = answerObj ? answerObj.selectedOption : "";

                      let isCorrect = false;
                      let isPartial = false;
                      let partialScore = 0;
                      
                      const cleanStudentVal = (selectedVal || "").trim();
                      const cleanCorrectVal = (q.correctAnswer || "").trim();

                      if (cleanStudentVal) {
                        if (qType === "MCQ") {
                          const selected = cleanStudentVal.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);
                          const correct = cleanCorrectVal.split(",").map((c: string) => c.trim().toUpperCase()).filter(Boolean);
                          isCorrect = selected.length === 1 && selected[0] === correct[0];
                        } else if (qType === "MSQ") {
                          const selected = cleanStudentVal.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);
                          const correct = cleanCorrectVal.split(",").map((c: string) => c.trim().toUpperCase()).filter(Boolean);
                          const hasIncorrect = selected.some((opt: string) => !correct.includes(opt));
                          if (!hasIncorrect) {
                            if (selected.length === correct.length) {
                              isCorrect = true;
                            } else if (selected.length > 0) {
                              isPartial = true;
                              const fraction = selected.length / correct.length;
                              partialScore = Number(((q.marks || 1) * fraction).toFixed(2));
                            }
                          }
                        } else if (qType === "FIB") {
                          const alts = cleanCorrectVal.split(/[|/,]/).map((a: string) => a.toLowerCase().trim().replace(/\s+/g, " ")).filter(Boolean);
                          const fullNorm = cleanCorrectVal.toLowerCase().trim().replace(/\s+/g, " ");
                          if (!alts.includes(fullNorm)) alts.push(fullNorm);
                          const studNorm = cleanStudentVal.toLowerCase().trim().replace(/\s+/g, " ");
                          isCorrect = alts.some((a: string) => studNorm === a);
                        } else if (qType === "NUM") {
                          const studNorm = cleanStudentVal.replace(/\s+/g, "");
                          const corrNorm = cleanCorrectVal.replace(/\s+/g, "");
                          const sFloat = parseFloat(studNorm);
                          const cFloat = parseFloat(corrNorm);
                          if (!isNaN(sFloat) && !isNaN(cFloat)) {
                            isCorrect = sFloat === cFloat;
                          } else {
                            isCorrect = studNorm === corrNorm;
                          }
                        } else if (qType === "DES") {
                          const studNorm = cleanStudentVal.toLowerCase().trim().replace(/\s+/g, " ");
                          const corrNorm = cleanCorrectVal.toLowerCase().trim().replace(/\s+/g, " ");
                          isCorrect = studNorm === corrNorm || studNorm.includes(corrNorm);
                        }
                      }

                      let statusBadge = (
                        <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold uppercase rounded py-0.5 px-1.5">
                          Unanswered
                        </Badge>
                      );
                      let scoreBadge = `0 / ${q.marks || 1}`;

                      if (cleanStudentVal) {
                        if (isCorrect) {
                          statusBadge = (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5">
                              Correct
                            </Badge>
                          );
                          scoreBadge = `${q.marks || 1} / ${q.marks || 1}`;
                        } else if (isPartial) {
                          statusBadge = (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5">
                              Partial
                            </Badge>
                          );
                          scoreBadge = `${partialScore} / ${q.marks || 1}`;
                        } else {
                          statusBadge = (
                            <Badge className="bg-red-50 text-red-700 border border-red-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5">
                              Incorrect
                            </Badge>
                          );
                          scoreBadge = `-${q.negativeMarks || 0} / ${q.marks || 1}`;
                        }
                      }

                      if (q.isGraceAwarded) {
                        statusBadge = (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5 animate-pulse">
                            Grace Awarded
                          </Badge>
                        );
                        scoreBadge = `${q.marks || 1} / ${q.marks || 1}`;
                      }

                      return (
                        <div key={q._id || idx} className="p-3.5 border border-slate-150 rounded-xl bg-white space-y-2 hover:border-slate-250 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">Q{idx + 1}</span>
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-extrabold px-2 py-0.5 rounded uppercase">{q.section || "General"}</span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">Type: {qType}</span>
                            <div className="ml-auto flex items-center gap-1.5">
                              {statusBadge}
                              <span className="text-[10px] text-slate-500 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded">Score: {scoreBadge}</span>
                            </div>
                          </div>
                          <div className="text-slate-800 font-semibold text-xs leading-normal">{q.question}</div>
                          
                          {/* Options highlight block for MCQ/MSQ */}
                          {["MCQ", "MSQ"].includes(qType) && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                              {Object.entries(q.options)
                                .filter(([_, val]: any) => val !== undefined && val !== null && val.toString().trim() !== "")
                                .map(([optKey, optVal]: any) => {
                                  const cleanK = optKey.trim().toUpperCase();
                                  const studentKeys = cleanStudentVal.split(",").map(s => s.trim().toUpperCase());
                                  const correctKeys = cleanCorrectVal.split(",").map(c => c.trim().toUpperCase());
                                  
                                  const isSelected = studentKeys.includes(cleanK);
                                  const isCorrect = correctKeys.includes(cleanK);

                                  let cardClass = "bg-white border-slate-200 text-slate-700";
                                  let badge = null;

                                  if (isSelected && isCorrect) {
                                    cardClass = "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-sm";
                                    badge = <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded">Selected (Correct)</span>;
                                  } else if (isSelected && !isCorrect) {
                                    cardClass = "bg-red-50 border-red-300 text-red-950 font-bold shadow-sm";
                                    badge = <span className="text-[9px] bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded">Selected (Incorrect)</span>;
                                  } else if (!isSelected && isCorrect) {
                                    cardClass = "bg-emerald-50/20 border-dashed border-emerald-400 text-emerald-800 font-semibold";
                                    badge = <span className="text-[9px] bg-emerald-600/10 text-emerald-700 border border-emerald-200 font-extrabold px-1.5 py-0.5 rounded">Correct Key</span>;
                                  }

                                  return (
                                    <div key={optKey} className={`flex items-center justify-between p-2.5 border rounded-xl transition-all ${cardClass}`}>
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-[12px]">{optKey}.</span>
                                        <span>{optVal}</span>
                                      </div>
                                      {badge}
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {/* Fallback response text boxes for FIB, NUM, DES */}
                          {!["MCQ", "MSQ"].includes(qType) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-[11px]">
                              <div className="p-2 rounded bg-slate-50">
                                <div className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Candidate Response</div>
                                <div className={`font-medium ${cleanStudentVal ? "text-slate-800" : "text-slate-400 italic"}`}>{cleanStudentVal || "(No response)"}</div>
                              </div>
                              <div className="p-2 rounded bg-blue-50/20">
                                <div className="text-[9px] uppercase font-bold text-blue-400 mb-0.5">Correct Answer Key</div>
                                <div className="font-extrabold text-blue-800">{q.correctAnswer}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================= */}
      {/* 👁️ EXAM PREVIEW MODAL */}
      {/* ======================================= */}
      <Dialog open={!!previewingExam} onOpenChange={(v) => !v && setPreviewingExam(null)}>
        <DialogContent className="max-w-4xl w-full rounded-2xl p-6 max-h-[80vh] overflow-y-auto font-sans text-left">
          {previewingExam && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3 mb-3">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  Exam Preview: {previewingExam.title} ({previewingExam.examCode})
                </DialogTitle>
                <div className="text-[11px] text-slate-400 font-semibold">
                  Preview mode shows exactly how questions will render for candidates.
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {!previewingExam.questions || previewingExam.questions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No questions imported for this exam.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {previewingExam.questions.map((q: any, idx: number) => {
                      const qType = q.questionType || (q.isMultipleCorrect ? "MSQ" : "MCQ");
                      return (
                        <div key={q._id || idx} className="p-4 border border-slate-150 rounded-xl bg-slate-50/30 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded font-mono">Q{idx + 1}</span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded uppercase">Section: {q.section || "General"}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded uppercase">{qType}</span>
                            <span className="text-[10px] text-slate-400 font-bold ml-auto">Marks: {q.marks || 1} {q.negativeMarks > 0 ? `| Neg: -${q.negativeMarks}` : ""}</span>
                          </div>

                          <div className="text-slate-900 font-bold text-sm leading-relaxed">{q.question}</div>

                          {q.codeSnippet && (
                            <pre className="bg-slate-950 text-green-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-[150px] leading-relaxed">
                              <code>{q.codeSnippet}</code>
                            </pre>
                          )}

                          {q.imageUrl && (
                            <div className="max-w-xs overflow-hidden rounded-lg border border-slate-200">
                              <img src={q.imageUrl} alt="Context Asset" className="w-full h-auto object-contain" />
                            </div>
                          )}

                          {/* OPTION RENDERING (DISABLED INPUTS) */}
                          {["MCQ", "MSQ"].includes(qType) && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
                              {Object.entries(q.options).filter(([_, val]: any) => val !== undefined && val !== null && val.toString().trim() !== "").map(([key, val]: any) => (
                                <div key={key} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                                  <input
                                    type={qType === "MCQ" ? "radio" : "checkbox"}
                                    disabled
                                    className="accent-blue-600"
                                  />
                                  <span><strong className="text-slate-800">{key}.</strong> {val}</span>
                                </div>
                              ))}`
                            </div>
                          )}

                          {qType === "FIB" && (
                            <div className="space-y-1 text-xs pt-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Fill in the blank input</label>
                              <Input disabled placeholder="Candidate types response here..." className="bg-white border-slate-200 h-9 text-xs" />
                            </div>
                          )}

                          {qType === "NUM" && (
                            <div className="space-y-1 text-xs pt-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Numerical input (decimals / integers only)</label>
                              <Input disabled type="number" placeholder="Candidate enters numerical value..." className="bg-white border-slate-200 h-9 text-xs" />
                            </div>
                          )}

                          {qType === "DES" && (
                            <div className="space-y-1 text-xs pt-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Descriptive answer area</label>
                              <textarea disabled placeholder="Candidate types descriptive answer..." className="w-full min-h-[80px] p-2 text-xs border border-slate-200 rounded-lg bg-white" />
                            </div>
                          )}

                          <div className="text-[11px] font-black text-slate-500 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 flex items-center gap-2 mt-2">
                            <span>Correct Key Answer:</span>
                            <span className="text-blue-600 font-extrabold">{q.correctAnswer}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================= */}
      {/* 📊 EXAM PERFORMANCE ANALYSIS MODAL */}
      {/* ======================================= */}
      <Dialog open={false} onOpenChange={(v) => !v && setViewingExamAnalysis(null)}>
        <DialogContent className="max-w-5xl w-full rounded-2xl p-6 max-h-[80vh] overflow-y-auto font-sans text-left">
          {viewingExamAnalysis && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3 mb-3">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Performance Analysis: {viewingExamAnalysis.title} ({viewingExamAnalysis.examCode})
                </DialogTitle>
                <div className="text-[11px] text-slate-400 font-semibold">
                  Detailed analytics including candidate scorecard, question-wise correctness, response times, and dynamic difficulty classification.
                </div>
              </DialogHeader>

              {loadingAnalysis ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                  Generating performance metrics...
                </div>
              ) : !analysisResults.length ? (
                <div className="text-center py-16 text-slate-400">
                  <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-xs font-semibold">No participants have submitted responses for this assessment yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* OVERVIEW SCORECARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 border rounded-xl text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Participants</div>
                      <div className="text-lg font-black text-slate-800">{analysisResults.length}</div>
                    </div>
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center">
                      <div className="text-[10px] uppercase font-bold text-indigo-400">Average Score</div>
                      <div className="text-lg font-black text-indigo-600">{analysisStats?.avgScore} / {analysisStats?.totalMarks}</div>
                    </div>
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
                      <div className="text-[10px] uppercase font-bold text-emerald-400">Highest Score</div>
                      <div className="text-lg font-black text-emerald-600">{analysisStats?.highestScore} / {analysisStats?.totalMarks}</div>
                    </div>
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                      <div className="text-[10px] uppercase font-bold text-amber-400">Pass Rate (&gt;=50%)</div>
                      <div className="text-lg font-black text-amber-600">
                        {((analysisResults.filter(r => (r.score || 0) >= (analysisStats?.totalMarks || 0) * 0.5).length / analysisResults.length) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* TABULAR MARKS REPORT */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Candidate Scorecard Report</h3>
                    <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white max-h-[220px] overflow-y-auto">
                      <table className="w-full text-slate-700 text-[11px] text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b text-slate-400 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10">
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2 text-center">Score</th>
                            <th className="px-4 py-2 text-center">Tab Switches</th>
                            <th className="px-4 py-2 text-center">Head Turns</th>
                            <th className="px-4 py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysisResults.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-2 font-bold text-slate-800">{r.studentName}</td>
                              <td className="px-4 py-2 font-mono text-slate-400">{r.studentEmail}</td>
                              <td className="px-4 py-2 text-center font-black text-indigo-600">{r.score} / {analysisStats?.totalMarks}</td>
                              <td className={`px-4 py-2 text-center font-mono font-bold ${r.tabSwitchCount > 2 ? "text-red-500 font-black" : "text-slate-500"}`}>{r.tabSwitchCount || 0}</td>
                              <td className={`px-4 py-2 text-center font-mono font-bold ${r.faceWarningCount > 4 ? "text-red-500 font-black" : "text-slate-500"}`}>{r.faceWarningCount || 0}</td>
                              <td className="px-4 py-2 text-right">
                                {r.terminated ? (
                                  <Badge className="bg-red-50 text-red-700 border border-red-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5">Terminated</Badge>
                                ) : (
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-bold uppercase rounded py-0.5 px-1.5">Completed</Badge>
                                )}
                              </td>
                            </tr>
                          ))}`
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* QUESTION-WISE ANALYSIS AND DIFFICULTY */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Question-Wise Performance Breakdown</h3>
                    <div className="grid grid-cols-1 gap-3.5">
                      {analysisStats?.questionStats.map((qs, i) => (
                        <div key={qs._id || i} className="p-3.5 border border-slate-150 rounded-xl bg-white space-y-2 hover:border-indigo-200 hover:shadow-sm transition-all">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded font-mono">Q{i + 1}</span>
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-extrabold px-2 py-0.5 rounded uppercase">{qs.section}</span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono uppercase">{qs.questionType}</span>
                            
                            <Badge className={`${qs.difficultyColor} border text-[9px] font-extrabold uppercase rounded-full py-0.5 px-2 ml-1`}>
                              {qs.difficulty}
                            </Badge>

                            <div className="ml-auto inline-flex items-center gap-3 text-[10px] font-bold text-slate-400">
                              <span>Marks: {qs.marks}</span>
                              <span className="text-slate-500">Avg Time: <strong className="text-slate-700 font-extrabold">{qs.avgTimeSpent}s</strong></span>
                            </div>
                          </div>

                          <div className="text-slate-800 font-bold text-xs leading-normal">{qs.question}</div>

                          {/* QUESTION PERFORMANCE BAR / BREAKDOWN */}
                          <div className="pt-2 text-[10px]">
                            <div className="flex justify-between font-bold text-slate-500 mb-1">
                              <span>Attempts: {qs.totalAttempts}</span>
                              <span>Correctness Rate: <strong className="text-indigo-600 font-black">{qs.correctnessRate}%</strong></span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                              <div className="bg-emerald-500 h-full" style={{ width: `${qs.totalAttempts > 0 ? (qs.correctAttempts / qs.totalAttempts) * 100 : 0}%` }} title="Correct" />
                              <div className="bg-red-400 h-full" style={{ width: `${qs.totalAttempts > 0 ? (qs.incorrectAttempts / qs.totalAttempts) * 100 : 0}%` }} title="Incorrect" />
                            </div>
                            <div className="flex gap-4 mt-1 font-bold text-slate-400">
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Correct: {qs.correctAttempts}</span>
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> Incorrect: {qs.incorrectAttempts}</span>
                            </div>
                          </div>

                          {/* DETAILED STUDENT RESPONSE TIMINGS */}
                          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px]">
                            <div className="text-slate-500 font-extrabold mb-1">Candidate Time Spent List:</div>
                            <div className="flex flex-wrap gap-1.5 max-h-[50px] overflow-y-auto">
                              {analysisResults.map((r, ri) => {
                                const ans = r.answers?.find((a: any) => a.questionId === qs._id);
                                const time = ans ? ans.timeSpent || 0 : 0;
                                return (
                                  <span key={ri} className="bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-slate-600 font-mono text-[9px]" title={`${r.studentName} (${r.studentEmail})`}>
                                    {r.studentName.split(" ")[0]}: {time}s
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
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
    </>
  );
};

export default AdminDashboard;

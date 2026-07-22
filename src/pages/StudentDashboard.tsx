import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Laptop,
  Wifi,
  Video,
  CheckCircle2,
  FileText,
  Play,
  BarChart3,
  Clock,
  Award,
  HelpCircle,
  Eye,
  RotateCcw,
  Check,
  X,
  Download,
  Target,
  Lightbulb,
  UserCog,
  Mail,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  Save
} from "lucide-react";

import BASE_URL from "@/config/api";
import Loader from "@/components/Loader";
import Swal from "sweetalert2";

const StudentDashboard = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"reports" | "practice" | "join" | "profile">("reports");
  const [examCode, setExamCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("");

  // Stagger queue delay utility (email-hash based, 0–30s)
  const getStaggerDelay = (emailStr: string) => {
    let hash = 0;
    for (let i = 0; i < emailStr.length; i++) {
      hash = emailStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 30;
  };

  // Student reports state
  const [reportsLoading, setReportsLoading] = useState(false);
  const [studentReports, setStudentReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const [practiceFilter, setPracticeFilter] = useState<"all" | "incorrect" | "unanswered">("all");
  const [practiceSectionFilter, setPracticeSectionFilter] = useState<string>("all");
  const [practiceExamFilter, setPracticeExamFilter] = useState<string>("all");
  const [practiceUserAnswers, setPracticeUserAnswers] = useState<{ [qId: string]: string }>({});
  const [practiceCheckedState, setPracticeCheckedState] = useState<{ [qId: string]: boolean }>({});
  const [filterLoading, setFilterLoading] = useState(false);

  const triggerFilterLoader = (action: () => void) => {
    setFilterLoading(true);
    action();
    setTimeout(() => {
      setFilterLoading(false);
    }, 200);
  };

  // ===== PROFILE EDITING STATE =====
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileRollNumber, setProfileRollNumber] = useState(user?.rollNumber || "");
  const [profileOtp, setProfileOtp] = useState("");
  const [profileOtpSent, setProfileOtpSent] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileOtpCount, setProfileOtpCount] = useState(0);
  const [profileRemainingAttempts, setProfileRemainingAttempts] = useState(5);

  // Sync profile fields when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileRollNumber(user.rollNumber || "");
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    setProfileError("");
    setProfileSuccess("");

    if (!profileName.trim() || !profileRollNumber.trim()) {
      setProfileError("Full Name and Roll Number cannot be empty.");
      return;
    }

    setProfileLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, name: profileName.trim(), rollNumber: profileRollNumber.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        // Update local session
        const updatedUser = { ...user, name: data.user.name, rollNumber: data.user.rollNumber };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser as any);

        setProfileSuccess("Candidate profile updated successfully!");
        Swal.fire({
          title: "Profile Updated",
          text: "Your candidate credentials have been saved.",
          icon: "success",
          confirmButtonColor: "#3b82f6"
        });
      } else {
        setProfileError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setProfileError("Network error. Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  // 12-Hour Session Expiry Calculation
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<string>("");

  // 🔐 Protect Route & Validate 12-Hour Session Limit
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!user && !storedUser) {
      navigate("/");
      return;
    }

    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    if (user?.loginTimestamp) {
      const elapsed = Date.now() - user.loginTimestamp;
      if (elapsed >= TWELVE_HOURS_MS) {
        logout();
        navigate("/");
        return;
      }

    
      // Update countdown display every minute
      const updateTimer = () => {
        const remainingMs = TWELVE_HOURS_MS - (Date.now() - user.loginTimestamp!);
        if (remainingMs <= 0) {
          logout();
          navigate("/");
        } else {
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setSessionTimeRemaining(`${hours}h ${minutes}m`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [user, navigate, logout]);

  // Fetch Student Reports by Email (Primary Key)
  const fetchStudentReports = async () => {
    if (!user?.email) return;
    setReportsLoading(true);
    setLoading(true);
    try {
      // Stagger queue to prevent 500 simultaneous report fetch queries
      const cleanEmail = user.email.toLowerCase().trim();
      const delaySeconds = getStaggerDelay(cleanEmail);
      if (delaySeconds > 0) {
        for (let s = delaySeconds; s > 0; s--) {
          setLoaderMessage(`Loading your dashboard (${s}s remaining)...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      setLoaderMessage("");

      const res = await fetch(`${BASE_URL}/exam/student-reports/${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (res.ok && data.reports) {
        setStudentReports(data.reports);
      }
    } catch (err) {
      console.error("Failed to fetch student reports:", err);
    } finally {
      setReportsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentReports();
  }, [user]);

  // Sort reports latest first
  const sortedStudentReports = useMemo(() => {
    return [...studentReports].sort((a, b) => {
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [studentReports]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleJoinExam = async () => {
    const trimmedCode = examCode.trim().toUpperCase();

    if (!trimmedCode) {
      setError("Please enter exam code");
      return;
    }

    const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (!parsedUser?.email) {
      setError("User session expired. Please login again.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Stagger queue to prevent 500 simultaneous exam code lookups
      const cleanEmail = (parsedUser.email || "").toLowerCase().trim();
      const delaySeconds = getStaggerDelay(cleanEmail);
      if (delaySeconds > 0) {
        for (let s = delaySeconds; s > 0; s--) {
          setLoaderMessage(`Queued to prevent server overload (${s}s remaining)...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      setLoaderMessage("");

      const res = await fetch(
        `${BASE_URL}/exam/${trimmedCode}?email=${encodeURIComponent(parsedUser.email)}`
      );

      const data = await res.json();

      if (res.status === 403) {
        setError(data.message);
        return;
      }

      if (!res.ok) {
        setError(data.message || "Invalid exam code");
        return;
      }

      localStorage.setItem("currentExamCode", trimmedCode);
      navigate(`/exam/${trimmedCode}`);
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive Excel Export Handler
  const handleExportStudentReportExcel = (report: any) => {
    if (!report || !report.questionAnalysis) return;

    const escapeXml = (unsafe: any) => {
      if (unsafe === null || unsafe === undefined) return "";
      return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const formatChoiceWithText = (q: any, valString: string) => {
      if (!valString || valString === "No Response") return "No Response";
      if (!q.options || Object.keys(q.options).length === 0) return valString;
      const keys = valString.split(",").map(k => k.trim());
      const formatted = keys.map(k => {
        const text = q.options[k];
        return text ? `${k}. ${text}` : k;
      });
      return formatted.join(" | ");
    };

    const formatAllOptionsText = (q: any) => {
      if (!q.options || Object.keys(q.options).length === 0) return "N/A (Input Based)";
      const entries = Object.entries(q.options).filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== "");
      if (entries.length === 0) return "N/A (Input Based)";
      return entries.map(([k, v]) => `${k}. ${v}`).join(" | ");
    };

    // Calculate Section Stats for Excel
    const sectionStatsMap: { [sec: string]: { total: number; correct: number; incorrect: number; unanswered: number; marks: number } } = {};
    report.questionAnalysis.forEach((q: any) => {
      const sec = q.section || "General";
      if (!sectionStatsMap[sec]) {
        sectionStatsMap[sec] = { total: 0, correct: 0, incorrect: 0, unanswered: 0, marks: 0 };
      }
      sectionStatsMap[sec].total += 1;
      if (q.isCorrect) {
        sectionStatsMap[sec].correct += 1;
        sectionStatsMap[sec].marks += q.marks || 1;
      } else if (q.studentAnswer) {
        sectionStatsMap[sec].incorrect += 1;
      } else {
        sectionStatsMap[sec].unanswered += 1;
      }
    });

    const totalQs = report.questionAnalysis.length;
    const correctQs = report.questionAnalysis.filter((q: any) => q.isCorrect).length;
    const incorrectQs = report.questionAnalysis.filter((q: any) => !q.isCorrect && q.studentAnswer).length;
    const unansweredQs = report.questionAnalysis.filter((q: any) => !q.studentAnswer).length;
    const overallPct = report.totalMarks > 0 ? ((report.score / report.totalMarks) * 100).toFixed(1) : "0.0";

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E1B4B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubHeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#1E1B4B"/>
   <Interior ss:Color="#E0E7FF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Calibri" ss:Size="15" ss:Bold="1" ss:Color="#4338CA"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CorrectStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#15803D"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="IncorrectStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataStyle">
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="BoldDataStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Comprehensive Analysis">
  <Table>
   <Column ss:Width="50"/>
   <Column ss:Width="130"/>
   <Column ss:Width="100"/>
   <Column ss:Width="260"/>
   <Column ss:Width="260"/>
   <Column ss:Width="220"/>
   <Column ss:Width="220"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="220"/>

   <!-- SECTION 1: CANDIDATE & EXAM METRICS OVERVIEW -->
   <Row ss:Height="28">
    <Cell ss:MergeAcross="10" ss:StyleID="TitleStyle"><Data ss:Type="String">SECUREEXAM PRO — DETAILED EXAMINATION PERFORMANCE &amp; ANALYSIS REPORT</Data></Cell>
   </Row>

   <Row ss:Height="22" ss:StyleID="SubHeaderStyle">
    <Cell ss:MergeAcross="10"><Data ss:Type="String">1. CANDIDATE &amp; EXAMINATION SUMMARY</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">Candidate Name:</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(user?.name)}</Data></Cell>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">Candidate Email:</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(user?.email)}</Data></Cell>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">Exam Submitted At:</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${report.submittedAt ? new Date(report.submittedAt).toLocaleString() : "N/A"}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">Exam Title:</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(report.examTitle)}</Data></Cell>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">Exam Code:</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(report.examCode)}</Data></Cell>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">Assessment Type:</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${report.assessmentType === "coding_hybrid" ? "Coding Hybrid Set-Wise" : "Standard Online"}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">Total Score:</Data></Cell>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">${report.score} / ${report.totalMarks} Marks (${overallPct}%)</Data></Cell>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">Total Questions:</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${totalQs} (Correct: ${correctQs}, Incorrect: ${incorrectQs}, Unanswered: ${unansweredQs})</Data></Cell>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">Security Logs:</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">Tab Exits: ${report.tabSwitchCount || 0} | Head Turns: ${report.faceWarningCount || 0}</Data></Cell>
   </Row>
   <Row/>

   <!-- SECTION 2: TOPIC & SECTION-WISE ANALYSIS TABLE -->
   <Row ss:Height="22" ss:StyleID="SubHeaderStyle">
    <Cell ss:MergeAcross="10"><Data ss:Type="String">2. TOPIC &amp; SECTION-WISE MASTERY ANALYSIS</Data></Cell>
   </Row>
   <Row ss:Height="24" ss:StyleID="HeaderStyle">
    <Cell><Data ss:Type="String">#</Data></Cell>
    <Cell><Data ss:Type="String">Section / Topic Name</Data></Cell>
    <Cell><Data ss:Type="String">Total Questions</Data></Cell>
    <Cell><Data ss:Type="String">Correct Qs</Data></Cell>
    <Cell><Data ss:Type="String">Incorrect Qs</Data></Cell>
    <Cell><Data ss:Type="String">Unanswered Qs</Data></Cell>
    <Cell><Data ss:Type="String">Accuracy %</Data></Cell>
    <Cell><Data ss:Type="String">Marks Scored</Data></Cell>
    <Cell ss:MergeAcross="2"><Data ss:Type="String">Section Mastery Status</Data></Cell>
   </Row>`;

    Object.entries(sectionStatsMap).forEach(([secName, st], sIdx) => {
      const acc = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
      const statusText = acc >= 75 ? "Mastered (Strong)" : acc >= 50 ? "Average Performance" : "Needs Improvement";

      xml += `
   <Row>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="Number">${sIdx + 1}</Data></Cell>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">${escapeXml(secName)}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="Number">${st.total}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="Number">${st.correct}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="Number">${st.incorrect}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="Number">${st.unanswered}</Data></Cell>
    <Cell ss:StyleID="BoldDataStyle"><Data ss:Type="String">${acc}%</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="Number">${st.marks}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="DataStyle"><Data ss:Type="String">${statusText}</Data></Cell>
   </Row>`;
    });

    xml += `
   <Row/>

   <!-- SECTION 3: QUESTION-BY-QUESTION DETAILED ANALYSIS SHEET -->
   <Row ss:Height="22" ss:StyleID="SubHeaderStyle">
    <Cell ss:MergeAcross="10"><Data ss:Type="String">3. QUESTION-BY-QUESTION DETAILED EVALUATION &amp; FULL ANSWER KEY</Data></Cell>
   </Row>
   <Row ss:Height="24" ss:StyleID="HeaderStyle">
    <Cell><Data ss:Type="String">Q.No</Data></Cell>
    <Cell><Data ss:Type="String">Section / Topic</Data></Cell>
    <Cell><Data ss:Type="String">Question Type</Data></Cell>
    <Cell><Data ss:Type="String">Question Statement</Data></Cell>
    <Cell><Data ss:Type="String">Available Options (Full Text)</Data></Cell>
    <Cell><Data ss:Type="String">Candidate Selected Choice (Full Text)</Data></Cell>
    <Cell><Data ss:Type="String">Official Correct Answer (Full Text)</Data></Cell>
    <Cell><Data ss:Type="String">Result Status</Data></Cell>
    <Cell><Data ss:Type="String">Marks</Data></Cell>
    <Cell><Data ss:Type="String">Time (sec)</Data></Cell>
    <Cell><Data ss:Type="String">Solution Explanation / Rationale</Data></Cell>
   </Row>`;

    report.questionAnalysis.forEach((q: any, idx: number) => {
      const statusText = q.isCorrect ? "CORRECT" : q.isPartial ? "PARTIAL" : q.studentAnswer ? "INCORRECT" : "UNANSWERED";
      const styleId = q.isCorrect ? "CorrectStyle" : q.studentAnswer ? "IncorrectStyle" : "DataStyle";
      const candidateChoiceText = formatChoiceWithText(q, q.studentAnswer);
      const correctChoiceText = formatChoiceWithText(q, q.correctAnswer);
      const fullOptionsText = formatAllOptionsText(q);

      xml += `
   <Row>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(q.section || "General")}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(q.questionType)}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(q.questionText)}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(fullOptionsText)}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(candidateChoiceText)}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(correctChoiceText)}</Data></Cell>
    <Cell ss:StyleID="${styleId}"><Data ss:Type="String">${statusText}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="Number">${q.isCorrect ? q.marks : 0}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="Number">${q.timeSpent || 0}</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">${escapeXml(q.explanation || "Verified Standard Key")}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Full_Analysis_${report.examCode}_${user?.email}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Performance calculations
  const totalAttempted = sortedStudentReports.length;
  const totalScoreScored = sortedStudentReports.reduce((acc, r) => acc + (r.score || 0), 0);
  const totalMarksMax = sortedStudentReports.reduce((acc, r) => acc + (r.totalMarks || 100), 0);
  const overallPercentage = totalMarksMax > 0 ? ((totalScoreScored / totalMarksMax) * 100).toFixed(1) : "0.0";

  // Practice Arena questions collection strictly from previous attended papers by student
  const allPracticeQuestions = useMemo(() => {
    const questionsList: any[] = [];
    sortedStudentReports.forEach((rep) => {
      if (rep.questionAnalysis && Array.isArray(rep.questionAnalysis)) {
        rep.questionAnalysis.forEach((q: any) => {
          questionsList.push({
            ...q,
            examTitle: rep.examTitle,
            examCode: rep.examCode
          });
        });
      }
    });
    return questionsList;
  }, [sortedStudentReports]);

  const practiceSections = useMemo(() => {
    const set = new Set<string>();
    allPracticeQuestions.forEach((q) => {
      if (practiceExamFilter === "all" || q.examCode === practiceExamFilter) {
        set.add(q.section || "General");
      }
    });
    return Array.from(set);
  }, [allPracticeQuestions, practiceExamFilter]);

  const practiceExamOptions = useMemo(() => {
    const map = new Map<string, string>();
    allPracticeQuestions.forEach((q) => {
      if (q.examCode) {
        map.set(q.examCode, q.examTitle || q.examCode);
      }
    });
    return Array.from(map.entries()).map(([code, title]) => ({ code, title }));
  }, [allPracticeQuestions]);

  // Questions matching current Exam and Section filters (used for dynamic Status counts)
  const examAndSectionScopedQuestions = useMemo(() => {
    return allPracticeQuestions.filter((q) => {
      if (practiceExamFilter !== "all" && q.examCode !== practiceExamFilter) return false;
      if (practiceSectionFilter !== "all" && (q.section || "General") !== practiceSectionFilter) return false;
      return true;
    });
  }, [allPracticeQuestions, practiceExamFilter, practiceSectionFilter]);

  // Dynamic counts for Status Filter buttons based on selected Exam & Section
  const statusCounts = useMemo(() => {
    let allCount = examAndSectionScopedQuestions.length;
    let incorrectCount = 0;
    let unansweredCount = 0;

    examAndSectionScopedQuestions.forEach((q) => {
      if (!q.isCorrect && q.studentAnswer) {
        incorrectCount += 1;
      }
      if (!q.studentAnswer) {
        unansweredCount += 1;
      }
    });

    return { all: allCount, incorrect: incorrectCount, unanswered: unansweredCount };
  }, [examAndSectionScopedQuestions]);

  const filteredPracticeQuestions = useMemo(() => {
    return examAndSectionScopedQuestions.filter((q) => {
      if (practiceFilter === "incorrect" && (q.isCorrect || !q.studentAnswer)) return false;
      if (practiceFilter === "unanswered" && q.studentAnswer) return false;
      return true;
    });
  }, [examAndSectionScopedQuestions, practiceFilter]);

  // Section-wise statistics for selected report
  const selectedReportSectionStats = useMemo(() => {
    if (!selectedReport || !selectedReport.questionAnalysis) return [];
    const map: { [section: string]: { total: number; correct: number; totalMarks: number; scoredMarks: number } } = {};

    selectedReport.questionAnalysis.forEach((q: any) => {
      const sec = q.section || "General";
      if (!map[sec]) map[sec] = { total: 0, correct: 0, totalMarks: 0, scoredMarks: 0 };
      map[sec].total += 1;
      map[sec].totalMarks += q.marks || 1;
      if (q.isCorrect) {
        map[sec].correct += 1;
        map[sec].scoredMarks += q.marks || 1;
      }
    });

    return Object.entries(map).map(([section, data]) => ({
      section,
      ...data,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
    }));
  }, [selectedReport]);

  return (
    <>
      {loading && <Loader message={loaderMessage} />}
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
        {/* ================= HEADER ================= */}
        <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SecureExam Pro Logo" className="h-9 w-9 object-contain" />
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-slate-900 text-base leading-none tracking-tight">
                  SecureExam Pro
                </span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                  Student Portal &amp; Skill Practice Desk
                </span>
              </div>
              <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold py-0.5 px-2 rounded-lg ml-2 hidden sm:inline-flex">
                OTP Authenticated Session
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              {sessionTimeRemaining && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600" title="12-Hour Session Expiry">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  <span>Session: {sessionTimeRemaining}</span>
                </div>
              )}

              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800">{user?.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{user?.email}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-red-600 hover:bg-slate-100 text-xs font-semibold gap-1.5 rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </Button>
            </div>
          </div>
        </header>

        {/* ================= BODY ================= */}
        <div className="container mx-auto px-6 py-8 flex-grow space-y-6">
          {/* TAB SELECTION BAR */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => setActiveTab("reports")}
                className={`h-9 px-4 text-xs font-bold rounded-xl gap-2 transition-all ${
                  activeTab === "reports"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <BarChart3 className="h-4 w-4" /> My Exam Reports &amp; Analytics
              </Button>
              <Button
                onClick={() => setActiveTab("practice")}
                className={`h-9 px-4 text-xs font-bold rounded-xl gap-2 transition-all ${
                  activeTab === "practice"
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Target className="h-4 w-4" /> Skill Practice Arena
                {allPracticeQuestions.length > 0 && (
                  <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-[10px] font-black py-0 px-1.5 rounded-full ml-1">
                    {allPracticeQuestions.length} Questions
                  </Badge>
                )}
              </Button>
              <Button
                onClick={() => setActiveTab("join")}
                className={`h-9 px-4 text-xs font-bold rounded-xl gap-2 transition-all ${
                  activeTab === "join"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Play className="h-4 w-4" /> Join Assessment Drive
              </Button>
              <Button
                onClick={() => setActiveTab("profile")}
                className={`h-9 px-4 text-xs font-bold rounded-xl gap-2 transition-all ${
                  activeTab === "profile"
                    ? "bg-slate-800 hover:bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <UserCog className="h-4 w-4" /> My Profile
              </Button>
            </div>

            {activeTab === "reports" && (
              <Button
                size="sm"
                variant="outline"
                onClick={fetchStudentReports}
                className="h-8 text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5 text-blue-600" /> Refresh Reports
              </Button>
            )}
          </div>

          {activeTab === "reports" ? (
            <div className="space-y-6 text-left">
              {/* OVERVIEW STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Exams Completed</span>
                    <h3 className="text-2xl font-black text-slate-900">{totalAttempted}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Overall Percentage</span>
                    <h3 className="text-2xl font-black text-emerald-600">{overallPercentage}%</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Paper Questions</span>
                    <h3 className="text-2xl font-black text-purple-600">{allPracticeQuestions.length}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Target className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* HISTORICAL EXAM REPORTS MATRIX — LATEST AT FIRST */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Historical Assessment Performance Reports (Latest First)</h3>
                  <p className="text-[11px] text-slate-400 font-medium">All completed examination scorecards and question-by-question answer keys associated with your student email.</p>
                </div>

                {reportsLoading ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                    Fetching exam performance reports...
                  </div>
                ) : sortedStudentReports.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-semibold space-y-3">
                    <HelpCircle className="mx-auto h-8 w-8 text-slate-300" />
                    <p>No assessment reports found for <span className="font-mono text-slate-700">{user?.email}</span>.</p>
                    <Button onClick={() => setActiveTab("join")} size="sm" className="bg-blue-600 text-white font-bold text-xs">
                      Join an Assessment Drive
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                    <table className="w-full text-slate-700 text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                          <th className="px-6 py-4">Assessment Title</th>
                          <th className="px-6 py-4">Exam Code</th>
                          <th className="px-6 py-4 text-center">Type</th>
                          <th className="px-6 py-4 text-center">Score Breakdown</th>
                          <th className="px-6 py-4 text-center">Submitted At</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedStudentReports.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{r.examTitle}</td>
                            <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{r.examCode}</td>
                            
                            <td className="px-6 py-4 text-center">
                              {r.assessmentType === "coding_hybrid" ? (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-extrabold uppercase py-0.5 px-2">
                                  Coding Hybrid
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold uppercase py-0.5 px-2">
                                  Standard Online
                                </Badge>
                              )}
                            </td>

                            <td className="px-6 py-4 text-center">
                              {r.assessmentType === "coding_hybrid" ? (
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <div className="flex items-center gap-1.5 text-[10px]">
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
                              ) : (
                                <span className="font-extrabold text-slate-900 text-xs">
                                  {r.score} / {r.totalMarks} Marks
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-slate-500 text-center font-mono text-[11px]">
                              {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "N/A"}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedReport(r)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-8 px-3 rounded-lg shadow-sm gap-1.5"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View Analysis
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExportStudentReportExcel(r)}
                                  className="h-8 px-2.5 text-xs font-bold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg gap-1 shadow-sm"
                                  title="Download Excel Scorecard"
                                >
                                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Excel
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
            </div>
          ) : activeTab === "practice" ? (
            /* SKILL PRACTICE ARENA TAB */
            <div className="space-y-6 text-left">
              <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white space-y-3 shadow-md border border-purple-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-purple-400" />
                    <h2 className="text-lg font-black">Skill Development &amp; Practice Arena</h2>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold px-3 py-1">
                    Previous Exam Paper Questions Mode
                  </Badge>
                </div>
                <p className="text-xs text-purple-200 max-w-2xl leading-relaxed">
                  Practice questions strictly sourced from your previously attended examination papers. Test your choices across MCQ, MSQ, NUM, and FIB types and click <strong>Show Answer</strong> to view correct solutions.
                </p>
              </div>

              {/* FILTERS BAR IN SINGLE ROW */}
              <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Status Filter:</span>
                  <button
                    onClick={() => triggerFilterLoader(() => setPracticeFilter("all"))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      practiceFilter === "all" ? "bg-purple-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Attended Paper Questions ({statusCounts.all})
                  </button>
                  <button
                    onClick={() => triggerFilterLoader(() => setPracticeFilter("incorrect"))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      practiceFilter === "incorrect" ? "bg-red-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Incorrect Only ({statusCounts.incorrect})
                  </button>
                  <button
                    onClick={() => triggerFilterLoader(() => setPracticeFilter("unanswered"))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      practiceFilter === "unanswered" ? "bg-amber-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Unanswered Only ({statusCounts.unanswered})
                  </button>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {practiceExamOptions.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exam:</span>
                      <select
                        value={practiceExamFilter}
                        onChange={(e) => triggerFilterLoader(() => setPracticeExamFilter(e.target.value))}
                        className="h-8 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 px-2 text-slate-700 focus:outline-none max-w-[190px]"
                      >
                        <option value="all">All Attended Exams ({practiceExamOptions.length})</option>
                        {practiceExamOptions.map((ex) => (
                          <option key={ex.code} value={ex.code}>{ex.title} ({ex.code})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {practiceSections.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section:</span>
                      <select
                        value={practiceSectionFilter}
                        onChange={(e) => triggerFilterLoader(() => setPracticeSectionFilter(e.target.value))}
                        className="h-8 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 px-2 text-slate-700 focus:outline-none max-w-[160px]"
                      >
                        <option value="all">All Sections ({practiceSections.length})</option>
                        {practiceSections.map((sec) => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* QUESTIONS PRACTICE LIST */}
              <div className="space-y-4">
                {reportsLoading || filterLoading ? (
                  <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center space-y-3 shadow-sm">
                    <span className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin inline-block" />
                    <p className="text-xs font-bold text-slate-600">Sourcing &amp; Filtering Assessment Questions...</p>
                  </div>
                ) : filteredPracticeQuestions.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-800">No Attended Paper Questions Available!</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Complete an assessment drive first to populate your practice paper session.
                    </p>
                  </div>
                ) : (
                  filteredPracticeQuestions.map((q, pIdx) => {
                    const qKey = `${q.questionId || pIdx}`;
                    const selectedOpt = practiceUserAnswers[qKey] || "";
                    const isAnswerShown = practiceCheckedState[qKey] || false;
                    const qType = (q.questionType || "MCQ").toUpperCase();
                    const hasValidOptions = q.options && Object.values(q.options).some(val => val !== undefined && val !== null && String(val).trim() !== "");

                    return (
                      <div key={pIdx} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm text-left">
                        <div className="flex items-center justify-between border-b pb-3 gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-lg text-xs font-black">
                              Practice Question #{pIdx + 1}
                            </span>
                            <Badge className="bg-slate-100 text-slate-600 text-[10px] py-0 px-2 uppercase font-mono font-bold">
                              {q.section || "General"}
                            </Badge>
                            {/* DISTINCT QUESTION TYPE BADGE */}
                            <Badge className={`text-[10px] py-0 px-2 uppercase font-extrabold ${
                              qType === "MSQ" ? "bg-amber-100 text-amber-800 border-amber-300" :
                              qType === "FIB" ? "bg-blue-100 text-blue-800 border-blue-300" :
                              qType === "NUM" ? "bg-teal-100 text-teal-800 border-teal-300" :
                              qType === "DES" ? "bg-purple-100 text-purple-800 border-purple-300" :
                              qType === "CODING" ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                              "bg-slate-100 text-slate-800 border-slate-300"
                            }`}>
                              {qType === "MSQ" ? "MSQ (Multiple Select)" :
                               qType === "FIB" ? "FIB (Fill in Blank)" :
                               qType === "NUM" ? "NUM (Numerical)" :
                               qType === "DES" ? "DES (Descriptive Essay)" :
                               qType === "CODING" ? "CODING (Hands-on Code)" :
                               "MCQ (Single Choice)"}
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-mono">Paper: {q.examTitle}</span>
                          </div>
                        </div>

                        <div className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                          {q.questionText}
                        </div>

                        {q.codeSnippet && qType !== "CODING" && (
                          <div className="p-3 bg-slate-950 text-green-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                            <pre>{q.codeSnippet}</pre>
                          </div>
                        )}

                        {/* DISTINCT INTERACTIVE RENDERING BASED ON QUESTION TYPE */}
                        {qType === "MCQ" && hasValidOptions ? (
                          /* MCQ: SINGLE CHOICE BUTTONS */
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {Object.entries(q.options).map(([optKey, optVal]: [string, any]) => {
                              if (!optVal || String(optVal).trim() === "") return null;
                              const isChosen = selectedOpt === optKey;
                              const isCorrectOpt = isAnswerShown && q.correctAnswer && q.correctAnswer.split(",").map((s: string) => s.trim()).includes(optKey);

                              return (
                                <button
                                  key={optKey}
                                  type="button"
                                  onClick={() => setPracticeUserAnswers({ ...practiceUserAnswers, [qKey]: optKey })}
                                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${
                                    isCorrectOpt
                                      ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-bold"
                                      : isChosen
                                      ? "bg-purple-600 text-white border-purple-600 shadow-md"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <span><strong className="mr-1">({optKey}).</strong> {optVal}</span>
                                  {isChosen && <Check className="h-4 w-4 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : qType === "MSQ" && hasValidOptions ? (
                          /* MSQ: MULTIPLE SELECT CHECKBOX BUTTONS */
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Select all options that apply:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(q.options).map(([optKey, optVal]: [string, any]) => {
                                if (!optVal || String(optVal).trim() === "") return null;
                                const selectedList = selectedOpt ? selectedOpt.split(",").map((s) => s.trim()) : [];
                                const isChecked = selectedList.includes(optKey);
                                const isCorrectOpt = isAnswerShown && q.correctAnswer && q.correctAnswer.split(",").map((s: string) => s.trim()).includes(optKey);

                                return (
                                  <button
                                    key={optKey}
                                    type="button"
                                    onClick={() => {
                                      let updatedArr: string[];
                                      if (isChecked) {
                                        updatedArr = selectedList.filter((x) => x !== optKey);
                                      } else {
                                        updatedArr = [...selectedList, optKey];
                                      }
                                      setPracticeUserAnswers({ ...practiceUserAnswers, [qKey]: updatedArr.join(",") });
                                    }}
                                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${
                                      isCorrectOpt
                                        ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-bold"
                                        : isChecked
                                        ? "bg-amber-600 text-white border-amber-600 shadow-md"
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    <span><strong className="mr-1">[ {isChecked ? "✓" : " "} ] ({optKey}).</strong> {optVal}</span>
                                    {isChecked && <Check className="h-4 w-4 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : qType === "NUM" ? (
                          /* NUM: NUMERICAL VALUE INPUT */
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Numerical Response:</span>
                            <Input
                              type="number"
                              placeholder="Enter numerical value..."
                              value={selectedOpt}
                              onChange={(e) => setPracticeUserAnswers({ ...practiceUserAnswers, [qKey]: e.target.value })}
                              className="h-10 text-xs font-mono bg-slate-50 border-slate-200 max-w-xs text-teal-900 font-bold"
                            />
                          </div>
                        ) : qType === "FIB" ? (
                          /* FIB: FILL IN THE BLANK INPUT */
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Fill in the Blank Text:</span>
                            <Input
                              placeholder="Type your answer text..."
                              value={selectedOpt}
                              onChange={(e) => setPracticeUserAnswers({ ...practiceUserAnswers, [qKey]: e.target.value })}
                              className="h-10 text-xs bg-slate-50 border-slate-200 max-w-md font-medium"
                            />
                          </div>
                        ) : qType === "CODING" ? (
                          /* CODING: HANDS-ON CODING ASSESSMENT */
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Hands-on Code Solution / Implementation:</span>
                            <textarea
                              placeholder="// Write or paste your program solution code here..."
                              value={selectedOpt || q.codeSnippet || ""}
                              onChange={(e) => setPracticeUserAnswers({ ...practiceUserAnswers, [qKey]: e.target.value })}
                              className="w-full min-h-[110px] p-3 text-xs font-mono bg-slate-950 text-emerald-400 border border-slate-800 rounded-xl focus:outline-none leading-relaxed"
                            />
                          </div>
                        ) : (
                          /* DES: DESCRIPTIVE TEXT AREA */
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Descriptive Essay / Code Logic:</span>
                            <textarea
                              placeholder="Write descriptive answer or pseudocode..."
                              value={selectedOpt}
                              onChange={(e) => setPracticeUserAnswers({ ...practiceUserAnswers, [qKey]: e.target.value })}
                              className="w-full min-h-[75px] p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            />
                          </div>
                        )}

                        {/* SHOW ANSWER TOGGLE BUTTON */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <Button
                            size="sm"
                            onClick={() => setPracticeCheckedState({ ...practiceCheckedState, [qKey]: !isAnswerShown })}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs h-8 px-4 rounded-lg shadow-sm gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" /> {isAnswerShown ? "Hide Answer" : "Show Answer"}
                          </Button>
                        </div>

                        {/* SHOW ANSWER SOLUTION RATIONALE BOX */}
                        {isAnswerShown && (
                          <div className={`p-4 border rounded-xl space-y-2 text-xs animate-fadeIn ${
                            qType === "CODING" ? "bg-emerald-50/80 border-emerald-200 text-emerald-950" : "bg-purple-50/80 border-purple-200 text-purple-950"
                          }`}>
                            <div className={`flex items-center justify-between border-b pb-2 ${
                              qType === "CODING" ? "border-emerald-200" : "border-purple-200"
                            }`}>
                              <span className={`font-extrabold flex items-center gap-1.5 ${
                                qType === "CODING" ? "text-emerald-900" : "text-purple-900"
                              }`}>
                                <Lightbulb className={`h-4 w-4 ${qType === "CODING" ? "text-emerald-600" : "text-purple-600"}`} />
                                {qType === "CODING" ? "Scoring Breakdown & Sample I/O" : "Official Correct Key & Solution"}
                              </span>
                              <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                qType === "CODING" ? "bg-emerald-200 text-emerald-900" : "bg-purple-200 text-purple-900"
                              }`}>
                                {qType === "CODING" ? `Student: ${q.studentAnswer || "N/A"}` : `Answer: ${q.correctAnswer || "N/A"}`}
                              </span>
                            </div>
                            <p className={`leading-relaxed font-mono pt-1 whitespace-pre-line ${
                              qType === "CODING" ? "text-emerald-900/90" : "text-purple-900/90"
                            }`}>
                              {q.explanation || `The verified answer for this paper question is ${q.correctAnswer}.`}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : activeTab === "join" ? (
            /* JOIN ASSESSMENT TAB */
            <div className="grid gap-8 lg:grid-cols-12 w-full items-stretch max-w-5xl mx-auto py-4">
              {/* Left Column: Suitability Checklist */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6 text-left">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs text-blue-600 font-semibold">
                    <Laptop className="h-3.5 w-3.5" />
                    System Suitability Checklist
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Hardware &amp; Proctor Guidelines</h2>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Verify hardware devices and security compliance before launching the examination lobby.
                  </p>

                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                      <Video className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          Webcam &amp; Video Feed
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold uppercase">Required</span>
                        </div>
                        <p className="text-slate-500 text-[10.5px] mt-0.5">Real-time face verification and active head-turn tracking.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                      <Wifi className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">Network Connectivity</div>
                        <p className="text-slate-500 text-[10.5px] mt-0.5">Stable network speed of at least 1 Mbps.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                      <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">Browser Security Enforcement</div>
                        <p className="text-slate-500 text-[10.5px] mt-0.5">Strict tab switch limits and fullscreen enforcement active.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" /> Supported on Chrome, Edge, and Safari browsers.
                </div>
              </div>

              {/* Right Column: Enter Key Card */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-white flex flex-col justify-center relative overflow-hidden shadow-xl text-center">
                <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />

                <div className="space-y-6 relative z-10">
                  <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Play className="h-5 w-5 fill-current" />
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-2xl font-black tracking-tight">Access Assessment</h1>
                    <p className="text-slate-400 text-xs max-w-sm mx-auto">
                      Enter the exam access code provided by your administrator to launch the assessment.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-xs mx-auto">
                    <Input
                      placeholder="ENTER ACCESS CODE"
                      value={examCode}
                      onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                      className="bg-slate-950/80 border-slate-700/80 focus-visible:ring-blue-500 h-12 text-center font-mono text-lg font-bold tracking-widest text-blue-400 placeholder:text-slate-600"
                      onKeyDown={(e) => e.key === "Enter" && handleJoinExam()}
                    />

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md transition-all flex items-center justify-center gap-2"
                      onClick={handleJoinExam}
                      disabled={!examCode.trim() || loading}
                    >
                      <FileText className="h-4 w-4" />
                      {loading ? "Verifying Access..." : "Verify & Launch Exam"}
                    </Button>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-950/40 p-3 text-xs text-red-400 border border-red-900/30 flex items-center gap-2 max-w-sm mx-auto text-left">
                      <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "profile" ? (
            /* ================= PROFILE TAB ================= */
            <div className="max-w-4xl mx-auto py-4 space-y-6 text-left">
              {profileLoading && <Loader message={loaderMessage} />}

              {/* Profile Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl text-white space-y-3 shadow-md border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                      <UserCog className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-black truncate">{user?.name || "Student"}</h2>
                      <p className="text-xs text-slate-400 font-mono truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-slate-700/50 text-slate-300 border border-slate-600 text-xs font-bold px-3 py-1 shrink-0">
                    Student Account
                  </Badge>
                </div>
              </div>

              {/* Current Profile Info */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Name</span>
                    <span className="text-sm font-bold text-slate-900 mt-1 block truncate" title={user?.name}>{user?.name || "—"}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                    <span className="text-sm font-bold text-slate-900 mt-1 block font-mono break-all" title={user?.email}>{user?.email || "—"}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Roll Number</span>
                    <span className="text-sm font-bold text-slate-900 mt-1 block font-mono uppercase truncate" title={user?.rollNumber}>{user?.rollNumber || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Edit Profile Form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-purple-600" />
                  Edit Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Update your candidate full name or roll number. Click Save Profile Changes to save your credentials.
                </p>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                      <Input
                        placeholder="Enter your full name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-10 text-sm font-semibold text-slate-800 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Roll Number</Label>
                      <Input
                        placeholder="e.g. 26CS104"
                        value={profileRollNumber}
                        onChange={(e) => setProfileRollNumber(e.target.value)}
                        className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 h-10 text-sm font-semibold text-slate-800 rounded-xl uppercase tracking-wider"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Email (cannot be changed)</Label>
                      <Input
                        value={user?.email || ""}
                        disabled
                        className="bg-slate-100 border-slate-200 h-10 text-sm font-semibold text-slate-500 rounded-xl cursor-not-allowed"
                      />
                    </div>

                    {profileError && (
                      <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-red-500 flex-shrink-0" />
                        {profileError}
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        {profileSuccess}
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={handleProfileUpdate}
                      disabled={profileLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md transition-all rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Save className="h-4 w-4" /> Save Profile Changes
                    </Button>
                  </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* ================= DETAILED QUESTION-BY-QUESTION ANALYSIS MODAL ================= */}
        <Dialog open={!!selectedReport} onOpenChange={(v) => !v && setSelectedReport(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white p-6 rounded-2xl text-left space-y-4">
            <DialogHeader className="border-b pb-3 flex flex-row items-center justify-between pr-6">
              <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Exam Performance Analysis: {selectedReport?.examTitle} ({selectedReport?.examCode})
              </DialogTitle>
              {selectedReport && (
                <Button
                  size="sm"
                  onClick={() => handleExportStudentReportExcel(selectedReport)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-8 px-3 rounded-lg gap-1.5 shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" /> Download Excel Scorecard
                </Button>
              )}
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-6">
                {/* METRICS & TELEMETRY SUMMARY HEADER */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Score Achieved</span>
                    <div className="text-base font-black text-blue-700 mt-0.5">
                      {selectedReport.score} / {selectedReport.totalMarks} Marks
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Assessment Type</span>
                    <div className="text-xs font-extrabold text-purple-700 mt-1 uppercase">
                      {selectedReport.assessmentType === "coding_hybrid" ? "Coding Hybrid Set-Wise" : "Standard Online"}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Security Violations</span>
                    <div className="text-xs font-bold text-slate-700 mt-1">
                      Tab Exits: <span className="font-mono text-amber-600">{selectedReport.tabSwitchCount || 0}</span> | Head: <span className="font-mono text-amber-600">{selectedReport.faceWarningCount || 0}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Submission Time</span>
                    <div className="text-xs font-mono text-slate-700 mt-1">
                      {selectedReport.submittedAt ? new Date(selectedReport.submittedAt).toLocaleTimeString() : "N/A"}
                    </div>
                  </div>
                </div>

                {/* SECTION-WISE PERFORMANCE BREAKDOWN */}
                {selectedReportSectionStats.length > 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-blue-600" /> Topic &amp; Section-Wise Mastery Breakdown
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedReportSectionStats.map((st, sIdx) => (
                        <div key={sIdx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>{st.section}</span>
                            <span className="font-mono text-blue-600">{st.accuracy}% ({st.correct}/{st.total} Correct)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                st.accuracy >= 75 ? "bg-emerald-500" : st.accuracy >= 50 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${st.accuracy}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CODING HYBRID SET SPECIFIC METRICS */}
                {selectedReport.assessmentType === "coding_hybrid" && (
                  <div className="p-4 bg-purple-950 text-white rounded-xl space-y-2 border border-purple-800">
                    <div className="flex items-center justify-between border-b border-purple-800 pb-2">
                      <span className="text-xs font-black text-purple-300">Assigned Question Set: {selectedReport.assignedSet || "N/A"}</span>
                      <span className="text-xs font-bold text-emerald-400">Total Score: {(selectedReport.paperLogicMarks || 0) + (selectedReport.executionOutputMarks || 0)} / 100</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium pt-1">
                      <div>Paper Logic Score: <strong className="text-emerald-300">{selectedReport.paperLogicMarks || 0} / 50</strong></div>
                      <div>IDE Execution Score: <strong className="text-purple-300">{selectedReport.executionOutputMarks || 0} / 50</strong></div>
                    </div>
                  </div>
                )}

                {/* QUESTION BY QUESTION ANALYSIS LIST */}
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                    Question-by-Question Analysis &amp; Answer Key ({selectedReport.questionAnalysis?.length || 0} Questions)
                  </div>

                  {(!selectedReport.questionAnalysis || selectedReport.questionAnalysis.length === 0) ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No question analysis items recorded for this assessment.
                    </div>
                  ) : (
                    selectedReport.questionAnalysis.map((q: any, qIdx: number) => {
                      const qType = (q.questionType || "MCQ").toUpperCase();
                      const hasValidOptions = (qType === "MCQ" || qType === "MSQ") && q.options && Object.values(q.options).some(val => val !== undefined && val !== null && String(val).trim() !== "");

                      return (
                        <div key={qIdx} className={`p-4 rounded-xl border space-y-3 ${
                          q.isCorrect ? "bg-emerald-50/30 border-emerald-200" : q.isPartial ? "bg-amber-50/30 border-amber-200" : "bg-red-50/20 border-red-200"
                        }`}>
                          <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-xs">Question #{qIdx + 1}</span>
                              <Badge className="bg-slate-100 text-slate-600 text-[10px] py-0 px-1.5 uppercase font-mono font-bold">
                                {q.section || "General"}
                              </Badge>
                              {/* DISTINCT QUESTION TYPE BADGE IN ANALYSIS */}
                              <Badge className={`text-[10px] py-0 px-1.5 uppercase font-extrabold ${
                                qType === "MSQ" ? "bg-amber-100 text-amber-800 border-amber-300" :
                                qType === "FIB" ? "bg-blue-100 text-blue-800 border-blue-300" :
                                qType === "NUM" ? "bg-teal-100 text-teal-800 border-teal-300" :
                                qType === "DES" ? "bg-purple-100 text-purple-800 border-purple-300" :
                                qType === "CODING" ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                                "bg-slate-100 text-slate-800 border-slate-300"
                              }`}>
                                {qType === "MSQ" ? "MSQ (Multiple Select)" :
                                 qType === "FIB" ? "FIB (Fill in Blank)" :
                                 qType === "NUM" ? "NUM (Numerical)" :
                                 qType === "DES" ? "DES (Descriptive Essay)" :
                                 qType === "CODING" ? "CODING (Hands-on Code)" :
                                 "MCQ (Single Choice)"}
                              </Badge>
                              {q.isCorrect ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-extrabold gap-1">
                                  <Check className="h-3 w-3" /> Correct (+{q.marks} Marks)
                                </Badge>
                              ) : q.isPartial ? (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-extrabold">
                                  Partial Credit
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] font-bold gap-1">
                                  <X className="h-3 w-3" /> Incorrect ({q.negativeMarks ? `-${q.negativeMarks}` : "0"} Marks)
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">Time Spent: {q.timeSpent || 0}s</span>
                          </div>

                          <div className="text-xs font-bold text-slate-800 leading-relaxed whitespace-pre-line">
                            {q.questionText}
                          </div>

                          {/* Code Snippet / Template for CODING questions */}
                          {q.codeSnippet && (
                            <div className="p-3 bg-slate-950 text-green-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                              <pre>{q.codeSnippet}</pre>
                            </div>
                          )}

                          {/* Options list strictly ONLY if MCQ or MSQ with valid option text */}
                          {hasValidOptions && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                              {Object.entries(q.options).map(([key, val]: [string, any]) => {
                                if (!val || String(val).trim() === "") return null;
                                const isSelected = q.studentAnswer ? q.studentAnswer.split(",").map((s: string) => s.trim()).includes(key) : false;
                                const isCorrectOpt = q.correctAnswer ? q.correctAnswer.split(",").map((s: string) => s.trim()).includes(key) : false;

                                return (
                                  <div
                                    key={key}
                                    className={`p-2 rounded-lg border text-[11px] font-medium flex items-center justify-between ${
                                      isCorrectOpt
                                        ? "bg-emerald-100/60 border-emerald-300 text-emerald-950 font-bold"
                                        : isSelected
                                        ? "bg-red-100/50 border-red-300 text-red-900"
                                        : "bg-white border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    <span><strong>({key}).</strong> {val}</span>
                                    {isSelected && (
                                      <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold uppercase ml-2 shrink-0">
                                        Your Choice
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Answer Details for FIB / NUM / DES */}
                          <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 border-t border-slate-100 font-medium">
                            <div>
                              Candidate Choice: <span className="font-bold text-slate-800 font-mono">{q.studentAnswer || "No Response"}</span>
                            </div>
                            <div>
                              Correct Key: <span className="font-bold text-emerald-700 font-mono">{q.correctAnswer || "N/A"}</span>
                            </div>
                          </div>

                          {/* Explanation Box */}
                          {q.explanation && (
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-950 space-y-1">
                              <span className="font-bold text-purple-900 block">{qType === "CODING" ? "Sample I/O & Instructions:" : "Solution Rationale:"}</span>
                              <p className="font-mono leading-relaxed whitespace-pre-line">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-slate-200 bg-white py-6">
          <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 text-xs text-slate-400 md:flex-row">
            <span>Candidate Session Active (12-Hour Limit Verified)</span>
            <span className="text-center">
              SecureExam Pro • Primary Key: <strong className="text-slate-600">{user?.email}</strong>
            </span>
            <span>Version 2026.1</span>
          </div>
        </footer>
      </div>
    </>
  );
};

export default StudentDashboard;

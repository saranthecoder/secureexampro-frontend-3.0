import { useState, useRef } from "react";
import BASE_URL from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/Loader";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Code2,
  Shield,
  Camera,
  Eye,
  Mic,
  Monitor,
  Lock,
  Maximize,
  Link as LinkIcon,
  Trash2,
  Edit3,
  Download,
  ExternalLink,
  FileCode,
  FileCheck
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CreateExamDialogProps {
  onExamCreated?: () => void;
}

const CreateExamDialog = ({ onExamCreated }: CreateExamDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [duration, setDuration] = useState("60");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [parseError, setParseError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraMonitor, setCameraMonitor] = useState(true);
  const [aiProctorActive, setAiProctorActive] = useState(true);
  const [micMonitor, setMicMonitor] = useState(false);
  const [screenShareMonitor, setScreenShareMonitor] = useState(true);
  const [trackTabSwitches, setTrackTabSwitches] = useState(true);
  const [trackFullScreenExit, setTrackFullScreenExit] = useState(true);
  const [trackInternetIssues, setTrackInternetIssues] = useState(true);
  const [maxTabSwitches, setMaxTabSwitches] = useState(3);
  const [maxFullScreenExits, setMaxFullScreenExits] = useState(3);
  const [dispatchPolicy, setDispatchPolicy] = useState("manual");
  const [assessmentType, setAssessmentType] = useState<"standard" | "online_coding" | "paper_code" | "coding_hybrid">("standard");

  // Google Docs Import & Question Preview State
  const [googleDocsUrl, setGoogleDocsUrl] = useState("");
  const [activeImportTab, setActiveImportTab] = useState<"excel" | "google_docs">("excel");
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestionText, setEditQuestionText] = useState("");
  const [editingQuestionMarks, setEditQuestionMarks] = useState(1);
  const [editingQuestionSection, setEditQuestionSection] = useState("General");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Online Coding Problem Configuration State
  const [codingProblemTitle, setCodingProblemTitle] = useState("Longest Substring Without Repeating Characters");
  const [codingProblemStatement, setCodingProblemStatement] = useState("Given a string s, find the length of the longest substring without repeating characters.");
  const [codingProblemMarks, setCodingProblemMarks] = useState(100);
  const [codingTestCases, setCodingTestCases] = useState<any[]>([
    {
      input: "abcabcbb",
      expectedOutput: "3",
      explanation: "The answer is 'abc', with length 3.",
      isHidden: false,
      weightage: 25
    },
    {
      input: "bbbbb",
      expectedOutput: "1",
      explanation: "The answer is 'b', with length 1.",
      isHidden: false,
      weightage: 25
    },
    {
      input: "pwwkew",
      expectedOutput: "3",
      explanation: "Hidden evaluation test case 1.",
      isHidden: true,
      weightage: 25
    },
    {
      input: "aab",
      expectedOutput: "2",
      explanation: "Hidden evaluation test case 2.",
      isHidden: true,
      weightage: 25
    }
  ]);
  const [starterTemplates, setStarterTemplates] = useState<any>({
    python: `def solve():\n    # Write Python solution here\n    pass\n\nif __name__ == "__main__":\n    solve()`,
    java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write Java solution here\n    }\n}`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write C++ solution here\n    return 0;\n}`,
    c: `#include <stdio.h>\n\nint main() {\n    // Write C solution here\n    return 0;\n}`,
    javascript: `const fs = require('fs');\n// Write JavaScript solution here`
  });
  const [questionSets, setQuestionSets] = useState<any[]>([
    {
      setName: "Set A",
      title: "Set A: Implement Queue using Stacks",
      marks: 100,
      paperMaxMarks: 50,
      executionMaxMarks: 50,
      problemStatement: "Set A: Implement a Queue using two Stacks. Process incoming operation queries efficiently.",
      sampleInputOutput: "Input: Enqueue(10), Enqueue(20), Dequeue()\nOutput: Dequeued Element: 10",
      instructions: "1. Write logic on paper.\n2. Execute code in IDE.",
      testCases: [
        { input: "5\n1 10\n1 20\n2", expectedOutput: "10", explanation: "Open Sample Test Case 1", isHidden: false, weightage: 50 },
        { input: "3\n1 5\n2\n2", expectedOutput: "5\nEMPTY", explanation: "Hidden Evaluation Test Case", isHidden: true, weightage: 50 }
      ],
      problems: [
        {
          title: "Problem 1",
          problemStatement: "Set A: Implement a Queue using two Stacks. Process incoming operation queries efficiently.",
          sampleInputOutput: "Input: Enqueue(10), Enqueue(20), Dequeue()\nOutput: Dequeued Element: 10",
          instructions: "1. Write logic on paper.\n2. Execute code in IDE."
        }
      ]
    },
    {
      setName: "Set B",
      title: "Set B: Find Longest Palindromic Substring",
      marks: 100,
      paperMaxMarks: 50,
      executionMaxMarks: 50,
      problemStatement: "Set B: Given a string s, return the longest palindromic substring in s.",
      sampleInputOutput: "Input: 'babad'\nOutput: 'bab' or 'aba'",
      instructions: "1. Write logic on paper.\n2. Execute code in IDE.",
      testCases: [
        { input: "babad", expectedOutput: "bab", explanation: "Open Sample Test Case 1", isHidden: false, weightage: 50 },
        { input: "cbbd", expectedOutput: "bb", explanation: "Hidden Evaluation Test Case", isHidden: true, weightage: 50 }
      ],
      problems: [
        {
          title: "Problem 1",
          problemStatement: "Set B: Given a string s, return the longest palindromic substring in s.",
          sampleInputOutput: "Input: 'babad'\nOutput: 'bab' or 'aba'",
          instructions: "1. Write logic on paper.\n2. Execute code in IDE."
        }
      ]
    }
  ]);

  const resetForm = () => {
    setTitle("");
    setCode("");
    setDuration("60");
    setStartTime("");
    setEndTime("");
    setFile(null);
    setParsedQuestions([]);
    setQuestionsCount(0);
    setTotalMarks(0);
    setParseError("");
    setCameraMonitor(true);
    setAiProctorActive(true);
    setMicMonitor(false);
    setScreenShareMonitor(true);
    setTrackTabSwitches(true);
    setTrackFullScreenExit(true);
    setTrackInternetIssues(true);
    setMaxTabSwitches(3);
    setMaxFullScreenExits(3);
    setDispatchPolicy("manual");
    setAssessmentType("standard");
  };

  // Preview parse for Excel uploads across all assessment types
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError("");
    setParsedQuestions([]);

    const XLSX = await import("xlsx");
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows.length) {
          setParseError("Excel file is empty.");
          return;
        }

        if (assessmentType === "online_coding" || assessmentType === "paper_code" || assessmentType === "coding_hybrid") {
          // Parse rows into Question Sets for coding/paper assessments
          const parsedSetsMap: { [key: string]: any } = {};
          rows.forEach((row, idx) => {
            const setName = row["Set Name"] || row["Set"] || `Set ${String.fromCharCode(65 + idx)}`;
            if (!parsedSetsMap[setName]) {
              parsedSetsMap[setName] = {
                setName,
                title: row["Title"] || row["Problem Title"] || `${setName}: Coding Assessment Problem`,
                marks: Number(row["Marks"] || 100),
                paperMaxMarks: Number(row["Paper Logic Marks"] || 50),
                executionMaxMarks: Number(row["Execution Output Marks"] || 50),
                problemStatement: row["Problem Statement"] || row["Question"] || `Given target problem data, write an optimal solution.`,
                sampleInputOutput: row["Sample Input Output"] || "Input:\nOutput:",
                instructions: row["Instructions"] || "1. Write logic on paper.\n2. Execute code in IDE.",
                testCases: [],
                problems: [
                  {
                    title: row["Title"] || "Problem 1",
                    problemStatement: row["Problem Statement"] || row["Question"] || "Problem Statement",
                    sampleInputOutput: row["Sample Input Output"] || "Input:\nOutput:",
                    instructions: row["Instructions"] || "1. Write logic on paper."
                  }
                ]
              };
            }

            if (row["Test Case Input"] || row["Input"]) {
              parsedSetsMap[setName].testCases.push({
                input: String(row["Test Case Input"] || row["Input"] || ""),
                expectedOutput: String(row["Expected Output"] || row["Output"] || ""),
                explanation: String(row["Explanation"] || "Evaluation Test Case"),
                isHidden: String(row["Is Hidden"] || "").toLowerCase() === "true" || row["Is Hidden"] === true || row["Is Hidden"] === 1,
                weightage: Number(row["Weightage"] || 50)
              });
            }
          });

          const generatedSets = Object.values(parsedSetsMap);
          if (generatedSets.length > 0) {
            setQuestionSets(generatedSets);
            setParsedQuestions(generatedSets);
            setQuestionsCount(generatedSets.length);
            const totalM = generatedSets.reduce((sum: number, s: any) => sum + (Number(s.marks) || 100), 0);
            setTotalMarks(totalM);
          } else {
            setQuestionsCount(rows.length);
            setParsedQuestions(rows);
          }
        } else {
          // Standard MCQ / MSQ / FIB / NUM / DES
          setQuestionsCount(rows.length);
          setParsedQuestions(rows);
          const marksSum = rows.reduce(
            (sum, r) => sum + Number(r["Marks"] || r.marks || 1),
            0,
          );
          setTotalMarks(marksSum);
        }

        toast({
          title: "File Processed Successfully",
          description: `Parsed ${rows.length} rows from ${selectedFile.name}`,
        });
      } catch (err: any) {
        setParseError("Invalid Excel file format.");
        setParsedQuestions([]);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const downloadSampleTemplate = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const XLSX = await import("xlsx");
    let sampleData: any[] = [];
    let fileName = "SecureExamPro_Template.xlsx";

    if (assessmentType === "online_coding") {
      fileName = "SecureExamPro_Online_Coding_Template.xlsx";
      sampleData = [
        {
          "Set Name": "Set A",
          "Title": "Set A: Find Longest Substring Without Repeating Characters",
          "Problem Statement": "Given a string s, find the length of the longest substring without repeating characters.",
          "Marks": 100,
          "Starter Template Python": "def solve():\n    pass",
          "Test Case Input": "abcabcbb",
          "Expected Output": "3",
          "Explanation": "The answer is 'abc', with length 3.",
          "Is Hidden": false,
          "Weightage": 50
        },
        {
          "Set Name": "Set A",
          "Title": "Set A: Find Longest Substring Without Repeating Characters",
          "Problem Statement": "Given a string s, find the length of the longest substring without repeating characters.",
          "Marks": 100,
          "Starter Template Python": "def solve():\n    pass",
          "Test Case Input": "bbbbb",
          "Expected Output": "1",
          "Explanation": "Hidden Evaluation Case",
          "Is Hidden": true,
          "Weightage": 50
        },
        {
          "Set Name": "Set B",
          "Title": "Set B: Valid Parentheses Matching",
          "Problem Statement": "Given a string s containing just characters '(', ')', '{', '}', '[' and ']', determine if input string is valid.",
          "Marks": 100,
          "Starter Template Python": "def isValid(s):\n    pass",
          "Test Case Input": "()[]{}",
          "Expected Output": "true",
          "Explanation": "Open Sample Test Case",
          "Is Hidden": false,
          "Weightage": 50
        }
      ];
    } else if (assessmentType === "paper_code" || assessmentType === "coding_hybrid") {
      fileName = "SecureExamPro_Paper_Code_Template.xlsx";
      sampleData = [
        {
          "Set Name": "Set A",
          "Title": "Set A: Queue Implementation Using Stacks",
          "Problem Statement": "Write paper logic and code implementation for Queue using two Stacks.",
          "Sample Input Output": "Input: Enqueue(10), Dequeue()\nOutput: 10",
          "Instructions": "1. Write logic on paper.\n2. Execute code in IDE.",
          "Paper Logic Marks": 50,
          "Execution Output Marks": 50,
          "Marks": 100,
          "Test Case Input": "5\n1 10\n2",
          "Expected Output": "10",
          "Is Hidden": false,
          "Weightage": 50
        },
        {
          "Set Name": "Set B",
          "Title": "Set B: Binary Tree Level Order Traversal",
          "Problem Statement": "Write paper logic and code implementation for BFS Level Order Traversal.",
          "Sample Input Output": "Input: [3,9,20,null,null,15,7]\nOutput: [[3],[9,20],[15,7]]",
          "Instructions": "1. Write logic on paper.\n2. Execute code in IDE.",
          "Paper Logic Marks": 50,
          "Execution Output Marks": 50,
          "Marks": 100,
          "Test Case Input": "3 9 20",
          "Expected Output": "3 9 20",
          "Is Hidden": false,
          "Weightage": 50
        }
      ];
    } else {
      sampleData = [
        {
          "Section": "Quantitative Aptitude",
          "Question Type": "MCQ",
          "Question": "What is the next number in the series: 2, 6, 12, 20, 30, ...?",
          "Option A": "40",
          "Option B": "42",
          "Option C": "44",
          "Option D": "46",
          "Correct Answer": "B",
          "Marks": 2,
          "Negative Marks": 0.5,
          "Code Snippet": "",
          "Image URL": ""
        },
        {
          "Section": "Logical Reasoning",
          "Question Type": "MSQ",
          "Question": "Identify the correct parameters from the options (Select all correct options).",
          "Option A": "Parameter A",
          "Option B": "Parameter B",
          "Option C": "Parameter C",
          "Option D": "Parameter D",
          "Correct Answer": "A,C",
          "Marks": 3,
          "Negative Marks": 1,
          "Code Snippet": "",
          "Image URL": ""
        },
        {
          "Section": "Verbal Ability",
          "Question Type": "MCQ",
          "Question": "Find the synonym of 'ABANDON'.",
          "Option A": "Keep",
          "Option B": "Desert",
          "Option C": "Adopt",
          "Option D": "Support",
          "Correct Answer": "B",
          "Marks": 1,
          "Negative Marks": 0.25,
          "Code Snippet": "",
          "Image URL": ""
        },
        {
          "Section": "Programming Logic / Pseudocode",
          "Question Type": "FIB",
          "Question": "The value of sum after executing: sum = 0; for i=1 to 3 sum+=i; is ________.",
          "Option A": "",
          "Option B": "",
          "Option C": "",
          "Option D": "",
          "Correct Answer": "6",
          "Marks": 2,
          "Negative Marks": 0,
          "Code Snippet": "",
          "Image URL": ""
        },
        {
          "Section": "Mathematics",
          "Question Type": "NUM",
          "Question": "Evaluate the expression: (15 * 3) / 9.",
          "Option A": "",
          "Option B": "",
          "Option C": "",
          "Option D": "",
          "Correct Answer": "5",
          "Marks": 2,
          "Negative Marks": 0.25,
          "Code Snippet": "",
          "Image URL": ""
        },
        {
          "Section": "Computer Networks",
          "Question Type": "DES",
          "Question": "Explain the difference between TCP and UDP protocols in detail.",
          "Option A": "",
          "Option B": "",
          "Option C": "",
          "Option D": "",
          "Correct Answer": "TCP is connection-oriented while UDP is connectionless",
          "Marks": 5,
          "Negative Marks": 0,
          "Code Snippet": "",
          "Image URL": ""
        }
      ];
    }

  const getGoogleDocsEmbedUrl = (urlStr: string) => {
    if (!urlStr) return "";
    let clean = urlStr.trim();
    if (clean.includes("docs.google.com/document/d/")) {
      clean = clean.replace(/\/edit(\?.*)?$/, "/preview").replace(/\/view(\?.*)?$/, "/preview");
      if (!clean.endsWith("/preview")) {
        clean = clean.split("?")[0] + "/preview";
      }
    }
    return clean;
  };

  const handleImportGoogleDocs = async () => {
    if (!googleDocsUrl) {
      toast({ title: "Google Docs Link Required", description: "Paste a shareable Google Docs link.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const sampleDocQuestion = {
        "Section": "Google Docs Import",
        "Question Type": assessmentType === "online_coding" ? "CODING" : (assessmentType === "paper_code" ? "PAPER_CODE" : "MCQ"),
        "Question": `Imported question from Google Doc (${googleDocsUrl.substring(0, 30)}...)`,
        "Option A": "Option A",
        "Option B": "Option B",
        "Option C": "Option C",
        "Option D": "Option D",
        "Correct Answer": "A",
        "Marks": 5,
        "Negative Marks": 0
      };

      const updated = [...parsedQuestions, sampleDocQuestion];
      setParsedQuestions(updated);
      setQuestionsCount(updated.length);
      setTotalMarks(updated.reduce((s, q) => s + Number(q["Marks"] || q.marks || 1), 0));

      toast({
        title: "Google Docs Import Successful",
        description: "Linked and imported questions into pre-creation preview.",
      });
    } catch (err: any) {
      toast({ title: "Import Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParsedQuestion = (indexToDelete: number) => {
    const updated = parsedQuestions.filter((_, idx) => idx !== indexToDelete);
    setParsedQuestions(updated);
    setQuestionsCount(updated.length);
    const marksSum = updated.reduce((sum, r) => sum + Number(r["Marks"] || r.marks || 1), 0);
    setTotalMarks(marksSum);
    toast({ title: "Question Removed", description: `Removed item #${indexToDelete + 1}` });
  };

  const handleOpenEditQuestionModal = (qObj: any, index: number) => {
    setEditingQuestionIndex(index);
    setEditQuestionText(qObj["Question"] || qObj.question || qObj.title || "");
    setEditQuestionMarks(Number(qObj["Marks"] || qObj.marks || 1));
    setEditQuestionSection(qObj["Section"] || qObj.section || "General");
    setIsEditModalOpen(true);
  };

  const handleSaveEditedQuestion = () => {
    if (editingQuestionIndex === null) return;
    const updated = [...parsedQuestions];
    updated[editingQuestionIndex] = {
      ...updated[editingQuestionIndex],
      Question: editQuestionText,
      question: editQuestionText,
      Marks: editingQuestionMarks,
      marks: editingQuestionMarks,
      Section: editingQuestionSection,
      section: editingQuestionSection
    };
    setParsedQuestions(updated);
    setTotalMarks(updated.reduce((sum, r) => sum + Number(r["Marks"] || r.marks || 1), 0));
    setIsEditModalOpen(false);
    setEditingQuestionIndex(null);
    toast({ title: "Question Updated", description: "Changes saved to pre-creation question preview." });
  };

  const handleCreate = async () => {
    if (!title || !code || !duration) {
      toast({
        title: "Missing fields",
        description: "Please fill in Title, Exam Code, and Duration.",
        variant: "destructive",
      });
      return;
    }

    if (assessmentType === "standard" && !file) {
      toast({
        title: "Excel File Required",
        description: "Upload an Excel file containing questions for standard MCQ assessments.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("examCode", code.toUpperCase());
      formData.append("duration", (assessmentType === "paper_code" || assessmentType === "coding_hybrid") ? "0" : duration);
      formData.append(
        "startTime",
        startTime ? new Date(startTime).toISOString() : "",
      );

      formData.append(
        "endTime",
        endTime ? new Date(endTime).toISOString() : "",
      );

      formData.append("adminEmail", "coreadmin@secureexam.com");
      if (file) {
        formData.append("file", file);
      } else if (assessmentType === "paper_code" || assessmentType === "coding_hybrid" || assessmentType === "online_coding") {
        const dummyBlob = new Blob(["Section,Question Type,Question,Correct Answer,Marks\nCoding,CODING,Coding Question Set,N/A,100"], { type: "text/csv" });
        formData.append("file", dummyBlob, "coding_questions.csv");
      }

      formData.append("cameraMonitor", String(cameraMonitor));
      formData.append("aiProctorActive", String(aiProctorActive));
      formData.append("micMonitor", String(micMonitor));
      formData.append("screenShareMonitor", String(screenShareMonitor));
      formData.append("trackTabSwitches", String(trackTabSwitches));
      formData.append("trackFullScreenExit", String(trackFullScreenExit));
      formData.append("trackInternetIssues", String(trackInternetIssues));
      formData.append("maxTabSwitches", String(maxTabSwitches));
      formData.append("maxFullScreenExits", String(maxFullScreenExits));
      formData.append("dispatchPolicy", "manual");
      formData.append("assessmentType", assessmentType);
      if (assessmentType === "paper_code" || assessmentType === "coding_hybrid" || assessmentType === "online_coding") {
        formData.append("questionSets", JSON.stringify(questionSets));
      }
      if (assessmentType === "online_coding") {
        const codingQuestionPayload = questionSets.map((s) => ({
          question: `${s.title || `Set ${s.setName}`}\n\n${s.problemStatement || ""}`,
          marks: s.marks || 100,
          questionType: "CODING",
          setName: s.setName,
          starterTemplates,
          testCases: s.testCases || []
        }));
        formData.append("onlineCodingConfig", JSON.stringify(codingQuestionPayload));
      }

      const res = await fetch(`${BASE_URL}/exam/create`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create exam");
      }

      toast({
        title: "Exam Created Successfully",
        description: `${title} (${code.toUpperCase()})`,
      });

      if (onExamCreated) {
        onExamCreated();
      }

      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
          <Plus className="mr-1.5 h-4 w-4" /> Create Exam
        </Button>
      </DialogTrigger>

      <DialogContent
        className="
          fixed left-1/2 top-1/2
          -translate-x-1/2 -translate-y-1/2
          max-w-[96vw] w-full
          max-h-[92vh] h-[92vh] flex flex-col
          rounded-2xl border border-slate-200 shadow-2xl p-6
        "
      >
        {/* 🔥 LOADER OVERLAY */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
            <Loader />
          </div>
        )}
        <DialogHeader className="border-b border-slate-100 pb-4 mb-4 shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900">Create Placement Assessment</DialogTitle>
        </DialogHeader>

        <div
          className={`space-y-5 flex-grow overflow-auto min-h-0 ${loading ? "pointer-events-none opacity-40" : ""}`}
        >


          {/* Card 1: Assessment Format Selector (3 Divisions) */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">1. Assessment Format (3 Divisions)</h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-800 border-blue-200">
                Selected: {assessmentType === "standard" ? "Standard Online" : assessmentType === "online_coding" ? "Online Coding Platform" : "Paper Code (Hybrid)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setAssessmentType("standard")}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  assessmentType === "standard"
                    ? "bg-blue-50/70 border-blue-600 text-blue-950 font-bold shadow-md ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-blue-900">Standard Online</span>
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                </div>
                <div className="text-[10px] text-slate-500 leading-normal">MCQ, MSQ, FIB, Numerical & Descriptive Excel question bank.</div>
              </button>

              <button
                type="button"
                onClick={() => setAssessmentType("online_coding")}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  assessmentType === "online_coding"
                    ? "bg-emerald-50/70 border-emerald-600 text-emerald-950 font-bold shadow-md ring-2 ring-emerald-500/20"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-emerald-900">Online Coding</span>
                  <Code2 className="h-4 w-4 text-emerald-600 shrink-0" />
                </div>
                <div className="text-[10px] text-slate-500 leading-normal">Browser IDE Runner & Open/Hidden Test Cases evaluation.</div>
              </button>

              <button
                type="button"
                onClick={() => setAssessmentType("paper_code")}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  assessmentType === "paper_code" || assessmentType === "coding_hybrid"
                    ? "bg-purple-50/70 border-purple-600 text-purple-950 font-bold shadow-md ring-2 ring-purple-500/20"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-purple-900">Paper Code (Hybrid)</span>
                  <FileSpreadsheet className="h-4 w-4 text-purple-600 shrink-0" />
                </div>
                <div className="text-[10px] text-slate-500 leading-normal">Set A/B/C/D Paper Writing & Local IDE Compiler workflow.</div>
              </button>
            </div>
          </div>

          {/* Card 2: Basic Information & Scheduling */}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">2. Basic Details & Assessment Window</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Exam Title</Label>
                <Input
                  placeholder="e.g. Data Structures & Algorithms Placement Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white border-slate-200 focus-visible:ring-blue-500 text-xs h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Exam Code (Unique Identifier)</Label>
                <Input
                  placeholder="e.g. DSA2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="bg-white border-slate-200 focus-visible:ring-blue-500 text-xs h-10 font-mono tracking-wider"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Duration (min)</Label>
                {assessmentType === "paper_code" || assessmentType === "coding_hybrid" ? (
                  <div className="h-10 px-3 flex items-center bg-purple-50 border border-purple-200 text-purple-900 rounded-md text-xs font-bold font-mono">
                    Untimed (Examiner Controlled)
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-white border-slate-200 focus-visible:ring-blue-500 text-sm h-10"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Start window</Label>
                <input
                  type="datetime-local"
                  className="w-full h-10 rounded-md border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">End window</Label>
                <input
                  type="datetime-local"
                  className="w-full h-10 rounded-md border border-slate-200 px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Security & Proctoring Enforcements */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-blue-600" /> 3. Security & Proctoring Enforcements
                </h3>
                <p className="text-[10px] text-slate-500">Configure AI proctoring, browser locks, and violation limits for candidate session monitoring.</p>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">
                PROCTORING ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Camera Monitoring */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border bg-white hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={cameraMonitor}
                  onChange={(e) => setCameraMonitor(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5 text-blue-600" /> Web Camera Monitoring
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Enforces webcam stream & baseline checks.</p>
                </div>
              </label>

              {/* AI Face Detection */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border bg-white hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={aiProctorActive}
                  onChange={(e) => setAiProctorActive(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-purple-600" /> AI Face Recognition
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Detects multiple persons or face missing.</p>
                </div>
              </label>

              {/* Microphone Monitoring */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border bg-white hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={micMonitor}
                  onChange={(e) => setMicMonitor(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Mic className="h-3.5 w-3.5 text-indigo-600" /> Audio & Noise Detection
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Flags ambient noise or speech activity.</p>
                </div>
              </label>

              {/* Screen Sharing Lock */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border bg-white hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={screenShareMonitor}
                  onChange={(e) => setScreenShareMonitor(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Monitor className="h-3.5 w-3.5 text-amber-600" /> Screen Sharing Lock
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Enforces continuous screen stream.</p>
                </div>
              </label>

              {/* Tab Switch Tracking */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border bg-white hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={trackTabSwitches}
                  onChange={(e) => setTrackTabSwitches(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-red-600" /> Tab Switch Tracking
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Logs browser tab exits & switches.</p>
                </div>
              </label>

              {/* Fullscreen Mode Lock */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border bg-white hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={trackFullScreenExit}
                  onChange={(e) => setTrackFullScreenExit(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Maximize className="h-3.5 w-3.5 text-emerald-600" /> Fullscreen Enforcement
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Blocks exam view when fullscreen is exited.</p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
              <div>
                <Label className="text-[10px] font-extrabold text-slate-600 block mb-1">Max Tab Switch Violations Allowed</Label>
                <Input
                  type="number"
                  value={maxTabSwitches}
                  onChange={(e) => setMaxTabSwitches(parseInt(e.target.value) || 3)}
                  className="h-8 text-xs bg-white font-bold"
                />
              </div>
              <div>
                <Label className="text-[10px] font-extrabold text-slate-600 block mb-1">Max Fullscreen Exit Violations Allowed</Label>
                <Input
                  type="number"
                  value={maxFullScreenExits}
                <p className="text-[10px] text-slate-500">Upload spreadsheet or link Google Docs document for {assessmentType.toUpperCase().replace("_", " ")}.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleTemplate}
                  className="h-8 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Sample {assessmentType.toUpperCase().replace("_", " ")} Excel
                </Button>
              </div>
            </div>

            {/* Import Tabs: Excel File vs Google Docs Link */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveImportTab("excel")}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeImportTab === "excel" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Upload Excel Sheet (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setActiveImportTab("google_docs")}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeImportTab === "google_docs" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <LinkIcon className="h-3.5 w-3.5" /> Import Google Docs URL
              </button>
            </div>

            {/* TAB 1: EXCEL FILE UPLOAD */}
            {activeImportTab === "excel" && (
              <div
                className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white p-5 hover:bg-blue-50/20 transition-all text-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                <p className="text-xs font-bold text-slate-700">
                  {file?.name || `Click or drop Excel file for ${assessmentType.toUpperCase().replace("_", " ")}`}
                </p>
                <p className="text-[10px] text-slate-400 leading-normal max-w-[340px]">
                  Supports .xlsx and .csv files. Pre-parsed questions will be displayed in the interactive preview below.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* TAB 2: GOOGLE DOCS LINK IMPORT & EMBEDDED PREVIEW */}
            {activeImportTab === "google_docs" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste Google Docs shareable link (e.g. https://docs.google.com/document/d/...)"
                    value={googleDocsUrl}
                    onChange={(e) => setGoogleDocsUrl(e.target.value)}
                    className="bg-white text-xs h-10 border-slate-200"
                  />
                  <Button
                    type="button"
                    onClick={handleImportGoogleDocs}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 shrink-0"
                  >
                    Import & Link Doc
                  </Button>
                </div>

                {googleDocsUrl && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 border-b flex items-center justify-between">
                      <span>Live Embedded Google Docs Preview</span>
                      <a href={googleDocsUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Open in Google Docs <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <iframe
                      src={getGoogleDocsEmbedUrl(googleDocsUrl)}
                      className="w-full h-48 border-0"
                      title="Google Docs Question Source Preview"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 5: Set-Wise Online Coding Configurator (Online Coding Mode) */}
          {assessmentType === "online_coding" && (
            <div className="p-4 bg-emerald-50/40 border border-emerald-200/60 rounded-xl space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800">5. Online Coding Question Sets Configurator</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Configure coding problem statements & test cases per question set.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const nextLetter = String.fromCharCode(65 + questionSets.length);
                    setQuestionSets([
                      ...questionSets,
                      {
                        setName: `Set ${nextLetter}`,
                        title: `Set ${nextLetter}: Online Coding Problem`,
                        marks: 100,
                        paperMaxMarks: 50,
                        executionMaxMarks: 50,
                        problemStatement: `Set ${nextLetter}: Given target input data, write an optimal solution.`,
                        sampleInputOutput: "Input:\nOutput:",
                        instructions: "1. Write logic on paper.\n2. Execute code in IDE.",
                        testCases: [
                          {
                            input: "Sample Input 1",
                            expectedOutput: "Sample Output 1",
                            explanation: "Open Sample Test Case",
                            isHidden: false,
                            weightage: 50
                          },
                          {
                            input: "Evaluation Input 2",
                            expectedOutput: "Evaluation Output 2",
                            explanation: "Hidden Evaluation Test Case",
                            isHidden: true,
                            weightage: 50
                          }
                        ],
                        problems: [
                          {
                            title: "Problem 1",
                            problemStatement: `Set ${nextLetter}: Given target input data, write an optimal solution.`,
                            sampleInputOutput: "Input:\nOutput:",
                            instructions: "1. Write logic on paper.\n2. Execute code in IDE."
                          }
                        ]
                      }
                    ]);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-8 px-3 rounded-lg flex items-center gap-1 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> + Add Set
                </Button>
              </div>

              {/* SETS LIST */}
              <div className="space-y-5">
                {questionSets.map((s, sIdx) => {
                  const currentTestCases = s.testCases && s.testCases.length > 0 ? s.testCases : [
                    {
                      input: "Sample Input 1",
                      expectedOutput: "Sample Output 1",
                      explanation: "Open Sample Test Case",
                      isHidden: false,
                      weightage: 50
                    },
                    {
                      input: "Evaluation Input 2",
                      expectedOutput: "Evaluation Output 2",
                      explanation: "Hidden Evaluation Test Case",
                      isHidden: true,
                      weightage: 50
                    }
                  ];

                  return (
                    <div key={sIdx} className="p-4 bg-white border border-emerald-300/80 rounded-2xl space-y-3.5 shadow-sm text-left relative">
                      <div className="flex items-center justify-between border-b pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-950 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg">
                            {s.setName}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            Set #{sIdx + 1} Question Paper
                          </span>
                        </div>

                        {questionSets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuestionSets(questionSets.filter((_, i) => i !== sIdx))}
                            className="text-red-500 hover:text-red-700 text-xs font-extrabold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md border border-red-200"
                          >
                            Remove {s.setName}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <Label className="text-[11px] font-extrabold text-slate-700 block mb-1">Problem Title</Label>
                          <Input
                            placeholder={`e.g. ${s.setName}: Problem Title`}
                            value={s.title || `Set ${s.setName}: Coding Problem`}
                            onChange={(e) => {
                              const updated = [...questionSets];
                              updated[sIdx].title = e.target.value;
                              setQuestionSets(updated);
                            }}
                            className="h-9 text-xs bg-white font-bold border-slate-200"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] font-extrabold text-slate-700 block mb-1">Marks Weightage</Label>
                          <Input
                            type="number"
                            value={s.marks || 100}
                            onChange={(e) => {
                              const updated = [...questionSets];
                              updated[sIdx].marks = Number(e.target.value) || 100;
                              setQuestionSets(updated);
                            }}
                            className="h-9 text-xs bg-white font-bold border-slate-200"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[11px] font-extrabold text-slate-700 block mb-1">Problem Statement & Constraints</Label>
                        <textarea
                          placeholder="Enter detailed problem statement, input format, output format, and constraints..."
                          value={s.problemStatement || ""}
                          onChange={(e) => {
                            const updated = [...questionSets];
                            updated[sIdx].problemStatement = e.target.value;
                            setQuestionSets(updated);
                          }}
                          rows={3}
                          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      {/* TEST CASES LIST FOR THIS SET */}
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>{s.setName} Test Cases ({currentTestCases.length})</span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const updated = [...questionSets];
                              if (!updated[sIdx].testCases) updated[sIdx].testCases = [...currentTestCases];
                              updated[sIdx].testCases.push({
                                input: "Sample Input",
                                expectedOutput: "Sample Output",
                                explanation: "Evaluation Case",
                                isHidden: false,
                                weightage: 25
                              });
                              setQuestionSets(updated);
                            }}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] h-7 px-2.5 rounded"
                          >
                            + Add Test Case to {s.setName}
                          </Button>
                        </div>

                        {currentTestCases.map((tc: any, tcIdx: number) => (
                          <div key={tcIdx} className={`p-3 rounded-xl border space-y-2 text-xs transition-all ${
                            tc.isHidden ? "bg-amber-50/50 border-amber-200" : "bg-emerald-50/50 border-emerald-200"
                          }`}>
                            <div className="flex items-center justify-between border-b pb-1.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                tc.isHidden ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              }`}>
                                {tc.isHidden ? `🔒 Hidden Case #${tcIdx + 1}` : `🌐 Open Case #${tcIdx + 1}`}
                              </span>

                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={tc.isHidden}
                                    onChange={(e) => {
                                      const updated = [...questionSets];
                                      if (!updated[sIdx].testCases) updated[sIdx].testCases = [...currentTestCases];
                                      updated[sIdx].testCases[tcIdx].isHidden = e.target.checked;
                                      setQuestionSets(updated);
                                    }}
                                    className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                                  />
                                  Hidden Evaluation Case
                                </label>

                                {currentTestCases.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...questionSets];
                                      if (!updated[sIdx].testCases) updated[sIdx].testCases = [...currentTestCases];
                                      updated[sIdx].testCases = updated[sIdx].testCases.filter((_: any, i: number) => i !== tcIdx);
                                      setQuestionSets(updated);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <Label className="text-[10px] font-bold text-slate-600 block mb-0.5">Input (Stdin)</Label>
                                <textarea
                                  value={tc.input}
                                  onChange={(e) => {
                                    const updated = [...questionSets];
                                    if (!updated[sIdx].testCases) updated[sIdx].testCases = [...currentTestCases];
                                    updated[sIdx].testCases[tcIdx].input = e.target.value;
                                    setQuestionSets(updated);
                                  }}
                                  rows={2}
                                  className="w-full p-2 rounded-lg border border-slate-200 font-mono text-[11px] bg-white"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] font-bold text-slate-600 block mb-0.5">Expected Output (Stdout)</Label>
                                <textarea
                                  value={tc.expectedOutput}
                                  onChange={(e) => {
                                    const updated = [...questionSets];
                                    if (!updated[sIdx].testCases) updated[sIdx].testCases = [...currentTestCases];
                                    updated[sIdx].testCases[tcIdx].expectedOutput = e.target.value;
                                    setQuestionSets(updated);
                                  }}
                                  rows={2}
                                  className="w-full p-2 rounded-lg border border-slate-200 font-mono text-[11px] bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card 4: Question Sets Builder (Paper Code Hybrid Mode) */}
          {(assessmentType === "paper_code" || assessmentType === "coding_hybrid") && (
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-4 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-purple-700 font-black">5. Question Paper Sets (Set A, B, C, D)</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Define set-wise problem statements and maximum score weightages.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const nextLetter = String.fromCharCode(65 + questionSets.length);
                    setQuestionSets([
                      ...questionSets,
                      {
                        setName: `Set ${nextLetter}`,
                        paperMaxMarks: 50,
                        executionMaxMarks: 50,
                        problemStatement: `Set ${nextLetter} Problem 1: Describe coding problem here.`,
                        sampleInputOutput: "Input:\nOutput:",
                        instructions: "1. Write logic on paper.\n2. Execute code in local IDE.",
                        problems: [
                          {
                            title: "Problem 1",
                            problemStatement: `Set ${nextLetter} Problem 1: Describe coding problem here.`,
                            sampleInputOutput: "Input:\nOutput:",
                            instructions: "1. Write logic on paper.\n2. Execute code in local IDE."
                          }
                        ]
                      }
                    ]);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 px-3 rounded-lg"
                >
                  + Add Set
                </Button>
              </div>

              <div className="space-y-4">
                {questionSets.map((s, idx) => {
                  const setProblems = s.problems && s.problems.length > 0 ? s.problems : [
                    {
                      title: "Problem 1",
                      problemStatement: s.problemStatement || "",
                      sampleInputOutput: s.sampleInputOutput || "",
                      instructions: s.instructions || ""
                    }
                  ];

                  return (
                    <div key={idx} className="p-4 bg-white border border-purple-200 rounded-xl space-y-3 relative shadow-sm text-left">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-md">{s.setName}</span>
                        </div>
                        {questionSets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuestionSets(questionSets.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            Remove Set
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] font-bold text-slate-600 block">Paper Logic Max Marks</Label>
                          <Input
                            type="number"
                            value={s.paperMaxMarks}
                            onChange={(e) => {
                              const updated = [...questionSets];
                              updated[idx].paperMaxMarks = parseInt(e.target.value) || 0;
                              setQuestionSets(updated);
                            }}
                            className="h-8 text-xs bg-slate-50 font-bold"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-bold text-slate-600 block">Execution Output Max Marks</Label>
                          <Input
                            type="number"
                            value={s.executionMaxMarks}
                            onChange={(e) => {
                              const updated = [...questionSets];
                              updated[idx].executionMaxMarks = parseInt(e.target.value) || 0;
                              setQuestionSets(updated);
                            }}
                            className="h-8 text-xs bg-slate-50 font-bold"
                          />
                        </div>
                      </div>

                      {/* GOOGLE DRIVE QUESTION PAPER URL */}
                      <div>
                        <Label className="text-[10px] font-extrabold text-purple-900 block mb-1">
                          📄 Google Drive Question Paper URL (PDF / Document Link for {s.setName})
                        </Label>
                        <Input
                          type="url"
                          placeholder="e.g. https://drive.google.com/file/d/1ABC.../view or https://docs.google.com/document/d/.../edit"
                          value={s.driveUrl || ""}
                          onChange={(e) => {
                            const updated = [...questionSets];
                            updated[idx].driveUrl = e.target.value;
                            setQuestionSets(updated);
                          }}
                          className="h-9 text-xs bg-purple-50/50 border-purple-200 font-mono text-purple-950"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Paste Google Drive PDF or Document view link. The PDF preview will be embedded directly in the student's secure exam panel.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {parsedQuestions.length > 0 && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-left">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Parsed Questions Preview</div>
              <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100 text-xs">
                {parsedQuestions.map((q, idx) => {
                  const qType = String(q["Question Type"] || q["questionType"] || "MCQ").toUpperCase().trim();
                  const isMcqMsq = qType === "MCQ" || qType === "MSQ";
                  const optA = q["Option A"] || q["optionA"] || q["OptionA"] || q["option a"];
                  const optB = q["Option B"] || q["optionB"] || q["OptionB"] || q["option b"];
                  const optC = q["Option C"] || q["optionC"] || q["OptionC"] || q["option c"];
                  const optD = q["Option D"] || q["optionD"] || q["OptionD"] || q["option d"];
                  const correctAns = String(q["Correct Answer"] || q["correctAnswer"] || "").toUpperCase().trim();
                  const correctLetters = correctAns.split(/[\s,+/]+/).map(s => s.trim());
                  const negMarks = q["Negative Marks"] || q["negativeMarks"] || 0;

                  return (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px]">
                        <span className="bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded font-mono">Q{idx + 1}</span>
                        <span className="bg-blue-50 text-blue-700 font-extrabold px-1.5 py-0.5 rounded uppercase">Section: {q["Section"] || q["section"] || "General"}</span>
                        <span className="bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded uppercase">{qType}</span>
                        <span className="text-slate-400 font-extrabold ml-auto">
                          Marks: {q["Marks"] || q["marks"] || 1} | Negative Marks: -{negMarks}
                        </span>
                      </div>
                      <div className="text-slate-800 font-semibold mb-2">{q["Question"] || q["question"]}</div>

                      {isMcqMsq && (
                        <div className="grid grid-cols-2 gap-2 mt-1.5 mb-2 pl-3 border-l-2 border-slate-150">
                          {optA && (
                            <div className={`p-1.5 rounded-lg border text-[10px] transition-all ${
                              correctLetters.includes("A")
                                ? "bg-emerald-50/70 border-emerald-250 text-emerald-950 font-bold"
                                : "bg-slate-50 border-slate-100 text-slate-500"
                            }`}>
                              <span className="font-extrabold mr-1">A.</span> {optA}
                            </div>
                          )}
                          {optB && (
                            <div className={`p-1.5 rounded-lg border text-[10px] transition-all ${
                              correctLetters.includes("B")
                                ? "bg-emerald-50/70 border-emerald-250 text-emerald-950 font-bold"
                                : "bg-slate-50 border-slate-100 text-slate-500"
                            }`}>
                              <span className="font-extrabold mr-1">B.</span> {optB}
                            </div>
                          )}
                          {optC && (
                            <div className={`p-1.5 rounded-lg border text-[10px] transition-all ${
                              correctLetters.includes("C")
                                ? "bg-emerald-50/70 border-emerald-250 text-emerald-950 font-bold"
                                : "bg-slate-50 border-slate-100 text-slate-500"
                            }`}>
                              <span className="font-extrabold mr-1">C.</span> {optC}
                            </div>
                          )}
                          {optD && (
                            <div className={`p-1.5 rounded-lg border text-[10px] transition-all ${
                              correctLetters.includes("D")
                                ? "bg-emerald-50/70 border-emerald-250 text-emerald-950 font-bold"
                                : "bg-slate-50 border-slate-100 text-slate-500"
                            }`}>
                              <span className="font-extrabold mr-1">D.</span> {optD}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 font-bold">
                        Correct Answer: <span className="text-blue-600 font-black">{correctAns}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {parseError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {questionsCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Verified spreadsheet: {questionsCount} questions • Total {totalMarks} marks.</span>
            </div>
          )}

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md transition-all rounded-xl"
            onClick={handleCreate}
            disabled={loading}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {loading ? "Registering Assessment..." : "Publish Exam"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamDialog;

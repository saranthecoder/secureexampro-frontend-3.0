import { useState, useRef } from "react";
import * as XLSX from "xlsx";
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

  const [questionsCount, setQuestionsCount] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [parseError, setParseError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraMonitor, setCameraMonitor] = useState(false);

  const resetForm = () => {
    setTitle("");
    setCode("");
    setDuration("60");
    setStartTime("");
    setEndTime("");
    setFile(null);
    setQuestionsCount(0);
    setTotalMarks(0);
    setParseError("");
    setCameraMonitor(false);
  };

  // Just preview parse (backend still validates)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError("");

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

        setQuestionsCount(rows.length);

        const marksSum = rows.reduce(
          (sum, r) => sum + Number(r["Marks"] || 1),
          0,
        );

        setTotalMarks(marksSum);
      } catch {
        setParseError("Invalid Excel format.");
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const downloadSampleTemplate = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering file input click

    const sampleData = [
      {
        "Section": "Quantitative Aptitude",
        "Question": "What is the next number in the series: 2, 6, 12, 20, 30, ...?",
        "Option A": "40",
        "Option B": "42",
        "Option C": "44",
        "Option D": "46",
        "Correct Answer": "B",
        "Marks": 2,
        "Code Snippet": "",
        "Image URL": ""
      },
      {
        "Section": "Logical Reasoning",
        "Question": "Identify the missing pattern from the diagram in the URL link.",
        "Option A": "Pattern A",
        "Option B": "Pattern B",
        "Option C": "Pattern C",
        "Option D": "Pattern D",
        "Correct Answer": "C",
        "Marks": 2,
        "Code Snippet": "",
        "Image URL": "https://picsum.photos/400/200?random=1"
      },
      {
        "Section": "Verbal Ability",
        "Question": "Find the synonym of 'ABANDON'.",
        "Option A": "Keep",
        "Option B": "Desert",
        "Option C": "Adopt",
        "Option D": "Support",
        "Correct Answer": "B",
        "Marks": 1,
        "Code Snippet": "",
        "Image URL": ""
      },
      {
        "Section": "Programming Logic / Pseudocode",
        "Question": "What value will be printed after executing this procedure?",
        "Option A": "4",
        "Option B": "10",
        "Option C": "15",
        "Option D": "20",
        "Correct Answer": "B",
        "Marks": 2,
        "Code Snippet": "INT count = 0\nFOR i = 1 TO 4\n  count = count + i\nENDFOR\nPRINT count",
        "Image URL": ""
      },
      {
        "Section": "Data Structures",
        "Question": "Which data structure follows LIFO (Last In First Out)?",
        "Option A": "Queue",
        "Option B": "Stack",
        "Option C": "Array",
        "Option D": "Linked List",
        "Correct Answer": "B",
        "Marks": 2,
        "Code Snippet": "",
        "Image URL": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions Template");
    XLSX.writeFile(workbook, "SecureExamPro_Template.xlsx");
  };

  const handleCreate = async () => {
    if (!title || !code || !duration || !file) {
      toast({
        title: "Missing fields",
        description: "Fill all fields and upload Excel file",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("examCode", code.toUpperCase());
      formData.append("duration", duration);
      formData.append(
        "startTime",
        startTime ? new Date(startTime).toISOString() : "",
      );

      formData.append(
        "endTime",
        endTime ? new Date(endTime).toISOString() : "",
      );

      formData.append("adminEmail", "coreadmin@secureexam.com");
      formData.append("file", file);
      formData.append("cameraMonitor", String(cameraMonitor));

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
          max-w-lg w-full
          max-h-[85vh] overflow-y-auto
          rounded-2xl border border-slate-200 shadow-2xl p-6
        "
      >
        {/* 🔥 LOADER OVERLAY */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
            <Loader />
          </div>
        )}
        <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
          <DialogTitle className="text-xl font-bold text-slate-900">Create Placement Assessment</DialogTitle>
        </DialogHeader>

        <div
          className={`space-y-5 ${loading ? "pointer-events-none opacity-40" : ""}`}
        >
          {/* Card 1: Basic Information */}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">1. Basic Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Exam Title</Label>
                <Input
                  placeholder="e.g. Quantitative Aptitude"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white border-slate-200 focus-visible:ring-blue-500 text-sm h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Exam Code</Label>
                <Input
                  placeholder="e.g. APT2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="bg-white border-slate-200 focus-visible:ring-blue-500 text-sm h-10 font-mono tracking-wider"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Scheduling & Timings */}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">2. Assessment Timings</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Duration (min)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-white border-slate-200 focus-visible:ring-blue-500 text-sm h-10"
                />
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

          {/* Card 3: Security & Proctoring */}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">3. Security Enforcements</h3>
            <div className="flex items-center space-x-3 py-1">
              <input
                type="checkbox"
                id="cameraMonitor"
                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={cameraMonitor}
                onChange={(e) => setCameraMonitor(e.target.checked)}
              />
              <Label htmlFor="cameraMonitor" className="cursor-pointer font-semibold text-slate-700 text-xs select-none leading-tight">
                Enable AI webcam proctoring check (face turns & coverage alerts)
              </Label>
            </div>
          </div>

          {/* Card 4: Questions Import */}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3 text-left">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">4. Question Source Pool</h3>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 text-[11px]"
                onClick={downloadSampleTemplate}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Template
              </Button>
            </div>
            <div
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white p-5 hover:bg-blue-50/20 transition-all text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-7 w-7 text-slate-400" />
              <p className="text-xs font-semibold text-slate-600">
                {file?.name || "Click to upload Excel spreadsheet (.xlsx)"}
              </p>
              <p className="text-[10px] text-slate-400 leading-normal max-w-[280px]">
                Must define columns: Section, Question, Option A, Option B, Option C, Option D, Correct Answer, Marks, Code Snippet, Image URL.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

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

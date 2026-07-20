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
  const [cameraMonitor, setCameraMonitor] = useState(false);
  const [dispatchPolicy, setDispatchPolicy] = useState("none");

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
    setCameraMonitor(false);
    setDispatchPolicy("none");
  };

  // Just preview parse (backend still validates)
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

        setQuestionsCount(rows.length);
        setParsedQuestions(rows);

        const marksSum = rows.reduce(
          (sum, r) => sum + Number(r["Marks"] || 1),
          0,
        );

        setTotalMarks(marksSum);
      } catch {
        setParseError("Invalid Excel format.");
        setParsedQuestions([]);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const downloadSampleTemplate = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering file input click

    const XLSX = await import("xlsx");
    const sampleData = [
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
      formData.append("dispatchPolicy", dispatchPolicy);

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

          {/* Card 3: Email Dispatch Policy */}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">3. Email & Results Dispatch</h3>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Results Delivery Option</Label>
              <select
                value={dispatchPolicy}
                onChange={(e) => setDispatchPolicy(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-250 bg-white text-xs font-bold text-slate-750 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="none">Don't Send Results (Keep Private)</option>
                <option value="automatic">Send Automatically after response is submitted</option>
                <option value="manual">Send Manually from Admin dashboard</option>
              </select>
            </div>
          </div>

          {/* Card 4: Security & Proctoring */}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">4. Security Enforcements</h3>
            <p className="text-[11px] text-slate-500">
              Standard secure fullscreen browser security and copy/paste/right-click block lockouts are active for this assessment drive.
            </p>
          </div>

          {/* Card 5: Questions Import */}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3 text-left">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">5. Question Source Pool</h3>
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
                Must define columns: Section, Question, Option A, Option B, Option C, Option D, Correct Answer, Marks, Negative Marks, Code Snippet, Image URL. For multiple correct options, separate correct answers with commas (e.g. A,C).
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

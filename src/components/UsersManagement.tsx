import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Upload,
  KeyRound,
  Mail,
  UserCheck,
  Shield,
  CheckCircle2,
  AlertCircle,
  Hash,
  Search,
  Plus,
  Eye,
  EyeOff,
  Download,
  Globe,
  Link2,
  FileCode,
  CheckCircle,
  FolderPlus,
  Pencil,
  Trash2,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Swal from "sweetalert2";
import axiosInstance from "@/config/axiosClient";
import * as XLSX from "xlsx";

export const UsersManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"examiners" | "students" | "bulk">("examiners");

  // Examiners list & form state
  const [examiners, setExaminers] = useState<any[]>([]);
  const [exName, setExName] = useState("");
  const [exEmail, setExEmail] = useState("");
  const [exPassword, setExPassword] = useState("");
  const [creatingEx, setCreatingEx] = useState(false);

  // Students list state
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllPins, setShowAllPins] = useState(false);
  const [visiblePinsMap, setVisiblePinsMap] = useState<Record<string, boolean>>({});

  // Bulk import & Student Provisioning state
  const [bulkText, setBulkText] = useState("");
  const [importing, setImporting] = useState(false);

  // Single student creation state
  const [singleRegId, setSingleRegId] = useState("");
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singlePin, setSinglePin] = useState("");
  const [creatingSingle, setCreatingSingle] = useState(false);

  // Edit Student modal state
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editRegId, setEditRegId] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPin, setEditPin] = useState("");
  const [updatingStudent, setUpdatingStudent] = useState(false);

  const handleOpenEditStudent = (st: any) => {
    setEditingStudent(st);
    setEditName(st.name || "");
    setEditRegId(st.registerId || st.rollNumber || "");
    setEditEmail(st.email || "");
    setEditPin(st.pin || "123456");
  };

  const handleUpdateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setUpdatingStudent(true);
    try {
      await axiosInstance.put(`/auth/student/${editingStudent._id}`, {
        name: editName,
        registerId: editRegId,
        email: editEmail,
        pin: editPin,
      });

      setEditingStudent(null);
      fetchUsers();

      Swal.fire({
        title: "Student Updated",
        text: `Student record updated successfully.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to update student account", "error");
    } finally {
      setUpdatingStudent(false);
    }
  };

  const handleDeleteStudent = async (st: any) => {
    const confirm = await Swal.fire({
      title: "Delete Student Account?",
      text: `Are you sure you want to delete ${st.name} (${st.registerId || st.email})? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Delete Student",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/auth/student/${st._id}`);
        fetchUsers();
        Swal.fire("Deleted", "Student account deleted successfully.", "success");
      } catch (err: any) {
        Swal.fire("Error", err?.response?.data?.message || "Failed to delete student account", "error");
      }
    }
  };

  const handleDeleteNARecords = async () => {
    const confirm = await Swal.fire({
      title: "Purge N/A Student Records?",
      text: "Are you sure you want to delete all student records with missing or N/A Roll Numbers? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Purge N/A Records",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axiosInstance.delete("/auth/students/cleanup-na");
        fetchUsers();
        Swal.fire("Purge Complete", res.data.message || "All N/A student records removed.", "success");
      } catch (err: any) {
        Swal.fire("Error", err?.response?.data?.message || "Failed to purge N/A records", "error");
      }
    }
  };

  // File & Google Sheet import state
  const [filePreviewData, setFilePreviewData] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [fetchingGoogleSheet, setFetchingGoogleSheet] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSingleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleRegId.trim()) {
      Swal.fire("Required Field", "Register ID / Roll Number is required.", "warning");
      return;
    }

    setCreatingSingle(true);
    try {
      const regId = singleRegId.trim().toUpperCase();
      const studentObj = {
        registerId: regId,
        rollNumber: regId,
        name: singleName.trim() || regId,
        email: singleEmail.trim().toLowerCase() || `${regId.toLowerCase()}@student.local`,
        pin: singlePin.trim() || Math.floor(100000 + Math.random() * 900000).toString(),
      };

      await axiosInstance.post("/auth/bulk-import-students", {
        students: [studentObj],
      });

      setSingleRegId("");
      setSingleName("");
      setSingleEmail("");
      setSinglePin("");
      fetchUsers();

      Swal.fire({
        title: "Student Added",
        text: `Student ${studentObj.registerId} successfully registered in database.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to create student record", "error");
    } finally {
      setCreatingSingle(false);
    }
  };

  const downloadExcelTemplate = () => {
    const sampleData = [
      {
        "Register ID": "23691A3343",
        "Full Name": "Lakshmi Sagar",
        "Email Address": "student1@college.edu",
        "6-Digit PIN": "123456"
      },
      {
        "Register ID": "23691A3344",
        "Full Name": "Rahul Verma",
        "Email Address": "student2@college.edu",
        "6-Digit PIN": "654321"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Student_Import_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { raw: false });

        const parsed = data.map((row: any) => {
          const keys = Object.keys(row);
          const regKey = keys.find(k => k.toLowerCase().includes("register") || k.toLowerCase().includes("roll") || k.toLowerCase().includes("id")) || keys[0];
          const nameKey = keys.find(k => k.toLowerCase().includes("name")) || keys[1];
          const emailKey = keys.find(k => k.toLowerCase().includes("email")) || keys[2];
          const pinKey = keys.find(k => k.toLowerCase().includes("pin") || k.toLowerCase().includes("pass")) || keys[3];

          const regVal = row[regKey] ? row[regKey].toString().trim().toUpperCase() : "";
          return {
            registerId: regVal,
            rollNumber: regVal,
            name: row[nameKey] ? row[nameKey].toString().trim() : regVal,
            email: row[emailKey] ? row[emailKey].toString().trim().toLowerCase() : `${regVal.toLowerCase()}@student.local`,
            pin: row[pinKey] ? row[pinKey].toString().trim() : Math.floor(100000 + Math.random() * 900000).toString(),
          };
        }).filter(s => s.registerId);

        setFilePreviewData(parsed);
        Swal.fire("File Loaded", `Parsed ${parsed.length} student records from ${file.name}. Review below and click 'Commit to DB'.`, "success");
      } catch (err) {
        Swal.fire("Parse Error", "Failed to parse file. Ensure it is a valid Excel or CSV file.", "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFetchGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      Swal.fire("Required", "Please enter a valid Google Sheet public CSV link.", "warning");
      return;
    }

    setFetchingGoogleSheet(true);
    try {
      let csvUrl = googleSheetUrl.trim();
      if (csvUrl.includes("/edit")) {
        csvUrl = csvUrl.replace(/\/edit.*$/, "/export?format=csv");
      }

      const res = await fetch(csvUrl);
      const text = await res.text();

      const lines = text.trim().split("\n");
      const parsed = lines.map((line, idx) => {
        if (idx === 0 && (line.toLowerCase().includes("register") || line.toLowerCase().includes("email"))) return null;
        const parts = line.split(/[,;\t]/).map(p => p.replace(/^"|"$/g, "").trim());
        if (parts.length < 1 || !parts[0]) return null;

        const regVal = parts[0].toUpperCase();
        return {
          registerId: regVal,
          rollNumber: regVal,
          name: parts[1] || regVal,
          email: parts[2] ? parts[2].toLowerCase() : `${regVal.toLowerCase()}@student.local`,
          pin: parts[3] || Math.floor(100000 + Math.random() * 900000).toString(),
        };
      }).filter(Boolean);

      setFilePreviewData(parsed as any[]);
      setFileName("Google Sheet Live Link Data");
      Swal.fire("Google Sheet Synced", `Successfully loaded ${parsed.length} student records from Google Sheet. Review below and click 'Commit to DB'.`, "success");
    } catch (err) {
      Swal.fire("Fetch Error", "Failed to fetch Google Sheet data. Make sure the link is publicly accessible.", "error");
    } finally {
      setFetchingGoogleSheet(false);
    }
  };

  const handleCommitPreviewToDB = async () => {
    if (filePreviewData.length === 0) return;

    setImporting(true);
    try {
      const res = await axiosInstance.post("/auth/bulk-import-students", {
        students: filePreviewData,
      });

      setFilePreviewData([]);
      setFileName("");
      fetchUsers();

      Swal.fire({
        title: "Import Complete",
        text: res.data.message || `Successfully committed ${filePreviewData.length} records to database.`,
        icon: "success",
      });
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to commit records to database", "error");
    } finally {
      setImporting(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [exRes, stRes] = await Promise.all([
        axiosInstance.get("/auth/examiners"),
        axiosInstance.get("/auth/students"),
      ]);
      setExaminers(exRes.data || []);
      setStudents(stRes.data || []);
    } catch (err) {
      console.error("Failed to load user management data", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateExaminer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exName || !exEmail || !exPassword) return;

    setCreatingEx(true);
    try {
      await axiosInstance.post("/auth/create-examiner", {
        name: exName,
        email: exEmail,
        password: exPassword,
      });

      setExName("");
      setExEmail("");
      setExPassword("");
      fetchUsers();

      Swal.fire({
        title: "Examiner Created",
        text: `Examiner account for ${exEmail} created successfully.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to create examiner account", "error");
    } finally {
      setCreatingEx(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setImporting(true);
    try {
      // Parse CSV / TSV / lines formatted as: RegisterID, Name, Email, PIN
      const lines = bulkText.trim().split("\n");
      const parsedStudents = lines.map((line) => {
        const parts = line.split(/[,;\t]/).map((p) => p.trim());
        return {
          registerId: parts[0] || "",
          name: parts[1] || parts[0] || "Student",
          email: parts[2] || `${(parts[0] || "student").toLowerCase()}@student.local`,
          pin: parts[3] || Math.floor(100000 + Math.random() * 900000).toString(),
        };
      }).filter((s) => s.registerId.length > 0);

      if (parsedStudents.length === 0) {
        Swal.fire("Validation Error", "No valid student rows found. Format: RegisterID, Name, Email, 6-digit PIN", "warning");
        setImporting(false);
        return;
      }

      const res = await axiosInstance.post("/auth/bulk-import-students", {
        students: parsedStudents,
      });

      setBulkText("");
      fetchUsers();

      Swal.fire({
        title: "Bulk Import Finished",
        text: res.data.message || `Processed ${parsedStudents.length} student records.`,
        icon: "success",
      });
    } catch (err: any) {
      Swal.fire("Import Failed", err?.response?.data?.message || "Failed to import student records", "error");
    } finally {
      setImporting(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.registerId || s.rollNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" /> Multi-Role User Directory & Bulk Student Provisioning
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Examiners, Student Accounts & PIN Administration
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Create examiner personnel accounts, view registered candidates, and bulk import student records with initial 6-digit PINs.
          </p>
        </div>

        {/* Sub-tab Toggle */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveSubTab("examiners")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "examiners" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Examiners ({examiners.length})
          </button>
          <button
            onClick={() => setActiveSubTab("students")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "students" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveSubTab("bulk")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "bulk" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Bulk Student Import
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: EXAMINERS */}
      {activeSubTab === "examiners" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Examiner Form */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" /> Create Examiner Account
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Examiners can create assessments and manage result releases for their own exams.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateExaminer} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-bold text-slate-700">Examiner Full Name</Label>
                  <Input
                    placeholder="Dr. Rajesh Sharma"
                    value={exName}
                    onChange={(e) => setExName(e.target.value)}
                    className="text-sm font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-bold text-slate-700">Examiner Email Address</Label>
                  <Input
                    type="email"
                    placeholder="rajesh@college.edu"
                    value={exEmail}
                    onChange={(e) => setExEmail(e.target.value)}
                    className="text-sm font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-bold text-slate-700">Initial Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={exPassword}
                    onChange={(e) => setExPassword(e.target.value)}
                    className="text-sm font-semibold"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={creatingEx}
                  className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs h-11 rounded-xl shadow-md"
                >
                  {creatingEx ? "Registering..." : "Create Examiner Personnel"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Examiner List */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" /> Active Examiner Personnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {examiners.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No examiner accounts created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {examiners.map((ex) => (
                    <div
                      key={ex._id}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                          {ex.name?.charAt(0).toUpperCase() || "E"}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{ex.name}</h4>
                          <span className="text-xs text-slate-500">{ex.email}</span>
                        </div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 text-[10px] font-bold">
                        EXAMINER
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUB-TAB 2: STUDENTS DIRECTORY */}
      {activeSubTab === "students" && (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-600" /> Registered Student Accounts
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Students log in using Register ID and 6-Digit PIN.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by Register ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAllPins(!showAllPins)}
                className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 border-slate-300 shrink-0 shadow-sm"
              >
                {showAllPins ? <EyeOff className="h-4 w-4 text-red-500" /> : <Eye className="h-4 w-4 text-blue-600" />}
                {showAllPins ? "Hide All PINs" : "Show All PINs"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeleteNARecords}
                className="text-xs font-extrabold text-red-700 hover:bg-red-50 border-red-300 shrink-0 shadow-sm gap-1.5"
              >
                <Trash2 className="h-4 w-4 text-red-600" /> Purge N/A Records
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No matching student records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase">
                      <th className="p-3">Register ID / Roll</th>
                      <th className="p-3">Candidate Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Assigned 6-Digit PIN</th>
                      <th className="p-3">PIN Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((st) => {
                      const isPinVisible = showAllPins || visiblePinsMap[st._id];
                      return (
                        <tr key={st._id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {st.registerId || st.rollNumber || "N/A"}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{st.name}</td>
                          <td className="p-3 text-slate-600 font-mono text-[11px]">{st.email}</td>
                          <td className="p-3 font-mono font-extrabold text-blue-700 tracking-wider">
                            <div className="flex items-center gap-2">
                              <span className={isPinVisible ? "bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono text-xs" : "text-slate-400 font-mono"}>
                                {isPinVisible ? (st.pin || "123456") : "••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setVisiblePinsMap((prev) => ({
                                    ...prev,
                                    [st._id]: !prev[st._id],
                                  }))
                                }
                                className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-slate-100"
                                title={isPinVisible ? "Hide PIN" : "View PIN"}
                              >
                                {isPinVisible ? (
                                  <EyeOff className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-blue-600" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`text-[10px] ${
                                st.isPinUpdated
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {st.isPinUpdated ? "PIN Customised by Student" : "Initial Admin PIN"}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditStudent(st)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit Student Details"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStudent(st)}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete Student Account"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* EDIT STUDENT MODAL DIALOG */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-base">Edit Student Account</h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStudentSubmit} className="p-6 space-y-4 text-left">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Candidate Full Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Register ID / Roll Number</Label>
                <Input
                  value={editRegId}
                  onChange={(e) => setEditRegId(e.target.value.toUpperCase())}
                  placeholder="Register ID"
                  required
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">6-Digit Access PIN</Label>
                <Input
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  placeholder="6-Digit PIN"
                  required
                  className="text-xs h-9 font-mono font-bold text-blue-700 tracking-wider"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStudent(null)}
                  className="text-xs font-bold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatingStudent}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-2 shadow-sm"
                >
                  {updatingStudent ? "Saving..." : "Update Student Details"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STUDENT PROVISIONING & BULK IMPORT SUITE */}
      {activeSubTab === "bulk" && (
        <div className="space-y-6">
          {/* OPTION A: ADD SINGLE STUDENT */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" /> Add Single Student Account
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Instantly provision an individual candidate into the platform database.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSingleStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Register ID / Roll Number *</Label>
                    <Input
                      placeholder="e.g. 23691A3343"
                      value={singleRegId}
                      onChange={(e) => setSingleRegId(e.target.value.toUpperCase())}
                      required
                      className="bg-white text-xs h-9 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Candidate Name</Label>
                    <Input
                      placeholder="e.g. Lakshmi Sagar"
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      className="bg-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="e.g. student1@college.edu"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      className="bg-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Initial 6-Digit PIN</Label>
                    <Input
                      placeholder="Auto-generated if empty"
                      value={singlePin}
                      onChange={(e) => setSinglePin(e.target.value)}
                      className="bg-white text-xs h-9 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={creatingSingle}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-2 shadow-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    {creatingSingle ? "Creating Student..." : "Create Student Account"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* OPTION B & C: EXCEL UPLOAD & GOOGLE SHEETS LIVE SYNC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EXCEL / CSV UPLOADER */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl flex flex-col">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Excel / CSV Bulk File Upload
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadExcelTemplate}
                    className="text-[11px] font-extrabold text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8 gap-1.5 shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Excel Format Template
                  </Button>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Upload <code>.xlsx</code> or <code>.csv</code> formatted student roster files.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1 space-y-4 text-left">
                {/* Excel Format Requirement Box */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1 text-xs">
                  <span className="font-extrabold text-emerald-950 block">Excel Column Format Specifications:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[11px] font-mono text-emerald-900">
                    <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">Register ID</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">Full Name</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">Email Address</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">6-Digit PIN</span>
                  </div>
                </div>

                <div
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20 p-6 transition-all text-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-emerald-600" />
                  <p className="text-xs font-bold text-slate-700">
                    {fileName ? `Loaded: ${fileName}` : "Click to Upload Excel / CSV Roster (.xlsx, .csv)"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Automated header detection matching Register ID, Name, Email, and 6-Digit PIN columns.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </CardContent>
            </Card>

            {/* GOOGLE SHEETS SYNC */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl flex flex-col">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-600" /> Google Sheets Live Link Sync
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Paste published Google Sheets CSV URL to fetch live student data instantly.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1 space-y-4 text-left">
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
                  <span className="font-extrabold block">How to get Google Sheet Link:</span>
                  <p className="text-[11px] text-indigo-800 leading-normal">
                    In Google Sheets, click <strong>File ➔ Share ➔ Publish to Web</strong>, select <strong>CSV</strong>, and copy the published URL.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Google Sheet Public CSV URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      className="bg-white text-xs h-10 font-mono"
                    />
                    <Button
                      type="button"
                      disabled={fetchingGoogleSheet}
                      onClick={handleFetchGoogleSheet}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-4 rounded-xl shrink-0 gap-1.5 shadow-sm"
                    >
                      <Link2 className="h-4 w-4" />
                      {fetchingGoogleSheet ? "Fetching..." : "Fetch Data"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PARSED PREVIEW TABLE & COMMIT TO DATABASE */}
          {filePreviewData.length > 0 && (
            <Card className="border-2 border-emerald-500 shadow-lg bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-emerald-950 text-white flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" /> Loaded Roster Preview ({filePreviewData.length} Students)
                  </CardTitle>
                  <CardDescription className="text-xs text-emerald-200">
                    Source: {fileName}. Review parsed records below before saving to database.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilePreviewData([]);
                      setFileName("");
                    }}
                    className="text-xs text-white border-white/30 hover:bg-white/10"
                  >
                    Clear Preview
                  </Button>
                  <Button
                    type="button"
                    disabled={importing}
                    onClick={handleCommitPreviewToDB}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs h-9 px-4 rounded-xl gap-2 shadow-md"
                  >
                    <Upload className="h-4 w-4" />
                    {importing ? "Saving to DB..." : `Commit ${filePreviewData.length} Students to Database`}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3 border-b">#</th>
                        <th className="p-3 border-b">Register ID</th>
                        <th className="p-3 border-b">Candidate Name</th>
                        <th className="p-3 border-b">Email Address</th>
                        <th className="p-3 border-b">Assigned 6-Digit PIN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filePreviewData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 font-mono">
                          <td className="p-3 text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{row.registerId}</td>
                          <td className="p-3 font-sans font-semibold text-slate-800">{row.name}</td>
                          <td className="p-3 text-slate-600 text-[11px]">{row.email}</td>
                          <td className="p-3 font-bold text-blue-700">{row.pin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* OPTION D: RAW MULTI-LINE CSV / TSV TEXT PASTE */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="h-5 w-5 text-slate-700" /> Quick Raw CSV / TSV Text Paste
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Paste raw comma or tab-separated student records formatted as: <code>RegisterID, Full Name, Email, 6-Digit PIN</code> (one per line).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleBulkImport} className="space-y-4">
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-bold text-slate-700">
                    Raw Student Roster Data
                  </Label>
                  <textarea
                    rows={6}
                    placeholder={`23691A3343, Lakshmi Sagar, student1@college.edu, 123456\n23691A3344, Rahul Verma, student2@college.edu, 654321`}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span>If PIN is omitted from a row, a random 6-digit PIN will be auto-assigned.</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={importing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl gap-2 shadow-md"
                  >
                    <Upload className="h-4 w-4" />
                    {importing ? "Importing..." : "Process Text Roster"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;

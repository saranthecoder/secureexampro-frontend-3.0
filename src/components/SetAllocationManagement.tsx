import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Users,
  Shuffle,
  RefreshCw,
  Search,
  Clock,
  FileCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Swal from "sweetalert2";
import BASE_URL from "@/config/api";

interface SetAllocationManagementProps {
  exams: any[];
  onRefreshExams?: () => void;
}

export const SetAllocationManagement: React.FC<SetAllocationManagementProps> = ({
  exams,
  onRefreshExams
}) => {
  const [selectedExamCode, setSelectedExamCode] = useState<string>("");
  const [activeCandidates, setActiveCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Filter exams that have multi-set papers or are set-based assessments
  const setBasedExams = useMemo(() => {
    return exams.filter(
      (ex) =>
        ex.assessmentType === "online_coding" ||
        ex.assessmentType === "paper_code" ||
        ex.assessmentType === "coding_hybrid" ||
        (ex.questionSets && ex.questionSets.length > 0)
    );
  }, [exams]);

  const targetExamList = setBasedExams.length > 0 ? setBasedExams : exams;

  // Default to first exam if none selected
  useEffect(() => {
    if (!selectedExamCode && targetExamList.length > 0) {
      setSelectedExamCode(targetExamList[0].examCode);
    }
  }, [targetExamList, selectedExamCode]);

  const currentExam = useMemo(() => {
    return exams.find((ex) => ex.examCode === selectedExamCode) || null;
  }, [exams, selectedExamCode]);

  const availableSets = useMemo(() => {
    if (!currentExam) return ["Set A", "Set B", "Set C", "Set D"];
    if (currentExam.questionSets && currentExam.questionSets.length > 0) {
      return currentExam.questionSets.map((s: any) => s.setName || s.title || `Set ${s.setName}`);
    }
    return ["Set A", "Set B", "Set C", "Set D"];
  }, [currentExam]);

  const fetchLobbyCandidates = useCallback(async () => {
    if (!selectedExamCode) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/exam/active-candidates/${selectedExamCode}`);
      const data = await res.json();
      if (res.ok && data) {
        let list: any[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (Array.isArray(data.candidates)) {
          list = data.candidates;
        } else if (typeof data === "object") {
          list = Object.keys(data).map((emailKey) => ({
            studentEmail: emailKey,
            studentName: data[emailKey].name || data[emailKey].studentName || emailKey,
            rollNumber: data[emailKey].rollNumber || "",
            assignedSet: data[emailKey].assignedSet || "",
            codingPhase: data[emailKey].codingPhase || "lobby",
            isOffline: data[emailKey].isOffline || false,
            ...data[emailKey]
          }));
        }
        setActiveCandidates(list);
      } else {
        setActiveCandidates([]);
      }
    } catch (err) {
      console.error("Failed to fetch lobby candidates:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedExamCode]);

  useEffect(() => {
    fetchLobbyCandidates();
    const interval = setInterval(fetchLobbyCandidates, 5000);
    return () => clearInterval(interval);
  }, [fetchLobbyCandidates]);

  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return activeCandidates;
    const term = searchTerm.toLowerCase().trim();
    return activeCandidates.filter(
      (c) =>
        (c.studentName && c.studentName.toLowerCase().includes(term)) ||
        (c.studentEmail && c.studentEmail.toLowerCase().includes(term)) ||
        (c.assignedSet && c.assignedSet.toLowerCase().includes(term))
    );
  }, [activeCandidates, searchTerm]);

  const handleAssignSingleSet = async (email: string, setName: string) => {
    if (!selectedExamCode || !email) return;
    try {
      const res = await fetch(
        `${BASE_URL}/exam/coding/assign-set/${selectedExamCode}/${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedSet: setName }),
        }
      );

      if (res.ok) {
        fetchLobbyCandidates();
        Swal.fire({
          title: "Question Set Allocated",
          text: `Successfully allocated ${setName} to ${email}`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      Swal.fire("Error", "Failed to allocate set to student", "error");
    }
  };

  const handleBulkAutoAssignEvenly = async () => {
    if (!selectedExamCode || activeCandidates.length === 0) return;
    setAssigning(true);
    try {
      const unassignedCandidates = activeCandidates.filter((c) => !c.assignedSet);
      const targetList = unassignedCandidates.length > 0 ? unassignedCandidates : activeCandidates;

      for (let i = 0; i < targetList.length; i++) {
        const candidate = targetList[i];
        const assignedSet = availableSets[i % availableSets.length];
        await fetch(
          `${BASE_URL}/exam/coding/assign-set/${selectedExamCode}/${encodeURIComponent(candidate.studentEmail)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignedSet }),
          }
        );
      }

      fetchLobbyCandidates();
      Swal.fire({
        title: "Bulk Allocation Complete",
        text: `Equitably distributed ${availableSets.join(", ")} across ${targetList.length} candidate(s)!`,
        icon: "success",
      });
    } catch (err) {
      Swal.fire("Error", "Failed to complete bulk set allocation.", "error");
    } finally {
      setAssigning(false);
    }
  };

  const unassignedCount = activeCandidates.filter((c) => !c.assignedSet).length;
  const assignedCount = activeCandidates.filter((c) => c.assignedSet).length;

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="h-4 w-4" /> Lobby Question Paper Set Allocation Desk
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Pre-Exam Lobby Set Assignment & Candidate Dispatch
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Assign Set A, Set B, Set C, Set D question papers to students waiting in the lobby prior to exam entry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              fetchLobbyCandidates();
              if (onRefreshExams) onRefreshExams();
            }}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold gap-2 text-xs shadow-md rounded-xl h-10 border border-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Lobby
          </Button>

          <Button
            onClick={handleBulkAutoAssignEvenly}
            disabled={assigning || activeCandidates.length === 0}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black gap-2 text-xs shadow-lg rounded-xl h-10 px-4"
          >
            <Shuffle className="h-4 w-4" />
            {assigning ? "Distributing Sets..." : "Bulk Auto-Assign Sets (Equitable)"}
          </Button>
        </div>
      </div>

      {/* Select Assessment Picker & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-amber-600" /> Select Assessment Paper
              </span>
              {currentExam && (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-mono">
                  Code: {currentExam.examCode}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <select
                value={selectedExamCode}
                onChange={(e) => setSelectedExamCode(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {targetExamList.map((ex) => (
                  <option key={ex._id} value={ex.examCode}>
                    [{ex.examCode}] {ex.title} ({ex.assessmentType?.toUpperCase() || "STANDARD"})
                  </option>
                ))}
              </select>

              {currentExam && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-950">
                  <span>Available Question Paper Sets:</span>
                  <div className="flex items-center gap-1.5">
                    {availableSets.map((setName: string, idx: number) => (
                      <Badge key={idx} className="bg-white text-amber-900 border border-amber-300 font-mono font-bold">
                        {setName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> Lobby Telemetry Counter
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Unassigned (Lobby Locked)</span>
              <span className="text-2xl font-black text-amber-900">{unassignedCount}</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Set Allocated (Ready)</span>
              <span className="text-2xl font-black text-emerald-900">{assignedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lobby Candidates Table */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" /> Candidates Currently in Lobby ({activeCandidates.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Students waiting for paper set allocation before beginning exam session.
            </CardDescription>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search candidate name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs bg-white"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCandidates.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No active candidates waiting in the lobby for this assessment paper.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-3">#</th>
                    <th className="p-3">Candidate Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Lobby Status</th>
                    <th className="p-3">Allocated Question Set</th>
                    <th className="p-3 text-right">Assign / Change Set</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">{c.studentName || "Candidate"}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{c.studentEmail}</td>
                      <td className="p-3">
                        <Badge
                          className={`text-[10px] ${
                            c.assignedSet
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                          }`}
                        >
                          {c.assignedSet ? "Set Allocated (Unlocked)" : "Waiting for Set Allocation"}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono">
                        {c.assignedSet ? (
                          <Badge className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5">
                            {c.assignedSet}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 italic">None (Locked in Lobby)</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={c.assignedSet || ""}
                          onChange={(e) => handleAssignSingleSet(c.studentEmail, e.target.value)}
                          className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="" disabled>
                            -- Allocate Set --
                          </option>
                          {availableSets.map((setName: string, sIdx: number) => (
                            <option key={sIdx} value={setName}>
                              Allocate {setName}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SetAllocationManagement;

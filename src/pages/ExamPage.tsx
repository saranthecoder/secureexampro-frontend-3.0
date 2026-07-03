import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { useExamTimer } from "@/hooks/useExamTimer";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";
import { Badge } from "@/components/ui/badge";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Maximize,
  Send,
  Shield,
  CheckCircle2,
  Video,
  RefreshCw,
  Check,
  AlertCircle,
  HelpCircle,
  Play
} from "lucide-react";
import BASE_URL from "@/config/api";

const ExamPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [sections, setSections] = useState<any[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showNextSectionConfirm, setShowNextSectionConfirm] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [started, setStarted] = useState(false);

  // Lobby/countdown states
  const [timeLeftToStart, setTimeLeftToStart] = useState<number | null>(null);
  const [lobbyActive, setLobbyActive] = useState(false);
  const [showReadyPopup, setShowReadyPopup] = useState(false);

  // Webcam & AI Proctoring states & refs
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [proctorStatus, setProctorStatus] = useState<'monitoring' | 'warning' | 'default'>('default');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baselineFrame = useRef<Uint8ClampedArray | null>(null);
  const lastWarningTime = useRef<number | null>(null);
  const clockOffset = useRef<number>(0);

  // Live Screen Proctoring states
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenShared, setScreenShared] = useState(false);
  const [screenStatus, setScreenStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

  // Online / Offline states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineSyncPending, setOfflineSyncPending] = useState(false);
  const [isTerminatedByAdmin, setIsTerminatedByAdmin] = useState(false);

  // Callback ref to bind webcam stream immediately upon element mount/remount
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
    }
  }, [stream]);

  //===================
  //Shuffler
  //===================
  const shuffleArray = (array: any[]) => {
    const arr = [...array]; // avoid mutating original
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // 🔥 FETCH EXAM FROM BACKEND
  const fetchExam = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/exam/${code}`);
      const data = await res.json();

      if (data.serverTime) {
        const serverMs = new Date(data.serverTime).getTime();
        clockOffset.current = serverMs - Date.now();
      }

      if (!res.ok) {
        Swal.fire({
          title: "Unavailable",
          text: data.message || "Exam unavailable",
          icon: "error",
          confirmButtonColor: "#3b82f6"
        });
        navigate("/student");
        return;
      }

      // Force cameraMonitor to false
      data.cameraMonitor = false;

      // Check if not started yet (Lobby flow)
      if (data.notStartedYet) {
        setExam(data);
        setLobbyActive(true);
        const startMs = new Date(data.startTime).getTime();
        const calculateTimeLeft = () => {
          const currentServerMs = Date.now() + clockOffset.current;
          const diff = startMs - currentServerMs;
          if (diff <= 0) {
            // Clock drift: server thinks it is not started yet.
            // Wait 2 seconds before retrying to prevent rapid fetching.
            return 2;
          }
          return Math.floor(diff / 1000);
        };
        setTimeLeftToStart(calculateTimeLeft());
        return;
      }

      // 🔀 Group & Shuffle Questions by Section (Direct Start flow)
      const predefinedOrder = [
        "Quantitative Aptitude",
        "Logical Reasoning",
        "Verbal Ability",
        "Programming Logic / Pseudocode",
        "Data Structures",
      ];

      const grouped: { [key: string]: any[] } = {};
      data.questions.forEach((q: any) => {
        const sec = q.section || "General";
        if (!grouped[sec]) {
          grouped[sec] = [];
        }
        grouped[sec].push(q);
      });

      const sectionNames = Object.keys(grouped).sort((a, b) => {
        const idxA = predefinedOrder.findIndex((p) =>
          a.toLowerCase().includes(p.toLowerCase()),
        );
        const idxB = predefinedOrder.findIndex((p) =>
          b.toLowerCase().includes(p.toLowerCase()),
        );
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });

      const finalSections = sectionNames.map((name) => {
        const shuffledSectionQuestions = shuffleArray(grouped[name]).map(
          (q: any) => {
            const optionsArray = Object.entries(q.options).map(
              ([key, value]) => ({
                key,
                value,
              }),
            );
            const shuffledOptions = shuffleArray(optionsArray);
            return { ...q, shuffledOptions };
          },
        );
        return {
          name,
          questions: shuffledSectionQuestions,
        };
      });

      setSections(finalSections);

      const allQuestions = finalSections.flatMap((s) => s.questions);
      setExam({
        ...data,
        questions: allQuestions,
      });

      const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const cacheKey = `answers_${data.examCode}_${parsedUser.email}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          setAnswers(JSON.parse(cached));
        } catch {
          const initialAnswers = allQuestions.map((q: any) => ({
            questionId: q._id,
            selectedOption: null,
          }));
          setAnswers(initialAnswers);
        }
      } else {
        const initialAnswers = allQuestions.map((q: any) => ({
          questionId: q._id,
          selectedOption: null,
        }));
        setAnswers(initialAnswers);
      }
    } catch (err) {
      Swal.fire({
        title: "Server Error",
        text: "Server error occurred while loading this exam drive.",
        icon: "error",
        confirmButtonColor: "#3b82f6"
      });
      navigate("/student");
    } finally {
      setLoading(false);
    }
  }, [code, navigate]);

  useEffect(() => {
    if (code) {
      fetchExam();
    }
  }, [code, fetchExam]);

  // Screen sharing request handler
  const handleShareScreen = async () => {
    try {
      setScreenStatus('scanning');
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 1280 },
          height: { max: 720 },
          frameRate: { max: 5 }
        },
        audio: false
      });
      
      displayStream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setScreenShared(false);
        setScreenStatus('failed');
      };

      setScreenStream(displayStream);
      setScreenShared(true);
      setScreenStatus('success');
    } catch (err) {
      console.error("Screen share access denied:", err);
      setScreenShared(false);
      setScreenStatus('failed');
      Swal.fire({
        title: "Screen Share Required",
        text: "You must share your entire screen to write this exam.",
        icon: "warning",
        confirmButtonColor: "#3b82f6"
      });
    }
  };

  // Face recognition lobby states
  const [faceRecognized, setFaceRecognized] = useState(false);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [showFaceErrorPopup, setShowFaceErrorPopup] = useState(false);
  const [scanTrigger, setScanTrigger] = useState(0);

  // AI Face warning states
  const [faceWarningCount, setFaceWarningCount] = useState(0);
  const [showFaceWarningModal, setShowFaceWarningModal] = useState(false);
  const [faceWarningMessage, setFaceWarningMessage] = useState("");


  // Listen to network status change events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Countdown timer loop
  useEffect(() => {
    if (!lobbyActive || timeLeftToStart === null || !exam?.startTime) return;

    if (timeLeftToStart <= 0) {
      setShowReadyPopup(true);
      setLobbyActive(false);
      fetchExam(); // Fetch the full questions automatically once lobby ends!
      return;
    }

    const timerId = setTimeout(() => {
      const startMs = new Date(exam.startTime).getTime();
      const currentServerMs = Date.now() + clockOffset.current;
      const diff = startMs - currentServerMs;
      setTimeLeftToStart(diff > 0 ? Math.floor(diff / 1000) : 0);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [lobbyActive, timeLeftToStart, exam?.startTime, fetchExam]);

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start webcam stream when lobby is active and cameraMonitor is enabled
  useEffect(() => {
    if (!started && !submitted && exam?.cameraMonitor) {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        .then((s) => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.error("Camera access denied:", err);
          Swal.fire({
            title: "Camera Access Required",
            text: "This exam requires camera permissions. Please grant camera access to write the exam.",
            icon: "warning",
            confirmButtonColor: "#3b82f6"
          });
        });
    }
  }, [exam?.cameraMonitor, started, submitted]);

  // Bind camera stream to video element when available
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream, started]);

  // Stop camera stream when submitted
  useEffect(() => {
    if (submitted && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [submitted, stream]);

  // Stop screen capture stream when submitted or component unmounts
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [screenStream]);

  useEffect(() => {
    if (submitted && screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setScreenShared(false);
    }
  }, [submitted, screenStream]);

  // Lobby face verification effect
  useEffect(() => {
    if (!started && !submitted && exam?.cameraMonitor && stream) {
      setFaceVerificationStatus('scanning');
      setFaceRecognized(false);

      let framesChecked = 0;
      let validFrames = 0;

      const interval = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
          ctx.drawImage(video, 0, 0, 32, 32);
          const imgData = ctx.getImageData(0, 0, 32, 32);
          const pixels = imgData.data;

          let totalGray = 0;
          const grays: number[] = [];

          for (let i = 0; i < pixels.length; i += 4) {
            const gray = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
            totalGray += gray;
            grays.push(gray);
          }

          const avgGray = totalGray / grays.length;

          let sqDiffSum = 0;
          for (const g of grays) {
            sqDiffSum += (g - avgGray) * (g - avgGray);
          }
          const variance = sqDiffSum / grays.length;

          if (avgGray > 20 && avgGray < 240 && variance > 10) {
            validFrames++;
            baselineFrame.current = new Uint8ClampedArray(pixels);
          }

          framesChecked++;
          if (framesChecked >= 10) {
            clearInterval(interval);
            if (validFrames >= 7) {
              setFaceVerificationStatus('success');
              setFaceRecognized(true);
            } else {
              setFaceVerificationStatus('failed');
              setFaceRecognized(false);
              setShowFaceErrorPopup(true);
            }
          }
        } catch (e) {
          console.error("Lobby verification error:", e);
        }
      }, 250);

      return () => clearInterval(interval);
    } else if (!started && !submitted && !exam?.cameraMonitor) {
      setFaceRecognized(true);
      setFaceVerificationStatus('success');
    }
  }, [started, submitted, exam?.cameraMonitor, stream, scanTrigger]);






  // Automatically write current answers to localStorage on change
  useEffect(() => {
    const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (exam?.examCode && parsedUser?.email && answers.length > 0) {
      const cacheKey = `answers_${exam.examCode}_${parsedUser.email}`;
      localStorage.setItem(cacheKey, JSON.stringify(answers));
    }
  }, [answers, exam?.examCode]);

  // Background Sync function for offline submission
  const syncPendingSubmission = useCallback(async () => {
    const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!exam?.examCode || !parsedUser.email || offlineSyncPending || submitting || submitLock.current) return;

    const pendingKey = `pending_submission_${exam.examCode}_${parsedUser.email}`;
    const pendingData = localStorage.getItem(pendingKey);
    if (!pendingData) return;

    try {
      setOfflineSyncPending(true);
      const payload = JSON.parse(pendingData);
      
      const res = await fetch(`${BASE_URL}/exam/submit/${exam.examCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        localStorage.removeItem(pendingKey);
        localStorage.removeItem(`answers_${exam.examCode}_${parsedUser.email}`);
        setSubmitted(true);
        setShowConfirm(false);
        document.exitFullscreen?.().catch(() => {});
      } else {
        const errData = await res.json();
        if (errData.message === "Already submitted") {
          localStorage.removeItem(pendingKey);
          localStorage.removeItem(`answers_${exam.examCode}_${parsedUser.email}`);
          setSubmitted(true);
          setShowConfirm(false);
          document.exitFullscreen?.().catch(() => {});
        }
      }
    } catch (err) {
      console.error("Background sync failed:", err);
    } finally {
      setOfflineSyncPending(false);
    }
  }, [exam?.examCode, offlineSyncPending]);

  // Sync background submission if connection is restored
  useEffect(() => {
    if (isOnline) {
      syncPendingSubmission();
    }
  }, [isOnline, syncPendingSubmission]);

  // Periodic check for pending submission when online
  useEffect(() => {
    if (!submitted) {
      const interval = setInterval(() => {
        if (navigator.onLine) {
          syncPendingSubmission();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [submitted, syncPendingSubmission]);

  // =======================
  // 🔥 SAFE SUBMIT FUNCTION (NO CIRCULAR DEPENDENCY)
  // =======================

  const submitExam = async (
    finalTabSwitchCount: number,
    finalFaceWarningCount: number = 0,
    faceTurnTerminated: boolean = false
  ) => {
    if (submitting || submitLock.current || offlineSyncPending) return; // prevent double submit
    submitLock.current = true;

    const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const payload = {
      studentName: parsedUser.name,
      studentEmail: parsedUser.email,
      answers,
      terminated: finalTabSwitchCount >= 3 || faceTurnTerminated,
      tabSwitch: finalTabSwitchCount > 0,
      tabSwitchCount: finalTabSwitchCount,
      faceWarningCount: finalFaceWarningCount,
      faceTurnTerminated: faceTurnTerminated,
    };

    const pendingKey = `pending_submission_${exam.examCode}_${parsedUser.email}`;
    localStorage.setItem(pendingKey, JSON.stringify(payload));

    try {
      setSubmitting(true);

      const res = await fetch(`${BASE_URL}/exam/submit/${exam.examCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (navigator.onLine) {
          Swal.fire({
            title: "Submission Failed",
            text: data.message || "Submission failed",
            icon: "error",
            confirmButtonColor: "#3b82f6"
          });
          setSubmitting(false);
          submitLock.current = false;
          return;
        }
      }

      // Success: Clear locally stored progress and pending submissions
      localStorage.removeItem(pendingKey);
      localStorage.removeItem(`answers_${exam.examCode}_${parsedUser.email}`);

      setSubmitted(true);
      setShowConfirm(false);
      document.exitFullscreen?.().catch(() => {});
    } catch (error) {
      console.error("Network submission error:", error);
      if (!navigator.onLine) {
        Swal.fire({
          title: "Offline Save",
          text: "You are currently offline. Your exam progress has been safely saved locally. Keep this tab open—we will automatically synchronize your answers once your internet connection is restored.",
          icon: "info",
          confirmButtonColor: "#3b82f6"
        });
        setSubmitted(true);
        setShowConfirm(false);
        document.exitFullscreen?.().catch(() => {});
      } else {
        Swal.fire({
          title: "Server Error",
          text: "Submission failed due to a server error. We saved a local copy of your response; please retry.",
          icon: "error",
          confirmButtonColor: "#3b82f6"
        });
        submitLock.current = false;
      }
    } finally {
      setSubmitting(false);
    }
  };

  // =======================
  // 🔐 SECURITY HOOK (Tab switches & Fullscreen, max warnings: 3)
  // =======================

  const {
    tabSwitchCount,
    showWarning,
    warningMessage,
    dismissWarning,
    triggerWarning,
    enterFullscreen,
    exitFullscreen,
    isFullscreen,
  } = useExamSecurity({
    enabled: started && !submitted,
    maxWarnings: 3,
    onDisqualify: (count: number) => submitExam(count, faceWarningCount, false),
  });

  // AI Face turning warning handler (max warnings: 5)
  const handleFaceWarning = useCallback(() => {
    setFaceWarningCount((prev) => {
      const nextCount = prev + 1;
      if (nextCount >= 5) {
        setFaceWarningMessage("Head turn limit exceeded! auto-submitting...");
        submitExam(tabSwitchCount, nextCount, true);
      } else {
        setFaceWarningMessage(`Head turn detected! Please look straight at the screen. (Warning ${nextCount}/5)`);
        setShowFaceWarningModal(true);
      }
      return nextCount;
    });
  }, [tabSwitchCount, faceWarningCount]);

  const handleAdminTermination = useCallback(() => {
    if (isTerminatedByAdmin) return;
    setIsTerminatedByAdmin(true);
    submitExam(tabSwitchCount, faceWarningCount, true);
  }, [tabSwitchCount, faceWarningCount, isTerminatedByAdmin]);

  // AI Webcam face asymmetry analyzer
  const captureFrameAndAnalyze = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      ctx.drawImage(video, 0, 0, 32, 32);
      const imgData = ctx.getImageData(0, 0, 32, 32);
      const pixels = imgData.data;

      // Initialize the centered baseline on the first frame of the exam if not already captured in lobby
      if (!baselineFrame.current) {
        baselineFrame.current = new Uint8ClampedArray(pixels);
        return;
      }

      const baseline = baselineFrame.current;

      // Calculate global average intensity for current and baseline to correct for exposure/lighting shifts
      let totalCurrentGray = 0;
      let totalBaselineGray = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const currentGrayVal = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
        const baselineGrayVal = (baseline[i] + baseline[i+1] + baseline[i+2]) / 3;
        totalCurrentGray += currentGrayVal;
        totalBaselineGray += baselineGrayVal;
      }
      const avgCurrent = totalCurrentGray / 1024;
      const avgBaseline = totalBaselineGray / 1024;
      
      // Clamp brightness correction to prevent normalising away massive shifts like camera covering
      const brightnessCorrection = Math.max(-20, Math.min(20, avgBaseline - avgCurrent));

      let totalDiff = 0;
      let baseLeftIntensity = 0;
      let baseRightIntensity = 0;
      let currLeftIntensity = 0;
      let currRightIntensity = 0;

      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const idx = (y * 32 + x) * 4;
          const currentGrayRaw = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;
          // Apply brightness correction, clamping to [0, 255]
          const currentGray = Math.max(0, Math.min(255, currentGrayRaw + brightnessCorrection));
          const baseGray = (baseline[idx] + baseline[idx+1] + baseline[idx+2]) / 3;

          const diff = Math.abs(currentGray - baseGray);
          totalDiff += diff;

          // Compute left vs right intensities to detect asymmetry shifts
          if (x < 14) {
            baseLeftIntensity += baseGray;
            currLeftIntensity += currentGray;
          } else if (x > 17) {
            baseRightIntensity += baseGray;
            currRightIntensity += currentGray;
          }
        }
      }

      const normalizedAvgDiff = totalDiff / 1024;
      const baseRatio = Math.abs(baseLeftIntensity - baseRightIntensity) / (baseLeftIntensity + baseRightIntensity + 1);
      const currRatio = Math.abs(currLeftIntensity - currRightIntensity) / (currLeftIntensity + currRightIntensity + 1);
      const asymmetryShift = Math.abs(currRatio - baseRatio);

      // Heuristics:
      // normalizedAvgDiff > 25: Face covered, moved away from baseline, or massive change
      // asymmetryShift > 0.05: Looking/turning sideways compared to baseline pose
      const isCheating = normalizedAvgDiff > 25 || asymmetryShift > 0.05;

      if (isCheating) {
        setProctorStatus('warning');
        const now = Date.now();
        if (!lastWarningTime.current || now - lastWarningTime.current > 7000) {
          lastWarningTime.current = now;
          handleFaceWarning();
        }
      } else {
        setProctorStatus('monitoring');
        // Very slowly adapt baseline to lighting changes (only when looking straight/center)
        for (let i = 0; i < pixels.length; i++) {
          baseline[i] = baseline[i] * 0.99 + pixels[i] * 0.01;
        }
      }
    } catch (e) {
      console.error("Frame analysis error:", e);
    }
  }, [handleFaceWarning]);

  // Run active candidate heartbeat loop during the exam (and poll for admin termination status)
  useEffect(() => {
    if (!started || submitted || isTerminatedByAdmin) return;

    const sendHeartbeat = async () => {
      try {
        const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (!parsedUser.email || !exam?.examCode) return;

        const res = await fetch(`${BASE_URL}/exam/heartbeat/${exam.examCode}/${encodeURIComponent(parsedUser.email)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: parsedUser.name }),
        });
        const data = await res.json();
        if (data && data.terminated) {
          handleAdminTermination();
        }
      } catch (err) {
        console.error("Failed to send active status heartbeat:", err);
      }
    };

    sendHeartbeat();
    const intervalId = setInterval(sendHeartbeat, 5000);

    return () => clearInterval(intervalId);
  }, [started, submitted, isTerminatedByAdmin, exam?.examCode, handleAdminTermination]);

  const duration = exam?.duration ?? 0;

  // =======================
  // 🕒 TIMER HOOK
  // =======================

  const timer = useExamTimer(duration, () => submitExam(tabSwitchCount, faceWarningCount, false));

  // =======================
  // 🖱 NORMAL SUBMIT BUTTON
  // =======================

  const handleSubmit = () => {
    submitExam(tabSwitchCount, faceWarningCount, false);
  };

  const handleStart = async () => {
    if (timeLeftToStart !== null && timeLeftToStart > 0) {
      Swal.fire({
        title: "Lobby Active",
        text: "Please wait for the lobby timer to finish.",
        icon: "info",
        confirmButtonColor: "#3b82f6"
      });
      return;
    }

    if (exam?.cameraMonitor && !stream) {
      Swal.fire({
        title: "Camera Perms Required",
        text: "Camera stream is required. Please grant camera permission to start.",
        icon: "warning",
        confirmButtonColor: "#3b82f6"
      });
      return;
    }

    if (exam?.cameraMonitor && !faceRecognized) {
      setShowFaceErrorPopup(true);
      return;
    }

    if (sections.length > 0) {
      setStarted(true);
      enterFullscreen();
      timer.start();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/exam/${code}`);
      const data = await res.json();

      if (!res.ok || data.notStartedYet) {
        Swal.fire({
          title: "Exam Inactive",
          text: data.message || "Failed to start. Exam may not be active yet.",
          icon: "warning",
          confirmButtonColor: "#3b82f6"
        });
        return;
      }

      // Force cameraMonitor to false
      data.cameraMonitor = false;

      // 🔀 Group & Shuffle Questions by Section
      const predefinedOrder = [
        "Quantitative Aptitude",
        "Logical Reasoning",
        "Verbal Ability",
        "Programming Logic / Pseudocode",
        "Data Structures",
      ];

      const grouped: { [key: string]: any[] } = {};
      data.questions.forEach((q: any) => {
        const sec = q.section || "General";
        if (!grouped[sec]) {
          grouped[sec] = [];
        }
        grouped[sec].push(q);
      });

      const sectionNames = Object.keys(grouped).sort((a, b) => {
        const idxA = predefinedOrder.findIndex((p) =>
          a.toLowerCase().includes(p.toLowerCase()),
        );
        const idxB = predefinedOrder.findIndex((p) =>
          b.toLowerCase().includes(p.toLowerCase()),
        );
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });

      const finalSections = sectionNames.map((name) => {
        const shuffledSectionQuestions = shuffleArray(grouped[name]).map(
          (q: any) => {
            const optionsArray = Object.entries(q.options).map(
              ([key, value]) => ({
                key,
                value,
              }),
            );
            const shuffledOptions = shuffleArray(optionsArray);
            return { ...q, shuffledOptions };
          },
        );
        return {
          name,
          questions: shuffledSectionQuestions,
        };
      });

      setSections(finalSections);

      const allQuestions = finalSections.flatMap((s) => s.questions);
      setExam({
        ...data,
        questions: allQuestions,
      });

      const parsedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const cacheKey = `answers_${data.examCode}_${parsedUser.email}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          setAnswers(JSON.parse(cached));
        } catch {
          const initialAnswers = allQuestions.map((q: any) => ({
            questionId: q._id,
            selectedOption: null,
          }));
          setAnswers(initialAnswers);
        }
      } else {
        const initialAnswers = allQuestions.map((q: any) => ({
          questionId: q._id,
          selectedOption: null,
        }));
        setAnswers(initialAnswers);
      }
      setStarted(true);
      enterFullscreen();
      timer.start();
    } catch (err) {
      Swal.fire({
        title: "Start Error",
        text: "Error starting exam drive.",
        icon: "error",
        confirmButtonColor: "#3b82f6"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (questionId: string, option: string | null) => {
    setAnswers((prev) =>
      prev.map((a) => {
        if (a.questionId !== questionId) return a;
        if (option === null) return { ...a, selectedOption: null };

        // Find the question from exam to verify isMultipleCorrect
        const question = exam?.questions?.find((q: any) => q._id === questionId);
        const isMulti = question?.isMultipleCorrect || false;

        if (!isMulti) {
          return { ...a, selectedOption: option };
        }

        // Toggle selected option for checkbox style multiple correct answers
        const currentSelected = a.selectedOption
          ? a.selectedOption.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];

        let newSelected;
        if (currentSelected.includes(option)) {
          newSelected = currentSelected.filter((s: string) => s !== option);
        } else {
          newSelected = [...currentSelected, option];
        }

        newSelected.sort();
        return {
          ...a,
          selectedOption: newSelected.length > 0 ? newSelected.join(",") : null
        };
      })
    );
  };

  const currentSection = sections[currentSectionIndex];
  const currentSectionQuestions = currentSection?.questions || [];
  const currentQuestion = currentSectionQuestions[currentQuestionIndex];
  const totalQuestions = useMemo(() => {
    return sections.reduce((sum, sec) => sum + sec.questions.length, 0);
  }, [sections]);
  const answeredCount = answers.filter((a) => a.selectedOption).length;

  const parsedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return { name: "Candidate", email: "candidate@secureexam.com" };
    }
  }, []);

  const isQuestionAnswered = (qId: string) => {
    const ans = answers.find((a) => a.questionId === qId);
    return ans && ans.selectedOption !== null;
  };

  if (loading) {
    return <Loader />;
  }

  if (isTerminatedByAdmin) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center text-white p-6 font-sans">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-955/20 via-transparent to-slate-955/40 pointer-events-none" />
        
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black tracking-tight text-white font-mono">Exam Terminated</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your exam session has been terminated by the administrator. Any responses submitted up to this point have been saved.
            </p>
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-sm shadow-md transition-all rounded-xl"
            onClick={() => navigate("/student")}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-warning" />
          <h2 className="mb-2 text-2xl font-bold">Exam Not Found</h2>
          <Button onClick={() => navigate("/student")}>Go Back</Button>
        </div>
      </div>
    );
  }

  // =======================
  // RESULT SCREEN
  // =======================
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex rounded-full bg-success/10 p-4 text-success">
            <Shield className="h-10 w-10" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Exam Submitted</h1>
          <p className="mb-6 text-muted-foreground">{exam.title}</p>

          <div className="mb-8 rounded-xl border bg-card p-6 shadow-card">
            <p className="text-sm text-muted-foreground">Answered</p>
            <p className="mt-1 text-3xl font-bold">
              {answeredCount}/{totalQuestions}
            </p>

            <div className="mt-4 text-sm">
              Tab Switches:{" "}
              <span className={tabSwitchCount > 0 ? "text-warning" : ""}>
                {tabSwitchCount}
              </span>
            </div>
          </div>

          <Button onClick={() => navigate("/student")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // =======================
  // PRE START SCREEN
  // =======================
  if (!started) {
    const isWaiting = timeLeftToStart === null || timeLeftToStart > 0;
    const hasNegativeMarking = !!(exam?.hasNegativeMarking || exam.questions?.some((q: any) => (q.negativeMarks || 0) > 0));
    const maxNegativeMark = exam?.maxNegativeMark || exam.questions?.reduce((max: number, q: any) => Math.max(max, q.negativeMarks || 0), 0) || 0;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans text-slate-800">
        {!isOnline && (
          <div className="w-full max-w-5xl mb-4 bg-amber-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl text-center flex items-center justify-center gap-2 shadow-md animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Internet Disconnected. Caching is active. Please check your network connection.</span>
          </div>
        )}
        {/* READY POPUP */}
        {showReadyPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl w-[380px] text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900">Assessment Lobby Opened</h3>
                <p className="text-xs text-slate-500">
                  The lobby countdown has ended. You can now perform identity verification and begin the test.
                </p>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white w-full font-semibold"
                onClick={() => setShowReadyPopup(false)}
              >
                Okay, Understood
              </Button>
            </div>
          </div>
        )}

        {/* FACE ERROR POPUP */}
        {showFaceErrorPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl w-[420px] text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 animate-pulse">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-900">Identity Scan Rejected</h3>
                <p className="text-xs text-slate-500 leading-relaxed text-left max-w-sm mx-auto p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                  We could not verify your candidate profile. Please perform these quick checks:
                  <span className="block mt-1 text-[11px] space-y-1 text-slate-500 font-medium">
                    • Ensure your face is centered inside the camera scanner frame.
                    <br />
                    • Ensure your room has sufficient lighting (no bright backlight).
                    <br />
                    • Do not cover your webcam or wear accessories (sunglasses, hat).
                  </span>
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => navigate("/student")}
                >
                  Exit Portal
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  onClick={() => {
                    setScanTrigger(prev => prev + 1);
                    setFaceVerificationStatus('scanning');
                    setFaceRecognized(false);
                    setShowFaceErrorPopup(false);
                  }}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Retry Scan
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-12 items-stretch">
          
          {/* Left Column: Security & Guidelines */}
          <div className="lg:col-span-5 bg-slate-950 text-white p-6 md:p-8 flex flex-col justify-between space-y-6 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-slate-950/40 pointer-events-none" />
            
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs text-blue-400 font-semibold uppercase tracking-wider">
                <Shield className="h-3.5 w-3.5" />
                Assessment Security
              </div>
              <h2 className="text-xl font-bold tracking-tight">Lockdown Mode</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                This environment enforces academic integrity. Exiting fullscreen or navigating away will flag security violations.
              </p>
            </div>

            {/* Shield Logo Graphic */}
            <div className="relative z-10 w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col items-center justify-center max-w-sm mx-auto p-4 space-y-2">
              <Shield className="h-12 w-12 text-blue-500 animate-pulse" />
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Secure Exam Portal</div>
              <span className="text-[9px] text-slate-500 font-mono">Ver 2.1.0</span>
            </div>

            {/* Checklist items */}
            <div className="relative z-10 space-y-2 pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-900/50">
                <span className="text-slate-400 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Fullscreen Lockout
                </span>
                <span className="text-slate-200 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-900/50">
                <span className="text-slate-400 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Security Lockouts
                </span>
                <span className="text-slate-200 font-semibold">Enabled</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-400 flex items-center gap-2">
                  <Check className={`h-4 w-4 ${isOnline ? "text-emerald-400" : "text-red-500"}`} />
                  Network Connection
                </span>
                <span className={`font-semibold ${isOnline ? "text-emerald-400" : "text-red-500"}`}>{isOnline ? "Online" : "Offline"}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Guidelines & Flow & CTA */}
          <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-6 bg-white">
            
            {/* Header Details */}
            <div className="space-y-1.5 text-left">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{exam.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200/60 font-mono text-[10px] uppercase font-bold py-0.5 px-2.5">
                  Code: {exam.examCode}
                </Badge>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 animate-pulse text-blue-600" /> {exam.duration} Minutes
                </span>
                {exam.startTime && (
                  <span className="text-xs text-slate-400 font-medium">
                    • Start: {new Date(exam.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                )}
                {exam.endTime && (
                  <span className="text-xs text-slate-400 font-medium">
                    • End: {new Date(exam.endTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                )}
              </div>
            </div>

            {/* Active Timers Status Strip */}
            {isWaiting ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-pulse text-left">
                <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>Waiting for exam start window. Time remaining: {formatTimeLeft(timeLeftToStart)}</span>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-left">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Assessment drive is live. Verify identity to unlock the start button.</span>
              </div>
            )}

            {/* Instructions Cards */}
            <div className="space-y-4 text-left">
              <h3 className="font-bold text-slate-900 text-sm">Rules & Pacing Guidelines</h3>
              <div className="grid gap-3 text-xs">
                
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                    Proctoring Enforcements
                  </div>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    Do not exit fullscreen mode or switch browser tabs. Tab switches exceed 3 flags or head turns exceed 5 warnings will result in immediate **auto-submission**.
                  </p>
                </div>

                {hasNegativeMarking && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                    <div className="font-bold text-red-800 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-650" />
                      Negative Marking Active
                    </div>
                    <p className="text-red-700 leading-relaxed text-[11px]">
                      This assessment contains negative marking (up to -{maxNegativeMark} per question). Choosing incorrect options will deduct marks, while leaving them unanswered awards 0 marks. Select carefully.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    Forward-Only Sequential Navigation
                  </div>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    You can only progress forward. Backward navigation to previous questions is strictly disabled. Once a section is submitted, it is locked.
                  </p>
                </div>

              </div>

              {/* Section Sequence Flowchart */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block text-left">Drive Section Roadmap</span>
                <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-2.5 border border-slate-200/60 rounded-xl text-[10px] font-bold text-slate-500 justify-start">
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded">Aptitude</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded">Logical</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded">Verbal</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded">Pseudocode</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded">DSA</span>
                </div>
              </div>
            </div>

            {/* Start CTA Button */}
            <Button
              size="lg"
              className={`w-full font-bold h-12 text-sm shadow-md transition-all rounded-xl ${
                isWaiting
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200"
                  : (exam?.cameraMonitor && !faceRecognized)
                    ? "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 cursor-pointer"
                    : (exam?.cameraMonitor && !screenShared)
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              onClick={(exam?.cameraMonitor && !screenShared) ? handleShareScreen : handleStart}
              disabled={isWaiting}
            >
              <Maximize className="mr-2 h-4 w-4" />
              {isWaiting
                ? "Lobby Timer Active..."
                : (exam?.cameraMonitor && !faceRecognized)
                  ? "Awaiting Identity Recognition Check"
                  : (exam?.cameraMonitor && !screenShared)
                    ? "Step 2: Share Entire Screen"
                    : "Enter Examination Fullscreen"}
            </Button>

          </div>

        </div>
        {/* HIDDEN PROCTOR CANVAS FOR LOBBY SCANNING */}
        <canvas ref={canvasRef} width={32} height={32} className="hidden" />
      </div>
    );
  }

 

  // =======================
  // SCREEN SHARING DISCONNECTED BLOCKER
  // =======================
  if (started && !submitted && exam?.cameraMonitor && !screenStream) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center text-white p-6 font-sans">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-955/20 via-transparent to-slate-955/40 pointer-events-none" />
        
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black tracking-tight text-white">Screen Sharing Stopped</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              To ensure assessment integrity, you must share your entire screen. The exam is paused until screen sharing is re-enabled.
            </p>
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-sm shadow-md transition-all rounded-xl flex items-center justify-center gap-2"
            onClick={handleShareScreen}
          >
            <Maximize className="h-4 w-4" /> Share Entire Screen
          </Button>
        </div>
      </div>
    );
  }

  // =======================
  // FULLSCREEN EXITED BLOCKER
  // =======================
  if (started && !submitted && !isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center text-white p-6 font-sans">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-955/20 via-transparent to-slate-955/40 pointer-events-none" />
        
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black tracking-tight text-white">Fullscreen Mode Exited</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              To ensure assessment integrity, you cannot view questions or write the exam outside of fullscreen mode.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl text-left text-xs space-y-2 text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Tab switches & exits are logged dynamically.
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Exiting fullscreen repeatedly will trigger automatic submission.
            </div>
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-sm shadow-md transition-all rounded-xl flex items-center justify-center gap-2"
            onClick={enterFullscreen}
          >
            <Maximize className="h-4 w-4" /> Re-enter Fullscreen Mode
          </Button>
        </div>
      </div>
    );
  }

  // =======================
  // ACTIVE EXAM
  // =======================
  return (
    <div className="min-h-screen bg-[#f3f4f6] relative font-roboto select-none">
      {/* OFFLINE STATUS BANNER */}
      {!isOnline && (
        <div className="sticky top-0 z-[100] bg-amber-600 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-md animate-pulse">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Internet Disconnected. All progress is cached locally. Synced automatically once connection is restored. Do not close this browser tab.</span>
        </div>
      )}
      {/* STRUCTURED WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="text-center opacity-[0.03] rotate-[-25deg]">
          <h1 className="text-[110px] font-extrabold tracking-widest text-gray-800 leading-none">
            SECURE EXAM PRO
          </h1>
          <p className="text-2xl font-semibold tracking-[0.4em] text-gray-800 mt-4">
            UNDER SR ECOSYSTEM
          </p>
          <p className="text-lg tracking-wide text-gray-800 mt-2">
            Developed by Saran Velmurugan
          </p>
        </div>
      </div>

      {/* LOADER */}
      {submitting && (
        <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur flex items-center justify-center">
          <Loader />
        </div>
      )}

      {/* WARNING MODAL */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white p-6 rounded-md shadow-lg w-[350px] text-center font-roboto">
            <AlertTriangle className="mx-auto mb-2 text-red-600 h-10 w-10 animate-bounce" />
            <p className="mb-4 text-sm font-semibold text-gray-700">{warningMessage}</p>
            <Button onClick={dismissWarning} className="bg-[#0b3d91] hover:bg-[#082d6e] text-white">
              Return
            </Button>
          </div>
        </div>
      )}

      {/* FACE WARNING MODAL */}
      {showFaceWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white p-6 rounded-md shadow-lg w-[350px] text-center font-roboto">
            <AlertTriangle className="mx-auto mb-2 text-red-600 h-10 w-10 animate-bounce" />
            <p className="mb-4 text-sm font-semibold text-gray-700">{faceWarningMessage}</p>
            <Button
              onClick={() => setShowFaceWarningModal(false)}
              className="bg-[#0b3d91] hover:bg-[#082d6e] text-white"
            >
              Return
            </Button>
          </div>
        </div>
      )}

      {/* CONFIRM SUBMIT */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white p-6 rounded-md shadow-lg w-[400px] text-center font-roboto">
            <h3 className="mb-3 font-bold text-lg text-gray-800">Submit Examination?</h3>
            <p className="mb-4 text-sm text-gray-600">
              Answered: {answeredCount}/{totalQuestions}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handleSubmit}
              >
                Final Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM NEXT SECTION */}
      {showNextSectionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white p-6 rounded-md shadow-lg w-[400px] text-center font-roboto">
            <h3 className="mb-3 font-bold text-lg text-gray-800">Proceed to Next Section?</h3>
            <p className="mb-4 text-sm text-gray-600">
              You are about to move to the next section: <span className="font-semibold">{sections[currentSectionIndex + 1]?.name}</span>.
              <br /><br />
              <strong className="text-red-500 font-bold">Warning:</strong> You will NOT be able to return to the current section (<span className="font-semibold">{currentSection?.name}</span>) once you proceed.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowNextSectionConfirm(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                onClick={() => {
                  setCurrentSectionIndex((prev) => prev + 1);
                  setCurrentQuestionIndex(0);
                  setShowNextSectionConfirm(false);
                }}
              >
                Yes, Proceed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0b3d91] text-white border-b shadow-md font-roboto">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
          {/* LEFT */}
          <div>
            <h1 className="text-lg font-bold tracking-wide uppercase">
              SecureExam Pro - Placement Assessment
            </h1>
            <p className="text-[10px] opacity-75 uppercase tracking-wider font-semibold">
              Powering National Qualifier Drives | Under SR Ecosystem
            </p>
          </div>

          {/* TIMER */}
          <div
            className={`px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2 ${
              timer.isLow
                ? "bg-red-500 text-white animate-pulse shadow"
                : "bg-white/10 text-white border border-white/20"
            }`}
          >
            <Clock className="h-4 w-4" />
            Time Left: <span className="font-mono">{timer.formatted}</span>
          </div>

          {/* SUBMIT */}
          <Button
            onClick={() => setShowConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-1.5 h-auto uppercase tracking-wider"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Submit Test
          </Button>
        </div>
      </header>

      {/* MNC PLACEMENT DRIVE WORKSPACE */}
      <div className="max-w-7xl mx-auto flex gap-6 px-6 py-6 font-roboto relative">
        {/* LEFT COLUMN: QUESTION PANEL */}
        <div className="flex-1 flex flex-col gap-4">
          {/* SECTION HEADER BAR */}
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sections:</span>
              {sections.map((sec, idx) => {
                const isActive = idx === currentSectionIndex;
                const isCompleted = idx < currentSectionIndex;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                      isActive
                        ? "bg-[#0b3d91] text-white border-[#0b3d91] shadow-sm"
                        : isCompleted
                          ? "bg-green-50 text-green-700 border-green-200 cursor-not-allowed"
                          : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                  >
                    {isCompleted && <span className="text-xs">✓</span>}
                    {sec.name}
                  </div>
                );
              })}
            </div>
          </div>

          {/* QUESTION BOX */}
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 flex-1 flex flex-col min-h-[400px]">
            {currentQuestion ? (
              <div className="flex-1 flex flex-col">
                {/* QUESTION TITLE */}
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm font-bold text-[#0b3d91] uppercase tracking-wider">
                      Question {currentQuestionIndex + 1}
                    </span>
                    {currentQuestion.isMultipleCorrect && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                        Multiple Answers Correct (Select all that apply)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentQuestion.negativeMarks > 0 && (
                      <span className="text-[10px] bg-red-55 text-red-700 border border-red-100 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                        Incorrect: -{currentQuestion.negativeMarks}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-1 rounded">
                      Marks: {currentQuestion.marks || 1}
                    </span>
                  </div>
                </div>

                <div className="text-gray-800 font-medium mb-4 text-base leading-relaxed">
                  {currentQuestion.question}
                </div>

                {/* OPTIONAL CODE SNIPPET (Programming Logic / Pseudocode) */}
                {currentQuestion.codeSnippet && (
                  <div className="mb-6 rounded-md border border-gray-200 bg-gray-900 p-4 font-mono text-sm text-green-400 shadow-inner max-h-[320px] overflow-y-auto whitespace-pre leading-relaxed tracking-wide">
                    {currentQuestion.codeSnippet}
                  </div>
                )}

                {/* OPTIONAL IMAGE (Logical / Reasoning Image questions) */}
                {currentQuestion.imageUrl && (
                  <div className="mb-6 border rounded-lg p-2 bg-gray-50 flex justify-center shadow-sm max-w-md mx-auto overflow-hidden">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Logical Reasoning diagram"
                      className="max-h-[250px] object-contain"
                    />
                  </div>
                )}

                {/* OPTIONS GRID */}
                <div className="space-y-3 flex-1">
                  {currentQuestion.shuffledOptions?.map((opt: any, index: number) => {
                    const currentAns = answers.find((a) => a.questionId === currentQuestion._id)?.selectedOption;
                    const isSelected = currentAns ? currentAns.split(",").includes(opt.key) : false;

                    return (
                      <div
                        key={index}
                        onClick={() => selectOption(currentQuestion._id, opt.key)}
                        className={`flex items-center gap-3 px-4 py-3 border rounded-md cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#0b3d91] bg-blue-50/50 shadow-sm"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                            currentQuestion.isMultipleCorrect ? "rounded" : "rounded-full"
                          } ${
                            isSelected
                              ? "border-[#0b3d91] bg-[#0b3d91] text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            currentQuestion.isMultipleCorrect ? (
                              <Check className="h-3 w-3 text-white stroke-[3px]" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )
                          )}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          <strong className="mr-1">{String.fromCharCode(65 + index)}.</strong> {opt.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No questions in this section.
              </div>
            )}
          </div>

          {/* BOTTOM BUTTON BAR */}
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 flex justify-between items-center">
            {/* Left aligned: Clear Response */}
            <Button
              variant="outline"
              onClick={() => selectOption(currentQuestion?._id, null)}
              disabled={!answers.find((a) => a.questionId === currentQuestion?._id)?.selectedOption}
              className="text-gray-600 hover:text-gray-900 border-gray-300 hover:bg-gray-50 text-xs font-semibold uppercase tracking-wider py-2 h-auto"
            >
              Clear Response
            </Button>

            {/* Right aligned: Save & Next or Submit Section */}
            <div>
              {currentQuestionIndex === currentSectionQuestions.length - 1 ? (
                currentSectionIndex === sections.length - 1 ? (
                  <Button
                    onClick={() => setShowConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-2 h-auto"
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Submit Exam
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowNextSectionConfirm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-wider py-2 h-auto"
                  >
                    Save & Next Section
                    <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                  className="bg-[#0b3d91] hover:bg-[#082d6e] text-white font-bold text-xs uppercase tracking-wider py-2 h-auto"
                >
                  Save & Next
                  <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          {/* PROFILE CARD */}
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#0b3d91] font-bold text-lg border border-blue-200">
              {parsedUser.name ? parsedUser.name.charAt(0).toUpperCase() : "C"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-800 truncate">
                {parsedUser.name || "Candidate"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {parsedUser.email || "candidate@secureexam.com"}
              </div>
            </div>
          </div>

          {/* PROCTOR CAMERA FEED CARD */}
          {exam?.cameraMonitor && (
            <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                <span>AI Proctor Feed</span>
                <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                  proctorStatus === 'warning'
                    ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${proctorStatus === 'warning' ? "bg-red-500" : "bg-green-500"}`} />
                  {proctorStatus === 'warning' ? "Head Shift Detected" : "Active & Center"}
                </span>
              </h3>

              <div className="bg-black rounded border border-gray-300 overflow-hidden relative aspect-video shadow-sm">
                <video
                  ref={setVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            </div>
          )}

          {/* PALETTE CONTAINER */}
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Question Palette
              </h3>
              <p className="text-[11px] text-gray-400 mb-3">
                Viewing <span className="font-semibold text-gray-600">{currentSection?.name}</span> section.
              </p>
              <div className="grid grid-cols-5 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {currentSectionQuestions.map((q, i) => {
                  const isAnswered = isQuestionAnswered(q._id);
                  const isCurrent = i === currentQuestionIndex;

                  return (
                    <div
                      key={i}
                      className={`h-9 w-9 text-xs font-bold rounded flex items-center justify-center border transition-all ${
                        isCurrent
                          ? "bg-blue-100 text-[#0b3d91] border-[#0b3d91] ring-2 ring-[#0b3d91]/20"
                          : isAnswered
                            ? "bg-green-500 text-white border-green-500 shadow-sm"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LEGEND */}
            <div className="border-t pt-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Legend
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-gray-600 font-medium">
                  <div className="w-3.5 h-3.5 rounded bg-green-500 border border-green-500" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 font-medium">
                  <div className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-200" />
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 font-medium">
                  <div className="w-3.5 h-3.5 rounded bg-blue-100 border border-[#0b3d91]" />
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER STATUS BAR */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-6 py-2 text-sm flex justify-between">
        <div>
          Answered: <span className="font-semibold">{answeredCount}</span>
        </div>
        <div>
          Total Questions:{" "}
          <span className="font-semibold">{totalQuestions}</span>
        </div>
      </footer>

      {/* HIDDEN PROCTOR CANVAS */}
      <canvas ref={canvasRef} width={32} height={32} className="hidden" />
    </div>
  );
};

export default ExamPage;

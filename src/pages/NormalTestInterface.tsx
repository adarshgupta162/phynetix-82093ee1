import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  Loader2,
  RotateCcw,
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import FullscreenGuard from "@/components/test/FullscreenGuard";
import AccessibilityToolbar from "@/components/test/AccessibilityToolbar";
import { LatexRenderer } from "@/components/ui/latex-renderer";

/* ─────────────────────────────────────────────
   TYPES  (unchanged)
───────────────────────────────────────────── */
interface Question {
  id: string;
  order: number;
  question_text: string;
  options: string[] | null;
  difficulty: string;
  marks: number;
  negative_marks: number;
  question_type: string;
  subject: string;
  chapter: string;
  image_url?: string;
  image_urls?: string[];
  section_type?: string;
  paragraph_id?: string;
  paragraph_text?: string;
  paragraph_image_urls?: string[];
}

interface Section {
  id: string;
  name: string;
  questions: Question[];
  section_type?: string;
}

/* ─────────────────────────────────────────────
   NTA COLOUR TOKENS
───────────────────────────────────────────── */
const NTA = {
  topbarBg:   "#1e3a5f",   // deep navy
  sectionBg:  "#d6e4f0",   // light blue-grey tab bar
  sectionAct: "#1a5276",   // active section tab
  timerRed:   "#cc0000",
  btnPrimary: "#1a5276",
  btnSave:    "#1a5276",
  btnSubmit:  "#cc0000",
  btnReview:  "#7b2d8b",
  btnClear:   "#555555",
  palGreen:   "#339900",
  palRed:     "#cc3300",
  palGray:    "#8d8d8d",
  palPurple:  "#6a1b9a",
  palCurrent: "#f39c12",
  sidebarBg:  "#eaf0f7",
  borderGray: "#b0bec5",
};

/* ─────────────────────────────────────────────
   SHARED NTA HEADER (screens 1–3)
───────────────────────────────────────────── */
const NTAHeader = ({
  systemId, studentName, testName, studentAvatar
}: {
  systemId: string; studentName: string; testName: string; studentAvatar: string | null;
}) => (
  <div style={{ background: "#4a4a4a", color: "#fff", fontFamily: "Arial, sans-serif" }}>
    {/* Top blue stripe */}
    <div style={{ height: 8, background: NTA.topbarBg }} />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px" }}>
      {/* Left */}
      <div>
        <div style={{ fontSize: 12, color: "#ccc" }}>System Name :</div>
        <div style={{ fontSize: 22, fontWeight: "bold", color: "#f5c518", letterSpacing: 1 }}>
          {systemId || "C001"}
        </div>
        <div style={{ fontSize: 11, color: "#ccc", marginTop: 2 }}>
          Kindly contact the invigilator if there are any discrepancies in the Name and Photograph displayed on the screen or if the photograph is not yours
        </div>
      </div>
      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#ccc" }}>Candidate Name :</div>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#f5c518" }}>{studentName}</div>
          <div style={{ fontSize: 12, color: "#ccc" }}>
            Subject : <span style={{ color: "#f5c518" }}>{testName}</span>
          </div>
        </div>
        {/* Photo box */}
        <div style={{
          width: 70, height: 80, border: "2px solid #888",
          background: "#ccc", overflow: "hidden", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          {studentAvatar
            ? <img src={studentAvatar} alt={studentName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 40 }}>👤</span>}
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   NTA VERSION BAR
───────────────────────────────────────────── */
const NTAVersionBar = () => (
  <div style={{
    background: NTA.topbarBg, color: "#fff", textAlign: "center",
    fontSize: 11, padding: "3px 0", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999
  }}>
    Version : 17.07.00
  </div>
);

/* ─────────────────────────────────────────────
   PALETTE BUTTON STATUS STYLES
───────────────────────────────────────────── */
const palStyle = (status: string): React.CSSProperties => {
  const base: React.CSSProperties = {
    width: 34, height: 34, border: "1px solid #999",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: "bold", cursor: "pointer",
    fontFamily: "Arial, sans-serif", position: "relative",
    transition: "transform .1s"
  };
  switch (status) {
    case "answered":       return { ...base, background: NTA.palGreen,  color: "#fff", borderRadius: "50%", borderColor: "#226600" };
    case "not-answered":   return { ...base, background: NTA.palRed,    color: "#fff", borderRadius: "50%", borderColor: "#aa2200" };
    case "marked":         return { ...base, background: NTA.palPurple, color: "#fff", borderRadius: "50%", borderColor: "#4a148c" };
    case "answered-marked":return { ...base, background: NTA.palPurple, color: "#fff", borderRadius: "50%", borderColor: "#4a148c" };
    case "current":        return { ...base, background: NTA.palRed,    color: "#fff", borderRadius: "50%", borderColor: "#aa2200", boxShadow: `0 0 0 3px ${NTA.palCurrent}` };
    default:               return { ...base, background: NTA.palGray,   color: "#fff", borderRadius: 3 };
  }
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function NormalTestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();

  /* ── ALL STATE (100% identical to original) ── */
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [testName, setTestName] = useState("Loading...");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPalette, setShowPalette] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(true);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [currentScreen, setCurrentScreen] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [testDuration, setTestDuration] = useState(0);
  const [hasExistingAttempt, setHasExistingAttempt] = useState(false);
  const [systemId, setSystemId] = useState("");
  const [studentName, setStudentName] = useState("Student");
  const [studentAvatar, setStudentAvatar] = useState<string | null>(null);
  const [examType, setExamType] = useState<string>("custom");
  const [testType, setTestType] = useState<string>("full");
  const [studentRollNumber, setStudentRollNumber] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);

  /* ── ALL BACKEND / API LOGIC (100% identical to original) ── */

  useEffect(() => {
    if (testId) checkExistingAttemptFn();
  }, [testId]);

  const checkExistingAttemptFn = async () => {
    try {
      const { data: testData } = await supabase
        .from("tests")
        .select("name, duration_minutes, fullscreen_enabled, exam_type, test_type")
        .eq("id", testId)
        .single();

      if (testData) {
        setTestName(testData.name);
        setTestDuration(testData.duration_minutes);
        setFullscreenEnabled(testData.fullscreen_enabled ?? true);
        setExamType(testData.exam_type || "custom");
        setTestType(testData.test_type || "full");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, roll_number")
          .eq("id", user.id)
          .single();

        setStudentName(profile?.full_name || "Student");
        setStudentAvatar(profile?.avatar_url);
        setStudentRollNumber(profile?.roll_number || user.id.substring(0, 8));

        const storageKey = `systemId_${testId}`;
        let storedSystemId = localStorage.getItem(storageKey);
        if (!storedSystemId) {
          storedSystemId = `C${Math.floor(100 + Math.random() * 900)}`;
          localStorage.setItem(storageKey, storedSystemId);
        }
        setSystemId(storedSystemId);

        const { data: existingAttempt } = await supabase
          .from("test_attempts")
          .select("id, completed_at, fullscreen_exit_count")
          .eq("test_id", testId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingAttempt) {
          if (existingAttempt.completed_at) {
            navigate(`/test/${testId}/analysis`);
            return;
          }
          setHasExistingAttempt(true);
          setCurrentScreen(4);
          setFullscreenExitCount(existingAttempt.fullscreen_exit_count || 0);
          initializeTest();
          return;
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error checking attempt:", error);
      setLoading(false);
    }
  };

  const startTest = () => {
    if (!agreedToTerms) {
      toast({ title: "Please agree to the terms", description: "You must agree to the test rules before starting.", variant: "destructive" });
      return;
    }
    if (fullscreenEnabled) {
      const elem = document.documentElement;
      (elem.requestFullscreen?.() ||
        (elem as any).webkitRequestFullscreen?.() ||
        (elem as any).mozRequestFullScreen?.() ||
        (elem as any).msRequestFullscreen?.()
      )?.catch?.(() => {});
    }
    setCurrentScreen(4);
    setLoading(true);
    initializeTest();
  };

  const initializeTest = async () => {
    try {
      const { data: testData } = await supabase
        .from("tests").select("fullscreen_enabled").eq("id", testId).single();
      if (testData) setFullscreenEnabled(testData.fullscreen_enabled ?? true);

      const { data: startData, error: startError } = await supabase.functions.invoke("start-test", {
        body: { test_id: testId },
      });
      if (startError || startData?.error) throw new Error(startData?.error || startError?.message || "Failed to start test");

      setAttemptId(startData.attempt_id);
      setTestName(startData.test_name);
      setTimeLeft(startData.remaining_seconds ?? startData.duration_minutes * 60);
      if (startData.fullscreen_exit_count) setFullscreenExitCount(startData.fullscreen_exit_count);
      if (startData.is_resume && startData.existing_answers) setAnswers(startData.existing_answers);
      if (startData.is_resume && startData.existing_time_per_question) setTimePerQuestion(startData.existing_time_per_question);

      const { data: questionsData, error: questionsError } = await supabase.functions.invoke("get-test-questions", {
        body: { test_id: testId },
      });
      if (questionsError || questionsData?.error) throw new Error(questionsData?.error || questionsError?.message || "Failed to load questions");
      if (!questionsData.questions || questionsData.questions.length === 0) throw new Error("No questions found for this test");

      const allQuestions: Question[] = questionsData.questions;
      setQuestions(allQuestions);

      const sectionMap = new Map<string, Question[]>();
      allQuestions.forEach((q: Question) => {
        const subj = q.subject || "General";
        const qType = q.question_type || q.section_type || "single_choice";
        const typeLabel = qType === "single_choice" ? "SCQ"
          : qType === "multiple_choice" || qType === "multi" ? "MCQ"
          : qType === "integer" || qType === "numerical" ? "Integer"
          : "SCQ";
        const sectionKey = `${subj}(${typeLabel})`;
        if (!sectionMap.has(sectionKey)) sectionMap.set(sectionKey, []);
        sectionMap.get(sectionKey)!.push(q);
      });

      const sectionsList: Section[] = Array.from(sectionMap.entries()).map(([name, qs]) => ({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name,
        questions: qs.sort((a, b) => a.order - b.order),
        section_type: qs[0]?.question_type || qs[0]?.section_type || "single_choice"
      }));

      setSections(sectionsList);
      if (sectionsList.length > 0) setActiveSection(sectionsList[0].id);

      if (allQuestions.length > 0) {
        if (startData.is_resume && startData.existing_answers) {
          setVisitedQuestions(new Set([allQuestions[0].id, ...Object.keys(startData.existing_answers)]));
        } else {
          setVisitedQuestions(new Set([allQuestions[0].id]));
        }
      }
      setLoading(false);
    } catch (error: any) {
      console.error("Failed to initialize test:", error);
      toast({ title: "Error", description: error.message || "Failed to start test. Please try again.", variant: "destructive" });
      navigate("/tests");
    }
  };

  useEffect(() => {
    if (timeLeft <= 0 || loading || currentScreen !== 4) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); setTimeExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, currentScreen]);

  useEffect(() => {
    if (timeExpired && attemptId && !submitting) handleSubmit();
  }, [timeExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentSection = sections.find(s => s.id === activeSection);
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  const isMultipleChoice = currentQuestion?.question_type === "multiple_choice" ||
    currentQuestion?.question_type === "multi" ||
    currentQuestion?.section_type === "multiple_choice" ||
    currentQuestion?.section_type === "multi";

  const handleAnswer = (optionIndex: number) => {
    if (currentQuestion) {
      if (isMultipleChoice) {
        const currentAnswers = Array.isArray(answers[currentQuestion.id])
          ? answers[currentQuestion.id] as string[]
          : answers[currentQuestion.id] ? [answers[currentQuestion.id] as string] : [];
        const optionStr = String(optionIndex);
        const newAnswers = currentAnswers.includes(optionStr)
          ? currentAnswers.filter(a => a !== optionStr)
          : [...currentAnswers, optionStr];
        setAnswers({ ...answers, [currentQuestion.id]: newAnswers });
      } else {
        setAnswers({ ...answers, [currentQuestion.id]: String(optionIndex) });
      }
    }
  };

  const handleIntegerAnswer = (value: string) => {
    if (currentQuestion) {
      const sanitized = value.replace(/[^0-9-]/g, "");
      setAnswers({ ...answers, [currentQuestion.id]: sanitized });
    }
  };

  const clearResponse = () => {
    if (currentQuestion) {
      const newAnswers = { ...answers };
      delete newAnswers[currentQuestion.id];
      setAnswers(newAnswers);
    }
  };

  const updateTimeForCurrentQuestion = useCallback(() => {
    if (currentQuestion) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setTimePerQuestion(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
      }));
    }
  }, [currentQuestion, questionStartTime]);

  const saveProgress = useCallback(async () => {
    if (!attemptId || isSaving) return;
    setIsSaving(true);
    try {
      const currentTimeSpent = currentQuestion ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;
      const updatedTimePerQuestion = currentQuestion
        ? { ...timePerQuestion, [currentQuestion.id]: (timePerQuestion[currentQuestion.id] || 0) + currentTimeSpent }
        : timePerQuestion;
      const { error } = await supabase
        .from("test_attempts")
        .update({ answers, time_per_question: updatedTimePerQuestion })
        .eq("id", attemptId);
      if (error) console.error("Failed to auto-save:", error);
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSaving(false);
    }
  }, [attemptId, answers, timePerQuestion, currentQuestion, questionStartTime, isSaving]);

  useEffect(() => {
    if (currentScreen !== 4 || !attemptId || loading) return;
    const interval = setInterval(() => { saveProgress(); }, 10000);
    return () => clearInterval(interval);
  }, [currentScreen, attemptId, loading, saveProgress]);

  const saveAndNext = async () => {
    updateTimeForCurrentQuestion();
    setQuestionStartTime(Date.now());
    await saveProgress();
    goToNextQuestion();
  };

  const markForReviewAndNext = async () => {
    if (currentQuestion) {
      const newMarked = new Set(markedForReview);
      newMarked.add(currentQuestion.id);
      setMarkedForReview(newMarked);
    }
    updateTimeForCurrentQuestion();
    setQuestionStartTime(Date.now());
    await saveProgress();
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (!currentSection) return;
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQ = currentSection.questions[nextIndex];
      if (nextQ) setVisitedQuestions(prev => new Set([...prev, nextQ.id]));
    } else {
      const currentSectionIdx = sections.findIndex(s => s.id === activeSection);
      if (currentSectionIdx < sections.length - 1) {
        const nextSection = sections[currentSectionIdx + 1];
        setActiveSection(nextSection.id);
        setCurrentQuestionIndex(0);
        if (nextSection.questions[0]) setVisitedQuestions(prev => new Set([...prev, nextSection.questions[0].id]));
      }
    }
  };

  const goToPrevQuestion = () => {
    if (!currentSection) return;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      const currentSectionIdx = sections.findIndex(s => s.id === activeSection);
      if (currentSectionIdx > 0) {
        const prevSection = sections[currentSectionIdx - 1];
        setActiveSection(prevSection.id);
        setCurrentQuestionIndex(prevSection.questions.length - 1);
      }
    }
  };

  const handleSubmit = useCallback(async (fromFullscreenMax = false) => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-test", {
        body: {
          attempt_id: attemptId,
          answers,
          time_taken_seconds: Math.max(1, (testDuration * 60) - timeLeft),
          fullscreen_exit_count: fullscreenExitCount,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Failed to submit test");
      navigate(`/test/${testId}/analysis`, { state: { results: data, testName } });
    } catch (error: any) {
      console.error("Failed to submit test:", error);
      toast({ title: "Error", description: error.message || "Failed to submit test. Please try again.", variant: "destructive" });
      setSubmitting(false);
    }
  }, [attemptId, answers, timeLeft, testId, testName, navigate, submitting, questions, fullscreenExitCount]);

  const handleFullscreenExitCountChange = useCallback((count: number) => {
    setFullscreenExitCount(count);
    if (attemptId) {
      supabase.from("test_attempts").update({ fullscreen_exit_count: count }).eq("id", attemptId)
        .then(({ error }) => { if (error) console.error("Failed to update fullscreen count:", error); });
    }
  }, [attemptId]);

  const handleMaxFullscreenExits = useCallback(() => {
    toast({ title: "Test Auto-Submitted", description: "You exceeded the maximum allowed fullscreen exits.", variant: "destructive" });
    handleSubmit(true);
  }, [handleSubmit]);

  const getQuestionStatus = (questionId: string) => {
    if (currentQuestion?.id === questionId) return "current";
    if (markedForReview.has(questionId) && answers[questionId] !== undefined) return "answered-marked";
    if (markedForReview.has(questionId)) return "marked";
    if (answers[questionId] !== undefined) return "answered";
    if (visitedQuestions.has(questionId)) return "not-answered";
    return "not-visited";
  };

  const getStatusCounts = () => {
    const answered = Object.keys(answers).length;
    const notAnswered = questions.filter(q => visitedQuestions.has(q.id) && answers[q.id] === undefined).length;
    const markedCount = markedForReview.size;
    const answeredMarked = questions.filter(q => markedForReview.has(q.id) && answers[q.id] !== undefined).length;
    const notVisited = questions.length - visitedQuestions.size;
    return { answered, notAnswered, markedCount, answeredMarked, notVisited };
  };

  /* ── LOADING SCREEN ── */
  if (loading && currentScreen === 4) {
    return (
      <div style={{ minHeight: "100vh", background: "#eaf0f7", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <Loader2 style={{ width: 48, height: 48, color: NTA.topbarBg }} className="animate-spin" />
        <p style={{ color: "#555", fontFamily: "Arial, sans-serif" }}>Loading test, please wait…</p>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     SCREEN 1 — NTA Login / Verification
  ════════════════════════════════════════════ */
  if (currentScreen === 1) {
    return (
      <div style={{ minHeight: "100vh", background: "#c8d8e8", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif" }}>
        <NTAHeader systemId={systemId} studentName={studentName} testName={testName} studentAvatar={studentAvatar} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Login card */}
          <div style={{
            background: "#f0f0f0", border: "1px solid #aaa", width: 360, padding: 0,
            boxShadow: "2px 2px 8px rgba(0,0,0,.2)"
          }}>
            {/* Card header */}
            <div style={{ background: "#d0d8e0", padding: "8px 14px", borderBottom: "1px solid #aaa", fontSize: 14, fontWeight: "bold", color: "#333" }}>
              Login
            </div>
            <div style={{ padding: "18px 16px" }}>
              {/* Username row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, background: "#ccc", border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
                <input
                  type="text" value={studentRollNumber} disabled readOnly
                  style={{ flex: 1, padding: "7px 10px", border: "1px solid #bbb", background: "#fafafa", fontSize: 13, color: "#333" }}
                />
                <div style={{ width: 36, height: 36, background: "#ddd", border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>⌨</div>
              </div>
              {/* Password row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, background: "#ccc", border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔒</div>
                <input
                  type="password" value="••••" disabled readOnly
                  style={{ flex: 1, padding: "7px 10px", border: "1px solid #bbb", background: "#fafafa", fontSize: 13, color: "#555" }}
                />
                <div style={{ width: 36, height: 36, background: "#ddd", border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>⌨</div>
              </div>
              {/* Sign In button */}
              <button
                onClick={() => setCurrentScreen(2)}
                style={{
                  width: "100%", padding: "10px 0", background: "#4da6e8",
                  border: "none", color: "#fff", fontSize: 15, fontWeight: "bold",
                  cursor: "pointer", letterSpacing: 0.5
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        <NTAVersionBar />
      </div>
    );
  }

  /* ════════════════════════════════════════════
     SCREEN 2 — General Instructions
  ════════════════════════════════════════════ */
  if (currentScreen === 2) {
    return (
      <div style={{ minHeight: "100vh", background: "#c8d8e8", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif" }}>
        {/* Top nav bar */}
        <div style={{ height: 8, background: NTA.topbarBg }} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: 0 }}>
          {/* Left panel */}
          <div style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Panel header */}
            <div style={{ background: "#b8d4ea", padding: "8px 16px", fontSize: 15, fontWeight: "bold", color: "#1a3a5c", borderBottom: "1px solid #aac" }}>
              Instructions
            </div>
            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", fontSize: 13, color: "#222", lineHeight: 1.7 }}>
              <p style={{ fontWeight: "bold", fontSize: 14 }}>Please read the instructions carefully</p>
              {testType === "practice" && (
                <p style={{ color: "#cc2200", fontWeight: "bold", fontSize: 13, margin: "6px 0 14px" }}>
                  This Mock Exam Only for Practice Purpose
                </p>
              )}

              <p style={{ fontWeight: "bold", textDecoration: "underline", margin: "16px 0 8px" }}>General Instructions:</p>
              <ol style={{ marginLeft: 22, lineHeight: 2 }}>
                <li>Total duration of examination is <strong>{testDuration} minutes</strong>.</li>
                <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
                <li>The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:</li>
              </ol>

              {/* Legend */}
              <div style={{ marginLeft: 30, marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { bg: NTA.palGray,   round: false, label: "You have not visited the question yet.", num: 1 },
                  { bg: NTA.palRed,    round: true,  label: "You have not answered the question.", num: 2 },
                  { bg: NTA.palGreen,  round: true,  label: "You have answered the question.", num: 3 },
                  { bg: NTA.palPurple, round: true,  label: "You have NOT answered the question, but have marked the question for review.", num: 4 },
                  { bg: NTA.palPurple, round: true,  label: 'The question(s) "Answered and Marked for Review" will be considered for evaluation.', num: 5, greenDot: true },
                ].map(item => (
                  <div key={item.num} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, background: item.bg, color: "#fff",
                      borderRadius: item.round ? "50%" : 4,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: "bold", flexShrink: 0, position: "relative"
                    }}>
                      {item.num}
                      {item.greenDot && (
                        <span style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, background: NTA.palGreen, borderRadius: "50%", border: "1.5px solid #fff" }} />
                      )}
                    </div>
                    <span style={{ fontSize: 13 }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 14, fontSize: 12, fontStyle: "italic", color: "#555" }}>
                The Marked for Review status for a question simply indicates that you would like to look at that question again.
              </p>
            </div>
            {/* Footer */}
            <div style={{ padding: "10px 16px", borderTop: "1px solid #ccc", background: "#f5f5f5", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setCurrentScreen(3)}
                style={{ padding: "7px 22px", background: "#fff", border: "1px solid #888", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                Next &gt;
              </button>
            </div>
          </div>

          {/* Right: candidate panel */}
          <div style={{ width: 160, background: "#dde8f0", borderLeft: "1px solid #aaa", display: "flex", flexDirection: "column", alignItems: "center", padding: 14 }}>
            <div style={{ width: 90, height: 100, background: "#ccc", border: "2px solid #888", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              {studentAvatar ? <img src={studentAvatar} alt={studentName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 44 }}>👤</span>}
            </div>
            <p style={{ fontSize: 13, fontWeight: "bold", textAlign: "center", color: "#1a3a5c" }}>{studentName}</p>
          </div>
        </div>

        <NTAVersionBar />
      </div>
    );
  }

  /* ════════════════════════════════════════════
     SCREEN 3 — Other Important Instructions
  ════════════════════════════════════════════ */
  if (currentScreen === 3) {
    const getExamInstructions = () => {
      if (examType === "jee_mains") {
        return (
          <div style={{ fontSize: 13, lineHeight: 1.8, color: "#222" }}>
            <p>The motive for enabling this mock SAMPLE test is to familiarize the candidates with the Computer Based Test (CBT) environment of the UGEE conducted by IIIT Hyderabad.</p>
            <p style={{ marginTop: 10 }}>The types of questions and marking scheme is only illustrative and is in no way indicative or representation of the type of questions and marking scheme of the UGEE question paper.</p>
            <p style={{ marginTop: 10, fontWeight: "bold" }}>Section wise Instructions</p>
            <p style={{ fontStyle: "italic" }}>Note: There will be 25% negative marking in both the sections.</p>
            <p style={{ marginTop: 6 }}><strong>SECTION 1:</strong> Subject Proficiency Test (Subject Code 101)<br />Maximum marks: 50</p>
            <p style={{ marginTop: 6 }}><strong>SECTION 2:</strong> Research Aptitude Test (Subject Code 102)<br />Maximum marks: 100</p>
            <p style={{ marginTop: 10 }}>No clarification will be provided during the exam.</p>
            <p style={{ marginTop: 6 }}>Calculators and other electronic devices are not allowed during the exam. Rough sheets and pens will be provided in the exam center. A virtual on-screen calculator is available for use.</p>
            <p style={{ marginTop: 6 }}>Some questions may have more than one answer correct. Points will be given only when <strong>ALL</strong> the correct answers are marked and <strong>NONE</strong> of the incorrect are marked.</p>
          </div>
        );
      } else if (examType === "jee_advanced") {
        return (
          <div style={{ fontSize: 13, lineHeight: 1.8, color: "#222" }}>
            <p>The test consists of multiple subjects with section-wise questions. Each section may have different marking schemes.</p>
            <p style={{ marginTop: 10, fontWeight: "bold" }}>Section wise Instructions</p>
            <ul style={{ marginLeft: 20, marginTop: 6 }}>
              <li>For single correct answer questions: +3 marks for correct answer, -1 for incorrect answer.</li>
              <li>For multiple correct answer questions: +4 marks for all correct answers (partial marking applies), 0 for incorrect.</li>
              <li>For numerical questions: +3 marks for correct answer, 0 for incorrect.</li>
            </ul>
            <p style={{ marginTop: 10 }}>No clarification will be provided during the exam.</p>
            <p style={{ marginTop: 6 }}>Calculators and other electronic devices are not allowed during the exam. A virtual on-screen calculator is available for use.</p>
          </div>
        );
      } else {
        const sampleMarks = questions.length > 0 ? questions[0].marks : 4;
        const sampleNeg   = questions.length > 0 ? questions[0].negative_marks : 1;
        return (
          <div style={{ fontSize: 13, lineHeight: 1.8, color: "#222" }}>
            <p style={{ fontWeight: "bold" }}>General Test Instructions:</p>
            <p style={{ marginTop: 8 }}>This test contains questions of various types. Please read each question carefully before answering.</p>
            <p style={{ marginTop: 10, fontWeight: "bold" }}>Marking Scheme:</p>
            <ul style={{ marginLeft: 20 }}>
              <li>Correct Answer: +{sampleMarks} marks</li>
              <li>Incorrect Answer: -{sampleNeg} marks</li>
              <li>Unattempted: 0 marks</li>
            </ul>
            <p style={{ marginTop: 10 }}>You can navigate freely between all questions during the test.</p>
            <p>Use the question palette on the right to track your progress.</p>
            <p>Mark questions for review if you want to revisit them.</p>
          </div>
        );
      }
    };

    return (
      <div style={{ minHeight: "100vh", background: "#c8d8e8", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif" }}>
        <div style={{ height: 8, background: NTA.topbarBg }} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left panel */}
          <div style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ background: "#b8d4ea", padding: "8px 16px", fontSize: 15, fontWeight: "bold", color: "#1a3a5c", borderBottom: "1px solid #aac" }}>
              Other Important Instructions
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {getExamInstructions()}

              {fullscreenEnabled && (
                <div style={{ marginTop: 18, padding: "10px 14px", background: "#fff8e1", border: "1px solid #f0c040", fontSize: 12, color: "#7a5500" }}>
                  <strong>⚠ Fullscreen Mode Required:</strong> This test requires fullscreen mode. Exiting fullscreen more than 7 times will auto-submit your test.
                </div>
              )}

              {/* Declaration checkbox */}
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #ddd" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 12, color: "#333", lineHeight: 1.7 }}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: 3, width: 15, height: 15, flexShrink: 0 }}
                  />
                  I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations
                </label>
              </div>
            </div>

            {/* Footer buttons */}
            <div style={{ padding: "10px 16px", borderTop: "1px solid #ccc", background: "#f5f5f5", display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setCurrentScreen(2)} style={{ padding: "7px 20px", background: "#fff", border: "1px solid #888", fontSize: 13, cursor: "pointer" }}>
                &lt; Previous
              </button>
              <button
                onClick={startTest}
                disabled={!agreedToTerms || loading}
                style={{
                  padding: "8px 28px", background: agreedToTerms ? "#4da6e8" : "#aac",
                  border: "none", color: "#fff", fontSize: 14, fontWeight: "bold",
                  cursor: agreedToTerms ? "pointer" : "not-allowed", opacity: loading ? .7 : 1
                }}
              >
                {loading ? "Loading…" : "I am ready to begin"}
              </button>
            </div>
          </div>

          {/* Right: candidate panel */}
          <div style={{ width: 160, background: "#dde8f0", borderLeft: "1px solid #aaa", display: "flex", flexDirection: "column", alignItems: "center", padding: 14 }}>
            <div style={{ width: 90, height: 100, background: "#ccc", border: "2px solid #888", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              {studentAvatar ? <img src={studentAvatar} alt={studentName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 44 }}>👤</span>}
            </div>
            <p style={{ fontSize: 13, fontWeight: "bold", textAlign: "center", color: "#1a3a5c" }}>{studentName}</p>
          </div>
        </div>

        <NTAVersionBar />
      </div>
    );
  }

  /* ════════════════════════════════════════════
     SCREEN 4 — MAIN TEST INTERFACE (NTA Style)
  ════════════════════════════════════════════ */

  const isIntegerQuestion = currentQuestion?.question_type === "integer" || currentQuestion?.question_type === "numerical";

  const options = Array.isArray(currentQuestion?.options)
    ? currentQuestion.options.map((opt: any) => {
        if (typeof opt === "object" && opt !== null) return { text: opt.text || opt.label || "", image_url: opt.image_url || null };
        return { text: opt, image_url: null };
      }).filter((opt: any) => opt.text && opt.text.trim() !== "")
    : typeof currentQuestion?.options === "object" && currentQuestion?.options !== null
      ? Object.values(currentQuestion.options as Record<string, any>).map((opt: any) => {
          if (typeof opt === "object" && opt !== null) return { text: opt.text || opt.label || "", image_url: opt.image_url || null };
          return { text: opt, image_url: null };
        }).filter((opt: any) => opt.text && opt.text.trim() !== "")
      : [];

  const statusCounts = getStatusCounts();
  const localQNum = currentQuestionIndex + 1;

  const testContent = (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", fontSize: 13, background: "#eaf0f7", overflow: "hidden" }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: "#1a1a2e", color: "#fff", height: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: "bold" }}>PHYNETIX</span>
        <div style={{ display: "flex", gap: 10 }}>
          <AccessibilityToolbar inline />
          <button style={{ background: "transparent", border: "1px solid #7aaedc", color: "#7aaedc", padding: "2px 10px", fontSize: 11, cursor: "pointer", borderRadius: 2 }}>
            ℹ Instructions
          </button>
          <button style={{ background: "transparent", border: "1px solid #6dc56d", color: "#6dc56d", padding: "2px 10px", fontSize: 11, cursor: "pointer", borderRadius: 2 }}>
            📄 Question Paper
          </button>
        </div>
      </div>

      {/* ── SECTION TABS ── */}
      <div style={{ background: NTA.sectionBg, borderBottom: "2px solid #4a7ab5", padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0, overflowX: "auto" }}>
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => { setActiveSection(sec.id); setCurrentQuestionIndex(0); }}
            style={{
              padding: "5px 16px", border: "1px solid #7aaedc", fontSize: 12, fontWeight: "bold",
              cursor: "pointer", borderRadius: 2, whiteSpace: "nowrap",
              background: activeSection === sec.id ? NTA.sectionAct : "#fff",
              color: activeSection === sec.id ? "#fff" : "#1a3a5c",
            }}
          >
            {sec.name}
          </button>
        ))}
        {/* Timer */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {isSaving && <span style={{ fontSize: 10, color: "#888" }}>Saving…</span>}
          <div style={{
            padding: "4px 14px", border: "2px solid #cc6600",
            background: timeLeft < 300 ? NTA.timerRed : "#fff",
            color: timeLeft < 300 ? "#fff" : "#cc0000",
            fontWeight: "bold", fontSize: 14, letterSpacing: 1, fontFamily: "monospace"
          }}>
            Time Left : {formatTime(timeLeft)}
          </div>
          {/* Candidate mini */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 34, height: 40, background: "#ccc", border: "1px solid #999", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {studentAvatar ? <img src={studentAvatar} alt={studentName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 20 }}>👤</span>}
            </div>
            <span style={{ fontSize: 12, fontWeight: "bold", color: "#1a3a5c", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{studentName}</span>
          </div>
        </div>
      </div>

      {/* ── SECTIONS LABEL ROW ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ccc", padding: "3px 10px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: "bold", color: "#555" }}>Sections</span>
        <span style={{ fontSize: 11, color: "#888" }}>|</span>
        {/* Sub-section tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          <button style={{ padding: "3px 12px", background: "#4a7ab5", color: "#fff", border: "1px solid #3a6aa5", fontSize: 11, borderRadius: 2, cursor: "pointer" }}>
            {currentSection?.name || "–"}
          </button>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT: Question area */}
        <div style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #ccc" }}>
          {/* Question body scroll */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

            {/* Question number */}
            <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 10, color: "#000" }}>
              Question No. {localQNum}
            </div>

            {/* Paragraph if any */}
            {currentQuestion?.paragraph_text && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#fffde7", border: "1px solid #f0c040", borderRadius: 3 }}>
                <div style={{ fontSize: 11, fontWeight: "bold", color: "#9a6500", marginBottom: 6 }}>PARAGRAPH</div>
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                  <LatexRenderer content={currentQuestion.paragraph_text} />
                </div>
                {currentQuestion.paragraph_image_urls?.map((img, i) => (
                  <img key={i} src={img} alt="" style={{ maxWidth: "100%", marginTop: 6, border: "1px solid #ddd" }} />
                ))}
              </div>
            )}

            {/* Question images */}
            {(() => {
              const imgs = currentQuestion?.image_urls?.length
                ? currentQuestion.image_urls
                : currentQuestion?.image_url ? [currentQuestion.image_url] : [];
              return imgs.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {imgs.map((url, i) => (
                    <img key={i} src={url} alt="" style={{ maxWidth: "100%", border: "1px solid #ddd", borderRadius: 2 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ))}
                </div>
              );
            })()}

            {/* Question text */}
            {currentQuestion?.question_text && (
              <div style={{ fontSize: 14, lineHeight: 1.8, color: "#000", marginBottom: 16 }}>
                <LatexRenderer content={currentQuestion.question_text} />
              </div>
            )}

            {/* Options */}
            {isIntegerQuestion ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>Enter your answer (integer only):</div>
                <input
                  type="text" inputMode="numeric"
                  value={currentQuestion ? (answers[currentQuestion.id] as string || "") : ""}
                  onChange={e => handleIntegerAnswer(e.target.value)}
                  placeholder="Type answer here"
                  style={{
                    padding: "8px 12px", border: "1px solid #888", width: 160,
                    fontSize: 15, fontFamily: "monospace", textAlign: "center",
                    outline: "none"
                  }}
                />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {options.map((option, index) => {
                  const optionStr = String(index);
                  const currentAnswers = currentQuestion ? answers[currentQuestion.id] : undefined;
                  const isSelected = isMultipleChoice
                    ? Array.isArray(currentAnswers) && currentAnswers.includes(optionStr)
                    : currentAnswers === optionStr;

                  return (
                    <label
                      key={index}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "8px 10px", border: `1px solid ${isSelected ? "#4a7ab5" : "#ddd"}`,
                        background: isSelected ? "#dceeff" : "#fafafa",
                        cursor: "pointer"
                      }}
                    >
                      <input
                        type={isMultipleChoice ? "checkbox" : "radio"}
                        name={isMultipleChoice ? undefined : `q-${currentQuestion?.id}`}
                        checked={isSelected}
                        onChange={() => handleAnswer(index)}
                        style={{ marginTop: 3, flexShrink: 0 }}
                      />
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%", background: isSelected ? "#4a7ab5" : "#eee",
                        color: isSelected ? "#fff" : "#333", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 12, fontWeight: "bold", flexShrink: 0
                      }}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.6 }}>
                        <LatexRenderer content={option.text} />
                        {option.image_url && (
                          <img src={option.image_url} alt="" style={{ maxWidth: "100%", marginTop: 6, border: "1px solid #ddd" }}
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{ width: 244, background: NTA.sidebarBg, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>

          {/* Candidate info */}
          <div style={{ background: "#fff", borderBottom: "1px solid #ccc", padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 44, height: 52, background: "#ccc", border: "1px solid #aaa", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {studentAvatar ? <img src={studentAvatar} alt={studentName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 26 }}>👤</span>}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: "bold", color: "#1a3a5c" }}>{studentName}</div>
              <div style={{ fontSize: 10, color: "#666" }}>Roll: {studentRollNumber}</div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ background: "#fff", borderBottom: "1px solid #ccc", padding: "8px 10px" }}>
            {[
              { bg: NTA.palGreen,  round: true,  count: statusCounts.answered,      label: "Answered" },
              { bg: NTA.palRed,    round: true,  count: statusCounts.notAnswered,    label: "Not Answered" },
              { bg: NTA.palGray,   round: false, count: statusCounts.notVisited,     label: "Not Visited" },
              { bg: NTA.palPurple, round: true,  count: statusCounts.markedCount,    label: "Marked for Review" },
              { bg: NTA.palPurple, round: true,  count: statusCounts.answeredMarked, label: "Answered & Marked for Review", greenDot: true },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <div style={{
                  width: 26, height: 26, background: item.bg, color: "#fff",
                  borderRadius: item.round ? "50%" : 3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: "bold", flexShrink: 0, position: "relative"
                }}>
                  {item.count}
                  {item.greenDot && <span style={{ position: "absolute", bottom: -2, right: -2, width: 8, height: 8, background: NTA.palGreen, borderRadius: "50%", border: "1.5px solid #fff" }} />}
                </div>
                <span style={{ fontSize: 11, color: "#333" }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Section palette */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ background: "#4a7ab5", color: "#fff", padding: "5px 10px", fontSize: 12, fontWeight: "bold" }}>
              {currentSection?.name || "Questions"}
            </div>
            <div style={{ padding: "6px 10px 4px", fontSize: 11, color: "#555" }}>Choose a Question</div>
            <div style={{ padding: "0 8px 10px", display: "flex", flexWrap: "wrap", gap: 5 }}>
              {currentSection?.questions.map((q, index) => {
                const status = getQuestionStatus(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setVisitedQuestions(prev => new Set([...prev, q.id]));
                    }}
                    style={palStyle(status)}
                  >
                    {index + 1}
                    {status === "answered-marked" && (
                      <span style={{ position: "absolute", bottom: -2, right: -2, width: 8, height: 8, background: NTA.palGreen, borderRadius: "50%", border: "1.5px solid #fff" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit button */}
          <div style={{ padding: "8px", borderTop: "1px solid #ccc", background: "#fff", flexShrink: 0 }}>
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              style={{ width: "100%", padding: "9px 0", background: NTA.btnSubmit, border: "none", color: "#fff", fontSize: 14, fontWeight: "bold", cursor: "pointer" }}
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTION BAR ── */}
      <div style={{
        background: "#e0e8f0", borderTop: "2px solid #b0c4d8",
        padding: "7px 10px", display: "flex", alignItems: "center", gap: 6,
        flexShrink: 0, marginBottom: 20 /* space for version bar */
      }}>
        {/* Left actions */}
        <button
          onClick={markForReviewAndNext}
          style={{ padding: "7px 14px", background: NTA.btnReview, border: "1px solid #4a148c", color: "#fff", fontSize: 12, cursor: "pointer", borderRadius: 2 }}
        >
          Mark for Review &amp; Next
        </button>
        <button
          onClick={clearResponse}
          style={{ padding: "7px 14px", background: "#fff", border: "1px solid #aaa", color: "#333", fontSize: 12, cursor: "pointer", borderRadius: 2 }}
        >
          Clear Response
        </button>

        {/* Centre nav */}
        <div style={{ flex: 1 }} />
        <button
          onClick={goToPrevQuestion}
          style={{ padding: "7px 14px", background: "#fff", border: "1px solid #999", color: "#333", fontSize: 12, cursor: "pointer", borderRadius: 2 }}
        >
          « Back
        </button>
        <button
          onClick={goToNextQuestion}
          style={{ padding: "7px 14px", background: "#fff", border: "1px solid #999", color: "#333", fontSize: 12, cursor: "pointer", borderRadius: 2 }}
        >
          Next »
        </button>
        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <button
          onClick={saveAndNext}
          style={{ padding: "7px 18px", background: NTA.btnSave, border: "1px solid #0d3d6b", color: "#fff", fontSize: 12, fontWeight: "bold", cursor: "pointer", borderRadius: 2 }}
        >
          Save &amp; Next
        </button>
        <button
          onClick={() => setShowSubmitModal(true)}
          disabled={submitting}
          style={{ padding: "7px 18px", background: NTA.btnSubmit, border: "1px solid #900", color: "#fff", fontSize: 12, fontWeight: "bold", cursor: "pointer", borderRadius: 2 }}
        >
          {submitting ? "…" : "Submit"}
        </button>
      </div>

      {/* Version bar */}
      <NTAVersionBar />

      {/* ── SUBMIT MODAL ── */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#fff", border: "1px solid #aaa", borderRadius: 4, padding: 20, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,.25)", fontFamily: "Arial, sans-serif" }}
            >
              <div style={{ borderBottom: "2px solid #4a7ab5", paddingBottom: 8, marginBottom: 14, fontSize: 15, fontWeight: "bold", color: "#1a3a5c" }}>
                ⚠ Submit Test — Confirmation
              </div>
              <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>Are you sure you want to submit? Once submitted, you cannot change your answers.</p>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { bg: "#e8f5e9", color: "#2e7d32", val: statusCounts.answered,      lbl: "Answered" },
                  { bg: "#ffebee", color: "#c62828", val: questions.length - statusCounts.answered, lbl: "Not Answered" },
                  { bg: "#f3e5f5", color: "#6a1b9a", val: statusCounts.markedCount,    lbl: "Marked for Review" },
                  { bg: "#eceff1", color: "#455a64", val: statusCounts.notVisited,     lbl: "Not Visited" },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.bg, padding: "10px 8px", textAlign: "center", borderRadius: 3 }}>
                    <div style={{ fontSize: 24, fontWeight: "bold", color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>
                Answered &amp; Marked for Review questions will also be evaluated.
              </p>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  style={{ padding: "8px 20px", background: "#fff", border: "1px solid #aaa", fontSize: 13, cursor: "pointer", borderRadius: 2 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  style={{ padding: "8px 20px", background: NTA.btnSubmit, border: "none", color: "#fff", fontSize: 13, fontWeight: "bold", cursor: "pointer", borderRadius: 2 }}
                >
                  {submitting ? "Submitting…" : "Yes, Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* Wrap with FullscreenGuard if enabled (identical to original) */
  if (fullscreenEnabled) {
    return (
      <FullscreenGuard
        maxExits={7}
        onMaxExitsReached={handleMaxFullscreenExits}
        onExitCountChange={handleFullscreenExitCountChange}
        initialExitCount={fullscreenExitCount}
      >
        {testContent}
      </FullscreenGuard>
    );
  }

  return testContent;
}

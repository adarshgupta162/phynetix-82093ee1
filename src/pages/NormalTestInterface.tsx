import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Flag, ChevronLeft, ChevronRight, AlertCircle,
  CheckCircle2, XCircle, Menu, X, Loader2, RotateCcw, Eye, EyeOff, KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import FullscreenGuard from "@/components/test/FullscreenGuard";
import AccessibilityToolbar from "@/components/test/AccessibilityToolbar";
import { LatexRenderer } from "@/components/ui/latex-renderer";

/* ─── TYPES (unchanged) ─── */
interface Question {
  id: string; order: number; question_text: string;
  options: string[] | null; difficulty: string; marks: number;
  negative_marks: number; question_type: string; subject: string;
  chapter: string; image_url?: string; image_urls?: string[];
  section_type?: string; paragraph_id?: string; paragraph_text?: string;
  paragraph_image_urls?: string[];
}
interface Section { id: string; name: string; questions: Question[]; section_type?: string; }

/* ═══════════════════════════════════════════════════════
   EXACT PIXEL COLOURS picked from screenshots
═══════════════════════════════════════════════════════ */
// Screen 1-3
const BLUE_STRIPE   = "#4a90d9";   // top blue bar on screens 1-3
const HEADER_GREY   = "#636363";   // grey header bg
const YELLOW        = "#f5c518";   // system name / candidate name
const INST_HDR      = "#add8e6";   // light-blue "Instructions" bar
const VERSION_BLUE  = "#4a90d9";   // bottom version bar bg
const SIGN_IN_BLUE  = "#29abe2";   // Sign In button
const LOGIN_CARD    = "#e8e8e8";   // login card bg
const LOGIN_HDR     = "#d0d0d0";   // login card header

// Screen 4
const TOPBAR_DARK   = "#1a1a2e";   // very dark top bar
const SEC_TAB_BG    = "#f0f0f0";   // section tab row bg
const SEC_ACT       = "#2979c5";   // active section tab
const SEC_INACT     = "#dce8f4";   // inactive section tab
const SIDEBAR_BG    = "#dce8f5";   // sidebar light blue
const SIDEBAR_TITLE = "#2979c5";   // "SUPR" title row
const BOTTOM_BG     = "#f0f0f0";   // bottom action bar
const SAVE_BTN      = "#2979c5";   // Save & Next / Submit buttons

// Palette — exact from screenshot 4
// Not-visited: light grey SQUARE (border-radius ~3px)
// Not-answered/Current: ORANGE-RED SHIELD (pentagon, rounded top corners only)
// Answered: GREEN CIRCLE
// Marked: PURPLE CIRCLE
// Answered+Marked: PURPLE CIRCLE + small green dot bottom-right
const PAL_GREY      = "#c8c8c8";
const PAL_ORANGE    = "#e05c1a";   // orange-red shield (not answered / current)
const PAL_GREEN     = "#26a65b";   // green circle (answered)
const PAL_PURPLE    = "#7b2fbf";   // purple circle (marked)

/* ═══════════════════════════════════════════════════════
   PALETTE BUTTON — exact shape per status
═══════════════════════════════════════════════════════ */
function PaletteBtn({ num, status, onClick }: { num: number; status: string; onClick: () => void }) {
  let bg = PAL_GREY, color = "#555", borderRadius = "3px", border = "1px solid #aaa";
  let outline = "none";

  if (status === "not-answered" || status === "current") {
    bg = PAL_ORANGE; color = "#fff";
    // Shield = rounded top, straight bottom
    borderRadius = "8px 8px 2px 2px";
    border = "none";
    if (status === "current") outline = "3px solid #e05c1a";
  } else if (status === "answered") {
    bg = PAL_GREEN; color = "#fff"; borderRadius = "50%"; border = "none";
  } else if (status === "marked" || status === "answered-marked") {
    bg = PAL_PURPLE; color = "#fff"; borderRadius = "50%"; border = "none";
  }

  return (
    <div onClick={onClick} style={{
      width: 36, height: 36, background: bg, color, borderRadius, border,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: "bold", cursor: "pointer",
      fontFamily: "Arial,sans-serif", position: "relative", flexShrink: 0,
      outline, outlineOffset: "2px", boxSizing: "border-box",
      userSelect: "none",
    }}>
      {num}
      {status === "answered-marked" && (
        <span style={{
          position: "absolute", bottom: -2, right: -2,
          width: 11, height: 11, background: PAL_GREEN,
          borderRadius: "50%", border: "2px solid #fff",
        }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LEGEND ICON — coloured shapes for legend in sidebar
═══════════════════════════════════════════════════════ */
function LegendIcon({ n, type }: { n: number; type: "answered"|"notans"|"notvisit"|"marked"|"ansmarked" }) {
  const s = {
    answered:  { bg: PAL_GREEN,  color:"#fff", borderRadius:"50%",         border:"none" },
    notans:    { bg: PAL_ORANGE, color:"#fff", borderRadius:"8px 8px 2px 2px", border:"none" },
    notvisit:  { bg: PAL_GREY,   color:"#555", borderRadius:"3px",          border:"1px solid #aaa" },
    marked:    { bg: PAL_PURPLE, color:"#fff", borderRadius:"50%",          border:"none" },
    ansmarked: { bg: PAL_PURPLE, color:"#fff", borderRadius:"50%",          border:"none" },
  }[type];
  return (
    <div style={{ position:"relative", width:26, height:26, background:s.bg, color:s.color, borderRadius:s.borderRadius, border:s.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:"bold", flexShrink:0 }}>
      {n}
      {type === "ansmarked" && <span style={{ position:"absolute", bottom:-2, right:-2, width:9, height:9, background:PAL_GREEN, borderRadius:"50%", border:"2px solid #fff" }} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function NormalTestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();

  /* ── STATE (100% identical to original) ── */
  const [attemptId, setAttemptId]             = useState<string | null>(null);
  const [testName, setTestName]               = useState("Loading...");
  const [questions, setQuestions]             = useState<Question[]>([]);
  const [sections, setSections]               = useState<Section[]>([]);
  const [activeSection, setActiveSection]     = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers]                 = useState<Record<string, string | string[]>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft]               = useState(0);
  const [showPalette, setShowPalette]         = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [submitting, setSubmitting]           = useState(false);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(true);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [currentScreen, setCurrentScreen]     = useState(1);
  const [agreedToTerms, setAgreedToTerms]     = useState(false);
  const [testDuration, setTestDuration]       = useState(0);
  const [hasExistingAttempt, setHasExistingAttempt] = useState(false);
  const [systemId, setSystemId]               = useState("");
  const [studentName, setStudentName]         = useState("Student");
  const [studentAvatar, setStudentAvatar]     = useState<string | null>(null);
  const [examType, setExamType]               = useState<string>("custom");
  const [testType, setTestType]               = useState<string>("full");
  const [studentRollNumber, setStudentRollNumber] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isSaving, setIsSaving]               = useState(false);
  const [timeExpired, setTimeExpired]         = useState(false);

  /* ════ ALL API / BACKEND LOGIC — 100% IDENTICAL TO ORIGINAL ════ */

  useEffect(() => { if (testId) checkExistingAttemptFn(); }, [testId]);

  const checkExistingAttemptFn = async () => {
    try {
      const { data: testData } = await supabase.from("tests")
        .select("name, duration_minutes, fullscreen_enabled, exam_type, test_type")
        .eq("id", testId).single();
      if (testData) {
        setTestName(testData.name); setTestDuration(testData.duration_minutes);
        setFullscreenEnabled(testData.fullscreen_enabled ?? true);
        setExamType(testData.exam_type || "custom"); setTestType(testData.test_type || "full");
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles")
          .select("full_name, avatar_url, roll_number").eq("id", user.id).single();
        setStudentName(profile?.full_name || "Student");
        setStudentAvatar(profile?.avatar_url);
        setStudentRollNumber(profile?.roll_number || user.id.substring(0, 8));
        const storageKey = `systemId_${testId}`;
        let sid = localStorage.getItem(storageKey);
        if (!sid) { sid = `C${Math.floor(100 + Math.random() * 900)}`; localStorage.setItem(storageKey, sid); }
        setSystemId(sid);
        const { data: ea } = await supabase.from("test_attempts")
          .select("id, completed_at, fullscreen_exit_count")
          .eq("test_id", testId).eq("user_id", user.id).maybeSingle();
        if (ea) {
          if (ea.completed_at) { navigate(`/test/${testId}/analysis`); return; }
          setHasExistingAttempt(true); setCurrentScreen(4);
          setFullscreenExitCount(ea.fullscreen_exit_count || 0);
          initializeTest(); return;
        }
      }
      setLoading(false);
    } catch (e) { console.error(e); setLoading(false); }
  };

  const startTest = () => {
    if (!agreedToTerms) {
      toast({ title: "Please agree to the terms", description: "You must agree to the test rules before starting.", variant: "destructive" }); return;
    }
    if (fullscreenEnabled) {
      const el = document.documentElement;
      (el.requestFullscreen?.() || (el as any).webkitRequestFullscreen?.() || (el as any).mozRequestFullScreen?.() || (el as any).msRequestFullscreen?.())?.catch?.(() => {});
    }
    setCurrentScreen(4); setLoading(true); initializeTest();
  };

  const initializeTest = async () => {
    try {
      const { data: td } = await supabase.from("tests").select("fullscreen_enabled").eq("id", testId).single();
      if (td) setFullscreenEnabled(td.fullscreen_enabled ?? true);
      const { data: startData, error: startError } = await supabase.functions.invoke("start-test", { body: { test_id: testId } });
      if (startError || startData?.error) throw new Error(startData?.error || startError?.message || "Failed to start test");
      setAttemptId(startData.attempt_id); setTestName(startData.test_name);
      setTimeLeft(startData.remaining_seconds ?? startData.duration_minutes * 60);
      if (startData.fullscreen_exit_count) setFullscreenExitCount(startData.fullscreen_exit_count);
      if (startData.is_resume && startData.existing_answers) setAnswers(startData.existing_answers);
      if (startData.is_resume && startData.existing_time_per_question) setTimePerQuestion(startData.existing_time_per_question);
      const { data: qData, error: qErr } = await supabase.functions.invoke("get-test-questions", { body: { test_id: testId } });
      if (qErr || qData?.error) throw new Error(qData?.error || qErr?.message || "Failed to load questions");
      if (!qData.questions?.length) throw new Error("No questions found for this test");
      const allQ: Question[] = qData.questions;
      setQuestions(allQ);
      const secMap = new Map<string, Question[]>();
      allQ.forEach((q: Question) => {
        const subj = q.subject || "General";
        const qt = q.question_type || q.section_type || "single_choice";
        const label = qt === "single_choice" ? "SCQ" : qt === "multiple_choice" || qt === "multi" ? "MCQ" : qt === "integer" || qt === "numerical" ? "Integer" : "SCQ";
        const key = `${subj}(${label})`;
        if (!secMap.has(key)) secMap.set(key, []);
        secMap.get(key)!.push(q);
      });
      const secList: Section[] = Array.from(secMap.entries()).map(([name, qs]) => ({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"), name,
        questions: qs.sort((a, b) => a.order - b.order),
        section_type: qs[0]?.question_type || qs[0]?.section_type || "single_choice"
      }));
      setSections(secList);
      if (secList.length) setActiveSection(secList[0].id);
      if (allQ.length) {
        if (startData.is_resume && startData.existing_answers)
          setVisitedQuestions(new Set([allQ[0].id, ...Object.keys(startData.existing_answers)]));
        else setVisitedQuestions(new Set([allQ[0].id]));
      }
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to start test.", variant: "destructive" });
      navigate("/tests");
    }
  };

  useEffect(() => {
    if (timeLeft <= 0 || loading || currentScreen !== 4) return;
    const t = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { clearInterval(t); setTimeExpired(true); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, currentScreen]);

  useEffect(() => { if (timeExpired && attemptId && !submitting) handleSubmit(); }, [timeExpired]);

  const formatTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const currentSection  = sections.find(s => s.id === activeSection);
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const isMultipleChoice = ["multiple_choice","multi"].includes(currentQuestion?.question_type||"") || ["multiple_choice","multi"].includes(currentQuestion?.section_type||"");
  const isIntegerQuestion = ["integer","numerical"].includes(currentQuestion?.question_type||"");

  const handleAnswer = (idx: number) => {
    if (!currentQuestion) return;
    if (isMultipleChoice) {
      const cur = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] as string[] : answers[currentQuestion.id] ? [answers[currentQuestion.id] as string] : [];
      const s = String(idx);
      setAnswers({ ...answers, [currentQuestion.id]: cur.includes(s) ? cur.filter(a => a !== s) : [...cur, s] });
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: String(idx) });
    }
  };

  const handleIntegerAnswer = (v: string) => {
    if (currentQuestion) setAnswers({ ...answers, [currentQuestion.id]: v.replace(/[^0-9-]/g,"") });
  };

  const clearResponse = () => {
    if (!currentQuestion) return;
    const na = { ...answers }; delete na[currentQuestion.id]; setAnswers(na);
  };

  const updateTimeForCurrentQuestion = useCallback(() => {
    if (currentQuestion) {
      const t = Math.floor((Date.now() - questionStartTime) / 1000);
      setTimePerQuestion(p => ({ ...p, [currentQuestion.id]: (p[currentQuestion.id]||0) + t }));
    }
  }, [currentQuestion, questionStartTime]);

  const saveProgress = useCallback(async () => {
    if (!attemptId || isSaving) return;
    setIsSaving(true);
    try {
      const ct = currentQuestion ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;
      const upd = currentQuestion ? { ...timePerQuestion, [currentQuestion.id]: (timePerQuestion[currentQuestion.id]||0) + ct } : timePerQuestion;
      const { error } = await supabase.from("test_attempts").update({ answers, time_per_question: upd }).eq("id", attemptId);
      if (error) console.error("Auto-save failed:", error);
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  }, [attemptId, answers, timePerQuestion, currentQuestion, questionStartTime, isSaving]);

  useEffect(() => {
    if (currentScreen !== 4 || !attemptId || loading) return;
    const i = setInterval(() => saveProgress(), 10000);
    return () => clearInterval(i);
  }, [currentScreen, attemptId, loading, saveProgress]);

  /* SAVE & NEXT — saves only on button click */
  const saveAndNext = async () => {
    updateTimeForCurrentQuestion(); setQuestionStartTime(Date.now());
    await saveProgress(); goToNextQuestion();
  };

  const markForReviewAndNext = async () => {
    if (currentQuestion) { const nm = new Set(markedForReview); nm.add(currentQuestion.id); setMarkedForReview(nm); }
    updateTimeForCurrentQuestion(); setQuestionStartTime(Date.now());
    await saveProgress(); goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (!currentSection) return;
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      const ni = currentQuestionIndex + 1; setCurrentQuestionIndex(ni);
      const nq = currentSection.questions[ni];
      if (nq) setVisitedQuestions(p => new Set([...p, nq.id]));
    } else {
      const ci = sections.findIndex(s => s.id === activeSection);
      if (ci < sections.length - 1) {
        const ns = sections[ci+1]; setActiveSection(ns.id); setCurrentQuestionIndex(0);
        if (ns.questions[0]) setVisitedQuestions(p => new Set([...p, ns.questions[0].id]));
      }
    }
  };

  const handleSubmit = useCallback(async (fromMax = false) => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-test", {
        body: { attempt_id: attemptId, answers, time_taken_seconds: Math.max(1,(testDuration*60)-timeLeft), fullscreen_exit_count: fullscreenExitCount },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Failed to submit test");
      navigate(`/test/${testId}/analysis`, { state: { results: data, testName } });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to submit test.", variant: "destructive" });
      setSubmitting(false);
    }
  }, [attemptId, answers, timeLeft, testId, testName, navigate, submitting, questions, fullscreenExitCount]);

  const handleFullscreenExitCountChange = useCallback((count: number) => {
    setFullscreenExitCount(count);
    if (attemptId) supabase.from("test_attempts").update({ fullscreen_exit_count: count }).eq("id", attemptId).then(({ error }) => { if (error) console.error(error); });
  }, [attemptId]);

  const handleMaxFullscreenExits = useCallback(() => {
    toast({ title: "Test Auto-Submitted", description: "You exceeded the maximum allowed fullscreen exits.", variant: "destructive" });
    handleSubmit(true);
  }, [handleSubmit]);

  const getQuestionStatus = (qid: string) => {
    if (currentQuestion?.id === qid) return "current";
    if (markedForReview.has(qid) && answers[qid] !== undefined) return "answered-marked";
    if (markedForReview.has(qid)) return "marked";
    if (answers[qid] !== undefined) return "answered";
    if (visitedQuestions.has(qid)) return "not-answered";
    return "not-visited";
  };

  const getStatusCounts = () => {
    const answered      = Object.keys(answers).length;
    const notAnswered   = questions.filter(q => visitedQuestions.has(q.id) && answers[q.id] === undefined).length;
    const markedCount   = markedForReview.size;
    const answeredMarked= questions.filter(q => markedForReview.has(q.id) && answers[q.id] !== undefined).length;
    const notVisited    = questions.length - visitedQuestions.size;
    return { answered, notAnswered, markedCount, answeredMarked, notVisited };
  };

  const options = Array.isArray(currentQuestion?.options)
    ? currentQuestion.options.map((o: any) => typeof o==="object"&&o!==null ? { text: o.text||o.label||"", image_url: o.image_url||null } : { text: o, image_url: null }).filter((o: any) => o.text?.trim())
    : typeof currentQuestion?.options==="object"&&currentQuestion?.options!==null
      ? Object.values(currentQuestion.options as Record<string,any>).map((o: any) => typeof o==="object"&&o!==null ? { text: o.text||o.label||"", image_url: o.image_url||null } : { text: o, image_url: null }).filter((o: any) => o.text?.trim())
      : [];

  /* ── LOADING ── */
  if (loading && currentScreen === 4) {
    return (
      <div style={{ minHeight:"100vh", background:"#eaf0f7", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14, fontFamily:"Arial,sans-serif" }}>
        <Loader2 style={{ width:48, height:48, color: SEC_ACT }} className="animate-spin" />
        <p style={{ color:"#555" }}>Loading test, please wait…</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     SHARED HEADER for screens 1–3
     Exact replica of Screenshot 1 header:
     - top blue stripe (40px)
     - grey bar: left=system name yellow, right=candidate name yellow + photo box
  ══════════════════════════════════════════ */
  const renderHeader = () => (
    <>
      <div style={{ height:40, background: BLUE_STRIPE }} />
      <div style={{ background: HEADER_GREY, display:"flex", alignItems:"stretch" }}>
        {/* Left */}
        <div style={{ flex:1, padding:"10px 16px", fontFamily:"Arial,sans-serif", color:"#fff" }}>
          <div style={{ fontSize:13, color:"#ccc" }}>System Name :</div>
          <div style={{ fontSize:30, fontWeight:"bold", color: YELLOW, lineHeight:1.2, letterSpacing:1 }}>{systemId||"C001"}</div>
          <div style={{ fontSize:11, color:"#ccc", marginTop:5 }}>Kindly contact the invigilator if there are any discrepancies in the Name and Photograph displayed on the screen or if the photograph is not yours</div>
        </div>
        {/* Right */}
        <div style={{ display:"flex", alignItems:"center", gap:0, padding:"10px 0" }}>
          <div style={{ textAlign:"right", paddingRight:12, fontFamily:"Arial,sans-serif" }}>
            <div style={{ fontSize:13, color:"#ccc" }}>Candidate Name :</div>
            <div style={{ fontSize:26, fontWeight:"bold", color: YELLOW }}>{studentName}</div>
            <div style={{ fontSize:13, color:"#ccc" }}>Subject : <span style={{ color: YELLOW }}>{testName}</span></div>
          </div>
          {/* Photo — white border box as in screenshot */}
          <div style={{ width:76, height:88, border:"3px solid #ccc", background:"#d8d8d8", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {studentAvatar ? <img src={studentAvatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:46 }}>👤</span>}
          </div>
        </div>
      </div>
    </>
  );

  /* Version bar — bottom, same blue */
  const VersionBar = () => (
    <div style={{ background: VERSION_BLUE, color:"#fff", textAlign:"center", fontSize:12, padding:"4px 0", width:"100%" }}>
      Version : 17.07.00
    </div>
  );

  /* ══════════════════════════════════════════
     SCREEN 1 — Login (exact duplicate screenshot 1)
  ══════════════════════════════════════════ */
  if (currentScreen === 1) {
    return (
      <div style={{ minHeight:"100vh", background:"#fff", display:"flex", flexDirection:"column", fontFamily:"Arial,sans-serif" }}>
        {renderHeader()}
        {/* White body — card centred */}
        <div style={{ flex:1, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {/* Login card: grey bg, border, shadow */}
          <div style={{ width:370, background: LOGIN_CARD, border:"1px solid #bbb", boxShadow:"2px 2px 8px rgba(0,0,0,.18)", borderRadius:2 }}>
            <div style={{ background: LOGIN_HDR, padding:"8px 14px", borderBottom:"1px solid #bbb", fontSize:13, fontWeight:"bold", color:"#333" }}>Login</div>
            <div style={{ padding:"18px 16px" }}>
              {/* Row 1: username */}
              <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:10 }}>
                <div style={{ width:40, height:36, background:"#d0d0d0", border:"1px solid #aaa", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"#555", flexShrink:0 }}>👤</div>
                <input type="text" value={studentRollNumber} disabled readOnly style={{ flex:1, height:36, padding:"0 8px", border:"1px solid #bbb", background:"#f5f5f5", fontSize:13, color:"#444", outline:"none" }} />
                <div style={{ width:40, height:36, background:"#d0d0d0", border:"1px solid #aaa", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#555", cursor:"pointer", flexShrink:0 }}>⌨</div>
              </div>
              {/* Row 2: password */}
              <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:22 }}>
                <div style={{ width:40, height:36, background:"#d0d0d0", border:"1px solid #aaa", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"#555", flexShrink:0 }}>🔒</div>
                <input type="password" value="•••••" disabled readOnly style={{ flex:1, height:36, padding:"0 8px", border:"1px solid #bbb", background:"#f5f5f5", fontSize:13, color:"#666", outline:"none" }} />
                <div style={{ width:40, height:36, background:"#d0d0d0", border:"1px solid #aaa", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#555", cursor:"pointer", flexShrink:0 }}>⌨</div>
              </div>
              {/* Sign In */}
              <button onClick={() => setCurrentScreen(2)} style={{ width:"100%", height:44, background: SIGN_IN_BLUE, border:"none", color:"#fff", fontSize:16, fontWeight:"bold", cursor:"pointer", borderRadius:2, letterSpacing:.5 }}>
                Sign In
              </button>
            </div>
          </div>
        </div>
        <VersionBar />
      </div>
    );
  }

  /* ══════════════════════════════════════════
     SCREEN 2 — General Instructions
     Left: white scrollable panel with light-blue header
     Right: white panel, BLACK left border, candidate photo centred
  ══════════════════════════════════════════ */
  if (currentScreen === 2) {
    return (
      <div style={{ minHeight:"100vh", background:"#fff", display:"flex", flexDirection:"column", fontFamily:"Arial,sans-serif" }}>
        {/* Just the blue stripe — no grey header on instructions screens */}
        <div style={{ height:40, background: BLUE_STRIPE }} />

        <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>
          {/* LEFT panel */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* Light-blue header */}
            <div style={{ background: INST_HDR, padding:"7px 16px", fontSize:14, fontWeight:"bold", color:"#222", borderBottom:"1px solid #90c0d8" }}>
              Instructions
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"22px 28px", fontSize:13, color:"#1a1a1a", lineHeight:1.85, background:"#fff" }}>
              <p style={{ fontWeight:"bold", fontSize:14 }}>Please read the instructions carefully</p>
              <p style={{ color:"#cc2200", fontWeight:"bold", fontSize:13, marginTop:3 }}>This Mock Exam Only for Practice Purpose</p>

              <p style={{ fontWeight:"bold", textDecoration:"underline", marginTop:24, marginBottom:10, fontSize:13 }}>General Instructions:</p>
              <ol style={{ marginLeft:22, lineHeight:2.1 }}>
                <li>Total duration of examination is <strong>{testDuration||180} minutes</strong>.</li>
                <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
                <li>The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:</li>
              </ol>

              <div style={{ marginLeft:30, marginTop:18, display:"flex", flexDirection:"column", gap:14 }}>
                {/* 1 not-visited: grey square */}
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:28, height:28, background: PAL_GREY, border:"1px solid #aaa", borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold", color:"#555", flexShrink:0 }}>1</div>
                  <span>You have not visited the question yet.</span>
                </div>
                {/* 2 not-answered: orange shield */}
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:28, height:28, background: PAL_ORANGE, borderRadius:"8px 8px 2px 2px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold", color:"#fff", flexShrink:0 }}>2</div>
                  <span>You have not answered the question.</span>
                </div>
                {/* 3 answered: green circle */}
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:28, height:28, background: PAL_GREEN, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold", color:"#fff", flexShrink:0 }}>3</div>
                  <span>You have answered the question.</span>
                </div>
                {/* 4 marked: purple circle */}
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:28, height:28, background: PAL_PURPLE, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold", color:"#fff", flexShrink:0 }}>4</div>
                  <span>You have NOT answered the question, but have marked the question for review.</span>
                </div>
                {/* 5 answered+marked: purple circle + green dot */}
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ position:"relative", width:28, height:28, background: PAL_PURPLE, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold", color:"#fff", flexShrink:0 }}>
                    5
                    <span style={{ position:"absolute", bottom:-2, right:-2, width:10, height:10, background: PAL_GREEN, borderRadius:"50%", border:"2px solid #fff" }} />
                  </div>
                  <span>The question(s) "Answered and Marked for Review" will be considered for evaluation.</span>
                </div>
              </div>
              <p style={{ marginTop:16, fontSize:12, color:"#555" }}>The Marked for Review status for a question simply indicates that you would like to look at that question again.</p>
            </div>
            {/* Next button */}
            <div style={{ padding:"10px 16px", borderTop:"1px solid #ddd", display:"flex", justifyContent:"flex-end", background:"#fff" }}>
              <button onClick={() => setCurrentScreen(3)} style={{ padding:"6px 22px", background:"#fff", border:"1px solid #999", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                Next &gt;
              </button>
            </div>
          </div>
          {/* RIGHT panel — white, thick black left border */}
          <div style={{ width:190, borderLeft:"2px solid #000", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", paddingTop:26 }}>
            <div style={{ width:100, height:112, background:"#e0e0e0", border:"2px solid #aaa", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
              {studentAvatar ? <img src={studentAvatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:54 }}>👤</span>}
            </div>
            <p style={{ fontSize:13, fontWeight:"bold", color:"#1a1a1a", textAlign:"center", padding:"0 8px" }}>{studentName}</p>
          </div>
        </div>
        <VersionBar />
      </div>
    );
  }

  /* ══════════════════════════════════════════
     SCREEN 3 — Other Important Instructions (JEE Mains specific)
  ══════════════════════════════════════════ */
  if (currentScreen === 3) {
    return (
      <div style={{ minHeight:"100vh", background:"#fff", display:"flex", flexDirection:"column", fontFamily:"Arial,sans-serif" }}>
        <div style={{ height:40, background: BLUE_STRIPE }} />
        <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>
          {/* LEFT panel */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ background: INST_HDR, padding:"7px 16px", fontSize:14, fontWeight:"bold", color:"#222", borderBottom:"1px solid #90c0d8" }}>
              Other Important Instructions
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"20px 28px", fontSize:13, color:"#1a1a1a", lineHeight:1.9, background:"#fff" }}>
              <p style={{ textAlign:"center", fontWeight:"bold", marginBottom:20 }}>General instructions:</p>

              <p style={{ fontWeight:"bold" }}>The motive for enabling this mock SAMPLE test is to familiarize the candidates with the Computer Based Test (CBT) environment of the JEE Main conducted by NTA.</p>
              <br />
              <p style={{ fontWeight:"bold" }}>The types of questions and marking scheme is only illustrative and is in no way indicative or representative of the actual JEE Main question paper.</p>
              <br />
              <p style={{ fontWeight:"bold" }}>Section wise Instructions</p>
              <br />
              <p style={{ fontWeight:"bold" }}>Note: There will be 25% negative marking for MCQ (Section A) only. No negative marking for Integer type (Section B).</p>
              <p style={{ fontWeight:"bold" }}>
                SECTION A: Multiple Choice Questions — Each question has 4 options, only 1 is correct.<br />
                +4 for correct answer, –1 for wrong answer, 0 for unattempted.
              </p>
              <br />
              <p style={{ fontWeight:"bold" }}>
                SECTION B: Integer / Numerical Value Questions — Enter a numerical answer.<br />
                +4 for correct answer, 0 for wrong or unattempted.
              </p>
              <br />
              <p style={{ fontWeight:"bold" }}>No clarification will be provided during the exam.</p>
              <br />
              <p style={{ fontWeight:"bold" }}>Calculators and other electronic devices are not allowed during the exam. Rough sheets and pens will be provided in the exam center. A virtual on-screen calculator is available for use.</p>
              <br />
              <p style={{ fontWeight:"bold" }}>Some questions may have more than one answer correct. Points will be given only when <span style={{ textDecoration:"underline" }}>ALL</span> the correct answers are marked and <span style={{ textDecoration:"underline" }}>NONE</span> of the incorrect are marked.</p>
            </div>

            {/* Declaration checkbox + buttons */}
            <div style={{ borderTop:"1px solid #ddd", background:"#fff" }}>
              <div style={{ padding:"10px 20px 10px", display:"flex", alignItems:"flex-start", gap:8, borderBottom:"1px solid #ddd" }}>
                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop:3, width:14, height:14, flexShrink:0, cursor:"pointer" }} />
                <span style={{ fontSize:11.5, color:"#333", lineHeight:1.65 }}>
                  I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall.I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations
                </span>
              </div>
              <div style={{ padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <button onClick={() => setCurrentScreen(2)}
                  style={{ padding:"7px 18px", background:"#fff", border:"1px solid #888", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                  &lt; Previous
                </button>
                <button onClick={startTest} disabled={!agreedToTerms || loading}
                  style={{ padding:"9px 30px", background: agreedToTerms ? "#5ba3d9" : "#9ab8cc", border:"none", color:"#fff", fontSize:14, fontWeight:"bold", cursor: agreedToTerms ? "pointer" : "not-allowed", borderRadius:2 }}>
                  {loading ? "Loading…" : "I am ready to begin"}
                </button>
              </div>
            </div>
          </div>
          {/* RIGHT panel */}
          <div style={{ width:190, borderLeft:"2px solid #000", background:"#fff", display:"flex", flexDirection:"column", alignItems:"center", paddingTop:26 }}>
            <div style={{ width:100, height:112, background:"#e0e0e0", border:"2px solid #aaa", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
              {studentAvatar ? <img src={studentAvatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:54 }}>👤</span>}
            </div>
            <p style={{ fontSize:13, fontWeight:"bold", color:"#1a1a1a", textAlign:"center", padding:"0 8px" }}>{studentName}</p>
          </div>
        </div>
        <VersionBar />
      </div>
    );
  }

  /* ══════════════════════════════════════════
     SCREEN 4 — MAIN TEST
     Pixel-perfect duplicate of Screenshot 4
  ══════════════════════════════════════════ */
  const sc = getStatusCounts();

  const testContent = (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", fontFamily:"Arial,sans-serif", fontSize:13, overflow:"hidden", background:"#f5f5f5" }}>

      {/* ROW 1: Dark top bar — "PHYNETIX" left, Instructions + Question Paper right */}
      <div style={{ background: TOPBAR_DARK, color:"#fff", height:30, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 10px", flexShrink:0 }}>
        <span style={{ fontSize:13, fontWeight:"bold" }}>PHYNETIX</span>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <AccessibilityToolbar inline />
          <button style={{ background:"transparent", border:"none", color:"#aaccee", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ width:15, height:15, background:"#2979c5", borderRadius:"50%", display:"inline-flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:9, fontWeight:"bold", flexShrink:0 }}>i</span>
            Instructions
          </button>
          <button style={{ background:"transparent", border:"none", color:"#aaccee", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
            <span style={{ width:15, height:15, background:"#26a65b", borderRadius:"50%", display:"inline-flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:9, flexShrink:0 }}>≡</span>
            Question Paper
          </button>
        </div>
      </div>

      {/* ROW 2: Section tabs + Time Left + candidate mini photo */}
      <div style={{ background: SEC_TAB_BG, borderBottom:"1px solid #ccc", padding:"3px 8px", display:"flex", alignItems:"center", gap:4, flexShrink:0, overflowX:"auto" }}>
        {sections.map(sec => (
          <button key={sec.id}
            onClick={() => {
              setActiveSection(sec.id); setCurrentQuestionIndex(0);
              const firstQ = sec.questions[0];
              if (firstQ) setVisitedQuestions(p => new Set([...p, firstQ.id]));
            }}
            style={{ display:"flex", alignItems:"center", gap:3, padding:"5px 14px", border:"1px solid", borderColor: activeSection===sec.id ? "#1a60b0" : "#b0c8e0", borderRadius:3, background: activeSection===sec.id ? SEC_ACT : SEC_INACT, color: activeSection===sec.id ? "#fff" : "#1a1a1a", fontSize:12, fontWeight:"bold", cursor:"pointer", whiteSpace:"nowrap" }}>
            {sec.name}
            <span style={{ width:14, height:14, background: activeSection===sec.id ? "rgba(255,255,255,.35)" : "#4a90d9", borderRadius:"50%", display:"inline-flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:9, fontWeight:"bold" }}>i</span>
          </button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          {isSaving && <span style={{ fontSize:10, color:"#888" }}>Saving…</span>}
          {/* Time Left — plain text as in screenshot, no box */}
          <span style={{ fontSize:13, fontWeight:"bold", color:"#000" }}>
            Time Left : <span style={{ color: timeLeft < 300 ? "#cc0000" : "#000" }}>{formatTime(timeLeft)}</span>
          </span>
          {/* candidate photo */}
          <div style={{ width:40, height:46, border:"1px solid #bbb", overflow:"hidden", background:"#ddd", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {studentAvatar ? <img src={studentAvatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:22 }}>👤</span>}
          </div>
          <span style={{ fontSize:12, fontWeight:"bold", color:"#111", maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{studentName}</span>
        </div>
      </div>

      {/* ROW 3: "Sections" label + sub-section arrow row */}
      <div style={{ background:"#fff", borderBottom:"1px solid #ccc", padding:"3px 8px", display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
        <span style={{ fontSize:11, color:"#555", fontWeight:"bold", marginRight:4 }}>Sections</span>
        <button style={{ width:20, height:20, background:"#e0e0e0", border:"1px solid #bbb", cursor:"pointer", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>◀</button>
        {/* sub-section tab */}
        <button style={{ padding:"3px 14px", background: SEC_ACT, color:"#fff", border:"none", fontSize:12, fontWeight:"bold", cursor:"pointer", borderRadius:2, display:"flex", alignItems:"center", gap:4 }}>
          {currentSection?.name || "Section"}
          <span style={{ width:14, height:14, background:"rgba(255,255,255,.25)", borderRadius:"50%", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:9 }}>i</span>
        </button>
        <button style={{ width:20, height:20, background:"#e0e0e0", border:"1px solid #bbb", cursor:"pointer", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>▶</button>
      </div>

      {/* MAIN BODY */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* LEFT: Question area */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", borderRight:"1px solid #ccc" }}>
          <div style={{ flex:1, overflowY:"auto", padding:"14px 18px", background:"#fff" }}>

            {/* Question No. header */}
            <div style={{ fontWeight:"bold", fontSize:13, marginBottom:12, color:"#000" }}>
              Question No. {currentQuestionIndex + 1}
            </div>

            {/* Paragraph */}
            {currentQuestion?.paragraph_text && (
              <div style={{ marginBottom:14, padding:"10px 14px", background:"#fffde7", border:"1px solid #f0c040", fontSize:13, lineHeight:1.7 }}>
                <div style={{ fontSize:10, fontWeight:"bold", color:"#9a6500", marginBottom:5, textTransform:"uppercase" }}>Paragraph</div>
                <LatexRenderer content={currentQuestion.paragraph_text} />
                {currentQuestion.paragraph_image_urls?.map((img, i) => (
                  <img key={i} src={img} alt="" style={{ maxWidth:"100%", marginTop:6, border:"1px solid #ddd" }} />
                ))}
              </div>
            )}

            {/* Question images */}
            {(() => {
              const imgs = currentQuestion?.image_urls?.length ? currentQuestion.image_urls : currentQuestion?.image_url ? [currentQuestion.image_url] : [];
              return imgs.length > 0 && <div style={{ marginBottom:10 }}>{imgs.map((u,i) => <img key={i} src={u} alt="" style={{ maxWidth:"100%", border:"1px solid #ddd", marginBottom:6 }} onError={e=>{(e.target as HTMLImageElement).style.display="none";}} />)}</div>;
            })()}

            {/* Question text */}
            {currentQuestion?.question_text && (
              <div style={{ fontSize:14, lineHeight:1.85, color:"#000", marginBottom:16 }}>
                <LatexRenderer content={currentQuestion.question_text} />
              </div>
            )}

            {/* ── OPTIONS — NTA exact style ── */}
            {isIntegerQuestion ? (
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:13, color:"#444", marginBottom:8 }}>Enter your answer (integer only):</div>
                <input type="text" inputMode="numeric"
                  value={currentQuestion ? (answers[currentQuestion.id] as string||"") : ""}
                  onChange={e => handleIntegerAnswer(e.target.value)}
                  placeholder="Type answer"
                  style={{ padding:"8px 12px", border:"1px solid #888", width:180, fontSize:16, fontFamily:"monospace", textAlign:"center", outline:"none" }} />
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {options.map((opt, idx) => {
                  const optStr = String(idx);
                  const curAns = currentQuestion ? answers[currentQuestion.id] : undefined;
                  const selected = isMultipleChoice
                    ? Array.isArray(curAns) && curAns.includes(optStr)
                    : curAns === optStr;

                  return (
                    <label key={idx} style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", padding:"2px 0" }}>
                      {/*
                        RADIO BUTTON — exact NTA look:
                        Unselected: white fill, dark (near-black) border ~1.5px, circle ~18px
                        Selected:   blue fill (#1a73e8), white inner dot
                        We use a custom div — NOT native <input> — for pixel accuracy
                      */}
                      <div
                        onClick={() => handleAnswer(idx)}
                        style={{
                          width: 18, height: 18, borderRadius: "50%",
                          border: selected ? "2px solid #1a73e8" : "2px solid #333",
                          background: selected ? "#1a73e8" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, marginTop: 3, cursor: "pointer",
                          boxSizing: "border-box",
                          transition: "border-color .1s, background .1s",
                        }}>
                        {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                      </div>

                      {/* Option text */}
                      <div style={{ flex:1, fontSize:14, lineHeight:1.75, color:"#000" }} onClick={() => handleAnswer(idx)}>
                        <LatexRenderer content={opt.text} />
                        {opt.image_url && (
                          <img src={opt.image_url} alt="" style={{ maxWidth:"100%", marginTop:6, border:"1px solid #ddd" }}
                            onError={e=>{(e.target as HTMLImageElement).style.display="none";}} />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar — exact from screenshot 4 */}
        <div style={{ width:232, background: SIDEBAR_BG, display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>

          {/* Candidate photo + name */}
          <div style={{ background:"#fff", borderBottom:"1px solid #ccc", padding:"8px", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{ width:58, height:66, background:"#ccc", border:"1px solid #aaa", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:5 }}>
              {studentAvatar ? <img src={studentAvatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:32 }}>👤</span>}
            </div>
            <div style={{ fontSize:12, fontWeight:"bold", color:"#111", textAlign:"center" }}>{studentName}</div>
          </div>

          {/* Legend — 2-col grid as in screenshot */}
          <div style={{ background:"#fff", borderBottom:"1px solid #ccc", padding:"8px 10px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"auto 1fr auto 1fr", gap:"6px 4px", alignItems:"center" }}>
              <LegendIcon n={sc.answered}      type="answered"  />
              <span style={{ fontSize:11 }}>Answered</span>
              <LegendIcon n={sc.notAnswered}   type="notans"    />
              <span style={{ fontSize:11 }}>Not Answered</span>
              <LegendIcon n={sc.notVisited}    type="notvisit"  />
              <span style={{ fontSize:11 }}>Not Visited</span>
              <LegendIcon n={sc.markedCount}   type="marked"    />
              <span style={{ fontSize:11 }}>Marked for Review</span>
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:6, marginTop:6 }}>
              <LegendIcon n={sc.answeredMarked} type="ansmarked" />
              <span style={{ fontSize:11, lineHeight:1.4 }}>Answered &amp; Marked for Review (will also be evaluated)</span>
            </div>
          </div>

          {/* Section title + "Choose a Question" */}
          <div style={{ background: SIDEBAR_TITLE, color:"#fff", padding:"5px 10px", fontSize:13, fontWeight:"bold", flexShrink:0 }}>
            {currentSection?.name || "Section"}
          </div>
          <div style={{ padding:"3px 10px 3px", fontSize:11, color:"#444", background:"#fff", flexShrink:0, borderBottom:"1px solid #ddd" }}>
            Choose a Question
          </div>

          {/* Palette grid — 4 columns */}
          <div style={{ flex:1, overflowY:"auto", padding:"8px 10px", background: SIDEBAR_BG }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
              {currentSection?.questions.map((q, idx) => (
                <PaletteBtn
                  key={q.id}
                  num={idx + 1}
                  status={getQuestionStatus(q.id)}
                  onClick={() => {
                    /* Palette click = navigate ONLY, no save */
                    setCurrentQuestionIndex(idx);
                    setVisitedQuestions(p => new Set([...p, q.id]));
                  }}
                />
              ))}
            </div>
          </div>

          {/* Submit sidebar button */}
          <div style={{ padding:"7px 8px", borderTop:"1px solid #ccc", background:"#fff", flexShrink:0 }}>
            <button onClick={() => setShowSubmitModal(true)} disabled={submitting}
              style={{ width:"100%", padding:"9px 0", background: SAVE_BTN, border:"none", color:"#fff", fontSize:14, fontWeight:"bold", cursor:"pointer", borderRadius:2 }}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTION BAR — exact from screenshot 4 ──
          [Mark for Review & Next] [Clear Response]    spacer    [Save & Next] [Submit]
          No Back / Next buttons (removed as requested)
      */}
      <div style={{ background: BOTTOM_BG, borderTop:"2px solid #c8c8c8", padding:"7px 10px", display:"flex", alignItems:"center", flexShrink:0 }}>
        <button onClick={markForReviewAndNext}
          style={{ padding:"8px 16px", background:"#fff", border:"1px solid #888", fontSize:13, cursor:"pointer", borderRadius:2, marginRight:8 }}>
          Mark for Review &amp; Next
        </button>
        <button onClick={clearResponse}
          style={{ padding:"8px 14px", background:"#fff", border:"1px solid #888", fontSize:13, cursor:"pointer", borderRadius:2 }}>
          Clear Response
        </button>
        <div style={{ flex:1 }} />
        <button onClick={saveAndNext}
          style={{ padding:"8px 22px", background: SAVE_BTN, border:"none", color:"#fff", fontSize:13, fontWeight:"bold", cursor:"pointer", borderRadius:2, marginRight:8 }}>
          Save &amp; Next
        </button>
        <button onClick={() => setShowSubmitModal(true)} disabled={submitting}
          style={{ padding:"8px 22px", background: SAVE_BTN, border:"none", color:"#fff", fontSize:13, fontWeight:"bold", cursor:"pointer", borderRadius:2 }}>
          {submitting ? "…" : "Submit"}
        </button>
      </div>

      {/* ── SUBMIT MODAL ── */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}
            onClick={() => setShowSubmitModal(false)}>
            <motion.div initial={{ scale:.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.95, opacity:0 }}
              onClick={e => e.stopPropagation()}
              style={{ background:"#fff", border:"1px solid #bbb", borderRadius:4, padding:22, width:420, fontFamily:"Arial,sans-serif", boxShadow:"0 8px 32px rgba(0,0,0,.25)" }}>
              <div style={{ borderBottom:"2px solid #2979c5", paddingBottom:8, marginBottom:14, fontSize:15, fontWeight:"bold", color:"#1a3a5c" }}>
                ⚠ Submit Test — Confirmation
              </div>
              <p style={{ fontSize:12, color:"#555", marginBottom:12 }}>Are you sure you want to submit? Once submitted, you cannot change your answers.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                {[
                  { bg:"#e8f5e9", color:"#2e7d32", val: sc.answered,                   lbl:"Answered" },
                  { bg:"#ffebee", color:"#c62828", val: questions.length-sc.answered,   lbl:"Not Answered" },
                  { bg:"#f3e5f5", color:"#6a1b9a", val: sc.markedCount,                 lbl:"Marked for Review" },
                  { bg:"#eceff1", color:"#455a64", val: sc.notVisited,                  lbl:"Not Visited" },
                ].map((s, i) => (
                  <div key={i} style={{ background:s.bg, padding:"10px 8px", textAlign:"center", borderRadius:3 }}>
                    <div style={{ fontSize:24, fontWeight:"bold", color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:11, color:"#666", marginTop:2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:"#888", marginBottom:14 }}>Answered &amp; Marked for Review questions will also be evaluated.</p>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button onClick={() => setShowSubmitModal(false)}
                  style={{ padding:"8px 20px", background:"#fff", border:"1px solid #aaa", fontSize:13, cursor:"pointer", borderRadius:2 }}>Cancel</button>
                <button onClick={() => handleSubmit()} disabled={submitting}
                  style={{ padding:"8px 20px", background:"#cc0000", border:"none", color:"#fff", fontSize:13, fontWeight:"bold", cursor:"pointer", borderRadius:2 }}>
                  {submitting ? "Submitting…" : "Yes, Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (fullscreenEnabled) {
    return (
      <FullscreenGuard maxExits={7} onMaxExitsReached={handleMaxFullscreenExits} onExitCountChange={handleFullscreenExitCountChange} initialExitCount={fullscreenExitCount}>
        {testContent}
      </FullscreenGuard>
    );
  }
  return testContent;
}

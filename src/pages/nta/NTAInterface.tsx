import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import FullscreenGuard from "@/components/test/FullscreenGuard";
import { LatexRenderer } from "@/components/ui/latex-renderer";

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
  section_type?: string;
}

interface Section {
  id: string;
  name: string;
  questions: Question[];
}

interface LocationState {
  testName?: string;
  studentName?: string;
  studentAvatar?: string | null;
  systemId?: string;
  fullscreenEnabled?: boolean;
  examType?: string;
  testType?: string;
  testDuration?: number;
  attemptId?: string;
  timeLeft?: number;
  existingAnswers?: Record<string, string | string[]> | null;
  existingTimePerQuestion?: Record<string, number> | null;
  fullscreenExitCount?: number;
}

export default function NTAInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initState = (location.state as LocationState) || {};

  // Derived from location state
  const [testName, setTestName] = useState(initState.testName || "Test");
  const [studentName] = useState(initState.studentName || "Student");
  const [studentAvatar] = useState(initState.studentAvatar || null);
  const [systemId] = useState(initState.systemId || "");
  const [fullscreenEnabled] = useState(initState.fullscreenEnabled ?? true);

  // Test state
  const [attemptId, setAttemptId] = useState<string | null>(initState.attemptId || null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    initState.existingAnswers || {}
  );
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(initState.timeLeft || 0);
  const initialTimeLeftRef = useRef(initState.timeLeft || 0);
  const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>(
    initState.existingTimePerQuestion || {}
  );
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [fullscreenExitCount, setFullscreenExitCount] = useState(
    initState.fullscreenExitCount || 0
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Load questions on mount
  useEffect(() => {
    if (testId) loadTest();
  }, [testId]);

  const loadTest = async () => {
    try {
      // If no attemptId yet (direct page load / resume without going through instructions)
      let aid = initState.attemptId;
      let tLeft = initState.timeLeft;
      let existingAns = initState.existingAnswers;
      let existingTpq = initState.existingTimePerQuestion;
      let fsExitCount = initState.fullscreenExitCount || 0;

      if (!aid) {
        // Try to start/resume test
        const { data: startData, error: startError } = await supabase.functions.invoke(
          "start-test",
          { body: { test_id: testId } }
        );
        if (startError || startData?.error) {
          throw new Error(startData?.error || startError?.message || "Failed to start test");
        }
        aid = startData.attempt_id;
        tLeft = startData.duration_minutes * 60;
        if (startData.test_name) setTestName(startData.test_name);
        if (startData.is_resume && startData.existing_answers) {
          existingAns = startData.existing_answers;
        }
        if (startData.is_resume && startData.existing_time_per_question) {
          existingTpq = startData.existing_time_per_question;
        }
        fsExitCount = startData.fullscreen_exit_count || 0;
      }

      setAttemptId(aid!);
      const resolvedTimeLeft = tLeft || 0;
      setTimeLeft(resolvedTimeLeft);
      initialTimeLeftRef.current = resolvedTimeLeft;
      if (existingAns) setAnswers(existingAns);
      if (existingTpq) setTimePerQuestion(existingTpq);
      setFullscreenExitCount(fsExitCount);

      // Fetch questions
      const { data: qData, error: qError } = await supabase.functions.invoke(
        "get-test-questions",
        { body: { test_id: testId } }
      );
      if (qError || qData?.error) {
        throw new Error(qData?.error || qError?.message || "Failed to load questions");
      }
      if (!qData.questions || qData.questions.length === 0) {
        throw new Error("No questions found for this test");
      }

      const allQuestions: Question[] = qData.questions;
      setQuestions(allQuestions);

      // Group by subject
      const subjectMap = new Map<string, Question[]>();
      allQuestions.forEach((q: Question) => {
        const subj = q.subject || "General";
        if (!subjectMap.has(subj)) subjectMap.set(subj, []);
        subjectMap.get(subj)!.push(q);
      });

      const sectionsList: Section[] = Array.from(subjectMap.entries()).map(([name, qs]) => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        questions: qs.sort((a, b) => a.order - b.order),
      }));

      setSections(sectionsList);
      if (sectionsList.length > 0) setActiveSection(sectionsList[0].id);

      // Mark visited
      if (allQuestions.length > 0) {
        const visitedIds = new Set([
          allQuestions[0].id,
          ...(existingAns ? Object.keys(existingAns) : []),
        ]);
        setVisitedQuestions(visitedIds);
      }

      setLoading(false);
    } catch (err: any) {
      console.error("NTAInterface load error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load test. Please try again.",
        variant: "destructive",
      });
      navigate("/tests");
    }
  };

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentSection = sections.find((s) => s.id === activeSection);
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  const isMultipleChoice =
    currentQuestion?.question_type === "multiple_choice" ||
    currentQuestion?.question_type === "multi" ||
    currentQuestion?.section_type === "multiple_choice" ||
    currentQuestion?.section_type === "multi";

  const isIntegerQuestion =
    currentQuestion?.question_type === "integer" ||
    currentQuestion?.question_type === "numerical";

  // Parse options
  const options = Array.isArray(currentQuestion?.options)
    ? currentQuestion.options
        .map((opt: any) => {
          if (typeof opt === "object" && opt !== null) {
            return { text: opt.text || opt.label || "", image_url: opt.image_url || null };
          }
          return { text: opt, image_url: null };
        })
        .filter((opt: any) => opt.text && opt.text.trim() !== "")
    : typeof currentQuestion?.options === "object" && currentQuestion?.options !== null
    ? Object.values(currentQuestion.options as Record<string, any>)
        .map((opt: any) => {
          if (typeof opt === "object" && opt !== null) {
            return { text: opt.text || opt.label || "", image_url: opt.image_url || null };
          }
          return { text: opt, image_url: null };
        })
        .filter((opt: any) => opt.text && opt.text.trim() !== "")
    : [];

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuestion) return;
    if (isMultipleChoice) {
      const current = Array.isArray(answers[currentQuestion.id])
        ? (answers[currentQuestion.id] as string[])
        : answers[currentQuestion.id]
        ? [answers[currentQuestion.id] as string]
        : [];
      const optStr = String(optionIndex);
      const updated = current.includes(optStr)
        ? current.filter((a) => a !== optStr)
        : [...current, optStr];
      setAnswers({ ...answers, [currentQuestion.id]: updated });
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: String(optionIndex) });
    }
  };

  const handleIntegerAnswer = (value: string) => {
    if (currentQuestion) {
      setAnswers({ ...answers, [currentQuestion.id]: value.replace(/[^0-9-]/g, "") });
    }
  };

  const clearResponse = () => {
    if (currentQuestion) {
      const updated = { ...answers };
      delete updated[currentQuestion.id];
      setAnswers(updated);
    }
  };

  const updateTimeForCurrent = useCallback(() => {
    if (currentQuestion) {
      const spent = Math.floor((Date.now() - questionStartTime) / 1000);
      setTimePerQuestion((prev) => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + spent,
      }));
    }
  }, [currentQuestion, questionStartTime]);

  const saveProgress = useCallback(async () => {
    if (!attemptId || isSaving) return;
    setIsSaving(true);
    try {
      const currentSpent = currentQuestion
        ? Math.floor((Date.now() - questionStartTime) / 1000)
        : 0;
      const updatedTpq = currentQuestion
        ? {
            ...timePerQuestion,
            [currentQuestion.id]: (timePerQuestion[currentQuestion.id] || 0) + currentSpent,
          }
        : timePerQuestion;
      await supabase
        .from("test_attempts")
        .update({ answers, time_per_question: updatedTpq })
        .eq("id", attemptId);
    } catch (err) {
      console.error("Auto-save error:", err);
    } finally {
      setIsSaving(false);
    }
  }, [attemptId, answers, timePerQuestion, currentQuestion, questionStartTime, isSaving]);

  // Auto-save every 10s
  useEffect(() => {
    if (loading || !attemptId) return;
    const interval = setInterval(saveProgress, 10000);
    return () => clearInterval(interval);
  }, [loading, attemptId, saveProgress]);

  const goToNextQuestion = () => {
    if (!currentSection) return;
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      const next = currentQuestionIndex + 1;
      setCurrentQuestionIndex(next);
      const nextQ = currentSection.questions[next];
      if (nextQ) setVisitedQuestions((prev) => new Set([...prev, nextQ.id]));
    } else {
      const idx = sections.findIndex((s) => s.id === activeSection);
      if (idx < sections.length - 1) {
        const nextSec = sections[idx + 1];
        setActiveSection(nextSec.id);
        setCurrentQuestionIndex(0);
        if (nextSec.questions[0])
          setVisitedQuestions((prev) => new Set([...prev, nextSec.questions[0].id]));
      }
    }
  };

  const saveAndNext = async () => {
    updateTimeForCurrent();
    setQuestionStartTime(Date.now());
    await saveProgress();
    goToNextQuestion();
  };

  const markForReviewAndNext = async () => {
    if (currentQuestion) {
      setMarkedForReview((prev) => new Set([...prev, currentQuestion.id]));
    }
    updateTimeForCurrent();
    setQuestionStartTime(Date.now());
    await saveProgress();
    goToNextQuestion();
  };

  const handleSubmit = useCallback(
    async (_fromMax = false) => {
      if (!attemptId || submitting) return;
      setSubmitting(true);
      try {
        const { data, error } = await supabase.functions.invoke("submit-test", {
          body: {
            attempt_id: attemptId,
            answers,
            time_taken_seconds: Math.max(1, initialTimeLeftRef.current > 0 ? initialTimeLeftRef.current - timeLeft : 1),
            fullscreen_exit_count: fullscreenExitCount,
          },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        navigate(`/test/${testId}/analysis`, { state: { results: data, testName } });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to submit. Please try again.",
          variant: "destructive",
        });
        setSubmitting(false);
      }
    },
    [attemptId, answers, timeLeft, testId, testName, navigate, submitting, fullscreenExitCount]
  );

  const handleFullscreenExitChange = useCallback(
    (count: number) => {
      setFullscreenExitCount(count);
      if (attemptId) {
        supabase
          .from("test_attempts")
          .update({ fullscreen_exit_count: count })
          .eq("id", attemptId)
          .then(({ error }) => {
            if (error) console.error("Failed to update exit count:", error);
          });
      }
    },
    [attemptId]
  );

  const handleMaxExits = useCallback(() => {
    toast({
      title: "Test Auto-Submitted",
      description: "You exceeded the maximum allowed fullscreen exits.",
      variant: "destructive",
    });
    handleSubmit(true);
  }, [handleSubmit]);

  const getQuestionStatus = (questionId: string) => {
    if (currentQuestion?.id === questionId) return "current";
    if (markedForReview.has(questionId) && answers[questionId] !== undefined)
      return "answered-marked";
    if (markedForReview.has(questionId)) return "marked";
    if (answers[questionId] !== undefined) return "answered";
    if (visitedQuestions.has(questionId)) return "not-answered";
    return "not-visited";
  };

  const getStatusCounts = () => {
    const answered = Object.keys(answers).length;
    const notAnswered = questions.filter(
      (q) => visitedQuestions.has(q.id) && answers[q.id] === undefined
    ).length;
    const markedCount = markedForReview.size;
    const answeredMarked = questions.filter(
      (q) => markedForReview.has(q.id) && answers[q.id] !== undefined
    ).length;
    const notVisited = questions.length - visitedQuestions.size;
    return { answered, notAnswered, markedCount, answeredMarked, notVisited };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">Loading test...</p>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  const testContent = (
    <div className="min-h-screen bg-[#0a1628] flex flex-col pb-14 md:pb-16">
      {/* Header */}
      <header className="bg-[#1a2332] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-medium">{testName}</h1>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 text-xs"
            onClick={() => setShowInstructions(true)}
          >
            Instructions
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 text-xs"
            disabled
            title="Question Paper feature coming soon"
          >
            Question Paper
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded font-mono font-bold text-sm",
              timeLeft < 300 ? "bg-[#ef4444] text-white" : "bg-white text-black"
            )}
          >
            <Clock className="w-4 h-4" />
            Time Left: {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center overflow-hidden">
              {studentAvatar ? (
                <img src={studentAvatar} alt={studentName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg" role="img" aria-label="User avatar">👤</span>
              )}
            </div>
            <span className="text-sm font-medium hidden sm:block">{studentName}</span>
          </div>
        </div>
      </header>

      {/* Section Tabs */}
      <div className="bg-[#f5f5f5] border-b border-gray-300 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setCurrentQuestionIndex(0);
              }}
              className={cn(
                "px-4 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors border",
                activeSection === section.id
                  ? "bg-[#1a73e8] text-white border-[#1a73e8]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              )}
            >
              {section.name} ({section.questions.length})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Question Area */}
        <main className="flex-1 bg-white p-6 overflow-y-auto">
          {/* Section Instructions Banner */}
          <div className="mb-6 p-4 bg-[#dbeafe] border border-[#3b82f6] rounded-lg text-sm text-gray-700">
            <ul className="list-disc ml-4 space-y-1">
              <li>
                This section contains <strong>{currentSection?.questions.length || 0}</strong>{" "}
                questions.
              </li>
              {isIntegerQuestion ? (
                <>
                  <li>Enter your answer as a numerical value (integer only).</li>
                  <li>Full Marks: +{currentQuestion?.marks || 4} if correct</li>
                  {currentQuestion?.negative_marks ? (
                    <li>Negative Marks: -{currentQuestion.negative_marks} for incorrect</li>
                  ) : null}
                </>
              ) : isMultipleChoice ? (
                <>
                  <li>Each question has FOUR options. ONE OR MORE may be correct.</li>
                  <li>Full Marks: +{currentQuestion?.marks || 4} if correct</li>
                  {currentQuestion?.negative_marks ? (
                    <li>Negative Marks: -{currentQuestion.negative_marks} for incorrect</li>
                  ) : null}
                </>
              ) : (
                <>
                  <li>Each question has FOUR options. ONLY ONE is correct.</li>
                  <li>Full Marks: +{currentQuestion?.marks || 4} if correct</li>
                  {currentQuestion?.negative_marks ? (
                    <li>Negative Marks: -{currentQuestion.negative_marks} for incorrect</li>
                  ) : null}
                </>
              )}
            </ul>
          </div>

          {/* Question */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="px-3 py-1 bg-[#1a73e8] text-white rounded text-sm font-medium">
                Q.{currentQuestionIndex + 1}
              </span>
              <span className="text-xs text-gray-500">
                {isIntegerQuestion
                  ? "Integer Type"
                  : isMultipleChoice
                  ? "Multiple Choice"
                  : "Single Choice"}
              </span>
            </div>

            {currentQuestion?.image_url && (
              <div className="mb-4">
                <img
                  src={currentQuestion.image_url}
                  alt="Question"
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {currentQuestion?.question_text && (
              <div className="text-base leading-relaxed text-gray-800 mb-6">
                <LatexRenderer content={currentQuestion.question_text} />
              </div>
            )}

            {isIntegerQuestion ? (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your answer (integer only):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={currentQuestion ? (answers[currentQuestion.id] as string) || "" : ""}
                  onChange={(e) => handleIntegerAnswer(e.target.value)}
                  placeholder="Enter numerical answer"
                  className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] outline-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {options.map((option, index) => {
                  const optStr = String(index);
                  const curAns = currentQuestion ? answers[currentQuestion.id] : undefined;
                  const isSelected = isMultipleChoice
                    ? Array.isArray(curAns) && curAns.includes(optStr)
                    : curAns === optStr;

                  return (
                    <label
                      key={index}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                        isSelected
                          ? "border-[#1a73e8] bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <input
                        type={isMultipleChoice ? "checkbox" : "radio"}
                        name={isMultipleChoice ? undefined : `question-${currentQuestion?.id}`}
                        checked={isSelected}
                        onChange={() => handleAnswer(index)}
                        className="w-4 h-4 text-[#1a73e8] border-gray-300 focus:ring-[#1a73e8] mt-1"
                      />
                      <span className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm bg-gray-100 text-gray-700 flex-shrink-0">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1">
                        <span className="text-gray-700 block">
                          <LatexRenderer content={option.text} />
                        </span>
                        {option.image_url && (
                          <img
                            src={option.image_url}
                            alt={`Option ${String.fromCharCode(65 + index)}`}
                            className="max-w-full h-auto rounded-lg border border-gray-200 mt-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar – Question Palette */}
        <aside className="w-72 bg-[#f8f9fa] border-l border-gray-200 flex flex-col">
          {/* User Info */}
          <div className="p-4 border-b border-gray-200 text-center">
            <div className="w-14 h-14 mx-auto bg-gray-300 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
              {studentAvatar ? (
                <img
                  src={studentAvatar}
                  alt={studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl" role="img" aria-label="User avatar">👤</span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-700">{studentName}</p>
          </div>

          {/* Legend */}
          <div className="p-3 border-b border-gray-200 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-green-500 text-white flex items-center justify-center text-xs">
                {statusCounts.answered}
              </div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-red-500 text-white flex items-center justify-center text-xs">
                {statusCounts.notAnswered}
              </div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-gray-300 flex items-center justify-center text-xs">
                {statusCounts.notVisited}
              </div>
              <span>Not Visited</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-purple-500 text-white flex items-center justify-center text-xs">
                {statusCounts.markedCount}
              </div>
              <span>For Review</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <div className="w-5 h-5 rounded bg-purple-500 text-white flex items-center justify-center text-xs relative">
                {statusCounts.answeredMarked}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></span>
              </div>
              <span>Answered &amp; Marked</span>
            </div>
          </div>

          {/* Section Title */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-[#1a73e8] text-sm">{currentSection?.name}</h3>
            <p className="text-xs text-gray-500">Choose a Question</p>
          </div>

          {/* Question Grid */}
          <div className="flex-1 p-3 overflow-y-auto">
            <div className="grid grid-cols-4 gap-1.5">
              {currentSection?.questions.map((q, index) => {
                const status = getQuestionStatus(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setVisitedQuestions((prev) => new Set([...prev, q.id]));
                    }}
                    className={cn(
                      "w-10 h-10 rounded flex items-center justify-center text-sm font-medium transition-all relative",
                      status === "current" && "ring-2 ring-blue-500",
                      status === "answered" && "bg-green-500 text-white",
                      status === "not-answered" && "bg-red-500 text-white",
                      status === "marked" && "bg-purple-500 text-white",
                      status === "answered-marked" && "bg-purple-500 text-white",
                      status === "not-visited" && "bg-gray-200 text-gray-600"
                    )}
                  >
                    {index + 1}
                    {status === "answered-marked" && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#e8e8e8] border-t border-gray-300 px-4 md:px-6 py-2 md:py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={markForReviewAndNext}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4"
          >
            <span className="hidden sm:inline">Mark for Review &amp; Next</span>
            <span className="sm:hidden">Review</span>
          </Button>
          <Button
            variant="outline"
            onClick={clearResponse}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4"
          >
            <span className="hidden sm:inline">Clear Response</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={saveAndNext}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs md:text-sm px-2 md:px-4"
          >
            <span className="hidden sm:inline">Save &amp; Next</span>
            <span className="sm:hidden">Save</span>
          </Button>
          <Button
            onClick={() => setShowSubmitModal(true)}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs md:text-sm px-2 md:px-4"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
          </Button>
        </div>
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-800">Submit Test?</h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <span className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    Answered
                  </span>
                  <span className="font-bold text-green-700">{statusCounts.answered}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                  <span className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    Not Answered
                  </span>
                  <span className="font-bold text-red-700">
                    {questions.length - statusCounts.answered}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <span className="flex items-center gap-2 text-purple-700">
                    <Flag className="w-5 h-5" />
                    Marked for Review
                  </span>
                  <span className="font-bold text-purple-700">{statusCounts.markedCount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Continue Test
                </Button>
                <Button
                  className="flex-1 bg-[#22c55e] hover:bg-[#16a34a]"
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Now"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Overlay */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="bg-[#1a73e8] text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Instructions</h2>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#1a73e8]" />
                  General Instructions
                </h3>
                <ul className="list-decimal ml-6 space-y-2 text-gray-700 text-sm">
                  <li>This section contains <strong>{currentSection?.questions.length || 0}</strong> questions.</li>
                  <li>You can navigate between sections using the tabs at the top.</li>
                  <li>Use the question palette on the right to track question status.</li>
                  <li>Mark questions for review using the "Mark for Review & Next" button.</li>
                </ul>
                <h3 className="font-bold text-gray-800 mt-4">Legend:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs font-bold">1</div>
                    <span className="text-gray-700">Not visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-red-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-gray-700">Not answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-green-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                    <span className="text-gray-700">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-purple-500 text-white flex items-center justify-center text-xs font-bold">4</div>
                    <span className="text-gray-700">Marked for review</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (fullscreenEnabled) {
    return (
      <FullscreenGuard
        maxExits={7}
        onMaxExitsReached={handleMaxExits}
        onExitCountChange={handleFullscreenExitChange}
        initialExitCount={fullscreenExitCount}
      >
        {testContent}
      </FullscreenGuard>
    );
  }

  return testContent;
}

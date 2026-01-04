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
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import FullscreenGuard from "@/components/test/FullscreenGuard";

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
}

interface Section {
  id: string;
  name: string;
  questions: Question[];
}

export default function NormalTestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [testName, setTestName] = useState("Loading...");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPalette, setShowPalette] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(true);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);

  useEffect(() => {
    if (testId) {
      initializeTest();
    }
  }, [testId]);

  const initializeTest = async () => {
    try {
      // Fetch test settings first
      const { data: testData } = await supabase
        .from("tests")
        .select("fullscreen_enabled")
        .eq("id", testId)
        .single();
      
      if (testData) {
        setFullscreenEnabled(testData.fullscreen_enabled ?? true);
      }

      const { data: startData, error: startError } = await supabase.functions.invoke("start-test", {
        body: { test_id: testId },
      });

      if (startError || startData?.error) {
        throw new Error(startData?.error || startError?.message || "Failed to start test");
      }

      setAttemptId(startData.attempt_id);
      setTestName(startData.test_name);
      setTimeLeft(startData.duration_minutes * 60);
      
      // Get existing fullscreen exit count if resuming
      if (startData.fullscreen_exit_count) {
        setFullscreenExitCount(startData.fullscreen_exit_count);
      }

      const { data: questionsData, error: questionsError } = await supabase.functions.invoke("get-test-questions", {
        body: { test_id: testId },
      });

      if (questionsError || questionsData?.error) {
        throw new Error(questionsData?.error || questionsError?.message || "Failed to load questions");
      }

      if (!questionsData.questions || questionsData.questions.length === 0) {
        throw new Error("No questions found for this test");
      }

      const allQuestions: Question[] = questionsData.questions;
      setQuestions(allQuestions);

      // Group by subject
      const subjectMap = new Map<string, Question[]>();
      allQuestions.forEach((q: Question) => {
        const subj = q.subject || "General";
        if (!subjectMap.has(subj)) {
          subjectMap.set(subj, []);
        }
        subjectMap.get(subj)!.push(q);
      });

      const sectionsList: Section[] = Array.from(subjectMap.entries()).map(([name, qs]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        questions: qs.sort((a, b) => a.order - b.order)
      }));

      setSections(sectionsList);
      if (sectionsList.length > 0) {
        setActiveSection(sectionsList[0].id);
      }

      // Mark first question as visited
      if (allQuestions.length > 0) {
        setVisitedQuestions(new Set([allQuestions[0].id]));
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Failed to initialize test:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start test. Please try again.",
        variant: "destructive",
      });
      navigate("/tests");
    }
  };

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

  const currentSection = sections.find(s => s.id === activeSection);
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  const handleAnswer = (optionIndex: number) => {
    if (currentQuestion) {
      setAnswers({ ...answers, [currentQuestion.id]: String(optionIndex) });
    }
  };

  const clearResponse = () => {
    if (currentQuestion) {
      const newAnswers = { ...answers };
      delete newAnswers[currentQuestion.id];
      setAnswers(newAnswers);
    }
  };

  const markForReviewAndNext = () => {
    if (currentQuestion) {
      const newMarked = new Set(markedForReview);
      newMarked.add(currentQuestion.id);
      setMarkedForReview(newMarked);
    }
    goToNextQuestion();
  };

  const saveAndNext = () => {
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (!currentSection) return;
    
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQ = currentSection.questions[nextIndex];
      if (nextQ) {
        setVisitedQuestions(prev => new Set([...prev, nextQ.id]));
      }
    } else {
      // Move to next section
      const currentSectionIdx = sections.findIndex(s => s.id === activeSection);
      if (currentSectionIdx < sections.length - 1) {
        const nextSection = sections[currentSectionIdx + 1];
        setActiveSection(nextSection.id);
        setCurrentQuestionIndex(0);
        if (nextSection.questions[0]) {
          setVisitedQuestions(prev => new Set([...prev, nextSection.questions[0].id]));
        }
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
          time_taken_seconds: Math.max(1, timeLeft > 0 ? (questions.length * 60 - timeLeft) : 1),
          fullscreen_exit_count: fullscreenExitCount,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Failed to submit test");
      }

      navigate(`/test/${testId}/analysis`, {
        state: {
          results: data,
          testName,
        },
      });
    } catch (error: any) {
      console.error("Failed to submit test:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit test. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }, [attemptId, answers, timeLeft, testId, testName, navigate, submitting, questions, fullscreenExitCount]);

  const handleFullscreenExitCountChange = useCallback((count: number) => {
    setFullscreenExitCount(count);
    // Update the attempt with the new count
    if (attemptId) {
      supabase
        .from("test_attempts")
        .update({ fullscreen_exit_count: count })
        .eq("id", attemptId)
        .then(({ error }) => {
          if (error) console.error("Failed to update fullscreen count:", error);
        });
    }
  }, [attemptId]);

  const handleMaxFullscreenExits = useCallback(() => {
    toast({
      title: "Test Auto-Submitted",
      description: "You exceeded the maximum allowed fullscreen exits.",
      variant: "destructive",
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  const options = Array.isArray(currentQuestion?.options) 
    ? currentQuestion.options 
    : typeof currentQuestion?.options === 'object' && currentQuestion?.options !== null
      ? Object.values(currentQuestion.options as Record<string, string>)
      : [];

  const statusCounts = getStatusCounts();

  const testContent = (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium uppercase tracking-wide">{testName}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded font-mono font-bold text-sm",
            timeLeft < 300 ? "bg-red-500/20 text-red-300" : "bg-white/10"
          )}>
            <Clock className="w-4 h-4" />
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* Section Tabs */}
      <div className="bg-[#f5f5f5] border-b border-gray-300 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm font-medium mr-2">Sections</span>
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
              {section.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Question Area */}
        <main className="flex-1 bg-white p-6 overflow-y-auto">
          {/* Section Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
            <ul className="list-disc ml-4 space-y-1">
              <li>This section contains <strong>{currentSection?.questions.length || 0}</strong> questions.</li>
              <li>Each question has FOUR options. ONLY ONE is correct.</li>
              <li>Full Marks: +{currentQuestion?.marks || 4} if ONLY the correct option is chosen</li>
              <li>Zero Marks: 0 if none of the options is chosen</li>
              <li>Negative Marks: -{currentQuestion?.negative_marks || 1} in all other cases</li>
            </ul>
          </div>

          {/* Question Content */}
          <div className="mb-6">
            {currentQuestion?.image_url && (
              <div className="mb-4">
                <img 
                  src={currentQuestion.image_url} 
                  alt="Question" 
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                />
              </div>
            )}
            
            <p className="text-base leading-relaxed text-gray-800 mb-6">
              {currentQuestion?.question_text}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {options.map((option, index) => (
                <label
                  key={index}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                    currentQuestion && answers[currentQuestion.id] === String(index)
                      ? "border-[#1a73e8] bg-blue-50" 
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <input
                    type="radio"
                    name="answer"
                    checked={currentQuestion && answers[currentQuestion.id] === String(index)}
                    onChange={() => handleAnswer(index)}
                    className="w-4 h-4 text-[#1a73e8] border-gray-300 focus:ring-[#1a73e8]"
                  />
                  <span className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm bg-gray-100 text-gray-700">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-700">{String(option)}</span>
                </label>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Question Palette */}
        <aside className="w-80 bg-[#f8f9fa] border-l border-gray-200 flex flex-col">
          {/* User Info */}
          <div className="p-4 border-b border-gray-200 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-300 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-b border-gray-200 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500 text-white flex items-center justify-center text-xs">{statusCounts.answered}</div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500 text-white flex items-center justify-center text-xs">{statusCounts.notAnswered}</div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-300 flex items-center justify-center text-xs">{statusCounts.notVisited}</div>
              <span>Not Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-500 text-white flex items-center justify-center text-xs">{statusCounts.markedCount}</div>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <div className="w-6 h-6 rounded bg-purple-500 text-white flex items-center justify-center text-xs relative">
                {statusCounts.answeredMarked}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></span>
              </div>
              <span>Answered & Marked for Review</span>
            </div>
          </div>

          {/* Section Title */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-[#1a73e8]">{currentSection?.name}</h3>
            <p className="text-xs text-gray-500">Choose a Question</p>
          </div>

          {/* Question Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {currentSection?.questions.map((q, index) => {
                const status = getQuestionStatus(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setVisitedQuestions(prev => new Set([...prev, q.id]));
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
      <div className="bg-[#e8e8e8] border-t border-gray-300 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={markForReviewAndNext}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Mark for Review & Next
          </Button>
          <Button
            variant="outline"
            onClick={clearResponse}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Clear Response
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={saveAndNext}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
          >
            Save & Next
          </Button>
          <Button
            onClick={() => setShowSubmitModal(true)}
            className="bg-[#34a853] hover:bg-[#2d8f47] text-white"
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
                  <span className="font-bold text-red-700">{questions.length - statusCounts.answered}</span>
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
                  className="flex-1 bg-[#34a853] hover:bg-[#2d8f47]" 
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
    </div>
  );

  // Wrap with FullscreenGuard if enabled
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
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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
}

export default function TestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [testName, setTestName] = useState("Loading...");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (testId) {
      initializeTest();
    }
  }, [testId]);

  const initializeTest = async () => {
    try {
      // Start the test attempt
      const { data: startData, error: startError } = await supabase.functions.invoke("start-test", {
        body: { test_id: testId },
      });

      if (startError || startData?.error) {
        throw new Error(startData?.error || startError?.message || "Failed to start test");
      }

      setAttemptId(startData.attempt_id);
      setTestName(startData.test_name);
      setTimeLeft(startData.duration_minutes * 60);

      // Get questions
      const { data: questionsData, error: questionsError } = await supabase.functions.invoke("get-test-questions", {
        body: { test_id: testId },
      });

      if (questionsError || questionsData?.error) {
        throw new Error(questionsData?.error || questionsError?.message || "Failed to load questions");
      }

      if (!questionsData.questions || questionsData.questions.length === 0) {
        throw new Error("No questions found for this test");
      }

      setQuestions(questionsData.questions);
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

  const handleAnswer = (optionIndex: number) => {
    const question = questions[currentQuestion];
    if (question) {
      setAnswers({ ...answers, [question.id]: String(optionIndex) });
    }
  };

  const toggleMarkForReview = () => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestion)) {
      newMarked.delete(currentQuestion);
    } else {
      newMarked.add(currentQuestion);
    }
    setMarkedForReview(newMarked);
  };

  const handleSubmit = useCallback(async () => {
    if (!attemptId || submitting) return;

    setSubmitting(true);
    try {
      const totalTime = questions.length > 0 ? (questions[0] as any).duration_minutes * 60 - timeLeft : 0;
      
      const { data, error } = await supabase.functions.invoke("submit-test", {
        body: {
          attempt_id: attemptId,
          answers,
          time_taken_seconds: Math.max(1, timeLeft > 0 ? (timeLeft > 0 ? questions.length * 60 - timeLeft : 1) : 1),
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
  }, [attemptId, answers, timeLeft, testId, testName, navigate, submitting, questions]);

  const getQuestionStatus = (index: number) => {
    const question = questions[index];
    if (index === currentQuestion) return "current";
    if (markedForReview.has(index)) return "marked";
    if (question && answers[question.id] !== undefined) return "answered";
    return "unanswered";
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

  const question = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const options = Array.isArray(question?.options) 
    ? question.options 
    : typeof question?.options === 'object' && question?.options !== null
      ? Object.values(question.options as Record<string, string>)
      : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary"
            >
              {showPalette ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold font-display hidden sm:block">{testName}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold",
              timeLeft < 300 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
            )}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>

            <Button variant="gradient" onClick={() => setShowSubmitModal(true)} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Test"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Question Palette - Sidebar */}
        <AnimatePresence>
          {(showPalette || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed lg:sticky top-[57px] left-0 h-[calc(100vh-57px)] w-72 border-r border-border bg-card/80 backdrop-blur-xl p-4 z-40 overflow-y-auto"
            >
              <h3 className="font-semibold font-display mb-4">Question Palette</h3>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="palette-btn answered w-6 h-6" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="palette-btn w-6 h-6" />
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="palette-btn marked w-6 h-6" />
                  <span>Marked ({markedCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="palette-btn current w-6 h-6" />
                  <span>Current</span>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentQuestion(index);
                      setShowPalette(false);
                    }}
                    className={cn(
                      "palette-btn",
                      getQuestionStatus(index)
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Question Area */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="px-3 py-1 rounded-lg bg-secondary text-muted-foreground text-sm">
                  {question?.subject}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-lg text-sm capitalize",
                  question?.difficulty === "easy" && "bg-success/10 text-success",
                  question?.difficulty === "medium" && "bg-warning/10 text-warning",
                  question?.difficulty === "hard" && "bg-destructive/10 text-destructive"
                )}>
                  {question?.difficulty}
                </span>
                <span className="px-3 py-1 rounded-lg bg-secondary text-muted-foreground text-sm">
                  +{question?.marks} / -{question?.negative_marks}
                </span>
              </div>
              <Button
                variant={markedForReview.has(currentQuestion) ? "default" : "glass"}
                size="sm"
                onClick={toggleMarkForReview}
              >
                <Flag className="w-4 h-4" />
                {markedForReview.has(currentQuestion) ? "Marked" : "Mark"}
              </Button>
            </div>

            {/* Question Content */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-6 mb-6"
            >
              <p className="text-lg leading-relaxed mb-8">{question?.question_text}</p>

              {/* Options */}
              <div className="space-y-3">
                {options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={cn(
                      "question-option w-full text-left flex items-center gap-4",
                      question && answers[question.id] === String(index) && "selected"
                    )}
                  >
                    <span className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm shrink-0",
                      question && answers[question.id] === String(index)
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{String(option)}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="glass"
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </Button>

              <Button
                variant="gradient"
                onClick={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQuestion === questions.length - 1}
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 max-w-md w-full"
            >
              <h2 className="text-xl font-bold font-display mb-4">Submit Test?</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                  <span className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-5 h-5" />
                    Answered
                  </span>
                  <span className="font-bold">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="w-5 h-5" />
                    Not Answered
                  </span>
                  <span className="font-bold">{questions.length - answeredCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                  <span className="flex items-center gap-2 text-warning">
                    <Flag className="w-5 h-5" />
                    Marked for Review
                  </span>
                  <span className="font-bold">{markedCount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="glass" className="flex-1" onClick={() => setShowSubmitModal(false)}>
                  Continue Test
                </Button>
                <Button variant="gradient" className="flex-1" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Now"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

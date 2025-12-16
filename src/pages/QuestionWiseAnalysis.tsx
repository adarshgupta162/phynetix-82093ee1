import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  BookOpen,
  ArrowLeft,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import Leaderboard from "@/components/Leaderboard";

interface Question {
  id: string;
  question_number: number;
  correct_answer: any;
  marks: number;
  negative_marks: number;
  section_type: string;
  subject_name: string;
}

interface Attempt {
  id: string;
  answers: Record<string, any>;
  score: number;
  total_marks: number;
  time_taken_seconds: number;
  percentile: number;
  rank: number;
}

export default function QuestionWiseAnalysis() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testName, setTestName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (user && testId) {
      fetchData();
    }
  }, [user, testId]);

  const fetchData = async () => {
    // Fetch test details
    const { data: test } = await supabase
      .from("tests")
      .select("name")
      .eq("id", testId)
      .single();
    
    if (test) setTestName(test.name);

    // Fetch user's attempt
    const { data: attemptData } = await supabase
      .from("test_attempts")
      .select("id, answers, score, total_marks, time_taken_seconds, percentile, rank")
      .eq("test_id", testId)
      .eq("user_id", user!.id)
      .not("completed_at", "is", null)
      .single();

    if (!attemptData) {
      navigate("/tests");
      return;
    }

    setAttempt({
      ...attemptData,
      answers: (attemptData.answers as Record<string, any>) || {},
    });

    // Fetch questions with subject info
    const { data: questionsData } = await supabase
      .from("test_section_questions")
      .select(`
        id,
        question_number,
        correct_answer,
        marks,
        negative_marks,
        section:test_sections(
          section_type,
          subject:test_subjects(name)
        )
      `)
      .eq("test_id", testId)
      .order("question_number");

    if (questionsData) {
      const formattedQuestions = questionsData.map((q: any) => ({
        id: q.id,
        question_number: q.question_number,
        correct_answer: q.correct_answer,
        marks: q.marks || 4,
        negative_marks: q.negative_marks || 1,
        section_type: q.section?.section_type || "single_choice",
        subject_name: q.section?.subject?.name || "Unknown",
      }));
      setQuestions(formattedQuestions);
    }

    setLoading(false);
  };

  const getQuestionStatus = (questionId: string) => {
    if (!attempt) return "skipped";
    const answer = attempt.answers[questionId];
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return "skipped";
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return "skipped";

    const correctAnswer = question.correct_answer;
    
    if (question.section_type === "integer") {
      return String(answer) === String(correctAnswer) ? "correct" : "incorrect";
    }
    
    if (question.section_type === "multiple_choice") {
      const userAnswers = Array.isArray(answer) ? answer.sort() : [answer];
      const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer];
      return JSON.stringify(userAnswers) === JSON.stringify(correctAnswers) ? "correct" : "incorrect";
    }
    
    return answer === correctAnswer ? "correct" : "incorrect";
  };

  const formatAnswer = (answer: any, sectionType: string) => {
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return "-";
    if (sectionType === "integer") return String(answer);
    if (Array.isArray(answer)) return answer.join(", ");
    return answer;
  };

  const getMarksObtained = (questionId: string) => {
    const status = getQuestionStatus(questionId);
    const question = questions.find(q => q.id === questionId);
    if (!question) return 0;
    
    if (status === "correct") return question.marks;
    if (status === "incorrect") return -question.negative_marks;
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!attempt) return null;

  const currentQ = questions[currentQuestion];
  const accuracy = attempt.total_marks > 0 
    ? Math.round((attempt.score / attempt.total_marks) * 100) 
    : 0;

  const stats = {
    correct: questions.filter(q => getQuestionStatus(q.id) === "correct").length,
    incorrect: questions.filter(q => getQuestionStatus(q.id) === "incorrect").length,
    skipped: questions.filter(q => getQuestionStatus(q.id) === "skipped").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/tests")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold font-display">Question Analysis</h1>
              <p className="text-sm text-muted-foreground">{testName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant={showLeaderboard ? "gradient" : "glass"}
              onClick={() => setShowLeaderboard(!showLeaderboard)}
            >
              <Trophy className="w-5 h-5" />
              Leaderboard
            </Button>
            <Link to="/tests">
              <Button variant="glass">
                <BookOpen className="w-5 h-5" />
                More Tests
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Overview Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="stat-card text-center">
            <div className="text-2xl font-bold gradient-text">{attempt.score}/{attempt.total_marks}</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-success">{stats.correct}</div>
            <div className="text-sm text-muted-foreground">Correct</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-destructive">{stats.incorrect}</div>
            <div className="text-sm text-muted-foreground">Incorrect</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-muted-foreground">{stats.skipped}</div>
            <div className="text-sm text-muted-foreground">Skipped</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
        </div>

        {showLeaderboard ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Leaderboard
            </h2>
            <Leaderboard testId={testId!} currentUserId={user?.id} />
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Question Palette */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold font-display mb-4">Question Palette</h2>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const status = getQuestionStatus(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all",
                        currentQuestion === index && "ring-2 ring-primary",
                        status === "correct" && "bg-success/20 text-success border border-success/30",
                        status === "incorrect" && "bg-destructive/20 text-destructive border border-destructive/30",
                        status === "skipped" && "bg-secondary text-muted-foreground"
                      )}
                    >
                      {q.question_number}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success/20 border border-success/30" />
                  <span>Correct ({stats.correct})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/30" />
                  <span>Incorrect ({stats.incorrect})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-secondary" />
                  <span>Skipped ({stats.skipped})</span>
                </div>
              </div>
            </motion.div>

            {/* Current Question Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 glass-card p-6"
            >
              {currentQ && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {currentQ.subject_name}
                      </span>
                      <h3 className="text-lg font-semibold">Question {currentQ.question_number}</h3>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2",
                      getQuestionStatus(currentQ.id) === "correct" && "bg-success/20 text-success",
                      getQuestionStatus(currentQ.id) === "incorrect" && "bg-destructive/20 text-destructive",
                      getQuestionStatus(currentQ.id) === "skipped" && "bg-secondary text-muted-foreground"
                    )}>
                      {getQuestionStatus(currentQ.id) === "correct" && <CheckCircle2 className="w-4 h-4" />}
                      {getQuestionStatus(currentQ.id) === "incorrect" && <XCircle className="w-4 h-4" />}
                      {getQuestionStatus(currentQ.id) === "skipped" && <MinusCircle className="w-4 h-4" />}
                      {getQuestionStatus(currentQ.id).charAt(0).toUpperCase() + getQuestionStatus(currentQ.id).slice(1)}
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <div className="text-sm text-muted-foreground mb-1">Your Answer</div>
                      <div className="font-semibold">
                        {formatAnswer(attempt.answers[currentQ.id], currentQ.section_type)}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                      <div className="text-sm text-success mb-1">Correct Answer</div>
                      <div className="font-semibold text-success">
                        {formatAnswer(currentQ.correct_answer, currentQ.section_type)}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-card border">
                      <div className="text-sm text-muted-foreground mb-1">Marks</div>
                      <div className={cn(
                        "font-semibold text-lg",
                        getMarksObtained(currentQ.id) > 0 && "text-success",
                        getMarksObtained(currentQ.id) < 0 && "text-destructive"
                      )}>
                        {getMarksObtained(currentQ.id) > 0 && "+"}
                        {getMarksObtained(currentQ.id)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="glass"
                      onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                      disabled={currentQuestion === 0}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentQuestion + 1} of {questions.length}
                    </span>
                    <Button
                      variant="glass"
                      onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                      disabled={currentQuestion === questions.length - 1}
                    >
                      Next
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

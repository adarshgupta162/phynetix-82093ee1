import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Target,
  TrendingUp,
  AlertCircle,
  Bookmark,
  Download,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubjectScore {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
  marks: number;
  totalMarks: number;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  negative_marks: number;
  subject: string;
  user_answer?: string;
  is_correct?: boolean;
  marks_obtained?: number;
}

interface Results {
  score: number;
  total_marks: number;
  correct: number;
  incorrect: number;
  skipped: number;
  percentile: number;
  subject_scores: Record<string, SubjectScore>;
  time_taken_seconds: number;
}

export default function NormalTestAnalysis() {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [results, setResults] = useState<Results | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSubject, setActiveSubject] = useState<string>("all");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionFilter, setQuestionFilter] = useState<"all" | "correct" | "incorrect" | "unattempted">("all");
  const [loading, setLoading] = useState(true);
  const testName = location.state?.testName || "Test Analysis";

  useEffect(() => {
    if (location.state?.results) {
      setResults(location.state.results);
      fetchQuestionDetails();
    } else if (testId && user) {
      fetchAttemptData();
    } else {
      navigate("/tests");
    }
  }, [location.state, testId, user, navigate]);

  const fetchAttemptData = async () => {
    try {
      const { data: attempt, error } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("test_id", testId)
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (attempt && attempt.completed_at) {
        const subjectScores: Record<string, SubjectScore> = {};
        
        setResults({
          score: attempt.score || 0,
          total_marks: attempt.total_marks || 0,
          correct: 0,
          incorrect: 0,
          skipped: 0,
          percentile: attempt.percentile || 0,
          subject_scores: subjectScores,
          time_taken_seconds: attempt.time_taken_seconds || 0
        });

        await fetchQuestionDetails(attempt.answers as Record<string, string>);
      }
    } catch (error) {
      console.error("Error fetching attempt:", error);
      navigate("/tests");
    }
  };

  const fetchQuestionDetails = async (userAnswers?: Record<string, string>) => {
    try {
      const { data: questionsData } = await supabase.functions.invoke("get-test-questions", {
        body: { test_id: testId }
      });

      if (questionsData?.questions) {
        const answers = userAnswers || (location.state?.results?.answers as Record<string, string>) || {};
        
        // Fetch correct answers
        const { data: testQuestions } = await supabase
          .from("test_questions")
          .select("question_id, questions(id, correct_answer)")
          .eq("test_id", testId);

        const correctAnswers: Record<string, string> = {};
        testQuestions?.forEach((tq: any) => {
          if (tq.questions) {
            correctAnswers[tq.questions.id] = tq.questions.correct_answer;
          }
        });

        const processedQuestions: Question[] = questionsData.questions.map((q: any) => {
          const userAnswer = answers[q.id];
          const correctAnswer = correctAnswers[q.id];
          const isCorrect = userAnswer !== undefined && userAnswer === correctAnswer;
          const isSkipped = userAnswer === undefined;
          
          return {
            ...q,
            correct_answer: correctAnswer,
            user_answer: userAnswer,
            is_correct: isCorrect,
            marks_obtained: isSkipped ? 0 : (isCorrect ? q.marks : -q.negative_marks)
          };
        });

        setQuestions(processedQuestions);

        // Calculate subject scores
        const subjectMap: Record<string, SubjectScore> = {};
        processedQuestions.forEach((q) => {
          const subj = q.subject || "General";
          if (!subjectMap[subj]) {
            subjectMap[subj] = { correct: 0, incorrect: 0, skipped: 0, total: 0, marks: 0, totalMarks: 0 };
          }
          subjectMap[subj].total++;
          subjectMap[subj].totalMarks += q.marks;
          
          if (q.user_answer === undefined) {
            subjectMap[subj].skipped++;
          } else if (q.is_correct) {
            subjectMap[subj].correct++;
            subjectMap[subj].marks += q.marks;
          } else {
            subjectMap[subj].incorrect++;
            subjectMap[subj].marks -= q.negative_marks;
          }
        });

        if (results) {
          setResults({
            ...results,
            subject_scores: subjectMap,
            correct: Object.values(subjectMap).reduce((sum, s) => sum + s.correct, 0),
            incorrect: Object.values(subjectMap).reduce((sum, s) => sum + s.incorrect, 0),
            skipped: Object.values(subjectMap).reduce((sum, s) => sum + s.skipped, 0)
          });
        }
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    
    if (activeSubject !== "all") {
      filtered = filtered.filter(q => q.subject === activeSubject);
    }
    
    if (questionFilter !== "all") {
      filtered = filtered.filter(q => {
        if (questionFilter === "correct") return q.is_correct;
        if (questionFilter === "incorrect") return q.user_answer !== undefined && !q.is_correct;
        if (questionFilter === "unattempted") return q.user_answer === undefined;
        return true;
      });
    }
    
    return filtered;
  }, [questions, activeSubject, questionFilter]);

  const subjects = useMemo(() => {
    const subjs = new Set(questions.map(q => q.subject));
    return ["all", ...Array.from(subjs)];
  }, [questions]);

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  if (loading || !results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const accuracy = results.total_marks > 0 
    ? Math.round((results.score / results.total_marks) * 100) 
    : 0;
  const timeTaken = Math.round(results.time_taken_seconds / 60);

  return (
    <div className="min-h-screen bg-[#1a1625]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a1625]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/tests")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Test Analysis</h1>
              <p className="text-sm text-gray-400">{testName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-2" />
              Download Analysis
            </Button>
            <Link to={`/test/${testId}/solutions`}>
              <Button variant="default">
                View Solution
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === "overview" 
                ? "bg-white/10 text-white" 
                : "text-gray-400 hover:text-white"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === "questions" 
                ? "bg-white/10 text-white" 
                : "text-gray-400 hover:text-white"
            )}
          >
            Qs by Qs Analysis
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Overall Score */}
            <div className="lg:col-span-2 space-y-6">
              {/* Score Cards Row */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Overall Score Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#252036] rounded-xl p-6"
                >
                  <h3 className="text-gray-400 text-sm mb-4">Overall Score</h3>
                  <div className="text-5xl font-bold text-white mb-2">
                    {results.score}<span className="text-2xl text-gray-400">/{results.total_marks}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    {Object.entries(results.subject_scores).slice(0, 3).map(([subject, scores]) => (
                      <div key={subject}>
                        <div className="text-gray-400">{subject.slice(0, 4)} Score</div>
                        <div className="text-white font-semibold">{scores.marks}<span className="text-gray-400">/{scores.totalMarks}</span></div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Percentile Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#252036] rounded-xl p-6"
                >
                  <h3 className="text-gray-400 text-sm mb-4">Predicted Percentile</h3>
                  <div className="text-5xl font-bold text-[#a78bfa] mb-2">
                    {results.percentile.toFixed(2)}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    {Object.entries(results.subject_scores).slice(0, 3).map(([subject, scores]) => {
                      const subjectAcc = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
                      return (
                        <div key={subject}>
                          <div className="text-gray-400">{subject.slice(0, 4)}</div>
                          <div className="text-white font-semibold">{subjectAcc}%ile</div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#252036] rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Trophy className="w-4 h-4" />
                    RANK
                  </div>
                  <div className="text-2xl font-bold text-white">-</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-[#252036] rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Target className="w-4 h-4" />
                    QS ATTEMPTED
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {results.correct + results.incorrect}<span className="text-lg text-gray-400">/{questions.length}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#252036] rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    ACCURACY
                  </div>
                  <div className="text-2xl font-bold text-white">{accuracy}%</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-[#252036] rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                    <TrendingUp className="w-4 h-4" />
                    POSITIVE SCORE
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {results.correct * (questions[0]?.marks || 4)}<span className="text-lg text-gray-400">/{results.total_marks}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-[#252036] rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                    <XCircle className="w-4 h-4" />
                    MARKS LOST
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {results.incorrect * (questions[0]?.negative_marks || 1)}<span className="text-lg text-gray-400">/{results.total_marks}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-[#252036] rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    TIME TAKEN
                  </div>
                  <div className="text-2xl font-bold text-white">{timeTaken}<span className="text-lg text-gray-400">min</span></div>
                </motion.div>
              </div>

              {/* Subject-wise Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#252036] rounded-xl p-6"
              >
                <h3 className="text-white font-semibold mb-4">Subject-wise Performance</h3>
                <div className="space-y-4">
                  {Object.entries(results.subject_scores).map(([subject, scores]) => {
                    const accuracy = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
                    return (
                      <div key={subject} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{subject}</span>
                          <span className="text-gray-400">
                            {scores.correct}/{scores.total} correct ({accuracy}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Analysis Navigation */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#252036] rounded-xl p-4"
              >
                <h3 className="text-white font-semibold mb-4">Quick Analysis</h3>
                <div className="space-y-2">
                  {["Performance Analysis", "Score Potential", "Attempt Analysis", "Time Analysis", "Difficulty Analysis", "Subject Movement"].map((item) => (
                    <button
                      key={item}
                      className="w-full flex items-center justify-between p-3 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <span>{item}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Note Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-1">Note Down Your Learnings</h4>
                    <p className="text-sm text-gray-300">Add up to 3 things you learned in this test</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Questions List */}
            <div className="lg:col-span-2">
              {/* Subject Tabs */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => {
                      setActiveSubject(subject);
                      setCurrentQuestionIndex(0);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                      activeSubject === subject 
                        ? "bg-[#1a73e8] text-white" 
                        : "bg-[#252036] text-gray-400 hover:text-white"
                    )}
                  >
                    {subject === "all" ? "All" : subject}
                  </button>
                ))}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 mb-6">
                {[
                  { key: "all", label: "All", count: filteredQuestions.length },
                  { key: "correct", label: "Correct", count: filteredQuestions.filter(q => q.is_correct).length },
                  { key: "incorrect", label: "Incorrect", count: filteredQuestions.filter(q => q.user_answer !== undefined && !q.is_correct).length },
                  { key: "unattempted", label: "Unattempted", count: filteredQuestions.filter(q => q.user_answer === undefined).length },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setQuestionFilter(filter.key as any)}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                      questionFilter === filter.key 
                        ? "bg-white/10 text-white" 
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    {filter.label} <span className="ml-1 opacity-60">{filter.count}</span>
                  </button>
                ))}
              </div>

              {/* Current Question */}
              {currentQuestion ? (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#252036] rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded bg-white/10 text-white text-sm">Q{currentQuestionIndex + 1}</span>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        currentQuestion.is_correct 
                          ? "bg-green-500/20 text-green-400" 
                          : currentQuestion.user_answer === undefined
                            ? "bg-gray-500/20 text-gray-400"
                            : "bg-red-500/20 text-red-400"
                      )}>
                        {currentQuestion.is_correct ? "+4" : currentQuestion.user_answer === undefined ? "0" : "-1"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-white mb-6">{currentQuestion.question_text}</p>

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, index) => {
                      const optionLetter = String(index);
                      const isCorrect = currentQuestion.correct_answer === optionLetter;
                      const isUserAnswer = currentQuestion.user_answer === optionLetter;
                      
                      return (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border transition-all",
                            isCorrect && "border-green-500 bg-green-500/10",
                            isUserAnswer && !isCorrect && "border-red-500 bg-red-500/10",
                            !isCorrect && !isUserAnswer && "border-white/10"
                          )}
                        >
                          <span className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                            isCorrect && "bg-green-500 text-white",
                            isUserAnswer && !isCorrect && "bg-red-500 text-white",
                            !isCorrect && !isUserAnswer && "bg-white/10 text-gray-300"
                          )}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-gray-300 flex-1">{option}</span>
                          {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                          {isUserAnswer && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="text-gray-400"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white">
                      <Eye className="w-4 h-4 mr-2" />
                      View Solution
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentQuestionIndex(Math.min(filteredQuestions.length - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === filteredQuestions.length - 1}
                      className="text-gray-400"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-[#252036] rounded-xl p-12 text-center">
                  <p className="text-gray-400">No questions match the current filter</p>
                </div>
              )}
            </div>

            {/* Question Palette */}
            <div className="bg-[#252036] rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">All Questions</h3>
                <span className="text-gray-400 text-sm">{filteredQuestions.length} Qs</span>
              </div>

              {/* Palette Grid */}
              <div className="grid grid-cols-6 gap-2">
                {filteredQuestions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={cn(
                      "w-9 h-9 rounded flex items-center justify-center text-sm font-medium transition-all",
                      currentQuestionIndex === index && "ring-2 ring-white",
                      q.is_correct && "bg-green-500 text-white",
                      q.user_answer !== undefined && !q.is_correct && "bg-red-500 text-white",
                      q.user_answer === undefined && "bg-gray-600 text-gray-300"
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-gray-400">Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-gray-400">Incorrect</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-600"></div>
                  <span className="text-gray-400">Unattempted</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
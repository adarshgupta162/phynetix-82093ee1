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
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubjectScore {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
  marks?: number;
  totalMarks?: number;
}

interface QuestionResult {
  question_number?: number;
  correct_answer: string | number | string[];
  user_answer: string | number | string[] | null;
  is_correct: boolean;
  marks_obtained: number;
  marks: number;
  negative_marks: number;
  subject: string;
  section_type?: string;
  chapter?: string;
  is_bonus?: boolean;
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
  question_results?: Record<string, QuestionResult>;
  answers?: Record<string, string>;
  rank?: number;
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
  section_type?: string;
  question_number?: number;
}

export default function NormalTestAnalysis() {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [results, setResults] = useState<Results | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSubject, setActiveSubject] = useState<string>("all");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionFilter, setQuestionFilter] = useState<"all" | "correct" | "incorrect" | "unattempted">("all");
  const [loading, setLoading] = useState(true);
  const [testType, setTestType] = useState<string>("normal");
  const testName = location.state?.testName || "Test Analysis";

  useEffect(() => {
    if (authLoading) return;

    const passedResults = location.state?.results as Results | undefined;
    if (passedResults) {
      setResults(passedResults);

      const qr = passedResults.question_results;
      if (qr && Object.keys(qr).length > 0) {
        const questionList: Question[] = Object.entries(qr).map(([id, r]) => {
          const rawOptions = r.options;
          const options = Array.isArray(rawOptions)
            ? rawOptions.map(String)
            : rawOptions
              ? Object.values(rawOptions as any).map(String)
              : [];

          return {
            id,
            question_text: String(r.question_text ?? ""),
            options,
            correct_answer: r.correct_answer,
            marks: r.marks ?? 4,
            negative_marks: r.negative_marks ?? 1,
            subject: r.subject || "General",
            user_answer: r.user_answer,
            is_correct: r.is_correct,
            marks_obtained: r.marks_obtained,
            section_type: r.section_type,
            question_number: r.question_number,
            image_url: r.image_url ?? null,
          };
        });

        questionList.sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
        setQuestions(questionList);
      }

      fetchTestType();
      setLoading(false);
      return;
    }

    if (testId && user) {
      fetchAttemptData();
      return;
    }

    navigate("/tests");
  }, [location.state, testId, user, navigate, authLoading]);

  const fetchTestType = async () => {
    if (!testId) return;
    const { data: test } = await supabase
      .from("tests")
      .select("test_type")
      .eq("id", testId)
      .single();
    
    if (test) {
      setTestType(test.test_type);
    }
  };

  const fetchAttemptData = async () => {
    try {
      // Get test type
      const { data: test } = await supabase
        .from("tests")
        .select("test_type, name")
        .eq("id", testId)
        .single();
      
      if (test) {
        setTestType(test.test_type);
      }

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
        const userAnswers = (attempt.answers as Record<string, string>) || {};
        
        // Determine which table to query based on test type
        if (test?.test_type === 'pdf') {
          await fetchPDFTestQuestions(userAnswers, attempt);
        } else {
          await fetchNormalTestQuestions(userAnswers, attempt);
        }
      }
    } catch (error) {
      console.error("Error fetching attempt:", error);
      navigate("/tests");
    }
  };

  const fetchPDFTestQuestions = async (userAnswers: Record<string, string>, attempt: any) => {
    const { data: sectionQuestions } = await supabase
      .from("test_section_questions")
      .select(`
        id,
        question_number,
        correct_answer,
        marks,
        negative_marks,
        question_text,
        options,
        image_url,
        test_sections!inner (
          section_type,
          name,
          test_subjects!inner (
            name
          )
        )
      `)
      .eq("test_id", testId)
      .order("question_number");

    if (!sectionQuestions || sectionQuestions.length === 0) {
      setLoading(false);
      return;
    }

    const processedQuestions: Question[] = [];
    const subjectScores: Record<string, SubjectScore> = {};
    let totalCorrect = 0, totalIncorrect = 0, totalSkipped = 0;
    let totalScore = 0, totalMaxMarks = 0;

    for (const sq of sectionQuestions) {
      const section = sq.test_sections as any;
      const subject = section?.test_subjects?.name || "General";
      const sectionType = section?.section_type || "single_choice";
      const userAnswer = userAnswers[sq.id];
      const correctAnswer = sq.correct_answer;
      const marks = sq.marks || 4;
      const negativeMarks = sq.negative_marks || 1;

      totalMaxMarks += marks;

      if (!subjectScores[subject]) {
        subjectScores[subject] = { correct: 0, incorrect: 0, skipped: 0, total: 0, marks: 0, totalMarks: 0 };
      }
      subjectScores[subject].total++;
      subjectScores[subject].totalMarks = (subjectScores[subject].totalMarks || 0) + marks;

      let isCorrect = false;
      let marksObtained = 0;

      if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
        totalSkipped++;
        subjectScores[subject].skipped++;
      } else {
        // Check answer based on section type
        if (sectionType === 'integer') {
          const correctNum = parseFloat(String(correctAnswer));
          const userNum = parseFloat(String(userAnswer));
          isCorrect = !isNaN(correctNum) && !isNaN(userNum) && Math.abs(correctNum - userNum) < 0.01;
        } else if (sectionType === 'multiple_choice') {
          const correctArr = Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer];
          const userArr = Array.isArray(userAnswer) ? (userAnswer as any).sort() : [userAnswer];
          isCorrect = JSON.stringify(correctArr) === JSON.stringify(userArr);
        } else {
          isCorrect = String(userAnswer) === String(correctAnswer);
        }

        if (isCorrect) {
          totalCorrect++;
          totalScore += marks;
          marksObtained = marks;
          subjectScores[subject].correct++;
          subjectScores[subject].marks = (subjectScores[subject].marks || 0) + marks;
        } else {
          totalIncorrect++;
          totalScore -= negativeMarks;
          marksObtained = -negativeMarks;
          subjectScores[subject].incorrect++;
          subjectScores[subject].marks = (subjectScores[subject].marks || 0) - negativeMarks;
        }
      }

      processedQuestions.push({
        id: sq.id,
        question_text: sq.question_text || "",
        options: Array.isArray(sq.options) ? sq.options.map(String) : [],
        correct_answer: String(correctAnswer),
        marks,
        negative_marks: negativeMarks,
        subject,
        user_answer: userAnswer,
        is_correct: isCorrect,
        marks_obtained: marksObtained,
        section_type: sectionType,
        question_number: sq.question_number,
      });
    }

    setQuestions(processedQuestions);
    setResults({
      score: attempt.score ?? totalScore,
      total_marks: attempt.total_marks ?? totalMaxMarks,
      correct: totalCorrect,
      incorrect: totalIncorrect,
      skipped: totalSkipped,
      percentile: attempt.percentile ?? 0,
      rank: attempt.rank,
      subject_scores: subjectScores,
      time_taken_seconds: attempt.time_taken_seconds ?? 0,
    });
    setLoading(false);
  };

  const fetchNormalTestQuestions = async (userAnswers: Record<string, string>, attempt: any) => {
    // First, try regular test_questions -> questions
    const { data: testQuestions } = await supabase
      .from("test_questions")
      .select(`
        question_id,
        order_index,
        questions(
          id,
          question_text,
          options,
          correct_answer,
          marks,
          negative_marks,
          question_type,
          image_url,
          chapters(
            name,
            courses(name)
          )
        )
      `)
      .eq("test_id", testId)
      .order("order_index");

    if (testQuestions && testQuestions.length > 0) {
      const processedQuestions: Question[] = [];
      const subjectScores: Record<string, SubjectScore> = {};
      let totalCorrect = 0, totalIncorrect = 0, totalSkipped = 0;
      let totalScore = 0, totalMaxMarks = 0;

      for (const tq of testQuestions) {
        const q = tq.questions as any;
        if (!q) continue;

        const subject = q.chapters?.courses?.name || "General";
        const userAnswer = userAnswers[q.id];
        const correctAnswer = q.correct_answer;
        const marks = q.marks || 4;
        const negativeMarks = q.negative_marks || 1;

        totalMaxMarks += marks;

        if (!subjectScores[subject]) {
          subjectScores[subject] = { correct: 0, incorrect: 0, skipped: 0, total: 0, marks: 0, totalMarks: 0 };
        }
        subjectScores[subject].total++;
        subjectScores[subject].totalMarks = (subjectScores[subject].totalMarks || 0) + marks;

        const isCorrect = userAnswer !== undefined && String(userAnswer) === String(correctAnswer);
        const isSkipped = userAnswer === undefined;
        let marksObtained = 0;

        if (isSkipped) {
          totalSkipped++;
          subjectScores[subject].skipped++;
        } else if (isCorrect) {
          totalCorrect++;
          totalScore += marks;
          marksObtained = marks;
          subjectScores[subject].correct++;
          subjectScores[subject].marks = (subjectScores[subject].marks || 0) + marks;
        } else {
          totalIncorrect++;
          totalScore -= negativeMarks;
          marksObtained = -negativeMarks;
          subjectScores[subject].incorrect++;
          subjectScores[subject].marks = (subjectScores[subject].marks || 0) - negativeMarks;
        }

        processedQuestions.push({
          id: q.id,
          question_text: q.question_text || "",
          options: Array.isArray(q.options) ? q.options.map(String) : (q.options ? Object.values(q.options).map(String) : []),
          correct_answer: correctAnswer,
          marks,
          negative_marks: negativeMarks,
          subject,
          user_answer: userAnswer,
          is_correct: isCorrect,
          marks_obtained: marksObtained,
          section_type: q.question_type,
          question_number: tq.order_index ?? undefined,
          image_url: q.image_url ?? null,
        });
      }

      setQuestions(processedQuestions);
      setResults({
        score: attempt.score ?? totalScore,
        total_marks: (attempt.total_marks ?? 0) === 0 && totalMaxMarks > 0 ? totalMaxMarks : (attempt.total_marks ?? totalMaxMarks),
        correct: totalCorrect,
        incorrect: totalIncorrect,
        skipped: totalSkipped,
        percentile: attempt.percentile ?? 0,
        rank: attempt.rank,
        subject_scores: subjectScores,
        time_taken_seconds: attempt.time_taken_seconds ?? 0,
      });
      setLoading(false);
      return;
    }

    // Fallback: section-based (test_section_questions)
    const { data: sectionQuestions } = await supabase
      .from("test_section_questions")
      .select(`
        id,
        question_number,
        correct_answer,
        marks,
        negative_marks,
        question_text,
        options,
        image_url,
        test_sections!inner (
          section_type,
          name,
          test_subjects!inner (name)
        )
      `)
      .eq("test_id", testId)
      .order("question_number");

    if (!sectionQuestions || sectionQuestions.length === 0) {
      setLoading(false);
      return;
    }

    const processedQuestions: Question[] = [];
    const subjectScores: Record<string, SubjectScore> = {};
    let totalCorrect = 0, totalIncorrect = 0, totalSkipped = 0;
    let totalScore = 0, totalMaxMarks = 0;

    for (const sq of sectionQuestions) {
      const section = sq.test_sections as any;
      const subject = section?.test_subjects?.name || "General";
      const sectionType = section?.section_type || "single_choice";
      const userAnswer = userAnswers[sq.id];
      const correctAnswer = sq.correct_answer;
      const marks = sq.marks || 4;
      const negativeMarks = sq.negative_marks || 1;

      totalMaxMarks += marks;

      if (!subjectScores[subject]) {
        subjectScores[subject] = { correct: 0, incorrect: 0, skipped: 0, total: 0, marks: 0, totalMarks: 0 };
      }
      subjectScores[subject].total++;
      subjectScores[subject].totalMarks = (subjectScores[subject].totalMarks || 0) + marks;

      let isCorrect = false;
      let marksObtained = 0;

      if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
        totalSkipped++;
        subjectScores[subject].skipped++;
      } else {
        if (sectionType === 'integer') {
          const correctNum = parseFloat(String(correctAnswer));
          const userNum = parseFloat(String(userAnswer));
          isCorrect = !isNaN(correctNum) && !isNaN(userNum) && Math.abs(correctNum - userNum) < 0.01;
        } else if (sectionType === 'multiple_choice') {
          const correctArr = Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer];
          const userArr = Array.isArray(userAnswer) ? (userAnswer as any).sort() : [userAnswer];
          isCorrect = JSON.stringify(correctArr) === JSON.stringify(userArr);
        } else {
          isCorrect = String(userAnswer) === String(correctAnswer);
        }

        if (isCorrect) {
          totalCorrect++;
          totalScore += marks;
          marksObtained = marks;
          subjectScores[subject].correct++;
          subjectScores[subject].marks = (subjectScores[subject].marks || 0) + marks;
        } else {
          totalIncorrect++;
          totalScore -= negativeMarks;
          marksObtained = -negativeMarks;
          subjectScores[subject].incorrect++;
          subjectScores[subject].marks = (subjectScores[subject].marks || 0) - negativeMarks;
        }
      }

      processedQuestions.push({
        id: sq.id,
        question_text: sq.question_text || "",
        options: Array.isArray(sq.options) ? sq.options.map(String) : [],
        correct_answer: correctAnswer as any,
        marks,
        negative_marks: negativeMarks,
        subject,
        user_answer: userAnswer,
        is_correct: isCorrect,
        marks_obtained: marksObtained,
        section_type: sectionType,
        question_number: sq.question_number,
        image_url: (sq as any).image_url ?? null,
      });
    }

    setQuestions(processedQuestions);
    const computedLooksValid = totalMaxMarks > 0;
    const useComputed = (attempt.total_marks ?? 0) === 0 && computedLooksValid;

    setResults({
      score: useComputed ? totalScore : (attempt.score ?? totalScore),
      total_marks: useComputed ? totalMaxMarks : (attempt.total_marks ?? totalMaxMarks),
      correct: totalCorrect,
      incorrect: totalIncorrect,
      skipped: totalSkipped,
      percentile: attempt.percentile ?? 0,
      rank: attempt.rank,
      subject_scores: subjectScores,
      time_taken_seconds: attempt.time_taken_seconds ?? 0,
    });
    setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No results found</p>
          <Button onClick={() => navigate("/tests")}>Back to Tests</Button>
        </div>
      </div>
    );
  }

  const accuracy = (results.correct + results.incorrect) > 0 
    ? Math.round((results.correct / (results.correct + results.incorrect)) * 100) 
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
            <Link to={`/test/${testId}/question-analysis`}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Eye className="w-4 h-4 mr-2" />
                Question Analysis
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
                        <div className="text-white font-semibold">
                          {scores.marks ?? 0}<span className="text-gray-400">/{scores.totalMarks ?? 0}</span>
                        </div>
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
                    {results.percentile?.toFixed(2) ?? "0.00"}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    {Object.entries(results.subject_scores).slice(0, 3).map(([subject, scores]) => {
                      const subjectAcc = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
                      return (
                        <div key={subject}>
                          <div className="text-gray-400">{subject.slice(0, 4)}</div>
                          <div className="text-white font-semibold">{subjectAcc}%</div>
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
                  <div className="text-2xl font-bold text-white">{results.rank ?? "-"}</div>
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
                    CORRECT
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {results.correct}<span className="text-lg text-gray-400">/{questions.length}</span>
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
                    INCORRECT
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {results.incorrect}<span className="text-lg text-gray-400">/{questions.length}</span>
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
                    const subjectAccuracy = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
                    return (
                      <div key={subject} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{subject}</span>
                          <span className="text-gray-400">
                            {scores.correct}/{scores.total} correct ({subjectAccuracy}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${subjectAccuracy}%` }}
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
                  { key: "all", label: "All", count: questions.filter(q => activeSubject === "all" || q.subject === activeSubject).length },
                  { key: "correct", label: "Correct", count: questions.filter(q => (activeSubject === "all" || q.subject === activeSubject) && q.is_correct).length },
                  { key: "incorrect", label: "Incorrect", count: questions.filter(q => (activeSubject === "all" || q.subject === activeSubject) && q.user_answer !== undefined && !q.is_correct).length },
                  { key: "unattempted", label: "Unattempted", count: questions.filter(q => (activeSubject === "all" || q.subject === activeSubject) && q.user_answer === undefined).length },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => {
                      setQuestionFilter(filter.key as any);
                      setCurrentQuestionIndex(0);
                    }}
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
                      <span className="px-2 py-1 rounded bg-white/10 text-white text-sm">
                        Q{currentQuestion.question_number || currentQuestionIndex + 1}
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        currentQuestion.is_correct 
                          ? "bg-green-500/20 text-green-400" 
                          : currentQuestion.user_answer === undefined
                            ? "bg-gray-500/20 text-gray-400"
                            : "bg-red-500/20 text-red-400"
                      )}>
                        {currentQuestion.is_correct 
                          ? `+${currentQuestion.marks}` 
                          : currentQuestion.user_answer === undefined 
                            ? "0" 
                            : `-${currentQuestion.negative_marks}`}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{currentQuestion.subject}</div>
                  </div>

                  {currentQuestion.question_text && (
                    <p className="text-white mb-6">{currentQuestion.question_text}</p>
                  )}

                  {/* For integer type, show answers differently */}
                  {currentQuestion.section_type === 'integer' ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-secondary/50">
                        <div className="text-sm text-muted-foreground mb-1">Your Answer</div>
                        <div className="font-semibold text-white">
                          {currentQuestion.user_answer ?? "-"}
                        </div>
                      </div>
                      <div className={cn(
                        "p-4 rounded-lg border",
                        currentQuestion.is_correct 
                          ? "bg-green-500/10 border-green-500/20" 
                          : "bg-green-500/10 border-green-500/20"
                      )}>
                        <div className="text-sm text-green-400 mb-1">Correct Answer</div>
                        <div className="font-semibold text-green-400">
                          {currentQuestion.correct_answer}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Options */
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
                  )}

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
                    <span className="text-sm text-gray-400">
                      {currentQuestionIndex + 1} / {filteredQuestions.length}
                    </span>
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
                    {q.question_number || index + 1}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-gray-400">Correct ({results.correct})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-gray-400">Incorrect ({results.incorrect})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-600"></div>
                  <span className="text-gray-400">Unattempted ({results.skipped})</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
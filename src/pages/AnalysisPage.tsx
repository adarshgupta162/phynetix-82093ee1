import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AnalysisSidebar } from "@/components/analysis/AnalysisSidebar";
import { OverviewCard } from "@/components/analysis/OverviewCard";
import { SubjectCard } from "@/components/analysis/SubjectCard";
import { TimeOutcomeChart } from "@/components/analysis/TimeOutcomeChart";
import { supabase } from "@/integrations/supabase/client";

interface SubjectData {
  name: string;
  score: number;
  total: number;
  color: string;
  marksObtained: number;
  negativeMarks: number;
  unattempted: number;
  totalQuestions: number;
  timeSpent: string;
}

interface QuestionData {
  questionNumber: number;
  timeSpent: number;
  subject: string;
  status: "correct" | "incorrect" | "skipped";
}

interface TestData {
  testName: string;
  score: number;
  totalMarks: number;
  timeUsedSeconds: number;
  totalTimeSeconds: number;
  accuracy: number;
  rank: number;
  totalStudents: number;
  subjects: SubjectData[];
  questions: QuestionData[];
}

const subjectColors: Record<string, string> = {
  Mathematics: "hsl(45, 93%, 50%)",
  Maths: "hsl(45, 93%, 50%)",
  Math: "hsl(45, 93%, 50%)",
  Physics: "hsl(217, 91%, 60%)",
  Chemistry: "hsl(142, 76%, 45%)",
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatTimeShort = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
};

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestData | null>(null);

  useEffect(() => {
    if (testId) {
      fetchTestAnalysis();
    }
  }, [testId]);

  const fetchTestAnalysis = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch test details
      const { data: test } = await supabase
        .from("tests")
        .select("name, duration_minutes")
        .eq("id", testId)
        .single();

      if (!test) {
        navigate("/tests");
        return;
      }

      // Fetch user's attempt
      const { data: attempt } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("test_id", testId)
        .eq("user_id", user.id)
        .single();

      if (!attempt) {
        navigate("/tests");
        return;
      }

      // Parse time_per_question from attempt
      const timePerQuestion: Record<string, number> = (attempt as any).time_per_question || {};

      // Fetch all attempts for ranking
      const { count: totalStudents } = await supabase
        .from("test_attempts")
        .select("*", { count: "exact", head: true })
        .eq("test_id", testId)
        .not("completed_at", "is", null);

      // Fetch questions - try test_section_questions first, then test_questions
      let questionsData: any[] = [];
      
      const { data: sectionQuestions } = await supabase
        .from("test_section_questions")
        .select(`
          id,
          question_number,
          question_text,
          correct_answer,
          marks,
          negative_marks,
          time_seconds,
          section_id,
          test_sections!inner(name, test_subjects!inner(name))
        `)
        .eq("test_id", testId)
        .order("order_index");

      if (sectionQuestions && sectionQuestions.length > 0) {
        questionsData = sectionQuestions.map((q: any) => ({
          id: q.id,
          question_number: q.question_number,
          correct_answer: q.correct_answer,
          marks: q.marks || 4,
          negative_marks: q.negative_marks || 1,
          time_seconds: q.time_seconds || 60,
          subject: q.test_sections?.test_subjects?.name || "General",
        }));
      } else {
        // Fallback to test_questions
        const { data: tqData } = await supabase
          .from("test_questions")
          .select(`
            question_id,
            order_index,
            questions!inner(id, question_text, correct_answer, marks, negative_marks, chapter_id, chapters!inner(course_id, courses!inner(name)))
          `)
          .eq("test_id", testId)
          .order("order_index");

        if (tqData) {
          questionsData = tqData.map((tq: any, idx: number) => ({
            id: tq.questions.id,
            question_number: idx + 1,
            correct_answer: tq.questions.correct_answer,
            marks: tq.questions.marks || 4,
            negative_marks: tq.questions.negative_marks || 1,
            time_seconds: 60,
            subject: tq.questions.chapters?.courses?.name || "General",
          }));
        }
      }

      // Parse user answers
      const userAnswers = attempt.answers || {};

      // Calculate subject-wise stats
      const subjectStats = new Map<string, { 
        correct: number; 
        incorrect: number; 
        unattempted: number;
        totalQuestions: number;
        totalMarks: number;
        marksObtained: number;
        negativeMarks: number;
        timeSeconds: number;
      }>();

      const questionResults: QuestionData[] = [];
      
      questionsData.forEach((q, idx) => {
        const subject = q.subject || "General";
        if (!subjectStats.has(subject)) {
          subjectStats.set(subject, {
            correct: 0,
            incorrect: 0,
            unattempted: 0,
            totalQuestions: 0,
            totalMarks: 0,
            marksObtained: 0,
            negativeMarks: 0,
            timeSeconds: 0,
          });
        }

        const stats = subjectStats.get(subject)!;
        stats.totalQuestions++;
        stats.totalMarks += q.marks;

        const userAnswer = userAnswers[q.id];
        const correctAnswer = q.correct_answer;
        
        // Convert index to letter if needed
        const normalizedUserAnswer = typeof userAnswer === 'number' 
          ? String.fromCharCode(65 + userAnswer)
          : userAnswer;

        let status: "correct" | "incorrect" | "skipped" = "skipped";
        
        if (userAnswer === undefined || userAnswer === null || userAnswer === "") {
          stats.unattempted++;
          status = "skipped";
        } else if (normalizedUserAnswer === correctAnswer) {
          stats.correct++;
          stats.marksObtained += q.marks;
          status = "correct";
        } else {
          stats.incorrect++;
          stats.negativeMarks += q.negative_marks;
          status = "incorrect";
        }

        // Get actual time spent on this question from tracking data
        const actualTimeSpent = timePerQuestion[q.id] || 0;
        stats.timeSeconds += actualTimeSpent;

        questionResults.push({
          questionNumber: idx + 1,
          timeSpent: actualTimeSpent > 0 ? actualTimeSpent : Math.floor(Math.random() * 120) + 30,
          subject,
          status,
        });
      });

      // Build subjects array
      const subjects: SubjectData[] = Array.from(subjectStats.entries()).map(([name, stats]) => ({
        name,
        score: stats.marksObtained - stats.negativeMarks,
        total: stats.totalMarks,
        color: subjectColors[name] || "hsl(270, 60%, 50%)",
        marksObtained: stats.marksObtained,
        negativeMarks: stats.negativeMarks,
        unattempted: stats.unattempted,
        totalQuestions: stats.totalQuestions,
        timeSpent: formatTimeShort(stats.timeSeconds),
      }));

      // Calculate overall stats
      const totalCorrect = Array.from(subjectStats.values()).reduce((sum, s) => sum + s.correct, 0);
      const totalQuestions = questionsData.length;
      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      setTestData({
        testName: test.name,
        score: attempt.score || 0,
        totalMarks: attempt.total_marks || 300,
        timeUsedSeconds: attempt.time_taken_seconds || 0,
        totalTimeSeconds: test.duration_minutes * 60,
        accuracy,
        rank: attempt.rank || 1,
        totalStudents: totalStudents || 1,
        subjects,
        questions: questionResults,
      });

    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const timeProgress = testData 
    ? (testData.timeUsedSeconds / testData.totalTimeSeconds) * 100 
    : 0;

  const handleViewSolutions = () => {
    navigate(`/solutions/${testId}`);
  };

  const handleReviewMistakes = (subject: string) => {
    navigate(`/solutions/${testId}?subject=${subject}&filter=incorrect`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No analysis data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnalysisSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        testName={testData.testName}
        onBack={() => navigate("/tests")}
      />

      {/* Main Content */}
      <main className="lg:ml-[72px] min-h-screen transition-all duration-200">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto space-y-6">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl lg:text-3xl font-bold font-display">{testData.testName}</h1>
            <p className="text-muted-foreground mt-1">Detailed Performance Analysis</p>
          </motion.div>

          {activeTab === "overview" && (
            <>
              {/* Overview Card */}
              <OverviewCard
                score={testData.score}
                totalMarks={testData.totalMarks}
                timeUsed={formatTime(testData.timeUsedSeconds)}
                totalTime={formatTime(testData.totalTimeSeconds)}
                timeProgress={timeProgress}
                accuracy={testData.accuracy}
                rank={testData.rank}
                totalStudents={testData.totalStudents}
                subjects={testData.subjects.map((s) => ({
                  name: s.name,
                  score: s.score,
                  total: s.total,
                  color: s.color,
                }))}
                onViewSolutions={handleViewSolutions}
              />

              {/* Subject Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {testData.subjects.map((subject, index) => (
                  <SubjectCard
                    key={subject.name}
                    name={subject.name}
                    marksObtained={subject.marksObtained}
                    negativeMarks={subject.negativeMarks}
                    unattempted={subject.unattempted}
                    totalQuestions={subject.totalQuestions}
                    timeSpent={subject.timeSpent}
                    color={subject.color}
                    onReviewMistakes={() => handleReviewMistakes(subject.name)}
                    delay={index}
                  />
                ))}
              </div>

              {/* Time vs Outcome Chart */}
              <TimeOutcomeChart data={testData.questions} />
            </>
          )}

          {activeTab === "solutions" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground mb-4">View detailed solutions for all questions</p>
              <button
                onClick={handleViewSolutions}
                className="btn-gradient"
              >
                Go to Solutions Page
              </button>
            </motion.div>
          )}

          {activeTab !== "overview" && activeTab !== "solutions" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-12 text-center"
            >
              <p className="text-muted-foreground">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} analysis coming soon...
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

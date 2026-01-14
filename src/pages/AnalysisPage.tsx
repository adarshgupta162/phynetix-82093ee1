import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AnalysisSidebar } from "@/components/analysis/AnalysisSidebar";
import { OverviewCard } from "@/components/analysis/OverviewCard";
import { SubjectCard } from "@/components/analysis/SubjectCard";
import { TimeOutcomeChart } from "@/components/analysis/TimeOutcomeChart";
import { RankCompare } from "@/components/analysis/RankCompare";
import { ScorePotential } from "@/components/analysis/ScorePotential";
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
  correct: number;
  incorrect: number;
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
  percentile: number;
  subjects: SubjectData[];
  questions: QuestionData[];
  hasTimeData: boolean;
  attempted: number;
  totalQuestions: number;
  positiveScore: number;
  marksLost: number;
}

interface RankData {
  rank: number;
  totalStudents: number;
  percentile: number;
  score: number;
  topperScore: number;
  averageScore: number;
  subjectRanks: { name: string; rank: number; total: number; percentile: number }[];
  scoreDistribution: { range: string; count: number; isUser: boolean }[];
  recentAttempts: { name: string; score: number; rank: number; percentile: number; date: string }[];
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
  const secs = Math.floor(seconds % 60);
  return `${minutes}m ${secs}s`;
};

// Convert index (0,1,2,3) to letter (A,B,C,D)
const indexToLetter = (index: number | string | null | undefined): string => {
  if (index === null || index === undefined || index === "") return "";
  if (typeof index === 'string') {
    if (/^[A-D]$/i.test(index)) return index.toUpperCase();
    const num = parseInt(index, 10);
    if (!isNaN(num) && num >= 0 && num <= 3) {
      return String.fromCharCode(65 + num);
    }
    return index;
  }
  if (typeof index === 'number' && index >= 0 && index <= 3) {
    return String.fromCharCode(65 + index);
  }
  return String(index);
};

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [rankData, setRankData] = useState<RankData | null>(null);

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
      const hasTimeData = Object.keys(timePerQuestion).length > 0;

      // Fetch all attempts for ranking
      const { data: allAttempts } = await supabase
        .from("test_attempts")
        .select("score, rank, percentile, user_id")
        .eq("test_id", testId)
        .not("completed_at", "is", null)
        .order("score", { ascending: false });

      const totalStudents = allAttempts?.length || 1;

      // Fetch questions - order by question_number
      let questionsData: any[] = [];
      
      const { data: sectionQuestions } = await supabase
        .from("test_section_questions")
        .select(`
          id,
          question_number,
          correct_answer,
          marks,
          negative_marks,
          section_id,
          test_sections!inner(name, section_type, test_subjects!inner(name))
        `)
        .eq("test_id", testId)
        .order("question_number");

      if (sectionQuestions && sectionQuestions.length > 0) {
        questionsData = sectionQuestions.map((q: any) => ({
          id: q.id,
          question_number: q.question_number,
          correct_answer: typeof q.correct_answer === 'object' 
            ? (q.correct_answer as any)?.answer || String(q.correct_answer)
            : String(q.correct_answer || ""),
          marks: q.marks || 4,
          negative_marks: q.negative_marks || 1,
          subject: q.test_sections?.test_subjects?.name || "General",
          sectionType: q.test_sections?.section_type || "single_choice",
        }));
      }

      // Parse user answers
      const userAnswers = (attempt.answers as Record<string, any>) || {};

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
      let totalCorrect = 0;
      let totalIncorrect = 0;
      let totalPositiveScore = 0;
      let totalNegativeScore = 0;
      
      questionsData.forEach((q) => {
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

        const rawUserAnswer = userAnswers[q.id];
        const correctAnswer = q.correct_answer;
        const isIntegerType = q.sectionType === 'integer' || q.sectionType === 'numerical';
        
        // Normalize answers for comparison
        let normalizedUserAnswer: string;
        if (isIntegerType) {
          normalizedUserAnswer = rawUserAnswer !== undefined && rawUserAnswer !== null && rawUserAnswer !== "" 
            ? String(rawUserAnswer) 
            : "";
        } else {
          normalizedUserAnswer = indexToLetter(rawUserAnswer);
        }

        let status: "correct" | "incorrect" | "skipped" = "skipped";
        
        if (rawUserAnswer === undefined || rawUserAnswer === null || rawUserAnswer === "") {
          stats.unattempted++;
          status = "skipped";
        } else if (normalizedUserAnswer === correctAnswer) {
          stats.correct++;
          stats.marksObtained += q.marks;
          totalCorrect++;
          totalPositiveScore += q.marks;
          status = "correct";
        } else {
          stats.incorrect++;
          stats.negativeMarks += q.negative_marks;
          totalIncorrect++;
          totalNegativeScore += q.negative_marks;
          status = "incorrect";
        }

        // Get actual time spent on this question from tracking data
        const actualTimeSpent = timePerQuestion[q.id] || 0;
        stats.timeSeconds += actualTimeSpent;

        questionResults.push({
          questionNumber: q.question_number,
          timeSpent: actualTimeSpent,
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
        correct: stats.correct,
        incorrect: stats.incorrect,
      }));

      // Calculate overall stats
      const totalQuestions = questionsData.length;
      const attempted = totalCorrect + totalIncorrect;
      const accuracy = attempted > 0 ? Math.round((totalCorrect / attempted) * 100) : 0;

      // Calculate score from database or recalculate
      const calculatedScore = totalPositiveScore - totalNegativeScore;
      const totalMarks = questionsData.reduce((sum, q) => sum + q.marks, 0);

      // Rank data
      const topperScore = allAttempts?.[0]?.score || calculatedScore;
      const averageScore = allAttempts && allAttempts.length > 0
        ? Math.round(allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / allAttempts.length)
        : calculatedScore;

      // Score distribution for rank page
      const scoreDistribution = calculateScoreDistribution(allAttempts || [], calculatedScore);

      // Subject ranks (simplified - would need more complex query for real implementation)
      const subjectRanks = subjects.map(s => ({
        name: s.name,
        rank: attempt.rank || 1,
        total: totalStudents,
        percentile: attempt.percentile || 100,
      }));

      setRankData({
        rank: attempt.rank || 1,
        totalStudents,
        percentile: attempt.percentile || 100,
        score: calculatedScore,
        topperScore,
        averageScore,
        subjectRanks,
        scoreDistribution,
        recentAttempts: [],
      });

      setTestData({
        testName: test.name,
        score: calculatedScore,
        totalMarks,
        timeUsedSeconds: attempt.time_taken_seconds || 0,
        totalTimeSeconds: test.duration_minutes * 60,
        accuracy,
        rank: attempt.rank || 1,
        totalStudents,
        percentile: attempt.percentile || 100,
        subjects,
        questions: questionResults,
        hasTimeData,
        attempted,
        totalQuestions,
        positiveScore: totalPositiveScore,
        marksLost: totalNegativeScore,
      });

    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === "solutions") {
      navigate(`/solutions/${testId}`);
    } else {
      setActiveTab(tab);
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
        onTabChange={handleTabChange}
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
                    correct={subject.correct}
                    incorrect={subject.incorrect}
                    onReviewMistakes={() => handleReviewMistakes(subject.name)}
                    delay={index}
                  />
                ))}
              </div>

              {/* Time vs Outcome Chart */}
              <TimeOutcomeChart 
                data={testData.questions} 
                hasTimeData={testData.hasTimeData}
              />
            </>
          )}

          {activeTab === "rank" && rankData && (
            <RankCompare
              rank={rankData.rank}
              totalStudents={rankData.totalStudents}
              percentile={rankData.percentile}
              score={rankData.score}
              topperScore={rankData.topperScore}
              averageScore={rankData.averageScore}
              totalMarks={testData.totalMarks}
              subjectRanks={rankData.subjectRanks}
              scoreDistribution={rankData.scoreDistribution}
            />
          )}

          {activeTab === "potential" && (
            <ScorePotential
              currentScore={testData.score}
              totalMarks={testData.totalMarks}
              positiveScore={testData.positiveScore}
              marksLost={testData.marksLost}
              subjects={testData.subjects}
              questions={testData.questions}
            />
          )}

          {activeTab !== "overview" && activeTab !== "rank" && activeTab !== "potential" && (
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

function calculateScoreDistribution(
  attempts: { score: number | null; user_id: string }[], 
  userScore: number
): { range: string; count: number; isUser: boolean }[] {
  if (!attempts.length) return [];
  
  const scores = attempts.map(a => a.score || 0);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  
  // Create 10 buckets
  const bucketSize = Math.max(Math.ceil((maxScore - minScore) / 10), 10);
  const buckets: { range: string; count: number; isUser: boolean }[] = [];
  
  for (let i = 0; i < 10; i++) {
    const rangeStart = minScore + (i * bucketSize);
    const rangeEnd = rangeStart + bucketSize - 1;
    const count = scores.filter(s => s >= rangeStart && s <= rangeEnd).length;
    const isUser = userScore >= rangeStart && userScore <= rangeEnd;
    
    buckets.push({
      range: `${rangeStart}-${rangeEnd}`,
      count,
      isUser,
    });
  }
  
  return buckets.filter(b => b.count > 0);
}

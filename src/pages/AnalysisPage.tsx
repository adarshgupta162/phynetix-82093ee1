import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AnalysisSidebar } from "@/components/analysis/AnalysisSidebar";
import { OverviewCard } from "@/components/analysis/OverviewCard";
import { SubjectCard } from "@/components/analysis/SubjectCard";
import { TimeOutcomeChart } from "@/components/analysis/TimeOutcomeChart";

const defaultSubjectColors = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 45%)",
  "hsl(45, 93%, 50%)",
];

type AnalysisSubject = {
  name: string;
  score: number;
  total: number;
  color: string;
  marksObtained: number;
  negativeMarks: number;
  unattempted: number;
  totalQuestions: number;
  timeSpent: string;
};

type AnalysisQuestion = {
  questionNumber: number;
  timeSpent: number;
  subject: string;
  status: "correct" | "incorrect" | "skipped";
};

type AnalysisData = {
  testName: string;
  score: number;
  totalMarks: number;
  timeUsedSeconds: number;
  totalTimeSeconds: number;
  accuracy: number;
  rank?: number;
  totalStudents?: number;
  subjects: AnalysisSubject[];
  questions: AnalysisQuestion[];
};

type AnalysisApiResponse = AnalysisData | { data?: AnalysisData };

type RawSubject = {
  name?: string;
  subject?: string;
  score?: number;
  marks?: number;
  marksObtained?: number;
  total?: number;
  totalMarks?: number;
  total_marks?: number;
  color?: string;
  correctMarks?: number;
  negativeMarks?: number;
  negative_marks?: number;
  penalty?: number;
  unattempted?: number;
  unattemptedQuestions?: number;
  unattempted_count?: number;
  totalQuestions?: number;
  total_questions?: number;
  question_count?: number;
  timeSpent?: number | string;
  time_spent?: number | string;
  time_spent_seconds?: number;
};

type RawQuestion = {
  status?: string;
  outcome?: string;
  is_correct?: boolean;
  questionNumber?: number;
  question_number?: number;
  number?: number;
  timeSpent?: number;
  time_spent?: number;
  time_spent_seconds?: number;
  subject?: string;
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatDuration = (value: number | string | undefined) => {
  if (typeof value === "number") {
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    if (seconds > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${minutes}m`;
  }
  if (!value) return "0m";
  return String(value);
};

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasSubjectFields = (item: Record<string, unknown>) =>
  "name" in item || "subject" in item || "score" in item || "marks" in item;

const hasQuestionFields = (item: Record<string, unknown>) =>
  "questionNumber" in item || "question_number" in item || "status" in item || "outcome" in item || "subject" in item;

const filterRawSubjects = (items: unknown[]): RawSubject[] =>
  items.filter((item): item is RawSubject => isRecord(item) && hasSubjectFields(item));

const filterRawQuestions = (items: unknown[]): RawQuestion[] =>
  items.filter((item): item is RawQuestion => isRecord(item) && hasQuestionFields(item));

const normalizeStatus = (question: RawQuestion): "correct" | "incorrect" | "skipped" => {
  const status = String(question?.status ?? question?.outcome ?? "").toLowerCase();
  if (status === "correct") return "correct";
  if (status === "incorrect") return "incorrect";
  if (status === "skipped" || status === "unattempted") return "skipped";
  if (question?.is_correct === true) return "correct";
  if (question?.is_correct === false) return "incorrect";
  return "skipped";
};

const transformAnalysisData = (raw: Record<string, unknown>): AnalysisData => {
  const source = raw;
  const getValue = <T,>(key: string): T | undefined => source[key] as T | undefined;

  const subjectCandidates =
    getValue<unknown[]>("subjects") ??
    getValue<unknown[]>("subject_breakdown") ??
    getValue<unknown[]>("subject_scores") ??
    [];
  const subjectList = Array.isArray(subjectCandidates) ? subjectCandidates : [];

  const subjects: AnalysisSubject[] = filterRawSubjects(subjectList).map(
    (subject, index) => ({
      name: subject.name || subject.subject || `Subject ${index + 1}`,
      score: toNumber(subject.score ?? subject.marks ?? subject.marksObtained),
      total: toNumber(subject.total ?? subject.totalMarks ?? subject.total_marks),
      color: subject.color || defaultSubjectColors[index % defaultSubjectColors.length],
      marksObtained: toNumber(subject.marksObtained ?? subject.correctMarks ?? subject.score ?? subject.marks),
      negativeMarks: toNumber(subject.negativeMarks ?? subject.negative_marks ?? subject.penalty),
      unattempted: toNumber(subject.unattempted ?? subject.unattemptedQuestions ?? subject.unattempted_count),
      totalQuestions: toNumber(subject.totalQuestions ?? subject.total_questions ?? subject.question_count),
      timeSpent: formatDuration(subject.timeSpent ?? subject.time_spent ?? subject.time_spent_seconds),
    })
  );

  const questionCandidates =
    getValue<unknown[]>("questions") ??
    getValue<unknown[]>("question_results") ??
    getValue<unknown[]>("questionStats") ??
    [];
  const questionList = Array.isArray(questionCandidates) ? questionCandidates : [];

  const questions: AnalysisQuestion[] = filterRawQuestions(questionList).map(
    (question, index) => ({
      questionNumber: toNumber(question.questionNumber ?? question.question_number ?? question.number ?? index + 1),
      timeSpent: toNumber(question.timeSpent ?? question.time_spent ?? question.time_spent_seconds),
      subject: question.subject || "General",
      status: normalizeStatus(question),
    })
  );

  return {
    testName: getValue<string>("testName") || getValue<string>("test_name") || getValue<string>("name") || "Test Analysis",
    score: toNumber(getValue<number>("score") ?? getValue<number>("totalScore") ?? getValue<number>("obtained_marks")),
    totalMarks: toNumber(getValue<number>("totalMarks") ?? getValue<number>("total_marks") ?? getValue<number>("maxScore")),
    timeUsedSeconds: toNumber(
      getValue<number>("timeUsedSeconds") ??
        getValue<number>("time_used_seconds") ??
        getValue<number>("timeTakenSeconds") ??
        getValue<number>("time_taken_seconds")
    ),
    totalTimeSeconds: toNumber(
      getValue<number>("totalTimeSeconds") ??
        getValue<number>("total_time_seconds") ??
        getValue<number>("totalTime") ??
        getValue<number>("total_time")
    ),
    accuracy: toNumber(
      getValue<number>("accuracy") ?? getValue<number>("accuracy_percentage") ?? getValue<number>("accuracyPercent")
    ),
    rank: getValue<number>("rank") ?? getValue<number>("position"),
    totalStudents: getValue<number>("totalStudents") ?? getValue<number>("total_students") ?? getValue<number>("totalParticipants"),
    subjects,
    questions,
  };
};

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, isError } = useQuery<AnalysisApiResponse>({
    queryKey: ["test-analysis", testId],
    queryFn: async () => {
      const response = await fetch(`/api/tests/${testId}/analysis`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analysis data: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: Boolean(testId),
  });

  const analysisData = useMemo(() => {
    if (!data) return null;
    const payload = "data" in data && data.data ? data.data : data;
    if (!isRecord(payload)) return null;
    return transformAnalysisData(payload);
  }, [data]);

  const timeProgress =
    analysisData && analysisData.totalTimeSeconds
      ? (analysisData.timeUsedSeconds / analysisData.totalTimeSeconds) * 100
      : 0;

  const handleViewSolutions = () => {
    navigate(`/solutions/${testId || "mock"}`);
  };

  const handleReviewMistakes = (subject: string) => {
    navigate(`/solutions/${testId || "mock"}?subject=${subject}&filter=incorrect`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading analysis...</p>
      </div>
    );
  }

  if (isError || !analysisData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Unable to load analysis data.</p>
          <button
            onClick={() => navigate("/tests")}
            className="btn-gradient px-4 py-2 rounded-md"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnalysisSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        testName={analysisData.testName}
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
            <h1 className="text-2xl lg:text-3xl font-bold font-display">{analysisData.testName}</h1>
            <p className="text-muted-foreground mt-1">Detailed Performance Analysis</p>
          </motion.div>

          {activeTab === "overview" && (
            <>
              {/* Overview Card */}
              <OverviewCard
                score={analysisData.score}
                totalMarks={analysisData.totalMarks}
                timeUsed={formatTime(analysisData.timeUsedSeconds)}
                totalTime={formatTime(analysisData.totalTimeSeconds)}
                timeProgress={timeProgress}
                accuracy={analysisData.accuracy}
                rank={analysisData.rank}
                totalStudents={analysisData.totalStudents}
                subjects={analysisData.subjects.map((s) => ({
                  name: s.name,
                  score: s.score,
                  total: s.total,
                  color: s.color,
                }))}
                onViewSolutions={handleViewSolutions}
              />

              {/* Subject Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisData.subjects.map((subject, index) => (
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
              <TimeOutcomeChart
                data={analysisData.questions.map((q) => ({
                  questionNumber: q.questionNumber,
                  timeSpent: q.timeSpent,
                  subject: q.subject,
                  status: q.status,
                }))}
              />
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

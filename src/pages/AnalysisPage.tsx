import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AnalysisSidebar } from "@/components/analysis/AnalysisSidebar";
import { OverviewCard } from "@/components/analysis/OverviewCard";
import { SubjectCard } from "@/components/analysis/SubjectCard";
import { TimeOutcomeChart } from "@/components/analysis/TimeOutcomeChart";

// Mock data for demonstration
const mockTestData = {
  testName: "JEE Main 2024 - Mock Test 1",
  score: 163,
  totalMarks: 300,
  timeUsedSeconds: 9840, // 2h 44m
  totalTimeSeconds: 10800, // 3h
  accuracy: 72,
  rank: 69,
  totalStudents: 28739,
  subjects: [
    {
      name: "Mathematics",
      score: 52,
      total: 100,
      color: "hsl(45, 93%, 50%)",
      marksObtained: 56,
      negativeMarks: 4,
      unattempted: 5,
      totalQuestions: 25,
      timeSpent: "58m 23s",
    },
    {
      name: "Physics",
      score: 64,
      total: 100,
      color: "hsl(217, 91%, 60%)",
      marksObtained: 68,
      negativeMarks: 4,
      unattempted: 3,
      totalQuestions: 25,
      timeSpent: "52m 10s",
    },
    {
      name: "Chemistry",
      score: 47,
      total: 100,
      color: "hsl(142, 76%, 45%)",
      marksObtained: 52,
      negativeMarks: 5,
      unattempted: 7,
      totalQuestions: 25,
      timeSpent: "53m 27s",
    },
  ],
  questions: Array.from({ length: 75 }, (_, i) => ({
    questionNumber: i + 1,
    timeSpent: Math.floor(Math.random() * 180) + 30,
    subject: i < 25 ? "Physics" : i < 50 ? "Chemistry" : "Mathematics",
    status: Math.random() > 0.3 ? (Math.random() > 0.3 ? "correct" : "incorrect") : "skipped" as const,
  })),
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const timeProgress = (mockTestData.timeUsedSeconds / mockTestData.totalTimeSeconds) * 100;

  const handleViewSolutions = () => {
    navigate(`/solutions/${testId || "mock"}`);
  };

  const handleReviewMistakes = (subject: string) => {
    navigate(`/solutions/${testId || "mock"}?subject=${subject}&filter=incorrect`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AnalysisSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        testName={mockTestData.testName}
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
            <h1 className="text-2xl lg:text-3xl font-bold font-display">{mockTestData.testName}</h1>
            <p className="text-muted-foreground mt-1">Detailed Performance Analysis</p>
          </motion.div>

          {activeTab === "overview" && (
            <>
              {/* Overview Card */}
              <OverviewCard
                score={mockTestData.score}
                totalMarks={mockTestData.totalMarks}
                timeUsed={formatTime(mockTestData.timeUsedSeconds)}
                totalTime={formatTime(mockTestData.totalTimeSeconds)}
                timeProgress={timeProgress}
                accuracy={mockTestData.accuracy}
                rank={mockTestData.rank}
                totalStudents={mockTestData.totalStudents}
                subjects={mockTestData.subjects.map((s) => ({
                  name: s.name,
                  score: s.score,
                  total: s.total,
                  color: s.color,
                }))}
                onViewSolutions={handleViewSolutions}
              />

              {/* Subject Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTestData.subjects.map((subject, index) => (
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
                data={mockTestData.questions.map((q) => ({
                  questionNumber: q.questionNumber,
                  timeSpent: q.timeSpent,
                  subject: q.subject,
                  status: q.status as "correct" | "incorrect" | "skipped",
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

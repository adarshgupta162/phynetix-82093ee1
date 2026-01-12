import { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Atom, FlaskConical, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { QuestionDisplay } from "@/components/analysis/QuestionDisplay";
import { SolutionSection } from "@/components/analysis/SolutionSection";
import { QuestionPalettePanel } from "@/components/analysis/QuestionPalettePanel";
import { BottomNavigation } from "@/components/analysis/BottomNavigation";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const generateMockQuestions = () => {
  const subjects = ["Physics", "Chemistry", "Mathematics"];
  const difficulties = ["easy", "medium", "tough"] as const;
  
  return Array.from({ length: 75 }, (_, i) => {
    const subjectIndex = Math.floor(i / 25);
    const subject = subjects[subjectIndex];
    const status = Math.random() > 0.3 ? (Math.random() > 0.3 ? "correct" : "incorrect") : "skipped" as const;
    const correctOption = ["A", "B", "C", "D"][Math.floor(Math.random() * 4)];
    const userOption = status === "skipped" ? "" : 
      status === "correct" ? correctOption : 
      ["A", "B", "C", "D"].filter(o => o !== correctOption)[Math.floor(Math.random() * 3)];
    
    return {
      id: `q-${i + 1}`,
      number: i + 1,
      subject,
      status,
      difficulty: difficulties[Math.floor(Math.random() * 3)],
      questionText: `This is a sample question ${i + 1} for ${subject}. Given the conditions described, calculate the required value using the appropriate formula.`,
      imageUrl: undefined,
      marks: 4,
      userMarks: status === "correct" ? 4 : status === "incorrect" ? -1 : 0,
      correctAnswer: correctOption,
      userAnswer: userOption,
      totalAttempts: Math.floor(Math.random() * 25000) + 5000,
      options: ["A", "B", "C", "D"].map((label, idx) => ({
        label,
        value: `Option ${label} for question ${i + 1}`,
        percentage: Math.floor(Math.random() * 40) + 10,
        studentCount: Math.floor(Math.random() * 8000) + 2000,
        isUserAnswer: label === userOption,
        isCorrect: label === correctOption,
      })),
      solution: {
        text: "Given information and initial setup for the problem...",
        steps: [
          "First, identify the known variables and the formula required.",
          "Substitute the values into the formula.",
          "Simplify and calculate the intermediate values.",
          "Apply the final calculation to get the answer.",
        ],
        finalAnswer: `The answer is option ${correctOption}`,
        chapter: `Chapter ${Math.floor(Math.random() * 10) + 1}`,
        topic: `Topic ${Math.floor(Math.random() * 20) + 1}`,
      },
    };
  });
};

const mockQuestions = generateMockQuestions();

const subjectIcons: Record<string, React.ElementType> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
};

export default function SolutionsPage() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  
  const initialSubject = searchParams.get("subject") || "all";
  const initialFilter = searchParams.get("filter") as any || "all";
  
  const [activeSubject, setActiveSubject] = useState(initialSubject);
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect" | "skipped">(initialFilter);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attemptMode, setAttemptMode] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const subjects = ["all", "Physics", "Chemistry", "Mathematics"];

  const filteredQuestions = useMemo(() => {
    let questions = mockQuestions;
    
    if (activeSubject !== "all") {
      questions = questions.filter((q) => q.subject === activeSubject);
    }
    
    if (filter !== "all") {
      questions = questions.filter((q) => q.status === filter);
    }
    
    return questions;
  }, [activeSubject, filter]);

  const currentQuestion = filteredQuestions[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowSolution(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowSolution(false);
    }
  };

  const handleSelectQuestion = (index: number) => {
    setCurrentIndex(index);
    setShowSolution(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/analysis/${testId || "mock"}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold font-display">JEE Main 2024 - Mock Test 1</h1>
              <p className="text-sm text-muted-foreground">Solutions & Analysis</p>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="attempt-mode">Attempt Mode</Label>
                  <Switch
                    id="attempt-mode"
                    checked={attemptMode}
                    onCheckedChange={setAttemptMode}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, solutions are hidden until you click "View Solution"
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subject Tabs */}
        <div className="px-4 pb-4">
          <Tabs value={activeSubject} onValueChange={setActiveSubject}>
            <TabsList className="bg-secondary/50 p-1">
              {subjects.map((subject) => {
                const Icon = subject !== "all" ? subjectIcons[subject] : null;
                return (
                  <TabsTrigger
                    key={subject}
                    value={subject}
                    className={cn(
                      "gap-2 capitalize",
                      activeSubject === subject && "bg-card"
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {subject === "all" ? "All" : subject}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Question & Solution */}
          <div className="space-y-6">
            {currentQuestion ? (
              <>
                <QuestionDisplay
                  questionNumber={currentQuestion.number}
                  questionText={currentQuestion.questionText}
                  imageUrl={currentQuestion.imageUrl}
                  marks={currentQuestion.marks}
                  userMarks={currentQuestion.userMarks}
                  difficulty={currentQuestion.difficulty}
                  options={currentQuestion.options}
                  correctAnswer={currentQuestion.correctAnswer}
                  userAnswer={currentQuestion.userAnswer}
                  totalAttempts={currentQuestion.totalAttempts}
                  subject={currentQuestion.subject}
                />

                <SolutionSection
                  solutionText={currentQuestion.solution.text}
                  steps={currentQuestion.solution.steps}
                  finalAnswer={currentQuestion.solution.finalAnswer}
                  chapter={currentQuestion.solution.chapter}
                  topic={currentQuestion.solution.topic}
                  isAttemptMode={attemptMode && !showSolution}
                  onShowSolution={() => setShowSolution(true)}
                />
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 text-center"
              >
                <p className="text-muted-foreground">No questions match your filter criteria</p>
              </motion.div>
            )}
          </div>

          {/* Question Palette - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <QuestionPalettePanel
                questions={filteredQuestions.map((q) => ({
                  id: q.id,
                  number: q.number,
                  status: q.status as "correct" | "incorrect" | "skipped",
                  subject: q.subject,
                }))}
                currentIndex={currentIndex}
                onSelectQuestion={handleSelectQuestion}
                filter={filter}
                onFilterChange={setFilter}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Palette - Mobile (handled inside component) */}
      <QuestionPalettePanel
        questions={filteredQuestions.map((q) => ({
          id: q.id,
          number: q.number,
          status: q.status as "correct" | "incorrect" | "skipped",
          subject: q.subject,
        }))}
        currentIndex={currentIndex}
        onSelectQuestion={handleSelectQuestion}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        currentIndex={currentIndex}
        totalQuestions={filteredQuestions.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        isAttemptMode={attemptMode}
        onViewSolution={() => setShowSolution(true)}
      />
    </div>
  );
}

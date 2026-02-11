import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Atom, FlaskConical, Calculator, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface QuestionOption {
  label: string;
  value: string;
  percentage: number;
  studentCount: number;
  isUserAnswer: boolean;
  isCorrect: boolean;
}

interface QuestionSolution {
  text: string;
  steps: string[];
  finalAnswer: string;
  chapter: string;
  topic: string;
}

interface Question {
  id: string;
  number: number;
  subject: string;
  status: "correct" | "incorrect" | "skipped";
  difficulty: "easy" | "medium" | "tough";
  questionText: string;
  imageUrl?: string;
  marks: number;
  userMarks: number;
  correctAnswer: string;
  userAnswer: string;
  totalAttempts: number;
  options: QuestionOption[];
  solution: QuestionSolution;
  sectionType: string;
}

const subjectIcons: Record<string, React.ElementType> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Maths: Calculator,
  Math: Calculator,
};

// Convert index (0,1,2,3) to letter (A,B,C,D)
const indexToLetter = (index: number | string | null | undefined): string => {
  if (index === null || index === undefined || index === "") return "";
  if (typeof index === 'string') {
    // If it's already a letter, return it
    if (/^[A-D]$/i.test(index)) return index.toUpperCase();
    // If it's a numeric string, convert
    const num = parseInt(index, 10);
    if (!isNaN(num) && num >= 0 && num <= 3) {
      return String.fromCharCode(65 + num);
    }
    return index; // Return as-is for integer type answers
  }
  if (typeof index === 'number' && index >= 0 && index <= 3) {
    return String.fromCharCode(65 + index);
  }
  return String(index); // Return as string for integer type answers
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
  const [loading, setLoading] = useState(true);
  const [testName, setTestName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<string[]>(["all"]);

  useEffect(() => {
    if (testId) {
      fetchSolutionsData();
    }
  }, [testId]);

  const fetchSolutionsData = async () => {
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
        .select("name")
        .eq("id", testId)
        .single();

      if (test) {
        setTestName(test.name);
      }

      // Fetch user's attempt
      const { data: attempt } = await supabase
        .from("test_attempts")
        .select("answers")
        .eq("test_id", testId)
        .eq("user_id", user.id)
        .single();

      const userAnswers = (attempt?.answers as Record<string, any>) || {};

      // Fetch all attempts for stats
      const { data: allAttempts } = await supabase
        .from("test_attempts")
        .select("answers")
        .eq("test_id", testId)
        .not("completed_at", "is", null);

      // Fetch questions - order by question_number to maintain proper order
      let questionsData: Question[] = [];
      
      const { data: sectionQuestions } = await supabase
        .from("test_section_questions")
        .select(`
          id,
          question_number,
          question_text,
          correct_answer,
          marks,
          negative_marks,
          options,
          image_url,
          solution_text,
          solution_image_url,
          difficulty,
          section_id,
          test_sections!inner(name, section_type, test_subjects!inner(name))
        `)
        .eq("test_id", testId)
        .order("question_number");

      if (sectionQuestions && sectionQuestions.length > 0) {
        const subjectSet = new Set<string>(["all"]);
        
        questionsData = sectionQuestions.map((q: any) => {
          const subject = q.test_sections?.test_subjects?.name || "General";
          const sectionType = q.test_sections?.section_type || "single_choice";
          subjectSet.add(subject);
          
          const isIntegerType = sectionType === 'integer' || sectionType === 'numerical';
          const isMultipleChoice = sectionType === 'multiple_choice';
          
          // Get correct answer - handle multiple choice arrays, objects, and strings
          let correctAnswer: string;
          let correctAnswerArray: number[] = [];
          
          if (isMultipleChoice && Array.isArray(q.correct_answer)) {
            // For multiple choice, store as sorted array and convert to letters
            correctAnswerArray = [...q.correct_answer].sort((a, b) => a - b);
            correctAnswer = correctAnswerArray.map(idx => indexToLetter(idx)).join(", ");
          } else if (typeof q.correct_answer === 'object' && q.correct_answer !== null) {
            correctAnswer = (q.correct_answer as any)?.answer || String(q.correct_answer);
          } else {
            correctAnswer = String(q.correct_answer || "");
          }
          
          // Get user's answer and normalize it
          const rawUserAnswer = userAnswers[q.id];
          
          // For MCQ: convert index to letter, for integer: keep as is
          let normalizedUserAnswer: string;
          let userAnswerArray: number[] = [];
          
          if (isIntegerType) {
            normalizedUserAnswer = rawUserAnswer !== undefined && rawUserAnswer !== null && rawUserAnswer !== "" 
              ? String(rawUserAnswer) 
              : "";
          } else if (isMultipleChoice && Array.isArray(rawUserAnswer)) {
            // For multiple choice, store as sorted array and convert to letters
            userAnswerArray = [...rawUserAnswer].sort((a, b) => a - b);
            normalizedUserAnswer = userAnswerArray.map(idx => indexToLetter(idx)).join(", ");
          } else {
            normalizedUserAnswer = indexToLetter(rawUserAnswer);
          }

          // Determine status
          let status: "correct" | "incorrect" | "skipped" = "skipped";
          let userMarks = 0;
          
          if (rawUserAnswer === undefined || rawUserAnswer === null || rawUserAnswer === "" || 
              (Array.isArray(rawUserAnswer) && rawUserAnswer.length === 0)) {
            status = "skipped";
            userMarks = 0;
          } else if (isMultipleChoice) {
            // Compare arrays for multiple choice
            const isCorrect = JSON.stringify(userAnswerArray) === JSON.stringify(correctAnswerArray);
            if (isCorrect) {
              status = "correct";
              userMarks = q.marks || 4;
            } else {
              status = "incorrect";
              userMarks = -(q.negative_marks ?? 0);
            }
          } else if (normalizedUserAnswer === correctAnswer) {
            status = "correct";
            userMarks = q.marks || 4;
          } else {
            status = "incorrect";
            userMarks = -(q.negative_marks ?? 0);
          }

          // Calculate option stats from all attempts
          const optionStats = new Map<string, number>();
          let totalResponses = 0;
          
          allAttempts?.forEach((att: any) => {
            const answers = att.answers as Record<string, any>;
            const ans = answers?.[q.id];
            if (ans !== undefined && ans !== null && ans !== "" && 
                !(Array.isArray(ans) && ans.length === 0)) {
              totalResponses++;
              if (isIntegerType) {
                const normalizedAns = String(ans);
                optionStats.set(normalizedAns, (optionStats.get(normalizedAns) || 0) + 1);
              } else if (isMultipleChoice && Array.isArray(ans)) {
                // For multiple choice, count each selected option separately
                ans.forEach(idx => {
                  const letter = indexToLetter(idx);
                  optionStats.set(letter, (optionStats.get(letter) || 0) + 1);
                });
              } else {
                const normalizedAns = indexToLetter(ans);
                optionStats.set(normalizedAns, (optionStats.get(normalizedAns) || 0) + 1);
              }
            }
          });

          // Parse options - only for MCQ types
          let parsedOptions: QuestionOption[] = [];
          if (!isIntegerType && q.options && Array.isArray(q.options)) {
            parsedOptions = q.options.map((opt: any, optIdx: number) => {
              const label = String.fromCharCode(65 + optIdx);
              const text = typeof opt === 'object' ? (opt.text || opt.label || '') : String(opt);
              const count = optionStats.get(label) || 0;
              
              // For multiple choice, check if this option is in the user's array or correct array
              const isUserAnswer = isMultipleChoice 
                ? userAnswerArray.includes(optIdx)
                : normalizedUserAnswer === label;
              const isCorrect = isMultipleChoice
                ? correctAnswerArray.includes(optIdx)
                : correctAnswer === label;
              
              return {
                label,
                value: text,
                percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
                studentCount: count,
                isUserAnswer,
                isCorrect,
              };
            });
          }

          return {
            id: q.id,
            number: q.question_number,
            subject,
            status,
            difficulty: (q.difficulty as any) || "medium",
            questionText: q.question_text || "",
            imageUrl: q.image_url,
            marks: q.marks || 4,
            userMarks,
            correctAnswer,
            userAnswer: normalizedUserAnswer,
            totalAttempts: totalResponses,
            options: parsedOptions,
            sectionType,
            solution: {
              text: q.solution_text || "Solution not available",
              steps: q.solution_text ? [q.solution_text] : [],
              finalAnswer: `The correct answer is ${correctAnswer}`,
              chapter: q.test_sections?.name || "Chapter",
              topic: subject,
            },
          };
        });

        setSubjects(Array.from(subjectSet));
      }

      setQuestions(questionsData);
    } catch (error) {
      console.error("Error fetching solutions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    
    if (activeSubject !== "all") {
      filtered = filtered.filter((q) => q.subject === activeSubject);
    }
    
    if (filter !== "all") {
      filtered = filtered.filter((q) => q.status === filter);
    }
    
    return filtered;
  }, [questions, activeSubject, filter]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading solutions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/analysis/${testId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold font-display">{testName || "Test Solutions"}</h1>
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
        <div className="px-4 pb-4 overflow-x-auto">
          <Tabs value={activeSubject} onValueChange={(val) => { setActiveSubject(val); setCurrentIndex(0); }}>
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
                  sectionType={currentQuestion.sectionType}
                  status={currentQuestion.status}
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
                  status: q.status,
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
          status: q.status,
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

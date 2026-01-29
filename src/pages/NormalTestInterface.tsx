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
  Loader2,
  RotateCcw,
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import FullscreenGuard from "@/components/test/FullscreenGuard";
import { LatexRenderer } from "@/components/ui/latex-renderer";

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
  image_url?: string;
  section_type?: string;
}

interface Section {
  id: string;
  name: string;
  questions: Question[];
  section_type?: string;
}

export default function NormalTestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [testName, setTestName] = useState("Loading...");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPalette, setShowPalette] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(true);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  
  // Instructions page state - now for 4-screen flow
  const [currentScreen, setCurrentScreen] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [testDuration, setTestDuration] = useState(0);
  const [hasExistingAttempt, setHasExistingAttempt] = useState(false);
  
  // New state for UGEE pattern
  const [systemId, setSystemId] = useState("");
  const [studentName, setStudentName] = useState("Student");
  const [studentAvatar, setStudentAvatar] = useState<string | null>(null);
  const [examType, setExamType] = useState<string>("custom");
  const [testType, setTestType] = useState<string>("full");
  const [studentRollNumber, setStudentRollNumber] = useState("");
  
  // Time tracking per question
  const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (testId) {
      checkExistingAttemptFn();
    }
  }, [testId]);

  const checkExistingAttemptFn = async () => {
    try {
      // Get test info first
      const { data: testData } = await supabase
        .from("tests")
        .select("name, duration_minutes, fullscreen_enabled, exam_type, test_type")
        .eq("id", testId)
        .single();

      if (testData) {
        setTestName(testData.name);
        setTestDuration(testData.duration_minutes);
        setFullscreenEnabled(testData.fullscreen_enabled ?? true);
        setExamType(testData.exam_type || 'custom');
        setTestType(testData.test_type || 'full');
      }

      // Check for existing attempt
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch student profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, roll_number')
          .eq('id', user.id)
          .single();

        setStudentName(profile?.full_name || 'Student');
        setStudentAvatar(profile?.avatar_url);
        setStudentRollNumber(profile?.roll_number || user.id.substring(0, 8));

        // Generate or retrieve systemId
        const storageKey = `systemId_${testId}`;
        let storedSystemId = localStorage.getItem(storageKey);
        if (!storedSystemId) {
          storedSystemId = `C${Math.floor(100 + Math.random() * 900)}`;
          localStorage.setItem(storageKey, storedSystemId);
        }
        setSystemId(storedSystemId);

        const { data: existingAttempt } = await supabase
          .from("test_attempts")
          .select("id, completed_at, fullscreen_exit_count")
          .eq("test_id", testId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingAttempt) {
          if (existingAttempt.completed_at) {
            // Already completed, redirect to analysis
            navigate(`/test/${testId}/analysis`);
            return;
          }
          // Has ongoing attempt - skip to test screen
          setHasExistingAttempt(true);
          setCurrentScreen(4);
          setFullscreenExitCount(existingAttempt.fullscreen_exit_count || 0);
          initializeTest();
          return;
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking attempt:", error);
      setLoading(false);
    }
  };

  const startTest = () => {
    if (!agreedToTerms) {
      toast({
        title: "Please agree to the terms",
        description: "You must agree to the test rules before starting.",
        variant: "destructive",
      });
      return;
    }
    setCurrentScreen(4);
    setLoading(true);
    initializeTest();
  };

  const initializeTest = async () => {
    try {
      // Fetch test settings first
      const { data: testData } = await supabase
        .from("tests")
        .select("fullscreen_enabled")
        .eq("id", testId)
        .single();
      
      if (testData) {
        setFullscreenEnabled(testData.fullscreen_enabled ?? true);
      }

      const { data: startData, error: startError } = await supabase.functions.invoke("start-test", {
        body: { test_id: testId },
      });

      if (startError || startData?.error) {
        throw new Error(startData?.error || startError?.message || "Failed to start test");
      }

      setAttemptId(startData.attempt_id);
      setTestName(startData.test_name);
      setTimeLeft(startData.duration_minutes * 60);
      
      // Get existing fullscreen exit count if resuming
      if (startData.fullscreen_exit_count) {
        setFullscreenExitCount(startData.fullscreen_exit_count);
      }

      // Restore existing answers and time per question if resuming
      if (startData.is_resume && startData.existing_answers) {
        setAnswers(startData.existing_answers);
      }
      if (startData.is_resume && startData.existing_time_per_question) {
        setTimePerQuestion(startData.existing_time_per_question);
      }

      const { data: questionsData, error: questionsError } = await supabase.functions.invoke("get-test-questions", {
        body: { test_id: testId },
      });

      if (questionsError || questionsData?.error) {
        throw new Error(questionsData?.error || questionsError?.message || "Failed to load questions");
      }

      if (!questionsData.questions || questionsData.questions.length === 0) {
        throw new Error("No questions found for this test");
      }

      const allQuestions: Question[] = questionsData.questions;
      setQuestions(allQuestions);

      // Group by subject
      const subjectMap = new Map<string, Question[]>();
      allQuestions.forEach((q: Question) => {
        const subj = q.subject || "General";
        if (!subjectMap.has(subj)) {
          subjectMap.set(subj, []);
        }
        subjectMap.get(subj)!.push(q);
      });

      const sectionsList: Section[] = Array.from(subjectMap.entries()).map(([name, qs]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        questions: qs.sort((a, b) => a.order - b.order)
      }));

      setSections(sectionsList);
      if (sectionsList.length > 0) {
        setActiveSection(sectionsList[0].id);
      }

      // Mark first question as visited (or all answered questions if resuming)
      if (allQuestions.length > 0) {
        if (startData.is_resume && startData.existing_answers) {
          const visitedIds = new Set([allQuestions[0].id, ...Object.keys(startData.existing_answers)]);
          setVisitedQuestions(visitedIds);
        } else {
          setVisitedQuestions(new Set([allQuestions[0].id]));
        }
      }

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

  // Note: Auto-save useEffect is defined after saveProgress callback

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentSection = sections.find(s => s.id === activeSection);
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  // Check if question is multiple choice
  const isMultipleChoice = currentQuestion?.question_type === 'multiple_choice' || 
                           currentQuestion?.question_type === 'multi' ||
                           currentQuestion?.section_type === 'multiple_choice' ||
                           currentQuestion?.section_type === 'multi';

  const handleAnswer = (optionIndex: number) => {
    if (currentQuestion) {
      if (isMultipleChoice) {
        // Handle multiple choice - toggle selection
        const currentAnswers = Array.isArray(answers[currentQuestion.id]) 
          ? answers[currentQuestion.id] as string[]
          : answers[currentQuestion.id] 
            ? [answers[currentQuestion.id] as string]
            : [];
        
        const optionStr = String(optionIndex);
        const newAnswers = currentAnswers.includes(optionStr)
          ? currentAnswers.filter(a => a !== optionStr)
          : [...currentAnswers, optionStr];
        
        setAnswers({ ...answers, [currentQuestion.id]: newAnswers });
      } else {
        // Handle single choice
        setAnswers({ ...answers, [currentQuestion.id]: String(optionIndex) });
      }
    }
  };

  const handleIntegerAnswer = (value: string) => {
    if (currentQuestion) {
      // Only allow numbers and minus sign
      const sanitized = value.replace(/[^0-9-]/g, '');
      setAnswers({ ...answers, [currentQuestion.id]: sanitized });
    }
  };

  const clearResponse = () => {
    if (currentQuestion) {
      const newAnswers = { ...answers };
      delete newAnswers[currentQuestion.id];
      setAnswers(newAnswers);
    }
  };

  // Save current question time when changing questions
  const updateTimeForCurrentQuestion = useCallback(() => {
    if (currentQuestion) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setTimePerQuestion(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpent
      }));
    }
  }, [currentQuestion, questionStartTime]);

  // Auto-save answers and time to database
  const saveProgress = useCallback(async () => {
    if (!attemptId || isSaving) return;
    
    setIsSaving(true);
    try {
      // Update time for current question before saving
      const currentTimeSpent = currentQuestion 
        ? Math.floor((Date.now() - questionStartTime) / 1000)
        : 0;
      
      const updatedTimePerQuestion = currentQuestion 
        ? {
            ...timePerQuestion,
            [currentQuestion.id]: (timePerQuestion[currentQuestion.id] || 0) + currentTimeSpent
          }
        : timePerQuestion;

      const { error } = await supabase
        .from("test_attempts")
        .update({ 
          answers,
          time_per_question: updatedTimePerQuestion
        })
        .eq("id", attemptId);
      
      if (error) {
        console.error("Failed to auto-save:", error);
      } else {
        console.log("Progress auto-saved");
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSaving(false);
    }
  }, [attemptId, answers, timePerQuestion, currentQuestion, questionStartTime, isSaving]);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (currentScreen !== 4 || !attemptId || loading) return;
    
    const interval = setInterval(() => {
      saveProgress();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentScreen, attemptId, loading, saveProgress]);

  const saveAndNext = async () => {
    // Update time for current question
    updateTimeForCurrentQuestion();
    
    // Reset timer for next question
    setQuestionStartTime(Date.now());
    
    // Save progress to database
    await saveProgress();
    
    // Move to next question
    goToNextQuestion();
  };

  const markForReviewAndNext = async () => {
    if (currentQuestion) {
      const newMarked = new Set(markedForReview);
      newMarked.add(currentQuestion.id);
      setMarkedForReview(newMarked);
    }
    
    // Update time for current question
    updateTimeForCurrentQuestion();
    
    // Reset timer for next question
    setQuestionStartTime(Date.now());
    
    // Save progress to database
    await saveProgress();
    
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (!currentSection) return;
    
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQ = currentSection.questions[nextIndex];
      if (nextQ) {
        setVisitedQuestions(prev => new Set([...prev, nextQ.id]));
      }
    } else {
      // Move to next section
      const currentSectionIdx = sections.findIndex(s => s.id === activeSection);
      if (currentSectionIdx < sections.length - 1) {
        const nextSection = sections[currentSectionIdx + 1];
        setActiveSection(nextSection.id);
        setCurrentQuestionIndex(0);
        if (nextSection.questions[0]) {
          setVisitedQuestions(prev => new Set([...prev, nextSection.questions[0].id]));
        }
      }
    }
  };

  const goToPrevQuestion = () => {
    if (!currentSection) return;
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      const currentSectionIdx = sections.findIndex(s => s.id === activeSection);
      if (currentSectionIdx > 0) {
        const prevSection = sections[currentSectionIdx - 1];
        setActiveSection(prevSection.id);
        setCurrentQuestionIndex(prevSection.questions.length - 1);
      }
    }
  };

  const handleSubmit = useCallback(async (fromFullscreenMax = false) => {
    if (!attemptId || submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-test", {
        body: {
          attempt_id: attemptId,
          answers,
          time_taken_seconds: Math.max(1, timeLeft > 0 ? (questions.length * 60 - timeLeft) : 1),
          fullscreen_exit_count: fullscreenExitCount,
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
  }, [attemptId, answers, timeLeft, testId, testName, navigate, submitting, questions, fullscreenExitCount]);

  const handleFullscreenExitCountChange = useCallback((count: number) => {
    setFullscreenExitCount(count);
    // Update the attempt with the new count
    if (attemptId) {
      supabase
        .from("test_attempts")
        .update({ fullscreen_exit_count: count })
        .eq("id", attemptId)
        .then(({ error }) => {
          if (error) console.error("Failed to update fullscreen count:", error);
        });
    }
  }, [attemptId]);

  const handleMaxFullscreenExits = useCallback(() => {
    toast({
      title: "Test Auto-Submitted",
      description: "You exceeded the maximum allowed fullscreen exits.",
      variant: "destructive",
    });
    handleSubmit(true);
  }, [handleSubmit]);

  const getQuestionStatus = (questionId: string) => {
    if (currentQuestion?.id === questionId) return "current";
    if (markedForReview.has(questionId) && answers[questionId] !== undefined) return "answered-marked";
    if (markedForReview.has(questionId)) return "marked";
    if (answers[questionId] !== undefined) return "answered";
    if (visitedQuestions.has(questionId)) return "not-answered";
    return "not-visited";
  };

  const getStatusCounts = () => {
    const answered = Object.keys(answers).length;
    const notAnswered = questions.filter(q => visitedQuestions.has(q.id) && answers[q.id] === undefined).length;
    const markedCount = markedForReview.size;
    const answeredMarked = questions.filter(q => markedForReview.has(q.id) && answers[q.id] !== undefined).length;
    const notVisited = questions.length - visitedQuestions.size;
    
    return { answered, notAnswered, markedCount, answeredMarked, notVisited };
  };

  // Loading state
  if (loading && currentScreen === 4) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  // Render shared header for screens 1-3
  const renderHeader = () => (
    <header className="bg-[#1e3a5f] text-[#fbbf24] px-6 py-3 flex items-center justify-between">
      <div className="text-sm">
        <span className="font-medium">System Name: {systemId || "..."}</span>
      </div>
      <div className="text-sm text-right">
        <div className="font-medium">Candidate Name: {studentName}</div>
        <div className="text-[#fbbf24]">Subject: {testName}</div>
      </div>
    </header>
  );

  // Screen 1: Login/Verification
  if (currentScreen === 1) {
    const handleSignIn = () => {
      // No validation needed - this is just a verification screen
      setCurrentScreen(2);
    };

    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col">
        {renderHeader()}
        
        {/* Disclaimer message */}
        <div className="bg-[#1e3a5f] text-white/90 px-6 py-3 text-center text-sm">
          Please contact the invigilator if there are any discrepancies in the Name and Photograph displayed on the screen, or if the photograph is not yours.
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {/* Student photo placeholder - top right */}
          <div className="absolute top-8 right-8 w-40 h-40 bg-gray-300 rounded-lg flex items-center justify-center overflow-hidden shadow-lg">
            {studentAvatar ? (
              <img src={studentAvatar} alt={studentName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl" role="img" aria-label="User avatar placeholder">👤</span>
            )}
          </div>

          {/* Login box */}
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username/ID
                </label>
                <input
                  type="text"
                  value={studentRollNumber}
                  disabled
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value="••••••••"
                    disabled
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed pr-10"
                  />
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value="••••••••"
                    disabled
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed pr-10"
                  />
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <Button
                onClick={handleSignIn}
                className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white py-3 text-lg mt-6"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: General Instructions
  if (currentScreen === 2) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col">
        {renderHeader()}
        
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-[#1a73e8] text-white px-6 py-4">
              <h2 className="text-xl font-bold">Instructions</h2>
              <p className="text-white/80 text-sm">Please read the instructions carefully</p>
            </div>

            <div className="p-6 space-y-6">
              {testType === 'practice' && (
                <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 text-center">
                  <p className="text-red-700 font-bold text-lg">
                    This Mock Exam is Only for Practice Purpose
                  </p>
                </div>
              )}

              {/* General Instructions */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#1a73e8]" />
                  General Instructions
                </h3>
                <ul className="list-decimal ml-6 space-y-2 text-gray-700 text-sm">
                  <li>Total duration of examination is <strong>{testDuration} minutes</strong>.</li>
                  <li>The clock will be set at the server. The countdown timer will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
                  <li>The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:</li>
                </ul>
              </div>

              {/* Question Palette Legend */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3">Legend:</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#d1d5db] flex items-center justify-center text-gray-700 font-bold">1</div>
                    <span className="text-gray-700">You have not visited the question yet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#ef4444] text-white flex items-center justify-center font-bold">2</div>
                    <span className="text-gray-700">You have not answered the question</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#22c55e] text-white flex items-center justify-center font-bold">3</div>
                    <span className="text-gray-700">You have answered the question</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#a855f7] text-white flex items-center justify-center font-bold">4</div>
                    <span className="text-gray-700">You have NOT answered the question, but have marked the question for review</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#a855f7] text-white flex items-center justify-center font-bold relative">
                      5
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-white"></span>
                    </div>
                    <span className="text-gray-700">The question(s) "Answered and Marked for Review" will be considered for evaluation</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600 italic">
                  The Marked for Review status for a question simply indicates that you would like to look at that question again.
                </p>
              </div>
            </div>

            {/* Next Button */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <Button
                onClick={() => setCurrentScreen(3)}
                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-8 py-2 text-lg"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: Important Instructions
  if (currentScreen === 3) {
    const getExamInstructions = () => {
      if (examType === 'jee_mains') {
        return (
          <div className="space-y-4 text-sm text-gray-700">
            <p>The motive for enabling this mock test is to familiarize the candidates with the Computer Based Test (CBT) environment.</p>
            <p>The types of questions and marking scheme is only illustrative and is in no way indicative or representation of the type of questions and marking scheme of the actual question paper.</p>
            
            <h4 className="font-bold text-gray-800 mt-4">Section wise Instructions</h4>
            <p className="italic">Note: There will be 25% negative marking in both the sections.</p>
            
            <p><strong>SECTION 1:</strong> Subject Proficiency Test (Subject Code 101)<br/>
            Maximum marks: 50</p>
            
            <p><strong>SECTION 2:</strong> Research Aptitude Test (Subject Code 102)<br/>
            Maximum marks: 100</p>
            
            <p>No clarification will be provided during the exam.</p>
            
            <p>Calculators and other electronic devices are not allowed during the exam. Rough sheets and pens will be provided in the exam center. A virtual on-screen calculator is available for use.</p>
            
            <p>Some questions may have more than one answer correct. Points will be given only when ALL the correct answers are marked and NONE of the incorrect are marked.</p>
            
            <p>The exam is spread over two sections, Section 1 and Section 2. You cannot review your answers to Section 1 once you start answering Section 2.</p>
          </div>
        );
      } else if (examType === 'jee_advanced') {
        return (
          <div className="space-y-4 text-sm text-gray-700">
            <p>The test consists of multiple subjects with section-wise questions. Each section may have different marking schemes.</p>
            
            <h4 className="font-bold text-gray-800 mt-4">Section wise Instructions</h4>
            
            <ul className="list-disc ml-6 space-y-2">
              <li>For single correct answer questions: +3 marks for correct answer, -1 for incorrect answer.</li>
              <li>For multiple correct answer questions: +4 marks for all correct answers (partial marking applies), 0 for incorrect.</li>
              <li>For numerical questions: +3 marks for correct answer, 0 for incorrect.</li>
            </ul>
            
            <p className="mt-4">No clarification will be provided during the exam.</p>
            
            <p>Calculators and other electronic devices are not allowed during the exam. A virtual on-screen calculator is available for use.</p>
            
            <p>The exam is divided into sections by subject. You can navigate between sections freely during the test duration.</p>
          </div>
        );
      } else {
        // Get first question's marks for display
        const sampleMarks = questions.length > 0 ? questions[0].marks : 4;
        const sampleNegativeMarks = questions.length > 0 ? questions[0].negative_marks : 1;
        
        return (
          <div className="space-y-4 text-sm text-gray-700">
            <p className="font-semibold">General Test Instructions:</p>
            
            <p>This test contains questions of various types. Please read each question carefully before answering.</p>
            
            <h4 className="font-bold text-gray-800 mt-4">Marking Scheme:</h4>
            <ul className="list-disc ml-6 space-y-2">
              <li>Correct Answer: +{sampleMarks} marks</li>
              <li>Incorrect Answer: -{sampleNegativeMarks} marks</li>
              <li>Unattempted: 0 marks</li>
            </ul>
            
            <p className="mt-4">You can navigate freely between all questions during the test.</p>
            <p>Use the question palette on the right to track your progress.</p>
            <p>Mark questions for review if you want to revisit them.</p>
          </div>
        );
      }
    };

    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col">
        {renderHeader()}
        
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-[#1a73e8] text-white px-6 py-4">
              <h2 className="text-xl font-bold">Other Important Instructions</h2>
              <p className="text-white/80 text-sm">General instructions:</p>
            </div>

            <div className="p-6 space-y-6">
              {getExamInstructions()}

              {/* Fullscreen Warning */}
              {fullscreenEnabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-yellow-800">Fullscreen Mode Required</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        This test requires fullscreen mode. Exiting fullscreen more than 7 times will auto-submit your test.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agreement Checkbox */}
              <div className="border-t border-gray-200 pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                  />
                  <span className="text-gray-700 text-sm">
                    I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. 
                    I declare that I am not in possession of, not wearing, or not carrying any prohibited gadget like mobile phone, bluetooth devices, etc., 
                    or any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, 
                    I shall be liable to be debarred from this Test/Examination and/or to disciplinary action, which may include a ban from future Tests/Examinations.
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentScreen(2)}
                className="px-8 py-2 text-lg"
              >
                Previous
              </Button>
              <Button
                onClick={startTest}
                disabled={!agreedToTerms || loading}
                className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-8 py-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "I am ready to begin"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 4: Test Interface (existing code continues below)

  // Determine if this is an integer type question
  const isIntegerQuestion = currentQuestion?.question_type === 'integer' || 
                            currentQuestion?.question_type === 'numerical';
  
  // Parse options - handle both array and object formats, preserving image URLs
  const options = Array.isArray(currentQuestion?.options) 
    ? currentQuestion.options.map((opt: any) => {
        // If option is an object with text/label/image_url properties
        if (typeof opt === 'object' && opt !== null) {
          return {
            text: opt.text || opt.label || '',
            image_url: opt.image_url || null
          };
        }
        // If option is a simple string
        return {
          text: opt,
          image_url: null
        };
      }).filter((opt: any) => opt.text && opt.text.trim() !== '') // Filter out empty options
    : typeof currentQuestion?.options === 'object' && currentQuestion?.options !== null
      ? Object.values(currentQuestion.options as Record<string, any>).map((opt: any) => {
          if (typeof opt === 'object' && opt !== null) {
            return {
              text: opt.text || opt.label || '',
              image_url: opt.image_url || null
            };
          }
          return {
            text: opt,
            image_url: null
          };
        }).filter((opt: any) => opt.text && opt.text.trim() !== '')
      : [];

  const statusCounts = getStatusCounts();

  const testContent = (
    <div className="min-h-screen bg-[#0a1628] flex flex-col pb-14 md:pb-16">
      {/* Header */}
      <header className="bg-[#1a2332] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-base font-medium">{testName}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded font-mono font-bold text-sm",
            timeLeft < 300 ? "bg-[#ef4444] text-white" : "bg-white text-black"
          )}>
            <Clock className="w-4 h-4" />
            Time Left: {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-300 rounded flex items-center justify-center overflow-hidden">
              {studentAvatar ? (
                <img src={studentAvatar} alt={studentName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl" role="img" aria-label="User avatar">👤</span>
              )}
            </div>
            <div className="text-sm">
              <div className="font-medium">{studentName}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Section Tabs */}
      <div className="bg-[#f5f5f5] border-b border-gray-300 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setCurrentQuestionIndex(0);
              }}
              className={cn(
                "px-4 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors border",
                activeSection === section.id 
                  ? "bg-[#1a73e8] text-white border-[#1a73e8]" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              )}
            >
              {section.name} ({section.questions.length})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Question Area */}
        <main className="flex-1 bg-white p-6 overflow-y-auto">
          {/* Section Instructions */}
          <div className="mb-6 p-4 bg-[#dbeafe] border border-[#3b82f6] rounded-lg text-sm text-gray-700">
            <ul className="list-disc ml-4 space-y-1">
              <li>This section contains <strong>{currentSection?.questions.length || 0}</strong> questions.</li>
              {isIntegerQuestion ? (
                <>
                  <li>Enter your answer as a numerical value (integer only).</li>
                  <li>Full Marks: +{currentQuestion?.marks || 4} if correct</li>
                  <li>Zero Marks: 0 if none chosen</li>
                  {currentQuestion?.negative_marks ? (
                    <li>Negative Marks: -{currentQuestion.negative_marks} for incorrect</li>
                  ) : null}
                </>
              ) : isMultipleChoice ? (
                <>
                  <li>Each question has FOUR options. ONE OR MORE may be correct.</li>
                  <li>Full Marks: +{currentQuestion?.marks || 4} if correct</li>
                  <li>Zero Marks: 0 if none chosen</li>
                  {currentQuestion?.negative_marks ? (
                    <li>Negative Marks: -{currentQuestion.negative_marks} for incorrect</li>
                  ) : null}
                </>
              ) : (
                <>
                  <li>Each question has FOUR options. ONLY ONE is correct.</li>
                  <li>Full Marks: +{currentQuestion?.marks || 4} if correct</li>
                  <li>Zero Marks: 0 if none chosen</li>
                  {currentQuestion?.negative_marks ? (
                    <li>Negative Marks: -{currentQuestion.negative_marks} for incorrect</li>
                  ) : null}
                </>
              )}
            </ul>
          </div>

          {/* Question Content */}
          <div className="mb-6">
            {/* Question Number Badge */}
            <div className="mb-4 flex items-center gap-2">
              <span className="px-3 py-1 bg-[#1a73e8] text-white rounded text-sm font-medium">
                Q.{currentQuestionIndex + 1}
              </span>
              <span className="text-xs text-gray-500">
                {isIntegerQuestion ? 'Integer Type' : isMultipleChoice ? 'Multiple Choice' : 'Single Choice'}
              </span>
            </div>

            {currentQuestion?.image_url && (
              <div className="mb-4">
                <img 
                  src={currentQuestion.image_url} 
                  alt="Question" 
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                  onError={(e) => {
                    console.error('Image failed to load:', currentQuestion.image_url);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {currentQuestion?.question_text && (
              <div className="text-base leading-relaxed text-gray-800 mb-6">
                <LatexRenderer content={currentQuestion.question_text} />
              </div>
            )}

            {/* Answer Input - Different for Integer vs MCQ */}
            {isIntegerQuestion ? (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your answer (integer only):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={currentQuestion ? (answers[currentQuestion.id] || '') : ''}
                  onChange={(e) => handleIntegerAnswer(e.target.value)}
                  placeholder="Enter numerical answer"
                  className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] outline-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {options.map((option, index) => {
                  const optionStr = String(index);
                  const currentAnswers = currentQuestion ? answers[currentQuestion.id] : undefined;
                  const isSelected = isMultipleChoice
                    ? Array.isArray(currentAnswers) && currentAnswers.includes(optionStr)
                    : currentAnswers === optionStr;

                  return (
                    <label
                      key={index}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                        isSelected
                          ? "border-[#1a73e8] bg-blue-50" 
                          : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <input
                        type={isMultipleChoice ? "checkbox" : "radio"}
                        name={isMultipleChoice ? undefined : `question-${currentQuestion?.id}`}
                        checked={isSelected}
                        onChange={() => handleAnswer(index)}
                        className="w-4 h-4 text-[#1a73e8] border-gray-300 focus:ring-[#1a73e8] mt-1"
                      />
                      <span className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm bg-gray-100 text-gray-700 flex-shrink-0">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1">
                        <span className="text-gray-700 block">
                          <LatexRenderer content={option.text} />
                        </span>
                        {option.image_url && (
                          <img 
                            src={option.image_url} 
                            alt={`Option ${String.fromCharCode(65 + index)}`} 
                            className="max-w-full h-auto rounded-lg border border-gray-200 mt-2"
                            onError={(e) => {
                              console.error('Option image failed to load:', option.image_url);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Question Palette */}
        <aside className="w-80 bg-[#f8f9fa] border-l border-gray-200 flex flex-col">
          {/* User Info */}
          <div className="p-4 border-b border-gray-200 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-300 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
              {studentAvatar ? (
                <img src={studentAvatar} alt={studentName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl" role="img" aria-label="User avatar placeholder">👤</span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-700">{studentName}</p>
          </div>

          {/* Legend */}
          <div className="p-4 border-b border-gray-200 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500 text-white flex items-center justify-center text-xs">{statusCounts.answered}</div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500 text-white flex items-center justify-center text-xs">{statusCounts.notAnswered}</div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-300 flex items-center justify-center text-xs">{statusCounts.notVisited}</div>
              <span>Not Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-500 text-white flex items-center justify-center text-xs">{statusCounts.markedCount}</div>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <div className="w-6 h-6 rounded bg-purple-500 text-white flex items-center justify-center text-xs relative">
                {statusCounts.answeredMarked}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></span>
              </div>
              <span>Answered & Marked for Review</span>
            </div>
          </div>

          {/* Section Title */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-[#1a73e8]">{currentSection?.name}</h3>
            <p className="text-xs text-gray-500">Choose a Question</p>
          </div>

          {/* Question Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {currentSection?.questions.map((q, index) => {
                const status = getQuestionStatus(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setVisitedQuestions(prev => new Set([...prev, q.id]));
                    }}
                    className={cn(
                      "w-10 h-10 rounded flex items-center justify-center text-sm font-medium transition-all relative",
                      status === "current" && "ring-2 ring-blue-500",
                      status === "answered" && "bg-green-500 text-white",
                      status === "not-answered" && "bg-red-500 text-white",
                      status === "marked" && "bg-purple-500 text-white",
                      status === "answered-marked" && "bg-purple-500 text-white",
                      status === "not-visited" && "bg-gray-200 text-gray-600"
                    )}
                  >
                    {index + 1}
                    {status === "answered-marked" && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Action Bar - Fixed to bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#e8e8e8] border-t border-gray-300 px-4 md:px-6 py-2 md:py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            onClick={markForReviewAndNext}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4"
          >
            <span className="hidden sm:inline">Mark for Review & Next</span>
            <span className="sm:hidden">Review</span>
          </Button>
          <Button
            variant="outline"
            onClick={clearResponse}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4"
          >
            <span className="hidden sm:inline">Clear Response</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            onClick={saveAndNext}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs md:text-sm px-2 md:px-4"
          >
            <span className="hidden sm:inline">Save & Next</span>
            <span className="sm:hidden">Save</span>
          </Button>
          <Button
            onClick={() => setShowSubmitModal(true)}
            className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs md:text-sm px-2 md:px-4"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
          </Button>
        </div>
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-800">Submit Test?</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <span className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    Answered
                  </span>
                  <span className="font-bold text-green-700">{statusCounts.answered}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                  <span className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    Not Answered
                  </span>
                  <span className="font-bold text-red-700">{questions.length - statusCounts.answered}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <span className="flex items-center gap-2 text-purple-700">
                    <Flag className="w-5 h-5" />
                    Marked for Review
                  </span>
                  <span className="font-bold text-purple-700">{statusCounts.markedCount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setShowSubmitModal(false)}
                >
                  Continue Test
                </Button>
                <Button 
                  className="flex-1 bg-[#22c55e] hover:bg-[#16a34a]" 
                  onClick={() => handleSubmit()} 
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Now"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Wrap with FullscreenGuard if enabled
  if (fullscreenEnabled) {
    return (
      <FullscreenGuard
        maxExits={7}
        onMaxExitsReached={handleMaxFullscreenExits}
        onExitCountChange={handleFullscreenExitCountChange}
        initialExitCount={fullscreenExitCount}
      >
        {testContent}
      </FullscreenGuard>
    );
  }

  return testContent;
}
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PDFViewer from '@/components/test/PDFViewer';
import OMRPanel from '@/components/test/OMRPanel';
import FullscreenGuard from '@/components/test/FullscreenGuard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, AlertTriangle, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface Question {
  id: string;
  question_number: number;
  question_type: string;
  options?: string[];
  marks: number;
  negative_marks: number;
  pdf_page_number: number;
}

interface TestData {
  id: string;
  name: string;
  duration_minutes: number;
  exam_type: string;
  pdf_url: string | null;
  instructions_json: any;
}

interface ExistingAttempt {
  id: string;
  started_at: string;
  answers: Record<string, any> | null;
  roll_number: string | null;
  fullscreen_exit_count: number | null;
}

export default function PDFTestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // States
  const [phase, setPhase] = useState<'loading' | 'instructions' | 'resume' | 'test' | 'submitting'>('loading');
  const [testData, setTestData] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [rollNumber, setRollNumber] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [existingAttempt, setExistingAttempt] = useState<ExistingAttempt | null>(null);

  // Test state
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);

  // Instructions state
  const [agreedToInstructions, setAgreedToInstructions] = useState(false);
  const [instructions, setInstructions] = useState<string[]>([]);

  // Auto-save interval ref
  const [lastSaveTime, setLastSaveTime] = useState(Date.now());

  // Generate roll number
  const generateRollNumber = useCallback(() => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const random = Math.floor(Math.random() * 10);
    return `${dd}${mm}${yy}${random}`;
  }, []);

  // Initialize test
  useEffect(() => {
    const initializeTest = async () => {
      if (!testId || !user) return;

      try {
        // Fetch test data
        const { data: test, error: testError } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();

        if (testError || !test) {
          toast({ title: 'Test not found', variant: 'destructive' });
          navigate('/tests');
          return;
        }

        setTestData(test);

        // Check for existing incomplete attempt
        const { data: existingAttemptData } = await supabase
          .from('test_attempts')
          .select('id, started_at, answers, roll_number, fullscreen_exit_count, completed_at')
          .eq('test_id', testId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingAttemptData) {
          if (existingAttemptData.completed_at) {
            // Already completed - redirect to analysis
            toast({ title: 'Test already completed', description: 'Redirecting to results...' });
            navigate(`/test/${testId}/analysis?attemptId=${existingAttemptData.id}`);
            return;
          }

          // Check if time has expired
          const startTime = new Date(existingAttemptData.started_at).getTime();
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          const remainingTime = (test.duration_minutes * 60) - elapsedSeconds;

          if (remainingTime <= 0) {
            // Time expired - auto submit
            toast({ title: 'Time expired', description: 'Submitting your test...' });
            setAttemptId(existingAttemptData.id);
            const savedAnswers = (existingAttemptData.answers as Record<string, any>) || {};
            setAnswers(savedAnswers);
            await autoSubmitExpiredTest(existingAttemptData.id, savedAnswers, test.duration_minutes * 60);
            return;
          }

          // Show resume option
          setExistingAttempt({
            id: existingAttemptData.id,
            started_at: existingAttemptData.started_at,
            answers: (existingAttemptData.answers as Record<string, any>) || null,
            roll_number: existingAttemptData.roll_number,
            fullscreen_exit_count: existingAttemptData.fullscreen_exit_count,
          });
          setTimeLeft(remainingTime);
          setPhase('resume');
        } else {
          setTimeLeft(test.duration_minutes * 60);
          setPhase('instructions');
        }

        // Fetch questions from test_section_questions (PDF Tests)
        const { data: sectionQuestions, error: sectionQuestionsError } = await supabase
          .from('test_section_questions')
          .select(`
            id,
            question_number,
            marks,
            negative_marks,
            pdf_page,
            correct_answer,
            section_id,
            test_sections!inner (
              section_type
            )
          `)
          .eq('test_id', testId)
          .order('question_number');

        if (!sectionQuestionsError && sectionQuestions && sectionQuestions.length > 0) {
          const qs = sectionQuestions.map((q: any) => {
            // Normalize section_type to match OMRPanel expected types
            const sectionType = q.test_sections?.section_type || 'single_choice';
            let questionType = 'single';
            if (sectionType === 'single_choice') questionType = 'single';
            else if (sectionType === 'multiple_choice') questionType = 'multi';
            else if (sectionType === 'integer') questionType = 'integer';
            
            return {
              id: q.id,
              question_number: q.question_number,
              question_type: questionType,
              marks: q.marks || 4,
              negative_marks: q.negative_marks || 1,
              pdf_page_number: q.pdf_page || 1
            };
          });
          setQuestions(qs);
        } else {
          // Fallback to test_questions table for non-PDF tests
          const { data: testQuestions, error: questionsError } = await supabase
            .from('test_questions')
            .select(`
              question_id,
              order_index,
              questions (
                id,
                question_type,
                marks,
                negative_marks,
                pdf_page_number,
                question_number
              )
            `)
            .eq('test_id', testId)
            .order('order_index');

          if (!questionsError && testQuestions) {
            const qs = testQuestions.map((tq: any, index: number) => ({
              id: tq.questions.id,
              question_number: tq.questions.question_number || index + 1,
              question_type: tq.questions.question_type || 'single',
              marks: tq.questions.marks || 4,
              negative_marks: tq.questions.negative_marks || 1,
              pdf_page_number: tq.questions.pdf_page_number || 1
            }));
            setQuestions(qs);
          }
        }

        // Get PDF URL if exists
        if (test.pdf_url) {
          const { data: urlData } = await supabase.storage
            .from('test-pdfs')
            .createSignedUrl(test.pdf_url, 3600 * 3); // 3 hours
          
          if (urlData?.signedUrl) {
            setPdfUrl(urlData.signedUrl);
          }
        }

        // Generate instructions based on exam type
        const examInstructions = generateInstructions(test.exam_type);
        setInstructions(examInstructions);

        // Generate roll number
        setRollNumber(generateRollNumber());
      } catch (err) {
        console.error('Error initializing test:', err);
        toast({ title: 'Error loading test', variant: 'destructive' });
      }
    };

    initializeTest();
  }, [testId, user, navigate, toast, generateRollNumber]);

  // Auto-submit expired test
  const autoSubmitExpiredTest = async (attemptId: string, savedAnswers: Record<string, any>, totalSeconds: number) => {
    try {
      setPhase('submitting');
      
      const { data, error } = await supabase.functions.invoke('submit-test', {
        body: {
          attempt_id: attemptId,
          answers: savedAnswers,
          time_taken_seconds: totalSeconds
        }
      });

      if (error) throw error;

      toast({ title: 'Test auto-submitted', description: 'Time expired' });
      navigate(`/test/${testId}/analysis?attemptId=${attemptId}`);
    } catch (err: any) {
      console.error('Error auto-submitting:', err);
      toast({ title: 'Error submitting test', variant: 'destructive' });
    }
  };

  // Generate instructions based on exam type
  const generateInstructions = (examType: string) => {
    const commonInstructions = [
      'Read each question carefully before answering.',
      'You can navigate between questions using the question palette.',
      'Mark questions for review if you want to revisit them later.',
      'The test will auto-submit when the timer reaches zero.',
      'Do not exit fullscreen mode during the test.',
      'Maximum 7 fullscreen exits allowed. 8th exit will auto-submit the test.',
      'Your answers are auto-saved every 10 seconds.',
      'If you leave the test, you can resume from where you left off.',
    ];

    if (examType === 'jee_advanced') {
      return [
        ...commonInstructions,
        'Single Correct Questions: +3 marks for correct, -1 for incorrect.',
        'Multiple Correct Questions: +4 marks for all correct (partial marking applies).',
        'Numerical Questions: +3 marks for correct, 0 for incorrect.',
        'For multiple correct questions, partial marks are awarded.',
      ];
    } else {
      return [
        ...commonInstructions,
        'Single Correct Questions: +4 marks for correct, -1 for incorrect.',
        'Multiple Correct Questions: +4 marks for correct, 0 for incorrect.',
        'Numerical Questions: +4 marks for correct, 0 for incorrect.',
      ];
    }
  };

  // Resume test
  const resumeTest = async () => {
    if (!existingAttempt) return;

    setAttemptId(existingAttempt.id);
    setAnswers(existingAttempt.answers || {});
    setRollNumber(existingAttempt.roll_number || generateRollNumber());
    setFullscreenExitCount(existingAttempt.fullscreen_exit_count || 0);
    setPhase('test');
  };

  // Start test
  const startTest = async () => {
    if (!testId || !user) return;

    try {
      const { data, error } = await supabase.functions.invoke('start-test', {
        body: { test_id: testId }
      });

      if (error) throw error;

      setAttemptId(data.attempt_id);

      // Update attempt with roll number
      await supabase
        .from('test_attempts')
        .update({ roll_number: rollNumber })
        .eq('id', data.attempt_id);

      setPhase('test');
    } catch (err: any) {
      console.error('Error starting test:', err);
      toast({ title: 'Error starting test', description: err.message, variant: 'destructive' });
    }
  };

  // Auto-save answers
  useEffect(() => {
    if (phase !== 'test' || !attemptId) return;

    const saveInterval = setInterval(async () => {
      const timeTaken = testData ? (testData.duration_minutes * 60) - timeLeft : 0;
      
      await supabase
        .from('test_attempts')
        .update({ 
          answers,
          time_taken_seconds: timeTaken,
        })
        .eq('id', attemptId);
      
      setLastSaveTime(Date.now());
      console.log('Auto-saved answers at', new Date().toLocaleTimeString());
    }, 10000); // Save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [phase, attemptId, answers, timeLeft, testData]);

  // Timer
  useEffect(() => {
    if (phase !== 'test' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // Handle answer change
  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  // Toggle review
  const handleToggleReview = useCallback((questionId: string) => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!attemptId || phase === 'submitting') return;

    setPhase('submitting');

    try {
      const timeTaken = testData ? (testData.duration_minutes * 60) - timeLeft : 0;

      const { data, error } = await supabase.functions.invoke('submit-test', {
        body: {
          attempt_id: attemptId,
          answers,
          time_taken_seconds: timeTaken
        }
      });

      if (error) throw error;

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      toast({ title: 'Test submitted successfully!' });
      navigate(`/test/${testId}/analysis?attemptId=${attemptId}`);
    } catch (err: any) {
      console.error('Error submitting test:', err);
      toast({ title: 'Error submitting test', description: err.message, variant: 'destructive' });
      setPhase('test');
    }
  }, [attemptId, answers, timeLeft, testData, testId, navigate, toast, phase]);

  // Handle max exits
  const handleMaxExitsReached = useCallback(() => {
    toast({
      title: 'Maximum exits reached',
      description: 'Test is being auto-submitted.',
      variant: 'destructive'
    });
    handleSubmit();
  }, [handleSubmit, toast]);

  // Handle fullscreen exit count
  const handleExitCountChange = useCallback(async (count: number) => {
    setFullscreenExitCount(count);
    
    if (attemptId) {
      await supabase
        .from('test_attempts')
        .update({ fullscreen_exit_count: count })
        .eq('id', attemptId);
    }
  }, [attemptId]);

  // Student name from profile
  const [studentName, setStudentName] = useState('');
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (data?.full_name) setStudentName(data.full_name);
    };
    fetchProfile();
  }, [user]);

  // Format remaining time for resume screen
  const formatTimeForDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Loading phase
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  // Resume phase
  if (phase === 'resume' && existingAttempt) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Play className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display">Resume Test</h1>
                <p className="text-muted-foreground">{testData?.name}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[hsl(45,93%,47%)]/10 border border-[hsl(45,93%,47%)]/30 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[hsl(45,93%,47%)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[hsl(45,93%,47%)]">Test in Progress</p>
                  <p className="text-sm text-muted-foreground">
                    You have an ongoing test attempt. Resume to continue where you left off.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-primary">{formatTimeForDisplay(timeLeft)}</p>
                <p className="text-sm text-muted-foreground">Time Remaining</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-primary">
                  {Object.keys(existingAttempt.answers || {}).length}
                </p>
                <p className="text-sm text-muted-foreground">Questions Answered</p>
              </div>
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={resumeTest}
            >
              <Play className="w-5 h-5 mr-2" />
              Resume Test
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Instructions phase
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display">{testData?.name}</h1>
                <p className="text-muted-foreground">
                  {testData?.exam_type === 'jee_advanced' ? 'JEE Advanced' : 'JEE Mains'} Pattern
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-primary">{questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-primary">{testData?.duration_minutes}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold text-primary">{rollNumber}</p>
                <p className="text-sm text-muted-foreground">Roll Number</p>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Instructions</h2>
            <ul className="space-y-3 mb-8">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{instruction}</span>
                </li>
              ))}
            </ul>

            <div className="p-4 rounded-lg bg-[hsl(45,93%,47%)]/10 border border-[hsl(45,93%,47%)]/30 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[hsl(45,93%,47%)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[hsl(45,93%,47%)]">Important</p>
                  <p className="text-sm text-muted-foreground">
                    The test will enter fullscreen mode when you start. Do not exit fullscreen during the test.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Checkbox
                id="agree"
                checked={agreedToInstructions}
                onCheckedChange={(checked) => setAgreedToInstructions(checked === true)}
              />
              <label htmlFor="agree" className="text-sm cursor-pointer">
                I have read and understood all the instructions
              </label>
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={!agreedToInstructions || (pdfUrl && !pdfLoaded)}
              onClick={startTest}
            >
              {pdfUrl && !pdfLoaded ? 'Loading PDF...' : 'Start Test'}
            </Button>

            {/* Preload PDF */}
            {pdfUrl && !pdfLoaded && (
              <div className="hidden">
                <PDFViewer pdfUrl={pdfUrl} onLoadComplete={() => setPdfLoaded(true)} />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Submitting phase
  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Submitting your test...</p>
        </div>
      </div>
    );
  }

  // Test phase
  return (
    <FullscreenGuard
      maxExits={7}
      onMaxExitsReached={handleMaxExitsReached}
      onExitCountChange={handleExitCountChange}
      initialExitCount={fullscreenExitCount}
    >
      <div className="min-h-screen bg-background flex">
        {/* Left side - PDF Viewer (70%) */}
        <div className="flex-1 h-screen" style={{ width: '70%' }}>
          {pdfUrl ? (
            <PDFViewer
              pdfUrl={pdfUrl}
              currentPage={questions[currentQuestion]?.pdf_page_number || 1}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No PDF attached to this test</p>
                <p className="text-sm mt-2">Answer questions using the panel on the right</p>
              </div>
            </div>
          )}
        </div>

        {/* Right side - OMR Panel (30%) */}
        <div className="h-screen border-l border-border" style={{ width: '30%' }}>
          <OMRPanel
            questions={questions}
            answers={answers}
            markedForReview={markedForReview}
            currentQuestion={currentQuestion}
            timeLeft={timeLeft}
            studentName={studentName}
            rollNumber={rollNumber}
            onAnswerChange={handleAnswerChange}
            onToggleReview={handleToggleReview}
            onQuestionClick={setCurrentQuestion}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50" style={{ marginLeft: '-15%' }}>
          <Button
            variant="glass"
            size="lg"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </Button>
          <span className="px-4 py-2 rounded-lg bg-secondary/80 backdrop-blur font-medium">
            Q {currentQuestion + 1} of {questions.length}
          </span>
          <Button
            variant="glass"
            size="lg"
            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentQuestion === questions.length - 1}
          >
            Next
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </FullscreenGuard>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Copy, Trash2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Question, EditorMode, Section } from '@/types/question.types';
import { QuestionMode } from './QuestionMode';
import { SolutionMode } from './SolutionMode';
import { SettingsMode } from './SettingsMode';
import { FullscreenToggle } from './FullscreenToggle';
import { cn } from '@/lib/utils';

/**
 * Custom Question Editor - Professional, writing-first question authoring tool
 * This editor is specifically for normal tests (not PDF tests)
 */
export default function QuestionEditor() {
  const { testId, questionId } = useParams<{ testId: string; questionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [question, setQuestion] = useState<Question | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [mode, setMode] = useState<EditorMode>('question');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch question data
  const fetchQuestion = useCallback(async () => {
    if (!questionId) return;

    const { data: questionData, error: questionError } = await supabase
      .from('test_section_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !questionData) {
      toast({ title: 'Question not found', variant: 'destructive' });
      navigate(`/admin/test-editor/${testId}`);
      return;
    }

    // Fetch section to get section_type
    const { data: sectionData } = await supabase
      .from('test_sections')
      .select('*')
      .eq('id', questionData.section_id)
      .single();

    setQuestion(questionData as Question);
    setSection(sectionData as Section);
    setIsLoading(false);
  }, [questionId, testId, navigate, toast]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  // Save question to database
  const saveQuestion = useCallback(async (data: Question) => {
    if (!data) return;

    setIsSaving(true);
    setSaveStatus('saving');

    const { error } = await supabase
      .from('test_section_questions')
      .update({
        question_text: data.question_text,
        image_url: data.image_url,
        options: data.options,
        correct_answer: data.correct_answer,
        solution_text: data.solution_text,
        solution_image_url: data.solution_image_url,
        marks: data.marks,
        negative_marks: data.negative_marks,
        difficulty: data.difficulty,
        time_seconds: data.time_seconds,
      })
      .eq('id', data.id);

    if (error) {
      toast({ title: 'Failed to save', variant: 'destructive' });
      setSaveStatus('unsaved');
    } else {
      setSaveStatus('saved');
    }

    setIsSaving(false);
  }, [toast]);

  // Auto-save hook
  useAutoSave({
    data: question,
    onSave: saveQuestion,
    interval: 7000, // 7 seconds
    enabled: !!question,
  });

  // Handle question updates
  const handleQuestionChange = useCallback((updates: Partial<Question>) => {
    if (!question) return;
    setQuestion({ ...question, ...updates });
    setSaveStatus('unsaved');
  }, [question]);

  // Manual save
  const handleManualSave = async () => {
    if (question) {
      await saveQuestion(question);
      toast({ title: 'Saved successfully' });
    }
  };

  // Duplicate question
  const handleDuplicate = async () => {
    if (!question) return;

    const { data, error } = await supabase
      .from('test_section_questions')
      .insert([{
        test_id: question.test_id,
        section_id: question.section_id,
        question_number: question.question_number + 1,
        question_text: question.question_text,
        image_url: question.image_url,
        options: question.options,
        correct_answer: question.correct_answer,
        solution_text: question.solution_text,
        solution_image_url: question.solution_image_url,
        marks: question.marks,
        negative_marks: question.negative_marks,
        difficulty: question.difficulty,
        order_index: question.order_index + 1,
      }])
      .select()
      .single();

    if (!error && data) {
      toast({ title: 'Question duplicated' });
      navigate(`/admin/custom-question-editor/${testId}/${data.id}`);
    } else {
      toast({ title: 'Failed to duplicate', variant: 'destructive' });
    }
  };

  // Delete question
  const handleDelete = async () => {
    if (!question) return;
    if (!confirm('Delete this question? This cannot be undone.')) return;

    const { error } = await supabase
      .from('test_section_questions')
      .delete()
      .eq('id', question.id);

    if (!error) {
      toast({ title: 'Question deleted' });
      navigate(`/admin/test-editor/${testId}`);
    } else {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  // Handle unsaved changes on navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!question || !section) {
    return null;
  }

  return (
    <div
      className={cn(
        'h-screen flex flex-col bg-background',
        isFullscreen && 'fixed inset-0 z-50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-4">
          {!isFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/admin/test-editor/${testId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-lg font-bold">Question {question.question_number}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                {section.section_type.replace('_', ' ')}
              </span>
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="flex items-center gap-1 text-yellow-600">
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleManualSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-1" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
          <FullscreenToggle isFullscreen={isFullscreen} onToggle={setIsFullscreen} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={mode} onValueChange={(value) => setMode(value as EditorMode)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="question">Question</TabsTrigger>
          <TabsTrigger value="solution">Solution</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="question" className="h-full m-0 overflow-y-auto">
            <QuestionMode
              question={question}
              sectionType={section.section_type}
              onChange={handleQuestionChange}
            />
          </TabsContent>

          <TabsContent value="solution" className="h-full m-0">
            <SolutionMode
              question={question}
              onChange={handleQuestionChange}
            />
          </TabsContent>

          <TabsContent value="settings" className="h-full m-0 overflow-y-auto">
            <SettingsMode
              question={question}
              onChange={handleQuestionChange}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

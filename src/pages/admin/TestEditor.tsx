import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Save, Eye, EyeOff, Upload, Plus, ChevronRight, 
  ChevronDown, Trash2, GripVertical, FileText, Check,
  X, Book, Layers, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PDFPreview from "@/components/admin/PDFPreview";
import SubjectEditor from "@/components/admin/SubjectEditor";

interface Test {
  id: string;
  name: string;
  exam_type: string;
  duration_minutes: number;
  is_published: boolean;
  pdf_url: string | null;
}

interface Subject {
  id: string;
  test_id: string;
  name: string;
  order_index: number;
}

interface Section {
  id: string;
  subject_id: string;
  name: string | null;
  section_type: string;
  order_index: number;
}

interface Question {
  id: string;
  section_id: string;
  test_id: string;
  question_number: number;
  question_text: string | null;
  options: string[] | null;
  correct_answer: string | string[];
  marks: number;
  negative_marks: number;
  pdf_page: number;
  order_index: number;
}

export default function TestEditor() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!testId) return;

    const [testRes, subjectsRes, sectionsRes, questionsRes] = await Promise.all([
      supabase.from('tests').select('*').eq('id', testId).single(),
      supabase.from('test_subjects').select('*').eq('test_id', testId).order('order_index'),
      supabase.from('test_sections').select('*').order('order_index'),
      supabase.from('test_section_questions').select('*').eq('test_id', testId).order('order_index')
    ]);

    if (testRes.error) {
      toast({ title: "Test not found", variant: "destructive" });
      navigate('/admin/tests');
      return;
    }

    setTest(testRes.data);
    setSubjects(subjectsRes.data || []);
    
    // Filter sections to only those belonging to our subjects
    const subjectIds = (subjectsRes.data || []).map(s => s.id);
    const filteredSections = (sectionsRes.data || []).filter(s => subjectIds.includes(s.subject_id));
    setSections(filteredSections);
    
    setQuestions(questionsRes.data?.map(q => ({
      ...q,
      options: q.options as string[] | null,
      correct_answer: q.correct_answer as string | string[]
    })) || []);

    // Set PDF URL if exists
    if (testRes.data.pdf_url) {
      const { data: urlData } = await supabase.storage
        .from('test-pdfs')
        .createSignedUrl(testRes.data.pdf_url, 3600);
      if (urlData) setPdfUrl(urlData.signedUrl);
    }

    // Set first subject as active if none selected
    if (!activeSubjectId && subjectsRes.data && subjectsRes.data.length > 0) {
      setActiveSubjectId(subjectsRes.data[0].id);
    }

    setIsLoading(false);
  }, [testId, navigate, toast, activeSubjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePdfUpload = async (file: File) => {
    if (!testId) return;
    
    setUploadingPdf(true);
    try {
      const fileName = `${testId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('test-pdfs')
        .upload(fileName, file);

      if (error) throw error;

      // Update test with PDF URL
      await supabase.from('tests').update({ pdf_url: data.path }).eq('id', testId);
      
      // Get signed URL for preview
      const { data: urlData } = await supabase.storage
        .from('test-pdfs')
        .createSignedUrl(data.path, 3600);
      
      if (urlData) setPdfUrl(urlData.signedUrl);
      toast({ title: "PDF uploaded successfully!" });
    } catch (err: any) {
      toast({ title: "Error uploading PDF", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleAddSubject = async () => {
    if (!testId) return;

    const name = prompt("Enter subject name (e.g., Physics, Chemistry):");
    if (!name?.trim()) return;

    try {
      const { data, error } = await supabase
        .from('test_subjects')
        .insert([{
          test_id: testId,
          name: name.trim(),
          order_index: subjects.length
        }])
        .select()
        .single();

      if (error) throw error;

      setSubjects([...subjects, data]);
      setActiveSubjectId(data.id);
      toast({ title: `Subject "${name}" added!` });
    } catch (err: any) {
      toast({ title: "Error adding subject", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Delete this subject and all its sections/questions?")) return;

    try {
      await supabase.from('test_subjects').delete().eq('id', subjectId);
      setSubjects(subjects.filter(s => s.id !== subjectId));
      setSections(sections.filter(s => s.subject_id !== subjectId));
      if (activeSubjectId === subjectId) {
        setActiveSubjectId(subjects.find(s => s.id !== subjectId)?.id || null);
      }
      toast({ title: "Subject deleted" });
    } catch (err: any) {
      toast({ title: "Error deleting subject", variant: "destructive" });
    }
  };

  const handleTogglePublish = async () => {
    if (!test) return;

    try {
      await supabase.from('tests').update({ is_published: !test.is_published }).eq('id', test.id);
      setTest({ ...test, is_published: !test.is_published });
      toast({ title: test.is_published ? "Test unpublished" : "Test published!" });
    } catch (err: any) {
      toast({ title: "Error updating test", variant: "destructive" });
    }
  };

  const getQuestionCount = () => questions.length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold font-display">{test?.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                  {test?.exam_type === 'jee_advanced' ? 'JEE Advanced' : 'JEE Mains'}
                </span>
                <span>{test?.duration_minutes} min</span>
                <span>•</span>
                <span>{getQuestionCount()} questions</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/tests')}>
              Back to Tests
            </Button>
            <Button 
              variant={test?.is_published ? "destructive" : "default"}
              size="sm"
              onClick={handleTogglePublish}
            >
              {test?.is_published ? (
                <><EyeOff className="w-4 h-4 mr-1" /> Unpublish</>
              ) : (
                <><Eye className="w-4 h-4 mr-1" /> Publish</>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: PDF Preview (70%) */}
          <div className="w-[70%] border-r border-border bg-secondary/20 overflow-hidden">
            <PDFPreview 
              pdfUrl={pdfUrl}
              onUpload={handlePdfUpload}
              uploading={uploadingPdf}
            />
          </div>

          {/* Right: Editor Panel (30%) */}
          <div className="w-[30%] flex flex-col overflow-hidden">
            {/* Breadcrumb */}
            <div className="p-3 border-b border-border bg-card/30 text-sm">
              <span className="text-muted-foreground">Test</span>
              {activeSubjectId && (
                <>
                  <ChevronRight className="w-4 h-4 inline mx-1 text-muted-foreground" />
                  <span className="text-foreground">
                    {subjects.find(s => s.id === activeSubjectId)?.name}
                  </span>
                </>
              )}
            </div>

            {/* Subject Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-border overflow-x-auto bg-card/20">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setActiveSubjectId(subject.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSubjectId === subject.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 hover:bg-secondary'
                  }`}
                >
                  <Book className="w-3 h-3" />
                  {subject.name}
                </button>
              ))}
              <button
                onClick={handleAddSubject}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                Add Subject
              </button>
            </div>

            {/* Subject Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeSubjectId ? (
                <SubjectEditor
                  testId={testId!}
                  subjectId={activeSubjectId}
                  examType={test?.exam_type || 'jee_mains'}
                  sections={sections.filter(s => s.subject_id === activeSubjectId)}
                  questions={questions}
                  onSectionsChange={(newSections) => {
                    setSections([
                      ...sections.filter(s => s.subject_id !== activeSubjectId),
                      ...newSections
                    ]);
                  }}
                  onQuestionsChange={setQuestions}
                  onDeleteSubject={() => handleDeleteSubject(activeSubjectId)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <Book className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No subjects yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a subject to start creating questions
                  </p>
                  <Button variant="gradient" size="sm" onClick={handleAddSubject}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Subject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

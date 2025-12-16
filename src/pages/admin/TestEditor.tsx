import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Eye, EyeOff, Plus, Trash2, Upload, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Check, Image, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  correct_answer: any;
  options: any;
  marks: number;
  negative_marks: number;
  pdf_page: number | null;
  order_index: number;
}

const MARKING_SCHEMES = {
  jee_mains: {
    single_choice: { marks: 4, negative: 1 },
    multiple_choice: { marks: 4, negative: 0 },
    integer: { marks: 4, negative: 0 }
  },
  jee_advanced: {
    single_choice: { marks: 3, negative: 1 },
    multiple_choice: { marks: 4, negative: 2 },
    integer: { marks: 3, negative: 0 }
  }
};

export default function TestEditor() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // PDF State
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Editor state
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!testId) return;

    const [testRes, subjectsRes, sectionsRes, questionsRes] = await Promise.all([
      supabase.from('tests').select('*').eq('id', testId).single(),
      supabase.from('test_subjects').select('*').eq('test_id', testId).order('order_index'),
      supabase.from('test_sections').select('*').order('order_index'),
      supabase.from('test_section_questions').select('*').eq('test_id', testId).order('question_number')
    ]);

    if (testRes.error) {
      toast({ title: "Test not found", variant: "destructive" });
      navigate('/admin/tests');
      return;
    }

    setTest(testRes.data);
    setSubjects(subjectsRes.data || []);
    
    const subjectIds = (subjectsRes.data || []).map(s => s.id);
    const filteredSections = (sectionsRes.data || []).filter(s => subjectIds.includes(s.subject_id));
    setSections(filteredSections);
    setQuestions(questionsRes.data || []);

    if (testRes.data.pdf_url) {
      const { data: urlData } = await supabase.storage
        .from('test-pdfs')
        .createSignedUrl(testRes.data.pdf_url, 3600);
      if (urlData) setPdfUrl(urlData.signedUrl);
    }

    if (subjectsRes.data?.length) {
      setActiveSubjectId(subjectsRes.data[0].id);
      const firstSection = filteredSections.find(s => s.subject_id === subjectsRes.data[0].id);
      if (firstSection) setActiveSectionId(firstSection.id);
    }

    setIsLoading(false);
  }, [testId, navigate, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !testId) return;
    
    setUploadingPdf(true);
    try {
      const fileName = `${testId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('test-pdfs')
        .upload(fileName, file);

      if (error) throw error;

      await supabase.from('tests').update({ pdf_url: data.path }).eq('id', testId);
      
      const { data: urlData } = await supabase.storage
        .from('test-pdfs')
        .createSignedUrl(data.path, 3600);
      
      if (urlData) setPdfUrl(urlData.signedUrl);
      toast({ title: "PDF uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!test) return;
    await supabase.from('tests').update({ is_published: !test.is_published }).eq('id', test.id);
    setTest({ ...test, is_published: !test.is_published });
    toast({ title: test.is_published ? "Unpublished" : "Published!" });
  };

  const handleAddSubject = async () => {
    const name = prompt("Subject name:");
    if (!name?.trim() || !testId) return;

    const { data, error } = await supabase
      .from('test_subjects')
      .insert([{ test_id: testId, name: name.trim(), order_index: subjects.length }])
      .select()
      .single();

    if (!error && data) {
      setSubjects([...subjects, data]);
      setActiveSubjectId(data.id);
      toast({ title: `Added ${name}` });
    }
  };

  const handleAddSection = async () => {
    if (!activeSubjectId || !testId) return;

    const name = prompt("Section name (optional):");
    const sectionType = prompt("Type: single_choice, multiple_choice, or integer") || 'single_choice';

    const { data, error } = await supabase
      .from('test_sections')
      .insert([{ 
        subject_id: activeSubjectId, 
        name: name?.trim() || null,
        section_type: sectionType,
        order_index: sections.filter(s => s.subject_id === activeSubjectId).length 
      }])
      .select()
      .single();

    if (!error && data) {
      setSections([...sections, data]);
      setActiveSectionId(data.id);
      toast({ title: "Section added" });
    }
  };

  const handleAddQuestion = async () => {
    if (!activeSectionId || !testId) return;
    
    const section = sections.find(s => s.id === activeSectionId);
    if (!section) return;

    const examType = test?.exam_type || 'jee_mains';
    const scheme = MARKING_SCHEMES[examType as keyof typeof MARKING_SCHEMES][section.section_type as keyof typeof MARKING_SCHEMES['jee_mains']];
    
    const nextQNo = questions.length + 1;
    const defaultAnswer = section.section_type === 'multiple_choice' ? [] : '';

    const { data, error } = await supabase
      .from('test_section_questions')
      .insert([{
        test_id: testId,
        section_id: activeSectionId,
        question_number: nextQNo,
        correct_answer: defaultAnswer,
        marks: scheme?.marks || 4,
        negative_marks: scheme?.negative || 0,
        order_index: nextQNo
      }])
      .select()
      .single();

    if (!error && data) {
      setQuestions([...questions, data]);
      toast({ title: `Question ${nextQNo} added` });
    }
  };

  const handleUpdateAnswer = async (questionId: string, answer: any) => {
    await supabase
      .from('test_section_questions')
      .update({ correct_answer: answer })
      .eq('id', questionId);

    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, correct_answer: answer } : q
    ));
  };

  const handleUpdateQuestionText = async (questionId: string, text: string) => {
    await supabase
      .from('test_section_questions')
      .update({ question_text: text })
      .eq('id', questionId);

    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, question_text: text } : q
    ));
  };

  const handleUpdateOptions = async (questionId: string, options: any) => {
    await supabase
      .from('test_section_questions')
      .update({ options })
      .eq('id', questionId);

    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, options } : q
    ));
  };

  const handleDeleteQuestion = async (questionId: string) => {
    await supabase.from('test_section_questions').delete().eq('id', questionId);
    setQuestions(questions.filter(q => q.id !== questionId));
    toast({ title: "Question deleted" });
  };

  const getSectionQuestions = (sectionId: string) => 
    questions.filter(q => q.section_id === sectionId).sort((a, b) => a.question_number - b.question_number);

  const getSection = (sectionId: string) => sections.find(s => s.id === sectionId);

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
        <div className="flex items-center justify-between p-3 border-b border-border bg-card/50">
          <div>
            <h1 className="text-lg font-bold">{test?.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                {test?.exam_type === 'jee_advanced' ? 'JEE Advanced' : 'JEE Mains'}
              </span>
              <span>{questions.length} questions</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/tests')}>
              Back
            </Button>
            <Button 
              variant={test?.is_published ? "destructive" : "default"}
              size="sm"
              onClick={handleTogglePublish}
            >
              {test?.is_published ? <><EyeOff className="w-4 h-4 mr-1" /> Unpublish</> : <><Eye className="w-4 h-4 mr-1" /> Publish</>}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: PDF Preview */}
          <div className="w-[65%] border-r border-border bg-secondary/10 flex flex-col">
            {pdfUrl ? (
              <>
                <div className="flex items-center justify-between p-2 border-b border-border bg-card/50">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">{currentPage} / {numPages}</span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(2, s + 0.1))}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto flex justify-center p-4">
                  <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                    <Page pageNumber={currentPage} scale={scale} renderTextLayer={false} />
                  </Document>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <Upload className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Upload test PDF</p>
                <label className="cursor-pointer">
                  <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                  <Button variant="gradient" disabled={uploadingPdf}>
                    {uploadingPdf ? "Uploading..." : "Choose PDF"}
                  </Button>
                </label>
              </div>
            )}
          </div>

          {/* Right: Answer Key Editor */}
          <div className="w-[35%] flex flex-col bg-card/30">
            {/* Subject Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-border overflow-x-auto">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => {
                    setActiveSubjectId(subject.id);
                    const firstSection = sections.find(s => s.subject_id === subject.id);
                    setActiveSectionId(firstSection?.id || null);
                  }}
                  className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSubjectId === subject.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 hover:bg-secondary'
                  }`}
                >
                  {subject.name}
                </button>
              ))}
              <button onClick={handleAddSubject} className="px-3 py-1.5 rounded text-sm bg-primary/10 text-primary hover:bg-primary/20">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Section Tabs */}
            {activeSubjectId && (
              <div className="flex items-center gap-1 p-2 border-b border-border overflow-x-auto bg-secondary/20">
                {sections.filter(s => s.subject_id === activeSubjectId).map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                      activeSectionId === section.id ? 'bg-accent text-accent-foreground' : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {section.name || section.section_type.replace('_', ' ')}
                  </button>
                ))}
                <button onClick={handleAddSection} className="px-2 py-1 rounded text-xs bg-accent/20 text-accent-foreground hover:bg-accent/30">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Questions List */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {activeSectionId && getSectionQuestions(activeSectionId).map(question => {
                  const section = getSection(question.section_id);
                  const sectionType = section?.section_type || 'single_choice';
                  
                  return (
                    <div key={question.id} className="bg-card border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">Q{question.question_number}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-green-500">+{question.marks}</span>
                          {question.negative_marks > 0 && <span className="text-red-500">-{question.negative_marks}</span>}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteQuestion(question.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Question Text (supports LaTeX: use $...$ for inline, $$...$$ for block) */}
                      <div className="mb-3">
                        <Textarea
                          placeholder="Question text (supports LaTeX: $x^2$ for inline math)"
                          value={question.question_text || ''}
                          onChange={(e) => handleUpdateQuestionText(question.id, e.target.value)}
                          className="text-sm min-h-[60px]"
                        />
                      </div>

                      {/* Options for MCQ */}
                      {(sectionType === 'single_choice' || sectionType === 'multiple_choice') && (
                        <div className="mb-3 grid grid-cols-2 gap-2">
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <Input
                              key={opt}
                              placeholder={`Option ${opt}`}
                              value={question.options?.[opt] || ''}
                              onChange={(e) => handleUpdateOptions(question.id, { ...question.options, [opt]: e.target.value })}
                              className="text-xs h-8"
                            />
                          ))}
                        </div>
                      )}

                      {/* Answer Options */}
                      {sectionType === 'single_choice' && (
                        <RadioGroup 
                          value={question.correct_answer as string} 
                          onValueChange={(val) => handleUpdateAnswer(question.id, val)}
                          className="flex gap-4"
                        >
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <div key={opt} className="flex items-center gap-1">
                              <RadioGroupItem value={opt} id={`${question.id}-${opt}`} />
                              <Label htmlFor={`${question.id}-${opt}`} className="font-medium cursor-pointer">{opt}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {sectionType === 'multiple_choice' && (
                        <div className="flex gap-4">
                          {['A', 'B', 'C', 'D'].map(opt => {
                            const answers = Array.isArray(question.correct_answer) ? question.correct_answer : [];
                            const isChecked = answers.includes(opt);
                            return (
                              <div key={opt} className="flex items-center gap-1">
                                <Checkbox 
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    const newAnswers = checked 
                                      ? [...answers, opt]
                                      : answers.filter((a: string) => a !== opt);
                                    handleUpdateAnswer(question.id, newAnswers);
                                  }}
                                  id={`${question.id}-${opt}`}
                                />
                                <Label htmlFor={`${question.id}-${opt}`} className="font-medium cursor-pointer">{opt}</Label>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {sectionType === 'integer' && (
                        <Input
                          type="text"
                          placeholder="Answer (number)"
                          value={question.correct_answer as string || ''}
                          onChange={(e) => handleUpdateAnswer(question.id, e.target.value)}
                          className="w-32 h-8 text-sm"
                        />
                      )}
                    </div>
                  );
                })}

                {activeSectionId && (
                  <Button variant="outline" className="w-full" onClick={handleAddQuestion}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                )}

                {!activeSectionId && activeSubjectId && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">Add a section first</p>
                    <Button variant="outline" size="sm" onClick={handleAddSection}>
                      <Plus className="w-4 h-4 mr-1" /> Add Section
                    </Button>
                  </div>
                )}

                {!activeSubjectId && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">Add a subject to start</p>
                    <Button variant="outline" size="sm" onClick={handleAddSubject}>
                      <Plus className="w-4 h-4 mr-1" /> Add Subject
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

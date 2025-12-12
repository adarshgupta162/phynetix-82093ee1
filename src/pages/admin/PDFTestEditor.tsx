import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Save, 
  Eye, 
  Upload, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Trash2,
  GripVertical,
  Check,
  X,
  FileText,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layout/AdminLayout";
import PDFPreviewPanel from "@/components/admin/PDFPreviewPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Subject {
  id: string;
  name: string;
  order_index: number;
  sections: Section[];
}

interface Section {
  id: string;
  name: string | null;
  section_type: string;
  order_index: number;
  questions: Question[];
}

interface Question {
  id: string;
  question_number: number;
  pdf_page: number;
  correct_answer: any;
  options: any;
  marks: number;
  negative_marks: number;
  order_index: number;
}

interface TestData {
  id: string;
  name: string;
  exam_type: string;
  duration_minutes: number;
  is_published: boolean;
  pdf_url: string | null;
}

const MARKING_SCHEMES = {
  jee_mains: {
    single_choice: { marks: 4, negative: 1 },
    multiple_choice: { marks: 4, negative: 0 },
    integer: { marks: 4, negative: 0 }
  },
  jee_advanced: {
    single_choice: { marks: 3, negative: 1 },
    multiple_choice: { marks: 4, negative: 0 },
    integer: { marks: 3, negative: 0 }
  }
};

export default function PDFTestEditor() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [test, setTest] = useState<TestData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [totalPdfPages, setTotalPdfPages] = useState(0);

  // New subject/section dialogs
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showAddSection, setShowAddSection] = useState<string | null>(null);
  const [newSectionData, setNewSectionData] = useState({ name: "", type: "single_choice" });

  useEffect(() => {
    if (testId) loadTestData();
  }, [testId]);

  const loadTestData = async () => {
    try {
      // Fetch test
      const { data: testData, error: testError } = await supabase
        .from("tests")
        .select("*")
        .eq("id", testId)
        .single();

      if (testError) throw testError;
      setTest(testData);

      // Get PDF URL
      if (testData.pdf_url) {
        const { data: urlData } = await supabase.storage
          .from("test-pdfs")
          .createSignedUrl(testData.pdf_url, 3600 * 3);
        if (urlData?.signedUrl) setPdfUrl(urlData.signedUrl);
      }

      // Fetch subjects with sections and questions
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("test_subjects")
        .select("*")
        .eq("test_id", testId)
        .order("order_index");

      if (subjectsError) throw subjectsError;

      // Fetch sections for each subject
      const subjectsWithData = await Promise.all(
        (subjectsData || []).map(async (subject) => {
          const { data: sections } = await supabase
            .from("test_sections")
            .select("*")
            .eq("subject_id", subject.id)
            .order("order_index");

          const sectionsWithQuestions = await Promise.all(
            (sections || []).map(async (section) => {
              const { data: questions } = await supabase
                .from("test_section_questions")
                .select("*")
                .eq("section_id", section.id)
                .order("order_index");

              return {
                ...section,
                questions: (questions || []).map(q => ({
                  ...q,
                  correct_answer: q.correct_answer,
                  options: q.options
                }))
              };
            })
          );

          return { ...subject, sections: sectionsWithQuestions };
        })
      );

      setSubjects(subjectsWithData);

      // Auto-expand first subject
      if (subjectsWithData.length > 0) {
        setExpandedSubjects(new Set([subjectsWithData[0].id]));
        if (subjectsWithData[0].sections?.length > 0) {
          setExpandedSections(new Set([subjectsWithData[0].sections[0].id]));
        }
      }
    } catch (err: any) {
      toast({ title: "Error loading test", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async () => {
    if (!newSubjectName.trim() || !testId) return;

    try {
      const { data, error } = await supabase
        .from("test_subjects")
        .insert({
          test_id: testId,
          name: newSubjectName,
          order_index: subjects.length
        })
        .select()
        .single();

      if (error) throw error;

      setSubjects([...subjects, { ...data, sections: [] }]);
      setExpandedSubjects(new Set([...expandedSubjects, data.id]));
      setNewSubjectName("");
      setShowAddSubject(false);
      toast({ title: "Subject added" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const addSection = async (subjectId: string) => {
    if (!testId) return;

    try {
      const subject = subjects.find(s => s.id === subjectId);
      const { data, error } = await supabase
        .from("test_sections")
        .insert({
          subject_id: subjectId,
          name: newSectionData.name || null,
          section_type: newSectionData.type,
          order_index: subject?.sections.length || 0
        })
        .select()
        .single();

      if (error) throw error;

      setSubjects(subjects.map(s => 
        s.id === subjectId 
          ? { ...s, sections: [...s.sections, { ...data, questions: [] }] }
          : s
      ));
      setExpandedSections(new Set([...expandedSections, data.id]));
      setNewSectionData({ name: "", type: "single_choice" });
      setShowAddSection(null);
      toast({ title: "Section added" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const addQuestion = async (sectionId: string) => {
    if (!testId) return;

    const section = subjects.flatMap(s => s.sections).find(sec => sec.id === sectionId);
    if (!section) return;

    // Calculate global question number
    let globalQNum = 1;
    subjects.forEach(sub => {
      sub.sections.forEach(sec => {
        globalQNum += sec.questions.length;
      });
    });

    const scheme = MARKING_SCHEMES[test?.exam_type as keyof typeof MARKING_SCHEMES || "jee_mains"];
    const typeScheme = scheme[section.section_type as keyof typeof scheme] || scheme.single_choice;

    try {
      const { data, error } = await supabase
        .from("test_section_questions")
        .insert({
          test_id: testId,
          section_id: sectionId,
          question_number: globalQNum,
          pdf_page: currentPdfPage,
          correct_answer: section.section_type === "multiple_choice" ? [] : "",
          options: section.section_type !== "integer" ? { A: "", B: "", C: "", D: "" } : null,
          marks: typeScheme.marks,
          negative_marks: typeScheme.negative,
          order_index: section.questions.length
        })
        .select()
        .single();

      if (error) throw error;

      setSubjects(subjects.map(sub => ({
        ...sub,
        sections: sub.sections.map(sec => 
          sec.id === sectionId 
            ? { ...sec, questions: [...sec.questions, { ...data, correct_answer: data.correct_answer, options: data.options }] }
            : sec
        )
      })));
      setEditingQuestion(data.id);
      toast({ title: "Question added" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const updateQuestion = async (questionId: string, updates: Partial<Question>) => {
    try {
      const { error } = await supabase
        .from("test_section_questions")
        .update(updates)
        .eq("id", questionId);

      if (error) throw error;

      setSubjects(subjects.map(sub => ({
        ...sub,
        sections: sub.sections.map(sec => ({
          ...sec,
          questions: sec.questions.map(q => 
            q.id === questionId ? { ...q, ...updates } : q
          )
        }))
      })));
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from("test_section_questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      setSubjects(subjects.map(sub => ({
        ...sub,
        sections: sub.sections.map(sec => ({
          ...sec,
          questions: sec.questions.filter(q => q.id !== questionId)
        }))
      })));
      toast({ title: "Question deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section and all its questions?")) return;

    try {
      const { error } = await supabase
        .from("test_sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;

      setSubjects(subjects.map(sub => ({
        ...sub,
        sections: sub.sections.filter(sec => sec.id !== sectionId)
      })));
      toast({ title: "Section deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const deleteSubject = async (subjectId: string) => {
    if (!confirm("Delete this subject and all its sections/questions?")) return;

    try {
      const { error } = await supabase
        .from("test_subjects")
        .delete()
        .eq("id", subjectId);

      if (error) throw error;

      setSubjects(subjects.filter(s => s.id !== subjectId));
      toast({ title: "Subject deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const togglePublish = async () => {
    if (!test) return;

    // Validation
    const allQuestions = subjects.flatMap(s => s.sections.flatMap(sec => sec.questions));
    const invalidQuestions = allQuestions.filter(q => {
      const hasCorrectAnswer = q.correct_answer && 
        (Array.isArray(q.correct_answer) ? q.correct_answer.length > 0 : q.correct_answer !== "");
      return !hasCorrectAnswer || !q.pdf_page;
    });

    if (!test.is_published && invalidQuestions.length > 0) {
      toast({ 
        title: "Cannot publish", 
        description: `${invalidQuestions.length} questions missing correct answer or PDF page mapping`, 
        variant: "destructive" 
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("tests")
        .update({ is_published: !test.is_published })
        .eq("id", test.id);

      if (error) throw error;

      setTest({ ...test, is_published: !test.is_published });
      toast({ title: test.is_published ? "Test unpublished" : "Test published!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const totalQuestions = subjects.reduce((acc, sub) => 
    acc + sub.sections.reduce((a, sec) => a + sec.questions.length, 0), 0
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/pdf-tests">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{test?.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {test?.exam_type === "jee_advanced" ? "JEE Advanced" : "JEE Mains"} • {totalQuestions} questions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm rounded-full ${
                test?.is_published 
                  ? "bg-[hsl(142,76%,36%)]/20 text-[hsl(142,76%,36%)]" 
                  : "bg-[hsl(45,93%,47%)]/20 text-[hsl(45,93%,47%)]"
              }`}>
                {test?.is_published ? "Published" : "Draft"}
              </span>
              <Button variant="outline" onClick={togglePublish}>
                {test?.is_published ? "Unpublish" : "Publish Test"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* PDF Preview (65%) */}
          <div className="w-[65%] h-full border-r border-border">
            <PDFPreviewPanel 
              pdfUrl={pdfUrl}
              currentPage={currentPdfPage}
              onPageChange={setCurrentPdfPage}
              onTotalPagesChange={setTotalPdfPages}
            />
          </div>

          {/* Editor Panel (35%) */}
          <div className="w-[35%] h-full flex flex-col bg-card/30">
            {/* Subjects & Sections */}
            <div className="flex-1 overflow-auto p-4">
              {/* Add Subject Button */}
              {showAddSubject ? (
                <div className="mb-4 p-4 rounded-lg bg-secondary/50">
                  <Label className="mb-2 block">Subject Name</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g., Physics"
                      onKeyDown={(e) => e.key === "Enter" && addSubject()}
                    />
                    <Button size="icon" onClick={addSubject}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setShowAddSubject(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full mb-4"
                  onClick={() => setShowAddSubject(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              )}

              {/* Subjects List */}
              {subjects.map((subject) => (
                <div key={subject.id} className="mb-4">
                  {/* Subject Header */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 cursor-pointer group"
                    onClick={() => {
                      const next = new Set(expandedSubjects);
                      if (next.has(subject.id)) next.delete(subject.id);
                      else next.add(subject.id);
                      setExpandedSubjects(next);
                    }}
                  >
                    {expandedSubjects.has(subject.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="font-medium flex-1">{subject.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {subject.sections.reduce((a, s) => a + s.questions.length, 0)} Q
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id); }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Subject Content */}
                  {expandedSubjects.has(subject.id) && (
                    <div className="ml-4 mt-2 space-y-2">
                      {/* Sections */}
                      {subject.sections.map((section) => (
                        <div key={section.id} className="border border-border rounded-lg overflow-hidden">
                          {/* Section Header */}
                          <div 
                            className="flex items-center gap-2 p-3 bg-background/50 cursor-pointer group"
                            onClick={() => {
                              const next = new Set(expandedSections);
                              if (next.has(section.id)) next.delete(section.id);
                              else next.add(section.id);
                              setExpandedSections(next);
                            }}
                          >
                            {expandedSections.has(section.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span className="flex-1">
                              {section.name || section.section_type.replace("_", " ")}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                              {section.section_type.replace("_", " ")}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {section.questions.length} Q
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>

                          {/* Section Content */}
                          {expandedSections.has(section.id) && (
                            <div className="p-3 space-y-2">
                              {/* Questions */}
                              {section.questions.map((question) => (
                                <QuestionCard
                                  key={question.id}
                                  question={question}
                                  sectionType={section.section_type}
                                  isEditing={editingQuestion === question.id}
                                  currentPdfPage={currentPdfPage}
                                  onEdit={() => setEditingQuestion(question.id)}
                                  onSave={(updates) => {
                                    updateQuestion(question.id, updates);
                                    setEditingQuestion(null);
                                  }}
                                  onCancel={() => setEditingQuestion(null)}
                                  onDelete={() => deleteQuestion(question.id)}
                                  onMapPage={() => updateQuestion(question.id, { pdf_page: currentPdfPage })}
                                />
                              ))}

                              {/* Add Question */}
                              <Button
                                variant="ghost"
                                className="w-full border border-dashed border-border"
                                onClick={() => addQuestion(section.id)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Question
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Section */}
                      {showAddSection === subject.id ? (
                        <div className="p-3 rounded-lg bg-secondary/30 space-y-3">
                          <Input
                            value={newSectionData.name}
                            onChange={(e) => setNewSectionData({ ...newSectionData, name: e.target.value })}
                            placeholder="Section name (optional)"
                          />
                          <Select
                            value={newSectionData.type}
                            onValueChange={(v) => setNewSectionData({ ...newSectionData, type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single_choice">Single Choice</SelectItem>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="integer">Integer / Numeric</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => addSection(subject.id)}>
                              <Check className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowAddSection(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddSection(subject.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Section
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {subjects.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start by adding a subject</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Question Card Component
interface QuestionCardProps {
  question: Question;
  sectionType: string;
  isEditing: boolean;
  currentPdfPage: number;
  onEdit: () => void;
  onSave: (updates: Partial<Question>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onMapPage: () => void;
}

function QuestionCard({ 
  question, 
  sectionType, 
  isEditing, 
  currentPdfPage,
  onEdit, 
  onSave, 
  onCancel, 
  onDelete,
  onMapPage 
}: QuestionCardProps) {
  const [localAnswer, setLocalAnswer] = useState(question.correct_answer);
  const [localMarks, setLocalMarks] = useState(question.marks);
  const [localNegative, setLocalNegative] = useState(question.negative_marks);

  useEffect(() => {
    setLocalAnswer(question.correct_answer);
    setLocalMarks(question.marks);
    setLocalNegative(question.negative_marks);
  }, [question]);

  if (!isEditing) {
    // Collapsed View
    const displayAnswer = sectionType === "multiple_choice" && Array.isArray(question.correct_answer)
      ? question.correct_answer.join(", ")
      : question.correct_answer;

    return (
      <div 
        className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 cursor-pointer group"
        onClick={onEdit}
      >
        <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
          {question.question_number}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">Page {question.pdf_page}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-sm font-medium text-primary">
              {displayAnswer || "No answer"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            +{question.marks} / -{question.negative_marks}
          </p>
        </div>
        {question.correct_answer && (
          <Check className="w-4 h-4 text-[hsl(142,76%,36%)]" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    );
  }

  // Editing View
  return (
    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Question {question.question_number}</span>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSave({ 
            correct_answer: localAnswer, 
            marks: localMarks, 
            negative_marks: localNegative 
          })}>
            <Check className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {/* PDF Page Mapping */}
      <div className="flex items-center gap-3">
        <Label>PDF Page:</Label>
        <span className="font-medium">{question.pdf_page}</span>
        <Button size="sm" variant="outline" onClick={onMapPage}>
          Map to Current Page ({currentPdfPage})
        </Button>
      </div>

      {/* Answer Selection */}
      {sectionType === "single_choice" && (
        <div className="space-y-2">
          <Label>Correct Answer:</Label>
          <div className="flex gap-2">
            {["A", "B", "C", "D"].map((opt) => (
              <button
                key={opt}
                onClick={() => setLocalAnswer(opt)}
                className={`w-12 h-12 rounded-lg font-bold transition-colors ${
                  localAnswer === opt
                    ? "bg-[hsl(142,76%,36%)] text-white"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {sectionType === "multiple_choice" && (
        <div className="space-y-2">
          <Label>Correct Answers (select all that apply):</Label>
          <div className="flex gap-2">
            {["A", "B", "C", "D"].map((opt) => {
              const selected = Array.isArray(localAnswer) && localAnswer.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    const current = Array.isArray(localAnswer) ? localAnswer : [];
                    if (selected) {
                      setLocalAnswer(current.filter(a => a !== opt));
                    } else {
                      setLocalAnswer([...current, opt]);
                    }
                  }}
                  className={`w-12 h-12 rounded-lg font-bold transition-colors ${
                    selected
                      ? "bg-[hsl(142,76%,36%)] text-white"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sectionType === "integer" && (
        <div className="space-y-2">
          <Label>Correct Answer:</Label>
          <Input
            value={localAnswer || ""}
            onChange={(e) => setLocalAnswer(e.target.value)}
            placeholder="Enter numeric value"
            className="font-mono"
          />
        </div>
      )}

      {/* Marks */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Marks</Label>
          <Input
            type="number"
            value={localMarks}
            onChange={(e) => setLocalMarks(parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label>Negative Marks</Label>
          <Input
            type="number"
            value={localNegative}
            onChange={(e) => setLocalNegative(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}

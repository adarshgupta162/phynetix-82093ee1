import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ClipboardList,
  Eye,
  EyeOff,
  Clock,
  FileQuestion,
  X,
  Upload,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Test {
  id: string;
  name: string;
  description: string | null;
  test_type: string;
  duration_minutes: number;
  is_published: boolean | null;
  created_at: string;
  exam_type: string;
  pdf_url: string | null;
}

interface Question {
  id: string;
  question_text: string;
  chapter_id: string;
  difficulty: string;
  question_number: number | null;
}

interface Chapter {
  id: string;
  name: string;
}

const TESTS_PER_PAGE = 15;

export default function AdminTests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [testQuestions, setTestQuestions] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    test_type: "chapter",
    duration_minutes: 60,
    is_published: false,
    exam_type: "jee_mains",
    pdf_url: ""
  });

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [testsRes, questionsRes, chaptersRes, testQuestionsRes] = await Promise.all([
      supabase.from('tests').select('*').order('created_at', { ascending: false }),
      supabase.from('questions').select('id, question_text, chapter_id, difficulty, question_number'),
      supabase.from('chapters').select('id, name'),
      supabase.from('test_questions').select('test_id, question_id')
    ]);

    if (!testsRes.error) setTests(testsRes.data || []);
    if (!questionsRes.error) setQuestions(questionsRes.data || []);
    if (!chaptersRes.error) setChapters(chaptersRes.data || []);
    
    if (!testQuestionsRes.error && testQuestionsRes.data) {
      const mapping: Record<string, string[]> = {};
      testQuestionsRes.data.forEach(tq => {
        if (!mapping[tq.test_id]) mapping[tq.test_id] = [];
        mapping[tq.test_id].push(tq.question_id);
      });
      setTestQuestions(mapping);
    }
    
    setIsLoading(false);
  };

  const handlePdfUpload = async (): Promise<string | null> => {
    if (!pdfFile) return null;
    
    setUploadingPdf(true);
    try {
      const fileName = `${Date.now()}-${pdfFile.name}`;
      const { data, error } = await supabase.storage
        .from('test-pdfs')
        .upload(fileName, pdfFile);
      
      if (error) throw error;
      return data.path;
    } catch (err: any) {
      toast({ title: "Error uploading PDF", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let pdfPath = formData.pdf_url;
    
    // Upload PDF if new file selected
    if (pdfFile) {
      const uploadedPath = await handlePdfUpload();
      if (uploadedPath) {
        pdfPath = uploadedPath;
      }
    }
    
    const testData = { ...formData, pdf_url: pdfPath || null };
    
    if (editingTest) {
      const { error } = await supabase
        .from('tests')
        .update(testData)
        .eq('id', editingTest.id);
      
      if (error) {
        toast({ title: "Error updating test", variant: "destructive" });
        return;
      }

      // Update test questions
      await supabase.from('test_questions').delete().eq('test_id', editingTest.id);
      if (selectedQuestions.length > 0) {
        await supabase.from('test_questions').insert(
          selectedQuestions.map((qId, idx) => ({
            test_id: editingTest.id,
            question_id: qId,
            order_index: idx
          }))
        );
      }

      toast({ title: "Test updated successfully" });
    } else {
      const { data, error } = await supabase
        .from('tests')
        .insert([{ ...testData, created_by: user?.id }])
        .select()
        .single();
      
      if (error) {
        toast({ title: "Error creating test", variant: "destructive" });
        return;
      }

      if (selectedQuestions.length > 0) {
        await supabase.from('test_questions').insert(
          selectedQuestions.map((qId, idx) => ({
            test_id: data.id,
            question_id: qId,
            order_index: idx
          }))
        );
      }

      toast({ title: "Test created successfully" });
    }
    
    fetchData();
    resetForm();
  };

  const handleTogglePublish = async (test: Test) => {
    const { error } = await supabase
      .from('tests')
      .update({ is_published: !test.is_published })
      .eq('id', test.id);
    
    if (error) {
      toast({ title: "Error updating test", variant: "destructive" });
    } else {
      toast({ title: test.is_published ? "Test unpublished" : "Test published" });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tests').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting test", variant: "destructive" });
    } else {
      toast({ title: "Test deleted successfully" });
      fetchData();
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingTest(null);
    setSelectedQuestions([]);
    setPdfFile(null);
    setFormData({
      name: "",
      description: "",
      test_type: "chapter",
      duration_minutes: 60,
      is_published: false,
      exam_type: "jee_mains",
      pdf_url: ""
    });
  };

  const getChapterName = (chapterId: string) => {
    return chapters.find(ch => ch.id === chapterId)?.name || "Unknown";
  };

  // Filter and sort tests
  const filteredTests = tests
    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Pagination
  const totalPages = Math.ceil(filteredTests.length / TESTS_PER_PAGE);
  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * TESTS_PER_PAGE,
    currentPage * TESTS_PER_PAGE
  );

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              Manage <span className="gradient-text">Tests</span>
            </h1>
            <p className="text-muted-foreground">
              Create and manage tests with PDF support
            </p>
          </div>
          <Button variant="gradient" onClick={() => window.location.href = '/admin/test-creator'}>
            <Plus className="w-5 h-5" />
            Create Test
          </Button>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="h-11 px-4 rounded-lg border border-border bg-secondary/50 text-foreground"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Tests Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : paginatedTests.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tests yet</h3>
            <p className="text-muted-foreground mb-4">Create your first test</p>
            <Button variant="gradient" onClick={() => setShowModal(true)}>
              <Plus className="w-5 h-5" />
              Create Test
            </Button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium uppercase">
                        {test.test_type}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium">
                        {test.exam_type === 'jee_advanced' ? 'JEE Adv' : 'JEE Mains'}
                      </span>
                      {test.pdf_url && (
                        <span className="px-2 py-1 rounded-md bg-[hsl(45,93%,47%)]/10 text-[hsl(45,93%,47%)] text-xs font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          PDF
                        </span>
                      )}
                      {test.is_published ? (
                        <span className="px-2 py-1 rounded-md bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,36%)] text-xs font-medium">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md bg-secondary text-muted-foreground text-xs">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold font-display mb-2">{test.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {test.description || "No description"}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {test.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <FileQuestion className="w-4 h-4" />
                      {testQuestions[test.id]?.length || 0} questions
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(test)}
                    >
                      {test.is_published ? (
                        <><EyeOff className="w-4 h-4" /> Unpublish</>
                      ) : (
                        <><Eye className="w-4 h-4" /> Publish</>
                      )}
                    </Button>
                    <button
                      onClick={() => {
                        setEditingTest(test);
                        setFormData({
                          name: test.name,
                          description: test.description || "",
                          test_type: test.test_type,
                          duration_minutes: test.duration_minutes,
                          is_published: test.is_published || false,
                          exam_type: test.exam_type || "jee_mains",
                          pdf_url: test.pdf_url || ""
                        });
                        setSelectedQuestions(testQuestions[test.id] || []);
                        setShowModal(true);
                      }}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Test Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-6 w-full max-w-3xl my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-display">
                  {editingTest ? "Edit Test" : "Create Test"}
                </h2>
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Test Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., JEE Main Mock Test 1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Exam Type</label>
                    <select
                      value={formData.exam_type}
                      onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-secondary/50 text-foreground"
                    >
                      <option value="jee_mains">JEE Mains</option>
                      <option value="jee_advanced">JEE Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Test Type</label>
                    <select
                      value={formData.test_type}
                      onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-secondary/50 text-foreground"
                    >
                      <option value="chapter">Chapter Test</option>
                      <option value="full-length">Full Length</option>
                      <option value="topic">Topic Test</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the test"
                  />
                </div>

                {/* PDF Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Test PDF (Optional)</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {pdfFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{pdfFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPdfFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : formData.pdf_url ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-8 h-8 text-[hsl(142,76%,36%)]" />
                        <p className="text-muted-foreground">PDF already uploaded</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, pdf_url: "" })}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          Click to upload PDF or drag and drop
                        </p>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setPdfFile(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select Questions ({selectedQuestions.length} selected)
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2 space-y-2">
                    {questions.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4 text-center">
                        No questions available. Add questions first.
                      </p>
                    ) : (
                      questions.map((q) => (
                        <label
                          key={q.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(q.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedQuestions([...selectedQuestions, q.id]);
                              } else {
                                setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-sm line-clamp-1">{q.question_text}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {getChapterName(q.chapter_id)}
                              </span>
                              <span className={`text-xs px-1 rounded ${
                                q.difficulty === 'easy' ? 'text-[hsl(142,76%,36%)]' :
                                q.difficulty === 'hard' ? 'text-destructive' : 'text-[hsl(45,93%,47%)]'
                              }`}>
                                {q.difficulty}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="glass" className="flex-1" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="gradient" 
                    className="flex-1"
                    disabled={uploadingPdf}
                  >
                    {uploadingPdf ? "Uploading..." : editingTest ? "Update Test" : "Create Test"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

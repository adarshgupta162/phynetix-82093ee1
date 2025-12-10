import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  FileQuestion,
  Filter,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  chapter_id: string;
  question_text: string;
  question_type: string;
  options: unknown;
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
  marks: number | null;
  negative_marks: number | null;
}

interface Chapter {
  id: string;
  name: string;
  course_id: string;
}

interface Course {
  id: string;
  name: string;
}

const difficultyColors: Record<string, string> = {
  easy: "text-[hsl(142,76%,36%)] bg-[hsl(142,76%,36%)]/10",
  medium: "text-[hsl(45,93%,47%)] bg-[hsl(45,93%,47%)]/10",
  hard: "text-destructive bg-destructive/10",
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  const [formData, setFormData] = useState({
    chapter_id: "",
    question_text: "",
    question_type: "mcq",
    options: ["", "", "", ""],
    correct_answer: "0",
    explanation: "",
    difficulty: "medium",
    marks: 4,
    negative_marks: 1
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [questionsRes, chaptersRes, coursesRes] = await Promise.all([
      supabase.from('questions').select('*').order('created_at', { ascending: false }),
      supabase.from('chapters').select('*'),
      supabase.from('courses').select('*')
    ]);

    if (!questionsRes.error) setQuestions(questionsRes.data || []);
    if (!chaptersRes.error) setChapters(chaptersRes.data || []);
    if (!coursesRes.error) setCourses(coursesRes.data || []);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const questionData = {
      ...formData,
      options: formData.question_type === "mcq" ? formData.options.filter(o => o.trim()) : null
    };
    
    if (editingQuestion) {
      const { error } = await supabase
        .from('questions')
        .update(questionData)
        .eq('id', editingQuestion.id);
      
      if (error) {
        toast({ title: "Error updating question", variant: "destructive" });
      } else {
        toast({ title: "Question updated successfully" });
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('questions')
        .insert([questionData]);
      
      if (error) {
        toast({ title: "Error creating question", variant: "destructive" });
      } else {
        toast({ title: "Question created successfully" });
        fetchData();
      }
    }
    
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting question", variant: "destructive" });
    } else {
      toast({ title: "Question deleted successfully" });
      fetchData();
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingQuestion(null);
    setFormData({
      chapter_id: "",
      question_text: "",
      question_type: "mcq",
      options: ["", "", "", ""],
      correct_answer: "0",
      explanation: "",
      difficulty: "medium",
      marks: 4,
      negative_marks: 1
    });
  };

  const getChapterName = (chapterId: string) => {
    return chapters.find(ch => ch.id === chapterId)?.name || "Unknown";
  };

  const getCourseName = (chapterId: string) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) return "Unknown";
    return courses.find(c => c.id === chapter.course_id)?.name || "Unknown";
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChapter = !selectedChapter || q.chapter_id === selectedChapter;
    const matchesDifficulty = !selectedDifficulty || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesChapter && matchesDifficulty;
  });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              Question <span className="gradient-text">Bank</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your questions across all subjects
            </p>
          </div>
          <Button variant="gradient" onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5" />
            Add Question
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="h-11 px-4 rounded-lg border border-border bg-secondary/50 text-foreground"
          >
            <option value="">All Chapters</option>
            {chapters.map(ch => (
              <option key={ch.id} value={ch.id}>{ch.name}</option>
            ))}
          </select>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="h-11 px-4 rounded-lg border border-border bg-secondary/50 text-foreground"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileQuestion className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No questions yet</h3>
            <p className="text-muted-foreground mb-4">Add your first question to the bank</p>
            <Button variant="gradient" onClick={() => setShowModal(true)}>
              <Plus className="w-5 h-5" />
              Add Question
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                        {getCourseName(question.chapter_id)}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-secondary text-xs">
                        {getChapterName(question.chapter_id)}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${difficultyColors[question.difficulty]}`}>
                        {question.difficulty}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-secondary text-xs uppercase">
                        {question.question_type}
                      </span>
                    </div>
                    <p className="text-foreground line-clamp-2">{question.question_text}</p>
                    {question.options && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {(question.options as string[]).map((opt, i) => (
                          <div
                            key={i}
                            className={`text-sm p-2 rounded-lg ${
                              question.correct_answer === String(i)
                                ? "bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,36%)] border border-[hsl(142,76%,36%)]/30"
                                : "bg-secondary/50"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingQuestion(question);
                        setFormData({
                          chapter_id: question.chapter_id,
                          question_text: question.question_text,
                          question_type: question.question_type,
                          options: question.options as string[] || ["", "", "", ""],
                          correct_answer: question.correct_answer,
                          explanation: question.explanation || "",
                          difficulty: question.difficulty,
                          marks: question.marks || 4,
                          negative_marks: question.negative_marks || 1
                        });
                        setShowModal(true);
                      }}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Question Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-6 w-full max-w-2xl my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-display">
                  {editingQuestion ? "Edit Question" : "Add Question"}
                </h2>
                <button onClick={resetForm} className="p-2 rounded-lg hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Chapter</label>
                    <select
                      value={formData.chapter_id}
                      onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-secondary/50 text-foreground"
                      required
                    >
                      <option value="">Select Chapter</option>
                      {chapters.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Question Type</label>
                    <select
                      value={formData.question_type}
                      onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-secondary/50 text-foreground"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="integer">Integer</option>
                      <option value="assertion">Assertion-Reason</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Question Text</label>
                  <textarea
                    value={formData.question_text}
                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                    placeholder="Enter the question..."
                    className="w-full min-h-[100px] px-4 py-3 rounded-lg border border-border bg-secondary/50 text-foreground resize-none"
                    required
                  />
                </div>

                {formData.question_type === "mcq" && (
                  <div>
                    <label className="text-sm font-medium">Options</label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {formData.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correct"
                            checked={formData.correct_answer === String(i)}
                            onChange={() => setFormData({ ...formData, correct_answer: String(i) })}
                            className="w-4 h-4"
                          />
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[i] = e.target.value;
                              setFormData({ ...formData, options: newOptions });
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Select the correct answer</p>
                  </div>
                )}

                {formData.question_type !== "mcq" && (
                  <div>
                    <label className="text-sm font-medium">Correct Answer</label>
                    <Input
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      placeholder="Enter the correct answer"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-secondary/50 text-foreground"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Marks</label>
                    <Input
                      type="number"
                      value={formData.marks}
                      onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Negative Marks</label>
                    <Input
                      type="number"
                      value={formData.negative_marks}
                      onChange={(e) => setFormData({ ...formData, negative_marks: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Explanation (optional)</label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    placeholder="Explain the solution..."
                    className="w-full min-h-[80px] px-4 py-3 rounded-lg border border-border bg-secondary/50 text-foreground resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="glass" className="flex-1" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" className="flex-1">
                    {editingQuestion ? "Update" : "Create"}
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

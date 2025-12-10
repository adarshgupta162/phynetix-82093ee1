import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  BookOpen,
  ChevronRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
}

interface Chapter {
  id: string;
  course_id: string;
  name: string;
  description: string | null;
  order_index: number | null;
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "BookOpen",
    color: "#8b5cf6"
  });

  const [chapterFormData, setChapterFormData] = useState({
    name: "",
    description: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
    fetchChapters();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: "Error fetching courses", variant: "destructive" });
    } else {
      setCourses(data || []);
    }
    setIsLoading(false);
  };

  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (!error) {
      setChapters(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCourse) {
      const { error } = await supabase
        .from('courses')
        .update(formData)
        .eq('id', editingCourse.id);
      
      if (error) {
        toast({ title: "Error updating course", variant: "destructive" });
      } else {
        toast({ title: "Course updated successfully" });
        fetchCourses();
      }
    } else {
      const { error } = await supabase
        .from('courses')
        .insert([formData]);
      
      if (error) {
        toast({ title: "Error creating course", variant: "destructive" });
      } else {
        toast({ title: "Course created successfully" });
        fetchCourses();
      }
    }
    
    setShowModal(false);
    setEditingCourse(null);
    setFormData({ name: "", description: "", icon: "BookOpen", color: "#8b5cf6" });
  };

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    
    if (editingChapter) {
      const { error } = await supabase
        .from('chapters')
        .update(chapterFormData)
        .eq('id', editingChapter.id);
      
      if (error) {
        toast({ title: "Error updating chapter", variant: "destructive" });
      } else {
        toast({ title: "Chapter updated successfully" });
        fetchChapters();
      }
    } else {
      const { error } = await supabase
        .from('chapters')
        .insert([{ ...chapterFormData, course_id: selectedCourse.id }]);
      
      if (error) {
        toast({ title: "Error creating chapter", variant: "destructive" });
      } else {
        toast({ title: "Chapter created successfully" });
        fetchChapters();
      }
    }
    
    setShowChapterModal(false);
    setEditingChapter(null);
    setChapterFormData({ name: "", description: "" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting course", variant: "destructive" });
    } else {
      toast({ title: "Course deleted successfully" });
      fetchCourses();
    }
  };

  const handleDeleteChapter = async (id: string) => {
    const { error } = await supabase.from('chapters').delete().eq('id', id);
    if (error) {
      toast({ title: "Error deleting chapter", variant: "destructive" });
    } else {
      toast({ title: "Chapter deleted successfully" });
      fetchChapters();
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCourseChapters = (courseId: string) => {
    return chapters.filter(ch => ch.course_id === courseId);
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              Manage <span className="gradient-text">Courses</span>
            </h1>
            <p className="text-muted-foreground">
              Add, edit, and organize your courses and chapters
            </p>
          </div>
          <Button variant="gradient" onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5" />
            Add Course
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">Create your first course to get started</p>
            <Button variant="gradient" onClick={() => setShowModal(true)}>
              <Plus className="w-5 h-5" />
              Add Course
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${course.color}20` }}
                  >
                    <BookOpen className="w-6 h-6" style={{ color: course.color || '#8b5cf6' }} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCourse(course);
                        setFormData({
                          name: course.name,
                          description: course.description || "",
                          icon: course.icon || "BookOpen",
                          color: course.color || "#8b5cf6"
                        });
                        setShowModal(true);
                      }}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold font-display mb-2">{course.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.description || "No description"}
                </p>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      {getCourseChapters(course.id).length} chapters
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowChapterModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Chapter
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {getCourseChapters(course.id).map((chapter) => (
                      <div
                        key={chapter.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                      >
                        <span className="text-sm flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          {chapter.name}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setEditingChapter(chapter);
                              setChapterFormData({
                                name: chapter.name,
                                description: chapter.description || ""
                              });
                              setShowChapterModal(true);
                            }}
                            className="p-1 rounded hover:bg-secondary"
                          >
                            <Edit2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteChapter(chapter.id)}
                            className="p-1 rounded hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Course Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-display">
                  {editingCourse ? "Edit Course" : "Add Course"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingCourse(null);
                    setFormData({ name: "", description: "", icon: "BookOpen", color: "#8b5cf6" });
                  }}
                  className="p-2 rounded-lg hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Course Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Physics"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex gap-2 mt-2">
                    {["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-lg transition-transform ${formData.color === color ? "scale-110 ring-2 ring-white" : ""}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="glass"
                    className="flex-1"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCourse(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" className="flex-1">
                    {editingCourse ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Chapter Modal */}
        {showChapterModal && selectedCourse && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-display">
                  {editingChapter ? "Edit Chapter" : "Add Chapter"}
                </h2>
                <button
                  onClick={() => {
                    setShowChapterModal(false);
                    setEditingChapter(null);
                    setChapterFormData({ name: "", description: "" });
                  }}
                  className="p-2 rounded-lg hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Adding to: <span className="text-foreground font-medium">{selectedCourse.name}</span>
              </p>

              <form onSubmit={handleChapterSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Chapter Name</label>
                  <Input
                    value={chapterFormData.name}
                    onChange={(e) => setChapterFormData({ ...chapterFormData, name: e.target.value })}
                    placeholder="e.g., Kinematics"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={chapterFormData.description}
                    onChange={(e) => setChapterFormData({ ...chapterFormData, description: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="glass"
                    className="flex-1"
                    onClick={() => {
                      setShowChapterModal(false);
                      setEditingChapter(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" className="flex-1">
                    {editingChapter ? "Update" : "Create"}
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

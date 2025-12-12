import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Clock, Hash, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function TestCreator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    exam_type: "jee_mains",
    duration_minutes: 180,
    total_questions: 90
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Please enter a test title", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('tests')
        .insert([{
          name: formData.name,
          exam_type: formData.exam_type,
          duration_minutes: formData.duration_minutes,
          test_type: 'full',
          is_published: false,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Test created successfully!" });
      navigate(`/admin/test-editor/${data.id}`);
    } catch (err: any) {
      toast({ title: "Error creating test", description: err.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold font-display mb-2">
            Create New <span className="gradient-text">Test</span>
          </h1>
          <p className="text-muted-foreground">
            Set up your test and start adding questions
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleCreate}
          className="glass-card p-8 space-y-6"
        >
          {/* Test Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Test Title
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., JEE Mains Mock Test 2024"
              className="h-12 text-lg"
              required
            />
          </div>

          {/* Exam Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              Exam Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, exam_type: 'jee_mains' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.exam_type === 'jee_mains'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-semibold">JEE Mains</div>
                <div className="text-xs text-muted-foreground mt-1">
                  +4/-1 Single • +4/0 Multi • +4/0 Integer
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, exam_type: 'jee_advanced' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.exam_type === 'jee_advanced'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-semibold">JEE Advanced</div>
                <div className="text-xs text-muted-foreground mt-1">
                  +3/-1 Single • +4 Partial • +3/0 Integer
                </div>
              </button>
            </div>
          </div>

          {/* Duration & Questions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Clock className="w-4 h-4 text-primary" />
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 180 })}
                min={30}
                max={360}
                className="h-12"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Hash className="w-4 h-4 text-primary" />
                Total Questions (target)
              </label>
              <Input
                type="number"
                value={formData.total_questions}
                onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) || 90 })}
                min={1}
                max={300}
                className="h-12"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="gradient"
            className="w-full h-12 text-lg"
            disabled={isCreating}
          >
            {isCreating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground" />
            ) : (
              <>
                Create Test & Open Editor
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.form>
      </div>
    </AdminLayout>
  );
}

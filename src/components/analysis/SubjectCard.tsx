import { motion } from "framer-motion";
import { Atom, FlaskConical, Calculator, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubjectCardProps {
  name: string;
  marksObtained: number;
  negativeMarks: number;
  unattempted: number;
  totalQuestions: number;
  timeSpent: string;
  color: string;
  onReviewMistakes?: () => void;
  delay?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Maths: Calculator,
  Math: Calculator,
};

export function SubjectCard({
  name,
  marksObtained,
  negativeMarks,
  unattempted,
  totalQuestions,
  timeSpent,
  color,
  onReviewMistakes,
  delay = 0,
}: SubjectCardProps) {
  const Icon = iconMap[name] || Atom;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="glass-card p-5 space-y-4 hover:border-primary/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h3 className="font-semibold font-display text-lg">{name}</h3>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Marks Obtained</span>
          <span className="text-sm font-semibold text-success">+{marksObtained}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Negative Marks</span>
          <span className="text-sm font-semibold text-destructive">-{negativeMarks}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Unattempted</span>
          <span className="text-sm font-semibold text-muted-foreground">{unattempted}/{totalQuestions}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Time Spent</span>
          <span className="text-sm font-semibold">{timeSpent}</span>
        </div>
      </div>

      {/* Action */}
      <Button
        variant="ghost"
        onClick={onReviewMistakes}
        className="w-full text-primary hover:bg-primary/10 border border-primary/20"
      >
        Review Mistakes
      </Button>
    </motion.div>
  );
}

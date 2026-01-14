import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LatexRenderer } from "@/components/ui/latex-renderer";

interface SolutionSectionProps {
  solutionText?: string;
  steps?: string[];
  finalAnswer?: string;
  chapter?: string;
  topic?: string;
  isAttemptMode?: boolean;
  onShowSolution?: () => void;
}

export function SolutionSection({
  solutionText,
  steps = [],
  finalAnswer,
  chapter,
  topic,
  isAttemptMode = false,
  onShowSolution,
}: SolutionSectionProps) {
  const [showWorking, setShowWorking] = useState(true);

  if (isAttemptMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Solution
          </h3>
          <Button onClick={onShowSolution} className="bg-primary text-primary-foreground">
            View Solution
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Solution is hidden in attempt mode. Click to reveal.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold font-display flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          SOLUTION
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowWorking(!showWorking)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showWorking ? (
            <>
              Hide Working <ChevronUp className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              Show Working <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      {/* Solution Content */}
      <AnimatePresence>
        {showWorking && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Given/Setup info */}
            {solutionText && (
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                <LatexRenderer 
                  content={solutionText} 
                  className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
                />
              </div>
            )}

            {/* Steps */}
            {steps.length > 0 && (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <LatexRenderer 
                      content={step} 
                      className="text-sm text-foreground leading-relaxed pt-0.5"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Final Answer */}
            {finalAnswer && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                <LatexRenderer 
                  content={`∴ ${finalAnswer}`}
                  className="text-sm font-medium text-success"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter & Topic */}
      {(chapter || topic) && (
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {chapter && <span>Chapter: {chapter}</span>}
            {chapter && topic && <span className="mx-2">•</span>}
            {topic && <span>Topic: {topic}</span>}
          </p>
        </div>
      )}
    </motion.div>
  );
}

import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onViewSolution?: () => void;
  isAttemptMode?: boolean;
}

export function BottomNavigation({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onViewSolution,
  isAttemptMode = false,
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-[72px] z-30 bg-card/90 backdrop-blur-xl border-t border-border p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {totalQuestions}
          </span>
          
          {isAttemptMode && onViewSolution && (
            <Button onClick={onViewSolution} className="gap-2 bg-primary text-primary-foreground">
              <Eye className="w-4 h-4" />
              View Solution
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

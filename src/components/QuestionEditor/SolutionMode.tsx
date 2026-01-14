import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { QuestionImageUpload } from '@/components/admin/QuestionImageUpload';
import { LaTeXPreview } from './LaTeXPreview';
import { Question } from '@/types/question.types';
import { X } from 'lucide-react';

interface SolutionModeProps {
  question: Question;
  onChange: (updates: Partial<Question>) => void;
}

/**
 * Solution editing mode - Split view with editor and live preview
 */
export function SolutionMode({ question, onChange }: SolutionModeProps) {
  const handleClearSolution = () => {
    if (confirm('Clear all solution content?')) {
      onChange({
        solution_text: null,
        solution_image_url: null,
      });
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel: Solution Editor */}
      <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
          <Label className="text-sm font-medium">Solution Editor</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSolution}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Solution
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Solution Text */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Solution Explanation (supports LaTeX)
            </Label>
            <Textarea
              value={question.solution_text || ''}
              onChange={(e) => onChange({ solution_text: e.target.value })}
              placeholder="Write the solution explanation here... Use LaTeX: $\frac{a}{b}$ for fractions"
              className="min-h-[400px] font-mono text-sm resize-y"
            />
          </div>

          {/* Solution Image */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Solution Image (Optional)</Label>
            <QuestionImageUpload
              value={question.solution_image_url}
              onChange={(url) => onChange({ solution_image_url: url })}
            />
          </div>
        </div>
      </div>

      {/* Right Panel: Live Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-card/50">
          <Label className="text-sm font-medium">Live Preview</Label>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!question.solution_text && !question.solution_image_url ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Solution preview will appear here as you type...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview solution text with LaTeX */}
              {question.solution_text && (
                <LaTeXPreview content={question.solution_text} />
              )}

              {/* Preview solution image */}
              {question.solution_image_url && (
                <div className="mt-4">
                  <img
                    src={question.solution_image_url}
                    alt="Solution"
                    className="max-w-full h-auto rounded-lg border border-border"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

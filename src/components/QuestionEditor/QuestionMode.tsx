import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { QuestionImageUpload } from '@/components/admin/QuestionImageUpload';
import { OptionsEditor } from './OptionsEditor';
import { Question, QuestionOption } from '@/types/question.types';

interface QuestionModeProps {
  question: Question;
  sectionType: 'single_choice' | 'multiple_choice' | 'integer';
  onChange: (updates: Partial<Question>) => void;
}

/**
 * Question editing mode - Question text, image, and options
 */
export function QuestionMode({ question, sectionType, onChange }: QuestionModeProps) {
  const handleOptionsChange = (options: QuestionOption[]) => {
    onChange({ options });
  };

  const handleCorrectAnswerChange = (answer: string | string[]) => {
    onChange({ correct_answer: answer });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Question Text */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Question Text (supports LaTeX: $x^2$ for inline, $$...$$ for display)
        </Label>
        <Textarea
          value={question.question_text || ''}
          onChange={(e) => onChange({ question_text: e.target.value })}
          placeholder="Enter question text... Use LaTeX: $\frac{a}{b}$ for fractions"
          className="min-h-[160px] font-mono text-sm resize-y"
        />
      </div>

      {/* Question Image (Optional) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Question Diagram (Optional)</Label>
        <QuestionImageUpload
          value={question.image_url}
          onChange={(url) => onChange({ image_url: url })}
        />
      </div>

      {/* Options Editor */}
      <OptionsEditor
        options={question.options || [
          { label: 'A', text: '', image_url: null },
          { label: 'B', text: '', image_url: null },
          { label: 'C', text: '', image_url: null },
          { label: 'D', text: '', image_url: null },
        ]}
        correctAnswer={question.correct_answer}
        sectionType={sectionType}
        onChange={handleOptionsChange}
        onCorrectAnswerChange={handleCorrectAnswerChange}
      />
    </div>
  );
}

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Question } from '@/types/question.types';

interface SettingsModeProps {
  question: Question;
  onChange: (updates: Partial<Question>) => void;
}

/**
 * Settings mode - Marks, difficulty, and other metadata
 */
export function SettingsMode({ question, onChange }: SettingsModeProps) {
  return (
    <div className="p-6 max-w-2xl">
      <div className="space-y-6">
        {/* Marks Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Marking Scheme</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marks">Marks</Label>
              <Input
                id="marks"
                type="number"
                value={question.marks}
                onChange={(e) => onChange({ marks: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="negative_marks">Negative Marks</Label>
              <Input
                id="negative_marks"
                type="number"
                value={question.negative_marks}
                onChange={(e) => onChange({ negative_marks: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
                className="text-lg"
              />
            </div>
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select
            value={question.difficulty || 'medium'}
            onValueChange={(value: 'easy' | 'medium' | 'hard') => onChange({ difficulty: value })}
          >
            <SelectTrigger id="difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="time_seconds">Time Limit (Optional, in seconds)</Label>
          <Input
            id="time_seconds"
            type="number"
            value={question.time_seconds || ''}
            onChange={(e) => onChange({ time_seconds: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Leave empty for no time limit"
            min={0}
          />
          <p className="text-xs text-muted-foreground">
            Individual question time limit (if different from test duration)
          </p>
        </div>

        {/* Question Number */}
        <div className="space-y-2">
          <Label>Question Number</Label>
          <div className="text-2xl font-bold text-primary">
            {question.question_number}
          </div>
          <p className="text-xs text-muted-foreground">
            Question numbers are automatically managed based on section order
          </p>
        </div>
      </div>
    </div>
  );
}

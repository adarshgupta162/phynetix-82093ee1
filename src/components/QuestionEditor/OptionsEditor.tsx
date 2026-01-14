import { useState, useRef, useEffect } from 'react';
import { GripVertical, Plus, X, Image as ImageIcon, MoveUp, MoveDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { QuestionImageUpload } from '@/components/admin/QuestionImageUpload';
import { QuestionOption } from '@/types/question.types';

interface OptionsEditorProps {
  options: QuestionOption[];
  correctAnswer: string | string[];
  sectionType: 'single_choice' | 'multiple_choice' | 'integer';
  onChange: (options: QuestionOption[]) => void;
  onCorrectAnswerChange: (answer: string | string[]) => void;
}

/**
 * Keyboard-friendly options editor with add/remove/reorder
 */
export function OptionsEditor({
  options,
  correctAnswer,
  sectionType,
  onChange,
  onCorrectAnswerChange,
}: OptionsEditorProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showingImageFor, setShowingImageFor] = useState<number | null>(null);

  // For integer type, show simple input
  if (sectionType === 'integer') {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Correct Answer (Integer/Numeric)</Label>
        <Input
          type="text"
          value={correctAnswer as string}
          onChange={(e) => onCorrectAnswerChange(e.target.value)}
          placeholder="Enter the correct integer or numeric value"
          className="text-lg"
        />
      </div>
    );
  }

  const handleAddOption = () => {
    const newLabel = String.fromCharCode(65 + options.length); // A, B, C, D, E...
    const newOptions = [...options, { label: newLabel, text: '', image_url: null }];
    onChange(newOptions);
    
    // Focus new input after render
    setTimeout(() => {
      inputRefs.current[options.length]?.focus();
    }, 0);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return; // Minimum 2 options
    
    const newOptions = options.filter((_, i) => i !== index);
    // Re-label options
    newOptions.forEach((opt, i) => {
      opt.label = String.fromCharCode(65 + i);
    });
    onChange(newOptions);

    // Update correct answer if needed
    if (sectionType === 'single_choice') {
      const removedLabel = options[index].label;
      if (correctAnswer === removedLabel) {
        onCorrectAnswerChange('');
      }
    } else {
      const removedLabel = options[index].label;
      const currentAnswers = Array.isArray(correctAnswer) ? correctAnswer : [];
      if (currentAnswers.includes(removedLabel)) {
        onCorrectAnswerChange(currentAnswers.filter(a => a !== removedLabel));
      }
    }
  };

  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === options.length - 1) return;

    const newOptions = [...options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    
    // Re-label options
    newOptions.forEach((opt, i) => {
      opt.label = String.fromCharCode(65 + i);
    });
    onChange(newOptions);
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    onChange(newOptions);
  };

  const handleOptionImageChange = (index: number, url: string | null) => {
    const newOptions = [...options];
    newOptions[index].image_url = url;
    onChange(newOptions);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === options.length - 1) {
        handleAddOption();
      } else {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleCorrectAnswerToggle = (label: string) => {
    if (sectionType === 'single_choice') {
      onCorrectAnswerChange(label);
    } else {
      const currentAnswers = Array.isArray(correctAnswer) ? correctAnswer : [];
      if (currentAnswers.includes(label)) {
        onCorrectAnswerChange(currentAnswers.filter(a => a !== label));
      } else {
        onCorrectAnswerChange([...currentAnswers, label].sort());
      }
    }
  };

  const isCorrect = (label: string): boolean => {
    if (sectionType === 'single_choice') {
      return correctAnswer === label;
    }
    return Array.isArray(correctAnswer) && correctAnswer.includes(label);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        Options (Enter → next, click to mark correct)
      </Label>
      
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-start gap-2 group">
            {/* Drag handle */}
            <div className="flex flex-col gap-0.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => handleMoveOption(index, 'up')}
                disabled={index === 0}
              >
                <MoveUp className="w-3 h-3" />
              </Button>
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => handleMoveOption(index, 'down')}
                disabled={index === options.length - 1}
              >
                <MoveDown className="w-3 h-3" />
              </Button>
            </div>

            {/* Option label */}
            <div className="w-8 h-9 flex items-center justify-center font-bold text-sm">
              {option.label}
            </div>

            {/* Option text input */}
            <Input
              ref={(el) => (inputRefs.current[index] = el)}
              value={option.text}
              onChange={(e) => handleOptionTextChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              placeholder={`Option ${option.label}`}
              className="flex-1"
            />

            {/* Correct answer selector */}
            {sectionType === 'single_choice' ? (
              <RadioGroup value={correctAnswer as string} onValueChange={onCorrectAnswerChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={option.label} id={`radio-${index}`} />
                  <Label htmlFor={`radio-${index}`} className="text-xs text-muted-foreground cursor-pointer">
                    correct
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isCorrect(option.label)}
                  onCheckedChange={() => handleCorrectAnswerToggle(option.label)}
                  id={`check-${index}`}
                />
                <Label htmlFor={`check-${index}`} className="text-xs text-muted-foreground cursor-pointer">
                  correct
                </Label>
              </div>
            )}

            {/* Image controls */}
            <div className="flex items-center gap-1">
              {option.image_url ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowingImageFor(showingImageFor === index ? null : index)}
                  className="h-9 px-2"
                >
                  <ImageIcon className="w-4 h-4 text-green-600" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowingImageFor(showingImageFor === index ? null : index)}
                  className="h-9 px-2"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              )}

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveOption(index)}
                disabled={options.length <= 2}
                className="h-9 px-2 text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Image upload panels */}
        {options.map((option, index) => (
          showingImageFor === index && (
            <div key={`img-${index}`} className="ml-14 p-3 bg-secondary/30 rounded-lg">
              <QuestionImageUpload
                value={option.image_url}
                onChange={(url) => handleOptionImageChange(index, url)}
              />
            </div>
          )
        ))}
      </div>

      {/* Add option button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddOption}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Option
      </Button>
    </div>
  );
}

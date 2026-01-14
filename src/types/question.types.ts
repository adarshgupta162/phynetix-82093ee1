/**
 * Type definitions for the custom question editor
 */

export interface QuestionOption {
  label: string; // A, B, C, D, etc.
  text: string;
  image_url: string | null;
}

export interface Question {
  id: string;
  section_id: string;
  test_id: string;
  question_number: number;
  question_text: string | null;
  image_url: string | null;
  options: QuestionOption[] | null;
  correct_answer: string | string[]; // "A" for single, ["A", "C"] for multiple, "42" for integer
  solution_text: string | null;
  solution_image_url: string | null;
  marks: number;
  negative_marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  order_index: number;
  is_bonus?: boolean;
  time_seconds?: number | null;
}

export interface Section {
  id: string;
  subject_id: string;
  name: string | null;
  section_type: 'single_choice' | 'multiple_choice' | 'integer';
  order_index: number;
}

export interface Subject {
  id: string;
  test_id: string;
  name: string;
  order_index: number;
}

export interface Test {
  id: string;
  name: string;
  description: string | null;
  exam_type: string;
  test_type: string;
  duration_minutes: number;
  is_published: boolean;
}

export type EditorMode = 'question' | 'solution' | 'settings';

export interface EditorState {
  mode: EditorMode;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  isFullscreen: boolean;
}

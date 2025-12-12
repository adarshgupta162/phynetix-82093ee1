-- Add question_text column to qb_questions for inline text questions
ALTER TABLE public.qb_questions 
ADD COLUMN IF NOT EXISTS question_text text;

-- Add options_text column to store actual option text (not just A,B,C,D)
ALTER TABLE public.qb_questions 
ADD COLUMN IF NOT EXISTS options_text jsonb;
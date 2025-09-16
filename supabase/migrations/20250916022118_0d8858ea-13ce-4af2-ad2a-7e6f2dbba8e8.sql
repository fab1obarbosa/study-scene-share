-- Add status column to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- Add image_url column to questions table  
ALTER TABLE public.questions
ADD COLUMN image_url TEXT;

-- Create index for better performance on status queries
CREATE INDEX idx_quizzes_status ON public.quizzes(status);
CREATE INDEX idx_quizzes_user_status ON public.quizzes(user_id, status);
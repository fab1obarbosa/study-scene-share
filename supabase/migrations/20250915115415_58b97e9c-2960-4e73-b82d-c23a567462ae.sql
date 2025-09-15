-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user ID safely
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (id = get_current_user_id());

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (id = get_current_user_id());

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (id = get_current_user_id());

-- RLS Policies for quizzes table
CREATE POLICY "Users can view their own quizzes" ON public.quizzes
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can create their own quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own quizzes" ON public.quizzes
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own quizzes" ON public.quizzes
  FOR DELETE USING (user_id = get_current_user_id());

-- RLS Policies for questions table (access through quiz ownership)
CREATE POLICY "Users can view questions from their quizzes" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can create questions for their quizzes" ON public.questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can update questions from their quizzes" ON public.questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can delete questions from their quizzes" ON public.questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.user_id = get_current_user_id()
    )
  );

-- RLS Policies for options table (access through question/quiz ownership)
CREATE POLICY "Users can view options from their quiz questions" ON public.options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions 
      JOIN public.quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = options.question_id 
      AND quizzes.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can create options for their quiz questions" ON public.options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions 
      JOIN public.quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = options.question_id 
      AND quizzes.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can update options from their quiz questions" ON public.options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.questions 
      JOIN public.quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = options.question_id 
      AND quizzes.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can delete options from their quiz questions" ON public.options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.questions 
      JOIN public.quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = options.question_id 
      AND quizzes.user_id = get_current_user_id()
    )
  );

-- RLS Policies for attempts table
CREATE POLICY "Users can view their own attempts" ON public.attempts
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can create their own attempts" ON public.attempts
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own attempts" ON public.attempts
  FOR UPDATE USING (user_id = get_current_user_id());

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to automatically create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
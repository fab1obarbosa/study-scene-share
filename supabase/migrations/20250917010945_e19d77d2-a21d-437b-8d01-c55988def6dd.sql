-- Create storage bucket for quiz images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quiz-images', 'quiz-images', true);

-- Create RLS policies for quiz images bucket
CREATE POLICY "Users can view quiz images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'quiz-images');

CREATE POLICY "Users can upload their own quiz images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'quiz-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own quiz images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'quiz-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own quiz images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'quiz-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
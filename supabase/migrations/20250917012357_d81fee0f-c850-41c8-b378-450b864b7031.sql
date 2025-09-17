-- Adicionar coluna statements para armazenar afirmações I, II, III como JSON
ALTER TABLE public.questions 
ADD COLUMN statements JSONB;
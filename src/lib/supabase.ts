import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificar se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🔴 Variáveis de ambiente do Supabase não encontradas!')
  console.log('📋 Configure no painel do Supabase:')
  console.log('   VITE_SUPABASE_URL')
  console.log('   VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)

// Database Types
export interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
  created_at: string
}

export interface Quiz {
  id: string
  user_id: string
  name: string
  category: string
  description: string
  question_count: number
  created_at: string
  raw_text: string
}

export interface Question {
  id: string
  quiz_id: string
  order: number
  text: string
}

export interface Option {
  id: string
  question_id: string
  label: string // A, B, C, D
  text: string
  is_correct: boolean
}

export interface Attempt {
  id: string
  user_id: string
  quiz_id: string
  started_at: string
  finished_at?: string
  score_percent: number
}

export interface AttemptAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_option_id: string
  is_correct: boolean
}
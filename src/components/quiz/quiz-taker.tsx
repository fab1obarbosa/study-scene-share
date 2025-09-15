import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, Clock } from "lucide-react"
import type { Database } from "@/integrations/supabase/types"

type Quiz = Database['public']['Tables']['quizzes']['Row']
type Question = Database['public']['Tables']['questions']['Row']
type Option = Database['public']['Tables']['options']['Row']

interface QuizTakerProps {
  quizId: string
  userId: string
  onComplete: (attemptId: string, score: number, answers: QuizAnswer[], quizName: string) => void
  onBack: () => void
}

interface QuizQuestion extends Question {
  options: Option[]
}

interface QuizAnswer {
  questionId: string
  selectedOptionId: string
  isCorrect: boolean
  question: string
  selectedAnswer: string
  correctAnswer: string
}

export function QuizTaker({ quizId, userId, onComplete, onBack }: QuizTakerProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [startTime, setStartTime] = useState<Date>(new Date())
  const { toast } = useToast()

  useEffect(() => {
    loadQuizData()
  }, [])

  const loadQuizData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single()

      if (quizError) throw quizError
      setQuiz(quizData)

      // Carregar perguntas e opções
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          options (*)
        `)
        .eq('quiz_id', quizId)
        .order('order')

      if (questionsError) throw questionsError
      setQuestions(questionsData || [])

      // Criar tentativa
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .insert({
          user_id: userId,
          quiz_id: quizId,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (attemptError) throw attemptError
      setAttemptId(attemptData.id)
      setStartTime(new Date())

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar quiz",
        description: error instanceof Error ? error.message : "Erro desconhecido"
      })
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (optionId: string) => {
    setSelectedOptionId(optionId)
  }

  const handleNextQuestion = () => {
    if (!selectedOptionId) return

    const currentQuestion = questions[currentQuestionIndex]
    const selectedOption = currentQuestion.options.find(opt => opt.id === selectedOptionId)
    const correctOption = currentQuestion.options.find(opt => opt.is_correct)

    const answer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedOptionId: selectedOptionId,
      isCorrect: selectedOption?.is_correct || false,
      question: currentQuestion.text,
      selectedAnswer: selectedOption?.text || '',
      correctAnswer: correctOption?.text || ''
    }

    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOptionId(null)
    } else {
      finishQuiz(newAnswers)
    }
  }

  const finishQuiz = async (finalAnswers: QuizAnswer[]) => {
    if (!attemptId) return

    try {
      const correctCount = finalAnswers.filter(answer => answer.isCorrect).length
      const totalQuestions = finalAnswers.length
      const scorePercent = Math.round((correctCount / totalQuestions) * 100)

      // Atualizar tentativa
      const { error: updateError } = await supabase
        .from('attempts')
        .update({
          finished_at: new Date().toISOString(),
          score_percent: scorePercent
        })
        .eq('id', attemptId)

      if (updateError) throw updateError

      onComplete(attemptId, scorePercent, finalAnswers, quiz.name)

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao finalizar quiz",
        description: error instanceof Error ? error.message : "Erro desconhecido"
      })
    }
  }

  if (loading || !quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-pulse text-muted-foreground">Carregando quiz...</div>
          </div>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header com progresso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-muted-foreground">{quiz.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Pergunta {currentQuestionIndex + 1} de {questions.length}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Pergunta principal */}
        <Card className="gradient-card border-0 shadow-xl mb-6">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-8 text-center leading-relaxed">
              {currentQuestion.text}
            </h2>
            
            {/* Alternativas */}
            <div className="space-y-4">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(option.id)}
                  className={`w-full p-4 rounded-lg border-2 animation-smooth text-left hover:scale-[1.02] ${
                    selectedOptionId === option.id
                      ? 'border-primary bg-primary/10 shadow-lg'
                      : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center animation-smooth ${
                      selectedOptionId === option.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}>
                      <span className={`text-sm font-bold ${
                        selectedOptionId === option.id ? 'text-white' : 'text-muted-foreground'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                    <span className="text-lg">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botão próxima */}
        <div className="flex justify-end">
          <Button
            onClick={handleNextQuestion}
            disabled={!selectedOptionId}
            variant="hero"
            size="lg"
            className="min-w-[160px]"
          >
            {currentQuestionIndex < questions.length - 1 ? (
              <>
                Próxima
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            ) : (
              'Finalizar Quiz'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
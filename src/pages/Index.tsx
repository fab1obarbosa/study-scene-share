import { useAuth } from "@/components/auth/auth-provider"
import { AuthForm } from "@/components/auth/auth-form"
import { Dashboard } from "@/components/dashboard/dashboard"
import { CreateQuizWizard } from '@/components/quiz/create-quiz-wizard';
import { QuizTaker } from "@/components/quiz/quiz-taker"
import { QuizResult } from "@/components/quiz/quiz-result"
import { useState } from "react"
import { Loader2 } from "lucide-react"

interface QuizAnswer {
  questionId: string
  selectedOptionId: string
  isCorrect: boolean
  question: string
  selectedAnswer: string
  correctAnswer: string
}

const Index = () => {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState<'dashboard' | 'create-quiz' | 'take-quiz' | 'quiz-result'>('dashboard')
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [quizResults, setQuizResults] = useState<{
    attemptId: string
    score: number
    answers: QuizAnswer[]
    quizName: string
  } | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  const handleTakeQuiz = (quizId: string) => {
    setSelectedQuizId(quizId)
    setCurrentView('take-quiz')
  }

  const handleQuizComplete = (attemptId: string, score: number, answers: QuizAnswer[], quizName: string) => {
    setQuizResults({ attemptId, score, answers, quizName })
    setCurrentView('quiz-result')
  }

  const handleRetakeQuiz = () => {
    setCurrentView('take-quiz')
  }

  if (currentView === 'create-quiz') {
    return (
      <CreateQuizWizard
        userId={user.id}
        onBack={() => setCurrentView('dashboard')}
        onQuizCreated={() => setCurrentView('dashboard')}
      />
    )
  }

  if (currentView === 'take-quiz' && selectedQuizId) {
    return (
      <QuizTaker
        quizId={selectedQuizId}
        userId={user.id}
        onComplete={(attemptId, score, answers, quizName) => {
          handleQuizComplete(attemptId, score, answers, quizName)
        }}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  if (currentView === 'quiz-result' && quizResults) {
    return (
      <QuizResult
        quizName={quizResults.quizName}
        score={quizResults.score}
        totalQuestions={quizResults.answers.length}
        answers={quizResults.answers}
        onRetake={handleRetakeQuiz}
        onBackToDashboard={() => setCurrentView('dashboard')}
      />
    )
  }

  return (
    <Dashboard 
      user={user} 
      onCreateQuiz={() => setCurrentView('create-quiz')}
      onTakeQuiz={handleTakeQuiz}
    />
  )
}

export default Index;

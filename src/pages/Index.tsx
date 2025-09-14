import { useAuth } from "@/components/auth/auth-provider"
import { AuthForm } from "@/components/auth/auth-form"
import { Dashboard } from "@/components/dashboard/dashboard"
import { CreateQuiz } from "@/components/quiz/create-quiz"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const Index = () => {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState<'dashboard' | 'create-quiz'>('dashboard')

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

  if (currentView === 'create-quiz') {
    return (
      <CreateQuiz
        userId={user.id}
        onBack={() => setCurrentView('dashboard')}
        onQuizCreated={() => setCurrentView('dashboard')}
      />
    )
  }

  return <Dashboard user={user} />
}

export default Index;

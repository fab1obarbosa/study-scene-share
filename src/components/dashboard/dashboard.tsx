import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Play, 
  Filter, 
  Calendar, 
  Tag, 
  RotateCcw, 
  LogOut, 
  User, 
  Settings,
  BookOpen,
  Trophy,
  TrendingUp
} from "lucide-react"
import type { Database } from "@/integrations/supabase/types"

type Quiz = Database['public']['Tables']['quizzes']['Row']
type Attempt = Database['public']['Tables']['attempts']['Row'] & {
  quizzes?: { name: string }
}
type UserType = Database['public']['Tables']['users']['Row']

interface DashboardProps {
  user: UserType
  onCreateQuiz: () => void
  onTakeQuiz: (quizId: string) => void
}

export function Dashboard({ user, onCreateQuiz, onTakeQuiz }: DashboardProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Carregar quizzes do usuário
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (quizzesError) throw quizzesError
      setQuizzes(quizzesData || [])
      
      // Carregar tentativas do usuário
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('attempts')
        .select(`
          *,
          quizzes (name)
        `)
        .eq('user_id', user.id)
        .order('finished_at', { ascending: false })
      
      if (attemptsError) throw attemptsError
      setAttempts(attemptsData || [])
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Logout realizado",
      description: "Até logo!"
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getScoreColor = (score: number) => {
    return score >= 70 ? 'text-success' : 'text-muted-foreground'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
              QuizMaster
            </h1>
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{quizzes.length} quiz{quizzes.length !== 1 ? 'es' : ''}</span>
              <Trophy className="h-4 w-4 ml-4" />
              <span>{attempts.length} tentativa{attempts.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback className="gradient-primary text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card 
            className="gradient-card border-0 shadow-lg hover:shadow-xl animation-smooth cursor-pointer group"
            onClick={onCreateQuiz}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center group-hover:scale-110 animation-bounce">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Criar novo quiz</h3>
              <p className="text-muted-foreground mb-4">
                Transforme seu texto de estudos em um quiz interativo
              </p>
              <Button variant="hero" className="w-full">
                Começar criação
              </Button>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl animation-smooth cursor-pointer group">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-success flex items-center justify-center group-hover:scale-110 animation-bounce">
                <Play className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Testar meus conhecimentos</h3>
              <p className="text-muted-foreground mb-4">
                Execute seus quizzes salvos e teste seu aprendizado
              </p>
              <Button variant="success" className="w-full">
                Ver meus quizzes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quizzes Criados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Quizzes Criados
              </h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <Card className="p-6">
                  <div className="text-center text-muted-foreground">
                    Carregando...
                  </div>
                </Card>
              ) : quizzes.length === 0 ? (
                <Card className="p-6 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Você ainda não criou nenhum quiz
                  </p>
                  <Button variant="outline" className="mt-3" onClick={onCreateQuiz}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeiro quiz
                  </Button>
                </Card>
              ) : (
                quizzes.map((quiz) => (
                  <Card key={quiz.id} className="hover:shadow-md animation-smooth">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{quiz.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {quiz.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(quiz.created_at)}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onTakeQuiz(quiz.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Fazer Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Relatório de Tentativas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Relatório de Quizzes
              </h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <Card className="p-6">
                  <div className="text-center text-muted-foreground">
                    Carregando...
                  </div>
                </Card>
              ) : attempts.length === 0 ? (
                <Card className="p-6 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhuma tentativa realizada ainda
                  </p>
                  <Button variant="outline" className="mt-3" onClick={onCreateQuiz}>
                    <Play className="h-4 w-4 mr-2" />
                    Criar primeiro quiz
                  </Button>
                </Card>
              ) : (
                attempts.map((attempt) => (
                  <Card key={attempt.id} className="hover:shadow-md animation-smooth">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{(attempt as any).quizzes?.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(attempt.finished_at || attempt.started_at)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${getScoreColor(attempt.score_percent)}`}>
                            {attempt.score_percent}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {/* Aqui você pode adicionar acertos/total quando tiver os dados */}
                            pontuação
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
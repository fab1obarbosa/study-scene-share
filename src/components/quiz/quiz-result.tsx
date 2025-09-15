import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Trophy, 
  RotateCcw, 
  Home, 
  Share, 
  CheckCircle, 
  XCircle,
  Target,
  Clock,
  TrendingUp
} from "lucide-react"
import html2canvas from "html2canvas"

interface QuizAnswer {
  questionId: string
  selectedOptionId: string
  isCorrect: boolean
  question: string
  selectedAnswer: string
  correctAnswer: string
}

interface QuizResultProps {
  quizName: string
  score: number
  totalQuestions: number
  answers: QuizAnswer[]
  onRetake: () => void
  onBackToDashboard: () => void
}

export function QuizResult({ 
  quizName, 
  score, 
  totalQuestions, 
  answers, 
  onRetake, 
  onBackToDashboard 
}: QuizResultProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()
  
  const correctAnswers = answers.filter(answer => answer.isCorrect).length
  const wrongAnswers = totalQuestions - correctAnswers
  const percentage = Math.round((correctAnswers / totalQuestions) * 100)
  
  const getScoreColor = () => {
    if (percentage >= 80) return 'text-success'
    if (percentage >= 60) return 'text-warning' 
    return 'text-error'
  }

  const getScoreMessage = () => {
    if (percentage >= 90) return 'Excelente! 🎉'
    if (percentage >= 80) return 'Muito bom! 👏'
    if (percentage >= 70) return 'Bom trabalho! 👍'
    if (percentage >= 60) return 'Continue estudando! 📚'
    return 'Precisa estudar mais! 💪'
  }

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const resultElement = document.getElementById('quiz-result-card')
      if (!resultElement) return

      const canvas = await html2canvas(resultElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })

      // Converter para blob
      canvas.toBlob((blob) => {
        if (!blob) return

        // Criar URL do blob
        const url = URL.createObjectURL(blob)
        
        // Criar link para download
        const link = document.createElement('a')
        link.href = url
        link.download = `resultado-quiz-${quizName.toLowerCase().replace(/\s+/g, '-')}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Limpar URL
        URL.revokeObjectURL(url)
        
        toast({
          title: "Resultado salvo!",
          description: "A imagem foi salva para compartilhamento."
        })
      }, 'image/png')

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar imagem",
        description: "Não foi possível criar a imagem do resultado."
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Resultado principal */}
        <Card id="quiz-result-card" className="gradient-card border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full gradient-hero flex items-center justify-center">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">Quiz Finalizado!</CardTitle>
            <p className="text-xl text-muted-foreground">{quizName}</p>
          </CardHeader>
          
          <CardContent className="text-center space-y-8">
            {/* Score principal */}
            <div className="space-y-4">
              <div className={`text-6xl font-bold ${getScoreColor()}`}>
                {percentage}%
              </div>
              <div className="text-xl font-medium text-muted-foreground">
                {getScoreMessage()}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full gradient-success flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-success">{correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Corretas</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-error flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-error">{wrongAnswers}</div>
                <div className="text-sm text-muted-foreground">Incorretas</div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full gradient-primary flex items-center justify-center">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-primary">{totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perguntas incorretas */}
        {wrongAnswers > 0 && (
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-error">
                <XCircle className="h-5 w-5" />
                Perguntas Respondidas Incorretamente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {answers
                .filter(answer => !answer.isCorrect)
                .map((answer, index) => (
                  <div key={answer.questionId} className="border-l-4 border-error pl-4 py-3">
                    <h4 className="font-medium mb-2">
                      Pergunta {answers.indexOf(answer) + 1}: {answer.question}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          Sua resposta
                        </Badge>
                        <span className="text-muted-foreground">{answer.selectedAnswer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-success">
                          Resposta correta
                        </Badge>
                        <span className="font-medium">{answer.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={onRetake}
            variant="hero"
            size="lg"
            className="min-w-[180px]"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Fazer Novamente
          </Button>
          
          <Button
            onClick={onBackToDashboard}
            variant="outline"
            size="lg"
            className="min-w-[180px]"
          >
            <Home className="h-5 w-5 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <Button
            onClick={handleShare}
            disabled={isSharing}
            variant="success"
            size="lg"
            className="min-w-[180px]"
          >
            {isSharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Gerando...
              </>
            ) : (
              <>
                <Share className="h-5 w-5 mr-2" />
                Compartilhar Resultado
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
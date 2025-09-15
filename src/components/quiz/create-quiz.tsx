import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseQuizRawText, validateParsedQuiz } from "@/utils/quiz-parser"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  FileText, 
  Eye, 
  Save, 
  AlertCircle, 
  BookOpen,
  Hash,
  Target
} from "lucide-react"

interface CreateQuizProps {
  onBack: () => void
  onQuizCreated: () => void
  userId: string
}

interface ParsedQuestion {
  text: string
  options: {
    label: string
    text: string
    is_correct: boolean
  }[]
}

export function CreateQuiz({ onBack, onQuizCreated, userId }: CreateQuizProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    questionCount: 10,
    rawText: ''
  })
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const { toast } = useToast()

  const handleCreateQuiz = async () => {
    // Validações
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Digite um nome para o quiz"
      })
      return
    }

    if (!formData.category.trim()) {
      toast({
        variant: "destructive",
        title: "Categoria obrigatória",
        description: "Digite uma categoria para o quiz"
      })
      return
    }

    if (!formData.rawText.trim()) {
      toast({
        variant: "destructive",
        title: "Texto obrigatório",
        description: "Digite o texto com as perguntas e alternativas"
      })
      return
    }

    setLoading(true)
    try {
      // Parse do texto
      const parsed = parseQuizRawText(formData.rawText)
      const validation = validateParsedQuiz(parsed)
      
      if (!validation.isValid) {
        setParseErrors(validation.errors)
        setLoading(false)
        return
      }

      // Limitar a quantidade de perguntas
      const limitedQuestions = parsed.questions.slice(0, Math.min(formData.questionCount, 20))

      // Criar o quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: userId,
          name: formData.name,
          category: formData.category,
          description: formData.description,
          question_count: limitedQuestions.length,
          raw_text: formData.rawText
        })
        .select()
        .single()

      if (quizError) throw quizError

      // Inserir perguntas e opções
      for (let i = 0; i < limitedQuestions.length; i++) {
        const question = limitedQuestions[i]
        
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: quiz.id,
            order: i + 1,
            text: question.text
          })
          .select()
          .single()

        if (questionError) throw questionError

        // Inserir opções da pergunta
        const options = question.options.map(option => ({
          question_id: questionData.id,
          label: option.label,
          text: option.text,
          is_correct: option.is_correct
        }))

        const { error: optionsError } = await supabase
          .from('options')
          .insert(options)

        if (optionsError) throw optionsError
      }

      toast({
        title: "Quiz criado com sucesso!",
        description: `${limitedQuestions.length} perguntas foram salvas.`
      })

      onQuizCreated()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar quiz",
        description: error instanceof Error ? error.message : "Erro desconhecido"
      })
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Criar Novo Quiz</h1>
        <p className="text-muted-foreground">
          Preencha os dados e adicione o texto com suas perguntas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Quiz
            </CardTitle>
            <CardDescription>
              Preencha os dados básicos do seu quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Quiz *</Label>
              <Input
                id="name"
                placeholder="Ex: Química Orgânica - Capítulo 3"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Input
                id="category"
                placeholder="Ex: Química, História, Matemática"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Breve descrição sobre o conteúdo do quiz"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionCount">Quantidade de Perguntas (máximo 20)</Label>
              <Input
                id="questionCount"
                type="number"
                min="1"
                max="20"
                value={formData.questionCount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  questionCount: Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rawText">Texto com Perguntas e Alternativas *</Label>
              <Textarea
                id="rawText"
                placeholder="Cole aqui o texto com suas perguntas e alternativas..."
                value={formData.rawText}
                onChange={(e) => setFormData(prev => ({ ...prev, rawText: e.target.value }))}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Formatos suportados: perguntas numeradas (1., 2.) e alternativas com letras (A), B), etc.)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instruções e Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Formato Esperado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                <div className="text-primary font-semibold">1. Qual a capital do Brasil?</div>
                <div className="mt-2 space-y-1">
                  <div>A) Rio de Janeiro</div>
                  <div>B) São Paulo</div>
                  <div className="text-success">C) Brasília *</div>
                  <div>D) Salvador</div>
                </div>
                <div className="mt-4 text-primary font-semibold">2. Quanto é 2 + 2?</div>
                <div className="mt-2 space-y-1">
                  <div>A) 3</div>
                  <div className="text-success">B) 4 ✓</div>
                  <div>C) 5</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>• Use números para perguntas (1., 2., 3.)</p>
                <p>• Use letras para alternativas (A), B), C), D))</p>
                <p>• Marque respostas corretas com *, ✓ ou (correta)</p>
                <p>• Limitado pelo número de perguntas selecionado</p>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Resumo da Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Máximo de perguntas:</span>
                  <div className="font-semibold">{formData.questionCount}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Categoria:</span>
                  <div className="font-semibold">{formData.category || 'Não informada'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {parseErrors.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Problemas encontrados:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {parseErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button 
          onClick={handleCreateQuiz} 
          variant="hero" 
          size="lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Criando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Criar Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
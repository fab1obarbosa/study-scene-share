import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseQuizRawText, validateParsedQuiz } from "@/utils/quiz-parser"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  FileText, 
  Eye, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Edit3,
  BookOpen,
  Hash
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
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    rawText: ''
  })
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null)
  const { toast } = useToast()

  const handleParseText = () => {
    if (!formData.rawText.trim()) {
      toast({
        variant: "destructive",
        title: "Texto obrigatório",
        description: "Digite o texto com as perguntas e alternativas"
      })
      return
    }

    try {
      const parsed = parseQuizRawText(formData.rawText)
      const validation = validateParsedQuiz(parsed)
      
      if (!validation.isValid) {
        setParseErrors(validation.errors)
        return
      }
      
      setParsedQuestions(parsed.questions)
      setParseErrors([])
      setStep(2)
      
      // Preencher dados automaticamente se estiverem vazios
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: parsed.title }))
      }
      if (!formData.description) {
        setFormData(prev => ({ ...prev, description: parsed.description }))
      }
      if (!formData.category) {
        setFormData(prev => ({ ...prev, category: parsed.category }))
      }
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no processamento",
        description: "Não foi possível processar o texto. Verifique o formato."
      })
    }
  }

  const handleSaveQuiz = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Digite um nome para o quiz"
      })
      return
    }

    setLoading(true)
    try {
      // Criar o quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: userId,
          name: formData.name,
          category: formData.category || 'Geral',
          description: formData.description,
          question_count: parsedQuestions.length,
          raw_text: formData.rawText
        })
        .select()
        .single()

      if (quizError) throw quizError

      // Inserir perguntas e opções
      for (let i = 0; i < parsedQuestions.length; i++) {
        const question = parsedQuestions[i]
        
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
        description: `${parsedQuestions.length} perguntas foram salvas.`
      })

      onQuizCreated()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar quiz",
        description: error instanceof Error ? error.message : "Erro desconhecido"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    setParsedQuestions(prev => {
      const updated = [...prev]
      // Desmarcar todas as opções da pergunta
      updated[questionIndex].options.forEach(opt => opt.is_correct = false)
      // Marcar a opção selecionada como correta
      updated[questionIndex].options[optionIndex].is_correct = true
      return updated
    })
  }

  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Criar Novo Quiz</h1>
          <p className="text-muted-foreground">
            Transforme seu texto de estudos em um quiz interativo
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
                <Label htmlFor="name">Nome do Quiz</Label>
                <Input
                  id="name"
                  placeholder="Ex: Química Orgânica - Capítulo 3"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
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
                <Label htmlFor="rawText">Texto com Perguntas e Alternativas</Label>
                <Textarea
                  id="rawText"
                  placeholder="Cole aqui o texto com suas perguntas e alternativas..."
                  value={formData.rawText}
                  onChange={(e) => setFormData(prev => ({ ...prev, rawText: e.target.value }))}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Formatos suportados: perguntas numeradas (1., 2.) e alternativas com letras (A), B), etc.)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview e Instruções */}
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
                  <p>• Máximo de 20 perguntas por quiz</p>
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
          <Button onClick={handleParseText} variant="hero" size="lg">
            <Eye className="h-4 w-4 mr-2" />
            Processar e Visualizar
          </Button>
        </div>
      </div>
    )
  }

  // Step 2: Preview e Edição
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setStep(1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Edição
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Preview do Quiz</h1>
        <p className="text-muted-foreground">
          Revise as perguntas processadas e ajuste se necessário
        </p>
      </div>

      <div className="space-y-6">
        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{parsedQuestions.length}</div>
                <div className="text-sm text-muted-foreground">Perguntas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{formData.category || 'Geral'}</div>
                <div className="text-sm text-muted-foreground">Categoria</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {Math.round(parsedQuestions.length * 2)} min
                </div>
                <div className="text-sm text-muted-foreground">Duração aprox.</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {parsedQuestions.filter(q => q.options.some(opt => opt.is_correct)).length}
                </div>
                <div className="text-sm text-muted-foreground">Com respostas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perguntas */}
        <div className="space-y-4">
          {parsedQuestions.map((question, questionIndex) => (
            <Card key={questionIndex}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Pergunta {questionIndex + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingQuestion(
                      editingQuestion === questionIndex ? null : questionIndex
                    )}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-lg">{question.text}</p>
                  
                  <div className="grid gap-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-lg border cursor-pointer animation-smooth ${
                          option.is_correct
                            ? 'border-success bg-success/10 text-success'
                            : 'border-border hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => toggleCorrectAnswer(questionIndex, optionIndex)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={option.is_correct ? "default" : "outline"}>
                            {option.label}
                          </Badge>
                          <span className="flex-1">{option.text}</span>
                          {option.is_correct && <CheckCircle className="h-4 w-4" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ações */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={() => setStep(1)}>
            Editar Texto
          </Button>
          
          <Button
            onClick={handleSaveQuiz}
            variant="hero"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Quiz
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
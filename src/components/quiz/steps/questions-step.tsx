import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { QuizData, ParsedQuestion } from '../create-quiz-wizard';
import { parseQuizRawText, validateParsedQuiz } from '@/utils/quiz-parser';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuestionsStepProps {
  quizData: QuizData;
  onNext: (data: { questions: ParsedQuestion[], rawText: string }) => void;
  isLoading: boolean;
}

export const QuestionsStep: React.FC<QuestionsStepProps> = ({
  quizData,
  onNext,
  isLoading
}) => {
  const [rawText, setRawText] = useState(quizData.rawText || '');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [answerKey, setAnswerKey] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsed, setIsParsed] = useState(false);

  const handleParseText = () => {
    try {
      // Adicionar gabarito ao final do texto se fornecido
      let textToParse = rawText;
      if (answerKey.trim()) {
        textToParse = `${rawText}\n\nGabarito: ${answerKey}`;
      }

      const parsed = parseQuizRawText(textToParse);
      const validation = validateParsedQuiz(parsed);

      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      // Converter para o formato esperado e limitar pela quantidade configurada
      const questions: ParsedQuestion[] = parsed.questions
        .slice(0, quizData.questionCount)
        .map((q, index) => ({
          text: q.text,
          order: index + 1,
          options: q.options
        }));

      setParsedQuestions(questions);
      setErrors([]);
      setIsParsed(true);
    } catch (error) {
      setErrors(['Erro ao processar o texto. Verifique o formato.']);
    }
  };

  const handleNext = () => {
    if (parsedQuestions.length > 0) {
      onNext({
        questions: parsedQuestions,
        rawText: rawText
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Perguntas e Respostas
        </h2>
        <p className="text-muted-foreground">
          Cole o texto com suas perguntas e alternativas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rawText">Texto com Perguntas</Label>
            <Textarea
              id="rawText"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui o texto com perguntas e alternativas..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answerKey">Gabarito (opcional)</Label>
            <Input
              id="answerKey"
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
              placeholder="Ex: 1-A, 2-B, 3-C ou 1.A 2.B 3.C"
            />
            <p className="text-xs text-muted-foreground">
              Formato aceito: "1-A, 2-B, 3-C" ou "1.A 2.B 3.C"
            </p>
          </div>

          <Button 
            onClick={handleParseText}
            variant="outline"
            className="w-full"
            disabled={!rawText.trim()}
          >
            Processar Texto
          </Button>

          {/* Format Help */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Formatos Aceitos</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>
                <strong>Formato 1:</strong><br/>
                1. Pergunta aqui?<br/>
                a) Alternativa A<br/>
                b) Alternativa B<br/>
                c) Alternativa C
              </div>
              <div>
                <strong>Formato 2:</strong><br/>
                1 - Pergunta aqui?<br/>
                a<br/>
                b<br/>
                c
              </div>
              <div>
                <strong>Formato 3:</strong><br/>
                A. Pergunta aqui?<br/>
                1<br/>
                2<br/>
                3
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <Label>Preview das Perguntas</Label>
          
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {isParsed && parsedQuestions.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {parsedQuestions.map((question, index) => (
                <Card key={index} className="text-sm">
                  <CardContent className="p-4">
                    <div className="font-medium mb-2">
                      {index + 1}. {question.text}
                    </div>
                    <div className="space-y-1">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          className={`text-xs p-1 rounded ${
                            option.is_correct 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-muted'
                          }`}
                        >
                          {option.label}) {option.text}
                          {option.is_correct && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="text-center text-sm text-muted-foreground">
                {parsedQuestions.length} de {quizData.questionCount} perguntas processadas
              </div>
            </div>
          )}

          {!isParsed && (
            <div className="h-96 flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30">
              <p className="text-muted-foreground text-sm">
                Cole o texto e clique em "Processar Texto" para ver o preview
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={isLoading || parsedQuestions.length === 0}
          className="min-w-32"
        >
          {isLoading ? (
            'Salvando...'
          ) : (
            <>
              Avançar
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
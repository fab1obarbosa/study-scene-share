import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuizData, ParsedQuestion } from '../create-quiz-wizard';
import { CheckCircle, Image as ImageIcon, Users, Calendar, Tag } from 'lucide-react';

interface ReviewStepProps {
  quizData: QuizData;
  questions: ParsedQuestion[];
  onPublish: () => void;
  isLoading: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  quizData,
  questions,
  onPublish,
  isLoading
}) => {
  const questionsWithImages = questions.filter(q => q.imageUrl).length;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Revisão e Publicação
        </h2>
        <p className="text-muted-foreground">
          Confira todos os dados antes de publicar seu quiz
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quiz Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Informações do Quiz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="text-foreground">{quizData.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Categoria</label>
              <p className="text-foreground">{quizData.category}</p>
            </div>
            
            {quizData.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-foreground">{quizData.description}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {questions.length} pergunta{questions.length > 1 ? 's' : ''}
              </Badge>
              
              {questionsWithImages > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {questionsWithImages} com imagem{questionsWithImages > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Status da Criação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Dados básicos</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Perguntas e alternativas</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Imagens (opcional)</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Criado em {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview das Perguntas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {questions.map((question, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                {question.imageUrl && (
                  <img
                    src={question.imageUrl}
                    alt={`Pergunta ${index + 1}`}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1">
                    {index + 1}. {question.text}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {question.options.length} alternativa{question.options.length > 1 ? 's' : ''}
                    {question.imageUrl && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Com imagem
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Publish Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onPublish}
          disabled={isLoading}
          size="lg"
          className="min-w-48"
        >
          {isLoading ? (
            'Publicando Quiz...'
          ) : (
            <>
              🎉 Publicar Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
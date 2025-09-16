import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ParsedQuestion } from '../create-quiz-wizard';
import { ChevronRight, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImagesStepProps {
  questions: ParsedQuestion[];
  quizId: string;
  onNext: (data: { questions: ParsedQuestion[] }) => void;
  isLoading: boolean;
}

export const ImagesStep: React.FC<ImagesStepProps> = ({
  questions: initialQuestions,
  quizId,
  onNext,
  isLoading
}) => {
  const [questions, setQuestions] = useState<ParsedQuestion[]>(initialQuestions);
  const [uploading, setUploading] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();

  const handleImageUpload = async (questionIndex: number, file: File) => {
    try {
      setUploading(prev => ({ ...prev, [questionIndex]: true }));

      // Fazer upload para Supabase Storage (se configurado) ou converter para base64
      const fileExt = file.name.split('.').pop();
      const fileName = `${quizId}_q${questionIndex + 1}_${Math.random()}.${fileExt}`;
      
      // Para este exemplo, vamos converter para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        
        // Atualizar no banco de dados
        const question = questions[questionIndex];
        if (question) {
          const { error } = await supabase
            .from('questions')
            .update({ image_url: imageUrl })
            .eq('quiz_id', quizId)
            .eq('order', question.order);

          if (error) {
            throw error;
          }

          // Atualizar estado local
          setQuestions(prev => prev.map((q, idx) => 
            idx === questionIndex 
              ? { ...q, imageUrl, image: file }
              : q
          ));

          toast({
            title: "Imagem adicionada!",
            description: `Imagem da pergunta ${questionIndex + 1} foi salva.`,
          });
        }
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(prev => ({ ...prev, [questionIndex]: false }));
    }
  };

  const handleRemoveImage = async (questionIndex: number) => {
    try {
      const question = questions[questionIndex];
      if (question) {
        const { error } = await supabase
          .from('questions')
          .update({ image_url: null })
          .eq('quiz_id', quizId)
          .eq('order', question.order);

        if (error) {
          throw error;
        }

        setQuestions(prev => prev.map((q, idx) => 
          idx === questionIndex 
            ? { ...q, imageUrl: undefined, image: undefined }
            : q
        ));

        toast({
          title: "Imagem removida",
          description: `Imagem da pergunta ${questionIndex + 1} foi removida.`,
        });
      }
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a imagem.",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    onNext({ questions });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Inserção de Imagens
        </h2>
        <p className="text-muted-foreground">
          Adicione imagens às suas perguntas (opcional)
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {questions.map((question, index) => (
          <Card key={index} className="p-4">
            <CardContent className="p-0">
              <div className="flex gap-4">
                {/* Image Upload Area */}
                <div className="w-32 h-24 flex-shrink-0">
                  {question.imageUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={question.imageUrl}
                        alt={`Pergunta ${index + 1}`}
                        className="w-full h-full object-cover rounded border"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded cursor-pointer hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(index, file);
                          }
                        }}
                        disabled={uploading[index]}
                      />
                      {uploading[index] ? (
                        <div className="text-xs text-muted-foreground">
                          Enviando...
                        </div>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">
                            Adicionar
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>

                {/* Question Content */}
                <div className="flex-1">
                  <div className="font-medium text-sm mb-2">
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="w-4 h-4" />
          <span>
            {questions.filter(q => q.imageUrl).length} de {questions.length} perguntas com imagem
          </span>
        </div>

        <Button
          onClick={handleNext}
          disabled={isLoading}
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
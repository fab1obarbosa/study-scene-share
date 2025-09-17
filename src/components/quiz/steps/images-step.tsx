import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronRight, Upload, Image as ImageIcon, X, AlertTriangle } from 'lucide-react';
import { ParsedQuestion } from '../create-quiz-wizard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImagesStepProps {
  questions: ParsedQuestion[];
  quizId: string;
  onNext: (data: { questions: ParsedQuestion[] }) => void;
  isLoading: boolean;
}

export const ImagesStep: React.FC<ImagesStepProps> = ({ questions, quizId, onNext, isLoading }) => {
  const [updatedQuestions, setUpdatedQuestions] = useState<ParsedQuestion[]>(questions);
  const [uploading, setUploading] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();

  const validateImageFile = (file: File): string | null => {
    // Verificar formato
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return 'Formato de imagem não permitido. Use apenas JPG ou PNG.';
    }

    // Verificar tamanho (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'O arquivo excede o tamanho máximo de 2 MB.';
    }

    return null;
  };

  const uploadImage = async (file: File, questionIndex: number) => {
    // Validação no frontend
    const validationError = validateImageFile(file);
    if (validationError) {
      toast({
        title: "Erro no arquivo",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setUploading(prev => ({ ...prev, [questionIndex]: true }));

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const filePath = `${userId}/${quizId}/${fileName}`;

      // Upload do arquivo para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('quiz-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('quiz-images')
        .getPublicUrl(filePath);

      // Atualizar a pergunta no banco de dados
      const question = updatedQuestions[questionIndex];
      if (question) {
        const { error: updateError } = await supabase
          .from('questions')
          .update({ image_url: publicUrl })
          .eq('quiz_id', quizId)
          .eq('order', question.order);

        if (updateError) {
          throw updateError;
        }
      }

      // Atualizar o estado local com a URL da imagem
      const newQuestions = [...updatedQuestions];
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        imageUrl: publicUrl
      };
      setUpdatedQuestions(newQuestions);

      toast({
        title: "Sucesso!",
        description: "Imagem carregada com sucesso."
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível carregar a imagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(prev => ({ ...prev, [questionIndex]: false }));
    }
  };

  const removeImage = async (questionIndex: number) => {
    const question = updatedQuestions[questionIndex];
    if (!question.imageUrl) return;

    try {
      // Extrair o path da URL para deletar do storage
      const url = new URL(question.imageUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-3).join('/'); // userId/quizId/fileName
      
      // Deletar arquivo do storage
      await supabase.storage
        .from('quiz-images')
        .remove([filePath]);

      // Atualizar pergunta no banco de dados
      const { error: updateError } = await supabase
        .from('questions')
        .update({ image_url: null })
        .eq('quiz_id', quizId)
        .eq('order', question.order);

      if (updateError) {
        throw updateError;
      }

      // Remover URL da pergunta no estado local
      const newQuestions = [...updatedQuestions];
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        imageUrl: undefined
      };
      setUpdatedQuestions(newQuestions);

      toast({
        title: "Imagem removida",
        description: "A imagem foi removida com sucesso."
      });

    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a imagem.",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, questionIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    uploadImage(file, questionIndex);
    // Limpar o input para permitir upload do mesmo arquivo novamente
    event.target.value = '';
  };

  const handleNext = () => {
    onNext({ questions: updatedQuestions });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Inserção de Imagens
        </h2>
        <p className="text-muted-foreground">
          Adicione imagens às suas perguntas para enriquecer o conteúdo (opcional)
        </p>
      </div>

      <div className="space-y-4">
        {updatedQuestions.map((question, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start gap-4">
              <Badge variant="outline" className="mt-1">
                {index + 1}
              </Badge>
              <div className="flex-1">
                <h4 className="font-medium mb-2">{question.text}</h4>
                <div className="text-sm text-muted-foreground mb-3">
                  {question.options.length} alternativas
                </div>
                
                {/* Preview da imagem ou área de upload */}
                {question.imageUrl ? (
                  <div className="relative inline-block">
                    <img 
                      src={question.imageUrl} 
                      alt={`Imagem da pergunta ${index + 1}`}
                      className="max-w-xs max-h-48 rounded-lg border object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                      title="Remover imagem"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                    {uploading[index] ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Adicione uma imagem à pergunta
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          JPG ou PNG, até 2MB
                        </p>
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, index)}
                          className="hidden"
                          id={`image-upload-${index}`}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Adicionar imagem
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        
        {/* Informações sobre upload */}
        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Requisitos para imagens:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Formatos aceitos: JPG e PNG</li>
                <li>• Tamanho máximo: 2 MB por arquivo</li>
                <li>• As imagens são opcionais para cada pergunta</li>
                <li>• As imagens ficarão vinculadas permanentemente às perguntas</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Botão Avançar */}
      <div className="flex items-center justify-between pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="w-4 h-4" />
          <span>
            {updatedQuestions.filter(q => q.imageUrl).length} de {updatedQuestions.length} perguntas com imagem
          </span>
        </div>

        <Button 
          onClick={handleNext}
          disabled={isLoading || Object.values(uploading).some(Boolean)}
          className="min-w-32"
        >
          {isLoading ? (
            'Salvando...'
          ) : Object.values(uploading).some(Boolean) ? (
            'Aguarde o upload...'
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
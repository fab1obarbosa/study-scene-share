import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuizData } from '../create-quiz-wizard';
import { Play, Home, Share2, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PublishedStepProps {
  quizData: QuizData;
  onTakeQuiz: () => void;
  onBackHome: () => void;
}

export const PublishedStep: React.FC<PublishedStepProps> = ({
  quizData,
  onTakeQuiz,
  onBackHome
}) => {
  const { toast } = useToast();
  const quizUrl = `${window.location.origin}/quiz/${quizData.id}`;
  const whatsappMessage = `Olha que quiz interessante que encontrei: "${quizData.name}" - ${quizUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(quizUrl);
      toast({
        title: "Link copiado!",
        description: "O link do quiz foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleShareWhatsApp = () => {
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="text-center space-y-8">
      {/* Success Message */}
      <div className="space-y-4">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-foreground">
          Parabéns!
        </h2>
        <p className="text-lg text-muted-foreground">
          Seu quiz <strong>"{quizData.name}"</strong> está online!
        </p>
      </div>

      {/* Quiz Link */}
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              Link do Quiz
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm text-left overflow-hidden text-ellipsis">
                {quizUrl}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
        <Button
          onClick={() => onTakeQuiz()}
          size="lg"
          className="w-full sm:w-auto"
          variant="default"
        >
          <Play className="w-5 h-5 mr-2" />
          Fazer o Quiz Agora!
        </Button>

        <Button
          onClick={onBackHome}
          size="lg"
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Home className="w-5 h-5 mr-2" />
          Voltar à Página Inicial
        </Button>

        <Button
          onClick={handleShareWhatsApp}
          size="lg"
          variant="secondary"
          className="w-full sm:w-auto"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Convidar para Participar
        </Button>
      </div>

      {/* Additional Info */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          <ExternalLink className="w-4 h-4 inline mr-1" />
          Compartilhe este link para que outras pessoas possam fazer seu quiz
        </p>
        <p>
          Você pode acessar seus quizzes criados a qualquer momento no dashboard
        </p>
      </div>
    </div>
  );
};
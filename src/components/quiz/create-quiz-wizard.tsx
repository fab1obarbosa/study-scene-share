import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { QuizDataStep } from './steps/quiz-data-step';
import { QuestionsStep } from './steps/questions-step';
import { ImagesStep } from './steps/images-step';
import { ReviewStep } from './steps/review-step';
import { PublishedStep } from './steps/published-step';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateQuizWizardProps {
  onBack: () => void;
  onQuizCreated: () => void;
  userId: string;
}

export interface QuizData {
  id?: string;
  name: string;
  category: string;
  description: string;
  questionCount: number;
  rawText: string;
  status: 'draft' | 'published';
}

export interface ParsedQuestion {
  text: string;
  order: number;
  image?: File;
  imageUrl?: string;
  options: {
    label: string;
    text: string;
    is_correct: boolean;
  }[];
}

const STEPS = [
  { title: 'Dados do Quiz', description: 'Informações básicas' },
  { title: 'Perguntas', description: 'Adicionar conteúdo' },
  { title: 'Imagens', description: 'Anexar imagens' },
  { title: 'Revisão', description: 'Conferir tudo' },
  { title: 'Publicado', description: 'Quiz finalizado' }
];

export const CreateQuizWizard: React.FC<CreateQuizWizardProps> = ({
  onBack,
  onQuizCreated,
  userId
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [quizData, setQuizData] = useState<QuizData>({
    name: '',
    category: '',
    description: '',
    questionCount: 10,
    rawText: '',
    status: 'draft'
  });
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateQuizData = useCallback((data: Partial<QuizData>) => {
    setQuizData(prev => ({ ...prev, ...data }));
  }, []);

  const handleStepComplete = async (stepData: any) => {
    setIsLoading(true);
    
    try {
      if (currentStep === 1) {
        // Salvar dados básicos do quiz
        const { data: quiz, error } = await supabase
          .from('quizzes')
          .upsert({
            id: quizData.id,
            user_id: userId,
            name: stepData.name,
            category: stepData.category,
            description: stepData.description,
            question_count: stepData.questionCount,
            status: 'draft'
          })
          .select()
          .single();

        if (error) throw error;

        updateQuizData({ ...stepData, id: quiz.id });
        setCurrentStep(2);
        
      } else if (currentStep === 2) {
        // Salvar perguntas e alternativas
        if (!quizData.id) throw new Error('Quiz ID não encontrado');

        // Deletar perguntas existentes
        await supabase
          .from('questions')
          .delete()
          .eq('quiz_id', quizData.id);

        // Inserir novas perguntas
        for (const question of stepData.questions) {
          const { data: questionData, error: questionError } = await supabase
            .from('questions')
            .insert({
              quiz_id: quizData.id,
              text: question.text,
              order: question.order
            })
            .select()
            .single();

          if (questionError) throw questionError;

          // Inserir alternativas
          const optionsToInsert = question.options.map(option => ({
            question_id: questionData.id,
            label: option.label,
            text: option.text,
            is_correct: option.is_correct
          }));

          const { error: optionsError } = await supabase
            .from('options')
            .insert(optionsToInsert);

          if (optionsError) throw optionsError;
        }

        setParsedQuestions(stepData.questions);
        updateQuizData({ rawText: stepData.rawText });
        setCurrentStep(3);
        
      } else if (currentStep === 3) {
        // Salvar imagens - as URLs já foram salvas durante o upload
        // Apenas atualizar as URLs no banco se necessário
        if (stepData.questions) {
          for (const question of stepData.questions) {
            if (question.imageUrl && question.order) {
              // Garantir que a URL da imagem está salva no banco
              await supabase
                .from('questions')
                .update({ image_url: question.imageUrl })
                .eq('quiz_id', quizData.id)
                .eq('order', question.order);
            }
          }
        }
        
        setParsedQuestions(stepData.questions);
        setCurrentStep(4);
        
      } else if (currentStep === 4) {
        // Publicar quiz
        if (!quizData.id) throw new Error('Quiz ID não encontrado');

        const { error } = await supabase
          .from('quizzes')
          .update({ status: 'published' })
          .eq('id', quizData.id);

        if (error) throw error;

        updateQuizData({ status: 'published' });
        setCurrentStep(5);
      }

      toast({
        title: "Sucesso!",
        description: "Etapa concluída com sucesso.",
      });
      
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <QuizDataStep
            data={quizData}
            onNext={handleStepComplete}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <QuestionsStep
            quizData={quizData}
            onNext={handleStepComplete}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <ImagesStep
            questions={parsedQuestions}
            quizId={quizData.id!}
            onNext={handleStepComplete}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <ReviewStep
            quizData={quizData}
            questions={parsedQuestions}
            onPublish={() => handleStepComplete({})}
            isLoading={isLoading}
          />
        );
      case 5:
        return (
          <PublishedStep
            quizData={quizData}
            onTakeQuiz={() => {
              // Implementar navegação para fazer o quiz
              console.log('Fazer quiz:', quizData.id);
            }}
            onBackHome={onQuizCreated}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Criar Novo Quiz</h1>
          <div className="w-20" />
        </div>

        {/* Stepper */}
        <Stepper steps={STEPS} currentStep={currentStep} className="mb-8" />

        {/* Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep > 1 && currentStep < 5 && (
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
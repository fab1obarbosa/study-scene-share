import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuizData } from '../create-quiz-wizard';
import { ChevronRight } from 'lucide-react';

interface QuizDataStepProps {
  data: QuizData;
  onNext: (data: any) => void;
  isLoading: boolean;
}

interface FormData {
  name: string;
  category: string;
  description: string;
  questionCount: number;
}

const CATEGORIES = [
  'Geral',
  'História',
  'Geografia',
  'Ciências',
  'Matemática',
  'Literatura',
  'Esportes',
  'Cinema',
  'Música',
  'Tecnologia'
];

export const QuizDataStep: React.FC<QuizDataStepProps> = ({ data, onNext, isLoading }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: data.name,
      category: data.category,
      description: data.description,
      questionCount: data.questionCount
    }
  });

  const selectedCategory = watch('category');

  const onSubmit = (formData: FormData) => {
    onNext(formData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Dados do seu Quiz
        </h2>
        <p className="text-muted-foreground">
          Vamos começar com as informações básicas do seu quiz
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Nome do Quiz */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Quiz *</Label>
            <Input
              id="name"
              placeholder="Ex: Quiz de História do Brasil"
              {...register('name', { 
                required: 'Nome do quiz é obrigatório',
                minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' }
              })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>
        </div>

        {/* Quantidade de Perguntas */}
        <div className="space-y-2">
          <Label htmlFor="questionCount">Quantidade de Perguntas</Label>
          <Select
            value={watch('questionCount')?.toString()}
            onValueChange={(value) => setValue('questionCount', parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha a quantidade" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} pergunta{num > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Máximo de 20 perguntas por quiz
          </p>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            placeholder="Descreva brevemente o conteúdo do seu quiz..."
            rows={3}
            {...register('description')}
          />
        </div>

        {/* Botão Avançar */}
        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={isLoading || !watch('name') || !watch('category')}
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
      </form>
    </div>
  );
};
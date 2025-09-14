interface ParsedQuestion {
  text: string;
  options: {
    label: string;
    text: string;
    is_correct: boolean;
  }[];
}

interface ParsedQuiz {
  title: string;
  description: string;
  category: string;
  questions: ParsedQuestion[];
}

export function parseQuizRawText(rawText: string): ParsedQuiz {
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const questions: ParsedQuestion[] = [];
  let currentQuestion: string = '';
  let currentOptions: Array<{ label: string; text: string; is_correct: boolean }> = [];
  let answerKey: { [key: number]: string } = {};
  
  // Procurar por gabarito no final do texto
  const gabaritoPattern = /^(gabarito|respostas?|answer\s*key):\s*/i;
  const gabaritoLine = lines.find(line => gabaritoPattern.test(line));
  
  if (gabaritoLine) {
    const gabaritoText = gabaritoLine.replace(gabaritoPattern, '');
    // Parse formato "1-A, 2-B, 3-C" ou "1.A 2.B 3.C"
    const matches = gabaritoText.match(/(\d+)[-.]?\s*([A-Za-z])/g);
    if (matches) {
      matches.forEach(match => {
        const [, num, letter] = match.match(/(\d+)[-.]?\s*([A-Za-z])/) || [];
        if (num && letter) {
          answerKey[parseInt(num)] = letter.toUpperCase();
        }
      });
    }
  }
  
  let questionNumber = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip gabarito line
    if (gabaritoPattern.test(line)) continue;
    
    // Detectar início de pergunta (formato numerado)
    const questionPattern = /^(\d+)\.?\s+(.+)/;
    const questionMatch = line.match(questionPattern);
    
    if (questionMatch) {
      // Salvar pergunta anterior se existir
      if (currentQuestion && currentOptions.length > 0) {
        questions.push({
          text: currentQuestion,
          options: [...currentOptions]
        });
      }
      
      questionNumber = parseInt(questionMatch[1]);
      currentQuestion = questionMatch[2];
      currentOptions = [];
      continue;
    }
    
    // Detectar alternativas
    const optionPattern = /^([A-Za-z])\)\s*(.+?)(\s*\*|\s*\(correta?\)|\s*✓|\s*--\s*corret[ao])?$/i;
    const optionMatch = line.match(optionPattern);
    
    if (optionMatch && currentQuestion) {
      const label = optionMatch[1].toUpperCase();
      const text = optionMatch[2].trim();
      const isMarkedCorrect = !!optionMatch[3];
      
      // Determinar se é correta baseado em: marcação explícita ou gabarito
      let isCorrect = isMarkedCorrect;
      if (!isCorrect && answerKey[questionNumber]) {
        isCorrect = label === answerKey[questionNumber];
      }
      
      currentOptions.push({
        label,
        text,
        is_correct: isCorrect
      });
    }
  }
  
  // Adicionar última pergunta
  if (currentQuestion && currentOptions.length > 0) {
    questions.push({
      text: currentQuestion,
      options: [...currentOptions]
    });
  }
  
  // Normalizar: garantir que cada pergunta tenha exatamente uma resposta correta
  questions.forEach(question => {
    const correctCount = question.options.filter(opt => opt.is_correct).length;
    
    // Se nenhuma marcada como correta, marcar a primeira (fallback)
    if (correctCount === 0 && question.options.length > 0) {
      question.options[0].is_correct = true;
    }
    
    // Se múltiplas marcadas, manter apenas a primeira
    if (correctCount > 1) {
      let firstFound = false;
      question.options.forEach(opt => {
        if (opt.is_correct && firstFound) {
          opt.is_correct = false;
        } else if (opt.is_correct) {
          firstFound = true;
        }
      });
    }
  });
  
  // Limitar a 20 perguntas
  const limitedQuestions = questions.slice(0, 20);
  
  return {
    title: `Quiz ${new Date().toLocaleDateString()}`,
    description: `Quiz criado automaticamente com ${limitedQuestions.length} pergunta(s)`,
    category: 'Geral',
    questions: limitedQuestions
  };
}

// Validar se o parsing foi bem sucedido
export function validateParsedQuiz(parsedQuiz: ParsedQuiz): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (parsedQuiz.questions.length === 0) {
    errors.push('Nenhuma pergunta foi detectada no texto');
  }
  
  parsedQuiz.questions.forEach((question, index) => {
    if (!question.text.trim()) {
      errors.push(`Pergunta ${index + 1} está vazia`);
    }
    
    if (question.options.length < 2) {
      errors.push(`Pergunta ${index + 1} deve ter pelo menos 2 alternativas`);
    }
    
    const correctOptions = question.options.filter(opt => opt.is_correct);
    if (correctOptions.length !== 1) {
      errors.push(`Pergunta ${index + 1} deve ter exatamente 1 alternativa correta`);
    }
    
    question.options.forEach((option, optIndex) => {
      if (!option.text.trim()) {
        errors.push(`Alternativa ${option.label} da pergunta ${index + 1} está vazia`);
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
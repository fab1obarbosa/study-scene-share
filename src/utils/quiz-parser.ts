interface ParsedQuestion {
  text: string;
  statements?: string[]; // Para afirmações I, II, III
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
  let currentStatements: string[] = [];
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
  let currentOptionText = '';
  let currentOptionLabel = '';
  
  // Função auxiliar para normalizar texto
  const normalizeText = (text: string): string => {
    return text
      .replace(/\s+/g, ' ') // Múltiplos espaços para um único
      .replace(/\|\|\|/g, 'III') // Corrigir ||| para III
      .replace(/\|\|/g, 'II') // Corrigir || para II
      .replace(/\|/g, 'I') // Corrigir | para I
      .trim();
  };
  
  // Função para detectar algarismos romanos
  const romanNumeralPattern = /^(I{1,3}|IV|V|VI{0,3}|IX|X{1,3})[\.\-\)]\s*(.+)/i;
  
  for (let i = 0; i < lines.length; i++) {
    let line = normalizeText(lines[i]);
    
    // Skip gabarito line
    if (gabaritoPattern.test(line)) continue;
    
    // Detectar início de pergunta - formatos variados
    const questionPatterns = [
      /^(\d+)[\.\-\)]\s*(.+)/, // 1. ou 1- ou 1)
      /^([A-Z])[\.\)]\s*(.+)/, // A. ou A)
    ];
    
    let questionMatch = null;
    for (const pattern of questionPatterns) {
      questionMatch = line.match(pattern);
      if (questionMatch) break;
    }
    
    if (questionMatch) {
      // Salvar pergunta anterior se existir
      if (currentQuestion && (currentStatements.length > 0 || currentOptions.length > 0)) {
        const questionData: ParsedQuestion = {
          text: currentQuestion,
          options: [...currentOptions]
        };
        if (currentStatements.length > 0) {
          questionData.statements = [...currentStatements];
        }
        questions.push(questionData);
      }
      
      // Nova pergunta
      if (questionMatch[1].match(/\d+/)) {
        questionNumber = parseInt(questionMatch[1]);
      }
      currentQuestion = questionMatch[2];
      currentStatements = [];
      currentOptions = [];
      currentOptionText = '';
      currentOptionLabel = '';
      continue;
    }
    
    // Detectar afirmações I, II, III
    const romanMatch = line.match(romanNumeralPattern);
    if (romanMatch && currentQuestion) {
      currentStatements.push(`${romanMatch[1].toUpperCase()}. ${romanMatch[2]}`);
      continue;
    }
    
    // Detectar alternativas - formatos variados
    const optionPatterns = [
      /^([A-Za-z])[\)\.]?\s*(.+?)(\s*\*|\s*\(correta?\)|\s*✓|\s*--\s*corret[ao])?$/i, // A) ou A.
      /^(\d+)[\)\.]?\s*(.+?)(\s*\*|\s*\(correta?\)|\s*✓|\s*--\s*corret[ao])?$/i, // 1) ou 1.
    ];
    
    let optionMatch = null;
    for (const pattern of optionPatterns) {
      optionMatch = line.match(pattern);
      if (optionMatch) break;
    }
    
    if (optionMatch && currentQuestion) {
      // Finalizar alternativa anterior se existir
      if (currentOptionLabel && currentOptionText) {
        let isCorrect = false;
        if (answerKey[questionNumber]) {
          isCorrect = currentOptionLabel === answerKey[questionNumber];
        }
        
        currentOptions.push({
          label: currentOptionLabel,
          text: currentOptionText.trim(),
          is_correct: isCorrect
        });
      }
      
      // Nova alternativa
      currentOptionLabel = optionMatch[1].toUpperCase();
      currentOptionText = optionMatch[2].trim();
      const isMarkedCorrect = !!optionMatch[3];
      
      // Se marcada explicitamente como correta
      if (isMarkedCorrect) {
        currentOptions.push({
          label: currentOptionLabel,
          text: currentOptionText,
          is_correct: true
        });
        currentOptionLabel = '';
        currentOptionText = '';
      }
      continue;
    }
    
    // Se não é início de pergunta nem alternativa, pode ser continuação
    if (currentOptionLabel && currentOptionText) {
      // Continuação da alternativa atual
      currentOptionText += ` ${line}`;
    } else if (currentQuestion && !currentStatements.length && !currentOptions.length) {
      // Continuação da pergunta
      currentQuestion += ` ${line}`;
    }
  }
  
  // Finalizar última alternativa se existir
  if (currentOptionLabel && currentOptionText) {
    let isCorrect = false;
    if (answerKey[questionNumber]) {
      isCorrect = currentOptionLabel === answerKey[questionNumber];
    }
    
    currentOptions.push({
      label: currentOptionLabel,
      text: currentOptionText.trim(),
      is_correct: isCorrect
    });
  }
  
  // Adicionar última pergunta
  if (currentQuestion && (currentStatements.length > 0 || currentOptions.length > 0)) {
    const questionData: ParsedQuestion = {
      text: currentQuestion,
      options: [...currentOptions]
    };
    if (currentStatements.length > 0) {
      questionData.statements = [...currentStatements];
    }
    questions.push(questionData);
  }
  
  // Processar questões de verdadeiro/falso
  questions.forEach(question => {
    const hasVerdadeiroFalso = question.options.some(opt => 
      /^(verdadeiro|falso|true|false|correto|incorreto|certo|errado)$/i.test(opt.text.trim())
    );
    
    if (hasVerdadeiroFalso || question.options.length === 2) {
      // É uma questão binária, garantir que tenha exatamente 2 opções
      if (question.options.length > 2) {
        question.options = question.options.slice(0, 2);
      }
    }
  });
  
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
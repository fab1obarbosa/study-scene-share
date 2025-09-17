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
  let isInQuestion = false;
  let isInOptions = false;
  
  // Função auxiliar para normalizar texto
  const normalizeText = (text: string): string => {
    return text
      .replace(/\s+/g, ' ') // Múltiplos espaços para um único
      .replace(/\|\|\|/g, 'III') // Corrigir ||| para III
      .replace(/\|\|/g, 'II') // Corrigir || para II
      .replace(/\|/g, 'I') // Corrigir | para I
      .trim();
  };

  // Função para detectar se uma linha é uma pergunta
  const isQuestionLine = (line: string): { isQuestion: boolean; number?: number; text?: string } => {
    const patterns = [
      // Padrões numéricos: 1. 1- 1) 1 - 1 . 1 ) (1) [1]
      /^(\d+)\s*[\.\-\)\]\}]\s*(.+)/,
      /^[\(\[\{](\d+)[\)\]\}]\s*(.+)/,
      /^(\d+)\s+(.+)/,
      // Padrões alfabéticos: A. A- A) A ) (A) [A]
      /^([A-Z])\s*[\.\-\)\]\}]\s*(.+)/i,
      /^[\(\[\{]([A-Z])[\)\]\}]\s*(.+)/i,
      /^([A-Z])\s+(.+)/i,
      // Padrões especiais: Question 1, Questão 1, Pergunta 1
      /^(question|questão|pergunta)\s*(\d+)\s*[\.\-\:]\s*(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const numberOrLetter = match[1];
        const text = match[3] || match[2];
        
        // Se for número, usar como número da questão
        if (/^\d+$/.test(numberOrLetter)) {
          return { isQuestion: true, number: parseInt(numberOrLetter), text };
        }
        // Se for letra, tentar converter para número (A=1, B=2, etc)
        else if (/^[A-Z]$/i.test(numberOrLetter)) {
          const letterNumber = numberOrLetter.toUpperCase().charCodeAt(0) - 64;
          return { isQuestion: true, number: letterNumber, text };
        }
      }
    }

    return { isQuestion: false };
  };

  // Função para detectar se uma linha é uma alternativa
  const isOptionLine = (line: string): { isOption: boolean; label?: string; text?: string; isCorrect?: boolean } => {
    const patterns = [
      // Padrões com letras: a) A) a. A. a- A- (a) [A]
      /^([A-Za-z])\s*[\)\.\-\]\}]\s*(.+?)(\s*\*|\s*\(correta?\)|\s*✓|\s*--\s*corret[ao]|\s*\(certa?\))?$/i,
      /^[\(\[\{]([A-Za-z])[\)\]\}]\s*(.+?)(\s*\*|\s*\(correta?\)|\s*✓|\s*--\s*corret[ao]|\s*\(certa?\))?$/i,
      // Padrões com números: 1) 2) 1. 2. (1) [2]
      /^(\d+)\s*[\)\.\-\]\}]\s*(.+?)(\s*\*|\s*\(correta?\)|\s*✓|\s*--\s*corret[ao]|\s*\(certa?\))?$/i,
      /^[\(\[\{](\d+)[\)\]\}]\s*(.+?)(\s*\*|\s*\(correta?\)|\s*✓|\s*--\s*corret[ao]|\s*\(certa?\))?$/i,
      // Padrões especiais: - texto, * texto, • texto
      /^[\-\*\•]\s*(.+?)(\s*\*|\s*\(correta?\)|\s*✓|\s*--\s*corret[ao]|\s*\(certa?\))?$/i,
      // Apenas texto com marcação de correto
      /^(.+?)(\s*\*|\s*\(correta?\)|\s*✓|\s*--\s*corret[ao]|\s*\(certa?\))$/i,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const match = line.match(patterns[i]);
      if (match) {
        let label = match[1];
        let text = match[2] || match[1];
        const isCorrect = !!match[3] || !!(match[2] && match[2]);

        // Para padrões sem label explícito, gerar label automático
        if (i >= 4) { // Padrões especiais sem label
          label = String.fromCharCode(65 + (currentOptions.length)); // A, B, C...
          text = match[1];
        }

        // Normalizar label
        if (/^\d+$/.test(label)) {
          label = String.fromCharCode(64 + parseInt(label)); // 1->A, 2->B
        }

        return { 
          isOption: true, 
          label: label.toUpperCase(), 
          text: text.trim(),
          isCorrect: isCorrect
        };
      }
    }

    return { isOption: false };
  };

  // Função para detectar afirmações I, II, III
  const isStatementLine = (line: string): { isStatement: boolean; text?: string } => {
    const romanPattern = /^(I{1,3}|IV|V|VI{0,3}|IX|X{1,3})\s*[\.\-\)\]\}]\s*(.+)/i;
    const match = line.match(romanPattern);
    
    if (match) {
      return { isStatement: true, text: `${match[1].toUpperCase()}. ${match[2]}` };
    }

    return { isStatement: false };
  };

  // Função para salvar pergunta atual
  const saveCurrentQuestion = () => {
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
  };

  // Processar linhas
  for (let i = 0; i < lines.length; i++) {
    let line = normalizeText(lines[i]);
    
    // Skip gabarito line
    if (gabaritoPattern.test(line)) continue;
    
    // Verificar se é uma nova pergunta
    const questionCheck = isQuestionLine(line);
    if (questionCheck.isQuestion) {
      // Salvar pergunta anterior
      saveCurrentQuestion();
      
      // Iniciar nova pergunta
      questionNumber = questionCheck.number || questionNumber + 1;
      currentQuestion = questionCheck.text || '';
      currentStatements = [];
      currentOptions = [];
      isInQuestion = true;
      isInOptions = false;
      continue;
    }

    // Verificar se é uma afirmação
    const statementCheck = isStatementLine(line);
    if (statementCheck.isStatement && isInQuestion) {
      currentStatements.push(statementCheck.text!);
      continue;
    }

    // Verificar se é uma alternativa
    const optionCheck = isOptionLine(line);
    if (optionCheck.isOption && isInQuestion) {
      let isCorrect = optionCheck.isCorrect || false;
      
      // Verificar gabarito
      if (!isCorrect && answerKey[questionNumber]) {
        isCorrect = optionCheck.label === answerKey[questionNumber];
      }

      currentOptions.push({
        label: optionCheck.label!,
        text: optionCheck.text!,
        is_correct: isCorrect
      });
      
      isInOptions = true;
      continue;
    }

    // Se não é pergunta, afirmação ou alternativa, pode ser continuação
    if (isInQuestion && !isInOptions && currentQuestion) {
      // Continuação da pergunta
      currentQuestion += ` ${line}`;
    } else if (isInOptions && currentOptions.length > 0) {
      // Continuação da última alternativa
      const lastOption = currentOptions[currentOptions.length - 1];
      lastOption.text += ` ${line}`;
    }
  }

  // Salvar última pergunta
  saveCurrentQuestion();

  // Processar questões de verdadeiro/falso
  questions.forEach(question => {
    const hasVerdadeiroFalso = question.options.some(opt => 
      /^(verdadeiro|falso|true|false|correto|incorreto|certo|errado|v|f)$/i.test(opt.text.trim())
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
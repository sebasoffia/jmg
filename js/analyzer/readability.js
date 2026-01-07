/**
 * Módulo de análisis de legibilidad para español
 * Implementa el índice Flesch-Szigriszt adaptado al español
 */

/**
 * Cuenta las sílabas de una palabra en español
 * Implementación basada en reglas de silabeo español
 */
export function countSyllablesSpanish(word) {
  if (!word || word.length === 0) return 0;

  word = word.toLowerCase().trim();

  // Vocales
  const vowels = 'aeiouáéíóúü';
  const strongVowels = 'aeoáéó';
  const weakVowels = 'iuíúü';

  let syllables = 0;
  let prevWasVowel = false;
  let prevVowel = '';

  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const isVowel = vowels.includes(char);

    if (isVowel) {
      if (!prevWasVowel) {
        // Nueva sílaba
        syllables++;
      } else {
        // Verificar si es diptongo, triptongo o hiato
        const isStrong = strongVowels.includes(char);
        const prevIsStrong = strongVowels.includes(prevVowel);

        // Hiato: dos vocales fuertes = 2 sílabas
        if (isStrong && prevIsStrong) {
          syllables++;
        }
        // Hiato por acento: vocal débil acentuada + fuerte
        else if (weakVowels.includes(char) && 'íú'.includes(char) && prevIsStrong) {
          syllables++;
        }
        else if (isStrong && 'íú'.includes(prevVowel)) {
          syllables++;
        }
        // Diptongo o triptongo: no añadir sílaba
      }
      prevVowel = char;
    }
    prevWasVowel = isVowel;
  }

  // Mínimo 1 sílaba por palabra
  return Math.max(1, syllables);
}

/**
 * Cuenta el total de sílabas en un texto
 */
export function countTotalSyllables(text) {
  const words = getWords(text);
  return words.reduce((total, word) => total + countSyllablesSpanish(word), 0);
}

/**
 * Extrae palabras de un texto (solo palabras, sin puntuación)
 */
export function getWords(text) {
  if (!text) return [];
  // Eliminar URLs
  text = text.replace(/https?:\/\/[^\s]+/g, '');
  // Extraer solo palabras
  const words = text.match(/[a-záéíóúüñ]+/gi) || [];
  return words.filter(w => w.length > 0);
}

/**
 * Cuenta palabras en un texto
 */
export function countWords(text) {
  return getWords(text).length;
}

/**
 * Extrae oraciones de un texto
 */
export function getSentences(text) {
  if (!text) return [];
  // Dividir por puntos, signos de interrogación y exclamación
  // Preservar abreviaciones comunes
  const cleaned = text
    .replace(/\b(Sr|Sra|Dr|Dra|Ud|Uds|etc|vs|ej|p)\./gi, '$1<DOT>')
    .replace(/\d+\.\d+/g, match => match.replace('.', '<DOT>'));

  const sentences = cleaned
    .split(/[.!?]+/)
    .map(s => s.replace(/<DOT>/g, '.').trim())
    .filter(s => s.length > 0);

  return sentences;
}

/**
 * Cuenta oraciones en un texto
 */
export function countSentences(text) {
  return getSentences(text).length;
}

/**
 * Cuenta párrafos en un texto
 */
export function countParagraphs(text) {
  if (!text) return 0;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  return paragraphs.length;
}

/**
 * Calcula el promedio de palabras por oración
 */
export function getWordsPerSentence(text) {
  const sentences = countSentences(text);
  if (sentences === 0) return 0;
  return Math.round((countWords(text) / sentences) * 10) / 10;
}

/**
 * Calcula el índice Flesch-Szigriszt para español
 * IFSZ = 206.84 - (62.3 × sílabas/palabras) - (palabras/oraciones)
 *
 * Escala:
 * 80-100: Muy fácil
 * 60-80: Fácil
 * 40-60: Normal
 * 20-40: Difícil
 * 0-20: Muy difícil
 */
export function calculateFleschSzigriszt(text) {
  const words = countWords(text);
  const sentences = countSentences(text);
  const syllables = countTotalSyllables(text);

  if (words === 0 || sentences === 0) return 0;

  const syllablesPerWord = syllables / words;
  const wordsPerSentence = words / sentences;

  const score = 206.84 - (62.3 * syllablesPerWord) - wordsPerSentence;

  // Limitar entre 0 y 100
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

/**
 * Interpreta el índice Flesch-Szigriszt
 */
export function getReadingLevel(score) {
  if (score >= 80) return { level: 'muy_facil', label: 'Muy fácil', description: 'Educación básica' };
  if (score >= 60) return { level: 'facil', label: 'Fácil', description: 'Educación media' };
  if (score >= 40) return { level: 'normal', label: 'Normal', description: 'Bachillerato' };
  if (score >= 20) return { level: 'dificil', label: 'Difícil', description: 'Universitario' };
  return { level: 'muy_dificil', label: 'Muy difícil', description: 'Especializado' };
}

/**
 * Calcula tiempo de lectura estimado (minutos)
 * Basado en 200 palabras por minuto para español
 */
export function getReadingTime(text) {
  const words = countWords(text);
  const minutes = words / 200;
  return Math.max(1, Math.ceil(minutes));
}

/**
 * Encuentra oraciones largas (más de cierto umbral de palabras)
 */
export function findLongSentences(text, threshold = 25) {
  const sentences = getSentences(text);
  const results = [];

  let charIndex = 0;
  for (const sentence of sentences) {
    const wordCount = countWords(sentence);
    const index = text.indexOf(sentence, charIndex);

    if (wordCount > threshold) {
      results.push({
        sentence,
        wordCount,
        index: index >= 0 ? index : charIndex,
        severity: wordCount > 40 ? 'high' : 'medium',
        suggestion: wordCount > 40
          ? 'Esta oración es muy larga. Considera dividirla en 2-3 oraciones más cortas.'
          : 'Esta oración es algo larga. Considera simplificarla.'
      });
    }

    charIndex = index >= 0 ? index + sentence.length : charIndex + sentence.length;
  }

  return results;
}

/**
 * Encuentra oraciones complejas (múltiples comas, subordinadas)
 */
export function findComplexSentences(text) {
  const sentences = getSentences(text);
  const results = [];

  let charIndex = 0;
  for (const sentence of sentences) {
    const commaCount = (sentence.match(/,/g) || []).length;
    const subordinates = (sentence.match(/\b(que|quien|cual|donde|cuando|como|porque|aunque|mientras|si)\b/gi) || []).length;
    const wordCount = countWords(sentence);
    const index = text.indexOf(sentence, charIndex);

    // Oración corta con muchas comas = compleja
    const isComplex = (commaCount > 2 && wordCount < 30) ||
                      (subordinates > 2) ||
                      (commaCount > 3);

    if (isComplex) {
      results.push({
        sentence,
        commaCount,
        subordinates,
        index: index >= 0 ? index : charIndex,
        suggestion: 'Esta oración tiene una estructura compleja. Considera dividirla para mejorar la claridad.'
      });
    }

    charIndex = index >= 0 ? index + sentence.length : charIndex + sentence.length;
  }

  return results;
}

/**
 * Genera un reporte completo de legibilidad
 */
export function analyzeReadability(text, options = {}) {
  const {
    targetFleschMin = 60,
    targetFleschMax = 80,
    targetWordsPerSentence = 20,
    longSentenceThreshold = 25
  } = options;

  const words = countWords(text);
  const sentences = countSentences(text);
  const paragraphs = countParagraphs(text);
  const syllables = countTotalSyllables(text);
  const wordsPerSentence = getWordsPerSentence(text);
  const fleschScore = calculateFleschSzigriszt(text);
  const readingLevel = getReadingLevel(fleschScore);
  const readingTime = getReadingTime(text);
  const longSentences = findLongSentences(text, longSentenceThreshold);
  const complexSentences = findComplexSentences(text);

  // Calcular puntuación de legibilidad (0-100)
  let score = 100;

  // Penalizar si Flesch está fuera del rango objetivo
  if (fleschScore < targetFleschMin) {
    score -= Math.min(30, (targetFleschMin - fleschScore) * 0.5);
  } else if (fleschScore > targetFleschMax) {
    // Muy fácil no es tan malo, pequeña penalización
    score -= Math.min(10, (fleschScore - targetFleschMax) * 0.2);
  }

  // Penalizar por oraciones largas
  score -= longSentences.length * 3;

  // Penalizar por oraciones complejas
  score -= complexSentences.length * 4;

  // Penalizar si promedio de palabras/oración es alto
  if (wordsPerSentence > targetWordsPerSentence) {
    score -= (wordsPerSentence - targetWordsPerSentence) * 2;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    metrics: {
      words,
      sentences,
      paragraphs,
      syllables,
      wordsPerSentence,
      fleschScore,
      readingTime
    },
    readingLevel,
    issues: {
      longSentences,
      complexSentences
    },
    score,
    targets: {
      fleschMin: targetFleschMin,
      fleschMax: targetFleschMax,
      wordsPerSentence: targetWordsPerSentence
    }
  };
}

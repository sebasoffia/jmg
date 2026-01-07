/**
 * Coordinador principal de análisis
 * Combina readability y style en un solo reporte
 */

import { analyzeReadability } from './readability.js';
import { analyzeStyle, getAllIssuesSorted } from './style.js';

/**
 * Configuraciones por tipo de contenido
 */
export const CONTENT_TYPE_CONFIGS = {
  blog: {
    name: 'Blog Post',
    targetFleschMin: 60,
    targetFleschMax: 80,
    targetWordsPerSentence: 20,
    longSentenceThreshold: 25
  },
  landing: {
    name: 'Landing Page',
    targetFleschMin: 70,
    targetFleschMax: 90,
    targetWordsPerSentence: 15,
    longSentenceThreshold: 20
  },
  email: {
    name: 'Email Marketing',
    targetFleschMin: 70,
    targetFleschMax: 85,
    targetWordsPerSentence: 18,
    longSentenceThreshold: 22
  },
  copy: {
    name: 'Copy Publicitario',
    targetFleschMin: 80,
    targetFleschMax: 100,
    targetWordsPerSentence: 12,
    longSentenceThreshold: 18
  }
};

/**
 * Análisis completo de contenido
 */
export function analyzeContent(text, options = {}) {
  const {
    contentType = 'blog',
    checkPassive = true,
    checkAdverbs = true,
    checkWeakWords = true,
    checkFillers = true
  } = options;

  // Obtener configuración según tipo de contenido
  const config = CONTENT_TYPE_CONFIGS[contentType] || CONTENT_TYPE_CONFIGS.blog;

  // Análisis de legibilidad
  const readability = analyzeReadability(text, config);

  // Análisis de estilo
  const style = analyzeStyle(text, {
    checkPassive,
    checkAdverbs,
    checkWeakWords,
    checkFillers
  });

  // Calcular puntuación global (promedio ponderado)
  const overallScore = Math.round(
    (readability.score * 0.5) + (style.score * 0.5)
  );

  // Determinar el nivel de calidad
  let quality;
  if (overallScore >= 80) {
    quality = { level: 'excellent', label: 'Excelente', color: 'green' };
  } else if (overallScore >= 60) {
    quality = { level: 'good', label: 'Bueno', color: 'blue' };
  } else if (overallScore >= 40) {
    quality = { level: 'needs_work', label: 'Necesita mejoras', color: 'yellow' };
  } else {
    quality = { level: 'poor', label: 'Requiere revisión', color: 'red' };
  }

  // Combinar todos los issues ordenados por posición
  const allIssues = getAllIssuesSorted(style);

  // Añadir issues de legibilidad
  for (const ls of readability.issues.longSentences) {
    allIssues.push({
      ...ls,
      category: 'long_sentence',
      index: ls.index
    });
  }
  for (const cs of readability.issues.complexSentences) {
    allIssues.push({
      ...cs,
      category: 'complex_sentence',
      index: cs.index
    });
  }

  // Ordenar por índice
  allIssues.sort((a, b) => a.index - b.index);

  // Generar resumen de problemas
  const summary = {
    total: allIssues.length,
    byCategory: {
      passive: style.totals.passive,
      adverbs: style.totals.adverbs,
      vague: style.totals.vague,
      intensifiers: style.totals.intensifiers,
      fillers: style.totals.fillers,
      longSentences: readability.issues.longSentences.length,
      complexSentences: readability.issues.complexSentences.length
    }
  };

  return {
    // Puntuaciones
    score: overallScore,
    quality,
    scores: {
      readability: readability.score,
      style: style.score
    },

    // Métricas
    metrics: readability.metrics,
    readingLevel: readability.readingLevel,

    // Issues detallados
    issues: allIssues,
    summary,

    // Configuración usada
    config: {
      contentType,
      ...config
    },

    // Datos raw para acceso detallado
    _raw: {
      readability,
      style
    }
  };
}

/**
 * Genera texto con marcadores HTML para highlighting
 */
export function highlightIssues(text, issues) {
  if (!issues || issues.length === 0) return text;

  // Ordenar issues por índice descendente para insertar desde el final
  const sortedIssues = [...issues].sort((a, b) => b.index - a.index);

  let result = text;

  for (const issue of sortedIssues) {
    const { index, category } = issue;
    const content = issue.word || issue.phrase || issue.sentence || '';

    if (!content || index < 0) continue;

    // Determinar clase de color según categoría
    const colorClass = getCategoryColorClass(category);

    // Insertar marcadores
    const before = result.substring(0, index);
    const after = result.substring(index + content.length);

    result = `${before}<mark class="${colorClass}" data-category="${category}" title="${issue.suggestion || ''}">${content}</mark>${after}`;
  }

  return result;
}

/**
 * Obtiene la clase de color para una categoría
 */
function getCategoryColorClass(category) {
  const classes = {
    passive: 'highlight-passive',      // Verde
    adverb: 'highlight-adverb',        // Azul
    vague: 'highlight-vague',          // Morado
    jargon: 'highlight-vague',         // Morado
    intensifier: 'highlight-vague',    // Morado
    weak_intensifier: 'highlight-vague',
    filler: 'highlight-filler',        // Gris
    redundancy: 'highlight-filler',    // Gris
    long_sentence: 'highlight-long',   // Amarillo
    complex_sentence: 'highlight-complex' // Rojo
  };

  return classes[category] || 'highlight-default';
}

/**
 * Verifica si el texto excede el límite de palabras para usuarios gratuitos
 */
export function checkWordLimit(text, limit = 1000) {
  const words = text.match(/\b\w+\b/g) || [];
  const wordCount = words.length;

  return {
    wordCount,
    limit,
    exceeded: wordCount > limit,
    remaining: Math.max(0, limit - wordCount)
  };
}

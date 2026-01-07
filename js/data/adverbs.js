/**
 * Lista de adverbios en -mente clasificados por prioridad
 * Alta: casi siempre eliminables
 * Media: evaluar en contexto
 * Baja: a veces necesarios
 */

export const ADVERBS = {
  high: [
    'básicamente',
    'realmente',
    'actualmente',
    'generalmente',
    'simplemente',
    'prácticamente',
    'normalmente',
    'totalmente',
    'completamente',
    'absolutamente',
    'definitivamente',
    'obviamente',
    'claramente',
    'ciertamente',
    'seguramente',
    'verdaderamente',
    'naturalmente',
    'evidentemente',
    'literalmente',
    'honestamente',
    'sinceramente',
    'francamente',
    'personalmente',
    'esencialmente',
    'fundamentalmente'
  ],
  medium: [
    'principalmente',
    'especialmente',
    'específicamente',
    'particularmente',
    'frecuentemente',
    'constantemente',
    'regularmente',
    'habitualmente',
    'usualmente',
    'típicamente',
    'tradicionalmente',
    'históricamente',
    'originalmente',
    'inicialmente',
    'finalmente',
    'últimamente',
    'recientemente',
    'anteriormente',
    'posteriormente',
    'paralelamente'
  ],
  low: [
    'aproximadamente',
    'inmediatamente',
    'directamente',
    'exactamente',
    'rápidamente',
    'lentamente',
    'cuidadosamente',
    'correctamente',
    'perfectamente',
    'fácilmente',
    'difícilmente',
    'automáticamente',
    'manualmente',
    'digitalmente',
    'remotamente'
  ]
};

// Función para obtener todos los adverbios como array plano
export function getAllAdverbs() {
  return [...ADVERBS.high, ...ADVERBS.medium, ...ADVERBS.low];
}

// Función para obtener la prioridad de un adverbio
export function getAdverbPriority(adverb) {
  const lower = adverb.toLowerCase();
  if (ADVERBS.high.includes(lower)) return 'high';
  if (ADVERBS.medium.includes(lower)) return 'medium';
  if (ADVERBS.low.includes(lower)) return 'low';

  // Si termina en -mente pero no está en la lista, es prioridad media por defecto
  if (lower.endsWith('mente')) return 'medium';

  return null;
}

// Regex para detectar adverbios en -mente
export const ADVERB_REGEX = /\b\w+mente\b/gi;

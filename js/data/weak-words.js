/**
 * Palabras y frases débiles con sus alternativas sugeridas
 */

// Intensificadores débiles (muy + adjetivo)
export const WEAK_INTENSIFIERS = {
  'muy bueno': ['excelente', 'excepcional', 'sobresaliente', 'destacado'],
  'muy malo': ['pésimo', 'terrible', 'deficiente', 'deplorable'],
  'muy grande': ['enorme', 'inmenso', 'masivo', 'gigantesco'],
  'muy pequeño': ['diminuto', 'minúsculo', 'mínimo', 'ínfimo'],
  'muy importante': ['crucial', 'esencial', 'fundamental', 'clave', 'vital'],
  'muy interesante': ['fascinante', 'cautivador', 'revelador', 'intrigante'],
  'muy difícil': ['complejo', 'arduo', 'desafiante', 'complicado'],
  'muy fácil': ['sencillo', 'simple', 'elemental', 'trivial'],
  'muy rápido': ['veloz', 'ágil', 'expedito', 'acelerado'],
  'muy lento': ['pausado', 'moroso', 'tardío', 'demorado'],
  'muy bonito': ['hermoso', 'bello', 'precioso', 'encantador'],
  'muy feo': ['horrible', 'espantoso', 'horroroso', 'grotesco'],
  'muy largo': ['extenso', 'prolongado', 'dilatado'],
  'muy corto': ['breve', 'conciso', 'sucinto'],
  'muy viejo': ['antiguo', 'ancestral', 'arcaico'],
  'muy nuevo': ['novedoso', 'reciente', 'flamante'],
  'muy caro': ['costoso', 'oneroso', 'prohibitivo'],
  'muy barato': ['económico', 'asequible', 'accesible']
};

// Palabras imprecisas/vagas
export const VAGUE_WORDS = {
  'cosa': {
    issue: 'Palabra vaga',
    suggestion: '¿Qué cosa específicamente? Usa un sustantivo preciso.'
  },
  'cosas': {
    issue: 'Palabra vaga',
    suggestion: '¿Qué cosas específicamente? Sé más concreto.'
  },
  'algo': {
    issue: 'Palabra imprecisa',
    suggestion: '¿Qué exactamente? Define con precisión.'
  },
  'hacer': {
    issue: 'Verbo genérico',
    suggestion: 'Usa verbos específicos: crear, desarrollar, ejecutar, implementar, construir.'
  },
  'bueno': {
    issue: 'Adjetivo vago',
    suggestion: '¿En qué sentido es bueno? Sé específico: eficiente, rentable, útil.'
  },
  'malo': {
    issue: 'Adjetivo vago',
    suggestion: '¿Qué problema específico? Describe el defecto concreto.'
  },
  'importante': {
    issue: 'Palabra sobreutilizada',
    suggestion: 'Usa: crucial, esencial, clave, fundamental, o explica por qué importa.'
  },
  'interesante': {
    issue: 'Palabra vacía',
    suggestion: '¿Qué lo hace interesante? Describe el valor específico.'
  },
  'etc': {
    issue: 'Incompleto',
    suggestion: 'Completa la lista o elimina. El lector no sabe qué incluye "etc".'
  },
  'etc.': {
    issue: 'Incompleto',
    suggestion: 'Completa la lista o elimina. El lector no sabe qué incluye "etc".'
  },
  'etcétera': {
    issue: 'Incompleto',
    suggestion: 'Completa la lista o elimina.'
  },
  'y demás': {
    issue: 'Incompleto',
    suggestion: 'Completa la lista o elimina.'
  },
  'entre otros': {
    issue: 'Incompleto',
    suggestion: 'Especifica cuáles otros o elimina.'
  },
  'muchos': {
    issue: 'Impreciso',
    suggestion: 'Cuantifica: ¿cuántos exactamente? Usa números si es posible.'
  },
  'algunos': {
    issue: 'Impreciso',
    suggestion: 'Especifica cuántos o cuáles.'
  },
  'varios': {
    issue: 'Impreciso',
    suggestion: 'Cuantifica con números específicos.'
  },
  'bastante': {
    issue: 'Impreciso',
    suggestion: 'Cuantifica o usa un término más específico.'
  },
  'mucho': {
    issue: 'Impreciso',
    suggestion: 'Cuantifica con datos concretos.'
  },
  'poco': {
    issue: 'Impreciso',
    suggestion: 'Especifica la cantidad o porcentaje.'
  }
};

// Jerga de marketing sobreutilizada
export const MARKETING_JARGON = {
  'innovador': '¿En qué innova exactamente? Describe la novedad concreta.',
  'líder': '¿Según qué métrica o fuente? Respalda con datos.',
  'revolucionario': '¿Qué cambia exactamente? Sé específico.',
  'único': '¿Realmente único? Describe qué lo diferencia.',
  'exclusivo': '¿Exclusivo para quién o por qué?',
  'premium': '¿Qué características lo hacen premium?',
  'de vanguardia': '¿En qué aspecto está adelantado?',
  'de clase mundial': '¿Comparado con qué estándar mundial?',
  'solución': 'Muy genérico. ¿Qué problema resuelve específicamente?',
  'sinergia': 'Jerga corporativa. Usa: colaboración, integración.',
  'apalancamiento': 'Jerga. Usa: aprovechar, utilizar.',
  'disruptivo': '¿Qué disrumpe exactamente?',
  'escalable': '¿Cómo escala? ¿Hasta qué punto?',
  'robusto': 'Vago. ¿Qué lo hace resistente o completo?',
  'optimizado': '¿Optimizado para qué métrica?',
  'potenciar': 'Vago. ¿Cómo se potencia exactamente?',
  'holístico': 'Jerga. Usa: integral, completo.',
  'paradigma': 'Sobreutilizado. ¿Es realmente un cambio de paradigma?'
};

// Función para verificar si una palabra es débil
export function isWeakWord(word) {
  const lower = word.toLowerCase();
  return lower in VAGUE_WORDS || lower in MARKETING_JARGON;
}

// Función para obtener sugerencia
export function getWeakWordSuggestion(word) {
  const lower = word.toLowerCase();
  if (VAGUE_WORDS[lower]) {
    return VAGUE_WORDS[lower];
  }
  if (MARKETING_JARGON[lower]) {
    return { issue: 'Jerga de marketing', suggestion: MARKETING_JARGON[lower] };
  }
  return null;
}

// Regex para detectar "muy + adjetivo"
export const VERY_ADJECTIVE_REGEX = /\bmuy\s+(\w+)\b/gi;

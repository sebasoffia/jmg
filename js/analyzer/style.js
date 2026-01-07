/**
 * Módulo de análisis de estilo
 * Detecta voz pasiva, adverbios, palabras débiles y muletillas
 */

import { ADVERBS, getAdverbPriority, ADVERB_REGEX } from '../data/adverbs.js';
import { VAGUE_WORDS, WEAK_INTENSIFIERS, MARKETING_JARGON, VERY_ADJECTIVE_REGEX } from '../data/weak-words.js';
import { REDUNDANT_PHRASES, FILLER_PHRASES, findRedundancy, findFillers as findFillerPhrases } from '../data/fillers.js';
import { findPassiveVoice as detectPassive, isAcceptablePassive } from '../data/passive.js';

/**
 * Encuentra adverbios en -mente en el texto
 */
export function findWeakAdverbs(text) {
  const results = [];
  let match;

  // Resetear regex
  ADVERB_REGEX.lastIndex = 0;

  while ((match = ADVERB_REGEX.exec(text)) !== null) {
    const adverb = match[0];
    const priority = getAdverbPriority(adverb);

    if (priority) {
      results.push({
        word: adverb,
        index: match.index,
        priority,
        type: 'adverb',
        suggestion: getSuggestionForAdverb(adverb, priority)
      });
    }
  }

  return results;
}

/**
 * Genera sugerencia para un adverbio
 */
function getSuggestionForAdverb(adverb, priority) {
  const lower = adverb.toLowerCase();

  const suggestions = {
    'básicamente': 'Elimina esta palabra o reformula la oración.',
    'realmente': 'Elimina o usa un adjetivo más preciso.',
    'actualmente': 'Usa "ahora" o "hoy" si es necesario.',
    'generalmente': 'Usa "suele" o sé más específico.',
    'simplemente': 'Elimina esta palabra.',
    'prácticamente': 'Usa "casi" o elimina.',
    'normalmente': 'Usa "suele" o especifica la frecuencia.',
    'totalmente': 'Elimina o usa un adjetivo absoluto.',
    'completamente': 'Elimina o usa un adjetivo más fuerte.',
    'absolutamente': 'Elimina o reformula.',
    'obviamente': 'Si es obvio, no hace falta decirlo.',
    'claramente': 'Si es claro, no hace falta aclararlo.',
    'definitivamente': 'Elimina o sé más específico.'
  };

  if (suggestions[lower]) {
    return suggestions[lower];
  }

  if (priority === 'high') {
    return 'Este adverbio suele ser innecesario. Considera eliminarlo.';
  }
  if (priority === 'medium') {
    return 'Evalúa si este adverbio aporta información necesaria.';
  }
  return 'Verifica si este adverbio es necesario en este contexto.';
}

/**
 * Encuentra palabras vagas o imprecisas
 */
export function findVagueWords(text) {
  const results = [];
  const words = text.match(/\b\w+\b/g) || [];

  let currentIndex = 0;
  for (const word of words) {
    const lower = word.toLowerCase();
    const index = text.indexOf(word, currentIndex);

    if (VAGUE_WORDS[lower]) {
      results.push({
        word,
        index,
        type: 'vague',
        issue: VAGUE_WORDS[lower].issue,
        suggestion: VAGUE_WORDS[lower].suggestion
      });
    }

    if (MARKETING_JARGON[lower]) {
      results.push({
        word,
        index,
        type: 'jargon',
        issue: 'Jerga de marketing',
        suggestion: MARKETING_JARGON[lower]
      });
    }

    currentIndex = index + word.length;
  }

  return results;
}

/**
 * Encuentra construcciones "muy + adjetivo"
 */
export function findWeakIntensifiers(text) {
  const results = [];
  let match;

  // Resetear regex
  VERY_ADJECTIVE_REGEX.lastIndex = 0;

  while ((match = VERY_ADJECTIVE_REGEX.exec(text)) !== null) {
    const fullPhrase = match[0].toLowerCase();
    const adjective = match[1].toLowerCase();

    // Buscar si hay alternativas sugeridas
    const alternatives = WEAK_INTENSIFIERS[fullPhrase];

    results.push({
      phrase: match[0],
      index: match.index,
      type: 'weak_intensifier',
      issue: '"Muy + adjetivo" es una construcción débil',
      suggestion: alternatives
        ? `Usa: ${alternatives.slice(0, 3).join(', ')}`
        : 'Busca un adjetivo más preciso que no necesite "muy".'
    });
  }

  return results;
}

/**
 * Encuentra voz pasiva en el texto
 */
export function findPassiveVoice(text) {
  const passives = detectPassive(text);

  return passives.map(p => ({
    ...p,
    type: 'passive_voice',
    acceptable: isAcceptablePassive(text, p.phrase)
  }));
}

/**
 * Encuentra muletillas y redundancias
 */
export function findFillers(text) {
  const redundancies = findRedundancy(text);
  const fillers = findFillerPhrases(text);

  return [...redundancies, ...fillers];
}

/**
 * Analiza el uso de conectores (detectar repetición)
 */
export function analyzeConnectors(text) {
  const connectors = [
    'sin embargo', 'por lo tanto', 'además', 'asimismo',
    'por otro lado', 'en consecuencia', 'no obstante',
    'por consiguiente', 'de este modo', 'así pues'
  ];

  const counts = {};
  const results = [];

  for (const connector of connectors) {
    const regex = new RegExp(`\\b${connector}\\b`, 'gi');
    const matches = text.match(regex) || [];
    if (matches.length > 0) {
      counts[connector] = matches.length;
    }
  }

  // Detectar conectores sobreutilizados (más de 2 veces)
  for (const [connector, count] of Object.entries(counts)) {
    if (count > 2) {
      results.push({
        connector,
        count,
        type: 'overused_connector',
        suggestion: `"${connector}" aparece ${count} veces. Considera variar los conectores.`
      });
    }
  }

  return results;
}

/**
 * Genera reporte completo de estilo
 */
export function analyzeStyle(text, options = {}) {
  const {
    checkPassive = true,
    checkAdverbs = true,
    checkWeakWords = true,
    checkFillers = true
  } = options;

  const issues = {
    passive: checkPassive ? findPassiveVoice(text) : [],
    adverbs: checkAdverbs ? findWeakAdverbs(text) : [],
    vague: checkWeakWords ? findVagueWords(text) : [],
    intensifiers: checkWeakWords ? findWeakIntensifiers(text) : [],
    fillers: checkFillers ? findFillers(text) : [],
    connectors: analyzeConnectors(text)
  };

  // Calcular puntuación de estilo (0-100)
  let score = 100;

  // Penalizar por voz pasiva (no aceptable)
  const unacceptablePassive = issues.passive.filter(p => !p.acceptable);
  score -= unacceptablePassive.length * 3;

  // Penalizar por adverbios de alta prioridad
  const highPriorityAdverbs = issues.adverbs.filter(a => a.priority === 'high');
  score -= highPriorityAdverbs.length * 4;
  score -= (issues.adverbs.length - highPriorityAdverbs.length) * 2;

  // Penalizar por palabras vagas
  score -= issues.vague.length * 3;

  // Penalizar por intensificadores débiles
  score -= issues.intensifiers.length * 3;

  // Penalizar por muletillas
  score -= issues.fillers.length * 2;

  // Penalizar por conectores repetidos
  score -= issues.connectors.length * 2;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Contar totales
  const totals = {
    passive: issues.passive.length,
    passiveAcceptable: issues.passive.filter(p => p.acceptable).length,
    adverbs: issues.adverbs.length,
    adverbsHigh: highPriorityAdverbs.length,
    vague: issues.vague.length,
    intensifiers: issues.intensifiers.length,
    fillers: issues.fillers.length,
    connectors: issues.connectors.reduce((sum, c) => sum + c.count, 0)
  };

  return {
    issues,
    totals,
    score
  };
}

/**
 * Combina todos los issues en una lista ordenada por posición
 */
export function getAllIssuesSorted(styleAnalysis) {
  const allIssues = [
    ...styleAnalysis.issues.passive.map(i => ({ ...i, category: 'passive' })),
    ...styleAnalysis.issues.adverbs.map(i => ({ ...i, category: 'adverb' })),
    ...styleAnalysis.issues.vague.map(i => ({ ...i, category: 'vague' })),
    ...styleAnalysis.issues.intensifiers.map(i => ({ ...i, category: 'intensifier' })),
    ...styleAnalysis.issues.fillers.map(i => ({ ...i, category: 'filler' }))
  ];

  return allIssues.sort((a, b) => a.index - b.index);
}

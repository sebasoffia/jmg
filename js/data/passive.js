/**
 * Patrones para detectar voz pasiva en español
 */

// Verbos auxiliares para pasiva perifrástica
const SER_CONJUGATIONS = [
  // Presente
  'es', 'son', 'soy', 'eres', 'somos', 'sois',
  // Pretérito
  'fue', 'fueron', 'fui', 'fuiste', 'fuimos', 'fuisteis',
  // Imperfecto
  'era', 'eran', 'eras', 'éramos', 'erais',
  // Futuro
  'será', 'serán', 'seré', 'serás', 'seremos', 'seréis',
  // Condicional
  'sería', 'serían', 'serías', 'seríamos', 'seríais',
  // Subjuntivo
  'sea', 'sean', 'seas', 'seamos', 'seáis',
  'fuera', 'fueran', 'fueras', 'fuéramos', 'fuerais',
  'fuese', 'fuesen', 'fueses', 'fuésemos', 'fueseis'
];

// Verbos compuestos con haber + sido
const HABER_SIDO = [
  'ha sido', 'han sido', 'he sido', 'has sido', 'hemos sido', 'habéis sido',
  'había sido', 'habían sido', 'habías sido', 'habíamos sido', 'habíais sido',
  'habrá sido', 'habrán sido', 'habrás sido', 'habremos sido', 'habréis sido',
  'habría sido', 'habrían sido', 'habrías sido', 'habríamos sido', 'habríais sido',
  'haya sido', 'hayan sido', 'hayas sido', 'hayamos sido', 'hayáis sido',
  'hubiera sido', 'hubieran sido', 'hubieras sido', 'hubiéramos sido', 'hubierais sido',
  'hubiese sido', 'hubiesen sido', 'hubieses sido', 'hubiésemos sido', 'hubieseis sido'
];

// Terminaciones de participio pasado
const PARTICIPLE_ENDINGS = ['ado', 'ido', 'to', 'so', 'cho'];

// Participios irregulares comunes
const IRREGULAR_PARTICIPLES = [
  'abierto', 'absuelto', 'adscrito', 'cubierto', 'descrito', 'descubierto',
  'devuelto', 'dicho', 'disuelto', 'envuelto', 'escrito', 'frito', 'hecho',
  'impreso', 'inscrito', 'muerto', 'prescrito', 'provisto', 'puesto',
  'resuelto', 'roto', 'satisfecho', 'suscrito', 'visto', 'vuelto'
];

/**
 * Verifica si una palabra es un participio pasado
 */
function isParticiple(word) {
  const lower = word.toLowerCase();

  // Verificar participios irregulares
  if (IRREGULAR_PARTICIPLES.includes(lower)) {
    return true;
  }

  // Verificar terminaciones regulares
  for (const ending of PARTICIPLE_ENDINGS) {
    if (lower.endsWith(ending)) {
      return true;
    }
  }

  return false;
}

/**
 * Regex para detectar voz pasiva perifrástica (ser + participio)
 * Ejemplo: "fue creado", "es conocido", "será implementado"
 */
export function createPassivePeriphrasticRegex() {
  const serPattern = SER_CONJUGATIONS.join('|');
  // Busca: verbo ser + (posibles palabras intermedias) + participio
  return new RegExp(
    `\\b(${serPattern})\\s+(?:\\w+\\s+)?(\\w+(?:ado|ido|to|so|cho))\\b`,
    'gi'
  );
}

/**
 * Regex para detectar voz pasiva compuesta (haber sido + participio)
 */
export function createPassiveCompoundRegex() {
  const haberSidoPattern = HABER_SIDO.join('|');
  return new RegExp(
    `\\b(${haberSidoPattern})\\s+(\\w+(?:ado|ido|to|so|cho))\\b`,
    'gi'
  );
}

/**
 * Regex para detectar pasiva refleja (se + verbo)
 * Ejemplo: "se dice", "se cree", "se considera"
 */
export const PASSIVE_REFLEXIVE_REGEX = /\bse\s+(dice|cree|considera|espera|recomienda|sugiere|piensa|sabe|puede|debe|necesita|requiere|observa|nota|ve|encuentra|hace|realiza|lleva|obtiene|logra|alcanza|consigue)\b/gi;

/**
 * Encuentra todas las instancias de voz pasiva en un texto
 */
export function findPassiveVoice(text) {
  const results = [];

  // Buscar pasiva perifrástica
  const periphrasticRegex = createPassivePeriphrasticRegex();
  let match;
  while ((match = periphrasticRegex.exec(text)) !== null) {
    // Verificar que la segunda palabra sea realmente un participio
    const possibleParticiple = match[2];
    if (isParticiple(possibleParticiple)) {
      results.push({
        phrase: match[0],
        type: 'periphrastic',
        index: match.index,
        suggestion: convertToActive(match[0])
      });
    }
  }

  // Buscar pasiva compuesta
  const compoundRegex = createPassiveCompoundRegex();
  while ((match = compoundRegex.exec(text)) !== null) {
    results.push({
      phrase: match[0],
      type: 'compound',
      index: match.index,
      suggestion: 'Considera usar voz activa'
    });
  }

  // Buscar pasiva refleja
  while ((match = PASSIVE_REFLEXIVE_REGEX.exec(text)) !== null) {
    results.push({
      phrase: match[0],
      type: 'reflexive',
      index: match.index,
      suggestion: 'Considera especificar quién realiza la acción'
    });
  }

  return results;
}

/**
 * Sugiere conversión a voz activa (básica)
 */
function convertToActive(passivePhrase) {
  // Esta es una sugerencia genérica
  // La conversión real requiere contexto semántico
  return 'Considera reescribir en voz activa, especificando quién realiza la acción';
}

/**
 * Casos donde la voz pasiva ES aceptable
 */
export const ACCEPTABLE_PASSIVE_CONTEXTS = [
  'El agente es desconocido',
  'El agente es irrelevante para el mensaje',
  'Se quiere enfatizar el objeto de la acción',
  'Es convención en textos científicos o técnicos',
  'Se usa para evitar responsabilizar directamente'
];

/**
 * Verifica si el contexto sugiere que la pasiva es aceptable
 */
export function isAcceptablePassive(text, passivePhrase) {
  // Heurísticas básicas
  const lowerText = text.toLowerCase();

  // Si menciona fechas históricas, puede ser aceptable
  if (/\b(en|del?)\s+\d{4}\b/.test(lowerText)) {
    return true;
  }

  // Si es una definición o explicación técnica
  if (/\b(se define como|se entiende por|se conoce como)\b/.test(lowerText)) {
    return true;
  }

  return false;
}

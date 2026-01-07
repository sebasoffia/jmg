/**
 * Muletillas, redundancias y frases que pueden simplificarse
 */

// Frases redundantes con su reemplazo sugerido
export const REDUNDANT_PHRASES = {
  // Sobre/respecto a
  'el hecho de que': 'que',
  'debido al hecho de que': 'porque',
  'por el motivo de que': 'porque',
  'a causa de que': 'porque',

  // Para/con el fin de
  'con el fin de': 'para',
  'con la finalidad de': 'para',
  'a efectos de': 'para',
  'con el objetivo de': 'para',
  'con el propósito de': 'para',
  'con la intención de': 'para',
  'con miras a': 'para',

  // Aunque/a pesar de
  'a pesar del hecho de que': 'aunque',
  'no obstante el hecho de que': 'aunque',

  // Ahora/actualmente
  'en el momento actual': 'ahora',
  'en este momento': 'ahora',
  'en la actualidad': 'ahora',
  'hoy en día': 'hoy',
  'hoy por hoy': 'hoy',

  // Verbos simplificables
  'dar inicio a': 'iniciar',
  'dar comienzo a': 'comenzar',
  'hacer mención de': 'mencionar',
  'hacer referencia a': 'referirse a',
  'tomar una decisión': 'decidir',
  'llevar a cabo': 'realizar',
  'poner en marcha': 'iniciar',
  'hacer uso de': 'usar',
  'hacer entrega de': 'entregar',
  'proceder a realizar': 'realizar',
  'efectuar el pago': 'pagar',
  'dar por finalizado': 'terminar',
  'poner de manifiesto': 'mostrar',
  'tener lugar': 'ocurrir',
  'tener conocimiento': 'saber',
  'tener la capacidad de': 'poder',

  // Sobre/respecto
  'en relación con': 'sobre',
  'con respecto a': 'sobre',
  'en lo que se refiere a': 'sobre',
  'en lo concerniente a': 'sobre',
  'en lo tocante a': 'sobre',
  'en lo relativo a': 'sobre',

  // Si/en caso de
  'en caso de que': 'si',
  'siempre y cuando': 'si',
  'en el supuesto de que': 'si',

  // Según/en la medida
  'en la medida en que': 'según',
  'en función de': 'según',

  // Durante/a lo largo
  'a lo largo de': 'durante',
  'en el transcurso de': 'durante',
  'en el curso de': 'durante',

  // Antes/después
  'con anterioridad a': 'antes de',
  'con posterioridad a': 'después de',
  'previo a': 'antes de',
  'posterior a': 'después de',

  // Otros
  'a menos que': 'salvo que',
  'una gran cantidad de': 'muchos',
  'un gran número de': 'muchos',
  'la mayor parte de': 'la mayoría de',
  'por medio de': 'mediante',
  'a través de': 'mediante',
  'en virtud de': 'por',
  'a nivel de': 'en'
};

// Palabras/frases de relleno (se pueden eliminar sin perder significado)
export const FILLER_PHRASES = [
  'en realidad',
  'de hecho',
  'como tal',
  'en este sentido',
  'cabe destacar que',
  'es necesario señalar que',
  'resulta evidente que',
  'no cabe duda de que',
  'es importante mencionar que',
  'vale la pena destacar que',
  'hay que decir que',
  'es preciso señalar que',
  'conviene destacar que',
  'es oportuno mencionar que',
  'cabe mencionar que',
  'es de destacar que',
  'como es sabido',
  'como se sabe',
  'obviamente',
  'evidentemente',
  'claramente',
  'sin duda alguna',
  'por supuesto',
  'desde luego',
  'naturalmente',
  'ciertamente',
  'definitivamente',
  'básicamente',
  'esencialmente',
  'fundamentalmente',
  'en definitiva',
  'en resumen',
  'en conclusión',
  'para finalizar',
  'en última instancia',
  'al fin y al cabo',
  'después de todo',
  'a decir verdad',
  'para ser honesto',
  'siendo honestos',
  'la verdad es que',
  'lo cierto es que',
  'el caso es que',
  'el tema es que',
  'la cosa es que',
  'lo que pasa es que',
  'resulta que',
  'sucede que',
  'pues bien',
  'bien',
  'bueno',
  'o sea',
  'es decir',
  'esto es',
  'digamos',
  'por así decirlo',
  'de alguna manera',
  'de cierta forma',
  'en cierto modo',
  'de algún modo',
  'tipo',
  'como que'
];

// Función para encontrar redundancias
export function findRedundancy(text) {
  const found = [];
  const lowerText = text.toLowerCase();

  for (const [phrase, replacement] of Object.entries(REDUNDANT_PHRASES)) {
    const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      found.push({
        phrase: match[0],
        replacement,
        index: match.index,
        type: 'redundancy'
      });
    }
  }

  return found;
}

// Función para encontrar muletillas
export function findFillers(text) {
  const found = [];

  for (const filler of FILLER_PHRASES) {
    const regex = new RegExp(`\\b${escapeRegex(filler)}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      found.push({
        phrase: match[0],
        suggestion: 'Considera eliminar esta muletilla',
        index: match.index,
        type: 'filler'
      });
    }
  }

  return found;
}

// Helper para escapar caracteres especiales en regex
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Exportar todas las frases como array para búsqueda rápida
export function getAllFillerPhrases() {
  return [...Object.keys(REDUNDANT_PHRASES), ...FILLER_PHRASES];
}

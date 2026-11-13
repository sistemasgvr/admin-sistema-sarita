/**
 * Búsqueda de casos en lenguaje del usuario.
 *
 * El vocabulario sale de los chats de la marcha blanca: la gente no escribe
 * «actividad de recojo bloqueada», escribe «no me deja dar ingreso al balón».
 * Por eso cada caso lleva una lista de frases tal como se dijeron, y la
 * búsqueda normaliza tildes y mayúsculas (escriben de las dos formas, y a
 * veces TODO EN MAYÚSCULAS).
 */

/** Minúsculas y sin tildes, para comparar «glosa»/«GLOSA» y «balón»/«balon». */
export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Palabras vacías: no aportan a la búsqueda y ensucian el puntaje. */
const VACIAS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'al', 'a', 'en', 'y', 'o',
  'que', 'se', 'me', 'mi', 'le', 'lo', 'es', 'por', 'para', 'con', 'sin', 'como',
  'cuando', 'donde', 'si', 'no', 'ya', 'hay', 'esta', 'este', 'esa', 'ese', 'su',
])

export function dividirTerminos(consulta: string): string[] {
  return normalizarTexto(consulta)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !VACIAS.has(t))
}

export interface CasoBuscable {
  id: string
  title: string
  description: string
  /** Frases como las dice el usuario. Son el grueso de los aciertos. */
  keywords?: readonly string[]
}

export interface ResultadoBusqueda<T extends CasoBuscable> {
  caso: T
  puntaje: number
}

/**
 * Puntúa un caso contra los términos buscados. Pondera por dónde aparece:
 * las frases del usuario pesan más que la descripción, porque son las que
 * reflejan cómo se consulta de verdad.
 */
function puntuarCaso(caso: CasoBuscable, terminos: string[]): number {
  const titulo = normalizarTexto(caso.title)
  const descripcion = normalizarTexto(caso.description)
  const frases = (caso.keywords ?? []).map(normalizarTexto)
  const frasesUnidas = frases.join(' ')

  let puntaje = 0

  for (const termino of terminos) {
    // Frase del usuario que coincide completa: la señal más fuerte.
    if (frases.some((frase) => frase === termino)) {
      puntaje += 12
      continue
    }
    if (titulo.includes(termino)) puntaje += 8
    else if (frasesUnidas.includes(termino)) puntaje += 6
    else if (descripcion.includes(termino)) puntaje += 3
    else puntaje -= 1 // término que no aparece: baja la relevancia
  }

  // Una frase escrita casi tal cual («la caja no cuadra») debe ganarle a un
  // título que solo comparte una palabra suelta. Se compara contra la frase
  // del usuario reducida a sus términos útiles, en el mismo orden.
  // Solo cuenta si la consulta tiene varias palabras: con una sola («caja»)
  // media docena de rutas la contienen y el bono no distinguiría nada.
  if (terminos.length > 1) {
    const consulta = terminos.join(' ')
    const coincideFrase = frases.some((frase) => {
      const reducida = dividirTerminos(frase).join(' ')
      if (reducida.length === 0) return false
      return reducida === consulta || reducida.includes(consulta)
    })
    if (coincideFrase) puntaje += 25
  }

  return puntaje
}

/**
 * Casos ordenados por relevancia. Devuelve [] si no hay consulta, para que la
 * vista muestre el menú normal por módulos.
 */
export function buscarCasos<T extends CasoBuscable>(
  casos: readonly T[],
  consulta: string,
): ResultadoBusqueda<T>[] {
  const terminos = dividirTerminos(consulta)
  if (terminos.length === 0) return []

  return casos
    .map((caso) => ({ caso, puntaje: puntuarCaso(caso, terminos) }))
    .filter((resultado) => resultado.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje || a.caso.title.localeCompare(b.caso.title))
}

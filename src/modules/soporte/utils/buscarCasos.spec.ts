import { describe, expect, it } from 'vitest'
import { buscarCasos, dividirTerminos, normalizarTexto } from './buscarCasos'

/**
 * Los casos de prueba son consultas reales de los chats de la marcha blanca.
 * Si una de estas deja de encontrar su ruta, el buscador dejó de servir para
 * lo que se hizo.
 */
const casos = [
  {
    id: 'caso-recojo-bloqueado',
    title: 'No puedo hacer el recojo de un balón',
    description: 'El cliente devolvió el envase y el recojo se bloquea.',
    keywords: [
      'no puedo realizar el recojo',
      'no me permite iniciar el recojo',
      'no puedo dar ingreso',
      'estado del balon',
      'recojo',
      'balon',
    ],
  },
  {
    id: 'caso-caja-reabrir',
    title: 'Registrar algo en una fecha ya cerrada',
    description: 'Cobros o gastos de días anteriores: cómo reabrir la caja.',
    keywords: ['reabrir caja', 'no me deja cerrar caja', 'caja cerrada', 'fondo', 'caja'],
  },
  {
    id: 'caso-pago-mixto',
    title: 'El cliente paga con efectivo y Yape',
    description: 'Repartir una venta al contado entre varios medios de pago.',
    keywords: ['yape', 'efectivo y yape', 'la caja no cuadra', 'medio de pago', 'descuadre'],
  },
  {
    id: 'caso-cilindro-perdido',
    title: 'No sé dónde está un cilindro',
    description: 'Rastrear quién tiene cada envase y desde cuándo.',
    keywords: ['no aparece el cilindro', 'quien tiene el balon', 'cilindro perdido', 'en poder de'],
  },
  {
    id: 'ventas-caja',
    title: 'Abrir y cerrar caja',
    description: 'Apertura del día, gastos, depósitos y arqueo al cierre.',
    keywords: ['caja', 'abrir caja', 'cerrar caja', 'arqueo'],
  },
] as const

const primerId = (consulta: string) => buscarCasos(casos, consulta)[0]?.caso.id

describe('normalizarTexto', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizarTexto('BALÓN')).toBe('balon')
    expect(normalizarTexto('  Garantía  ')).toBe('garantia')
  })
})

describe('dividirTerminos', () => {
  it('descarta palabras vacías y signos', () => {
    expect(dividirTerminos('no me deja cerrar la caja')).toEqual(['deja', 'cerrar', 'caja'])
  })

  it('devuelve vacío cuando no hay consulta útil', () => {
    expect(dividirTerminos('   ')).toEqual([])
    expect(dividirTerminos('el la de')).toEqual([])
  })
})

describe('buscarCasos — consultas reales de los usuarios', () => {
  it('sin consulta no devuelve resultados (se muestra el menú normal)', () => {
    expect(buscarCasos(casos, '')).toEqual([])
    expect(buscarCasos(casos, '   ')).toEqual([])
  })

  it.each([
    ['no me permite iniciar el recojo', 'caso-recojo-bloqueado'],
    ['no puedo dar ingreso', 'caso-recojo-bloqueado'],
    ['efectivo y yape', 'caso-pago-mixto'],
    ['yape', 'caso-pago-mixto'],
    ['la caja no cuadra', 'caso-pago-mixto'],
    ['no aparece el cilindro', 'caso-cilindro-perdido'],
    ['quien tiene el balon', 'caso-cilindro-perdido'],
    ['reabrir caja', 'caso-caja-reabrir'],
  ])('«%s» encuentra %s', (consulta, esperado) => {
    expect(primerId(consulta)).toBe(esperado)
  })

  it('funciona IGUAL EN MAYUSCULAS, como suelen escribir', () => {
    expect(primerId('NO PUEDO DAR INGRESO')).toBe('caso-recojo-bloqueado')
  })

  it('tolera la falta de tildes', () => {
    expect(primerId('no se donde esta un balon')).toBeDefined()
    expect(primerId('quien tiene el balón')).toBe('caso-cilindro-perdido')
  })

  it('prioriza el caso concreto sobre la ruta de pantalla', () => {
    // «caja» aparece en ambos, pero la frase describe un problema concreto.
    expect(primerId('no me deja cerrar caja')).toBe('caso-caja-reabrir')
  })

  it('una frase completa le gana a un titulo que solo comparte una palabra', () => {
    // «la caja no cuadra» es frase de pago mixto; «caja» sola está en varias.
    expect(primerId('la caja no cuadra')).toBe('caso-pago-mixto')
  })

  it('una palabra suelta devuelve varias opciones ordenadas', () => {
    const resultado = buscarCasos(casos, 'caja')
    expect(resultado.length).toBeGreaterThan(1)
    expect(resultado[0].puntaje).toBeGreaterThanOrEqual(resultado[1].puntaje)
  })

  it('no devuelve nada cuando la consulta no tiene relación', () => {
    expect(buscarCasos(casos, 'zzzz')).toEqual([])
  })
})

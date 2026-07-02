export const CATALOGO_LISTAS = {
  TIPO_PERSONA: 1,
  TIPO_CLIENTE: 2,
  TIPO_DOCUMENTO: 3,
} as const

export type CatalogoListaId = (typeof CATALOGO_LISTAS)[keyof typeof CATALOGO_LISTAS]

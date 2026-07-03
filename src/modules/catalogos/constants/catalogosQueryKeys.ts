export const catalogosQueryKeys = {
  all: ['catalogos'] as const,
  listaOpciones: (idLista: number) =>
    [...catalogosQueryKeys.all, 'lista-opciones', idLista] as const,
}

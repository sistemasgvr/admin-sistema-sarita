export const catalogosQueryKeys = {
  all: ['catalogos'] as const,
  opciones: (idLista: number) => [...catalogosQueryKeys.all, 'opciones', idLista] as const,
}

export const ubigeoQueryKeys = {
  all: ['ubigeo'] as const,
  paises: () => [...ubigeoQueryKeys.all, 'paises'] as const,
  departamentos: (idPais?: number | null) =>
    [...ubigeoQueryKeys.all, 'departamentos', idPais] as const,
  provincias: (idDepartamento?: number | null) =>
    [...ubigeoQueryKeys.all, 'provincias', idDepartamento] as const,
  distritos: (idProvincia?: number | null) =>
    [...ubigeoQueryKeys.all, 'distritos', idProvincia] as const,
}

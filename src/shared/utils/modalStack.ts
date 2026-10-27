/** Orden de apertura de los modales: Escape cierra solo el superior y el scroll del body se libera al cerrar el último. */
export function crearPilaModales() {
  const pila: symbol[] = []
  return {
    abrir(id: symbol) {
      const i = pila.indexOf(id)
      if (i >= 0) pila.splice(i, 1)
      pila.push(id)
    },
    cerrar(id: symbol) {
      const i = pila.indexOf(id)
      if (i >= 0) pila.splice(i, 1)
    },
    esSuperior(id: symbol) {
      return pila[pila.length - 1] === id
    },
    hayAbiertos() {
      return pila.length > 0
    },
  }
}

export const pilaModales = crearPilaModales()

export const productoImagenesQueryKeys = {
  all: ['producto-imagenes'] as const,
  lists: () => [...productoImagenesQueryKeys.all, 'list'] as const,
  list: (idProducto: number) =>
    [...productoImagenesQueryKeys.lists(), idProducto] as const,
  detail: (id: number) => [...productoImagenesQueryKeys.all, 'detail', id] as const,
}

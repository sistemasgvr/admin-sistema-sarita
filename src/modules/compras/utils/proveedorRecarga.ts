type IdProveedor = string | number | null | undefined

/** Solo desvincula la orden si se elige un proveedor distinto o se vacía el campo. */
export function debeLimpiarRecargaPorProveedor(
  proveedor: IdProveedor,
  anterior: IdProveedor,
  proveedorOrden: IdProveedor,
): boolean {
  const id = Number(proveedor) || null
  const idAnterior = Number(anterior) || null
  const idOrden = Number(proveedorOrden) || null

  if (id === idAnterior || (id != null && id === idOrden)) return false
  // Completar por primera vez el proveedor de una orden sin proveedor no debe
  // descartar los cilindros ni los precios que el usuario ya ingresó.
  return id == null || (idOrden ?? idAnterior) != null
}

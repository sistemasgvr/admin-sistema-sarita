/** La base conserva seis decimales en el precio; el cobro se expresa en céntimos. */
export function precioGasDesdeTotal(total: number, cantidad: number): number | null {
  if (!Number.isFinite(total) || total < 0 || !Number.isFinite(cantidad) || cantidad <= 0) return null
  const precio = Number((total / cantidad).toFixed(6))
  return Math.round(precio * cantidad * 100) === Math.round(total * 100) ? precio : null
}

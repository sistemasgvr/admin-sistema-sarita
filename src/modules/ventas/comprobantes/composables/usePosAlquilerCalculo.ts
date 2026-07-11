import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'

export type ModoCobroAlquiler = 'diario' | 'mensual'

export function inferirModoCobroAlquiler(
  producto?: Pick<Producto, 'codigo' | 'nombre'> | null,
): ModoCobroAlquiler {
  if (!producto) return 'diario'

  const text = `${producto.codigo} ${producto.nombre}`.toLowerCase()

  if (
    text.includes('mensual') ||
    text.includes('por mes') ||
    text.includes('/mes') ||
    text.includes('al mes')
  ) {
    return 'mensual'
  }

  return 'diario'
}

export function calcularDiasAlquiler(inicio: string, fin: string): number {
  if (!inicio) return 0
  if (!fin) return 1

  const start = new Date(`${inicio}T00:00:00`)
  const end = new Date(`${fin}T00:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  if (end < start) return 0

  const diffMs = end.getTime() - start.getTime()
  return Math.max(Math.floor(diffMs / 86_400_000) + 1, 1)
}

export function calcularImporteAlquiler(params: {
  modo: ModoCobroAlquiler
  tarifa: number
  dias: number
  precioServicio: number
}): number {
  if (params.modo === 'mensual') {
    return Number(params.precioServicio || 0)
  }

  return Number((Number(params.tarifa || 0) * params.dias).toFixed(2))
}

export function etiquetaTarifaAlquiler(modo: ModoCobroAlquiler): string {
  return modo === 'mensual' ? 'Tarifa mensual' : 'Tarifa diaria'
}

export function textoAyudaImporteAlquiler(params: {
  modo: ModoCobroAlquiler
  tarifa: number
  dias: number
  importe: number
}): string {
  if (params.modo === 'mensual') {
    return `Cobro mensual fijo: S/ ${params.importe.toFixed(2)}`
  }

  if (params.dias <= 0) {
    return 'Indica fechas de inicio y fin para calcular el importe'
  }

  return `${params.dias} día${params.dias === 1 ? '' : 's'} × S/ ${params.tarifa.toFixed(2)} = S/ ${params.importe.toFixed(2)}`
}

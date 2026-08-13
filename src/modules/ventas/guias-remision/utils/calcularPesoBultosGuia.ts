import type { Balon } from '@/modules/balones/cilindros/interfaces/balon.interface'

/**
 * SUNAT GRE (remitente):
 * - Peso bruto total: obligatorio (GrossWeightMeasure), normalmente en KGM.
 * - Nº bultos: 1 cilindro = 1 bulto.
 *
 * Prioridad de peso por línea:
 * 1) `pesoKg` capturado en el formulario (obligatorio si no hay tara en BD)
 * 2) tara del tipo (`peso_tipo_balon`)
 */
export type LineaPesoBultosInput = {
  idBalon?: number | '' | null
  cantidad?: number | null
  /** Peso bruto del ítem en kg (captura manual o desde catálogo). */
  pesoKg?: number | null
}

export type PesoBultosCalculado = {
  pesoBrutoKg: number
  numeroBultos: number
  conTaraCatalogo: number
  conPesoManual: number
  sinPeso: number
}

export function pesoCatalogoBalonKg(balon: Balon | undefined): number | null {
  if (!balon) return null
  const tara = Number(balon.peso_tipo_balon)
  return Number.isFinite(tara) && tara > 0 ? tara : null
}

export function calcularPesoBultosGuia(
  lineas: LineaPesoBultosInput[],
  balonesById: Map<number, Balon> | Record<number, Balon>,
): PesoBultosCalculado {
  const getBalon = (id: number): Balon | undefined =>
    balonesById instanceof Map ? balonesById.get(id) : balonesById[id]

  let pesoBrutoKg = 0
  let numeroBultos = 0
  let conTaraCatalogo = 0
  let conPesoManual = 0
  let sinPeso = 0

  for (const linea of lineas) {
    const idBalon =
      linea.idBalon !== '' && linea.idBalon != null ? Number(linea.idBalon) : NaN
    const cantidadRaw = Number(linea.cantidad)
    const cantidad =
      Number.isFinite(cantidadRaw) && cantidadRaw > 0 ? cantidadRaw : 1
    const bultosLinea = Math.max(1, Math.round(cantidad))

    const pesoCapturado = Number(linea.pesoKg)
    const tienePesoCapturado = Number.isFinite(pesoCapturado) && pesoCapturado > 0

    if (Number.isFinite(idBalon) && idBalon > 0) {
      numeroBultos += bultosLinea
      const catalogo = pesoCatalogoBalonKg(getBalon(idBalon))

      if (tienePesoCapturado) {
        pesoBrutoKg += pesoCapturado * bultosLinea
        if (catalogo != null && Math.abs(catalogo - pesoCapturado) < 0.001) {
          conTaraCatalogo += bultosLinea
        } else {
          conPesoManual += bultosLinea
        }
      } else if (catalogo != null) {
        pesoBrutoKg += catalogo * bultosLinea
        conTaraCatalogo += bultosLinea
      } else {
        sinPeso += bultosLinea
      }
      continue
    }

    // Línea solo producto.
    if (cantidad > 0) {
      numeroBultos += bultosLinea
      if (tienePesoCapturado) {
        pesoBrutoKg += pesoCapturado * bultosLinea
        conPesoManual += bultosLinea
      } else {
        sinPeso += bultosLinea
      }
    }
  }

  return {
    pesoBrutoKg: Math.round(pesoBrutoKg * 100) / 100,
    numeroBultos,
    conTaraCatalogo,
    conPesoManual,
    sinPeso,
  }
}

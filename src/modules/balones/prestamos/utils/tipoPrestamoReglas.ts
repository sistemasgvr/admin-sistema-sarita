export type ContrapartePrestamo = 'cliente' | 'proveedor' | 'ambos'
export type SentidoPrestamo = 'salida' | 'entrada' | 'envio'
export type IconoTipoPrestamo = 'users' | 'building2' | 'truck' | 'layers'

export interface TipoPrestamoRegla {
  contraparte: ContrapartePrestamo
  requiereCliente: boolean
  requiereProveedor: boolean
  requiereAlmacen: boolean
  sentido: SentidoPrestamo
  permitePos: boolean
  icon: IconoTipoPrestamo
  orden: number
}

/** Único tipo que el POS usa al cobrar envase de la empresa. */
export const CODIGO_PRESTAMO_POS = 'ENVASE_EMPRESA_A_CLIENTE'

const REGLA_GENERICA: TipoPrestamoRegla = {
  contraparte: 'ambos',
  requiereCliente: false,
  requiereProveedor: false,
  requiereAlmacen: false,
  sentido: 'salida',
  permitePos: false,
  icon: 'layers',
  orden: 99,
}

const REGLAS_CONOCIDAS: Record<string, TipoPrestamoRegla> = {
  ENVASE_EMPRESA_A_CLIENTE: {
    contraparte: 'cliente',
    requiereCliente: true,
    requiereProveedor: false,
    requiereAlmacen: true,
    sentido: 'salida',
    permitePos: true,
    icon: 'users',
    orden: 1,
  },
  CILINDRO_CLIENTE_A_EMPRESA: {
    contraparte: 'cliente',
    requiereCliente: true,
    requiereProveedor: false,
    requiereAlmacen: false,
    sentido: 'entrada',
    permitePos: false,
    icon: 'building2',
    orden: 2,
  },
  CILINDRO_A_PLANTA: {
    contraparte: 'proveedor',
    requiereCliente: false,
    requiereProveedor: true,
    requiereAlmacen: false,
    sentido: 'envio',
    permitePos: false,
    icon: 'truck',
    orden: 3,
  },
}

export function normalizarCodigoTipoPrestamo(nombre?: string | null): string {
  return (nombre ?? '').trim().toUpperCase()
}

function inferirReglaPorCodigo(codigo: string): TipoPrestamoRegla {
  if (!codigo) return REGLA_GENERICA

  const mencionaCliente = codigo.includes('CLIENTE')
  const mencionaProveedor = codigo.includes('PROVEEDOR') || codigo.includes('PLANTA')

  if (mencionaCliente && !mencionaProveedor) {
    return {
      ...REGLA_GENERICA,
      contraparte: 'cliente',
      requiereCliente: true,
      requiereAlmacen: codigo.includes('EMPRESA_A_CLIENTE') || codigo.includes('SALIDA'),
      sentido: codigo.includes('CLIENTE_A_') ? 'entrada' : 'salida',
      icon: 'users',
      orden: 50,
    }
  }

  if (mencionaProveedor && !mencionaCliente) {
    return {
      ...REGLA_GENERICA,
      contraparte: 'proveedor',
      requiereProveedor: true,
      sentido: 'envio',
      icon: 'truck',
      orden: 50,
    }
  }

  return REGLA_GENERICA
}

/** Comportamiento del tipo: mapa explícito, si no convención del código, si no formulario genérico. */
export function reglaTipoPrestamo(nombre?: string | null): TipoPrestamoRegla {
  const codigo = normalizarCodigoTipoPrestamo(nombre)
  return REGLAS_CONOCIDAS[codigo] ?? inferirReglaPorCodigo(codigo)
}

export function idTipoPrestamoPermitePos(
  opciones: { id: number; nombre?: string | null }[] | undefined,
): number | null {
  const match = (opciones ?? []).find((item) => reglaTipoPrestamo(item.nombre).permitePos)
  return match?.id ?? null
}

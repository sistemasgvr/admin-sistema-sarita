import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import {
  CLIENTES_VARIOS_CODIGO,
  CLIENTES_VARIOS_DOCUMENTO,
} from '@/modules/clientes/constants/clientesVarios'

/** Cliente de sistema usado en VSD / mostrador; no debe editarse ni darse de baja. */
export function esClientesVarios(
  cliente: { codigo_interno?: string | null } | null | undefined,
): boolean {
  return (cliente?.codigo_interno ?? '').trim().toUpperCase() === CLIENTES_VARIOS_CODIGO
}

/** Carga el cliente genérico de mostrador (CVARIOS / 00000000). */
export async function obtenerClientesVarios(): Promise<Cliente | null> {
  try {
    const result = await clientesService.listar({
      buscar: CLIENTES_VARIOS_CODIGO,
      pagina: 1,
      limite: 10,
      soloActivos: 1,
    })

    const byCodigo =
      (result.data ?? []).find(
        (cliente) => (cliente.codigo_interno ?? '').toUpperCase() === CLIENTES_VARIOS_CODIGO,
      ) ?? null

    if (byCodigo) return byCodigo

    return (
      (result.data ?? []).find(
        (cliente) => (cliente.numero_documento ?? '').trim() === CLIENTES_VARIOS_DOCUMENTO,
      ) ?? null
    )
  } catch {
    return null
  }
}

export function clienteTieneDocumento(cliente: {
  numero_documento?: string | null
} | null | undefined): boolean {
  return Boolean(cliente?.numero_documento && String(cliente.numero_documento).trim())
}

import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'

/** Detecta persona jurídica aunque el catálogo traiga o no acento. */
export function isPersonaJuridicaNombre(nombreTipoPersona?: string | null): boolean {
  const normalized = (nombreTipoPersona ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
  return normalized.includes('JURID')
}

export function getClienteNombrePrincipal(
  cliente: Pick<
    Cliente,
    | 'nombre_tipo_persona'
    | 'razon_social'
    | 'nombres'
    | 'apellido_paterno'
    | 'apellido_materno'
    | 'numero_documento'
  >,
): string {
  if (isPersonaJuridicaNombre(cliente.nombre_tipo_persona) && cliente.razon_social) {
    return cliente.razon_social
  }

  const nombreCompleto = [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || cliente.razon_social || cliente.numero_documento || 'Sin nombre'
}

export function getClienteOptionLabel(
  cliente: Pick<
    Cliente,
    | 'nombre_tipo_persona'
    | 'razon_social'
    | 'nombres'
    | 'apellido_paterno'
    | 'apellido_materno'
    | 'numero_documento'
  >,
): string {
  const nombre = getClienteNombrePrincipal(cliente)
  const doc = (cliente.numero_documento ?? '').trim()
  return doc ? `${nombre} — ${doc}` : nombre
}

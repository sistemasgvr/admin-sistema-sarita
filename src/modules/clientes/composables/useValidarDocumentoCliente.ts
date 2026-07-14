import { clientesService } from '@/modules/clientes/services/clientes.service'

/**
 * Consulta si el documento ya existe.
 * En error de red/API lanza, para no fallar en abierto (falso negativo).
 */
export async function documentoYaRegistrado(
  numeroDocumento: string,
  idExcluir?: number,
): Promise<boolean> {
  if (!numeroDocumento) return false

  const result = await clientesService.validarDocumento({
    numeroDocumento,
    idExcluir,
  })
  return Boolean(result.existe)
}

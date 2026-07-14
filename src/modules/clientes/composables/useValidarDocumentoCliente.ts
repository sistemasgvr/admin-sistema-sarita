import { clientesService } from '@/modules/clientes/services/clientes.service'

export async function documentoYaRegistrado(
  numeroDocumento: string,
  idExcluir?: number,
): Promise<boolean> {
  if (!numeroDocumento) return false

  try {
    const result = await clientesService.validarDocumento({
      numeroDocumento,
      idExcluir,
    })
    return Boolean(result.registrado)
  } catch {
    return false
  }
}

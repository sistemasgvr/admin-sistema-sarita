import { clientesService } from '@/modules/clientes/services/clientes.service'

/**
 * Verifica contra el backend si un número de documento ya está registrado.
 * `idExcluir` se usa al editar, para no chocar contra el propio registro.
 *
 * NOTA: se asume que la respuesta trae `{ registrado: boolean }`. Si el
 * backend responde con otro nombre de campo, ajustar aquí y en
 * ValidarDocumentoResponse.
 */
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
    // Si la validación falla (ej. red), no bloqueamos el formulario aquí;
    // el backend igual rechazará un documento duplicado al enviar el POST/PATCH.
    return false
  }
}

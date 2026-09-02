export class ApiError extends Error {
  statusCode: number
  errors: string[] | null
  /**
   * Datos estructurados de un error accionable, cuando la API los envía.
   * Permite ofrecer una salida al usuario (p. ej. confirmar una conversión de stock)
   * en lugar de limitarse a mostrar el mensaje.
   */
  detalle: Record<string, unknown> | null

  constructor(
    message: string,
    statusCode: number,
    errors: string[] | null = null,
    detalle: Record<string, unknown> | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errors = errors
    this.detalle = detalle
  }
}

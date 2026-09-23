export class ApiError extends Error {
  statusCode: number
  errors: string[] | null
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

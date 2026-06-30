export class ApiError extends Error {
  statusCode: number
  errors: string[] | null

  constructor(message: string, statusCode: number, errors: string[] | null = null) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

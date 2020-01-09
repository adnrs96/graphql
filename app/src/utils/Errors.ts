abstract class HttpError extends Error {
  public statusCode!: number

  constructor(name: string, message: string) {
    super(message)
    this.name = name
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message?: string) {
    super('UnauthorizedError', message || 'Unauthorized')
    this.statusCode = 401
  }
}

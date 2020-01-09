import jwt, { VerifyOptions } from 'jsonwebtoken'
import { Request } from 'express'
import { UnauthorizedError } from './Errors'

export default class TokenManager {
  private readonly token: string
  private verificationKey!: string
  private opts!: VerifyOptions
  private readyToVerify: boolean = false

  constructor(token: string) {
    this.token = token
  }

  public static from(request: Request): TokenManager {
    return new TokenManager(TokenManager.getTokenFromRequest(request))
  }

  public with(verificationKey: string, opts: VerifyOptions): TokenManager {
    this.verificationKey = verificationKey
    this.opts = opts
    this.readyToVerify = true
    return this
  }

  public get hasToken(): boolean {
    return !!this.token
  }

  public get get(): { [key: string]: string } {
    if (!this.hasToken) {
      throw new Error('There was no token from the request')
    }
    if (!this.readyToVerify) {
      throw new Error('You shall add a verification key and options before verifying a token')
    }
    try {
      return jwt.verify(this.token, this.verificationKey, this.opts) as { [key: string]: string }
    } catch (ignored) {
      throw new UnauthorizedError('InvalidOrExpiredToken')
    }
  }

  private static getTokenFromRequest(request: Request): string {
    const authCookieName = process.env.AUTH_COOKIE_NAME || 'storyscript-access-token'

    // get token from cookie
    let token = (authCookieName in request.cookies && request.cookies[authCookieName]) || ''

    // get cookie from authorization header
    if (!token && request.headers.authorization) {
      const matches = request.headers.authorization.match(/^bearer ([-a-zA-Z0-9_/+=\.]+)$/i)
      if (matches) {
        token = matches[1]
      }
    }
    return token
  }
}

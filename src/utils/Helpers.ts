import jwt, { VerifyOptions } from 'jsonwebtoken'
import { Request } from 'express'
import { UnauthorizedError } from './Errors'

export default class Helpers {
  static getTokenFromRequest(request: Request): string {
    const authCookieName = process.env.AUTH_COOKIE_NAME || 'storyscript-access-token'

    // get token from cookie
    let token = (authCookieName in request.cookies && request.cookies[authCookieName]) || ''

    // get cookie from authorization header
    if (!token) {
      const matches = (request.headers.authorization || '').match(/^bearer ([-a-zA-Z0-9_/+=\.]+)$/i)
      if (matches) {
        token = matches[1]
      }
    }
    return token
  }

  static getOwnerUuidFromJWT(token: string, verificationKey: string, opts: VerifyOptions): string {
    try {
      const decoded: { [key: string]: string } = jwt.verify(token, verificationKey, opts) as { [key: string]: string }
      return decoded.owner_uuid
    } catch (ignored) {
      throw new UnauthorizedError('InvalidOrExpiredToken')
    }
  }
}

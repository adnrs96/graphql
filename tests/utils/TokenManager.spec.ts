/* eslint-disable @typescript-eslint/no-object-literal-type-assertion */
import TokenManager from '../../src/utils/TokenManager'
import { Request } from 'express'
import jwt from 'jsonwebtoken'

describe('TokenManager.ts', () => {
  describe('with an invalid request', () => {
    it('should throw if there is no token', () => {
      expect(() => TokenManager.from({} as Request).get).toThrow('no token')
      expect(() => TokenManager.from({ headers: { authorization: 'invalid token' } } as Request).get).toThrow(
        'no token'
      )
    })
    it('should throw if not ready for verification', () => {
      expect(() => TokenManager.from({ headers: { authorization: 'bearer token' } } as Request).get).toThrow(
        'verification'
      )
    })
    it('should not have a token', () => {
      expect(TokenManager.from({} as Request).hasToken).toBeFalsy()
    })
  })

  describe('with a valid request but invalid token', () => {
    let manager: TokenManager

    beforeEach(() => {
      manager = TokenManager.from({ cookies: { 'storyscript-access-token': 'token' } } as Request).with('secret', {
        issuer: 'me'
      })
    })

    it('should have a token', () => {
      expect(manager.hasToken).toBeTruthy()
    })

    it('should throw an InvalidOrExpiredToken exception', () => {
      expect(() => manager.get).toThrow('InvalidOrExpiredToken')
    })
  })

  describe('with a valid request and a valid token', () => {
    let manager: TokenManager

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/camelcase
      const token = jwt.sign({ owner_uuid: 'uuid' }, 'secret', { issuer: 'me' })
      manager = TokenManager.from({ headers: { authorization: `bearer ${token}` } } as Request).with('secret', {
        issuer: 'me'
      })
    })

    it('should have an owner_uuid element', () => {
      expect(manager.get).toHaveProperty('owner_uuid', 'uuid')
    })
  })
})

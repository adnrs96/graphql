import Server from '../../src/express'
import supertest from 'supertest'

describe('express/index.ts', () => {
  describe('Server', () => {
    let server: Server

    beforeAll(async () => {
      server = new Server('^http[s]*:\\/\\/([\\w\\-\\.]*)localhost(:[38]0([0-9][0-9])?)?$')
      await server.start()
    })

    afterAll(async () => {
      await server.stop()
    })

    it('should returns a 404', async () => {
      const res = await supertest(server.app).get('/404')
      expect(res).toHaveProperty('statusCode', 404)
    })

    it('should returns a 401', async () => {
      const res = await supertest(server.app)
        .get('/404')
        .set('Origin', 'unauthorized')
      expect(res).toHaveProperty('statusCode', 401)
    })
  })
})

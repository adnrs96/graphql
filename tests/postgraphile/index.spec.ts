import GraphQLServer from '../../src/postgraphile'
import Server from '../../src/express'
import supertest from 'supertest'
import jwt from 'jsonwebtoken'

describe('postgraphile/index.ts', () => {
  describe('GraphQLServer', () => {
    let gql: GraphQLServer
    let server: Server

    beforeAll(async () => {
      process.env.DATABASE_URL = 'postgresql://storyscript-ci:storyscript-ci-pwd@localhost:5432/storyscript'

      gql = new GraphQLServer(process.env.DATABASE_URL, 'secret', false)
      server = new Server('^http[s]*:\\/\\/([\\w\\-\\.]*)localhost(:[38]0([0-9][0-9])?)?$')
      server.app.use(await gql.handler())
      await server.start()
    })

    afterAll(async () => {
      await server.stop()
      await gql.disconnect()
    })

    it('should request as a visitor', async () => {
      expect.assertions(2)

      let res = await supertest(server.app)
        .post('/graphql')
        .send({ query: 'query { viewer { name } }', variables: null })
      expect(res).toHaveProperty('statusCode', 200)
      expect(res.body).toEqual({
        data: {
          viewer: null
        }
      })
    })

    it('should request with a fake uuid', async () => {
      expect.assertions(2)

      // eslint-disable-next-line @typescript-eslint/camelcase
      const token = jwt.sign({ owner_uuid: '00000000-0000-0000-0000-000000000000' }, 'secret', {
        issuer: 'storyscript'
      })

      let res = await supertest(server.app)
        .post('/graphql')
        .set('Authorization', `bearer ${token}`)
        .send({ query: 'query { viewer { name } }', variables: null })
      expect(res).toHaveProperty('statusCode', 200)
      expect(res.body).toEqual({
        data: {
          viewer: null
        }
      })
    })
  })
})

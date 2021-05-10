import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from './../src/app.module'

describe('BaseController (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('/api/globals (GET)', async () => {
    return await request(app.getHttpServer())
      .get('/api/globals')
      .expect(401)
      .expect(
        {
          status: 401,
          error: 'Unauthorized',
          details:
            {
              description: 'No Ltik or ID Token found.',
              message: 'NO_LTIK_OR_IDTOKEN_FOUND',
              bodyReceived: {}
            }
        }
      )
  })

  afterEach(async () => await app.close(), 10000)
})

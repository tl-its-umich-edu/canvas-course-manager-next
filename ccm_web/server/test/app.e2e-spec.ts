import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from './../src/app.module'
import cookieParser from 'cookie-parser'

describe('APIController (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.use(cookieParser('SOME_COOKIE_SECRET'))
    app.useGlobalPipes(new ValidationPipe())

    await app.init()
  })

  it('/api/globals (GET) - Fails when unauthenticated', async () => {
    return await request(app.getHttpServer())
      .get('/api/globals')
      .expect(401)
      .expect({ statusCode: 401, message: 'Unauthorized' })
  })

  afterEach(async () => await app.close(), 10000)
})

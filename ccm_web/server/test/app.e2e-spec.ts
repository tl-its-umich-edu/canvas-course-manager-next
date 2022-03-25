import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'

import { AppModule } from '../src/app.module'
import { doAppCoreSetup } from '../src/main'
import { Config } from '../src/config'

describe('APIController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    const configService = app.get<ConfigService<Config, true>>(ConfigService)
    const serverConfig = configService.get('server', { infer: true })
    doAppCoreSetup(app, serverConfig)
    await app.init()
  })

  afterAll(async () => await app.close(), 10000)

  it('/api/globals (GET) - Fails when unauthenticated', async () => {
    return await request(app.getHttpServer())
      .get('/api/globals')
      .expect(401)
      .expect({ statusCode: 401, message: 'Unauthorized' })
  })
})

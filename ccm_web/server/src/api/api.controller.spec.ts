import { Test, TestingModule } from '@nestjs/testing'

import { APIController } from './api.controller'
import { APIService } from './api.service'

describe('APIController', () => {
  let apiController: APIController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [APIController],
      providers: [APIService]
    }).compile()

    apiController = app.get<APIController>(APIController)
  })

  describe('hello', () => {
    it('should return data with a "Hooray" message', () => {
      expect(apiController.getHello()).toStrictEqual({
        message: 'You successfully communicated with the backend server. Hooray!'
      })
    })
  })

  describe('globals', () => {
    it('should return globals data', () => {
      expect(apiController.getGlobals()).toStrictEqual({
        environment: process.env.NODE_ENV
      })
    })
  })
})

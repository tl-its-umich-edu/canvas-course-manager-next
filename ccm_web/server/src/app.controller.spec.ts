import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService]
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('hello', () => {
    it('should return data with a "Hooray" message', () => {
      expect(appController.getHello()).toStrictEqual({
        message: 'You successfully communicated with the backend server. Hooray!'
      })
    })
  })

  describe('globals', () => {
    it('should return globals data', () => {
      expect(appController.getGlobals()).toStrictEqual({
        environment: process.env.NODE_ENV
      })
    })
  })
})

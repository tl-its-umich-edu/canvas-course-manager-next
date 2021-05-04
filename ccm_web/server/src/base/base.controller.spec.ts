import { Test, TestingModule } from '@nestjs/testing'
import { BaseController } from './base.controller'
import { BaseService } from './base.service'

describe('BaseController', () => {
  let baseController: BaseController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BaseController],
      providers: [BaseService]
    }).compile()

    baseController = app.get<BaseController>(BaseController)
  })

  describe('hello', () => {
    it('should return data with a "Hooray" message', () => {
      expect(baseController.getHello()).toStrictEqual({
        message: 'You successfully communicated with the backend server. Hooray!'
      })
    })
  })

  describe('globals', () => {
    it('should return globals data', () => {
      expect(baseController.getGlobals()).toStrictEqual({
        environment: process.env.NODE_ENV
      })
    })
  })
})

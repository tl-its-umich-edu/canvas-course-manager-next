import { Test, TestingModule } from '@nestjs/testing'

import { APIController } from './api.controller'
import { APIService } from './api.service'
import { CanvasModule } from '../canvas/canvas.module'
import { CanvasService } from '../canvas/canvas.service'

describe('APIController', () => {
  let apiController: APIController
  let canvasService: CanvasService

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [CanvasModule],
      controllers: [APIController],
      providers: [APIService, CanvasModule]
    }).compile()

    apiController = app.get<APIController>(APIController)
    canvasService = app.get<CanvasService>(CanvasService)
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
      console.log(canvasService.getAuthURL())

      expect(apiController.getGlobals()).toStrictEqual({
        environment: process.env.NODE_ENV,
        canvasAuthURL: canvasService.getAuthURL(),
        user: {
          hasAuthorized: false
        }
      })
    })
  })
})

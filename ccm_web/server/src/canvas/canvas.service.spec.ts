import { ConfigModule, ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { CanvasService } from './canvas.service'

describe('CanvasService', () => {
  let service: CanvasService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [CanvasService, ConfigService]
    }).compile()

    service = module.get<CanvasService>(CanvasService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

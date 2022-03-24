import { Controller, Get } from '@nestjs/common'
import {
  HealthCheck, HealthCheckResult, HealthCheckService, SequelizeHealthIndicator
} from '@nestjs/terminus'

@Controller('health')
export class HealthController {
  constructor (
    private readonly health: HealthCheckService,
    private readonly db: SequelizeHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  async check (): Promise<HealthCheckResult> {
    return await this.health.check([
      async () => await this.db.pingCheck('database', { timeout: 3000 })
    ])
  }
}

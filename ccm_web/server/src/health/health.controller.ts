import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  HealthCheck, HealthCheckResult, HealthCheckService, HttpHealthIndicator, SequelizeHealthIndicator
} from '@nestjs/terminus'

import { Config } from '../config'

@Controller('health')
export class HealthController {
  constructor (
    private readonly configService: ConfigService<Config, true>,
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly db: SequelizeHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  async check (): Promise<HealthCheckResult> {
    const appDomain = this.configService.get('server.domain', { infer: true })
    return await this.health.check([
      async () => await this.http.pingCheck('root', `https://${appDomain}`),
      async () => await this.db.pingCheck('database', { timeout: 3000 })
    ])
  }
}

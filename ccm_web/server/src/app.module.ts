import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'

import { APIModule } from './api/api.module'
import { LTIModule } from './lti/lti.module'
import { UserModule } from './user/user.module'
import { User } from './user/user.model'
import { UserService } from './user/user.service'

import { validateConfig } from './config'
import { CanvasModule } from './canvas/canvas.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateConfig,
      ignoreEnvFile: true,
      isGlobal: true
    }),
    LTIModule,
    APIModule,
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get('db.host'),
        port: configService.get('db.port'),
        username: configService.get('db.user'),
        password: configService.get('db.password'),
        database: configService.get('db.name'),
        models: [User]
      })
    }),
    UserModule,
    CanvasModule
  ],
  providers: [UserService]
})
export class AppModule {}

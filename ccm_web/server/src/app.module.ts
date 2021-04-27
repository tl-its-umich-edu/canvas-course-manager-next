import path from 'path'

import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ServeStaticModule } from '@nestjs/serve-static'

const isDev = process.env.NODE_ENV !== 'production'

const staticPathBase = path.join(__dirname, '..', '..')

const staticPath = path.join(
  staticPathBase,
  isDev ? path.join('dist', 'client') : 'client'
)
console.log(staticPath)

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: staticPath
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}

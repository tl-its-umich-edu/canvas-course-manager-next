import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap () {
  const app = await NestFactory.create(AppModule)
  await app.listen(4000)
}

bootstrap()
  .then(() => console.log('Nest up!'))
  .catch((e) => console.log('Error occurred when starting Nest app: ', e))

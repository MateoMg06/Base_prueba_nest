import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupSwagger } from './config/swagger.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Guards, ValidationPipe, interceptor y filtro se registran en CoreModule.
  app.enableCors();

  const swaggerPath = config.get<string>('swaggerPath', 'docs');
  setupSwagger(app, swaggerPath);

  const port = config.get<number>('port', 3000);
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API:     http://localhost:${port}`);
  logger.log(`Swagger: http://localhost:${port}/${swaggerPath}`);
}
await bootstrap();

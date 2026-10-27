import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { API_KEY_HEADER } from './common/constants/headers.constants.js';

/** Esquema para los endpoints de integración: @ApiSecurity('api-key'). */
const API_KEY_SECURITY = 'api-key';

function setupSwagger(app: INestApplication, path: string) {
  const config = new DocumentBuilder()
    .setTitle('FleetCore API')
    .setDescription(
      [
        'API REST para gestionar el mantenimiento de la flota de FleetCore.',
        '',
        '**Cómo probar:** inicia sesión, pulsa **Authorize** y pega el JWT.',
        `Los endpoints de integración usan \`${API_KEY_HEADER}\` con una clave de \`API_KEYS\`.`,
      ].join('\n'),
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: API_KEY_HEADER,
        in: 'header',
        description: 'API Key configurada en API_KEYS',
      },
      API_KEY_SECURITY,
    )
    .addBearerAuth()
    // Por defecto todo endpoint exige JWT; las integraciones declaran la API Key.
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(path, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Guards, ValidationPipe, interceptor y filtro se registran en AppModule.
  app.use(helmet());
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

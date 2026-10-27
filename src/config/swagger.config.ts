import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  API_KEY_HEADER,
  USER_HEADER,
} from '../common/constants/headers.constants.js';

export const API_KEY_SECURITY = 'api-key';
export const USER_SECURITY = 'x-user';

export function setupSwagger(app: INestApplication, path: string) {
  const config = new DocumentBuilder()
    .setTitle('API Solicitudes Comerciales')
    .setDescription(
      [
        'API REST para registrar y gestionar solicitudes de seguimiento comercial.',
        '',
        '**Cómo probar:** pulsa **Authorize** e ingresa:',
        `- \`${API_KEY_HEADER}\`: una de las claves de \`API_KEYS\` en tu .env (ej. \`dev-key-123\`).`,
        `- \`${USER_HEADER}\`: un usuario de prueba: \`admin\`, \`supervisor\`, \`asesor1\` o \`asesor2\`.`,
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
    .addApiKey(
      {
        type: 'apiKey',
        name: USER_HEADER,
        in: 'header',
        description: 'Usuario de prueba (define el rol)',
      },
      USER_SECURITY,
    )
    // Un solo objeto = ambos encabezados son requeridos a la vez (AND).
    .addSecurityRequirements({ [API_KEY_SECURITY]: [], [USER_SECURITY]: [] })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(path, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}

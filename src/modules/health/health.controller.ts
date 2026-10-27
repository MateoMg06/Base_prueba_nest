import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';

/** Endpoint NO funcional para verificar que la app está arriba (sin x-api-key). */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Estado del servicio (público)', security: [] })
  check() {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }
}

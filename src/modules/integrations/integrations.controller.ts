import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuth } from '../../common/decorators/api-key-auth.decorator.js';
import { IntegrationsService } from './integrations.service.js';

/** Endpoints para sistemas externos: se autentican con x-api-key, no con JWT. */
@ApiTags('Integraciones')
@ApiKeyAuth()
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('fleet-status')
  @ApiOperation({ summary: 'Resumen de disponibilidad de la flota' })
  @ApiOkResponse({
    description: 'Cantidad de vehículos por estado',
    schema: {
      example: { AVAILABLE: 2, IN_MAINTENANCE: 1, INACTIVE: 1, total: 4 },
    },
  })
  fleetStatus() {
    return this.integrationsService.fleetStatus();
  }
}

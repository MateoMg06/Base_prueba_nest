import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { MaintenanceStatus } from '../enums/maintenance-status.enum.js';

export class MaintenanceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MaintenanceStatus })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  estado?: MaintenanceStatus;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { WorkshopStatus } from '../enums/workshop-status.enum.js';

export class WorkshopQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: WorkshopStatus })
  @IsOptional()
  @IsEnum(WorkshopStatus)
  estado?: WorkshopStatus;
}

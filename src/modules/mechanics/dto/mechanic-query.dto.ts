import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { MechanicStatus } from '../enums/mechanic-status.enum.js';

export class MechanicQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MechanicStatus })
  @IsOptional()
  @IsEnum(MechanicStatus)
  estado?: MechanicStatus;
}

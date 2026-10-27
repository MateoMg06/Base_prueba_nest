import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum.js';
import { Trim } from '../../../common/utils/transformers.util.js';

export class RegisterDto {
  @ApiProperty({ example: 'Laura Gómez', maxLength: 120 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @ApiProperty({ example: 'laura@fleetcore.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({ example: 'Secreta123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.TECHNICIAN,
    description:
      'ADMIN y MANAGER solo pueden ser asignados por un ADMIN autenticado',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

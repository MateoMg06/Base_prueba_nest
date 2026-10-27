import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// Parámetros que GitHub envía al volver al callback
export class GithubCallbackDto {
  @ApiProperty({ description: 'Código temporal que entrega GitHub' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Valor state que enviamos al iniciar el login' })
  @IsString()
  @IsNotEmpty()
  state: string;
}

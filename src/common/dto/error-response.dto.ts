import { ApiProperty } from '@nestjs/swagger';

/** Forma de TODAS las respuestas de error (generada por AllExceptionsFilter). */
export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: false;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['cliente should not be empty'],
  })
  message: string | string[];

  @ApiProperty({ example: '/maintenances' })
  path: string;

  @ApiProperty({ example: 'POST' })
  method: string;

  @ApiProperty({ example: '2026-10-26T12:00:00.000Z' })
  timestamp: string;
}

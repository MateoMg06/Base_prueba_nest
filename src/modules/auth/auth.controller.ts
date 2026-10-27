import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '../../common/decorators/api-error-responses.decorator.js';
import { ApiWrappedResponse } from '../../common/decorators/api-wrapped-response.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface.js';
import { AuthTokenDto, AuthUserDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthService } from './auth.service.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrar usuario',
    description:
      'Abierto para TECHNICIAN. Para ADMIN o MANAGER envía el Bearer de un ADMIN.',
  })
  @ApiWrappedResponse(AuthUserDto, { status: HttpStatus.CREATED })
  @ApiConflictResponse({
    description: 'Correo ya registrado',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Rol no permitido',
    type: ErrorResponseDto,
  })
  register(
    @Body() dto: RegisterDto,
    @CurrentUser() requester?: AuthenticatedUser,
  ) {
    return this.authService.register(dto, requester);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiWrappedResponse(AuthTokenDto)
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas',
    type: ErrorResponseDto,
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Usuario autenticado según el token' })
  @ApiCommonErrors()
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}

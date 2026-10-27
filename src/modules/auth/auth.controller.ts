import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiFoundResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
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
import { GithubCallbackDto } from './dto/github-callback.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthService } from './auth.service.js';
import { GithubService } from './github.service.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly githubService: GithubService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrar usuario',
    description:
      'Abierto para TECHNICIAN. Para registrar un ADMIN envía el Bearer de un ADMIN.',
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
    @CurrentUser() currentUser?: AuthenticatedUser,
  ) {
    return this.authService.register(dto, currentUser);
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

  @Public()
  @Get('github')
  @ApiOperation({
    summary: 'Login con GitHub (abrir en el navegador)',
    description:
      'Redirige a GitHub; al autorizar, GitHub vuelve a /auth/github/callback y se entrega el JWT.',
  })
  @ApiFoundResponse({ description: 'Redirección a GitHub' })
  @ApiServiceUnavailableResponse({
    description: 'Faltan las variables GITHUB_* en el entorno',
    type: ErrorResponseDto,
  })
  async github(@Res() res: Response) {
    res.redirect(await this.githubService.getLoginUrl());
  }

  @Public()
  @Get('github/callback')
  @ApiOperation({
    summary: 'Callback de GitHub: crea o busca el usuario y entrega el JWT',
  })
  @ApiWrappedResponse(AuthTokenDto)
  @ApiUnauthorizedResponse({
    description: 'state inválido o GitHub rechazó el código',
    type: ErrorResponseDto,
  })
  githubCallback(@Query() query: GithubCallbackDto) {
    return this.githubService.login(query.code, query.state);
  }

  @Get('me')
  @ApiOperation({ summary: 'Usuario autenticado según el token' })
  @ApiCommonErrors()
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}

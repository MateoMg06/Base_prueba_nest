import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrors } from '../../common/decorators/api-error-responses.decorator.js';
import { ApiWrappedResponse } from '../../common/decorators/api-wrapped-response.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { Role } from '../../common/enums/role.enum.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { Item } from './entities/item.entity.js';
import { ItemService } from './item.service.js';

/** Controlador delgado: solo enruta y documenta; la lógica vive en ItemService. */
@ApiTags('Items (plantilla)')
@ApiCommonErrors()
@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear item' })
  @ApiWrappedResponse(Item, { status: HttpStatus.CREATED })
  create(@Body() dto: CreateItemDto) {
    return this.itemService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar items paginados' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.itemService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener item por id' })
  @ApiWrappedResponse(Item)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar item' })
  @ApiWrappedResponse(Item)
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemDto) {
    return this.itemService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar item' })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.itemService.remove(id);
  }
}

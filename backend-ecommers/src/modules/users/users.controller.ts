import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import type { Request } from 'express';
import type { Tenant } from '../tenants/entities/tenant.entity';

/**
 * Tipe request kustom agar semua handler eksplisit menerima tenant dari middleware.
 */
type RequestWithTenant = Request & {
  tenant: Tenant;
  tenantId: string;
};

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ===========================================================
  // 🧩 CREATE USER (Tenant-Aware)
  // ===========================================================
  @Post()
  @ApiOperation({ summary: 'Tambah user baru untuk tenant aktif' })
  @ApiResponse({
    status: 201,
    description: 'User berhasil dibuat',
    type: UserResponseDto,
  })
  async create(
    @Body() dto: CreateUserDto,
    @Req() req: RequestWithTenant,
  ): Promise<UserResponseDto> {
    return (await this.usersService.create(dto, req.tenant)) as UserResponseDto;
  }

  // ===========================================================
  // 📜 LIST USERS
  // ===========================================================
  @Get()
  @ApiOperation({ summary: 'Daftar user untuk tenant aktif' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(@Req() req: RequestWithTenant): Promise<UserResponseDto[]> {
    return (await this.usersService.findAll(req.tenant)) as UserResponseDto[];
  }

  // ===========================================================
  // 🔍 FIND ONE
  // ===========================================================
  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail user' })
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithTenant,
  ): Promise<UserResponseDto> {
    return (await this.usersService.findById(
      id,
      req.tenant,
    )) as UserResponseDto;
  }

  // ===========================================================
  // 🧱 UPDATE USER
  // ===========================================================
  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: RequestWithTenant,
  ): Promise<UserResponseDto> {
    return (await this.usersService.update(
      id,
      dto,
      req.tenant,
    )) as UserResponseDto;
  }

  // ===========================================================
  // 🗑️ DELETE USER
  // ===========================================================
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus user dari tenant aktif' })
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithTenant,
  ): Promise<UserResponseDto> {
    return (await this.usersService.remove(id, req.tenant)) as UserResponseDto;
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { CurrentTenant } from '@/common/decorators/current-tenant.decorator';

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
    @CurrentTenant() tenantId: string,
  ): Promise<UserResponseDto> {
    return (await this.usersService.create(dto, tenantId)) as UserResponseDto;
  }

  // ===========================================================
  // 📜 LIST USERS
  // ===========================================================
  @Get()
  @ApiOperation({ summary: 'Daftar user untuk tenant aktif' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(@CurrentTenant() tenantId: string): Promise<UserResponseDto[]> {
    return (await this.usersService.findAllByTenant(
      tenantId,
    )) as UserResponseDto[];
  }

  // ===========================================================
  // 🔍 FIND ONE
  // ===========================================================
  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail user' })
  async findOne(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<UserResponseDto> {
    return (await this.usersService.findById(id, tenantId)) as UserResponseDto;
  }

  // ===========================================================
  // 🧱 UPDATE USER
  // ===========================================================
  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentTenant() tenantId: string,
  ): Promise<UserResponseDto> {
    return (await this.usersService.update(
      id,
      dto,
      tenantId,
    )) as UserResponseDto;
  }

  // ===========================================================
  // 🗑️ DELETE USER
  // ===========================================================
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus user dari tenant aktif' })
  async remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<UserResponseDto> {
    return (await this.usersService.remove(id, tenantId)) as UserResponseDto;
  }
}

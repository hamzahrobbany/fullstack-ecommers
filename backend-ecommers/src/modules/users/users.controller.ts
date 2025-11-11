import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ===========================================================
  // 🧩 CREATE USER (Tenant-Aware)
  // ===========================================================
  @Post()
  @ApiOperation({ summary: 'Tambah user baru untuk tenant aktif' })
  @ApiResponse({ status: 201, description: 'User berhasil dibuat', type: UserResponseDto })
  async create(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.usersService.create(dto, req.tenant);
  }

  // ===========================================================
  // 📜 LIST USERS
  // ===========================================================
  @Get()
  @ApiOperation({ summary: 'Daftar user untuk tenant aktif' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(@Req() req: any) {
    return this.usersService.findAll(req.tenant);
  }

  // ===========================================================
  // 🔍 FIND ONE
  // ===========================================================
  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail user' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.usersService.findById(id, req.tenant);
  }

  // ===========================================================
  // 🧱 UPDATE USER
  // ===========================================================
  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui user' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    return this.usersService.update(id, dto, req.tenant);
  }

  // ===========================================================
  // 🗑️ DELETE USER
  // ===========================================================
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus user dari tenant aktif' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.usersService.remove(id, req.tenant);
  }
}

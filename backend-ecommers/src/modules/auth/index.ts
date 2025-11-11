// =======================================================
// 🧩 Auth Module Barrel File
// =======================================================
// Memudahkan import dari luar module tanpa path berlapis
// Contoh: import { AuthModule } from '@/modules/auth'

// ===== Core Files =====
export * from './auth.module';
export * from './auth.service';
export * from './auth.controller';
export * from './auth.repository';

// ===== DTOs =====
export * from './dto/login.dto';
export * from './dto/register.dto';
export * from './dto/refresh-token.dto';
export * from './dto/logout.dto';

// ===== Guards =====
export * from './guards/jwt-access.guard';
export * from './guards/jwt-refresh.guard';
export * from './guards/jwt-auth.guard';

// ===== Strategies =====
export * from './strategies/jwt-access.strategy';
export * from './strategies/jwt-refresh.strategy';
export * from './strategies/local.strategy';

// ===== Interfaces =====
export * from './interfaces/jwt-payload.interface';
export * from './interfaces/token-response.interface';

// ===== Utils =====
export * from './utils/password.util';
export * from './utils/token.util';

// ===== (Optional future) Entities / Tests =====
// export * from './entities/auth.entity';
// export * from './tests/auth.service.spec';

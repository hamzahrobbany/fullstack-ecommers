import { SetMetadata } from '@nestjs/common';

/**
 * ✅ Public Decorator
 * 
 * Tandai route agar dilewati oleh AuthGuard (tanpa JWT).
 * Misal:
 * 
 * @Public()
 * @Get('health')
 * getHealth() {
 *   return { message: 'Server is alive' };
 * }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

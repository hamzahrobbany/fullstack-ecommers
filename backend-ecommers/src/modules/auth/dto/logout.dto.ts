import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token yang ingin dicabut' })
  @IsString()
  refreshToken: string;
}

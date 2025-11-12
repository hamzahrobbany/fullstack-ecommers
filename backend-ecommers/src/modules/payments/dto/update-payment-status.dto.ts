import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@/prisma/enums';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.SUCCESS })
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

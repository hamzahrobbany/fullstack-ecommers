import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@/prisma/enums';
import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PAID })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

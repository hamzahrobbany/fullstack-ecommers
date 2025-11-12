import { Module } from '@nestjs/common';
import { DebugContextController } from './debug-context.controller';

@Module({
  controllers: [DebugContextController],
})
export class DebugModule {}

import { Controller, Post, Body, Get } from '@nestjs/common';
import { SubscribeService } from './subscribe.service';

@Controller('subscribe')
export class SubscribeController {
  constructor(private readonly subscribeService: SubscribeService) {}

  @Get()
  findAll() {
    return this.subscribeService.findAll();
  }

  @Post()
  add(@Body() body: { tenantId: string; email: string; name?: string }) {
    return this.subscribeService.addSubscriber(body);
  }
}

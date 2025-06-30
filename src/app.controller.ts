import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('bikes')
  async getBikes(lng?: number, lat?: number) {
    return await this.appService.getBikes(127.2661, 36.5152);
  }
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { PathModule } from './path/path.module';

@Module({
  imports: [HttpModule, PathModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { WxcloudService } from 'src/wxcloud/wxcloud.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [ApiController],
  providers: [ApiService, WxcloudService],
})
export class ApiModule {}

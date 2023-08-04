import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor, ResponseInterceptor } from './app.itc';
import { AllExceptionsFilter } from './app.filter';
import { ConfigService } from '@nestjs/config';
import utils from 'uni-utils';
import path from 'path';

async function bootstrap() {
  const preCreateDirs = [path.resolve(__dirname, `./token`)];
  await utils.createDir(preCreateDirs);
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new ResponseInterceptor());
  const appConfig = app.get(ConfigService);
  console.log(`API服务启动开始监听: ${appConfig.get('port')}`);
  await app.listen(appConfig.get('port'));
}
bootstrap();

import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Redirect('https://github.com/katu-project/dev-api')
  getHello() {
    return {
      name: '卡兔协同开发API',
      desc: '使用说明请访问: https://github.com/katu-project/dev-api',
    };
  }
}

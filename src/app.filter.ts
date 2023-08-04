import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response.status(200).json({
      code: 1,
      timestamp: new Date().getTime(),
      msg: (exception as Error)?.message || '服务错误',
    });
  }
}

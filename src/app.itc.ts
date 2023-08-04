import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Observable, tap, map } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const time = new Date().toLocaleString();
    const req = context.switchToHttp().getRequest<Request>();
    const resp = context.switchToHttp().getResponse();
    return next.handle().pipe(
      tap(() => {
        console.log(
          `[App] - ${time} ${req.method} ${req.url} : ${resp.statusCode} - ${
            Date.now() - now
          }ms`,
        );
      }),
    );
  }
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((value) => {
        // post status set 200
        if (req.method === 'POST') {
          if (res.statusCode === HttpStatus.CREATED) {
            res.status(HttpStatus.OK);
          }
        }
        // 返回数据统一格式
        if (typeof value === 'string') {
          return { code: 0, data: value, msg: '' };
        }
        return value;
      }),
    );
  }
}

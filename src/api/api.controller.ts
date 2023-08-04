import {
  Controller,
  Get,
  Post,
  Param,
  Headers,
  Query,
  Res,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiService } from './api.service';
import { RequiredPipe } from './api.pipe';
import { ApiGuard } from './api.guard';
import { ApiParamsDto, ApiBodyDto } from './api.dto';

@Controller('api')
@UseGuards(ApiGuard)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('/app/download')
  async download(
    @Query('url', RequiredPipe) url: string,
    @Headers('token') token: string,
    @Res() res: Response,
  ) {
    const {
      code,
      data: { downloadUrl },
    } = await this.apiService.getDownloadInfo(url, token);
    if (code !== 0) {
      return res.sendStatus(404);
    }
    return res.redirect(downloadUrl);
  }

  @Post('/app/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('uploadId', RequiredPipe) uploadId: string,
    @Headers('token') token: string,
  ) {
    const { cloudPath } = await this.apiService.getUploadInfo(uploadId, token);
    return this.apiService.upload(cloudPath, file);
  }

  @Post('/:target/:action')
  api(
    @Param() params: ApiParamsDto,
    @Body() body: ApiBodyDto,
    @Headers('token') token: string,
  ) {
    return this.apiService.api(params, body, token);
  }
}

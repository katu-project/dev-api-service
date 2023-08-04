import { Injectable } from '@nestjs/common';
import { WxcloudService } from 'src/wxcloud/wxcloud.service';

@Injectable()
export class ApiService {
  constructor(private readonly wxcloud: WxcloudService) {}

  async api(params, body, token) {
    return this.wxcloud.apiProxy(
      `${params.target}/${params.action}`,
      body,
      token,
    );
  }

  async getUploadInfo(uploadId, token) {
    const { code, data, msg } = await this.wxcloud.apiProxy(
      'app/getUploadInfo',
      {
        uploadId,
      },
      token,
    );
    if (code !== 0) {
      throw Error(msg);
    }
    return data;
  }

  async getDownloadInfo(fileId, token) {
    return this.wxcloud.apiProxy(
      'app/getDownloadInfo',
      {
        fileId,
      },
      token,
    );
  }

  async upload(cloudPath, file) {
    return this.wxcloud.storageUpload(file, cloudPath);
  }
}

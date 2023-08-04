import path from 'path';
import { Injectable, OnModuleInit } from '@nestjs/common';
import utils from 'uni-utils';
import axios from 'axios';
import FormData from 'form-data';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WxcloudService implements OnModuleInit {
  _config;
  _wxToken = '';

  constructor(private readonly configService: ConfigService) {
    this._config = configService.get('wxcloud');
  }

  async onModuleInit() {
    console.log('微信云凭证初始化');
    try {
      await this.initAccessToken();
    } catch (error) {
      console.log('第一次初始化凭证失败:', error);
    }
  }

  get config() {
    return this._config;
  }
  get access_token() {
    return this._wxToken;
  }

  get useApp() {
    return this.config.useApp;
  }

  get appConfig() {
    return this.config.apps[this.useApp];
  }

  get useEnv() {
    return this.appConfig.env;
  }

  get useApiName() {
    return this.appConfig.apiName;
  }

  async apiProxy(action, body, token) {
    const postData = {
      action,
      origin: 'http',
      token,
      data: body || {},
    };
    const url = `${this.config.cloudInvokePoint}?access_token=${this.access_token}&env=${this.useEnv}&name=${this.useApiName}`;
    let resp;

    try {
      const { status, data } = await axios.post(url, postData);
      if (status !== 200) throw Error('网络错误');
      // 云函数返回
      if (data.errcode !== 0) {
        console.log(data);
        if (data.errcode === 40001) {
          throw Error('代理凭证无效');
        }
        if (data.errmsg.startsWith('access_token expired')) {
          throw Error('代理凭证过期');
        }
        throw Error('代理请求出错');
      }
      try {
        resp = JSON.parse(data.resp_data);
      } catch (e) {
        console.log(data, e.message);
        throw Error('返回解析出错');
      }
    } catch (e) {
      throw Error(`${e.message || '未知错误'}，请联系客服`);
    }

    // 业务返回
    if (resp.code !== 0 && resp.code !== 1) {
      throw Error(resp.msg || '内部错误');
    }

    return resp;
  }

  async storageUpload(file, cloudPath) {
    const postData = {
      env: this.useEnv,
      path: cloudPath,
    };
    const url = `${this.config.cloudUploadFilePoint}?access_token=${this.access_token}`;
    const { status, data: res } = await axios.post(url, postData);
    if (status !== 200 || res.errcode !== 0) {
      throw Error(res.errmsg || '网络错误');
    }
    const uploadParams = {
      key: cloudPath,
      Signature: res.authorization,
      'x-cos-security-token': res.token,
      'x-cos-meta-fileid': res.cos_file_id,
    };
    const form = new FormData();
    form.append('file', file.buffer, file.originalname);
    const queryString = new URLSearchParams(uploadParams).toString();
    const uploadResp = await axios.post(`${res.url}?${queryString}`, form);
    if (uploadResp.status !== 204) {
      console.log(uploadResp);
      throw Error('请求错误');
    }
    return res.file_id;
  }

  async storageDownload(fileid) {
    const postData = {
      env: this.useEnv,
      file_list: [
        {
          fileid,
          max_age: 60,
        },
      ],
    };
    const url = `${this.config.cloudDownloadFilePoint}?access_token=${this.access_token}`;
    const { status, data: res } = await axios.post(url, postData);
    if (status !== 200 || res.errcode !== 0) {
      console.log(res);
      throw Error(res.errmsg || '网络错误');
    }

    if (!Array.isArray(res.file_list) || res.file_list[0].status !== 0) {
      console.log(res);
      throw Error('下载错误');
    }
    return res.file_list[0].download_url;
  }

  async initAccessToken() {
    // 检查缓存的凭证有效期是不是小于半个小时
    const tokenPath = path.resolve(__dirname, `../token/${this.useApp}`);
    let tokenInfo = '';
    try {
      tokenInfo = await utils.readFile(tokenPath);
    } catch (e) {
      console.log(`未检测到凭证缓存文件: ${e.message}`);
    }
    if (tokenInfo) {
      const [token, expiresTime] = tokenInfo.split(':');
      const expiresTimeText = new Date(
        parseInt(expiresTime) * 1000,
      ).toLocaleString();
      console.log(`凭证在: ${expiresTimeText} 之前有效`);
      if (utils.getTimeStamp() < parseInt(expiresTime) - 1800) {
        this._wxToken = token;
        console.log('本地缓存凭证有效，跳过本次申请');
        return token;
      }
    }

    console.log('缓存凭证过期, 重新申请');
    const { appId, appKey } = this.appConfig;
    const url = `${this.config.wxTokenPoint}?grant_type=client_credential&appid=${appId}&secret=${appKey}`;
    const { data: res } = await axios.get(url);
    if (res && res.access_token) {
      const expiresTime = utils.getTimeStamp() + res.expires_in;
      const cacheToken = `${res.access_token}:${expiresTime}`;
      await utils.saveFile(cacheToken, tokenPath);
      this._wxToken = res.access_token;
      console.log('凭证申请成功');
    } else {
      console.log(res);
      throw Error(`凭证申请错误`);
    }
    return this.access_token;
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateAccessToken() {
    console.log(new Date().toLocaleString() + ' 刷新凭证');
    try {
      await this.initAccessToken();
    } catch (error) {
      console.log('凭证刷新失败');
    }
  }
}

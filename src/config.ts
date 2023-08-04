export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  wxcloud: {
    cloudInvokePoint: 'https://api.weixin.qq.com/tcb/invokecloudfunction',
    cloudUploadFilePoint: 'https://api.weixin.qq.com/tcb/uploadfile',
    cloudDownloadFilePoint: 'https://api.weixin.qq.com/tcb/batchdownloadfile',
    wxTokenPoint: 'https://api.weixin.qq.com/cgi-bin/token',
    useApp: 'default',
    apps: {
      default: {
        appId: process.env.DEFAULT_APP_ID,
        appKey: process.env.DEFAULT_APP_KEY,
        apiName: process.env.DEFAULT_APP_API_NAME,
        env: process.env.DEFAULT_APP_ENV,
      },
    },
  },
});

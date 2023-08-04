FROM node:18-alpine

# 设置容器内的当前目录
WORKDIR /app

# 使用速度更快的国内镜像源
RUN npm config set registry https://registry.npmmirror.com

# 将这些文件拷贝到容器中
COPY package.json package-lock.json ./

# 安装依赖
RUN npm install

# 将包括源文件在内的所有文件拷贝到容器中（在 .dockerignore 中的文件除外）
COPY . .


# 最佳方式为先在本地build，只复制打包好的代码进来，然后只安装依赖包，不安装开发依赖，节省空间
# COPY ./dist .
# RUN npm ci --omit=dev

# 本地测试时开启，加载配置
# COPY .env.local ./

# 运行编译
RUN npm run build

# 设置环境变量
ENV NODE_ENV=production HOST=0.0.0.0

# 兼容智障微信搞的自签名证书 
# https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/weixin/open.html#%E4%BD%BF%E7%94%A8%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9
ENV NODE_EXTRA_CA_CERTS=/app/cert/certificate.crt

# 运行项目
CMD ["npm", "run", "start:prod"]

# 服务暴露的端口
EXPOSE 3000
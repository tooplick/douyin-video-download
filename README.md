# 抖音视频下载

免费在线抖音视频下载工具，部署在 Cloudflare Pages 上。

## ✨ 功能

- 🔗 支持多种抖音链接格式（分享链接、短链接、视频页面链接）
- 🎬 在线视频预览播放
- 📊 多画质选择（4K / 1440p / 1080p / 720p / 540p）
- 🖼️ 图集作品支持（预览 + 批量下载）
- 📱 响应式设计，适配移动端

## 🛠️ 技术栈

- **前端**: HTML + CSS + JavaScript（原生，无框架）
- **后端**: Cloudflare Pages Functions
- **API**: [Douyin_TikTok_Download_API](https://github.com/Evil0ctal/Douyin_TikTok_Download_API)

## 📦 部署

### Cloudflare Pages

1. Fork 本仓库
2. 在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 中创建 Pages 项目
3. 连接 GitHub 仓库
4. 构建设置：
   - **构建命令**: 留空
   - **构建输出目录**: `/`
5. 部署完成

### 本地开发

```bash
# 安装 wrangler
npm install -g wrangler

# 启动本地开发服务器
npx wrangler pages dev .
```

## 📁 目录结构

```
├── index.html        # 主页面
├── style.css         # 样式
├── script.js         # 前端逻辑
├── functions/
│   └── api/
│       ├── parse.js      # 解析链接 API
│       └── download.js   # 代理下载 API
├── _headers          # 自定义 Headers
└── README.md
```

## 🙏 致谢

本项目基于 [Douyin_TikTok_Download_API](https://github.com/Evil0ctal/Douyin_TikTok_Download_API)

## ⚠️ 免责声明

本项目仅供学习交流使用，请勿用于商业或非法用途。
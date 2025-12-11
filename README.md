# AI客服机器人网页

一个基于React、TypeScript和智谱清言Flash API的AI客服机器人网页应用。

## 功能特性

- 💬 简洁直观的聊天界面
- ⚙️ 完整的设置面板，支持模型切换和参数配置
- 🔑 API Key安全管理
- 🎭 人设/指令预设功能
- 🌓 支持明暗主题切换
- 💾 本地数据持久化存储

## 技术栈

- React 18+
- TypeScript
- Tailwind CSS
- Vite
- Lucide React（图标）
- Sonner（通知组件）

## 安装与运行

### 前提条件

- Node.js 18+
- npm/pnpm/yarn
- Cloudflare Wrangler（用于部署）

### 安装依赖

使用pnpm安装依赖：

```bash
pnpm install
```

如果没有安装pnpm，可以先安装：

```bash
npm install -g pnpm
```

### 本地开发

启动本地开发服务器：

```bash
pnpm dev
```

服务器将运行在 http://localhost:3000

### 构建项目

生成生产环境构建文件：

```bash
pnpm build
```

构建后的文件将生成在 `dist` 目录中。

## 部署指南

由于这是一个包含TypeScript的项目，需要先构建再部署。以下是使用Cloudflare Wrangler部署的步骤：

### 1. 安装Cloudflare Wrangler

```bash
npm install -g wrangler
```

### 2. 登录Cloudflare账号

```bash
wrangler login
```

按照提示在浏览器中完成登录授权。

### 3. 初始化Wrangler配置

在项目根目录下创建`wrangler.toml`文件：

```toml
name = "ai-customer-service"
type = "static"
account_id = "你的Cloudflare账号ID"
zone_id = "你的域名区域ID"
compatibility_date = "2025-12-01"

[site]
bucket = "./dist"
entry-point = "."

[[redirects]]
source = "/"
destination = "/index.html"
status_code = 200
```

将上述内容中的`account_id`和`zone_id`替换为你自己的Cloudflare账号信息。

### 4. 构建并部署

```bash
pnpm build
wrangler deploy
```

部署成功后，Wrangler会提供一个URL，你可以通过该URL访问你的应用。

## API使用说明

本应用使用智谱清言Flash API进行AI交互。以下是API调用的关键信息：

### API基础URL

```
https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/
```

### 支持的模型

- GLM-4.1V-Thinking
- GLM-4-Flash-250414
- GLM-4V-Flash
- GLM-Z1-Flash
- CogView-3-Flash
- CogVideoX-Flash

### 请求格式

```javascript
// 示例请求体
{
  messages: [
    { role: 'system', content: '系统提示/人设' },
    { role: 'user', content: '用户消息' }
  ],
  temperature: 0.7,  // 控制生成内容的随机性
  max_tokens: 2048   // 最大回复长度
}
```

### 注意事项

- 请确保在设置中正确配置API Key
- API Key将安全存储在浏览器本地存储中
- 免费API可能有使用次数和频率限制

## 配置说明

在应用中，点击右上角的设置按钮可以配置以下参数：

- **API Key**: 你的智谱清言API Key
- **模型**: 选择要使用的AI模型
- **温度**: 控制生成内容的随机性（0-1之间）
- **最大回复长度**: 限制AI回复的最大长度
- **人设预设**: 创建和管理不同的系统提示/人设

## 本地数据存储

应用使用浏览器的localStorage进行数据持久化：

- 聊天记录自动保存
- 设置参数自动保存
- 刷新页面后数据不会丢失

## 开发说明

### 项目结构

```
src/
├── components/     # React组件
├── contexts/       # React上下文
├── hooks/          # 自定义Hooks
├── lib/            # 工具函数
├── pages/          # 页面组件
├── services/       # API服务和存储服务
├── types/          # TypeScript类型定义
├── App.tsx         # 应用入口组件
└── main.tsx        # 渲染入口
```

### 开发规范

- 遵循React最佳实践
- 使用TypeScript确保类型安全
- 使用Tailwind CSS进行样式设计
- 组件化开发，保持代码清晰可维护

## 常见问题

### API调用失败

- 检查API Key是否正确
- 确保网络连接正常
- 查看浏览器控制台错误信息

### 部署问题

- 确保已正确安装并配置Cloudflare Wrangler
- 检查wrangler.toml文件中的配置是否正确
- 确认构建步骤已成功完成

### 其他问题

如果遇到其他问题，请在GitHub上提交Issue或联系开发团队。

## License

MIT
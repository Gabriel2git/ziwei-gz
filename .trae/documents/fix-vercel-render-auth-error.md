# 修复 Vercel + Render 部署的认证网络错误

## 问题现象

从截图可以看到，在 Vercel 部署的前端页面中，输入邀请码后显示"网络错误，请稍后重试"。

## 根本原因分析

### 1. 前端调用的是相对路径

**AuthContext.tsx** 第44行：
```typescript
const response = await fetch('/api/verify-code', {
```

这是一个相对路径，在 Vercel 部署后会请求：
```
https://your-vercel-app.vercel.app/api/verify-code
```

但后端 API 实际部署在 Render：
```
https://your-render-app.onrender.com/api/verify-code
```

### 2. 其他 API 调用使用了环境变量

**useZiweiData.ts** 第25行：
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

**ai.ts** 第514行：
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

这些调用都使用了 `NEXT_PUBLIC_API_URL` 环境变量，可以正确指向 Render 后端。

## 修复方案

### 方案：AuthContext 使用绝对路径调用后端

修改 `AuthContext.tsx` 中的 `login` 函数，使用与 `useZiweiData.ts` 相同的方式，通过环境变量获取后端地址。

### 代码变更

#### 文件: frontend/src/contexts/AuthContext.tsx

**修改前：**
```typescript
const login = async (code: string): Promise<boolean> => {
  // ...
  const response = await fetch('/api/verify-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  // ...
};
```

**修改后：**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const login = async (code: string): Promise<boolean> => {
  // ...
  const response = await fetch(`${API_BASE_URL}/api/verify-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  // ...
};
```

## Vercel 环境变量配置

在 Vercel 项目中设置环境变量：

```
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

### 配置步骤

1. 登录 Vercel Dashboard
2. 进入项目设置
3. 点击 "Environment Variables"
4. 添加变量：
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-render-app.onrender.com` (你的 Render 后端地址)
5. 点击 Save
6. 重新部署项目

## Render 后端 CORS 配置检查

确保 Render 后端允许 Vercel 域名的跨域请求：

**src/server.js** 应该包含类似以下 CORS 配置：
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
// 或者指定具体域名
res.setHeader('Access-Control-Allow-Origin', 'https://your-vercel-app.vercel.app');
```

## 验证步骤

1. 修改代码并提交到 GitHub
2. Vercel 自动部署后，检查环境变量是否设置正确
3. 访问 Vercel 页面，输入邀请码测试
4. 打开浏览器开发者工具，检查网络请求是否发送到正确的 Render 地址

## 备选方案

如果仍然有问题，可以考虑：

### 方案 A: Vercel API Route 代理
在 Vercel 创建 API Route 代理请求到 Render 后端。

### 方案 B: 直接使用 Render 前端
将前端也部署
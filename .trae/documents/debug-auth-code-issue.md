# 调试邀请码验证问题

## 问题现象

从截图可以看到：
- 请求地址：`https://ziwei-api-zdy7.onrender.com/api/verify-code`
- 状态码：401 (Unauthorized)
- 用户输入的邀请码：`gznb`
- Render 环境变量已设置：`AUTH_CODE=gznb`

## 可能的原因

### 1. 环境变量未正确加载
虽然 Render 上设置了 `AUTH_CODE`，但代码中的 `process.env.AUTH_CODE` 可能是 `undefined`。

### 2. Render 服务未重新部署
代码修改后（支持生产环境变量），Render 服务可能还没有重新部署。

### 3. 环境变量名称不匹配
检查 Render 上的环境变量名称是否完全匹配 `AUTH_CODE`（大写，无空格）。

## 调试方案

### 方案 1：添加调试日志

在 `server.js` 中添加日志，输出环境变量的值：

```javascript
// 在文件开头添加
console.log('环境变量 AUTH_CODE:', process.env.AUTH_CODE);
console.log('NODE_ENV:', process.env.NODE_ENV);

// 在 verify-code 路由中添加
console.log('收到邀请码:', code);
console.log('环境变量 AUTH_CODE:', process.env.AUTH_CODE);
console.log('验证结果:', code === process.env.AUTH_CODE);
```

### 方案 2：检查 Render 部署状态

1. 登录 Render Dashboard
2. 查看服务是否已重新部署
3. 查看部署日志，确认代码已更新

### 方案 3：强制重新部署

在 Render Dashboard 中手动触发重新部署：
1. 进入服务页面
2. 点击 "Manual Deploy" → "Deploy latest commit"

## 修复步骤

### 步骤 1：添加调试日志

修改 `src/server.js`：

```javascript
const http = require('http');
const iztro = require('iztro');
const RetrievalService = require('../backend/services/retrievalService');

// 加载环境变量（本地开发时从 .env 文件加载，生产环境使用平台提供的环境变量）
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
}

// 调试日志：输出环境变量
console.log('=== 服务器启动 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('AUTH_CODE:', process.env.AUTH_CODE ? '已设置' : '未设置');
console.log('AUTH_CODE 值:', process.env.AUTH_CODE);
```

### 步骤 2：在验证路由中添加日志

```javascript
if (req.method === 'POST' && req.url === '/api/verify-code') {
  try {
    const body = await parseRequestBody(req);
    const { code } = body;
    
    console.log('收到验证请求');
    console.log('用户输入的 code:', code);
    console.log('环境变量 AUTH_CODE:', process.env.AUTH_CODE);
    
    if (!code) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: '请输入邀请码' }));
      return;
    }

    // 验证邀请码
    if (code === process.env.AUTH_CODE) {
      console.log('验证成功');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, message: '验证成功' }));
    } else {
      console.log('验证失败: 邀请码不匹配');
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: '邀请码错误' }));
    }
    // ...
  }
}
```

### 步骤 3：提交并推送

```bash
git add src/server.js
git commit -m "添加调试日志，排查邀请码验证问题"
git push origin main
```

### 步骤 4：查看 Render 日志

1. 等待 Render 自动部署
2. 在 Render Dashboard 中查看日志
3. 确认环境变量是否正确加载

## 备选方案

如果调试后发现环境变量确实没有加载，可以尝试：

### 方案 A：直接在代码中硬编码（仅用于测试）

```javascript
const AUTH_CODE = process.env.AUTH_CODE || 'gznb';
```

### 方案 B：检查 Render 环境变量配置

确保在 Render Dashboard 中：
1. 环境变量名称完全匹配：`AUTH_CODE`
2. 没有多余的空格或特殊字符
3. 服务已经重新部署

### 方案 C：使用 Render 的 Shell 检查

在 Render Dashboard 中：
1. 点击 "Shell" 标签
2. 运行 `echo $AUTH_CODE` 检查环境变量

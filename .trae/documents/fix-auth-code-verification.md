# 修复邀请码验证失败问题

## 问题现象

从截图可以看到：
- 用户输入邀请码 `gznb`
- 显示"邀请码错误"
- 不再显示"网络错误"，说明前端已能正常连接到后端

## 根本原因分析

### 后端验证逻辑

**src/server.js** 第201行：
```javascript
if (code === process.env.AUTH_CODE) {
  // 验证成功
} else {
  res.statusCode = 401;
  res.end(JSON.stringify({ error: '邀请码错误' }));
}
```

### 问题定位

1. **本地开发环境**：`backend/.env` 中设置了 `AUTH_CODE=gznb`，本地测试正常
2. **Render 部署环境**：环境变量 `AUTH_CODE` 可能**未设置**或**设置不正确**

### 验证方法

后端在启动时会加载环境变量：
```javascript
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
```

但这只适用于本地开发。在 Render 部署时，需要从 Render 的环境变量配置中读取。

## 修复方案

### 方案：在 Render 上设置环境变量

**不需要修改代码**，只需要在 Render 平台上配置环境变量。

### 配置步骤

1. 登录 Render Dashboard (https://dashboard.render.com)
2. 找到你的后端服务 `ziwei-api`
3. 点击 **Environment** 标签
4. 添加环境变量：
   - **Key**: `AUTH_CODE`
   - **Value**: `gznb` (或你想设置的其他邀请码)
5. 点击 **Save Changes**
6. 服务会自动重新部署

### 备选方案：添加调试日志

如果设置环境变量后仍然有问题，可以在后端添加调试日志来排查：

**src/server.js** 修改：
```javascript
// 验证邀请码
console.log('验证邀请码:', code);
console.log('环境变量 AUTH_CODE:', process.env.AUTH_CODE);

if (code === process.env.AUTH_CODE) {
  // ...
}
```

## 验证步骤

1. 在 Render Dashboard 设置 `AUTH_CODE=gznb`
2. 等待服务重新部署完成
3. 访问 Vercel 页面，输入邀请码 `gznb` 测试
4. 如果仍然失败，查看 Render 的日志输出

## 注意事项

- 确保 Render 的环境变量名称完全匹配：`AUTH_CODE`
- 确保没有多余的空格或特殊字符
- 如果修改了环境变量，需要等待服务重新部署

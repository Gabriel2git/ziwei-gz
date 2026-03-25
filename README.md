# FatePilot

FatePilot 是一个面向紫微斗数分析的全栈项目，核心由 **Next.js 前端 + Node.js iztro 计算服务 + RAG 检索服务 + 邀请码鉴权** 组成。

本文档以“当前可运行状态”为准，并补充项目关键迭代里程碑，作为唯一权威入口。

## 项目概览

FatePilot 当前提供以下核心能力：

- 紫微斗数排盘：基于 `iztro` 生成完整命盘（主星/辅星/小星/神煞/运限）
- 运限联动：支持大限、流年切换与动态展示
- AI 命理分析：多 persona、多模型、结构化系统提示词
- 星曜级动态四化：在 Prompt 中按星曜标注本命/大限/流年四化信息
- RAG 检索增强：检索命理知识库并注入上下文
- 邀请码鉴权：保护 AI 功能调用
- 响应式 UI：桌面与移动端双端可用

## 技术架构

### 前端

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

### 后端

- Node.js（`src/server.js`）
- `iztro`（命盘与运限计算）
- RAG 服务（`backend/services/retrievalService.js`）

### AI 与模型

- DashScope 兼容接口
- 当前前端内置模型：`qwen3-max`、`glm-4.7`、`qwen3.5-flash`、`kimi-k2.5`

## 目录结构（核心）

```text
FatePilot/
├─ frontend/                  # Next.js 前端
│  ├─ src/app/                # 页面入口
│  ├─ src/components/         # UI 组件（AIChat / AIFortuneTeller / ZiweiChart 等）
│  ├─ src/hooks/              # 业务 hooks（useZiweiData / useAIChat）
│  ├─ src/lib/                # Prompt、模型调用、工具函数
│  └─ src/types/              # 类型定义
├─ src/server.js              # Node.js API 服务入口
├─ backend/services/          # RAG 检索服务
├─ backend/data/              # 文档与向量数据
├─ DEVLOG.md                  # 详细开发日志（细节）
└─ README.md                  # 项目说明（本文件）
```

## 快速开始

### 1) 前置要求

- Node.js 18+
- npm 9+

### 2) 克隆项目

```bash
git clone https://github.com/Gabriel2git/FatePilot.git
cd FatePilot
```

### 3) 安装依赖

```bash
# 根目录（后端依赖）
npm install

# 前端依赖
cd frontend
npm install
cd ..
```

### 4) 配置环境变量

后端：`backend/.env`

```env
# 必填：AI 功能邀请码
AUTH_CODE=your_auth_code
```

前端：`frontend/.env.local`

```env
# 可选：后端地址，不填默认 http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# 必填：DashScope Key（前端读取键名）
NEXT_PUBLIC_DASHSCOPE_API_KEY=your_dashscope_api_key
```

### 5) 启动服务

终端 A（项目根目录）：

```bash
node src/server.js
```

终端 B（`frontend` 目录）：

```bash
npm run dev
```

访问：

- 前端：http://localhost:3000
- 后端：http://localhost:3001

## API 概览（以 `src/server.js` 为准）

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| POST | `/api/ziwei-lite` | 轻量命盘数据（用于快速渲染） |
| POST | `/api/ziwei-context` | 命盘上下文数据（selectedContext / decadalYearlyInfo 等） |
| POST | `/api/ziwei` | 完整命盘聚合数据 |
| POST | `/api/rag/search` | RAG 检索 |
| POST | `/api/rag/test` | RAG 测试（返回示例 prompt） |
| POST | `/api/verify-code` | 邀请码校验 |

## 使用流程

1. 输入出生信息并排盘。
2. 在命盘页切换大限/流年按钮，观察命盘联动变化。
3. 进入 AI 页面，选择 persona 和模型后提问。
4. 如需排查，打开调试区查看完整系统提示词（Prompt）。

## 项目迭代里程碑

### 2026-02-21：基础能力稳定期

为什么改：早期虚岁/流年口径存在边界误差，影响运限推演可信度。  
改了什么：修复虚岁计算、流年显示、Prompt 注入基础字段。  
带来的影响：命盘与 AI 分析基线稳定，结果可解释性提升。

### 2026-02-23：命盘渲染重构期

为什么改：第三方渲染依赖灵活性不足。  
改了什么：移除 `react-iztro` 强耦合，落地自研 `ZiweiChart`，实现动态四化视觉渲染。  
带来的影响：可维护性、可定制性与前端性能明显提升。

### 2026-02-25：工程化重构期

为什么改：功能增长后单页与逻辑耦合偏高。  
改了什么：页面与组件拆分、hooks 抽象、职责边界清晰化。  
带来的影响：开发效率提升，后续迭代风险下降。

### 2026-03-05 ~ 2026-03-11：AI 与部署增强期

为什么改：需要提升分析质量与线上可用性。  
改了什么：RAG 增强、模型扩展、邀请码鉴权、云端部署兼容性修复。  
带来的影响：回答质量与稳定性增强，生产环境更可控。

### 2026-03-24 ~ 2026-03-25：Prompt 结构化优化期

为什么改：Prompt 信息冗余，模型抓取“本命 vs 运限引动”成本高。  
改了什么：

- 大限/流年宫位分离展示（结构化字段）
- 星曜级动态四化标签（主星 + 辅星）
- 精简重复字段，降低无效 token

带来的影响：模型更容易定位“谁在变化、变化来自哪里”，解读一致性提升。

## 常见问题

### 1) 邀请码验证失败

- 检查 `backend/.env` 是否配置 `AUTH_CODE`
- 确认后端进程已重启并加载新环境变量

### 2) 前端提示网络错误

- 检查 `NEXT_PUBLIC_API_URL` 是否指向可访问后端
- 确认后端 `http://localhost:3001/health` 可返回 `ok`

### 3) AI 提示 Key 未设置

- 检查 `frontend/.env.local` 是否配置 `NEXT_PUBLIC_DASHSCOPE_API_KEY`
- 重启前端开发服务器

### 4) 命盘切换后 Prompt 看起来没更新

- 先确认查看的是最新提交对应文件（不是仅看最顶层提交）
- 在 AI 调试区查看完整 Prompt 内容

## 部署说明（简版）

- 前端推荐部署到 Vercel，根目录设为 `frontend`
- 后端推荐部署到 Render，启动命令：`node src/server.js`
- 生产环境务必配置：`AUTH_CODE`、`NEXT_PUBLIC_API_URL`、`NEXT_PUBLIC_DASHSCOPE_API_KEY`

## 免责声明

本项目用于学习、研究与体验，不构成现实决策建议。请理性看待命理分析结果。

## 致谢

- [iztro](https://github.com/sylarlong/iztro)
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)
- [Render](https://render.com/)

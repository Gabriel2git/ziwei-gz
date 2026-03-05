# AI 紫微斗数 Pro

一个基于 React + Next.js 和 Node.js 的智能紫微斗数命理分析应用，集成 AI 命理师功能和 RAG 检索增强生成能力。

## ✨ 功能特点

- 📊 **紫微斗数排盘** - 完整的命盘计算与展示，包括主星、辅星、小星等信息
- 🤖 **AI 命理师** - 基于 AI 模型的智能命理分析，支持深度思考功能
- � **RAG 检索增强** - 集成知识库检索，提供更准确的命理分析
- �📱 **响应式设计** - 完美适配电脑端和手机端
- ⏰ **真太阳时校验** - 基于经度的真太阳时计算
- 🎨 **美观界面** - 参考文墨天机设计，信息密度高
- 🔄 **四化计算** - 完整的四化（禄、权、科、忌）计算
- 📅 **大运流年** - 包含大限和流年信息

## 🛠️ 技术栈

### 前端
- **React** - 前端 UI 库
- **Next.js** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 实用优先的 CSS 框架

### 后端
- **Node.js** - 紫微斗数计算服务
- **Express** - Web API 框架
- **iztro** - 紫微斗数计算库
- **阿里云百炼** - AI 模型和向量嵌入服务

### 部署
- **Vercel** - 前端和后端部署

## 📁 项目结构

```
ziwei_project/
├── frontend/                 # React + Next.js 前端
│   ├── src/
│   │   ├── app/              # Next.js 应用路由
│   │   ├── components/       # UI 组件
│   │   │   ├── AIChat/       # AI 聊天组件
│   │   │   ├── ChartView/    # 命盘视图组件
│   │   │   ├── RagTest/      # RAG 测试组件
│   │   │   ├── Sidebar/      # 侧边栏组件
│   │   │   ├── ZiweiChart/   # 紫微斗数命盘组件
│   │   │   └── BirthForm.tsx # 出生信息表单
│   │   ├── hooks/            # 自定义 React Hooks
│   │   ├── lib/              # 工具函数和 AI 集成
│   │   └── types/            # TypeScript 类型定义
│   ├── package.json          # 前端依赖
│   └── next.config.js        # Next.js 配置
├── src/                      # Node.js 后端
│   └── server.js             # API 服务入口
├── .trae/                    # 项目文档和规格文件
├── package.json              # 后端依赖
├── README.md                 # 项目说明
└── .gitignore                # Git 忽略文件
```

## 🚀 快速开始

### 前置要求

- Node.js 16+
- npm 或 yarn
- 阿里云百炼 API Key（用于 AI 功能）

### 本地运行

#### 1. 克隆项目

```bash
git clone git@github.com:Gabriel2git/ziwei-app.git
cd ziwei-app
```

#### 2. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
```

#### 3. 配置环境变量

在 `frontend` 目录中创建 `.env.local` 文件，添加以下内容：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
DASHSCOPE_API_KEY=your_aliyun_dashscope_api_key
```

#### 4. 启动服务

```bash
# 启动后端 API 服务（在项目根目录）
node src/server.js

# 启动前端开发服务器（在 frontend 目录）
npm run dev
```

前端应用将在 http://localhost:3000 打开
后端 API 服务将在 http://localhost:3001 运行

## 📱 使用说明

### 1. 输入出生信息
- 选择历法（公历/农历）
- 输入出生日期和时间
- 选择性别
- 选择出生地（用于真太阳时计算）

### 2. 开始排盘
点击「开始排盘」按钮生成命盘

### 3. 查看命盘
- 十二宫布局显示
- 包含主星、辅星、小星信息
- 显示大限和流年信息
- 真太阳时校验结果

### 4. AI 命理咨询
- 基于完整命盘信息的 AI 分析
- 支持详细的命理问题解答
- 集成 RAG 检索增强，提供更准确的分析

### 5. RAG 测试
- 单独的 RAG 功能测试界面
- 输入查询，查看检索结果

## 🎛️ 核心功能说明

### 紫微斗数计算
- 使用 iztro 库进行专业的紫微斗数计算
- 支持阳历和阴历出生日期
- 基于经度的真太阳时计算
- 完整的十二宫信息，包括主星、辅星、小星

### AI 命理分析
- 基于命盘信息生成详细的 AI 提示词
- 包含四化计算和大运流年信息
- 专业的紫微斗数分析逻辑
- 集成 qwen3.5-flash 模型，支持深度思考功能

### RAG 检索增强
- 基于阿里云百炼的向量嵌入服务
- 支持文本和 PDF 文档的向量化
- 智能检索相关命理知识
- 提高 AI 分析的准确性和相关性

### 界面设计
- 参考文墨天机的设计风格
- 响应式布局，适配各种设备
- 清晰的命盘信息展示
- 支持深色模式

## 🌐 云端部署

项目已部署到 Vercel 平台：
- 生产环境：https://ziwei-app-gz.vercel.app/

## 📝 更新日志

### v3.5.0 (2026-03-05)
- ✅ 集成 RAG 检索增强功能
- ✅ 添加 qwen3.5-flash 模型支持，包含深度思考功能
- ✅ 优化前端性能和用户体验
- ✅ 修复 TypeScript 编译错误
- ✅ 清理项目结构，删除不必要的文件

### v3.0.0 (2026-02-18)
- ✅ 前端迁移：从 Streamlit 改为 React + Next.js
- ✅ 部署迁移：从 Streamlit Cloud + Render 改为 Vercel
- ✅ 功能增强：添加真太阳时校验、完整的星曜信息
- ✅ AI 提示词优化：包含详细的命盘信息和四化计算
- ✅ 代码重构：采用现代化的前端架构

### v2.0.0
- 代码重构：采用关注点分离原则
- 模块拆分：config, calculations, api_client, prompts, ui_components

### v1.0.0
- 初始版本发布
- 完整的紫微斗数排盘功能
- AI 命理师集成
- 响应式设计

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC License

## 🙏 致谢

- [iztro](https://github.com/sylarlong/iztro) - 紫微斗数计算库
- [React](https://react.dev/) - 前端 UI 库
- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Vercel](https://vercel.com/) - 部署平台
- [阿里云百炼](https://bailian.aliyun.com/) - AI 模型和向量嵌入服务

---

**注意**：本应用仅供娱乐和研究使用，命理分析结果不构成任何决策建议。
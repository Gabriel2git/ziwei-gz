# 前端重构计划 - 使用 Frontend Design Skill

## 目标
使用 frontend-design skill 对紫微斗数项目前端进行彻底重构，打造具有独特美学风格的生产级界面。

## 当前状态分析
- **框架**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **组件结构**: Sidebar + ChartView + AIChat + PersonaSelector + ZiweiChart
- **问题**: 当前设计较为常规，缺乏独特的视觉记忆点

## 设计理念

### 美学方向: "东方赛博命理" (Oriental Cyber Divination)
将传统东方玄学元素与现代赛博朋克美学融合，创造一个既神秘又科技感十足的命理体验。

### 设计元素
- **色彩**: 深紫/靛蓝为主色调，霓虹青/洋红为强调色，金色点缀
- **字体**: 使用具有东方韵味的现代字体
- **动效**: 粒子效果、光晕、扫描线、故障艺术
- **纹理**: 星空背景、八卦图案、数字 rain 效果
- **布局**: 非对称布局，悬浮元素，层次感

## 执行步骤

### 步骤 1: 重构全局样式
- **文件**: `frontend/src/app/globals.css`
- **内容**:
  - 定义 CSS 变量（颜色、字体、间距）
  - 添加星空背景动画
  - 添加扫描线效果
  - 自定义滚动条样式
  - 添加霓虹发光效果工具类

### 步骤 2: 重构布局组件
- **文件**: `frontend/src/app/layout.tsx`
- **内容**:
  - 添加动态背景组件
  - 设置全局字体
  - 添加页面加载动画

### 步骤 3: 重构 Sidebar 组件
- **文件**: `frontend/src/components/Sidebar/index.tsx`
- **设计**:
  - 垂直导航栏，玻璃拟态效果
  - 霓虹边框发光
  - 悬停时的故障艺术效果
  - 图标使用 Lucide + 自定义 SVG

### 步骤 4: 重构命盘显示页面
- **文件**: `frontend/src/components/ChartView/index.tsx`
- **设计**:
  - 悬浮卡片布局
  - 命盘使用 3D 透视效果
  - 宫位hover时发光效果
  - 星曜使用霓虹色彩编码

### 步骤 5: 重构 AI 命理师界面
- **文件**: `frontend/src/components/AIChat/index.tsx`
- **设计**:
  - 终端/控制台风格界面
  - 打字机效果的消息显示
  - 代码高亮样式的命盘数据
  - 赛博朋克风格的输入框

### 步骤 6: 重构 Persona 选择器
- **文件**: `frontend/src/components/PersonaSelector/index.tsx`
- **设计**:
  - 全息投影卡片效果
  - 3D 翻转动画
  - 粒子背景
  - 选中时的能量波动效果

### 步骤 7: 重构命盘图表
- **文件**: `frontend/src/components/ZiweiChart/index.tsx`
- **设计**:
  - 12宫位使用几何图形表示
  - 星曜使用发光图标
  - 四化使用流动光线表示
  - 添加交互式 tooltip

### 步骤 8: 添加动效库
- **依赖**: `framer-motion`
- **用途**: 页面过渡、组件动画、手势交互

### 步骤 9: 添加粒子背景
- **依赖**: `react-particles` 或自定义 canvas
- **效果**: 星空、八卦图案、数字雨

### 步骤 10: 全面测试
- 测试所有页面渲染
- 测试交互效果
- 测试响应式布局
- 测试深色/浅色模式

### 步骤 11: 构建并推送
- 运行 `npm run build` 确保无错误
- 推送到 GitHub

## 技术实现要点

### CSS 变量定义
```css
:root {
  --neon-cyan: #00f3ff;
  --neon-pink: #ff00ff;
  --neon-purple: #b300ff;
  --deep-purple: #1a0b2e;
  --indigo: #2d1b4e;
  --gold: #ffd700;
}
```

### 关键动画效果
1. **霓虹发光**: `box-shadow` + `animation` 脉动效果
2. **故障艺术**: `clip-path` + `transform` 抖动
3. **打字机**: `overflow: hidden` + `white-space: nowrap` + 宽度动画
4. **粒子背景**: Canvas API 或 WebGL
5. **3D 卡片**: `transform-style: preserve-3d` + `perspective`

### 性能优化
- 使用 `will-change` 优化动画性能
- 图片懒加载
- 组件代码分割
- CSS 动画优先于 JS 动画

## 安全检查清单
- [ ] 所有组件正常渲染
- [ ] 动画性能流畅 (60fps)
- [ ] 响应式布局正常
- [ ] 深色/浅色模式切换正常
- [ ] 无障碍访问支持
- [ ] 构建无错误
- [ ] 前后端测试通过

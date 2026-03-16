# 修复手机端底部导航栏遮挡问题

## 问题分析

从截图可以看到：

1. **底部导航栏遮挡按钮** - "保存命例"、"历史命例"按钮被底部导航栏（命盘/AI/RAG）遮挡
2. **AI回答字体还需要缩小** - 内容很多，需要更小的字体

## 根本原因

1. **缺少底部安全区域** - 内容区域没有为底部导航栏预留足够的空间
2. **AI消息字体仍然太大** - `text-sm` 在手机端还是太大

## 修复方案

### 1. 添加底部安全区域

**文件**: frontend/src/app/page.tsx

当前主内容区：
```tsx
<main className="flex-1 p-1 md:p-6 overflow-hidden pb-20 md:pb-6">
```

需要增加底部内边距，确保内容不被导航栏遮挡：
```tsx
<main className="flex-1 p-1 md:p-6 overflow-hidden pb-24 md:pb-6">
```

或者使用更大的值：
```tsx
<main className="flex-1 p-1 md:p-6 overflow-hidden pb-28 md:pb-6">
```

### 2. ChartView 组件添加底部留白

**文件**: frontend/src/components/ChartView/index.tsx

在 ChartView 的最外层添加底部内边距：
```tsx
<div className="max-w-6xl mx-auto h-full overflow-y-auto pb-16 md:pb-0">
```

### 3. AI聊天界面添加底部留白

**文件**: frontend/src/components/AIChat/index.tsx

在 AIChat 容器添加底部内边距：
```tsx
<div className="flex flex-col h-full pb-16 md:pb-0">
```

### 4. 缩小AI消息字体

**文件**: frontend/src/components/AIChat/index.tsx

当前消息字体：
```tsx
<div className={`... text-sm sm:text-base`}>
```

改为更小的字体：
```tsx
<div className={`... text-xs sm:text-base`}>
```

## 代码变更详情

### 文件 1: frontend/src/app/page.tsx

```tsx
// 增加底部内边距，为导航栏预留空间
<main className="flex-1 p-1 md:p-6 overflow-hidden pb-28 md:pb-6">
```

### 文件 2: frontend/src/components/ChartView/index.tsx

```tsx
// 最外层添加底部内边距
<div className="max-w-6xl mx-auto h-full overflow-y-auto pb-16 md:pb-0">
```

### 文件 3: frontend/src/components/AIChat/index.tsx

**容器底部留白**（第52行附近）：
```tsx
<div className="flex flex-col h-full pb-16 md:pb-0">
```

**消息字体缩小**（第110行）：
```tsx
<div className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-4 rounded-xl sm:rounded-2xl text-xs sm:text-base`}>
```

## 底部导航栏高度参考

从截图可以看到底部导航栏包含：
- 图标 + 文字
- 高度约 60-70px

建议预留空间：
- `pb-16` = 64px
- `pb-20` = 80px
- `pb-24` = 96px
- `pb-28` = 112px

为了保险起见，使用 `pb-28`（112px）可以确保内容不会被遮挡。

## 验证步骤

1. 手机视图下检查命盘页面，确保"保存命例"按钮可见
2. 检查AI聊天页面，确保输入框和发送按钮可见
3. 检查AI消息字体是否变小
4. 在桌面端验证布局仍然正常

# 修复手机端按钮大小和底部留白

## 问题分析

从截图可以看到：

1. **底部留白太多** - 需要调整到刚好和导航栏相切
2. **按钮太大** - "保存命例"、"历史命例"、"导出命盘"按钮都太大
3. **Persona选择器卡片太大** - 需要缩小到一屏内显示，无需滚动

## 修复方案

### 1. 调整底部留白

**文件**: frontend/src/app/page.tsx

当前：`pb-28` (112px)
改为：`pb-16` (64px) 或根据导航栏实际高度调整

从截图看导航栏高度约 60-70px，使用 `pb-16` (64px) 刚好相切。

```tsx
<main className="flex-1 p-1 md:p-6 overflow-hidden pb-16 md:pb-6">
```

### 2. 缩小ChartView按钮

**文件**: frontend/src/components/ChartView/index.tsx

当前按钮样式：
```tsx
className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
```

改为：
```tsx
className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
```

三个按钮都要修改：
- 保存命例
- 历史命例
- 导出命盘

### 3. 缩小Persona选择器

**文件**: frontend/src/components/PersonaSelector/index.tsx

**整体容器**：
```tsx
// 当前
<div className="w-full max-w-5xl mx-auto p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-100px)]">

// 改为 - 移除滚动，减小内边距
<div className="w-full max-w-5xl mx-auto p-2 sm:p-6">
```

**标题区域**：
```tsx
// 当前
<h2 className="text-xl sm:text-2xl font-bold ... mb-2">
<p className="text-sm sm:text-base ...">

// 改为
<h2 className="text-lg sm:text-2xl font-bold ... mb-1">
<p className="text-xs sm:text-base ... mb-4">
```

**卡片网格**：
```tsx
// 当前
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">

// 改为 - 手机端使用flex横向排列或更紧凑的网格
<div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-6 mb-4">
```

**卡片样式**：
```tsx
// 当前
<div className="relative p-4 sm:p-6 rounded-2xl border-2 ...">
  <div className="text-4xl sm:text-5xl mb-2 sm:mb-4">
  <h3 className="text-base sm:text-lg mb-1 ...">

// 改为
<div className="relative p-2 sm:p-6 rounded-xl sm:rounded-2xl border-2 ...">
  <div className="text-2xl sm:text-5xl mb-1 sm:mb-4">
  <h3 className="text-sm sm:text-lg mb-0.5 ...">
  <p className="text-[10px] sm:text-base ...">  // 英文标题
```

**选中标记**：
```tsx
// 当前
<div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-5 h-5 sm:w-6 sm:h-6 ...">

// 改为
<div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-4 h-4 sm:w-6 sm:h-6 ...">
```

**确认区域**：
```tsx
// 当前
<div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 sm:p-6 text-center">
  <div className="mb-4">
    <span className="font-bold text-base sm:text-lg ...">
  <button className="w-full sm:w-auto px-6 sm:px-8 py-3 ...">

// 改为
<div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
  <div className="mb-2 sm:mb-4">
    <span className="font-bold text-sm sm:text-lg ...">
  <button className="w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base ...">
```

## 关键修改点

### 底部留白
- `pb-28` (112px) → `pb-16` (64px)

### ChartView按钮
- `px-4 py-2` → `px-3 py-1.5 text-sm`

### Persona选择器
- 容器：`p-4` → `p-2`，移除 `overflow-y-auto`
- 标题：`text-xl` → `text-lg`
- 卡片：`p-4` → `p-2`，`rounded-2xl` → `rounded-xl`
- 图标：`text-4xl` → `text-2xl`
- 确认按钮：`px-6 py-3` → `px-4 py-2 text-sm`

## 预期效果

1. 底部留白刚好和导航栏相切
2. 所有按钮大小适中
3. Persona选择器一屏内显示，无需滚动

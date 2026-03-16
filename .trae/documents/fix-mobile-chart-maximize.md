# 修复手机端命盘显示 - 最大化利用屏幕空间

## 问题分析

从截图可以看到：
1. 命盘周围有大量空白边距
2. 命盘本身太小，导致文字拥挤溢出
3. 底部大限按钮占据了额外空间

## 优化方案

### 1. 最大化命盘显示区域

**移除/减小边距**：
- 主内容区 `p-4` → `p-1` 或 `px-1 py-2`
- 命盘容器边距设为 0
- 让命盘贴近屏幕边缘

**命盘尺寸**：
- 使用 `w-screen` 让命盘宽度等于屏幕宽度
- 使用 `h-[calc(100vh-120px)]` 最大化高度（减去顶部导航和底部导航）
- 或者使用 `aspect-square` 保持正方形但占满宽度

### 2. ChartView 组件优化

**修改文件**: frontend/src/app/page.tsx

```tsx
// 主内容区边距
<main className="flex-1 p-1 md:p-6 overflow-hidden pb-20 md:pb-6">
```

**修改文件**: frontend/src/components/ChartView/index.tsx

```tsx
// 命盘容器占满空间
<div className="w-full h-full flex flex-col">
  {/* 命盘区域 */}
  <div className="flex-1 w-full overflow-auto">
    <ZiweiChart ziweiData={ziweiData} />
  </div>
  
  {/* 大限按钮 - 手机端横向滚动 */}
  <div className="flex overflow-x-auto gap-1 py-2 md:py-4">
    {/* 大限按钮 */}
  </div>
</div>
```

### 3. ZiweiChart 组件优化

**修改文件**: frontend/src/components/ZiweiChart/index.tsx

```tsx
// 让命盘占满容器
<div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-0">
  {/* 宫位 */}
</div>
```

### 4. PalaceCell 组件优化

**修改文件**: frontend/src/components/ZiweiChart/PalaceCell.tsx

**字体自适应**：
```tsx
// 使用更小的字体，但保持可读性
<span className="text-[9px] sm:text-base ...">

// 或者使用 clamp 实现流体字体
<span className="text-[clamp(8px,2.5vw,14px)] ...">
```

**简化显示**：
- 手机端只显示主星名称（不带亮度）
- 四化简化为单个字（禄、权、科、忌）
- 隐藏辅星、杂曜
- 宫名和干支使用单行显示

### 5. Persona 选择器滚动问题

**修改文件**: frontend/src/components/PersonaSelector/index.tsx

```tsx
// 添加滚动支持
<div className="w-full h-full overflow-y-auto p-4">
  
// 卡片简化
<div className="grid grid-cols-1 gap-4">
  {/* 卡片内容简化 */}
</div>

// 确认按钮固定在底部
<div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4">
  <button>...</button>
</div>
```

## 代码变更详情

### 文件 1: frontend/src/app/page.tsx

```tsx
// 修改主内容区内边距
<main className="flex-1 p-1 md:p-6 overflow-hidden pb-20 md:pb-6">
```

### 文件 2: frontend/src/components/ChartView/index.tsx

```tsx
// 让 ChartView 占满空间
<div className="w-full h-full flex flex-col">
  <div className="flex-1 w-full min-h-0">
    <ZiweiChart ziweiData={ziweiData} />
  </div>
</div>
```

### 文件 3: frontend/src/components/ZiweiChart/index.tsx

```tsx
// 命盘占满父容器
<div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-0 border border-gray-800">
```

### 文件 4: frontend/src/components/ZiweiChart/PalaceCell.tsx

```tsx
// 超小字体适配
<span className="text-[9px] sm:text-base font-bold">

// 简化四化显示
<span className="text-[8px] sm:text-xs bg-yellow-200">
  {birthSiHua} {/* 只显示一个字 */}
</span>

// 隐藏非关键信息
<div className="hidden sm:block">...</div>
```

### 文件 5: frontend/src/components/PersonaSelector/index.tsx

```tsx
// 外层容器可滚动
<div className="w-full h-full overflow-y-auto">
  
// 简化卡片
<div className="p-4 sm:p-6">
  <div className="text-4xl sm:text-5xl">
  <h3 className="text-base sm:text-lg">
  <p className="hidden sm:block">
```

## 关键修改点

1. **边距最小化** - 让命盘贴近屏幕边缘
2. **命盘最大化** - 占满可用空间
3. **字体自适应** - 使用 vw 单位或 clamp 实现
4. **信息简化** - 手机端只显示关键信息
5. **滚动支持** - Persona 选择器可滚动

## 验证步骤

1. 手机视图下检查命盘是否占满屏幕
2. 检查文字是否清晰可读
3. 检查 Persona 选择器是否可以滚动
4. 检查是否可以正常选择并进入聊天

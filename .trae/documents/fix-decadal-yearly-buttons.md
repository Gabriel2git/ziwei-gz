# 修复大限流年按钮和边框颜色

## 问题分析

从截图可以看到：

1. **大限流年按钮需要缩小** - "6-15岁"、"16-25岁"等按钮太大
2. **流年命宫边框是黑色** - 应该是红色发光边框，但显示为黑色

## 问题 1：大限流年按钮缩小

**文件**: frontend/src/components/ChartView/index.tsx

当前按钮样式（第134行和第161行）：
```tsx
className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ...`}
```

改为更小的样式：
```tsx
className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ...`}
```

两个地方都要修改：
- 大限按钮（第134行）
- 流年按钮（第161行）

## 问题 2：流年边框颜色

**文件**: frontend/src/components/ZiweiChart/PalaceCell.tsx

当前代码（第52-55行）：
```tsx
<div className={`w-full h-full p-0.5 sm:p-1.5 flex flex-col justify-between border border-gray-600 dark:border-gray-500 bg-white dark:bg-[#1a2a2a]
  ${isCurrentDecadal ? 'border-2 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] bg-blue-50 dark:bg-blue-900/30' : ''}
  ${isCurrentYearly ? 'border-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] bg-red-50 dark:bg-red-900/30' : ''}
`}>
```

问题分析：
- 默认边框是 `border border-gray-600`（灰色/黑色）
- 当同时满足大限和流年条件时，样式可能冲突
- 需要确保流年样式优先级更高

**修复方案**：

修改样式优先级，确保流年样式覆盖默认边框：

```tsx
<div className={`w-full h-full p-0.5 sm:p-1.5 flex flex-col justify-between 
  ${isCurrentYearly 
    ? 'border-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] bg-red-50 dark:bg-red-900/30' 
    : isCurrentDecadal 
      ? 'border-2 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] bg-blue-50 dark:bg-blue-900/30'
      : 'border border-gray-600 dark:border-gray-500 bg-white dark:bg-[#1a2a2a]'
  }
`}>
```

使用三元表达式确保：
1. 如果是流年，显示红色边框
2. 否则如果是大限，显示蓝色边框
3. 否则显示默认灰色边框

## 代码变更详情

### 文件 1: frontend/src/components/ChartView/index.tsx

**大限按钮**（第134行）：
```tsx
className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
  selectedDecadal?.start === palace.decadal?.range?.[0] 
    ? 'bg-blue-500 text-white' 
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
}`}
```

**流年按钮**（第161行）：
```tsx
className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
  selectedYear === year 
    ? 'bg-red-500 text-white' 
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
}`}
```

### 文件 2: frontend/src/components/ZiweiChart/PalaceCell.tsx

**容器样式**（第52-55行）：
```tsx
<div className={`w-full h-full p-0.5 sm:p-1.5 flex flex-col justify-between 
  ${isCurrentYearly 
    ? 'border-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] bg-red-50 dark:bg-red-900/30' 
    : isCurrentDecadal 
      ? 'border-2 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] bg-blue-50 dark:bg-blue-900/30'
      : 'border border-gray-600 dark:border-gray-500 bg-white dark:bg-[#1a2a2a]'
  }
`}>
```

## 验证步骤

1. 检查大限流年按钮是否缩小（px-2 py-0.5 text-xs）
2. 选择流年后，对应宫位是否显示红色边框
3. 选择大限后，对应宫位是否显示蓝色边框
4. 同时选择大限和流年时，流年红色边框优先显示

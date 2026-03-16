# 修复手机端问题汇总

## 问题 1：保存命例等按钮还要缩小

从截图看，"保存命例"、"历史命例"、"导出命盘"按钮在手机端仍然太大。

**文件**: frontend/src/components/ChartView/index.tsx

当前按钮样式：
```tsx
className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
```

改为更小的样式：
```tsx
className="px-2 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
```

三个按钮都要修改：
- 保存命例（绿色）
- 历史命例（蓝色）
- 导出命盘（紫色）

## 问题 2：点击"开始排盘"后自动跳转到命盘界面

当前点击"开始排盘"后，页面停留在设置页面，需要自动跳转到命盘显示页面。

**文件**: frontend/src/components/BirthForm.tsx

BirthForm 组件通过 `onDataLoaded` 回调通知父组件数据已加载，但父组件（Sidebar）需要同时切换到命盘显示页面。

**解决方案**：

在 BirthForm 添加一个可选的 `onSubmitSuccess` 回调，或者修改 Sidebar 在接收到数据后自动切换页面。

**修改方案**（推荐修改 Sidebar/index.tsx）：

在 Sidebar 组件中，当 `onDataLoaded` 被调用后，同时调用 `setCurrentPage('命盘显示')`。

```tsx
// Sidebar/index.tsx
const handleDataLoaded = (data: ...) => {
  onDataLoaded(data);
  setCurrentPage('命盘显示'); // 自动跳转到命盘页面
};
```

## 问题 3：大限流年标识不够清晰

从截图看，当前大限/流年的宫位边框只有一半是亮色（ring），不够清晰。

**文件**: frontend/src/components/ZiweiChart/PalaceCell.tsx

当前样式：
```tsx
<div className={`...
  ${isCurrentDecadal ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
  ${isCurrentYearly ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/30' : ''}
`}>
```

改进方案 - 使用更明显的边框样式：
```tsx
<div className={`...
  ${isCurrentDecadal ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
  ${isCurrentYearly ? 'border-2 border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
`}>
```

或者使用阴影+边框组合：
```tsx
<div className={`...
  ${isCurrentDecadal ? 'border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] bg-blue-50 dark:bg-blue-900/30' : ''}
  ${isCurrentYearly ? 'border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] bg-red-50 dark:bg-red-900/30' : ''}
`}>
```

## 代码变更详情

### 文件 1: frontend/src/components/ChartView/index.tsx

```tsx
// 保存命例按钮
className="px-2 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"

// 历史命例按钮
className="px-2 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"

// 导出命盘按钮
className="px-2 py-1 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
```

### 文件 2: frontend/src/components/Sidebar/index.tsx

找到 `onDataLoaded` 的处理函数，添加页面切换：

```tsx
const handleDataLoaded = (data: ...) => {
  onDataLoaded(data);
  // 手机端自动跳转到命盘页面
  setCurrentPage('命盘显示');
};
```

### 文件 3: frontend/src/components/ZiweiChart/PalaceCell.tsx

```tsx
<div className={`w-full h-full p-0.5 sm:p-1.5 flex flex-col justify-between border border-gray-600 dark:border-gray-500 bg-white dark:bg-[#1a2a2a]
  ${isCurrentDecadal ? 'border-2 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] bg-blue-50 dark:bg-blue-900/30' : ''}
  ${isCurrentYearly ? 'border-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] bg-red-50 dark:bg-red-900/30' : ''}
`}>
```

## 验证步骤

1. 检查保存命例等按钮是否缩小
2. 点击"开始排盘"后是否自动跳转到命盘界面
3. 选择大限/流年后，对应宫位是否有明显的边框高亮

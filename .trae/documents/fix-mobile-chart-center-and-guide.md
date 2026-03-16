# 修复手机端命盘中宫和引导箭头

## 问题分析

从截图可以看到：

1. **首页引导不够醒目** - 只有一个静态的 "←" 符号
2. **中宫文字太大** - "紫微斗数" 四个字太大，占据太多空间
3. **命盘信息被简化太多** - 用户希望恢复辅星、四化等信息
4. **需要深色边界** - 每个宫位需要明显的边界线

## 修复方案

### 1. 首页动态引导箭头

**文件**: frontend/src/components/ChartView/index.tsx

添加动态箭头动画：
```tsx
<div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
  {/* 动态箭头 */}
  <div className="mb-4 flex flex-col items-center">
    <div className="animate-bounce">
      <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </div>
    <span className="text-sm text-purple-500 mt-2">点击菜单开始排盘</span>
  </div>
  
  <p className="text-lg">请在左侧输入出生信息开始排盘</p>
  <p className="mt-2 text-sm opacity-75">按F11全屏浏览效果更佳</p>
</div>
```

### 2. 中宫文字缩小

**文件**: frontend/src/components/ZiweiChart/index.tsx

中宫是索引为5的宫位（第2行第2列），需要特殊处理：

```tsx
// 在中宫显示更小的文字
if (index === 5) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-1">
      <div className="text-[10px] sm:text-base font-bold text-purple-700 dark:text-purple-400 text-center leading-tight">
        紫微斗数
      </div>
      {/* 其他信息 */}
    </div>
  );
}
```

### 3. 恢复命盘完整信息

**文件**: frontend/src/components/ZiweiChart/PalaceCell.tsx

恢复之前隐藏的信息，但使用更小的字体：

```tsx
// 辅星 - 手机端也显示，但字体更小
<div className="flex flex-wrap gap-0.5 content-start">
  {palace.minorStars?.map((star: any) => {
    // ...
    return (
      <div key={star.name} className="flex items-center flex-wrap gap-0.5">
        <span className="text-blue-700 dark:text-blue-400 text-[8px] sm:text-sm leading-tight">{star.name}</span>
        {star.brightness && <span className="text-[7px] sm:text-xs text-gray-500">{star.brightness}</span>}
        // 四化...
      </div>
    );
  })}
</div>

// 四化 - 全部显示，但简化标签
{decadalSiHua && (
  <span className="text-[7px] sm:text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-0.5 rounded">
    限{decadalSiHua}
  </span>
)}

{yearlySiHua && (
  <span className="text-[7px] sm:text-xs font-bold bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-700 dark:text-fuchsia-300 px-0.5 rounded">
    流{yearlySiHua}
  </span>
)}

// 杂曜 - 手机端也显示
<div className="flex flex-wrap gap-0.5 mt-0.5 opacity-70 text-[7px] sm:text-xs">
  // ...
</div>
```

### 4. 添加深色边界

**文件**: frontend/src/components/ZiweiChart/index.tsx

```tsx
// 添加深色边界
<div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-0 bg-gray-900 dark:bg-gray-600 border-2 border-gray-900 dark:border-gray-600">
```

**文件**: frontend/src/components/ZiweiChart/PalaceCell.tsx

```tsx
// 每个宫格添加边框
<div className={`w-full h-full p-0.5 sm:p-1.5 flex flex-col justify-between border border-gray-400 dark:border-gray-600
  ${isCurrentDecadal ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
  ${isCurrentYearly ? 'ring-2 ring-red-500 bg-red-50' : ''}
`}>
```

### 5. 确保命盘在一屏内显示

**文件**: frontend/src/components/ZiweiChart/index.tsx

```tsx
// 限制最大高度，确保在一屏内
<div className="w-full h-full max-h-[calc(100vh-200px)] grid grid-cols-4 grid-rows-4 gap-0 bg-gray-900 dark:bg-gray-600 border-2 border-gray-900 dark:border-gray-600">
```

## 关键修改点

1. **动态箭头** - 使用 `animate-bounce` 和 SVG 箭头
2. **中宫字体** - `text-[10px]` 手机端，`text-base` 桌面端
3. **恢复信息** - 辅星、四化、杂曜全部显示
4. **深色边界** - `border border-gray-400` 或 `bg-gray-900` 间隙
5. **限制高度** - `max-h-[calc(100vh-200px)]`

## 字体大小规划

| 元素 | 手机端 | 桌面端 |
|------|--------|--------|
| 主星 | text-[9px] | text-base |
| 辅星 | text-[8px] | text-sm |
| 四化 | text-[7px] | text-xs |
| 杂曜 | text-[7px] | text-xs |
| 宫名 | text-[10px] | text-sm |
| 干支 | text-xs | text-lg |
| 中宫标题 | text-[10px] | text-base |

## 验证步骤

1. 检查首页是否有动态箭头引导
2. 检查中宫文字是否变小
3. 检查命盘是否显示完整信息（主星、辅星、四化、杂曜）
4. 检查每个宫位是否有深色边界
5. 检查命盘是否在一屏内完整显示

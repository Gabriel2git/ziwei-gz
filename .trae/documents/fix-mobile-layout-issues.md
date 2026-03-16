# 修复手机端布局问题

## 问题 1：命盘文字溢出

### 现象

从截图可以看到，命盘中的星曜名称、四化信息在小屏幕上显示不全，文字溢出。

### 根本原因

当前 PalaceCell.tsx 中的字体大小：

* 主星：`text-sm sm:text-lg` - 手机端使用 sm (14px)，仍然太大

* 辅星：`text-xs sm:text-md` - 手机端使用 xs (12px)

* 四化标签：`text-xs sm:text-sm` - 手机端使用 xs

* 宫名：`text-xs sm:text-sm`

* 干支：`text-sm sm:text-lg`

在手机屏幕（约375px宽）上，每个宫位只有约90px的宽度，文字太多导致溢出。

### 修复方案

**1.  PalaceCell.tsx - 超小字体适配**

```tsx
// 主星 - 手机端使用 10px，桌面端保持 lg
<span className="text-[10px] sm:text-lg ...">

// 辅星 - 手机端使用 9px
<span className="text-[9px] sm:text-md ...">

// 四化标签 - 手机端使用 8px，简化显示
<span className="text-[8px] sm:text-sm ...">
  {birthSiHua && (
    <span className="...">生{birthSiHua}</span>
  )}
</span>

// 宫名 - 手机端使用 10px
<span className="text-[10px] sm:text-sm ...">

// 干支 - 手机端使用 12px
<span className="text-xs sm:text-lg ...">
```

**2. ZiweiChart/index.tsx - 调整网格间距**

```tsx
// 减小网格间距
gap-[1px] → gap-0

// 或者使用更细的边框
border-2 → border
```

<br />

## 问题 2：Persona 选择器无法滚动

### 现象

从截图可以看到，Persona 选择器只能显示1.5个命理师卡片，无法看到第三个，也没有滚动条。

### 根本原因

PersonaSelector.tsx 使用了 `grid grid-cols-1 md:grid-cols-3`，在手机端是一列布局，但容器高度被限制，无法滚动。

### 修复方案

**1. PersonaSelector.tsx - 添加滚动支持**

```tsx
// 外层容器添加滚动
<div className="w-full max-w-5xl mx-auto p-6 overflow-y-auto max-h-[calc(100vh-200px)]">

// 或者让卡片区域可滚动
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 overflow-y-auto max-h-[60vh]">
```

**2. 简化手机端卡片**

手机端卡片太大，需要简化：

```tsx
// 手机端使用更紧凑的卡片
<div className="relative p-4 sm:p-6 rounded-2xl ...">
  
  {/* 图标 - 手机端更小 */}
  <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">
    {config.icon}
  </div>

  {/* 标题 - 手机端更小 */}
  <h3 className="text-base sm:text-lg ...">
    {config.name}
  </h3>

  {/* 描述 - 手机端隐藏或简化 */}
  <p className="hidden sm:block text-sm ...">
    {config.description}
  </p>
</div>
```

**3. AIFortuneTeller/index.tsx - 确保容器可滚动**

```tsx
// 选择 Persona 的视图添加滚动
if (currentView === 'select-persona') {
  return (
    <div className="h-full overflow-y-auto">
      <PersonaSelector ... />
    </div>
  );
}
```

## 代码变更详情

### 文件 1: frontend/src/components/ZiweiChart/PalaceCell.tsx

**修改字体大小**：

```tsx
// 第71行：主星名称
<span className="text-[10px] sm:text-lg ...">

// 第73行：亮度 - 手机端隐藏
{star.brightness && <span className="hidden sm:inline text-xs text-gray-500">{star.brightness}</span>}

// 第79行：生年四化
<span className="text-[8px] sm:text-sm ...">

// 第86行：大限四化 - 手机端隐藏
{decadalSiHua && (
  <span className="hidden sm:inline text-xs sm:text-sm ...">限{decadalSiHua}</span>
)}

// 第93行：流年四化 - 手机端隐藏
{yearlySiHua && (
  <span className="hidden sm:inline text-xs sm:text-sm ...">流{yearlySiHua}</span>
)}

// 第113行：辅星名称
<span className="text-[9px] sm:text-md ...">

// 第146行：杂曜区域 - 手机端隐藏
<div className="hidden sm:flex flex-wrap gap-1 mt-1 opacity-70 text-xs">

// 第169行：宫名
<span className="text-[10px] sm:text-sm ...">

// 第172行：大限宫名 - 手机端隐藏
{decadalPalace && (
  <span className="hidden sm:inline text-[8px] sm:text-xs ...">大{decadalPalace.substring(0, 2)}</span>
)}

// 第177行：流年宫名 - 手机端隐藏
{yearlyPalace && (
  <span className="hidden sm:inline text-[8px] sm:text-xs ...">年{yearlyPalace.substring(0, 2)}</span>
)}

// 第183行：身宫标识
<span className="text-[8px] sm:text-xs ...">[身宫]</span>

// 第198行：干支
<span className="text-xs sm:text-lg ...">
```

### 文件 2: frontend/src/components/PersonaSelector/index.tsx

**添加滚动支持**：

```tsx
// 第21行：外层容器
<div className="w-full max-w-5xl mx-auto p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-180px)]">

// 第32行：卡片网格
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">

// 第41行：卡片内边距
<div className="relative p-4 sm:p-6 rounded-2xl ...">

// 第59行：图标大小
<div className="text-4xl sm:text-5xl mb-2 sm:mb-4">

// 第64行：标题大小
<h3 className="text-base sm:text-lg ...">

// 第74行：描述 - 手机端隐藏
<p className="hidden sm:block text-sm ...">
```

### 文件 3: frontend/src/components/AIFortuneTeller/index.tsx

**确保选择器可滚动**：

```tsx
// 找到选择 Persona 的视图
if (currentView === 'select-persona') {
  return (
    <div className="h-full overflow-y-auto">
      <PersonaSelector ... />
    </div>
  );
}
```

### 文件 4: frontend/src/components/ZiweiChart/index.tsx

**调整网格**：

```tsx
// 第35行：减小间距
gap-[1px] → gap-0

// 或者使用 CSS 边框替代
gap-0 border border-gray-800
```

## 验证步骤

1. 使用浏览器开发者工具切换到手机视图（iPhone SE / 375px）
2. 检查命盘文字是否全部显示，没有溢出
3. 检查 Persona 选择器是否可以滚动查看所有选项
4. 检查是否可以点击选择并进入 AI 聊天
5. 在桌面端验证布局仍然正常


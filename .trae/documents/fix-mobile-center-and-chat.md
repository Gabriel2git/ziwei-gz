# 修复手机端中宫和AI聊天界面

## 问题分析

从截图可以看到：

### 1. 中宫问题
- 中宫文字仍然太大
- 内边距 `p-4` 太大
- 八字四柱的黄色背景区域太大
- 公历/农历信息字体太大
- 整体与周围宫位不协调

### 2. AI聊天界面问题
- 标题 "AI 命理师" 太大
- 按钮（导出/导入/调试）太大
- 消息气泡字体太大
- 输入框太大
- 整体布局需要压缩

## 修复方案

### 1. 中宫优化 (CenterInfo.tsx)

```tsx
// 减小内边距
<div className="w-full h-full p-1 sm:p-4 flex flex-col items-center justify-center border-2 border-double border-gray-300 dark:border-gray-600">

// 缩小标题
<h2 className="text-[8px] sm:text-base font-bold ...">
  紫微斗数
</h2>

// 缩小八字区域
<div className="bg-yellow-100 ... px-1 py-0.5 rounded text-[8px] sm:text-sm font-bold mb-1 sm:mb-4">
  {astrolabe.chineseDate}
</div>

// 缩小公历/农历信息
<div className="space-y-0.5 sm:space-y-2 text-[8px] sm:text-sm ...">
  <p>公历：...</p>
  <p>农历：...</p>
  
  // 缩小命主/身主
  <div className="flex gap-2 justify-center">
    <span>命主：<span className="font-bold text-red-600 ...">{astrolabe.soul}</span></span>
    <span>身主：<span className="font-bold text-blue-600 ...">{astrolabe.body}</span></span>
  </div>
  <p>五行局：...</p>
</div>
```

### 2. AI聊天界面优化 (AIChat/index.tsx)

```tsx
// 缩小标题区域
<div className="flex justify-between items-center mb-2 sm:mb-4">
  <h2 className="text-sm sm:text-xl font-bold ...">🤖 AI 命理师</h2>
  
  // 缩小按钮
  <div className="flex gap-1 sm:gap-2">
    <button className="px-2 py-0.5 text-xs sm:text-sm ...">
      💾 导出
    </button>
    ...
  </div>
</div>

// 缩小聊天区
<div className="flex-1 overflow-y-auto ... p-2 sm:p-6 mb-2 sm:mb-4">
  
  // 缩小消息气泡
  <div className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-4 rounded-xl sm:rounded-2xl text-sm sm:text-base`}>
    {message.content}
  </div>
</div>

// 缩小输入区
<div className="... p-2 sm:p-4">
  <textarea
    className="flex-1 p-2 text-sm ..."
    rows={2}  // 从3行减到2行
  />
  <button className="px-3 py-2 text-sm ...">
    发送
  </button>
</div>
```

## 使用 Playwright 检查

### 检查步骤

1. 启动浏览器并访问页面
2. 切换到手机视图 (iPhone SE / 375px)
3. 截图检查中宫显示
4. 进入AI聊天界面截图检查
5. 对比修复前后的效果

### 预期结果

- 中宫与周围宫位大小协调
- AI聊天界面所有元素大小适中
- 整体布局紧凑美观

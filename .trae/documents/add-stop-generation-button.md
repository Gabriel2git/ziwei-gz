# 添加大模型终止回答按钮

## 需求
用户需要能够在 AI 生成回答的过程中随时终止，不需要等待完整回答。

## 当前实现分析

### useAIChat.ts
- 使用 `fetch` API 调用 `getLLMResponse` 获取流式响应
- 通过 `ReadableStream` 读取 AI 的流式输出
- 使用 `isLoading` 状态控制加载状态

### AIChat/index.tsx
- 显示加载状态（三个跳动的小点）
- 发送按钮在 `isLoading` 时显示"发送中..."

## 实现方案

### 1. 修改 useAIChat.ts

**添加 AbortController**：
```typescript
const abortControllerRef = useRef<AbortController | null>(null);
```

**修改 sendMessage 函数**：
- 创建 `AbortController` 实例
- 传递给 `getLLMResponse` 函数
- 在 `finally` 中清理

**添加 stopGeneration 函数**：
```typescript
const stopGeneration = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
  setIsLoading(false);
};
```

**导出 stopGeneration**：
```typescript
return {
  // ... 其他导出
  stopGeneration,
};
```

### 2. 修改 lib/ai.ts

**修改 getLLMResponse 函数**：
- 接受 `signal` 参数（AbortSignal）
- 传递给 fetch 请求

```typescript
export async function getLLMResponse(
  messages: Message[], 
  model: string,
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array> | null> {
  // ...
  const response = await fetch(url, {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify(body),
    signal, // 添加 signal
  });
  // ...
}
```

### 3. 修改 AIChat/index.tsx

**添加 stopGeneration prop**：
```typescript
interface AIChatProps {
  // ... 其他 props
  stopGeneration: () => void;
}
```

**添加终止按钮**：
在加载状态下显示终止按钮：
```tsx
{isLoading && (
  <button
    onClick={stopGeneration}
    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
  >
    ⏹️ 终止
  </button>
)}
```

或者在发送按钮位置替换：
```tsx
<button
  onClick={isLoading ? stopGeneration : onSendMessage}
  className="..."
>
  {isLoading ? '⏹️ 终止' : '发送'}
</button>
```

### 4. 修改 page.tsx

**从 useAIChat 解构 stopGeneration**：
```typescript
const { 
  // ... 其他
  stopGeneration 
} = useAIChat(ziweiData, horoscopeYear);
```

**传递给 AIChat**：
```tsx
<AIChat
  // ... 其他 props
  stopGeneration={stopGeneration}
/>
```

## 代码变更详情

### 文件 1: frontend/src/hooks/useAIChat.ts

**添加 AbortController ref**：
```typescript
const abortControllerRef = useRef<AbortController | null>(null);
```

**修改 sendMessage 函数**：
```typescript
const sendMessage = async (model: string) => {
  // ... 前面的代码

  // 创建 AbortController
  abortControllerRef.current = new AbortController();

  try {
    // ...
    const stream = await getLLMResponse(dynamicMessages, model, abortControllerRef.current.signal);
    // ...
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('用户终止了生成');
      // 可以添加一条消息表示已终止
    } else {
      console.error('AI 响应失败:', error);
      // ... 错误处理
    }
  } finally {
    // ...
    abortControllerRef.current = null;
  }
};
```

**添加 stopGeneration 函数**：
```typescript
const stopGeneration = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
  setIsLoading(false);
};
```

### 文件 2: frontend/src/lib/ai.ts

**修改 getLLMResponse 函数签名**：
```typescript
export async function getLLMResponse(
  messages: Message[], 
  model: string,
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array> | null>
```

**在 fetch 调用中添加 signal**：
```typescript
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
    'Content-Type': 'application/json',
    'X-DashScope-SSE': 'enable'
  },
  body: JSON.stringify(body),
  signal, // 添加这行
});
```

### 文件 3: frontend/src/components/AIChat/index.tsx

**添加 stopGeneration prop**：
```typescript
interface AIChatProps {
  // ... 其他 props
  stopGeneration: () => void;
}
```

**在按钮区域添加终止按钮**：
```tsx
<div className="flex gap-2">
  {isLoading ? (
    <button
      onClick={stopGeneration}
      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
    >
      ⏹️ 终止
    </button>
  ) : (
    <>
      <button onClick={onSaveHistory}>💾 导出</button>
      <label>📂 导入</label>
      <button onClick={() => setShowDebug(!showDebug)}>🐛 调试</button>
    </>
  )}
</div>
```

### 文件 4: frontend/src/app/page.tsx

**解构 stopGeneration**：
```typescript
const { 
  messages, 
  // ... 其他
  stopGeneration 
} = useAIChat(ziweiData, horoscopeYear);
```

**传递给 AIChat**：
```tsx
<AIChat
  // ... 其他 props
  stopGeneration={stopGeneration}
/>
```

## 用户体验优化

1. **按钮状态**：
   - 加载时显示红色"终止"按钮
   - 非加载时显示原来的导出/导入/调试按钮

2. **终止后的状态**：
   - 保留已生成的部分内容
   - 可以立即发送新的消息

3. **视觉反馈**：
   - 终止按钮使用红色，与发送按钮区分
   - 添加 ⏹️ 图标增强识别度

## 验证步骤

1. 输入问题并发送
2. 在 AI 生成回答过程中点击"终止"按钮
3. 确认生成立即停止
4. 确认可以立即发送新的消息
5. 确认已生成的内容被保留

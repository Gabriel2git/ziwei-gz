# 修复 debugPrompt 为空的问题

## 问题现象

从截图可以看到，点击调试按钮后弹出的窗口中，系统提示词区域是**空白的**。

## 根本原因分析

### 数据流梳理

```
用户操作流程：
1. 首次选择 Persona → 进入聊天界面 → 点击调试 → debugPrompt 有值 ✓
2. 返回选择新 Persona → 进入聊天界面 → 点击调试 → debugPrompt 为空 ✗
```

### 关键问题定位

**问题 1: debugPrompt 何时被设置？**

查看 [useAIChat.ts](file:///e:/TraeFile/ziwei_project/frontend/src/hooks/useAIChat.ts) 发现：
- `debugPrompt` 只在两个地方被设置：
  - `initializeChat()` 第46行
  - `updateChatForHoroscope()` 第60行

**问题 2: 切换 Persona 时发生了什么？**

查看 [AIFortuneTeller/index.tsx](file:///e:/TraeFile/ziwei_project/frontend/src/components/AIFortuneTeller/index.tsx)：

```tsx
// 第91-97行：切换命理师按钮的逻辑
<button
  onClick={() => {
    if (confirm('切换命理师将重新开始对话，是否继续？')) {
      setMessages([]);           // 清空了消息
      setCurrentView('select-persona');  // 返回选择页面
    }
  }}
>
```

**关键发现**：
- 切换 Persona 时只调用了 `setMessages([])` 和 `setCurrentView('select-persona')`
- **没有调用 `initializeChat()` 或 `setDebugPrompt()`**
- 当用户重新选择 Persona 后，`debugPrompt` 仍然是之前清空的值

**问题 3: 为什么首次选择时正常？**

查看 [page.tsx](file:///e:/TraeFile/ziwei_project/frontend/src/app/page.tsx) 第130行：
```tsx
initializeChat(realZiweiData);
```

- 首次进入页面时，用户需要先排盘
- 排盘成功后调用 `handleDataLoaded` → `initializeChat()`
- `initializeChat()` 设置了 `debugPrompt`

但切换 Persona 时：
- 没有重新排盘
- 没有调用 `initializeChat()`
- `debugPrompt` 保持为空

## 修复方案

### 方案：在切换 Persona 后重新生成 debugPrompt

当用户从 Persona 选择页面返回并选择新的 Persona 后，需要重新生成 `debugPrompt`。

### 具体修改

**修改文件**: [AIFortuneTeller/index.tsx](file:///e:/TraeFile/ziwei_project/frontend/src/components/AIFortuneTeller/index.tsx)

**需要添加**：
1. 接收 `ziweiData` 和 `initializeChat` 作为 props
2. 在 `onPersonaChange` 回调中，如果已有命盘数据，重新调用 `initializeChat`

**或者更简单的方法**：

在 [useAIChat.ts](file:///e:/TraeFile/ziwei_project/frontend/src/hooks/useAIChat.ts) 中添加一个专门用于更新 debugPrompt 的函数：

```typescript
const updateDebugPrompt = (ziweiData: ZiweiData) => {
  const fullPrompt = generateMasterPrompt('请分析我的命盘', ziweiData, horoscopeYear, selectedPersona);
  setDebugPrompt(`=== 系统提示词 ===\n${fullPrompt}`);
};
```

然后在 AIFortuneTeller 中选择新的 Persona 后调用此函数。

## 推荐修复方案

### 方案 A: 在 AIFortuneTeller 中重新初始化聊天（推荐）

当用户选择新的 Persona 后，如果已经有命盘数据，重新初始化聊天。

**优点**：
- 逻辑清晰，与首次进入流程一致
- 会更新 messages 和 debugPrompt

**缺点**：
- 会清空之前的对话历史（但用户已确认"重新开始对话"）

### 方案 B: 仅更新 debugPrompt

添加一个只更新 debugPrompt 而不影响 messages 的函数。

**优点**：
- 不影响现有对话

**缺点**：
- messages 中的 system prompt 仍然是旧的
- 数据和显示不一致

## 最终选择：方案 A

因为：
1. 用户点击"切换命理师"时已经确认"重新开始对话"
2. 重新初始化可以确保 system prompt 和 debugPrompt 完全一致
3. 逻辑简单清晰

## 代码变更详情

### 文件 1: [AIFortuneTeller/index.tsx](file:///e:/TraeFile/ziwei_project/frontend/src/components/AIFortuneTeller/index.tsx)

**添加 Props**:
- `ziweiData: any` - 命盘数据
- `initializeChat: (ziweiData: any) => void` - 初始化聊天函数
- `horoscopeYear: number` - 大限年份

**修改 onPersonaChange 回调**:
```tsx
onPersonaChange={(persona) => {
  onPersonaChange(persona);
  // 如果已有命盘数据，重新初始化聊天以更新 debugPrompt
  if (ziweiData) {
    initializeChat(ziweiData);
  }
  setCurrentView('chat');
}}
```

### 文件 2: [page.tsx](file:///e:/TraeFile/ziwei_project/frontend/src/app/page.tsx)

**传递新 Props**:
```tsx
<AIFortuneTeller
  // ... 现有 props
  ziweiData={ziweiData}
  initializeChat={initializeChat}
  horoscopeYear={horoscopeYear}
/>
```

## 验证步骤

1. 首次排盘并选择 Persona A
2. 进入聊天界面，点击调试，确认显示 Persona A 的 prompt
3. 点击"切换命理师"，选择 Persona B
4. 进入聊天界面，点击调试，确认显示 Persona B 的 prompt
5. 再次切换，确认 prompt 正确更新

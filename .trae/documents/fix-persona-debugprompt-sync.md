# 修复：切换 Persona 后 debugPrompt 不更新

## 问题现象（从截图分析）

从用户提供的截图可以看到：
- **UI 显示**：当前命理师: 🤗 大白话解盘伴侣 (companion)
- **调试窗口显示**：人生导航与疗愈师 (healer) 的 system prompt

**结论**：UI 显示的 persona 和实际使用的 system prompt **不一致**！

## 根本原因分析

### 数据流梳理

```
用户操作流程：
1. 首次排盘 → 选择 Persona A → 进入聊天界面
   → initializeChat() 被调用 → debugPrompt = Persona A 的 prompt ✓

2. 点击"切换命理师" → 返回选择页面 → 选择 Persona B → 进入聊天界面
   → initializeChat() **没有被调用** → debugPrompt 仍然是 Persona A 的 prompt ✗
   → 但 selectedPersona 已经更新为 Persona B
```

### 关键代码分析

**useAIChat.ts** 第35-47行：
```typescript
const initializeChat = (ziweiData: ZiweiData) => {
  // 使用 generateMasterPrompt 生成包含 Persona 的完整 prompt
  const fullPrompt = generateMasterPrompt('请分析我的命盘', ziweiData, horoscopeYear, selectedPersona);
  // ...
  setDebugPrompt(`=== 系统提示词 ===\n${fullPrompt}`);
};
```

**AIFortuneTeller/index.tsx** 第66-71行：
```tsx
<PersonaSelector
  selectedPersona={selectedPersona}
  onPersonaChange={(persona) => {
    onPersonaChange(persona);  // 更新了 selectedPersona
    setCurrentView('chat');    // 直接进入聊天界面，没有重新生成 debugPrompt
  }}
/>
```

**问题**：
- `onPersonaChange(persona)` 更新了 `selectedPersona` 状态
- 但 `debugPrompt` 仍然是旧的值（由之前的 `initializeChat` 设置）
- 没有触发重新生成 system prompt 的逻辑

## 修复方案

### 方案：切换 Persona 后重新生成 debugPrompt

当用户选择新的 Persona 后，需要重新调用 `initializeChat` 来更新 `debugPrompt` 和 `messages`。

### 代码变更

#### 文件 1: [AIFortuneTeller/index.tsx](file:///e:/TraeFile/ziwei_project/frontend/src/components/AIFortuneTeller/index.tsx)

**添加 Props**:
- `ziweiData: any` - 命盘数据
- `initializeChat: (ziweiData: any) => void` - 初始化聊天函数

**修改 onPersonaChange 回调**:
```tsx
<PersonaSelector
  selectedPersona={selectedPersona}
  onPersonaChange={(persona) => {
    onPersonaChange(persona);
    // 如果已有命盘数据，重新初始化聊天以更新 debugPrompt
    if (ziweiData) {
      initializeChat(ziweiData);
    }
    setCurrentView('chat');
  }}
/>
```

#### 文件 2: [page.tsx](file:///e:/TraeFile/ziwei_project/frontend/src/app/page.tsx)

**传递新 Props**:
```tsx
<AIFortuneTeller
  // ... 现有 props
  ziweiData={ziweiData}
  initializeChat={initializeChat}
/>
```

## 为什么之前的修复没有解决问题？

之前的修复只是将 `selectedPersona` 状态从 page.tsx 传递到 AIFortuneTeller，确保 UI 显示正确。

但没有解决**切换 Persona 后重新生成 debugPrompt** 的问题。

## 验证步骤

1. 排盘并选择 Persona A (如：大白话解盘伴侣)
2. 进入聊天界面，点击调试，确认显示 Persona A 的 prompt
3. 点击"切换命理师"，选择 Persona B (如：人生导航与疗愈师)
4. 进入聊天界面，确认：
   - UI 显示"当前命理师: 人生导航与疗愈师"
   - 点击调试，显示 Persona B 的 prompt
5. 再次切换，确认 prompt 正确更新

# Persona Prompt 注入实现计划

## 问题描述
用户选择了不同的命理师（Persona）后，点击调试按钮发现 prompt 都是一样的。需要将选中的 Persona prompt 注入到总的 system prompt 中。

## 根本原因
当前 `generateMasterPrompt` 函数虽然接受 `persona` 参数，但可能：
1. 没有正确将 Persona prompt 整合到 system prompt
2. 或者调试按钮显示的是未整合前的 prompt
3. 或者 Persona 信息没有正确传递到 prompt 生成函数

## 执行步骤

### 步骤 1: 检查 ai.ts 中的 prompt 生成逻辑
- **文件**: `frontend/src/lib/ai.ts`
- **检查**:
  - `generateMasterPrompt` 函数是否正确使用 `persona` 参数
  - `PERSONA_PROMPTS` 是否正确注入到 system prompt
  - 调试功能显示的 prompt 是否是最终版本

### 步骤 2: 检查 useAIChat hook
- **文件**: `frontend/src/hooks/useAIChat.ts`
- **检查**:
  - `sendMessage` 函数是否传递了正确的 `persona` 参数
  - `selectedPersona` 状态是否正确传递到 `generateMasterPrompt`

### 步骤 3: 检查调试按钮逻辑
- **文件**: `frontend/src/components/AIChat/index.tsx` 或相关组件
- **检查**:
  - 调试按钮显示的 `debugPrompt` 是否包含 Persona prompt
  - 是否需要更新调试显示逻辑

### 步骤 4: 修复并验证
- 确保选择不同 Persona 后，system prompt 包含对应的 Persona prompt
- 调试按钮显示的 prompt 应该反映实际的 Persona 设置
- 测试验证不同 Persona 的 prompt 确实不同

## 代码变更详情

### ai.ts 修复
```typescript
function generateMasterPrompt(userQuestion: string, fullData: ZiweiData, targetYear: number, persona: PersonaType = 'companion') {
  // ... 现有代码 ...
  
  // 获取选中的 Persona 提示词
  const personaPrompt = PERSONA_PROMPTS[persona];
  
  const systemPrompt = `${personaPrompt}

# User Data
${fullChartContext}

# Task
用户问题："${userQuestion}"

# Response Guidelines
...`;
  
  return systemPrompt;
}
```

### 调试功能修复
确保调试按钮显示的是实际发送给 AI 的完整 prompt，包含 Persona 部分。

## 验证清单
- [ ] 选择 Companion 后，prompt 包含大白话风格
- [ ] 选择 Mentor 后，prompt 包含硬核导师风格
- [ ] 选择 Healer 后，prompt 包含疗愈师风格
- [ ] 调试按钮显示正确的 prompt
- [ ] AI 回复风格随 Persona 变化

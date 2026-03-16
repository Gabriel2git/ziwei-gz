# 修复：选择 Persona 前需要先排盘

## 问题分析

从截图可以看到，调试弹窗中的系统提示词是**空白的**。

用户反馈：
> "截图显示 system prompt 为空，说明是没有进行排盘，需要提醒用户先进行排盘。用户没有进行排盘之前，不能选择 persona"

## 根本原因

当前流程允许用户在没有排盘的情况下直接进入 AI 命理师页面并选择 Persona，但此时：
1. 没有命盘数据 (`ziweiData` 为 null)
2. `initializeChat()` 没有被调用
3. `debugPrompt` 为空字符串
4. AI 无法生成有意义的回复

## 当前代码流程

[AIFortuneTeller/index.tsx](file:///e:/TraeFile/ziwei_project/frontend/src/components/AIFortuneTeller/index.tsx)
```tsx
// 选择命理师界面
if (currentView === 'select-persona') {
  return (
    <div className="h-full flex flex-col">
      <PersonaSelector
        selectedPersona={selectedPersona}
        onPersonaChange={(persona) => {
          onPersonaChange(persona);
          setCurrentView('chat');  // 直接进入聊天界面，没有检查是否有命盘数据
        }}
      />
    </div>
  );
}
```

## 修复方案

### 方案：在选择 Persona 前检查是否已排盘

在 `onPersonaChange` 回调中添加检查：
- 如果已排盘 (`hasBirthData` 为 true)，允许进入聊天界面
- 如果未排盘，显示提示信息，引导用户先排盘

## 代码变更

### 文件 1: [AIFortuneTeller/index.tsx](file:///e:/TraeFile/ziwei_project/frontend/src/components/AIFortuneTeller/index.tsx)

**添加 Props**:
- `hasBirthData: boolean` - 是否已有命盘数据

**修改 onPersonaChange 回调**:
```tsx
<PersonaSelector
  selectedPersona={selectedPersona}
  onPersonaChange={(persona) => {
    // 检查是否已排盘
    if (!hasBirthData) {
      alert('请先输入出生信息并排盘，然后再选择命理师');
      return;
    }
    onPersonaChange(persona);
    setCurrentView('chat');
  }}
/>
```

### 文件 2: [page.tsx](file:///e:/TraeFile/ziwei_project/frontend/src/app/page.tsx)

**传递 hasBirthData prop**:
```tsx
<AIFortuneTeller
  // ... 现有 props
  hasBirthData={hasBirthData}
/>
```

## 用户体验优化（可选）

除了使用 `alert`，还可以：

1. **在 Persona 选择页面显示提示信息**：
   ```tsx
   {!hasBirthData && (
     <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
       ⚠️ 请先输入出生信息并排盘，然后再选择命理师
     </div>
   )}
   ```

2. **禁用选择按钮**：
   ```tsx
   <PersonaSelector
     disabled={!hasBirthData}
     // ...
   />
   ```

## 验证步骤

1. 不排盘直接点击"AI 命理师"页面
2. 尝试选择 Persona，应该看到提示"请先排盘"
3. 返回"命盘显示"页面，输入出生信息并排盘
4. 再进入"AI 命理师"页面，选择 Persona
5. 此时应该能正常进入聊天界面，调试按钮显示正确的 system prompt

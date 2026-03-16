---
name: "parallel-task-agent"
description: "并行执行多个独立任务时使用子代理。当需要同时修改多个不相关的文件或执行多个独立操作时，调用此技能创建子代理并行处理，提高效率。"
---

# 并行任务子代理

## 何时使用

当满足以下条件时，**必须**使用此技能：

1. **多个独立任务** - 需要同时处理多个不相互依赖的任务
2. **多文件修改** - 需要修改多个不相关的文件
3. **效率优化** - 串行执行会浪费大量时间

## 典型场景

- 同时修改多个组件的样式
- 同时更新多个配置文件
- 同时修复多个独立的问题
- 需要并行执行多个查询或分析

## 使用方法

### 1. 分析任务

首先将大任务拆分为多个独立的子任务：

```
主任务：优化手机端布局
├── 子任务1：修改组件A的样式
├── 子任务2：修改组件B的布局
├── 子任务3：修改组件C的字体
└── 子任务4：更新配置文件
```

### 2. 创建子代理

使用 `Task` 工具创建多个子代理，**在一次消息中同时调用**：

```typescript
// 同时发起多个子代理任务
functions.Task({
  description: "修改组件A样式",
  query: "修改 frontend/src/components/A/index.tsx...",
  subagent_type: "vibe-architect-coder",
  response_language: "zh"
});

functions.Task({
  description: "修改组件B布局",
  query: "修改 frontend/src/components/B/index.tsx...",
  subagent_type: "vibe-architect-coder",
  response_language: "zh"
});

functions.Task({
  description: "修改组件C字体",
  query: "修改 frontend/src/components/C/index.tsx...",
  subagent_type: "vibe-architect-coder",
  response_language: "zh"
});
```

### 3. 等待结果

所有子代理会并行执行，等待所有结果返回后再继续。

### 4. 验证结果

- 检查所有子代理的返回结果
- 运行 TypeScript 检查
- 验证功能是否正常

## 最佳实践

### DO

✅ **同时调用多个子代理** - 在一个消息中发起所有并行任务
✅ **明确任务边界** - 每个子代理只负责一个独立的任务
✅ **提供详细指令** - 给子代理完整的上下文和修改要求
✅ **使用 vibe-architect-coder** - 适合代码修改任务

### DON'T

❌ **串行调用** - 不要等待一个子代理完成后再调用下一个
❌ **任务重叠** - 不要让多个子代理修改同一个文件
❌ **过于细碎** - 如果任务太小，直接自己执行更快

## 示例

### 示例1：同时修改多个组件

```typescript
// 同时修改3个组件
functions.Task({
  description: "修改 Header 组件",
  query: "修改 frontend/src/components/Header.tsx，添加移动端菜单按钮...",
  subagent_type: "vibe-architect-coder",
  response_language: "zh"
});

functions.Task({
  description: "修改 Footer 组件",
  query: "修改 frontend/src/components/Footer.tsx，添加版权信息...",
  subagent_type: "vibe-architect-coder",
  response_language: "zh"
});

functions.Task({
  description: "修改 Sidebar 组件",
  query: "修改 frontend/src/components/Sidebar.tsx，优化移动端显示...",
  subagent_type: "vibe-architect-coder",
  response_language: "zh"
});
```

### 示例2：同时修改多个文件

```typescript
// 同时修改配置文件和工具函数
functions.Task({
  description: "更新配置文件",
  query: "修改 next.config.js，添加图片域名配置...",
  subagent_type: "vibe-architect-coder",
  response_language: "zh"
});

functions.Task({
  description: "更新工具函数",
  query: "修改 src/lib/utils.ts，添加日期格式化函数...",
  subagent_type: "vibe-architect-coder",
  response_language: "zh"
});
```

## 注意事项

1. **任务独立性** - 确保子任务之间没有依赖关系
2. **文件不冲突** - 避免多个子代理修改同一个文件
3. **结果合并** - 子代理完成后需要验证整体结果
4. **错误处理** - 如果某个子代理失败，需要单独处理

## 性能对比

| 方式 | 3个任务 | 5个任务 | 10个任务 |
|------|---------|---------|----------|
| 串行执行 | 3x | 5x | 10x |
| 并行执行 | 1x | 1x | 1x |

**结论**：并行执行可以显著提高多任务场景的效率。

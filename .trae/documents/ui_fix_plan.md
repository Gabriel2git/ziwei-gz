# UI 修复计划

## 问题列表

### 1. 深色模式显示错误
- **问题**: 深色背景下，命理师卡片和确认区域显示为白色/浅色
- **修复**: 
  - PersonaSelector 卡片添加深色模式支持
  - 确认区域添加深色模式背景
  - 所有文字颜色适配深色模式

### 2. 年份选择框宽度
- **问题**: "年" 字显示不完整
- **修复**: 增加年份选择框的宽度

### 3. 可拖动侧边栏
- **问题**: 用户无法自定义侧边栏宽度
- **修复**: 
  - 添加可拖动分隔条
  - 支持左右拖动调整宽度
  - 最小/最大宽度限制

### 4. 选中状态字体变化异常
- **问题**: 选中后字体变成白色加粗，UI 变化有错误
- **修复**: 
  - 排查选中状态的样式逻辑
  - 确保字体颜色变化正确
  - 移除不必要的加粗效果

## 执行步骤

### 步骤 1: 修复 PersonaSelector 深色模式
- **文件**: `frontend/src/components/PersonaSelector/index.tsx`
- **修改**:
  - 卡片背景添加 `dark:bg-gray-800`
  - 确认区域添加 `dark:bg-gray-800`
  - 所有文字添加 `dark:` 前缀

### 步骤 2: 修复年份选择框宽度
- **文件**: `frontend/src/components/BirthForm/index.tsx` 或相关组件
- **修改**: 增加年份选择框的 min-width

### 步骤 3: 实现可拖动侧边栏
- **文件**: `frontend/src/app/page.tsx`
- **修改**:
  - 添加拖动状态管理
  - 添加拖动条组件
  - 实现拖动逻辑
  - 存储用户自定义宽度

### 步骤 4: 修复选中状态字体
- **文件**: `frontend/src/components/PersonaSelector/index.tsx`
- **修改**:
  - 检查选中状态的 className 逻辑
  - 修复字体颜色变化
  - 移除不必要的 font-bold

## 代码变更详情

### PersonaSelector 深色模式
```tsx
// 卡片背景
className="... ${isSelected ? '...' : 'bg-white dark:bg-gray-800 ...'}"

// 确认区域
className="bg-gray-50 dark:bg-gray-800 ..."

// 文字颜色
className="... dark:text-gray-100"
```

### 可拖动侧边栏
```tsx
const [sidebarWidth, setSidebarWidth] = useState(280);
const [isDragging, setIsDragging] = useState(false);

// 拖动逻辑
const handleMouseDown = () => setIsDragging(true);
const handleMouseMove = (e) => {
  if (isDragging) {
    setSidebarWidth(Math.max(200, Math.min(400, e.clientX)));
  }
};
const handleMouseUp = () => setIsDragging(false);
```

### 选中状态修复
```tsx
// 确保未选中时字体颜色正确
<h3 className={`... ${isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>

// 不要添加 font-bold 到选中状态
```

## 安全检查清单
- [ ] 深色模式下所有元素显示正确
- [ ] 年份选择框宽度足够
- [ ] 侧边栏可拖动调整
- [ ] 选中状态字体变化正常
- [ ] 浅色/深色模式切换正常

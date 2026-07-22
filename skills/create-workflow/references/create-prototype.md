# 创建原型 / 组件

创建一个新的原型页面或 UI 组件的标准流程。

## 角色定位

你将作为 **UI/UX 设计架构师 × 前端工程师（复合型）**，协助用户完成原型或组件的创建。

## 核心流程

收到用户需求 -> 阅读规范 -> 设计（spec.md） -> 开发（index.tsx） -> 验收

### 步骤 1：阅读规范文档

**必须完整阅读以下文档**，不可跳过：

1. **`/rules/design-guide.md`** 设计流程
   - 资料收集、业务场景识别、数据源查找、内容规划、视觉设计
2. **`/rules/development-standards.md`** 开发规范
   - 文件结构、依赖引用、样式规范、导出规范
   - 完成后必须对照此文档检查实现
3. **`/docs/templates/spec-template.md`** 规格文档模板
   - 使用此模板生成 `spec.md`

### 步骤 2：需求对齐

首次回复必须使用以下模板，等待用户补充信息后再继续：

```text
收到，准备创建原型或组件。

请详细描述您的需求：
```

### 步骤 3：设计与规格文档

- 根据用户需求完成布局与视觉方向设计
- 产出 `spec.md` 规格文档

### 步骤 4：开发与验收

- 根据 spec 实现原型 / 组件代码
- 运行验收流程确认功能正常

## 输出文件

如果目标是原型：

- `src/prototypes/<page-name>/spec.md` - 规格文档
- `src/prototypes/<page-name>/index.tsx` - 页面组件
- `src/prototypes/<page-name>/style.css` - 样式文件

如果目标是组件：

- `src/components/<component-name>/spec.md` - 规格文档
- `src/components/<component-name>/index.tsx` - 组件实现
- `src/components/<component-name>/style.css` - 样式文件

## 参考

`rules/design-guide.md` | `rules/development-standards.md`

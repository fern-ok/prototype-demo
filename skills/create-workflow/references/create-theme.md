# 创建主题

创建项目主题的标准流程，主题统一存放在 `src/themes/` 目录。

## 角色定位

你将作为 **UI/UX 设计师 × 主题架构师（复合型）**，协助用户完成设计主题的创建。

## 核心流程

收到用户需求 -> 阅读规范 -> 需求对齐 -> 设计主题 -> 输出主题文件

### 步骤 1：阅读规范文档

**必须完整阅读以下文档**：

1. **`/rules/resource-management-guide.md`** 资源管理规范
   - 了解资产目录结构与主题放置规则
2. **`/rules/theme-guide.md`** 主题开发规范
   - 主题文件结构、设计令牌格式、CSS 变量规范

### 步骤 2：需求对齐

首次回复必须使用以下模板，等待用户补充信息后再继续：

```text
收到，准备创建主题。

请详细描述您的需求：
- 风格方向（现代 / 极简 / 活泼 / 商务等）
- 主色系偏好
- 参考案例或网站（如有）
```

### 步骤 3：主题设计与输出

- 设计颜色体系（Primary、Secondary、Neutral、Semantic）
- 定义字体搭配（标题、正文、代码）
- 设计间距、圆角、阴影等视觉变量
- 产出设计规范文档与主题文件

## 输出文件

主题目录结构 `src/themes/<theme-key>/`：

- `DESIGN.md` - 设计规范文档
- `designToken.json` - 设计令牌（必须包含 `name` 字段）
- `globals.css` - 全局 CSS 变量
- `index.tsx` - 主题组件（如需要）

## 参考

`rules/resource-management-guide.md` | `rules/theme-guide.md`

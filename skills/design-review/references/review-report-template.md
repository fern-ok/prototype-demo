# 设计 Review 报告

## 审查摘要

| 项目 | 内容 |
|------|------|
| **审查时间** | YYYY-MM-DD HH:mm |
| **审查范围** | （列出审查的原型/组件） |
| **审查依据** | （主题名称 + DESIGN.md / globals.css 等） |
| **上次 Review** | YYYY-MM-DD HH:mm（或「首次 Review」） |

### 统计

| 指标 | 数值 |
|------|------|
| 审查原型/组件数 | N |
| 🔴 Critical 问题 | N |
| 🟡 Warning 问题 | N |
| 🔵 Info 建议 | N |
| 主题扩展建议 | N |

---

## Part A：规范合规性问题

> 以下为原型/组件中不符合设计规范的问题清单。

| # | 文件 | 问题描述 | 维度 | 严重度 | 建议修改 |
|---|------|---------|------|--------|---------|
| 1 | `src/prototypes/xxx/index.tsx` | 使用硬编码颜色 `#ff0000` 而非变量 `--destructive` | 色彩 | 🔴 Critical | 替换为 `var(--destructive)` |
| 2 | `src/components/yyy/index.tsx` | 字号 `13px` 不在设计系统定义的字号梯度中 | 字体 | 🟡 Warning | 使用 `text-sm`（14px） |
| 3 | `src/prototypes/zzz/index.tsx` | 自行实现了 Button 组件，主题已提供 | 组件使用 | 🔵 Info | 复用 `components/Button` |

---

## Part B：主题扩展建议

> 以下为原型/组件中出现的新设计模式，建议纳入主题以提升复用性。

| # | 元素类型 | 来源 | 描述 | 建议操作 |
|---|---------|------|------|---------|
| 1 | 新组件 | `src/prototypes/xxx/index.tsx` | 可折叠面板组件，3 个原型中重复出现 | 提取到 `themes/<theme>/components/Accordion.tsx` |
| 2 | 新颜色 | `src/prototypes/yyy/style.css` | 渐变背景色 `linear-gradient(...)` 多处使用 | 添加到 `DESIGN.md` 色彩系统 & `globals.css` |
| 3 | 页面模板 | `src/prototypes/aaa/`, `src/prototypes/bbb/` | 相似的列表页布局结构 | 提取为 `themes/<theme>/templates/ListTemplate.tsx` |

---

## 优先处理建议

1. **优先修复** 🔴 Critical 问题（直接违反设计规范）
2. **建议处理** 🟡 Warning 问题（提升一致性）
3. **酌情提取** Part B 中复用频率高（≥2 处）的组件和模板
4. **后续跟进** 🔵 Info 建议（优化性质）

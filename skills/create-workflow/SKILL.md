---
name: create-workflow
description: Axhub Make 创建内容入口；当用户要创建原型/组件、文档、主题或数据表时，根据提示词分流到对应引用文档，并按需渐进式加载。
---

# Axhub Make 创建内容工作流

你正在协助用户在 Axhub Make 中创建新资源。请先阅读 `/AGENTS.md` 获取项目结构、命名规范与基础约束。

## 核心原则

- 先识别创建目标，再只加载一个最相关的引用文档。
- 不要一次性读取全部引用文档。
- 如果用户在一个请求里同时提到多个资源，先判断主产物，再按需补充读取其他引用文档。
- 当主任务已经确定时，其他资源默认作为参考输入，而不是切换工作流。
- 只有当用户明确改变目标，或当前任务确实需要额外创建另一类资源时，才加载第二个引用文档。

## 意图分流

| 用户意图 / 关键词 | 加载文档 | 典型产物 |
| --- | --- | --- |
| 原型、页面、组件、做个页面、做个组件 | `./references/create-prototype.md` | `src/prototypes/...` 或 `src/components/...` |
| 文档、PRD、说明文档、需求文档、手册 | `./references/create-document.md` | `src/docs/...` |
| 主题、设计系统、配色、design token、DESIGN.md | `./references/create-theme.md` | `src/themes/...` |
| 数据、数据表、JSON、mock 数据、示例数据 | `./references/create-data.md` | `src/database/...` |

## 分流优先级

1. 用户明确点名输出目录或文件类型时，按目标产物分流：
   - 提到 `spec.md`、`index.tsx`、页面、组件 -> 原型 / 组件
   - 提到 `DESIGN.md`、`designToken.json`、`globals.css` -> 主题
   - 提到 `.json` 数据表、`records`、mock 数据 -> 数据
   - 提到 PRD、说明文档、手册、Markdown -> 文档
2. 如果同一提示里既有“创建原型”又有“参考主题 / 文档 / 数据”，优先加载原型工作流，把主题 / 文档 / 数据当作上下文资料。
3. 如果用户只说“帮我创建一个”，目标不明确时，不要盲猜，先用下方模板补齐。

## 模糊意图时的首次回复模板

```text
收到，我可以帮你创建内容。

先告诉我这次主要要创建哪一类：
1. 原型 / 组件
2. 文档
3. 主题
4. 数据表

再补一句你的目标和使用场景，我就按对应流程继续。
```

## 引用文档

- `./references/create-prototype.md`
- `./references/create-document.md`
- `./references/create-theme.md`
- `./references/create-data.md`

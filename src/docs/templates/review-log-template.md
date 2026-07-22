# 设计 Review 日志

本文件记录每次设计 Review 的执行情况，供后续 Review 确定增量范围使用。

## 格式说明

每行一条日志，字段以 ` | ` 分隔，顺序如下：

```text
YYYY-MM-DD HH:mm | kind | scope | basis | violations | suggestions | todo
```

字段要求：

- `kind`：`review` 表示正常审查，`trim` 表示日志裁剪
- `scope`：审查范围摘要，尽量控制在 20 字以内（如 `3 prototypes, 1 component`）
- `basis`：审查依据（主题名或设计规范文件名，如 `firecrawl/DESIGN.md`）
- `violations`：违规数，格式为 `Nc/Nw/Ni`（Critical/Warning/Info），无违规写 `0/0/0`
- `suggestions`：主题扩展建议数，如 `3 items`，无建议写 `-`
- `todo`：后续待办或 `-`

记录原则：

- 能用短词就不用长句，能用文件名就不用解释性段落
- 未变化字段统一写 `-`
- 若一次审查涉及较多原型，优先记录数量摘要，不在日志中逐一列举

示例：

```text
2026-03-28 22:00 | review | 5 prototypes, 2 components | trae-design/DESIGN.md | 2/5/3 | 3 items | 提取 Accordion 组件
2026-03-29 10:30 | review | ref-app-home | firecrawl/DESIGN.md | 0/1/0 | - | -
2026-04-01 14:00 | trim | - | - | - | - | 删旧50行
```

## 日志记录


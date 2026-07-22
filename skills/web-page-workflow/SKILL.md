---
name: web-page-workflow
description: 使用 skills/ 中的 extract-page-data / clone-page 等技能处理普通网页资产提取与原型还原的流程规范；在执行网页页面地图发现、主题/数据/文档提取与还原时使用。
---

# 普通网页处理规范（简版）

本技能采用渐进披露：先判断用户需求，再只打开相关文档。

## 快速分流

- 资产提取总流程（编排入口）：`skills/web-page-workflow/asset-extraction.md`
- 主题生成规则：`skills/web-page-workflow/theme-generation.md`
- 文档生成规则：`skills/web-page-workflow/doc-generation.md`
- 数据生成规则：`skills/web-page-workflow/data-generation.md`
- 原型还原/优化/视觉复刻：`skills/web-page-workflow/prototype-restoration.md`

## 通用前置（任何场景都需要）

1. 使用 `extract-page-data` 技能（位于 `skills/extract-page-data/`）获取截图、主题、链接等数据：
   ```bash
   node skills/extract-page-data/scripts/extract.mjs <URL> --all
   ```
   若需高精度克隆，使用 `clone-page` 技能（位于 `skills/clone-page/`）。
2. 获取网页链接：用户未提供时要求提供 URL。

## 通用约束

- 默认使用 Axhub Skills 中的脚本；Firecrawl 仅在脚本失败、链接发现不足或用户明确要求时使用。
- 抓取不完整时可增加等待参数（`--wait` / Firecrawl `waitFor`）。
- 及时告知当前使用的工具，并在不确定时先征求用户确认。

## 参考资源

- `theme-guide.md`
- `development-guide.md`

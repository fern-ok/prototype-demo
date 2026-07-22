---
name: axure-prototype-workflow
description: 使用 skills/ 中的 extract-axure-data 等技能提取 Axure 原型资产、生成主题/数据/文档、还原页面与生成业务文档的流程规范；当用户提供 Axure 原型链接或提出资产提取、原型还原、主题/数据模型/文档生成、交互引导需求时使用。
---

# Axure 原型处理助手规范

本技能采用渐进披露：先判断用户需求，再只打开相关文档。

## 快速分流

- 资产提取总流程（编排入口）：`skills/axure-prototype-workflow/asset-extraction.md`
- 主题生成规则：`skills/axure-prototype-workflow/theme-generation.md`
- 文档生成规则：`skills/axure-prototype-workflow/doc-generation.md`
- 数据生成规则：`skills/axure-prototype-workflow/data-generation.md`
- 原型还原/优化/视觉复刻：`skills/axure-prototype-workflow/prototype-restoration.md`

## 通用前置（任何场景都需要）

1. 获取原型链接：如用户未提供原型链接，提示用户提供 Axure 原型 URL。
2. 使用 `extract-axure-data` 技能（位于 `skills/extract-axure-data/`）提取站点地图和页面数据：
   ```bash
   node skills/extract-axure-data/scripts/extract.mjs <AXURE_URL> --all
   ```
3. 需要页面范围判断或选择核心页面时，先从 `sitemap.json` 产物确定页面集。

## 通用约束

- 优先使用 Axhub Skills 中的脚本；失败再尝试当前环境内可用的其他工具。
- 资源获取禁止批量/并发请求，必须等一个完成后再获取下一个。
- 未经用户明确确认，不主动扩展需求或抓取可选数据。

## 参考资源

- `theme-guide.md`
- `development-guide.md`

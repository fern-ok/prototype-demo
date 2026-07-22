# 技能资产地图

本文档说明 Axhub Make 项目里“技能相关资产”分别存放在哪里，以及它们各自控制什么。

## 官方默认清单

目录：`apps/axhub-make/.axhub/make/skills/`

- `skills-manifest.default.json`
  - 控制“新建组件 / 新建原型”对话框里的技能列表
- `doc-skills-manifest.default.json`
  - 控制“新建文档”流程里的技能列表
- `theme-skills-manifest.default.json`
  - 控制“新建主题”流程里的技能列表
- `install-skills-manifest.default.json`
  - 控制首页“项目 Skills”里的项目技能卡片

这些文件是官方维护和发布的默认来源。

## 用户自定义清单

目录：`apps/axhub-make/.axhub/make/skills/`

- `skills-manifest.json`
- `doc-skills-manifest.json`
- `theme-skills-manifest.json`
- `install-skills-manifest.json`

程序读取规则固定为：

- 先读同名自定义 `.json`
- 若不存在，再读对应的 `.default.json`

> 自定义清单一旦存在，就完整替代对应的默认清单。

## 官方技能正文目录

目录：`apps/axhub-make/skills/`

每个技能的官方正文位于：

- `apps/axhub-make/skills/<skill-id>/SKILL.md`
- `apps/axhub-make/skills/<skill-id>/references/...`

如果用户要恢复官方默认技能，请从这里获取技能文档与引用文档。

## 前端读取入口

桥接文件：

- `apps/prototype-admin/src/index/config/skillManifests.ts`

该文件负责在构建时选择“自定义清单”或“默认清单”。

## 项目 Skills 安装来源

首页“项目 Skills”安装按钮最终会从以下目录安装技能：

- `apps/axhub-make/skills/<skill-id>/`

因此：

- `install-skills-manifest.default.json` / `install-skills-manifest.json` 里的 `id`
- 官方技能目录名 `apps/axhub-make/skills/<skill-id>/`

这两者必须保持一致。

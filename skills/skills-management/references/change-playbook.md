# 技能维护操作手册

## 修改前统一备份

先创建备份目录：

```bash
mkdir -p .axhub/make/backups/skills/<timestamp>/
```

然后备份本次要改的内容：

- manifest 文件
- skill 目录

建议保留原相对路径，便于恢复。

## 常见操作

### 1. 新增首页“项目 Skills”卡片

要改：

- `apps/axhub-make/.axhub/make/skills/install-skills-manifest.default.json`
- 如有新技能正文，再新增 `apps/axhub-make/skills/<skill-id>/`

适用于“要作为官方默认发布”的情况。

### 2. 只在当前项目覆盖首页“项目 Skills”

要改：

- `apps/axhub-make/.axhub/make/skills/install-skills-manifest.json`

如果文件不存在：

- 先参考 `install-skills-manifest.default.json` 创建完整副本
- 再按当前项目需要修改

### 3. 修改新建组件/原型里的技能列表

官方默认：

- `skills-manifest.default.json`

当前项目自定义：

- `skills-manifest.json`

### 4. 修改新建文档里的技能列表

官方默认：

- `doc-skills-manifest.default.json`

当前项目自定义：

- `doc-skills-manifest.json`

### 5. 修改新建主题里的技能列表

官方默认：

- `theme-skills-manifest.default.json`

当前项目自定义：

- `theme-skills-manifest.json`

### 6. 修改某个技能正文

要改：

- `apps/axhub-make/skills/<skill-id>/SKILL.md`
- `apps/axhub-make/skills/<skill-id>/references/...`

### 7. 恢复官方默认技能到当前项目

如果用户想恢复默认：

1. 打开对应的 `*.default.json`
2. 找到需要恢复的技能条目
3. 到 `apps/axhub-make/skills/<skill-id>/` 取回官方文档
4. 如果当前项目有自定义 manifest，先以 `*.default.json` 为基底重建完整清单，再补回仍需要的自定义项

## 不要混淆的概念

- “项目 Skills”卡片列表由 `install-skills-manifest.*.json` 控制
- “新建组件 / 原型”技能列表由 `skills-manifest.*.json` 控制
- “新建文档”技能列表由 `doc-skills-manifest.*.json` 控制
- “新建主题”技能列表由 `theme-skills-manifest.*.json` 控制

它们不是同一份文件。

---
name: skills-management
description: Axhub Make 技能管理入口，用于维护项目技能清单、技能分类与技能文档，并在修改前执行备份。
---

# 技能管理

你正在协助用户维护 Axhub Make 项目的技能体系。

## 核心原则

- 修改任何技能清单或技能文档前，必须先做备份。
- 先判断用户要改的是“官方默认清单”还是“用户自定义清单”。
- 用户自定义清单存在时，程序优先读取它；不存在时才回退到对应的 `*.default.json`。
- 如果用户想恢复官方默认技能，优先从对应的 `*.default.json` 和官方 skill 目录取回内容。

## 修改前备份

在执行任何修改前，先创建时间戳备份目录：

```bash
mkdir -p .axhub/make/backups/skills/<timestamp>/
```

默认备份对象：

- 当前要修改的 manifest 文件
- 当前要修改的 skill 目录

备份时保留原相对路径，便于后续直接恢复。

## 判断规则

### 情况 1：用户要改“官方默认”

适用场景：

- “这个技能默认就要带上”
- “我们发布给所有项目都要有”
- “恢复官方默认技能列表”

处理方式：

- 读取 `./references/skill-asset-map.md`
- 修改对应的 `*.default.json`
- 如果涉及技能正文，修改 `apps/axhub-make/skills/<skill-id>/`

### 情况 2：用户要改“当前项目自定义”

适用场景：

- “只在我这个项目里改”
- “不要影响后续默认发布”
- “我自己先覆盖一下技能列表”

处理方式：

- 读取 `./references/change-playbook.md`
- 修改对应的不带 `.default` 的 manifest 文件
- 若该自定义清单不存在，先参考对应的 `*.default.json` 创建完整副本，再在此基础上修改

> 注意：自定义清单一旦存在，就会完整替代对应的默认清单；它不是增量补丁。

## 恢复官方默认技能

如果用户要把某个技能恢复为官方默认状态：

1. 打开对应的 `*.default.json`
2. 找到目标技能条目
3. 打开官方技能目录 `apps/axhub-make/skills/<skill-id>/`
4. 将默认条目和官方 skill 文档重新复制到用户当前需要维护的位置

如果用户当前已经有自定义 manifest，推荐做法是：

- 先用对应的 `*.default.json` 作为基底复制出完整清单
- 再把用户仍然需要的自定义改动重新加回去

## 引用文档

- `./references/skill-asset-map.md`
- `./references/change-playbook.md`

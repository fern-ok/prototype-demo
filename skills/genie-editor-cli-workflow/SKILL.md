---
name: genie-editor-cli-workflow
description: 通过 @axhub/genie CLI 发现在线 frontend-page、读取 Genie 编辑器待处理节点、导出上下文图片或节点截图、设置节点编辑状态并完成网页或文本标注相关修改的完整闭环流程；当用户要求根据 Genie editor 待办修网页、批量处理 pending-dispatch 节点、处理文本/Markdown 标注待办时使用。
---

# Genie Editor CLI 网页 / 文本标注修改规范

先读编辑器待办 → 改页面或文本 → 回写状态 → 复核剩余待办。

## 前置条件

需要 `@axhub/genie` ≥ 0.2.4。如果用户尚未安装或启动，提示：

```bash
# 安装（首次）
npm install -g @axhub/genie

# 启动服务（指定项目目录）
npx @axhub/genie --cwd /path/to/project

# 确认服务在线
npx @axhub/genie status --json
```

如果 `status --json` 返回 `running: false` 或命令不存在，立即告诉用户当前阻塞点，不要假装继续。

> 如果用户已安装 Axhub AI Extension（Chrome 扩展），可以获得更好的交互体验（可视化选择元素、实时 WS 通信、页面数据采集等）。配合扩展使用请参考 `genie-editor-workflow` 技能。

## 快速分流

- 需要具体命令模板和字段说明 → 打开 `references/cli-reference.md`
- 需要处理网页编辑器待办并改代码 → 直接按下方主流程执行

## 主流程

### 1. 确认服务可用

```bash
npx @axhub/genie status --json
```

确认 `running: true` 后，记录本次任务使用的 `channel`、`targetClientId`。

### 2. 找客户端，锁定目标页面

```bash
npx @axhub/genie editor clients list --channel <channel>
```

- 只有一个客户端 → 直接使用
- 多个客户端 → 用 `pageUrl`、`sessionId`、用户给出的 `targetClientId` 缩小范围
- 无法安全判断 → 向用户补一个简短问题

整个任务复用同一个 `channel + targetClientId`。

### 3. 全局扫描

至少拿这两份数据：

```bash
npx @axhub/genie editor snapshot --channel <ch> --target-client-id <id>
npx @axhub/genie editor nodes list --channel <ch> --target-client-id <id> --status pending-dispatch,dirty
```

按此优先级处理节点：`pending-dispatch` → `dirty` → `error` → 疑似卡住的 `editing`。

扫描结果为空时，告诉用户当前没有可消费的 editor 待办，不要硬编待办。

### 4. 领取节点（editing）

开始处理某节点前：

```bash
npx @axhub/genie editor editing set \
  --channel <ch> --target-client-id <id> \
  --element-key <key> --state editing \
  --provider codex --task-request-id <unique-id>
```

要求：
- 每个节点生成唯一 `taskRequestId`
- `provider` 固定用 `codex`
- 修改成功 → `--state completed`；修改失败 → `--state error`；异常退出 → `--state idle`（兜底释放）

### 5. 收集上下文，决定怎么改

每个节点至少看 `elementKey`、`label`、`changeState`、`taskState`、`hasNote`、`hasImages`、`changeKinds`。

按需补充：
1. 有上下文图片 → `editor context-images export`
2. 节点位置不明确 → `editor node screenshot`
3. 截图返回的是 `absolutePath`，直接用 `view_file` 查看

注意 `context-images` 是页面级共享上下文，不一定能精确映射到单个节点。

### 6. 实施代码修改

拿到节点信息后，在当前项目里完成编辑。

原则：
- 优先处理用户明确要求或影响最大的节点
- 多个节点属于同一块 UI → 合并为一个实现批次
- 多个节点互相独立 → 可拆给子代理（仅负责实现，不负责客户端发现和状态回写）
- 无法安全定位节点 → 先截图 → 再交叉判断 → 仍不行就告诉用户阻塞点

### 7. 验证

至少做一轮回读：

```bash
npx @axhub/genie editor snapshot --channel <ch> --target-client-id <id>
npx @axhub/genie editor nodes list --channel <ch> --target-client-id <id> --status pending-dispatch,dirty,error,editing
```

如果节点代码已改但 backlog 仍显示 `dirty`/`pending-dispatch`，不要假装已完成。明确说明：
- 页面实现已完成
- 编辑器 backlog 仍显示未消费
- 将节点标记为 `--state completed` 表示 AI 已处理完毕

### 8. 设置终态

对每个已领取节点设置终态：

修改成功：
```bash
npx @axhub/genie editor editing set \
  --channel <ch> --target-client-id <id> \
  --element-key <key> --state completed \
  --provider codex --task-request-id <unique-id>
```

修改失败或跳过：
```bash
npx @axhub/genie editor editing set \
  --channel <ch> --target-client-id <id> \
  --element-key <key> --state error \
  --provider codex --task-request-id <unique-id>
```

异常退出时兜底释放（`idle`）：
```bash
npx @axhub/genie editor editing set \
  --channel <ch> --target-client-id <id> \
  --element-key <key> --state idle \
  --provider codex --task-request-id <unique-id>
```

任务未完成也要设置终态，同时在总结里写清未完成原因。

## 多节点并行策略

适合并行：不同页面区块、改动文件不重叠、上下文已足够清楚。

不适合并行：同一组件树深度耦合、依赖同一套重构、还没搞清各节点位置。

主代理保留：客户端选择、节点领取/释放、最终复核。

## 失败处理

遇到服务离线、找不到客户端、节点不存在、截图失败、无法定位节点等情况，优先说明问题，不要伪造完成。

部分完成时，清楚列出已完成/未完成节点及原因。

## 交付要求

最终回复至少包含：
- 使用的 `channel + targetClientId`
- 本轮处理过的 `elementKey`
- 修改了哪些文件
- 做了哪些验证
- 还有哪些节点仍未处理或状态异常

## 参考

- `references/cli-reference.md`

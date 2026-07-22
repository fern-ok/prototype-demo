---
name: figma-make-exporter
description: 将本项目页面补齐为可导出 Figma Make 资产的结构，并产出可直接下载的 `名称.fig` 文件；适用于保留原始 Figma Make 资产、同步导出壳子和生成 canvas.fig。
---

# Figma 导出壳子规范

本技能用于把当前页面补齐为可导出的 Figma Make 资产结构，并确保最终通过后台导出接口拿到的产物是 `名称.fig`。

这里的最终下载产物不是 `.make` 压缩包，而是项目目录中的 `canvas.fig` 二进制文件。后台会直接把它以 `名称.fig` 的文件名下载给用户。

## 核心目标

- 让当前页面具备稳定的 Figma 导出资产
- 确保导出的 `canvas.fig` 与当前 Axhub 页面内容一致
- 保留所有原始 Figma Make 资产，避免后续无法再次回写导出

## 关键原则

1. **先同步页面，再执行 pack**

如果当前页面的真实入口是根目录 `index.tsx` / `style.css`，而导出壳子使用的是 `src/App.tsx` / `src/index.css`，那么必须先把两者同步，再运行 `canvas-fig-sync.mjs pack`。

不要只更新根目录页面却直接回写旧的 `src/App.tsx`，否则导出的 `.fig` 内容会和当前页面不一致。

2. **优先做“薄壳”同步**

只要结构允许，优先让导出壳子复用当前页面入口，而不是再维护一套容易漂移的拷贝：

- `src/App.tsx` 优先作为薄包装，直接复用当前页面主组件或共享组件
- `src/index.css` 优先复用或导入根目录 `style.css` 的真实样式来源
- 如果必须复制代码，也要在本次任务里一起更新到一致

3. **保留原始资产**

如果目录里已经存在以下文件，必须保留：

- `canvas.fig`
- `meta.json`
- `ai_chat.json`
- `thumbnail.png`
- `canvas.code-manifest.json`
- `images/`

4. **使用固定目录结构**

为了降低后续维护成本，页面目录采用固定职责分层：

```text
<page>/
├── index.tsx          # Axhub 运行时适配层
├── style.css          # 根入口样式转发层
└── src/
    ├── App.tsx        # Figma 导出薄壳
    ├── main.tsx       # Vite 挂载层
    ├── index.css      # Figma 入口样式层
    ├── components/    # 页面视觉与交互主体
    └── styles/        # 共享样式
```

固定约束：

- 根目录 `index.tsx` 只做 Axhub 运行时适配，不再复制一套页面视觉实现
- `src/App.tsx` 只做 Figma 导出薄壳，不再复制一套页面业务逻辑
- 共享页面主体应尽量落在 `src/components/**`
- 共享样式应尽量落在 `src/styles/**`

如果你在生成或改造这些文件，请直接在 `index.tsx`、`src/App.tsx`、`src/main.tsx` 顶部写清楚职责注释，提醒后续维护者不要让两套入口漂移

5. **执行本技能后的最终项目必须符合上述固定结构**

这不是建议项，而是验收约束。

如果当前项目结构不满足这套职责分层，执行本技能时应先重构到该结构，再继续生成或回写 `canvas.fig`。

## 当前导出产物

后台导出接口：

```text
GET /api/export-make?path=prototypes/<page-name>
```

接口行为：

- 使用 `canvas-fig-sync.mjs pack` 把当前源码回写到 `canvas.fig`
- 刷新 `canvas.code-manifest.json`
- 更新 `meta.json.exported_at`
- 直接下载 `canvas.fig`，文件名为 `名称.fig`

## 使用场景

### 场景 A：项目由 Figma Make 导入，已有 `canvas.fig`

此时目标不是新建结构，而是把当前页面同步回已有导出壳子，然后重新回写 `canvas.fig`。

**步骤**：

1. 检查并同步当前页面和导出壳子

重点核对：

- 根目录 `index.tsx`
- 根目录 `style.css`
- 导出壳子 `src/App.tsx`
- 导出壳子 `src/index.css`
- 导出壳子依赖的 `src/components/**`、`src/pages/**`、`src/styles/**`

2. 回写 `canvas.fig`

```bash
node scripts/canvas-fig-sync.mjs pack \
  --fig src/prototypes/<page-name>/canvas.fig \
  --from src/prototypes/<page-name> \
  --prune-missing \
  --sanitize-for-export
```

3. 刷新 manifest

```bash
node scripts/canvas-fig-sync.mjs inspect \
  --fig src/prototypes/<page-name>/canvas.fig \
  --manifest src/prototypes/<page-name>/canvas.code-manifest.json
```

4. 更新 `meta.json`

至少保证：

- `file_name`
- `exported_at`
- `client_meta`
- `developer_related_links`

5. 确保 `ai_chat.json` 至少为 `{}`，并保留 `images/`

### 场景 B：原生 Axhub 页面，没有 `canvas.fig`

此时需要先补齐 Figma 导出壳子，再生成 `canvas.fig`。

**目标结构**：

```text
src/prototypes/<page-name>/
├── index.tsx
├── style.css
├── canvas.fig
├── meta.json
├── ai_chat.json
├── canvas.code-manifest.json
├── images/
├── package.json
├── vite.config.ts
├── index.html
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    ├── pages/
    └── styles/
```

**步骤**：

1. 先补齐导出壳子

要求：

- `src/App.tsx` 必须表达当前页面真实内容，而不是空模板
- `src/index.css` 必须覆盖当前页面真实样式，而不是无关默认样式
- 若可以复用根目录入口，优先做薄壳复用

2. 创建 `meta.json`

```json
{
  "client_meta": {
    "background_color": { "r": 0.96, "g": 0.96, "b": 0.96, "a": 1 },
    "thumbnail_size": { "width": 400, "height": 300 },
    "render_coordinates": { "x": 0, "y": 0, "width": 1280, "height": 960 }
  },
  "file_name": "<项目显示名>",
  "developer_related_links": [],
  "exported_at": "<ISO 8601 时间>"
}
```

3. 创建空的 `ai_chat.json`

```json
{}
```

4. 创建 `images/` 目录，并同步图片资源

```bash
mkdir -p src/prototypes/<page-name>/images
```

5. 使用模板生成基础 `canvas.fig`

```bash
cp scripts/templates/empty-canvas.fig src/prototypes/<page-name>/canvas.fig
node scripts/canvas-fig-sync.mjs pack \
  --fig src/prototypes/<page-name>/canvas.fig \
  --from src/prototypes/<page-name> \
  --prune-missing \
  --sanitize-for-export
```

6. 生成 manifest

```bash
node scripts/canvas-fig-sync.mjs inspect \
  --fig src/prototypes/<page-name>/canvas.fig \
  --manifest src/prototypes/<page-name>/canvas.code-manifest.json
```

## `meta.json` 规范

```ts
interface MetaJson {
  client_meta: {
    background_color: { r: number; g: number; b: number; a: number };
    thumbnail_size: { width: number; height: number };
    render_coordinates: { x: number; y: number; width: number; height: number };
  };
  file_name: string;
  developer_related_links: [];
  exported_at: string;
}
```

## `canvas-fig-sync.mjs` 参考

### inspect

```bash
node scripts/canvas-fig-sync.mjs inspect --fig <canvas.fig> [--manifest <file>]
```

### extract

```bash
node scripts/canvas-fig-sync.mjs extract --fig <canvas.fig> --out <project-dir> [--source-root src]
```

### pack

```bash
node scripts/canvas-fig-sync.mjs pack --fig <canvas.fig> --from <project-dir> [--out <new.fig>] [--prune-missing] [--sanitize-for-export]
```

关键行为：

- 只更新磁盘上存在的文件对应的 CODE_FILE 节点
- 更新时同时回写 `sourceCode` 与 `collaborativeSourceCode`，避免 Figma 后续导出仍然读取到旧协同代码
- 默认情况下，缺失文件会保留原始 `canvas.fig` 中的内容
- 对导出场景，建议显式加上 `--prune-missing`，这样磁盘上不存在的旧 `CODE_FILE` 节点会被裁掉，最终 `.fig` 更接近当前真实项目
- 对最终要回导 Figma Make 的产物，建议同时加上 `--sanitize-for-export`，这样会清空旧的 `CODE_LIBRARY` 聊天/代码历史、清理 `CODE_INSTANCE.codeSnapshot` 预览缓存、重建 `importedCodeFiles`，并裁掉悬空 `CODE_COMPONENT`
- 同一路径对应多个 CODE_FILE 节点时会统一更新

## 验收标准

- `node scripts/canvas-fig-sync.mjs inspect --fig <canvas.fig>` 可以成功执行
- 导出的 `canvas.fig` 对应当前页面，而不是旧壳子内容
- `meta.json.exported_at` 为最新时间
- `src/App.tsx` / `src/index.css` 与根目录页面不存在明显漂移
- 后台最终下载文件名为 `名称.fig`

## 注意事项

- `canvas.fig` 是二进制文件，不能手改
- 运行 `pack` 前，先确认导出壳子已经同步到当前页面
- 若目录内已有 `images/` 的 hash 命名文件，不要随意重命名
- 如果是导入项目，后续整理页面结构时也不能删除原始 Figma Make 资产

---
name: figma-make-project-converter
description: 将 Figma Make 导出的 Vite + React 项目转换为本项目页面组件或主题的流程规范；在处理 @/ 路径、package@version 别名、globals.css 样式迁移与主题提取时使用。
---

# Figma Make 项目转换规范

将 Figma Make 导出的 Vite + React 项目转换为本项目页面组件或主题，尽量保持视觉效果、样式 token 和组件结构。

## 核心目标

- 保持页面视觉与层级结构一致
- 移除对 Figma Make 原始 Vite 入口和版本化 alias 的依赖
- 产出可在本项目中继续演化的页面组件或主题

## 使用方式

### 步骤 1：运行预处理脚本

推荐输入来源：

- 优先使用 **Figma 原始导出的 ZIP 工程包**
- 由系统先解压 ZIP，再把解压后的项目目录传给本脚本
- 不建议手工解压后再挑文件、删文件或重组目录，否则容易破坏 Figma 原始项目结构，降低后续导入稳定性

```bash
node scripts/figma-make-converter.mjs <figma-make-project-dir> [output-name]

# 示例
node scripts/figma-make-converter.mjs "temp/my-figma-make-project" my-page
node scripts/figma-make-converter.mjs "temp/my-figma-make-project" brand-theme --target-type themes
```

脚本会自动完成：
- 完整复制 Figma Make 项目到 `src/prototypes/[页面名]/` 或 `src/themes/[theme-key]/`
- 排除 `node_modules`、`.npm-local-cache`、`build`
- 转换 `@/` 为相对路径
- 将源码中的 `package@version` 导入改为裸包名
- 分析组件、页面、依赖、CSS、设计文档
- 生成 AI 工作文档和分析报告

### 步骤 2：按任务清单完成转换

重点查看：
- `.figma-make-tasks.md`
- `.figma-make-analysis.json`
- 主题模式下的 `.figma-make-theme-tasks.md`

## Figma Make 项目特征

典型结构：

```text
figma-make-project/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── DESIGN_SYSTEM_GUIDE.md
│   ├── TOKEN_REFERENCE.md
│   ├── components/
│   ├── pages/
│   ├── styles/globals.css
│   └── guidelines/
├── index.html
├── package.json
└── vite.config.ts
```

导入时应把这套原始 ZIP 中的目录结构视为权威结构，尤其是：

- `src/App.tsx`
- `src/main.tsx`
- `src/index.css`
- `src/styles/globals.css`
- `src/components/**`
- `src/pages/**`
- `src/guidelines/**`
- `package.json`
- `vite.config.ts`
- `index.html`

说明：

- `Attributions.md`、`guidelines/Guidelines.md`、`README.md`、`TOKEN_REFERENCE.md`、`DESIGN_SYSTEM_GUIDE.md` 这类文件在 Figma 原始导出中是正常组成部分，不应误判为异常垃圾文件
- 转换时的重点不是删掉这些文件，而是识别哪些文件是页面真实依赖，哪些是说明文档

关键判断：
- 这是 **Vite + React** 项目，不是 Next.js
- 不需要处理 `"use client"`
- `vite.config.ts` 里的 `package@version` alias 只是导出兼容层，不应作为最终运行前提

## 保留导出所需的原始文件

如果导入后的目录中已经包含以下 Figma Make 原始资产，后续转换时必须保留，不要删除或覆盖为无关内容：

- `canvas.fig`：Figma Make 的二进制设计数据，用于后续回写源码并导出 `名称.fig`
- `meta.json`：项目元数据，至少保留 `file_name`、`exported_at`、`client_meta`
- `ai_chat.json`：AI 聊天历史，可为空对象 `{}`
- `thumbnail.png`：项目缩略图
- `canvas.code-manifest.json`：`canvas.fig` 中 `CODE_FILE` 的索引清单
- `images/`：设计稿图片资源，通常为 hash 命名，不要随意重命名

如果脚本分析报告里出现 `figmaMakeAssets` 字段，说明这些文件已经被保留在导入目录中，AI 在后续整理页面结构时仍需继续保留它们。

## 页面转换规则

### 固定目录结构

为了兼顾 Axhub 运行时和后续 `.fig` 导出，页面目录默认采用以下固定结构：

```text
<page>/
├── index.tsx          # Axhub runtime adapter only
├── style.css          # root style bridge only
└── src/
    ├── App.tsx        # Figma export shell only
    ├── main.tsx       # Vite mount only
    ├── index.css      # Figma style bridge only
    ├── components/    # shared page implementation
    └── styles/        # shared page styles
```

转换时请遵守：

- 页面真实视觉和交互主体优先沉淀到 `src/components/**`
- 根目录 `index.tsx` 只负责 Axhub 运行时数据、事件、变量适配
- `src/App.tsx` 只负责挂载共享页面主体
- `style.css` / `src/index.css` 尽量只做样式桥接，不重复堆业务样式
- 在 `index.tsx`、`src/App.tsx`、`src/main.tsx` 顶部写职责注释，提醒后续维护者不要让入口漂移

执行本技能后的最终项目必须符合这套固定结构；如果当前输出仍是双入口各自维护一套页面逻辑，视为转换未完成。

### 页面组件规范

默认先转换为普通 React 页面组件。只有明确需要接入 Axhub / Axure 运行时能力时，才额外引入 `forwardRef` 和 `axure-types`。

推荐格式：

```tsx
import './style.css';
import React from 'react';

export default function PageName() {
  return <div />;
}
```

### 入口收敛

- 优先从 `src/App.tsx` 收敛为本项目的 `index.tsx`
- `src/main.tsx` 只作为原始挂载入口参考，不保留为最终运行入口
- 若 `src/pages/` + 路由很多，最终仍要收敛为本项目单入口页面组件
- 如果页面后续还要重新导出为 Figma 资产，务必反向维护一个与根目录 `index.tsx` 同步的导出壳子 `src/App.tsx`
- 最稳妥的方式是让 `src/App.tsx` 尽量薄，只做包装或直接复用当前页面组件，避免出现两套页面逻辑长期漂移

### 路径与 alias

- `@/` 统一视为 `./src`
- 若源码里还残留 `package@version` 导入，继续改为裸包名
- `vite.config.ts` 可以保留作参考，但最终组件不能依赖其中 alias 才能运行

## 样式处理规则

Figma Make 的 `src/index.css` 常常是 Tailwind v4 构建产物，默认不要直接搬运为最终 `style.css`。

### `style.css` 生成策略

最终页面的 `style.css` 采用：

```css
@import "tailwindcss";
```

然后以 `src/styles/globals.css` 为主要样式来源继续整理。

规则：
- `src/styles/globals.css` 是主样式来源
- `src/index.css` 只作为视觉回归参考
- 若 `globals.css` 缺失，再结合组件现有样式补齐
- 如果页面后续还要重新导出 `.fig`，需要同时保证导出壳子使用的 `src/index.css` 与最终 `style.css` 保持一致，至少不能明显漂移

## 依赖处理

保留需要的运行依赖，默认排除：
- `react`
- `react-dom`
- `next-themes`

如果分析报告里有这些包以外的依赖，按需执行：

```bash
pnpm add <依赖名>
```

## 主题导入规则

当目标是 `themes` 时，优先从以下来源提取 token：
- `DESIGN_SYSTEM_GUIDE.md`
- `TOKEN_REFERENCE.md`
- `src/styles/globals.css`
- 组件里的 CSS 变量和设计语义

期望产物：
- `src/themes/<theme-key>/globals.css` 或 `designToken.json`
- `src/themes/<theme-key>/DESIGN-SPEC.md`
- `src/themes/<theme-key>/index.tsx`

同时可按需补充：
- `src/docs/`
- `src/database/`

## 验收标准

页面模式：

```bash
node scripts/check-app-ready.mjs /prototypes/<page-name>
```

验收要求：
- 页面正常渲染
- 无控制台错误
- 主视觉与原项目基本一致
- 不再依赖原始 Vite alias 才能运行

主题模式：
- token 文件存在且结构完整
- `DESIGN-SPEC.md` 说明清晰
- 主题演示入口能体现核心 token 效果

## 常见注意点

- 不要把 `src/index.css` 直接当最终 `style.css`
- 不要继续保留对 `package@version` alias 的运行时依赖
- 不要把完整多页面路由壳层原封不动塞进最终页面组件
- 优先利用设计文档和 CSS 变量提取主题，而不是只看视觉截图
- 如果目录内已有 `canvas.fig`、`meta.json`、`images/` 等原始资产，转换时不要删除它们
- 如果目录内已有 `src/App.tsx` / `src/index.css` 作为 Figma 导出壳子，修改根目录页面后要同步更新它们，否则后续导出的 `.fig` 会与当前页面不一致
- 转换完成后，清理 `src/prototypes/` 下本次导入产生的多余目录或文件

# 其他经营主体工作台 - 原型修改记录

## 2026-09-14 新增页面「其他经营主体工作台」

1、新增原型页面 `src/prototypes/other-entity-workbench/`，作为后台一级菜单，面向「其他经营主体」角色。
   - 页面复用后台公共 `Layout`（`src/common/Layout.tsx`），仅维护主体内容区样式（`style.css`），不引入独立导航。
   - 主体内容严格参考用户提供的设计图，包含两块面板：
     - **数据产品再开发步骤向导**：场景申请 → 签署协议 → 产品开发 → 产品编目 → 安全审查 → 产品上架，六个箭头色块 + 步骤说明。
     - **关键指标统计**：四张指标卡（数据探查申请数、场景申请数、平台资源申请数、数据产品数），展示数值与在办进度。
   - 角色区域固定为「其他经营主体」，仅提供该单一角色选项。
   - 配套新增 `spec.md`（页面规格）与 `change.md`（本文件）。

2、复用后台公共布局时，将侧边栏原「工作台」入口改造为「其他经营主体工作台」入口（`src/common/Layout.tsx`）：
   - 侧边栏首个一级菜单文字由「工作台」改为「其他经营主体工作台」，链接指向 `/prototypes/other-entity-workbench.html`。
   - `activeMenu` 类型联合新增 `'other-entity-workbench'`，面包屑父级沿用「工作台」分类。
   - **未删除任何原有工作台代码**：`src/prototypes/implement-org-workbench/` 原页面代码保持完整，仅将其侧边栏入口隐藏（不再对外展示），如需恢复可直接改回链接。

## 2026-09-14 修复页面打开报错（React is not defined）

1、问题现象：打开「其他经营主体工作台」页面时出现运行时报错，页面无法正常渲染。

2、根因定位：本项目使用 **classic JSX 运行时**（`vite.config.ts` 中 `jsxRuntime: 'classic'`），JSX 会被编译为 `React.createElement(...)`，因此模块内必须存在 `React` 绑定。对比 dev 转译产物可确认：
   - 正常页面 `implement-org-workbench`：转译后带本地绑定 `const React = __vite__cjsImport0_react.default;`。
   - 本页（修复前）：仅 `import { useState, ReactElement } from 'react'`，转译后**没有任何 `React` 本地绑定**，`React.createElement` 依赖全局 `window.React`，求值时机不可靠 → 抛错。
   - 叠加风险：`metricIcons` 原为模块顶层的 JSX 对象（`explore: <ExploreIcon />`），`React.createElement` 在**模块求值阶段**即被执行，早于全局 React 就绪。

3、修复方案（仅改动本工作台相关代码，不影响其他页面与模块）：
   - `index.tsx` 显式默认引入 React：`import React, { useState, type FunctionComponent } from 'react';`，与 `implement-org-workbench` 保持一致，彻底摆脱对全局 `window.React` 的依赖。
   - 将 `metricIcons` 由「模块顶层 JSX 元素」改为「组件引用映射」（`Record<MetricIconKey, FunctionComponent>`），并新增 `MetricIcon` 组件在渲染期创建元素，消除模块求值期对 React 的依赖。
   - 指标卡图标渲染由 `{metricIcons[item.icon]}` 调整为 `<MetricIcon icon={item.icon} />`，展示效果不变。

4、验证结果：
   - dev 转译产物已包含本地 `React` 绑定。
   - jsdom 真实 DOM 渲染（含 effect）无异常、无 console.error，步骤向导与关键指标均正常输出。
   - 针对本页的类型检查零错误；`vite build` 构建通过。

## 2026-09-14 关键指标统计改为一行四个

1、调整内容：将「关键指标统计」由 2×2 两行布局改为**单行四列**（一行四个指标卡）。

2、具体改动（`style.css`）：
   - `.oew-metrics` 栅格由 `repeat(2, ...)` 改为 `repeat(4, minmax(0, 1fr))`，列间距 `32px → 20px`。
   - `.oew-metrics-panel` 宽度由 `52.5%`（`min-width: 640px`）改为 `100%`，与上方步骤向导面板等宽，保证四张卡片有足够横向空间、文字不挤压换行。
   - `.oew-metric` 内边距由 `15px 18px` 调整为 `14px 16px`，指标脚部左右间距 `12px → 10px`，适配更窄的单卡宽度。
   - 响应式断点（≤1600px）同步调整：移除面板宽度覆盖，指标列间距收为 `16px`。

3、说明：仅改动布局样式，指标数量、文案、图标与配色均未变化；未影响其他页面。

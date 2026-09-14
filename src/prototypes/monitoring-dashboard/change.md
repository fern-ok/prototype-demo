# 原型修改记录

## 2026-09-11

- 修复监控大屏顶部统计指标区布局：
  - `src/prototypes/monitoring-dashboard/style.css`：将 `.row.row-stats` 改为单列布局，避免 `StatCards` 被外层 `repeat(4, 1fr)` 限制为仅占 25% 宽度。
  - `.statistic-list` 使用 `grid-template-columns: repeat(4, minmax(0, 1fr))`，确保 4 个统计卡片在水平方向占满整行且均匀分布。
  - `.stat-info` 改为双列等宽网格布局，子指标项禁止换行并防止溢出。
  - 新增/完善 1366px 与 1280px 响应式断点，缩放字体、间距与图标尺寸，保证不同分辨率下统计项铺满整行、对齐整齐、避免换行或溢出。

## 2026-09-08（补充 2）

- 监控大屏改为独立全屏页面：移除 `PortalLayout` 包裹，去掉门户公共顶部导航栏与页脚，整页仅保留大屏本体；同步移除页面上"页面说明""原型修改记录"入口，规格与记录改为直接维护 `spec.md` / `change.md` 文件。

## 2026-09-08

- 新建 `src/prototypes/monitoring-dashboard/` 监控大屏原型。
- 参考资料：`C:/Users/Lenovo/Desktop/监控大屏html.txt`、`C:/Users/Lenovo/Desktop/监控大屏.txt`、用户提供的监控大屏截图。
- 实现五大区域：顶部 4 个核心指标卡、中部环形图 + 湖南地图 + 行业条形图、底部折线图 + 两组 TOP10 条形图。
- 图表渲染统一使用项目已安装的 echarts（^6.0.0），未新增依赖。

## 2026-09-08（补充）

- 在后台管理系统侧边栏（公共布局 `src/common/Layout.tsx`）新增「监控大屏」一级菜单，置于「工作台」之后。
- 菜单链接指向 `/prototypes/monitoring-dashboard.html`，并设置 `target="_blank" rel="noopener noreferrer"`，点击后另开新页签全屏展示监控大屏。
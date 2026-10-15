# 血缘独立整页 - 变更记录

## 2026-10-15（当前产品标识调整：仅保留左上角标识，移除节点高亮与提示）
按用户要求收窄「当前产品」视觉标识的展示范围，仅保留左上角面包屑 + 徽标，去掉图谱节点上的高亮与顶部右侧提示文字：
1、`../product-lifecycle/lifecycle-shared.tsx`：回退本次新增的节点高亮渲染——移除 `LineageGraphProps.currentNodeName` 入参、模块级常量 `CURRENT_NODE_COLOR`，以及 `renderNode` 中当前节点的紫色外环、光晕、「当前」徽标、`current` 类名与 `<title>` 后缀；`LineageGraph` 恢复为仅支持选中（蓝）与筛选高亮（橙）的原状。
2、`index.tsx`：`LineageGraph` 调用移除 `currentNodeName` 传参；顶部工具条移除右侧说明文字「当前产品已在图谱中以紫色边框 + 「当前」标识突出显示」，图例保持右侧展示不变；左上角面包屑 `产品库 / [当前产品徽标] <当前数据产品名称>` 保留不变。
3、`lineage-style.css`：移除 `.lineage-current-hint` / `.lineage-current-hint-swatch` 提示样式、`.lineage-node.current .lineage-node-current-ring` / `.lineage-node-current-badge-text` 节点高亮样式及小屏隐藏提示的响应式规则；`.lineage-crumb` / `.lineage-current` / `.lineage-current-badge` / `.lineage-current-name` / `.lineage-topbar-right`（图例容器）样式保留。
4、同步更新 `../product-lifecycle/spec.md` §8：「当前产品标识」改为仅描述左上角面包屑 + 徽标；删除「辐射式布局」中当前产品节点紫色高亮条目与「图例」中的紫色提示说明。
未引入新依赖，未改动其他页面与既有逻辑。

## 2026-10-15（当前产品视觉标识：面包屑 + 顶部徽标 + 图谱高亮）
血缘页进入后用户无法判断当前查看的是哪个产品，本次新增三重「当前产品」视觉标识，确保随时清楚自己是从哪个产品进入的，并能清晰区分当前产品与其他关联产品：
1、`index.tsx`：顶部工具条左侧由单一「返回产品库」链接改为**面包屑** `产品库 / [当前产品徽标] <当前数据产品名称>`——「产品库」为可点击返回入口，「当前产品」以紫色徽标（`#722ed1`）标记、产品名称加粗展示（超长省略号截断、悬停显示完整）；顶部右侧新增说明「当前产品已在图谱中以紫色边框 + 「当前」标识突出显示」，将顶部标识与图谱高亮关联。
2、`../product-lifecycle/lifecycle-shared.tsx`：`LineageGraphProps` 新增可选入参 `currentNodeName?: string`（不传时行为与原状完全一致，不影响其他页面）；`renderNode` 对名称等于 `currentNodeName` 的节点（即中心节点）渲染紫色外环 + 光晕（`#722ed1`）+ 节点上方「当前」紫色徽标，并新增 `current` 类名与 `<title>` 后缀「（当前查看产品）」；该标识与节点类型配色、选中（蓝 `#1677ff`）、筛选高亮（橙 `#fa8c16`）均明显区分。新增模块级常量 `CURRENT_NODE_COLOR = '#722ed1'`。
3、`lineage-style.css`：新增 `.lineage-crumb` / `.lineage-crumb-sep` / `.lineage-current` / `.lineage-current-badge` / `.lineage-current-name` / `.lineage-topbar-right` / `.lineage-current-hint` / `.lineage-current-hint-swatch` 顶部标识样式，以及 `.lineage-node.current .lineage-node-current-ring` / `.lineage-node-current-badge-text` 图谱节点高亮样式；≤768px 小屏隐藏 `.lineage-current-hint` 说明文字以避免顶栏拥挤。
4、同步更新 `../product-lifecycle/spec.md` §8：新增「当前产品标识」说明，并在「辐射式布局·节点配色」与「图例」两节补充当前产品紫色高亮标记描述。
未引入新依赖，未改动其他页面与既有逻辑。

## 2026-10-15（基础产品授权信息数据格式约束对齐）
依据「产品库血缘系统 - 基础产品授权信息数据格式约束」，对齐 `../product-lifecycle/lifecycle-shared.tsx` 中 `buildAuthList()` 生成的演示数据格式：
1、`AuthRecord.authTime` 由 `yyyy-MM-dd` 改为 `yyyy-MM-dd HH:mm:ss`（时分秒由行索引确定性派生，不额外占用共享随机流，既有「其他经营主体」等演示数据保持不变）。
2、`AuthRecord.authTerm` 候选 `AUTH_TERMS` 由「年-年」简写（如 2026-2028）及「长期有效」改为固定起止日期区间（如 `2026-06-04 至 2028-06-04`），并彻底移除「长期有效」类无固定期限值。
3、同步更新 `AuthRecord` 字段注释（授权时间 / 授权期限格式说明）。
血缘页基础产品节点「授权信息」列表的「授权时间」「授权期限」两列展示值随之更新为合规格式。未引入新依赖，未改动其他页面与既有逻辑。

## 2026-10-12（基础产品授权信息新增「场景名称」「运营机构」列 + 抽屉加宽）
基础产品节点抽屉「授权信息」页签列表由 3 列扩充为 5 列，字段顺序为：序号、场景名称、运营机构、其他经营主体、授权时间；同步加宽抽屉，保证五列字段完整展示、不出现横向滚动条。
1、`index.tsx`：`DrawerList`（基础产品授权信息）`columns` 由 `其他经营主体 / 授权时间` 扩充为 `场景名称 / 运营机构 / 其他经营主体 / 授权时间`，新增 `col-scenario` / `col-operator` 列样式类；再开发产品「交易信息」列保持不变。
2、`../product-lifecycle/lifecycle-shared.tsx`：`AuthRecord` 新增 `scenario` / `operator` 字段，`buildAuthList()` 补充生成逻辑（新增 `AUTH_SCENARIOS`、`AUTH_OPERATORS` 演示候选集；两字段使用独立随机流，既有「其他经营主体」「授权时间」演示数据保持不变）。
3、`lineage-style.css`：
   - `.lineage-drawer` 宽度 420px → 660px（`max-width: 90vw` 保持不变），保证 5 列表格完整展示。
   - `.drawer-table` 新增 `.col-scenario`（120px）/ `.col-operator`（128px）最小宽度，`.col-org` 由 130px 调整为 128px、`.col-time` 由 110px 调整为 104px。
   - 响应式：≤1200px 抽屉宽度由 380px 调整为 560px，并同步收窄场景名称 / 运营机构 / 其他经营主体（104px）与授权时间（96px）列最小宽度；≤768px 放开各列最小宽度约束，超出列宽内容以省略号截断（悬停显示完整值）。各断点下表格列最小宽度之和均不超过抽屉内容区宽度，因此不会产生横向滚动条。
4、同步更新 `../product-lifecycle/spec.md` §8：授权信息（基础产品节点）字段说明改为 5 列，并新增抽屉宽度说明。
未引入新依赖，未改动其他页面与既有逻辑。

## 2026-10-12（数据资源节点「授权信息」新增「数源机构」）
血缘页数据资源节点抽屉「授权信息」页签在「实施机构」之前新增「数源机构」字段（中南大学湘雅医院），字段顺序调整为：资源授权单名称、数源机构、实施机构、运营机构、授权时间、授权期限。
1、`index.tsx`：`renderResourceAuthInfo()` 网格在「资源授权单名称」与「实施机构」之间插入「数源机构」行，复用 `drawer-info-grid` 样式；其余字段与顺序保持不变。
2、同步更新 `../product-lifecycle/spec.md` §8 授权信息（数据资源节点）字段说明为六项字段。
未引入新依赖，未改动其他页面与既有逻辑。

## 2026-10-08（数据资源节点抽屉新增「授权信息」TAB）
点击血缘图谱中的「数据资源」节点，右侧抽屉新增「授权信息」页签（与「基本信息」并列），固定展示四项授权信息：实施机构（湖南省卫生健康委信息统计中心）、运营机构（湖南数据产业集团）、授权发起方（运营机构）、授权时间（2026-06-15 14:20:00）。
1、`index.tsx`：
   - `getTabs` 中「数据资源」节点页签由 `['basic']` 改为 `['basic', 'auth']`。
   - 新增 `renderResourceAuthInfo()`，复用 `drawer-info-grid` 网格样式展示上述四字段。
   - `renderDrawerContent` 的 `activeTab === 'auth'` 分支增加节点类型判断：数据资源节点渲染 `renderResourceAuthInfo()`，基础产品节点仍保持原 `DrawerList` 授权列表（运营机构 / 授权时间）。
2、同步更新 `../product-lifecycle/spec.md` §8 血缘节点交互说明：数据资源节点页签改为「基本信息」「授权信息」，并补充数据资源节点授权信息四字段说明。

## 2026-10-08（数据资源节点「授权信息」页签扩充为六字段）
数据资源节点抽屉「授权信息」页签由四字段扩充为六字段，新增「资源授权单名称」（省本级卫生健康第8批资源授权）与「授权期限」（2026-06-04 至 2031-06-04），字段顺序为：资源授权单名称、实施机构、运营机构、授权发起方、授权时间、授权期限。
1、`index.tsx`：`renderResourceAuthInfo()` 网格由四字段改为六字段（复用 `drawer-info-grid` 样式），原四字段内容保持不变。
2、基础产品节点「授权信息」页签（运营机构 / 授权时间列表）不受影响，保持不变。

## 2026-09-23
画布左上角新增可搜索筛选框，支持按资源名称或产品名称筛选并高亮匹配节点。
1、`index.tsx`：新增筛选状态（`filterText` / `filterOpen`）与候选、匹配计算——按关键字对全部节点名称（数据资源 + 基础产品 + 再开发产品）模糊匹配（不区分大小写）；在 `lineage-canvas-fullscreen` 内、视口之外新增固定悬浮的筛选框（输入框 + 清空按钮 + 匹配数量提示 + 下拉候选列表），候选带类型色块与类型名称，点击候选即选中；点击外部自动收起候选。匹配结果通过新增的 `highlightNames` 入参传给 `LineageGraph`。
2、`../product-lifecycle/lifecycle-shared.tsx`：`LineageGraphProps` 新增可选入参 `highlightNames?: string[]`（不传时行为与原状完全一致，不影响其他页面）；命中节点矩形改为橙色加粗描边（`#fa8c16`、2.5px）并附加橙色光晕投影（drop-shadow），与命中节点相连的连线同步高亮为橙色加粗；未命中节点与连线保持原有样式；节点选中（蓝色描边）优先级高于筛选高亮。
3、`lineage-style.css`：新增 `.lineage-filter` 系列样式——筛选框绝对定位于画布左上角（top/left 16px、宽 264px），固定不随画布平移缩放变换，`z-index: 30` 高于图谱；含输入框聚焦态、清空按钮、匹配数量提示（无匹配红字）、下拉候选列表（悬停 / 选中态、色块、类型标签、空态提示）。
4、同步更新 `product-lifecycle/spec.md` §8（血缘独立整页）补充「节点筛选（可搜索筛选框）」说明。未引入新依赖，未改动其他页面与既有逻辑。

## 2026-09-23（续）
血缘页新增「缩略图（概览 / minimap）」功能，并补强画布平移边界约束。
1、`index.tsx`：
   - 新增画布内容区尺寸状态 `canvasSize`（经 `canvasRef` 的 ResizeObserver 实时获取，用于坐标换算与钳制），并将其接入平移 / 缩放 / 缩略图。
   - 新增 `clampTransform`（按 G6 / X6 标准）：内容始终覆盖可视区域，不允许整图被拖到视口外；缩放比例 < 1（内容小于视口）时整体居中不可平移；用户交互（主图拖拽、滚轮 / 手势缩放、按钮缩放）一律经 `setBothClamped` 写入，保证边界约束。
   - 新增缩略图浮层：右下角、缩放工具栏上方固定悬浮（默认展开），等比例缩小绘制全部节点与连线（配色与主图一致、不渲染节点文字），白色半透明浅蓝视口框代表当前可视范围；支持拖动视口框平移主画布、点击空白跳转、与主图双向实时同步（视口框更新 100ms 节流）；缩略图内滚轮禁用缩放；右上角「−」收起，收起后右下角（缩放工具栏上方）【显示概览】按钮重新展开；视口框最小 12px 防止放大时看不见；全图小于视口时视口框填满、拖动无效。
   - 顶部搜索选中（下拉候选项）或命中唯一节点时，主画布自动将该节点平移到视口中心（缩略图视口框同步跳转）。
2、`../product-lifecycle/lifecycle-shared.tsx`：抽取并导出 `computeNodePositions`（节点布局坐标计算）与 `NODE_W` / `NODE_H` / `MIN_V_GAP` 常量，主图 `LineageGraph` 与缩略图共用同一套坐标，保证拓扑一致；新增 `LineageGraphProps.highlightNames` 入参（前次改动，本次未变）。
3、`lineage-style.css`：新增 `.lineage-minimap` 系列样式（容器、画布背景、连线、节点、视口框、收起按钮、展开按钮）。
4、同步更新 `product-lifecycle/spec.md` §8（血缘独立整页）补「画布交互·平移边界钳制」与「缩略图（概览）」两节。未引入新依赖，未改动其他页面既有逻辑。

## 2026-09-23（修复）
修复血缘页打开即崩溃（运行期 ReferenceError: layerX is not defined）。
- 根因：前次抽取 `computeNodePositions` 时，列 x 坐标函数 `layerX` 被收敛到 `computeNodePositions` 内部作用域，但主图组件 `LineageGraph` 仍按模块级方式调用 `layerX(li)` 来定位图层标题，该标识符在 `LineageGraph` 作用域内不存在，渲染时抛出 `ReferenceError`，导致整页白屏 / 报错（vite 运行时不检查该未定义引用，故此前构建流程仍可通过）。
- 修复：`../product-lifecycle/lifecycle-shared.tsx` 新增模块级导出函数 `computeLayerX(layerCount, width, i)`，并让 `computeNodePositions` 内部与 `LineageGraph` 的图层标题定位均调用它，统一坐标来源；`index.tsx` 无需改动。已通过 `tsc` 类型检查与全量 `build` 验证，血缘入口正常生成。

## 2026-09-23（微调）
缩略图收起后浮现的「显示概览」按钮由左下角调整至右下角（缩放工具栏上方，right:16px / bottom:72px），与缩略图展开时的位置对齐，填充缩略图收起后的空白且不与底部缩放工具栏重叠；同步更新 JSX 注释。`lineage-style.css` 中 `.lineage-minimap-restore` 定位由 `left:16px / bottom:16px` 改为 `right:16px / bottom:72px`。已通过 `tsc` 类型检查。未引入新依赖，未改动其他页面逻辑。

## 2026-09-23（节点标签规则）
血缘图谱节点标签显示规则调整：`lifecycle-shared.tsx` 中 `LineageGraph` 的 `renderNode` 改为两行展示——第一行为名称（数据资源显示资源名称、基础 / 再开发产品显示产品名称），第二行为类型属性（数据资源显示资源格式 `detail.format`，如 OFD；基础 / 再开发产品显示产品类型 `productDetail.productType`，如 API产品 / 数据集）。即：基础与再开发产品节点显示「产品名称 + 产品类型」，数据资源节点显示「资源名称 + 资源格式」。原首行显示的节点类型文字不再单独渲染（仍用于配色与交互判断）。缩略图（不渲染文字）不受影响。同步更新 `product-lifecycle/spec.md` 节点标签说明。已通过 `tsc` 类型检查与全量 `build` 验证。

## 2026-09-23（节点标签居左 + 字段前缀）
节点标签由居中改为**统一居左**（`textAnchor="start"`、`x=12`）；第二行显式拼接字段前缀文字——数据资源节点显示「资源格式：<格式>」、基础 / 再开发产品节点显示「产品类型：<类型>」，前缀常驻展示。名称 `clipText` 上限放宽至 12、类型行上限 16。已通过 `tsc` 类型检查。未引入新依赖，未改动其他页面逻辑。

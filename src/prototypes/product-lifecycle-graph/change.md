## 2026-10-08（运营周期当前节点唯一化，状态分三色）
「运营周期」视图中当前进行中环节仅保留一个；其余已执行完成节点显示「审核通过」（绿），当前阶段被驳回时显示「审核不通过」（红），正常进行中显示「待处理」（蓝）。由复用组件 `product-lifecycle-graph1/index.tsx` 的 `trackNodeStatus(stageStatus)` 与 `buildLinearNodes` current 标记逻辑共同实现。

## 2026-10-08（运营周期节点显示名调整）
「运营周期」视图中节点显示名调整：登记→「首次登记」、变更→「变更登记」、撤销→「撤销登记」，由复用组件 `product-lifecycle-graph1/index.tsx` 的 `STAGES` label 改动生效。

## 2026-10-08（去掉运营周期所有里程碑气泡显示）
「运营周期」视图中，关键拐点黄色里程碑气泡（★ + 「XX 里程碑」文案）全部去掉，复用组件 `product-lifecycle-graph1/index.tsx` 已删除 `renderMilestones()` 函数及调用。

## 2026-10-08（运营周期所有节点抽屉去掉说明文字）
「运营周期」视图中，点击任意节点右侧抽屉不再显示任何说明文字（变更 / 上架 / 下架 的说明均已去掉），抽屉仅保留发起信息 / 审批信息。
1、复用组件 `product-lifecycle-graph1/index.tsx` 删除 `selectedNode.key === 'change'` / `'shelf'` / `'unshelf'` 对应的全部 `life-drawer-note` 渲染分支。
2、同步更新 `spec.md` §7 抽屉说明：抽屉中不再额外显示节点说明文字。

## 2026-10-08（运营周期环节改为按状态着色，去掉分类区分）
「运营周期」视图（复用 `LifecycleTrackView`）不再按「前置阶段 / 核心流转 / 变更循环 / 终止环节」分类配色，改为按环节状态着色（待处理蓝 / 审核不通过红 / 审核通过绿），具体着色逻辑在 `product-lifecycle-graph1` 的 `TRACK_STATUS_STYLE` / `trackNodeStatus` 中实现。
1、`index.tsx`：
   - 顶部图例改为按视图动态切换：「运营周期」视图显示状态图例（待处理 / 审核不通过 / 审核通过）；「操作记录」视图保持原有分类图例（前置阶段 / 核心流转 / 变更循环 / 终止环节）不变。
   - 从 `product-lifecycle-graph1/index` 额外导入导出的 `TRACK_STATUS_STYLE` 供「运营周期」图例使用。
2、`spec.md`：§7 运营周期设计补充状态着色规则（去掉分类区分，当前环节=待处理蓝、已执行完成=审核通过绿）。
3、未改动「操作记录」视图及其分类配色，未引入新依赖、不影响其他页面与既有逻辑；tsc 通过（0 错误）。

## 2026-10-08（移除「流转图谱」流程视图）
移除「生命周期」独立整页中的「流转图谱」流程图谱（SVG）视图，仅保留「运营周期 / 操作记录」双视图。
1、`index.tsx`：
   - 删除 `LifecycleFlowGraph` 组件及其专属辅助函数（`clipText` / `labelWidth` / `FlowGraphProps` 接口）与 flow 专用常量（`POS` / `NODE_W` / `NODE_H` / `FlowEdge` 接口 / `EDGES` 数组）。
   - 删除顶部「流转图谱」视图切换按钮；视图切换类型由 `'flow' | 'cycles' | 'records'` 改为 `'cycles' | 'records'`，默认视图由 `'flow'` 改为 `'cycles'`。
   - 删除 `viewMode === 'flow'` 渲染分支（含 `LifecycleFlowGraph` 调用、画布容器 `lineage-canvas-fullscreen`、缩放工具条等）。
   - 保留画布平移 / 缩放基础设施（`fitView` 等）与 `DESIGN_W/H`、`CAT_STYLE/CAT_LABEL`、`STAGES/STAGE_INDEX/CURRENT_MAP`、`statusMap`、阶段抽屉逻辑（代码保留、无入口触发，不影响编译与运行）；保留「运营周期」「操作记录」视图及 `LifecycleTrackView` / `StageRecordsView` 完全不变。
2、同步更新 `spec.md`：重写业务目标与功能清单（移除流程图 / 阶段节点 / 进度呈现 / 画布交互行，节点交互抽屉改为「代码保留、入口暂不展示」），删除整节「§4 流程图设计」，更新 §6 视图切换（默认「运营周期」）、§7 数据联动（移除流转图谱角标与点击提示）、§8「操作记录」入口与配色措辞；tsc 通过（0 错误）。未引入新依赖、未改动其他页面与既有逻辑。

## 2026-09-30（操作记录环节改为流程图形式）
将「操作记录」视图顶部 7 环节由 tab 页签形式改为流程图形式展示。
1、`index.tsx`：`StageRecordsView` 顶部环节切换条由 `.life-stage-tabs` 页签改为 `.life-records-flow` 流程图条带——7 个环节节点按业务流转顺序横向排列，节点间以 SVG 连线 + 箭头体现流转方向；节点卡片含序号徽标、环节名称与分类副标签，配色沿用 `CAT_STYLE` 分类色系；依据 `statusMap` 区分进度状态：已完成 / 当前进行中环节正常醒目（当前环节加粗描边）、已流转区间箭头点亮，尚未流转环节灰调虚线描边 + 降透明度弱化；点击节点选中（蓝色光圈标识）并切换下方操作记录列表，交互逻辑与记录派生不变。
2、`graph-style.css`：移除 `.life-stage-tabs` / `.life-stage-tab` 页签样式，新增 `.life-records-flow` / `.life-flow-node`（occurred / future / current / active 状态）/ `.life-flow-arrow` 样式，条带支持窄屏横向滚动，节点文字不换行保持可读。
3、同步更新 `spec.md`（功能清单「操作记录」行与 §8 重写为流程图形式，补充进度状态区分、节点交互与响应式说明）；tsc 通过（无任何报错）。未引入新依赖、未改动其他页面与既有逻辑。

## 2026-09-30（新增「操作记录」页签）
在「运营周期」页签之后新增「操作记录」Tab 页签。
1、`index.tsx`：新增 `RECORD_STAGE_KEYS` / `RECORD_STAGES`（固定 7 环节：开发、编目、安全审查、登记、上架、交易、下架）、`buildStageOpRecords()` 操作记录派生函数与 `StageRecordsView` 组件；`viewMode` 扩展为 `'flow' | 'cycles' | 'records'`，顶部视图切换新增「操作记录」按钮并接入条件渲染。复用既有 `deriveStageTime` / `hashStr` / `HANDLER_POOL` / `APPROVAL_STAGES` / `statusMap` / `buildServiceCycles` 派生口径：上架、下架按发生次数生成多条记录，开发、编目无审批环节以占位说明展示，尚未发生的环节展示空态；记录列含序号、操作时间、法人经办人姓名、单位名称、审核意见、审核结果（彩色标签）。
2、`graph-style.css`：新增 `.life-records` / `.life-stage-tabs` / `.life-stage-tab`（含序号徽标与选中指示条）/ `.life-records-empty` / `.life-record-result` 样式，表格复用既有 `.life-cycles-table` 风格，仅本页生效。
3、同步更新 `spec.md`（功能清单新增「操作记录」行、§6 视图切换说明、新增 §8 操作记录视图设计）；tsc 通过（无任何报错）。未引入新依赖、未改动其他页面与既有逻辑。

## 2026-09-30（「产品交付」更名为「产品交易」）
配合产品生命周期模块节点更名：`index.tsx` 的 `CURRENT_MAP` 映射键「产品交付: 'trade'」改为「产品交易: 'trade'」（运营周期状态推导沿用该映射，同步生效）；同步更新 `spec.md` 运营周期状态切换规则中的「产品交付」表述。其余不变。

## 2026-09-30 运营周期视图内容整体替换为「生命周期1」
按需求：将「生命周期1」中的全部内容完整替换掉「运营周期」中原有的原始内容，替换后「运营周期」的内容与「生命周期1」完全一致，不保留任何原有内容，且不改动其他部分。
1、`product-lifecycle-graph1/index.tsx`：将「生命周期1」的全部主内容（蛇形回折跑道时间轴画布 + 画布平移 / 缩放 / 重置 + 右下角缩放工具栏与鸟瞰缩略小地图 + 节点点击抽屉「发起信息 / 审批信息」）原样抽取为导出的共享组件 `LifecycleTrackView`（入参 `record`）；本页顶部工具条（返回入口 / 标题 / 标识码摘要 / 图例）保留在页面组件内，页面渲染结果与抽取前完全一致（纯结构抽取，无视觉变化）。
2、`product-lifecycle-graph/index.tsx`：顶部「流转图谱 / 运营周期」视图切换保留不动；「运营周期」视图渲染由原甘特时间轴面板 `ServiceCyclePanel` 整体替换为 `<LifecycleTrackView record={record} />`，与「生命周期1」共用同一组件，内容完全一致；新增引入 `../product-lifecycle-graph1/graph1-style.css`。
3、`product-lifecycle-graph/index.tsx`：整体移除原「运营周期」甘特面板相关代码——`ServiceCyclePanel` 组件、`CYCLE_STATE_TEXT`、`fmtTs`，不保留任何原有内容；`buildServiceCycles`（上架 / 下架「×N」次数角标与抽屉说明提示仍使用）保留，流转图谱视图、抽屉、顶部工具条等其他部分均未改动。
4、同步更新本页 `spec.md`（§1 / §2 / §5 / §6 / §7）与 `product-lifecycle-graph1` 的 `spec.md`、`change.md`；tsc 通过（无任何报错）。

## 2026-09-20
按需求调整「生命周期」的抽屉内容与流转关系。
1、`index.tsx` 抽屉改为「时间轴」式版式：点击安全审查 / 登记 / 上架 / 交易 / 下架 / 变更 / 撤销节点，展示该阶段「发起信息」（单位名称、法人经办人姓名、操作时间）与「审批信息」（单位名称、法人经办人姓名、审核结果、审核意见、操作时间），并保留阶段说明；开发 / 编目无审批环节仅展示发起信息，尚未发生的阶段以占位说明展示。
2、新增本页内的阶段两方信息派生逻辑（`buildStagePartyInfo` / `buildStageTag` / `deriveStageTime`），由记录标识码与阶段稳定派生，不修改 `lifecycle-shared.tsx` 既有逻辑。
3、流转关系调整：变更改为可在 **登记 / 上架 / 交易** 之后发起（新增 `register → change` 分支）；撤销改为发生在 **登记之后**（新增 `register → 撤销` 直达终止分支，标注「登记后直接撤销 · 不再上架 / 交易」），主干保留 `下架 → 撤销`。
4、画布布局调整：主干 8 个阶段改为等距水平直线（节点宽 126、间距 160），变更节点下移至主干下方形成回流；新增连线类型 `skip`（从主干上方绕行）与连线标签底色，避免标签压线、压节点。
5、`graph-style.css`：补充 `skip` 标签配色、`is-available` 节点透明度，以及抽屉内时间轴字段换行适配。
6、同步更新 `spec.md`；tsc 通过（仅剩 3 处无关既有错误）。

## 2026-09-20 运营周期视图
新增「运营周期」视图，完整呈现产品多次上架 / 下架 / 再上架的区间与先后顺序，并妥善处理状态切换。
1、`index.tsx`：新增 `buildServiceCycles`（由 `id % 3` 派生「再上架轮次」0~2，生成交替的「上架 → 下架」时间序列；按当前阶段妥善处理 未上架 / 在售中 / 停售中 / 单次上架无下架 / 多次循环 等状态切换；各区间起止日期由标识码经线性同余伪随机稳定派生并累计，进行中区间按记录更新时间推算已持续天数）；新增 `ServiceCyclePanel` 组件（甘特时间轴 + 明细表 + 图例 + 当前状态标签 + 空态）；顶部新增「流转图谱 / 运营周期」视图切换；流转图谱中上架、下架节点新增「×N」次数角标（与运营周期统计口径一致）；上架 / 下架节点抽屉补充说明提示前往运营周期视图。
2、`graph-style.css`：补充视图切换按钮、甘特轨道 / 区间 / 标签、明细表、状态标签等样式。
3、同步更新本页 `spec.md`（§1 / §2 / §5 / §6 / §7）与 `product-lifecycle/spec.md` §12；tsc 通过（仅剩 3 处无关既有错误）。

## 2026-09-17
新建「生命周期」独立整页原型 `product-lifecycle-graph`，并接入「产品生命周期」列表页操作列。
1、新建 `index.tsx`：全屏 SVG 流程图展示 开发 → 编目 → 安全审查 → 登记 → 上架 → 交易 → 下架 → 撤销 主干流转，并以橙色虚线回路体现「变更」可反复多次（上架/交易 → 变更 → 安全审查 → 登记 → 上架）；支持画布平移/缩放/重置（与数据血缘一致）与点击节点右侧抽屉展示阶段说明；顶部工具条展示当前产品标识码、名称与当前阶段，并提供「返回产品生命周期」入口。
2、新建 `graph-style.css`：补充流程图节点、连线标签、阶段抽屉等样式；复用 `product-lifecycle/style.css`、`product-lifecycle-lineage/lineage-style.css`、`backend-list.css`。
3、`product-lifecycle/index.tsx`：操作列新增「生命周期」跳转链接，携带 `code` 进入本页。
4、复用 `lifecycle-shared.tsx` 的 `getRecordByCode` 定位记录，不修改既有共享逻辑。
5、同步新建 `spec.md`，并更新 `product-lifecycle` 的 `spec.md`（第 12 节）与 `change.md`。

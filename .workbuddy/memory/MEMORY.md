# 项目长期记忆（Axhub）

## 工程约束（全模块通用）
- 改动后必须通过类型检查：managed node 调 `node_modules/typescript/bin/tsc -p tsconfig.typecheck.json --noEmit`。
- 狭范围改动：只改目标页面，不引入新依赖，不影响其他页面与既有逻辑。
- 原始代码保留不删；UI 条目用 display:none / 禁用处理，而非删除代码。
- **除非用户明确要求，一律不改 md 文档（spec.md / change.md）**；用户主动提及 md 时才同步。
- 默认：不更新工作日志、不展示产物文件，用户自行查看效果。
- 删除信息项用左右并排对比：左原内容、右红字+删除线；修改/新增文字标红；删除仅背景标红。

## 产品库（product-lifecycle）
- 查看弹窗两页签：「基本信息」（基本信息/提供方信息/声明信息，默认）、「配置信息」。
- 配置信息按类型分支：API → 接口信息（名称/地址/POST/JSON/描述）+ 请求参数表 + 返回参数表；数据集 → 字段信息表（序号/字段名称/字段中文名/数据类型/主键/允许为空/描述）。生成器 buildApiInfo / buildDatasetFields 在 lifecycle-shared.tsx，禁止删改。
- PRODUCT_TYPE_OPTIONS = ['API产品','数据集']；viewConfig 按 productType 取 api/dataset。
- 列表操作列：查看 / 血缘 / 生命周期；「时间轴」隐藏（代码保留），「生命周期1」已删除。
- 「产品交付」已更名「产品交易」。
- 血缘·基础产品授权信息：授权时间 yyyy-MM-dd HH:mm:ss；授权期限为「yyyy-MM-dd 至 yyyy-MM-dd」固定区间，不存在「长期有效」。

## 机构监管（institution-supervision）
- Tab 与统计卡顺序：全部 | 数据管理部门 | 行业主管部门 | 实施机构 | 运营机构 | 其他经营主体。
- 数据管理/行业主管为统筹型：隐藏「授权运营类型 / 领域名称」筛选与列并回填「-」（isManageDeptRole 判定）；「批次」列仅行业主管部门 Tab。
- 演示数据：实施 8 / 运营 7 / 行业主管 5 / 其他 6；数据管理部门 5（自动 3：常德/益阳/永州 + 手工 2：省本级、娄底市，见 MANUAL_SAMPLE_INSTITUTIONS）；待备案 5。
- 跨角色数量列经 linkFilter（kind: dept/operator/manage/impl）跳转：行业主管「已备案实施机构」、运营「已备案其他经营主体」、实施「已备案运营机构」；>0 蓝色可点、0 灰色不可点。数据管理部门 Tab 的「行业主管部门数量」列已去掉（showManageDeptColumn=false，代码保留）。
- 备案时间列名：数据管理/行业主管 Tab 为「创建时间」，全部 Tab 为「创建/备案时间」（filingTimeLabel）。
- 导出：筛选区【查询】【重置】后的下拉，范围=全部 / 当前筛选结果 / 已勾选；首列复选框（跨分页保留，切 Tab 清空）；前端 Blob CSV（UTF-8 BOM），导出后 toast；导出列与可见列一致。
- 备案关系链路视图：入口已 display:none（activeView 恒 list），chain.tsx / chain-shared.ts 保留；五级 数据管理→行业主管→实施→运营→其他；关键字段 filingManageDeptId / filingImplId。

## 业务概览（business-overview）
- 属「其他」组二级菜单；文件 index.tsx / spec.md / style.css / change.md。
- 全省总览三板块：机构数据、资源与产品登记、产品流通（流通率 33.33% 带口径说明）。
- 地域卡 15 张（省本级 + 14 市州）：机构备案常驻，展开追加「资源与产品登记 + 产品流通」双栏，默认收起。
- 【领域明细】全省/地域/区县可点；【地域明细】仅市州，进入市州下钻；省本级无地域明细。
- 视图层级：全省 → 市州(areaDrill) → 领域(domainDrill) → 区县领域(districtDomain)。

## 数据资源目录（data-resource-catalog）
- 按钮顺序：关联 → 查看 → 编辑 → 删除 → 变更 → 撤销 → 查看存证。
- 编辑/变更弹窗字段与新增一致且回显已有数据；新增弹窗按截图精确还原。

## 备案四页弹窗视觉（2026-10-29 定稿，正式页）
> 原 pending-* 复制页已删除，设计落到正式四页：implementation-org-filing / implementation-plan-filing / operation-org-filing / operation-agreement-filing（各含 index.tsx + style.css + spec.md + change.md）。

- **统一结构**：弹窗 `modal-medium filing-form-modal`（640px），内容区 `modal-body filing-form-body`；分组标题 `form-group-title`（左侧 3px #1677ff 竖条 + 14px/600 #1f2937），右侧可选 `form-group-note`（12px 灰）与 `form-group-note-danger`（12px 红 #d54941，无图标）。
- **统一样式做法**：各页 style.css 末尾追加同一段 `.filing-form-modal ...` 作用域样式：
  - `.form-grid` 单列（`grid-template-columns:minmax(0,1fr)`、`row-gap:16px`）、`.form-item{min-height:0}`、label 120px 右对齐、textarea min-height 100px；
  - `.upload-cards` 三列网格（`gap:20px`）；`.upload-card` 白底 + 1px dashed #d8dfe9、圆角 4、`min-height:96px`、竖向居中、标题 13px/400 居中（星号紧贴文字，`gap:0`，ⓘ 距文字 4px）+ 白底灰边按钮 `点击上传/重新上传`（h30，border #d8dfe9，文字 #1f2329）；has-file 实线浅蓝、has-error 红框 + 卡内红字；
  - 平铺单文件行（实施方案 / 运营协议）：`.primary-file-section` 改为 `grid-template-columns:120px minmax(0,1fr)`，无边框无底色，标题右对齐、按钮左对齐；
  - Tooltip 气泡在卡片内以卡片为基准（`.upload-card{position:relative}` + `.field-tip{position:static}` + 气泡 `left:0;width:100%`），避免撑出横向滚动条。
  - `.upload-card-title / -btn / -file / -error` 样式已提升为 `.filing-form-modal` 级（卡片与平铺行共用）。
- **各页分组与字段**：
  - 实施机构备案：「备案信息」（授权运营类型 / 领域名称 / 实施机构名称 / 统一社会信用代码，无注释）→「证明材料」（注释支持格式；卡：会议纪要*、机构资格证明*、其他证明材料）→「情况说明」（红字提示）+ textarea。表单新增字段 `minutesFile` / `qualFile`，原 `attachment` 复用为「其他证明材料」。
  - 实施方案备案：「备案信息」（注释）内为平铺行「* 实施方案 ⓘ + 点击上传」（`.form-grid.plan-file-grid`）→「证明材料」（5 卡：会议纪要*、数据局联审意见*、财政厅联审意见*、分管领导批示*、其他证明材料，3+2）→「情况说明」（红字提示）。新增字段 `leaderFile` / `otherFile`。
  - 运营机构备案：「备案信息」（无注释；实施方案为 disabled 只读 input、运营机构名称*、统一社会信用代码*）→「证明材料」（5 卡：征集公告*、专家评审意见*、公示证明*、机构资格证明*、其他证明材料，3+2）→「情况说明」（无红字提示）。新增字段 `noticeFile` / `reviewFile` / `qualFile` / `otherFile`，`attachment` = 公示证明。
  - 运营协议备案：「备案信息」（注释；运营机构只读、* 运营协议平铺行、* 授权期限日期区间）→「证明材料」（会议纪要*、其他证明材料，2 卡）→「情况说明」（红字提示）。新增字段 `otherFileName`；会议纪要卡已改为编辑/变更弹窗也显示。

## SPA 局部切换（src/common/Layout.tsx）
- 侧边栏点击拦截（handleSpaNavClick），仅替换中央内容区，外层侧边栏保持挂载；host 身份由 window.__AXHUB_SPA_EMBEDDED__ 判定。
- dev 走 `import('/prototypes/<key>/index.tsx')`（vite root=src）；构建产物走 `<key>.js` IIFE + 临时替换 window.__AXHUB_DEFINE_COMPONENT__ 捕获组件。
- 被加载页 Layout 以 isEmbeddedInstance 只渲染 `<main class="main-content-spa-embedded">`；history.pushState 同步 URL（/prototypes/<key>.html），popstate 支持前后退；加载遮罩 .spa-switch-loading-mask；失败兜底整页跳转。
- 样式隔离：加载前 dropSpaInjectedStyles 移除上次注入样式，加载后按 head 快照 diff trackSpaInjectedStyles，避免跨页全局类名（.form-grid 等）污染；单页可用两级选择器锁定布局。
- **SPA 作用域类串页坑（2026-10-26 定位并修复）**：页面级作用域类（如 `.pending-op-agree-filing`）若写在页面组件**最外层 div** 上，SPA 切换时宿主页该容器不会被卸载 → 类残留，其前缀样式（单列 `.form-grid`、`display:flex` 的 `.upload-cards`、119px 行式 `.upload-card` 等）串到后续加载页，造成其他备案页「备案材料」卡片变行式/卡片 683px 宽/弹窗底部横向滚动条。修复：把作用域类**下移到 Layout children 内部**（本页内容）+ 每个弹窗单独包一层，切换后随内容卸载而消失。**只有 pending-operation-agreement-filing 使用前缀 CSS**，其余 pending 页为全局类名。
- 排查手段（可复用）：temp/inspect/cdp*.mjs 用无头 Chrome + CDP 测量弹窗宽度/溢出（需先 `npm run dev`，密码见 src/common/PasswordGuard.tsx，页面入口 `http://localhost:<port>/prototypes/<key>/`，加 `--noproxy '*'`）。
- Layout.tsx / layout.css 属公共文件，改动后需重建全部 dist 入口。注意：`npm run build` 的 rmSync(dist) 会被环境安全守卫拦截（>50 项删除），全量重建需用户本机执行。

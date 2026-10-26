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

## 未确定需求板块（pending-*）
- 侧边栏「其他」下方红色虚线分区（NavEntry type:'divider'，样式 .nav-divider-label）。含 pending-filing-management + 4 页：pending-implementation-org-filing / pending-implementation-plan-filing / pending-operation-org-filing / pending-operation-agreement-filing，为原备案四页整页复制（仅 index.tsx + style.css，无 md、无文档按钮）。原备案四页保持不变。
- 四页共性：新增弹窗「情况说明」placeholder 统一「选填，请输入」；卡片式上传（.upload-cards / .upload-card，整卡可点，标题 + 点击上传/重新上传 + 文件名，Tooltip 挂标题旁，校验为卡内红框红字）；旧的 .upload-status / .upload-progress 均 display:none（代码保留）。
- **运营协议备案（pending-operation-agreement-filing）最终结构（2026-10-26 定稿）**：`「备案信息」分组 → 运营机构 → 运营协议上传行 → 授权期限 → 「备案材料」(会议纪要卡，仅新增弹窗) → 「情况说明」分组 + textarea`。运营协议（.primary-file-section）已由顶部独立整行并入「备案信息」组、位于运营机构与授权期限之间，去掉「主文件」角标、外边框与底色，按普通表单行排版（120px label 列右对齐 + 控件列「点击上传」按钮）；分组标题名「基本信息」已改「备案信息」（标题右侧挂「支持格式: .pdf 单个文件不能超过15MB」注释），情况说明有独立分组标题。字段名/按钮对齐沿用 120px+1fr 网格；命名空间 .pending-op-agree-filing（style.css 末尾）。
- **实施方案备案（pending-implementation-plan-filing）**：新增弹窗表单顺序（2026-10-26 定稿）= **备案信息**（分组标题 + 旁挂「支持格式: .pdf 单个文件不能超过15MB」）→ **实施方案（2026-10-26 最终：平铺行式，与运营协议一致）**：包在 `.form-grid.plan-file-grid`（单列、gap 0、`padding:5px 0` 上下各留 5px 空隙）内，label .primary-file-section 自身 `display:grid; grid-template-columns:120px minmax(0,1fr); align-items:center; padding:0; margin:0; border:none; background:transparent`，标题右对齐 label 列、13px/400，「点击上传」按钮（h32）左对齐控件列；hover/has-file/has-error 均无边框无底色；文件名/错误提示 `grid-column:2` 左对齐。旧的卡片式规则（calc((100%-24px)/3) 等宽虚线卡）保留在文件中被后面的平铺规则覆盖→ 备案材料（同款支持格式注释 + 4 卡：会议纪要/数据局联审意见/财政厅联审意见/领导批示，3+1）→ **情况说明**（独立分组标题「情况说明」+ `.form-grid.remark-grid`，margin-top 14px）。主文件区内部「支持格式」说明 .upload-hint display:none（代码保留）。
- **运营机构备案（pending-operation-org-filing）**：「备案信息」（2026-10-26 由「基本信息」更名：实施方案只读 .plan-info-item / 运营机构名称 / 统一社会信用代码）+ 备案材料 5 卡（征集公告 / 专家评审意见 / 公示证明 / 机构资格证明 / 其他证明材料，3+2）→ 「情况说明」独立分组标题 + textarea（2026-10-26 移至表单最末）。
- **实施机构备案（pending-implementation-org-filing）**：「备案信息」（2026-10-26 由「基本信息」更名：授权运营类型 / 领域名称 / 实施机构名称 / 统一社会信用代码）+ 备案材料 3 卡（会议纪要 / 机构资格证明 / 其他证明材料）；「情况说明」移至表单最末、独立「情况说明」分组标题（2026-10-26，紧随备案材料之后）。
- 卡片 Tooltip 气泡：以整卡为基准水平居中、宽 180px 防溢出（`.upload-card{position:relative}` + `.field-tip{position:static}`）。

## SPA 局部切换（src/common/Layout.tsx）
- 侧边栏点击拦截（handleSpaNavClick），仅替换中央内容区，外层侧边栏保持挂载；host 身份由 window.__AXHUB_SPA_EMBEDDED__ 判定。
- dev 走 `import('/prototypes/<key>/index.tsx')`（vite root=src）；构建产物走 `<key>.js` IIFE + 临时替换 window.__AXHUB_DEFINE_COMPONENT__ 捕获组件。
- 被加载页 Layout 以 isEmbeddedInstance 只渲染 `<main class="main-content-spa-embedded">`；history.pushState 同步 URL（/prototypes/<key>.html），popstate 支持前后退；加载遮罩 .spa-switch-loading-mask；失败兜底整页跳转。
- 样式隔离：加载前 dropSpaInjectedStyles 移除上次注入样式，加载后按 head 快照 diff trackSpaInjectedStyles，避免跨页全局类名（.form-grid 等）污染；单页可用两级选择器锁定布局。
- **SPA 作用域类串页坑（2026-10-26 定位并修复）**：页面级作用域类（如 `.pending-op-agree-filing`）若写在页面组件**最外层 div** 上，SPA 切换时宿主页该容器不会被卸载 → 类残留，其前缀样式（单列 `.form-grid`、`display:flex` 的 `.upload-cards`、119px 行式 `.upload-card` 等）串到后续加载页，造成其他备案页「备案材料」卡片变行式/卡片 683px 宽/弹窗底部横向滚动条。修复：把作用域类**下移到 Layout children 内部**（本页内容）+ 每个弹窗单独包一层，切换后随内容卸载而消失。**只有 pending-operation-agreement-filing 使用前缀 CSS**，其余 pending 页为全局类名。
- 排查手段（可复用）：temp/inspect/cdp*.mjs 用无头 Chrome + CDP 测量弹窗宽度/溢出（需先 `npm run dev`，密码见 src/common/PasswordGuard.tsx，页面入口 `http://localhost:<port>/prototypes/<key>/`，加 `--noproxy '*'`）。
- Layout.tsx / layout.css 属公共文件，改动后需重建全部 dist 入口。注意：`npm run build` 的 rmSync(dist) 会被环境安全守卫拦截（>50 项删除），全量重建需用户本机执行。

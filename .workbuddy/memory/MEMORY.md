# 项目长期记忆（Axhub）

## 工程约束（贯穿所有原型模块）
- 改动后必须通过编译与类型检查（tsc -p tsconfig.typecheck.json --noEmit，用 managed Node 直接调 tsc）。
- 狭范围改动：仅限目标页面，不引入新依赖、不影响其他页面与既有逻辑。
- 原始代码保留不删，UI 条目采用隐藏（display:none）/ 禁用方式处理，而非删除代码。
- 文档与代码同步：修改代码同步更新 spec.md 与 change.md；change.md 历史记录保留原文不删改。
  - **（2026-10-16 更新）除非用户明确要求，一律不要修改 md 文档（spec.md / change.md 等）**，仅改代码；用户主动提及 md 时才同步。
- 默认约定（除非特别说明）：不更新工作日志、不展示产物文件，由用户自行查看效果。

## 产品库模块（product-lifecycle）
- 查看弹窗（产品详情）结构：**两个 TAB 页签**：「基本信息」「配置信息」；默认打开「基本信息」。
  - 基本信息页签内包含三个区块：基本信息 / 提供方信息 / 声明信息。
  - 配置信息页签按产品类型分支：数据集产品展示「字段信息」表；API产品展示「API接口信息」网格 + 请求参数表 + 返回参数表。
- **配置信息必须完整保留**：API 产品的接口信息（buildApiInfo：接口名称/地址/请求方式 POST/返回格式 JSON/接口描述 + 请求参数表 + 返回参数表）与数据集产品的字段信息（buildDatasetFields：序号/字段名称/字段中文名/数据类型/主键/允许为空/描述）是先前已生成的，生成或修改代码时不得删除、遗漏或覆盖。生成器位于 lifecycle-shared.tsx，内容保持不变。
- 产品类型分支：PRODUCT_TYPE_OPTIONS = ['API产品', '数据集']；viewConfig 按 productType 取 api / dataset。
- 列表操作列按钮：查看、血缘、生命周期（均为页面跳转/弹窗）；原「时间轴」隐藏（display:none 保留代码），原「生命周期1」已直接删除（代码移除）。
- 「产品交付」已统一更名为「产品交易」（2026-09-30）。

## 产品库血缘系统 - 基础产品授权信息数据格式约束
- 适用场景：产品库血缘系统中处理「基础产品授权信息」（product-lifecycle 血缘视图·基础产品节点·授权信息）。
- 授权时间字段：采用「年月日时分秒」格式（yyyy-MM-dd HH:mm:ss）。
- 授权期限字段：采用「年月日-年月日」区间格式（如 2026-06-04 至 2031-06-04）。
- 系统中不存在「长期有效」类无固定期限的授权值；授权期限必须为带起止日期的固定区间。


## 机构监管模块（institution-supervision）
- 监管角色共五类，Tab 顺序：全部 | 数据管理部门 | 行业主管部门 | 实施机构 | 运营机构 | 其他经营主体（2026-10-19 起，数据管理部门置于行业主管部门之前）。
- 顶部统计卡片顺序与 Tab 一致：机构总数 → 数据管理部门数量 → 行业主管部门数量 → 实施机构数量 → 运营机构数量 → 其他经营主体数量。
- 「数据管理部门」与「行业主管部门」同属统筹型管理部门：Tab 内隐藏「授权运营类型 / 领域名称」筛选与列表列，列表中回填「-」（由 isManageDeptRole 统一判定）；「批次」列仅行业主管部门 Tab 展示。
- 演示数据量：实施 8 / 运营 7 / 行业主管 5 / 其他 6（自动种子），数据管理部门 5 = 自动 3（常德/益阳/永州）+ 手工样例 2（省本级「湖南省数据资源管理局」、娄底市「娄底市数据资源管理局」，见 MANUAL_SAMPLE_INSTITUTIONS；原自动 4 条会生成与手工样例同名的娄底市记录，已修正为 3 条）；另有待备案 5。
- 备案关系链路视图（2026-10-19，**入口已于同日隐藏**）：页面顶部「机构清单 / 备案关系链路」视图切换条 display:none（代码保留，activeView 恒为 list，页面仅展示机构清单；chain.tsx / chain-shared.ts 未删除，如需恢复去掉 display:none 即可）；链路五级：数据管理部门 → 行业主管部门 → 实施机构 → 运营机构 → 其他经营主体；新增归属字段 filingManageDeptId（行业主管→数据管理部门，同地域优先/省本级兜底）与 filingImplId（运营机构→实施机构，同地域优先/轮转）；公共数据层在 chain-shared.ts（Institution 模型、buildRoleSpecific、层级查询），链路视图在 chain.tsx；层级切换/查询/刷新走 300ms 模拟加载 + 层级缓存（刷新清当前层及子层缓存，父层保留）；分页筛选为本地即时；空态区分「层级无数据（返回上一级）」与「筛选无结果（重置筛选）」；下级为 0 时数字灰色不可点、【查看下级】禁用；末级无下钻入口。链路层统计卡区域已于 2026-10-19 整体移除（renderStats 代码保留未挂载）；省本级/地市数量区分以行内小字置于链路概览条正下方（chain-region-line）。
- 导出功能（2026-10-19）：导出入口位于筛选区【查询】【重置】按钮之后的【导出】下拉菜单；三种导出范围：全部（当前 Tab 角色全量）/ 当前筛选结果 / 已勾选；列表首列为复选框（可全选本页、全选筛选结果，跨分页保留，切 Tab 清空）；CSV 由前端 Blob 生成（UTF-8 BOM），不引入新依赖，导出列与列表可见列一致，导出后顶部 toast 提示；列表卡顶部工具条仅保留「当前结果数 / 勾选状态」信息。
- 机构清单跨角色数量列（2026-10-19）：行业主管部门 Tab 展示「已备案实施机构」（点击跳实施机构列表，按 filingDeptId 过滤）、运营机构 Tab 展示「已备案其他经营主体」（点击跳其他经营主体列表，按 filingOperatorId 过滤）；新增数据管理部门 Tab「行业主管部门数量」（点击跳行业主管部门列表，按 filingManageDeptId 过滤）、实施机构 Tab「已备案运营机构」（点击跳运营机构列表，按 filingImplId 过滤）。数字 >0 为可点蓝色 link-number，0 显示灰色不可点；跳转经 linkFilter（kind: dept/operator/manage/impl）+ 提示条，返回恢复来源 Tab；导出列随列表可见列同步。（2026-10-19 调整：数据管理部门 Tab 的「行业主管部门数量」列已去掉，showManageDeptColumn 恒为 false、代码保留；数据管理部门与行业主管部门 Tab 的备案时间列改名为「创建时间」，全部 Tab 改为「创建/备案时间」（filingTimeLabel，其余 Tab 不变），导出表头同步。）

## 业务概览模块（business-overview，2026-10-19 新增）
- 归属「其他」菜单组二级子菜单（与机构监管并列），仅数据管理部门角色；文件：index.tsx / spec.md / style.css / change.md。
- 顶部「全省总览」卡分三板块：机构数据（数据管理部门1/行业主管10/实施12/运营12/其他12）、资源与产品登记（登记30/授权10/基础产品60/场景发布30/场景申报300/再开发90）、产品流通（流通产品30/有效订单10/调用成功10000/订单总额40000/流通率33.33%带?口径说明）。
- 地域卡片：省本级+14市州共15张，每张展示「机构备案」板块（各部门12/行业主管10/实施12/运营12/其他12），支持展开/收起；【领域明细】全省及各地域可点（弹窗按领域展示数/产品数）；【地域明细】仅市州可点，进入**市州下钻视图**（2026-10-19 同日由弹窗改为下钻）：返回导航 + 市州级概览卡（与全省总览同构、机构数据取市州口径）+ 下辖区县机构备案卡片（区县仅领域明细+展开/收起，无地域明细）；省本级无地域明细按钮。
- 领域明细下钻（2026-10-19 同日，由弹窗改为下钻视图）：地域/区县卡【领域明细】进入领域视图——标题行（来源地域名蓝色 + 【进入区县领域概览】仅市州 + 【返回地域概览】回到进入前位置）+「整理领域」汇总卡（三大板块，领域口径机构数据无数据管理部门维度：行业主管1/实施1/运营1/其他12）+ 领域卡片（卫健/科技/交通/文旅/金融，机构数据+展开/收起）；【进入区县领域概览】为第三层（返回领域概览 + 区县卡片展示领域口径机构数据）。视图层级：全省 → 市州(areaDrill) → 领域(domainDrill{region,from}) → 区县领域(districtDomain)。
- 卡片展开/隐藏（2026-10-19）：所有带【展开/隐藏】的卡片（地域/区县/领域/区县领域卡）机构数据或机构备案常驻展示，展开后追加该分类下的「资源与产品登记 + 产品流通」两栏板块（extra-sections，与截图双栏一致）；默认收起，按钮文案 隐藏/展开。
- 注册：src/common/Layout.tsx 的「其他」group 增加 business-overview、activeMenu 联合类型与面包屑映射同步扩展；入口由 scripts/scan-entries.js 自动扫描写入 .axhub/make/entries.json。

## 数据资源目录模块（data-resource-catalog）
- 操作按钮顺序严格：关联 → 查看 → 编辑 → 删除 → 变更 → 撤销 → 查看存证（左到右）。
- 编辑/变更弹窗字段与新增弹窗一致，需预填回显已有数据；新增弹窗 UI 按参照截图精确还原。

## 未确定需求板块（2026-10-21 新增）
- 侧边栏「其他」group 下方新增「未确定需求」分区（NavEntry 新增 type:'divider'，红色标注 + 虚线分隔，样式 .nav-divider-label 于 layout.css；搜索过滤时 divider 隐藏，侧边栏收起时隐藏）。
- 分区内复制「备案管理」一级菜单（key: pending-filing-management）+ 4 个二级菜单：pending-implementation-org-filing / pending-implementation-plan-filing / pending-operation-org-filing / pending-operation-agreement-filing，页面为原备案四页的整体复制（仅 index.tsx + style.css，不含 spec.md / change.md，已移除 ?raw 导入与 specContent/changeLogContent 传参，无页面说明/原型修改记录按钮）。
- 原「备案管理」四页保持不变；activeMenu 联合类型已扩展 4 个 pending-* key，面包屑走默认「备案管理」分支；入口经 scripts/scan-entries.js 注册。

## SPA 局部切换机制（2026-10-21 新增，src/common/Layout.tsx）
- 侧边栏导航点击已改为拦截默认跳转（handleSpaNavClick），动态加载目标模块组件并仅替换中央内容区；外层侧边栏保持挂载，不整页刷新。
- 机制：宿主 Layout（首个实例）通过 useState 初始化时读取 window.__AXHUB_SPA_EMBEDDED__ 判定身份；切换时置位该标记并动态加载模块。dev 环境（存在 window.DevTemplateBootstrap）走 `import('/prototypes/<key>/index.tsx')`（vite root=src）；构建产物走脚本标签执行 `<key>.js` IIFE + 临时替换 window.__AXHUB_DEFINE_COMPONENT__ 捕获组件。
- 被加载页面的 Layout 以嵌入模式渲染（isEmbeddedInstance → 仅 `<main class="main-content main-content-spa-embedded">`，无侧边栏，顶栏/弹层随新页面）；侧边栏高亮跟随 effectiveActiveMenu（remoteModule.key 或 activeMenu）。
- history.pushState 同步 URL 为 /prototypes/<key>.html；popstate 支持前进/后退恢复；加载失败兜底整页跳转；加载中显示 .spa-switch-loading-mask 遮罩（layout.css）。侧边栏「授权记录」action 项在远程模块激活时隐藏（避免触发宿主页面弹窗）。
- 已验证：tsc 通过；dev 模块转换 200；单入口生产构建成功（动态 import 以原生形式保留）。注意：`npm run build` 的 rmSync(dist) 会被环境安全守卫拦截（>50 项批量删除需确认），全量重建 dist 需用户正常环境执行或分批清理。

## SPA 切换的样式隔离（2026-10-21 补充）
- 各页 style.css 使用全局类名（.form-grid / .form-item / .upload-* 等），SPA 局部切换时上一页注入的 <style> 残留在 head，会覆盖新页同名规则造成布局错乱（典型：运营协议备案弹窗被其他备案页的双列 .form-grid 污染）。
- 已在 Layout.tsx 的 loadSpaModuleComponent 中加入样式隔离：加载前移除上次 SPA 注入的样式节点（dropSpaInjectedStyles），加载后按 head 快照 diff 记录本次新增节点（trackSpaInjectedStyles）；宿主页原有样式不受影响，dev/构建两条路径均生效。
- 单页防护做法：用两级选择器提高优先级（如 `.form-modal .form-grid { grid-template-columns: 1fr }`）锁定本页布局。
- Layout.tsx / layout.css 属公共文件，改动后需重建全部 dist 入口（42 个）保持产物一致。

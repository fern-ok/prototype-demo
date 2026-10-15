# 运营机构备案 — 原型修改记录

## 2026-10-14 新增「运营机构备案」原型模块

- **归属**：备案管理 → 运营机构备案（二级模块）。
- **改动文件**
  - `src/common/Layout.tsx`：在「备案管理」分组下新增菜单项 `{ key: 'operation-org-filing', label: '运营机构备案' }`（位于实施方案备案之后）；`activeMenu` 联合类型追加 `'operation-org-filing'`。
  - `src/prototypes/operation-org-filing/index.tsx`：页面主体（列表、新增/编辑弹窗、查看详情弹窗、区块链存证弹窗）。
  - `src/prototypes/operation-org-filing/style.css`：弹窗/表单/详情/存证样式（复用 `backend-list.css` 公共基类）。
  - `src/prototypes/operation-org-filing/spec.md`：页面规格说明。
  - `src/prototypes/operation-org-filing/change.md`：本修改记录。
  - `vite-plugins/.../sidebar-tree.json`：prototypes 列表追加 `operation-org-filing` 条目（与同组模块同模式）。
- **实现要点**
  - 列表表头含「实施方案」PDF 文件链接列；状态枚举 待省级确认/已备案/省级退回，操作权限：待省级确认→查看；已备案→查看+查看存证；省级退回→查看+编辑。
  - 新增/编辑弹窗：实施方案为禁用下拉（默认选中已备案实施方案）；运营机构名称、统一社会信用代码为必填输入，信用代码增加 18 位格式校验；新增提交后状态置「待省级确认」。
  - 查看详情弹窗：申请信息/审核信息双 Tab；审核表流程节点为 提交备案、省级确认备案。
  - 区块链存证弹窗：凭证编号、运营机构、信用代码、类型、领域、地域、实施方案、备案时间、存证时间、电子证据、区块链ID、存证状态。
- **验证**：`tsc -p tsconfig.typecheck.json --noEmit` 通过；入口扫描 `scan-entries.js` 重新生成 manifest，新增 `operation-org-filing` HTML 入口；Layout 菜单与 sidebar-tree.json 均已注册。
- **设计决策**
  - 状态口径统一为「省级」（与原型描述主表一致），未采用查看详情 Tab1 备注中疑似笔误的「市级」表述。
  - 新增/编辑表单未采集授权运营类型/领域名称/所属地域，采用默认演示值；如需补充采集字段可再扩展。

## 2026-10-14 新增「附件」上传字段（新增/编辑弹窗）
- 在「统一社会信用代码」之后新增「附件」上传入口（文件上传、必填），提示：上传运营机构公示结果、专家评审意见等文件；支持 PDF 上传，必填校验，未上传点击提交给出提示并阻止提交。
- `OperOrgFormData` 增加 `attachment`；记录 `OperOrgFiling` 增加 `attachment?` 并随新增/编辑提交写入；编辑弹窗预填原有附件。
- `style.css` 补齐上传控件样式（`.upload-item` / `.upload-control` / `.upload-btn` / `.upload-name` / `.has-file`），提示文字采用自动换行（white-space: normal）完整显示。
- 验证：`tsc` 通过；spec.md、change.md 同步更新。

## 2026-10-14 调整附件上传控件对齐
- 调整「附件」上传控件样式：`.upload-control` 由 `align-items: flex-start` 改为 `align-items: center`，使「选择文件」按钮与提示文字垂直居中对齐、保持在一条水平线上。
- `.upload-name` 增加 `text-align: left` 和 `word-break: break-all`，保证长提示文字换行后仍左对齐。
- 仅样式调整，未改动组件逻辑与数据结构。

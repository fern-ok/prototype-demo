# 原型修改记录

## 2026-10-15（批次筛选条件挪到最前）

筛选区字段顺序由「所属地域 → 单位/企业名称 → 统一社会信用代码 → 批次 → 创建时间」改为「批次 → 所属地域 → 单位/企业名称 → 统一社会信用代码 → 创建时间」，操作列与新增弹窗不受影响。

## 2026-10-15（字段去加粗 + 批次输入框重构）

按需求：字段去掉加粗效果；批次的"第"和"批"字挪到输入框外面，批次输入框是计数器。

1. `.form-item label`：`font-weight: 500` → `font-weight: normal`，所有 5 个表单字段标签不再加粗。
2. 批次字段重构：
   - 删除旧 `.batch-combo` 规则（把"第 [input] 批"放在同一个 border 内的组合框）。
   - 新增 `.batch-field`：`display:inline-flex; gap:8px`，三个兄弟元素平铺——"第"（.batch-prefix）、独立 .batch-counter input（原生 type="number"，自带 spinner、自己的 border、108px 宽）、"批"（.batch-suffix）。
   - "第"和"批"文字在输入框 border 外侧（prefix.right < input.left < suffix.left），视觉上前后缀而非输入框内容。
   - HTML 对应更新：.batch-combo → .batch-field、.batch-input-num → .batch-counter。
3. 浏览器验收：5 个 label fontWeight 全为 400；hasBatchField=true 且 hasBatchCombo=false；prefixOutside=true、suffixOutside=true；counter 为 type=number、width=108px、有 border。

## 2026-10-15（修复新增弹窗表单项间隔）

用户反馈新增弹窗内表单项紧贴无间隔。根因：HTML 中 `.modal-body` 与 `.form-content`（以及 `.modal-body` 与 `.delete-content`）是**同一个元素上同时存在的两个类名**，但 style.css 中 CSS 选择器写的是后代选择器（空格分隔）`.modal-body .form-content` / `.modal-body .delete-content`，浏览器无法匹配自身，整条 flex column + gap 规则完全失效。

修复：
1. 选择器改为类联写 `.modal-body.form-content` / `.modal-body.delete-content`，浏览器正确匹配。
2. `.modal-body.form-content`：display:flex + flex-direction:column + gap:24px（表单项间隔 24px），padding:20px 24px 8px，min-height:auto + flex:1 1 auto + overflow:visible（让内容撑高而非被压缩滚动）。
3. `.modal-medium/.modal-sm` max-height 从 84vh 提到 90vh，保障 5 个表单项在常规视口下完整可见无滚动。
4. 删除此前 form-item 的 margin-bottom:4px（gap 已解决间隔）。

## 2026-10-14
1、新建「行业主管部门管理」页面，位于【系统管理】菜单下二级模块，仅向数据基础设施运营方开放。
2、实现筛选区：所属地域、单位/企业名称、统一社会信用代码、批次、创建时间（日期范围），支持多条件“且”组合查询与重置。
3、实现列表：序号、批次、所属地域、单位/企业名称、统一社会信用代码、创建时间、操作（删除），并支持分页（上一页/下一页/每页条数切换/跳转页码）。
4、实现新增弹窗（标题“新增”）：批次、所属地域、单位/企业名称、统一社会信用代码四项必填，校验通过后保存并刷新列表。
5、实现删除确认弹窗：确认后移除记录并刷新列表。
6、同步生成 `spec.md`、`change.md`，并在 Layout 侧边栏【系统管理】分组与 `.axhub/make/sidebar-tree.json` 中注册菜单入口。
7、修复新增 / 删除弹窗渲染：将原未正确置顶的 `modal-mask` 结构替换为 `modal-overlay` 居中遮罩弹窗（新增 640px、删除 400px），补充 `.modal-header` / `.modal-body` / `.modal-footer` / `.modal-close` 样式，确保点击【+ 新增】后以浮层弹窗形式展示表单，而非页面底部内联表单。
8、优化筛选条件：
   - 「创建时间」日期范围选择器补充 `.date-inputs` / `.date-input` / `.date-separator` 样式，使起止日期输入框在同一行内紧凑展示、与整体筛选区风格一致。
   - 「批次」筛选由下拉选择改为文本输入框，支持模糊检索（按输入内容匹配批次名称）。
9、新增弹窗表单改造：
   - 在新增弹窗中新增「行业主管部门」必填字段（文本输入）。
   - 将弹窗表单由「标签在上、输入框在下」的纵向布局改为「标签在左、输入框在右」的水平排列布局：引入 `.form-item`（120px 标签列 + 自适应输入列）与 `.form-control` 结构，标签右对齐、输入框左对齐，所有表单项保持统一间距与对齐。
   - 同步调整 `IndustryDeptRecord` 数据结构与种子数据，新增记录均保存「行业主管部门」字段。

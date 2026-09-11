/**
 * @name 数据资源目录
 * @mode axure
 *
 * 实施机构角色的数据资源目录管理页，提供行业树筛选、组合查询、
 * 目录列表、详情与存证查看。
 */

import { ReactNode, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Download, Info, Plus, RefreshCw, Search, SlidersHorizontal, Upload, X } from 'lucide-react';
import Layout from '../../common/Layout';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

type ChangeRecord = {
  status: '变更中' | '变更通过' | '变更不通过';
  time: string;
  field: string;
  oldValue: string;
  newValue: string;
  operator: string;
  opinion?: string;
  snapshot?: ChangeSnapshot;
};

// 变更前/后 全量字段对比快照：全量字段并排展示，差异以三色高亮
//   KV 段：  status ∈ same/modified/added/deleted 描述整字段的差异
//           - same     两值一致
//           - modified 两值不同
//           - added    仅变更后有值（前留空，后高亮并标「新增」）
//           - deleted  仅变更前有值（前高亮并标「删除」，后留空）
//   表格段：rowStatus 描述整行的差异，每侧独立呈现；行内单元格再做细粒度 diff
type ChangeKvDiff = {
  label: string;
  status: 'same' | 'modified' | 'added' | 'deleted';
  before: string;
  after: string;
};

type ChangeInfoItemValues = { name: string; type: string; length: string; desc: string };

type ChangeInfoItemRow = {
  english: string;
  rowStatus: 'same' | 'modified' | 'added' | 'deleted';
  before: ChangeInfoItemValues;
  after: ChangeInfoItemValues;
};

type ChangeSection =
  | { kind: 'kv'; title: string; rows: ChangeKvDiff[]; }
  | { kind: 'table'; title: string; rows: ChangeInfoItemRow[]; };

type ChangeSnapshot = {
  status: '变更中' | '变更通过' | '变更不通过';
  time: string;
  operator: string;
  opinion?: string;
  sections: ChangeSection[];
};

type Resource = {
  id: number;
  name: string;
  industry: string;
  reviewStatus: ReviewStatus;
  mountStatus: '已挂载' | '待挂载';
  createdAt: string;
  updatedAt: string;
  provider: string;
  changed?: boolean;
  changeRecords?: ChangeRecord[];
};

const reviewStatuses = [
  '待登记',
  '首次登记待审核',
  '变更登记待审核',
  '撤销登记待审核',
  '首次登记未通过',
  '变更登记未通过',
  '撤销登记未通过',
  '已通过',
  '已撤销',
] as const;

type ReviewStatus = typeof reviewStatuses[number];

const industries = ['农、林、牧、渔业', '采矿业', '制造业', '电力、热力、燃气及水生产和供应业', '建筑业', '批发和零售业', '交通运输、仓储和邮政业', '住宿和餐饮业', '信息传输、软件和信息技术服务业', '金融业', '房地产业', '科学研究和技术服务业', '租赁和商务服务业', '水利、环境和公共设施管理业', '居民服务、修理和其他服务业', '教育', '卫生和社会工作', '文化、体育和娱乐业', '公共管理、社会保障和社会组织', '国际组织'];

// 变更详情演示数据：覆盖 modified / added / deleted 三类差异
// 资源 #10 共 4 条变更记录，每条都挂一个全量字段快照
// 共用的基础字段（所有快照都展示，便于逐行比对）
const baseBasicFields: { label: string; value: string }[] = [
  { label: '数据资源标识码', value: '712430000MB0L04692743002W3CAD81M' },
  { label: '资源名称', value: '地域分类为长沙市的数据资源' },
  { label: '行业分类', value: '稻谷种植' },
  { label: '是否涉及个人信息', value: '否' },
  { label: '资源格式', value: 'xls' },
  { label: '数据来源', value: '原始取得' },
  { label: '更新频率', value: '每日' },
  { label: '覆盖时间范围', value: '2026-05-24 ~ 至今' },
  { label: '地域分类', value: '长沙市' },
  { label: '资源摘要', value: '基础数据资源，用于支撑农业农村相关业务分析，覆盖长沙市内稻谷种植情况。' },
];

const baseHolderFields: { label: string; value: string }[] = [
  { label: '资源持有方', value: '湖南省农业农村厅' },
  { label: '统一社会信用代码', value: '12430000MB0L046927' },
  { label: '联系人', value: '李四' },
  { label: '联系方式', value: '13654785566' },
];

const baseInfoItems: { english: string; values: ChangeInfoItemValues }[] = [
  { english: 'hname', values: { name: '医院名称', type: '字符型', length: '50', desc: '医院名称' } },
  { english: 'menzhen', values: { name: '门诊号', type: '字符型', length: '50', desc: '门诊号编号' } },
  { english: 'shengao', values: { name: '身高', type: '数值型', length: '6', desc: '身高（cm）' } },
  { english: 'nianling', values: { name: '年龄', type: '数值型', length: '3', desc: '患者年龄' } },
  { english: 'hzname', values: { name: '户主姓名', type: '字符型', length: '50', desc: '户主姓名' } },
];

// 在共享字段上叠加若干差异，返回全量字段快照所需的 ChangeKvDiff[]
const buildKvDiff = (
  base: { label: string; value: string }[],
  diffs: Record<string, { status: 'modified' | 'deleted' | 'added'; before: string; after: string }>,
): ChangeKvDiff[] =>
  base.map(field => {
    const override = diffs[field.label];
    if (!override) return { label: field.label, status: 'same', before: field.value, after: field.value };
    return { label: field.label, status: override.status, before: override.before, after: override.after };
  });

// 在共享信息项上叠加若干差异
const buildInfoItemDiff = (
  base: { english: string; values: ChangeInfoItemValues }[],
  diffs: Record<string, { rowStatus: 'modified' | 'deleted' | 'added'; before: ChangeInfoItemValues; after: ChangeInfoItemValues }>,
): ChangeInfoItemRow[] =>
  base.map(item => {
    const override = diffs[item.english];
    if (!override) return { english: item.english, rowStatus: 'same', before: item.values, after: item.values };
    return { english: item.english, rowStatus: override.rowStatus, before: override.before, after: override.after };
  });

// 4 条变更记录的快照：首条覆盖全部三类差异，其余每条各展示一类
const changeSnapshots: ChangeSnapshot[] = [
  // 1. 地域分类（变更通过）—— 综合示例：含 modified / added / deleted
  {
    status: '变更通过',
    time: '2026-08-06 11:27:24',
    operator: '湖南省农业农村厅',
    opinion: '变更内容符合要求，同意本次变更登记。',
    sections: [
      {
        kind: 'kv',
        title: '基本信息',
        rows: buildKvDiff(baseBasicFields, {
          '资源名称': { status: 'modified', before: '地域分类为湖南省的数据资源', after: '地域分类为长沙市的数据资源' },
          '覆盖时间范围': { status: 'modified', before: '2026-01-01 ~ 至今', after: '2026-05-24 ~ 至今' },
          '地域分类': { status: 'modified', before: '湖南省', after: '长沙市' },
          '资源摘要': { status: 'modified', before: '基础数据资源，覆盖湖南省域内稻谷种植相关业务分析。', after: '基础数据资源，用于支撑农业农村相关业务分析，覆盖长沙市内稻谷种植情况。' },
          '数据来源': { status: 'added', before: '', after: '收集取得' },
        }),
      },
      {
        kind: 'kv',
        title: '资源持有方信息',
        rows: buildKvDiff(baseHolderFields, {
          '联系人': { status: 'modified', before: '张三', after: '李四' },
        }),
      },
      {
        kind: 'table',
        title: '信息项',
        rows: buildInfoItemDiff(baseInfoItems, {
          'menzhen': { rowStatus: 'modified', before: { name: '门诊编号', type: '字符型', length: '100', desc: '门诊编号（医院内部唯一）' }, after: { name: '门诊号', type: '字符型', length: '50', desc: '门诊号编号' } },
          'nianling': { rowStatus: 'deleted', before: { name: '年龄', type: '数值型', length: '3', desc: '患者年龄' }, after: { name: '', type: '', length: '', desc: '' } },
          'hzname': { rowStatus: 'added', before: { name: '', type: '', length: '', desc: '' }, after: { name: '户主姓名', type: '字符型', length: '50', desc: '户主姓名' } },
        }),
      },
    ],
  },
  // 2. 行业分类（变更通过）—— 仅一个 modified
  {
    status: '变更通过',
    time: '2026-08-06 11:25:10',
    operator: '湖南省农业农村厅',
    opinion: '分类调整通过，目录行业归类已与最新国民经济行业分类对齐。',
    sections: [
      {
        kind: 'kv',
        title: '基本信息',
        rows: buildKvDiff(baseBasicFields, {
          '行业分类': { status: 'modified', before: '稻谷种植,小麦种植', after: '稻谷种植' },
        }),
      },
      { kind: 'kv', title: '资源持有方信息', rows: buildKvDiff(baseHolderFields, {}) },
      { kind: 'table', title: '信息项', rows: buildInfoItemDiff(baseInfoItems, {}) },
    ],
  },
  // 3. 资源摘要（变更不通过）—— 仅一个 modified
  {
    status: '变更不通过',
    time: '2026-08-06 11:20:33',
    operator: '湖南省农业农村厅',
    opinion: '请补充覆盖范围说明，避免使用「全国」等模糊表述。',
    sections: [
      {
        kind: 'kv',
        title: '基本信息',
        rows: buildKvDiff(baseBasicFields, {
          '资源摘要': { status: 'modified', before: '湖南省域内稻谷种植相关数据。', after: '全国稻谷种植相关数据，覆盖各省份。' },
        }),
      },
      { kind: 'kv', title: '资源持有方信息', rows: buildKvDiff(baseHolderFields, {}) },
      { kind: 'table', title: '信息项', rows: buildInfoItemDiff(baseInfoItems, {}) },
    ],
  },
  // 4. 更新频率（变更中）—— 仅一个 modified
  {
    status: '变更中',
    time: '2026-08-06 11:18:06',
    operator: '湖南省农业农村厅',
    opinion: '',
    sections: [
      {
        kind: 'kv',
        title: '基本信息',
        rows: buildKvDiff(baseBasicFields, {
          '更新频率': { status: 'modified', before: '每月', after: '每日' },
        }),
      },
      { kind: 'kv', title: '资源持有方信息', rows: buildKvDiff(baseHolderFields, {}) },
      { kind: 'table', title: '信息项', rows: buildInfoItemDiff(baseInfoItems, {}) },
    ],
  },
];

const seedResources: Resource[] = [
  { id: 1, name: '待登记-农业生产数据', industry: '稻谷种植,小麦种植,玉米种植', reviewStatus: '待登记', mountStatus: '待挂载', createdAt: '2026-08-24 18:36:42', updatedAt: '2026-08-24 18:38:02', provider: '湖南省农业农村厅' },
  { id: 2, name: '首次登记待审核-耕地资源数据', industry: '稻谷种植', reviewStatus: '首次登记待审核', mountStatus: '待挂载', createdAt: '2026-06-25 10:55:59', updatedAt: '2026-08-24 10:17:13', provider: '长沙市农业农村局' },
  { id: 3, name: '变更登记待审核-农作物分类数据', industry: '稻谷种植,小麦种植', reviewStatus: '变更登记待审核', mountStatus: '待挂载', createdAt: '2026-06-26 16:12:07', updatedAt: '2026-08-24 10:17:11', provider: '株洲市农业农村局' },
  { id: 4, name: '撤销登记待审核-农业监测数据', industry: '稻谷种植', reviewStatus: '撤销登记待审核', mountStatus: '待挂载', createdAt: '2026-06-08 14:53:03', updatedAt: '2026-08-24 10:17:03', provider: '湘潭市农业农村局' },
  { id: 5, name: '首次登记未通过-能源资源数据', industry: '烟煤和无烟煤开采洗选', reviewStatus: '首次登记未通过', mountStatus: '待挂载', createdAt: '2026-08-21 15:06:54', updatedAt: '2026-08-21 15:08:00', provider: '湖南省能源局' },
  { id: 6, name: '变更登记未通过-豆类种植数据', industry: '豆类种植', reviewStatus: '变更登记未通过', mountStatus: '待挂载', createdAt: '2026-08-21 14:29:15', updatedAt: '2026-08-21 14:30:00', provider: '益阳市农业农村局' },
  { id: 7, name: '撤销登记未通过-农产品流通数据', industry: '稻谷种植,小麦种植', reviewStatus: '撤销登记未通过', mountStatus: '待挂载', createdAt: '2026-08-17 14:20:04', updatedAt: '2026-08-18 16:52:01', provider: '岳阳市农业农村局' },
  { id: 8, name: '已通过-医疗就诊数据资源', industry: '综合医院,中医医院,中西医结合医院', reviewStatus: '已通过', mountStatus: '已挂载', createdAt: '2026-08-11 15:23:32', updatedAt: '2026-08-11 15:28:15', provider: '湖南省卫生健康委' },
  { id: 9, name: '已撤销-林木育苗数据', industry: '林木育苗', reviewStatus: '已撤销', mountStatus: '已挂载', createdAt: '2026-08-10 10:39:50', updatedAt: '2026-08-10 17:28:01', provider: '湖南省林业局' },
  { id: 10, name: '地域分类为长沙市的数据资源', industry: '稻谷种植', reviewStatus: '已通过', mountStatus: '已挂载', createdAt: '2026-07-28 09:21:45', updatedAt: '2026-08-06 11:27:24', provider: '湖南省农业农村厅', changed: true, changeRecords: [
    { status: '变更通过', time: '2026-08-06 11:27:24', field: '地域分类', oldValue: '湖南省', newValue: '长沙市', operator: '湖南省农业农村厅', opinion: '变更内容符合要求', snapshot: changeSnapshots[0] },
    { status: '变更通过', time: '2026-08-06 11:25:10', field: '行业分类', oldValue: '稻谷种植,小麦种植', newValue: '稻谷种植', operator: '湖南省农业农村厅', opinion: '分类调整通过', snapshot: changeSnapshots[1] },
    { status: '变更不通过', time: '2026-08-06 11:20:33', field: '资源摘要', oldValue: '湖南省域内稻谷种植相关数据。', newValue: '全国稻谷种植相关数据，覆盖各省份。', operator: '湖南省农业农村厅', opinion: '请补充覆盖范围说明', snapshot: changeSnapshots[2] },
    { status: '变更中', time: '2026-08-06 11:18:06', field: '更新频率', oldValue: '每月', newValue: '每日', operator: '湖南省农业农村厅', opinion: '', snapshot: changeSnapshots[3] },
  ] },
];

const statusClass = (status: Resource['reviewStatus'] | Resource['mountStatus']) => {
  if (status === '已通过' || status === '已挂载') return 'status success';
  if (status === '首次登记待审核' || status === '变更登记待审核' || status === '撤销登记待审核' || status === '待挂载') return 'status info';
  if (status === '首次登记未通过' || status === '变更登记未通过' || status === '撤销登记未通过') return 'status danger';
  if (status === '已撤销') return 'status muted';
  return 'status warning';
};

type ActionType = 'view' | 'proof' | 'relate' | 'edit' | 'delete' | 'change' | 'revoke' | 'changeRecord';

type ActionDef = { key: ActionType; label: string; danger?: boolean; show: (s: ReviewStatus, item: Resource) => boolean };

// 操作按钮统一显示顺序：关联 → 查看 → 编辑 → 删除 → 变更 → 撤销 → 变更记录 → 查看存证
const ALL_ACTIONS: ActionDef[] = [
  { key: 'relate', label: '关联', show: s => s !== '已撤销' },
  { key: 'view', label: '查看', show: () => true },
  { key: 'edit', label: '编辑', show: s => ['待登记', '首次登记未通过'].includes(s) },
  { key: 'delete', label: '删除', show: s => ['待登记', '首次登记未通过'].includes(s) },
  { key: 'change', label: '变更', show: s => ['变更登记未通过', '撤销登记未通过', '已通过'].includes(s) },
  { key: 'revoke', label: '撤销', show: s => ['变更登记未通过', '撤销登记未通过', '已通过'].includes(s) },
  { key: 'changeRecord', label: '变更记录', show: (s, item) => s === '已通过' && !!item?.changed },
  { key: 'proof', label: '查看存证', show: s => ['变更登记未通过', '撤销登记未通过', '已通过'].includes(s) },
];

const auditTrail = (item: Resource) => {
  const steps = [{ time: item.createdAt, node: '资源创建', operator: item.provider, result: '待登记' as ReviewStatus }];
  if (item.reviewStatus !== '待登记') {
    steps.push({ time: item.createdAt, node: '提交审核', operator: item.provider, result: '首次登记待审核' as ReviewStatus });
    steps.push({ time: item.updatedAt, node: '审核结论', operator: '平台审核员', result: item.reviewStatus });
  }
  return steps;
};

const OriginalComponent = () => {
  const [keyword, setKeyword] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [mountStatus, setMountStatus] = useState('');
  const [industry, setIndustry] = useState('');
  const [createdStart, setCreatedStart] = useState('');
  const [createdEnd, setCreatedEnd] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState<Resource | null>(null);
  const [showProof, setShowProof] = useState<Resource | null>(null);
  const [action, setAction] = useState<{ type: ActionType; item: Resource } | null>(null);

  const filtered = useMemo(() => seedResources.filter(item =>
    (!keyword || item.name.includes(keyword) || item.industry.includes(keyword)) &&
    (!resourceName || item.name.includes(resourceName)) &&
    (!reviewStatus || item.reviewStatus === reviewStatus) &&
    (!mountStatus || item.mountStatus === mountStatus) &&
    (!industry || item.industry.includes(industry)) &&
    (!createdStart || item.createdAt.slice(0, 10) >= createdStart) &&
    (!createdEnd || item.createdAt.slice(0, 10) <= createdEnd)
  ), [keyword, resourceName, reviewStatus, mountStatus, industry, createdStart, createdEnd]);

  const reset = () => {
    setKeyword(''); setResourceName(''); setReviewStatus(''); setMountStatus('');
    setIndustry(''); setCreatedStart(''); setCreatedEnd(''); setPage(1);
  };

  const toggleIndustry = (item: string) => setExpanded(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);

  return (
    <Layout
      activeMenu="data-resource-catalog"
      breadcrumb="数据资源目录"
      role="实施机构"
      onRoleChange={() => undefined}
      roleOptions={['实施机构']}
      title="数据资源目录"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      <div className="catalog-page">
        <div className="catalog-content">
          <aside className="industry-panel">
            <div className="industry-search">
              <input placeholder="请输入搜索关键字" onChange={e => setIndustry(e.target.value)} />
              <Search size={14} />
            </div>
            <button className={'industry-root' + (!industry ? ' selected' : '')} onClick={() => setIndustry('')}>全部</button>
            {industries.map(item => (
              <div key={item}>
                <button className={'industry-item' + (industry === item ? ' selected' : '')} onClick={() => { setIndustry(item); toggleIndustry(item); }}>
                  {expanded.includes(item) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{item}
                </button>
                {expanded.includes(item) && <div className="industry-child">全部资源</div>}
              </div>
            ))}
          </aside>
          <section className="catalog-main">
            <div className="filter-panel">
              <label>资源名称<input value={resourceName} onChange={e => setResourceName(e.target.value)} placeholder="请输入" /></label>
              <label>审核状态<select value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}><option value="">请选择</option>{reviewStatuses.map(status => <option key={status}>{status}</option>)}</select></label>
              <label>数据源挂载状态<select value={mountStatus} onChange={e => setMountStatus(e.target.value)}><option value="">请选择</option><option>待挂载</option><option>已挂载</option></select></label>
              <label className="date-label">创建时间<div className="date-range"><input type="date" value={createdStart} onChange={e => setCreatedStart(e.target.value)} /><span>-</span><input type="date" value={createdEnd} onChange={e => setCreatedEnd(e.target.value)} /></div></label>
              <div className="filter-actions"><button className="btn primary" onClick={() => setPage(1)}>查询</button><button className="btn" onClick={reset}>重置</button><button className="btn" onClick={() => setPage(1)}>刷新</button><button className="btn primary add-button" onClick={() => setShowAdd(true)}><Plus size={16} />新增</button></div>
            </div>
            <div className="table-heading" />
            <div className="table-wrap">
              <table className="catalog-table">
                <thead><tr><th>序号</th><th>资源名称</th><th>行业分类</th><th>审核状态</th><th>数据源挂载状态</th><th>创建时间</th><th>更新时间</th><th>操作</th></tr></thead>
                <tbody>{filtered.slice((page - 1) * 10, page * 10).map((item, index) => <tr key={item.id}>
                  <td>{(page - 1) * 10 + index + 1}</td><td className="ellipsis" title={item.name}>{item.name}</td><td className="ellipsis" title={item.industry}>{item.industry}</td>
                  <td><span className={statusClass(item.reviewStatus)}>{item.reviewStatus}</span></td><td><span className={statusClass(item.mountStatus)}>{item.mountStatus}</span></td>
                  <td>{item.createdAt}</td><td>{item.updatedAt}</td><td className="actions">{ALL_ACTIONS.filter(a => a.show(item.reviewStatus, item)).map(a => (
                    <button key={a.key} className={a.danger ? 'action-danger' : ''} onClick={() => a.key === 'view' ? setShowView(item) : a.key === 'proof' ? setShowProof(item) : setAction({ type: a.key, item })}>{a.label}</button>
                  ))}</td>
                </tr>)}</tbody>
              </table>
               <div className="pagination"><span>共10条记录</span><div><button disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))}>‹</button><button className="active">1</button><button onClick={() => setPage(2)}>2</button><button onClick={() => setPage(3)}>3</button><button onClick={() => setPage(4)}>4</button><span>…</span><button onClick={() => setPage(13)}>13</button><button onClick={() => setPage(Math.min(13, page + 1))}>›</button><select><option>10条/页</option><option>20条/页</option></select><span>跳至</span><input value={page} onChange={e => setPage(Math.max(1, Math.min(13, Number(e.target.value) || 1)))} />页</div></div>
            </div>
           
          </section>
        </div>
      </div>
      {showAdd && <AddResourceModal onClose={() => setShowAdd(false)} />}
      {showView && <DetailModal item={showView} onClose={() => setShowView(null)} />}
      {showProof && <ProofModal item={showProof} onClose={() => setShowProof(null)} />}
      {action && action.type !== 'edit' && action.type !== 'change' && action.type !== 'relate' && action.type !== 'revoke' && (
        <div className="modal-overlay" onClick={() => setAction(null)}>
          <div className={'catalog-modal' + (action.type === 'changeRecord' ? ' change-record-modal' : '')} onClick={e => e.stopPropagation()}>
            {action.type === 'delete' && <ConfirmModal title="删除资源" danger confirmText="删除" message={`确认删除「${action.item.name}」？删除后不可恢复。`} onClose={() => setAction(null)} onConfirm={() => setAction(null)} />}
            {action.type === 'changeRecord' && <ChangeRecordModal item={action.item} onClose={() => setAction(null)} />}
          </div>
        </div>
      )}
      {action && action.type === 'edit' && <EditResourceModal item={action.item} onClose={() => setAction(null)} />}
      {action && action.type === 'revoke' && <RevokeModal item={action.item} onClose={() => setAction(null)} />}
      {action && action.type === 'change' && <ChangeResourceModal item={action.item} onClose={() => setAction(null)} />}
      {action && action.type === 'relate' && <RelateCatalogModal initialSelected={[]} initialAssociated={[]} onClose={() => setAction(null)} onConfirm={(ids, items) => { setAction(null); }} />}
    </Layout>
  );
};

const Field = ({ label, required, children, full }: { label: string; required?: boolean; children: ReactNode; full?: boolean }) => <label className={'form-field' + (full ? ' full' : '')}><span>{required && <em>*</em>}{label}</span>{children}</label>;

type InfoItem = { english: string; name: string; type: string; length: string; desc: string };

type FormInitial = {
  name?: string;
  industry?: string;
  personal?: '' | '是' | '否';
  format?: string;
  source?: string;
  freqNum?: string;
  freqUnit?: string;
  coverStart?: string;
  coverEnd?: string;
  untilNow?: boolean;
  region?: string;
  extCode?: string;
  summary?: string;
  holder?: string;
  creditCode?: string;
  contact?: string;
  phone?: string;
  infoType?: string;
  infoItems?: InfoItem[];
  changeNote?: string;
};

// 由列表行回显已填写的数据：资源名称、行业分类（取首个）、资源持有方（提供机构）
const buildInitial = (item: Resource): FormInitial => ({ name: item.name, industry: item.industry, holder: item.provider });

// 新增 / 编辑 / 变更 三处弹窗共用同一套字段结构
const ResourceForm = ({ title, initial, onClose, mode }: { title: string; initial?: FormInitial; onClose: () => void; mode: 'add' | 'edit' | 'change' }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initial?.name ?? '');
  const [industry, setIndustry] = useState(initial?.industry?.split(',')[0] ?? '');
  // 列表中的 industry 为细分项，可能不在粗分类下拉里；回显时把当前值补为可选项，确保选中
  const industryOptions = industry && !industries.includes(industry) ? [industry, ...industries] : industries;
  const [personal, setPersonal] = useState<'' | '是' | '否'>(initial?.personal ?? '');
  const [format, setFormat] = useState(initial?.format ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [freqNum, setFreqNum] = useState(initial?.freqNum ?? '');
  const [freqUnit, setFreqUnit] = useState(initial?.freqUnit ?? '次/天');
  const [coverStart, setCoverStart] = useState(initial?.coverStart ?? '');
  const [coverEnd, setCoverEnd] = useState(initial?.coverEnd ?? '');
  const [untilNow, setUntilNow] = useState(initial?.untilNow ?? false);
  const [region, setRegion] = useState(initial?.region ?? '');
  const [extCode, setExtCode] = useState(initial?.extCode ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [holder] = useState(initial?.holder ?? '湖南省卫生健康委信息统计中心');
  const [creditCode] = useState(initial?.creditCode ?? '12430000MB0L046927');
  const [contact, setContact] = useState(initial?.contact ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [infoType, setInfoType] = useState(initial?.infoType ?? '结构化数据');
  const [rows, setRows] = useState<InfoItem[]>(initial?.infoItems ?? [{ english: 'hname', name: '医院名称', type: '字符型', length: '50', desc: '医院名称' }]);
  const [showRelate, setShowRelate] = useState(false);
  const [relatedItems, setRelatedItems] = useState<GovCatalog[]>([]);
  // 变更说明：仅变更弹窗使用，位于信息项表格下方
  const [changeNote, setChangeNote] = useState(initial?.changeNote ?? '');
  const addRow = () => setRows(prev => [...prev, { english: '', name: '', type: '字符型', length: '20', desc: '' }]);
  // 信息项排序：与相邻行交换位置，实时反映到当前弹窗的列表展示
  const moveRow = (index: number, dir: 'up' | 'down') => setRows(prev => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= prev.length) return prev;
    const next = [...prev];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="catalog-modal add-resource-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head"><h3>{title}</h3><button onClick={onClose}><X size={18} /></button></div>
        <div className="stepper">
          <div className={'step ' + (step === 1 ? 'active' : '')}>✎<span>基本信息</span></div>
          <div className="step-line" />
          <div className={'step ' + (step === 2 ? 'active' : '')}><SlidersHorizontal size={19} /><span>信息项</span></div>
        </div>
        <div className="modal-body add-body">
          {step === 1 ? (
            <>
              <div className="relate-link-row">
                <button type="button" className="relate-link" onClick={() => setShowRelate(true)}><Plus size={14} />关联政务信息资源目录</button>
                {relatedItems.length > 0 && (
                  <div className="relate-tags">
                    {relatedItems.map(item => (
                      <span key={item.id} className="relate-tag">{item.name}<button type="button" className="relate-tag-remove" aria-label={`移除「${item.name}」`} title="移除" onClick={() => setRelatedItems(prev => prev.filter(x => x.id !== item.id))}><X size={11} strokeWidth={3} /></button></span>
                    ))}
                  </div>
                )}
              </div>
              <h4>基本信息</h4>
              <div className="form-grid">
                <Field label="资源名称" required><input value={name} onChange={e => setName(e.target.value)} placeholder="请输入" /></Field>
                <Field label="行业分类" required><select value={industry} onChange={e => setIndustry(e.target.value)}><option value="">请选择</option>{industryOptions.map(i => <option key={i}>{i}</option>)}</select></Field>
                <Field label="是否涉及个人信息" required><div className="radio-group"><label><input type="radio" name="personal" checked={personal === '是'} onChange={() => setPersonal('是')} />是</label><label><input type="radio" name="personal" checked={personal === '否'} onChange={() => setPersonal('否')} />否</label></div></Field>
                <Field label="资源格式" required><select value={format} onChange={e => setFormat(e.target.value)}><option>请选择</option><option>电子文件存储格式</option><option>数据库</option></select></Field>
                <Field label="数据来源" required><select value={source} onChange={e => setSource(e.target.value)}><option>请选择</option><option>原始取得</option><option>收集取得</option><option>交易取得</option><option>其他</option></select></Field>
                <Field label="更新频率" required><div className="joined-input"><input value={freqNum} onChange={e => setFreqNum(e.target.value)} placeholder="请输入" /><select value={freqUnit} onChange={e => setFreqUnit(e.target.value)}><option>次/天</option><option>次/周</option><option>次/月</option><option>次/年</option></select></div></Field>
                <Field label="覆盖时间范围" required><div className="date-range"><input type="date" value={coverStart} onChange={e => setCoverStart(e.target.value)} /><span>~</span><input type="date" value={coverEnd} disabled={untilNow} onChange={e => setCoverEnd(e.target.value)} /><label><input type="checkbox" checked={untilNow} onChange={e => setUntilNow(e.target.checked)} />至今</label></div></Field>
                <Field label="地域分类" required><select value={region} onChange={e => setRegion(e.target.value)}><option>请选择</option><option>湖南省</option><option>长沙市</option><option>株洲市</option></select></Field>
                {/* 变更弹窗不展示扩展码；新增／编辑弹窗仍保留该字段的输入与提交 */}
                {mode !== 'change' && <Field label="扩展码"><input value={extCode} onChange={e => setExtCode(e.target.value)} placeholder="请输入" /></Field>}
                <Field label="资源摘要" required full><textarea rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="请输入" /></Field>
              </div>
              <h4>资源持有方信息</h4>
              <div className="form-grid">
                <Field label="资源持有方" required><input value={holder} disabled readOnly /></Field>
                <Field label="统一社会信用代码" required><input value={creditCode} disabled readOnly /></Field>
                <Field label="联系人" required><input value={contact} onChange={e => setContact(e.target.value)} placeholder="请输入" /></Field>
                <Field label="联系方式" required><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入" /></Field>
              </div>
            </>
          ) : (
            <>
              <Field label="信息项数据类型" required><select value={infoType} onChange={e => setInfoType(e.target.value)}><option>结构化数据</option><option>文本类信息</option></select></Field>
              <div className="info-toolbar"><b>信息项</b><button className="btn success"><Download size={15} />下载模板</button><button className="btn primary"><Upload size={15} />导入文件</button><button className="btn primary" onClick={addRow}><Plus size={15} />新增</button><span className="info-tip">信息项英文名须与挂载的数据源字段名完全一致（区分大小写）</span></div>
              <div className="info-table-wrap">
                <table className="info-table">
                  <thead><tr><th>序号</th><th><em className="req-star">*</em> 信息项英文名 <Info size={13} /></th><th><em className="req-star">*</em> 信息项名称 <Info size={13} /></th><th><em className="req-star">*</em> 数据类型</th><th><em className="req-star">*</em> 数据长度</th><th>信息项说明</th><th>操作</th></tr></thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td><input value={r.english} onChange={e => setRows(p => p.map((x, j) => j === i ? { ...x, english: e.target.value } : x))} /></td>
                        <td><input value={r.name} onChange={e => setRows(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></td>
                        <td><select value={r.type} onChange={e => setRows(p => p.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}><option>字符型</option><option>数值型</option><option>日期型</option></select></td>
                        <td><input value={r.length} disabled={r.type === '日期型'} onChange={e => setRows(p => p.map((x, j) => j === i ? { ...x, length: e.target.value } : x))} /></td>
                        <td><input value={r.desc} onChange={e => setRows(p => p.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} /></td>
                        <td>
                          <div className="info-row-actions">
                            <button type="button" className="move-row" disabled={i === 0} onClick={() => moveRow(i, 'up')}>上移</button>
                            <button type="button" className="move-row" disabled={i === rows.length - 1} onClick={() => moveRow(i, 'down')}>下移</button>
                            <button type="button" className="delete-row" disabled={rows.length === 1} onClick={() => setRows(p => p.filter((_, j) => j !== i))}>×</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mode === 'change' && (
                <Field label="变更说明" required full><textarea rows={3} value={changeNote} onChange={e => setChangeNote(e.target.value)} placeholder="请输入" /></Field>
              )}
            </>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>取消</button>
          {step === 2 && <button className="btn" onClick={() => setStep(1)}>上一步</button>}
          {step === 1 ? <button className="btn primary" onClick={() => setStep(2)}>下一步</button> : <>{mode !== 'change' && <button className="btn primary" onClick={onClose}>存为草稿</button>}<button className="btn primary" onClick={onClose}>提交</button></>}
        </div>
        {showRelate && <RelateCatalogModal initialSelected={relatedItems.map(i => i.id)} initialAssociated={relatedItems} onClose={() => setShowRelate(false)} onConfirm={(ids, items) => { setRelatedItems(items); setShowRelate(false); }} />}
      </div>
    </div>
  );
};

const AddResourceModal = ({ onClose }: { onClose: () => void }) => <ResourceForm title="新增" mode="add" onClose={onClose} />;
const EditResourceModal = ({ item, onClose }: { item: Resource; onClose: () => void }) => <ResourceForm title="编辑" mode="edit" initial={buildInitial(item)} onClose={onClose} />;
const ChangeResourceModal = ({ item, onClose }: { item: Resource; onClose: () => void }) => <ResourceForm title="变更" mode="change" initial={buildInitial(item)} onClose={onClose} />;

// 审核信息页签：登记 → 审核 → 变更 → 撤销 全流程演示数据（纯展示，无行内操作）
const auditFlowRows = [
  { node: '首次登记', nodeStatus: '已完成', org: '湖南省数据产业集团', operator: '张三', time: '2026-07-07 15:30:25', result: '', opinion: '' },
  { node: '审核', nodeStatus: '已完成', org: '区域节点', operator: '管理员', time: '2026-07-07 15:42:10', result: '审核通过', opinion: '' },
  { node: '变更登记', nodeStatus: '已完成', org: '湖南省数据产业集团', operator: '张三', time: '2026-07-07 15:45:33', result: '', opinion: '' },
  { node: '审核', nodeStatus: '已完成', org: '区域节点', operator: '管理员', time: '2026-07-07 15:48:02', result: '审核通过', opinion: '1' },
  { node: '撤销登记', nodeStatus: '已完成', org: '湖南省数据产业集团', operator: '张三', time: '2026-07-07 15:51:47', result: '', opinion: '' },
  { node: '审核', nodeStatus: '已完成', org: '区域节点', operator: '管理员', time: '2026-07-07 15:53:19', result: '审核通过', opinion: '1' },
];

const DetailModal = ({ item, onClose }: { item: Resource; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'items' | 'audit'>('basic');
  const [showProof, setShowProof] = useState(false);
  const infoItems: InfoItem[] = [
    { english: 'menzhen', name: '门诊号', type: '字符型', length: '100', desc: '' },
    { english: 'shengao', name: '身高', type: '数值型', length: '100', desc: '' },
  ];
  const blank = (value?: string) => value?.trim() || '-';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="catalog-modal resource-detail-modal" onClick={event => event.stopPropagation()}>
        <div className="modal-head"><h3>数据资源详情</h3><button type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
        <div className="detail-tabs" role="tablist" aria-label="数据资源详情页签">
          <button type="button" role="tab" aria-selected={activeTab === 'basic'} className={activeTab === 'basic' ? 'active' : ''} onClick={() => setActiveTab('basic')}>基本信息</button>
          <button type="button" role="tab" aria-selected={activeTab === 'items'} className={activeTab === 'items' ? 'active' : ''} onClick={() => setActiveTab('items')}>信息项</button>
          <button type="button" role="tab" aria-selected={activeTab === 'audit'} className={activeTab === 'audit' ? 'active' : ''} onClick={() => setActiveTab('audit')}>审核信息</button>
          <div className="detail-tabs-actions">
            <button type="button" className="btn primary" onClick={() => setShowProof(true)}>查看存证</button>
          </div>
        </div>
        <div className="modal-body resource-detail-body">
          {activeTab === 'basic' ? (
            <>
              <section className="detail-section" aria-labelledby="basic-info-title">
                <h4 id="basic-info-title">基本信息</h4>
                <table className="detail-readonly-table"><tbody>
                  <tr><th>资源名称</th><td>{blank(item.name)}</td><th>数据资源标识码</th><td>712430000MB0L04692743002W3CAD81M</td></tr>
                  <tr><th>行业分类</th><td>{blank(item.industry)}</td><th>是否涉及个人信息</th><td>否</td></tr>
                  <tr><th>资源格式</th><td>xls</td><th>数据来源</th><td>原始取得</td></tr>
                  <tr><th>更新频率</th><td>每日</td><th>覆盖时间范围</th><td>2026-5-24 — 至今</td></tr>
                  <tr><th>地域分类</th><td>湖南省</td><th>审核状态</th><td>{blank(item.reviewStatus)}</td></tr>
                  <tr><th>领域名称</th><td>医疗健康</td><th>所属地域</th><td>省本级</td></tr>
                  <tr><th>数据源挂载状态</th><td colSpan={3}>{blank(item.mountStatus)}</td></tr>
                  <tr><th>资源摘要</th><td colSpan={3}>基础数据资源，用于支撑公共卫生服务、医疗机构管理及相关业务分析。</td></tr>
                </tbody></table>
              </section>
              <section className="detail-section" aria-labelledby="holder-info-title">
                <h4 id="holder-info-title">资源持有方信息</h4>
                <table className="detail-readonly-table"><tbody>
                  <tr><th>资源持有方</th><td>{blank(item.provider)}</td><th>统一社会信用代码</th><td>12430000MB0L046927</td></tr>
                  <tr><th>联系人</th><td>李明</td><th>联系方式</th><td>13654785566</td></tr>
                </tbody></table>
              </section>
            </>
          ) : activeTab === 'items' ? (
            <section className="detail-section" aria-labelledby="info-item-title">
              <h4 id="info-item-title">信息项</h4>
              <table className="detail-readonly-table detail-info-type"><tbody><tr><th>信息项数据类型</th><td>结构化数据</td></tr></tbody></table>
              <div className="detail-info-table-wrap">
                <table className="detail-info-table">
                  <thead><tr><th>信息项英文名</th><th>信息项名称</th><th>数据类型</th><th>数据长度</th><th>信息项说明</th></tr></thead>
                  <tbody>{infoItems.length ? infoItems.map(row => <tr key={row.english}><td>{blank(row.english)}</td><td>{blank(row.name)}</td><td>{blank(row.type)}</td><td>{blank(row.length)}</td><td>{blank(row.desc)}</td></tr>) : <tr><td colSpan={5} className="detail-empty">暂无信息项数据</td></tr>}</tbody>
                </table>
              </div>
              <div className="detail-pagination" aria-label="信息项分页预留区"><span>共 {infoItems.length} 条记录</span><span>第 1 / 1 页</span></div>
            </section>
          ) : (
            <section className="detail-section" aria-labelledby="audit-info-title">
              <h4 id="audit-info-title">审核流程</h4>
              <div className="detail-audit-table-wrap">
                <table className="detail-info-table detail-audit-table">
                  <thead><tr><th>序号</th><th>流程节点</th><th>节点状态</th><th>单位名称</th><th>法人经办人姓名</th><th>操作时间</th><th>审核结果</th><th>审核意见</th></tr></thead>
                  <tbody>{auditFlowRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{row.node}</td>
                      <td><span className="status info">{row.nodeStatus}</span></td>
                      <td>{row.org}</td>
                      <td>{row.operator}</td>
                      <td>{row.time}</td>
                      <td>{row.result ? <span className="status success">{row.result}</span> : '—'}</td>
                      <td>{row.opinion || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          )}
        </div>
        <div className="modal-foot"><button type="button" className="btn" onClick={onClose}>关闭</button></div>
        {showProof && <ProofModal item={item} onClose={() => setShowProof(false)} />}
      </div>
    </div>
  );
};

const ProofModal = ({ item, onClose }: { item: Resource; onClose: () => void }) => (
  <div className="modal-overlay nested-overlay" onClick={onClose}>
    <div className="catalog-modal proof-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-head"><h3>区块链存证</h3><button onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
      <div className="modal-body">
        <div className="proof-box">
          <div><b>存证编号</b><span>BC-20260824-000128</span></div>
          <div><b>上链时间</b><span>{item.updatedAt}</span></div>
          <div><b>区块高度</b><span>18,426,901</span></div>
          <div><b>交易哈希</b><span className="hash">0x9f0d...e82a</span></div>
        </div>
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button></div>
    </div>
  </div>
);

// 「变更详情」左右双栏全量字段对比弹窗
//   - 左侧「变更前信息」/ 右侧「变更后信息」严格并排展示
//   - 左右两侧通过双 ref + scrollTop 同步滚动，行高一致
//   - modified 字段：两侧均红字
//   - added   字段：仅变更后侧显示 + 「新增」红标
//   - deleted 字段：仅变更前侧显示 + 「删除」红标
//   - 第一条变更详情的 deleted 信息项：右侧并排展示被删除的原始内容（红字 + 删除线）
const ChangeDetailModal = ({ detail, isFirstRecord, onClose }: { detail: ChangeRecord; isFirstRecord?: boolean; onClose: () => void }) => {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  // 用 ref 自旋锁防止两侧 scroll 事件互相触发死循环
  const syncing = useRef(false);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    const makeHandler = (src: HTMLDivElement, dst: HTMLDivElement) => () => {
      if (syncing.current) {
        syncing.current = false;
        return;
      }
      syncing.current = true;
      dst.scrollTop = src.scrollTop;
    };
    const onLeft = makeHandler(left, right);
    const onRight = makeHandler(right, left);
    left.addEventListener('scroll', onLeft, { passive: true });
    right.addEventListener('scroll', onRight, { passive: true });
    return () => {
      left.removeEventListener('scroll', onLeft);
      right.removeEventListener('scroll', onRight);
    };
  }, []);

  // 同步左右两栏「对应行」的高度：长文本换行数不一致时取较高的一侧，
  // 保证两栏同一行的 y 坐标相同，逐行比对不会错位。
  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    const syncRowHeights = () => {
      left.querySelectorAll<HTMLElement>('[data-diff-section]').forEach(sectionEl => {
        const secIdx = sectionEl.getAttribute('data-diff-section');
        sectionEl.querySelectorAll<HTMLElement>('[data-diff-row]').forEach(rowEl => {
          const rowIdx = rowEl.getAttribute('data-diff-row');
          const rightRow = right.querySelector<HTMLElement>(
            `[data-diff-section="${secIdx}"] [data-diff-row="${rowIdx}"]`,
          );
          if (!rightRow) return;
          // 先解除上一轮锁定的高度再测量，避免多轮同步产生累计误差
          rowEl.style.height = '';
          rightRow.style.height = '';
          const maxH = Math.max(rowEl.offsetHeight, rightRow.offsetHeight);
          if (maxH > 0) {
            rowEl.style.height = `${maxH}px`;
            rightRow.style.height = `${maxH}px`;
          }
        });
      });
    };

    syncRowHeights();
    // 字体加载 / 换行重排可能影响高度，首帧后再兜底同步一次
    const raf = requestAnimationFrame(syncRowHeights);
    const timer = setTimeout(syncRowHeights, 150);
    window.addEventListener('resize', syncRowHeights);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', syncRowHeights);
    };
  }, []);

  const snapshot = detail.snapshot;
  const statusClass = snapshot
    ? (snapshot.status === '变更通过' ? 'success' : snapshot.status === '变更不通过' ? 'danger' : 'info')
    : '';

  return (
    <div className="modal-overlay nested-overlay" onClick={onClose}>
      <div className="catalog-modal change-detail-full-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>查看详情</h3>
          <button onClick={onClose} aria-label="关闭"><X size={18} /></button>
        </div>
        <div className="modal-body change-detail-full-body">
          {snapshot ? (
            <>
              <div className="change-detail-compare">
                <ChangeDetailSide title="变更前信息" sections={snapshot.sections} side="before" scrollRef={leftRef} />
                <ChangeDetailSide title="变更后信息" sections={snapshot.sections} side="after" scrollRef={rightRef} isFirstRecord={isFirstRecord} />
              </div>
             
            </>
          ) : (
            <FallbackChangeDetail detail={detail} />
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
};

const ChangeDetailSide = ({ title, sections, side, scrollRef, isFirstRecord }: {
  title: string;
  sections: ChangeSection[];
  side: 'before' | 'after';
  scrollRef: RefObject<HTMLDivElement | null>;
  isFirstRecord?: boolean;
}) => (
  <div className="change-detail-side">
    <h5 className="change-detail-side-title">{title}</h5>
    <div className="change-detail-scroll" ref={scrollRef}>
      {sections.map((section, idx) => (
        <section key={idx} className="change-detail-section" data-diff-section={idx}>
          <h6 className="change-detail-section-title">{section.title}</h6>
          {section.kind === 'kv' ? (
            <ChangeDetailKvGrid rows={section.rows} side={side} />
          ) : (
            <ChangeDetailInfoTable rows={section.rows} side={side} isFirstRecord={isFirstRecord} />
          )}
        </section>
      ))}
    </div>
  </div>
);

// KV 区段：每行 2 个字段（label + value）成对展示；
// 「资源摘要」等长文本字段独占整行；奇数末尾补空位以保证左右两栏行数一致
const FULL_WIDTH_KV_LABELS = new Set(['资源摘要']);

const ChangeDetailKvGrid = ({ rows, side }: { rows: ChangeKvDiff[]; side: 'before' | 'after' }) => {
  const elements: ReactNode[] = [];
  let rowIdx = 0;
  for (let i = 0; i < rows.length; i++) {
    const field = rows[i];
    if (FULL_WIDTH_KV_LABELS.has(field.label)) {
      elements.push(
        <div key={rowIdx} className="change-detail-kv-row is-full-width" data-diff-row={rowIdx}>
          <ChangeDetailKvCell field={field} side={side} />
        </div>
      );
      rowIdx++;
      continue;
    }
    const next = rows[i + 1];
    const nextIsFull = next ? FULL_WIDTH_KV_LABELS.has(next.label) : false;
    const pair: (ChangeKvDiff | null)[] = [field, nextIsFull ? null : (next || null)];
    if (!nextIsFull && next) i++;
    elements.push(
      <div key={rowIdx} className="change-detail-kv-row" data-diff-row={rowIdx}>
        {pair.map((f, fIdx) => f ? (
          <ChangeDetailKvCell key={fIdx} field={f} side={side} />
        ) : (
          <div key={fIdx} className="change-detail-kv-cell empty">
            <div className="change-detail-kv-label" />
            <div className="change-detail-kv-value" />
          </div>
        ))}
      </div>
    );
    rowIdx++;
  }
  return <div className="change-detail-kv-grid">{elements}</div>;
};

const ChangeDetailKvCell = ({ field, side }: { field: ChangeKvDiff; side: 'before' | 'after' }) => {
  const value = side === 'before' ? field.before : field.after;
  // added 字段在变更前为空、deleted 字段在变更后为空 —— 空侧仅显示占位
  const isEmptySide = (field.status === 'added' && side === 'before') || (field.status === 'deleted' && side === 'after');
  // 变更前：文字与背景均不标红（纯展示）
  // 变更后：modified / added → 文字标红、背景不标红；deleted → 背景标红、文字不标红（该侧为空）
  let valueCls = 'change-detail-kv-value';
  if (side === 'after') {
    if (field.status === 'modified' || field.status === 'added') valueCls += ' is-red-text';
    else if (field.status === 'deleted') valueCls += ' is-red-bg';
  }
  if (isEmptySide) valueCls += ' is-empty';
  return (
    <div className="change-detail-kv-cell">
      <div className="change-detail-kv-label">{field.label}</div>
      <div className={valueCls}>
        {isEmptySide ? <span className="empty-placeholder">—</span> : (<span className="diff-text">{value}</span>)}
      </div>
    </div>
  );
};

// 信息项表格区段：以英文名对齐左右两栏同位置的行；modified 行做单元格级 diff
const ChangeDetailInfoTable = ({ rows, side, isFirstRecord }: { rows: ChangeInfoItemRow[]; side: 'before' | 'after'; isFirstRecord?: boolean }) => {
  return (
    <div className="change-detail-info-table-wrap">
      <table className="change-detail-info-table">
        <thead>
          <tr>
            <th>信息项英文名</th>
            <th>信息项名称</th>
            <th>数据类型</th>
            <th>数据长度</th>
            <th>信息项说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            // 仅「第一条变更详情」的删除信息项：右侧不留空，改为展示被删除的原始内容（红字 + 删除线），
            // 与左侧删除前内容并排对齐，形成删除前后差异对比；其余变更详情仍保持原空占位逻辑
            const showDeletedStrike = !!isFirstRecord && side === 'after' && row.rowStatus === 'deleted';
            const vals = showDeletedStrike ? row.before : (side === 'before' ? row.before : row.after);
            const isEmptySide = !showDeletedStrike && ((row.rowStatus === 'added' && side === 'before') || (row.rowStatus === 'deleted' && side === 'after'));
            // 变更前：不标红；变更后：modified / added 文字标红，deleted 信息项删除不标红
            let rowCls = 'change-detail-info-row';
            if (showDeletedStrike) rowCls += ' is-deleted-strike';
            else if (side === 'after') {
              if (row.rowStatus === 'modified') rowCls += ' is-modified';
              else if (row.rowStatus === 'added') rowCls += ' is-added';
            }
            if (isEmptySide) rowCls += ' is-empty-side';
            const cellMod = (col: keyof ChangeInfoItemValues) => {
              if (side !== 'after') return '';
              if (row.rowStatus === 'modified' && row.before[col] !== row.after[col]) return 'cell-modified';
              if (row.rowStatus === 'added') return 'cell-added';
              return '';
            };
            return (
              <tr key={row.english} className={rowCls} data-diff-row={rowIdx}>
                <td className="info-col-english">
                  <span className="diff-text">{row.english}</span>
                </td>
                {isEmptySide ? (
                  <td colSpan={4}><span className="empty-placeholder">—</span></td>
                ) : (
                  <>
                    <td className={cellMod('name')}>{vals.name}</td>
                    <td className={cellMod('type')}>{vals.type}</td>
                    <td className={cellMod('length')}>{vals.length}</td>
                    <td className={cellMod('desc')}>{vals.desc}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// 无快照时的兜底视图（保留旧版 3 列简单对比）
const FallbackChangeDetail = ({ detail }: { detail: ChangeRecord }) => (
  <>
    <div className="detail-change-meta">
      <span>变更状态：{detail.status}</span>
      <span>更新时间：{detail.time}</span>
    </div>
    <table className="change-detail-table">
      <thead><tr><th>变更项</th><th>变更前</th><th>变更后</th></tr></thead>
      <tbody><tr><td>{detail.field}</td><td className="old-val">{detail.oldValue}</td><td className="new-val">{detail.newValue}</td></tr></tbody>
    </table>
    <p className="change-opinion">审核意见：{detail.opinion || '-'}</p>
  </>
);

const ChangeRecordModal = ({ item, onClose }: { item: Resource; onClose: () => void }) => {
  const [status, setStatus] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [detail, setDetail] = useState<ChangeRecord | null>(null);
  // 标记当前打开的详情是否为变更记录列表的第一条：仅第一条的删除信息项启用「红字 + 删除线」并排对比
  const [detailIsFirst, setDetailIsFirst] = useState(false);
  const records = (item.changeRecords || []).filter(r => (!status || r.status === status) && (!start || r.time.slice(0, 10) >= start) && (!end || r.time.slice(0, 10) <= end));
  const reset = () => { setStatus(''); setStart(''); setEnd(''); };
  return <>
    <div className="modal-head"><h3>变更记录</h3><button onClick={onClose}><X size={18} /></button></div>
    <div className="modal-body change-record-body"><div className="change-record-filters"><label>变更状态<select value={status} onChange={e => setStatus(e.target.value)}><option value="">请选择</option><option>变更中</option><option>变更通过</option><option>变更不通过</option></select></label><label>更新时间<div className="date-range"><input type="date" value={start} onChange={e => setStart(e.target.value)} /><span>-</span><input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div></label><div className="change-filter-actions"><button className="btn primary" onClick={() => undefined}>查询</button><button className="btn" onClick={reset}>重置</button></div></div><div className="table-wrap change-record-wrap"><table className="catalog-table change-record-table"><thead><tr><th>序号</th><th>变更状态</th><th>更新时间</th><th>变更审核意见</th><th>操作</th></tr></thead><tbody>{records.map((r, i) => <tr key={i}><td>{i + 1}</td><td><span className={'status ' + (r.status === '变更通过' ? 'success' : r.status === '变更不通过' ? 'danger' : 'info')}>{r.status}</span></td><td>{r.time}</td><td>{r.opinion || '-'}</td><td><button className="link-button" onClick={() => { setDetail(r); setDetailIsFirst(i === 0); }}>查看</button></td></tr>)}{!records.length && <tr><td colSpan={5} className="empty-row">暂无变更记录</td></tr>}</tbody></table></div><div className="pagination change-record-pagination"><span>共{records.length}条记录</span><span>‹　<b>1</b>　›　<select><option>10条/页</option></select>　跳至 <input value="1" readOnly /> 页</span></div></div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button></div>
    {detail && <ChangeDetailModal detail={detail} isFirstRecord={detailIsFirst} onClose={() => setDetail(null)} />}
  </>;
};

// 撤销弹窗：资源名称禁用回显，撤销说明必填且不超过 512 字符
const RevokeModal = ({ item, onClose }: { item: Resource; onClose: () => void }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('请输入撤销说明');
      return;
    }
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="catalog-modal revoke-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head"><h3>撤销资源</h3><button onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
        <div className="modal-body revoke-body">
          <Field label="资源名称"><input value={item.name} disabled readOnly /></Field>
          <Field label="撤销说明" required full>
            <div className="revoke-reason-box">
              <textarea rows={4} maxLength={512} value={reason} onChange={e => { setReason(e.target.value); if (error) setError(''); }} placeholder="请输入撤销说明" />
              <div className="revoke-reason-meta">
                {error ? <span className="revoke-error">{error}</span> : <span />}
                <span className="revoke-counter">{reason.length}/512</span>
              </div>
            </div>
          </Field>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={handleSubmit}>确认</button>
        </div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ title, message, danger, confirmText, onClose, onConfirm }: { title: string; message: string; danger?: boolean; confirmText?: string; onClose: () => void; onConfirm: () => void }) => (
  <>
    <div className="modal-head"><h3>{title}</h3><button onClick={onClose}><X size={18} /></button></div>
    <div className="modal-body"><p className="confirm-message">{message}</p></div>
    <div className="modal-foot">
      <button className="btn" onClick={onClose}>取消</button>
      <button className={'btn' + (danger ? ' danger' : ' primary')} onClick={onConfirm}>{confirmText || '确认'}</button>
    </div>
  </>
);

const Component = () => <PasswordGuard><OriginalComponent /></PasswordGuard>;

type GovCatalog = {
  id: number;
  name: string;
  domain: string;
  summary: string;
};

const seedGovCatalogs: GovCatalog[] = [
  { id: 1, name: '气温变化', domain: '建筑领域', summary: '近十年城市气温变化趋势监测数据，包含月平均气温、极端高温与低温记录。' },
  { id: 2, name: '就诊记录', domain: '制造领域', summary: 'xxxx' },
  { id: 3, name: '就诊记录', domain: '采矿领域', summary: 'xxxx' },
  { id: 6, name: '空气质量监测', domain: '环保领域', summary: 'xxxx' },
  { id: 7, name: '医保结算数据', domain: '卫生领域', summary: 'xxxx' },
  { id: 8, name: '教育资源分布', domain: '教育领域', summary: 'xxxx' },
  { id: 9, name: '城市交通流量', domain: '交通领域', summary: 'xxxx' },
  { id: 10, name: '财政收支月报', domain: '财政领域', summary: 'xxxx' },
];

const RelateCatalogModal = ({
  initialSelected,
  initialAssociated,
  onClose,
  onConfirm,
}: {
  initialSelected: number[];
  initialAssociated: GovCatalog[];
  onClose: () => void;
  onConfirm: (ids: number[], items: GovCatalog[]) => void;
}) => {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<number[]>(initialSelected);
  const [viewItem, setViewItem] = useState<GovCatalog | null>(null);
  const [confirmError, setConfirmError] = useState('');

  const filtered = useMemo(() => seedGovCatalogs.filter(c => !keyword || c.name.includes(keyword)), [keyword]);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // 单选：勾选新条目时直接替换当前选中
  const toggle = (id: number) => {
    setSelected(prev => (prev.includes(id) ? [] : [id]));
    if (confirmError) setConfirmError('');
  };
  const reset = () => { setKeyword(''); setPage(1); if (confirmError) setConfirmError(''); };
  const jumpTo = (n: number) => setPage(Math.max(1, Math.min(totalPages, n)));

  const handleConfirm = () => {
    if (selected.length === 0) {
      setConfirmError('请选择需要关联的资源目录');
      return;
    }
    const items = seedGovCatalogs.filter(c => selected.includes(c.id));
    onConfirm(selected, items);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="catalog-modal relate-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head relate-modal-head">
          <h3>资源目录关联</h3>
          <div className="head-aside">
            <button className="head-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
          </div>
        </div>
        <div className="modal-body relate-body">
          {(initialAssociated.length > 0 || selected.length > 0) && (() => {
            const selectedItem = selected.length > 0 ? seedGovCatalogs.find(c => c.id === selected[0]) ?? null : null;
            const showSelectedSeparately = !!selectedItem && !initialAssociated.some(i => i.id === selectedItem.id);
            return (
              <div className="relate-associated-panel">
                <span className="head-associated-label">已关联政务信息资源目录：</span>
                <div className="head-associated-list">
                  {initialAssociated.map(item => {
                    const isCurrent = selected.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={'head-associated-chip' + (isCurrent ? ' current' : '')}
                        onClick={() => setViewItem(item)}
                        title={isCurrent ? `${item.name}（当前选中）` : `查看「${item.name}」详情`}
                      >
                        {isCurrent && <Check size={12} strokeWidth={3} />}
                        <span className="chip-text">{item.name}</span>
                      </button>
                    );
                  })}
                  {showSelectedSeparately && selectedItem && (
                    <button
                      type="button"
                      className="head-associated-chip current new-selection"
                      onClick={() => setViewItem(selectedItem)}
                      title={`当前选中：${selectedItem.name}`}
                    >
                      <Check size={12} strokeWidth={3} />
                      <span className="chip-text">{selectedItem.name}</span>
                      <span className="chip-tag">当前选中</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
          <div className="relate-filter-panel">
            <label>资源名称<input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="请输入" /></label>
            <div className="relate-filter-actions">
              <button className="btn" onClick={reset}>重置</button>
              <button className="btn primary" onClick={() => setPage(1)}>查询</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="catalog-table relate-table">
              <thead>
                <tr>
                  <th className="col-check"></th>
                  <th style={{ width: 54 }}>序号</th>
                  <th>资源名称</th>
                  <th style={{ width: 120 }}>数据所属领域</th>
                  <th>资源摘要</th>
                  <th style={{ width: 72 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr><td colSpan={6} className="empty-row">暂无数据</td></tr>
                ) : pageItems.map((item, idx) => {
                  const isSelected = selected.includes(item.id);
                  return (
                    <tr key={item.id} className={isSelected ? 'selected-row' : ''}>
                      <td><input type="checkbox" checked={isSelected} onChange={() => toggle(item.id)} /></td>
                      <td>{(page - 1) * pageSize + idx + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.domain}</td>
                      <td>{item.summary}</td>
                      <td className="actions"><button onClick={() => setViewItem(item)}>查看</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pagination">
              <span>共 {filtered.length} 条记录</span>
              <div>
                <button disabled={page === 1} onClick={() => jumpTo(page - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(n => (
                  <button key={n} className={n === page ? 'active' : ''} onClick={() => jumpTo(n)}>{n}</button>
                ))}
                {totalPages > 5 && <span>…</span>}
                <button disabled={page === totalPages} onClick={() => jumpTo(page + 1)}>›</button>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  <option>10条/页</option>
                  <option>20条/页</option>
                  <option>50条/页</option>
                </select>
                <span>跳至</span>
                <input value={page} onChange={e => jumpTo(Number(e.target.value) || 1)} />页
              </div>
            </div>
          </div>
          {confirmError && <div className="confirm-error" role="alert">{confirmError}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn primary" onClick={handleConfirm}>确定</button>
        </div>
        {viewItem && (
          <div className="modal-overlay relate-detail-overlay" onClick={() => setViewItem(null)}>
            <div className="catalog-modal relate-detail-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head"><h3>目录详情</h3><button onClick={() => setViewItem(null)}><X size={18} /></button></div>
              <div className="modal-body">
                <div className="detail-grid">
                  <b>资源名称</b><span>{viewItem.name}</span>
                  <b>数据所属领域</b><span>{viewItem.domain}</span>
                  <b>资源摘要</b><span>{viewItem.summary}</span>
                </div>
              </div>
              <div className="modal-foot"><button className="btn" onClick={() => setViewItem(null)}>关闭</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Component;

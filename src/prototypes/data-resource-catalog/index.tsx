/**
 * @name 数据资源目录
 * @mode axure
 *
 * 实施机构角色的数据资源目录管理页，提供行业树筛选、组合查询、
 * 目录列表、详情与存证查看。
 */

import { ReactNode, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Download, Info, Plus, RefreshCw, Search, SlidersHorizontal, Upload, X } from 'lucide-react';
import Layout from '../../common/Layout';
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
  '待提交',
  '提交待审核',
  '变更待审核',
  '撤销待审核',
  '提交未通过',
  '变更未通过',
  '撤销未通过',
  '已通过',
  '已撤销',
] as const;

type ReviewStatus = typeof reviewStatuses[number];

const industries = ['农、林、牧、渔业', '采矿业', '制造业', '电力、热力、燃气及水生产和供应业', '建筑业', '批发和零售业', '交通运输、仓储和邮政业', '住宿和餐饮业', '信息传输、软件和信息技术服务业', '金融业', '房地产业', '科学研究和技术服务业', '租赁和商务服务业', '水利、环境和公共设施管理业', '居民服务、修理和其他服务业', '教育', '卫生和社会工作', '文化、体育和娱乐业', '公共管理、社会保障和社会组织', '国际组织'];

const seedResources: Resource[] = [
  { id: 1, name: '待提交-农业生产数据', industry: '稻谷种植,小麦种植,玉米种植', reviewStatus: '待提交', mountStatus: '待挂载', createdAt: '2026-08-24 18:36:42', updatedAt: '2026-08-24 18:38:02', provider: '湖南省农业农村厅' },
  { id: 2, name: '提交待审核-耕地资源数据', industry: '稻谷种植', reviewStatus: '提交待审核', mountStatus: '待挂载', createdAt: '2026-06-25 10:55:59', updatedAt: '2026-08-24 10:17:13', provider: '长沙市农业农村局' },
  { id: 3, name: '变更待审核-农作物分类数据', industry: '稻谷种植,小麦种植', reviewStatus: '变更待审核', mountStatus: '待挂载', createdAt: '2026-06-26 16:12:07', updatedAt: '2026-08-24 10:17:11', provider: '株洲市农业农村局' },
  { id: 4, name: '撤销待审核-农业监测数据', industry: '稻谷种植', reviewStatus: '撤销待审核', mountStatus: '待挂载', createdAt: '2026-06-08 14:53:03', updatedAt: '2026-08-24 10:17:03', provider: '湘潭市农业农村局' },
  { id: 5, name: '提交未通过-能源资源数据', industry: '烟煤和无烟煤开采洗选', reviewStatus: '提交未通过', mountStatus: '待挂载', createdAt: '2026-08-21 15:06:54', updatedAt: '2026-08-21 15:08:00', provider: '湖南省能源局' },
  { id: 6, name: '变更未通过-豆类种植数据', industry: '豆类种植', reviewStatus: '变更未通过', mountStatus: '待挂载', createdAt: '2026-08-21 14:29:15', updatedAt: '2026-08-21 14:30:00', provider: '益阳市农业农村局' },
  { id: 7, name: '撤销未通过-农产品流通数据', industry: '稻谷种植,小麦种植', reviewStatus: '撤销未通过', mountStatus: '待挂载', createdAt: '2026-08-17 14:20:04', updatedAt: '2026-08-18 16:52:01', provider: '岳阳市农业农村局' },
  { id: 8, name: '已通过-医疗就诊数据资源', industry: '综合医院,中医医院,中西医结合医院', reviewStatus: '已通过', mountStatus: '已挂载', createdAt: '2026-08-11 15:23:32', updatedAt: '2026-08-11 15:28:15', provider: '湖南省卫生健康委' },
  { id: 9, name: '已撤销-林木育苗数据', industry: '林木育苗', reviewStatus: '已撤销', mountStatus: '已挂载', createdAt: '2026-08-10 10:39:50', updatedAt: '2026-08-10 17:28:01', provider: '湖南省林业局' },
  { id: 10, name: '地域分类为全国的数据资源', industry: '稻谷种植', reviewStatus: '已通过', mountStatus: '已挂载', createdAt: '2026-07-28 09:21:45', updatedAt: '2026-08-06 11:27:24', provider: '湖南省农业农村厅', changed: true, changeRecords: [
    { status: '变更通过', time: '2026-08-06 11:27:24', field: '地域分类', oldValue: '湖南省', newValue: '全国', operator: '湖南省农业农村厅', opinion: '变更内容符合要求' },
    { status: '变更通过', time: '2026-08-06 11:25:10', field: '行业分类', oldValue: '稻谷种植,小麦种植', newValue: '稻谷种植', operator: '湖南省农业农村厅', opinion: '分类调整通过' },
    { status: '变更不通过', time: '2026-08-06 11:20:33', field: '资源摘要', oldValue: '湖南省域内稻谷种植相关数据。', newValue: '全国稻谷种植相关数据，覆盖各省份。', operator: '湖南省农业农村厅', opinion: '请补充覆盖范围说明' },
    { status: '变更中', time: '2026-08-06 11:18:06', field: '更新频率', oldValue: '每月', newValue: '每日', operator: '湖南省农业农村厅', opinion: '' },
  ] },
];

const statusClass = (status: Resource['reviewStatus'] | Resource['mountStatus']) => {
  if (status === '已通过' || status === '已挂载') return 'status success';
  if (status === '提交待审核' || status === '变更待审核' || status === '撤销待审核' || status === '待挂载') return 'status info';
  if (status === '提交未通过' || status === '变更未通过' || status === '撤销未通过') return 'status danger';
  return 'status warning';
};

type ActionType = 'view' | 'proof' | 'relate' | 'edit' | 'delete' | 'change' | 'revoke' | 'changeRecord';

type ActionDef = { key: ActionType; label: string; danger?: boolean; show: (s: ReviewStatus, item: Resource) => boolean };

// 操作按钮统一显示顺序：关联 → 查看 → 编辑 → 删除 → 变更 → 撤销 → 变更记录 → 查看存证
const ALL_ACTIONS: ActionDef[] = [
  { key: 'relate', label: '关联', show: s => s !== '已撤销' },
  { key: 'view', label: '查看', show: () => true },
  { key: 'edit', label: '编辑', show: s => ['待提交', '提交未通过'].includes(s) },
  { key: 'delete', label: '删除', show: s => ['待提交', '提交未通过'].includes(s) },
  { key: 'change', label: '变更', show: s => ['变更未通过', '撤销未通过', '已通过'].includes(s) },
  { key: 'revoke', label: '撤销', show: s => ['变更未通过', '撤销未通过', '已通过'].includes(s) },
  { key: 'changeRecord', label: '变更记录', show: (s, item) => s === '已通过' && !!item?.changed },
  { key: 'proof', label: '查看存证', show: s => ['变更未通过', '撤销未通过', '已通过'].includes(s) },
];

const auditTrail = (item: Resource) => {
  const steps = [{ time: item.createdAt, node: '资源创建', operator: item.provider, result: '待提交' as ReviewStatus }];
  if (item.reviewStatus !== '待提交') {
    steps.push({ time: item.createdAt, node: '提交审核', operator: item.provider, result: '提交待审核' as ReviewStatus });
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
    <Layout activeMenu="data-resource-catalog" breadcrumb="数据资源目录" role="实施机构" onRoleChange={() => undefined} roleOptions={['实施机构']} title="数据资源目录">
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
      {action && action.type !== 'edit' && action.type !== 'change' && action.type !== 'relate' && (
        <div className="modal-overlay" onClick={() => setAction(null)}>
          <div className={'catalog-modal' + (action.type === 'changeRecord' ? ' change-record-modal' : '')} onClick={e => e.stopPropagation()}>
            {action.type === 'delete' && <ConfirmModal title="删除资源" danger confirmText="删除" message={`确认删除「${action.item.name}」？删除后不可恢复。`} onClose={() => setAction(null)} onConfirm={() => setAction(null)} />}
            {action.type === 'revoke' && <ConfirmModal title="撤销资源" message={`确认撤销「${action.item.name}」？撤销后将进入“撤销待审核”。`} onClose={() => setAction(null)} onConfirm={() => setAction(null)} />}
            {action.type === 'changeRecord' && <ChangeRecordModal item={action.item} onClose={() => setAction(null)} />}
          </div>
        </div>
      )}
      {action && action.type === 'edit' && <EditResourceModal item={action.item} onClose={() => setAction(null)} />}
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
                <Field label="地域分类" required><select value={region} onChange={e => setRegion(e.target.value)}><option>请选择</option><option>全国</option><option>湖南省</option><option>长沙市</option></select></Field>
                <Field label="扩展码"><input value={extCode} onChange={e => setExtCode(e.target.value)} placeholder="请输入" /></Field>
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
              <div className="info-toolbar"><b>信息项</b><button className="btn success"><Download size={15} />下载模板</button><button className="btn primary"><Upload size={15} />导入文件</button><button className="btn primary" onClick={addRow}><Plus size={15} />新增</button></div>
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
                        <td><button className="delete-row" disabled={rows.length === 1} onClick={() => setRows(p => p.filter((_, j) => j !== i))}>×</button></td>
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

const DetailModal = ({ item, onClose }: { item: Resource; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'items'>('basic');
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
                  <tr><th>地域分类</th><td>湖南省</td><th>扩展码</th><td>HC-2026-046927</td></tr>
                  <tr><th>审核状态</th><td>{blank(item.reviewStatus)}</td><th>领域名称</th><td>医疗健康</td></tr>
                  <tr><th>所属地域</th><td>省本级</td><th>数据源挂载状态</th><td>{blank(item.mountStatus)}</td></tr>
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
          ) : (
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
          )}
        </div>
        <div className="modal-foot"><button type="button" className="btn" onClick={onClose}>关闭</button></div>
      </div>
    </div>
  );
};

const ProofModal = ({ item, onClose }: { item: Resource; onClose: () => void }) => (
  <>
    <div className="modal-head"><h3>区块链存证</h3><button onClick={onClose}><X size={18} /></button></div>
    <div className="modal-body">
      <div className="proof-box">
        <div><b>存证编号</b><span>BC-20260824-000128</span></div>
        <div><b>上链时间</b><span>{item.updatedAt}</span></div>
        <div><b>区块高度</b><span>18,426,901</span></div>
        <div><b>交易哈希</b><span className="hash">0x9f0d...e82a</span></div>
      </div>
    </div>
    <div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button></div>
  </>
);

const ChangeRecordModal = ({ item, onClose }: { item: Resource; onClose: () => void }) => {
  const [status, setStatus] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [detail, setDetail] = useState<ChangeRecord | null>(null);
  const records = (item.changeRecords || []).filter(r => (!status || r.status === status) && (!start || r.time.slice(0, 10) >= start) && (!end || r.time.slice(0, 10) <= end));
  const reset = () => { setStatus(''); setStart(''); setEnd(''); };
  return <>
    <div className="modal-head"><h3>变更记录</h3><button onClick={onClose}><X size={18} /></button></div>
    <div className="modal-body change-record-body"><div className="change-record-filters"><label>变更状态<select value={status} onChange={e => setStatus(e.target.value)}><option value="">请选择</option><option>变更中</option><option>变更通过</option><option>变更不通过</option></select></label><label>更新时间<div className="date-range"><input type="date" value={start} onChange={e => setStart(e.target.value)} /><span>-</span><input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div></label><div className="change-filter-actions"><button className="btn primary" onClick={() => undefined}>查询</button><button className="btn" onClick={reset}>重置</button></div></div><div className="table-wrap change-record-wrap"><table className="catalog-table change-record-table"><thead><tr><th>序号</th><th>变更状态</th><th>更新时间</th><th>变更审核意见</th><th>操作</th></tr></thead><tbody>{records.map((r, i) => <tr key={i}><td>{i + 1}</td><td><span className={'status ' + (r.status === '变更通过' ? 'success' : r.status === '变更不通过' ? 'danger' : 'info')}>{r.status}</span></td><td>{r.time}</td><td>{r.opinion || '-'}</td><td><button className="link-button" onClick={() => setDetail(r)}>查看</button></td></tr>)}{!records.length && <tr><td colSpan={5} className="empty-row">暂无变更记录</td></tr>}</tbody></table></div><div className="pagination change-record-pagination"><span>共{records.length}条记录</span><span>‹　<b>1</b>　›　<select><option>10条/页</option></select>　跳至 <input value="1" readOnly /> 页</span></div></div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button></div>
    {detail && <div className="modal-overlay nested-overlay" onClick={() => setDetail(null)}><div className="catalog-modal change-detail-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><h3>变更详情</h3><button onClick={() => setDetail(null)}><X size={18} /></button></div><div className="modal-body"><div className="detail-change-meta"><span>变更状态：{detail.status}</span><span>更新时间：{detail.time}</span></div><table className="change-detail-table"><thead><tr><th>变更项</th><th>变更前</th><th>变更后</th></tr></thead><tbody><tr><td>{detail.field}</td><td className="old-val">{detail.oldValue}</td><td className="new-val">{detail.newValue}</td></tr></tbody></table><p className="change-opinion">审核意见：{detail.opinion || '-'}</p></div><div className="modal-foot"><button className="btn" onClick={() => setDetail(null)}>关闭</button></div></div></div>}
  </>;
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

/**
 * @name 需求管理
 * @mode axure
 *
 * 后台需求管理列表，供运营机构查看并处理数据需求。
 */
import { useEffect, useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

type DemandStatus = '已上报' | '已响应' | '意向达成';
interface DemandRecord {
  id: number;
  name: string;
  industry: string;
  budget: string;
  deadline: string;
  status: DemandStatus;
  createTime: string;
  updateTime: string;
  requester: string;
  contact: string;
  contactPhone: string;
  description: string;
  response?: { note: string; data: ResponseDataRow[] };
  intent?: { scale: string; scaleUnit: string; note: string };
}

interface ResponseDataRow {
  id: number;
  type: '' | '数据资源' | '数据产品';
  code: string;
  name: string;
}

const seed: DemandRecord[] = [
  { id: 1, name: '医疗影像辅助诊断数据需求', industry: '医疗健康', budget: '50,000-80,000 元', deadline: '2026-09-30', status: '已上报', createTime: '2026-08-18 09:20:00', updateTime: '2026-08-18 09:20:00', requester: '湖南智康科技有限公司', contact: '刘敏', contactPhone: '13873120001', description: '用于构建医疗影像辅助诊断模型，需近三年脱敏影像及标注数据。' },
  { id: 2, name: '城市交通拥堵分析数据需求', industry: '交通运输', budget: '30,000 元', deadline: '2026-09-20', status: '已响应', createTime: '2026-08-16 14:10:00', updateTime: '2026-08-17 10:30:00', requester: '湖南慧行信息技术有限公司', contact: '陈昊', contactPhone: '13973120002', description: '需要城市路网流量、速度和事件数据，支持交通态势分析。', response: { note: '已完成数据资源匹配，可提供道路流量和交通事件数据。', data: [{ id: 1, type: '数据资源', code: 'TRAFFIC-001', name: '城市道路流量数据' }] } },
  { id: 3, name: '文旅客流趋势预测数据需求', industry: '文化旅游', budget: '面议', deadline: '2026-10-15', status: '意向达成', createTime: '2026-08-12 11:05:00', updateTime: '2026-08-15 16:42:00', requester: '潇湘文旅发展集团', contact: '周琳', contactPhone: '13773120003', description: '面向景区客流预测和营销分析，关注节假日客流及来源地数据。', response: { note: '可提供文旅客流及来源地分析数据。', data: [{ id: 1, type: '数据产品', code: 'TOUR-003', name: '景区客流分析产品' }] }, intent: { scale: '2.5', scaleUnit: 'GB', note: '双方就数据使用范围和交付方式达成初步意向。' } },
  { id: 4, name: '企业信用风险评估数据需求', industry: '金融服务', budget: '100,000-150,000 元', deadline: '2026-09-12', status: '已上报', createTime: '2026-08-10 16:35:00', updateTime: '2026-08-10 16:35:00', requester: '湘江征信服务有限公司', contact: '王宇', contactPhone: '13673120004', description: '用于企业信用评分，需要工商、司法和纳税等多源数据。' },
  { id: 5, name: '农业产销监测数据需求', industry: '农业农村', budget: '20,000 元', deadline: '2026-09-08', status: '已响应', createTime: '2026-08-06 08:45:00', updateTime: '2026-08-08 13:20:00', requester: '湖南农服数字科技有限公司', contact: '李娟', contactPhone: '13573120005', description: '关注主要农产品产量、价格与物流流向，服务农产品产销预测。', response: { note: '已匹配农产品产量、价格和物流数据资源。', data: [{ id: 1, type: '数据资源', code: 'AGRI-015', name: '农产品产销监测数据' }] } },
  { id: 6, name: '生态环境质量评价数据需求', industry: '生态环境', budget: '面议', deadline: '2026-08-30', status: '意向达成', createTime: '2026-08-02 10:15:00', updateTime: '2026-08-05 17:10:00', requester: '湖南绿洲环保研究院', contact: '赵峰', contactPhone: '13373120006', description: '需要空气、水质、土壤等环境监测数据，用于区域生态评价。', response: { note: '已提供环境监测数据服务方案。', data: [{ id: 1, type: '数据产品', code: 'ECO-020', name: '生态环境质量评价数据产品' }] }, intent: { scale: '800', scaleUnit: 'MB', note: '已确认合作意向，后续将推进协议签订。' } }
];

const statusClass = (status: DemandStatus) => status === '已上报' ? 'status-pending' : status === '已响应' ? 'status-reviewing' : 'status-approved';

const OriginalComponent = () => {
  const [records, setRecords] = useState(seed);
  const [role, setRole] = useState('运营机构');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('');
  const [deadlineStart, setDeadlineStart] = useState('');
  const [deadlineEnd, setDeadlineEnd] = useState('');
  const [createStart, setCreateStart] = useState('');
  const [createEnd, setCreateEnd] = useState('');
  const [updateStart, setUpdateStart] = useState('');
  const [updateEnd, setUpdateEnd] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [view, setView] = useState<DemandRecord | null>(null);
  const [viewTab, setViewTab] = useState<'basic' | 'response' | 'intent'>('basic');
  const [responseRecord, setResponseRecord] = useState<DemandRecord | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [responseRows, setResponseRows] = useState<ResponseDataRow[]>([{ id: 1, type: '', code: '', name: '' }]);
  const [responseErrors, setResponseErrors] = useState<Record<string, string>>({});
  const [intentRecord, setIntentRecord] = useState<DemandRecord | null>(null);
  const [dataScale, setDataScale] = useState('');
  const [dataScaleUnit, setDataScaleUnit] = useState('MB');
  const [intentNote, setIntentNote] = useState('');
  const [intentErrors, setIntentErrors] = useState<Record<string, string>>({});
  useEffect(() => { if (view) setViewTab('basic'); }, [view]);

  const filtered = useMemo(() => records.filter(item => {
    if (name && !item.name.includes(name)) return false;
    if (budget && !item.budget.includes(budget)) return false;
    if (status && item.status !== status) return false;
    if (deadlineStart && item.deadline < deadlineStart) return false;
    if (deadlineEnd && item.deadline > deadlineEnd) return false;
    if (createStart && item.createTime < createStart) return false;
    if (createEnd && item.createTime > `${createEnd} 23:59:59`) return false;
    if (updateStart && item.updateTime < updateStart) return false;
    if (updateEnd && item.updateTime > `${updateEnd} 23:59:59`) return false;
    return true;
  }).sort((a, b) => b.createTime.localeCompare(a.createTime)), [records, name, budget, status, deadlineStart, deadlineEnd, createStart, createEnd, updateStart, updateEnd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeViewTab = viewTab === 'intent' && view?.intent ? 'intent' : viewTab === 'response' && view?.response ? 'response' : 'basic';
  const safeViewTab = activeViewTab;
  const reset = () => { setName(''); setBudget(''); setStatus(''); setDeadlineStart(''); setDeadlineEnd(''); setCreateStart(''); setCreateEnd(''); setUpdateStart(''); setUpdateEnd(''); setPage(1); };
  const openResponse = (record: DemandRecord) => {
    setResponseRecord(record);
    setResponseNote('');
    setResponseRows([{ id: 1, type: '', code: '', name: '' }]);
    setResponseErrors({});
  };
  const respond = openResponse;
  const updateResponseRow = (id: number, field: 'type' | 'code' | 'name', value: string) => {
    setResponseRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value, ...(field === 'name' ? { code: value } : {}) } : row));
    setResponseErrors(prev => { const next = { ...prev }; delete next[`row_${id}_${field}`]; if (field === 'name') delete next[`row_${id}_code`]; return next; });
  };
  const addResponseRow = () => setResponseRows(prev => [...prev, { id: Date.now(), type: '', code: '', name: '' }]);
  const deleteResponseRow = (id: number) => setResponseRows(prev => prev.length > 1 ? prev.filter(row => row.id !== id) : prev);
  const submitResponse = () => {
    const errors: Record<string, string> = {};
    if (!responseNote.trim()) errors.note = '请输入响应说明';
    if (responseNote.length > 500) errors.note = '响应说明不能超过500字';
    responseRows.forEach(row => {
      if (!row.type) errors[`row_${row.id}_type`] = '请选择数据类型';
      if (!row.name.trim()) errors[`row_${row.id}_name`] = '请输入数据名称';
    });
    setResponseErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!responseRecord) return;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    setRecords(prev => prev.map(item => item.id === responseRecord.id ? { ...item, status: '已响应', updateTime: now, response: { note: responseNote, data: responseRows } } : item));
    setResponseRecord(null);
  };
  const openIntent = (record: DemandRecord) => {
    setIntentRecord(record); setDataScale(''); setDataScaleUnit('MB'); setIntentNote(''); setIntentErrors({});
  };
  const confirmIntent = () => {
    const errors: Record<string, string> = {};
    if (!dataScale.trim()) errors.dataScale = '请输入数据规模';
    if (dataScale && !/^\d+(\.\d+)?$/.test(dataScale)) errors.dataScale = '数据规模仅支持数字';
    if (!intentNote.trim()) errors.intentNote = '请输入意向说明';
    if (intentNote.length > 500) errors.intentNote = '意向说明不能超过500字';
    setIntentErrors(errors);
    if (Object.keys(errors).length || !intentRecord) return;
    setRecords(prev => prev.map(item => item.id === intentRecord.id ? { ...item, status: '意向达成', updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '), intent: { scale: dataScale, scaleUnit: dataScaleUnit, note: intentNote } } : item));
    setIntentRecord(null);
  };
  const dateRange = (label: string, start: string, end: string, setStart: (v: string) => void, setEnd: (v: string) => void) => <div className="filter-item date-range"><label>{label}</label><div className="date-inputs"><div className="date-input"><input type="date" value={start} onChange={e => { setStart(e.target.value); setPage(1); }} /></div><span className="date-separator">-</span><div className="date-input"><input type="date" value={end} onChange={e => { setEnd(e.target.value); setPage(1); }} /></div></div></div>;

  const renderResponseModal = () => responseRecord && <div className="modal-overlay" onClick={() => setResponseRecord(null)}>
    <div className="modal-large form-modal response-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header"><h3>响应需求</h3><button className="modal-close" onClick={() => setResponseRecord(null)}>×</button></div>
      <div className="modal-body form-modal-body">
        <div className="form-section"><div className="form-grid">
          <div className="form-item form-item-full"><label>需求标题</label><input type="text" value={responseRecord.name} disabled /></div>
          <div className="form-item form-item-full"><label>响应说明<span className="required">*</span></label><div><textarea rows={4} maxLength={500} value={responseNote} placeholder="请输入响应说明" onChange={e => { setResponseNote(e.target.value); setResponseErrors(prev => ({ ...prev, note: '' })); }} className={responseErrors.note ? 'has-error' : ''} /><div className="char-count">{responseNote.length}/500</div>{responseErrors.note && <span className="error-text">{responseErrors.note}</span>}</div></div>
        </div></div>
        <div className="form-section"><h4 className="section-title"><span className="title-bar"></span>响应数据<button className="btn-add-row" onClick={addResponseRow}>+ 新增</button></h4><div className="product-table-wrapper"><table className="product-form-table response-data-table"><thead><tr><th className="col-seq">序号</th><th><span className="required">*</span> 数据类型</th><th><span className="required">*</span> 数据名称</th><th>数据标识</th><th className="col-op">操作</th></tr></thead><tbody>{responseRows.map((row, index) => <tr key={row.id}><td className="col-seq">{index + 1}</td><td><select value={row.type} onChange={e => updateResponseRow(row.id, 'type', e.target.value)} className={responseErrors[`row_${row.id}_type`] ? 'has-error' : ''}><option value="">请选择</option><option value="数据资源">数据资源</option><option value="数据产品">数据产品</option></select>{responseErrors[`row_${row.id}_type`] && <span className="error-text">{responseErrors[`row_${row.id}_type`]}</span>}</td><td><input type="text" value={row.name} placeholder="请输入数据名称" onChange={e => updateResponseRow(row.id, 'name', e.target.value)} className={responseErrors[`row_${row.id}_name`] ? 'has-error' : ''} />{responseErrors[`row_${row.id}_name`] && <span className="error-text">{responseErrors[`row_${row.id}_name`]}</span>}</td><td><input type="text" value={row.code} placeholder="填写数据名称后自动生成" disabled /></td><td className="col-op"><button className="btn-delete-row" onClick={() => deleteResponseRow(row.id)}>×</button></td></tr>)}</tbody></table></div></div>
      </div>
      <div className="modal-footer"><button className="btn btn-default" onClick={() => setResponseRecord(null)}>取消</button><button className="btn btn-primary" onClick={submitResponse}>提交</button></div>
    </div>
  </div>;

  const renderIntentModal = () => intentRecord && <div className="modal-overlay" onClick={() => setIntentRecord(null)}>
    <div className="modal-large form-modal response-modal intent-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header"><h3>确认意向</h3><button className="modal-close" onClick={() => setIntentRecord(null)}>×</button></div>
      <div className="modal-body form-modal-body"><div className="form-section"><div className="form-grid">
        <div className="form-item"><label>需求标题</label><input type="text" value={intentRecord.name} disabled /></div>
        <div className="form-item"><label>数据规模<span className="required">*</span></label><div className="scale-control"><input type="text" inputMode="decimal" value={dataScale} placeholder="请输入数据规模" onChange={e => { setDataScale(e.target.value); setIntentErrors(prev => ({ ...prev, dataScale: '' })); }} className={intentErrors.dataScale ? 'has-error' : ''} /><select value={dataScaleUnit} onChange={e => setDataScaleUnit(e.target.value)}><option value="MB">MB</option><option value="GB">GB</option><option value="TB">TB</option></select>{intentErrors.dataScale && <span className="error-text">{intentErrors.dataScale}</span>}</div></div>
        <div className="form-item form-item-full"><label>意向说明<span className="required">*</span></label><div><textarea rows={4} maxLength={500} value={intentNote} placeholder="请输入意向说明" onChange={e => { setIntentNote(e.target.value); setIntentErrors(prev => ({ ...prev, intentNote: '' })); }} className={intentErrors.intentNote ? 'has-error' : ''} /><div className="char-count">{intentNote.length}/500</div>{intentErrors.intentNote && <span className="error-text">{intentErrors.intentNote}</span>}</div></div>
      </div></div></div>
      <div className="modal-footer"><button className="btn btn-default" onClick={() => setIntentRecord(null)}>取消</button><button className="btn btn-primary" onClick={confirmIntent}>提交</button></div>
    </div>
  </div>;

  const renderDemandViewModal = () => view && <div className="modal-overlay" onClick={() => setView(null)}><div className="modal-large view-modal demand-view-modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>查看需求</h3><button className="modal-close" onClick={() => setView(null)}>×</button></div><div className="modal-body demand-view-body">{(view.response || view.intent) && <div className="demand-view-tabs"><button className={viewTab === 'basic' ? 'active' : ''} onClick={() => setViewTab('basic')}>基本信息</button>{view.response && <button className={viewTab === 'response' ? 'active' : ''} onClick={() => setViewTab('response')}>响应信息</button>}{view.intent && <button className={viewTab === 'intent' ? 'active' : ''} onClick={() => setViewTab('intent')}>意向信息</button>}</div>}{viewTab === 'basic' && <div className="demand-info-table"><div className="info-cell"><span>需求标题</span><b>{view.name}</b></div><div className="info-cell"><span>行业分类</span><b>{view.industry}</b></div><div className="info-cell"><span>资源预算</span><b>{view.budget}</b></div><div className="info-cell"><span>需求截止日期</span><b>{view.deadline}</b></div><div className="info-cell"><span>需求状态</span><b>{view.status}</b></div><div className="info-cell"><span>创建时间</span><b>{view.createTime}</b></div><div className="info-cell"><span>更新时间</span><b>{view.updateTime}</b></div><div className="info-cell"><span>联系人</span><b>{view.contact}</b></div><div className="info-cell"><span>联系方式</span><b>{view.contactPhone}</b></div><div className="info-cell full"><span>需求描述</span><b>{view.description}</b></div></div>}{viewTab === 'response' && view.response && <><div className="demand-info-table"><div className="info-cell full"><span>响应说明</span><b>{view.response.note}</b></div></div><table className="demand-view-table"><thead><tr><th>序号</th><th>数据类型</th><th>数据名称</th><th>数据标识</th></tr></thead><tbody>{view.response.data.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.type}</td><td>{item.name}</td><td>{item.code}</td></tr>)}</tbody></table></>}{viewTab === 'intent' && view.intent && <div className="demand-info-table"><div className="info-cell"><span>数据规模</span><b>{view.intent.scale} {view.intent.scaleUnit}</b></div><div className="info-cell full"><span>意向说明</span><b>{view.intent.note}</b></div></div>}</div><div className="modal-footer"><button className="btn btn-default" onClick={() => setView(null)}>关闭</button></div></div></div>;

  return <Layout activeMenu="demand-management" breadcrumb="需求管理" title="需求管理" role={role} onRoleChange={setRole} roleOptions={['运营机构']} specContent={specContent} changeLogContent={changeLogContent}>
    {renderDemandViewModal()}
    <div className="filter-section">
      <div className="filter-row"><div className="filter-item"><label>需求标题</label><input type="text" placeholder="请输入需求标题" value={name} onChange={e => { setName(e.target.value); setPage(1); }} /></div><div className="filter-item"><label>资源预算</label><input type="text" placeholder="请输入预算" value={budget} onChange={e => { setBudget(e.target.value); setPage(1); }} /></div><div className="filter-item filter-item-select"><label>需求状态</label><select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">请选择</option><option>已上报</option><option>已响应</option><option>意向达成</option></select></div>{dateRange('需求截止日期', deadlineStart, deadlineEnd, setDeadlineStart, setDeadlineEnd)}</div>
      <div className="filter-row">{dateRange('创建时间', createStart, createEnd, setCreateStart, setCreateEnd)}{dateRange('更新时间', updateStart, updateEnd, setUpdateStart, setUpdateEnd)}</div>
      <div className="filter-actions"><button className="btn btn-primary btn-sm" onClick={() => setPage(1)}>查询</button><button className="btn btn-default btn-sm" onClick={reset}>重置</button></div>
    </div>
    <div className="table-section"><div className="table-wrapper">
      <table className="data-table demand-table"><thead><tr><th className="col-index">序号</th><th>需求标题</th><th>行业分类</th><th>资金预算</th><th>需求截止日期</th><th>需求状态</th><th>创建时间</th><th>更新时间</th><th className="col-action">操作</th></tr></thead><tbody>{rows.map((item, index) => <tr key={item.id}><td className="col-index">{(safePage - 1) * pageSize + index + 1}</td><td className="demand-name">{item.name}</td><td>{item.industry}</td><td>{item.budget}</td><td>{item.deadline}</td><td><span className={`status-tag ${statusClass(item.status)}`}>{item.status}</span></td><td>{item.createTime}</td><td>{item.updateTime}</td><td className="action-cell"><button className="action-btn" onClick={() => setView(item)}>查看</button>{item.status === '已上报' && <button className="action-btn" onClick={() => respond(item)}>响应</button>}{item.status === '已响应' && <button className="action-btn" onClick={() => openIntent(item)}>确认意向</button>}</td></tr>)}{rows.length === 0 && <tr><td colSpan={9} className="empty-state">暂无数据</td></tr>}</tbody></table></div><div className="pagination"><div className="pagination-info">共 {filtered.length} 条记录</div><div className="pagination-controls"><button className="page-btn" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>上一页</button>{Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1).map((p, i, arr) => <span key={p}>{i > 0 && arr[i - 1] !== p - 1 && <span className="page-ellipsis">...</span>}<button className={`page-number ${p === safePage ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button></span>)}<button className="page-btn" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>下一页</button><select className="page-size-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}><option value={10}>10 条/页</option><option value={20}>20 条/页</option><option value={50}>50 条/页</option></select><span className="jump-to">跳至</span><input className="page-input" type="number" min={1} max={totalPages} value={safePage} onChange={e => { const v = Number(e.target.value); if (v >= 1 && v <= totalPages) setPage(v); }} /><span className="jump-to">页</span></div></div></div>{renderResponseModal()}{renderIntentModal()}</Layout>;
};

const Component = () => <PasswordGuard><OriginalComponent /></PasswordGuard>;
export default Component;
if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) (window as any).__AXHUB_DEFINE_COMPONENT__(Component);

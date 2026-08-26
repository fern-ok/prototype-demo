/**
 * @name 产品登记管理
 * @mode axure
 *
 * 产品登记列表，面向运营机构与其他经营主体提供登记申请及状态跟踪。
 */
import { useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

type ProductRecord = { id: number; applyNo: string; code: string; name: string; type: string; industry: string; updated: string; status: string };
const statuses = ['待提交', '提交待审核', '变更待审核', '撤销待审核', '提交未通过', '变更未通过', '撤销未通过', '已通过', '已撤销'];
const seed: ProductRecord[] = [
  { id: 1, applyNo: 'CPDJ2026080600000006', code: '', name: '撤销未通过产品', type: '数据集', industry: '公共服务', updated: '2026-08-06 13:27:51', status: '待提交' },
  { id: 2, applyNo: 'CPDJ2026081200000008', code: '', name: '省级医疗就诊记录查询', type: 'API产品', industry: '医疗健康', updated: '2026-08-12 10:05:22', status: '提交待审核' },
  { id: 3, applyNo: 'CPDJ2026081000000003', code: '', name: '公共卫生监测数据集', type: '数据集', industry: '医疗健康', updated: '2026-08-10 15:18:02', status: '提交未通过' },
  { id: 4, applyNo: 'CPDJ2026080800000012', code: '691430105750602924H4301G1ET8FIIG', name: '道路交通流量分析 API', type: 'API产品', industry: '交通运输', updated: '2026-08-08 09:13:01', status: '变更待审核' },
  { id: 5, applyNo: 'CPDJ2026072800000006', code: '691430105750602924H43019DMXAGDEH', name: '省级教育统计数据集', type: '数据集', industry: '教育', updated: '2026-07-28 17:42:26', status: '变更未通过' },
  { id: 6, applyNo: 'CPDJ2026071500000007', code: '691430105750602924H4301UCA5CBPCK', name: '居民健康档案数据', type: '数据集', industry: '医疗健康', updated: '2026-07-15 14:30:02', status: '撤销待审核' },
  { id: 7, applyNo: 'CPDJ2026081300000001', code: '691430105750602924H4301A1REG001', name: '省级公共数据登记', type: 'API产品', industry: '公共服务', updated: '2026-08-13 09:20:11', status: '撤销未通过' },
  { id: 8, applyNo: 'CPDJ2026081200000002', code: '691430105750602924H4301A1REG002', name: '产品变更申请', type: '数据集', industry: '医疗健康', updated: '2026-08-12 16:42:08', status: '已撤销' },
  { id: 9, applyNo: 'CPDJ2026081100000003', code: '691430105750602924H4301A1REG003', name: '产品撤销申请', type: 'API产品', industry: '交通运输', updated: '2026-08-11 11:18:44', status: '已通过' }
];

const statusClass = (status: string) => status === '已通过' ? 'status-ok' : status.includes('未通过') ? 'status-danger' : status === '已撤销' ? 'status-muted' : 'status-warn';

const OriginalComponent = () => {
  const [role, setRole] = useState('运营机构');
  const [query, setQuery] = useState({ applyNo: '', code: '', name: '', type: '', status: '', start: '', end: '' });
  const [submitted, setSubmitted] = useState(query);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState<{ title: string; record: ProductRecord; action?: string } | null>(null);
  const rows = useMemo(() => seed.filter(r => (!submitted.applyNo || r.applyNo.includes(submitted.applyNo)) && (!submitted.code || r.code.includes(submitted.code)) && (!submitted.name || r.name.includes(submitted.name)) && (!submitted.type || r.type === submitted.type) && (!submitted.status || r.status === submitted.status) && (!submitted.start || r.updated.slice(0, 10) >= submitted.start) && (!submitted.end || r.updated.slice(0, 10) <= submitted.end)), [submitted]);
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  const canApply = role === '运营机构' || role === '其他经营主体';
  const reset = () => { const empty = { applyNo: '', code: '', name: '', type: '', status: '', start: '', end: '' }; setQuery(empty); setSubmitted(empty); setPage(1); };
  const action = (record: ProductRecord, actionName: string) => setDialog({ title: actionName + '确认', record, action: actionName });
  return <Layout activeMenu={'product-registration'} breadcrumb="产品登记" role={role} roleOptions={['运营机构', '其他经营主体']} onRoleChange={setRole} title="产品登记" specContent={specContent} changeLogContent={changeLogContent}>
    <section className="registration-page">
      <div className="filter-section">
        <div className="filter-grid filter-row">
          <div className="filter-item"><label>申请单号</label><input value={query.applyNo} onChange={e => setQuery({ ...query, applyNo: e.target.value })} placeholder="请输入申请单号" /></div>
          <div className="filter-item"><label>数据产品标识码</label><input value={query.code} onChange={e => setQuery({ ...query, code: e.target.value })} placeholder="请输入标识码" /></div>
          <div className="filter-item"><label>产品名称</label><input value={query.name} onChange={e => setQuery({ ...query, name: e.target.value })} placeholder="请输入产品名称" /></div>
          <div className="filter-item filter-item-select"><label>产品类型</label><select value={query.type} onChange={e => setQuery({ ...query, type: e.target.value })}><option value="">请选择</option><option>API产品</option><option>数据集</option></select></div></div>
        <div className="filter-row">
          <div className="filter-item date-range"><label>更新时间</label><div className="date-inputs"><input type="date" value={query.start} onChange={e => setQuery({ ...query, start: e.target.value })} /><span>-</span><input type="date" value={query.end} onChange={e => setQuery({ ...query, end: e.target.value })} /></div></div>
          <div className="filter-item filter-item-select"><label>审核状态</label><select value={query.status} onChange={e => setQuery({ ...query, status: e.target.value })}><option value="">请选择</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div className="filter-actions"><button className="btn btn-primary btn-sm" onClick={() => { setSubmitted(query); setPage(1); }}>查询</button><button className="btn btn-default btn-sm" onClick={reset}>重置</button></div>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <table className="data-table registration-table">
            <thead><tr><th className="col-index">序号</th><th>申请单号</th><th>数据产品标识码</th><th>产品名称</th><th>产品类型</th><th>行业分类</th><th>更新时间</th><th>审核状态</th><th className="col-action">操作</th></tr></thead>
            <tbody>{visible.map((r, i) => <tr key={r.id}><td className="col-index">{(page - 1) * pageSize + i + 1}</td><td>{r.applyNo}</td>
            <td className="ellipsis" title={r.code}>{r.code}</td><td className="ellipsis" title={r.name}>{r.name}</td>
            <td>{r.type}</td><td>{r.industry}</td><td>{r.updated}</td><td><span className={'status-tag ' + statusClass(r.status)}>{r.status}</span></td>
            <td className="action-cell"><button className="action-btn" onClick={() => setDialog({ title: '产品登记详情', record: r })}>查看</button>
            {canApply && ['已通过', '变更未通过', '撤销未通过'].includes(r.status) && <button className="action-btn" onClick={() => action(r, '变更')}>变更</button>}
            {canApply && ['已通过', '变更未通过', '撤销未通过'].includes(r.status) && <button className="action-btn" onClick={() => action(r, '撤销')}>撤销</button>}
            {canApply && ['待提交'].includes(r.status) && <button className="action-btn" onClick={() => action(r, '登记')}>登记</button>}
            {canApply && ['提交未通过'].includes(r.status) && <button className="action-btn" onClick={() => action(r, '编辑')}>编辑</button>}
            {['已通过', '变更未通过', '撤销未通过'].includes(r.status) && <button className="action-btn" onClick={() => setDialog({ title: '存证信息', record: r })}>查看存证</button>}
            </td></tr>)}</tbody></table></div>
        <div className="pagination"><div className="pagination-info">共 {rows.length} 条记录</div><div className="pagination-controls"><button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</button><button className="page-number active">{page}</button><button className="page-btn" disabled={page * pageSize >= rows.length} onClick={() => setPage(page + 1)}>下一页</button><select className="page-size-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}><option value={10}>10 条/页</option><option value={20}>20 条/页</option></select><span className="jump-to">跳至</span><input className="page-input" value={page} onChange={e => setPage(Math.max(1, Number(e.target.value) || 1))} /><span className="jump-to">页</span></div></div>
      </div>
    </section>
    {dialog && <div className="modal-mask" onClick={() => setDialog(null)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><h3>{dialog.title}</h3><button onClick={() => setDialog(null)}>×</button></div>{dialog.action ? <><p>确认对产品“{dialog.record.name}”发起{dialog.action}申请吗？</p><div className="modal-actions"><button className="btn-secondary" onClick={() => setDialog(null)}>取消</button><button className="btn-primary" onClick={() => setDialog(null)}>确认提交</button></div></> : <div className="detail-grid"><span>申请单号</span><strong>{dialog.record.applyNo}</strong><span>产品标识码</span><strong>{dialog.record.code}</strong><span>产品名称</span><strong>{dialog.record.name}</strong><span>产品类型</span><strong>{dialog.record.type}</strong><span>审核状态</span><strong>{dialog.record.status}</strong><span>更新时间</span><strong>{dialog.record.updated}</strong></div>}</div></div>}
  </Layout>;
};

export default function ProductRegistrationPage() { return <PasswordGuard><OriginalComponent /></PasswordGuard>; }

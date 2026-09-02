/**
 * @name 领域管理
 * @mode axure
 *
 * 系统管理下的领域字典维护页面，仅向数据基础设施运营方开放。
 */

import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import './style.css';
import '../../common/backend-list.css';

type DomainRecord = { id: number; name: string; createdAt: string; sort: number };

const initialDomains: DomainRecord[] = [
  ['卫生健康', '2025-09-09 21:08:07'], ['气象服务', '2025-09-11 10:21:05'], ['文化旅游', '2025-09-11 10:21:15'],
  ['交通运输', '2025-09-11 10:21:25'], ['城市治理', '2025-10-16 09:19:09'], ['自然资源', '2025-09-11 10:21:36'],
  ['工业制造', '2025-09-11 10:21:20'], ['创新金融', '2025-09-09 21:08:24'], ['就业创业', '2025-11-20 14:10:23'],
].map(([name, createdAt], index) => ({ id: index + 1, name, createdAt, sort: index + 1 }));

const formatNow = () => {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const OriginalComponent = () => {
  const [records, setRecords] = useState(initialDomains);
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [role, setRole] = useState('数据基础设施运营方');
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [editing, setEditing] = useState<DomainRecord | null>(null);
  const [form, setForm] = useState({ name: '', sort: '' });
  const [error, setError] = useState('');

  const filteredRecords = useMemo(() => records.filter((record) => record.name.includes(query.trim())).sort((a, b) => a.sort - b.sort), [records, query]);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  const runQuery = () => { setQuery(keyword); setCurrentPage(1); };
  const resetQuery = () => { setKeyword(''); setQuery(''); setCurrentPage(1); };
  const openCreate = () => { setEditing(null); setForm({ name: '', sort: String(records.length + 1) }); setError(''); setModal('create'); };
  const openEdit = (record: DomainRecord) => { setEditing(record); setForm({ name: record.name, sort: String(record.sort) }); setError(''); setModal('edit'); };
  const saveForm = () => {
    const name = form.name.trim();
    const sort = Number(form.sort);
    if (!name) { setError('请输入领域名称'); return; }
    if (!Number.isInteger(sort) || sort < 1) { setError('排序请输入大于 0 的整数'); return; }
    if (records.some((item) => item.name === name && item.id !== editing?.id)) { setError('领域名称已存在'); return; }
    if (modal === 'create') {
      setRecords((items) => [...items, { id: Math.max(0, ...items.map((item) => item.id)) + 1, name, sort, createdAt: formatNow() }]);
    } else if (editing) {
      setRecords((items) => items.map((item) => item.id === editing.id ? { ...item, name, sort } : item));
    }
    setModal(null);
  };
  const removeRecord = () => {
    if (!editing) return;
    setRecords((items) => items.filter((item) => item.id !== editing.id));
    setModal(null);
  };

  return <>
    <Layout activeMenu="domain-management" breadcrumb="领域管理" title="领域管理" role={role} onRoleChange={setRole} roleOptions={['数据基础设施运营方']} specContent={specContent}>
    <div className="domain-page">
        <section className="filter-section domain-filter-section">
          <div className="filter-row"><div className="filter-item"><label htmlFor="domain-search">领域名称</label><input id="domain-search" value={keyword} placeholder="请输入" onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runQuery()} /></div></div>
          <div className="filter-actions"><div className="filter-actions-left"><button className="btn btn-primary btn-sm" onClick={runQuery}>查询</button><button className="btn btn-default btn-sm" onClick={resetQuery}>重置</button></div><div className="filter-actions-right"><button className="btn btn-primary" onClick={openCreate}><Plus size={16} />新增</button></div></div>
        </section>
        <section className="table-section domain-table-section">
          <div className="domain-table-toolbar"><span>领域列表</span></div>
          <div className="table-wrapper"><table className="data-table domain-table"><thead><tr><th className="col-index">序号</th><th>领域名称</th><th>创建时间</th><th>排序</th><th className="col-action">操作</th></tr></thead>
            <tbody>{pageRecords.length ? pageRecords.map((record, index) => <tr key={record.id}><td className="col-index">{(safePage - 1) * pageSize + index + 1}</td><td className="domain-name">{record.name}</td><td>{record.createdAt}</td><td>{record.sort}</td><td className="action-cell"><button className="action-btn" onClick={() => openEdit(record)}>编辑</button><button className="action-btn domain-delete-action" onClick={() => { setEditing(record); setModal('delete'); }}>删除</button></td></tr>) : <tr><td colSpan={5} className="empty-state">暂无匹配的领域数据</td></tr>}</tbody></table></div>
          <footer className="pagination"><div className="pagination-info">共 {filteredRecords.length} 条记录</div><div className="pagination-controls"><button className="page-btn" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)}>上一页</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button key={page} className={'page-number ' + (page === safePage ? 'active' : '')} onClick={() => setCurrentPage(page)}>{page}</button>)}<button className="page-btn" disabled={safePage === totalPages} onClick={() => setCurrentPage(safePage + 1)}>下一页</button><select className="page-size-select" aria-label="每页条数" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}><option value={10}>10 条/页</option><option value={20}>20 条/页</option></select></div></footer>
        </section>
    </div>
    </Layout>
    {modal && <div className="modal-mask" role="presentation" onMouseDown={() => setModal(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><h2 id="modal-title">{modal === 'create' ? '新增领域' : modal === 'edit' ? '编辑领域' : '删除领域'}</h2><button className="icon-button" onClick={() => setModal(null)} title="关闭"><X size={19} /></button></header>
      {modal === 'delete' ? <div className="delete-content"><Trash2 size={30} /><p>确定要删除领域“<b>{editing?.name}</b>”吗？</p><span>删除后无法恢复，请谨慎操作。</span></div> : <div className="form-content"><label>领域名称 <em>*</em><input autoFocus value={form.name} maxLength={30} placeholder="请输入领域名称" onChange={(event) => { setForm({ ...form, name: event.target.value }); setError(''); }} /></label><label>排序 <em>*</em><input type="number" min="1" value={form.sort} placeholder="请输入排序号" onChange={(event) => { setForm({ ...form, sort: event.target.value }); setError(''); }} /></label>{error && <p className="form-error">{error}</p>}</div>}
      <footer><button className="btn btn-default" onClick={() => setModal(null)}>取消</button><button className={'btn ' + (modal === 'delete' ? 'btn-danger' : 'btn-primary')} onClick={modal === 'delete' ? removeRecord : saveForm}>{modal === 'delete' ? '确认删除' : '保存'}</button></footer>
    </section></div>}
  </>;
};

const Component = () => <PasswordGuard><OriginalComponent /></PasswordGuard>;

export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) (window as any).__AXHUB_DEFINE_COMPONENT__(Component);

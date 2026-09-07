/**
 * @name 统一目录查询
 *
 * 数据管理部门角色的统一目录查询页面。
 * 跨数据来源聚合查看公共数据资源目录列表，仅提供查询与查看权限。
 */

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';
import '../../common/backend-list.css';

type CatalogSource = '授权运营平台' | '资源登记平台' | '政务信息资源';
const CATALOG_SOURCES: CatalogSource[] = ['授权运营平台', '资源登记平台', '政务信息资源'];

interface CatalogRecord {
  id: number;
  name: string;
  provider: string;
  source: CatalogSource[];
  domain: string;
  description: string;
  updateTime: string;
}

const SEED_RECORDS: CatalogRecord[] = [
  { id: 1, name: '221', provider: '湖南省卫生健康委统计信息中心', source: ['授权运营平台'], domain: '卫生健康', description: '医院基础信息登记数据，包含机构名称、等级、地址等基础属性。', updateTime: '2026-08-25 09:43:01' },
  { id: 2, name: '测试0321-5', provider: '湖南省卫生健康委统计信息中心', source: ['授权运营平台', '政务信息资源'], domain: '卫生健康', description: '公共卫生应急资源数据，用于疾控和应急指挥场景。', updateTime: '2026-08-21 16:50:01' },
  { id: 3, name: '测试0321-3', provider: '湖南省卫生健康委统计信息中心', source: ['政务信息资源'], domain: '卫生健康', description: '基层医疗机构人员花名册数据。', updateTime: '2026-08-21 16:09:01' },
  { id: 4, name: '测试0321-1', provider: '湖南省卫生健康委统计信息中心', source: ['授权运营平台'], domain: '卫生健康', description: '处方流转与药品使用情况统计数据。', updateTime: '2026-08-21 15:25:03' },
  { id: 5, name: '测试武源0321-1', provider: '天融机构交通局', source: ['授权运营平台'], domain: '交通运输', description: '城市公共交通线路与车辆基础信息数据。', updateTime: '2026-08-21 14:40:01' },
  { id: 6, name: '长沙市开福区金融资源0729-4', provider: '长沙市开福区金融服务中心·工会委员会', source: ['授权运营平台'], domain: '金融服务', description: '区域金融机构名录及行业分类数据。', updateTime: '2026-07-29 17:27:01' },
];

const OriginalComponent = () => {
  const [nameKeyword, setNameKeyword] = useState('');
  const [providerKeyword, setProviderKeyword] = useState('');
  const [sourceValue, setSourceValue] = useState('');
  const [updateStart, setUpdateStart] = useState('');
  const [updateEnd, setUpdateEnd] = useState('');
  const [dateError, setDateError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewRecord, setViewRecord] = useState<CatalogRecord | null>(null);

  const filtered = useMemo(() => {
    return SEED_RECORDS.filter(item => {
      if (nameKeyword && !item.name.includes(nameKeyword)) return false;
      if (providerKeyword && !item.provider.includes(providerKeyword)) return false;
      if (sourceValue && !item.source.includes(sourceValue as CatalogSource)) return false;
      if (updateStart && item.updateTime.slice(0, 10) < updateStart) return false;
      if (updateEnd && item.updateTime.slice(0, 10) > updateEnd) return false;
      return true;
    });
  }, [nameKeyword, providerKeyword, sourceValue, updateStart, updateEnd]);

  const stats = useMemo(() => {
    const providerSet = new Set(filtered.map(item => item.provider));
    return { providerCount: providerSet.size, totalCount: filtered.length };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleQuery = () => {
    if (updateStart && updateEnd && updateStart > updateEnd) {
      setDateError('起始日期不能晚于结束日期');
      return;
    }
    setDateError('');
    setPage(1);
  };

  const handleReset = () => {
    setNameKeyword('');
    setProviderKeyword('');
    setSourceValue('');
    setUpdateStart('');
    setUpdateEnd('');
    setDateError('');
    setPage(1);
  };

  const renderPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set<number>([1, totalPages, safePage, safePage - 1, safePage + 1]);
    const sorted = Array.from(pages).filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const result: Array<number | 'ellipsis'> = [];
    let prev = 0;
    for (const p of sorted) {
      if (prev && p - prev > 1) result.push('ellipsis');
      result.push(p);
      prev = p;
    }
    return result;
  };

  return (
    <Layout
      activeMenu="unified-catalog-query"
      breadcrumb="统一目录查询"
      role="数据管理部门"
      onRoleChange={() => undefined}
      roleOptions={['数据管理部门']}
      title="统一目录查询"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      <section className="ucq-stats">
        <div className="ucq-stat-card">
          <div className="ucq-stat-icon ucq-stat-icon-provider" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></svg>
          </div>
          <div className="ucq-stat-body">
            <div className="ucq-stat-label">资源持有方(家)</div>
            <div className="ucq-stat-value">{stats.providerCount}</div>
          </div>
        </div>
        <div className="ucq-stat-card">
          <div className="ucq-stat-icon ucq-stat-icon-catalog" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8" /><path d="M8 13h8" /><path d="M8 17h5" /></svg>
          </div>
          <div className="ucq-stat-body">
            <div className="ucq-stat-label">目录总数(条)</div>
            <div className="ucq-stat-value">6</div>
          </div>
        </div>
      </section>

      <section className="filter-section">
        <div className="filter-item">
          <label>资源名称</label>
          <input type="text" placeholder="请输入" value={nameKeyword} onChange={e => setNameKeyword(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>资源持有方</label>
          <input type="text" placeholder="请输入" value={providerKeyword} onChange={e => setProviderKeyword(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>目录来源</label>
          <select value={sourceValue} onChange={e => setSourceValue(e.target.value)}>
            <option value="">请选择</option>
            {CATALOG_SOURCES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="filter-item date-range ucq-date-range">
          <label>更新时间</label>
          <div className="date-inputs">
            <div className="date-input">
              <input type="date" value={updateStart} onChange={e => setUpdateStart(e.target.value)} />
            </div>
            <span className="date-separator">至</span>
            <div className="date-input">
              <input type="date" value={updateEnd} onChange={e => setUpdateEnd(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="filter-actions">
          <div className="page-actions ucq-filter-buttons">
            <button type="button" className="btn btn-primary" onClick={handleQuery}>查询</button>
            <button type="button" className="btn btn-default" onClick={handleReset}>重置</button>
          </div>
        </div>
      </section>

      {dateError && <div className="ucq-error-tip">{dateError}</div>}

      <section className="table-section">
        <div className="table-wrapper">
          <table className="data-table ucq-table">
            <colgroup>
              <col className="ucq-col-index" />
              <col className="ucq-col-name" />
              <col className="ucq-col-provider" />
              <col className="ucq-col-source" />
              <col className="ucq-col-time" />
              <col className="ucq-col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>序号</th>
                <th>资源名称</th>
                <th>资源持有方</th>
                <th>目录来源</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr className="ucq-empty-row">
                  <td colSpan={6}>暂无数据</td>
                </tr>
              ) : (
                pagedRows.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{(safePage - 1) * pageSize + idx + 1}</td>
                    <td className="ucq-cell-ellipsis" title={item.name}>{item.name}</td>
                    <td className="ucq-cell-ellipsis" title={item.provider}>{item.provider}</td>
                    <td>{item.source.join('、')}</td>
                    <td>{item.updateTime}</td>
                    <td className="action-cell">
                      <button type="button" className="text-link" onClick={() => setViewRecord(item)}>查看</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <div className="pagination-info">共{filtered.length}条记录</div>
          <div className="pagination-controls">
            <button type="button" className="page-btn" disabled={safePage === 1} onClick={() => setPage(1)}>首页</button>
            <button type="button" className="page-btn" disabled={safePage === 1} onClick={() => setPage(Math.max(1, safePage - 1))}>上一页</button>
            {renderPageNumbers().map((p, i) => p === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={'page-number' + (safePage === p ? ' active' : '')}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button type="button" className="page-btn" disabled={safePage === totalPages} onClick={() => setPage(Math.min(totalPages, safePage + 1))}>下一页</button>
            <button type="button" className="page-btn" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>末页</button>
            <select
              className="page-size-select"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
            </select>
            <span className="jump-to">跳至</span>
            <input
              type="text"
              className="page-input"
              value={safePage}
              onChange={e => {
                const n = Number(e.target.value);
                if (!Number.isFinite(n)) return;
                setPage(Math.min(totalPages, Math.max(1, Math.trunc(n))));
              }}
            />
            <span className="jump-to">页</span>
          </div>
        </div>
      </section>

      {viewRecord && (
        <div className="ucq-modal-overlay" onClick={() => setViewRecord(null)}>
          <div className="ucq-modal" onClick={e => e.stopPropagation()}>
            <div className="ucq-modal-head">
              <h3>目录详情</h3>
              <button type="button" className="ucq-modal-close" aria-label="关闭" onClick={() => setViewRecord(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="ucq-modal-body">
              <div className="ucq-info-grid">
                <span>资源名称</span><b>{viewRecord.name}</b>
                <span>资源持有方</span><b>{viewRecord.provider}</b>
                <span>目录来源</span><b>{viewRecord.source.join('、')}</b>
                <span>所属领域</span><b>{viewRecord.domain}</b>
                <span>更新时间</span><b>{viewRecord.updateTime}</b>
                <span>目录描述</span><b className="ucq-cell-multiline">{viewRecord.description}</b>
              </div>
            </div>
            <div className="ucq-modal-foot">
              <button type="button" className="btn btn-default" onClick={() => setViewRecord(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const Component = () => <PasswordGuard><OriginalComponent /></PasswordGuard>;
export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}

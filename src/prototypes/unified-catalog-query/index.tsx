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
  reviewStatus?: string;
  mountStatus?: string;
}

const SEED_RECORDS: CatalogRecord[] = [
  { id: 1, name: '221', provider: '湖南省卫生健康委统计信息中心', source: ['授权运营平台'], domain: '卫生健康', description: '医院基础信息登记数据，包含机构名称、等级、地址等基础属性。', updateTime: '2026-08-25 09:43:01' },
  { id: 2, name: '测试0321-5', provider: '湖南省卫生健康委统计信息中心', source: ['授权运营平台', '政务信息资源'], domain: '卫生健康', description: '公共卫生应急资源数据，用于疾控和应急指挥场景。', updateTime: '2026-08-21 16:50:01' },
  { id: 3, name: '测试0321-3', provider: '湖南省卫生健康委统计信息中心', source: ['政务信息资源'], domain: '卫生健康', description: '基层医疗机构人员花名册数据。', updateTime: '2026-08-21 16:09:01' },
  { id: 4, name: '测试0321-1', provider: '湖南省卫生健康委统计信息中心', source: ['授权运营平台'], domain: '卫生健康', description: '处方流转与药品使用情况统计数据。', updateTime: '2026-08-21 15:25:03' },
  { id: 5, name: '测试武源0321-1', provider: '天融机构交通局', source: ['授权运营平台'], domain: '交通运输', description: '城市公共交通线路与车辆基础信息数据。', updateTime: '2026-08-21 14:40:01' },
  { id: 6, name: '长沙市开福区金融资源0729-4', provider: '长沙市开福区金融服务中心·工会委员会', source: ['授权运营平台'], domain: '金融服务', description: '区域金融机构名录及行业分类数据。', updateTime: '2026-07-29 17:27:01' },
];

// 信息项（与「数据资源目录」列表查看弹窗使用的结构一致）
type InfoItem = { english: string; name: string; type: string; length: string; desc: string };

// 审核流程演示数据（与「数据资源目录」列表查看弹窗一致）
const auditFlowRows = [
  { node: '首次登记', nodeStatus: '已完成', org: '湖南省数据产业集团', operator: '张三', time: '2026-07-07 15:30:25', result: '', opinion: '' },
  { node: '审核', nodeStatus: '已完成', org: '区域节点', operator: '管理员', time: '2026-07-07 15:42:10', result: '审核通过', opinion: '' },
  { node: '变更登记', nodeStatus: '已完成', org: '湖南省数据产业集团', operator: '张三', time: '2026-07-07 15:45:33', result: '', opinion: '' },
  { node: '审核', nodeStatus: '已完成', org: '区域节点', operator: '管理员', time: '2026-07-07 15:48:02', result: '审核通过', opinion: '1' },
  { node: '撤销登记', nodeStatus: '已完成', org: '湖南省数据产业集团', operator: '张三', time: '2026-07-07 15:51:47', result: '', opinion: '' },
  { node: '审核', nodeStatus: '已完成', org: '区域节点', operator: '管理员', time: '2026-07-07 15:53:19', result: '审核通过', opinion: '1' },
];

type DetailTab = 'basic' | 'items' | 'gov' | 'audit';

// 目录详情查看弹窗：结构/展示逻辑与「数据资源目录」列表查看弹窗完全一致。
// Tab 根据目录来源动态渲染：
//   仅含「授权运营平台」            → [基本信息, 审核信息]
//   仅含「政务信息资源」            → [政务信息资源]
//   同时含「授权运营平台+政务信息资源」→ [基本信息, 政务信息资源, 审核信息]
const ResourceDetailModal = ({ item, onClose }: { item: CatalogRecord; onClose: () => void }) => {
  const hasAuth = item.source.includes('授权运营平台');
  const hasGov = item.source.includes('政务信息资源');
  const showBasic = hasAuth;
  const showGov = hasGov;
  const showAudit = hasAuth; // 审核信息随「授权运营平台」来源出现
  const showProofBtn = hasAuth; // 查看存证随「授权运营平台」来源出现；仅含「政务信息资源」时隐藏
  const [activeTab, setActiveTab] = useState<DetailTab>(hasAuth ? 'basic' : 'gov');
  const [showProof, setShowProof] = useState(false);

  const infoItems: InfoItem[] = [
    { english: 'menzhen', name: '门诊号', type: '字符型', length: '100', desc: '' },
    { english: 'shengao', name: '身高', type: '数值型', length: '100', desc: '' },
  ];
  const blank = (value?: string) => value?.trim() || '-';

  const infoItemsSection = (
    <section className="detail-section" aria-labelledby="info-item-title">
      <h4 id="info-item-title">信息项</h4>
      <table className="detail-readonly-table detail-info-type"><tbody><tr><th>信息项数据类型</th><td>结构化数据</td></tr></tbody></table>
      <div className="detail-info-table-wrap">
        <table className="detail-info-table">
          <thead><tr><th>序号</th><th>信息项英文名</th><th>信息项名称</th><th>数据类型</th><th>数据长度</th><th>信息项说明</th></tr></thead>
          <tbody>{infoItems.length ? infoItems.map((row, idx) => <tr key={row.english}><td>{idx + 1}</td><td>{blank(row.english)}</td><td>{blank(row.name)}</td><td>{blank(row.type)}</td><td>{blank(row.length)}</td><td>{blank(row.desc)}</td></tr>) : <tr><td colSpan={6} className="detail-empty">暂无信息项数据</td></tr>}</tbody>
        </table>
      </div>
      <div className="detail-pagination" aria-label="信息项分页预留区"><span>共 {infoItems.length} 条记录</span><span>第 1 / 1 页</span></div>
    </section>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="catalog-modal resource-detail-modal" onClick={event => event.stopPropagation()}>
        <div className="modal-head"><h3>数据资源详情</h3><button type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
        <div className="detail-tabs" role="tablist" aria-label="数据资源详情页签">
          {showBasic && (
            <button type="button" role="tab" aria-selected={activeTab === 'basic'} className={activeTab === 'basic' ? 'active' : ''} onClick={() => setActiveTab('basic')}>基本信息</button>
          )}
          {/* 「信息项」页签已隐藏：其内容并入「基本信息」页签，展示在「资源持有方信息」下方。按钮与切换逻辑保留（仅 display:none），与数据资源目录保持结构一致 */}
          <button type="button" role="tab" aria-selected={activeTab === 'items'} className={activeTab === 'items' ? 'active' : ''} onClick={() => setActiveTab('items')} style={{ display: 'none' }}>信息项</button>
          {showGov && (
            <button type="button" role="tab" aria-selected={activeTab === 'gov'} className={activeTab === 'gov' ? 'active' : ''} onClick={() => setActiveTab('gov')}>政务信息资源</button>
          )}
          {showAudit && (
            <button type="button" role="tab" aria-selected={activeTab === 'audit'} className={activeTab === 'audit' ? 'active' : ''} onClick={() => setActiveTab('audit')}>审核信息</button>
          )}
          {showProofBtn && (
            <div className="detail-tabs-actions">
              <button type="button" className="btn primary" onClick={() => setShowProof(true)}>查看存证</button>
            </div>
          )}
        </div>
        <div className="modal-body resource-detail-body">
          {activeTab === 'basic' ? (
            <>
              <section className="detail-section" aria-labelledby="basic-info-title">
                <h4 id="basic-info-title">基本信息</h4>
                <table className="detail-readonly-table"><tbody>
                  <tr><th>资源名称</th><td>{blank(item.name)}</td><th>数据资源标识码</th><td>712430000MB0L04692743002W3CAD81M</td></tr>
                  <tr><th>行业分类</th><td>{blank(item.domain)}</td><th>是否涉及个人信息</th><td>否</td></tr>
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
              {infoItemsSection}
            </>
          ) : activeTab === 'gov' ? (
            <>
              <section className="detail-section" aria-labelledby="gov-basic-title">
                <h4 id="gov-basic-title">基本信息</h4>
                <table className="detail-readonly-table"><tbody>
                  <tr><th>资源名称</th><td>{blank(item.name)}</td><th>资源格式</th><td>xls</td></tr>
                  <tr><th>更新频率</th><td>每日</td><th>覆盖时间范围</th><td>2026-5-24 — 至今</td></tr>
                  <tr><th>地域分类</th><td>湖南省</td><th>资源摘要</th><td>基础数据资源，用于支撑公共卫生服务、医疗机构管理及相关业务分析。</td></tr>
                </tbody></table>
              </section>
              <section className="detail-section" aria-labelledby="gov-info-title">
                <h4 id="gov-info-title">信息项</h4>
                <div className="detail-info-table-wrap">
                  <table className="detail-info-table">
                    <thead><tr><th>序号</th><th>信息项英文名</th><th>信息项名称</th><th>数据类型</th><th>数据长度</th></tr></thead>
                    <tbody>{infoItems.length ? infoItems.map((row, idx) => <tr key={row.english}><td>{idx + 1}</td><td>{blank(row.english)}</td><td>{blank(row.name)}</td><td>{blank(row.type)}</td><td>{blank(row.length)}</td></tr>) : <tr><td colSpan={5} className="detail-empty">暂无信息项数据</td></tr>}</tbody>
                  </table>
                </div>
                <div className="detail-pagination" aria-label="信息项分页预留区"><span>共 {infoItems.length} 条记录</span><span>第 1 / 1 页</span></div>
              </section>
            </>
          ) : activeTab === 'items' ? (
            infoItemsSection
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

const ProofModal = ({ item, onClose }: { item: CatalogRecord; onClose: () => void }) => (
  <div className="modal-overlay nested-overlay" onClick={onClose}>
    <div className="catalog-modal proof-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-head"><h3>区块链存证</h3><button onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
      <div className="modal-body">
        <div className="proof-box">
          <div><b>存证编号</b><span>BC-20260824-000128</span></div>
          <div><b>上链时间</b><span>{item.updateTime}</span></div>
          <div><b>区块高度</b><span>18,426,901</span></div>
          <div><b>交易哈希</b><span className="hash">0x9f0d...e82a</span></div>
        </div>
      </div>
      <div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button></div>
    </div>
  </div>
);

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

      {viewRecord && <ResourceDetailModal item={viewRecord} onClose={() => setViewRecord(null)} />}
    </Layout>
  );
};

const Component = () => <PasswordGuard><OriginalComponent /></PasswordGuard>;
export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}

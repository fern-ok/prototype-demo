/**
 * @name 数据资源初审
 * @mode axure
 *
 * 数据资源初审列表，支持待处理和已处理两个TAB页，分配给实施机构角色
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import Layout from '../../common/Layout';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

interface ResourceRecord {
  id: number;
  authName: string;
  initiator: string;
  resourceCatalog: string;
  createTime: string;
  updateTime: string;
  reviewStatus: string;
  reviewResult?: string;
  reviewOpinion?: string;
  reviewer?: string;
  reviewTime?: string;
}

const INITIATORS = ['实施机构', '运营机构'];
const PROCESSED_STATUSES = ['初审不通过', '待复审', '复审不通过', '复审通过'];
const REVIEW_RESULTS = ['初审通过', '初审不通过'];

const seedData: ResourceRecord[] = [
  // 待初审
  {
    id: 1,
    authName: '杭州市医保数据授权使用申请单',
    initiator: '实施机构',
    resourceCatalog: '医保结算数据;门诊诊疗记录',
    createTime: '2026-08-03 09:15:20',
    updateTime: '2026-08-03 09:15:20',
    reviewStatus: '待初审'
  },
  {
    id: 2,
    authName: '交通出行数据资源授权申请',
    initiator: '运营机构',
    resourceCatalog: '城市交通流量数据;公共交通刷卡记录',
    createTime: '2026-08-02 14:30:10',
    updateTime: '2026-08-02 14:30:10',
    reviewStatus: '待初审'
  },
  {
    id: 3,
    authName: '生态环境监测数据资源申请',
    initiator: '运营机构',
    resourceCatalog: '空气质量监测数据;水质检测数据;土壤污染数据',
    createTime: '2026-08-01 16:45:00',
    updateTime: '2026-08-01 16:45:00',
    reviewStatus: '待初审'
  },
  {
    id: 4,
    authName: '企业信用信息授权使用申请',
    initiator: '实施机构',
    resourceCatalog: '企业工商登记数据;税务缴纳记录',
    createTime: '2026-08-01 11:10:22',
    updateTime: '2026-08-01 11:10:22',
    reviewStatus: '待初审'
  },
  // 初审不通过
  {
    id: 5,
    authName: '社保业务数据授权使用申请',
    initiator: '实施机构',
    resourceCatalog: '社保缴纳记录;参保人员信息',
    createTime: '2026-07-28 09:30:00',
    updateTime: '2026-07-30 14:20:15',
    reviewStatus: '初审不通过',
    reviewResult: '初审不通过',
    reviewOpinion: '资源目录范围不明确，需补充数据使用场景说明。',
    reviewer: '张初审员',
    reviewTime: '2026-07-30 14:20:15'
  },
  // 待复审
  {
    id: 6,
    authName: '城市感知数据资源授权申请',
    initiator: '运营机构',
    resourceCatalog: '物联感知数据;视频监控数据',
    createTime: '2026-07-25 10:15:30',
    updateTime: '2026-07-29 11:30:45',
    reviewStatus: '待复审',
    reviewResult: '初审通过',
    reviewOpinion: '材料齐全，资源目录清晰，同意进入复审。',
    reviewer: '李初审员',
    reviewTime: '2026-07-29 11:30:45'
  },
  // 复审不通过
  {
    id: 7,
    authName: '公共安全数据授权使用申请',
    initiator: '实施机构',
    resourceCatalog: '公积金缴存数据;贷款记录',
    createTime: '2026-07-20 14:00:00',
    updateTime: '2026-07-28 09:45:30',
    reviewStatus: '复审不通过',
    reviewResult: '初审通过',
    reviewOpinion: '初审通过，数据使用范围合理。',
    reviewer: '张初审员',
    reviewTime: '2026-07-24 15:10:20'
  },
  // 复审通过
  {
    id: 8,
    authName: '市场监管数据授权使用申请',
    initiator: '实施机构',
    resourceCatalog: '企业行政处罚数据;经营异常名录',
    createTime: '2026-07-15 09:00:00',
    updateTime: '2026-07-21 14:50:25',
    reviewStatus: '复审通过',
    reviewResult: '初审通过',
    reviewOpinion: '初审通过。',
    reviewer: '张初审员',
    reviewTime: '2026-07-18 11:20:30'
  },
  {
    id: 9,
    authName: '不动产登记数据资源授权申请',
    initiator: '运营机构',
    resourceCatalog: '不动产登记信息;交易价格数据',
    createTime: '2026-07-10 13:45:00',
    updateTime: '2026-07-19 10:30:15',
    reviewStatus: '复审通过',
    reviewResult: '初审通过',
    reviewOpinion: '初审通过，资源授权范围明确。',
    reviewer: '李初审员',
    reviewTime: '2026-07-15 09:40:50'
  }
];

const OriginalComponent = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');
  const [role, setRole] = useState('实施机构');
  const [activeMenu] = useState<'data-resource-review'>('data-resource-review');
  const pendingTabRef = useRef<HTMLDivElement>(null);
  const processedTabRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [barStyle, setBarStyle] = useState({ width: 42, transform: 'translateX(0px)' });

  useEffect(() => {
    const tabRef = activeTab === 'pending' ? pendingTabRef : processedTabRef;
    if (tabRef.current && navRef.current) {
      const tab = tabRef.current;
      const nav = navRef.current;
      const tabRect = tab.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      const width = tabRect.width;
      const left = tabRect.left - navRect.left;
      setBarStyle({ width: Math.round(width), transform: `translateX(${Math.round(left)}px)` });
    }
  }, [activeTab]);

  const [records, setRecords] = useState<ResourceRecord[]>(seedData);

  // Pending tab filters
  const [searchName, setSearchName] = useState('');
  const [searchInitiator, setSearchInitiator] = useState('');
  const [searchCatalog, setSearchCatalog] = useState('');
  const [searchCreateStart, setSearchCreateStart] = useState('');
  const [searchCreateEnd, setSearchCreateEnd] = useState('');
  const [searchUpdateStart, setSearchUpdateStart] = useState('');
  const [searchUpdateEnd, setSearchUpdateEnd] = useState('');

  // Processed tab filters
  const [pSearchName, setPSearchName] = useState('');
  const [pSearchInitiator, setPSearchInitiator] = useState('');
  const [pSearchCatalog, setPSearchCatalog] = useState('');
  const [pSearchStatus, setPSearchStatus] = useState('');
  const [pSearchCreateStart, setPSearchCreateStart] = useState('');
  const [pSearchCreateEnd, setPSearchCreateEnd] = useState('');
  const [pSearchUpdateStart, setPSearchUpdateStart] = useState('');
  const [pSearchUpdateEnd, setPSearchUpdateEnd] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ResourceRecord | null>(null);
  const [reviewForm, setReviewForm] = useState({ reviewResult: '', reviewOpinion: '' });
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});

  const pendingRecords = useMemo(() => records.filter(r => r.reviewStatus === '待初审'), [records]);
  const processedRecords = useMemo(() => records.filter(r => r.reviewStatus !== '待初审'), [records]);

  const filteredPending = useMemo(() => {
    return pendingRecords.filter(r => {
      if (searchName && !r.authName.includes(searchName)) return false;
      if (searchInitiator && r.initiator !== searchInitiator) return false;
      if (searchCatalog && !r.resourceCatalog.includes(searchCatalog)) return false;
      if (searchCreateStart && r.createTime < searchCreateStart) return false;
      if (searchCreateEnd && r.createTime > searchCreateEnd + ' 23:59:59') return false;
      if (searchUpdateStart && r.updateTime < searchUpdateStart) return false;
      if (searchUpdateEnd && r.updateTime > searchUpdateEnd + ' 23:59:59') return false;
      return true;
    }).sort((a, b) => b.createTime.localeCompare(a.createTime));
  }, [pendingRecords, searchName, searchInitiator, searchCatalog, searchCreateStart, searchCreateEnd, searchUpdateStart, searchUpdateEnd]);

  const filteredProcessed = useMemo(() => {
    return processedRecords.filter(r => {
      if (pSearchName && !r.authName.includes(pSearchName)) return false;
      if (pSearchInitiator && r.initiator !== pSearchInitiator) return false;
      if (pSearchCatalog && !r.resourceCatalog.includes(pSearchCatalog)) return false;
      if (pSearchStatus && r.reviewStatus !== pSearchStatus) return false;
      if (pSearchCreateStart && r.createTime < pSearchCreateStart) return false;
      if (pSearchCreateEnd && r.createTime > pSearchCreateEnd + ' 23:59:59') return false;
      if (pSearchUpdateStart && r.updateTime < pSearchUpdateStart) return false;
      if (pSearchUpdateEnd && r.updateTime > pSearchUpdateEnd + ' 23:59:59') return false;
      return true;
    }).sort((a, b) => b.updateTime.localeCompare(a.updateTime));
  }, [processedRecords, pSearchName, pSearchInitiator, pSearchCatalog, pSearchStatus, pSearchCreateStart, pSearchCreateEnd, pSearchUpdateStart, pSearchUpdateEnd]);

  const currentList = activeTab === 'pending' ? filteredPending : filteredProcessed;
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
  const paginatedList = currentList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleTabSwitch = (tab: 'pending' | 'processed') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setPageSize(10);
  };

  const handlePendingReset = () => {
    setSearchName('');
    setSearchInitiator('');
    setSearchCatalog('');
    setSearchCreateStart('');
    setSearchCreateEnd('');
    setSearchUpdateStart('');
    setSearchUpdateEnd('');
    setCurrentPage(1);
  };

  const handleProcessedReset = () => {
    setPSearchName('');
    setPSearchInitiator('');
    setPSearchCatalog('');
    setPSearchStatus('');
    setPSearchCreateStart('');
    setPSearchCreateEnd('');
    setPSearchUpdateStart('');
    setPSearchUpdateEnd('');
    setCurrentPage(1);
  };

  const handleReview = (record: ResourceRecord) => {
    setCurrentRecord(record);
    setReviewForm({ reviewResult: '', reviewOpinion: '' });
    setReviewErrors({});
    setShowReviewModal(true);
  };

  const handleView = (record: ResourceRecord) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  const handleReviewSubmit = () => {
    const errors: Record<string, string> = {};
    if (!reviewForm.reviewResult) errors.reviewResult = '请选择初审结果';
    if (Object.keys(errors).length > 0) {
      setReviewErrors(errors);
      return;
    }

    const finalStatus = reviewForm.reviewResult === '初审通过' ? '待复审' : '初审不通过';
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const reviewTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    setRecords(prev => prev.map(r => r.id === currentRecord!.id ? {
      ...r,
      reviewStatus: finalStatus,
      reviewResult: reviewForm.reviewResult,
      reviewOpinion: reviewForm.reviewOpinion,
      reviewer: role,
      reviewTime,
      updateTime: reviewTime
    } : r));

    setShowReviewModal(false);
    setCurrentRecord(null);
  };

  const getStatusClass = (status: string) => {
    if (status === '待初审') return 'status-pending';
    if (status === '待复审') return 'status-reviewing';
    if (status === '复审通过') return 'status-approved';
    return 'status-rejected';
  };

  const renderCatalog = (catalog: string) => {
    const items = catalog.split(';').filter(Boolean);
    if (items.length <= 1) return <span>{catalog}</span>;
    return (
      <div className="multi-value">
        {items.map((item, i) => (
          <span key={i} className="multi-value-tag">{item}</span>
        ))}
      </div>
    );
  };

  const renderPendingFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        <div className="filter-item">
          <label>资源授权单名称</label>
          <input type="text" placeholder="请输入" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>授权发起方</label>
          <select value={searchInitiator} onChange={(e) => setSearchInitiator(e.target.value)}>
            <option value="">请选择</option>
            {INITIATORS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>数据资源目录</label>
          <input type="text" placeholder="请输入" value={searchCatalog} onChange={(e) => setSearchCatalog(e.target.value)} />
        </div>
        <div className="filter-item date-range">
          <label>创建时间</label>
          <div className="date-inputs">
            <div className="date-input"><input type="date" value={searchCreateStart} onChange={(e) => setSearchCreateStart(e.target.value)} /></div>
            <span className="date-separator">-</span>
            <div className="date-input"><input type="date" value={searchCreateEnd} onChange={(e) => setSearchCreateEnd(e.target.value)} /></div>
          </div>
        </div>
      </div>
      <div className="filter-row">
        <div className="filter-item date-range">
          <label>更新时间</label>
          <div className="date-inputs">
            <div className="date-input"><input type="date" value={searchUpdateStart} onChange={(e) => setSearchUpdateStart(e.target.value)} /></div>
            <span className="date-separator">-</span>
            <div className="date-input"><input type="date" value={searchUpdateEnd} onChange={(e) => setSearchUpdateEnd(e.target.value)} /></div>
          </div>
        </div>
      </div>
      <div className="filter-actions">
        <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage(1)}>搜索</button>
        <button className="btn btn-default btn-sm" onClick={handlePendingReset}>清空</button>
      </div>
    </div>
  );

  const renderProcessedFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        <div className="filter-item">
          <label>资源授权单名称</label>
          <input type="text" placeholder="请输入" value={pSearchName} onChange={(e) => setPSearchName(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>授权发起方</label>
          <select value={pSearchInitiator} onChange={(e) => setPSearchInitiator(e.target.value)}>
            <option value="">请选择</option>
            {INITIATORS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>数据资源目录</label>
          <input type="text" placeholder="请输入" value={pSearchCatalog} onChange={(e) => setPSearchCatalog(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>审核状态</label>
          <select value={pSearchStatus} onChange={(e) => setPSearchStatus(e.target.value)}>
            <option value="">请选择</option>
            {PROCESSED_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="filter-row">
        <div className="filter-item date-range">
          <label>创建时间</label>
          <div className="date-inputs">
            <div className="date-input"><input type="date" value={pSearchCreateStart} onChange={(e) => setPSearchCreateStart(e.target.value)} /></div>
            <span className="date-separator">-</span>
            <div className="date-input"><input type="date" value={pSearchCreateEnd} onChange={(e) => setPSearchCreateEnd(e.target.value)} /></div>
          </div>
        </div>
        <div className="filter-item date-range">
          <label>更新时间</label>
          <div className="date-inputs">
            <div className="date-input"><input type="date" value={pSearchUpdateStart} onChange={(e) => setPSearchUpdateStart(e.target.value)} /></div>
            <span className="date-separator">-</span>
            <div className="date-input"><input type="date" value={pSearchUpdateEnd} onChange={(e) => setPSearchUpdateEnd(e.target.value)} /></div>
          </div>
        </div>
      </div>
      <div className="filter-actions">
        <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage(1)}>搜索</button>
        <button className="btn btn-default btn-sm" onClick={handleProcessedReset}>清空</button>
      </div>
    </div>
  );

  const renderTable = () => (
    <div className="table-section">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-index">序号</th>
              <th className="col-auth-name">资源授权单名称</th>
              <th className="col-initiator">授权发起方</th>
              <th className="col-catalog">数据资源目录</th>
              {activeTab === 'processed' && <th className="col-status">审核状态</th>}
              <th className="col-create-time">创建时间</th>
              <th className="col-update-time">更新时间</th>
              <th className="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={activeTab === 'processed' ? 8 : 7} className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  暂无数据
                </td>
              </tr>
            ) : (
              paginatedList.map((record, index) => (
                <tr key={record.id}>
                  <td className="col-index">{(currentPage - 1) * pageSize + index + 1}</td>
                  <td className="col-auth-name" title={record.authName}>{record.authName}</td>
                  <td className="col-initiator">{record.initiator}</td>
                  <td className="col-catalog">{renderCatalog(record.resourceCatalog)}</td>
                  {activeTab === 'processed' && (
                    <td className="col-status">
                      <span className={'status-tag ' + getStatusClass(record.reviewStatus)}>{record.reviewStatus}</span>
                    </td>
                  )}
                  <td className="col-create-time">{record.createTime}</td>
                  <td className="col-update-time">{record.updateTime}</td>
                  <td className="col-action">
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                      {activeTab === 'pending' && (
                        <button className="action-btn" onClick={() => handleReview(record)}>初审</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="pagination-info">共{currentList.length}条记录</div>
        <div className="pagination-controls">
          <button className="page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>上一页</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((page, idx, arr) => (
              <span key={page} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ color: '#999' }}>...</span>}
                <button className={'page-number' + (page === currentPage ? ' active' : '')} onClick={() => setCurrentPage(page)}>{page}</button>
              </span>
            ))}
          <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>下一页</button>
          <select className="page-size-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10 条/页</option>
            <option value={20}>20 条/页</option>
            <option value={50}>50 条/页</option>
          </select>
          <span className="jump-to">跳至</span>
          <input className="page-input" type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= totalPages) setCurrentPage(v); }} />
          <span className="jump-to">页</span>
        </div>
      </div>
    </div>
  );

  const renderReviewModal = () => (
    <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
      <div className="modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>初审办理</h3>
          <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-item">
            <label>资源授权单名称</label>
            <input type="text" value={currentRecord?.authName || ''} disabled />
          </div>
          <div className="form-item">
            <label>初审结果 <span className="required">*</span></label>
            <select
              value={reviewForm.reviewResult}
              onChange={(e) => {
                setReviewForm(prev => ({ ...prev, reviewResult: e.target.value }));
                if (reviewErrors.reviewResult) setReviewErrors({});
              }}
              className={reviewErrors.reviewResult ? 'has-error' : ''}
            >
              <option value="">请选择</option>
              {REVIEW_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {reviewErrors.reviewResult && <span className="error-text">{reviewErrors.reviewResult}</span>}
          </div>
          <div className="form-item">
            <label>初审意见</label>
            <textarea
              rows={4}
              placeholder="请输入初审意见"
              value={reviewForm.reviewOpinion}
              onChange={(e) => setReviewForm(prev => ({ ...prev, reviewOpinion: e.target.value }))}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowReviewModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleReviewSubmit}>确定</button>
        </div>
      </div>
    </div>
  );

  const renderViewModal = () => (
    <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
      <div className="modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>查看详情</h3>
          <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="section-title"><span className="title-bar"></span>基本信息</div>
          <div className="view-info-grid">
            <div className="info-row">
              <div className="info-label">资源授权单名称</div>
              <div className="info-value">{currentRecord?.authName}</div>
            </div>
            <div className="info-row">
              <div className="info-label">授权发起方</div>
              <div className="info-value">{currentRecord?.initiator}</div>
            </div>
            <div className="info-row">
              <div className="info-label">数据资源目录</div>
              <div className="info-value">{currentRecord?.resourceCatalog.split(';').join('、')}</div>
            </div>
            <div className="info-row">
              <div className="info-label">审核状态</div>
              <div className="info-value">
                <span className={'status-tag ' + getStatusClass(currentRecord?.reviewStatus || '')}>{currentRecord?.reviewStatus}</span>
              </div>
            </div>
            <div className="info-row">
              <div className="info-label">创建时间</div>
              <div className="info-value">{currentRecord?.createTime}</div>
            </div>
            <div className="info-row">
              <div className="info-label">更新时间</div>
              <div className="info-value">{currentRecord?.updateTime}</div>
            </div>
          </div>

          {currentRecord?.reviewResult && (
            <>
              <div className="section-title"><span className="title-bar"></span>初审信息</div>
              <div className="view-info-grid">
                <div className="info-row">
                  <div className="info-label">初审结果</div>
                  <div className="info-value">{currentRecord.reviewResult}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">初审人</div>
                  <div className="info-value">{currentRecord.reviewer}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">初审时间</div>
                  <div className="info-value">{currentRecord.reviewTime}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">初审意见</div>
                  <div className="info-value">{currentRecord.reviewOpinion || '—'}</div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowViewModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout
      activeMenu={activeMenu}
      breadcrumb="数据资源初审"
      role={role}
      onRoleChange={setRole}
      roleOptions={['实施机构']}
      title="数据资源初审"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      {activeTab === 'pending' ? renderPendingFilter() : renderProcessedFilter()}

      <div className="tabs-section">
        <div className="tabs-header">
          <div className="tabs-nav" ref={navRef}>
            <div className="tabs-active-bar" style={{ width: barStyle.width, transform: barStyle.transform }}></div>
            <div
              className={'tab-item' + (activeTab === 'pending' ? ' is-active' : '')}
              ref={pendingTabRef}
              onClick={() => handleTabSwitch('pending')}
              role="tab"
              aria-selected={activeTab === 'pending'}
              tabIndex={0}
            >待处理</div>
            <div
              className={'tab-item' + (activeTab === 'processed' ? ' is-active' : '')}
              ref={processedTabRef}
              onClick={() => handleTabSwitch('processed')}
              role="tab"
              aria-selected={activeTab === 'processed'}
              tabIndex={-1}
            >已处理</div>
          </div>
        </div>
      </div>

      {renderTable()}

      {showReviewModal && renderReviewModal()}
      {showViewModal && renderViewModal()}
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

/**
 * @name 数据资源授权
 * @mode axure
 *
 * 数据资源授权列表（发起方视角），分配给实施机构角色
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import Layout from '../../common/Layout';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

interface AuthRecord {
  id: number;
  authName: string;
  resourceCatalog: string;
  reviewStatus: string;
  createTime: string;
  updateTime: string;
  initiator: string;
  unitName: string;
  reviewResult?: string;
  reviewOpinion?: string;
  reviewer?: string;
  reviewTime?: string;
  recheckResult?: string;
  recheckOpinion?: string;
  recheckReviewer?: string;
  recheckTime?: string;
  evidenceHash?: string;
  evidenceTime?: string;
}

interface AuthRecordItem {
  id: number;
  resourceName: string;
  industry: string;
  initiator: string;
  authTime: string;
}

const STATUSES = ['待初审', '初审不通过', '待复审', '复审不通过', '复审通过'];

const authRecordSeed: AuthRecordItem[] = [
  { id: 1, resourceName: '湖南省医疗就诊数据', industry: '医疗健康', initiator: '实施机构', authTime: '2026-06-15 14:20:00' },
  { id: 2, resourceName: '湖南省道路监控数据', industry: '交通运输', initiator: '运营机构', authTime: '2026-06-14 10:30:00' },
  { id: 3, resourceName: '湖南省健康档案数据', industry: '医疗健康', initiator: '实施机构', authTime: '2026-06-13 16:45:00' },
  { id: 4, resourceName: '湖南省交通流量数据', industry: '交通运输', initiator: '运营机构', authTime: '2026-06-12 09:15:00' },
  { id: 5, resourceName: '湖南省公共卫生数据', industry: '医疗健康', initiator: '实施机构', authTime: '2026-06-11 11:50:00' },
  { id: 6, resourceName: '湖南省教育统计数据', industry: '教育', initiator: '运营机构', authTime: '2026-06-10 15:25:00' },
  { id: 7, resourceName: '湖南省土地利用数据', industry: '自然资源', initiator: '实施机构', authTime: '2026-06-09 13:40:00' },
  { id: 8, resourceName: '湖南省旅游客流数据', industry: '文化旅游', initiator: '运营机构', authTime: '2026-06-08 08:55:00' },
  { id: 9, resourceName: '湖南省矿产资源数据', industry: '自然资源', initiator: '实施机构', authTime: '2026-06-07 17:10:00' },
  { id: 10, resourceName: '湖南省学生信息数据', industry: '教育', initiator: '运营机构', authTime: '2026-06-06 12:30:00' }
];

const seedData: AuthRecord[] = [
  {
    id: 1,
    authName: '杭州市医保数据授权使用申请单',
    resourceCatalog: '医保结算数据;门诊诊疗记录',
    reviewStatus: '待初审',
    createTime: '2026-08-04 09:15:20',
    updateTime: '2026-08-04 09:15:20',
    initiator: '实施机构',
    unitName: '杭州医保智能科技有限公司'
  },
  {
    id: 2,
    authName: '交通出行数据资源授权申请',
    resourceCatalog: '城市交通流量数据;公共交通刷卡记录',
    reviewStatus: '初审不通过',
    createTime: '2026-08-02 14:30:10',
    updateTime: '2026-08-03 10:20:15',
    initiator: '实施机构',
    unitName: '杭州交通数据有限公司',
    reviewResult: '初审不通过',
    reviewOpinion: '资源目录范围不明确，需补充数据使用场景说明。',
    reviewer: '张初审员',
    reviewTime: '2026-08-03 10:20:15'
  },
  {
    id: 3,
    authName: '教育质量评估数据授权单',
    resourceCatalog: '学生成绩数据;教师评估数据',
    reviewStatus: '待复审',
    createTime: '2026-08-02 10:20:35',
    updateTime: '2026-08-04 14:30:00',
    initiator: '实施机构',
    unitName: '杭州教育评估中心',
    reviewResult: '初审通过',
    reviewOpinion: '初审通过，材料完整。',
    reviewer: '李初审员',
    reviewTime: '2026-08-04 14:30:00'
  },
  {
    id: 4,
    authName: '企业信用信息授权使用申请',
    resourceCatalog: '企业工商登记数据;税务缴纳记录',
    reviewStatus: '复审不通过',
    createTime: '2026-07-28 11:10:22',
    updateTime: '2026-08-01 16:45:30',
    initiator: '实施机构',
    unitName: '杭州企业服务有限公司',
    reviewResult: '初审通过',
    reviewOpinion: '初审通过，数据使用范围合理。',
    reviewer: '张初审员',
    reviewTime: '2026-07-30 15:10:20',
    recheckResult: '复审不通过',
    recheckOpinion: '数据安全评估不达标，需补充数据安全防护方案。',
    recheckReviewer: '王复审员',
    recheckTime: '2026-08-01 16:45:30'
  },
  {
    id: 5,
    authName: '住房公积金数据资源授权申请',
    resourceCatalog: '公积金缴存数据;贷款记录',
    reviewStatus: '复审通过',
    createTime: '2026-07-18 11:20:00',
    updateTime: '2026-07-26 16:30:10',
    initiator: '实施机构',
    unitName: '杭州住房公积金管理中心',
    reviewResult: '初审通过',
    reviewOpinion: '初审通过，材料完整，数据安全措施到位。',
    reviewer: '李初审员',
    reviewTime: '2026-07-22 10:15:40',
    recheckResult: '复审通过',
    recheckOpinion: '复审通过，授权范围明确，安全措施完善。',
    recheckReviewer: '王复审员',
    recheckTime: '2026-07-26 16:30:10',
    evidenceHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    evidenceTime: '2026-07-26 16:30:10'
  },
  {
    id: 6,
    authName: '市场监管数据授权使用申请',
    resourceCatalog: '企业行政处罚数据;经营异常名录',
    reviewStatus: '复审通过',
    createTime: '2026-07-15 09:00:00',
    updateTime: '2026-07-21 14:50:25',
    initiator: '实施机构',
    unitName: '杭州市场监管服务有限公司',
    reviewResult: '初审通过',
    reviewer: '张初审员',
    reviewTime: '2026-07-18 11:20:30',
    recheckResult: '复审通过',
    recheckReviewer: '陈复审员',
    recheckTime: '2026-07-21 14:50:25',
    evidenceHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    evidenceTime: '2026-07-21 14:50:25'
  },
  {
    id: 7,
    authName: '生态环境监测数据资源申请',
    resourceCatalog: '空气质量监测数据;水质检测数据;土壤污染数据',
    reviewStatus: '初审不通过',
    createTime: '2026-07-25 16:45:00',
    updateTime: '2026-07-31 09:10:00',
    initiator: '实施机构',
    unitName: '杭州生态环境科技有限公司',
    reviewResult: '初审不通过',
    reviewOpinion: '数据安全等级说明不准确，需重新评估安全等级。',
    reviewer: '李初审员',
    reviewTime: '2026-07-31 09:10:00'
  }
];

const OriginalComponent = () => {
  const [activeTab] = useState<'list'>('list');
  const [role, setRole] = useState('实施机构');
  const [activeMenu] = useState<'data-resource-auth'>('data-resource-auth');

  const [records, setRecords] = useState<AuthRecord[]>(seedData);

  // Filter state
  const [searchName, setSearchName] = useState('');
  const [searchCatalog, setSearchCatalog] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchCreateStart, setSearchCreateStart] = useState('');
  const [searchCreateEnd, setSearchCreateEnd] = useState('');
  const [searchUpdateStart, setSearchUpdateStart] = useState('');
  const [searchUpdateEnd, setSearchUpdateEnd] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AuthRecord | null>(null);
  const [editForm, setEditForm] = useState({ authName: '', resourceCatalog: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState({ authName: '', resourceCatalog: '' });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Auth record modal state
  const [authSearchResourceName, setAuthSearchResourceName] = useState('');
  const [authSearchInitiator, setAuthSearchInitiator] = useState('');
  const [authSearchTimeStart, setAuthSearchTimeStart] = useState('');
  const [authSearchTimeEnd, setAuthSearchTimeEnd] = useState('');
  const [authCurrentPage, setAuthCurrentPage] = useState(1);
  const [authPageSize, setAuthPageSize] = useState(10);

  const filteredList = useMemo(() => {
    return records.filter(r => {
      if (searchName && !r.authName.includes(searchName)) return false;
      if (searchCatalog && !r.resourceCatalog.includes(searchCatalog)) return false;
      if (searchStatus && r.reviewStatus !== searchStatus) return false;
      if (searchCreateStart && r.createTime < searchCreateStart) return false;
      if (searchCreateEnd && r.createTime > searchCreateEnd + ' 23:59:59') return false;
      if (searchUpdateStart && r.updateTime < searchUpdateStart) return false;
      if (searchUpdateEnd && r.updateTime > searchUpdateEnd + ' 23:59:59') return false;
      return true;
    }).sort((a, b) => b.createTime.localeCompare(a.createTime));
  }, [records, searchName, searchCatalog, searchStatus, searchCreateStart, searchCreateEnd, searchUpdateStart, searchUpdateEnd]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleReset = () => {
    setSearchName('');
    setSearchCatalog('');
    setSearchStatus('');
    setSearchCreateStart('');
    setSearchCreateEnd('');
    setSearchUpdateStart('');
    setSearchUpdateEnd('');
    setCurrentPage(1);
  };

  const filteredAuthRecords = useMemo(() => {
    return authRecordSeed
      .filter(item => {
        if (authSearchResourceName && !item.resourceName.includes(authSearchResourceName)) return false;
        if (authSearchInitiator && item.initiator !== authSearchInitiator) return false;
        if (authSearchTimeStart && item.authTime < authSearchTimeStart) return false;
        if (authSearchTimeEnd && item.authTime > authSearchTimeEnd + ' 23:59:59') return false;
        return true;
      })
      .sort((a, b) => b.authTime.localeCompare(a.authTime));
  }, [authSearchResourceName, authSearchInitiator, authSearchTimeStart, authSearchTimeEnd]);

  const authTotalPages = Math.max(1, Math.ceil(filteredAuthRecords.length / authPageSize));
  const safeAuthPage = Math.min(authCurrentPage, authTotalPages);
  const paginatedAuthRecords = filteredAuthRecords.slice((safeAuthPage - 1) * authPageSize, safeAuthPage * authPageSize);

  const handleAuthRecordReset = () => {
    setAuthSearchResourceName('');
    setAuthSearchInitiator('');
    setAuthSearchTimeStart('');
    setAuthSearchTimeEnd('');
    setAuthCurrentPage(1);
  };

  const handleView = (record: AuthRecord) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  const handleEdit = (record: AuthRecord) => {
    setCurrentRecord(record);
    setEditForm({ authName: record.authName, resourceCatalog: record.resourceCatalog });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    const errors: Record<string, string> = {};
    if (!editForm.authName.trim()) errors.authName = '请输入资源授权单名称';
    if (!editForm.resourceCatalog.trim()) errors.resourceCatalog = '请输入数据资源目录';
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const updateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    setRecords(prev => prev.map(r => r.id === currentRecord!.id ? {
      ...r,
      authName: editForm.authName,
      resourceCatalog: editForm.resourceCatalog,
      reviewStatus: '待初审',
      reviewResult: undefined,
      reviewOpinion: undefined,
      reviewer: undefined,
      reviewTime: undefined,
      recheckResult: undefined,
      recheckOpinion: undefined,
      recheckReviewer: undefined,
      recheckTime: undefined,
      updateTime
    } : r));

    setShowEditModal(false);
    setCurrentRecord(null);
  };

  const handleEvidence = (record: AuthRecord) => {
    setCurrentRecord(record);
    setShowEvidenceModal(true);
  };

  const handleCreate = () => {
    setCreateForm({ authName: '', resourceCatalog: '' });
    setCreateErrors({});
    setShowCreateModal(true);
  };

  const handleCreateSubmit = () => {
    const errors: Record<string, string> = {};
    if (!createForm.authName.trim()) errors.authName = '请输入资源授权单名称';
    if (!createForm.resourceCatalog.trim()) errors.resourceCatalog = '请输入数据资源目录';
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const newId = Math.max(...records.map(r => r.id)) + 1;

    const newRecord: AuthRecord = {
      id: newId,
      authName: createForm.authName,
      resourceCatalog: createForm.resourceCatalog,
      reviewStatus: '待初审',
      createTime: time,
      updateTime: time,
      initiator: '实施机构',
      unitName: '杭州公共数据资源授权运营管理平台'
    };

    setRecords(prev => [newRecord, ...prev]);
    setShowCreateModal(false);
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

  const getActionButtons = (record: AuthRecord) => {
    const buttons: string[] = ['查看'];
    if (record.reviewStatus === '初审不通过' || record.reviewStatus === '复审不通过') {
      buttons.push('编辑');
    }
    if (record.reviewStatus === '复审通过') {
      buttons.push('查看存证');
    }
    return buttons;
  };

  const renderFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        <div className="filter-item">
          <label>资源授权单名称</label>
          <input type="text" placeholder="请输入" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>数据资源目录</label>
          <input type="text" placeholder="请输入" value={searchCatalog} onChange={(e) => setSearchCatalog(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>审核状态</label>
          <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
            <option value="">请选择</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
      <div className="filter-actions" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage(1)}>搜索</button>
          <button className="btn btn-default btn-sm" onClick={handleReset}>清空</button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-default btn-sm" onClick={() => setShowRecordModal(true)}>授权记录</button>
          <button className="btn btn-primary btn-sm" style={{ background: '#0f63f4', borderColor: '#0f63f4' }} onClick={handleCreate}>+ 数据资源授权</button>
        </div>
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
              <th className="col-catalog">数据资源目录</th>
              <th className="col-status">审核状态</th>
              <th className="col-create-time">创建时间</th>
              <th className="col-update-time">更新时间</th>
              <th className="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  暂无数据
                </td>
              </tr>
            ) : (
              paginatedList.map((record, index) => {
                const actions = getActionButtons(record);
                return (
                  <tr key={record.id}>
                    <td className="col-index">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="col-auth-name" title={record.authName}>{record.authName}</td>
                    <td className="col-catalog">{renderCatalog(record.resourceCatalog)}</td>
                    <td className="col-status">
                      <span className={'status-tag ' + getStatusClass(record.reviewStatus)}>{record.reviewStatus}</span>
                    </td>
                    <td className="col-create-time">{record.createTime}</td>
                    <td className="col-update-time">{record.updateTime}</td>
                    <td className="col-action">
                      <div className="action-buttons">
                        {actions.map(action => (
                          <button
                            key={action}
                            className="action-btn"
                            onClick={() => {
                              if (action === '查看') handleView(record);
                              else if (action === '编辑') handleEdit(record);
                              else if (action === '查看存证') handleEvidence(record);
                            }}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="pagination-info">共{filteredList.length}条记录</div>
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

          {currentRecord?.recheckResult && (
            <>
              <div className="section-title"><span className="title-bar"></span>复审信息</div>
              <div className="view-info-grid">
                <div className="info-row">
                  <div className="info-label">复审结果</div>
                  <div className="info-value">{currentRecord.recheckResult}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">复审人</div>
                  <div className="info-value">{currentRecord.recheckReviewer}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">复审时间</div>
                  <div className="info-value">{currentRecord.recheckTime}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">复审意见</div>
                  <div className="info-value">{currentRecord.recheckOpinion || '—'}</div>
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

  const renderEditModal = () => (
    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
      <div className="modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>编辑资源授权单</h3>
          <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-item">
            <label>资源授权单名称 <span className="required">*</span></label>
            <input
              type="text"
              value={editForm.authName}
              onChange={(e) => setEditForm(prev => ({ ...prev, authName: e.target.value }))}
              className={editErrors.authName ? 'has-error' : ''}
            />
            {editErrors.authName && <span className="error-text">{editErrors.authName}</span>}
          </div>
          <div className="form-item">
            <label>数据资源目录 <span className="required">*</span></label>
            <textarea
              rows={3}
              placeholder="请输入数据资源目录，多个用分号分隔"
              value={editForm.resourceCatalog}
              onChange={(e) => setEditForm(prev => ({ ...prev, resourceCatalog: e.target.value }))}
              className={editErrors.resourceCatalog ? 'has-error' : ''}
            />
            {editErrors.resourceCatalog && <span className="error-text">{editErrors.resourceCatalog}</span>}
          </div>
          <div style={{ margin: '12px 0', padding: '10px 12px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '4px', color: '#d46b08', fontSize: '12px' }}>
            <strong>提示：</strong>编辑提交后，单据将重新进入【待初审】状态。
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowEditModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleEditSubmit}>提交</button>
        </div>
      </div>
    </div>
  );

  const renderEvidenceModal = () => (
    <div className="modal-overlay" onClick={() => setShowEvidenceModal(false)}>
      <div className="modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>区块链存证信息</h3>
          <button className="modal-close" onClick={() => setShowEvidenceModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="view-info-grid">
            <div className="info-row">
              <div className="info-label">资源授权单名称</div>
              <div className="info-value">{currentRecord?.authName}</div>
            </div>
            <div className="info-row">
              <div className="info-label">存证状态</div>
              <div className="info-value"><span className="status-tag status-approved">已上链</span></div>
            </div>
            <div className="info-row">
              <div className="info-label">区块链网络</div>
              <div className="info-value">公共数据资源授权链</div>
            </div>
            <div className="info-row">
              <div className="info-label">区块高度</div>
              <div className="info-value">#{Math.floor(Math.random() * 1000000) + 500000}</div>
            </div>
            <div className="info-row">
              <div className="info-label">交易哈希</div>
              <div className="info-value" style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>{currentRecord?.evidenceHash || '0x' + 'a'.repeat(64)}</div>
            </div>
            <div className="info-row">
              <div className="info-label">存证时间</div>
              <div className="info-value">{currentRecord?.evidenceTime || currentRecord?.updateTime}</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: '#f5f7fb', borderRadius: '4px', color: '#4b5563', fontSize: '12px', lineHeight: '1.6' }}>
            <strong>存证说明：</strong>本次资源授权已通过区块链网络完成存证，授权信息、审核记录、操作日志均已写入不可篡改的分布式账本。存证哈希可在区块链浏览器中查询验证。
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowEvidenceModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  const renderRecordModal = () => (
    <div className="modal-overlay" onClick={() => setShowRecordModal(false)}>
      <div className="modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>授权记录</h3>
          <button className="modal-close" onClick={() => setShowRecordModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="record-filter">
            <div className="filter-row">
              <div className="filter-item">
                <label>资源名称</label>
                <input type="text" placeholder="请输入" value={authSearchResourceName} onChange={(e) => setAuthSearchResourceName(e.target.value)} />
              </div>
              <div className="filter-item filter-item-select">
                <label>授权发起方</label>
                <select value={authSearchInitiator} onChange={(e) => setAuthSearchInitiator(e.target.value)}>
                  <option value="">请选择</option>
                  <option value="实施机构">实施机构</option>
                  <option value="运营机构">运营机构</option>
                </select>
              </div>
              <div className="filter-item date-range">
                <label>授权时间</label>
                <div className="date-inputs">
                  <div className="date-input"><input type="date" value={authSearchTimeStart} onChange={(e) => setAuthSearchTimeStart(e.target.value)} /></div>
                  <span className="date-separator">-</span>
                  <div className="date-input"><input type="date" value={authSearchTimeEnd} onChange={(e) => setAuthSearchTimeEnd(e.target.value)} /></div>
                </div>
              </div>
            </div>
            <div className="filter-actions">
              <div>
                <button className="btn btn-primary btn-sm" onClick={() => { /* trigger re-render */ }}>查询</button>
                <button className="btn btn-default btn-sm" onClick={handleAuthRecordReset}>重置</button>
              </div>
            </div>
          </div>
          <div className="record-table-section">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-index">序号</th>
                  <th>资源名称</th>
                  <th>行业分类</th>
                  <th>授权发起方</th>
                  <th>授权时间</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAuthRecords.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="col-index">{(safeAuthPage - 1) * authPageSize + idx + 1}</td>
                    <td>{item.resourceName}</td>
                    <td>{item.industry}</td>
                    <td>{item.initiator}</td>
                    <td>{item.authTime}</td>
                  </tr>
                ))}
                {filteredAuthRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="pagination">
              <div className="pagination-info">共 {filteredAuthRecords.length} 条记录</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled={safeAuthPage === 1} onClick={() => setAuthCurrentPage(safeAuthPage - 1)}>上一页</button>
                {Array.from({ length: authTotalPages }, (_, index) => index + 1)
                  .filter(p => p === 1 || p === authTotalPages || Math.abs(p - safeAuthPage) <= 1)
                  .map((page, idx, arr) => (
                    <span key={page} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ color: '#999' }}>...</span>}
                      <button className={'page-number' + (page === safeAuthPage ? ' active' : '')} onClick={() => setAuthCurrentPage(page)}>{page}</button>
                    </span>
                  ))}
                <button className="page-btn" disabled={safeAuthPage >= authTotalPages} onClick={() => setAuthCurrentPage(safeAuthPage + 1)}>下一页</button>
                <select className="page-size-select" value={authPageSize} onChange={(e) => { setAuthPageSize(Number(e.target.value)); setAuthCurrentPage(1); }}>
                  <option value={10}>10 条/页</option>
                  <option value={20}>20 条/页</option>
                  <option value={50}>50 条/页</option>
                </select>
                <span className="jump-to">跳至</span>
                <input type="number" className="page-input" min={1} max={authTotalPages} value={safeAuthPage} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= authTotalPages) setAuthCurrentPage(v); }} />
                <span className="jump-to">页</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowRecordModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  const renderCreateModal = () => (
    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
      <div className="modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>新增数据资源授权</h3>
          <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-item">
            <label>资源授权单名称 <span className="required">*</span></label>
            <input
              type="text"
              placeholder="请输入资源授权单名称"
              value={createForm.authName}
              onChange={(e) => setCreateForm(prev => ({ ...prev, authName: e.target.value }))}
              className={createErrors.authName ? 'has-error' : ''}
            />
            {createErrors.authName && <span className="error-text">{createErrors.authName}</span>}
          </div>
          <div className="form-item">
            <label>数据资源目录 <span className="required">*</span></label>
            <textarea
              rows={3}
              placeholder="请输入数据资源目录，多个用分号分隔"
              value={createForm.resourceCatalog}
              onChange={(e) => setCreateForm(prev => ({ ...prev, resourceCatalog: e.target.value }))}
              className={createErrors.resourceCatalog ? 'has-error' : ''}
            />
            {createErrors.resourceCatalog && <span className="error-text">{createErrors.resourceCatalog}</span>}
          </div>
          <div style={{ margin: '12px 0', padding: '10px 12px', background: '#e9f1ff', border: '1px solid #bfdbfe', borderRadius: '4px', color: '#1e40af', fontSize: '12px' }}>
            <strong>说明：</strong>提交后单据将进入【待初审】状态，由运营机构进行初审。
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowCreateModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleCreateSubmit}>提交</button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout
      activeMenu={activeMenu}
      breadcrumb="数据资源授权"
      role={role}
      onRoleChange={setRole}
      roleOptions={['实施机构']}
      title="数据资源授权"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      {renderFilter()}
      {renderTable()}

      {showViewModal && renderViewModal()}
      {showEditModal && renderEditModal()}
      {showEvidenceModal && renderEvidenceModal()}
      {showRecordModal && renderRecordModal()}
      {showCreateModal && renderCreateModal()}
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

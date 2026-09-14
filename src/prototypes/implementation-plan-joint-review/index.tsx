/**
 * @name 实施方案联审
 * @mode axure
 *
 * 公共数据资源授权运营管理平台 · 备案管理 · 实施方案联审
 * 实施机构角色：提交实施方案并查看省级联审状态与区块链存证
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Paperclip } from 'lucide-react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';
import '../../common/backend-list.css';

interface PlanReviewRecord {
  id: number;
  authType: string;
  domain: string;
  planFile: string;
  createTime: string;
  auditStatus: string;
  auditTime: string;
}

interface PlanReviewForm {
  authType: string;
  domain: string;
  planFile: string;
}

const AUTH_TYPE_OPTIONS = ['整体授权运营', '分领域授权运营'];
const DOMAIN_OPTIONS = ['卫生健康', '交通运输', '教育', '文化旅游', '自然资源'];
const VIEW_EVIDENCE_STATUSES = ['省级审核通过'];

/** 审核状态标签配色：不通过/退回=红，通过=绿，其余=蓝 */
const getStatusClass = (status: string) => {
  if (status.includes('不通过') || status.includes('退回')) return 'status-rejected';
  if (status.includes('通过')) return 'status-approved';
  return 'status-pending';
};

const planReviewSeed: PlanReviewRecord[] = [
  {
    id: 1,
    authType: '分领域授权运营',
    domain: '卫生健康',
    planFile: '实施方案.pdf',
    createTime: '2026-06-04 09:27:35',
    auditStatus: '省级审核通过',
    auditTime: '2026-06-04 09:28:27'
  }
];

const createEmptyForm = (): PlanReviewForm => ({ authType: '', domain: '', planFile: '' });

const OriginalComponent = () => {
  const [role, setRole] = useState('实施机构');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<PlanReviewRecord | null>(null);

  const [formData, setFormData] = useState<PlanReviewForm>(createEmptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const total = planReviewSeed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = planReviewSeed.slice((safePage - 1) * pageSize, safePage * pageSize);

  const hasViewEvidence = (record: PlanReviewRecord) => VIEW_EVIDENCE_STATUSES.includes(record.auditStatus);

  const handleAdd = () => {
    setFormData(createEmptyForm());
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleView = (record: PlanReviewRecord) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  const handleViewEvidence = (record: PlanReviewRecord) => {
    setCurrentRecord(record);
    setShowEvidenceModal(true);
  };

  const handleFormChange = (field: keyof PlanReviewForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFormChange('planFile', file.name);
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!formData.authType) errors.authType = '请选择授权运营类型';
    if (!formData.domain) errors.domain = '请输入领域名称';
    if (!formData.planFile) errors.planFile = '请上传实施方案文件';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setShowAddModal(false);
    alert('提交成功');
  };

  const renderAddModal = () => (
    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="modal-medium" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>实施方案联审</h3>
          <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <h4 className="section-title"><span className="title-bar"></span>基本信息</h4>
          <div className="plan-form">
            <div className="plan-form-item">
              <label>授权运营类型 <span className="required">*</span></label>
              <select
                value={formData.authType}
                onChange={(e) => handleFormChange('authType', e.target.value)}
                className={formErrors.authType ? 'has-error' : ''}
              >
                <option value="">请选择</option>
                {AUTH_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {formErrors.authType && <span className="error-text">{formErrors.authType}</span>}
            </div>
            <div className="plan-form-item">
              <label>领域名称 <span className="required">*</span></label>
              <select
                value={formData.domain}
                onChange={(e) => handleFormChange('domain', e.target.value)}
                className={formErrors.domain ? 'has-error' : ''}
              >
                <option value="">请选择</option>
                {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {formErrors.domain && <span className="error-text">{formErrors.domain}</span>}
            </div>
            <div className="plan-form-item">
              <label>实施方案 <span className="required">*</span></label>
              <div className="plan-upload">
                <label className="btn btn-sm btn-default plan-upload-btn">
                  上传实施方案
                  <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
                <span className={'plan-upload-name' + (formData.planFile ? '' : ' empty')}>
                  {formData.planFile || '支持 PDF 格式，大小不超过 50MB'}
                </span>
              </div>
              {formErrors.planFile && <span className="error-text">{formErrors.planFile}</span>}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowAddModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>提交</button>
        </div>
      </div>
    </div>
  );

  const renderViewModal = () => currentRecord && (
    <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
      <div className="modal-large" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>查看</h3>
          <div className="modal-header-actions">
            {hasViewEvidence(currentRecord) && (
              <button className="btn btn-primary btn-sm" onClick={() => { setShowViewModal(false); setShowEvidenceModal(true); }}>查看存证</button>
            )}
            <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
          </div>
        </div>
        <div className="modal-body">
          <h4 className="section-title"><span className="title-bar"></span>基本信息</h4>
          <div className="view-info-grid">
            <div className="info-label">授权运营类型</div>
            <div className="info-value">{currentRecord.authType}</div>
            <div className="info-label">领域名称</div>
            <div className="info-value">{currentRecord.domain}</div>
            <div className="info-label">实施方案</div>
            <div className="info-value">
              <a href="#" className="plan-file-link" onClick={(e) => { e.preventDefault(); alert('预览：' + currentRecord.planFile); }}>
                <Paperclip size={12} aria-hidden="true" />
                <span>{currentRecord.planFile}</span>
              </a>
            </div>
            <div className="info-label">创建时间</div>
            <div className="info-value">{currentRecord.createTime}</div>
            <div className="info-label">审核状态</div>
            <div className="info-value">
              <span className={'status-tag ' + getStatusClass(currentRecord.auditStatus)}>{currentRecord.auditStatus}</span>
            </div>
            <div className="info-label">审核时间</div>
            <div className="info-value">{currentRecord.auditTime || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEvidenceModal = () => currentRecord && (
    <div className="modal-overlay" onClick={() => setShowEvidenceModal(false)}>
      <div className="modal-medium" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>区块链存证凭证</h3>
          <button className="modal-close" onClick={() => setShowEvidenceModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="evidence-card">
            <div className="evidence-header">
              <div className="evidence-icon">证</div>
              <div className="evidence-title">实施方案联审电子凭证</div>
            </div>
            <div className="evidence-content">
              <div className="evidence-row"><span className="evidence-label">凭证编号：</span><span className="evidence-value">BLOCK-PLAN-{currentRecord.id.toString().padStart(8, '0')}</span></div>
              <div className="evidence-row"><span className="evidence-label">授权运营类型：</span><span className="evidence-value">{currentRecord.authType}</span></div>
              <div className="evidence-row"><span className="evidence-label">领域名称：</span><span className="evidence-value">{currentRecord.domain}</span></div>
              <div className="evidence-row"><span className="evidence-label">实施方案：</span><span className="evidence-value">{currentRecord.planFile}</span></div>
              <div className="evidence-row"><span className="evidence-label">审核状态：</span><span className="evidence-value">{currentRecord.auditStatus}</span></div>
              <div className="evidence-row"><span className="evidence-label">审核时间：</span><span className="evidence-value">{currentRecord.auditTime || '-'}</span></div>
              <div className="evidence-row"><span className="evidence-label">存证状态：</span><span className="evidence-value success">已确认</span></div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowEvidenceModal(false)}>关闭</button>
          <button className="btn btn-primary" onClick={() => alert('凭证下载功能')}>下载凭证</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Layout
        activeMenu="implementation-plan-joint-review"
        breadcrumb="实施方案联审"
        role={role}
        onRoleChange={setRole}
        roleOptions={['实施机构']}
        specContent={specContent}
        changeLogContent={changeLogContent}
      >
        <div className="plan-review-toolbar">
          <h1 className="plan-review-toolbar-title">实施方案联审</h1>
        </div>

        <div className="plan-review-actions">
          <button className="btn btn-primary" onClick={handleAdd}>+ 实施方案联审</button>
        </div>

        <p className="plan-review-notice">已在湘办通平台完成实施方案联审的，无需再次联审，请直接发起“实施方案备案”。</p>

        <div className="table-section plan-review-table">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-index">序号</th>
                  <th className="col-auth-type">授权运营类型</th>
                  <th className="col-domain">领域名称</th>
                  <th className="col-plan">实施方案</th>
                  <th className="col-time">创建时间</th>
                  <th className="col-status">审核状态</th>
                  <th className="col-time">审核时间</th>
                  <th className="col-action">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record, index) => (
                  <tr key={record.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>{record.authType}</td>
                    <td>{record.domain}</td>
                    <td>
                      <a href="#" className="plan-file-link" onClick={(e) => { e.preventDefault(); alert('预览：' + record.planFile); }}>
                        <Paperclip size={12} aria-hidden="true" />
                        <span>{record.planFile}</span>
                      </a>
                    </td>
                    <td className="time-cell">{record.createTime}</td>
                    <td><span className={'status-tag ' + getStatusClass(record.auditStatus)}>{record.auditStatus}</span></td>
                    <td className="time-cell">{record.auditTime || '-'}</td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                        <span className="action-divider" aria-hidden="true"></span>
                        {hasViewEvidence(record)
                          ? <button className="action-btn" onClick={() => handleViewEvidence(record)}>查看存证</button>
                          : <span className="action-disabled">查看存证</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-row">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="pagination-info">共{total}条记录</span>
            <div className="pagination-controls">
              <button className="page-btn page-arrow" aria-label="上一页" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)}>
                <ChevronLeft size={14} aria-hidden="true" />
              </button>
              <span className="page-number">{safePage}</span>
              <button className="page-btn page-arrow" aria-label="下一页" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>
                <ChevronRight size={14} aria-hidden="true" />
              </button>
              <select className="page-size-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
              <span className="jump-to">跳至</span>
              <input
                type="number"
                className="page-input"
                min={1}
                max={totalPages}
                value={safePage}
                onChange={(e) => { const value = Number(e.target.value); if (value >= 1 && value <= totalPages) setCurrentPage(value); }}
              />
              <span className="jump-to">页</span>
            </div>
          </div>
        </div>
      </Layout>

      {showAddModal && renderAddModal()}
      {showViewModal && renderViewModal()}
      {showEvidenceModal && renderEvidenceModal()}
    </>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}

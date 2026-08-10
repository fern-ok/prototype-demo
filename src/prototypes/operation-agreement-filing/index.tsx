/**
 * @name 运营协议备案
 * @mode axure
 *
 * 运营协议备案页面，支持运营机构、实施机构、数据管理部门三种角色视图
 */

import { useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

interface AuditHistoryItem {
  id: number;
  node: string;
  status: string;
  org: string;
  handler: string;
  time: string;
  result: string;
  opinion: string;
}

interface OperationAgreement {
  id: number;
  region: string;
  authType: string;
  domain: string;
  agreement: string;
  implOrg: string;
  opOrg: string;
  creditCode: string;
  legalHandler: string;
  createTime: string;
  status: string;
  filingTime: string;
  rejectReason?: string;
  startDate?: string;
  endDate?: string;
  remark?: string;
}

interface AgreementFormData {
  opOrg: string;
  agreement: string;
  agreementFileName: string;
  startDate: string;
  endDate: string;
  remark: string;
}

const STATUS_OPTIONS = ['已备案', '待省级确认', '省级退回'];
const AUTH_TYPE_OPTIONS = ['整体授权运营', '分领域授权运营'];
const REGION_OPTIONS = ['长沙市', '省本级', '株洲市', '岳阳市'];
const DOMAIN_OPTIONS = ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源'];
const OP_ORG_NAME = '湖南数据产业集团有限公司';
const OP_ORG_CREDIT_CODE = '91430100MA4L3Q1234';

const agreementSeed: OperationAgreement[] = [
  {
    id: 1,
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '医疗健康',
    agreement: '湖南省医疗健康运营协议_V1.0.pdf',
    implOrg: '卫健委',
    opOrg: OP_ORG_NAME,
    creditCode: OP_ORG_CREDIT_CODE,
    legalHandler: '张三',
    createTime: '2026-05-18 10:05:57',
    status: '已备案',
    filingTime: '2026-05-18 15:30:10',
    startDate: '2026-05-01',
    endDate: '2027-04-30',
    remark: '医疗健康领域数据运营协议，涵盖全省医疗机构就诊数据和健康档案数据。'
  },
  {
    id: 2,
    region: '省本级',
    authType: '分领域授权运营',
    domain: '交通运输',
    agreement: '湖南省交通运输运营协议_V1.2.pdf',
    implOrg: '交通厅',
    opOrg: OP_ORG_NAME,
    creditCode: OP_ORG_CREDIT_CODE,
    legalHandler: '李四',
    createTime: '2026-06-01 09:30:22',
    status: '待省级确认',
    filingTime: '2026-06-01 09:30:22',
    startDate: '2026-06-01',
    endDate: '2027-05-31',
    remark: '交通运输领域数据运营协议，涵盖道路监控和交通流量数据。'
  },
  {
    id: 3,
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '教育',
    agreement: '湖南省教育运营协议_V1.0.pdf',
    implOrg: '教育厅',
    opOrg: OP_ORG_NAME,
    creditCode: OP_ORG_CREDIT_CODE,
    legalHandler: '王五',
    createTime: '2026-06-05 14:20:15',
    status: '省级退回',
    filingTime: '2026-06-06 08:45:33',
    rejectReason: '协议中数据使用权限范围描述不明确，请补充详细的数据使用范围和限制条款。',
    startDate: '2026-06-01',
    endDate: '2027-05-31',
    remark: '教育领域数据运营协议。'
  },
  {
    id: 4,
    region: '省本级',
    authType: '整体授权运营',
    domain: '文化旅游',
    agreement: '湖南省文化旅游运营协议_V2.0.pdf',
    implOrg: '文旅厅',
    opOrg: OP_ORG_NAME,
    creditCode: OP_ORG_CREDIT_CODE,
    legalHandler: '赵六',
    createTime: '2026-06-10 11:15:28',
    status: '待省级确认',
    filingTime: '2026-06-10 16:42:10',
    startDate: '2026-06-10',
    endDate: '2028-06-09',
    remark: '文化旅游领域整体运营协议，涵盖旅游客流和文化资源数据。'
  },
  {
    id: 5,
    region: '岳阳市',
    authType: '分领域授权运营',
    domain: '自然资源',
    agreement: '湖南省自然资源运营协议_V1.0.pdf',
    implOrg: '自然资源厅',
    opOrg: OP_ORG_NAME,
    creditCode: OP_ORG_CREDIT_CODE,
    legalHandler: '孙七',
    createTime: '2026-06-15 13:50:44',
    status: '已备案',
    filingTime: '2026-06-16 09:28:17',
    startDate: '2026-06-15',
    endDate: '2027-06-14',
    remark: '自然资源领域数据运营协议，涵盖土地利用和矿产资源数据。'
  }
];

const buildAuditHistory = (record: OperationAgreement): AuditHistoryItem[] => {
  const base: AuditHistoryItem[] = [
    {
      id: 1,
      node: '提交备案',
      status: '已完成',
      org: record.opOrg,
      handler: record.legalHandler,
      time: record.createTime,
      result: '-',
      opinion: '-'
    }
  ];
  base.push({
    id: 2,
    node: '实施机构确认备案',
    status: '已完成',
    org: record.implOrg,
    handler: '李某',
    time: record.createTime,
    result: '审核通过',
    opinion: '同意'
  });
  if (record.status === '已备案') {
    base.push({
      id: 3,
      node: '省级确认备案',
      status: '已完成',
      org: '数据局',
      handler: 'A',
      time: record.filingTime,
      result: '审核通过',
      opinion: '同意'
    });
  }
  if (record.status === '省级退回') {
    base.push({
      id: 3,
      node: '省级退回备案',
      status: '已完成',
      org: '数据局',
      handler: 'A',
      time: record.filingTime,
      result: '退回',
      opinion: record.rejectReason || '需要补充材料'
    });
  }
  if (record.status === '待省级确认') {
    base.push({
      id: 3,
      node: '省级确认备案',
      status: '进行中',
      org: '数据局',
      handler: '-',
      time: '-',
      result: '-',
      opinion: '-'
    });
  }
  return base;
};

const createEmptyForm = (): AgreementFormData => ({
  opOrg: OP_ORG_NAME,
  agreement: '',
  agreementFileName: '',
  startDate: '',
  endDate: '',
  remark: ''
});

const OriginalComponent = () => {
  // 筛选状态（运营机构/实施机构）
  const [searchStatus, setSearchStatus] = useState('');
  const [searchOrg, setSearchOrg] = useState('');
  // 筛选状态（数据管理部门）
  const [searchRegion, setSearchRegion] = useState('');
  const [searchAuthType, setSearchAuthType] = useState('');
  const [searchDomain, setSearchDomain] = useState('');
  const [searchAgreement, setSearchAgreement] = useState('');
  const [searchImplOrg, setSearchImplOrg] = useState('');
  const [searchOpOrg, setSearchOpOrg] = useState('');
  const [searchCreateTimeStart, setSearchCreateTimeStart] = useState('');
  const [searchCreateTimeEnd, setSearchCreateTimeEnd] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<OperationAgreement | null>(null);
  const [viewTab, setViewTab] = useState<'apply' | 'audit'>('apply');
  const [formData, setFormData] = useState<AgreementFormData>(createEmptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState<'edit' | 'change'>('edit');
  const [selectedRole, setSelectedRole] = useState('实施机构');

  // 确认弹窗状态
  const [confirmResult, setConfirmResult] = useState('');
  const [confirmOpinion, setConfirmOpinion] = useState('');
  const [confirmErrors, setConfirmErrors] = useState<Record<string, string>>({});

  const isImplRole = selectedRole === '实施机构';
  const isDeptRole = selectedRole === '数据管理部门';

  const filteredRecords = useMemo(() => {
    return agreementSeed.filter(record => {
      if (searchStatus && record.status !== searchStatus) return false;
      if (searchOrg && !record.opOrg.includes(searchOrg)) return false;
      if (searchRegion && record.region !== searchRegion) return false;
      if (searchAuthType && record.authType !== searchAuthType) return false;
      if (searchDomain && record.domain !== searchDomain) return false;
      if (searchAgreement && !record.agreement.includes(searchAgreement)) return false;
      if (searchImplOrg && !record.implOrg.includes(searchImplOrg)) return false;
      if (searchOpOrg && !record.opOrg.includes(searchOpOrg)) return false;
      if (searchCreateTimeStart && record.createTime < searchCreateTimeStart) return false;
      if (searchCreateTimeEnd && record.createTime > searchCreateTimeEnd + ' 23:59:59') return false;
      return true;
    });
  }, [searchStatus, searchOrg, searchRegion, searchAuthType, searchDomain, searchAgreement, searchImplOrg, searchOpOrg, searchCreateTimeStart, searchCreateTimeEnd]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getStatusClass = (status: string) => {
    if (status === '已备案') return 'status-approved';
    if (status === '省级退回') return 'status-province-rejected';
    return 'status-pending';
  };

  // 操作按钮权限规则
  // 实施机构：已备案→查看、查看存证、变更；待省级确认→查看；省级退回→查看、编辑（拥有运营协议备案功能）
  // 运营机构：仅查看
  // 数据管理部门：待省级确认→查看、确认；已备案→查看、查看存证；省级退回→查看
  const hasViewEvidence = (record: OperationAgreement) => record.status === '已备案';
  const hasChange = (record: OperationAgreement) => isImplRole && record.status === '已备案';
  const hasEdit = (record: OperationAgreement) => isImplRole && record.status === '省级退回';
  const hasConfirm = (record: OperationAgreement) => isDeptRole && record.status === '待省级确认';
  const canAdd = isImplRole;

  const handleReset = () => {
    setSearchStatus('');
    setSearchOrg('');
    setSearchRegion('');
    setSearchAuthType('');
    setSearchDomain('');
    setSearchAgreement('');
    setSearchImplOrg('');
    setSearchOpOrg('');
    setSearchCreateTimeStart('');
    setSearchCreateTimeEnd('');
    setCurrentPage(1);
  };

  const closeFormModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowChangeModal(false);
  };

  const handleAdd = () => {
    setFormData(createEmptyForm());
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEdit = (record: OperationAgreement) => {
    setCurrentRecord(record);
    setEditMode('edit');
    setFormData({
      opOrg: record.opOrg,
      agreement: record.agreement,
      agreementFileName: record.agreement,
      startDate: record.startDate || '',
      endDate: record.endDate || '',
      remark: record.remark || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleChange = (record: OperationAgreement) => {
    setCurrentRecord(record);
    setEditMode('change');
    setFormData({
      opOrg: record.opOrg,
      agreement: record.agreement,
      agreementFileName: record.agreement,
      startDate: record.startDate || '',
      endDate: record.endDate || '',
      remark: record.remark || ''
    });
    setFormErrors({});
    setShowChangeModal(true);
  };

  const handleView = (record: OperationAgreement) => {
    setCurrentRecord(record);
    setViewTab('apply');
    setShowViewModal(true);
  };

  const handleViewEvidence = (record: OperationAgreement) => {
    setCurrentRecord(record);
    setShowEvidenceModal(true);
  };

  const handleConfirm = (record: OperationAgreement) => {
    setCurrentRecord(record);
    setConfirmResult('');
    setConfirmOpinion('');
    setConfirmErrors({});
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    const errors: Record<string, string> = {};
    if (!confirmResult) errors.confirmResult = '请选择确认结果';
    setConfirmErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setShowConfirmModal(false);
    alert('确认' + (confirmResult === '备案通过' ? '通过' : '退回') + '提交成功');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        agreement: file.name,
        agreementFileName: file.name
      }));
      if (formErrors.agreement) {
        setFormErrors(prev => {
          const next = { ...prev };
          delete next.agreement;
          return next;
        });
      }
    }
  };

  const handleFormChange = (field: keyof AgreementFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.agreementFileName) errors.agreement = '请上传运营协议文件';
    if (!formData.startDate) errors.startDate = '请选择授权开始日期';
    if (!formData.endDate) errors.endDate = '请选择授权结束日期';
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      errors.endDate = '结束日期必须晚于开始日期';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      closeFormModals();
      alert('提交成功');
    }
  };

  const renderFormModal = (title: string, showUpload: boolean = true) => (
    <div className="modal-overlay" onClick={closeFormModals}>
      <div className="modal-large form-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={closeFormModals}>×</button>
        </div>
        <div className="modal-body form-modal-body">
          <div className="form-section">
            <h4 className="section-title"><span className="title-bar"></span>基本信息</h4>
            <div className="form-grid">
              <div className="form-item">
                <label>运营机构 <span className="required">*</span></label>
                <input type="text" value={formData.opOrg} disabled />
              </div>
              <div className="form-item">
                <label>运营协议 <span className="required">*</span></label>
                <div className="file-upload-wrapper">
                  {showUpload ? (
                    <>
                      <label className="btn btn-sm btn-primary file-upload-btn">
                        上传运营协议
                        <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} />
                      </label>
                    </>
                  ) : (
                    <input type="text" value={formData.agreementFileName} disabled />
                  )}
                </div>
                {formErrors.agreement && <span className="error-text">{formErrors.agreement}</span>}
              </div>
              <div className="form-item">
                <label>授权期限 <span className="required">*</span></label>
                <div className="date-range-wrapper">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                    className={formErrors.startDate ? 'has-error' : ''}
                  />
                  <span className="date-range-separator">至</span>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                    className={formErrors.endDate ? 'has-error' : ''}
                  />
                </div>
                {(formErrors.startDate || formErrors.endDate) && (
                  <span className="error-text">{formErrors.startDate || formErrors.endDate}</span>
                )}
              </div>
              <div className="form-item form-item-full">
                <label>情况说明</label>
                <textarea
                  placeholder="请输入情况说明"
                  value={formData.remark}
                  onChange={(e) => handleFormChange('remark', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={closeFormModals}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>提交</button>
        </div>
      </div>
    </div>
  );

  const renderViewModal = () => currentRecord && (
    <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
      <div className="modal-large view-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header view-modal-header">
          <h3>查看</h3>
          <div className="view-modal-actions">
            <button className="btn btn-primary btn-sm" onClick={() => { setShowViewModal(false); setShowEvidenceModal(true); }}>查看存证</button>
            <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
          </div>
        </div>
        <div className="modal-body view-modal-body">
          <div className="tabs-row">
            <div className={'tab-item ' + (viewTab === 'apply' ? 'active' : '')} onClick={() => setViewTab('apply')}>申请信息</div>
            <div className={'tab-item ' + (viewTab === 'audit' ? 'active' : '')} onClick={() => setViewTab('audit')}>审核信息</div>
          </div>
          {viewTab === 'apply' && (
            <>
              <h4 className="section-title"><span className="title-bar"></span>基本信息</h4>
              <div className="view-info-table">
                <div className="info-cell"><span className="info-label">所属地域</span><span className="info-value">{currentRecord.region}</span></div>
                <div className="info-cell"><span className="info-label">授权运营类型</span><span className="info-value">{currentRecord.authType}</span></div>
                <div className="info-cell"><span className="info-label">领域名称</span><span className="info-value">{currentRecord.domain}</span></div>
                <div className="info-cell"><span className="info-label">运营机构</span><span className="info-value">{currentRecord.opOrg}</span></div>
                <div className="info-cell"><span className="info-label">统一社会信用代码</span><span className="info-value">{currentRecord.creditCode}</span></div>
                <div className="info-cell"><span className="info-label">运营协议</span><span className="info-value"><a href="#" onClick={(e) => { e.preventDefault(); alert('下载：' + currentRecord.agreement); }} className="agreement-link">{currentRecord.agreement}</a></span></div>
                <div className="info-cell"><span className="info-label">授权期限</span><span className="info-value">{currentRecord.startDate} 至 {currentRecord.endDate}</span></div>
                <div className="info-cell"><span className="info-label">法人经办人姓名</span><span className="info-value">{currentRecord.legalHandler}</span></div>
                <div className="info-cell"><span className="info-label">创建时间</span><span className="info-value">{currentRecord.createTime}</span></div>
                <div className="info-cell"><span className="info-label">备案状态</span><span className="info-value"><span className={'status-tag ' + getStatusClass(currentRecord.status)}>{currentRecord.status}</span></span></div>
                {currentRecord.status === '已备案' && (
                  <div className="info-cell  full-width"><span className="info-label">备案时间</span><span className="info-value">{currentRecord.filingTime}</span></div>
                )}
                <div className="info-cell full-width"><span className="info-label">情况说明</span><span className="info-value">{currentRecord.remark || '-'}</span></div>
              </div>
            </>
          )}
          {viewTab === 'audit' && (
            <div className="audit-table-wrapper">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>流程节点</th>
                    <th>节点状态</th>
                    <th>单位名称</th>
                    <th>法人经办人姓名</th>
                    <th>操作时间</th>
                    <th>审核结果</th>
                    <th>审核意见</th>
                  </tr>
                </thead>
                <tbody>
                  {buildAuditHistory(currentRecord).map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.node}</td>
                      <td><span className={'node-status ' + (item.status === '已完成' ? 'completed' : '')}>{item.status}</span></td>
                      <td>{item.org}</td>
                      <td>{item.handler}</td>
                      <td>{item.time}</td>
                      <td>{item.result}</td>
                      <td>{item.opinion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              <div className="evidence-title">运营协议备案电子凭证</div>
            </div>
            <div className="evidence-content">
              <div className="evidence-row"><span className="evidence-label">凭证编号：</span><span className="evidence-value">BLOCK-OPS-{currentRecord.id.toString().padStart(8, '0')}</span></div>
              <div className="evidence-row"><span className="evidence-label">运营机构：</span><span className="evidence-value">{currentRecord.opOrg}</span></div>
              <div className="evidence-row"><span className="evidence-label">统一社会信用代码：</span><span className="evidence-value">{currentRecord.creditCode}</span></div>
              <div className="evidence-row"><span className="evidence-label">授权运营类型：</span><span className="evidence-value">{currentRecord.authType}</span></div>
              <div className="evidence-row"><span className="evidence-label">领域名称：</span><span className="evidence-value">{currentRecord.domain}</span></div>
              <div className="evidence-row"><span className="evidence-label">运营协议：</span><span className="evidence-value">{currentRecord.agreement}</span></div>
              <div className="evidence-row"><span className="evidence-label">授权期限：</span><span className="evidence-value">{currentRecord.startDate} 至 {currentRecord.endDate}</span></div>
              {currentRecord.status === '已备案' && (
                <div className="evidence-row"><span className="evidence-label">备案时间：</span><span className="evidence-value">{currentRecord.filingTime}</span></div>
              )}
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

  const renderConfirmModal = () => currentRecord && (
    <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
      <div className="modal-medium confirm-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>确认</h3>
          <button className="modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
        </div>
        <div className="modal-body confirm-modal-body">
          <div className="confirm-record-info">
            <div className="confirm-info-row">
              <span className="confirm-info-label">运营协议：</span>
              <span className="confirm-info-value">{currentRecord.agreement}</span>
            </div>
            <div className="confirm-info-row">
              <span className="confirm-info-label">运营机构：</span>
              <span className="confirm-info-value">{currentRecord.opOrg}</span>
            </div>
            <div className="confirm-info-row">
              <span className="confirm-info-label">统一社会信用代码：</span>
              <span className="confirm-info-value">{currentRecord.creditCode}</span>
            </div>
            <div className="confirm-info-row">
              <span className="confirm-info-label">情况说明：</span>
              <span className="confirm-info-value">{currentRecord.remark || '-'}</span>
            </div>
          </div>
          <div className="confirm-form-item">
            <label>确认结果 <span className="required">*</span></label>
            <select
              value={confirmResult}
              onChange={(e) => {
                setConfirmResult(e.target.value);
                if (confirmErrors.confirmResult) setConfirmErrors(prev => { const n = { ...prev }; delete n.confirmResult; return n; });
              }}
              className={confirmErrors.confirmResult ? 'has-error' : ''}
            >
              <option value="">请选择</option>
              <option value="备案通过">备案通过</option>
              <option value="备案退回">备案退回</option>
            </select>
            {confirmErrors.confirmResult && <span className="error-text">{confirmErrors.confirmResult}</span>}
          </div>
          <div className="confirm-form-item">
            <label>处理意见</label>
            <textarea
              placeholder="请输入处理意见（非必填）"
              value={confirmOpinion}
              onChange={(e) => setConfirmOpinion(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowConfirmModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleConfirmSubmit}>提交</button>
        </div>
      </div>
    </div>
  );

  // 渲染筛选区域
  const renderFilterSection = () => {
    if (isDeptRole) {
      // 数据管理部门：完整筛选
      return (
        <div className="filter-section">
          <div className="filter-row">
            <div className="filter-item filter-item-select">
              <label>所属地域</label>
              <select value={searchRegion} onChange={(e) => setSearchRegion(e.target.value)}>
                <option value="">请选择</option>
                {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="filter-item filter-item-select">
              <label>授权运营类型</label>
              <select value={searchAuthType} onChange={(e) => setSearchAuthType(e.target.value)}>
                <option value="">请选择</option>
                {AUTH_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="filter-item filter-item-select">
              <label>领域名称</label>
              <select value={searchDomain} onChange={(e) => setSearchDomain(e.target.value)}>
                <option value="">请选择</option>
                {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="filter-item">
              <label>运营协议</label>
              <input type="text" placeholder="请输入" value={searchAgreement} onChange={(e) => setSearchAgreement(e.target.value)} />
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-item">
              <label>实施机构</label>
              <input type="text" placeholder="请输入" value={searchImplOrg} onChange={(e) => setSearchImplOrg(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>运营机构</label>
              <input type="text" placeholder="请输入" value={searchOpOrg} onChange={(e) => setSearchOpOrg(e.target.value)} />
            </div>
            <div className="filter-item date-range">
              <label>创建时间</label>
              <div className="date-inputs">
                <div className="date-input">
                  <input type="date" value={searchCreateTimeStart} onChange={(e) => setSearchCreateTimeStart(e.target.value)} />
                </div>
                <span className="date-separator">-</span>
                <div className="date-input">
                  <input type="date" value={searchCreateTimeEnd} onChange={(e) => setSearchCreateTimeEnd(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="filter-item filter-item-select">
              <label>备案状态</label>
              <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
                <option value="">请选择</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <div className="filter-actions-left">
              <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage(1)}>搜索</button>
              <button className="btn btn-default btn-sm" onClick={handleReset}>清空</button>
            </div>
          </div>
        </div>
      );
    }
    // 运营机构/实施机构：基础筛选
    return (
      <div className="filter-section">

        <div className="filter-actions">
          <div className="filter-actions-left">
          </div>
          <div className="filter-actions-right">
            <div className="page-actions">
              {canAdd && <button className="btn btn-primary" onClick={handleAdd}>+ 运营协议备案</button>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染表格
  const renderTable = () => {
    const isDeptView = isDeptRole;
    const colCount = isDeptView ? 11 : 9;
    return (
      <div className="table-section">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              {isDeptView ? (
                <tr>
                  <th className="col-index">序号</th>
                  <th className="col-region">所属地域</th>
                  <th className="col-name">授权运营类型</th>
                  <th className="col-domain">领域名称</th>
                  <th className="col-name">运营协议</th>
                  <th className="col-impl-org">实施机构</th>
                  <th className="col-name">运营机构</th>
                  <th className="col-time">创建时间</th>
                  <th className="col-status">备案状态</th>
                  <th className="col-time">备案时间</th>
                  <th className="col-action">操作</th>
                </tr>
              ) : (
                <tr>
                  <th className="col-index">序号</th>
                  <th className="col-name">授权运营类型</th>
                  <th className="col-name">领域名称</th>
                  <th className="col-name">运营协议</th>
                  <th className="col-name">运营机构</th>
                  <th className="col-time">创建时间</th>
                  <th className="col-status">备案状态</th>
                  <th className="col-time">备案时间</th>
                  <th className="col-action">操作</th>
                </tr>
              )}
            </thead>
            <tbody>
              {paginatedRecords.map((record, index) => (
                <tr key={record.id}>
                  <td>{(safePage - 1) * pageSize + index + 1}</td>
                  {isDeptView && <td>{record.region}</td>}
                  <td>{record.authType}</td>
                  <td>{record.domain}</td>
                  <td>
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('预览：' + record.agreement); }} className="agreement-link">
                      {record.agreement}
                    </a>
                  </td>
                  {isDeptView && <td>{record.implOrg}</td>}
                  <td>{record.opOrg}</td>
                  <td className="time-cell">{record.createTime}</td>
                  <td><span className={'status-tag ' + getStatusClass(record.status)}>{record.status}</span></td>
                  <td className="time-cell">{record.status === '已备案' ? record.filingTime : '-'}</td>
                  <td className="action-cell">
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                      {hasConfirm(record) && <button className="action-btn" onClick={() => handleConfirm(record)}>确认</button>}
                      {hasViewEvidence(record) && <button className="action-btn" onClick={() => handleViewEvidence(record)}>查看存证</button>}
                      {hasChange(record) && <button className="action-btn" onClick={() => handleChange(record)}>变更</button>}
                      {hasEdit(record) && <button className="action-btn" onClick={() => handleEdit(record)}>编辑</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={colCount} className="empty-row">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span className="pagination-info">共{filteredRecords.length}条记录</span>
          <div className="pagination-controls">
            <button className="page-btn" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)}>上一页</button>
            <span className="page-number">{safePage}</span>
            <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>下一页</button>
            <select className="page-size-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
            </select>
            <span className="jump-to">跳至</span>
            <input type="number" className="page-input" min={1} max={totalPages} value={safePage} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= totalPages) setCurrentPage(v); }} />
            <span className="jump-to">页</span>
          </div>
        </div>
      </div>
    );
  };

  // 只有实施机构和数据管理部门有运营协议备案功能
  // 运营机构、其他经营主体、数据基础设施运营方、数源机构 无此功能，页面不渲染内容
  const hasPermission = isImplRole || isDeptRole;

  return (
    <>
      <Layout
        activeMenu="operation-agreement-filing"
        breadcrumb="运营协议备案"
        role={selectedRole}
        onRoleChange={setSelectedRole}
        title="运营协议备案"
        specContent={specContent}
        changeLogContent={changeLogContent}
      >
        {hasPermission ? (
          <>
            {renderFilterSection()}
            {renderTable()}
          </>
        ) : (
          <div className="no-permission">
            <div className="no-permission-icon">🔒</div>
            <div className="no-permission-text">当前角色暂无运营协议备案功能权限</div>
            <div className="no-permission-hint">请切换至「实施机构」或「数据管理部门」角色查看</div>
          </div>
        )}
      </Layout>

      {showAddModal && renderFormModal('运营协议备案')}
      {showEditModal && renderFormModal('运营协议备案编辑', true)}
      {showChangeModal && renderFormModal('运营协议备案变更', true)}
      {showViewModal && renderViewModal()}
      {showEvidenceModal && renderEvidenceModal()}
      {showConfirmModal && renderConfirmModal()}
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

/**
 * @name 实施机构备案
 * @mode axure
 *
 * 公共数据资源授权运营管理平台 → 备案管理 → 实施机构备案
 * 列表主页、新增备案弹窗、查看详情弹窗（申请信息 / 审核信息 Tab）、
 * 区块链存证弹窗、省级退回编辑弹窗。
 */

import { useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';
import '../../common/backend-list.css';

interface ImplOrgFiling {
  id: number;
  region: string;
  authType: string;
  domain: string;
  implOrg: string;
  creditCode: string;
  legalHandler: string;
  createTime: string;
  status: string;
  filingTime: string;
  remark?: string;
  attachment?: string;
  evidenceHash: string;
  blockchainId: string;
  evidenceTime: string;
  rejectReason?: string;
}

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

interface ImplOrgFormData {
  authType: string;
  domain: string;
  implOrg: string;
  creditCode: string;
  attachment: string;
  remark: string;
}

const STATUS_OPTIONS = ['已备案', '待省级确认', '省级退回'];
const AUTH_TYPE_OPTIONS = ['分领域授权运营', '整体授权运营'];
const DOMAIN_OPTIONS = ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源'];
const REGION_DEFAULT = '省本级';
const LEGAL_HANDLER_DEFAULT = '张伟';

const filingSeed: ImplOrgFiling[] = [
  {
    id: 1,
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '医疗健康',
    implOrg: '长沙市卫生健康委员会实施机构',
    creditCode: '11430100MB1A23456X',
    legalHandler: '张文博',
    createTime: '2026-05-18 10:05:57',
    status: '已备案',
    filingTime: '2026-05-18 15:30:10',
    remark: '负责全省医疗健康领域公共数据授权运营的具体实施工作，涵盖医疗机构就诊数据与居民健康档案数据。',
    evidenceHash: '0xce062244b9d792689dae5cef09e59173eb983868dc522918511de6704f06a397',
    blockchainId: '0x76bb8cbffa85f757cc67967842dc257da2c3f81a7b2633c780ee1ba4f8f57bf',
    evidenceTime: '2026-05-18 15:30:11'
  },
  {
    id: 2,
    region: '省本级',
    authType: '分领域授权运营',
    domain: '交通运输',
    implOrg: '湖南省交通运输厅数据运营中心',
    creditCode: '12430000MB1B87654X',
    legalHandler: '李建国',
    createTime: '2026-06-01 09:30:22',
    status: '待省级确认',
    filingTime: '2026-06-01 09:30:22',
    remark: '承担交通运输领域道路监控与交通流量数据的授权运营实施。',
    evidenceHash: '0x8a1f3d5c9e2b4a7f6d8c0e1b3a5f7d9c2e4b6a8f0d2c4e6b8a0f1d3c5e7b9a01',
    blockchainId: '0x3f5a7c9e1b2d4f6a8c0e2b4d6f8a0c1e3b5d7f9a1c3e5b7d9f0a2c4e6b8d0f12',
    evidenceTime: '2026-06-01 09:30:23'
  },
  {
    id: 3,
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '教育',
    implOrg: '长沙市岳麓区智慧教育数据实施发展有限公司',
    creditCode: '91430104MA4C56789X',
    legalHandler: '王思远',
    createTime: '2026-06-05 14:20:15',
    status: '省级退回',
    filingTime: '2026-06-06 08:45:33',
    rejectReason: '实施方案中数据使用权限范围描述不明确，请补充详细的数据使用范围与限制条款后重新提交。',
    remark: '教育领域数据授权运营实施机构，负责区域教育数据产品开发。',
    evidenceHash: '0x5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b70',
    blockchainId: '0x9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e',
    evidenceTime: '2026-06-05 14:20:16'
  },
  {
    id: 4,
    region: '岳阳市',
    authType: '分领域授权运营',
    domain: '自然资源',
    implOrg: '岳阳市自然资源和规划局数据中心',
    creditCode: '12430600MB1C11223X',
    legalHandler: '赵敏',
    createTime: '2026-06-15 13:50:44',
    status: '已备案',
    filingTime: '2026-06-16 09:28:17',
    remark: '自然资源领域土地利用与矿产资源数据的授权运营实施。',
    evidenceHash: '0x7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a',
    blockchainId: '0x1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c',
    evidenceTime: '2026-06-16 09:28:18'
  },
  {
    id: 5,
    region: '省本级',
    authType: '整体授权运营',
    domain: '文化旅游',
    implOrg: '湖南文旅大数据实施运营有限公司',
    creditCode: '91430000MA4D99887X',
    legalHandler: '孙佳怡',
    createTime: '2026-06-10 11:15:28',
    status: '省级退回',
    filingTime: '2026-06-11 10:02:09',
    rejectReason: '统一社会信用代码填写有误，请核对后重新提交。',
    remark: '文化旅游领域整体授权运营实施机构。',
    evidenceHash: '0x2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f',
    blockchainId: '0x6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b',
    evidenceTime: '2026-06-10 11:15:29'
  },
  {
    id: 6,
    region: '株洲市',
    authType: '分领域授权运营',
    domain: '交通运输',
    implOrg: '株洲市轨道交通与智慧交通数据运营实施集团有限公司',
    creditCode: '12430200MB1E44556X',
    legalHandler: '周文涛',
    createTime: '2026-07-02 16:41:41',
    status: '待省级确认',
    filingTime: '2026-07-02 16:41:41',
    remark: '轨道交通客流与城市交通运行数据的授权运营实施。',
    evidenceHash: '0x8b1d3f5c9e2a4b7f6d8c0e1b3a5f7d9c2e4b6a8f0d2c4e6b8a0f1d3c5e7b9a22',
    blockchainId: '0x3f5a7c9e1b2d4f6a8c0e2b4d6f8a0c1e3b5d7f9a1c3e5b7d9f0a2c4e6b8d0f33',
    evidenceTime: '2026-07-02 16:41:42'
  },
  {
    id: 7,
    region: '省本级',
    authType: '分领域授权运营',
    domain: '医疗健康',
    implOrg: '湖南省全民健康信息平台实施运营中心',
    creditCode: '12430000MB1F77889X',
    legalHandler: '陈雨桐',
    createTime: '2026-07-16 09:07:23',
    status: '已备案',
    filingTime: '2026-07-16 14:22:51',
    remark: '负责全省全民健康信息平台公共数据的授权运营实施。',
    evidenceHash: '0x7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9b',
    blockchainId: '0x1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a4d',
    evidenceTime: '2026-07-16 14:22:52'
  }
];

/** 生成伪随机十六进制哈希（用于新增备案的演示存证数据） */
const randomHex = (len: number) => {
  const chars = '0123456789abcdef';
  let out = '0x';
  for (let i = 0; i < len; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

/** 当前时间格式化为 YYYY-MM-DD HH:mm:ss */
const nowText = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** 法人经办人姓名脱敏：保留首尾，中间以 * 代替 */
const maskName = (name: string) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return '-';
  if (trimmed.length === 1) return trimmed;
  if (trimmed.length === 2) return `${trimmed[0]}*`;
  return `${trimmed[0]}${'*'.repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
};

const createEmptyForm = (): ImplOrgFormData => ({
  authType: '分领域授权运营',
  domain: '',
  implOrg: '',
  creditCode: '',
  attachment: '',
  remark: ''
});

/** 构建审核流程历史（流程示例节点：提交备案、区县级确认备案） */
const buildAuditHistory = (record: ImplOrgFiling): AuditHistoryItem[] => {
  const list: AuditHistoryItem[] = [
    {
      id: 1,
      node: '提交备案',
      status: '已完成',
      org: record.implOrg,
      handler: record.legalHandler,
      time: record.createTime,
      result: '备案通过',
      opinion: '提交实施机构备案申请'
    }
  ];
  if (record.status === '已备案') {
    list.push({
      id: 2,
      node: '区县级确认备案',
      status: '已完成',
      org: '岳麓区数据局',
      handler: '李*',
      time: record.createTime,
      result: '备案通过',
      opinion: '同意备案'
    });
    list.push({
      id: 3,
      node: '省级确认备案',
      status: '已完成',
      org: '省数据局',
      handler: '王*',
      time: record.filingTime,
      result: '备案通过',
      opinion: '同意备案'
    });
  } else if (record.status === '待省级确认') {
    list.push({
      id: 2,
      node: '区县级确认备案',
      status: '已完成',
      org: '岳麓区数据局',
      handler: '李*',
      time: record.createTime,
      result: '备案通过',
      opinion: '同意备案'
    });
    list.push({
      id: 3,
      node: '省级确认备案',
      status: '进行中',
      org: '省数据局',
      handler: '-',
      time: '-',
      result: '-',
      opinion: '待省级确认'
    });
  } else {
    list.push({
      id: 2,
      node: '区县级确认备案',
      status: '已完成',
      org: '岳麓区数据局',
      handler: '李*',
      time: record.createTime,
      result: '备案通过',
      opinion: '同意备案'
    });
    list.push({
      id: 3,
      node: '省级退回备案',
      status: '已完成',
      org: '省数据局',
      handler: '王*',
      time: record.filingTime,
      result: '退回',
      opinion: record.rejectReason || '材料需补充'
    });
  }
  return list;
};

const getStatusClass = (status: string) => {
  if (status === '已备案') return 'status-approved';
  if (status === '省级退回') return 'status-province-rejected';
  return 'status-pending';
};

const OriginalComponent = () => {
  const [records, setRecords] = useState<ImplOrgFiling[]>(filingSeed);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ImplOrgFiling | null>(null);
  const [viewTab, setViewTab] = useState<'apply' | 'audit'>('apply');
  const [formData, setFormData] = useState<ImplOrgFormData>(createEmptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [role, setRole] = useState('实施机构');

  // 列表按创建时间倒序
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => (a.createTime < b.createTime ? 1 : -1)),
    [records]
  );

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = sortedRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  // 操作按钮权限规则
  // 已备案：查看、查看存证
  // 待省级确认：查看
  // 省级退回：查看、编辑
  const canViewEvidence = (record: ImplOrgFiling) => record.status === '已备案';
  const canEdit = (record: ImplOrgFiling) => record.status === '省级退回';

  /* ---------------- 新增 / 编辑弹窗 ---------------- */
  const closeFormModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const handleAdd = () => {
    setFormData(createEmptyForm());
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEdit = (record: ImplOrgFiling) => {
    setCurrentRecord(record);
    setFormData({
      authType: record.authType,
      domain: record.domain,
      implOrg: record.implOrg,
      creditCode: record.creditCode,
      attachment: record.attachment || '',
      remark: record.remark || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleFormChange = (field: keyof ImplOrgFormData, value: string) => {
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
    if (!formData.authType.trim()) errors.authType = '请选择授权运营类型';
    if (!formData.domain.trim()) errors.domain = '请选择领域名称';
    if (!formData.implOrg.trim()) errors.implOrg = '请输入实施机构名称';
    if (!formData.creditCode.trim()) errors.creditCode = '请输入统一社会信用代码';
    if (!formData.attachment.trim()) errors.attachment = '请上传附件';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitAdd = () => {
    if (!validateForm()) return;
    const time = nowText();
    const newRecord: ImplOrgFiling = {
      id: Math.max(0, ...records.map(r => r.id)) + 1,
      region: REGION_DEFAULT,
      authType: formData.authType,
      domain: formData.domain,
      implOrg: formData.implOrg.trim(),
      creditCode: formData.creditCode.trim(),
      attachment: formData.attachment.trim(),
      legalHandler: LEGAL_HANDLER_DEFAULT,
      createTime: time,
      status: '已备案',
      filingTime: time,
      remark: formData.remark.trim() || undefined,
      evidenceHash: randomHex(64),
      blockchainId: randomHex(62),
      evidenceTime: time
    };
    setRecords(prev => [...prev, newRecord]);
    setCurrentPage(1);
    closeFormModals();
    alert('备案提交成功，备案状态：已备案');
  };

  const handleSubmitEdit = () => {
    if (!validateForm() || !currentRecord) return;
    setRecords(prev => prev.map(r => (r.id === currentRecord.id
      ? { ...r, authType: formData.authType, domain: formData.domain, implOrg: formData.implOrg.trim(), creditCode: formData.creditCode.trim(), attachment: formData.attachment.trim(), remark: formData.remark.trim() || undefined }
      : r)));
    closeFormModals();
    setCurrentRecord(null);
    alert('编辑保存成功');
  };

  /* 文件上传控件 */
  const renderUploadField = (field: keyof ImplOrgFormData, label: string, required: boolean, hint: string) => (
    <div className="form-item form-item-full upload-item">
      <label>{required && <span className="required">*</span>} {label}</label>
      <div className="upload-control">
        <label className="upload-btn">
          选择文件
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              handleFormChange(field, file ? file.name : '');
            }}
          />
        </label>
        <span className={'upload-name ' + (formData[field] ? 'has-file' : '')}>
          {formData[field] || hint}
        </span>
      </div>
      {formErrors[field] && <span className="error-text">{formErrors[field]}</span>}
    </div>
  );

  const renderFormModal = (title: string, onSubmit: () => void) => (
    <div className="modal-overlay" onClick={closeFormModals}>
      <div className="modal-medium filing-form-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={closeFormModals}>×</button>
        </div>
        <div className="modal-body filing-form-body">
          <div className="form-grid">
            <div className="form-item form-item-full">
              <label><span className="required">*</span> 授权运营类型</label>
              <select
                value={formData.authType}
                onChange={(e) => handleFormChange('authType', e.target.value)}
                className={formErrors.authType ? 'has-error' : ''}
              >
                {AUTH_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {formErrors.authType && <span className="error-text">{formErrors.authType}</span>}
            </div>
            <div className="form-item form-item-full">
              <label><span className="required">*</span> 领域名称</label>
              <select
                value={formData.domain}
                onChange={(e) => handleFormChange('domain', e.target.value)}
                className={formErrors.domain ? 'has-error' : ''}
              >
                <option value="">请选择领域名称</option>
                {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {formErrors.domain && <span className="error-text">{formErrors.domain}</span>}
            </div>
            <div className="form-item form-item-full">
              <label><span className="required">*</span> 实施机构名称</label>
              <input
                type="text"
                placeholder="请输入实施机构名称"
                value={formData.implOrg}
                onChange={(e) => handleFormChange('implOrg', e.target.value)}
                className={formErrors.implOrg ? 'has-error' : ''}
              />
              {formErrors.implOrg && <span className="error-text">{formErrors.implOrg}</span>}
            </div>
            <div className="form-item form-item-full">
              <label><span className="required">*</span> 统一社会信用代码</label>
              <input
                type="text"
                placeholder="请输入统一社会信用代码"
                value={formData.creditCode}
                onChange={(e) => handleFormChange('creditCode', e.target.value)}
                className={formErrors.creditCode ? 'has-error' : ''}
              />
              {formErrors.creditCode && <span className="error-text">{formErrors.creditCode}</span>}
            </div>
            {renderUploadField('attachment', '附件', true, '上传会议纪要或其他证明实施机构身份的文件')}
            <div className="form-item form-item-full">
              <label>情况说明</label>
              <textarea
                placeholder="请输入"
                value={formData.remark}
                onChange={(e) => handleFormChange('remark', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={closeFormModals}>取消</button>
          <button className="btn btn-primary" onClick={onSubmit}>确定</button>
        </div>
      </div>
    </div>
  );

  /* ---------------- 查看详情弹窗 ---------------- */
  const handleView = (record: ImplOrgFiling) => {
    setCurrentRecord(record);
    setViewTab('apply');
    setShowViewModal(true);
  };

  const handleViewEvidence = (record: ImplOrgFiling) => {
    setCurrentRecord(record);
    setShowEvidenceModal(true);
  };

  const renderViewModal = () => currentRecord && (
    <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
      <div className="modal-large view-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header view-modal-header">
          <h3>查看</h3>
          <div className="view-modal-actions">
            <button className="btn btn-primary btn-sm" onClick={() => { setShowViewModal(false); handleViewEvidence(currentRecord); }}>查看存证</button>
            <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
          </div>
        </div>
        <div className="modal-body view-modal-body">
          <div className="tabs-row">
            <div className={'tab-item ' + (viewTab === 'apply' ? 'active' : '')} onClick={() => setViewTab('apply')}>申请信息</div>
            <div className={'tab-item ' + (viewTab === 'audit' ? 'active' : '')} onClick={() => setViewTab('audit')}>审核信息</div>
          </div>
          {viewTab === 'apply' && (
            <div className="view-info-table">
              <div className="info-cell"><span className="info-label">所属地域</span><span className="info-value">{currentRecord.region}</span></div>
              <div className="info-cell"><span className="info-label">授权运营类型</span><span className="info-value">{currentRecord.authType}</span></div>
              <div className="info-cell"><span className="info-label">领域名称</span><span className="info-value">{currentRecord.domain}</span></div>
              <div className="info-cell"><span className="info-label">实施机构</span><span className="info-value">{currentRecord.implOrg}</span></div>
              <div className="info-cell"><span className="info-label">统一社会信用代码</span><span className="info-value">{currentRecord.creditCode}</span></div>
              <div className="info-cell"><span className="info-label">法人经办人姓名</span><span className="info-value">{currentRecord.legalHandler}</span></div>
              <div className="info-cell"><span className="info-label">创建时间</span><span className="info-value">{currentRecord.createTime}</span></div>
              <div className="info-cell"><span className="info-label">备案状态</span><span className="info-value"><span className={'status-tag ' + getStatusClass(currentRecord.status)}>{currentRecord.status}</span></span></div>
              <div className="info-cell full-width"><span className="info-label">备案时间</span><span className="info-value">{currentRecord.status === '已备案' ? currentRecord.filingTime : '-'}</span></div>
              <div className="info-cell full-width"><span className="info-label">情况说明</span><span className="info-value">{currentRecord.remark || '-'}</span></div>
            </div>
          )}
          {viewTab === 'audit' && (
            <div className="audit-table-wrapper">
              <table className="audit-table filing-audit-table">
                <thead>
                  <tr>
                    <th className="col-index">序号</th>
                    <th>流程节点</th>
                    <th>节点状态</th>
                    <th>单位名称</th>
                    <th>法人经办人姓名</th>
                    <th>操作时间</th>
                    <th>确认结果</th>
                    <th>处理意见</th>
                  </tr>
                </thead>
                <tbody>
                  {buildAuditHistory(currentRecord).map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.node}</td>
                      <td><span className={'node-status ' + (item.status === '已完成' ? 'completed' : '')}>{item.status}</span></td>
                      <td className="org-cell" title={item.org}>{item.org}</td>
                      <td>{maskName(item.handler)}</td>
                      <td>{item.time}</td>
                      <td>
                        {item.result === '备案通过'
                          ? <span className="result-tag result-pass">备案通过</span>
                          : item.result === '退回'
                            ? <span className="result-tag result-reject">退回</span>
                            : <span className="result-tag result-none">-</span>}
                      </td>
                      <td className="audit-opinion">{item.opinion}</td>
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

  /* ---------------- 区块链存证弹窗 ---------------- */
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
              <div className="evidence-title">实施机构备案电子凭证</div>
            </div>
            <div className="evidence-content">
              <div className="evidence-row"><span className="evidence-label">凭证编号：</span><span className="evidence-value">BLOCK-IMPL-{currentRecord.id.toString().padStart(8, '0')}</span></div>
              <div className="evidence-row"><span className="evidence-label">实施机构：</span><span className="evidence-value">{currentRecord.implOrg}</span></div>
              <div className="evidence-row"><span className="evidence-label">统一社会信用代码：</span><span className="evidence-value">{currentRecord.creditCode}</span></div>
              <div className="evidence-row"><span className="evidence-label">授权运营类型：</span><span className="evidence-value">{currentRecord.authType}</span></div>
              <div className="evidence-row"><span className="evidence-label">领域名称：</span><span className="evidence-value">{currentRecord.domain}</span></div>
              <div className="evidence-row"><span className="evidence-label">所属地域：</span><span className="evidence-value">{currentRecord.region}</span></div>
              {currentRecord.status === '已备案' && (
                <div className="evidence-row"><span className="evidence-label">备案时间：</span><span className="evidence-value">{currentRecord.filingTime}</span></div>
              )}
              <div className="evidence-row"><span className="evidence-label">存证时间：</span><span className="evidence-value">{currentRecord.evidenceTime}</span></div>
              <div className="evidence-row"><span className="evidence-label">电子证据：</span><span className="evidence-value hash">{currentRecord.evidenceHash}</span></div>
              <div className="evidence-row"><span className="evidence-label">区块链ID：</span><span className="evidence-value hash">{currentRecord.blockchainId}</span></div>
              <div className="evidence-row"><span className="evidence-label">存证状态：</span><span className="evidence-value success">已确认</span></div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowEvidenceModal(false)}>关闭</button>
          <button className="btn btn-primary" onClick={() => alert('凭证下载功能（导出 PDF / 图片）')}>下载凭证</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Layout
        activeMenu="implementation-org-filing"
        breadcrumb="实施机构备案"
        role={role}
        onRoleChange={setRole}
        roleOptions={['实施机构']}
        title="实施机构备案"
        specContent={specContent}
        changeLogContent={changeLogContent}
      >
        <div className="filter-section">
          <div className="filter-actions">
            <div className="filter-actions-right">
              <div className="page-actions">
                <button className="btn btn-primary" onClick={handleAdd}>+ 实施机构备案</button>
              </div>
            </div>
          </div>
        </div>
        <div className="table-section">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-index">序号</th>
                  <th>授权运营类型</th>
                  <th>领域名称</th>
                  <th>实施机构</th>
                  <th>统一社会信用代码</th>
                  <th className="col-time">创建时间</th>
                  <th className="col-status">备案状态</th>
                  <th className="col-time">备案时间</th>
                  <th className="col-action">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record, index) => (
                  <tr key={record.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>{record.authType}</td>
                    <td>{record.domain}</td>
                    <td className="impl-org-cell" title={record.implOrg}>{record.implOrg}</td>
                    <td className="credit-cell">{record.creditCode}</td>
                    <td className="time-cell">{record.createTime}</td>
                    <td><span className={'status-tag ' + getStatusClass(record.status)}>{record.status}</span></td>
                    <td className="time-cell">{record.status === '已备案' ? record.filingTime : '-'}</td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                        {canViewEvidence(record) && <button className="action-btn" onClick={() => handleViewEvidence(record)}>查看存证</button>}
                        {canEdit(record) && <button className="action-btn" onClick={() => handleEdit(record)}>编辑</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedRecords.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-row">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="pagination-info">共{sortedRecords.length}条记录</span>
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
      </Layout>

      {showAddModal && renderFormModal('实施机构备案', handleSubmitAdd)}
      {showEditModal && renderFormModal('实施机构备案编辑', handleSubmitEdit)}
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

/**
 * @name 运营机构备案
 * @mode axure
 *
 * 公共数据资源授权运营管理平台 → 未确定需求 → 备案管理 → 运营机构备案
 * 列表主页、新增 / 编辑备案弹窗、查看详情弹窗（申请信息 / 审核信息 Tab）、
 * 区块链存证弹窗。
 */

import { useMemo, useState } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';
import '../../common/backend-list.css';

interface OperOrgFiling {
  id: number;
  region: string;
  authType: string;
  domain: string;
  operOrg: string;
  creditCode: string;
  legalHandler: string;
  planName: string;
  planFileLink: string;
  createTime: string;
  status: string;
  filingTime: string;
  remark?: string;
  legalCert?: string;
  announcement?: string;
  expertOpinion?: string;
  publicityCert?: string;
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

interface OperOrgFormData {
  planName: string;
  operOrg: string;
  creditCode: string;
  legalCert: string;
  announcement: string;
  expertOpinion: string;
  publicityCert: string;
  attachment: string;
  remark: string;
}

const STATUS_OPTIONS = ['待省级确认', '已备案', '省级退回'];
const AUTH_TYPE_OPTIONS = ['分领域授权运营', '整体授权运营'];
const DOMAIN_OPTIONS = ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源', '整体'];
const REGION_DEFAULT = '省本级';
const LEGAL_HANDLER_DEFAULT = '刘洋';
/** 已完成备案的实施方案（下拉枚举，禁用不可修改） */
const PLAN_OPTIONS = [
  '长沙市医疗健康领域公共数据授权运营实施方案（已备案）',
  '湖南省交通运输领域数据授权运营实施方案（已备案）',
  '岳阳市自然资源领域数据授权运营实施方案（已备案）',
  '湖南省整体授权运营实施方案（已备案）'
];

/** 统一社会信用代码格式：18 位，由数字与大写字母组成（排除 I/O/Z/S/V 易混淆字符） */
const CREDIT_CODE_REGEX = /^[0-9A-HJ-NP-RTUWXY]{2}\d{6}[0-9A-HJ-NP-RTUWXY]{10}$/;
const isValidCreditCode = (code: string) => CREDIT_CODE_REGEX.test(code.trim().toUpperCase());

const filingSeed: OperOrgFiling[] = [
  {
    id: 1,
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '医疗健康',
    operOrg: '长沙市医疗健康数据运营有限公司',
    creditCode: '91430100MA4C12345X',
    legalHandler: '刘洋',
    planName: '长沙市医疗健康领域公共数据授权运营实施方案（已备案）',
    planFileLink: '#',
    createTime: '2026-05-20 10:05:57',
    status: '已备案',
    filingTime: '2026-05-20 15:30:10',
    remark: '负责长沙市医疗健康领域公共数据授权运营的具体执行工作，对接实施机构完成数据产品开发与对外服务。',
    evidenceHash: '0xae062244b9d792689dae5cef09e59173eb983868dc522918511de6704f06a3a1',
    blockchainId: '0x76bb8cbffa85f757cc67967842dc257da2c3f81a7b2633c780ee1ba4f8f57a2',
    evidenceTime: '2026-05-20 15:30:11'
  },
  {
    id: 2,
    region: '省本级',
    authType: '分领域授权运营',
    domain: '交通运输',
    operOrg: '湖南省智能交通数据运营集团有限公司',
    creditCode: '91430000MA4B87654X',
    legalHandler: '陈志强',
    planName: '湖南省交通运输领域数据授权运营实施方案（已备案）',
    planFileLink: '#',
    createTime: '2026-06-02 09:30:22',
    status: '待省级确认',
    filingTime: '2026-06-02 09:30:22',
    remark: '承担交通运输领域公共数据授权运营的对外服务与产品运营。',
    evidenceHash: '0x8a1f3d5c9e2b4a7f6d8c0e1b3a5f7d9c2e4b6a8f0d2c4e6b8a0f1d3c5e7b9a31',
    blockchainId: '0x3f5a7c9e1b2d4f6a8c0e2b4d6f8a0c1e3b5d7f9a1c3e5b7d9f0a2c4e6b8d0f42',
    evidenceTime: '2026-06-02 09:30:23'
  },
  {
    id: 3,
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '教育',
    operOrg: '长沙市岳麓区智慧教育数据运营发展有限公司',
    creditCode: '91430104MA4C56789X',
    legalHandler: '王小冉',
    planName: '长沙市教育领域公共数据授权运营实施方案（已备案）',
    planFileLink: '#',
    createTime: '2026-06-06 14:20:15',
    status: '省级退回',
    filingTime: '2026-06-07 08:45:33',
    rejectReason: '运营机构统一社会信用代码填写有误，请核对后重新提交。',
    remark: '教育领域数据授权运营执行机构，负责区域教育数据产品的对外服务。',
    evidenceHash: '0x5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b80',
    blockchainId: '0x9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c2e',
    evidenceTime: '2026-06-06 14:20:16'
  },
  {
    id: 4,
    region: '岳阳市',
    authType: '分领域授权运营',
    domain: '自然资源',
    operOrg: '岳阳市自然资源数据运营服务有限公司',
    creditCode: '91430600MA4C11223X',
    legalHandler: '赵敏',
    planName: '岳阳市自然资源领域数据授权运营实施方案（已备案）',
    planFileLink: '#',
    createTime: '2026-06-16 13:50:44',
    status: '已备案',
    filingTime: '2026-06-17 09:28:17',
    remark: '自然资源领域土地利用与矿产资源数据授权运营执行。',
    evidenceHash: '0x7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9c1',
    blockchainId: '0x1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a5e',
    evidenceTime: '2026-06-17 09:28:18'
  },
  {
    id: 5,
    region: '省本级',
    authType: '整体授权运营',
    domain: '整体',
    operOrg: '湖南文旅大数据运营有限公司',
    creditCode: '91430000MA4D99887X',
    legalHandler: '孙佳怡',
    planName: '湖南省整体授权运营实施方案（已备案）',
    planFileLink: '#',
    createTime: '2026-06-11 11:15:28',
    status: '省级退回',
    filingTime: '2026-06-12 10:02:09',
    rejectReason: '实施方案与授权运营类型不匹配，请重新选择对应已备案的实施方案后提交。',
    remark: '文化旅游领域整体授权运营执行机构。',
    evidenceHash: '0x2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d5f',
    blockchainId: '0x6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8c',
    evidenceTime: '2026-06-11 11:15:29'
  },
  {
    id: 6,
    region: '株洲市',
    authType: '分领域授权运营',
    domain: '交通运输',
    operOrg: '株洲市轨道交通与智慧交通数据运营集团有限公司',
    creditCode: '91430200MA4E44556X',
    legalHandler: '周文涛',
    planName: '株洲市交通运输领域公共数据授权运营实施方案（已备案）',
    planFileLink: '#',
    createTime: '2026-07-03 16:41:41',
    status: '待省级确认',
    filingTime: '2026-07-03 16:41:41',
    remark: '轨道交通客流与城市交通运行数据的授权运营执行。',
    evidenceHash: '0x8b1d3f5c9e2a4b7f6d8c0e1b3a5f7d9c2e4b6a8f0d2c4e6b8a0f1d3c5e7b9a33',
    blockchainId: '0x3f5a7c9e1b2d4f6a8c0e2b4d6f8a0c1e3b5d7f9a1c3e5b7d9f0a2c4e6b8d0f55',
    evidenceTime: '2026-07-03 16:41:42'
  },
  {
    id: 7,
    region: '省本级',
    authType: '分领域授权运营',
    domain: '医疗健康',
    operOrg: '湖南省全民健康数据运营中心',
    creditCode: '91430000MA4F77889X',
    legalHandler: '陈雨桐',
    planName: '长沙市医疗健康领域公共数据授权运营实施方案（已备案）',
    planFileLink: '#',
    createTime: '2026-07-17 09:07:23',
    status: '已备案',
    filingTime: '2026-07-17 14:22:51',
    remark: '负责全省全民健康信息平台公共数据的授权运营执行。',
    evidenceHash: '0x7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9d2',
    blockchainId: '0x1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a6f',
    evidenceTime: '2026-07-17 14:22:52'
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

const createEmptyForm = (): OperOrgFormData => ({
  planName: PLAN_OPTIONS[0],
  operOrg: '',
  creditCode: '',
  legalCert: '',
  announcement: '',
  expertOpinion: '',
  publicityCert: '',
  attachment: '',
  remark: ''
});

/** 构建审核流程历史（流程示例节点：提交备案、省级确认备案） */
const buildAuditHistory = (record: OperOrgFiling): AuditHistoryItem[] => {
  const list: AuditHistoryItem[] = [
    {
      id: 1,
      node: '提交备案',
      status: '已完成',
      org: record.operOrg,
      handler: record.legalHandler,
      time: record.createTime,
      result: '备案通过',
      opinion: '提交运营机构备案申请'
    }
  ];
  if (record.status === '已备案') {
    list.push({
      id: 2,
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
      node: '省级确认备案',
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

/** 预览 / 下载 PDF 文件（演示：弹出提示） */
const handleFileClick = (fileName: string) => {
  alert(`正在预览 / 下载 PDF 文件：${fileName}`);
};

const OriginalComponent = () => {
  const [records, setRecords] = useState<OperOrgFiling[]>(filingSeed);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<OperOrgFiling | null>(null);
  const [viewTab, setViewTab] = useState<'apply' | 'audit'>('apply');
  const [formData, setFormData] = useState<OperOrgFormData>(createEmptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [role, setRole] = useState('运营机构');

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
  const canViewEvidence = (record: OperOrgFiling) => record.status === '已备案';
  const canEdit = (record: OperOrgFiling) => record.status === '省级退回';

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

  const handleEdit = (record: OperOrgFiling) => {
    setCurrentRecord(record);
    setFormData({
      planName: record.planName,
      operOrg: record.operOrg,
      creditCode: record.creditCode,
      legalCert: record.legalCert || '',
      announcement: record.announcement || '',
      expertOpinion: record.expertOpinion || '',
      publicityCert: record.publicityCert || '',
      attachment: record.attachment || '',
      remark: record.remark || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleFormChange = (field: keyof OperOrgFormData, value: string) => {
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
    if (!formData.planName.trim()) errors.planName = '请选择实施方案';
    if (!formData.operOrg.trim()) errors.operOrg = '请输入运营机构名称';
    if (!formData.creditCode.trim()) {
      errors.creditCode = '请输入统一社会信用代码';
    } else if (!isValidCreditCode(formData.creditCode)) {
      errors.creditCode = '统一社会信用代码格式不正确（应为 18 位，由数字与大写字母组成）';
    }
    if (!formData.legalCert.trim()) errors.legalCert = '请上传运营机构法人证书';
    if (!formData.announcement.trim()) errors.announcement = '请上传运营机构征集公告';
    if (!formData.expertOpinion.trim()) errors.expertOpinion = '请上传专家评审意见';
    if (!formData.publicityCert.trim()) errors.publicityCert = '请上传运营机构公示完成证明';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitAdd = () => {
    if (!validateForm()) return;
    const time = nowText();
    const newRecord: OperOrgFiling = {
      id: Math.max(0, ...records.map(r => r.id)) + 1,
      region: REGION_DEFAULT,
      authType: '分领域授权运营',
      domain: '整体',
      operOrg: formData.operOrg.trim(),
      creditCode: formData.creditCode.trim().toUpperCase(),
      legalCert: formData.legalCert.trim(),
      announcement: formData.announcement.trim(),
      expertOpinion: formData.expertOpinion.trim(),
      publicityCert: formData.publicityCert.trim(),
      attachment: formData.attachment.trim(),
      legalHandler: LEGAL_HANDLER_DEFAULT,
      planName: formData.planName,
      planFileLink: '#',
      createTime: time,
      status: '待省级确认',
      filingTime: time,
      remark: formData.remark.trim() || undefined,
      evidenceHash: randomHex(64),
      blockchainId: randomHex(62),
      evidenceTime: time
    };
    setRecords(prev => [...prev, newRecord]);
    setCurrentPage(1);
    closeFormModals();
    alert('备案提交成功，已进入省级确认流程（备案状态：待省级确认）');
  };

  const handleSubmitEdit = () => {
    if (!validateForm() || !currentRecord) return;
    setRecords(prev => prev.map(r => (r.id === currentRecord.id
      ? { ...r, planName: formData.planName, operOrg: formData.operOrg.trim(), creditCode: formData.creditCode.trim().toUpperCase(), legalCert: formData.legalCert.trim(), announcement: formData.announcement.trim(), expertOpinion: formData.expertOpinion.trim(), publicityCert: formData.publicityCert.trim(), attachment: formData.attachment.trim(), remark: formData.remark.trim() || undefined, status: '待省级确认', filingTime: nowText() }
      : r)));
    closeFormModals();
    setCurrentRecord(null);
    alert('编辑保存成功，已重新提交备案申请（备案状态：待省级确认）');
  };

  /* 文件上传控件 */
  const renderUploadField = (field: keyof OperOrgFormData, label: string, required: boolean, hint: string, tooltip?: string) => (
    <div className="form-item form-item-full upload-item">
      <label>
        {required && <span className="required">*</span>} {label}
        {tooltip && (
          <span className="field-tip">
            <HelpCircle size={13} className="field-tip-icon" />
            <span className="field-tip-text">{tooltip}</span>
          </span>
        )}
      </label>
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
          {formData[field]}
        </span>
      </div>
      <div className="upload-hint">支持格式: .pdf 单个文件不能超过15MB</div>
      <div className="upload-tip">
        <AlertCircle size={13} className="upload-tip-icon" />
        <span>{hint}</span>
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
              <label><span className="required">*</span> 实施方案</label>
              <select
                disabled
                value={formData.planName}
                onChange={(e) => handleFormChange('planName', e.target.value)}
                className="disabled-select"
              >
                {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-item form-item-full">
              <label><span className="required">*</span> 运营机构名称</label>
              <input
                type="text"
                placeholder="请输入运营机构名称"
                value={formData.operOrg}
                onChange={(e) => handleFormChange('operOrg', e.target.value)}
                className={formErrors.operOrg ? 'has-error' : ''}
              />
              {formErrors.operOrg && <span className="error-text">{formErrors.operOrg}</span>}
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
            {renderUploadField('announcement', '征集公告', true, '请上传运营机构征集公告')}
            {renderUploadField('expertOpinion', '专家评审意见', true, '请上传专家评审意见')}
            {renderUploadField('publicityCert', '公示证明', true, '请上传运营机构公示完成证明')}
            {renderUploadField('legalCert', '机构资格证明', true, '请上传运营机构法人证书', '企业：上传营业执照\n事业单位：上传事业单位法人证书\n党政机关：上传统一社会信用代码证书')}
            {renderUploadField('attachment', '其他证明材料', false, '请上传其他证明运营机构身份的材料')}
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
          <button className="btn btn-primary" onClick={onSubmit}>提交</button>
        </div>
      </div>
    </div>
  );

  /* ---------------- 查看详情弹窗 ---------------- */
  const handleView = (record: OperOrgFiling) => {
    setCurrentRecord(record);
    setViewTab('apply');
    setShowViewModal(true);
  };

  const handleViewEvidence = (record: OperOrgFiling) => {
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
              <div className="info-cell"><span className="info-label">运营机构</span><span className="info-value">{currentRecord.operOrg}</span></div>
              <div className="info-cell"><span className="info-label">统一社会信用代码</span><span className="info-value">{currentRecord.creditCode}</span></div>
              <div className="info-cell"><span className="info-label">实施方案</span><span className="info-value"><a className="file-link" href={currentRecord.planFileLink} onClick={(e) => { e.preventDefault(); handleFileClick(currentRecord.planName); }}>📄 {currentRecord.planName}</a></span></div>
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
              <div className="evidence-title">运营机构备案电子凭证</div>
            </div>
            <div className="evidence-content">
              <div className="evidence-row"><span className="evidence-label">凭证编号：</span><span className="evidence-value">BLOCK-OPER-{currentRecord.id.toString().padStart(8, '0')}</span></div>
              <div className="evidence-row"><span className="evidence-label">运营机构：</span><span className="evidence-value">{currentRecord.operOrg}</span></div>
              <div className="evidence-row"><span className="evidence-label">统一社会信用代码：</span><span className="evidence-value">{currentRecord.creditCode}</span></div>
              <div className="evidence-row"><span className="evidence-label">授权运营类型：</span><span className="evidence-value">{currentRecord.authType}</span></div>
              <div className="evidence-row"><span className="evidence-label">领域名称：</span><span className="evidence-value">{currentRecord.domain}</span></div>
              <div className="evidence-row"><span className="evidence-label">所属地域：</span><span className="evidence-value">{currentRecord.region}</span></div>
              <div className="evidence-row"><span className="evidence-label">实施方案：</span><span className="evidence-value">{currentRecord.planName}</span></div>
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
        activeMenu="pending-operation-org-filing"
        breadcrumb="运营机构备案"
        role={role}
        onRoleChange={setRole}
        roleOptions={['运营机构', '实施机构', '数据管理部门']}
        title="运营机构备案"
      >
        <div className="filter-section">
          <div className="filter-actions">
            <div className="filter-actions-right">
              <div className="page-actions">
                <button className="btn btn-primary" onClick={handleAdd}>+ 运营机构备案</button>
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
                  <th>运营机构</th>
                  <th>统一社会信用代码</th>
                  <th>实施方案</th>
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
                    <td className="oper-org-cell" title={record.operOrg}>{record.operOrg}</td>
                    <td className="credit-cell">{record.creditCode}</td>
                    <td className="plan-cell" title={record.planName}>
                      <a className="file-link" href={record.planFileLink} onClick={(e) => { e.preventDefault(); handleFileClick(record.planName); }}>📄 {record.planName}</a>
                    </td>
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
                    <td colSpan={10} className="empty-row">暂无数据</td>
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

      {showAddModal && renderFormModal('运营机构备案', handleSubmitAdd)}
      {showEditModal && renderFormModal('编辑运营机构备案', handleSubmitEdit)}
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

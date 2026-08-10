/**
 * @name 产品和服务清单备案
 * @mode axure
 *
 * 产品和服务清单备案页面，用于运营机构对数据产品、数据服务进行线上备案管理
 */

import { useEffect, useState } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

interface ProductItem {
  id: number;
  name: string;
  desc: string;
  deliveryMethod: string;
  feeNote: string;
}

interface RecordProductItem extends ProductItem {
  filingName: string;
  updateTime: string;
}

interface FilingFormData {
  filingName: string;
  region: string;
  authType: string;
  domain: string;
  implOrg: string;
  orgName: string;
  handler: string;
  handlerPhone: string;
  products: ProductItem[];
}

interface FilingRecord extends FilingFormData {
  id: number;
  status: string;
  createTime: string;
  updateTime: string;
  rejectReason?: string;
}

const DELIVERY_METHODS = ['文件传输', '数据流传输', 'API传输'];
const REGION_OPTIONS = ['长沙市', '省本级', '株洲市', '岳阳市'];

const createEmptyProduct = (id: number): ProductItem => ({
  id,
  name: '',
  desc: '',
  deliveryMethod: '',
  feeNote: ''
});

const getNextBatchNo = (domain: string): number => {
  const existingBatches = recordsSeed
    .filter(r => r.domain === domain)
    .map(r => {
      const match = r.filingName.match(/第(\d+)批/);
      return match ? parseInt(match[1], 10) : 0;
    });
  const maxBatch = existingBatches.length > 0 ? Math.max(...existingBatches) : 0;
  return maxBatch + 1;
};

const createEmptyForm = (): FilingFormData => {
  const domain = '医疗健康';
  const region = '省本级';
  const batchNo = getNextBatchNo(domain);
  return {
    filingName: `${region}${domain}第${batchNo}批产品和服务清单备案`,
    region: '长沙市',
    authType: '分领域授权运营',
    domain,
    implOrg: '卫健委',
    orgName: '湖南数据产业集团有限公司',
    handler: '',
    handlerPhone: '',
    products: [createEmptyProduct(1), createEmptyProduct(2)]
  };
};

const recordsSeed: FilingRecord[] = [
  {
    id: 1,
    filingName: '省本级医疗健康第1批产品和服务清单备案',
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '医疗健康',
    implOrg: '卫健委',
    orgName: '湖南数据产业集团有限公司',
    handler: '张三',
    handlerPhone: '13677228756',
    status: '已备案',
    createTime: '2026-05-18 10:05:57',
    updateTime: '2026-05-18 10:05:57',
    products: [
      { id: 1, name: '湖南省医疗就诊数据', desc: '全省医疗机构就诊数据', deliveryMethod: 'API传输', feeNote: '' },
      { id: 2, name: '湖南省健康档案数据', desc: '居民健康档案数据', deliveryMethod: '数据流传输', feeNote: '' },
      { id: 3, name: '湖南省公共卫生数据', desc: '公共卫生监测数据', deliveryMethod: '文件传输', feeNote: '' }
    ]
  },
  {
    id: 2,
    filingName: '省本级交通运输第2批产品和服务清单备案',
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '交通运输',
    implOrg: '交通厅',
    orgName: '湖南数据产业集团有限公司',
    handler: '李四',
    handlerPhone: '13877228756',
    status: '待实施机构确认',
    createTime: '2026-06-01 09:30:22',
    updateTime: '2026-06-01 09:30:22',
    products: [
      { id: 1, name: '湖南省道路监控数据', desc: '道路监控视频数据', deliveryMethod: '数据流传输', feeNote: '' },
      { id: 2, name: '湖南省交通流量数据', desc: '实时交通流量数据', deliveryMethod: 'API传输', feeNote: '' }
    ]
  },
  {
    id: 3,
    filingName: '省本级教育第3批产品和服务清单备案',
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '教育',
    implOrg: '教育厅',
    orgName: '湖南数据产业集团有限公司',
    handler: '王五',
    handlerPhone: '13977228756',
    status: '实施机构退回',
    createTime: '2026-06-05 14:20:15',
    updateTime: '2026-06-06 08:45:33',
    rejectReason: '数据字段说明不完整，请补充详细的字段描述和数据来源说明',
    products: [
      { id: 1, name: '湖南省教育统计数据', desc: '教育统计年鉴数据', deliveryMethod: '文件传输', feeNote: '' },
      { id: 2, name: '湖南省学生信息数据', desc: '学生基础信息数据', deliveryMethod: 'API传输', feeNote: '' }
    ]
  },
  {
    id: 4,
    filingName: '省本级文化旅游第4批产品和服务清单备案',
    region: '长沙市',
    authType: '整体授权运营',
    domain: '文化旅游',
    implOrg: '文旅厅',
    orgName: '湖南数据产业集团有限公司',
    handler: '赵六',
    handlerPhone: '13777228756',
    status: '待省级确认',
    createTime: '2026-06-10 11:15:28',
    updateTime: '2026-06-10 16:42:10',
    products: [
      { id: 1, name: '湖南省旅游客流数据', desc: '旅游景区客流数据', deliveryMethod: '数据流传输', feeNote: '' }
    ]
  },
  {
    id: 5,
    filingName: '省本级自然资源第5批产品和服务清单备案',
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '自然资源',
    implOrg: '自然资源厅',
    orgName: '湖南数据产业集团有限公司',
    handler: '孙七',
    handlerPhone: '13677228757',
    status: '省级退回',
    createTime: '2026-06-15 13:50:44',
    updateTime: '2026-06-16 09:28:17',
    rejectReason: '数据安全等级评估需要补充相关证明材料',
    products: [
      { id: 1, name: '湖南省土地利用数据', desc: '土地利用现状数据', deliveryMethod: '文件传输', feeNote: '' },
      { id: 2, name: '湖南省矿产资源数据', desc: '矿产资源分布数据', deliveryMethod: 'API传输', feeNote: '' }
    ]
  }
];

const auditHistory = [
  { id: 1, node: '提交备案', status: '已完成', org: '湖南数据产业集团有限公司', handler: '张三', time: '2026-05-18 10:05', result: '-', opinion: '-' },
  { id: 2, node: '实施机构确认备案', status: '已完成', org: '卫健委', handler: '李某', time: '2026-05-18 11:20', result: '审核通过', opinion: '同意' },
  { id: 3, node: '省级确认备案', status: '已完成', org: '数据局', handler: 'A', time: '2026-05-18 15:30', result: '审核通过', opinion: '同意' },
  { id: 4, node: '变更备案', status: '已完成', org: '湖南数据产业集团有限公司', handler: '张三', time: '2026-05-18 15:30', result: '-', opinion: '同意' },
  { id: 5, node: '实施机构确认备案', status: '已完成', org: '卫健委', handler: '李某', time: '2026-05-18 11:20', result: '审核通过', opinion: '同意'  },
  { id: 6, node: '省级确认备案', status: '已完成', org: '数据局', handler: 'A', time: '2026-05-18 15:30', result: '审核通过', opinion: '同意' }
];

const recordListSeed: RecordProductItem[] = [
  { id: 1, filingName: '省本级医疗健康第1批产品和服务清单备案', name: '湖南省医疗就诊数据', desc: '全省医疗机构就诊数据', deliveryMethod: 'API传输', feeNote: '', updateTime: '2026-05-18 10:05:57' },
  { id: 2, filingName: '省本级医疗健康第1批产品和服务清单备案', name: '湖南省健康档案数据', desc: '居民健康档案数据', deliveryMethod: '数据流传输', feeNote: '', updateTime: '2026-05-18 10:05:57' },
  { id: 3, filingName: '省本级医疗健康第1批产品和服务清单备案', name: '湖南省公共卫生数据', desc: '公共卫生监测数据', deliveryMethod: '文件传输', feeNote: '', updateTime: '2026-05-18 10:05:57' },
  { id: 4, filingName: '省本级交通运输第2批产品和服务清单备案', name: '湖南省道路监控数据', desc: '道路监控视频数据', deliveryMethod: '数据流传输', feeNote: '', updateTime: '2026-06-01 09:30:22' },
  { id: 5, filingName: '省本级交通运输第2批产品和服务清单备案', name: '湖南省交通流量数据', desc: '实时交通流量数据', deliveryMethod: 'API传输', feeNote: '', updateTime: '2026-06-01 09:30:22' },
  { id: 6, filingName: '省本级教育第3批产品和服务清单备案', name: '湖南省教育统计数据', desc: '教育统计年鉴数据', deliveryMethod: '文件传输', feeNote: '', updateTime: '2026-06-06 08:45:33' }
];

const OriginalComponent = () => {
  const [searchFilingName, setSearchFilingName] = useState('');
  const [searchProductName, setSearchProductName] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchCreateTimeStart, setSearchCreateTimeStart] = useState('');
  const [searchCreateTimeEnd, setSearchCreateTimeEnd] = useState('');
  const [searchUpdateTimeStart, setSearchUpdateTimeStart] = useState('');
  const [searchUpdateTimeEnd, setSearchUpdateTimeEnd] = useState('');
  const [searchRegion, setSearchRegion] = useState('');
  const [searchAuthType, setSearchAuthType] = useState('');
  const [searchDomain, setSearchDomain] = useState('');
  const [searchImplOrg, setSearchImplOrg] = useState('');
  const [searchOrgName, setSearchOrgName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordSearchProductName, setRecordSearchProductName] = useState('');
  const [recordSearchProductDesc, setRecordSearchProductDesc] = useState('');
  const [recordSearchDelivery, setRecordSearchDelivery] = useState('');
  const [recordSearchUpdateTimeStart, setRecordSearchUpdateTimeStart] = useState('');
  const [recordSearchUpdateTimeEnd, setRecordSearchUpdateTimeEnd] = useState('');
  const [recordCurrentPage, setRecordCurrentPage] = useState(1);
  const [recordPageSize, setRecordPageSize] = useState(10);
  const [currentRecord, setCurrentRecord] = useState<FilingRecord | null>(null);
  const [viewTab, setViewTab] = useState<'apply' | 'audit'>('apply');
  const [viewProductPage, setViewProductPage] = useState(1);
  const [formData, setFormData] = useState<FilingFormData>(createEmptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState('运营机构');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'impl' | 'dept'>('impl');
  const [confirmResult, setConfirmResult] = useState('');
  const [confirmOpinion, setConfirmOpinion] = useState('');
  const [confirmHandler, setConfirmHandler] = useState('');
  const [confirmHandlerPhone, setConfirmHandlerPhone] = useState('');
  const [confirmErrors, setConfirmErrors] = useState<Record<string, string>>({});
  const isImplRole = selectedRole === '实施机构';
  const isDeptRole = selectedRole === '数据管理部门';
  const isOpRole = selectedRole === '运营机构';

  const filteredRecords = recordsSeed.filter(record => {
    if (searchFilingName && !record.filingName.includes(searchFilingName)) return false;
    if (searchProductName && !record.products.some(p => p.name.includes(searchProductName))) return false;
    if (searchStatus && record.status !== searchStatus) return false;
    if (isDeptRole) {
      if (searchRegion && !record.region.includes(searchRegion)) return false;
      if (searchAuthType && record.authType !== searchAuthType) return false;
      if (searchDomain && !record.domain.includes(searchDomain)) return false;
      if (searchImplOrg && !record.implOrg.includes(searchImplOrg)) return false;
      if (searchOrgName && !record.orgName.includes(searchOrgName)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const VIEW_PRODUCTS_PER_PAGE = 2;
  const viewProductTotalPages = currentRecord ? Math.max(1, Math.ceil(currentRecord.products.length / VIEW_PRODUCTS_PER_PAGE)) : 1;
  const viewPaginatedProducts = currentRecord ? currentRecord.products.slice((viewProductPage - 1) * VIEW_PRODUCTS_PER_PAGE, viewProductPage * VIEW_PRODUCTS_PER_PAGE) : [];

  const recordProductList = recordListSeed;

  const filteredRecordProducts = recordProductList.filter(item => {
    if (recordSearchProductName && !item.name.includes(recordSearchProductName)) return false;
    if (recordSearchProductDesc && !item.desc.includes(recordSearchProductDesc)) return false;
    if (recordSearchDelivery && item.deliveryMethod !== recordSearchDelivery) return false;
    if (recordSearchUpdateTimeStart && item.updateTime < recordSearchUpdateTimeStart) return false;
    if (recordSearchUpdateTimeEnd && item.updateTime > recordSearchUpdateTimeEnd + ' 23:59:59') return false;
    return true;
  });

  const recordTotalPages = Math.max(1, Math.ceil(filteredRecordProducts.length / recordPageSize));
  const safeRecordPage = Math.min(recordCurrentPage, recordTotalPages);
  const paginatedRecordProducts = filteredRecordProducts.slice((safeRecordPage - 1) * recordPageSize, safeRecordPage * recordPageSize);

  useEffect(() => {
    setRecordCurrentPage(1);
  }, [recordSearchProductName, recordSearchProductDesc, recordSearchDelivery, recordSearchUpdateTimeStart, recordSearchUpdateTimeEnd, showRecordModal]);

  const handleRecordReset = () => {
    setRecordSearchProductName('');
    setRecordSearchProductDesc('');
    setRecordSearchDelivery('');
    setRecordSearchUpdateTimeStart('');
    setRecordSearchUpdateTimeEnd('');
    setRecordCurrentPage(1);
  };

  const closeFormModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const getStatusClass = (status: string) => {
    if (status === '已备案') return 'status-approved';
    if (status.includes('退回')) return status.includes('省级') ? 'status-province-rejected' : 'status-rejected';
    if (status.includes('省级')) return 'status-province';
    if (status.includes('待实施')) return 'status-pending';
    return 'status-default';
  };

  const hasViewEvidence = (record: FilingRecord) => record.status === '已备案';
  const hasEdit = (record: FilingRecord) => isOpRole && (record.status === '实施机构退回' || record.status === '省级退回');
  const hasConfirm = (record: FilingRecord) => (isImplRole && record.status === '待实施机构确认') || (isDeptRole && record.status === '待省级确认');

  const handleViewDetail = (record: FilingRecord) => {
    setCurrentRecord(record);
    setViewTab('apply');
    setViewProductPage(1);
    setShowViewModal(true);
  };

  const handleConfirm = (record: FilingRecord) => {
    setCurrentRecord(record);
    setConfirmResult('');
    setConfirmOpinion('');
    setConfirmHandler('');
    setConfirmHandlerPhone('');
    setConfirmErrors({});
    setConfirmMode(isDeptRole ? 'dept' : 'impl');
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    const errors: Record<string, string> = {};
    if (confirmMode === 'impl') {
      if (!confirmHandler.trim()) errors.confirmHandler = '请输入实施机构经办人';
      if (!confirmHandlerPhone.trim()) errors.confirmHandlerPhone = '请输入实施机构经办人电话';
    }
    if (!confirmResult) errors.confirmResult = '请选择确认结果';
    setConfirmErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setShowConfirmModal(false);
    alert('确认' + (confirmResult === '备案通过' ? '通过' : '退回') + '提交成功');
  };

  const handleAdd = () => {
    setFormData(createEmptyForm());
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEdit = (record: FilingRecord) => {
    setCurrentRecord(record);
    setFormData({
      filingName: record.filingName,
      region: record.region,
      authType: record.authType,
      domain: record.domain,
      implOrg: record.implOrg,
      orgName: record.orgName,
      handler: record.handler,
      handlerPhone: record.handlerPhone,
      products: record.products.map((p, index) => ({ ...p, id: Date.now() + index }))
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleReset = () => {
    setSearchFilingName('');
    setSearchProductName('');
    setSearchStatus('');
    setSearchCreateTimeStart('');
    setSearchCreateTimeEnd('');
    setSearchUpdateTimeStart('');
    setSearchUpdateTimeEnd('');
    setSearchRegion('');
    setSearchAuthType('');
    setSearchDomain('');
    setSearchImplOrg('');
    setSearchOrgName('');
  };

  const handleFormChange = (field: keyof FilingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleProductChange = (productId: number, field: keyof ProductItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === productId ? { ...p, [field]: value } : p)
    }));
    const key = `product_${productId}_${field}`;
    if (formErrors[key]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleAddProductRow = () => {
    setFormData(prev => ({ ...prev, products: [...prev.products, createEmptyProduct(Date.now())] }));
  };

  const handleDeleteProductRow = (productId: number) => {
    setFormData(prev => {
      const products = prev.products.filter(p => p.id !== productId);
      return { ...prev, products: products.length > 0 ? products : [createEmptyProduct(Date.now())] };
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.handler.trim()) errors.handler = '请输入运营机构经办人';
    if (!formData.handlerPhone.trim()) errors.handlerPhone = '请输入运营机构经办人电话';
    formData.products.forEach(product => {
      if (!product.name.trim()) errors[`product_${product.id}_name`] = '请输入产品名称';
      if (!product.desc.trim()) errors[`product_${product.id}_desc`] = '请输入产品简介';
      if (!product.deliveryMethod) errors[`product_${product.id}_deliveryMethod`] = '请选择交付方式';
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      closeFormModals();
      alert('提交成功');
    }
  };

  const getProductDisplay = (products: ProductItem[]) => {
    if (products.length <= 3) return products.map(p => p.name).join('、');
    return products.slice(0, 3).map(p => p.name).join('、') + ' 等' + products.length + '项';
  };

  const renderFormModal = (title: string) => (
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
                <label>备案名称</label>
                <input type="text" value={formData.filingName} disabled />
              </div>
              <div className="form-item"><label>所属地域</label><input type="text" value={formData.region} disabled /></div>
              <div className="form-item"><label>授权运营类型</label><input type="text" value={formData.authType} disabled /></div>
              <div className="form-item"><label>领域名称</label><input type="text" value={formData.domain} disabled /></div>
              {showEditModal && currentRecord && (currentRecord.status === '实施机构退回' || currentRecord.status === '省级退回') && (
                <>
                  <div className="form-item"><label>实施机构名称</label><input type="text" value={formData.implOrg} disabled /></div>
                  <div className="form-item"><label>实施机构经办人</label><input type="text" value="李某" disabled /></div>
                  <div className="form-item"><label>实施机构经办人电话</label><input type="text" value="13577228756" disabled /></div>
                </>
              )}
              <div className="form-item"><label>运营机构名称</label><input type="text" value={formData.orgName} disabled /></div>
              <div className="form-item">
                <label>运营机构经办人 <span className="required">*</span></label>
                <input type="text" placeholder="请输入运营机构经办人" value={formData.handler} onChange={(e) => handleFormChange('handler', e.target.value)} className={formErrors.handler ? 'has-error' : ''} />
                {formErrors.handler && <span className="error-text">{formErrors.handler}</span>}
              </div>
              <div className="form-item">
                <label>运营机构经办人电话 <span className="required">*</span></label>
                <input type="text" placeholder="请输入运营机构经办人电话" value={formData.handlerPhone} onChange={(e) => handleFormChange('handlerPhone', e.target.value)} className={formErrors.handlerPhone ? 'has-error' : ''} />
                {formErrors.handlerPhone && <span className="error-text">{formErrors.handlerPhone}</span>}
              </div>
              <div className="form-item"></div>
            </div>
          </div>

          <div className="form-section">
            <h4 className="section-title">
              <span className="title-bar"></span>产品和服务清单
              <button className="btn-add-row" onClick={handleAddProductRow}>+ 新增</button>
            </h4>
            <div className="product-table-wrapper">
              <table className="product-form-table">
                <thead>
                  <tr>
                    <th className="col-seq">序号</th>
                    <th className="col-product-name"><span className="required">*</span> 产品名称</th>
                    <th className="col-product-desc"><span className="required">*</span> 产品简介</th>
                    <th className="col-delivery"><span className="required">*</span> 交付方式</th>
                    <th className="col-fee">服务费备注</th>
                    <th className="col-op">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.products.map((product, index) => (
                    <tr key={product.id}>
                      <td className="col-seq">{index + 1}</td>
                      <td>
                        <input type="text" placeholder="请输入产品名称" value={product.name} onChange={(e) => handleProductChange(product.id, 'name', e.target.value)} className={formErrors[`product_${product.id}_name`] ? 'has-error' : ''} />
                        {formErrors[`product_${product.id}_name`] && <span className="error-text">{formErrors[`product_${product.id}_name`]}</span>}
                      </td>
                      <td>
                        <input type="text" placeholder="请输入产品简介" value={product.desc} onChange={(e) => handleProductChange(product.id, 'desc', e.target.value)} className={formErrors[`product_${product.id}_desc`] ? 'has-error' : ''} />
                        {formErrors[`product_${product.id}_desc`] && <span className="error-text">{formErrors[`product_${product.id}_desc`]}</span>}
                      </td>
                      <td>
                        <select value={product.deliveryMethod} onChange={(e) => handleProductChange(product.id, 'deliveryMethod', e.target.value)} className={formErrors[`product_${product.id}_deliveryMethod`] ? 'has-error' : ''}>
                          <option value="">请选择</option>
                          {DELIVERY_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                        </select>
                        {formErrors[`product_${product.id}_deliveryMethod`] && <span className="error-text">{formErrors[`product_${product.id}_deliveryMethod`]}</span>}
                      </td>
                      <td><input type="text" placeholder="请输入服务费备注" value={product.feeNote} onChange={(e) => handleProductChange(product.id, 'feeNote', e.target.value)} /></td>
                      <td className="col-op"><button className="btn-delete-row" onClick={() => handleDeleteProductRow(product.id)}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <div className="info-cell"><span className="info-label">备案名称</span><span className="info-value">{currentRecord.filingName}</span></div>
                <div className="info-cell"><span className="info-label">所属地域</span><span className="info-value">{currentRecord.region}</span></div>
                <div className="info-cell"><span className="info-label">授权运营类型</span><span className="info-value">{currentRecord.authType}</span></div>
                <div className="info-cell"><span className="info-label">领域名称</span><span className="info-value">{currentRecord.domain}</span></div>              
                {currentRecord.status !== '待实施机构确认' && (
                  <>
                    <div className="info-cell"><span className="info-label">实施机构名称</span><span className="info-value">{currentRecord.implOrg}</span></div>
                    <div className="info-cell"><span className="info-label">实施机构经办人</span><span className="info-value">李某</span></div>
                    <div className="info-cell"><span className="info-label">实施机构经办人电话</span><span className="info-value">13577228756</span></div>
                  </>
                )}
                 <div className="info-cell"><span className="info-label">运营机构名称</span><span className="info-value">{currentRecord.orgName}</span></div>
                <div className="info-cell"><span className="info-label">运营机构经办人</span><span className="info-value">{currentRecord.handler}</span></div>
                <div className="info-cell"><span className="info-label">运营机构经办人电话</span><span className="info-value">{currentRecord.handlerPhone}</span></div>
              </div>
              <div className="product-section">
                <h4 className="section-title"><span className="title-bar"></span>本次备案的产品和服务清单</h4>
                <table className="product-view-table">
                  <thead>
                    <tr><th className="col-seq">序号</th><th>产品名称</th><th>产品简介</th><th>交付方式</th><th>服务费备注</th></tr>
                  </thead>
                  <tbody>
                    {viewPaginatedProducts.map((product, index) => (
                      <tr key={product.id}><td className="col-seq">{(viewProductPage - 1) * VIEW_PRODUCTS_PER_PAGE + index + 1}</td><td>{product.name}</td><td>{product.desc}</td><td>{product.deliveryMethod}</td><td>{product.feeNote || '-'}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="product-pagination">
                  <button className="page-btn" disabled={viewProductPage === 1} onClick={() => setViewProductPage(viewProductPage - 1)}>上一页</button>
                  {Array.from({ length: viewProductTotalPages }, (_, index) => index + 1).map(page => <button key={page} className={'page-btn ' + (page === viewProductPage ? 'active' : '')} onClick={() => setViewProductPage(page)}>{page}</button>)}
                  <button className="page-btn" disabled={viewProductPage === viewProductTotalPages} onClick={() => setViewProductPage(viewProductPage + 1)}>下一页</button>
                </div>
              </div>
            </>
          )}
          {viewTab === 'audit' && (
            <div className="audit-table-wrapper">
              <table className="audit-table">
                <thead><tr><th>序号</th><th>流程节点</th><th>节点状态</th><th>单位名称</th><th>法人经办人姓名</th><th>操作时间</th><th>审核结果</th><th>审核意见</th></tr></thead>
                <tbody>{auditHistory.map(item => <tr key={item.id}><td>{item.id}</td><td>{item.node}</td><td><span className="node-status completed">{item.status}</span></td><td>{item.org}</td><td>{item.handler}</td><td>{item.time}</td><td>{item.result}</td><td>{item.opinion}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
    <Layout
      activeMenu="product-service-filing"
      breadcrumb="产品和服务清单备案"
      role={selectedRole}
      onRoleChange={setSelectedRole}
      title="产品和服务清单备案"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
        <div className="filter-section">
          {isDeptRole ? (
            <>
              <div className="filter-row">
                <div className="filter-item filter-item-select"><label>所属地域</label><select value={searchRegion} onChange={(e) => setSearchRegion(e.target.value)}><option value="">请选择</option>{REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <div className="filter-item filter-item-select"><label>授权运营类型</label><select value={searchAuthType} onChange={(e) => setSearchAuthType(e.target.value)}><option value="">请选择</option><option value="分领域授权运营">分领域授权运营</option><option value="整体授权运营">整体授权运营</option></select></div>
                <div className="filter-item"><label>领域名称</label><input type="text" placeholder="请输入" value={searchDomain} onChange={(e) => setSearchDomain(e.target.value)} /></div>
                <div className="filter-item"><label>备案名称</label><input type="text" placeholder="请输入" value={searchFilingName} onChange={(e) => setSearchFilingName(e.target.value)} /></div>
              </div>
              <div className="filter-row">
                <div className="filter-item"><label>实施机构</label><input type="text" placeholder="请输入" value={searchImplOrg} onChange={(e) => setSearchImplOrg(e.target.value)} /></div>
                <div className="filter-item"><label>运营机构</label><input type="text" placeholder="请输入" value={searchOrgName} onChange={(e) => setSearchOrgName(e.target.value)} /></div>
                <div className="filter-item"><label>产品名称</label><input type="text" placeholder="请输入" value={searchProductName} onChange={(e) => setSearchProductName(e.target.value)} /></div>
                <div className="filter-item filter-item-select"><label>备案状态</label><select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}><option value="">请选择</option><option value="已备案">已备案</option><option value="待实施机构确认">待实施机构确认</option><option value="实施机构退回">实施机构退回</option><option value="待省级确认">待省级确认</option><option value="省级退回">省级退回</option></select></div>
              </div>
              <div className="filter-row">
                <div className="filter-item date-range"><label>创建时间</label><div className="date-inputs"><div className="date-input"><input type="date" value={searchCreateTimeStart} onChange={(e) => setSearchCreateTimeStart(e.target.value)} /></div><span className="date-separator">-</span><div className="date-input"><input type="date" value={searchCreateTimeEnd} onChange={(e) => setSearchCreateTimeEnd(e.target.value)} /></div></div></div>
                <div className="filter-item date-range"><label>更新时间</label><div className="date-inputs"><div className="date-input"><input type="date" value={searchUpdateTimeStart} onChange={(e) => setSearchUpdateTimeStart(e.target.value)} /></div><span className="date-separator">-</span><div className="date-input"><input type="date" value={searchUpdateTimeEnd} onChange={(e) => setSearchUpdateTimeEnd(e.target.value)} /></div></div></div>
              </div>
            </>
          ) : (
            <>
              <div className="filter-row">
                <div className="filter-item"><label>备案名称</label><input type="text" placeholder="请输入" value={searchFilingName} onChange={(e) => setSearchFilingName(e.target.value)} /></div>
                <div className="filter-item"><label>产品名称</label><input type="text" placeholder="请输入" value={searchProductName} onChange={(e) => setSearchProductName(e.target.value)} /></div>
                <div className="filter-item filter-item-select"><label>备案状态</label><select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}><option value="">请选择</option><option value="已备案">已备案</option><option value="待实施机构确认">待实施机构确认</option><option value="实施机构退回">实施机构退回</option><option value="待省级确认">待省级确认</option><option value="省级退回">省级退回</option></select></div>
                <div className="filter-item date-range"><label>创建时间</label><div className="date-inputs"><div className="date-input"><input type="date" value={searchCreateTimeStart} onChange={(e) => setSearchCreateTimeStart(e.target.value)} /></div><span className="date-separator">-</span><div className="date-input"><input type="date" value={searchCreateTimeEnd} onChange={(e) => setSearchCreateTimeEnd(e.target.value)} /></div></div></div>
              </div>
              <div className="filter-row">
                <div className="filter-item date-range"><label>更新时间</label><div className="date-inputs"><div className="date-input"><input type="date" value={searchUpdateTimeStart} onChange={(e) => setSearchUpdateTimeStart(e.target.value)} /></div><span className="date-separator">-</span><div className="date-input"><input type="date" value={searchUpdateTimeEnd} onChange={(e) => setSearchUpdateTimeEnd(e.target.value)} /></div></div></div>
              </div>
            </>
          )}
          <div className="filter-actions"><div className="filter-actions-left"><button className="btn btn-primary btn-sm" onClick={() => setCurrentPage(1)}>查询</button><button className="btn btn-default btn-sm" onClick={handleReset}>重置</button></div><div className="filter-actions-right"><div className="page-actions">{isOpRole && <button className="btn btn-primary" onClick={handleAdd}>+ 产品和服务清单备案</button>}{!isDeptRole && <button className="btn btn-default" onClick={() => setShowRecordModal(true)}>备案记录</button>}</div></div></div>
        </div>

        <div className="table-section">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                {isDeptRole ? (
                  <tr><th className="col-index">序号</th><th className="col-region">所属地域</th><th className="col-auth-type">授权运营类型</th><th className="col-domain">领域名称</th><th className="col-name">备案名称</th><th className="col-impl-org">实施机构</th><th className="col-op-org">运营机构</th><th className="col-product">产品名称</th><th className="col-status">备案状态</th><th className="col-time">创建时间</th><th className="col-time">更新时间</th><th className="col-action">操作</th></tr>
                ) : (
                  <tr><th className="col-index">序号</th><th className="col-name">备案名称</th><th className="col-product">产品名称</th><th className="col-status">备案状态</th><th className="col-time">创建时间</th><th className="col-time">更新时间</th><th className="col-action">操作</th></tr>
                )}
              </thead>
              <tbody>
                {paginatedRecords.map((record, index) => (
                  <tr key={record.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    {isDeptRole && (
                      <>
                        <td>{record.region}</td>
                        <td>{record.authType}</td>
                        <td>{record.domain}</td>
                      </>
                    )}
                    <td className="filing-name" title={record.filingName}>{record.filingName}</td>
                    {isDeptRole && (
                      <>
                        <td>{record.implOrg}</td>
                        <td>{record.orgName}</td>
                      </>
                    )}
                    <td className="product-names" title={record.products.map(p => p.name).join('、')}>{getProductDisplay(record.products)}</td>
                    <td><span className={'status-tag ' + getStatusClass(record.status)}>{record.status}</span></td>
                    <td className="time-cell">{record.createTime}</td>
                    <td className="time-cell">{record.updateTime}</td>
                    <td className="action-cell"><div className="action-buttons"><button className="action-btn" onClick={() => handleViewDetail(record)}>查看</button>{hasViewEvidence(record) && <button className="action-btn" onClick={() => { setCurrentRecord(record); setShowEvidenceModal(true); }}>查看存证</button>}{hasConfirm(record) && <button className="action-btn" onClick={() => handleConfirm(record)}>确认</button>}{hasEdit(record) && <button className="action-btn" onClick={() => handleEdit(record)}>编辑</button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination"><span className="pagination-info">共{filteredRecords.length}条记录</span><div className="pagination-controls"><button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>上一页</button><span className="page-number">{currentPage}</span><button className="page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>下一页</button><select className="page-size-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}><option value={10}>10条/页</option><option value={50}>50条/页</option><option value={100}>100条/页</option></select><span className="jump-to">跳至</span><input type="number" className="page-input" min="1" max={totalPages} value={currentPage} onChange={(e) => { const value = Number(e.target.value); if (value >= 1 && value <= totalPages) setCurrentPage(value); }} /><span className="jump-to">页</span></div></div>
        </div>
    </Layout>

      {showAddModal && renderFormModal('产品和服务清单备案')}
      {showEditModal && renderFormModal('编辑产品和服务清单备案')}
      {showViewModal && renderViewModal()}
      {showConfirmModal && currentRecord && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-medium confirm-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>确认</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            <div className="modal-body confirm-modal-body">
              <div className="confirm-record-info">
                <span className="confirm-info-label">备案名称：</span>
                <span className="confirm-info-value">{currentRecord.filingName}</span>
              </div>
              {confirmMode === 'impl' && (<>
                <div className="confirm-form-item">
                  <label>实施机构经办人 <span className="required">*</span></label>
                  <input type="text" placeholder="请输入实施机构经办人" value={confirmHandler} onChange={(e) => { setConfirmHandler(e.target.value); if (confirmErrors.confirmHandler) setConfirmErrors(prev => { const n = { ...prev }; delete n.confirmHandler; return n; }); }} className={confirmErrors.confirmHandler ? 'has-error' : ''} />
                  {confirmErrors.confirmHandler && <span className="error-text">{confirmErrors.confirmHandler}</span>}
                </div>
                <div className="confirm-form-item">
                  <label>实施机构经办人电话 <span className="required">*</span></label>
                  <input type="text" placeholder="请输入实施机构经办人电话" value={confirmHandlerPhone} onChange={(e) => { setConfirmHandlerPhone(e.target.value); if (confirmErrors.confirmHandlerPhone) setConfirmErrors(prev => { const n = { ...prev }; delete n.confirmHandlerPhone; return n; }); }} className={confirmErrors.confirmHandlerPhone ? 'has-error' : ''} />
                  {confirmErrors.confirmHandlerPhone && <span className="error-text">{confirmErrors.confirmHandlerPhone}</span>}
                </div>
              </>)}
              <div className="confirm-form-item">
                <label>确认结果 <span className="required">*</span></label>
                <select value={confirmResult} onChange={(e) => { setConfirmResult(e.target.value); if (confirmErrors.confirmResult) setConfirmErrors(prev => { const n = { ...prev }; delete n.confirmResult; return n; }); }} className={confirmErrors.confirmResult ? 'has-error' : ''}>
                  <option value="">请选择</option>
                  <option value="备案通过">备案通过</option>
                  <option value="备案退回">备案退回</option>
                </select>
                {confirmErrors.confirmResult && <span className="error-text">{confirmErrors.confirmResult}</span>}
              </div>
              <div className="confirm-form-item">
                <label>处理意见</label>
                <textarea placeholder="请输入处理意见（非必填）" value={confirmOpinion} onChange={(e) => setConfirmOpinion(e.target.value)} rows={4} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowConfirmModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleConfirmSubmit}>提交</button>
            </div>
          </div>
        </div>
      )}
      {showEvidenceModal && currentRecord && <div className="modal-overlay" onClick={() => setShowEvidenceModal(false)}><div className="modal-medium" onClick={(event) => event.stopPropagation()}><div className="modal-header"><h3>区块链存证凭证</h3><button className="modal-close" onClick={() => setShowEvidenceModal(false)}>×</button></div><div className="modal-body"><div className="evidence-card"><div className="evidence-header"><div className="evidence-icon">证</div><div className="evidence-title">备案电子凭证</div></div><div className="evidence-content"><div className="evidence-row"><span className="evidence-label">凭证编号：</span><span className="evidence-value">BLOCK-{currentRecord.id.toString().padStart(8, '0')}</span></div><div className="evidence-row"><span className="evidence-label">备案名称：</span><span className="evidence-value">{currentRecord.filingName}</span></div><div className="evidence-row"><span className="evidence-label">产品清单：</span><span className="evidence-value">{currentRecord.products.map(p => p.name).join('、')}</span></div><div className="evidence-row"><span className="evidence-label">存证时间：</span><span className="evidence-value">{currentRecord.updateTime}</span></div><div className="evidence-row"><span className="evidence-label">存证状态：</span><span className="evidence-value success">已确认</span></div></div></div></div><div className="modal-footer"><button className="btn btn-default" onClick={() => setShowEvidenceModal(false)}>关闭</button><button className="btn btn-primary" onClick={() => alert('凭证下载功能')}>下载凭证</button></div></div></div>}
      {showRecordModal && (
        <div className="modal-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="modal-large record-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>备案记录</h3>
              <button className="modal-close" onClick={() => setShowRecordModal(false)}>×</button>
            </div>
            <div className="modal-body record-modal-body">
              <div className="record-filter">
                <div className="filter-row">
                  <div className="filter-item">
                    <label>产品名称</label>
                    <input type="text" placeholder="请输入" value={recordSearchProductName} onChange={(e) => setRecordSearchProductName(e.target.value)} />
                  </div>
                  <div className="filter-item">
                    <label>产品简介</label>
                    <input type="text" placeholder="请输入" value={recordSearchProductDesc} onChange={(e) => setRecordSearchProductDesc(e.target.value)} />
                  </div>
                  <div className="filter-item filter-item-select">
                    <label>交付方式</label>
                    <select value={recordSearchDelivery} onChange={(e) => setRecordSearchDelivery(e.target.value)}>
                      <option value="">请选择</option>
                      {DELIVERY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="filter-item date-range">
                    <label>备案时间</label>
                    <div className="date-inputs">
                      <div className="date-input"><input type="date" value={recordSearchUpdateTimeStart} onChange={(e) => setRecordSearchUpdateTimeStart(e.target.value)} /></div>
                      <span className="date-separator">-</span>
                      <div className="date-input"><input type="date" value={recordSearchUpdateTimeEnd} onChange={(e) => setRecordSearchUpdateTimeEnd(e.target.value)} /></div>
                    </div>
                  </div>
                </div>
                <div className="filter-actions">
                  <div className="filter-actions-left">
                    <button className="btn btn-primary btn-sm" onClick={() => { /* trigger re-render */ }}>查询</button>
                    <button className="btn btn-default btn-sm" onClick={handleRecordReset}>重置</button>
                  </div>
                </div>
              </div>
              <div className="record-table-section">
                <table className="data-table record-data-table">
                  <thead>
                    <tr>
                      <th className="col-seq">序号</th>
                      <th>产品名称</th>
                      <th>产品简介</th>
                      <th>交付方式</th>
                      <th>服务费备注</th>
                      <th>备案时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecordProducts.map((item, idx) => (
                      <tr key={idx}>
                        <td className="col-seq">{(safeRecordPage - 1) * recordPageSize + idx + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.desc}</td>
                        <td>{item.deliveryMethod}</td>
                        <td>{item.feeNote || '-'}</td>
                        <td>{item.updateTime}</td>
                      </tr>
                    ))}
                    {filteredRecordProducts.length === 0 && (
                      <tr><td colSpan={6} className="empty-row">暂无数据</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="record-pagination">
                  <span className="record-pagination-info">共 {filteredRecordProducts.length} 条记录</span>
                  <div className="record-pagination-controls">
                    <button className="page-btn" disabled={safeRecordPage === 1} onClick={() => setRecordCurrentPage(safeRecordPage - 1)}>上一页</button>
                    {Array.from({ length: recordTotalPages }, (_, index) => index + 1).map(page => (
                      <button key={page} className={'page-btn ' + (page === safeRecordPage ? 'active' : '')} onClick={() => setRecordCurrentPage(page)}>{page}</button>
                    ))}
                    <button className="page-btn" disabled={safeRecordPage >= recordTotalPages} onClick={() => setRecordCurrentPage(safeRecordPage + 1)}>下一页</button>
                    <select className="page-size-select" value={recordPageSize} onChange={(e) => { setRecordPageSize(Number(e.target.value)); setRecordCurrentPage(1); }}>
                      <option value={10}>10条/页</option>
                      <option value={20}>20条/页</option>
                      <option value={50}>50条/页</option>
                    </select>
                    <span className="jump-to">跳至</span>
                    <input type="number" className="page-input" min="1" max={recordTotalPages} value={safeRecordPage} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= recordTotalPages) setRecordCurrentPage(v); }} />
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
      )}
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



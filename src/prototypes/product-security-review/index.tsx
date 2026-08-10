/**
 * @name 产品安全审查
 * @mode axure
 *
 * 数据产品安全审查管理列表，支持待处理和已处理两个TAB页
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import Layout from '../../common/Layout';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

interface ReviewRecord {
  id: number;
  reviewNo: string;
  productName: string;
  productType: string;
  industryCategory: string;
  productSource: string;
  legalHandler: string;
  unitName: string;
  applyTime: string;
  reviewTime?: string;
  reviewStatus: '待审查' | '审查通过' | '审查不通过';
  materialResult?: string;
  codeResult?: string;
  reviewOpinion?: string;
  reviewer?: string;
}

const PRODUCT_TYPES = ['API产品', '数据集', '数据报告'];
const PRODUCT_SOURCES = ['可信数据空间', '数据开发中心'];
const INDUSTRY_CATEGORIES = ['医疗卫生', '教育培训', '交通运输', '文化旅游', '自然资源', '公共安全'];
const REVIEW_STATUS_OPTIONS = ['审查通过', '审查不通过'];
const REVIEW_RESULTS = ['审查通过', '审查不通过'];

const seedData: ReviewRecord[] = [
  {
    id: 1,
    reviewNo: 'AQSC202607150001',
    productName: '省级医保实时监控API',
    productType: 'API产品',
    industryCategory: '医疗卫生',
    productSource: '可信数据空间',
    legalHandler: '张三',
    unitName: '杭州医保科技股份有限公司',
    applyTime: '2026-07-21 10:23:45',
    reviewTime: '2026-07-21 14:05:12',
    reviewStatus: '审查通过',
    materialResult: '审查通过',
    codeResult: '审查通过',
    reviewOpinion: '产品资料齐全，代码安全审查通过。',
    reviewer: '李审查员'
  },
  {
    id: 2,
    reviewNo: 'AQSC202607150004',
    productName: '城市感知数据报告',
    productType: '数据报告',
    industryCategory: '公共安全',
    productSource: '可信数据空间',
    legalHandler: '赵丽',
    unitName: '杭州城市数据有限公司',
    applyTime: '2026-07-18 16:00:10',
    reviewTime: '2026-07-21 09:20:18',
    reviewStatus: '审查通过',
    materialResult: '审查通过',
    codeResult: '审查通过',
    reviewOpinion: '报告内容合规，数据来源可追溯。',
    reviewer: '张审查员'
  },
  {
    id: 3,
    reviewNo: 'AQSC202607150005',
    productName: '省级卫生健康一体化',
    productType: 'API产品',
    industryCategory: '医疗卫生',
    productSource: '可信数据空间',
    legalHandler: '刘三',
    unitName: '杭州卫健委信息中心',
    applyTime: '2026-07-17 08:45:22',
    reviewTime: '2026-07-21 10:15:40',
    reviewStatus: '审查通过',
    materialResult: '审查通过',
    codeResult: '审查通过',
    reviewOpinion: '产品符合医疗数据安全规范要求。',
    reviewer: '李审查员'
  },
  {
    id: 4,
    reviewNo: 'AQSC202607150006',
    productName: '基础教育资源库',
    productType: '数据集',
    industryCategory: '教育培训',
    productSource: '数据开发中心',
    legalHandler: '孙七',
    unitName: '杭州教育科技有限公司',
    applyTime: '2026-07-16 13:30:55',
    reviewTime: '2026-07-21 15:40:30',
    reviewStatus: '审查通过',
    materialResult: '审查通过',
    codeResult: '审查通过',
    reviewOpinion: '数据分类分级清晰，访问控制完善。',
    reviewer: '陈审查员'
  },
  {
    id: 5,
    reviewNo: 'AQSC202607150007',
    productName: '智能停车管理系统API',
    productType: 'API产品',
    industryCategory: '交通运输',
    productSource: '数据开发中心',
    legalHandler: '周八',
    unitName: '杭州智能交通有限公司',
    applyTime: '2026-07-15 11:20:00',
    reviewTime: '2026-07-21 08:30:15',
    reviewStatus: '审查不通过',
    materialResult: '审查不通过',
    codeResult: '审查通过',
    reviewOpinion: '产品资料描述不准确，需补充安全说明文档。',
    reviewer: '张审查员'
  },
  // 待审查数据
  {
    id: 6,
    reviewNo: 'AQSC202608010011',
    productName: '智能医保审核API',
    productType: 'API产品',
    industryCategory: '医疗卫生',
    productSource: '可信数据空间',
    legalHandler: '陈十五',
    unitName: '杭州医保智能科技有限公司',
    applyTime: '2026-08-01 10:15:20',
    reviewStatus: '待审查'
  },
  {
    id: 7,
    reviewNo: 'AQSC202608010012',
    productName: '教育质量评估数据集',
    productType: '数据集',
    industryCategory: '教育培训',
    productSource: '可信数据空间',
    legalHandler: '刘十六',
    unitName: '杭州教育评估中心',
    applyTime: '2026-08-01 09:30:45',
    reviewStatus: '待审查'
  },
  {
    id: 8,
    reviewNo: 'AQSC202607310013',
    productName: '交通异常事件分析API',
    productType: 'API产品',
    industryCategory: '交通运输',
    productSource: '数据开发中心',
    legalHandler: '周十七',
    unitName: '杭州交通数据分析有限公司',
    applyTime: '2026-07-31 16:00:00',
    reviewStatus: '待审查'
  },
  {
    id: 9,
    reviewNo: 'AQSC202607310014',
    productName: '文化遗产数字化保护报告',
    productType: '数据报告',
    industryCategory: '文化旅游',
    productSource: '可信数据空间',
    legalHandler: '吴十八',
    unitName: '杭州文化遗产研究院',
    applyTime: '2026-07-31 14:20:30',
    reviewStatus: '待审查'
  },
  {
    id: 10,
    reviewNo: 'AQSC202607300015',
    productName: '森林资源监测数据集',
    productType: '数据集',
    industryCategory: '自然资源',
    productSource: '数据开发中心',
    legalHandler: '郑十九',
    unitName: '杭州林业科技有限公司',
    applyTime: '2026-07-30 11:45:10',
    reviewStatus: '待审查'
  }
];

const OriginalComponent = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');
  const [role, setRole] = useState('运营机构');
  const [activeMenu] = useState<'product-security-review'>('product-security-review');
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

  const [records, setRecords] = useState<ReviewRecord[]>(seedData);

  // Pending tab filters
  const [searchNo, setSearchNo] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchSource, setSearchSource] = useState('');
  const [searchApplyStart, setSearchApplyStart] = useState('');
  const [searchApplyEnd, setSearchApplyEnd] = useState('');

  // Processed tab filters
  const [reviewSearchNo, setReviewSearchNo] = useState('');
  const [reviewSearchProduct, setReviewSearchProduct] = useState('');
  const [reviewSearchType, setReviewSearchType] = useState('');
  const [reviewSearchSource, setReviewSearchSource] = useState('');
  const [reviewSearchApplyStart, setReviewSearchApplyStart] = useState('');
  const [reviewSearchApplyEnd, setReviewSearchApplyEnd] = useState('');
  const [reviewSearchStart, setReviewSearchStart] = useState('');
  const [reviewSearchEnd, setReviewSearchEnd] = useState('');
  const [reviewSearchStatus, setReviewSearchStatus] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ReviewRecord | null>(null);

  // Review form state
  const [reviewForm, setReviewForm] = useState({ materialResult: '', codeResult: '', reviewOpinion: '' });
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});

  const pendingRecords = useMemo(() => records.filter(r => r.reviewStatus === '待审查'), [records]);
  const processedRecords = useMemo(() => records.filter(r => r.reviewStatus !== '待审查'), [records]);

  const filteredPending = useMemo(() => {
    return pendingRecords.filter(r => {
      if (searchNo && !r.reviewNo.includes(searchNo)) return false;
      if (searchProduct && !r.productName.includes(searchProduct)) return false;
      if (searchType && r.productType !== searchType) return false;
      if (searchSource && r.productSource !== searchSource) return false;
      if (searchApplyStart && r.applyTime < searchApplyStart) return false;
      if (searchApplyEnd && r.applyTime > searchApplyEnd + ' 23:59:59') return false;
      return true;
    }).sort((a, b) => b.applyTime.localeCompare(a.applyTime));
  }, [pendingRecords, searchNo, searchProduct, searchType, searchSource, searchApplyStart, searchApplyEnd]);

  const filteredProcessed = useMemo(() => {
    return processedRecords.filter(r => {
      if (reviewSearchNo && !r.reviewNo.includes(reviewSearchNo)) return false;
      if (reviewSearchProduct && !r.productName.includes(reviewSearchProduct)) return false;
      if (reviewSearchType && r.productType !== reviewSearchType) return false;
      if (reviewSearchSource && r.productSource !== reviewSearchSource) return false;
      if (reviewSearchApplyStart && r.applyTime < reviewSearchApplyStart) return false;
      if (reviewSearchApplyEnd && r.applyTime > reviewSearchApplyEnd + ' 23:59:59') return false;
      if (reviewSearchStart && (!r.reviewTime || r.reviewTime < reviewSearchStart)) return false;
      if (reviewSearchEnd && (!r.reviewTime || r.reviewTime > reviewSearchEnd + ' 23:59:59')) return false;
      if (reviewSearchStatus && r.reviewStatus !== reviewSearchStatus) return false;
      return true;
    }).sort((a, b) => (b.reviewTime || '').localeCompare(a.reviewTime || ''));
  }, [processedRecords, reviewSearchNo, reviewSearchProduct, reviewSearchType, reviewSearchSource, reviewSearchApplyStart, reviewSearchApplyEnd, reviewSearchStart, reviewSearchEnd, reviewSearchStatus]);

  const currentList = activeTab === 'pending' ? filteredPending : filteredProcessed;
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
  const paginatedList = currentList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleTabSwitch = (tab: 'pending' | 'processed') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setPageSize(10);
  };

  const handlePendingReset = () => {
    setSearchNo('');
    setSearchProduct('');
    setSearchType('');
    setSearchSource('');
    setSearchApplyStart('');
    setSearchApplyEnd('');
    setCurrentPage(1);
  };

  const handleProcessedReset = () => {
    setReviewSearchNo('');
    setReviewSearchProduct('');
    setReviewSearchType('');
    setReviewSearchSource('');
    setReviewSearchApplyStart('');
    setReviewSearchApplyEnd('');
    setReviewSearchStart('');
    setReviewSearchEnd('');
    setReviewSearchStatus('');
    setCurrentPage(1);
  };

  const handleReview = (record: ReviewRecord) => {
    setCurrentRecord(record);
    setReviewForm({ materialResult: '', codeResult: '', reviewOpinion: '' });
    setReviewErrors({});
    setShowReviewModal(true);
  };

  const handleView = (record: ReviewRecord) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  const handleViewEvidence = (record: ReviewRecord) => {
    setCurrentRecord(record);
    setShowEvidenceModal(true);
  };

  const handleReviewSubmit = () => {
    const errors: Record<string, string> = {};
    if (!reviewForm.materialResult) errors.materialResult = '请选择产品资料审查结果';
    if (!reviewForm.codeResult) errors.codeResult = '请选择产品代码审查结果';
    if (Object.keys(errors).length > 0) {
      setReviewErrors(errors);
      return;
    }

    const finalStatus = (reviewForm.materialResult === '审查不通过' || reviewForm.codeResult === '审查不通过')
      ? '审查不通过'
      : '审查通过';

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const reviewTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    setRecords(prev => prev.map(r => r.id === currentRecord!.id ? {
      ...r,
      reviewStatus: finalStatus,
      reviewTime,
      materialResult: reviewForm.materialResult,
      codeResult: reviewForm.codeResult,
      reviewOpinion: reviewForm.reviewOpinion,
      reviewer: role
    } : r));

    setShowReviewModal(false);
    setCurrentRecord(null);
  };

  const getStatusClass = (status: string) => {
    if (status === '待审查') return 'status-pending';
    if (status === '审查通过') return 'status-approved';
    return 'status-rejected';
  };

  const renderPendingFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        <div className="filter-item">
          <label>申请单号</label>
          <input type="text" placeholder="请输入" value={searchNo} onChange={(e) => setSearchNo(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>产品名称</label>
          <input type="text" placeholder="请输入" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>产品类型</label>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="">请选择</option>
            {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-item filter-item-select">
          <label>产品来源</label>
          <select value={searchSource} onChange={(e) => setSearchSource(e.target.value)}>
            <option value="">请选择</option>
            {PRODUCT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="filter-row">
        <div className="filter-item date-range">
          <label>申请时间</label>
          <div className="date-inputs">
            <div className="date-input"><input type="date" value={searchApplyStart} onChange={(e) => setSearchApplyStart(e.target.value)} /></div>
            <span className="date-separator">-</span>
            <div className="date-input"><input type="date" value={searchApplyEnd} onChange={(e) => setSearchApplyEnd(e.target.value)} /></div>
          </div>
        </div>
      </div>
      <div className="filter-actions">
        <div className="filter-actions-left">
          <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage(1)}>查询</button>
          <button className="btn btn-default btn-sm" onClick={handlePendingReset}>重置</button>
        </div>
      </div>
    </div>
  );

  const renderProcessedFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        <div className="filter-item">
          <label>申请单号</label>
          <input type="text" placeholder="请输入" value={reviewSearchNo} onChange={(e) => setReviewSearchNo(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>产品名称</label>
          <input type="text" placeholder="请输入" value={reviewSearchProduct} onChange={(e) => setReviewSearchProduct(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>产品类型</label>
          <select value={reviewSearchType} onChange={(e) => setReviewSearchType(e.target.value)}>
            <option value="">请选择</option>
            {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-item filter-item-select">
          <label>产品来源</label>
          <select value={reviewSearchSource} onChange={(e) => setReviewSearchSource(e.target.value)}>
            <option value="">请选择</option>
            {PRODUCT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="filter-row">
        <div className="filter-item date-range">
          <label>申请时间</label>
          <div className="date-inputs">
            <div className="date-input"><input type="date" value={reviewSearchApplyStart} onChange={(e) => setReviewSearchApplyStart(e.target.value)} /></div>
            <span className="date-separator">-</span>
            <div className="date-input"><input type="date" value={reviewSearchApplyEnd} onChange={(e) => setReviewSearchApplyEnd(e.target.value)} /></div>
          </div>
        </div>
        <div className="filter-item date-range">
          <label>审查时间</label>
          <div className="date-inputs">
            <div className="date-input"><input type="date" value={reviewSearchStart} onChange={(e) => setReviewSearchStart(e.target.value)} /></div>
            <span className="date-separator">-</span>
            <div className="date-input"><input type="date" value={reviewSearchEnd} onChange={(e) => setReviewSearchEnd(e.target.value)} /></div>
          </div>
        </div>
        <div className="filter-item filter-item-select">
          <label>审查状态</label>
          <select value={reviewSearchStatus} onChange={(e) => setReviewSearchStatus(e.target.value)}>
            <option value="">请选择</option>
            {REVIEW_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="filter-actions">
        <div className="filter-actions-left">
          <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage(1)}>查询</button>
          <button className="btn btn-default btn-sm" onClick={handleProcessedReset}>重置</button>
        </div>
      </div>
    </div>
  );

  const renderPendingTable = () => (
    <div className="table-section">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-index">序号</th>
              <th className="col-no">申请单号</th>
              <th className="col-product">产品名称</th>
              <th className="col-type">产品类型</th>
              <th className="col-industry">行业分类</th>
              <th className="col-source">产品来源</th>
              <th className="col-handler">法人经办人</th>
              <th className="col-unit">单位名称</th>
              <th className="col-time">申请时间</th>
              <th className="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr><td colSpan={10}><div className="empty-state"><div className="empty-state-icon">📋</div>暂无数据</div></td></tr>
            ) : paginatedList.map((record, index) => (
              <tr key={record.id}>
                <td>{(currentPage - 1) * pageSize + index + 1}</td>
                <td>{record.reviewNo}</td>
                <td title={record.productName}>{record.productName}</td>
                <td>{record.productType}</td>
                <td>{record.industryCategory}</td>
                <td>{record.productSource}</td>
                <td>{record.legalHandler}</td>
                <td title={record.unitName}>{record.unitName}</td>
                <td>{record.applyTime}</td>
                <td className="action-cell">
                  <div className="action-buttons">
                    <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                    <button className="action-btn" onClick={() => handleReview(record)}>审查</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span className="pagination-info">共{currentList.length}条记录</span>
        <div className="pagination-controls">
          <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>上一页</button>
          <span className="page-number">{currentPage}</span>
          <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>下一页</button>
          <select className="page-size-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>
          <span className="jump-to">跳至</span>
          <input type="number" className="page-input" min="1" max={totalPages} value={currentPage} onChange={(e) => { const value = Number(e.target.value); if (value >= 1 && value <= totalPages) setCurrentPage(value); }} />
          <span className="jump-to">页</span>
        </div>
      </div>
    </div>
  );

  const renderProcessedTable = () => (
    <div className="table-section">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-index">序号</th>
              <th className="col-no">申请单号</th>
              <th className="col-product">产品名称</th>
              <th className="col-type">产品类型</th>
              <th className="col-industry">行业分类</th>
              <th className="col-source">产品来源</th>
              <th className="col-handler">法人经办人</th>
              <th className="col-unit">单位名称</th>
              <th className="col-time">申请时间</th>
              <th className="col-review-time">审查时间</th>
              <th className="col-status">审查状态</th>
              <th className="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr><td colSpan={12}><div className="empty-state"><div className="empty-state-icon">📋</div>暂无数据</div></td></tr>
            ) : paginatedList.map((record, index) => (
              <tr key={record.id}>
                <td>{(currentPage - 1) * pageSize + index + 1}</td>
                <td>{record.reviewNo}</td>
                <td title={record.productName}>{record.productName}</td>
                <td>{record.productType}</td>
                <td>{record.industryCategory}</td>
                <td>{record.productSource}</td>
                <td>{record.legalHandler}</td>
                <td title={record.unitName}>{record.unitName}</td>
                <td>{record.applyTime}</td>
                <td>{record.reviewTime || '-'}</td>
                <td><span className={'status-tag ' + getStatusClass(record.reviewStatus)}>{record.reviewStatus}</span></td>
                <td className="action-cell">
                  <div className="action-buttons">
                    <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                    {record.reviewStatus === '审查通过' && (
                      <button className="action-btn" onClick={() => handleViewEvidence(record)}>查看存证</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span className="pagination-info">共{currentList.length}条记录</span>
        <div className="pagination-controls">
          <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>上一页</button>
          <span className="page-number">{currentPage}</span>
          <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>下一页</button>
          <select className="page-size-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>
          <span className="jump-to">跳至</span>
          <input type="number" className="page-input" min="1" max={totalPages} value={currentPage} onChange={(e) => { const value = Number(e.target.value); if (value >= 1 && value <= totalPages) setCurrentPage(value); }} />
          <span className="jump-to">页</span>
        </div>
      </div>
    </div>
  );

  const renderReviewModal = () => (
    <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
      <div className="modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>审查</h3>
          <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-item">
            <label>产品名称</label>
            <input type="text" value={currentRecord?.productName || ''} disabled />
          </div>
          <div className="form-item">
            <label>产品资料审查结果 <span className="required">*</span></label>
            <select value={reviewForm.materialResult} onChange={(e) => { setReviewForm(prev => ({ ...prev, materialResult: e.target.value })); if (reviewErrors.materialResult) setReviewErrors(prev => { const n = { ...prev }; delete n.materialResult; return n; }); }} className={reviewErrors.materialResult ? 'has-error' : ''}>
              <option value="">请选择</option>
              {REVIEW_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {reviewErrors.materialResult && <span className="error-text">{reviewErrors.materialResult}</span>}
          </div>
          <div className="form-item">
            <label>产品代码审查结果 <span className="required">*</span></label>
            <select value={reviewForm.codeResult} onChange={(e) => { setReviewForm(prev => ({ ...prev, codeResult: e.target.value })); if (reviewErrors.codeResult) setReviewErrors(prev => { const n = { ...prev }; delete n.codeResult; return n; }); }} className={reviewErrors.codeResult ? 'has-error' : ''}>
              <option value="">请选择</option>
              {REVIEW_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {reviewErrors.codeResult && <span className="error-text">{reviewErrors.codeResult}</span>}
          </div>
          <div className="form-item">
            <label>审查意见</label>
            <textarea value={reviewForm.reviewOpinion} onChange={(e) => setReviewForm(prev => ({ ...prev, reviewOpinion: e.target.value }))} rows={4} placeholder="请输入审查意见（选填）" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowReviewModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleReviewSubmit}>确定</button>
        </div>
      </div>
    </div>
  );

  const renderViewModal = () => {
    if (!currentRecord) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
        <div className="modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>查看详情</h3>
            <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="section-title"><span className="title-bar" />基本信息</div>
            <div className="view-info-grid">
              <div className="info-row">
                <div className="info-label">申请单号</div>
                <div className="info-value">{currentRecord.reviewNo}</div>
              </div>
              <div className="info-row">
                <div className="info-label">产品名称</div>
                <div className="info-value">{currentRecord.productName}</div>
              </div>
              <div className="info-row">
                <div className="info-label">产品类型</div>
                <div className="info-value">{currentRecord.productType}</div>
              </div>
              <div className="info-row">
                <div className="info-label">行业分类</div>
                <div className="info-value">{currentRecord.industryCategory}</div>
              </div>
              <div className="info-row">
                <div className="info-label">产品来源</div>
                <div className="info-value">{currentRecord.productSource}</div>
              </div>
              <div className="info-row">
                <div className="info-label">法人经办人</div>
                <div className="info-value">{currentRecord.legalHandler}</div>
              </div>
              <div className="info-row">
                <div className="info-label">单位名称</div>
                <div className="info-value" style={{ gridColumn: 'span 3' }}>{currentRecord.unitName}</div>
              </div>
              <div className="info-row">
                <div className="info-label">申请时间</div>
                <div className="info-value">{currentRecord.applyTime}</div>
              </div>
            </div>
            {currentRecord.reviewStatus !== '待审查' && (
              <>
                <div className="section-title"><span className="title-bar" />审查结果</div>
                <div className="view-info-grid">
                  <div className="info-row">
                    <div className="info-label">审查状态</div>
                    <div className="info-value"><span className={'status-tag ' + getStatusClass(currentRecord.reviewStatus)}>{currentRecord.reviewStatus}</span></div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">审查时间</div>
                    <div className="info-value">{currentRecord.reviewTime || '-'}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">产品资料审查</div>
                    <div className="info-value">{currentRecord.materialResult || '-'}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">产品代码审查</div>
                    <div className="info-value">{currentRecord.codeResult || '-'}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">审查人</div>
                    <div className="info-value">{currentRecord.reviewer || '-'}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">审查意见</div>
                    <div className="info-value" style={{ gridColumn: 'span 3' }}>{currentRecord.reviewOpinion || '-'}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEvidenceModal = () => {
    if (!currentRecord) return null;
    const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return (
      <div className="modal-overlay" onClick={() => setShowEvidenceModal(false)}>
        <div className="modal-medium" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>查看存证</h3>
            <button className="modal-close" onClick={() => setShowEvidenceModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="evidence-card">
              <div className="evidence-header">
                <div className="evidence-icon">🔗</div>
                <div className="evidence-title">区块链存证信息</div>
              </div>
              <div className="evidence-content">
                <div className="evidence-row">
                  <div className="evidence-label">存证类型</div>
                  <div className="evidence-value">产品安全审查</div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-label">申请单号</div>
                  <div className="evidence-value">{currentRecord.reviewNo}</div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-label">产品名称</div>
                  <div className="evidence-value">{currentRecord.productName}</div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-label">审查结果</div>
                  <div className={'evidence-value ' + (currentRecord.reviewStatus === '审查通过' ? 'success' : '')}>{currentRecord.reviewStatus}</div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-label">审查时间</div>
                  <div className="evidence-value">{currentRecord.reviewTime}</div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-label">区块高度</div>
                  <div className="evidence-value">{Math.floor(Math.random() * 9000000 + 1000000)}</div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-label">交易哈希</div>
                  <div className="evidence-value hash">{hash}</div>
                </div>
                <div className="evidence-row">
                  <div className="evidence-label">存证状态</div>
                  <div className="evidence-value success">✓ 已确认</div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={() => setShowEvidenceModal(false)}>关闭</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout
      activeMenu={activeMenu}
      breadcrumb="产品安全审查"
      role={role}
      onRoleChange={setRole}
      roleOptions={['运营机构', '实施机构']}
      title="产品安全审查"
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

      {activeTab === 'pending' ? renderPendingTable() : renderProcessedTable()}

      {showReviewModal && renderReviewModal()}
      {showViewModal && renderViewModal()}
      {showEvidenceModal && renderEvidenceModal()}
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

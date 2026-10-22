/**
 * @name 行业主管部门管理
 * @mode axure
 *
 * 系统管理下的二级模块，用于数据基础设施运营方维护行业主管部门主体信息，
 * 支持查询、新增、删除行业主管部门。
 */

import { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';
import '../../common/backend-list.css';

interface IndustryDeptRecord {
  id: number;
  batch: string;
  industryDept: string;
  region: string;
  orgName: string;
  creditCode: string;
  createdAt: string;
}

const REGION_OPTIONS = [
  '省本级',
  '长沙市',
  '株洲市',
  '岳阳市',
  '湘潭市',
  '衡阳市',
  '常德市',
  '长沙县',
  '浏阳市',
  '宁乡市'
];

const seedData: IndustryDeptRecord[] = [
  { id: 1, batch: '第1批', industryDept: '湖南省卫生健康委员会', region: '省本级', orgName: '湖南省卫生健康委员会', creditCode: '11430000MB1914021Q', createdAt: '2026-03-12 09:21:34' },
  { id: 2, batch: '第1批', industryDept: '长沙市交通运输局', region: '长沙市', orgName: '长沙市交通运输局', creditCode: '11430100MB1914022X', createdAt: '2026-03-12 10:05:11' },
  { id: 3, batch: '第1批', industryDept: '株洲市文化旅游广电体育局', region: '株洲市', orgName: '株洲市文化旅游广电体育局', creditCode: '11430200MB1914023Y', createdAt: '2026-03-15 14:42:09' },
  { id: 4, batch: '第2批', industryDept: '岳阳市自然资源和规划局', region: '岳阳市', orgName: '岳阳市自然资源和规划局', creditCode: '11430600MB1914024Z', createdAt: '2026-04-08 11:18:55' },
  { id: 5, batch: '第2批', industryDept: '湘潭市工业和信息化局', region: '湘潭市', orgName: '湘潭市工业和信息化局', creditCode: '11430300MB1914025W', createdAt: '2026-04-09 08:36:47' },
  { id: 6, batch: '第2批', industryDept: '衡阳市生态环境局', region: '衡阳市', orgName: '衡阳市生态环境局', creditCode: '11430400MB1914026V', createdAt: '2026-04-10 16:02:21' },
  { id: 7, batch: '第3批', industryDept: '湖南省教育厅', region: '省本级', orgName: '湖南省教育厅', creditCode: '11430000MB1914027U', createdAt: '2026-05-14 09:55:30' },
  { id: 8, batch: '第3批', industryDept: '常德市农业农村局', region: '常德市', orgName: '常德市农业农村局', creditCode: '11430700MB1914028T', createdAt: '2026-05-16 13:27:18' },
  { id: 9, batch: '第3批', industryDept: '长沙县大数据中心', region: '长沙县', orgName: '长沙县大数据中心', creditCode: '11430121MB1914029S', createdAt: '2026-05-20 10:44:02' },
  { id: 10, batch: '第4批', industryDept: '浏阳市行政审批服务局', region: '浏阳市', orgName: '浏阳市行政审批服务局', creditCode: '11430181MB1914030R', createdAt: '2026-06-02 15:09:36' },
  { id: 11, batch: '第4批', industryDept: '宁乡市商务局', region: '宁乡市', orgName: '宁乡市商务局', creditCode: '11430182MB1914031Q', createdAt: '2026-06-03 09:12:48' },
  { id: 12, batch: '第5批', industryDept: '长沙市数据资源管理局', region: '长沙市', orgName: '长沙市数据资源管理局', creditCode: '11430100MB1914032P', createdAt: '2026-07-11 17:31:05' }
];

const formatNow = () => {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const OriginalComponent = () => {
  const [records, setRecords] = useState<IndustryDeptRecord[]>(seedData);

  // 筛选条件
  const [searchRegion, setSearchRegion] = useState('');
  const [searchOrgName, setSearchOrgName] = useState('');
  const [searchCreditCode, setSearchCreditCode] = useState('');
  const [searchBatch, setSearchBatch] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [role, setRole] = useState('数据基础设施运营方');

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<IndustryDeptRecord | null>(null);
  const [formData, setFormData] = useState({ batch: '', industryDept: '', region: '', orgName: '', creditCode: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (searchRegion && record.region !== searchRegion) return false;
      if (searchOrgName && !record.orgName.includes(searchOrgName.trim())) return false;
      if (searchCreditCode && !record.creditCode.includes(searchCreditCode.trim())) return false;
      if (searchBatch && !record.batch.includes(searchBatch.trim())) return false;
      if (searchStart && record.createdAt < searchStart) return false;
      if (searchEnd && record.createdAt > searchEnd + ' 23:59:59') return false;
      return true;
    });
  }, [records, searchRegion, searchOrgName, searchCreditCode, searchBatch, searchStart, searchEnd]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleQuery = () => { setCurrentPage(1); };
  const handleReset = () => {
    setSearchRegion('');
    setSearchOrgName('');
    setSearchCreditCode('');
    setSearchBatch('');
    setSearchStart('');
    setSearchEnd('');
    setCurrentPage(1);
  };

  const openAdd = () => {
    setFormData({ batch: '', industryDept: '', region: '', orgName: '', creditCode: '' });
    setFormErrors({});
    setShowAddModal(true);
  };

  const openDelete = (record: IndustryDeptRecord) => {
    setCurrentRecord(record);
    setShowDeleteModal(true);
  };

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!formData.batch) errors.batch = '请输入批次';
    if (!formData.region) errors.region = '请选择所属地域';
    if (!formData.orgName.trim()) errors.orgName = '请输入单位 / 企业名称';
    if (!formData.creditCode.trim()) errors.creditCode = '请输入统一社会信用代码';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setRecords(prev => [
      ...prev,
      {
        id: Math.max(0, ...prev.map(item => item.id)) + 1,
        batch: `第${formData.batch}批`,
        industryDept: formData.industryDept.trim(),
        region: formData.region,
        orgName: formData.orgName.trim(),
        creditCode: formData.creditCode.trim(),
        createdAt: formatNow()
      }
    ]);
    setShowAddModal(false);
  };

  const handleDelete = () => {
    if (!currentRecord) return;
    setRecords(prev => prev.filter(item => item.id !== currentRecord.id));
    setShowDeleteModal(false);
  };

  return (
    <>
      <Layout
        activeMenu="industry-dept-management"
        breadcrumb="行业主管部门管理"
        title="行业主管部门管理"
        role={role}
        onRoleChange={setRole}
        roleOptions={['数据基础设施运营方']}
        specContent={specContent}
        changeLogContent={changeLogContent}
      >
        <div className="industry-page">
          <section className="filter-section">
            <div className="filter-row">
              <div className="filter-item filter-item-select">
                <label>所属地域</label>
                <select value={searchRegion} onChange={(e) => { setSearchRegion(e.target.value); handleQuery(); }}>
                  <option value="">请选择</option>
                  {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="filter-item">
                <label>单位 / 企业名称</label>
                <input type="text" placeholder="请输入" value={searchOrgName} onChange={(e) => setSearchOrgName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuery()} />
              </div>
              <div className="filter-item">
                <label>统一社会信用代码</label>
                <input type="text" placeholder="请输入" value={searchCreditCode} onChange={(e) => setSearchCreditCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuery()} />
              </div>
              <div className="filter-item">
                <label>批次</label>
                <input type="text" placeholder="请输入" value={searchBatch} onChange={(e) => setSearchBatch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuery()} />
              </div>
              <div className="filter-item date-range">
                <label>创建时间</label>
                <div className="date-inputs">
                  <div className="date-input">
                    <input type="date" value={searchStart} onChange={(e) => { setSearchStart(e.target.value); handleQuery(); }} />
                  </div>
                  <span className="date-separator">-</span>
                  <div className="date-input">
                    <input type="date" value={searchEnd} onChange={(e) => { setSearchEnd(e.target.value); handleQuery(); }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="filter-actions">
              <div className="filter-actions-left">
                <button className="btn btn-primary btn-sm" onClick={handleQuery}>查询</button>
                <button className="btn btn-default btn-sm" onClick={handleReset}>重置</button>
              </div>
              <div className="filter-actions-right">
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} />新增</button>
              </div>
            </div>
          </section>

          <section className="table-section">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-index">序号</th>
                    <th>批次</th>
                    <th>所属地域</th>
                    <th>单位 / 企业名称</th>
                    <th>统一社会信用代码</th>
                    <th className="col-time">创建时间</th>
                    <th className="col-action">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRecords.length ? pageRecords.map((record, index) => (
                    <tr key={record.id}>
                      <td className="col-index">{(safePage - 1) * pageSize + index + 1}</td>
                      <td>{record.batch}</td>
                      <td>{record.region}</td>
                      <td>{record.orgName}</td>
                      <td>{record.creditCode}</td>
                      <td className="time-cell">{record.createdAt}</td>
                      <td className="action-cell">
                        <button className="action-btn action-delete" onClick={() => openDelete(record)}>删除</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="empty-state">暂无匹配的行业主管部门数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="pagination">
              <div className="pagination-info">共 {filteredRecords.length} 条记录</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)}>上一页</button>
                <span className="page-number">{safePage}</span>
                <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>下一页</button>
                <select className="page-size-select" aria-label="每页条数" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                  <option value={10}>10 条/页</option>
                  <option value={20}>20 条/页</option>
                  <option value={50}>50 条/页</option>
                </select>
                <span className="jump-to">跳至</span>
                <input type="number" className="page-input" min={1} max={totalPages} value={safePage} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= totalPages) setCurrentPage(v); }} />
                <span className="jump-to">页</span>
              </div>
            </footer>
          </section>
        </div>
      </Layout>

      {showAddModal && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowAddModal(false)}>
          <div className="modal-medium industry-form-modal" role="dialog" aria-modal="true" aria-labelledby="add-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="add-modal-title">新增</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)} title="关闭"><X size={19} /></button>
            </div>
            <div className="modal-body form-content">
              <div className="form-item">
                <label><span className="required">*</span>批次</label>
                <div className="form-control">
                  <div className={'batch-combo ' + (formErrors.batch ? 'has-error' : '')}>
                    <span className="batch-prefix">第</span>
                    <input
                      type="number"
                      min={1}
                      value={formData.batch}
                      placeholder="请输入"
                      onChange={(e) => handleFormChange('batch', e.target.value)}
                      className="batch-input-num"
                    />
                    <span className="batch-suffix">批</span>
                  </div>
                  {formErrors.batch && <span className="form-error">{formErrors.batch}</span>}
                </div>
              </div>
              <div className="form-item">
                <label><span className="required">*</span>所属地域</label>
                <div className="form-control">
                  <select value={formData.region} onChange={(e) => handleFormChange('region', e.target.value)} className={formErrors.region ? 'has-error' : ''}>
                    <option value="">请选择</option>
                    {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {formErrors.region && <span className="form-error">{formErrors.region}</span>}
                </div>
              </div>
              <div className="form-item">
                <label><span className="required">*</span>单位 / 企业名称</label>
                <div className="form-control">
                  <input value={formData.orgName} maxLength={50} placeholder="请输入单位 / 企业名称" onChange={(e) => handleFormChange('orgName', e.target.value)} className={formErrors.orgName ? 'has-error' : ''} />
                  {formErrors.orgName && <span className="form-error">{formErrors.orgName}</span>}
                </div>
              </div>
              <div className="form-item">
                <label><span className="required">*</span>统一社会信用代码</label>
                <div className="form-control">
                  <input value={formData.creditCode} maxLength={18} placeholder="请输入统一社会信用代码" onChange={(e) => handleFormChange('creditCode', e.target.value)} className={formErrors.creditCode ? 'has-error' : ''} />
                  {formErrors.creditCode && <span className="form-error">{formErrors.creditCode}</span>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowAddModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>确定</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && currentRecord && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-sm delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="delete-modal-title">提示</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)} title="关闭"><X size={19} /></button>
            </div>
            <div className="modal-body delete-content">
              <p>确定要删除“<b>{currentRecord.orgName}</b>”这条行业主管部门记录吗？</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowDeleteModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={handleDelete}>确定</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Component = () => <PasswordGuard><OriginalComponent /></PasswordGuard>;

export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}

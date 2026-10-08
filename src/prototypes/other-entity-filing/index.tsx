/**
 * @name 其他经营主体备案
 * @mode axure
 *
 * 运营机构角色的其他经营主体备案页面：备案列表、新增备案、
 * 区块链存证证书查看与备案删除。
 */

import { useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';
import '../../common/backend-list.css';

interface OtherEntityFiling {
  id: number;
  authType: string;
  domain: string;
  entityName: string;
  creditCode: string;
  createTime: string;
  evidenceHash: string;
  blockchainId: string;
  evidenceTime: string;
}

interface EntityFormData {
  entityName: string;
  creditCode: string;
}

const OP_ORG_NAME = '湖南数据产业集团有限公司';

const filingSeed: OtherEntityFiling[] = [
  {
    id: 1,
    authType: '整体授权运营',
    domain: '整体',
    entityName: '湖南天河国云科技有限公司',
    creditCode: '9144030071526726XG',
    createTime: '2026-08-03 10:18:24',
    evidenceHash: '0xce062244b9d792689dae5cef09e59173eb983868dc522918511de6704f06a397',
    blockchainId: '0x76bb8cbffa85f757cc67967842dc257da2c3f81a7b2633c780ee1ba4f8f57bf',
    evidenceTime: '2026-08-03 10:18:25'
  },
  {
    id: 2,
    authType: '整体授权运营',
    domain: '整体',
    entityName: '杭州深度求索人工智能基础技术研究有限公司',
    creditCode: '91330105MACPN4X08Y',
    createTime: '2026-07-16 16:41:41',
    evidenceHash: '0x8a1f3d5c9e2b4a7f6d8c0e1b3a5f7d9c2e4b6a8f0d2c4e6b8a0f1d3c5e7b9a01',
    blockchainId: '0x3f5a7c9e1b2d4f6a8c0e2b4d6f8a0c1e3b5d7f9a1c3e5b7d9f0a2c4e6b8d0f12',
    evidenceTime: '2026-07-16 16:41:42'
  },
  {
    id: 3,
    authType: '整体授权运营',
    domain: '整体',
    entityName: '洛阳制潜力发展测试（其他经营主体）',
    creditCode: '91410300MA9FNYNG2A',
    createTime: '2026-07-16 15:56:10',
    evidenceHash: '0x5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b70',
    blockchainId: '0x9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e',
    evidenceTime: '2026-07-16 15:56:11'
  },
  {
    id: 4,
    authType: '整体授权运营',
    domain: '整体',
    entityName: '长沙可合生物制药有限公司',
    creditCode: '91430103MA4QD6P47H',
    createTime: '2026-06-08 14:59:35',
    evidenceHash: '0x2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f',
    blockchainId: '0x6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b',
    evidenceTime: '2026-06-08 14:59:36'
  },
  {
    id: 5,
    authType: '整体授权运营',
    domain: '整体',
    entityName: '杭州趣链科技股份有限公司',
    creditCode: '91330108MA27Y5XH5G',
    createTime: '2026-06-04 09:07:23',
    evidenceHash: '0x7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a',
    blockchainId: '0x1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c',
    evidenceTime: '2026-06-04 09:07:24'
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

const createEmptyForm = (): EntityFormData => ({
  entityName: '',
  creditCode: ''
});

const OriginalComponent = () => {
  const [records, setRecords] = useState<OtherEntityFiling[]>(filingSeed);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<OtherEntityFiling | null>(null);
  const [formData, setFormData] = useState<EntityFormData>(createEmptyForm());
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

  const handleAdd = () => {
    setFormData(createEmptyForm());
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleFormChange = (field: keyof EntityFormData, value: string) => {
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
    if (!formData.entityName.trim()) errors.entityName = '请输入其他经营主体名称';
    if (!formData.creditCode.trim()) errors.creditCode = '请输入统一社会信用代码';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    const time = nowText();
    const newRecord: OtherEntityFiling = {
      id: Math.max(0, ...records.map(r => r.id)) + 1,
      authType: '整体授权运营',
      domain: '整体',
      entityName: formData.entityName.trim(),
      creditCode: formData.creditCode.trim(),
      createTime: time,
      evidenceHash: randomHex(64),
      blockchainId: randomHex(62),
      evidenceTime: time
    };
    setRecords(prev => [...prev, newRecord]);
    setCurrentPage(1);
    setShowAddModal(false);
    alert('提交成功');
  };

  const handleViewCert = (record: OtherEntityFiling) => {
    setCurrentRecord(record);
    setShowCertModal(true);
  };

  const handleDelete = (record: OtherEntityFiling) => {
    setCurrentRecord(record);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!currentRecord) return;
    setRecords(prev => prev.filter(r => r.id !== currentRecord.id));
    setShowDeleteModal(false);
    setCurrentRecord(null);
  };

  // 弹窗 1：其他经营主体备案（表单弹窗）
  const renderAddModal = () => (
    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="modal-medium entity-filing-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>其他经营主体备案</h3>
          <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="entity-form">
            <div className="entity-form-item">
              <label><span className="required">*</span> 其他经营主体名称</label>
              <input
                type="text"
                placeholder="请输入其他经营主体名称"
                value={formData.entityName}
                onChange={(e) => handleFormChange('entityName', e.target.value)}
                className={formErrors.entityName ? 'has-error' : ''}
              />
              {formErrors.entityName && <span className="error-text">{formErrors.entityName}</span>}
            </div>
            <div className="entity-form-item">
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
          </div>
          <div className="entity-form-warning">
            其他经营主体信息不匹配，将导致其他经营主体无法登录，请核对信息后确认是否提交。
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowAddModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>确定</button>
        </div>
      </div>
    </div>
  );

  // 弹窗 2：区块链存证证书
  const renderCertModal = () => currentRecord && (
    <div className="modal-overlay" onClick={() => setShowCertModal(false)}>
      <div className="cert-modal" onClick={(event) => event.stopPropagation()}>
        <button className="cert-close" onClick={() => setShowCertModal(false)} aria-label="关闭">×</button>
        <div className="cert-frame">
          <div className="cert-inner">
            <div className="cert-head">
              <h3 className="cert-title">区块链存证证书</h3>
              <button
                className="cert-download"
                title="下载证书"
                aria-label="下载证书"
                onClick={() => alert('证书下载功能（导出 PDF / 图片）')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
            <div className="cert-body">
              <div className="cert-row"><span className="cert-label">电子证据：</span><span className="cert-value hash">{currentRecord.evidenceHash}</span></div>
              <div className="cert-row"><span className="cert-label">区块链ID：</span><span className="cert-value hash">{currentRecord.blockchainId}</span></div>
              <div className="cert-row"><span className="cert-label">存证时间：</span><span className="cert-value">{currentRecord.evidenceTime}</span></div>
              <div className="cert-row"><span className="cert-label">存证描述：</span><span className="cert-value">其他经营主体备案存证</span></div>
              <div className="cert-row"><span className="cert-label">授权运营类型：</span><span className="cert-value">{currentRecord.authType}</span></div>
              <div className="cert-row"><span className="cert-label">领域名称：</span><span className="cert-value">{currentRecord.domain}</span></div>
              <div className="cert-row"><span className="cert-label">运营机构：</span><span className="cert-value">{OP_ORG_NAME}</span></div>
              <div className="cert-row"><span className="cert-label">其他经营主体：</span><span className="cert-value">{currentRecord.entityName}</span></div>
              <div className="cert-row"><span className="cert-label">统一社会信用代码：</span><span className="cert-value">{currentRecord.creditCode}</span></div>
              <div className="cert-row"><span className="cert-label">备案时间：</span><span className="cert-value">{currentRecord.createTime}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 弹窗 3：删除提示框
  const renderDeleteModal = () => currentRecord && (
    <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
      <div className="modal-medium" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>删除提示</h3>
          <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="delete-confirm-text">
            确定要删除「{currentRecord.entityName}」的备案信息吗？
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowDeleteModal(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleDeleteConfirm}>确定</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Layout
        activeMenu="other-entity-filing"
        breadcrumb="其他经营主体备案"
        role={role}
        onRoleChange={setRole}
        roleOptions={['运营机构']}
        title="其他经营主体备案"
        specContent={specContent}
        changeLogContent={changeLogContent}
      >
        <div className="filter-section">
          <div className="filter-actions">
            <div className="filter-actions-right">
              <div className="page-actions">
                <button className="btn btn-primary" onClick={handleAdd}>+ 其他经营主体备案</button>
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
                  <th>其他经营主体</th>
                  <th>统一社会信用代码</th>
                  <th className="col-time">创建时间</th>
                  <th className="col-action">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record, index) => (
                  <tr key={record.id}>
                    <td>{(safePage - 1) * pageSize + index + 1}</td>
                    <td>{record.authType}</td>
                    <td>{record.domain}</td>
                    <td>{record.entityName}</td>
                    <td>{record.creditCode}</td>
                    <td className="time-cell">{record.createTime}</td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button className="action-btn" onClick={() => handleDelete(record)}>删除</button>
                        <button className="action-btn" onClick={() => handleViewCert(record)}>查看存证</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-row">暂无数据</td>
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

      {showAddModal && renderAddModal()}
      {showCertModal && renderCertModal()}
      {showDeleteModal && renderDeleteModal()}
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

/**
 * @name 产品生命周期
 * @mode axure
 *
 * 运营机构角色的产品生命周期跟踪页，后台一级菜单
 */

import { useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
import {
  LifecycleRecord,
  TimelineItem,
  seedRecords,
  buildTimeline,
  regionLabel,
  getStageStatusClass,
  PRODUCT_TYPE_OPTIONS,
  PRODUCT_STAGE_OPTIONS,
  STAGE_OPTIONS,
  STAGE_STATUS_OPTIONS
} from './lifecycle-shared';
import './style.css';
import '../../common/backend-list.css';

const OriginalComponent = () => {
  const [activeMenu] = useState<'product-lifecycle'>('product-lifecycle');
  const [role, setRole] = useState('运营机构');

  const [records] = useState<LifecycleRecord[]>(seedRecords);

  // 筛选条件
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchProductType, setSearchProductType] = useState('');
  const [searchProductStage, setSearchProductStage] = useState('');
  const [searchProvider, setSearchProvider] = useState('');
  const [searchStage, setSearchStage] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 列表分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 弹窗（查看、时间轴）；数据血缘、生命图谱均已改为独立整页，不再使用弹窗
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<LifecycleRecord | null>(null);

  /** 筛选后统一按「更新时间」倒序排列（最新在前） */
  const filteredList = useMemo(() => {
    return records.filter(function (r) {
      if (searchCode && !r.productCode.includes(searchCode.trim())) return false;
      if (searchName && !r.productName.includes(searchName.trim())) return false;
      if (searchProductType && r.productType !== searchProductType) return false;
      if (searchProductStage && r.productStage !== searchProductStage) return false;
      if (searchProvider && !r.provider.includes(searchProvider.trim())) return false;
      if (searchStage && r.currentStage !== searchStage) return false;
      if (searchStatus && r.stageStatus !== searchStatus) return false;
      if (startDate && r.updateTime.slice(0, 10) < startDate) return false;
      if (endDate && r.updateTime.slice(0, 10) > endDate) return false;
      return true;
    }).sort(function (a, b) {
      return b.updateTime.localeCompare(a.updateTime);
    });
  }, [records, searchCode, searchName, searchProductType, searchProductStage, searchProvider, searchStage, searchStatus, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleQuery = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchCode('');
    setSearchName('');
    setSearchProductType('');
    setSearchProductStage('');
    setSearchProvider('');
    setSearchStage('');
    setSearchStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const timeline = useMemo(() => (currentRecord ? buildTimeline(currentRecord) : []), [currentRecord]);

  const handleView = (record: LifecycleRecord) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  const handleTimeline = (record: LifecycleRecord) => {
    setCurrentRecord(record);
    setShowTimelineModal(true);
  };

  const renderSummaryBar = () => (
    <div className="view-info-grid summary-grid">
      <div className="info-label">数据产品标识码</div>
      <div className="info-value">{currentRecord?.productCode}</div>
      <div className="info-label">产品名称</div>
      <div className="info-value" title={currentRecord?.productName}>{currentRecord?.productName}</div>
    </div>
  );

  const renderFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        <div className="filter-item">
          <label>数据产品标识码</label>
          <input type="text" placeholder="请输入" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>产品名称</label>
          <input type="text" placeholder="请输入" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>产品类型</label>
          <select value={searchProductType} onChange={(e) => setSearchProductType(e.target.value)}>
            <option value="">请选择</option>
            {PRODUCT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-item filter-item-select">
          <label>产品阶段</label>
          <select value={searchProductStage} onChange={(e) => setSearchProductStage(e.target.value)}>
            <option value="">请选择</option>
            {PRODUCT_STAGE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="filter-row">
        <div className="filter-item">
          <label>产品提供方</label>
          <input type="text" placeholder="请输入" value={searchProvider} onChange={(e) => setSearchProvider(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>流程节点</label>
          <select value={searchStage} onChange={(e) => setSearchStage(e.target.value)}>
            <option value="">请选择</option>
            {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-item filter-item-select">
          <label>节点状态</label>
          <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
            <option value="">请选择</option>
            {STAGE_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-item filter-item-range">
          <label>更新时间</label>
          <div className="range-inputs">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="range-sep">~</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="filter-actions">
        <div className="filter-actions-left">
          <button className="btn btn-primary btn-sm" onClick={handleQuery}>查询</button>
          <button className="btn btn-default btn-sm" onClick={handleReset}>重置</button>
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
              <th className="col-code">数据产品标识码</th>
              <th className="col-product">产品名称</th>
              <th className="col-product-type">产品类型</th>
              <th className="col-product-stage">产品阶段</th>
              <th className="col-provider">产品提供方</th>
              <th className="col-stage">流程节点</th>
              <th className="col-status">节点状态</th>
              <th className="col-update-time">更新时间</th>
              <th className="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            {            paginatedList.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  暂无数据
                </td>
              </tr>
            ) : (
              paginatedList.map((record, index) => {
                const isFirstRow = index === 0 && currentPage === 1;
                return (
                <tr key={record.id}>
                  <td className="col-index">{(safePage - 1) * pageSize + index + 1}</td>
                  <td className="col-code" title={record.productCode}>{record.productCode}</td>
                  <td className="col-product" title={record.productName}>{record.productName}</td>
                  <td className="col-product-type"><span className="type-tag">{record.productType}</span></td>
                  <td className="col-product-stage">{record.productStage}</td>
                  <td className="col-provider" title={record.provider}>{record.provider}</td>
                  <td className="col-stage">{record.currentStage}</td>
                  <td className="col-status"><span className={'status-tag ' + getStageStatusClass(record.stageStatus)}>{record.stageStatus}</span></td>
                  <td className="col-update-time">{record.updateTime}</td>
                  <td className="col-action">
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                      <button className="action-btn" onClick={() => handleTimeline(record)}>时间轴</button>
                      <a
                        className="action-btn"
                        href={'/prototypes/product-lifecycle-lineage.html?code=' + encodeURIComponent(record.productCode)}
                      >数据血缘</a>
                      <a
                        className="action-btn"
                        href={'/prototypes/product-lifecycle-graph.html?code=' + encodeURIComponent(record.productCode)}
                      >生命图谱</a>
                      {isFirstRow && (
                        <a
                          className="action-btn"
                          href={'/prototypes/product-lifecycle-graph1.html?code=' + encodeURIComponent(record.productCode)}
                        >生命图谱1</a>
                      )}
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
        <div className="pagination-info">共 {filteredList.length} 条记录</div>
        <div className="pagination-controls">
          <button className="page-btn" disabled={safePage <= 1} onClick={() => setCurrentPage(Math.max(1, safePage - 1))}>上一页</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .map((page, idx, arr) => (
              <span key={page} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ color: '#999' }}>...</span>}
                <button className={'page-number' + (page === safePage ? ' active' : '')} onClick={() => setCurrentPage(page)}>{page}</button>
              </span>
            ))}
          <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}>下一页</button>
          <select className="page-size-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10 条/页</option>
            <option value={20}>20 条/页</option>
            <option value={50}>50 条/页</option>
          </select>
          <span className="jump-to">跳至</span>
          <input className="page-input" type="number" min={1} max={totalPages} value={safePage} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= totalPages) setCurrentPage(v); }} />
          <span className="jump-to">页</span>
        </div>
      </div>
    </div>
  );

  const renderViewModal = () => (
    <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
      <div className="modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>产品详情</h3>
          <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="section-title"><span className="title-bar"></span>基本信息</div>
          <div className="view-info-grid">
            <div className="info-label">数据产品标识码</div>
            <div className="info-value">{currentRecord?.productCode}</div>
            <div className="info-label">产品名称</div>
            <div className="info-value" title={currentRecord?.productName}>{currentRecord?.productName}</div>
            <div className="info-label">产品类型</div>
            <div className="info-value"><span className="type-tag">{currentRecord?.productType}</span></div>
            <div className="info-label">产品阶段</div>
            <div className="info-value">{currentRecord?.productStage}</div>
            <div className="info-label">产品提供方</div>
            <div className="info-value-span" title={currentRecord?.provider}>{currentRecord?.provider}</div>
          </div>
          <div className="section-title"><span className="title-bar"></span>流程信息</div>
          <div className="view-info-grid">
            <div className="info-label">流程节点</div>
            <div className="info-value">{currentRecord?.currentStage}</div>
            <div className="info-label">节点状态</div>
            <div className="info-value"><span className={'status-tag ' + getStageStatusClass(currentRecord?.stageStatus || '')}>{currentRecord?.stageStatus}</span></div>
            <div className="info-label">更新时间</div>
            <div className="info-value">{currentRecord?.updateTime}</div>
            <div className="info-label">所属地域</div>
            <div className="info-value">{currentRecord ? regionLabel(currentRecord.region) : ''}</div>
          </div>
          <div className="section-title"><span className="title-bar"></span>产品简介</div>
          <div className="desc-block">{currentRecord?.productDesc}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowViewModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  const renderTimelineModal = () => (
    <div className="modal-overlay" onClick={() => setShowTimelineModal(false)}>
      <div className="modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>生命周期时间轴</h3>
          <button className="modal-close" onClick={() => setShowTimelineModal(false)}>×</button>
        </div>
        <div className="modal-body">
          {renderSummaryBar()}
          <div className="section-title"><span className="title-bar"></span>流程记录</div>
          <div className="timeline-list">
            {timeline.map(function (item, idx) {
              return (
                <div key={item.stage} className={'timeline-item' + (item.current ? ' is-current' : '')}>
                  <div className="timeline-head">
                    <span className="timeline-index">{idx + 1}</span>
                    <span className="timeline-stage">{item.stage}</span>
                    <span className={'status-tag ' + getStageStatusClass(item.status)}>{item.status}</span>
                  </div>
                  <div className="timeline-block">
                    <div className="timeline-block-title">发起信息</div>
                    <div className="timeline-fields">
                      <div className="timeline-field">
                        <span className="timeline-field-label">单位名称</span>
                        <span className="timeline-field-value" title={item.org}>{item.org}</span>
                      </div>
                      <div className="timeline-field">
                        <span className="timeline-field-label">法人经办人姓名</span>
                        <span className="timeline-field-value">{item.handler}</span>
                      </div>
                      <div className="timeline-field">
                        <span className="timeline-field-label">操作时间</span>
                        <span className="timeline-field-value">{item.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="timeline-block">
                    <div className="timeline-block-title">审批信息</div>
                    <div className="timeline-fields">
                      <div className="timeline-field">
                        <span className="timeline-field-label">单位名称</span>
                        <span className="timeline-field-value" title={item.auditOrg}>{item.auditOrg}</span>
                      </div>
                      <div className="timeline-field">
                        <span className="timeline-field-label">法人经办人姓名</span>
                        <span className="timeline-field-value">{item.auditHandler}</span>
                      </div>
                      <div className="timeline-field">
                        <span className="timeline-field-label">审核结果</span>
                        <span className="timeline-field-value">
                          {item.auditResult === '审核通过' ? (
                            <span className="audit-tag audit-pass">审核通过</span>
                          ) : item.auditResult === '审核不通过' ? (
                            <span className="audit-tag audit-fail">审核不通过</span>
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                      <div className="timeline-field">
                        <span className="timeline-field-label">审核意见</span>
                        <span className="timeline-field-value">{item.auditOpinion}</span>
                      </div>
                      <div className="timeline-field">
                        <span className="timeline-field-label">操作时间</span>
                        <span className="timeline-field-value">{item.auditTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowTimelineModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout
      activeMenu={activeMenu}
      breadcrumb="产品生命周期"
      role={role}
      onRoleChange={setRole}
      roleOptions={['运营机构']}
      title="产品生命周期"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      {renderFilter()}
      {renderTable()}

      {showViewModal && renderViewModal()}
      {showTimelineModal && renderTimelineModal()}
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

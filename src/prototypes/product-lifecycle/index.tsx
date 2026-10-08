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
  seedRecords,
  buildTimeline,
  buildProductDetail,
  buildDatasetFields,
  buildApiInfo,
  getStageStatusClass,
  PRODUCT_TYPE_OPTIONS,
  PRODUCT_STAGE_OPTIONS,
  STAGE_STATUS_OPTIONS,
  STAGE_STATUS_OPTIONS_BY_STAGE
} from './lifecycle-shared';
import './style.css';
import '../../common/backend-list.css';

/** 附件展示：回形针 + 文件名 + 绿色签章图标；无附件时不渲染（单元格留空） */
const FileChip = ({ name }: { name: string }) => {
  if (!name) return null;
  return (
    <span className="file-chip" title={name}>
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#0f63f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
      </svg>
      <span className="file-chip-name">{name}</span>
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-3.6 8-10V5.4L12 2 4 5.4V12c0 6.4 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    </span>
  );
};

/** 列表页「流程节点」展示口径：将 产品上架 / 产品下架 合并为 产品上下架。
 * 仅作用于列表筛选与列展示，底层数据模型（STAGE_OPTIONS / STAGE_FLOW）仍保留上架、下架，时间轴与图谱不受影响。 */
const LIST_STAGE_OPTIONS = ['安全审查', '产品登记', '产品上下架', '产品交易'];

const OriginalComponent = () => {
  const [activeMenu] = useState<'product-lifecycle'>('product-lifecycle');
  const [role, setRole] = useState('运营机构');

  // 列表工作集：按需求「去掉节点状态未已终止的数据」，默认仅保留节点状态为「已终止」的产品；
  // 源数据 seedRecords（48 条）完整保留，仅过滤列表展示工作集：去掉「已终止」记录、保留其余状态，
  // 重置 / 下拉筛选均不会重新引入「已终止」记录。
  const [records] = useState<LifecycleRecord[]>(() =>
    seedRecords.filter((r) => r.stageStatus !== '已终止')
  );

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

  // 弹窗（查看、时间轴）；数据血缘、生命周期均已改为独立整页，不再使用弹窗
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<LifecycleRecord | null>(null);
  const [viewTab, setViewTab] = useState<'basic' | 'config'>('basic');

  /** 筛选后统一按「更新时间」倒序排列（最新在前） */
  const filteredList = useMemo(() => {
    return records.filter(function (r) {
      if (searchCode && !r.productCode.includes(searchCode.trim())) return false;
      if (searchName && !r.productName.includes(searchName.trim())) return false;
      if (searchProductType && r.productType !== searchProductType) return false;
      if (searchProductStage && r.productStage !== searchProductStage) return false;
      if (searchProvider && !r.provider.includes(searchProvider.trim())) return false;
      if (searchStage) {
        if (searchStage === '产品上下架') {
          if (r.currentStage !== '产品上架' && r.currentStage !== '产品下架') return false;
        } else if (r.currentStage !== searchStage) {
          return false;
        }
      }
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

  /** 查看弹窗「基本信息」页签：复用血缘详情同口径的 16 项产品详情 */
  const viewDetail = useMemo(
    () => (currentRecord ? buildProductDetail(currentRecord, currentRecord.productName, currentRecord.id) : null),
    [currentRecord]
  );

  /** 查看弹窗「配置信息」：按产品类型分别取数据集字段信息 / API 接口信息（完整保留，不得删除或覆盖） */
  const viewConfig = useMemo(() => {
    if (!currentRecord) return null;
    return currentRecord.productType === 'API产品'
      ? { kind: 'api' as const, api: buildApiInfo(currentRecord) }
      : { kind: 'dataset' as const, fields: buildDatasetFields(currentRecord) };
  }, [currentRecord]);

  const handleView = (record: LifecycleRecord) => {
    setCurrentRecord(record);
    setViewTab('basic');
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
          <select value={searchStage} onChange={(e) => { setSearchStage(e.target.value); setSearchStatus(''); }}>
            <option value="">请选择</option>
            {LIST_STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-item filter-item-select">
          <label>节点状态</label>
          <select
            value={searchStage ? searchStatus : ''}
            disabled={!searchStage}
            onChange={(e) => setSearchStatus(e.target.value)}
          >
            {!searchStage && <option value="">请先选择流程节点</option>}
            {searchStage && <option value="">请选择</option>}
            {searchStage && (STAGE_STATUS_OPTIONS_BY_STAGE[searchStage] || []).map(s => <option key={s} value={s}>{s}</option>)}
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
                return (
                <tr key={record.id}>
                  <td className="col-index">{(safePage - 1) * pageSize + index + 1}</td>
                  <td className="col-code" title={record.productCode}>{record.productCode}</td>
                  <td className="col-product" title={record.productName}>{record.productName}</td>
                  <td className="col-product-type"><span className="type-tag">{record.productType}</span></td>
                  <td className="col-product-stage">{record.productStage}</td>
                  <td className="col-provider" title={record.provider}>{record.provider}</td>
                  <td className="col-stage">{record.currentStage === '产品上架' || record.currentStage === '产品下架' ? '产品上下架' : record.currentStage}</td>
                  <td className="col-status"><span className={'status-tag ' + getStageStatusClass(record.stageStatus)}>{record.stageStatus}</span></td>
                  <td className="col-update-time">{record.updateTime}</td>
                  <td className="col-action">
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                      <button className="action-btn" onClick={() => handleTimeline(record)} style={{ display: 'none' }}>时间轴</button>
                      <a
                        className="action-btn"
                        href={'/prototypes/product-lifecycle-lineage.html?code=' + encodeURIComponent(record.productCode)}
                      >数据血缘</a>
                      <a
                        className="action-btn"
                        href={'/prototypes/product-lifecycle-graph.html?code=' + encodeURIComponent(record.productCode)}
                      >生命周期</a>
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
      <div className="modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>产品详情</h3>
          <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
        </div>
        <div className="modal-body">
          {viewDetail && (
            <>
              <div className="view-tabs">
                <button
                  className={'view-tab' + (viewTab === 'basic' ? ' active' : '')}
                  onClick={() => setViewTab('basic')}
                >基本信息</button>
                <button
                  className={'view-tab' + (viewTab === 'config' ? ' active' : '')}
                  onClick={() => setViewTab('config')}
                >配置信息</button>
              </div>

              {viewTab === 'basic' && (
                <>
                  <div className="section-title"><span className="title-bar"></span>基本信息</div>
                  <div className="view-info-grid">
                    <div className="info-label">产品名称</div>
                    <div className="info-value" title={viewDetail.productName}>{viewDetail.productName}</div>
                    <div className="info-label">产品类型</div>
                    <div className="info-value"><span className="type-tag">{viewDetail.productType}</span></div>
                    <div className="info-label">覆盖时间范围</div>
                    <div className="info-value">{viewDetail.coverage}</div>
                    <div className="info-label">行业分类</div>
                    <div className="info-value">{viewDetail.industry}</div>
                    <div className="info-label">地域分类</div>
                    <div className="info-value">{viewDetail.region}</div>
                    <div className="info-label">是否涉及个人信息</div>
                    <div className="info-value">{viewDetail.involvesPersonal}</div>
                    <div className="info-label">交付方式</div>
                    <div className="info-value">{viewDetail.deliveryMethod}</div>
                    <div className="info-label">授权使用</div>
                    <div className="info-value">{viewDetail.authorizedUse}</div>
                    <div className="info-label">数据主体</div>
                    <div className="info-value">{viewDetail.dataSubject}</div>
                    <div className="info-label">数据规模</div>
                    <div className="info-value">{viewDetail.dataScale}</div>
                    <div className="info-label">更新频率</div>
                    <div className="info-value">{viewDetail.updateFreq}</div>
                    <div className="info-label">个人或企业授权使用</div>
                    <div className="info-value">{viewDetail.personalOrEnterpriseAuth}</div>
                    <div className="info-label">数据资源标识码</div>
                    <div className="info-value-span code-text">{viewDetail.productCode}</div>
                    <div className="info-label">产品简介</div>
                    <div className="info-value-span" title={viewDetail.productDesc}>{viewDetail.productDesc}</div>
                    <div className="info-label">使用限制</div>
                    <div className="info-value-span" title={viewDetail.usageLimit}>{viewDetail.usageLimit}</div>
                    <div className="info-label">产品开发方案</div>
                    <div className="info-value"><FileChip name={viewDetail.devPlanFile} /></div>
                    <div className="info-label">运营协议</div>
                    <div className="info-value"><FileChip name={viewDetail.opAgreementFile} /></div>
                    <div className="info-label">实施方案</div>
                    <div className="info-value"><FileChip name={viewDetail.implPlanFile} /></div>
                    <div className="info-label">领域名称</div>
                    <div className="info-value">{viewDetail.domainName}</div>
                  </div>

                  <div className="section-title"><span className="title-bar"></span>提供方信息</div>
                  <div className="view-info-grid">
                    <div className="info-label">提供方名称</div>
                    <div className="info-value" title={viewDetail.providerName}>{viewDetail.providerName}</div>
                    <div className="info-label">提供方主体类型</div>
                    <div className="info-value">{viewDetail.providerType}</div>
                    <div className="info-label">身份标识码</div>
                    <div className="info-value">{viewDetail.providerIdCode}</div>
                    <div className="info-label">法人经办人姓名</div>
                    <div className="info-value">{viewDetail.providerContact}</div>
                    <div className="info-label">法人经办人电话</div>
                    <div className="info-value">{viewDetail.providerPhone}</div>
                    <div className="info-label">授权委托书</div>
                    <div className="info-value"><FileChip name={viewDetail.entrustFile} /></div>
                    <div className="info-label">提供方简介</div>
                    <div className="info-value-span" title={viewDetail.providerIntro}>{viewDetail.providerIntro}</div>
                  </div>

                  <div className="section-title"><span className="title-bar"></span>声明信息</div>
                  <div className="view-info-grid">
                    <div className="info-label">数据样例</div>
                    <div className="info-value">{viewDetail.dataSample}</div>
                    <div className="info-label">合法合规声明</div>
                    <div className="info-value"><FileChip name={viewDetail.complianceFile} /></div>
                    <div className="info-label">数据来源声明</div>
                    <div className="info-value"><FileChip name={viewDetail.sourceDeclareFile} /></div>
                    <div className="info-label">安全分级分类</div>
                    <div className="info-value">{viewDetail.securityLevel}</div>
                    <div className="info-label">数据质量产品价值评估报告</div>
                    <div className="info-value-span">{viewDetail.qualityReport}</div>
                  </div>
                </>
              )}

              {viewTab === 'config' && viewConfig?.kind === 'dataset' && (
                <>
                  <div className="section-title"><span className="title-bar"></span>字段信息</div>
                  <div className="detail-table-section">
                    <div className="table-wrapper">
                      <table className="config-table dataset-table">
                        <thead>
                          <tr>
                            <th className="col-seq">序号</th>
                            <th className="col-name">字段名称</th>
                            <th className="col-cn">字段中文名</th>
                            <th className="col-type">数据类型</th>
                            <th className="col-pk">主键</th>
                            <th className="col-null">允许为空</th>
                            <th className="col-desc">描述</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewConfig.fields.map((f) => (
                            <tr key={f.seq}>
                              <td>{f.seq}</td>
                              <td>{f.name}</td>
                              <td>{f.cnName}</td>
                              <td>{f.dataType}</td>
                              <td>{f.primaryKey}</td>
                              <td>{f.nullable}</td>
                              <td>{f.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {viewTab === 'config' && viewConfig?.kind === 'api' && (
                <>
                  <div className="section-title"><span className="title-bar"></span>API接口信息</div>
                  <div className="view-info-grid">
                    <div className="info-label">接口名称</div>
                    <div className="info-value-span" title={viewConfig.api.name}>{viewConfig.api.name}</div>
                    <div className="info-label">请求方式</div>
                    <div className="info-value">{viewConfig.api.method}</div>
                    <div className="info-label">返回格式</div>
                    <div className="info-value">{viewConfig.api.returnFormat}</div>
                    <div className="info-label">接口地址</div>
                    <div className="info-value-span code-text" title={viewConfig.api.url}>{viewConfig.api.url}</div>
                    <div className="info-label">接口描述</div>
                    <div className="info-value-span" title={viewConfig.api.desc}>{viewConfig.api.desc}</div>
                  </div>
                  <div className="sub-section-title">请求参数</div>
                  <div className="detail-table-section">
                    <div className="table-wrapper">
                      <table className="config-table api-request-table">
                        <thead>
                          <tr>
                            <th className="col-name">参数名</th>
                            <th className="col-pos">参数位置</th>
                            <th className="col-req">必填</th>
                            <th className="col-type">字段类型</th>
                            <th className="col-desc">说明</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewConfig.api.requestParams.map((p, i) => (
                            <tr key={p.name + '_' + i}>
                              <td>{p.name}</td>
                              <td>{p.position}</td>
                              <td>{p.required}</td>
                              <td>{p.fieldType}</td>
                              <td>{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="sub-section-title">返回参数</div>
                  <div className="detail-table-section">
                    <div className="table-wrapper">
                      <table className="config-table api-response-table">
                        <thead>
                          <tr>
                            <th className="col-name">参数名</th>
                            <th className="col-type">字段类型</th>
                            <th className="col-desc">说明</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewConfig.api.responseParams.map((p, i) => (
                            <tr key={p.name + '_' + i}>
                              <td>{p.name}</td>
                              <td>{p.fieldType}</td>
                              <td>{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
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

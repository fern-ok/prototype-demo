/**
 * @name 订阅订单监管
 * @mode axure
 *
 * 订阅订单监管列表（数据管理部门视角），归属「授权监管」菜单组
 */

import { useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';
import '../../common/backend-list.css';

interface Product {
  id: number;
  region: string;
  authType: string;
  domain: string;
  productName: string;
  productType: string;
  provider: string;
  subscribeCount: number;
  productDesc: string;
}

interface SubscriptionOrder {
  id: number;
  productId: number;
  orderNo: string;
  region: string;
  authType: string;
  domain: string;
  productName: string;
  productType: string;
  demander: string;
  subscribeTime: string;
  updateTime: string;
  status: string;
}

const REGION_OPTIONS = ['省本级', '长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西土家族苗族自治州'];
const AUTH_TYPE_OPTIONS = ['整体授权运营', '分领域授权运营'];
const DOMAIN_OPTIONS = ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源', '城市治理', '金融服务', '工业制造', '智慧农业', '应急管理'];
const PRODUCT_TYPE_OPTIONS = ['数据集', 'API产品'];
const ORDER_STATUS_LIST = ['待审核', '审核通过', '审核不通过'];

const DEMANDERS = [
  '湖南天河国云科技有限公司',
  '杭州趣链科技股份有限公司',
  '常德市医保集团有限公司',
  '湖南数据产业集团有限公司',
  '长沙数字科技有限公司',
  '株洲国投数据服务有限公司',
  '湘潭大数据运营有限公司',
  '衡阳智慧城市科技有限公司'
];

const seedData: Product[] = [
  {
    id: 1,
    region: '省本级',
    authType: '整体授权运营',
    domain: '医疗健康',
    productName: '湖南省医疗就诊数据再开发产品',
    productType: 'API产品',
    provider: '湖南天河国云科技有限公司',
    subscribeCount: 26,
    productDesc: '基于省本级医疗就诊数据加工形成的标准化查询服务，支撑商业保险核保与理赔场景。'
  },
  {
    id: 2,
    region: '省本级',
    authType: '分领域授权运营',
    domain: '医疗保障',
    productName: '湖南省医保结算个人画像数据集',
    productType: '数据集',
    provider: '湖南数据产业集团有限公司',
    subscribeCount: 18,
    productDesc: '面向医保精细化管理场景，提供结算层级的结构化个人画像标签数据。'
  },
  {
    id: 3,
    region: '长沙市',
    authType: '整体授权运营',
    domain: '城市治理',
    productName: '长沙市城市交通流量监测API',
    productType: 'API产品',
    provider: '长沙数字科技有限公司',
    subscribeCount: 15,
    productDesc: '汇聚城区主干道卡口与地磁数据，输出实时路况与拥堵指数。'
  },
  {
    id: 4,
    region: '长沙市',
    authType: '分领域授权运营',
    domain: '金融服务',
    productName: '长沙市企业信用信息核验API',
    productType: 'API产品',
    provider: '湖南天河国云科技有限公司',
    subscribeCount: 12,
    productDesc: '整合工商登记与行政处罚数据，为金融机构提供企业信用核验服务。'
  },
  {
    id: 5,
    region: '株洲市',
    authType: '整体授权运营',
    domain: '工业制造',
    productName: '株洲市产业链供应链数据集',
    productType: '数据集',
    provider: '株洲国投数据服务有限公司',
    subscribeCount: 9,
    productDesc: '覆盖轨道交通、航空动力等产业链上下游企业产能与配套关系数据。'
  },
  {
    id: 6,
    region: '湘潭市',
    authType: '分领域授权运营',
    domain: '教育',
    productName: '湘潭市教育质量评估数据集',
    productType: '数据集',
    provider: '湘潭大数据运营有限公司',
    subscribeCount: 7,
    productDesc: '整合学业水平与教师评估数据，支撑区域教育质量监测。'
  },
  {
    id: 7,
    region: '衡阳市',
    authType: '整体授权运营',
    domain: '智慧农业',
    productName: '衡阳市黄花菜产业空间矢量产品',
    productType: '数据集',
    provider: '衡阳智慧城市科技有限公司',
    subscribeCount: 6,
    productDesc: '基于遥感与地块矢量数据，提供特色农产品种植面积与长势监测。'
  },
  {
    id: 8,
    region: '岳阳市',
    authType: '分领域授权运营',
    domain: '应急管理',
    productName: '岳阳市水文气象预警API',
    productType: 'API产品',
    provider: '湖南数据产业集团有限公司',
    subscribeCount: 5,
    productDesc: '接入洞庭湖流域水文站与气象观测数据，提供洪涝风险分级预警。'
  },
  {
    id: 9,
    region: '常德市',
    authType: '整体授权运营',
    domain: '自然资源',
    productName: '常德市土地权属核查数据集',
    productType: '数据集',
    provider: '常德市医保集团有限公司',
    subscribeCount: 4,
    productDesc: '提供宗地权属、用途与抵押状态的批量核验数据。'
  },
  {
    id: 10,
    region: '郴州市',
    authType: '分领域授权运营',
    domain: '文化旅游',
    productName: '郴州市文旅客流分析API',
    productType: 'API产品',
    provider: '杭州趣链科技股份有限公司',
    subscribeCount: 3,
    productDesc: '融合景区票务与运营商信令数据，输出客流画像与滞留时长分析。'
  },
  {
    id: 11,
    region: '怀化市',
    authType: '整体授权运营',
    domain: '交通运输',
    productName: '怀化市物流运力调度数据集',
    productType: '数据集',
    provider: '湖南天河国云科技有限公司',
    subscribeCount: 2,
    productDesc: '汇聚货运车辆与仓储资源数据，支撑区域物流运力匹配。'
  },
  {
    id: 12,
    region: '湘西土家族苗族自治州',
    authType: '分领域授权运营',
    domain: '医疗健康',
    productName: '湘西州基层卫生服务数据集',
    productType: '数据集',
    provider: '湖南数据产业集团有限公司',
    subscribeCount: 0,
    productDesc: '覆盖乡镇卫生院诊疗与公共卫生服务记录，暂无机构订阅。'
  }
];

const pad = (n: number) => String(n).padStart(2, '0');

/** 依据产品订阅次数生成订阅订单（演示数据，稳定可复现） */
const orderSeed: SubscriptionOrder[] = (function buildOrders() {
  const list: SubscriptionOrder[] = [];
  let seq = 1;
  seedData.forEach(function (product) {
    const total = Math.min(product.subscribeCount, 10);
    for (let i = 0; i < total; i++) {
      const status = ORDER_STATUS_LIST[(product.id + i) % 3];
      const day = pad(((product.id * 3 + i) % 27) + 1);
      const hour = pad(9 + ((i * 2) % 9));
      const minute = pad((i * 7) % 60);
      const updateHour = pad(10 + ((i * 2) % 9));
      const updateMinute = pad((i * 11) % 60);
      list.push({
        id: seq,
        productId: product.id,
        orderNo: 'SUB2026' + pad(product.id) + pad(i + 1) + String(1000 + seq),
        region: product.region,
        authType: product.authType,
        domain: product.domain,
        productName: product.productName,
        productType: product.productType,
        demander: DEMANDERS[(product.id + i) % DEMANDERS.length],
        subscribeTime: '2026-08-' + day + ' ' + hour + ':' + minute + ':00',
        updateTime: '2026-08-' + day + ' ' + updateHour + ':' + updateMinute + ':00',
        status: status
      });
      seq += 1;
    }
  });
  return list;
})();

const getOrderStatusClass = (status: string) => {
  if (status === '待审核') return 'status-pending';
  if (status === '审核通过') return 'status-approved';
  return 'status-rejected';
};

const OriginalComponent = () => {
  const [activeMenu] = useState<'subscription-order-supervision'>('subscription-order-supervision');
  const [role, setRole] = useState('数据管理部门');

  const [records] = useState<SubscriptionOrder[]>(orderSeed);

  // 筛选条件
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [searchRegion, setSearchRegion] = useState('');
  const [searchAuthType, setSearchAuthType] = useState('');
  const [searchDomain, setSearchDomain] = useState('');
  const [searchProductName, setSearchProductName] = useState('');
  const [searchProductType, setSearchProductType] = useState('');
  const [searchDemander, setSearchDemander] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchUpdateTime, setSearchUpdateTime] = useState('');

  // 列表分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 弹窗
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SubscriptionOrder | null>(null);

  // 订单明细分页
  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState(10);

  const filteredList = useMemo(() => {
    return records.filter(function (r) {
      if (searchOrderNo && !r.orderNo.includes(searchOrderNo.trim())) return false;
      if (searchRegion && r.region !== searchRegion) return false;
      if (searchAuthType && r.authType !== searchAuthType) return false;
      if (searchDomain && r.domain !== searchDomain) return false;
      if (searchProductName && !r.productName.includes(searchProductName.trim())) return false;
      if (searchProductType && r.productType !== searchProductType) return false;
      if (searchDemander && !r.demander.includes(searchDemander.trim())) return false;
      if (searchStatus && r.status !== searchStatus) return false;
      if (searchUpdateTime && !r.updateTime.includes(searchUpdateTime.trim())) return false;
      return true;
    });
  }, [records, searchOrderNo, searchRegion, searchAuthType, searchDomain, searchProductName, searchProductType, searchDemander, searchStatus, searchUpdateTime]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleQuery = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchOrderNo('');
    setSearchRegion('');
    setSearchAuthType('');
    setSearchDomain('');
    setSearchProductName('');
    setSearchProductType('');
    setSearchDemander('');
    setSearchStatus('');
    setSearchUpdateTime('');
    setCurrentPage(1);
  };

  const currentProduct = useMemo(() => {
    if (!currentRecord) return null;
    return seedData.find(function (p) { return p.id === currentRecord.productId; }) || null;
  }, [currentRecord]);

  const detailOrders = useMemo(() => {
    if (!currentRecord) return [];
    return records.filter(function (o) { return o.productId === currentRecord.productId; });
  }, [records, currentRecord]);

  const detailTotalPages = Math.max(1, Math.ceil(detailOrders.length / detailPageSize));
  const safeDetailPage = Math.min(detailPage, detailTotalPages);
  const paginatedOrders = detailOrders.slice((safeDetailPage - 1) * detailPageSize, safeDetailPage * detailPageSize);

  const handleView = (record: SubscriptionOrder) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  const handleViewDetail = (record: SubscriptionOrder) => {
    setCurrentRecord(record);
    setDetailPage(1);
    setShowDetailModal(true);
  };

  const renderFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        <div className="filter-item">
          <label>订单编号</label>
          <input type="text" placeholder="请输入" value={searchOrderNo} onChange={(e) => setSearchOrderNo(e.target.value)} />
        </div>
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
      </div>
      <div className="filter-row">
        <div className="filter-item">
          <label>产品名称</label>
          <input type="text" placeholder="请输入" value={searchProductName} onChange={(e) => setSearchProductName(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>产品类型</label>
          <select value={searchProductType} onChange={(e) => setSearchProductType(e.target.value)}>
            <option value="">请选择</option>
            {PRODUCT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>数据需求方</label>
          <input type="text" placeholder="请输入" value={searchDemander} onChange={(e) => setSearchDemander(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>订单状态</label>
          <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
            <option value="">请选择</option>
            {ORDER_STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="filter-row">
        <div className="filter-item">
          <label>更新时间</label>
          <input type="text" placeholder="请输入" value={searchUpdateTime} onChange={(e) => setSearchUpdateTime(e.target.value)} />
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
              <th className="col-order-no">订单编号</th>
              <th className="col-region">所属地域</th>
              <th className="col-auth-type">授权运营类型</th>
              <th className="col-domain">领域名称</th>
              <th className="col-product">产品名称</th>
              <th className="col-product-type">产品类型</th>
              <th className="col-demander">数据需求方</th>
              <th className="col-status">订单状态</th>
              <th className="col-update-time">更新时间</th>
              <th className="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={11} className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  暂无数据
                </td>
              </tr>
            ) : (
              paginatedList.map((record, index) => (
                <tr key={record.id}>
                  <td className="col-index">{(safePage - 1) * pageSize + index + 1}</td>
                  <td className="col-order-no" title={record.orderNo}>{record.orderNo}</td>
                  <td className="col-region">{record.region}</td>
                  <td className="col-auth-type">{record.authType}</td>
                  <td className="col-domain">{record.domain}</td>
                  <td className="col-product" title={record.productName}>{record.productName}</td>
                  <td className="col-product-type"><span className="type-tag">{record.productType}</span></td>
                  <td className="col-demander" title={record.demander}>{record.demander}</td>
                  <td className="col-status"><span className={'status-tag ' + getOrderStatusClass(record.status)}>{record.status}</span></td>
                  <td className="col-update-time">{record.updateTime}</td>
                  <td className="col-action">
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                      <button className="action-btn" onClick={() => handleViewDetail(record)}>查看订单明细</button>
                    </div>
                  </td>
                </tr>
              ))
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
            <div className="info-label">产品名称</div>
            <div className="info-value">{currentRecord?.productName}</div>
            <div className="info-label">产品类型</div>
            <div className="info-value"><span className="type-tag">{currentRecord?.productType}</span></div>
            <div className="info-label">所属地域</div>
            <div className="info-value">{currentRecord?.region}</div>
            <div className="info-label">授权运营类型</div>
            <div className="info-value">{currentRecord?.authType}</div>
            <div className="info-label">领域名称</div>
            <div className="info-value">{currentRecord?.domain}</div>
            <div className="info-label">产品提供方</div>
            <div className="info-value">{currentProduct?.provider}</div>
            <div className="info-label">订阅次数</div>
            <div className="info-value-span">{currentProduct?.subscribeCount}</div>
            <div className="info-label">产品简介</div>
            <div className="info-value-span">{currentProduct?.productDesc}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowViewModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  const renderDetailModal = () => (
    <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
      <div className="modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>订单明细</h3>
          <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-product-tip">
            产品名称：{currentRecord?.productName}　|　产品类型：{currentRecord?.productType}　|　数据需求方：{currentRecord?.demander}
          </div>
          <div className="detail-table-section">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-index">序号</th>
                    <th>订单编号</th>
                    <th>数据需求方</th>
                    <th>订阅时间</th>
                    <th>订单状态</th>
                    <th>更新时间</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order, index) => (
                      <tr key={order.id}>
                        <td className="col-index">{(safeDetailPage - 1) * detailPageSize + index + 1}</td>
                        <td>{order.orderNo}</td>
                        <td title={order.demander}>{order.demander}</td>
                        <td>{order.subscribeTime}</td>
                        <td><span className={'status-tag ' + getOrderStatusClass(order.status)}>{order.status}</span></td>
                        <td>{order.updateTime}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">共 {detailOrders.length} 条记录</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled={safeDetailPage <= 1} onClick={() => setDetailPage(Math.max(1, safeDetailPage - 1))}>上一页</button>
                {Array.from({ length: detailTotalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === detailTotalPages || Math.abs(p - safeDetailPage) <= 1)
                  .map((page, idx, arr) => (
                    <span key={page} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ color: '#999' }}>...</span>}
                      <button className={'page-number' + (page === safeDetailPage ? ' active' : '')} onClick={() => setDetailPage(page)}>{page}</button>
                    </span>
                  ))}
                <button className="page-btn" disabled={safeDetailPage >= detailTotalPages} onClick={() => setDetailPage(Math.min(detailTotalPages, safeDetailPage + 1))}>下一页</button>
                <select className="page-size-select" value={detailPageSize} onChange={(e) => { setDetailPageSize(Number(e.target.value)); setDetailPage(1); }}>
                  <option value={10}>10 条/页</option>
                  <option value={20}>20 条/页</option>
                  <option value={50}>50 条/页</option>
                </select>
                <span className="jump-to">跳至</span>
                <input className="page-input" type="number" min={1} max={detailTotalPages} value={safeDetailPage} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= detailTotalPages) setDetailPage(v); }} />
                <span className="jump-to">页</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowDetailModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout
      activeMenu={activeMenu}
      breadcrumb="订阅订单监管"
      role={role}
      onRoleChange={setRole}
      roleOptions={['数据管理部门']}
      title="订阅订单监管"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      {renderFilter()}
      {renderTable()}

      {showViewModal && renderViewModal()}
      {showDetailModal && renderDetailModal()}
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

/**
 * @name 产品交易监管
 * @mode axure
 *
 * 产品交易监管列表（数据管理部门视角），归属「授权监管」菜单组
 */

import { useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import RegionCascader from '../../common/RegionCascader';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';
import '../../common/backend-list.css';

interface ProductSubscription {
  id: number;
  region: string;
  authType: string;
  domain: string;
  productName: string;
  productType: string;
  provider: string;
  subscribeCount: number;
  /** 销售总额，单位：分（整数存储与展示，不做隐式单位换算） */
  salesAmount: number;
  productDesc: string;
}

interface SubscriptionOrder {
  id: number;
  productId: number;
  orderNo: string;
  demander: string;
  updateTime: string;
  status: string;
  /** 订单总额，单位：分（整数存储与展示，不做隐式单位换算） */
  orderAmount: number;
}

/** 订单明细接口返回的产品概要，字段名与后端保持一致 */
interface OrderDetailProduct {
  region: string;        // 所属地域
  authType: string;      // 授权运营类型
  domain: string;        // 领域名称
  productName: string;   // 产品名称
  productType: string;   // 产品类型
  provider: string;      // 产品提供方
}

const SUMMARY_FIELDS: Array<{ key: keyof OrderDetailProduct; label: string }> = [
  { key: 'region', label: '所属地域' },
  { key: 'authType', label: '授权运营类型' },
  { key: 'domain', label: '领域名称' },
  { key: 'productName', label: '产品名称' },
  { key: 'productType', label: '产品类型' },
  { key: 'provider', label: '产品提供方' }
];

/** 模拟订单明细接口的产品概要拉取；原型阶段直接基于本地数据派生，保留 Promise 形态便于切换为真实接口 */
function fetchOrderDetailProduct(record: ProductSubscription | null): Promise<OrderDetailProduct | null> {
  return new Promise(function (resolve) {
    if (!record) {
      resolve(null);
      return;
    }
    setTimeout(function () {
      resolve({
        region: record.region,
        authType: record.authType,
        domain: record.domain,
        productName: record.productName,
        productType: record.productType,
        provider: record.provider
      });
    }, 220);
  });
}

const AUTH_TYPE_OPTIONS = ['整体授权运营', '分领域授权运营'];
const DOMAIN_OPTIONS = ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源', '城市治理', '金融服务', '工业制造', '智慧农业', '应急管理'];
const PRODUCT_TYPE_OPTIONS = ['数据集', 'API产品'];
const ORDER_STATUS_LIST = ['已下单', '交付中', '已完成', '已终止', '已冻结'];

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

const seedData: ProductSubscription[] = [
  {
    id: 1,
    region: '省本级',
    authType: '整体授权运营',
    domain: '医疗健康',
    productName: '湖南省医疗就诊数据再开发产品',
    productType: 'API产品',
    provider: '湖南天河国云科技有限公司',
    subscribeCount: 8,
    salesAmount: 12845600,
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
    subscribeCount: 6,
    salesAmount: 9632100,
    productDesc: '面向医保精细化管理场景，提供结算层级的结构化个人画像标签数据。'
  },
  {
    id: 3,
    region: '芙蓉区',
    authType: '整体授权运营',
    domain: '城市治理',
    productName: '长沙市城市交通流量监测API',
    productType: 'API产品',
    provider: '长沙数字科技有限公司',
    subscribeCount: 5,
    salesAmount: 7458000,
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
    subscribeCount: 4,
    salesAmount: 5820900,
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
    subscribeCount: 4,
    salesAmount: 4213500,
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
    subscribeCount: 2,
    salesAmount: 2876400,
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
    subscribeCount: 1,
    salesAmount: 1532800,
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
    subscribeCount: 1,
    salesAmount: 986400,
    productDesc: '接入洞庭湖流域水文站与气象观测数据，提供洪涝风险分级预警。'
  }
];

const pad = (n: number) => String(n).padStart(2, '0');

/** 千分位格式化：整数，仅添加分隔符，不做任何单位换算 */
const formatThousands = (value: number) => {
  if (typeof value !== 'number' || !isFinite(value)) return '-';
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/** 金额格式化：单位为「分」的整数，展示不做单位换算，千分位分隔并保留两位小数 */
const formatAmountInCents = (value: number) => {
  if (typeof value !== 'number' || !isFinite(value)) return '-';
  return formatThousands(value) + '.00';
};

/** 顶部统计概览：全量统计口径，不随列表筛选条件联动；tip 为悬浮问号图标的说明文案 */
const OVERVIEW_STATS: Array<{ key: string; label: string; tip: string; value: number }> = [
  { key: 'tradableProducts', label: '流通数据产品（个）', tip: '当前处于可交易状态的数据产品', value: 1284 },
  { key: 'validOrders', label: '有效订单数（个）', tip: '供需双方完成合同签订的订单', value: 86420 },
  { key: 'successCalls', label: '成功调用数（次）', tip: 'API 产品的成功调用次数，数据累计至前一日 24:00', value: 12684500 },
  { key: 'tradeAmount', label: '产品交易总额（元）', tip: '完成合同签订的数据产品订单总额', value: 45365700 }
];

/** 依据产品订单总数生成订阅订单明细（演示数据，稳定可复现） */
const orderSeed: SubscriptionOrder[] = (function buildOrders() {
  const list: SubscriptionOrder[] = [];
  let seq = 1;
  seedData.forEach(function (product) {
    const total = Math.min(product.subscribeCount, 10);
    for (let i = 0; i < total; i++) {
      const status = ORDER_STATUS_LIST[(product.id + i) % ORDER_STATUS_LIST.length];
      const day = pad(((product.id * 3 + i) % 27) + 1);
      const hour = pad(9 + ((i * 2) % 9));
      const minute = pad((i * 7) % 60);
      const auditHour = pad(10 + ((i * 2) % 9));
      list.push({
        id: seq,
        productId: product.id,
        orderNo: 'SUB2026' + pad(product.id) + pad(i + 1) + String(1000 + seq),
        demander: DEMANDERS[(product.id + i) % DEMANDERS.length],
        updateTime: '2026-08-' + day + ' ' + auditHour + ':' + pad((i * 11) % 60) + ':00',
        status: status,
        orderAmount: (product.id * 137 + i * 29) * 1000 + 80000
      });
      seq += 1;
    }
  });
  return list;
})();

const getOrderStatusClass = (status: string) => {
  if (status === '已下单') return 'status-pending';
  if (status === '交付中') return 'status-processing';
  if (status === '已完成') return 'status-approved';
  if (status === '已终止') return 'status-rejected';
  return 'status-frozen';
};

/** API 类型产品：仅此类产品的订单提供「调用明细」入口 */
const API_PRODUCT_TYPE = 'API产品';

interface CallLog {
  id: number;
  orderId: string;
  apiName: string;
  status: '成功' | '失败';
  duration: number;
  callTime: string;
  errorCode: string;
  errorMessage: string;
}

const CALL_STATUS_OPTIONS = ['成功', '失败'];
const TIME_RANGE_OPTIONS = [
  { value: '3m', label: '近三个月' },
  { value: '6m', label: '近半年' },
  { value: '1y', label: '近一年' }
];
/** 各时间范围起点（演示基准时间 2026-09-09） */
const TIME_RANGE_CUTOFF: Record<string, string> = { '3m': '2026-06-09', '6m': '2026-03-09', '1y': '2025-09-09' };

const CALL_ERRORS = [
  { code: '500', message: '服务内部异常，调用链路中断，请稍后重试' },
  { code: '403', message: '访问凭证已过期，无接口调用权限' },
  { code: '429', message: '请求超过接口调用频率限制，触发限流策略' },
  { code: '504', message: '上游数据源响应超时，网关主动断开连接' },
  { code: '400', message: '请求参数校验失败，缺少必填字段' }
];

/** 依据订单生成 API 调用日志（仅 API 产品，演示数据，稳定可复现） */
const callLogsByOrder: Record<string, CallLog[]> = (function buildCallLogs() {
  const map: Record<string, CallLog[]> = {};
  let seq = 1;
  orderSeed.forEach(function (order) {
    const product = seedData.find(function (p) { return p.id === order.productId; });
    if (!product || product.productType !== API_PRODUCT_TYPE) return;
    const count = 26 + ((order.id * 7 + seq) % 30);
    const logs: CallLog[] = [];
    for (let i = 0; i < count; i++) {
      const failed = (order.id * 13 + i * 5) % 9 === 0;
      const err = CALL_ERRORS[(order.id + i) % CALL_ERRORS.length];
      const absMonth = 2026 * 12 + 8 - ((order.id * 5 + i * 3) % 12);
      const year = Math.floor(absMonth / 12);
      const month = (absMonth % 12) + 1;
      const day = pad(((order.id * 11 + i * 13) % 28) + 1);
      const hour = pad(8 + ((i * 3) % 14));
      const minute = pad((i * 17) % 60);
      logs.push({
        id: seq,
        orderId: order.orderNo,
        apiName: product.productName,
        status: failed ? '失败' : '成功',
        duration: failed ? 1200 + ((order.id * 97 + i * 53) % 3800) : 60 + ((order.id * 37 + i * 29) % 840),
        callTime: year + '-' + pad(month) + '-' + day + ' ' + hour + ':' + minute,
        errorCode: failed ? err.code : '',
        errorMessage: failed ? err.message : ''
      });
      seq += 1;
    }
    map[order.orderNo] = logs;
  });
  return map;
})();

/** 调用明细顶部汇总统计基准值（演示数据，稳定可复现） */
const callStatsByOrder: Record<string, { total: number; success: number; failed: number }> = (function buildCallStats() {
  const map: Record<string, { total: number; success: number; failed: number }> = {};
  orderSeed.forEach(function (order) {
    const product = seedData.find(function (p) { return p.id === order.productId; });
    if (!product || product.productType !== API_PRODUCT_TYPE) return;
    const total = 6000 + ((order.id * 937) % 9000);
    const failed = Math.max(1, Math.round(total * (0.02 + (order.id % 5) * 0.01)));
    map[order.orderNo] = { total: total, success: total - failed, failed: failed };
  });
  return map;
})();

const OriginalComponent = () => {
  const [activeMenu] = useState<'product-subscription-supervision'>('product-subscription-supervision');
  const [role, setRole] = useState('数据管理部门');

  const [records] = useState<ProductSubscription[]>(seedData);

  // 筛选条件
  const [searchRegion, setSearchRegion] = useState('');
  const [searchAuthType, setSearchAuthType] = useState('');
  const [searchDomain, setSearchDomain] = useState('');
  const [searchProductName, setSearchProductName] = useState('');
  const [searchProductType, setSearchProductType] = useState('');
  const [searchProvider, setSearchProvider] = useState('');
  const [searchSubscribeCount, setSearchSubscribeCount] = useState('');

  // 列表分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 弹窗
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ProductSubscription | null>(null);
  // 订阅明细中被点击的订单（用于打开该订单的调用明细）
  const [currentOrder, setCurrentOrder] = useState<SubscriptionOrder | null>(null);

  // 订单明细分页
  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState(10);

  // 订单明细筛选
  const [detailOrderNo, setDetailOrderNo] = useState('');
  const [detailDemander, setDetailDemander] = useState('');
  const [detailStatus, setDetailStatus] = useState('');
  const [detailUpdateStart, setDetailUpdateStart] = useState('');
  const [detailUpdateEnd, setDetailUpdateEnd] = useState('');

  // 订单明细产品概要
  const [detailProduct, setDetailProduct] = useState<OrderDetailProduct | null>(null);
  const [detailProductLoading, setDetailProductLoading] = useState(false);
  const [detailProductError, setDetailProductError] = useState(false);

  // 调用明细：弹窗 / 筛选 / 分页 / 加载
  const [showCallModal, setShowCallModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failLog, setFailLog] = useState<CallLog | null>(null);
  const [callStatus, setCallStatus] = useState('');
  const [callTimeRange, setCallTimeRange] = useState('3m');
  const [callPage, setCallPage] = useState(1);
  const [callPageSize, setCallPageSize] = useState(10);
  const [callLoading, setCallLoading] = useState(false);
  const [callError, setCallError] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsExtra, setStatsExtra] = useState(0);

  const filteredList = useMemo(() => {
    return records.filter(function (r) {
      if (searchRegion && r.region !== searchRegion) return false;
      if (searchAuthType && r.authType !== searchAuthType) return false;
      if (searchDomain && r.domain !== searchDomain) return false;
      if (searchProductName && !r.productName.includes(searchProductName)) return false;
      if (searchProductType && r.productType !== searchProductType) return false;
      if (searchProvider && !r.provider.includes(searchProvider)) return false;
      if (searchSubscribeCount && String(r.subscribeCount) !== searchSubscribeCount.trim()) return false;
      return true;
    });
  }, [records, searchRegion, searchAuthType, searchDomain, searchProductName, searchProductType, searchProvider, searchSubscribeCount]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleQuery = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchRegion('');
    setSearchAuthType('');
    setSearchDomain('');
    setSearchProductName('');
    setSearchProductType('');
    setSearchProvider('');
    setSearchSubscribeCount('');
    setCurrentPage(1);
  };

  const detailOrders = useMemo(() => {
    if (!currentRecord) return [];
    return orderSeed.filter(function (o) {
      if (o.productId !== currentRecord.id) return false;
      if (detailOrderNo && !o.orderNo.toLowerCase().includes(detailOrderNo.toLowerCase())) return false;
      if (detailDemander && !o.demander.includes(detailDemander)) return false;
      if (detailStatus && o.status !== detailStatus) return false;
      if ((detailUpdateStart || detailUpdateEnd) && o.updateTime === '—') return false;
      if (detailUpdateStart && o.updateTime < detailUpdateStart) return false;
      if (detailUpdateEnd && o.updateTime > detailUpdateEnd + ' 23:59:59') return false;
      return true;
    });
  }, [currentRecord, detailOrderNo, detailDemander, detailStatus, detailUpdateStart, detailUpdateEnd]);

  const detailTotalPages = Math.max(1, Math.ceil(detailOrders.length / detailPageSize));
  const safeDetailPage = Math.min(detailPage, detailTotalPages);
  const paginatedOrders = detailOrders.slice((safeDetailPage - 1) * detailPageSize, safeDetailPage * detailPageSize);

  const handleView = (record: ProductSubscription) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  const handleViewDetail = (record: ProductSubscription) => {
    setCurrentRecord(record);
    setDetailOrderNo('');
    setDetailDemander('');
    setDetailStatus('');
    setDetailUpdateStart('');
    setDetailUpdateEnd('');
    setDetailPage(1);
    setDetailProduct(null);
    setDetailProductError(false);
    setDetailProductLoading(true);
    setShowDetailModal(true);

    fetchOrderDetailProduct(record)
      .then(function (data) {
        setDetailProduct(data);
      })
      .catch(function () {
        setDetailProductError(true);
      })
      .finally(function () {
        setDetailProductLoading(false);
      });
  };

  const handleDetailQuery = () => {
    setDetailPage(1);
  };

  const handleDetailReset = () => {
    setDetailOrderNo('');
    setDetailDemander('');
    setDetailStatus('');
    setDetailUpdateStart('');
    setDetailUpdateEnd('');
    setDetailPage(1);
  };

  /** 当前明细所属产品是否为 API 类型（决定「调用明细」按钮是否出现） */
  const isApiProduct = currentRecord?.productType === API_PRODUCT_TYPE;

  const callLogs = useMemo(() => {
    if (!currentOrder) return [];
    const cutoff = TIME_RANGE_CUTOFF[callTimeRange] || TIME_RANGE_CUTOFF['3m'];
    return (callLogsByOrder[currentOrder.orderNo] || []).filter(function (log) {
      if (callStatus && log.status !== callStatus) return false;
      if (log.callTime < cutoff) return false;
      return true;
    });
  }, [currentOrder, callStatus, callTimeRange]);

  const callTotalPages = Math.max(1, Math.ceil(callLogs.length / callPageSize));
  const safeCallPage = Math.min(callPage, callTotalPages);
  const paginatedCallLogs = callLogs.slice((safeCallPage - 1) * callPageSize, safeCallPage * callPageSize);

  const callStats = useMemo(() => {
    if (!currentOrder) return null;
    const base = callStatsByOrder[currentOrder.orderNo] || { total: 0, success: 0, failed: 0 };
    const extraFailed = Math.round(statsExtra * 0.05);
    return {
      total: base.total + statsExtra,
      success: base.success + (statsExtra - extraFailed),
      failed: base.failed + extraFailed
    };
  }, [currentOrder, statsExtra]);

  /** 模拟异步加载调用日志（含加载中与错误状态兜底） */
  const loadCallLogs = (orderNo: string) => {
    setCallLoading(true);
    setCallError('');
    window.setTimeout(function () {
      if (!callLogsByOrder[orderNo]) setCallError('未获取到调用明细数据，请点击查询重试');
      setCallLoading(false);
    }, 400);
  };

  const handleShowCallModal = (order: SubscriptionOrder) => {
    setCurrentOrder(order);
    setCallStatus('');
    setCallTimeRange('3m');
    setCallPage(1);
    setCallPageSize(10);
    setStatsExtra(0);
    setShowCallModal(true);
    loadCallLogs(order.orderNo);
  };

  const handleCallQuery = () => {
    setCallPage(1);
    if (currentOrder) loadCallLogs(currentOrder.orderNo);
  };

  const handleCallReset = () => {
    setCallStatus('');
    setCallTimeRange('3m');
    setCallPage(1);
    if (currentOrder) loadCallLogs(currentOrder.orderNo);
  };

  const handleRefreshStats = () => {
    setStatsLoading(true);
    window.setTimeout(function () {
      setStatsExtra(function (e) { return e + 7 + (e % 4) * 3; });
      setStatsLoading(false);
    }, 500);
  };

  const handleViewFailReason = (log: CallLog) => {
    setFailLog(log);
    setShowFailModal(true);
  };

  const renderOverview = () => (
    <div className="list-overview">
      {OVERVIEW_STATS.map(function (item) {
        return (
          <div key={item.key} className="list-overview-item">
            <span className="list-overview-label">
              <span className="list-overview-label-text">{item.label}</span>
              <span className="stat-help-icon" role="img" aria-label={item.tip}>?
                <span className="stat-help-tooltip" role="tooltip">{item.tip}</span>
              </span>
            </span>
            <strong className="list-overview-value">{formatThousands(item.value)}</strong>
          </div>
        );
      })}
    </div>
  );

  const renderFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        <RegionCascader value={searchRegion} onChange={setSearchRegion} />
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
          <label>产品名称</label>
          <input type="text" placeholder="请输入" value={searchProductName} onChange={(e) => setSearchProductName(e.target.value)} />
        </div>
      </div>
      <div className="filter-row">
        <div className="filter-item filter-item-select">
          <label>产品类型</label>
          <select value={searchProductType} onChange={(e) => setSearchProductType(e.target.value)}>
            <option value="">请选择</option>
            {PRODUCT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>产品提供方</label>
          <input type="text" placeholder="请输入" value={searchProvider} onChange={(e) => setSearchProvider(e.target.value)} />
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
              <th className="col-region">所属地域</th>
              <th className="col-auth-type">授权运营类型</th>
              <th className="col-domain">领域名称</th>
              <th className="col-product">产品名称</th>
              <th className="col-product-type">产品类型</th>
              <th className="col-provider">产品提供方</th>
              <th className="col-subscribe-count">订单总数</th>
              <th className="col-sales-amount">销售总额（元）</th>
              <th className="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  暂无数据
                </td>
              </tr>
            ) : (
              paginatedList.map((record, index) => (
                <tr key={record.id}>
                  <td className="col-index">{(safePage - 1) * pageSize + index + 1}</td>
                  <td className="col-region">{record.region}</td>
                  <td className="col-auth-type">{record.authType}</td>
                  <td className="col-domain">{record.domain}</td>
                  <td className="col-product" title={record.productName}>{record.productName}</td>
                  <td className="col-product-type"><span className="type-tag">{record.productType}</span></td>
                  <td className="col-provider" title={record.provider}>{record.provider}</td>
                  <td className="col-subscribe-count">{record.subscribeCount}</td>
                  <td className="col-sales-amount">{formatAmountInCents(record.salesAmount)}</td>
                  <td className="col-action">
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                      <button className="action-btn" onClick={() => handleViewDetail(record)}>订单明细</button>
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
            <div className="info-value">{currentRecord?.provider}</div>
            <div className="info-label">订单总数</div>
            <div className="info-value-span">{currentRecord?.subscribeCount}</div>
            <div className="info-label">产品简介</div>
            <div className="info-value-span">{currentRecord?.productDesc}</div>
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
          <div className="detail-summary" aria-busy={detailProductLoading}>
            {detailProductLoading ? (
              <div className="detail-summary-grid">
                {SUMMARY_FIELDS.map(function (field) {
                  return (
                    <div key={field.key} className="detail-summary-item">
                      <span className="detail-summary-label">{field.label}</span>
                      <span className="detail-summary-skeleton" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="detail-summary-grid">
                {SUMMARY_FIELDS.map(function (field) {
                  const raw = detailProduct ? detailProduct[field.key] : '';
                  const value = raw && String(raw).trim() ? String(raw) : '-';
                  return (
                    <div key={field.key} className="detail-summary-item">
                      <span className="detail-summary-label">{field.label}</span>
                      <span className="detail-summary-value" title={value === '-' ? '' : value}>{value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="detail-filter">
            <div className="detail-filter-row">
              <div className="detail-filter-item">
                <label>订单编号</label>
                <input type="text" placeholder="请输入" value={detailOrderNo} onChange={(e) => setDetailOrderNo(e.target.value)} />
              </div>
              <div className="detail-filter-item">
                <label>数据需求方</label>
                <input type="text" placeholder="请输入" value={detailDemander} onChange={(e) => setDetailDemander(e.target.value)} />
              </div>
              <div className="detail-filter-item detail-filter-item-select">
                <label>订单状态</label>
                <select value={detailStatus} onChange={(e) => setDetailStatus(e.target.value)}>
                  <option value="">请选择</option>
                  {ORDER_STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="detail-filter-row">
              <div className="detail-filter-item detail-filter-item-date">
                <label>更新时间</label>
                <div className="detail-date-inputs">
                  <div className="detail-date-input"><input type="date" value={detailUpdateStart} onChange={(e) => setDetailUpdateStart(e.target.value)} /></div>
                  <span className="detail-date-sep">-</span>
                  <div className="detail-date-input"><input type="date" value={detailUpdateEnd} onChange={(e) => setDetailUpdateEnd(e.target.value)} /></div>
                </div>
              </div>
            </div>
            <div className="detail-filter-actions">
              <button className="btn btn-primary btn-sm" onClick={handleDetailQuery}>查询</button>
              <button className="btn btn-default btn-sm" onClick={handleDetailReset}>重置</button>
            </div>
          </div>
          <div className="detail-table-section">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-index">序号</th>
                    <th>订单编号</th>
                    <th>数据需求方</th>
                    <th>订单状态</th>
                    <th className="col-order-amount">订单总额（元）</th>
                    <th>更新时间</th>
                    <th className="col-action">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-state">
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
                        <td><span className={'status-tag ' + getOrderStatusClass(order.status)}>{order.status}</span></td>
                        <td className="col-order-amount">{formatAmountInCents(order.orderAmount)}</td>
                        <td>{order.updateTime}</td>
                        <td className="col-action">
                          {isApiProduct && (
                            <div className="action-buttons">
                              <button className="action-btn" onClick={() => handleShowCallModal(order)}>调用明细</button>
                            </div>
                          )}
                        </td>
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

  const renderCallModal = () => (
    <div className="modal-overlay" onClick={() => setShowCallModal(false)}>
      <div className="modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>调用明细</h3>
          <button className="modal-close" onClick={() => setShowCallModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="call-tip">
            由于数据量较大导致调用次数统计存在延时，您可<span className="link-btn" onClick={handleRefreshStats}>{statsLoading ? '刷新中…' : '手动刷新'}</span>获取最新的调用次数
          </div>
          <div className="view-info-grid call-stats-grid">
            <div className="info-label">API接口名称</div>
            <div className="info-value" title={currentOrder ? currentRecord?.productName : ''}>{currentRecord?.productName}</div>
            <div className="info-label">调用总次数</div>
            <div className="info-value">{statsLoading ? '统计中…' : (callStats ? formatThousands(callStats.total) : '-')}</div>
            <div className="info-label">调用成功次数</div>
            <div className="info-value">{statsLoading ? '统计中…' : (callStats ? formatThousands(callStats.success) : '-')}</div>
            <div className="info-label">调用失败次数</div>
            <div className="info-value">{statsLoading ? '统计中…' : (callStats ? formatThousands(callStats.failed) : '-')}</div>
          </div>
          <div className="filter-section call-filter-section">
            <div className="filter-row">
              <div className="filter-item filter-item-select">
                <label>调用状态</label>
                <select value={callStatus} onChange={(e) => setCallStatus(e.target.value)}>
                  <option value="">请选择</option>
                  {CALL_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="filter-item filter-item-select">
                <label>调用时间</label>
                <select value={callTimeRange} onChange={(e) => setCallTimeRange(e.target.value)}>
                  {TIME_RANGE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="filter-actions">
              <div className="filter-actions-left">
                <button className="btn btn-primary btn-sm" onClick={handleCallQuery}>查询</button>
                <button className="btn btn-default btn-sm" onClick={handleCallReset}>重置</button>
              </div>
            </div>
          </div>
          <div className="detail-table-section">
            <div className="table-wrapper">
              <table className="data-table call-log-table">
                <thead>
                  <tr>
                    <th className="col-index">序号</th>
                    <th>调用状态</th>
                    <th>响应时长(ms)</th>
                    <th>调用时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {callLoading ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        <div className="empty-state-icon">⏳</div>
                        加载中…
                      </td>
                    </tr>
                  ) : callError ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        <div className="empty-state-icon">⚠️</div>
                        {callError}
                      </td>
                    </tr>
                  ) : paginatedCallLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        暂无调用记录
                      </td>
                    </tr>
                  ) : (
                    paginatedCallLogs.map((log, index) => (
                      <tr key={log.id}>
                        <td className="col-index">{(safeCallPage - 1) * callPageSize + index + 1}</td>
                        <td className={log.status === '失败' ? 'call-status-fail' : ''}>{log.status}</td>
                        <td>{log.duration}</td>
                        <td>{log.callTime}</td>
                        <td>
                          {log.status === '失败' && (
                            <button className="action-btn" onClick={() => handleViewFailReason(log)}>查看失败原因</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">共 {callLogs.length} 条记录</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled={safeCallPage <= 1} onClick={() => setCallPage(Math.max(1, safeCallPage - 1))}>上一页</button>
                {Array.from({ length: callTotalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === callTotalPages || Math.abs(p - safeCallPage) <= 1)
                  .map((page, idx, arr) => (
                    <span key={page} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ color: '#999' }}>...</span>}
                      <button className={'page-number' + (page === safeCallPage ? ' active' : '')} onClick={() => setCallPage(page)}>{page}</button>
                    </span>
                  ))}
                <button className="page-btn" disabled={safeCallPage >= callTotalPages} onClick={() => setCallPage(Math.min(callTotalPages, safeCallPage + 1))}>下一页</button>
                <select className="page-size-select" value={callPageSize} onChange={(e) => { setCallPageSize(Number(e.target.value)); setCallPage(1); }}>
                  <option value={10}>10 条/页</option>
                  <option value={20}>20 条/页</option>
                  <option value={50}>50 条/页</option>
                </select>
                <span className="jump-to">跳至</span>
                <input className="page-input" type="number" min={1} max={callTotalPages} value={safeCallPage} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= callTotalPages) setCallPage(v); }} />
                <span className="jump-to">页</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowCallModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  const renderFailModal = () => (
    <div className="modal-overlay" onClick={() => setShowFailModal(false)}>
      <div className="modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>失败原因</h3>
          <button className="modal-close" onClick={() => setShowFailModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="view-info-grid">
            <div className="info-label">错误码</div>
            <div className="info-value">{failLog?.errorCode || '-'}</div>
            <div className="info-label">调用时间</div>
            <div className="info-value">{failLog?.callTime || '-'}</div>
            <div className="info-label">错误描述</div>
            <div className="info-value-span">{failLog?.errorMessage || '-'}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowFailModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout
      activeMenu={activeMenu}
      breadcrumb="产品交易监管"
      role={role}
      onRoleChange={setRole}
      roleOptions={['数据管理部门']}
      title="产品交易监管"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      {renderOverview()}
      {renderFilter()}
      {renderTable()}

      {showViewModal && renderViewModal()}
      {showDetailModal && renderDetailModal()}
      {showCallModal && renderCallModal()}
      {showFailModal && renderFailModal()}
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

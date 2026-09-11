/**
 * @name 订单交付监管
 * @mode axure
 *
 * 订单交付监管列表（数据管理部门视角），归属「授权监管」菜单组
 */

import { useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import RegionCascader from '../../common/RegionCascader';
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
  amount: number;
}

const AUTH_TYPE_OPTIONS = ['整体授权运营', '分领域授权运营'];
const DOMAIN_OPTIONS = ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源', '城市治理', '金融服务', '工业制造', '智慧农业', '应急管理'];
const PRODUCT_TYPE_OPTIONS = ['数据集', 'API产品'];
const ORDER_STATUS_LIST = ['已下单', '交付中', '已完成', '已终止', '已冻结'];

/** 金额格式化：千分位分隔并保留两位小数 */
const formatAmount = (value: number) => {
  if (typeof value !== 'number' || !isFinite(value)) return '-';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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
    subscribeCount: 8,
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
    productDesc: '面向医保精细化管理场景，提供结算层级的结构化个人画像标签数据。'
  },
  {
    id: 3,
    region: '天心区',
    authType: '整体授权运营',
    domain: '城市治理',
    productName: '长沙市城市交通流量监测API',
    productType: 'API产品',
    provider: '长沙数字科技有限公司',
    subscribeCount: 5,
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
    productDesc: '接入洞庭湖流域水文站与气象观测数据，提供洪涝风险分级预警。'
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
      const status = ORDER_STATUS_LIST[(product.id + i) % ORDER_STATUS_LIST.length];
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
        status: status,
        amount: 500000 + ((product.id * 123457 + seq * 7919) % 9945000)
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

/** 依据订单生成 API 调用日志（演示数据，稳定可复现） */
const callLogsByOrder: Record<string, CallLog[]> = (function buildCallLogs() {
  const map: Record<string, CallLog[]> = {};
  let seq = 1;
  orderSeed.forEach(function (order) {
    if (order.productType !== 'API产品') return;
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
        apiName: order.productName,
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

/** 顶部汇总统计基准值（演示数据，稳定可复现） */
const callStatsByOrder: Record<string, { total: number; success: number; failed: number }> = (function buildCallStats() {
  const map: Record<string, { total: number; success: number; failed: number }> = {};
  orderSeed.forEach(function (order) {
    if (order.productType !== 'API产品') return;
    const total = 6000 + ((order.id * 937) % 9000);
    const failed = Math.max(1, Math.round(total * (0.02 + (order.id % 5) * 0.01)));
    map[order.orderNo] = { total: total, success: total - failed, failed: failed };
  });
  return map;
})();

interface DownloadLog {
  id: number;
  orderId: string;
  tableName: string;
  status: '成功' | '失败';
  duration: number;
  downloadTime: string;
  errorCode: string;
  errorMessage: string;
}

const DOWNLOAD_ERRORS = [
  { code: '403', message: '访问凭证已过期，无数据下载权限' },
  { code: '500', message: '文件服务内部异常，生成下载包失败' },
  { code: '504', message: '数据集文件较大，生成下载包超时' },
  { code: '400', message: '下载参数校验失败，缺少必填字段' },
  { code: '429', message: '并发下载任务超限，触发限流策略' }
];

/** 数据集产品的表名（演示数据） */
const DATASET_TABLE_NAMES: Record<number, string> = {
  2: 'med_settle_profile_2026',
  5: 'chain_supply_2026',
  6: 'edu_quality_2026',
  7: 'huanghuacai_2026'
};

/** 依据订单生成下载日志（演示数据，稳定可复现） */
const downloadLogsByOrder: Record<string, DownloadLog[]> = (function buildDownloadLogs() {
  const map: Record<string, DownloadLog[]> = {};
  let seq = 1;
  orderSeed.forEach(function (order) {
    if (order.productType !== '数据集') return;
    const count = 12 + ((order.id * 5 + seq) % 16);
    const logs: DownloadLog[] = [];
    for (let i = 0; i < count; i++) {
      const failed = (order.id * 11 + i * 3) % 7 === 0;
      const err = DOWNLOAD_ERRORS[(order.id + i) % DOWNLOAD_ERRORS.length];
      const absMonth = 2026 * 12 + 8 - ((order.id * 7 + i * 5) % 12);
      const year = Math.floor(absMonth / 12);
      const month = (absMonth % 12) + 1;
      const day = pad(((order.id * 13 + i * 7) % 28) + 1);
      const hour = pad(8 + ((i * 5) % 14));
      const minute = pad((i * 23) % 60);
      logs.push({
        id: seq,
        orderId: order.orderNo,
        tableName: DATASET_TABLE_NAMES[order.productId] || 'dataset_default_2026',
        status: failed ? '失败' : '成功',
        duration: failed ? 8000 + ((order.id * 211 + i * 89) % 22000) : 600 + ((order.id * 173 + i * 97) % 5400),
        downloadTime: year + '-' + pad(month) + '-' + day + ' ' + hour + ':' + minute,
        errorCode: failed ? err.code : '',
        errorMessage: failed ? err.message : ''
      });
      seq += 1;
    }
    map[order.orderNo] = logs;
  });
  return map;
})();

/** 下载汇总统计基准值（演示数据，稳定可复现） */
const downloadStatsByOrder: Record<string, { total: number; success: number; failed: number }> = (function buildDownloadStats() {
  const map: Record<string, { total: number; success: number; failed: number }> = {};
  orderSeed.forEach(function (order) {
    if (order.productType !== '数据集') return;
    const total = 24 + ((order.id * 53) % 90);
    const failed = Math.max(1, Math.round(total * (0.1 + (order.id % 3) * 0.05)));
    map[order.orderNo] = { total: total, success: total - failed, failed: failed };
  });
  return map;
})();

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
  const [showCallModal, setShowCallModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDownloadFailModal, setShowDownloadFailModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SubscriptionOrder | null>(null);
  const [failLog, setFailLog] = useState<CallLog | null>(null);
  const [downloadFailLog, setDownloadFailLog] = useState<DownloadLog | null>(null);

  // 调用明细：筛选 / 分页 / 加载
  const [callStatus, setCallStatus] = useState('');
  const [callTimeRange, setCallTimeRange] = useState('3m');
  const [callPage, setCallPage] = useState(1);
  const [callPageSize, setCallPageSize] = useState(10);
  const [callLoading, setCallLoading] = useState(false);
  const [callError, setCallError] = useState('');

  // 顶部汇总统计（独立于表格刷新）
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsExtra, setStatsExtra] = useState(0);

  // 下载明细：筛选 / 分页 / 加载
  const [downloadStatus, setDownloadStatus] = useState('');
  const [downloadTimeRange, setDownloadTimeRange] = useState('3m');
  const [downloadPage, setDownloadPage] = useState(1);
  const [downloadPageSize, setDownloadPageSize] = useState(10);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  /** 筛选后统一按「更新时间」倒序排列（最新在前） */
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
    }).sort(function (a, b) {
      return b.updateTime.localeCompare(a.updateTime);
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

  const callLogs = useMemo(() => {
    if (!currentRecord) return [];
    const cutoff = TIME_RANGE_CUTOFF[callTimeRange] || TIME_RANGE_CUTOFF['3m'];
    return (callLogsByOrder[currentRecord.orderNo] || []).filter(function (log) {
      if (callStatus && log.status !== callStatus) return false;
      if (log.callTime < cutoff) return false;
      return true;
    });
  }, [currentRecord, callStatus, callTimeRange]);

  const callTotalPages = Math.max(1, Math.ceil(callLogs.length / callPageSize));
  const safeCallPage = Math.min(callPage, callTotalPages);
  const paginatedCallLogs = callLogs.slice((safeCallPage - 1) * callPageSize, safeCallPage * callPageSize);

  const callStats = useMemo(() => {
    if (!currentRecord) return null;
    const base = callStatsByOrder[currentRecord.orderNo] || { total: 0, success: 0, failed: 0 };
    const extraFailed = Math.round(statsExtra * 0.05);
    return {
      total: base.total + statsExtra,
      success: base.success + (statsExtra - extraFailed),
      failed: base.failed + extraFailed
    };
  }, [currentRecord, statsExtra]);

  const handleView = (record: SubscriptionOrder) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  /** 模拟异步加载调用日志（含加载中与错误状态兜底） */
  const loadCallLogs = (orderNo: string, delay?: number) => {
    setCallLoading(true);
    setCallError('');
    window.setTimeout(function () {
      if (!callLogsByOrder[orderNo]) setCallError('未获取到调用明细数据，请点击查询重试');
      setCallLoading(false);
    }, delay === undefined ? 400 : delay);
  };

  const handleShowCallModal = (record: SubscriptionOrder) => {
    setCurrentRecord(record);
    setCallStatus('');
    setCallTimeRange('3m');
    setCallPage(1);
    setCallPageSize(10);
    setStatsExtra(0);
    setShowCallModal(true);
    loadCallLogs(record.orderNo);
  };

  const handleCallQuery = () => {
    setCallPage(1);
    if (currentRecord) loadCallLogs(currentRecord.orderNo);
  };

  const handleCallReset = () => {
    setCallStatus('');
    setCallTimeRange('3m');
    setCallPage(1);
    if (currentRecord) loadCallLogs(currentRecord.orderNo);
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

  const downloadLogs = useMemo(() => {
    if (!currentRecord) return [];
    const cutoff = TIME_RANGE_CUTOFF[downloadTimeRange] || TIME_RANGE_CUTOFF['3m'];
    return (downloadLogsByOrder[currentRecord.orderNo] || []).filter(function (log) {
      if (downloadStatus && log.status !== downloadStatus) return false;
      if (log.downloadTime < cutoff) return false;
      return true;
    });
  }, [currentRecord, downloadStatus, downloadTimeRange]);

  const downloadTotalPages = Math.max(1, Math.ceil(downloadLogs.length / downloadPageSize));
  const safeDownloadPage = Math.min(downloadPage, downloadTotalPages);
  const paginatedDownloadLogs = downloadLogs.slice((safeDownloadPage - 1) * downloadPageSize, safeDownloadPage * downloadPageSize);

  const downloadStats = useMemo(() => {
    if (!currentRecord) return null;
    return downloadStatsByOrder[currentRecord.orderNo] || { total: 0, success: 0, failed: 0 };
  }, [currentRecord]);

  /** 模拟异步加载下载日志（含加载中与错误状态兜底） */
  const loadDownloadLogs = (orderNo: string, delay?: number) => {
    setDownloadLoading(true);
    setDownloadError('');
    window.setTimeout(function () {
      if (!downloadLogsByOrder[orderNo]) setDownloadError('未获取到下载明细数据，请点击查询重试');
      setDownloadLoading(false);
    }, delay === undefined ? 400 : delay);
  };

  const handleShowDownloadModal = (record: SubscriptionOrder) => {
    setCurrentRecord(record);
    setDownloadStatus('');
    setDownloadTimeRange('3m');
    setDownloadPage(1);
    setDownloadPageSize(10);
    setShowDownloadModal(true);
    loadDownloadLogs(record.orderNo);
  };

  const handleDownloadQuery = () => {
    setDownloadPage(1);
    if (currentRecord) loadDownloadLogs(currentRecord.orderNo);
  };

  const handleDownloadReset = () => {
    setDownloadStatus('');
    setDownloadTimeRange('3m');
    setDownloadPage(1);
    if (currentRecord) loadDownloadLogs(currentRecord.orderNo);
  };

  const handleViewDownloadFailReason = (log: DownloadLog) => {
    setDownloadFailLog(log);
    setShowDownloadFailModal(true);
  };

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
                  <th className="col-amount">订单总额（元）</th>
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
                  <td className="col-amount">{formatAmount(record.amount)}</td>
                  <td className="col-update-time">{record.updateTime}</td>
                  <td className="col-action">
                    <div className="action-buttons">
                      {record.productType === 'API产品' && (
                        <button className="action-btn" onClick={() => handleShowCallModal(record)}>调用明细</button>
                      )}
                      {/*
                      {record.productType === '数据集' && (
                        <button className="action-btn" onClick={() => handleShowDownloadModal(record)}>下载明细</button>
                      )}
                        */}
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
            <div className="info-value" title={currentRecord?.productName}>{currentRecord?.productName}</div>
            <div className="info-label">调用总次数</div>
            <div className="info-value">{statsLoading ? '统计中…' : callStats?.total}</div>
            <div className="info-label">调用成功次数</div>
            <div className="info-value">{statsLoading ? '统计中…' : callStats?.success}</div>
            <div className="info-label">调用失败次数</div>
            <div className="info-value">{statsLoading ? '统计中…' : callStats?.failed}</div>
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

  const renderDownloadModal = () => (
    <div className="modal-overlay" onClick={() => setShowDownloadModal(false)}>
      <div className="modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>下载明细</h3>
          <button className="modal-close" onClick={() => setShowDownloadModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="view-info-grid call-stats-grid">
            <div className="info-label">表名</div>
            <div className="info-value" title={currentRecord ? (DATASET_TABLE_NAMES[currentRecord.productId] || 'dataset_default_2026') : ''}>
              {currentRecord ? (DATASET_TABLE_NAMES[currentRecord.productId] || 'dataset_default_2026') : ''}
            </div>
            <div className="info-label">下载总次数</div>
            <div className="info-value">{downloadStats?.total}</div>
            <div className="info-label">下载成功次数</div>
            <div className="info-value">{downloadStats?.success}</div>
            <div className="info-label">下载失败次数</div>
            <div className="info-value">{downloadStats?.failed}</div>
          </div>
          <div className="filter-section call-filter-section">
            <div className="filter-row">
              <div className="filter-item filter-item-select">
                <label>下载状态</label>
                <select value={downloadStatus} onChange={(e) => setDownloadStatus(e.target.value)}>
                  <option value="">请选择</option>
                  {CALL_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="filter-item filter-item-select">
                <label>下载时间</label>
                <select value={downloadTimeRange} onChange={(e) => setDownloadTimeRange(e.target.value)}>
                  {TIME_RANGE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="filter-actions">
              <div className="filter-actions-left">
                <button className="btn btn-primary btn-sm" onClick={handleDownloadQuery}>查询</button>
                <button className="btn btn-default btn-sm" onClick={handleDownloadReset}>重置</button>
              </div>
            </div>
          </div>
          <div className="detail-table-section">
            <div className="table-wrapper">
              <table className="data-table call-log-table">
                <thead>
                  <tr>
                    <th className="col-index">序号</th>
                    <th>下载状态</th>
                    <th>下载耗时(ms)</th>
                    <th>下载时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {downloadLoading ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        <div className="empty-state-icon">⏳</div>
                        加载中…
                      </td>
                    </tr>
                  ) : downloadError ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        <div className="empty-state-icon">⚠️</div>
                        {downloadError}
                      </td>
                    </tr>
                  ) : paginatedDownloadLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        暂无下载记录
                      </td>
                    </tr>
                  ) : (
                    paginatedDownloadLogs.map((log, index) => (
                      <tr key={log.id}>
                        <td className="col-index">{(safeDownloadPage - 1) * downloadPageSize + index + 1}</td>
                        <td className={log.status === '失败' ? 'call-status-fail' : ''}>{log.status}</td>
                        <td>{log.duration}</td>
                        <td>{log.downloadTime}</td>
                        <td>
                          {log.status === '失败' && (
                            <button className="action-btn" onClick={() => handleViewDownloadFailReason(log)}>查看失败原因</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">共 {downloadLogs.length} 条记录</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled={safeDownloadPage <= 1} onClick={() => setDownloadPage(Math.max(1, safeDownloadPage - 1))}>上一页</button>
                {Array.from({ length: downloadTotalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === downloadTotalPages || Math.abs(p - safeDownloadPage) <= 1)
                  .map((page, idx, arr) => (
                    <span key={page} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ color: '#999' }}>...</span>}
                      <button className={'page-number' + (page === safeDownloadPage ? ' active' : '')} onClick={() => setDownloadPage(page)}>{page}</button>
                    </span>
                  ))}
                <button className="page-btn" disabled={safeDownloadPage >= downloadTotalPages} onClick={() => setDownloadPage(Math.min(downloadTotalPages, safeDownloadPage + 1))}>下一页</button>
                <select className="page-size-select" value={downloadPageSize} onChange={(e) => { setDownloadPageSize(Number(e.target.value)); setDownloadPage(1); }}>
                  <option value={10}>10 条/页</option>
                  <option value={20}>20 条/页</option>
                  <option value={50}>50 条/页</option>
                </select>
                <span className="jump-to">跳至</span>
                <input className="page-input" type="number" min={1} max={downloadTotalPages} value={safeDownloadPage} onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= downloadTotalPages) setDownloadPage(v); }} />
                <span className="jump-to">页</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowDownloadModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  const renderDownloadFailModal = () => (
    <div className="modal-overlay" onClick={() => setShowDownloadFailModal(false)}>
      <div className="modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>失败原因</h3>
          <button className="modal-close" onClick={() => setShowDownloadFailModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="view-info-grid">
            <div className="info-label">订单编号</div>
            <div className="info-value-span">{downloadFailLog?.orderId}</div>
            <div className="info-label">表名</div>
            <div className="info-value-span">{downloadFailLog?.tableName}</div>
            <div className="info-label">下载时间</div>
            <div className="info-value">{downloadFailLog?.downloadTime}</div>
            <div className="info-label">下载耗时(ms)</div>
            <div className="info-value">{downloadFailLog?.duration}</div>
            <div className="info-label">下载状态</div>
            <div className="info-value"><span className="call-status-fail">{downloadFailLog?.status}</span></div>
            <div className="info-label">错误码</div>
            <div className="info-value"><span className="call-status-fail">{downloadFailLog?.errorCode}</span></div>
            <div className="info-label">错误信息</div>
            <div className="info-value-span">{downloadFailLog?.errorMessage}</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowDownloadFailModal(false)}>关闭</button>
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
            <div className="info-label">订单编号</div>
            <div className="info-value-span">{failLog?.orderId}</div>
            <div className="info-label">API接口名称</div>
            <div className="info-value-span">{failLog?.apiName}</div>
            <div className="info-label">调用时间</div>
            <div className="info-value">{failLog?.callTime}</div>
            <div className="info-label">响应时长(ms)</div>
            <div className="info-value">{failLog?.duration}</div>
            <div className="info-label">调用状态</div>
            <div className="info-value"><span className="call-status-fail">{failLog?.status}</span></div>
            <div className="info-label">错误码</div>
            <div className="info-value"><span className="call-status-fail">{failLog?.errorCode}</span></div>
            <div className="info-label">错误信息</div>
            <div className="info-value-span">{failLog?.errorMessage}</div>
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
      breadcrumb="订单交付监管"
      role={role}
      onRoleChange={setRole}
      roleOptions={['数据管理部门']}
      title="订单交付监管"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      {renderFilter()}
      {renderTable()}

      {showViewModal && renderViewModal()}
      {showCallModal && renderCallModal()}
      {showFailModal && renderFailModal()}
      {showDownloadModal && renderDownloadModal()}
      {showDownloadFailModal && renderDownloadFailModal()}
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

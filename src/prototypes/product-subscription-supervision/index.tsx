/**
 * @name 产品交易监管
 * @mode axure
 *
 * 产品交易监管列表（数据管理部门视角），归属「授权监管」菜单组
 */

import { useMemo, useState } from 'react';
import { Paperclip, Trash2 } from 'lucide-react';
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

/** 「查看详情」弹窗 - 基本信息页签字段（两类产品一致） */
interface ProductBasicInfo {
  productName: string;              // 产品名称
  productType: string;              // 产品类型
  coverageRange: string;            // 覆盖时间范围
  industryCategory: string;         // 行业分类
  regionCategory: string;           // 地域分类
  hasPersonalInfo: string;          // 是否涉及个人信息
  deliveryMode: string;             // 交付方式
  authUsage: string;                // 授权使用
  dataSubject: string;              // 数据主体
  dataScale: string;                // 数据规模
  updateFrequency: string;          // 更新频率
  personalOrEnterpriseAuth: string; // 个人或企业授权使用
  baseProductCode: string;          // 基础数据产品标识码
  productIntro: string;             // 产品简介
  usageLimit: string;               // 使用限制
  devApplication: string;           // 再开发申请书（附件文件名）
  devAgreement: string;             // 再开发协议（附件文件名）
  domainName: string;               // 领域名称
}

/** API 接口参数（请求参数含「参数位置 / 必填」，返回参数不含） */
interface ApiParam {
  name: string;       // 参数名
  location?: string;  // 参数位置（仅请求参数）
  required?: string;  // 必填（仅请求参数）
  type: string;       // 字段类型
  desc: string;       // 说明
}

/** 配置信息 - API 产品：API接口信息 */
interface ApiConfigInfo {
  kind: 'api';
  apiName: string;         // API名称
  serviceCode: string;     // 服务编码
  serviceType: string;     // 服务类型
  responseFormat: string;  // 返回格式
  requestMethod: string;   // 请求方式
  requestParams: ApiParam[];
  responseParams: ApiParam[];
}

/** 配置信息 - 数据集产品：字段信息 */
interface DatasetFieldItem {
  no: number;           // 序号
  fieldName: string;    // 字段名称
  fieldCnName: string;  // 字段中文名
  dataType: string;     // 数据类型
  primaryKey: string;   // 主键
  nullable: string;     // 允许为空
  description: string;  // 描述
}

interface DatasetConfigInfo {
  kind: 'dataset';
  fields: DatasetFieldItem[];
}

/** 「查看详情」弹窗数据：基本信息 + 按产品类型二选一的配置信息（kind 为判别字段，避免两套配置串用） */
interface ProductDetail {
  basic: ProductBasicInfo;
  config: ApiConfigInfo | DatasetConfigInfo;
}

/** API 请求参数（演示数据） */
const API_REQUEST_PARAMS: ApiParam[] = [
  { name: 'sfzhm', location: 'Body', required: '是', type: '字符型', desc: '身份证号码，已按脱敏规则处理' },
  { name: 'startdate', location: 'Body', required: '否', type: '字符型', desc: '数据统计起始日期，格式 yyyy-MM-dd' },
  { name: 'enddate', location: 'Body', required: '否', type: '字符型', desc: '数据统计截止日期，格式 yyyy-MM-dd' },
  { name: 'inscode', location: 'Body', required: '是', type: '字符型', desc: '医疗机构统一编码' },
  { name: 'jzix', location: 'Body', required: '否', type: '字符型', desc: '就诊类型编码' }
];

/** API 返回参数（演示数据） */
const API_RESPONSE_PARAMS: ApiParam[] = [
  { name: 'uuid', type: '字符型', desc: '本次调用唯一标识' },
  { name: 'inscode', type: '字符型', desc: '医疗机构统一编码' },
  { name: 'yibao_res', type: '对象型', desc: '医保结算结果对象' },
  { name: 'inscode_err', type: '字符型', desc: '机构编码校验失败原因' },
  { name: 'beetch_res', type: '对象型', desc: '批量查询结果对象' }
];

/** 数据集字段信息（演示数据） */
const DATASET_FIELDS: DatasetFieldItem[] = [
  { no: 1, fieldName: '个人证件号码（脱敏）', fieldCnName: '个人证件号码（脱敏）', dataType: '字符型', primaryKey: '是', nullable: '否', description: '个人证件号码，已按脱敏规则处理' },
  { no: 2, fieldName: '总病例数', fieldCnName: '总病例数', dataType: '数值型', primaryKey: '否', nullable: '是', description: '统计周期内累计病例总数' },
  { no: 3, fieldName: '累计病种数', fieldCnName: '累计病种数', dataType: '数值型', primaryKey: '否', nullable: '是', description: '累计覆盖的病种数量' },
  { no: 4, fieldName: '年龄段', fieldCnName: '年龄段', dataType: '数值型', primaryKey: '否', nullable: '是', description: '参保人员年龄段区间编码' },
  { no: 5, fieldName: '累计医疗费总额等级', fieldCnName: '累计医疗费总额等级', dataType: '字符型', primaryKey: '否', nullable: '是', description: '累计医疗费用总额分级编码' }
];

/** 行业分类：按领域名称映射（演示数据） */
const INDUSTRY_BY_DOMAIN: Record<string, string> = {
  医疗健康: '卫生和社会工作',
  医疗保障: '卫生和社会工作',
  城市治理: '公共管理、社会保障和社会组织',
  金融服务: '金融业',
  工业制造: '制造业',
  教育: '教育',
  智慧农业: '农、林、牧、渔业',
  应急管理: '水利、环境和公共设施管理业'
};

/** 地域分类：将列表「所属地域」规范为「省 / 市 / 区县」路径（演示数据） */
const REGION_PATH: Record<string, string> = {
  省本级: '湖南省',
  芙蓉区: '湖南省/长沙市/芙蓉区',
  长沙市: '湖南省/长沙市',
  株洲市: '湖南省/株洲市',
  湘潭市: '湖南省/湘潭市',
  衡阳市: '湖南省/衡阳市',
  岳阳市: '湖南省/岳阳市'
};

/** 基础数据产品标识码后缀（演示数据，按产品 id 轮换） */
const CODE_SUFFIX = ['KVKPMY', 'W2NQ4T', 'X9JSDL', 'P3MB7E', 'R6YT2K', 'L4NH8Q', 'D7WF5A', 'Z2CG9U'];
const UPDATE_FREQUENCY_LIST = ['2次/天', '4次/天', '6次/天', '12次/天', '实时'];

/** 依据列表记录派生详情数据（演示数据，稳定可复现） */
function buildProductDetail(record: ProductSubscription): ProductDetail {
  const isApi = record.productType === API_PRODUCT_TYPE;
  const isEnterprise = record.domain === '工业制造' || record.domain === '金融服务';
  const month = String(1 + (record.id % 6)).padStart(2, '0');
  const day = String(2 + ((record.id * 5) % 27)).padStart(2, '0');
  const endMonth = String(7 + (record.id % 6)).padStart(2, '0');
  const endDay = String(1 + ((record.id * 3) % 27)).padStart(2, '0');

  return {
    basic: {
      productName: record.productName,
      productType: record.productType,
      coverageRange: '2026-' + month + '-' + day + ' 至 2026-' + endMonth + '-' + endDay,
      industryCategory: INDUSTRY_BY_DOMAIN[record.domain] || '',
      regionCategory: REGION_PATH[record.region] || record.region,
      hasPersonalInfo: isEnterprise ? '否' : '是',
      deliveryMode: isApi ? '接口调用' : '数据流传输',
      authUsage: record.subscribeCount > 3 ? '是' : '否',
      dataSubject: isEnterprise ? '企业信息' : '个人信息',
      dataScale: isApi ? (record.id + 1) + ' GB' : (record.id + 3) + ' MB',
      updateFrequency: UPDATE_FREQUENCY_LIST[record.id % UPDATE_FREQUENCY_LIST.length],
      personalOrEnterpriseAuth: isEnterprise ? '是' : '否',
      baseProductCode: '691652928710818579H4301268' + CODE_SUFFIX[record.id % CODE_SUFFIX.length],
      productIntro: record.productDesc,
      usageLimit: '仅限在授权范围内使用，不得转授第三方或用于未约定用途。',
      devApplication: '再开发申请书.pdf',
      devAgreement: '再开发协议.pdf',
      domainName: record.domain
    },
    config: isApi
      ? {
        kind: 'api',
        apiName: record.productName + '接口',
        serviceCode: '58b47a10fb32478aa599fd79e15240b3c497e5e105474067209761298523164672:' + (1788944941791 - record.id * 317),
        serviceType: 'Restful',
        responseFormat: 'json',
        requestMethod: 'POST',
        requestParams: API_REQUEST_PARAMS,
        responseParams: API_RESPONSE_PARAMS
      }
      : { kind: 'dataset', fields: DATASET_FIELDS }
  };
}

/** 模拟详情接口拉取；原型阶段基于本地数据派生，保留 Promise 形态便于切换为真实接口 */
function fetchProductDetail(record: ProductSubscription | null): Promise<ProductDetail | null> {
  return new Promise(function (resolve) {
    if (!record) {
      resolve(null);
      return;
    }
    setTimeout(function () {
      resolve(buildProductDetail(record));
    }, 220);
  });
}

/** 详情字段占位：空值、缺失值、数值 0 统一显示为「—」，避免空白单元格 */
const displayValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0 ? String(value) : '—';
  const text = String(value).trim();
  return text && text !== '0' ? text : '—';
};

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

  // 查看详情弹窗：页签 / 详情数据（基本信息 + 配置信息）/ 加载与失败态
  const [viewTab, setViewTab] = useState<'basic' | 'config'>('basic');
  const [viewDetail, setViewDetail] = useState<ProductDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

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
    setViewTab('basic');
    setViewDetail(null);
    setViewLoading(true);
    setShowViewModal(true);

    fetchProductDetail(record)
      .then(function (data) {
        setViewDetail(data);
      })
      .catch(function () {
        setViewDetail(null);
      })
      .finally(function () {
        setViewLoading(false);
      });
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

  /**
   * 当前明细所属产品是否为 API 类型。
   * 仅 API 产品的订单提供「调用明细」，因此它同时决定订单明细表格「操作」列是否整列渲染：
   * API 产品 → 渲染「操作」列及【调用明细】；数据集产品 → 不渲染该列（表头与单元格一并去掉）。
   */
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

  const renderViewModal = () => {
    const basic = viewDetail ? viewDetail.basic : null;
    const config = viewDetail ? viewDetail.config : null;

    /** 值单元格：加载中显示骨架，否则统一走「—」占位 */
    const renderValue = (value: unknown) => (
      viewLoading ? <span className="detail-value-skeleton" /> : displayValue(value)
    );

    const renderTypeValue = () => {
      if (viewLoading) return <span className="detail-value-skeleton" />;
      const type = displayValue(basic ? basic.productType : '');
      return type === '—' ? '—' : <span className="type-tag">{type}</span>;
    };

    /** 基础数据产品标识码：蓝色 chip 展示 */
    const renderCodeValue = () => {
      if (viewLoading) return <span className="detail-value-skeleton" />;
      const code = displayValue(basic ? basic.baseProductCode : '');
      return code === '—' ? '—' : <span className="detail-code-chip">{code}</span>;
    };

    /** 再开发材料附件：附件 chip + 删除图标（只读监管视角，纯展示） */
    const renderMaterial = (fileName: string) => {
      if (viewLoading) return <span className="detail-value-skeleton" />;
      const name = displayValue(fileName);
      if (name === '—') return '—';
      return (
        <span className="detail-file">
          <span className="detail-file-chip" title={name}>
            <Paperclip size={12} aria-hidden="true" />
            <span className="detail-file-name">{name}</span>
          </span>
          <span className="detail-file-remove" title="删除附件" role="img" aria-label="删除附件">
            <Trash2 size={13} aria-hidden="true" />
          </span>
        </span>
      );
    };

    /** 配置信息 - API产品：API接口信息（含请求参数 / 返回参数明细表） */
    const renderApiConfig = (apiConfig: ApiConfigInfo) => (
      <section className="detail-section" aria-labelledby="product-api-config-title">
        <h4 id="product-api-config-title">API接口信息</h4>
        <table className="detail-readonly-table">
          <tbody>
            <tr>
              <th>API名称</th>
              <td colSpan={3}>{displayValue(apiConfig.apiName)}</td>
            </tr>
            <tr>
              <th>服务编码</th>
              <td>{displayValue(apiConfig.serviceCode)}</td>
              <th>服务类型</th>
              <td>{displayValue(apiConfig.serviceType)}</td>
            </tr>
            <tr>
              <th>返回格式</th>
              <td>{displayValue(apiConfig.responseFormat)}</td>
              <th>请求方式</th>
              <td>{displayValue(apiConfig.requestMethod)}</td>
            </tr>
            <tr>
              <th>请求参数</th>
              <td colSpan={3}>
                <table className="detail-param-table detail-param-table-request">
                  <thead>
                    <tr>
                      <th>参数名</th>
                      <th>参数位置</th>
                      <th>必填</th>
                      <th>字段类型</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiConfig.requestParams.length === 0 ? (
                      <tr><td colSpan={5} className="detail-empty">暂无请求参数</td></tr>
                    ) : (
                      apiConfig.requestParams.map((param, index) => (
                        <tr key={param.name + index}>
                          <td>{displayValue(param.name)}</td>
                          <td>{displayValue(param.location)}</td>
                          <td>{displayValue(param.required)}</td>
                          <td>{displayValue(param.type)}</td>
                          <td>{displayValue(param.desc)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <th>返回参数</th>
              <td colSpan={3}>
                <table className="detail-param-table detail-param-table-response">
                  <thead>
                    <tr>
                      <th>参数名</th>
                      <th>字段类型</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiConfig.responseParams.length === 0 ? (
                      <tr><td colSpan={3} className="detail-empty">暂无返回参数</td></tr>
                    ) : (
                      apiConfig.responseParams.map((param, index) => (
                        <tr key={param.name + index}>
                          <td>{displayValue(param.name)}</td>
                          <td>{displayValue(param.type)}</td>
                          <td>{displayValue(param.desc)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    );

    /** 配置信息 - 数据集产品：字段信息 */
    const renderDatasetConfig = (datasetConfig: DatasetConfigInfo) => (
      <section className="detail-section" aria-labelledby="product-dataset-config-title">
        <h4 id="product-dataset-config-title">字段信息</h4>
        <div className="detail-info-table-wrap">
          <table className="detail-info-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>字段名称</th>
                <th>字段中文名</th>
                <th>数据类型</th>
                <th>主键</th>
                <th>允许为空</th>
                <th>描述</th>
              </tr>
            </thead>
            <tbody>
              {datasetConfig.fields.length === 0 ? (
                <tr><td colSpan={7} className="detail-empty">暂无字段数据</td></tr>
              ) : (
                datasetConfig.fields.map(field => (
                  <tr key={field.no}>
                    <td>{displayValue(field.no)}</td>
                    <td>{displayValue(field.fieldName)}</td>
                    <td>{displayValue(field.fieldCnName)}</td>
                    <td>{displayValue(field.dataType)}</td>
                    <td>{displayValue(field.primaryKey)}</td>
                    <td>{displayValue(field.nullable)}</td>
                    <td>{displayValue(field.description)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    );

    return (
      <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
        <div className="modal-large product-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>产品详情</h3>
            <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
          </div>
          <div className="detail-tabs" role="tablist" aria-label="产品详情页签">
            <button type="button" role="tab" aria-selected={viewTab === 'basic'} className={viewTab === 'basic' ? 'active' : ''} onClick={() => setViewTab('basic')}>基本信息</button>
            <button type="button" role="tab" aria-selected={viewTab === 'config'} className={viewTab === 'config' ? 'active' : ''} onClick={() => setViewTab('config')}>配置信息</button>
          </div>
          <div className="modal-body product-detail-body">
            {viewTab === 'basic' ? (
              <section className="detail-section" aria-labelledby="product-basic-title">
                <h4 id="product-basic-title">基本信息</h4>
                <table className="detail-readonly-table">
                  <tbody>
                    <tr>
                      <th>产品名称</th>
                      <td>{renderValue(basic ? basic.productName : '')}</td>
                      <th>产品类型</th>
                      <td>{renderTypeValue()}</td>
                    </tr>
                    <tr>
                      <th>覆盖时间范围</th>
                      <td>{renderValue(basic ? basic.coverageRange : '')}</td>
                      <th>行业分类</th>
                      <td>{renderValue(basic ? basic.industryCategory : '')}</td>
                    </tr>
                    <tr>
                      <th>地域分类</th>
                      <td>{renderValue(basic ? basic.regionCategory : '')}</td>
                      <th>是否涉及个人信息</th>
                      <td>{renderValue(basic ? basic.hasPersonalInfo : '')}</td>
                    </tr>
                    <tr>
                      <th>交付方式</th>
                      <td>{renderValue(basic ? basic.deliveryMode : '')}</td>
                      <th>授权使用</th>
                      <td>{renderValue(basic ? basic.authUsage : '')}</td>
                    </tr>
                    <tr>
                      <th>数据主体</th>
                      <td>{renderValue(basic ? basic.dataSubject : '')}</td>
                      <th>数据规模</th>
                      <td>{renderValue(basic ? basic.dataScale : '')}</td>
                    </tr>
                    <tr>
                      <th>更新频率</th>
                      <td>{renderValue(basic ? basic.updateFrequency : '')}</td>
                      <th>个人或企业授权使用</th>
                      <td>{renderValue(basic ? basic.personalOrEnterpriseAuth : '')}</td>
                    </tr>
                    <tr>
                      <th>基础数据产品标识码</th>
                      <td colSpan={3}>{renderCodeValue()}</td>
                    </tr>
                    <tr>
                      <th>产品简介</th>
                      <td colSpan={3}>{renderValue(basic ? basic.productIntro : '')}</td>
                    </tr>
                    <tr>
                      <th>使用限制</th>
                      <td colSpan={3}>{renderValue(basic ? basic.usageLimit : '')}</td>
                    </tr>
                    <tr>
                      <th>再开发申请书</th>
                      <td>{renderMaterial(basic ? basic.devApplication : '')}</td>
                      <th>再开发协议</th>
                      <td>{renderMaterial(basic ? basic.devAgreement : '')}</td>
                    </tr>
                    <tr>
                      <th>领域名称</th>
                      <td colSpan={3}>{renderValue(basic ? basic.domainName : '')}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            ) : viewLoading ? (
              <div className="empty-state">
                <div className="empty-state-icon">⏳</div>
                加载中…
              </div>
            ) : config && config.kind === 'api' ? (
              renderApiConfig(config)
            ) : config ? (
              renderDatasetConfig(config)
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                暂无配置信息
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-default" onClick={() => setShowViewModal(false)}>关闭</button>
          </div>
        </div>
      </div>
    );
  };

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
                    {isApiProduct && <th className="col-action">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={isApiProduct ? 7 : 6} className="empty-state">
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
                        {isApiProduct && (
                          <td className="col-action">
                            <div className="action-buttons">
                              <button className="action-btn" onClick={() => handleShowCallModal(order)}>调用明细</button>
                            </div>
                          </td>
                        )}
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

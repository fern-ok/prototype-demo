/**
 * @name 产品生命周期 - 共享数据与血缘逻辑
 * @mode axure
 *
 * 被「产品生命周期」列表页与「数据血缘」独立页面共同复用，
 * 避免两份原型重复维护演示数据与图谱绘制逻辑。
 */

import { useEffect, useRef, useState } from 'react';

export interface LifecycleRecord {
  id: number;
  productCode: string;
  productName: string;
  productType: string;
  productStage: string;
  provider: string;
  currentStage: string;
  stageStatus: string;
  updateTime: string;
  region: string;
  domain: string;
  productDesc: string;
}

export interface TimelineItem {
  stage: string;
  status: string;
  operator: string;
  operatorOrg: string;
  time: string;
  remark: string;
  current: boolean;
  /** 发起信息：单位名称 */
  org: string;
  /** 发起信息：法人经办人姓名 */
  handler: string;
  /** 审批信息：单位名称 */
  auditOrg: string;
  /** 审批信息：法人经办人姓名 */
  auditHandler: string;
  /** 审批信息：操作时间 */
  auditTime: string;
  /** 审批信息：审核结果（审核通过 / 审核不通过 / —） */
  auditResult: string;
  /** 审批信息：审核意见 */
  auditOpinion: string;
}

/** 数据资源节点的详细信息，在血缘抽屉「基本信息」中展示 */
export interface DataResourceDetail {
  resourceName: string;
  resourceCode: string;
  industry: string;
  involvesPersonal: string;
  format: string;
  source: string;
  updateFreq: string;
  coverage: string;
  region: string;
  holder: string;
  summary: string;
}

/** 数据产品节点（基础产品 / 再开发产品）的详细信息，在血缘抽屉「基本信息」中展示 */
export interface DataProductDetail {
  productName: string;
  productCode: string;
  productType: string;
  coverage: string;
  industry: string;
  region: string;
  involvesPersonal: string;
  deliveryMethod: string;
  authorizedUse: string;
  dataSubject: string;
  dataScale: string;
  updateFreq: string;
  personalOrEnterpriseAuth: string;
  productDesc: string;
  usageLimit: string;
  providerName: string;
}

export interface LineageNode {
  name: string;
  type: string;
  /** 数据资源节点的详细信息（点击节点后在抽屉「基本信息」中展示） */
  detail?: DataResourceDetail;
  /** 数据产品节点（基础产品 / 再开发产品）的详细信息 */
  productDetail?: DataProductDetail;
}

export interface LineageLayer {
  title: string;
  nodes: LineageNode[];
}

export interface LineageEdge {
  from: string;
  fromType: string;
  to: string;
  toType: string;
}

const REGIONS = ['省本级', '长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '常德市', '郴州市'];

export const REGION_CODES: Record<string, string> = {
  省本级: '430000',
  长沙市: '430100',
  株洲市: '430200',
  湘潭市: '430300',
  衡阳市: '430400',
  岳阳市: '430600',
  常德市: '430700',
  郴州市: '431000'
};

const DOMAINS = ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源', '城市治理', '金融服务', '工业制造', '智慧农业', '应急管理'];

const PROVIDERS = [
  '湖南天河国云科技有限公司',
  '湖南数据产业集团有限公司',
  '长沙数字科技有限公司',
  '株洲国投数据服务有限公司',
  '湘潭大数据运营有限公司',
  '衡阳智慧城市科技有限公司',
  '常德市数据运营有限公司',
  '岳阳数字经济发展有限公司'
];

export const PRODUCT_TYPE_OPTIONS = ['API产品', '数据集'];
export const PRODUCT_STAGE_OPTIONS = ['基础产品', '再开发产品'];
export const STAGE_OPTIONS = ['安全审查', '产品登记', '产品上架', '产品下架', '产品交付'];
export const STAGE_STATUS_OPTIONS = ['待处理', '处理中', '已完成', '已驳回', '已终止', '已暂停'];

/** 阶段流转顺序（时间轴与血缘均按此顺序推导） */
const STAGE_FLOW = ['安全审查', '产品登记', '产品上架', '产品交付', '产品下架'];

/** 各阶段允许出现的阶段状态 */
const STAGE_STATUS_MAP: Record<string, string[]> = {
  安全审查: ['待处理', '处理中', '已完成', '已驳回'],
  产品登记: ['待处理', '处理中', '已完成', '已驳回'],
  产品上架: ['待处理', '处理中', '已完成', '已驳回'],
  产品下架: ['待处理', '已完成', '已终止', '已暂停'],
  产品交付: ['处理中', '已完成', '已终止', '已暂停']
};

const STAGE_OPERATOR_ORG: Record<string, string> = {
  安全审查: '数据管理部门',
  产品登记: '运营机构',
  产品上架: '运营机构',
  产品交付: '运营机构',
  产品下架: '运营机构'
};

const OPERATORS = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵磊'];

const NAME_SUFFIX: Record<string, string[]> = {
  API产品: ['数据服务API', '核验API', '查询API', '分析API'],
  数据集: ['数据集', '主题数据集', '画像数据集', '统计数据集']
};

const STAGE_ACTION: Record<string, string> = {
  安全审查: '安全审查',
  产品登记: '产品登记',
  产品上架: '产品上架申请',
  产品交付: '产品交付',
  产品下架: '产品下架申请'
};

const STATUS_REMARK: Record<string, string> = {
  待处理: '已提交，等待受理',
  处理中: '正在处理中，请耐心等待',
  已完成: '已通过，流程流转至下一阶段',
  已驳回: '材料不符合要求已被驳回，请修改后重新提交',
  已终止: '因业务调整已终止，流程不再流转',
  已暂停: '因数据更新维护已暂停，待恢复后继续流转'
};

const pad = (n: number, len: number = 2) => String(n).padStart(len, '0');

/** 地域在名称中的可读前缀：省本级统一展示为「湖南省」 */
export const regionLabel = (region: string) => (region === '省本级' ? '湖南省' : region);

/** 依据地域 / 领域 / 类型稳定生成产品生命周期演示数据（共 48 条） */
export const seedRecords: LifecycleRecord[] = (function build() {
  const list: LifecycleRecord[] = [];
  for (let i = 0; i < 48; i++) {
    const region = REGIONS[i % REGIONS.length];
    const domain = DOMAINS[(i * 3 + 1) % DOMAINS.length];
    const provider = PROVIDERS[(i * 5 + 2) % PROVIDERS.length];
    const productType = PRODUCT_TYPE_OPTIONS[(i + 1) % 2];
    const productStage = i % 3 === 0 ? '再开发产品' : '基础产品';
    const currentStage = STAGE_OPTIONS[(i * 2 + 1) % STAGE_OPTIONS.length];
    const statusPool = STAGE_STATUS_MAP[currentStage];
    const stageStatus = statusPool[(i * 3 + STAGE_OPTIONS.indexOf(currentStage)) % statusPool.length];

    const suffixPool = NAME_SUFFIX[productType];
    const suffix = suffixPool[(i * 3) % suffixPool.length];
    const productName = regionLabel(region) + domain + suffix;

    const absMonth = 2026 * 12 + 8 - (i % 9);
    const year = Math.floor(absMonth / 12);
    const month = (absMonth % 12) + 1;
    const day = ((i * 7) % 27) + 1;
    const updateTime = year + '-' + pad(month) + '-' + pad(day) + ' ' + pad(8 + ((i * 3) % 12)) + ':' + pad((i * 13) % 60) + ':' + pad((i * 29) % 60);

    list.push({
      id: i + 1,
      productCode: 'DP' + REGION_CODES[region] + '2026' + pad(i + 1, 4),
      productName: productName,
      productType: productType,
      productStage: productStage,
      provider: provider,
      currentStage: currentStage,
      stageStatus: stageStatus,
      updateTime: updateTime,
      region: region,
      domain: domain,
      productDesc:
        productName +
        '由' + provider + '开发运营，' +
        (productType === 'API产品' ? '以标准化接口方式对外提供服务' : '以批量数据集方式对外提供数据') +
        '，用于支撑' + domain + '领域的数据分析与业务协同。'
    });
  }
  return list;
})();

/** 依据当前阶段回溯生成生命周期时间轴（稳定可复现） */
export const buildTimeline = (record: LifecycleRecord): TimelineItem[] => {
  const flowIndex = STAGE_FLOW.indexOf(record.currentStage);
  const baseMonth = Number(record.updateTime.slice(5, 7));
  const absBase = 2026 * 12 + (baseMonth - 1);
  const items: TimelineItem[] = [];
  for (let i = 0; i <= flowIndex; i++) {
    const stage = STAGE_FLOW[i];
    const isCurrent = i === flowIndex;
    const status = isCurrent ? record.stageStatus : '已完成';
    const abs = absBase - (flowIndex - i);
    const year = Math.floor(abs / 12);
    const month = (abs % 12) + 1;
    const time = isCurrent
      ? record.updateTime
      : year + '-' + pad(month) + '-' + pad(((record.id * 7 + i * 5) % 27) + 1) + ' ' + pad(9 + ((record.id + i) % 9)) + ':' + pad((record.id * 11 + i * 7) % 60) + ':00';
    items.push({
      stage: stage,
      status: status,
      operator: OPERATORS[(record.id + i * 3) % OPERATORS.length],
      operatorOrg: STAGE_OPERATOR_ORG[stage],
      time: time,
      remark: (STAGE_ACTION[stage] || stage) + (STATUS_REMARK[status] || ''),
      current: isCurrent,
      org: record.provider,
      handler: OPERATORS[(record.id * 3 + i * 2 + 1) % OPERATORS.length],
      auditOrg: '湖南省公共数据运营中心',
      auditHandler: OPERATORS[(record.id * 7 + i * 3 + 2) % OPERATORS.length],
      auditTime: status === '已完成' || status === '已驳回' ? time : '—',
      auditResult: status === '已完成' ? '审核通过' : status === '已驳回' ? '审核不通过' : '—',
      auditOpinion:
        status === '已完成'
          ? '通过'
          : status === '已驳回'
            ? '首次' + (STAGE_ACTION[stage] || stage) + '不通过，材料修改后重新提交'
            : '—'
    });
  }
  return items;
};

/**
 * 依据产品记录生成辐射式血缘数据，按产品阶段区分两套样例：
 *  - 基础产品：左列数据资源 -> 中间基础产品（当前产品） -> 右列再开发产品（一对多发散）
 *  - 再开发产品：左列数据资源 -> 中列基础产品（多个） -> 右列再开发产品（当前产品，多对一汇聚）
 * 两层结构均复用 LineageLayer / LineageEdge 字段，保证字段结构一致、数据完整。
 */
export const buildLineage = (record: LifecycleRecord): { layers: LineageLayer[]; edges: LineageEdge[] } => {
  const label = regionLabel(record.region);
  const domain = record.domain;
  const isRedev = record.productStage === '再开发产品';

  const dataResources: LineageNode[] = [];
  for (let i = 0; i < (isRedev ? 5 : 4); i++) {
    const name = label + domain + '数据资源' + (i + 1);
    dataResources.push({ name: name, type: '数据资源', detail: buildResourceDetail(record, name) });
  }

  const edges: LineageEdge[] = [];
  let middleNodes: LineageNode[];
  let rightNodes: LineageNode[];
  let middleTitle: string;
  let rightTitle: string;

  if (!isRedev) {
    // 场景 1：基础产品进入 —— 左侧数据资源，右侧再开发产品
    const basic: LineageNode = { name: record.productName, type: '基础产品', productDetail: buildProductDetail(record, record.productName, 0) };
    const redevList: LineageNode[] = [];
    for (let i = 0; i < 5; i++) {
      const name = label + domain + '再开发产品' + (i + 1);
      redevList.push({ name: name, type: '再开发产品', productDetail: buildProductDetail(record, name, i + 1) });
    }
    middleNodes = [basic];
    rightNodes = redevList;
    middleTitle = '基础产品';
    rightTitle = '再开发产品';

    dataResources.forEach(function (u) {
      edges.push({ from: u.name, fromType: u.type, to: basic.name, toType: basic.type });
    });
    redevList.forEach(function (d) {
      edges.push({ from: basic.name, fromType: basic.type, to: d.name, toType: d.type });
    });
  } else {
    // 场景 2：再开发产品进入 —— 左列数据资源，中列基础产品（多个），右列再开发产品（当前产品）
    const basicList: LineageNode[] = [];
    for (let i = 0; i < 3; i++) {
      const name = label + domain + '基础产品' + (i + 1);
      basicList.push({ name: name, type: '基础产品', productDetail: buildProductDetail(record, name, i + 1) });
    }
    const redev: LineageNode = { name: record.productName, type: '再开发产品', productDetail: buildProductDetail(record, record.productName, 0) };
    middleNodes = basicList;
    rightNodes = [redev];
    middleTitle = '基础产品';
    rightTitle = '再开发产品';

    // 数据资源 -> 基础产品：按序分配，体现数据资源被基础产品复用
    dataResources.forEach(function (u, i) {
      const target = basicList[i % basicList.length];
      edges.push({ from: u.name, fromType: u.type, to: target.name, toType: target.type });
    });
    // 基础产品 -> 再开发产品：一对多汇聚，多个基础产品共同组成当前再开发产品
    basicList.forEach(function (b) {
      edges.push({ from: b.name, fromType: b.type, to: redev.name, toType: redev.type });
    });
  }

  const layers: LineageLayer[] = [
    { title: '数据资源', nodes: dataResources },
    { title: middleTitle, nodes: middleNodes },
    { title: rightTitle, nodes: rightNodes }
  ];

  return { layers: layers, edges: edges };
};

/** 各领域对应的资源持有方（演示用，与数据资源目录样例保持一致） */
const DOMAIN_HOLDER: Record<string, string> = {
  医疗健康: '湖南省卫生健康委信息统计中心',
  交通运输: '湖南省交通运输厅',
  教育: '湖南省教育厅',
  文化旅游: '湖南省文化和旅游厅',
  自然资源: '湖南省自然资源厅',
  城市治理: '湖南省住房和城乡建设厅',
  金融服务: '湖南省地方金融监督管理局',
  工业制造: '湖南省工业和信息化厅',
  智慧农业: '湖南省农业农村厅',
  应急管理: '湖南省应急管理厅'
};

/** 由名称稳定生成 8 位标识码后缀（剔除易混淆字符） */
const hashSuffix = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += chars[h % chars.length];
    h = (h * 31 + 7) >>> 0;
  }
  return out;
};

/** 数据资源节点的详细信息，由所属数据产品的地域 / 领域推导生成（演示用） */
export const buildResourceDetail = (record: LifecycleRecord, name: string): DataResourceDetail => {
  const label = regionLabel(record.region);
  const holder = DOMAIN_HOLDER[record.domain] || label + '数据运营中心';
  const regionCode = REGION_CODES[record.region] || '430000';
  const resourceCode = '712430000MB0L046927' + regionCode.slice(0, 4) + hashSuffix(name);
  const month = Number(record.updateTime.slice(5, 7));
  const coverage = record.updateTime.slice(0, 4) + '-' + pad(month) + '-01 ~ 至今';
  return {
    resourceName: name,
    resourceCode: resourceCode,
    industry: record.domain,
    involvesPersonal: '是',
    format: 'OFD',
    source: '原始取得',
    updateFreq: '2次/天',
    coverage: coverage,
    region: label,
    holder: holder,
    summary: name + '，由' + holder + '持有，覆盖' + label + '区域内' + record.domain + '相关数据，用于支撑业务分析与协同。'
  };
};

/** 数据产品节点（基础产品 / 再开发产品）的详细信息，由所属数据产品的地域 / 领域推导生成（演示用） */
export const buildProductDetail = (record: LifecycleRecord, name: string, index: number): DataProductDetail => {
  const label = regionLabel(record.region);
  const regionCode = REGION_CODES[record.region] || '430000';
  const productCode = '712430000MB0L046927' + regionCode.slice(0, 4) + hashSuffix(name);
  const startM = 9;
  const startD = ((index * 3 + 1) % 27) + 1;
  const endM = 10;
  const endD = ((index * 5 + 2) % 27) + 1;
  const scalePool = ['1 MB', '10 MB', '100 MB', '500 MB', '1 GB'];
  const dataScale = scalePool[index % scalePool.length];
  const updateFreq = (index % 12 + 1) + '次/天';
  return {
    productName: name,
    productCode: productCode,
    productType: record.productType,
    coverage: '2026-' + pad(startM) + '-' + pad(startD) + ' 至 ' + '2026-' + pad(endM) + '-' + pad(endD),
    industry: record.domain,
    region: label,
    involvesPersonal: '否',
    deliveryMethod: '文件传输',
    authorizedUse: '否',
    dataSubject: '个人信息',
    dataScale: dataScale,
    updateFreq: updateFreq,
    personalOrEnterpriseAuth: '否',
    productDesc: record.productDesc,
    usageLimit: '仅限授权范围内使用，不得向第三方转售或泄露，超出范围需重新申请授权。',
    providerName: record.provider
  };
};

/** 依据数据产品标识码定位记录（供独立数据血缘页按参数加载） */
export const getRecordByCode = (code: string): LifecycleRecord | undefined => {
  if (!code) return undefined;
  const target = code.trim();
  return seedRecords.find(function (r) { return r.productCode === target; });
};

/* ---------------- 节点详情列表（授权信息 / 交易信息） ---------------- */

export interface AuthRecord {
  /** 全局序号（按授权时间倒序后 1 起） */
  seq: number;
  /** 运营机构 */
  org: string;
  /** 授权时间，格式 yyyy-MM-dd */
  authTime: string;
}

export interface TradeRecord {
  /** 全局序号（按创建时间倒序后 1 起） */
  seq: number;
  /** 数据需求方 */
  demander: string;
  /** 创建时间，格式 yyyy-MM-dd */
  createdAt: string;
}

const AUTH_ORGS = [
  '湖南省数据局',
  '长沙市数据资源管理局',
  '株洲市政务服务中心',
  '湖南省卫生健康委信息统计中心',
  '岳阳市大数据中心',
  '湘潭市行政审批服务局',
  '衡阳市数据管理局',
  '湖南省交通运输厅信息中心'
];

const TRADE_DEMANDERS = [
  '湖南智医科技有限公司',
  '长沙云图数据服务有限公司',
  '株洲数智科技有限公司',
  '岳阳明诚医疗数据公司',
  '湘潭数擎信息技术有限公司',
  '湖南湘江新区数据运营公司',
  '常德市智慧城市建设公司',
  '湖南中科大数据分析中心'
];

/** 稳定的字符串散列（FNV-1a），用于由节点名派生可复现的演示数据 */
const hashSeed = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** 线性同余伪随机，输出 [0, 1) */
const seededRand = (seed: number) => {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);

const pickDate = (rand: () => number) => {
  const month = 1 + Math.floor(rand() * 9);
  const day = 1 + Math.floor(rand() * 28);
  return '2026-' + pad2(month) + '-' + pad2(day);
};

/**
 * 生成「授权信息」列表：序号、运营机构、授权时间，按授权时间倒序排列。
 * 由节点名派生种子，保证同一节点的演示数据稳定且各节点互不相同。
 */
export const buildAuthList = (seed: string, count = 17): AuthRecord[] => {
  const rand = seededRand(hashSeed(seed + '|auth'));
  const list: AuthRecord[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      seq: 0,
      org: AUTH_ORGS[Math.floor(rand() * AUTH_ORGS.length)],
      authTime: pickDate(rand)
    });
  }
  list.sort((a, b) => (a.authTime < b.authTime ? 1 : a.authTime > b.authTime ? -1 : 0));
  list.forEach(function (r, idx) { r.seq = idx + 1; });
  return list;
};

/**
 * 生成「交易信息」列表：序号、数据需求方、创建时间，按创建时间倒序排列。
 */
export const buildTradeList = (seed: string, count = 15): TradeRecord[] => {
  const rand = seededRand(hashSeed(seed + '|trade'));
  const list: TradeRecord[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      seq: 0,
      demander: TRADE_DEMANDERS[Math.floor(rand() * TRADE_DEMANDERS.length)],
      createdAt: pickDate(rand)
    });
  }
  list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  list.forEach(function (r, idx) { r.seq = idx + 1; });
  return list;
};

export const getStageStatusClass = (status: string) => {
  if (status === '待处理') return 'status-pending';
  if (status === '处理中') return 'status-processing';
  if (status === '已完成') return 'status-approved';
  if (status === '已驳回') return 'status-rejected';
  if (status === '已终止') return 'status-frozen';
  return 'status-paused';
};

/* ---------------- 辐射式血缘图谱绘制 ---------------- */
export const NODE_STYLE: Record<string, { fill: string; stroke: string; accent: string }> = {
  数据资源: { fill: '#fff2e8', stroke: '#ffbb96', accent: '#fa541c' },
  基础产品: { fill: '#e6f7ff', stroke: '#91d5ff', accent: '#1890ff' },
  再开发产品: { fill: '#f6ffed', stroke: '#b7eb8f', accent: '#52c41a' }
};

export const LINEAGE_LEGEND = ['数据资源', '基础产品', '再开发产品'];

const NODE_W = 180;
const NODE_H = 56;
const MIN_V_GAP = 24;
const clipText = (text: string, max: number) => (text.length > max ? text.slice(0, max - 1) + '…' : text);

export interface LineageGraphProps {
  layers: LineageLayer[];
  edges: LineageEdge[];
  onNodeClick?: (node: LineageNode) => void;
  selectedNodeName?: string;
}

export const LineageGraph = ({ layers, edges, onNodeClick, selectedNodeName }: LineageGraphProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 960, height: 540 });

  useEffect(function () {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: Math.max(rect.width, 320), height: Math.max(rect.height, 240) });
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const { width, height } = size;
  const layerCount = layers.length;
  const centerY = height / 2;
  const H_MARGIN = Math.max(NODE_W / 2 + 20, width * 0.2);
  const usableW = Math.max(60, width - H_MARGIN * 2);

  /** 第 i 列的 x 坐标（首列靠左、末列靠右，列间均分） */
  const layerX = (i: number) => (layerCount <= 1 ? width / 2 : H_MARGIN + (usableW * i) / (layerCount - 1));

  /** 将 count 个节点在列内垂直均布，顶部预留图层标题空间 */
  const distributeY = (count: number) => {
    const positions: number[] = [];
    if (count <= 0) return positions;
    if (count === 1) {
      positions.push(centerY);
      return positions;
    }
    const maxH = count * NODE_H + (count - 1) * MIN_V_GAP;
    const top = Math.max(NODE_H / 2 + 44, centerY - maxH / 2);
    const bottom = Math.min(height - NODE_H / 2 - 16, top + maxH);
    const step = (bottom - top) / (count - 1);
    for (let i = 0; i < count; i++) positions.push(top + i * step);
    return positions;
  };

  const nodePositions: Record<string, { x: number; y: number }> = {};
  layers.forEach(function (layer, li) {
    const x = layerX(li);
    const ys = distributeY(layer.nodes.length);
    layer.nodes.forEach(function (n, ni) {
      nodePositions[n.name] = { x: x, y: ys[ni] };
    });
  });

  const paths: { d: string; key: string }[] = [];
  edges.forEach(function (e, idx) {
    const p1 = nodePositions[e.from];
    const p2 = nodePositions[e.to];
    if (!p1 || !p2) return;
    const dx = (p2.x - NODE_W / 2 - (p1.x + NODE_W / 2)) / 2;
    paths.push({
      key: 'e-' + idx,
      d: 'M ' + (p1.x + NODE_W / 2) + ' ' + p1.y + ' C ' + (p1.x + NODE_W / 2 + dx) + ' ' + p1.y + ', ' + (p2.x - NODE_W / 2 - dx) + ' ' + p2.y + ', ' + (p2.x - NODE_W / 2) + ' ' + p2.y
    });
  });

  const renderNode = (node: LineageNode, x: number, y: number, key: string) => {
    const style = NODE_STYLE[node.type] || NODE_STYLE['基础产品'];
    const isSelected = selectedNodeName === node.name;
    const halfW = NODE_W / 2;
    const halfH = NODE_H / 2;
    return (
      <g
        key={key}
        className={'lineage-node ' + (isSelected ? 'selected' : '')}
        transform={'translate(' + (x - halfW) + ', ' + (y - halfH) + ')'}
        onClick={() => onNodeClick && onNodeClick(node)}
        style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
      >
        <title>{node.name}</title>
        <rect
          width={NODE_W}
          height={NODE_H}
          rx={4}
          fill={style.fill}
          stroke={isSelected ? '#1677ff' : style.stroke}
          strokeWidth={isSelected ? 2.5 : 1}
        />
        <text x={NODE_W / 2} y={24} textAnchor="middle" className="lineage-node-name" fill={style.accent}>
          {clipText(node.type, 8)}
        </text>
        <text x={NODE_W / 2} y={42} textAnchor="middle" className="lineage-node-type" fill={style.accent}>
          {clipText(node.name, 10)}
        </text>
      </g>
    );
  };

  const renderLayerTitle = (title: string, x: number, key: string) => (
    <text key={key} x={x} y={24} textAnchor="middle" className="lineage-layer-title">
      {title}
    </text>
  );

  return (
    <div ref={wrapRef} className="lineage-graph-wrap">
      <svg className="lineage-svg" viewBox={'0 0 ' + width + ' ' + height} width={width} height={height} role="img" aria-label="数据血缘图谱">
        <defs>
          <marker id="lineage-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 Z" fill="#9aa7bd" />
          </marker>
        </defs>
        {paths.map(function (p) {
          return <path key={p.key} d={p.d} fill="none" stroke="#c2ccdb" strokeWidth={1.4} markerEnd="url(#lineage-arrow)" />;
        })}
        {layers.map(function (layer, li) {
          return renderLayerTitle(layer.title, layerX(li), 't-' + li);
        })}
        {layers.map(function (layer, li) {
          return layer.nodes.map(function (node, ni) {
            const pos = nodePositions[node.name];
            return renderNode(node, pos.x, pos.y, 'n-' + li + '-' + ni);
          });
        })}
      </svg>
    </div>
  );
};

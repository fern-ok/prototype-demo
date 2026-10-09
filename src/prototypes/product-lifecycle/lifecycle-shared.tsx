/**
 * @name 产品生命周期 - 共享数据与血缘逻辑
 * @mode axure
 *
 * 被「产品生命周期」列表页与「数据血缘」独立页面共同复用，
 * 避免两份原型重复维护演示数据与图谱绘制逻辑。
 */

import { useEffect, useMemo, useRef, useState } from 'react';

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
  /* ---- 以下为查看弹窗「基本信息」页签扩展字段（演示口径，对齐后端产品详情页样式） ---- */
  /** 产品开发方案附件（文件名） */
  devPlanFile: string;
  /** 运营协议附件 */
  opAgreementFile: string;
  /** 实施方案附件 */
  implPlanFile: string;
  /** 领域名称 */
  domainName: string;
  /** 提供方主体类型 */
  providerType: string;
  /** 身份标识码 */
  providerIdCode: string;
  /** 法人经办人姓名 */
  providerContact: string;
  /** 法人经办人电话 */
  providerPhone: string;
  /** 授权委托书附件 */
  entrustFile: string;
  /** 提供方简介 */
  providerIntro: string;
  /** 数据样例 */
  dataSample: string;
  /** 合法合规声明附件 */
  complianceFile: string;
  /** 数据来源声明附件 */
  sourceDeclareFile: string;
  /** 安全分级分类 */
  securityLevel: string;
  /** 数据质量产品价值评估报告 */
  qualityReport: string;
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
export const STAGE_OPTIONS = ['安全审查', '产品登记', '产品上架', '产品下架', '产品交易'];
/** 阶段流转顺序（时间轴与血缘均按此顺序推导） */
const STAGE_FLOW = ['安全审查', '产品登记', '产品上架', '产品交易', '产品下架'];

/** 各「流程节点」（按实际 currentStage 取值）允许出现的节点状态（新词表，按节点区分） */
const STAGE_STATUS_MAP: Record<string, string[]> = {
  安全审查: ['待审查', '审查通过', '审查不通过'],
  产品登记: ['首次登记待审核', '变更登记待审核', '撤销登记待审核', '首次登记未通过', '变更登记未通过', '撤销登记未通过', '已通过', '已撤销'],
  产品上架: ['上架待审核', '上架已通过', '上架不通过'],
  产品下架: ['下架待审核', '下架已通过', '下架不通过'],
  产品交易: ['已下单', '交付中', '已完成', '已冻结']
};

/** 节点状态全集（下拉未选流程节点时的兜底选项） */
export const STAGE_STATUS_OPTIONS = Array.from(new Set(Object.values(STAGE_STATUS_MAP).flat()));

/** 列表「流程节点」→「节点状态」级联映射（产品上下架 合并上架 / 下架 两套状态） */
export const STAGE_STATUS_OPTIONS_BY_STAGE: Record<string, string[]> = {
  安全审查: STAGE_STATUS_MAP['安全审查'],
  产品登记: STAGE_STATUS_MAP['产品登记'],
  产品上下架: [...STAGE_STATUS_MAP['产品上架'], ...STAGE_STATUS_MAP['产品下架']],
  产品交易: STAGE_STATUS_MAP['产品交易']
};

const STAGE_OPERATOR_ORG: Record<string, string> = {
  安全审查: '数据管理部门',
  产品登记: '运营机构',
  产品上架: '运营机构',
  产品交易: '运营机构',
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
  产品交易: '产品交易',
  产品下架: '产品下架申请'
};

const STATUS_REMARK: Record<string, string> = {
  待处理: '已提交，等待受理',
  处理中: '正在处理中，请耐心等待',
  已完成: '已通过，流程流转至下一阶段',
  已驳回: '材料不符合要求已被驳回，请修改后重新提交',
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

  // 原型演示：固定将「DP43020020260019」置为产品下架 / 下架不通过
  const dp43020020260019 = list.find((r) => r.productCode === 'DP43020020260019');
  if (dp43020020260019) {
    dp43020020260019.currentStage = '产品下架';
    dp43020020260019.stageStatus = '下架不通过';
  }

  return list;
})();

/** 将节点状态映射为时间轴「审核结果」（兼容新 / 旧词表） */
const auditResultOf = (status: string): string => {
  if (status === '已完成' || status === '审查通过' || status === '已通过' || status.endsWith('已通过')) return '审核通过';
  if (status.endsWith('不通过')) return '审核不通过';
  return '—';
};

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
      auditTime: auditResultOf(status) !== '—' ? time : '—',
      auditResult: auditResultOf(status),
      auditOpinion:
        auditResultOf(status) === '审核通过'
          ? '通过'
          : auditResultOf(status) === '审核不通过'
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
    providerName: record.provider,
    devPlanFile: '产品开发方案.pdf',
    opAgreementFile: '运营协议.pdf',
    implPlanFile: '实施方案.pdf',
    domainName: '整体',
    providerType: '法人',
    providerIdCode: '91430105750602924H',
    providerContact: '张强',
    providerPhone: '17856562323',
    entrustFile: '',
    providerIntro: '湖南省唯一省级地方金融控股公司财信金控旗下企业，定位为公共数据运营服务商。该集团在长沙正式揭牌，重点开展公共数据汇聚治理、产品开发及生态培育等业务，致力于推动数据要素市场化配置和数字经济发展。集团计划未来3-5年通过建设公共数据平台、培育数商体系等举措，打造中部地区有影响力的数据产业集团，并牵头成立湖南省数据产业联盟，推动行业协同发展（测试）。',
    dataSample: '',
    complianceFile: '合法合规声明.pdf',
    sourceDeclareFile: '数据来源声明.pdf',
    securityLevel: '',
    qualityReport: ''
  };
};

/* ---------------- 查看弹窗「配置信息」（数据集字段信息 / API接口信息） ---------------- */

/** 数据集产品的字段信息（查看弹窗「配置信息」页签） */
export interface DatasetField {
  seq: number;
  /** 字段名称（英文） */
  name: string;
  /** 字段中文名 */
  cnName: string;
  /** 数据类型 */
  dataType: string;
  /** 主键（是 / 否） */
  primaryKey: string;
  /** 允许为空（是 / 否） */
  nullable: string;
  /** 描述 */
  desc: string;
}

const FIELD_NAME_POOL: Array<{ name: string; cn: string }> = [
  { name: 'id', cn: '主键编号' },
  { name: 'name', cn: '名称' },
  { name: 'code', cn: '编码' },
  { name: 'region', cn: '所属地域' },
  { name: 'category', cn: '类别' },
  { name: 'data_value', cn: '数据值' },
  { name: 'stat_date', cn: '统计日期' },
  { name: 'status', cn: '状态' },
  { name: 'source_org', cn: '来源单位' },
  { name: 'remark', cn: '备注' }
];

const FIELD_TYPE_POOL = ['字符型', '数值型', '日期型', '布尔型'];

/** 由记录稳定派生数据集产品的字段信息（5~9 个字段，演示用） */
export const buildDatasetFields = (record: LifecycleRecord): DatasetField[] => {
  const count = 5 + (record.id % 5);
  const offset = record.id % FIELD_NAME_POOL.length;
  const list: DatasetField[] = [];
  for (let i = 0; i < count; i++) {
    const meta = FIELD_NAME_POOL[(offset + i) % FIELD_NAME_POOL.length];
    const fieldName = count > FIELD_NAME_POOL.length && i >= FIELD_NAME_POOL.length
      ? meta.name + '_' + (i + 1)
      : meta.name;
    list.push({
      seq: i + 1,
      name: fieldName,
      cnName: meta.cn,
      dataType: FIELD_TYPE_POOL[(record.id + i) % FIELD_TYPE_POOL.length],
      primaryKey: i === 0 ? '是' : '否',
      nullable: (record.id + i) % 3 === 0 ? '是' : '否',
      desc: meta.cn + '字段'
    });
  }
  return list;
};

/** API 产品的接口请求参数 */
export interface ApiRequestParam {
  /** 参数名 */
  name: string;
  /** 参数位置 */
  position: string;
  /** 必填（是 / 否） */
  required: string;
  /** 字段类型 */
  fieldType: string;
  /** 说明 */
  desc: string;
}

/** API 产品的接口返回参数 */
export interface ApiResponseParam {
  /** 参数名 */
  name: string;
  /** 字段类型 */
  fieldType: string;
  /** 说明 */
  desc: string;
}

/** API 产品的接口信息（查看弹窗「配置信息」页签） */
export interface ApiInfo {
  /** 接口名称 */
  name: string;
  /** 接口地址 */
  url: string;
  /** 请求方式 */
  method: string;
  /** 返回格式 */
  returnFormat: string;
  /** 接口描述 */
  desc: string;
  requestParams: ApiRequestParam[];
  responseParams: ApiResponseParam[];
}

/** 由记录稳定派生 API 产品的接口信息（演示用） */
export const buildApiInfo = (record: LifecycleRecord): ApiInfo => ({
  name: record.productName,
  url: 'https://apigw.hndata.com:22262/api/query/' + record.productCode,
  method: 'POST',
  returnFormat: 'JSON',
  desc: record.productDesc,
  requestParams: [
    { name: 'version', position: 'BODY', required: '否', fieldType: '字符型', desc: '接口版本号' },
    { name: 'params', position: 'BODY', required: '是', fieldType: '字符型', desc: '查询参数（JSON 字符串）' },
    { name: 'timestamp', position: 'BODY', required: '是', fieldType: '字符型', desc: '请求时间戳（毫秒）' },
    { name: 'X-Request-ID', position: 'HEADER', required: '否', fieldType: '字符型', desc: '请求唯一标识' },
    { name: 'Content-Type', position: 'HEADER', required: '是', fieldType: '字符型', desc: '请求体格式，固定 application/json' }
  ],
  responseParams: [
    { name: 'body', fieldType: '对象型', desc: '响应数据体' },
    { name: 'code', fieldType: '字符型', desc: '响应状态码' },
    { name: 'message', fieldType: '字符型', desc: '响应描述信息' }
  ]
});

/** 依据数据产品标识码定位记录（供独立数据血缘页按参数加载） */
export const getRecordByCode = (code: string): LifecycleRecord | undefined => {
  if (!code) return undefined;
  const target = code.trim();
  const found = seedRecords.find(function (r) { return r.productCode === target; });
  if (!found) return undefined;
  // 原型演示：固定将「DP4302020260019」的当前阶段置为产品登记
  if (target === 'DP4302020260019') {
    return { ...found, currentStage: '产品登记', stageStatus: '首次登记待审核' };
  }
  return found;
};

/* ---------------- 节点详情列表（授权信息 / 交易信息） ---------------- */

export interface AuthRecord {
  /** 全局序号（按授权时间倒序后 1 起） */
  seq: number;
  /** 被授权方（接收授权的运营机构） */
  org: string;
  /** 授权用途（基础产品：产品再开发） */
  purpose: string;
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
 * 生成「授权信息」列表：序号、被授权方、授权用途、授权时间，按授权时间倒序排列。
 * 语义：当前节点（基础产品）被授权给这些机构，用于产品再开发（purpose 由调用方传入）。
 * 由节点名派生种子，保证同一节点的演示数据稳定且各节点互不相同。
 */
export const buildAuthList = (seed: string, purpose = '产品再开发', count = 17): AuthRecord[] => {
  const rand = seededRand(hashSeed(seed + '|auth'));
  const list: AuthRecord[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      seq: 0,
      org: AUTH_ORGS[Math.floor(rand() * AUTH_ORGS.length)],
      purpose,
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
  // 新词表（按节点区分的状态）
  if (status === '待审查' || status.endsWith('待审核')) return 'status-pending';
  if (status === '审查通过' || status === '已通过' || status.endsWith('已通过') || status === '已完成') return 'status-approved';
  if (status.endsWith('不通过') || status.endsWith('未通过')) return 'status-rejected';
  if (status === '已下单' || status === '交付中') return 'status-processing';
  if (status === '已冻结' || status === '已撤销') return 'status-frozen';
  // 兼容旧词表
  if (status === '待处理') return 'status-pending';
  if (status === '处理中') return 'status-processing';
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

export const NODE_W = 180;
export const NODE_H = 56;
export const MIN_V_GAP = 24;
const clipText = (text: string, max: number) => (text.length > max ? text.slice(0, max - 1) + '…' : text);

/** 第 i 列的 x 坐标（首列靠左、末列靠右，列间均分）；供主图图层标题与节点布局共用，保证坐标一致 */
export const computeLayerX = (layerCount: number, width: number, i: number): number => {
  const H_MARGIN = Math.max(NODE_W / 2 + 20, width * 0.2);
  const usableW = Math.max(60, width - H_MARGIN * 2);
  return layerCount <= 1 ? width / 2 : H_MARGIN + (usableW * i) / (layerCount - 1);
};

/**
 * 计算辐射式血缘图谱中每个节点的坐标（内容坐标系，单位与画布像素一致）。
 * 主图（LineageGraph）与缩略图（数据血缘页 minimap）共用本函数，保证拓扑坐标一致。
 */
export const computeNodePositions = (
  layers: LineageLayer[],
  width: number,
  height: number
): Record<string, { x: number; y: number }> => {
  const layerCount = layers.length;
  const centerY = height / 2;
  const layerX = (i: number) => computeLayerX(layerCount, width, i);
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
  const positions: Record<string, { x: number; y: number }> = {};
  layers.forEach(function (layer, li) {
    const x = layerX(li);
    const ys = distributeY(layer.nodes.length);
    layer.nodes.forEach(function (n, ni) {
      positions[n.name] = { x: x, y: ys[ni] };
    });
  });
  return positions;
};

export interface LineageGraphProps {
  layers: LineageLayer[];
  edges: LineageEdge[];
  onNodeClick?: (node: LineageNode) => void;
  selectedNodeName?: string;
  /** 需要重点标记（高亮）的节点名称列表；不传则全部节点保持原有样式 */
  highlightNames?: string[];
}

export const LineageGraph = ({ layers, edges, onNodeClick, selectedNodeName, highlightNames }: LineageGraphProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 960, height: 540 });
  const highlightSet = useMemo(() => new Set(highlightNames || []), [highlightNames]);

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
  const nodePositions = computeNodePositions(layers, width, height);
  const layerX = (i: number) => computeLayerX(layers.length, width, i);

  const paths: { d: string; key: string; hot: boolean }[] = [];
  edges.forEach(function (e, idx) {
    const p1 = nodePositions[e.from];
    const p2 = nodePositions[e.to];
    if (!p1 || !p2) return;
    const dx = (p2.x - NODE_W / 2 - (p1.x + NODE_W / 2)) / 2;
    paths.push({
      key: 'e-' + idx,
      hot: highlightSet.has(e.from) || highlightSet.has(e.to),
      d: 'M ' + (p1.x + NODE_W / 2) + ' ' + p1.y + ' C ' + (p1.x + NODE_W / 2 + dx) + ' ' + p1.y + ', ' + (p2.x - NODE_W / 2 - dx) + ' ' + p2.y + ', ' + (p2.x - NODE_W / 2) + ' ' + p2.y
    });
  });

  const renderNode = (node: LineageNode, x: number, y: number, key: string) => {
    const style = NODE_STYLE[node.type] || NODE_STYLE['基础产品'];
    const isSelected = selectedNodeName === node.name;
    const isHighlight = !isSelected && highlightSet.has(node.name);
    const halfW = NODE_W / 2;
    const halfH = NODE_H / 2;
    const isResource = node.type === '数据资源';
    const nodeSubLabel = isResource ? '资源格式：' : '产品类型：';
    const nodeSubValue = isResource ? node.detail?.format || '' : node.productDetail?.productType || '';
    return (
      <g
        key={key}
        className={'lineage-node ' + (isSelected ? 'selected ' : '') + (isHighlight ? 'highlighted' : '')}
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
          stroke={isSelected ? '#1677ff' : isHighlight ? '#fa8c16' : style.stroke}
          strokeWidth={isSelected || isHighlight ? 2.5 : 1}
          style={isHighlight ? { filter: 'drop-shadow(0 0 6px rgba(250, 140, 22, 0.45))' } : undefined}
        />
        <text x={12} y={24} textAnchor="start" className="lineage-node-name" fill={style.accent} style={{ textAnchor: 'start' }}>
          {clipText(node.name, 12)}
        </text>
        <text x={12} y={42} textAnchor="start" className="lineage-node-type" fill={style.accent} style={{ textAnchor: 'start' }}>
          {clipText(nodeSubLabel + nodeSubValue, 16)}
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
          return (
            <path
              key={p.key}
              d={p.d}
              fill="none"
              stroke={p.hot ? '#fa8c16' : '#c2ccdb'}
              strokeWidth={p.hot ? 2 : 1.4}
              markerEnd="url(#lineage-arrow)"
            />
          );
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

/**
 * 机构监管 · 备案关系链路（五级）共享数据层
 *
 * 链路定义：数据管理部门 → 行业主管部门 → 实施机构 → 运营机构 → 其他经营主体
 *
 * 职责边界：本文件仅承载数据模型、角色专属信息、归属关系构建与层级查询等纯逻辑，
 * 供「机构清单」视图（index.tsx）与「备案关系链路」视图（chain.tsx）共同复用，不含 JSX。
 */

export interface Institution {
  id: number;
  region: string;
  authType: string;
  domain: string;
  role: string;
  orgName: string;
  creditCode: string;
  filingTime: string;
  /** 批次（仅行业主管部门记录携带） */
  batch?: string;
  /** 备案归属：实施机构记录指向其备案的行业主管部门 id（链路 L2 → L3） */
  filingDeptId?: number;
  /** 备案归属：其他经营主体记录指向其备案的运营机构 id（链路 L4 → L5） */
  filingOperatorId?: number;
  /** 备案归属：行业主管部门记录指向其所属数据管理部门 id（链路 L1 → L2） */
  filingManageDeptId?: number;
  /** 备案归属：运营机构记录指向其备案的实施机构 id（链路 L3 → L4） */
  filingImplId?: number;
}

export interface RoleSpecificInfo {
  title: string;
  items: Array<{ label: string; value: string; span?: boolean }>;
}

/** 依据机构角色动态派生角色专属备案信息（内容暂定，按角色分支渲染） */
export function buildRoleSpecific(record: Institution): RoleSpecificInfo {
  const code = record.creditCode.slice(-8);
  switch (record.role) {
    case '实施机构':
      return {
        title: '实施机构备案信息',
        items: [
          { label: '实施方案名称', value: record.orgName + '公共数据授权运营实施方案' },
          { label: '实施方案备案编号', value: 'SS-' + code },
          { label: '实施内容概述', value: '围绕' + record.domain + '领域，承担公共数据授权运营的实施支撑、数据治理与交付落地工作。', span: true },
          { label: '备案状态', value: '已备案' }
        ]
      };
    case '运营机构':
      return {
        title: '运营机构备案信息',
        items: [
          { label: '运营协议编号', value: 'YY-' + code },
          { label: '授权运营范围', value: record.region + ' / ' + record.authType },
          { label: '运营期限', value: record.filingTime.slice(0, 10) + ' 至 2031-12-31' },
          { label: '备案状态', value: '已备案' }
        ]
      };
    case '其他经营主体':
      return {
        title: '其他经营主体备案信息',
        items: [
          { label: '经营主体类型', value: '数据开发 / 再开发' },
          { label: '经营范围', value: record.domain + '领域数据产品开发、加工与服务', span: true },
          { label: '关联运营机构', value: record.region + '数据运营有限公司' },
          { label: '备案状态', value: '已备案' }
        ]
      };
    case '数据管理部门':
      return {
        title: '数据管理部门信息',
        items: [
          { label: '部门层级', value: record.region },
          { label: '管辖区域', value: record.region + '全域' },
          { label: '数据管理职责', value: '统筹' + record.region + '公共数据资源目录管理、授权运营统筹协调与数据安全监督管理工作。', span: true },
          { label: '备案状态', value: '已备案' }
        ]
      };
    case '行业主管部门':
    default:
      return {
        title: '行业主管部门信息',
        items: [
          { label: '主管部门层级', value: record.region },
          { label: '主管行业领域', value: record.domain },
          { label: '行政监管职责', value: '统筹' + record.domain + '领域公共数据授权运营的行业指导、监督与合规管理。', span: true },
          { label: '备案状态', value: '已备案' }
        ]
      };
  }
}

/** 链路层级归属字段（本层记录指向上一级机构 id 的字段名；L1 无上级） */
export type ChainParentField = 'filingManageDeptId' | 'filingDeptId' | 'filingImplId' | 'filingOperatorId';

export interface ChainLevelMeta {
  level: number;
  /** 该层机构角色 */
  role: string;
  /** 层级展示名（概览条 / 统计卡） */
  title: string;
  /** 下一级机构类型名（末级为空串） */
  childTitle: string;
  /** 本层记录指向父级 id 的字段名（L1 为 null） */
  parentField: ChainParentField | null;
  /** 列表列定义 */
  columns: Array<{ key: string; title: string; width: number }>;
  /** 该层可用的筛选项 */
  filters: Array<{ key: string; label: string; type: 'region' | 'text' | 'select' | 'date-range'; options?: string[] }>;
}

/**
 * 五级链路元信息：字段与筛选项按层裁剪，
 * 管理部门层（L1 / L2）不展示「授权运营类型 / 领域名称」，末级无下级入口。
 */
export const CHAIN_LEVELS: ChainLevelMeta[] = [
  {
    level: 1,
    role: '数据管理部门',
    title: '数据管理部门',
    childTitle: '行业主管部门',
    parentField: null,
    columns: [
      { key: 'index', title: '序号', width: 56 },
      { key: 'region', title: '所属地域', width: 110 },
      { key: 'orgName', title: '单位/企业名称', width: 300 },
      { key: 'creditCode', title: '统一社会信用代码', width: 210 },
      { key: 'filingTime', title: '备案时间', width: 170 },
      { key: 'childCount', title: '行业主管部门数量', width: 150 },
      { key: 'ops', title: '操作', width: 150 }
    ],
    filters: [
      { key: 'region', label: '所属地域', type: 'region' },
      { key: 'orgName', label: '单位/企业名称', type: 'text' },
      { key: 'creditCode', label: '统一社会信用代码', type: 'text' },
      { key: 'filingTime', label: '备案时间', type: 'date-range' }
    ]
  },
  {
    level: 2,
    role: '行业主管部门',
    title: '行业主管部门',
    childTitle: '实施机构',
    parentField: 'filingManageDeptId',
    columns: [
      { key: 'index', title: '序号', width: 56 },
      { key: 'batch', title: '批次', width: 90 },
      { key: 'region', title: '所属地域', width: 110 },
      { key: 'orgName', title: '单位/企业名称', width: 280 },
      { key: 'creditCode', title: '统一社会信用代码', width: 200 },
      { key: 'filingTime', title: '备案时间', width: 170 },
      { key: 'childCount', title: '关联实施机构', width: 150 },
      { key: 'ops', title: '操作', width: 150 }
    ],
    filters: [
      { key: 'batch', label: '批次', type: 'text' },
      { key: 'region', label: '所属地域', type: 'region' },
      { key: 'orgName', label: '单位/企业名称', type: 'text' },
      { key: 'creditCode', label: '统一社会信用代码', type: 'text' },
      { key: 'filingTime', label: '备案时间', type: 'date-range' }
    ]
  },
  {
    level: 3,
    role: '实施机构',
    title: '实施机构',
    childTitle: '运营机构',
    parentField: 'filingDeptId',
    columns: [
      { key: 'index', title: '序号', width: 56 },
      { key: 'region', title: '所属地域', width: 110 },
      { key: 'authType', title: '授权运营类型', width: 130 },
      { key: 'domain', title: '领域名称', width: 110 },
      { key: 'orgName', title: '单位/企业名称', width: 250 },
      { key: 'creditCode', title: '统一社会信用代码', width: 200 },
      { key: 'filingTime', title: '备案时间', width: 170 },
      { key: 'childCount', title: '关联运营机构', width: 150 },
      { key: 'ops', title: '操作', width: 150 }
    ],
    filters: [
      { key: 'region', label: '所属地域', type: 'region' },
      { key: 'authType', label: '授权运营类型', type: 'select', options: ['整体授权运营', '分领域授权运营'] },
      { key: 'domain', label: '领域名称', type: 'select', options: ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源', '城市治理', '金融服务', '工业制造', '智慧农业', '应急管理'] },
      { key: 'orgName', label: '单位/企业名称', type: 'text' },
      { key: 'creditCode', label: '统一社会信用代码', type: 'text' },
      { key: 'filingTime', label: '备案时间', type: 'date-range' }
    ]
  },
  {
    level: 4,
    role: '运营机构',
    title: '运营机构',
    childTitle: '其他经营主体',
    parentField: 'filingImplId',
    columns: [
      { key: 'index', title: '序号', width: 56 },
      { key: 'region', title: '所属地域', width: 110 },
      { key: 'authType', title: '授权运营类型', width: 130 },
      { key: 'orgName', title: '单位/企业名称', width: 260 },
      { key: 'creditCode', title: '统一社会信用代码', width: 200 },
      { key: 'period', title: '运营期限', width: 200 },
      { key: 'filingTime', title: '备案时间', width: 170 },
      { key: 'childCount', title: '关联其他经营主体', width: 160 },
      { key: 'ops', title: '操作', width: 150 }
    ],
    filters: [
      { key: 'region', label: '所属地域', type: 'region' },
      { key: 'authType', label: '授权运营类型', type: 'select', options: ['整体授权运营', '分领域授权运营'] },
      { key: 'orgName', label: '单位/企业名称', type: 'text' },
      { key: 'creditCode', label: '统一社会信用代码', type: 'text' },
      { key: 'filingTime', label: '备案时间', type: 'date-range' }
    ]
  },
  {
    level: 5,
    role: '其他经营主体',
    title: '其他经营主体',
    childTitle: '',
    parentField: 'filingOperatorId',
    columns: [
      { key: 'index', title: '序号', width: 56 },
      { key: 'region', title: '所属地域', width: 110 },
      { key: 'authType', title: '授权运营类型', width: 130 },
      { key: 'domain', title: '领域名称', width: 110 },
      { key: 'orgName', title: '单位/企业名称', width: 250 },
      { key: 'creditCode', title: '统一社会信用代码', width: 200 },
      { key: 'filingTime', title: '备案时间', width: 170 },
      { key: 'parentOrg', title: '关联运营机构', width: 220 },
      { key: 'ops', title: '操作', width: 110 }
    ],
    filters: [
      { key: 'region', label: '所属地域', type: 'region' },
      { key: 'authType', label: '授权运营类型', type: 'select', options: ['整体授权运营', '分领域授权运营'] },
      { key: 'domain', label: '领域名称', type: 'select', options: ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源', '城市治理', '金融服务', '工业制造', '智慧农业', '应急管理'] },
      { key: 'orgName', label: '单位/企业名称', type: 'text' },
      { key: 'creditCode', label: '统一社会信用代码', type: 'text' },
      { key: 'filingTime', label: '备案时间', type: 'date-range' }
    ]
  }
];

export function levelMeta(level: number): ChainLevelMeta {
  return CHAIN_LEVELS[level - 1];
}

/**
 * 建立链路新增的两条归属边（确定性、可复现）：
 *  - 行业主管部门 → 数据管理部门：同地域优先，无同地域时归省本级数据管理部门兜底
 *  - 运营机构 → 实施机构：同地域优先，无同地域时按出现顺序轮转分配
 * 说明：L2 → L3（filingDeptId）与 L4 → L5（filingOperatorId）沿用既有归属，此处不重复处理。
 */
export function applyChainRelations(records: Institution[]): Institution[] {
  const byRole = function (role: string) {
    return records.filter(function (r) { return r.role === role; });
  };
  const manageDepts = byRole('数据管理部门');
  const provinceDept = manageDepts.filter(function (r) { return r.region === '省本级'; })[0];
  const fallbackDept = provinceDept || manageDepts[0];

  byRole('行业主管部门').forEach(function (dept, idx) {
    const sameRegion = manageDepts.filter(function (m) { return m.region === dept.region; });
    if (sameRegion.length > 0) {
      dept.filingManageDeptId = sameRegion[idx % sameRegion.length].id;
    } else if (fallbackDept) {
      dept.filingManageDeptId = fallbackDept.id;
    }
  });

  const impls = byRole('实施机构');
  byRole('运营机构').forEach(function (op, idx) {
    const sameRegion = impls.filter(function (i) { return i.region === op.region; });
    if (sameRegion.length > 0) {
      op.filingImplId = sameRegion[idx % sameRegion.length].id;
    } else if (impls.length > 0) {
      op.filingImplId = impls[idx % impls.length].id;
    }
  });

  return records;
}

/** 取某机构在指定层级下的直接下级列表 */
export function childrenOf(records: Institution[], level: number, parentId: number): Institution[] {
  const meta = levelMeta(level);
  const field = meta.parentField;
  if (!field) return [];
  return records.filter(function (r) {
    return r.role === meta.role && r[field] === parentId;
  });
}

/** 层级链路节点：level 为所处层级，parentId 为该层的上级机构 id（L1 为 null） */
export interface ChainNode {
  level: number;
  parentId: number | null;
  /** 上级机构名称（L1 固定为「数据管理部门」） */
  parentName: string;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
}

export function createRootNode(): ChainNode {
  return { level: 1, parentId: null, parentName: '数据管理部门', page: 1, pageSize: 10, filters: {} };
}

/**
 * 计算当前路径下各层级的可达机构集合（用于链路概览条）。
 * 逐层收敛：已选中上级机构时取该机构的直接下级，否则取上一层可达集合的全部下级并集。
 */
export function computeScopes(records: Institution[], path: ChainNode[]): Record<number, Institution[]> {
  const scopes: Record<number, Institution[]> = {};
  scopes[1] = records.filter(function (r) { return r.role === levelMeta(1).role; });
  for (let level = 2; level <= CHAIN_LEVELS.length; level++) {
    const selected = path.filter(function (n) { return n.level === level && n.parentId != null; })[0];
    if (selected) {
      scopes[level] = childrenOf(records, level, selected.parentId as number);
      continue;
    }
    const ids: Record<number, boolean> = {};
    (scopes[level - 1] || []).forEach(function (parent) {
      childrenOf(records, level, parent.id).forEach(function (child) { ids[child.id] = true; });
    });
    scopes[level] = records.filter(function (r) { return ids[r.id] === true; });
  }
  return scopes;
}

/** 当前层统计：机构数、省本级 / 地市分布、有下级 / 无下级机构数 */
export interface LevelStats {
  total: number;
  province: number;
  city: number;
  withChild: number;
  withoutChild: number;
}

export interface LevelPayload {
  /** 当前层级在当前路径下的全量机构（未应用筛选） */
  list: Institution[];
  /** 每行机构对应的下级数量 */
  childCounts: Record<number, number>;
  /** 每行机构的上级机构名称（末级「关联运营机构」列使用） */
  parentNames: Record<number, string>;
  stats: LevelStats;
}

/** 构建当前层级数据（列表 + 下级数量 + 上级名称 + 统计） */
export function buildLevelPayload(records: Institution[], path: ChainNode[]): LevelPayload {
  const node = path[path.length - 1];
  const scopes = computeScopes(records, path);
  const list = scopes[node.level] || [];
  const childCounts: Record<number, number> = {};
  const parentNames: Record<number, string> = {};
  const nameOf: Record<number, string> = {};
  records.forEach(function (r) { nameOf[r.id] = r.orgName; });

  list.forEach(function (r) {
    if (node.level < CHAIN_LEVELS.length) {
      childCounts[r.id] = childrenOf(records, node.level + 1, r.id).length;
    }
    const field = levelMeta(node.level).parentField;
    if (field && r[field] != null) {
      parentNames[r.id] = nameOf[r[field] as number] || '-';
    }
  });

  const province = list.filter(function (r) { return r.region === '省本级'; }).length;
  const isLast = node.level === CHAIN_LEVELS.length;
  const withChild = isLast
    ? list.length
    : list.filter(function (r) { return (childCounts[r.id] || 0) > 0; }).length;

  return {
    list: list,
    childCounts: childCounts,
    parentNames: parentNames,
    stats: {
      total: list.length,
      province: province,
      city: list.length - province,
      withChild: withChild,
      withoutChild: list.length - withChild
    }
  };
}

/** 按当前层筛选条件过滤列表（地域 / 文本 / 下拉 / 备案时间范围） */
export function filterLevelList(list: Institution[], filters: Record<string, string>, level: number): Institution[] {
  const region = filters.region || '';
  const orgName = (filters.orgName || '').trim();
  const creditCode = (filters.creditCode || '').trim();
  const batch = (filters.batch || '').trim();
  const authType = filters.authType || '';
  const domain = filters.domain || '';
  const start = filters.timeStart || '';
  const end = filters.timeEnd || '';
  const hasFilter = Boolean(region || orgName || creditCode || batch || authType || domain || start || end);
  if (!hasFilter) return list;
  return list.filter(function (r) {
    if (region && r.region !== region) return false;
    if (authType && r.authType !== authType) return false;
    if (domain && r.domain !== domain) return false;
    if (batch && !(r.batch || '').includes(batch)) return false;
    if (orgName && r.orgName.indexOf(orgName) < 0) return false;
    if (creditCode && r.creditCode.indexOf(creditCode) < 0) return false;
    if (start && r.filingTime < start) return false;
    if (end && r.filingTime > end) return false;
    return true;
  });
}

/** 层级缓存键：仅按层级 + 上级机构标识，筛选与分页为本地即时计算，不参与缓存 */
export function buildScopeKey(node: ChainNode): string {
  return node.level + ':' + (node.parentId == null ? 'root' : node.parentId);
}

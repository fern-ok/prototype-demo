/**
 * @name 机构监管
 * @mode axure
 *
 * 机构监管页面（数据管理部门视角），归属「其他」一级菜单下的二级菜单。
 * 采用【单页面 + 视图切换】方案，包含两个视图：
 *  1. 机构清单（默认）：顶部全局统计卡片、角色快捷 Tab、筛选区、机构列表、查看弹窗、导出。
 *  2. 备案关系链路：以数据管理部门为起点逐级下钻（数据管理部门 → 行业主管部门 → 实施机构 →
 *     运营机构 → 其他经营主体），承载层级导航、逐级返回、联动刷新与加载/空态处理。
 * 点击查看时，根据机构角色动态渲染对应角色专属备案信息。
 *
 * 【公共数据层说明】Institution 模型与角色专属信息（buildRoleSpecific）已抽至 chain-shared.ts，
 * 供机构清单视图与链路视图（chain.tsx）共同复用，避免两处重复定义。
 */

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, Download, RefreshCw } from 'lucide-react';
import Layout from '../../common/Layout';
import RegionCascader from '../../common/RegionCascader';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
import FilingChainView from './chain';
import { applyChainRelations, buildRoleSpecific } from './chain-shared';
import type { Institution } from './chain-shared';
import './style.css';
import '../../common/backend-list.css';

/**
 * 【位置交换说明（行业主管部门 ⇄ 其他经营主体）】
 * - 触发条件：需求要求两个角色在系统中交换彼此的展示/数据位置（2026-10-16）。
 * - 交换方向：行业主管部门原位置 ⇄ 其他经营主体原位置（双向互换）。
 * - 影响范围（数据字段）：ROLE_LIST（机构角色下拉/种子数据生成顺序）、ROLE_TABS（角色快捷 Tab 顺序）、
 *   顶部统计卡片排列顺序（renderStats）。各角色配色（ROLE_CARD_TONE）按角色名绑定，跟随角色移动，不互换颜色。
 * - 状态更新逻辑：交换为静态枚举顺序调整，角色名与其数据、配色、弹窗渲染分支（buildRoleSpecific）保持一一对应，
 *   不产生运行时状态变化。
 * - 可追溯/回滚：本注释即交换记录；回滚时将上述三处枚举/卡片顺序中两角色再次互换即可恢复原状。
 *   （后续调整：ROLE_TABS 单独调整为「全部 | 行业主管部门 | 实施机构 | 运营机构 | 其他经营主体」，行业主管部门 Tab 位于全部与实施机构之间。）
 */
/**
 * 【新增监管角色说明（数据管理部门）】
 * - 触发条件：需求要求机构监管新增「数据管理部门」角色监管（2026-10-19）。
 * - 落位规则：ROLE_TABS 中置于「全部」之后、「行业主管部门」之前；顶部统计卡片中同名卡片置于「行业主管部门数量」卡之前。
 * - 影响范围：ROLE_LIST（机构角色下拉/种子数据生成顺序）、ROLE_TABS、ROLE_COUNTS、ROLE_CARD_TONE、
 *   buildOrgName（机构名称生成）、buildRoleSpecific（弹窗角色专属备案信息）、renderStats（统计卡片）。
 * - 列表表现：数据管理部门为统筹型管理部门，与行业主管部门一致，Tab 内隐藏「授权运营类型 / 领域名称」
 *   （筛选项与列表列均隐藏，列表中该两列回填「-」）；不展示「批次」列，不展示跨角色备案数量列。
 * - 可追溯/回滚：移除 ROLE_LIST / ROLE_TABS / ROLE_COUNTS 中的数据管理部门条目及相关卡片即可恢复原状。
 */
/** 机构角色枚举（全局监管覆盖的全部类型；行业主管部门与其他经营主体位置已互换） */
const ROLE_LIST = ['实施机构', '运营机构', '数据管理部门', '行业主管部门', '其他经营主体'];
const AUTH_TYPE_OPTIONS = ['整体授权运营', '分领域授权运营'];
const DOMAIN_OPTIONS = ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源', '城市治理', '金融服务', '工业制造', '智慧农业', '应急管理'];
const REGION_OPTIONS = ['省本级', '长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西土家族苗族自治州'];

/** 批次枚举（行业主管部门专属字段；须在种子数据生成之前声明） */
const BATCH_OPTIONS = ['第1批', '第2批', '第3批', '第4批'];

/** 各角色演示备案数量（稳定可复现）；合计 + 手工样例数 即为「备案总数」
 *  说明：数据管理部门自动种子为 3 条（常德市 / 益阳市 / 永州市），避免与手工样例「娄底市数据资源管理局」
 *  按地域公式生成出同名记录（原 4 条时第 4 条恰好落在娄底市且后缀同名，2026-10-19 修正）。 */
const ROLE_COUNTS: Record<string, number> = {
  实施机构: 8,
  运营机构: 7,
  数据管理部门: 3,
  行业主管部门: 5,
  其他经营主体: 6
};
/** 已注册但尚未完成备案的机构数量（用于「注册总数」与「备案总数」区分） */
const UNFILED_REGISTERED = 5;

// Institution 数据模型已抽至 chain-shared.ts（含链路新增的 filingManageDeptId / filingImplId）

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 【手工样例数据（数据管理部门）】
 * - 触发条件：需求要求为数据管理部门补充省本级、娄底市各一条样板记录（2026-10-19），
 *   用于补齐自动生成种子未覆盖的地市口径与省本级口径。
 * - 记录内容：省本级 → 湖南省数据资源管理局；娄底市 → 娄底市数据资源管理局。
 * - 注入方式：在种子数据生成末尾追加，id 接续自动生成的最大序号之后，保证唯一且不打乱既有记录。
 * - 可追溯/回滚：置空本数组即可移除这两条样例，其余数据不受影响。
 */
const MANUAL_SAMPLE_INSTITUTIONS: Array<Omit<Institution, 'id'>> = [
  {
    region: '省本级',
    authType: '整体授权运营',
    domain: '城市治理',
    role: '数据管理部门',
    orgName: '湖南省数据资源管理局',
    creditCode: '914301005567890128',
    filingTime: '2026-01-12 09:30:00'
  },
  {
    region: '娄底市',
    authType: '分领域授权运营',
    domain: '自然资源',
    role: '数据管理部门',
    orgName: '娄底市数据资源管理局',
    creditCode: '914313006289013455',
    filingTime: '2026-03-18 15:20:00'
  }
];

/** 演示机构数据（按角色 + 数量确定性生成，稳定可复现） */
const seedInstitutions: Institution[] = (function build() {
  const list: Institution[] = [];
  let seq = 1;
  ROLE_LIST.forEach(function (role, ri) {
    const count = ROLE_COUNTS[role] || 0;
    for (let i = 0; i < count; i++) {
      const region = REGION_OPTIONS[(ri * 3 + i * 2) % REGION_OPTIONS.length];
      const authType = AUTH_TYPE_OPTIONS[(ri + i) % 2];
      const domain = DOMAIN_OPTIONS[(ri * 2 + i * 3) % DOMAIN_OPTIONS.length];
      const month = pad(((ri * 5 + i * 3) % 9) + 1);
      const day = pad(((ri * 7 + i * 5) % 27) + 1);
      const hour = pad((ri * 3 + i * 7) % 24);
      const minute = pad((ri * 11 + i * 13) % 60);
      const second = pad((ri * 17 + i * 19) % 60);
      const filingTime = '2026-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
      const creditCode = '91430100' + String(100000000 + ((ri * 7919 + i * 104729) % 899999999)).padStart(9, '0') + String((ri * 7 + i * 3) % 10);
      const orgName = buildOrgName(role, region, domain, i);
      const batch = role === '行业主管部门' ? BATCH_OPTIONS[i % BATCH_OPTIONS.length] : undefined;
      list.push({ id: seq, region: region, authType: authType, domain: domain, role: role, orgName: orgName, creditCode: creditCode, filingTime: filingTime, batch: batch });
      seq += 1;
    }
  });
  // 追加手工样例数据（数据管理部门：省本级 / 娄底市），id 接续自动生成的最大序号
  MANUAL_SAMPLE_INSTITUTIONS.forEach(function (rec) {
    list.push({ id: seq, region: rec.region, authType: rec.authType, domain: rec.domain, role: rec.role, orgName: rec.orgName, creditCode: rec.creditCode, filingTime: rec.filingTime, batch: rec.batch });
    seq += 1;
  });
  // 建立跨角色备案归属关系（确定性、可复现）：
  //  - 每个实施机构归其备案的行业主管部门（按出现顺序轮转分配）
  //  - 每个其他经营主体归其备案的运营机构（按出现顺序轮转分配）
  const deptIds = list.filter(function (r) { return r.role === '行业主管部门'; }).map(function (r) { return r.id; });
  const operatorIds = list.filter(function (r) { return r.role === '运营机构'; }).map(function (r) { return r.id; });
  let implIdx = 0;
  let otherIdx = 0;
  list.forEach(function (r) {
    if (r.role === '实施机构') {
      r.filingDeptId = deptIds[implIdx % deptIds.length];
      implIdx += 1;
    } else if (r.role === '其他经营主体') {
      r.filingOperatorId = operatorIds[otherIdx % operatorIds.length];
      otherIdx += 1;
    }
  });
  return list;
})();
/** 建立备案关系链路新增归属边（行业主管部门→数据管理部门、运营机构→实施机构），供链路视图逐级下钻使用 */
const chainSeedInstitutions: Institution[] = applyChainRelations(seedInstitutions);

/**
 * 依据角色 + 地域 + 领域生成机构名称（稳定可复现）。
 * 命名规范：
 *  - 必须为湖南省真实企业/单位风格名称，禁止「XXX实施机构」之类虚构机构格式；
 *  - 名称末尾不得包含任何数字或编号（统一社会信用代码单独存放，不并入名称）。
 */
function buildOrgName(role: string, region: string, domain: string, i: number): string {
  if (role === '实施机构') {
    const suffix = ['信息技术有限公司', '数据科技有限公司', '智能科技有限公司', '数据治理服务有限公司', '信息科技有限公司', '软件有限公司'];
    return region + domain + suffix[i % suffix.length];
  }
  if (role === '运营机构') {
    const suffix = ['数据运营有限公司', '数字产业集团有限公司', '数据发展有限公司', '大数据运营有限公司', '数字科技有限公司'];
    return region + suffix[i % suffix.length];
  }
  if (role === '其他经营主体') {
    const suffix = ['科技服务有限公司', '数据开发有限公司', '数据产品有限公司', '信息科技服务有限公司', '数据应用有限公司'];
    return region + domain + suffix[i % suffix.length];
  }
  // 数据管理部门：湖南省属地真实单位口径（公共数据主管部门），不含数字编号
  if (role === '数据管理部门') {
    const govSuffix = ['数据资源管理局', '政务服务和数据管理局', '大数据中心'];
    return region + govSuffix[i % govSuffix.length];
  }
  // 行业主管部门：湖南省属地真实单位口径（数据主管部门），不含数字编号
  const suffix = ['数据局', '大数据管理局', '公共数据管理局'];
  return region + suffix[i % suffix.length];
}

/** 顶部统计卡片各角色配色（用于卡片左侧强调色） */
const ROLE_CARD_TONE: Record<string, string> = {
  total: '#0f63f4',
  '实施机构': '#179b55',
  '运营机构': '#b26a00',
  '数据管理部门': '#e11d48',
  '行业主管部门': '#7c3aed',
  '其他经营主体': '#0d9488'
};

const ROLE_TABS = ['全部', '数据管理部门', '行业主管部门', '实施机构', '运营机构', '其他经营主体'];

/** 跨角色归属过滤（点击「关联实施机构 / 关联其他经营主体 / 行业主管部门数量 / 关联运营机构」数字时触发） */
interface LinkFilter {
  /** dept：行业主管部门→其备案的实施机构；operator：运营机构→其备案的其他经营主体；
   *  manage：数据管理部门→其下辖行业主管部门；impl：实施机构→其备案的运营机构 */
  kind: 'dept' | 'operator' | 'manage' | 'impl';
  /** 归属主体记录 id */
  ownerId: number;
  /** 归属主体名称（用于提示条展示） */
  ownerName: string;
  /** 返回时应恢复的 Tab（即数字所在的来源 Tab） */
  fromTab: string;
}

// RoleSpecificInfo / buildRoleSpecific 已抽至 chain-shared.ts（机构清单与备案关系链路两视图共用）

/**
 * 判断是否为统筹型管理部门角色（数据管理部门 / 行业主管部门）。
 * 该类机构不绑定单一领域与授权运营类型，列表与筛选区对应维度均隐藏、单元格回填「-」。
 */
function isManageDeptRole(role: string): boolean {
  return role === '数据管理部门' || role === '行业主管部门';
}

/** 导出范围（对应导出菜单三项：全量 / 筛选结果 / 已勾选） */
type ExportScope = 'all' | 'filtered' | 'selected';

/** CSV 单元格转义：含逗号、引号、换行时以半角双引号包裹，内部引号加倍 */
function escapeCsvCell(value: string): string {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

/**
 * 生成 CSV 文件并触发浏览器下载（纯前端实现，不引入第三方依赖）。
 * 内容带 UTF-8 BOM，保证 Excel 打开中文不乱码。
 */
function downloadCsv(fileName: string, rows: string[][]): void {
  const csv = rows
    .map(function (cols) { return cols.map(escapeCsvCell).join(','); })
    .join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** 导出文件名时间戳：yyyyMMddHHmmss */
function buildTimeStamp(): string {
  const d = new Date();
  const p = function (n: number) { return String(n).padStart(2, '0'); };
  return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

const OriginalComponent = () => {
  const [activeMenu] = useState<'institution-supervision'>('institution-supervision');
  const [role, setRole] = useState('数据管理部门');

  const [records] = useState<Institution[]>(seedInstitutions);

  // 链路视图数据：在种子数据基础上补充链路归属边（行业主管部门→数据管理部门、运营机构→实施机构）
  const [chainRecords] = useState<Institution[]>(chainSeedInstitutions);

  // 页面视图切换：机构清单（默认） / 备案关系链路（chain.tsx）
  const [activeView, setActiveView] = useState<'list' | 'chain'>('list');

  // 顶部角色快捷 Tab（全部 / 各角色），切换时联动「机构角色」筛选
  const [activeRoleTab, setActiveRoleTab] = useState<string>('全部');

  // 筛选条件
  const [searchRegion, setSearchRegion] = useState('');
  const [searchAuthType, setSearchAuthType] = useState('');
  const [searchDomain, setSearchDomain] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [searchOrgName, setSearchOrgName] = useState('');
  const [searchCreditCode, setSearchCreditCode] = useState('');
  const [searchFilingTimeStart, setSearchFilingTimeStart] = useState('');
  const [searchFilingTimeEnd, setSearchFilingTimeEnd] = useState('');
  // 批次筛选（仅行业主管部门 Tab 展示）
  const [searchBatch, setSearchBatch] = useState('');

  // 列表分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 查看弹窗
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Institution | null>(null);

  // 跨角色归属过滤（点击「关联实施机构 / 关联其他经营主体」数字跳转后生效）
  const [linkFilter, setLinkFilter] = useState<LinkFilter | null>(null);

  // 导出相关：列表勾选记录 id（跨分页保留，切换角色 Tab 时清空）、导出菜单开合、导出结果轻提示
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 顶部统计卡片：实时刷新（全局汇总，不随 Tab / 筛选变化）
  const [statsLoading, setStatsLoading] = useState(false);

  const totalFiled = records.length;
  const totalRegistered = totalFiled + UNFILED_REGISTERED;
  /** 备案率（用于机构总数卡的进度摘要） */
  const filedRatePct = totalRegistered > 0 ? Math.round((totalFiled / totalRegistered) * 100) : 0;
  /** 机构总数卡地域分布：省本级 / 地市（地市 = 除省本级外的全部地域） */
  const provinceOrgCount = records.filter(function (it) { return it.region === '省本级'; }).length;
  const cityOrgCount = records.length - provinceOrgCount;
  const roleCounts = useMemo(function () {
    const map: Record<string, number> = {};
    ROLE_LIST.forEach(function (r) { map[r] = records.filter(function (it) { return it.role === r; }).length; });
    return map;
  }, [records]);
  /** 各角色卡地域分布：省本级 / 地市（地市 = 除省本级外的全部地域） */
  const roleRegionCounts = useMemo(function () {
    const map: Record<string, { province: number; city: number }> = {};
    ROLE_LIST.forEach(function (r) {
      const list = records.filter(function (it) { return it.role === r; });
      const province = list.filter(function (it) { return it.region === '省本级'; }).length;
      map[r] = { province: province, city: list.length - province };
    });
    return map;
  }, [records]);

  const showRoleColumn = activeRoleTab === '全部';
  // 批次列/筛选项仅行业主管部门 Tab 展示
  const showBatchColumn = activeRoleTab === '行业主管部门';
  // 统筹型管理部门 Tab（数据管理部门 / 行业主管部门）不展示「授权运营类型 / 领域名称」（筛选条件与列表列均隐藏，其他 Tab 正常）
  const showAuthDomain = !isManageDeptRole(activeRoleTab);
  // 跨角色备案数量列：行业主管部门 Tab 展示「关联实施机构」，运营机构 Tab 展示「关联其他经营主体」
  const showDeptImplColumn = activeRoleTab === '行业主管部门';
  const showOperatorOtherColumn = activeRoleTab === '运营机构';
  // 数据管理部门 Tab 的「行业主管部门数量」列（2026-10-19 需求去掉该列，代码保留，恒为 false）
  const showManageDeptColumn = false;
  // 实施机构 Tab 展示「关联运营机构」
  const showImplOperatorColumn = activeRoleTab === '实施机构';
  // 备案时间列列名：数据管理部门 / 行业主管部门 Tab 显示「创建时间」，其他经营主体 Tab 显示「授权时间」，全部 Tab 显示「创建/备案时间」，其余 Tab 不变
  const filingTimeLabel =
    activeRoleTab === '数据管理部门' || activeRoleTab === '行业主管部门'
      ? '创建时间'
      : activeRoleTab === '其他经营主体'
        ? '创建时间'
        : activeRoleTab === '全部' ? '创建/备案时间' : '备案时间';

  // 跨角色备案归属计数（静态数据，按归属 id 聚合）
  const deptImplCount = useMemo(function () {
    const m: Record<number, number> = {};
    records.forEach(function (r) { if (r.filingDeptId != null) { m[r.filingDeptId] = (m[r.filingDeptId] || 0) + 1; } });
    return m;
  }, [records]);
  const operatorOtherCount = useMemo(function () {
    const m: Record<number, number> = {};
    records.forEach(function (r) { if (r.filingOperatorId != null) { m[r.filingOperatorId] = (m[r.filingOperatorId] || 0) + 1; } });
    return m;
  }, [records]);
  // 数据管理部门 → 其下辖行业主管部门数量（filingManageDeptId 指向数据管理部门 id）
  const manageDeptCount = useMemo(function () {
    const m: Record<number, number> = {};
    records.forEach(function (r) { if (r.filingManageDeptId != null) { m[r.filingManageDeptId] = (m[r.filingManageDeptId] || 0) + 1; } });
    return m;
  }, [records]);
  // 实施机构 → 其备案运营机构数量（filingImplId 指向实施机构 id）
  const implOperatorCount = useMemo(function () {
    const m: Record<number, number> = {};
    records.forEach(function (r) { if (r.filingImplId != null) { m[r.filingImplId] = (m[r.filingImplId] || 0) + 1; } });
    return m;
  }, [records]);

  const handleTabChange = (tab: string) => {
    setActiveRoleTab(tab);
    setSearchRole(tab === '全部' ? '' : tab);
    // 切换 Tab 时清空批次筛选与归属过滤，避免残留条件影响其他 Tab
    setSearchBatch('');
    setLinkFilter(null);
    // 切换角色 Tab 时清空勾选：不同 Tab 的数据行不同，避免跨角色混入导出范围
    setSelectedIds([]);
    // 统筹型管理部门 Tab（数据管理部门 / 行业主管部门）隐藏「授权运营类型 / 领域名称」筛选，切入时清空其残留值
    if (isManageDeptRole(tab)) {
      setSearchAuthType('');
      setSearchDomain('');
    }
    setCurrentPage(1);
  };

  // 点击「关联实施机构」数字：跳转实施机构 Tab，仅展示该行业主管部门备案的实施机构
  const handleJumpToImpl = (dept: Institution) => {
    setLinkFilter({ kind: 'dept', ownerId: dept.id, ownerName: dept.orgName, fromTab: '行业主管部门' });
    setActiveRoleTab('实施机构');
    setSearchRole('实施机构');
    setSearchBatch('');
    setCurrentPage(1);
  };

  // 点击「关联其他经营主体」数字：跳转其他经营主体 Tab，仅展示该运营机构备案的其他经营主体
  const handleJumpToOther = (op: Institution) => {
    setLinkFilter({ kind: 'operator', ownerId: op.id, ownerName: op.orgName, fromTab: '运营机构' });
    setActiveRoleTab('其他经营主体');
    setSearchRole('其他经营主体');
    setSearchBatch('');
    setCurrentPage(1);
  };

  // 点击「行业主管部门数量」数字：跳转行业主管部门 Tab，仅展示该数据管理部门下辖的行业主管部门
  const handleJumpToManage = (dept: Institution) => {
    setLinkFilter({ kind: 'manage', ownerId: dept.id, ownerName: dept.orgName, fromTab: '数据管理部门' });
    setActiveRoleTab('行业主管部门');
    setSearchRole('行业主管部门');
    setSearchBatch('');
    setCurrentPage(1);
  };

  // 点击「关联运营机构」数字：跳转运营机构 Tab，仅展示该实施机构备案的运营机构
  const handleJumpToImplOperator = (impl: Institution) => {
    setLinkFilter({ kind: 'impl', ownerId: impl.id, ownerName: impl.orgName, fromTab: '实施机构' });
    setActiveRoleTab('运营机构');
    setSearchRole('运营机构');
    setSearchBatch('');
    setCurrentPage(1);
  };

  // 清除归属过滤，返回数字所在的来源 Tab
  const clearLinkFilter = () => {
    if (!linkFilter) return;
    const back = linkFilter.fromTab;
    setLinkFilter(null);
    setActiveRoleTab(back);
    setSearchRole(back === '全部' ? '' : back);
    setSearchBatch('');
    setCurrentPage(1);
  };

  const filteredList = useMemo(function () {
    return records.filter(function (r) {
      if (searchRegion && r.region !== searchRegion) return false;
      if (searchAuthType && r.authType !== searchAuthType) return false;
      if (searchDomain && r.domain !== searchDomain) return false;
      if (searchRole && r.role !== searchRole) return false;
      if (searchOrgName && !r.orgName.includes(searchOrgName.trim())) return false;
      if (searchCreditCode && !r.creditCode.includes(searchCreditCode.trim())) return false;
      if (searchFilingTimeStart && r.filingTime < searchFilingTimeStart) return false;
      if (searchFilingTimeEnd && r.filingTime > searchFilingTimeEnd) return false;
      if (showBatchColumn && searchBatch && !(r.batch || '').includes(searchBatch.trim())) return false;
      // 跨角色归属过滤：点击数字跳转后，仅展示归属主体的被备案机构
      if (linkFilter) {
        if (linkFilter.kind === 'dept') {
          if (r.role !== '实施机构' || r.filingDeptId !== linkFilter.ownerId) return false;
        } else if (linkFilter.kind === 'operator') {
          if (r.role !== '其他经营主体' || r.filingOperatorId !== linkFilter.ownerId) return false;
        } else if (linkFilter.kind === 'manage') {
          if (r.role !== '行业主管部门' || r.filingManageDeptId !== linkFilter.ownerId) return false;
        } else if (linkFilter.kind === 'impl') {
          if (r.role !== '运营机构' || r.filingImplId !== linkFilter.ownerId) return false;
        }
      }
      return true;
    });
  }, [records, searchRegion, searchAuthType, searchDomain, searchRole, searchOrgName, searchCreditCode, searchFilingTimeStart, searchFilingTimeEnd, showBatchColumn, searchBatch, linkFilter]);

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
    setSearchOrgName('');
    setSearchCreditCode('');
    setSearchFilingTimeStart('');
    setSearchFilingTimeEnd('');
    setSearchBatch('');
    // 角色筛选与顶部 Tab 保持一致，重置时回到当前 Tab 对应的角色
    setSearchRole(activeRoleTab === '全部' ? '' : activeRoleTab);
    // 重置时一并清除归属过滤
    setLinkFilter(null);
    setCurrentPage(1);
  };

  const handleView = (record: Institution) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  const handleRefreshStats = () => {
    setStatsLoading(true);
    window.setTimeout(function () {
      setStatsLoading(false);
    }, 500);
  };

  const roleSpecific = useMemo(function () {
    return currentRecord ? buildRoleSpecific(currentRecord) : null;
  }, [currentRecord]);

  /** 当前 Tab 角色下的全量数据（导出「全部」时使用，不受筛选条件影响） */
  const tabRoleList = useMemo(function () {
    if (activeRoleTab === '全部') return records;
    return records.filter(function (r) { return r.role === activeRoleTab; });
  }, [records, activeRoleTab]);

  /** 已勾选数据（按列表原始顺序输出） */
  const selectedList = useMemo(function () {
    return records.filter(function (r) { return selectedIds.indexOf(r.id) >= 0; });
  }, [records, selectedIds]);

  /** 当前已生效的筛选条件摘要（导出菜单中回显，便于确认导出范围） */
  const activeFilterSummary = useMemo(function () {
    const parts: string[] = [];
    if (searchRegion) parts.push('所属地域：' + searchRegion);
    if (showBatchColumn && searchBatch) parts.push('批次：' + searchBatch.trim());
    if (searchAuthType) parts.push('授权运营类型：' + searchAuthType);
    if (searchDomain) parts.push('领域名称：' + searchDomain);
    if (searchRole) parts.push('机构角色：' + searchRole);
    if (searchOrgName.trim()) parts.push('单位/企业名称：' + searchOrgName.trim());
    if (searchCreditCode.trim()) parts.push('统一社会信用代码：' + searchCreditCode.trim());
    if (searchFilingTimeStart || searchFilingTimeEnd) parts.push(filingTimeLabel + '：' + (searchFilingTimeStart || '不限') + ' 至 ' + (searchFilingTimeEnd || '不限'));
    if (linkFilter) parts.push('归属主体：' + linkFilter.ownerName);
    return parts;
  }, [searchRegion, showBatchColumn, searchBatch, searchAuthType, searchDomain, searchRole, searchOrgName, searchCreditCode, searchFilingTimeStart, searchFilingTimeEnd, linkFilter]);

  const isSelected = (id: number) => selectedIds.indexOf(id) >= 0;
  /** 当前页是否全选 / 半选（半选仅用于表头复选框的视觉提示） */
  const pageAllChecked = paginatedList.length > 0 && paginatedList.every(function (r) { return selectedIds.indexOf(r.id) >= 0; });

  const toggleRow = (id: number) => {
    setSelectedIds(function (prev) {
      return prev.indexOf(id) >= 0 ? prev.filter(function (x) { return x !== id; }) : prev.concat([id]);
    });
  };

  /** 表头复选框：勾选 / 取消当前页全部记录（跨页选择结果仍保留） */
  const toggleCurrentPage = () => {
    const pageIds = paginatedList.map(function (r) { return r.id; });
    setSelectedIds(function (prev) {
      const allIn = pageIds.length > 0 && pageIds.every(function (id) { return prev.indexOf(id) >= 0; });
      if (allIn) return prev.filter(function (id) { return pageIds.indexOf(id) < 0; });
      return prev.concat(pageIds.filter(function (id) { return prev.indexOf(id) < 0; }));
    });
  };

  /** 一次选中当前筛选结果的全部记录（不受每页条数限制） */
  const selectAllFiltered = () => {
    setSelectedIds(filteredList.map(function (r) { return r.id; }));
  };

  const clearSelection = () => setSelectedIds([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(function () { setToastMessage(''); }, 2600);
  };

  /** 导出范围清单（全量 / 筛选结果 / 已勾选），随当前 Tab 与筛选实时计算 */
  const exportScopes: Array<{ key: ExportScope; name: string; list: Institution[] }> = [
    { key: 'all', name: '导出全部数据', list: tabRoleList },
    { key: 'filtered', name: '导出当前筛选结果', list: filteredList },
    { key: 'selected', name: '导出已勾选数据', list: selectedList }
  ];

  /** 按 Tab 列结构拼装导出数据行（导出列与列表可见列保持一致） */
  const buildExportRows = (list: Institution[]) => {
    const header: string[] = ['序号'];
    if (showBatchColumn) header.push('批次');
    header.push('所属地域');
    if (showAuthDomain) header.push('授权运营类型', '领域名称');
    if (showRoleColumn) header.push('机构角色');
    header.push('单位/企业名称', '统一社会信用代码', filingTimeLabel);
    if (showDeptImplColumn) header.push('关联实施机构');
    if (showOperatorOtherColumn) header.push('关联其他经营主体');
    if (showManageDeptColumn) header.push('行业主管部门数量');
    if (showImplOperatorColumn) header.push('关联运营机构');
    const rows: string[][] = [header];
    list.forEach(function (r, idx) {
      const row: string[] = [String(idx + 1)];
      if (showBatchColumn) row.push(r.batch || '');
      row.push(r.region);
      if (showAuthDomain) {
        const blank = isManageDeptRole(r.role);
        row.push(blank ? '-' : r.authType, blank ? '-' : r.domain);
      }
      if (showRoleColumn) row.push(r.role);
      row.push(r.orgName, r.creditCode, r.filingTime);
      if (showDeptImplColumn) row.push(String(deptImplCount[r.id] || 0));
      if (showOperatorOtherColumn) row.push(String(operatorOtherCount[r.id] || 0));
      if (showManageDeptColumn) row.push(String(manageDeptCount[r.id] || 0));
      if (showImplOperatorColumn) row.push(String(implOperatorCount[r.id] || 0));
      rows.push(row);
    });
    return rows;
  };

  /** 执行导出：按所选范围生成 CSV 并下载，同时给出结果提示 */
  const handleExport = (scope: ExportScope) => {
    setShowExportMenu(false);
    const meta = exportScopes.filter(function (s) { return s.key === scope; })[0];
    if (!meta || meta.list.length === 0) {
      showToast('暂无可导出的数据，请调整导出范围或筛选条件');
      return;
    }
    const roleLabel = activeRoleTab === '全部' ? '全角色' : activeRoleTab;
    downloadCsv('机构监管名单_' + roleLabel + '_' + buildTimeStamp() + '.csv', buildExportRows(meta.list));
    showToast('已导出「' + meta.name + '」共 ' + meta.list.length + ' 条记录');
  };

  const renderStats = () => (
    <div className="stat-wrap">
      <div className="stat-header">
        <span className="stat-header-title">机构监管总览</span>
        <button className="btn btn-default btn-sm" onClick={handleRefreshStats} disabled={statsLoading}>
          <RefreshCw size={13} className={statsLoading ? 'spin' : ''} />
          {statsLoading ? '刷新中…' : '刷新'}
        </button>
      </div>
      <div className="stat-cards">
        <div className="stat-card" style={{ borderTopColor: ROLE_CARD_TONE.total }}>
          <div className="stat-title">
            机构总数
            {/* 口径说明：同一机构可拥有多个角色，各角色数量之和可能大于机构总数（悬浮气泡提示） */}
            <span className="stat-hint" data-tip="同一机构可能拥有多个角色，各角色数量之和可能大于机构总数">?</span>
          </div>
          <div className="stat-main" style={{ color: ROLE_CARD_TONE.total }}>{totalRegistered}</div>
          <div className="stat-total-foot">
            <div className="stat-progress" role="presentation">
              <span style={{ width: filedRatePct + '%', background: ROLE_CARD_TONE.total }} />
            </div>
            <div className="stat-total-caption">已备案 {totalFiled}（ 省本级 {provinceOrgCount} · 地市 {cityOrgCount} ）· 待备案 {UNFILED_REGISTERED}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderTopColor: ROLE_CARD_TONE['数据管理部门'] }}>
          <div className="stat-title">数据管理部门数量</div>
          <div className="stat-main" style={{ color: ROLE_CARD_TONE['数据管理部门'] }}>{roleCounts['数据管理部门']}</div>
          <div className="stat-region-row">
            <span className="stat-region-item">省本级 <b>{roleRegionCounts['数据管理部门'].province}</b></span>
            <span className="stat-region-item">地市 <b>{roleRegionCounts['数据管理部门'].city}</b></span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTopColor: ROLE_CARD_TONE['行业主管部门'] }}>
          <div className="stat-title">行业主管部门数量</div>
          <div className="stat-main" style={{ color: ROLE_CARD_TONE['行业主管部门'] }}>{roleCounts['行业主管部门']}</div>
          <div className="stat-region-row">
            <span className="stat-region-item">省本级 <b>{roleRegionCounts['行业主管部门'].province}</b></span>
            <span className="stat-region-item">地市 <b>{roleRegionCounts['行业主管部门'].city}</b></span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTopColor: ROLE_CARD_TONE['实施机构'] }}>
          <div className="stat-title">实施机构数量</div>
          <div className="stat-main" style={{ color: ROLE_CARD_TONE['实施机构'] }}>{roleCounts['实施机构']}</div>
          <div className="stat-region-row">
            <span className="stat-region-item">省本级 <b>{roleRegionCounts['实施机构'].province}</b></span>
            <span className="stat-region-item">地市 <b>{roleRegionCounts['实施机构'].city}</b></span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTopColor: ROLE_CARD_TONE['运营机构'] }}>
          <div className="stat-title">运营机构数量</div>
          <div className="stat-main" style={{ color: ROLE_CARD_TONE['运营机构'] }}>{roleCounts['运营机构']}</div>
          <div className="stat-region-row">
            <span className="stat-region-item">省本级 <b>{roleRegionCounts['运营机构'].province}</b></span>
            <span className="stat-region-item">地市 <b>{roleRegionCounts['运营机构'].city}</b></span>
          </div>
        </div>
        <div className="stat-card" style={{ borderTopColor: ROLE_CARD_TONE['其他经营主体'] }}>
          <div className="stat-title">其他经营主体数量</div>
          <div className="stat-main" style={{ color: ROLE_CARD_TONE['其他经营主体'] }}>{roleCounts['其他经营主体']}</div>
          <div className="stat-region-row">
            <span className="stat-region-item">省本级 <b>{roleRegionCounts['其他经营主体'].province}</b></span>
            <span className="stat-region-item">地市 <b>{roleRegionCounts['其他经营主体'].city}</b></span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoleTabs = () => (
    <div className="role-tabs">
      {ROLE_TABS.map(function (tab) {
        return (
          <button
            key={tab}
            type="button"
            className={'role-tab' + (activeRoleTab === tab ? ' active' : '')}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );

  const renderFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        {showBatchColumn && (
          <div className="filter-item">
            <label>批次</label>
            <input
              type="text"
              placeholder="请输入"
              value={searchBatch}
              onChange={(e) => setSearchBatch(e.target.value)}
            />
          </div>
        )}
        <RegionCascader value={searchRegion} onChange={setSearchRegion} />
        {showAuthDomain && (
          <div className="filter-item filter-item-select">
            <label>授权运营类型</label>
            <select value={searchAuthType} onChange={(e) => setSearchAuthType(e.target.value)}>
              <option value="">请选择</option>
              {AUTH_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        {showAuthDomain && (
          <div className="filter-item filter-item-select">
            <label>领域名称</label>
            <select value={searchDomain} onChange={(e) => setSearchDomain(e.target.value)}>
              <option value="">请选择</option>
              {DOMAIN_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        {showRoleColumn && (
          <div className="filter-item filter-item-select">
            <label>机构角色</label>
            <select value={searchRole} onChange={(e) => setSearchRole(e.target.value)}>
              <option value="">请选择</option>
              {ROLE_LIST.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="filter-row">
        <div className="filter-item">
          <label>单位/企业名称</label>
          <input type="text" placeholder="请输入" value={searchOrgName} onChange={(e) => setSearchOrgName(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>统一社会信用代码</label>
          <input type="text" placeholder="请输入" value={searchCreditCode} onChange={(e) => setSearchCreditCode(e.target.value)} />
        </div>
        {/* 时间筛选槽位（列名随 Tab 变化：创建时间 / 授权时间 / 创建·备案时间 / 备案时间），槽位内以「起 至 止」形式选择日期范围 */}
        <div className="filter-item">
          <label>{filingTimeLabel}</label>
          <div className="date-range-control">
            <input
              type="date"
              aria-label={`${filingTimeLabel}起`}
              value={searchFilingTimeStart}
              onChange={(e) => setSearchFilingTimeStart(e.target.value)}
            />
            <span className="date-range-sep">至</span>
            <input
              type="date"
              aria-label={`${filingTimeLabel}止`}
              value={searchFilingTimeEnd}
              onChange={(e) => setSearchFilingTimeEnd(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="filter-actions">
        <div className="filter-actions-left">
          <button className="btn btn-primary btn-sm" onClick={handleQuery}>查询</button>
          <button className="btn btn-default btn-sm" onClick={handleReset}>重置</button>
          {/* 导出入口：紧随【查询】【重置】之后，点击展开导出范围菜单 */}
          {renderExportDropdown()}
        </div>
      </div>
    </div>
  );

  const renderLinkFilterBanner = () => {
    if (!linkFilter) return null;
    const targetLabel =
      linkFilter.kind === 'dept' ? '实施机构'
        : linkFilter.kind === 'operator' ? '其他经营主体'
          : linkFilter.kind === 'manage' ? '行业主管部门'
            : '运营机构';
    return (
      <div className="link-filter-banner">
        <span className="link-filter-text">
          正在查看：<b>{linkFilter.ownerName}</b> {linkFilter.kind === 'operator' ? '授权的' : '备案的'}{targetLabel}（共 {filteredList.length} 条）
        </span>
        <button className="btn btn-default btn-sm" onClick={clearLinkFilter}>
          返回{linkFilter.fromTab}列表
        </button>
      </div>
    );
  };

  /**
   * 导出下拉（导出入口）：2026-10-19 按需求调整，放置于筛选区【查询】【重置】按钮之后。
   * 点击展开范围选择菜单（全量 / 当前筛选结果 / 已勾选），并回显当前生效筛选条件。
   */
  const renderExportDropdown = () => (
    <div className="export-dropdown-wrap">
      <button
        type="button"
        className={'btn btn-default btn-sm export-btn' + (showExportMenu ? ' active' : '')}
        onClick={() => setShowExportMenu(function (v) { return !v; })}
      >
        <Download size={13} />
        导出
        <ChevronDown size={13} className={'export-caret' + (showExportMenu ? ' open' : '')} />
      </button>
      {showExportMenu && (
        <Fragment>
          <div className="export-menu-mask" onClick={() => setShowExportMenu(false)} />
          <div className="export-menu">
            {exportScopes.map(function (s) {
              const disabled = s.list.length === 0;
              return (
                <button
                  key={s.key}
                  type="button"
                  className="export-menu-item"
                  disabled={disabled}
                  onClick={() => handleExport(s.key)}
                >
                  <span className="export-item-name">{s.name}</span>
                </button>
              );
            })}
          </div>
        </Fragment>
      )}
    </div>
  );

  /**
   * 列表工具条：位于筛选区与列表表格之间的列表卡顶部。
   * 左侧显示当前结果数与勾选状态（支持全选筛选结果 / 清空勾选）。
   * （导出入口已移至筛选区【查询】【重置】之后，此工具条不再承载导出按钮。）
   */
  const renderListToolbar = () => (
    <div className="list-toolbar">
      <div className="list-toolbar-left">
        {selectedIds.length > 0 ? (
          <Fragment>
            <span className="list-toolbar-selected">已勾选 <b>{selectedIds.length}</b> 条</span>
            <button type="button" className="toolbar-link" onClick={clearSelection}>清空勾选</button>
          </Fragment>
        ) : (
          <button
            type="button"
            className="toolbar-link"
            onClick={selectAllFiltered}
            disabled={filteredList.length === 0}
          >
            选择全部筛选结果
          </button>
        )}
      </div>
    </div>
  );

  const renderTable = () => (
    <div className="table-section">
      {renderListToolbar()}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input
                  type="checkbox"
                  aria-label="全选本页"
                  checked={pageAllChecked}
                  onChange={toggleCurrentPage}
                  disabled={paginatedList.length === 0}
                />
              </th>
              <th className="col-index">序号</th>
              {showBatchColumn && <th className="col-batch">批次</th>}
              <th className="col-region">所属地域</th>
              {showAuthDomain && <th className="col-auth-type">授权运营类型</th>}
              {showAuthDomain && <th className="col-domain">领域名称</th>}
              {showRoleColumn && <th className="col-role">机构角色</th>}
              <th className="col-org">单位/企业名称</th>
              <th className="col-credit">统一社会信用代码</th>
              <th className="col-filing-time">{filingTimeLabel}</th>
              {showDeptImplColumn && <th className="col-rel">关联实施机构</th>}
              {showOperatorOtherColumn && <th className="col-rel">关联其他经营主体</th>}
              {showManageDeptColumn && <th className="col-rel">行业主管部门数量</th>}
              {showImplOperatorColumn && <th className="col-rel">关联运营机构</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={1 + (showAuthDomain ? 7 : 5) + (showRoleColumn ? 1 : 0) + (showBatchColumn ? 1 : 0) + (showDeptImplColumn ? 1 : 0) + (showOperatorOtherColumn ? 1 : 0) + (showManageDeptColumn ? 1 : 0) + (showImplOperatorColumn ? 1 : 0)} className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  暂无数据
                </td>
              </tr>
            ) : (
              paginatedList.map((record, index) => (
                <tr key={record.id} className={isSelected(record.id) ? 'row-selected' : ''}>
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      aria-label={'选择 ' + record.orgName}
                      checked={isSelected(record.id)}
                      onChange={() => toggleRow(record.id)}
                    />
                  </td>
                  <td className="col-index">{(safePage - 1) * pageSize + index + 1}</td>
                  {showBatchColumn && <td className="col-batch">{record.batch}</td>}
                  <td className="col-region">{record.region}</td>
                  {showAuthDomain && <td className="col-auth-type">{isManageDeptRole(record.role) ? '-' : record.authType}</td>}
                  {showAuthDomain && <td className="col-domain">{isManageDeptRole(record.role) ? '-' : record.domain}</td>}
                  {showRoleColumn && <td className="col-role"><span className="role-tag">{record.role}</span></td>}
                  <td className="col-org" title={record.orgName}>{record.orgName}</td>
                  <td className="col-credit">{record.creditCode}</td>
                  <td className="col-filing-time">{record.filingTime}</td>
                  {showDeptImplColumn && (
                    <td className="col-rel">
                      {(deptImplCount[record.id] || 0) > 0
                        ? <button className="link-number" onClick={() => handleJumpToImpl(record)} title="点击查看该主管部门备案的实施机构">{deptImplCount[record.id] || 0}</button>
                        : <span>0</span>}
                    </td>
                  )}
                  {showOperatorOtherColumn && (
                    <td className="col-rel">
                      {(operatorOtherCount[record.id] || 0) > 0
                        ? <button className="link-number" onClick={() => handleJumpToOther(record)} title="点击查看该运营机构授权的其他经营主体">{operatorOtherCount[record.id] || 0}</button>
                        : <span>0</span>}
                    </td>
                  )}
                  {showManageDeptColumn && (
                    <td className="col-rel">
                      {(manageDeptCount[record.id] || 0) > 0
                        ? <button className="link-number" onClick={() => handleJumpToManage(record)} title="点击查看该数据管理部门下辖的行业主管部门">{manageDeptCount[record.id] || 0}</button>
                        : <span>0</span>}
                    </td>
                  )}
                  {showImplOperatorColumn && (
                    <td className="col-rel">
                      {(implOperatorCount[record.id] || 0) > 0
                        ? <button className="link-number" onClick={() => handleJumpToImplOperator(record)} title="点击查看该实施机构备案的运营机构">{implOperatorCount[record.id] || 0}</button>
                        : <span>0</span>}
                    </td>
                  )}
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
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
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
    if (!currentRecord || !roleSpecific) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
        <div className="modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>机构备案详情</h3>
            <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="section-title"><span className="title-bar"></span>基本信息</div>
            <div className="view-info-grid">
              <div className="info-label">单位/企业名称</div>
              <div className="info-value-span">{currentRecord.orgName}</div>
              <div className="info-label">统一社会信用代码</div>
              <div className="info-value">{currentRecord.creditCode}</div>
              <div className="info-label">所属地域</div>
              <div className="info-value">{currentRecord.region}</div>
              <div className="info-label">授权运营类型</div>
              <div className="info-value">{currentRecord.authType}</div>
              <div className="info-label">领域名称</div>
              <div className="info-value">{currentRecord.domain}</div>
              <div className="info-label">机构角色</div>
              <div className="info-value"><span className="role-tag">{currentRecord.role}</span></div>
              <div className="info-label">{filingTimeLabel}</div>
              <div className="info-value">{currentRecord.filingTime}</div>
            </div>

            <div className="section-title"><span className="title-bar"></span>{roleSpecific.title}</div>
            <div className="view-info-grid">
              {roleSpecific.items.map((it, idx) => (
                <Fragment key={idx}>
                  <div className="info-label">{it.label}</div>
                  {it.span
                    ? <div className="info-value-span">{it.value}</div>
                    : <div className="info-value">{it.value}</div>}
                </Fragment>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-default" onClick={() => setShowViewModal(false)}>关闭</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout
      activeMenu={activeMenu}
      breadcrumb="机构监管"
      role={role}
      onRoleChange={setRole}
      roleOptions={['数据管理部门']}
      title="机构监管"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      {renderStats()}

      {/* 视图切换：机构清单（默认，原有逻辑） / 备案关系链路（chain.tsx）。
          2026-10-19 需求去掉「备案关系链路」入口：整个切换条 display:none 隐藏（代码保留），
          activeView 恒为 'list'，页面仅展示机构清单视图；链路视图代码（chain.tsx）未删除。 */}
      <div className="view-switch" role="tablist" aria-label="页面视图切换" style={{ display: 'none' }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'list'}
          className={'view-switch-item' + (activeView === 'list' ? ' active' : '')}
          onClick={() => setActiveView('list')}
        >
          机构清单
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'chain'}
          className={'view-switch-item' + (activeView === 'chain' ? ' active' : '')}
          onClick={() => setActiveView('chain')}
        >
          备案关系链路
        </button>
      </div>

      {activeView === 'chain' ? (
        <FilingChainView records={chainRecords} />
      ) : (
        <Fragment>
          {renderRoleTabs()}
          {renderFilter()}
          {linkFilter && renderLinkFilterBanner()}
          {renderTable()}
        </Fragment>
      )}

      {activeView === 'list' && showViewModal && renderViewModal()}
      {toastMessage && <div className="export-toast">{toastMessage}</div>}
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

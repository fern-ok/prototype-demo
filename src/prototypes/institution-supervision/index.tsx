/**
 * @name 机构监管
 * @mode axure
 *
 * 机构监管页面（数据管理部门视角），归属「其他」一级菜单下的二级菜单。
 * 采用【单页面 + 角色 Tab 筛选】方案：顶部全局统计卡片、角色快捷 Tab、筛选区、机构列表、查看弹窗。
 * 点击查看时，根据机构角色动态渲染对应角色专属备案信息。
 */

import { Fragment, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Layout from '../../common/Layout';
import RegionCascader from '../../common/RegionCascader';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
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
/** 机构角色枚举（全局监管覆盖的全部类型；行业主管部门与其他经营主体位置已互换） */
const ROLE_LIST = ['实施机构', '运营机构', '行业主管部门', '其他经营主体'];
const AUTH_TYPE_OPTIONS = ['整体授权运营', '分领域授权运营'];
const DOMAIN_OPTIONS = ['医疗健康', '交通运输', '教育', '文化旅游', '自然资源', '城市治理', '金融服务', '工业制造', '智慧农业', '应急管理'];
const REGION_OPTIONS = ['省本级', '长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西土家族苗族自治州'];

/** 批次枚举（行业主管部门专属字段；须在种子数据生成之前声明） */
const BATCH_OPTIONS = ['第1批', '第2批', '第3批', '第4批'];

/** 各角色演示备案数量（稳定可复现），合计即为「备案总数」 */
const ROLE_COUNTS: Record<string, number> = {
  实施机构: 8,
  运营机构: 7,
  行业主管部门: 5,
  其他经营主体: 6
};
/** 已注册但尚未完成备案的机构数量（用于「注册总数」与「备案总数」区分） */
const UNFILED_REGISTERED = 5;

interface Institution {
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
  /** 备案归属：实施机构记录指向其备案的行业主管部门 id */
  filingDeptId?: number;
  /** 备案归属：其他经营主体记录指向其备案的运营机构 id */
  filingOperatorId?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

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
  // 行业主管部门：湖南省属地真实单位口径（数据主管部门），不含数字编号
  const suffix = ['数据局', '大数据管理局', '公共数据管理局'];
  return region + suffix[i % suffix.length];
}

/** 顶部统计卡片各角色配色（用于卡片左侧强调色） */
const ROLE_CARD_TONE: Record<string, string> = {
  total: '#0f63f4',
  '实施机构': '#179b55',
  '运营机构': '#b26a00',
  '行业主管部门': '#7c3aed',
  '其他经营主体': '#0d9488'
};

const ROLE_TABS = ['全部', '行业主管部门', '实施机构', '运营机构', '其他经营主体'];

/** 跨角色归属过滤（点击「已备案实施机构 / 已备案其他经营主体」数字时触发） */
interface LinkFilter {
  /** dept：按行业主管部门 id 过滤其备案的实施机构；operator：按运营机构 id 过滤其备案的其他经营主体 */
  kind: 'dept' | 'operator';
  /** 归属主体（行业主管部门 / 运营机构）的记录 id */
  ownerId: number;
  /** 归属主体名称（用于提示条展示） */
  ownerName: string;
  /** 返回时应恢复的 Tab（即数字所在的来源 Tab） */
  fromTab: string;
}

interface RoleSpecificInfo {
  title: string;
  items: Array<{ label: string; value: string; span?: boolean }>;
}

/** 依据机构角色动态派生角色专属备案信息（内容暂定，按角色分支渲染） */
function buildRoleSpecific(record: Institution): RoleSpecificInfo {
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

const OriginalComponent = () => {
  const [activeMenu] = useState<'institution-supervision'>('institution-supervision');
  const [role, setRole] = useState('数据管理部门');

  const [records] = useState<Institution[]>(seedInstitutions);

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

  // 跨角色归属过滤（点击「已备案实施机构 / 已备案其他经营主体」数字跳转后生效）
  const [linkFilter, setLinkFilter] = useState<LinkFilter | null>(null);

  // 顶部统计卡片：实时刷新（全局汇总，不随 Tab / 筛选变化）
  const [statsLoading, setStatsLoading] = useState(false);

  const totalFiled = records.length;
  const totalRegistered = totalFiled + UNFILED_REGISTERED;
  /** 备案率（用于机构总数卡的进度摘要） */
  const filedRatePct = totalRegistered > 0 ? Math.round((totalFiled / totalRegistered) * 100) : 0;
  const roleCounts = useMemo(function () {
    const map: Record<string, number> = {};
    ROLE_LIST.forEach(function (r) { map[r] = records.filter(function (it) { return it.role === r; }).length; });
    return map;
  }, [records]);

  const showRoleColumn = activeRoleTab === '全部';
  // 批次列/筛选项仅行业主管部门 Tab 展示
  const showBatchColumn = activeRoleTab === '行业主管部门';
  // 行业主管部门 Tab 不展示「授权运营类型 / 领域名称」（筛选条件与列表列均隐藏，其他 Tab 正常）
  const showAuthDomain = activeRoleTab !== '行业主管部门';
  // 跨角色备案数量列：行业主管部门 Tab 展示「已备案实施机构」，运营机构 Tab 展示「已备案其他经营主体」
  const showDeptImplColumn = activeRoleTab === '行业主管部门';
  const showOperatorOtherColumn = activeRoleTab === '运营机构';

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

  const handleTabChange = (tab: string) => {
    setActiveRoleTab(tab);
    setSearchRole(tab === '全部' ? '' : tab);
    // 切换 Tab 时清空批次筛选与归属过滤，避免残留条件影响其他 Tab
    setSearchBatch('');
    setLinkFilter(null);
    // 行业主管部门 Tab 隐藏「授权运营类型 / 领域名称」筛选，切入时清空其残留值
    if (tab === '行业主管部门') {
      setSearchAuthType('');
      setSearchDomain('');
    }
    setCurrentPage(1);
  };

  // 点击「已备案实施机构」数字：跳转实施机构 Tab，仅展示该行业主管部门备案的实施机构
  const handleJumpToImpl = (dept: Institution) => {
    setLinkFilter({ kind: 'dept', ownerId: dept.id, ownerName: dept.orgName, fromTab: '行业主管部门' });
    setActiveRoleTab('实施机构');
    setSearchRole('实施机构');
    setSearchBatch('');
    setCurrentPage(1);
  };

  // 点击「已备案其他经营主体」数字：跳转其他经营主体 Tab，仅展示该运营机构备案的其他经营主体
  const handleJumpToOther = (op: Institution) => {
    setLinkFilter({ kind: 'operator', ownerId: op.id, ownerName: op.orgName, fromTab: '运营机构' });
    setActiveRoleTab('其他经营主体');
    setSearchRole('其他经营主体');
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
        } else {
          if (r.role !== '其他经营主体' || r.filingOperatorId !== linkFilter.ownerId) return false;
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
          <div className="stat-title">机构总数</div>
          <div className="stat-main" style={{ color: ROLE_CARD_TONE.total }}>{totalRegistered}</div>
          <div className="stat-total-foot">
            <div className="stat-progress" role="presentation">
              <span style={{ width: filedRatePct + '%', background: ROLE_CARD_TONE.total }} />
            </div>
            <div className="stat-total-caption">已备案 {totalFiled} · 待备案 {UNFILED_REGISTERED}</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderTopColor: ROLE_CARD_TONE['行业主管部门'] }}>
          <div className="stat-title">行业主管部门数量</div>
          <div className="stat-main stat-main-center" style={{ color: ROLE_CARD_TONE['行业主管部门'] }}>{roleCounts['行业主管部门']}</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: ROLE_CARD_TONE['实施机构'] }}>
          <div className="stat-title">实施机构数量</div>
          <div className="stat-main stat-main-center" style={{ color: ROLE_CARD_TONE['实施机构'] }}>{roleCounts['实施机构']}</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: ROLE_CARD_TONE['运营机构'] }}>
          <div className="stat-title">运营机构数量</div>
          <div className="stat-main stat-main-center" style={{ color: ROLE_CARD_TONE['运营机构'] }}>{roleCounts['运营机构']}</div>
        </div>
        <div className="stat-card" style={{ borderTopColor: ROLE_CARD_TONE['其他经营主体'] }}>
          <div className="stat-title">其他经营主体数量</div>
          <div className="stat-main stat-main-center" style={{ color: ROLE_CARD_TONE['其他经营主体'] }}>{roleCounts['其他经营主体']}</div>
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
        {/* 备案时间：单个筛选槽位，槽位内以「起 至 止」形式选择日期范围 */}
        <div className="filter-item">
          <label>备案时间</label>
          <div className="date-range-control">
            <input
              type="date"
              aria-label="备案时间起"
              value={searchFilingTimeStart}
              onChange={(e) => setSearchFilingTimeStart(e.target.value)}
            />
            <span className="date-range-sep">至</span>
            <input
              type="date"
              aria-label="备案时间止"
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
        </div>
      </div>
    </div>
  );

  const renderLinkFilterBanner = () => {
    if (!linkFilter) return null;
    const targetLabel = linkFilter.kind === 'dept' ? '实施机构' : '其他经营主体';
    return (
      <div className="link-filter-banner">
        <span className="link-filter-text">
          正在查看：<b>{linkFilter.ownerName}</b> 备案的{targetLabel}（共 {filteredList.length} 条）
        </span>
        <button className="btn btn-default btn-sm" onClick={clearLinkFilter}>
          返回{linkFilter.fromTab}列表
        </button>
      </div>
    );
  };

  const renderTable = () => (
    <div className="table-section">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-index">序号</th>
              {showBatchColumn && <th className="col-batch">批次</th>}
              <th className="col-region">所属地域</th>
              {showAuthDomain && <th className="col-auth-type">授权运营类型</th>}
              {showAuthDomain && <th className="col-domain">领域名称</th>}
              {showRoleColumn && <th className="col-role">机构角色</th>}
              <th className="col-org">单位/企业名称</th>
              <th className="col-credit">统一社会信用代码</th>
              <th className="col-filing-time">备案时间</th>
              {showDeptImplColumn && <th className="col-rel">已备案实施机构</th>}
              {showOperatorOtherColumn && <th className="col-rel">已备案其他经营主体</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={(showAuthDomain ? 7 : 5) + (showRoleColumn ? 1 : 0) + (showBatchColumn ? 1 : 0) + (showDeptImplColumn ? 1 : 0) + (showOperatorOtherColumn ? 1 : 0)} className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  暂无数据
                </td>
              </tr>
            ) : (
              paginatedList.map((record, index) => (
                <tr key={record.id}>
                  <td className="col-index">{(safePage - 1) * pageSize + index + 1}</td>
                  {showBatchColumn && <td className="col-batch">{record.batch}</td>}
                  <td className="col-region">{record.region}</td>
                  {showAuthDomain && <td className="col-auth-type">{record.role === '行业主管部门' ? '-' : record.authType}</td>}
                  {showAuthDomain && <td className="col-domain">{record.role === '行业主管部门' ? '-' : record.domain}</td>}
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
                        ? <button className="link-number" onClick={() => handleJumpToOther(record)} title="点击查看该运营机构备案的其他经营主体">{operatorOtherCount[record.id] || 0}</button>
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
              <div className="info-label">备案时间</div>
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
      {renderRoleTabs()}
      {renderFilter()}
      {linkFilter && renderLinkFilterBanner()}
      {renderTable()}

      {showViewModal && renderViewModal()}
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

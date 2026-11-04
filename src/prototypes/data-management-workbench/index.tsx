/**
 * @name 数据管理部门工作台
 * @mode axure
 *
 * 数据管理部门登录后台后的工作台首页，复用后台公共 Layout。
 * 主体内容严格参考用户提供的设计图：数据范围、统计项（机构数据 / 资源与产品 / 产品流通）、
 * 授权业务漏斗、待办备案、快捷入口。
 */

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Building2,
  Landmark,
  Factory,
  Store,
  Briefcase,
  Database,
  KeyRound,
  Boxes,
  LayoutGrid,
  FileText,
  Layers,
  ShoppingCart,
  Activity,
  Wallet,
  PieChart,
  HardDrive,
  Users,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

/* ───────────────────────── 数据范围 ───────────────────────── */

const REGION_OPTIONS = ['全省', '省本级', '地市', '长沙市', '株洲市'] as const;
const DOMAIN_OPTIONS = ['全部', '整体', '医疗健康'] as const;
const TIME_OPTIONS = ['全部时间', '近7天', '近30天', '近90天', '本年', '自定义'] as const;
// 「近90天」按需求不在下拉中展示，原枚举值与映射保留
const VISIBLE_TIME_OPTIONS = TIME_OPTIONS.filter(opt => opt !== '近90天');

const PRESET_DAYS: Record<string, number> = { '近7天': 7, '近30天': 30, '近90天': 90 };

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TODAY = new Date();
const TODAY_TEXT = formatDate(TODAY);
const YEAR_START_TEXT = `${TODAY.getFullYear()}-01-01`;

/** 快捷周期 → 起止日期；「全部时间」清空区间，「自定义」保留用户已选区间 */
const resolveTimeRange = (preset: string): { start: string; end: string } | null => {
  if (preset === '自定义') return null;
  if (preset === '全部时间') return { start: '', end: '' };
  const end = new Date(TODAY);
  const start = new Date(TODAY);
  if (preset === '本年') {
    start.setMonth(0, 1);
  } else {
    start.setDate(start.getDate() - ((PRESET_DAYS[preset] ?? 30) - 1));
  }
  return { start: formatDate(start), end: formatDate(end) };
};

const ScopeSelect = ({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className="dmw-scope-select" ref={ref}>
      <button type="button" className={'dmw-scope-trigger' + (open ? ' open' : '')} onClick={() => setOpen(v => !v)}>
        <span className="dmw-scope-current">{value}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="dmw-scope-menu" role="listbox">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              className={'dmw-scope-option' + (opt === value ? ' active' : '')}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      <span className="dmw-scope-tag">{label}</span>
    </div>
  );
};

/* ───────────────────────── 统计项（三类分组） ───────────────────────── */

type StatTone = 'blue' | 'violet' | 'green' | 'orange' | 'teal' | 'red' | 'indigo';

interface StatItem {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  tone: StatTone;
  /** 仅机构数据组：点击数字跳转机构监管页对应角色 Tab */
  href?: string;
}

interface StatGroup {
  title: string;
  items: StatItem[];
}

/** 机构监管页角色 Tab 直达链接（roleTab 由机构监管页读取并自动定位） */
const institutionTabHref = (tab: string) => `/prototypes/institution-supervision.html?roleTab=${encodeURIComponent(tab)}`;

const statGroups: StatGroup[] = [
  {
    title: '机构数据',
    items: [
      { icon: <Building2 size={22} />, label: '数据管理部门', value: '5', unit: '家', tone: 'blue', href: institutionTabHref('数据管理部门') },
      { icon: <Landmark size={22} />, label: '行业主管部门', value: '5', unit: '家', tone: 'violet', href: institutionTabHref('行业主管部门') },
      { icon: <Factory size={22} />, label: '实施机构', value: '8', unit: '家', tone: 'teal', href: institutionTabHref('实施机构') },
      { icon: <Store size={22} />, label: '运营机构', value: '7', unit: '家', tone: 'green', href: institutionTabHref('运营机构') },
      { icon: <Briefcase size={22} />, label: '其他经营主体', value: '6', unit: '家', tone: 'orange', href: institutionTabHref('其他经营主体') },
    ],
  },
  {
    title: '资源与产品',
    items: [
      { icon: <Database size={22} />, label: '数据资源登记', value: '246', unit: '个', tone: 'blue' },
      { icon: <KeyRound size={22} />, label: '数据资源授权', value: '195', unit: '次', tone: 'violet' },
      { icon: <Boxes size={22} />, label: '基础数据产品', value: '93', unit: '个', tone: 'teal' },
      { icon: <LayoutGrid size={22} />, label: '场景发布', value: '12', unit: '个', tone: 'green' },
      { icon: <Layers size={22} />, label: '再开发数据产品', value: '16', unit: '个', tone: 'indigo' },
    ],
  },
  {
    title: '产品流通',
    items: [
      { icon: <Boxes size={22} />, label: '流通数据产品', value: '76', unit: '个', tone: 'blue' },
      { icon: <ShoppingCart size={22} />, label: '有效交易订单', value: '676', unit: '单', tone: 'violet' },
      { icon: <Activity size={22} />, label: '调用成功次数', value: '1.89', unit: '万次', tone: 'teal' },
      { icon: <Wallet size={22} />, label: '产品订单总额', value: '1.0111', unit: '亿元', tone: 'red' },
      { icon: <PieChart size={22} />, label: '产品流通率', value: '33.33', unit: '%', tone: 'indigo' },
    ],
  },
];

/* ───────────────────────── 授权业务漏斗 ───────────────────────── */

interface FunnelStage {
  label: string;
  value: number;
  unit: string;
}

const resourceFunnel: FunnelStage[] = [
  { label: '资源编目', value: 246, unit: '个' },
  { label: '资源登记', value: 230, unit: '个' },
  { label: '资源挂载', value: 210, unit: '个' },
  { label: '资源授权', value: 195, unit: '次' },
];

const productFunnel: FunnelStage[] = [
  { label: '产品编目', value: 109, unit: '个' },
  { label: '安全审查', value: 98, unit: '个' },
  { label: '产品登记', value: 95, unit: '个' },
  { label: '产品上架', value: 89, unit: '个' },
  { label: '产品授权/交易', value: 76, unit: '笔' },
];

const Funnel = ({ title, stages, lossHref, lossTarget }: {
  title: string;
  stages: FunnelStage[];
  lossHref: string;
  lossTarget: string;
}) => {
  const maxValue = Math.max(...stages.map(s => s.value));
  // 宽度随阶段序号递减，呈现漏斗收窄效果；底部保留 68% 下限，保证末级节点信息完整展示
  const widthFor = (index: number) => 100 - index * (32 / (stages.length - 1));

  return (
    <div className="dmw-funnel">
      <div className="dmw-funnel-title">{title}</div>
      <div className="dmw-funnel-body">
        {stages.map((stage, index) => {
          const loss = index < stages.length - 1 ? stages[index].value - stages[index + 1].value : 0;
          return (
            <React.Fragment key={stage.label}>
              <div
                className="dmw-funnel-stage"
                style={{ width: `${widthFor(index)}%`, background: `linear-gradient(90deg, var(--dmw-funnel-${index % 2 ? 'b' : 'a'}), var(--dmw-funnel-${index % 2 ? 'a' : 'b'}))` }}
              >
                <span className="dmw-funnel-stage-label">{stage.label}</span>
                <span className="dmw-funnel-stage-value">
                  {stage.value.toLocaleString()}
                  <em>{stage.unit}</em>
                  <i>{Math.round((stage.value / maxValue) * 100)}%</i>
                </span>
              </div>
              {index < stages.length - 1 && (
                <div className="dmw-funnel-connector">
                  {/* 箭头与流失量合成一个整体，居中显示；点击跳转对应监管/产品库页面 */}
                  <a
                    className="dmw-funnel-loss"
                    href={lossHref}
                    title={`流失 ${loss} ${stages[index].unit}，点击查看${lossTarget}`}
                  >
                    <span className="dmw-funnel-connector-arrow" aria-hidden="true">
                      <svg viewBox="0 0 20 12" width="14" height="10"><path d="M2 2l8 8 8-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    流失 {loss}
                    <em>{stages[index].unit}</em>
                  </a>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ───────────────────────── 待办备案 ───────────────────────── */

interface FilingTodo {
  id: number;
  region: string;
  authType: string;
  domain: string;
  filingType: string;
  createdAt: string;
  href: string;
}

const todoSeed: FilingTodo[] = [
  { id: 1, region: '长沙市', authType: '医疗健康', domain: '医疗健康', filingType: '实施机构备案', createdAt: '2026-10-28 09:12', href: '/prototypes/implementation-org-filing.html' },
  { id: 2, region: '株洲市', authType: '整体', domain: '交通运输', filingType: '实施方案备案', createdAt: '2026-10-27 16:45', href: '/prototypes/implementation-plan-filing.html' },
  { id: 3, region: '省本级', authType: '整体', domain: '政务服务', filingType: '运营机构备案', createdAt: '2026-10-27 11:30', href: '/prototypes/operation-org-filing.html' },
  { id: 4, region: '常德市', authType: '金融', domain: '金融服务', filingType: '运营协议备案', createdAt: '2026-10-26 14:08', href: '/prototypes/operation-agreement-filing.html' },
  { id: 5, region: '益阳市', authType: '整体', domain: '文化旅游', filingType: '其他经营主体备案', createdAt: '2026-10-25 10:21', href: '/prototypes/other-entity-filing.html' },
  { id: 6, region: '永州市', authType: '医疗健康', domain: '医疗健康', filingType: '产品和服务清单备案', createdAt: '2026-10-24 17:55', href: '/prototypes/product-service-filing.html' },
];

/* ───────────────────────── 快捷入口 ───────────────────────── */

const quickEntries: Array<{ icon: ReactNode; label: string; tone: StatTone; href: string }> = [
  { icon: <Database size={20} />, label: '数据资源', tone: 'blue', href: '/prototypes/data-resource-catalog.html' },
  { icon: <KeyRound size={20} />, label: '数据资源授权', tone: 'violet', href: '/prototypes/data-resource-auth.html' },
  { icon: <Boxes size={20} />, label: '基础数据产品', tone: 'teal', href: '/prototypes/product-lifecycle.html' },
  { icon: <ShieldCheck size={20} />, label: '基础数据产品授权', tone: 'green', href: '/prototypes/data-resource-auth.html' },
  { icon: <Layers size={20} />, label: '再开发数据产品', tone: 'orange', href: '/prototypes/redev-data-product-supervision.html' },
  { icon: <ShoppingCart size={20} />, label: '数据产品交易', tone: 'indigo', href: '/prototypes/product-subscription-supervision.html' },
];

/* ───────────────────────── 地市推进排行 ───────────────────────── */

interface CityRankRow {
  rank: string;
  city: string;
  resource: string;
  product: string;
  amount: string;
  /** 排名徽章配色：前三名高亮，其余灰色，最后一行为汇总省略行 */
  tone: 'first' | 'second' | 'third' | 'rest' | 'more';
}

/**
 * 展示前 9 名地市 + 「其他5市州」汇总行（按交易额降序）。
 * 合计与工作台统计口径一致：资源登记 246 个、产品上架 89 个、交易额 10111 万（1.0111 亿元）。
 */
const cityRankRows: CityRankRow[] = [
  { rank: '1', city: '长沙', resource: '68', product: '24', amount: '4200', tone: 'first' },
  { rank: '2', city: '株洲', resource: '42', product: '15', amount: '2100', tone: 'second' },
  { rank: '3', city: '岳阳', resource: '31', product: '10', amount: '1200', tone: 'third' },
  { rank: '4', city: '常德', resource: '25', product: '8', amount: '800', tone: 'rest' },
  { rank: '5', city: '益阳', resource: '18', product: '5', amount: '400', tone: 'rest' },
  { rank: '6', city: '湘潭', resource: '16', product: '7', amount: '300', tone: 'rest' },
  { rank: '7', city: '衡阳', resource: '14', product: '6', amount: '260', tone: 'rest' },
  { rank: '8', city: '郴州', resource: '12', product: '5', amount: '220', tone: 'rest' },
  { rank: '9', city: '邵阳', resource: '10', product: '5', amount: '180', tone: 'rest' },
  { rank: '···', city: '其他5市州', resource: '10', product: '4', amount: '451', tone: 'more' },
];

/** 可排序的数值列：点击表头切换排序字段，再次点击切换倒序 / 正序 */
type RankSortKey = 'resource' | 'product' | 'amount';
type RankSortDir = 'desc' | 'asc';

const RANK_SORT_COLUMNS: Array<{ key: RankSortKey; head: string; label: string }> = [
  { key: 'resource', head: '资源登记', label: '资源登记' },
  { key: 'product', head: '产品上架', label: '产品上架' },
  { key: 'amount', head: '交易额(万)', label: '交易额' },
];

/* ───────────────────────── 主体 ───────────────────────── */

const OriginalComponent = () => {
  const [region, setRegion] = useState<string>('全省');
  const [domain, setDomain] = useState<string>('全部');

  /* 时间范围：快捷周期与起止日期联动 */
  const [timePreset, setTimePreset] = useState<string>('本年');
  const [timeStart, setTimeStart] = useState<string>(YEAR_START_TEXT);
  const [timeEnd, setTimeEnd] = useState<string>(TODAY_TEXT);

  const handleTimePreset = (v: string) => {
    setTimePreset(v);
    const range = resolveTimeRange(v);
    if (range) { setTimeStart(range.start); setTimeEnd(range.end); }
  };
  const handleTimeStart = (v: string) => {
    setTimeStart(v);
    setTimePreset('自定义');
    if (v && timeEnd && v > timeEnd) setTimeEnd(v);
  };
  const handleTimeEnd = (v: string) => {
    setTimeEnd(v);
    setTimePreset('自定义');
    if (v && timeStart && v < timeStart) setTimeStart(v);
  };

  /* 地市推进排行：三列均可排序，默认按交易额倒序（数量大的在前） */
  const [rankSort, setRankSort] = useState<{ key: RankSortKey; dir: RankSortDir }>({ key: 'amount', dir: 'desc' });
  const handleRankSort = (key: RankSortKey) => {
    setRankSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      : { key, dir: 'desc' });
  };
  /** 「其他5市州」为汇总行，固定置于末尾、不参与名次排序 */
  const sortedRankRows = useMemo(() => {
    const detail = cityRankRows.filter(row => row.tone !== 'more');
    const summary = cityRankRows.filter(row => row.tone === 'more');
    const factor = rankSort.dir === 'desc' ? -1 : 1;
    const sorted = [...detail].sort((a, b) => (Number(a[rankSort.key]) - Number(b[rankSort.key])) * factor);
    return [...sorted, ...summary];
  }, [rankSort]);
  const rankSortLabel = RANK_SORT_COLUMNS.find(col => col.key === rankSort.key)?.label ?? '交易额';

  /* 待办分页 */
  const [todoPage, setTodoPage] = useState(1);
  const [todoPageSize, setTodoPageSize] = useState(10);
  const todoTotalPages = Math.max(1, Math.ceil(todoSeed.length / todoPageSize));
  const safeTodoPage = Math.min(todoPage, todoTotalPages);
  const pagedTodos = todoSeed.slice((safeTodoPage - 1) * todoPageSize, safeTodoPage * todoPageSize);

  return (
    <Layout
      activeMenu="data-management-workbench"
      breadcrumb="数据管理部门工作台"
      role="数据管理部门"
      onRoleChange={() => {}}
      roleOptions={['数据管理部门']}
      title="数据管理部门工作台"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      <div className="dmw-page">
        {/* 数据范围：置于页面顶部，整行内容居左显示 */}
        <section className="dmw-scope-bar" aria-label="数据范围">
          <span className="dmw-scope-label">数据范围：</span>
          <span className="dmw-scope-prefix">您正在查看</span>
          <ScopeSelect label="" value={region} options={REGION_OPTIONS} onChange={setRegion} />
          <ScopeSelect label="" value={domain} options={DOMAIN_OPTIONS} onChange={setDomain} />
          <span className="dmw-scope-suffix">领域</span>
          {/* 时间筛选插入「领域」与「的」之间；「时间范围：」文字与分隔线按要求隐藏，代码保留 */}
          <span className="dmw-scope-divider" aria-hidden="true" />
          <span className="dmw-scope-label dmw-scope-time-label">时间范围：</span>
          <ScopeSelect label="" value={timePreset} options={VISIBLE_TIME_OPTIONS} onChange={handleTimePreset} />
          {/* 仅「自定义」展示起止日期区间，其余枚举值下不出现 */}
          {timePreset === '自定义' && (
            <div className="dmw-scope-date-range" aria-label="时间范围">
              <input
                type="date"
                className="dmw-scope-date"
                value={timeStart}
                max={timeEnd || undefined}
                onChange={e => handleTimeStart(e.target.value)}
                aria-label="开始日期"
                title="开始日期"
              />
              <span className="dmw-scope-date-sep">至</span>
              <input
                type="date"
                className="dmw-scope-date"
                value={timeEnd}
                min={timeStart || undefined}
                onChange={e => handleTimeEnd(e.target.value)}
                aria-label="结束日期"
                title="结束日期"
              />
            </div>
          )}
          <span className="dmw-scope-suffix">的数据</span>
        </section>

        {/* 2×2 布局：左上概览 / 右上待办 / 左下方漏斗 / 右下方快捷入口 */}
        <div className="dmw-grid">
          <div className="dmw-col dmw-col-left">
            {/* 统计项（三类分组，标题与统计数同一行） */}
            <section className="dmw-panel dmw-stats-panel" aria-labelledby="dmw-stats-title">
              <div className="dmw-stat-groups">
                {statGroups.map(group => (
                  <div className="dmw-stat-group" key={group.title}>
                    <h3 className="dmw-stat-group-title">{group.title}</h3>
                    <div className="dmw-stat-group-grid">
                      {group.items.map(item => (
                        <div className={'dmw-stat-card ' + item.tone} key={item.label}>
                          <div className={'dmw-stat-icon ' + item.tone}>{item.icon}</div>
                          <div className="dmw-stat-body">
                            <span className="dmw-stat-label">{item.label}</span>
                            {item.href ? (
                              <a
                                className="dmw-stat-value dmw-stat-value-link"
                                href={item.href}
                                title={`点击查看${item.label}列表`}
                              >
                                <strong>{item.value}</strong>
                                <em>{item.unit}</em>
                              </a>
                            ) : (
                              <span className="dmw-stat-value">
                                <strong>{item.value}</strong>
                                <em>{item.unit}</em>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 快捷入口（紧凑排布，置于统计项与授权业务漏斗之间） */}
            <section className="dmw-panel dmw-quick-panel" aria-labelledby="dmw-quick-title">
              <h2 className="dmw-panel-title" id="dmw-quick-title">快捷入口</h2>
              <div className="dmw-quick-grid">
                {quickEntries.map(item => (
                  <a className="dmw-quick-item" key={item.label} href={item.href}>
                    <span className={'dmw-quick-icon ' + item.tone}>{item.icon}</span>
                    <span className="dmw-quick-label">{item.label}</span>
                  </a>
                ))}
              </div>
            </section>

            {/* 授权业务漏斗（数据资源在左，数据产品在右） */}
            <section className="dmw-panel dmw-funnel-panel" aria-labelledby="dmw-funnel-title">
              <h2 className="dmw-panel-title" id="dmw-funnel-title">授权业务漏斗</h2>
              <div className="dmw-funnel-wrap">
                <Funnel
                  title="数据资源"
                  stages={resourceFunnel}
                  lossHref="/prototypes/pending-data-resource-catalog.html"
                  lossTarget="数据资源编目监管"
                />
                <Funnel
                  title="数据产品"
                  stages={productFunnel}
                  lossHref="/prototypes/product-lifecycle.html"
                  lossTarget="产品库"
                />
              </div>
            </section>

          </div>

          <div className="dmw-col dmw-col-right">
            {/* 待办 */}
            <section className="dmw-panel dmw-todo-panel" aria-labelledby="dmw-todo-title">
              <div className="dmw-panel-head-row">
                <h2 className="dmw-panel-title" id="dmw-todo-title">待办</h2>
                <span className="dmw-todo-count">共 {todoSeed.length} 条备案待处理</span>
              </div>
              <div className="dmw-table-wrap">
                <table className="dmw-table">
                  <thead>
                    <tr>
                      <th>所属地域</th>
                      <th>授权运营类型</th>
                      <th>领域名称</th>
                      <th>备案类型</th>
                      <th>创建时间</th>
                      <th className="dmw-col-action">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTodos.map(row => (
                      <tr key={row.id}>
                        <td>{row.region}</td>
                        <td>{row.authType}</td>
                        <td>{row.domain}</td>
                        <td><span className="dmw-filing-tag">{row.filingType}</span></td>
                        <td className="dmw-cell-time">{row.createdAt}</td>
                        <td className="dmw-col-action">
                          <a className="dmw-handle-link" href={row.href}>处理</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="dmw-pagination">
                <span className="dmw-pagination-info">共 {todoSeed.length} 条记录</span>
                <div className="dmw-pagination-controls">
                  <button type="button" className="dmw-page-btn" disabled={safeTodoPage === 1} onClick={() => setTodoPage(1)}>首页</button>
                  <button type="button" className="dmw-page-btn" disabled={safeTodoPage === 1} onClick={() => setTodoPage(Math.max(1, safeTodoPage - 1))}>上一页</button>
                  {Array.from({ length: todoTotalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      type="button"
                      className={'dmw-page-number' + (safeTodoPage === p ? ' active' : '')}
                      onClick={() => setTodoPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button type="button" className="dmw-page-btn" disabled={safeTodoPage === todoTotalPages} onClick={() => setTodoPage(Math.min(todoTotalPages, safeTodoPage + 1))}>下一页</button>
                  <button type="button" className="dmw-page-btn" disabled={safeTodoPage === todoTotalPages} onClick={() => setTodoPage(todoTotalPages)}>末页</button>
                  <select
                    className="dmw-page-size"
                    value={todoPageSize}
                    onChange={e => { setTodoPageSize(Number(e.target.value)); setTodoPage(1); }}
                  >
                    <option value={10}>10条/页</option>
                    <option value={20}>20条/页</option>
                    <option value={50}>50条/页</option>
                  </select>
                  <span className="dmw-jump-to">跳至</span>
                  <input
                    type="text"
                    className="dmw-page-input"
                    value={safeTodoPage}
                    onChange={e => {
                      const n = Number(e.target.value);
                      if (!Number.isFinite(n)) return;
                      setTodoPage(Math.min(todoTotalPages, Math.max(1, Math.trunc(n))));
                    }}
                  />
                  <span className="dmw-jump-to">页</span>
                </div>
              </div>
            </section>

            {/* 地市推进排行（按交易额） */}
            <section className="dmw-panel dmw-rank-panel" aria-labelledby="dmw-rank-title">
              <div className="dmw-rank-head">
                <h2 className="dmw-panel-title" id="dmw-rank-title">地市推进排行</h2>
                {/* 排序规则说明：默认按交易额降序，表头点击可切换字段与升/降序 */}
                <span className="dmw-rank-note">（默认按照交易额降序排列）</span>
              </div>
              <div className="dmw-rank-table-wrap">
                <table className="dmw-rank-table">
                  <thead>
                    <tr>
                      <th>排名</th>
                      <th>地市</th>
                      {RANK_SORT_COLUMNS.map(col => {
                        const active = rankSort.key === col.key;
                        const nextDir: RankSortDir = active && rankSort.dir === 'asc' ? 'desc' : active ? 'asc' : 'desc';
                        return (
                          <th
                            key={col.key}
                            className="dmw-rank-sortable"
                            aria-sort={active ? (rankSort.dir === 'desc' ? 'descending' : 'ascending') : 'none'}
                          >
                            <button
                              type="button"
                              className={'dmw-rank-sort-btn' + (active ? ' active' : '')}
                              onClick={() => handleRankSort(col.key)}
                              title={`点击按${col.label}${nextDir === 'desc' ? '倒序' : '正序'}排列`}
                            >
                              {col.head}
                              <span className="dmw-rank-sort-ind" aria-hidden="true">
                                {active ? (rankSort.dir === 'desc' ? '↓' : '↑') : '↕'}
                              </span>
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRankRows.map((row, index) => {
                      const isSummary = row.tone === 'more';
                      const badgeTone = isSummary ? 'more' : index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : 'rest';
                      return (
                        <tr key={row.city}>
                          <td><span className={'dmw-rank-badge ' + badgeTone}>{isSummary ? '···' : index + 1}</span></td>
                          <td className="dmw-rank-city">{row.city}</td>
                          <td>{row.resource}</td>
                          <td>{row.product}</td>
                          <td className="dmw-rank-amount">{row.amount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}

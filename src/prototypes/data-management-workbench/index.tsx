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
}

interface StatGroup {
  title: string;
  items: StatItem[];
}

const statGroups: StatGroup[] = [
  {
    title: '机构数据',
    items: [
      { icon: <Building2 size={22} />, label: '数据管理部门', value: '5', unit: '家', tone: 'blue' },
      { icon: <Landmark size={22} />, label: '行业主管部门', value: '5', unit: '家', tone: 'violet' },
      { icon: <Factory size={22} />, label: '实施机构', value: '8', unit: '家', tone: 'teal' },
      { icon: <Store size={22} />, label: '运营机构', value: '7', unit: '家', tone: 'green' },
      { icon: <Briefcase size={22} />, label: '其他经营主体', value: '6', unit: '家', tone: 'orange' },
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

const Funnel = ({ title, stages }: { title: string; stages: FunnelStage[] }) => {
  const maxValue = Math.max(...stages.map(s => s.value));
  // 宽度随阶段序号递减，呈现漏斗收窄效果
  const widthFor = (index: number) => 100 - index * (index === 0 ? 0 : Math.round(74 / (stages.length - 1)));

  return (
    <div className="dmw-funnel">
      <div className="dmw-funnel-title">{title}</div>
      <div className="dmw-funnel-body">
        {stages.map((stage, index) => (
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
              <span className="dmw-funnel-connector" aria-hidden="true">
                <svg viewBox="0 0 20 12" width="20" height="12"><path d="M2 2l8 8 8-8" fill="none" stroke="#aeb9c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            )}
          </React.Fragment>
        ))}
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

/* ───────────────────────── 主体 ───────────────────────── */

const OriginalComponent = () => {
  const [region, setRegion] = useState<string>('全省');
  const [domain, setDomain] = useState<string>('全部');

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
                            <span className="dmw-stat-value">
                              <strong>{item.value}</strong>
                              <em>{item.unit}</em>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 授权业务漏斗（数据资源在左，数据产品在右） */}
            <section className="dmw-panel dmw-funnel-panel" aria-labelledby="dmw-funnel-title">
              <h2 className="dmw-panel-title" id="dmw-funnel-title">授权业务漏斗</h2>
              <div className="dmw-funnel-wrap">
                <Funnel title="数据资源" stages={resourceFunnel} />
                <Funnel title="数据产品" stages={productFunnel} />
              </div>
            </section>

          </div>

          <div className="dmw-col dmw-col-right">
            {/* 数据范围 */}
            <section className="dmw-scope-bar" aria-label="数据范围">
              <span className="dmw-scope-label">数据范围：</span>
              <span className="dmw-scope-prefix">您正在查看</span>
              <ScopeSelect label="" value={region} options={REGION_OPTIONS} onChange={setRegion} />
              <ScopeSelect label="" value={domain} options={DOMAIN_OPTIONS} onChange={setDomain} />
              <span className="dmw-scope-suffix">领域的数据</span>
            </section>

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

            {/* 快捷入口 */}
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

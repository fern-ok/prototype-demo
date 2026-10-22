/**
 * @name 公共布局组件
 * @mode axure
 *
 * 提供统一的侧边栏和顶部栏布局，供各业务页面复用
 */

import { ChevronDown, DatabaseZap, FileText, FolderOpen, History, Home, ShieldCheck, Shield, FileSearch, FileCheck, KeyRound, X, Bell, LayoutDashboard, ClipboardList, ListTree, Settings2, Search, Monitor, Workflow, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect, useRef, createElement, type ReactNode, type ComponentType, type MouseEvent as ReactMouseEvent } from 'react';
import messageTemplateTable from '../database/message-templates.json';
import './layout.css';

export const ROLE_OPTIONS = ['运营机构', '实施机构', '数据管理部门'];

export interface NotificationTemplate {
  id: number;
  businessStage: string;
  messageType: string;
  recipient: string;
  template: string;
  triggerAction: string;
  updateTime?: string;
}

// 默认消息通知模板（共54条），所有后台页面共享
const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = messageTemplateTable.records.map(item => ({
  id: item.id,
  businessStage: item.businessStage,
  messageType: item.messageType,
  recipient: item.recipient,
  template: item.template,
  triggerAction: item.triggerAction,
  updateTime: item.updateTime
}));

/* ============================================================
 * 侧边栏菜单数据（公共数据资源授权运营管理平台）
 * 一级链接 + 分组菜单统一数据化，便于菜单搜索过滤与高亮
 * ========================================================== */
type NavLeaf = { key: string; label: string; kind?: 'link' | 'action' };
type NavEntry =
  | { type: 'link'; key: string; label: string; icon: LucideIcon; href: string; external?: boolean }
  | { type: 'group'; key: string; label: string; icon: LucideIcon; items: NavLeaf[] }
  | { type: 'divider'; key: string; label: string };

const SIDEBAR_MENU: NavEntry[] = [
  { type: 'link', key: 'other-entity-workbench', label: '其他经营主体工作台', icon: LayoutDashboard, href: '/prototypes/other-entity-workbench.html' },
  { type: 'link', key: 'monitoring-dashboard', label: '监控大屏', icon: Monitor, href: '/prototypes/monitoring-dashboard.html', external: true },
  { type: 'link', key: 'unified-catalog-query', label: '统一目录查询', icon: Search, href: '/prototypes/unified-catalog-query.html' },
  {
    type: 'group',
    key: '备案管理',
    label: '备案管理',
    icon: FolderOpen,
    items: [
      { key: 'implementation-org-filing', label: '实施机构备案' },
      { key: 'implementation-plan-joint-review', label: '实施方案联审' },
      { key: 'implementation-plan-filing', label: '实施方案备案' },
      { key: 'operation-org-filing', label: '运营机构备案' },
      { key: 'operation-agreement-filing', label: '运营协议备案' },
      { key: 'other-entity-filing', label: '其他经营主体备案' },
      { key: 'product-service-filing', label: '产品和服务清单备案' },
      { key: 'auth-record', label: '授权记录', kind: 'action' }
    ]
  },
  { type: 'link', key: 'product-security-review', label: '产品安全审查', icon: ShieldCheck, href: '/prototypes/product-security-review.html' },
  { type: 'link', key: 'product-registration', label: '产品登记', icon: ClipboardList, href: '/prototypes/product-registration.html' },
  { type: 'link', key: 'data-resource-catalog', label: '数据资源目录', icon: ListTree, href: '/prototypes/data-resource-catalog.html' },
  { type: 'link', key: 'data-resource-auth', label: '数据资源授权/申请', icon: KeyRound, href: '/prototypes/data-resource-auth.html' },
  { type: 'link', key: 'data-resource-review', label: '数据资源初审', icon: FileSearch, href: '/prototypes/data-resource-review.html' },
  { type: 'link', key: 'data-resource-recheck', label: '数据资源复审', icon: FileCheck, href: '/prototypes/data-resource-recheck.html' },
  { type: 'link', key: 'product-lifecycle', label: '产品库', icon: Workflow, href: '/prototypes/product-lifecycle.html' },
  {
    type: 'group',
    key: '授权监管',
    label: '授权监管',
    icon: Shield,
    items: [
      { key: 'product-subscription-supervision', label: '产品交易监管' },
      { key: 'subscription-order-supervision', label: '订单交付监管' },
      { key: 'redev-data-product-supervision', label: '再开发数据产品监管' }
    ]
  },
  { type: 'link', key: 'demand-management', label: '需求管理', icon: FileText, href: '/prototypes/demand-management.html' },
  {
    type: 'group',
    key: '系统管理',
    label: '系统管理',
    icon: Settings2,
    items: [
      { key: 'domain-management', label: '领域管理' },
      { key: 'industry-dept-management', label: '行业主管部门管理' }
    ]
  },
  {
    type: 'group',
    key: '其他',
    label: '其他',
    icon: Layers,
    items: [
      { key: 'institution-supervision', label: '机构监管' },
      { key: 'business-overview', label: '业务概览' }
    ]
  },
  { type: 'divider', key: 'undetermined-requirements-divider', label: '未确定需求' },
  {
    type: 'group',
    key: 'pending-filing-management',
    label: '备案管理',
    icon: FolderOpen,
    items: [
      { key: 'pending-implementation-org-filing', label: '实施机构备案' },
      { key: 'pending-implementation-plan-filing', label: '实施方案备案' },
      { key: 'pending-operation-org-filing', label: '运营机构备案' },
      { key: 'pending-operation-agreement-filing', label: '运营协议备案' }
    ]
  }
];

/* ============================================================
 * SPA 局部切换：侧边栏切换模块时动态加载目标页面组件，
 * 宿主 Layout（首个实例）保留侧边栏等外层框架，仅替换中央内容区；
 * 被加载页面内部的 Layout 实例以「嵌入模式」渲染（无侧边栏），避免重复外壳。
 * ========================================================== */
type SpaRemoteComponent = ComponentType<any>;

/* 各页面 style.css 使用全局类名（如 .form-grid / .form-item），SPA 局部切换时
 * 上一个页面注入的 <style> 会残留在 head 中，与新页面同名规则冲突导致样式错乱。
 * 这里记录每次 SPA 加载新注入的样式节点，切换到下一个模块前统一移除。 */
let spaInjectedStyleNodes: HTMLElement[] = [];

/* dev 环境下模块一旦被 import 过就会进入 ESM 缓存，再次进入同一模块不会重新注入
 * 样式节点；如果上次切走时已把样式移除，页面就会残留上一个页面的样式（典型表现：
 * 运营协议备案弹窗被其他备案页的双列 .form-grid 覆盖）。因此切走前先按模块 key
 * 存档样式文本，重复进入且没有新注入时用存档还原。 */
const spaStyleArchive = new Map<string, Array<{ text: string; media: string | null }>>();

function collectHeadStyleNodes(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('head style, head link[rel="stylesheet"]'));
}

function archiveSpaStyles(key: string | null) {
  if (!key || spaInjectedStyleNodes.length === 0) return;
  const entries = spaInjectedStyleNodes
    .filter(node => node.tagName === 'STYLE' && node.isConnected)
    .map(node => ({ text: node.textContent || '', media: node.getAttribute('media') }))
    .filter(entry => entry.text.trim().length > 0);
  if (entries.length > 0) spaStyleArchive.set(key, entries);
}

function dropSpaInjectedStyles() {
  spaInjectedStyleNodes.forEach(node => {
    if (node.parentNode) node.parentNode.removeChild(node);
  });
  spaInjectedStyleNodes = [];
}

function trackSpaInjectedStyles(before: HTMLElement[]) {
  const beforeSet = new Set(before);
  spaInjectedStyleNodes = collectHeadStyleNodes().filter(node => !beforeSet.has(node));
}

function restoreArchivedStyles(key: string) {
  const entries = spaStyleArchive.get(key);
  if (!entries || entries.length === 0) return;
  entries.forEach(entry => {
    const style = document.createElement('style');
    style.setAttribute('data-axhub-spa-style', key);
    if (entry.media) style.setAttribute('media', entry.media);
    style.textContent = entry.text;
    document.head.appendChild(style);
    spaInjectedStyleNodes.push(style);
  });
}

// dev 环境通过 vite 源码路由动态 import（vite root 为 src，/prototypes/<key>/index.tsx 即源码路径）；
// 构建产物环境下通过脚本标签执行目标页面的 IIFE 并借助 __AXHUB_DEFINE_COMPONENT__ 捕获组件。
async function loadSpaModuleComponent(key: string, previousKey: string | null): Promise<SpaRemoteComponent | null> {
  archiveSpaStyles(previousKey);
  dropSpaInjectedStyles();
  const stylesBeforeLoad = collectHeadStyleNodes();
  const w = window as any;
  try {
    if (typeof w.DevTemplateBootstrap !== 'undefined') {
      const mod: any = await import(/* @vite-ignore */ `/prototypes/${key}/index.tsx`);
      return (mod?.default ?? null) as SpaRemoteComponent | null;
    }
    return await new Promise<SpaRemoteComponent | null>((resolve, reject) => {
      const previousHook = typeof w.__AXHUB_DEFINE_COMPONENT__ === 'function' ? w.__AXHUB_DEFINE_COMPONENT__ : null;
      let captured: SpaRemoteComponent | null = null;
      w.__AXHUB_DEFINE_COMPONENT__ = (comp: SpaRemoteComponent) => {
        captured = comp;
        return comp;
      };
      const script = document.createElement('script');
      script.src = `./${key}.js`;
      script.async = false;
      script.onload = () => {
        if (previousHook) w.__AXHUB_DEFINE_COMPONENT__ = previousHook;
        else delete w.__AXHUB_DEFINE_COMPONENT__;
        resolve(captured);
      };
      script.onerror = () => {
        if (previousHook) w.__AXHUB_DEFINE_COMPONENT__ = previousHook;
        else delete w.__AXHUB_DEFINE_COMPONENT__;
        reject(new Error(`模块脚本加载失败: ${key}.js`));
      };
      document.body.appendChild(script);
    });
  } finally {
    trackSpaInjectedStyles(stylesBeforeLoad);
    // 模块命中 ESM 缓存时不会注入新样式，改用存档还原本页样式
    if (spaInjectedStyleNodes.length === 0) restoreArchivedStyles(key);
  }
}

interface LayoutProps {
  children: ReactNode;
  activeMenu: 'implement-org-workbench' | 'other-entity-workbench' | 'product-service-filing' | 'operation-agreement-filing' | 'implementation-plan-joint-review' | 'other-entity-filing' | 'product-registration' | 'product-security-review' | 'data-resource-catalog' | 'data-resource-auth' | 'data-resource-review' | 'data-resource-recheck' | 'product-lifecycle' | 'product-subscription-supervision' | 'subscription-order-supervision' | 'redev-data-product-supervision' | 'demand-management' | 'domain-management' | 'industry-dept-management' | 'unified-catalog-query' | 'monitoring-dashboard' | 'implementation-org-filing' | 'implementation-plan-filing' | 'operation-org-filing' | 'institution-supervision' | 'business-overview' | 'pending-implementation-org-filing' | 'pending-implementation-plan-filing' | 'pending-operation-org-filing' | 'pending-operation-agreement-filing';
  breadcrumb: string;
  role: string;
  onRoleChange: (role: string) => void;
  onAuthRecordClick?: () => void;
  title?: string;
  specContent?: string;
  changeLogContent?: string;
  roleOptions?: string[];
  notificationTemplates?: NotificationTemplate[];
}

const Layout = ({ children, activeMenu, breadcrumb, role, onRoleChange, onAuthRecordClick, title, specContent, changeLogContent, roleOptions, notificationTemplates }: LayoutProps) => {
  // 默认使用通用消息通知模板（共54条），如果页面传入则使用页面传入的
  const templates = notificationTemplates && notificationTemplates.length > 0 ? notificationTemplates : DEFAULT_NOTIFICATION_TEMPLATES;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showChangeLogModal, setShowChangeLogModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [menuKeyword, setMenuKeyword] = useState('');

  // 本实例是否为「嵌入模式」（仅实例创建时判定一次：
  // 宿主实例创建早于标记设置，被加载页面的 Layout 创建于标记设置之后）
  const [isEmbeddedInstance] = useState(() => (window as any).__AXHUB_SPA_EMBEDDED__ === '1');
  const [remoteModule, setRemoteModule] = useState<{ key: string; element: ReactNode } | null>(null);
  const [loadingModuleKey, setLoadingModuleKey] = useState<string | null>(null);
  const loadingModuleRef = useRef(false);
  const remoteModuleRef = useRef<{ key: string; element: ReactNode } | null>(null);
  remoteModuleRef.current = remoteModule;

  // 切换模块：动态加载目标页面组件并替换中央内容区（外层侧边栏保持挂载）
  const navigateToModule = useCallback(async (key: string, push: boolean) => {
    if (loadingModuleRef.current || remoteModuleRef.current?.key === key) return;
    loadingModuleRef.current = true;
    setLoadingModuleKey(key);
    try {
      const Comp = await loadSpaModuleComponent(key, remoteModuleRef.current?.key ?? activeMenu);
      if (!Comp) throw new Error('模块未导出组件');
      (window as any).__AXHUB_SPA_EMBEDDED__ = '1';
      if (push) window.history.pushState({ axhubSpaModule: key }, '', `/prototypes/${key}.html`);
      setRemoteModule({ key, element: createElement(Comp) });
    } catch {
      // 兜底：动态加载失败时回退为整页跳转，保证功能可用
      window.location.href = `/prototypes/${key}.html`;
    } finally {
      loadingModuleRef.current = false;
      setLoadingModuleKey(null);
    }
  }, []);

  // 浏览器前进/后退：仅处理 SPA pushState 产生的历史记录，恢复对应模块
  useEffect(() => {
    const onPopState = () => {
      const match = window.location.pathname.match(/\/prototypes\/([^/]+?)(?:\.html)?$/);
      const key = match ? match[1] : '';
      if (!key || key === (remoteModuleRef.current?.key ?? activeMenu)) return;
      void navigateToModule(key, false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navigateToModule, activeMenu]);

  // 侧边栏导航点击：拦截默认整页跳转，改为局部加载（修饰键点击保留浏览器默认行为）
  const handleSpaNavClick = (e: ReactMouseEvent<HTMLAnchorElement>, key: string) => {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    void navigateToModule(key, true);
  };

  // 当前应高亮的模块 key（宿主初始页 or 已加载的远程模块）
  const effectiveActiveMenu = remoteModule ? remoteModule.key : activeMenu;

  // 菜单搜索：输入关键字实时过滤菜单，分组自动展开，命中文本高亮
  const searching = menuKeyword.trim().length > 0;

  const visibleMenu = useMemo<NavEntry[]>(() => {
    const kw = menuKeyword.trim().toLowerCase();
    if (!kw) return SIDEBAR_MENU;
    const result: NavEntry[] = [];
    SIDEBAR_MENU.forEach(entry => {
      if (entry.type === 'divider') return;
      if (entry.type === 'link') {
        if (entry.label.toLowerCase().includes(kw)) result.push(entry);
        return;
      }
      const selfMatch = entry.label.toLowerCase().includes(kw);
      const items = selfMatch ? entry.items : entry.items.filter(it => it.label.toLowerCase().includes(kw));
      if (items.length > 0) result.push({ ...entry, items });
    });
    return result;
  }, [menuKeyword]);

  // 命中关键字高亮（不区分大小写）
  const renderNavText = (text: string) => {
    const kw = menuKeyword.trim();
    if (!kw) return text;
    const idx = text.toLowerCase().indexOf(kw.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="nav-hl">{text.slice(idx, idx + kw.length)}</mark>
        {text.slice(idx + kw.length)}
      </>
    );
  };

  // 一级菜单（如统一目录查询）没有父级分类，面包屑直接展示 首页 / 当前页
  const parentMenu = (activeMenu === 'unified-catalog-query' || activeMenu === 'product-lifecycle')
    ? ''
    : (activeMenu === 'domain-management' || activeMenu === 'industry-dept-management') ? '系统管理'
      : (activeMenu === 'product-security-review' || activeMenu === 'product-registration' || activeMenu === 'data-resource-catalog' || activeMenu === 'data-resource-review' || activeMenu === 'data-resource-recheck') ? '数据产品开发管理'
    : (activeMenu === 'implement-org-workbench' || activeMenu === 'other-entity-workbench') ? '工作台'
        : (activeMenu === 'product-subscription-supervision' || activeMenu === 'subscription-order-supervision' || activeMenu === 'redev-data-product-supervision') ? '授权监管'
          : (activeMenu === 'institution-supervision' || activeMenu === 'business-overview') ? '其他'
          : activeMenu === 'demand-management' ? '需求管理'
            : '备案管理';

  const toggleGroup = (groupName: string) => {
    if (sidebarCollapsed) return;
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const topHeaderNode = (
    <header className="top-header">
      <div className="breadcrumb">
        <span>首页</span>
        <span className="separator">/</span>
        {parentMenu && (
          <>
            <span>{parentMenu}</span>
            <span className="separator">/</span>
          </>
        )}
        <span className="current">{breadcrumb}</span>
      </div>
      <div className="header-right">
        <a className="spec-btn" href="/prototypes/index.html">
          <Home size={14} />
          <span>版本管理</span>
        </a>
        {specContent && (
          <button className="spec-btn" type="button" onClick={() => setShowSpecModal(true)}>
            <FileText size={14} />
            <span>页面说明</span>
          </button>
        )}
        {changeLogContent && (
          <button className="spec-btn" type="button" onClick={() => setShowChangeLogModal(true)}>
            <History size={14} />
            <span>原型修改记录</span>
          </button>
        )}
        <div className="role-switcher" onMouseLeave={() => setRoleDropdownOpen(false)}>
          <button className={'role-switch-trigger ' + (roleDropdownOpen ? 'open' : '')} type="button" onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}>
            <span>{role}</span>
            <ChevronDown aria-hidden="true" />
          </button>
          {roleDropdownOpen && (
            <div className="role-switch-menu">
              {(roleOptions || ROLE_OPTIONS).map(roleOption => (
                <button key={roleOption} className={'role-switch-option ' + (roleOption === role ? 'active' : '')} type="button" onClick={() => { onRoleChange(roleOption); setRoleDropdownOpen(false); }}>
                  {roleOption}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="header-bell-btn"
          type="button"
          aria-label="消息通知"
          onClick={() => setShowNotificationModal(true)}
        >
          <Bell className="header-bell" size={18} />
          {templates.length > 0 && <span className="header-bell-badge">{templates.length}</span>}
        </button>
        <div className="backend-user-menu">
          <div className="backend-account"><div><strong>数***</strong><em>法人</em></div><span>湖南数据产业集团</span></div>
          <ChevronDown size={16} />
          <div className="backend-user-dropdown"><a href="/prototypes/authorized-operation-portal.html">门户首页</a></div>
        </div>
      </div>
    </header>
  );

  const pageModalsNode = (
    <>
      {showSpecModal && specContent && (
        <div className="spec-modal-overlay" onClick={() => setShowSpecModal(false)}>
          <div className="spec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="spec-modal-header">
              <h3>页面说明</h3>
              <button className="spec-modal-close" onClick={() => setShowSpecModal(false)}><X size={18} /></button>
            </div>
            <div className="spec-modal-body">
              <pre className="spec-content">{specContent}</pre>
            </div>
          </div>
        </div>
      )}

      {showChangeLogModal && changeLogContent && (
        <div className="spec-modal-overlay" data-active-menu={activeMenu} onClick={() => setShowChangeLogModal(false)}>
          <div className="spec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="spec-modal-header">
              <h3>原型修改记录</h3>
              <button className="spec-modal-close" onClick={() => setShowChangeLogModal(false)}><X size={18} /></button>
            </div>
            <div className="spec-modal-body">
              <div className="spec-content change-log-content" dangerouslySetInnerHTML={{ __html: changeLogContent.replace(/\n/g, '<br/>') }}></div>
            </div>
          </div>
        </div>
      )}

      {showNotificationModal && (
        <div className="spec-modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="spec-modal-header">
              <div>
                <h3>消息通知</h3>
                <p className="notification-modal-subtitle">共 {templates.length} 条消息模板</p>
              </div>
              <button className="spec-modal-close" onClick={() => setShowNotificationModal(false)}><X size={18} /></button>
            </div>
            <div className="notification-modal-body">
              {templates.length === 0 ? (
                <div className="notification-empty">暂无消息模板</div>
              ) : (
                <div className="notification-table-wrap">
                  <table className="notification-table">
                    <thead>
                      <tr>
                        <th className="notification-col-id">序号</th>
                        <th className="notification-col-stage">业务环节</th>
                        <th className="notification-col-type">消息类型</th>
                        <th className="notification-col-recipient">通知对象</th>
                        <th className="notification-col-template">消息模板</th>
                        <th className="notification-col-action">触发动作</th>
                        <th className="notification-col-time">更新时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map(item => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.businessStage}</td>
                          <td><span className="notification-type-tag">{item.messageType}</span></td>
                          <td>{item.recipient}</td>
                          <td className="notification-template-cell">{item.template}</td>
                          <td>{item.triggerAction}</td>
                          <td>{item.updateTime || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  // 嵌入模式：被 SPA 动态加载的页面仅渲染中央主体（顶栏 + 内容 + 弹层），不带侧边栏外壳
  if (isEmbeddedInstance) {
    return (
      <main className="main-content main-content-spa-embedded">
        {topHeaderNode}
        {title && <div className="page-header"><h1 className="page-title">{title}</h1></div>}
        {children}
        {pageModalsNode}
      </main>
    );
  }

  return (
    <div className="filing-container">
      <aside className={'sidebar ' + (sidebarCollapsed ? 'sidebar-collapsed' : '')}>
        <div className="sidebar-header">
          <div className="logo-icon"><DatabaseZap aria-hidden="true" /></div>
          {!sidebarCollapsed && <div className="logo-text">公共数据资源授权运营管理平台</div>}
        </div>
        {!sidebarCollapsed && (
          <div className="sidebar-search">
            <Search size={14} className="sidebar-search-icon" aria-hidden="true" />
            <input
              type="text"
              value={menuKeyword}
              onChange={(e) => setMenuKeyword(e.target.value)}
              placeholder="搜索菜单"
              aria-label="搜索菜单"
            />
            {menuKeyword && (
              <button type="button" className="sidebar-search-clear" onClick={() => setMenuKeyword('')} aria-label="清空搜索">
                <X size={12} />
              </button>
            )}
          </div>
        )}
        <nav className="sidebar-nav">
          {searching && visibleMenu.length === 0 ? (
            <div className="sidebar-nav-empty">未找到匹配菜单</div>
          ) : (
            visibleMenu.map(entry => {
              if (entry.type === 'divider') {
                return sidebarCollapsed ? null : (
                  <div key={entry.key} className="nav-divider-label">
                    <span>{entry.label}</span>
                  </div>
                );
              }
              const Icon = entry.icon;
              if (entry.type === 'link') {
                return (
                  <a
                    key={entry.key}
                    className={'nav-top-link' + (effectiveActiveMenu === entry.key ? ' active' : '')}
                    href={entry.href}
                    title={entry.label}
                    onClick={(e) => { if (!entry.external) handleSpaNavClick(e, entry.key); }}
                    {...(entry.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <span className="nav-icon"><Icon aria-hidden="true" /></span>
                    {!sidebarCollapsed && <span className="nav-text">{renderNavText(entry.label)}</span>}
                  </a>
                );
              }
              return (
                <div key={entry.key} className="nav-group">
                  <div
                    className={'nav-group-title ' + (!searching && collapsedGroups[entry.key] ? 'collapsed' : '')}
                    onClick={() => toggleGroup(entry.key)}
                  >
                    <span className="nav-label">
                      <span className="nav-icon"><Icon aria-hidden="true" /></span>
                      {!sidebarCollapsed && <span>{renderNavText(entry.label)}</span>}
                    </span>
                    {!sidebarCollapsed && <svg className="nav-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>}
                  </div>
                  {!sidebarCollapsed && (searching || !collapsedGroups[entry.key]) && (
                    <div className="nav-items">
                      {entry.items
                        .filter(it => it.kind !== 'action' || (onAuthRecordClick && !remoteModule))
                        .map(it => it.kind === 'action' ? (
                          <div key={it.key} className="nav-item nav-item-clickable" onClick={onAuthRecordClick}>
                            <span className="nav-text">{renderNavText(it.label)}</span>
                          </div>
                        ) : (
                          <a
                            key={it.key}
                            className={'nav-item nav-item-link' + (effectiveActiveMenu === it.key ? ' active' : '')}
                            href={`/prototypes/${it.key}.html`}
                            onClick={(e) => handleSpaNavClick(e, it.key)}
                          >
                            <span className="nav-text">{renderNavText(it.label)}</span>
                          </a>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
            </svg>
          </button>
        </div>
      </aside>
      {remoteModule ? (
        remoteModule.element
      ) : (
        <main className="main-content">
          {topHeaderNode}
          {title && <div className="page-header"><h1 className="page-title">{title}</h1></div>}
          {children}
          {loadingModuleKey && (
            <div className="spa-switch-loading-mask">
              <span className="spa-switch-spinner" aria-hidden="true"></span>
              <span>模块加载中…</span>
            </div>
          )}
        </main>
      )}

      {pageModalsNode}
    </div>
  );
};

export default Layout;


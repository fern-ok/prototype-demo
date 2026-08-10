/**
 * @name 公共布局组件
 * @mode axure
 *
 * 提供统一的侧边栏和顶部栏布局，供各业务页面复用
 */

import { ChevronDown, DatabaseZap, FileText, FolderOpen, History, Home, ShieldCheck, FileSearch, FileCheck, KeyRound, X, Bell } from 'lucide-react';
import { useState, ReactNode } from 'react';
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

interface LayoutProps {
  children: ReactNode;
  activeMenu: 'product-service-filing' | 'operation-agreement-filing' | 'product-security-review' | 'data-resource-auth' | 'data-resource-review' | 'data-resource-recheck';
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

  const toggleGroup = (groupName: string) => {
    if (sidebarCollapsed) return;
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return (
    <div className="filing-container">
      <aside className={'sidebar ' + (sidebarCollapsed ? 'sidebar-collapsed' : '')}>
        <div className="sidebar-header">
          <div className="logo-icon"><DatabaseZap aria-hidden="true" /></div>
          {!sidebarCollapsed && <div className="logo-text">公共数据资源授权运营管理平台</div>}
        </div>
        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className={'nav-group-title ' + (collapsedGroups['备案管理'] ? 'collapsed' : '')} onClick={() => toggleGroup('备案管理')}>
              <span className="nav-label">
                <span className="nav-icon"><FolderOpen aria-hidden="true" /></span>
                {!sidebarCollapsed && <span>备案管理</span>}
              </span>
              {!sidebarCollapsed && <svg className="nav-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>}
            </div>
            {!sidebarCollapsed && !collapsedGroups['备案管理'] && (
              <div className="nav-items">
                <a className={'nav-item nav-item-link' + (activeMenu === 'product-service-filing' ? ' active' : '')} href="/prototypes/product-service-filing.html"><span className="nav-text">产品和服务清单备案</span></a>
                <a className={'nav-item nav-item-link' + (activeMenu === 'operation-agreement-filing' ? ' active' : '')} href="/prototypes/operation-agreement-filing.html"><span className="nav-text">运营协议备案</span></a>
                {onAuthRecordClick && (
                  <div className="nav-item nav-item-clickable" onClick={onAuthRecordClick}><span className="nav-text">授权记录</span></div>
                )}
              </div>
            )}
          </div>
          <a className={'nav-top-link' + (activeMenu === 'product-security-review' ? ' active' : '')} href="/prototypes/product-security-review.html" title="产品安全审查">
            <span className="nav-icon"><ShieldCheck aria-hidden="true" /></span>
            {!sidebarCollapsed && <span className="nav-text">产品安全审查</span>}
          </a>
          <a className={'nav-top-link' + (activeMenu === 'data-resource-auth' ? ' active' : '')} href="/prototypes/data-resource-auth.html" title="数据资源授权">
            <span className="nav-icon"><KeyRound aria-hidden="true" /></span>
            {!sidebarCollapsed && <span className="nav-text">数据资源授权</span>}
          </a>
          <a className={'nav-top-link' + (activeMenu === 'data-resource-review' ? ' active' : '')} href="/prototypes/data-resource-review.html" title="数据资源初审">
            <span className="nav-icon"><FileSearch aria-hidden="true" /></span>
            {!sidebarCollapsed && <span className="nav-text">数据资源初审</span>}
          </a>
          <a className={'nav-top-link' + (activeMenu === 'data-resource-recheck' ? ' active' : '')} href="/prototypes/data-resource-recheck.html" title="数据资源复审">
            <span className="nav-icon"><FileCheck aria-hidden="true" /></span>
            {!sidebarCollapsed && <span className="nav-text">数据资源复审</span>}
          </a>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
            </svg>
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="top-header">
          <div className="breadcrumb">
            <span>首页</span>
            <span className="separator">/</span>
            <span>{(activeMenu === 'product-security-review' || activeMenu === 'data-resource-review' || activeMenu === 'data-resource-recheck') ? '数据产品开发管理' : '备案管理'}</span>
            <span className="separator">/</span>
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
        {title && <div className="page-header"><h1 className="page-title">{title}</h1></div>}
        {children}
      </main>

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
        <div className="spec-modal-overlay" onClick={() => setShowChangeLogModal(false)}>
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
    </div>
  );
};

export default Layout;


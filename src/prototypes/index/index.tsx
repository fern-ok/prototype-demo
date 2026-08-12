/**
 * @name 项目首页（原型目录）
 * @mode axure
 *
 * 公共数据资源授权运营管理平台 - 原型预览首页
 * 展示原型版本列表，支持展开/收起各版本的变更记录
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, LayoutDashboard, Monitor, Shield } from 'lucide-react';
import v20260928 from './versions/20260928.md?raw';
import v20260904 from './versions/20260904.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

const versions = [
  {
    version: '20260928',
    title: '20260928版本',
    content: v20260928,
  },
  {
    version: '20260904',
    title: '20260904版本',
    content: v20260904,
  },
];

const OriginalComponent = () => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set([versions[0].version]));

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedVersions(new Set(versions.map(v => v.version)));
  };

  const collapseAll = () => {
    setExpandedVersions(new Set());
  };

  return (
    <div className="index-page">
      <header className="index-header">
        <div className="index-header-inner">
          <div className="index-brand">
            <div className="brand-logo">
              <Shield size={28} />
            </div>
            <div className="brand-text">
              <h1>公共数据资源授权运营管理平台</h1>
              <p>原型预览与版本管理</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="header-btn" onClick={() => { expandAll(); }}>
              展开全部
            </button>
            <button className="header-btn" onClick={() => { collapseAll(); }}>
              收起全部
            </button>
          </div>
        </div>
      </header>

      <main className="index-main">
        <section className="entry-cards">
          <a className="entry-card" href="/prototypes/authorized-operation-portal.html">
            <div className="entry-card-icon portal">
              <Monitor size={36} />
            </div>
            <div className="entry-card-info">
              <h3>查看门户原型</h3>
            </div>
            <ExternalLink className="entry-card-arrow" size={20} />
          </a>
          <a className="entry-card" href="/prototypes/product-security-review.html">
            <div className="entry-card-icon admin">
              <LayoutDashboard size={36} />
            </div>
            <div className="entry-card-info">
              <h3>查看后台原型</h3>
            </div>
            <ExternalLink className="entry-card-arrow" size={20} />
          </a>
          <a className="entry-card" href="/prototypes/implementation-workbench.html">
            <div className="entry-card-icon admin">
              <LayoutDashboard size={36} />
            </div>
            <div className="entry-card-info">
              <h3>实施机构工作台</h3>
              <p>统计分析与待办任务中心</p>
            </div>
            <ExternalLink className="entry-card-arrow" size={20} />
          </a>
        </section>

        <section className="version-list">
          <div className="version-list-header">
            <h2>版本变更记录</h2>
            <span className="version-count">共 {versions.length} 个版本</span>
          </div>

          {versions.map((item) => {
            const isExpanded = expandedVersions.has(item.version);
            return (
              <div key={item.version} className={'version-card' + (isExpanded ? ' expanded' : '')}>
                <div className="version-card-header" onClick={() => toggleVersion(item.version)}>
                  <div className="version-title">
                    <span className="version-badge">v{item.version}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <div className="version-toggle">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="version-card-body">
                    <div className="version-content" dangerouslySetInnerHTML={{ __html: item.content.replace(/\n/g, '<br/>') }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>

      <footer className="index-footer">
        <p>© 2026 公共数据资源授权运营管理平台 · 原型预览系统</p>
      </footer>
    </div>
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

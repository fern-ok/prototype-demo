import { ReactNode, useState } from 'react';
import { ChevronDown, FileText, History, Home, Mail, MapPin, Phone, Search, X } from 'lucide-react';
import './portal-layout.css';

type PortalNavKey = 'home' | 'resource' | 'product' | 'demand' | 'news' | 'help' | 'none';

interface PortalLayoutProps {
  children: ReactNode;
  activeNav?: PortalNavKey;
  specContent?: string;
  changeLogContent?: string;
  className?: string;
}

const navItems: Array<{ key: PortalNavKey; label: string; href: string }> = [
  { key: 'home', label: '首页', href: '/prototypes/authorized-operation-portal.html' },
  { key: 'resource', label: '数据资源', href: '#' },
  { key: 'product', label: '数据产品', href: '/prototypes/authorized-operation-portal-products.html' },
  { key: 'demand', label: '发布需求', href: '/prototypes/publish-demand.html' },
  { key: 'news', label: '新闻公告', href: '#' },
  { key: 'help', label: '帮助中心', href: '#' },
];

const PortalLayout = ({ children, activeNav = 'none', specContent, changeLogContent, className }: PortalLayoutProps) => {
  const [modal, setModal] = useState<'spec' | 'change' | null>(null);

  return (
    <div className={['portal-shell', className].filter(Boolean).join(' ')}>
      <header className="portal-shell-header">
        <div className="portal-shell-brand-zone">
          <a className="portal-shell-brand" href="/prototypes/authorized-operation-portal.html">
            <div className="portal-shell-brand-mark">数</div>
            <span>公共数据资源授权运营管理平台</span>
          </a>
          <div className="portal-shell-actions">
            <a className="portal-shell-action" href="/prototypes/index.html">
              <Home size={14} />
              <span>版本管理</span>
            </a>
            <button className="portal-shell-action" type="button" onClick={() => setModal('spec')} disabled={!specContent}>
              <FileText size={14} />
              <span>页面说明</span>
            </button>
            <button className="portal-shell-action" type="button" onClick={() => setModal('change')} disabled={!changeLogContent}>
              <History size={14} />
              <span>原型修改记录</span>
            </button>
          </div>
        </div>
        <nav className="portal-shell-nav">
          {navItems.map(item => (
            <a key={item.key} href={item.href} className={activeNav === item.key ? 'active' : ''}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="portal-shell-tools">
          <div className="portal-shell-search">
            <input placeholder="全站内容搜索" />
            <Search size={16} />
          </div>
          <div className="portal-shell-user-menu">
            <div className="portal-shell-account">
              <div><strong>数***</strong><em>法人</em></div>
              <span>湖南数据产业集团</span>
            </div>
            <ChevronDown size={16} />
            <div className="portal-shell-user-dropdown">
              <a href="/prototypes/authorized-operation-portal-profile.html">个人中心</a>
              <a href="/prototypes/product-service-filing.html">管理后台</a>
            </div>
          </div>
        </div>
      </header>

      {children}

      <PortalFooter />

      {modal === 'spec' && specContent && <InfoModal title="页面说明" content={specContent} onClose={() => setModal(null)} />}
      {modal === 'change' && changeLogContent && <InfoModal title="原型修改记录" content={changeLogContent} onClose={() => setModal(null)} />}
    </div>
  );
};

const InfoModal = ({ title, content, onClose }: { title: string; content: string; onClose: () => void }) => (
  <div className="portal-shell-modal-overlay" onClick={onClose}>
    <div className="portal-shell-modal" onClick={(event) => event.stopPropagation()}>
      <div className="portal-shell-modal-header">
        <h3>{title}</h3>
        <button type="button" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="portal-shell-modal-body">
        <pre>{content}</pre>
      </div>
    </div>
  </div>
);

const PortalFooter = () => (
  <footer className="portal-shell-footer">
    <div className="portal-shell-footer-inner">
      <div className="portal-shell-footer-brand">
        <div className="portal-shell-brand-mark">数</div>
        <div>
          <strong>湖南省公共数据流通利用基础设施</strong>
          <span>公共数据资源授权运营管理平台</span>
        </div>
      </div>
      <div className="portal-shell-footer-links">
        <h4>友情链接</h4>
        <span>区域功能节点</span>
        <span>公共数据资源登记平台</span>
        <span>数据开发中心</span>
        <span>可信数据空间</span>
      </div>
      <div className="portal-shell-qr">公众号</div>
      <div className="portal-shell-footer-contact">
        <h4>运营方</h4>
        <strong>湖南数据产业集团有限公司</strong>
        <p><MapPin size={14} />湖南省长沙市岳麓区楷林国际A座19-20楼</p>
        <p><Mail size={14} />datainfra_service@hnchasing.com</p>
        <p><Phone size={14} />0731-89692062</p>
      </div>
    </div>
    <div className="portal-shell-copyright">Copyright©2026 湖南数据产业集团有限公司. All Rights Reserved. ICP许可证号 湘ICP备13002754号</div>
  </footer>
);

export default PortalLayout;

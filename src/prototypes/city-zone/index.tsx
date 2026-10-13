/**
 * @name 城市专区
 * @mode axure
 *
 * 参考资料：
 * - 用户提供的《城市专区原型内容说明》
 *
 * 面向地市本级用户的门户专区，承接省级公共数据流通底座，适配湖南地市场景。
 * 顶部导航、页脚由公共组件 PortalLayout 统一维护；本页仅渲染专区内容。
 */

import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Database,
  Download,
  Eye,
  FileText,
  LayoutGrid,
  Layers,
  Mail,
  MapPin,
  Phone,
  Rocket,
  ShieldCheck,
  Tag,
  Boxes,
} from 'lucide-react';
import PortalLayout from '../../common/PortalLayout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

// 当前专区所属城市（适配湖南地市场景，原型以娄底市为例）
const CITY = '娄底市';

const stats = [
  { label: '数据资源', value: '126', unit: '个', icon: Database },
  { label: '数据产品', value: '58', unit: '个', icon: Boxes },
  { label: '数据需求', value: '34', unit: '条', icon: FileText },
  { label: '应用场景', value: '22', unit: '个', icon: LayoutGrid },
  { label: '入驻企业', value: '47', unit: '家', icon: Building2 },
];

// 模块1：仅展示归属本市、可对外授权流通的数据资源
const resources = [
  { name: '娄底市人口基础信息数据资源', code: 'LD-POP-2026-001', owner: '娄底市数据资源管理局', format: 'XLSX', frequency: '每月', industry: '城市治理' },
  { name: '娄底市市场主体登记数据资源', code: 'LD-MKT-2026-014', owner: '娄底市市场监督管理局', format: 'CSV', frequency: '每周', industry: '经济运行' },
  { name: '娄底市交通运行实时数据资源', code: 'LD-TRA-2026-007', owner: '娄底市交通运输局', format: 'API', frequency: '实时', industry: '交通运输' },
  { name: '娄底市生态环境监测数据资源', code: 'LD-ENV-2026-003', owner: '娄底市生态环境局', format: 'XLSX', frequency: '每日', industry: '自然资源' },
];

// 模块2：数据产品
const products = [
  { name: '娄底市信用画像数据产品', code: 'LD-PROD-2026-021', provider: '娄底数智科技集团有限公司', desc: '融合公共信用与社会数据，为金融机构提供企业信用评估与风控支撑。' },
  { name: '娄底市商圈人流分析产品', code: 'LD-PROD-2026-018', provider: '娄底市数据资源管理局', desc: '基于客流与消费数据，支撑商圈运营、文旅调度与应急管理。' },
  { name: '娄底市不动产登记查询产品', code: 'LD-PROD-2026-009', provider: '娄底市自然资源和规划局', desc: '面向政务服务与中介机构的合规不动产登记信息查询服务。' },
  { name: '娄底市营商环境指标产品', code: 'LD-PROD-2026-025', provider: '娄底市产业发展投资集团有限公司', desc: '汇聚企业、政务与产业数据，形成区域营商环境动态指标体系。' },
];

// 模块3：公告与政策文件
const announcements = [
  { title: '娄底市数据流通专区试运行上线通知', date: '2026-09-28', type: '通知公告' },
  { title: '专区服务暂停维护通知（国庆期间）', date: '2026-09-25', type: '服务通知' },
  { title: '专区数据产品目录 V2.0 版本更新说明', date: '2026-09-15', type: '版本更新' },
];

const policies = [
  { title: '娄底市公共数据授权运营管理办法（试行）', date: '2026-08-30', type: '管理办法' },
  { title: '湖南省公共数据授权运营操作规范', date: '2026-07-12', type: '操作规范' },
  { title: '公共数据开发利用安全合规指引', date: '2026-06-20', type: '安全合规' },
];

// 模块4：业务应用案例（图文卡片）
const cases = [
  { name: '智慧文旅客流预警', product: '娄底市商圈人流分析产品', scene: '文旅监管', industry: '文化旅游', desc: '面向热门景区与商圈，实时监测客流密度并发布预警，提升文旅调度与安全保障能力。', color: '#2b88ff' },
  { name: '中小企业信用贷', product: '娄底市信用画像数据产品', scene: '普惠金融', industry: '创新金融', desc: '以公共信用数据为基础，辅助银行快速完成中小企业授信评估，缩短放贷周期。', color: '#16c2a3' },
  { name: '不动产一窗通办', product: '娄底市不动产登记查询产品', scene: '政务服务', industry: '城市治理', desc: '打通不动产登记查询能力，支撑政务大厅一窗受理、跨层级联办，提升办事效率。', color: '#ff8a3c' },
];

const buildLogoSvg = (name: string, abbr: string, color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="70" viewBox="0 0 200 70"><rect width="200" height="70" fill="#fff"/><rect x="10" y="13" width="44" height="44" rx="8" fill="${color}"/><text x="32" y="42" font-size="15" font-weight="bold" text-anchor="middle" fill="#fff">${abbr}</text><text x="66" y="32" font-size="14" font-weight="bold" fill="#183154">${name}</text><text x="66" y="50" font-size="10" fill="#7d8ba3">数据开发与运营</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// 模块5：入驻企业（使用 SVG 占位 Logo，后续可替换为真实企业 Logo 图片）
const enterprises = [
  { name: '娄底数智科技集团', logo: buildLogoSvg('娄底数智科技集团', '数智', '#1677ff') },
  { name: '湖南湘江智能科技', logo: buildLogoSvg('湖南湘江智能科技', '湘江', '#16c2a3') },
  { name: '娄底市产业发展投资集团', logo: buildLogoSvg('娄底市产业发展投资集团', '产投', '#ff8a3c') },
  { name: '湖南先进计算研究院', logo: buildLogoSvg('湖南先进计算研究院', '先研', '#722ed1') },
  { name: '湖南涟源钢铁集团有限公司', logo: buildLogoSvg('湖南涟源钢铁集团有限公司', '涟钢', '#eb2f96') },
  { name: '湖南信用科技集团', logo: buildLogoSvg('湖南信用科技集团', '信科', '#2f4554') },
  { name: '娄底市交通信息港', logo: buildLogoSvg('娄底市交通信息港', '交港', '#13c2c2') },
  { name: '湖南政务云科技', logo: buildLogoSvg('湖南政务云科技', '政务云', '#f5222d') },
  { name: '娄底市城市建设投资集团', logo: buildLogoSvg('娄底市城市建设投资集团', '城建', '#1890ff') },
  { name: '湖南智慧城市研究院', logo: buildLogoSvg('湖南智慧城市研究院', '智研', '#52c41a') },
];

// 专区专属顶部栏（可信数据空间）：仅作用于本页面，与门户全局公共顶部（PortalLayout）相互独立
const zoneNavItems: Array<{ label: string; active?: boolean; chevron?: boolean }> = [
  { label: '首页', active: true },
  { label: '数据资源中心' },
  { label: '数据产品中心' },
  { label: '数据服务中心', chevron: true },
  { label: '数据需求中心' },
  { label: '场景中心' },
  { label: '资讯动态' },
  { label: '标识查询' },
  { label: '帮助中心' },
];

const ZoneTopBar = () => {
  const [zoneOpen, setZoneOpen] = useState(false);
  const [zoneValue, setZoneValue] = useState('娄底市数据专区');

  return (
    <div className="cz-zone-bar">
      {zoneOpen && <div className="cz-zone-overlay" onClick={() => setZoneOpen(false)} />}
      <div className="cz-zone-bar-inner">
        <div className="cz-zone-brand">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <path d="M13 3c5.5 0 10 4.5 10 10s-4.5 10-10 10S3 18.5 3 13" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M13 8a5 5 0 1 1-5 5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <span>可信数据空间</span>
        </div>
        <i className="cz-zone-divider" />
        <div className="cz-zone-switcher-wrap">
          <button
            className={`cz-zone-switcher${zoneOpen ? ' open' : ''}`}
            type="button"
            onClick={() => setZoneOpen(v => !v)}
          >
            <span>{zoneValue}</span>
            <ChevronDown size={13} />
          </button>
          {zoneOpen && (
            <div className="cz-zone-switcher-panel">
              <button
                className="cz-zone-option"
                type="button"
                onClick={() => { setZoneValue('主空间'); setZoneOpen(false); }}
              >
                <span>主空间</span>
              </button>
              <button
                className="cz-zone-option"
                type="button"
                onClick={() => { setZoneValue('公共数据专区'); setZoneOpen(false); }}
              >
                <span>公共数据专区</span>
                <em className="cz-zone-opt-status">未入驻</em>
                <em className="cz-zone-opt-tag">公共专区</em>
              </button>
            </div>
          )}
        </div>
        <nav className="cz-zone-nav">
          {zoneNavItems.map(item => (
            <a key={item.label} href="#" className={item.active ? 'active' : ''}>
              {item.label}
              {item.chevron && <ChevronDown size={12} />}
            </a>
          ))}
        </nav>
        <div className="cz-zone-actions">
          <button className="cz-zone-app-btn" type="button">应用中心</button>
          <span className="cz-zone-auth">
            <a href="#">登录</a>
            <i>/</i>
            <a href="#">注册</a>
          </span>
        </div>
      </div>
    </div>
  );
};

// 专区专属底部栏（可信数据空间）：仅作用于本页面，与门户全局公共底部（PortalLayout Footer）相互独立
const zoneFriendLinks = [
  '湖南数据产业集团有限公司',
  '湖南省公共数据授权运营平台',
  '湖南省公共数据运营监管平台',
  '湖南省区域功能节点',
];

const ZoneQrPattern = () => (
  <svg width="72" height="72" viewBox="0 0 29 29" shapeRendering="crispEdges" aria-hidden="true">
    <rect width="29" height="29" fill="#fff" />
    <g fill="#1f2f45">
      <rect x="0" y="0" width="7" height="7" /><rect x="1" y="1" width="5" height="5" fill="#fff" /><rect x="2" y="2" width="3" height="3" />
      <rect x="22" y="0" width="7" height="7" /><rect x="23" y="1" width="5" height="5" fill="#fff" /><rect x="24" y="2" width="3" height="3" />
      <rect x="0" y="22" width="7" height="7" /><rect x="1" y="23" width="5" height="5" fill="#fff" /><rect x="2" y="24" width="3" height="3" />
      <rect x="9" y="2" width="2" height="2" /><rect x="13" y="1" width="2" height="2" /><rect x="16" y="4" width="2" height="2" /><rect x="10" y="6" width="2" height="2" />
      <rect x="14" y="8" width="2" height="2" /><rect x="2" y="9" width="2" height="2" /><rect x="6" y="12" width="2" height="2" /><rect x="9" y="10" width="2" height="2" />
      <rect x="12" y="13" width="2" height="2" /><rect x="16" y="11" width="2" height="2" /><rect x="19" y="9" width="2" height="2" /><rect x="24" y="9" width="2" height="2" />
      <rect x="9" y="16" width="2" height="2" /><rect x="13" y="18" width="2" height="2" /><rect x="17" y="16" width="2" height="2" /><rect x="20" y="14" width="2" height="2" />
      <rect x="24" y="18" width="2" height="2" /><rect x="9" y="22" width="2" height="2" /><rect x="13" y="24" width="2" height="2" /><rect x="18" y="26" width="2" height="2" />
      <rect x="24" y="24" width="2" height="2" /><rect x="26" y="12" width="2" height="2" /><rect x="26" y="26" width="2" height="2" /><rect x="16" y="20" width="2" height="2" />
    </g>
  </svg>
);

const ZoneFooter = () => (
  <footer className="cz-zone-footer">
    <div className="cz-zone-footer-inner">
      <div className="cz-zone-footer-brand">
        <div className="cz-zone-footer-logo">
          <svg width="30" height="30" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <path d="M13 3c5.5 0 10 4.5 10 10s-4.5 10-10 10S3 18.5 3 13" stroke="#35619e" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M13 8a5 5 0 1 1-5 5" stroke="#35619e" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <strong>湖南省公共数据流通利用基础设施</strong>
          <span>可信数据空间</span>
        </div>
      </div>
      <div className="cz-zone-footer-links">
        <h4>友情链接</h4>
        {zoneFriendLinks.map(link => (
          <a key={link} href="#">{link}</a>
        ))}
      </div>
      <div className="cz-zone-footer-qr">
        <div className="cz-zone-qr-box"><ZoneQrPattern /></div>
        <span>扫一扫进入公众号</span>
      </div>
      <div className="cz-zone-footer-contact">
        <h4>运营方</h4>
        <strong>湖南数据产业集团有限公司</strong>
        <p><MapPin size={14} />地址：湖南省长沙市岳麓区楷林国际A座19-20楼</p>
        <p><Mail size={14} />邮箱：datainfra_service@hnchasing.com</p>
        <p><Phone size={14} />电话：0731-89692062</p>
      </div>
    </div>
    <div className="cz-zone-footer-copyright">Copyright©2026 湖南数据产业集团有限公司. All Rights Reserved. ICP许可证号：湘ICP备13002754号</div>
  </footer>
);

const OriginalComponent = () => {
  const [docTab, setDocTab] = useState<'announcement' | 'policy'>('announcement');
  const docs = docTab === 'announcement' ? announcements : policies;

  return (
    <PortalLayout className="city-zone-page" activeNav="city" specContent={specContent} changeLogContent={changeLogContent}>
      {/* 〇、专区专属顶部栏（可信数据空间） */}
      <ZoneTopBar />

      {/* 一、专区头部 Banner */}
      <section className="cz-banner">
        <div className="cz-banner-bg" />
        <div className="cz-banner-inner">
          <span className="cz-banner-badge"><MapPin size={14} />{CITY} · 地市级数据流通专区</span>
          <h1>{CITY}数据流通专区</h1>
          <p>本专区汇聚{CITY}公共数据资源与数据产品，支撑数据授权、可信流通、合规开发应用</p>
        </div>
      </section>

      {/* 二、统计概览卡片 */}
      <section className="cz-stats">
        {stats.map(item => {
          const Icon = item.icon;
          return (
            <div className="cz-stat-card" key={item.label}>
              <div className="cz-stat-icon"><Icon size={26} /></div>
              <div className="cz-stat-text">
                <span>{item.label}</span>
                <strong>{item.value}<em>{item.unit}</em></strong>
              </div>
            </div>
          );
        })}
      </section>

      <main className="cz-main">
        {/* 三、专区定位与特色 */}
        <section className="cz-section">
          <SectionTitle title="专区定位与特色" desc="面向地市本级用户，承接省级公共数据流通底座" />
          <div className="cz-position-card">
            <div className="cz-position-info">
              <div className="cz-position-thumb"><MapPin size={32} /></div>
              <div className="cz-position-body">
                <h3>地市级数据流通专区</h3>
                <span className="cz-position-owner">运营方：{CITY}数据资源管理局</span>
                <p>本专区是湖南省公共数据流通底座在地市本级的延伸，聚焦{CITY}公共数据资源与场景化数据产品，支撑数据授权、可信流通、合规开发应用，助力数字政府建设与产业数字化转型。</p>
              </div>
            </div>
            <div className="cz-position-visual" aria-label="城市数据流通专区配图" />
          </div>
        </section>

        {/* 四、模块1 数据资源 */}
        <section className="cz-section cz-section-blue cz-section-blue-full">
          <SectionTitle title="数据资源" desc="仅展示归属本市、可对外授权流通的数据资源" />
          <div className="cz-tags">
            <span className="cz-tag">归属本市</span>
            <span className="cz-tag">可对外授权流通</span>
          </div>
          <div className="cz-resource-grid">
            {resources.map(item => (
              <article className="cz-resource-card" key={item.code}>
                <h3><Database size={18} />{item.name}</h3>
                <dl>
                  <div><dt>资源标识码</dt><dd>{item.code}</dd></div>
                  <div><dt>资源持有方</dt><dd>{item.owner}</dd></div>
                  <div><dt>资源格式</dt><dd>{item.format}</dd></div>
                  <div><dt>更新频率</dt><dd>{item.frequency}</dd></div>
                  <div className="cz-full"><dt>行业分类</dt><dd>{item.industry}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        {/* 五、模块2 数据产品 */}
        <section className="cz-section">
          <SectionTitle title="数据产品" desc="汇聚本市可订阅、可授权的数据产品" />
          <div className="cz-product-grid">
            {products.map(item => (
              <article className="cz-product-card" key={item.code}>
                <div className="cz-product-head">
                  <div>
                    <h3>{item.name}</h3>
                    <p><Tag size={13} />{item.code}</p>
                  </div>
                  <div className="cz-product-logo">数</div>
                </div>
                <p className="cz-product-provider"><Building2 size={14} />{item.provider}</p>
                <p className="cz-product-desc">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 六、模块3 公告与政策文件 */}
        <section className="cz-section cz-section-blue cz-section-blue-full">
          <SectionTitle title="公告与政策文件" desc="本市数据流通通知与省、市两级规范文件" />
          <div className="cz-doc-tabs">
            <button className={docTab === 'announcement' ? 'active' : ''} onClick={() => setDocTab('announcement')}>专区公告</button>
            <button className={docTab === 'policy' ? 'active' : ''} onClick={() => setDocTab('policy')}>政策规范</button>
          </div>
          <div className="cz-doc-list">
            {docs.map(item => (
              <div className="cz-doc-row" key={item.title}>
                <span className="cz-doc-type">{item.type}</span>
                <span className="cz-doc-title">{item.title}</span>
                <span className="cz-doc-date">{item.date}</span>
                <span className="cz-doc-actions">
                  <button><Eye size={13} />预览</button>
                  <button><Download size={13} />下载</button>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 七、模块4 业务应用案例 */}
        <section className="cz-section">
          <SectionTitle title="业务应用案例" desc="本市落地的数据流通应用案例" />
          <div className="cz-case-grid">
            {cases.map(item => (
              <article className="cz-case-card" key={item.name}>
                <div className="cz-case-thumb" style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}99)` }}>
                  <Rocket size={40} />
                </div>
                <div className="cz-case-body">
                  <h3>{item.name}</h3>
                  <ul>
                    <li><Layers size={13} />使用产品：{item.product}</li>
                    <li><MapPin size={13} />应用场景：{item.scene}</li>
                    <li><ShieldCheck size={13} />所属行业：{item.industry}</li>
                  </ul>
                  <p>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 八、模块5 入驻企业 */}
        <section className="cz-section cz-section-blue cz-section-blue-full">
          <SectionTitle title="入驻企业" desc="已入驻本专区的数据开发与运营主体" />
          <div className="cz-enterprise-grid">
            {enterprises.map(item => (
              <div className="cz-enterprise-card" key={item.name}>
                <img className="cz-enterprise-logo" src={item.logo} alt={item.name} />
              </div>
            ))}
          </div>
        </section>

        {/* 九、加入专区入口 */}
        <section className="cz-section cz-join-section">
          <h2>加入{CITY}数据流通专区</h2>
          <p>入驻企业可发布数据产品、申请数据资源授权、参与场景联合开发</p>
          <button className="cz-join-btn"><ArrowRight size={14} />立即加入</button>
        </section>
      </main>

      {/* 一〇、专区专属底部栏（可信数据空间） */}
      <ZoneFooter />

      <FloatingTools />
    </PortalLayout>
  );
};

const SectionTitle = ({ title, desc }: { title: string; desc?: string }) => (
  <div className="cz-section-title">
    <i />
    <h2>{title}</h2>
    {desc && <p>{desc}</p>}
  </div>
);

const FloatingTools = () => (
  <div className="cz-floating">
    <button title="返回顶部" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>⌃</button>
  </div>
);

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}

/**
 * @name 授权运营平台门户
 * @mode axure
 *
 * 参考资料：
 * - C:/Users/Lenovo/Desktop/门户html.txt
 * - 用户提供的门户页面截图
 *
 * 公共数据资源授权运营管理平台门户首页原型
 */

import {
  ArrowRight,
  BarChart3,
  Building2,
  Database,
  Factory,
  FileText,
  Grid3X3,
  HeartPulse,
  Leaf,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  ShipWheel,
  Star,
  Truck,
  UserCheck,
  Waves,
} from 'lucide-react';
import PortalLayout from '../../common/PortalLayout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

const stats = [
  { label: '涉及数据领域', value: '54', unit: '个', icon: Database },
  { label: '已发布数据资源', value: '305', unit: '个', icon: Grid3X3 },
  { label: '已发布数据产品', value: '80', unit: '个', icon: Building2 },
  { label: '已入驻企业主体', value: '118', unit: '家', icon: UserCheck },
];

const domains = [
  { name: '卫生健康', icon: HeartPulse },
  { name: '气象服务', icon: Waves },
  { name: '文化旅游', icon: ShipWheel },
  { name: '交通运输', icon: Truck },
  { name: '城市治理', icon: Building2 },
  { name: '自然资源', icon: Leaf },
  { name: '工业制造', icon: Factory },
  { name: '创新金融', icon: BarChart3 },
  { name: '智慧农业', icon: Leaf },
  { name: '更多领域', icon: Grid3X3 },
];

const resources = [
  { title: '湖南省医疗就诊数据资源625-002', org: '湖南省卫生健康委信息统计中心', industry: '综合医院', area: '省本级', date: '2026/06/25', field: '卫生健康', format: 'xlsx', desc: '面向医疗健康场景提供就诊数据、诊疗记录及统计指标支撑。', views: 34, auth: 1 },
  { title: '祁东黄花菜空间矢量数据', org: '祁东县农业农村局', industry: '其他农业', area: '衡阳市祁东县', date: '2026/06/26', field: '农业农村', format: 'KingbaseES', desc: '围绕黄花菜种植区域形成空间矢量底图与产业分布数据。', views: 22, auth: 1 },
  { title: '厦口市浩轩矿业无限公司数据资源', org: '实施开发企业有限公司', industry: '制糖业', area: '省本级', date: '2026/07/01', field: '三农领域', format: 'OFD', desc: '企业生产经营数据资源，用于产业协同与可信流通。', views: 8, auth: 0 },
  { title: '人口健康基础库', org: '湖南省卫生健康委信息统计中心', industry: '综合医院', area: '省本级', date: '2026/06/08', field: '卫生健康', format: 'xlsx', desc: '会员电子健康档案、人口基础统计、年龄结构等基础数据。', views: 7, auth: 1 },
];

const products = [
  { title: '祁东黄花菜空间矢量再开发产品', provider: '杭州趣链科技股份有限公司', type: 'API产品', industry: '其他农业', date: '2026/6/26', field: '农业农村', area: '衡阳市祁东县', desc: '围绕黄花菜特色产业提供空间分析、产区识别与订阅服务。', price: '188,888元/年', views: 49, orders: 1 },
  { title: '再开发开发中心吉首市062301API5-扩展码32位改成空...', provider: '湖南天河国云科技有限公司', type: 'API产品', industry: '火力发电,热电联产', date: '2026/6/23', field: '科技创新', area: '湘西土家族苗族自治州吉首市', desc: '支持授权码配置、接口订阅与数据调用的再开发产品。', price: '22元/GB', views: 43, orders: 3 },
  { title: '再开发产品0717API产品02·M1bj2-bg072201', provider: '动芯智行（吉首）科技有限责任公司', type: 'API产品', industry: '热力生产和供应,电力供应', date: '2026/7/22', field: '科技创新', area: '湘西土家族苗族自治州吉首市', desc: '面向能源企业提供指标查询、调用计量与场景化服务。', price: '2元/次', views: 33, orders: 1 },
  { title: '卫健委医疗资源h060902-数据集-二级产品-数据集', provider: '杭州趣链科技股份有限公司', type: '数据集', industry: '固定电信服务,移动电信服务', date: '2026/6/9', field: '卫生健康', area: '省本级', desc: '医疗资源数据集，覆盖机构资源、服务能力与健康服务指标。', price: '99,999,998.08元/年', views: 26, orders: 2 },
];

const services = [
  { title: '主体认证', desc: '注册成功后进行主体身份认证', icon: UserCheck },
  { title: '协议签订', desc: '签订运营协议或者再开发协议', icon: FileText },
  { title: '数据开发', desc: '应用平台工具完成数据开发', icon: Database },
  { title: '产品上架', desc: '在授权运营平台上架数据产品', icon: Building2 },
  { title: '精准订阅', desc: '数据需求方订阅使用数据产品', icon: ShieldCheck },
];

const news = [
  { title: '澳门特色的“一国两制”惠民', date: '2025-08-25' },
  { title: '海外行情', date: '2025-08-25' },
  { title: '国家数据局综合司关于征集数据标注优秀案例的通知', date: '2025-07-21' },
  { title: '坚持推进数据要素市场化配置改革——国家数据局介绍数据领域改革进展和成效', date: '2025-02-14' },
  { title: '沈晓明调研新能源产业：在延伸产业链提高附加值上下功夫', date: '2025-02-14' },
];

const OriginalComponent = () => (
  <PortalLayout className="portal-page" activeNav="home" specContent={specContent} changeLogContent={changeLogContent}>
      <section className="hero-section"><div className="hero-bg"></div><div className="hero-overlay"></div><div className="hero-content"><h1>公共数据资源授权运营管理平台</h1><p>数 · 聚 · 潇 · 湘　　智 · 绘 · 未 · 来</p></div></section>
      <main>
        <section className="stats-panel">{stats.map(item => { const Icon = item.icon; return <div className="stat-card" key={item.label}><div className="stat-icon"><Icon size={34} /></div><div><span>{item.label}</span><strong>{item.value}<em>{item.unit}</em></strong></div></div>; })}</section>
        <section className="section domain-section"><SectionTitle title="领域分类" desc="生产生活全领域覆盖，为企业提供多维数据支撑" /><div className="domain-grid">{domains.map(item => { const Icon = item.icon; return <div className="domain-card" key={item.name}><Icon size={31} /><span>{item.name}</span></div>; })}</div></section>
        <section className="blue-section resource-section"><div className="section-inner"><SectionTitle title="数据资源" more /><div className="resource-layout"><div className="resource-grid">{resources.map(item => <ResourceCard key={item.title} item={item} />)}</div></div></div></section>
        <section className="blue-section product-section"><div className="section-inner"><SectionTitle title="数据产品" more /><div className="product-layout"><div className="product-grid">{products.map(item => <ProductCard key={item.title} item={item} />)}</div></div></div></section>
        <section className="service-section"><div className="center-title"><h2>一站式服务</h2><p>从数据整合的“基础支撑”到共享开放的“流通枢纽”</p></div><div className="service-flow">{services.map((item, index) => { const Icon = item.icon; return <div className="service-item" key={item.title}><div className="service-art"><Icon size={42} /></div><h3>{item.title}</h3><p>{item.desc}</p>{index < services.length - 1 && <ArrowRight className="flow-arrow" size={28} />}</div>; })}</div></section>
        <section className="news-section"><div className="section-inner"><SectionTitle title="新闻公告" desc="最新资讯政策及时了解，助推数据建设全面发展" more /><div className="news-panel"><div className="news-poster"><span>NEWS</span><strong>新闻资讯</strong><FileText size={68} /></div><div className="news-list"><div className="news-tabs"><span className="active">新闻资讯</span><span>政策法规</span><span>运营动态</span></div>{news.map(item => <div className="news-row" key={item.title}><span>{item.title}</span><em>{item.date}</em></div>)}</div></div></div></section>
      </main>
      <FloatingTools />
  </PortalLayout>
);

const SectionTitle = ({ title, desc, more }: { title: string; desc?: string; more?: boolean }) => <div className="section-title-row"><div className="section-title-left"><i></i><h2>{title}</h2>{desc && <p>{desc}</p>}</div>{more && <button>查看更多 <ArrowRight size={14} /></button>}</div>;
const ResourceCard = ({ item }: { item: typeof resources[number] }) => <article className="resource-card"><div className="card-title"><Database size={28} /><h3>{item.title}</h3></div><div className="meta-line"><span>{item.org}</span></div><div className="meta-grid"><span>{item.industry}</span><span>{item.date}</span><span>{item.area}</span><span>{item.format}</span></div><p>{item.desc}</p><div className="card-footer"><span>浏览 {item.views}</span><span>授权 {item.auth}</span><span className="fav"><Star size={14} /> 收藏</span></div></article>;
const ProductCard = ({ item }: { item: typeof products[number] }) => <article className="product-card"><div className="product-head"><div><h3>{item.title}</h3><p>{item.provider}</p></div><div className="product-logo">数</div></div><div className="product-meta"><span>{item.type}</span><span>{item.industry}</span><span>{item.date}</span><span>{item.field}</span><span>{item.area}</span></div><p>{item.desc}</p><div className="product-footer"><strong>{item.price}</strong><span className="order">订阅 {item.orders}</span><span>浏览 {item.views}</span><span className="fav">收藏</span></div></article>;
const FloatingTools = () => <div className="floating-tools"><button title="数产官微"><MessageSquare size={17} /></button><button title="联系方式"><Phone size={17} /></button><button title="用户反馈"><Mail size={17} /></button><button title="返回顶部">⌃</button></div>;

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}

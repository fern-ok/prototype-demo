/**
 * @name 授权运营平台门户数据产品
 * @mode axure
 *
 * 参考资料：
 * - C:/Users/Lenovo/Desktop/门户数据产品html.txt
 * - 用户提供的数据产品门户截图
 *
 * 公共数据资源授权运营管理平台门户数据产品列表页原型
 */

import {
  Box,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  FileText,
  Grid3X3,
  Layers3,
  MapPin,
  Search,
  Star,
} from 'lucide-react';
import PortalLayout from '../../common/PortalLayout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

const industries = [
  ['全部', 81], ['农、林、牧、渔业', 19], ['采矿业', 8], ['制造业', 8], ['电力、热力、燃气及水生产和供应业', 11],
  ['建筑业', 2], ['批发和零售业', 3], ['交通运输、仓储和邮政业', 3], ['住宿和餐饮业', 1], ['信息传输、软件和信息技术服务业', 4],
  ['金融业', 2], ['房地产业', 0], ['科学研究和技术服务业', 0], ['租赁和商务服务业', 0], ['水利、环境和公共设施管理业', 0],
  ['居民服务、修理和其他服务业', 0], ['卫生和社会工作', 13], ['公共管理、社会保障和社会组织', 7],
];

const ranking = [
  '祁东黄花菜空间矢量再开发产品', '再开发开发中心吉首市062301API5-扩展码32位改成空', '再开发产品0717API产品02', '卫健委医疗资源h060902',
  '吉首再开发产品整体API062501', '湖南省医疗就诊数据再开发产品76', '常德公共专区二级产品', '湖南省-社会保障-医保结算个人画像', 'shaxiang_test二级0604', '招商-开发中心再开产品API060401'
];

const products = [
  { title: 'thm-0805-1数据集-已下架变更-平台...', org: '服装时报社工会', type: '数据集', industry: '正餐服务,快餐服务', date: '2026/8/5', field: '软件开发', area: '衡阳市', desc: '测试-已下架变更-平台审核不通过变更-区域审核不通过变更', price: '88,800.00元/次', orders: 0, views: 1 },
  { title: '0804-thm二级产品数据集', org: '服装时报社工会', type: '数据集', industry: '电力供应', date: '2026/8/4', field: '软件开发', area: '衡阳市', desc: '测试', price: '5,500.00元/次', orders: 0, views: 0 },
  { title: '预付费-thm二级产品0730API', org: '服装时报社工会', type: 'API产品', industry: '烟煤和无烟煤开采洗选', date: '2026/8/4', field: '软件开发', area: '衡阳市', desc: '测试', price: '5,000.00元/次', orders: 0, views: 1 },
  { title: '常德二级数据产品0804', org: '常德市医保集团有限公司', type: 'API产品', industry: '褐煤开采洗选', date: '2026/8/4', field: '卫生健康', area: '常德市', desc: '1', price: '9元/次', orders: 0, views: 1, logo: true },
  { title: '湖南省-卫生-医疗就诊数据再开发717', org: '湖南天河国云科技有限公司', type: 'API产品', industry: '稻谷种植,小麦种植,玉米种植', date: '2026/8/3', field: '卫生健康', area: '省本级', desc: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMMM...', price: '10,000.00元/次', orders: 1, views: 8 },
  { title: '再开发产品testhht07311620', org: '其他经营科技集团股份有限公司', type: 'API产品', industry: '稻谷加工', date: '2026/7/31', field: '软件开发', area: '衡阳市', desc: 'testhht07311620', price: '32,100.00元/次', orders: 0, views: 3 },
  { title: 'test_0730调用API', org: '服装时报社工会', type: 'API产品', industry: '电力供应', date: '2026/7/30', field: '软件开发', area: '衡阳市', desc: 'test_0730调用API测试', price: '5,000.00元/次', orders: 0, views: 2 },
  { title: '再开发产品testhht07301543', org: '其他经营科技集团股份有限公司', type: 'API产品', industry: '住宅房屋建筑', date: '2026/7/30', field: '软件开发', area: '衡阳市', desc: '但是', price: '12,300.00元/次', orders: 0, views: 0 },
  { title: '再开发产品07291704', org: '服装时报社工会', type: '数据集', industry: '电力供应', date: '2026/7/30', field: '软件开发', area: '衡阳市', desc: '再开发产品07291704', price: '8,800.00元/次', orders: 0, views: 0 },
  { title: 'shaxiang_test二级0604', org: '杭州趣链科技股份有限公司', type: 'API产品', industry: '小麦加工,玉米加工,杂粮加工', date: '2026/7/30', field: '卫生健康', area: '省本级', desc: '1', price: '20,000,000.00元/次', orders: 1, views: 15 },
];

const productTypes = ['全部', '数据集', 'API产品', '数据应用', '数据报告', '其他'];
const cities = ['全部', '省本级', '长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西土家族苗族自治州'];
const fields = ['全部', '整体', '卫生健康', '气象服务', '文化旅游', '交通运输', '城市治理', '自然资源', '工业制造', '创新金融', '智慧农业', '体育竞技', '金融服务', '公共安全', '三医联动', '运动营业', '医疗保障', '应急管理'];

const OriginalComponent = () => (
  <PortalLayout className="product-portal-page" activeNav="product" specContent={specContent} changeLogContent={changeLogContent}>
      <section className="product-hero"><div className="hero-line"></div></section>
      <main className="product-main">
        <aside className="left-sidebar">
          <IndustryCard />
          <RankingCard title="浏览排行" items={ranking} icon="eye" />
          <RankingCard title="订阅排行" items={[...ranking].reverse()} icon="sub" />
        </aside>
        <section className="content-panel">
          <SearchPanel />
          <div className="list-title-row"><div className="list-title"><i></i><h2>数据产品列表</h2></div><div className="sort-row">排序：<span>浏览次数</span><span className="sort-sub">订阅次数</span><span>更新时间</span><strong>共 81 个数据</strong></div></div>
          <div className="product-list-grid">{products.map(item => <ProductItem key={item.title} item={item} />)}</div>
          <Pagination />
        </section>
      </main>
  </PortalLayout>
);

const IndustryCard = () => <div className="side-card industry-card"><div className="side-card-title"><Grid3X3 size={18} />行业分类</div><div className="industry-list">{industries.map(([name, count], index) => <div className={'industry-item ' + (index === 0 ? 'active' : '')} key={name as string}><span>{name}</span><b>（{count}）</b></div>)}</div></div>;
const RankingCard = ({ title, items, icon }: { title: string; items: string[]; icon: string }) => <div className={'side-card ranking-card ranking-' + icon}><div className="ranking-title">{icon === 'eye' ? <Eye size={17} /> : <Star size={17} />}{title}</div>{items.map((item, index) => <div className="rank-item" key={item}><em className={index < 3 ? 'hot' : ''}>{index + 1}</em><span>{item}</span></div>)}</div>;

const SearchPanel = () => <div className="search-panel"><div className="big-search"><Search size={24} /><input placeholder="请输入数据产品名称" /><button>搜 索</button></div><FilterRow label="产品类型" items={productTypes} /><FilterRow label="所属地域" items={cities} /><FilterRow label="领域名称" items={fields} /><button className="expand-btn">展开 <ChevronDown size={14} /></button></div>;
const FilterRow = ({ label, items }: { label: string; items: string[] }) => <div className="filter-row"><strong>{label}：</strong><div>{items.map(item => <label key={item}><input type="checkbox" />{item}</label>)}</div></div>;

const ProductItem = ({ item }: { item: typeof products[number] }) => <article className="list-product-card"><div className="product-info-main"><h3>{item.title}</h3><div className="product-org"><Building2 size={15} />{item.org}</div><div className="product-attrs"><span><Box size={15} />{item.type}</span><span><Layers3 size={15} />{item.industry}</span><span><FileText size={15} />{item.date}</span><span><Grid3X3 size={15} />{item.field}</span><span><MapPin size={15} />{item.area}</span></div><p>{item.desc}</p></div><div className={'thumb ' + (item.logo ? 'logo' : '')}>{item.logo ? '数' : ''}</div><div className="product-card-footer"><strong>￥ {item.price}</strong><span className="count-orders"><FileText size={14} />{item.orders}</span><span className="count-views"><Eye size={14} />{item.views}</span><span className="count-orders"><Star size={14} />收藏</span></div></article>;
const Pagination = () => <div className="portal-pagination"><span>共 81 条</span><button>10条/页</button><button disabled><ChevronLeft size={14} /></button>{[1,2,3,4,5,6].map(n => <button className={n === 1 ? 'active' : ''} key={n}>{n}</button>)}<button>...</button><button>9</button><button><ChevronRight size={14} /></button><span>前往</span><input value="1" readOnly /><span>页</span></div>;

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}



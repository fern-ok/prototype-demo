/**
 * @name 再开发数据产品监管
 * @mode axure
 *
 * 再开发数据产品监管列表（数据管理部门视角），归属「授权监管」菜单组
 */

import { useMemo, useState } from 'react';
import Layout from '../../common/Layout';
import RegionCascader from '../../common/RegionCascader';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';
import '../../common/backend-list.css';

interface RedevProduct {
  id: number;
  code: string;
  productName: string;
  productType: string;
  region: string;
  domain: string;
  provider: string;
  progress: number;
  status: string;
}

const PRODUCT_TYPE_OPTIONS = ['API产品', '数据集'];
const PRODUCT_STATUS_LIST = ['待审查', '登记中', '上架中', '已上架', '已下架'];
const DOMAIN_OPTIONS = ['科技创新', '软件开发', '农业农村', '医疗健康', '交通运输', '教育', '文化旅游', '金融服务', '城市治理', '应急管理'];

/** 产品状态 → 进度百分比（固定映射） */
const STATUS_PROGRESS: Record<string, number> = {
  '待审查': 50,
  '登记中': 50,
  '上架中': 80,
  '已上架': 100,
  '已下架': 100
};

/** 产品状态 → 进度条颜色 */
const STATUS_PROGRESS_COLOR: Record<string, string> = {
  '待审查': 'blue',
  '登记中': 'blue',
  '上架中': 'blue',
  '已上架': 'green',
  '已下架': 'red'
};

/** 产品状态 → 标签样式类 */
const getStatusClass = (status: string) => {
  if (status === '已上架') return 'status-approved';
  if (status === '已下架') return 'status-rejected';
  return 'status-pending';
};

/** 数据产品标识码（演示数据，稳定可复现） */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const buildCode = (id: number) => {
  const a = CODE_CHARS[(id * 7) % 32];
  const b = CODE_CHARS[(id * 13 + 5) % 32];
  const c = CODE_CHARS[(id * 29 + 11) % 32];
  const d = CODE_CHARS[(id * 17 + 19) % 32];
  return '26.4300.HN.' + String(id).padStart(4, '0') + '.' + a + b + c + d;
};

/** 前 10 条与参照截图第一页一致（均为待审查状态） */
const firstSeed: Array<Omit<RedevProduct, 'id' | 'code' | 'progress'>> = [
  { productName: '测试0831', productType: '数据集', region: '湘西土家族苗族自治州', domain: '科技创新', provider: '动态智行（吉首）科技有限公司', status: '待审查' },
  { productName: '玛开发产品08290947', productType: '数据集', region: '衡阳市', domain: '软件开发', provider: '服装时报工会', status: '待审查' },
  { productName: 'AUTOREG28-RD-LN', productType: '数据集', region: '湘西土家族苗族自治州', domain: '科技创新', provider: '动态智行（吉首）科技有限公司', status: '待审查' },
  { productName: 'AUTOREG28-RD-SEC', productType: '数据集', region: '湘西土家族苗族自治州', domain: '科技创新', provider: '动态智行（吉首）科技有限公司', status: '待审查' },
  { productName: 'AUTOREG28-RDPREVIEW', productType: '数据集', region: '湘西土家族苗族自治州', domain: '科技创新', provider: '动态智行（吉首）科技有限公司', status: '待审查' },
  { productName: '穆双地板砖串床保护数据集', productType: 'API产品', region: '祁东县', domain: '农业农村', provider: '杭州趣链科技股份有限公司', status: '待审查' },
  { productName: '再开发产品testth0829', productType: 'API产品', region: '衡阳市', domain: '软件开发', provider: '服装时报工会', status: '待审查' },
  { productName: '吉首市api再开发产品服务', productType: 'API产品', region: '湘西土家族苗族自治州', domain: '科技创新', provider: '动态智行（吉首）科技有限公司', status: '待审查' },
  { productName: '推动成功技创新二级产品', productType: '数据集', region: '湘西土家族苗族自治州', domain: '科技创新', provider: '动态智行（吉首）科技有限公司', status: '待审查' },
  { productName: '张家界景区客流监测产品', productType: 'API产品', region: '张家界市', domain: '文化旅游', provider: '湖南数据产业集团有限公司', status: '待审查' }
];

const GEN_NAME_PREFIX = [
  '城市更新地块体征', '居民健康档案画像', '企业信用综合核验', '交通卡口流量监测', '水环境质量监测', '校园安全运行监测',
  '文旅消费热点分析', '产业链产能配套', '气象风险分级预警', '农产品全程溯源', '社保参保画像', '不动产登记核验',
  '燃气管网运行监测', '畜禽养殖备案', '汛期山洪预警', '楼宇经济统计', '公积金缴存核验', '药品流向追溯',
  '夜间经济活跃度', '港口货运吞吐', '充电桩分布画像', '流动摊贩治理', '医保基金风控', '重点车辆轨迹'
];
const GEN_REGIONS = ['省本级', '长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '常德市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '张家界市', '邵阳市', '湘西土家族苗族自治州', '天心区', '祁东县', '吉首市'];
const GEN_PROVIDERS = ['动态智行（吉首）科技有限公司', '杭州趣链科技股份有限公司', '服装时报工会', '湖南天河国云科技有限公司', '湖南数据产业集团有限公司', '长沙数字科技有限公司', '株洲国投数据服务有限公司', '衡阳智慧城市科技有限公司'];

/** 共 217 条：前 10 条 + 207 条稳定生成的演示数据，状态覆盖五种 */
const seedData: RedevProduct[] = (function buildProducts() {
  const list: RedevProduct[] = [];
  firstSeed.forEach(function (item) {
    const id = list.length + 1;
    list.push({
      id: id,
      code: buildCode(id),
      progress: STATUS_PROGRESS[item.status],
      productName: item.productName,
      productType: item.productType,
      region: item.region,
      domain: item.domain,
      provider: item.provider,
      status: item.status
    });
  });
  for (let i = 0; i < 207; i++) {
    const id = list.length + 1;
    const status = PRODUCT_STATUS_LIST[(i + 1) % PRODUCT_STATUS_LIST.length];
    const prefix = GEN_NAME_PREFIX[i % GEN_NAME_PREFIX.length];
    const round = Math.floor(i / GEN_NAME_PREFIX.length) + 1;
    const productType = i % 2 === 0 ? '数据集' : 'API产品';
    list.push({
      id: id,
      code: buildCode(id),
      progress: STATUS_PROGRESS[status],
      productName: prefix + (productType === '数据集' ? '数据集' : '查询API') + 'V' + round,
      productType: productType,
      region: GEN_REGIONS[(id * 5) % GEN_REGIONS.length],
      domain: DOMAIN_OPTIONS[(id * 3) % DOMAIN_OPTIONS.length],
      provider: GEN_PROVIDERS[(id * 7) % GEN_PROVIDERS.length],
      status: status
    });
  }
  return list;
})();

/** 产品详情弹窗 — 流程步骤 */
interface DetailStep {
  name: string;
  status: 'done' | 'current';
  time: string;
}

const DETAIL_STEPS: DetailStep[] = [
  { name: '安全审查', status: 'done', time: '2026-09-09 17:12:54' },
  { name: '产品登记', status: 'done', time: '2026-09-09 17:12:54' },
  { name: '产品上架', status: 'done', time: '2026-09-09 17:15:01' },
  { name: '产品交易', status: 'current', time: '-' }
];

/** 产品详情弹窗 — 订阅记录 */
interface SubRecord {
  no: number;
  time: string;
  orderNo: string;
  demander: string;
  orderStatus: string;
}

const DETAIL_SUBSCRIPTIONS: SubRecord[] = [
  { no: 1, time: '2026-09-09 17:31:55', orderNo: 'CPDY2026090900000002', demander: '湖南乐途科技有限公司', orderStatus: '已完成' },
  { no: 2, time: '2026-09-08 13:31:55', orderNo: 'CPDY2026090900000002', demander: '湖南天河国云科技有限公司', orderStatus: '已完成' }
];

/** 产品配图占位图（离线可渲染的 data-uri SVG） */
const PRODUCT_IMAGE_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="150">' +
      '<rect width="240" height="150" fill="#eef4ff"/>' +
      '<rect x="0.5" y="0.5" width="239" height="149" fill="none" stroke="#cfe0ff"/>' +
      '<circle cx="80" cy="58" r="22" fill="#9cc0ff"/>' +
      '<path d="M40 118 L96 74 L132 104 L168 70 L200 118 Z" fill="#7aa7ff"/>' +
      '<text x="120" y="140" font-size="13" fill="#5a7bb5" text-anchor="middle" font-family="sans-serif">产品配图</text>' +
    '</svg>'
  );

const OriginalComponent = () => {
  const [activeMenu] = useState<'redev-data-product-supervision'>('redev-data-product-supervision');
  const [role, setRole] = useState('数据管理部门');

  const [records] = useState<RedevProduct[]>(seedData);

  // 筛选条件
  const [searchCode, setSearchCode] = useState('');
  const [searchProductName, setSearchProductName] = useState('');
  const [searchProductType, setSearchProductType] = useState('');
  const [searchRegion, setSearchRegion] = useState('');
  const [searchDomain, setSearchDomain] = useState('');
  const [searchProvider, setSearchProvider] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  // 列表分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 弹窗
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<RedevProduct | null>(null);

  const filteredList = useMemo(() => {
    return records.filter(function (r) {
      if (searchCode && !r.code.toLowerCase().includes(searchCode.trim().toLowerCase())) return false;
      if (searchProductName && !r.productName.includes(searchProductName.trim())) return false;
      if (searchProductType && r.productType !== searchProductType) return false;
      if (searchRegion && r.region !== searchRegion) return false;
      if (searchDomain && r.domain !== searchDomain) return false;
      if (searchProvider && !r.provider.includes(searchProvider.trim())) return false;
      if (searchStatus && r.status !== searchStatus) return false;
      return true;
    });
  }, [records, searchCode, searchProductName, searchProductType, searchRegion, searchDomain, searchProvider, searchStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleQuery = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchCode('');
    setSearchProductName('');
    setSearchProductType('');
    setSearchRegion('');
    setSearchDomain('');
    setSearchProvider('');
    setSearchStatus('');
    setCurrentPage(1);
  };

  const handleView = (record: RedevProduct) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  const renderFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        <div className="filter-item">
          <label>数据产品标识码</label>
          <input type="text" placeholder="请输入" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>产品名称</label>
          <input type="text" placeholder="请输入" value={searchProductName} onChange={(e) => setSearchProductName(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>产品类型</label>
          <select value={searchProductType} onChange={(e) => setSearchProductType(e.target.value)}>
            <option value="">请选择</option>
            {PRODUCT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <RegionCascader value={searchRegion} onChange={setSearchRegion} />
      </div>
      <div className="filter-row">
        <div className="filter-item filter-item-select">
          <label>领域名称</label>
          <select value={searchDomain} onChange={(e) => setSearchDomain(e.target.value)}>
            <option value="">请选择</option>
            {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <label>产品提供方</label>
          <input type="text" placeholder="请输入" value={searchProvider} onChange={(e) => setSearchProvider(e.target.value)} />
        </div>
        <div className="filter-item filter-item-select">
          <label>产品状态</label>
          <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)}>
            <option value="">请选择</option>
            {PRODUCT_STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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

  const renderProgress = (record: RedevProduct) => (
    <div className="progress-cell">
      <div className="progress-track">
        <div className={'progress-fill progress-' + STATUS_PROGRESS_COLOR[record.status]} style={{ width: record.progress + '%' }}></div>
      </div>
      <span className="progress-text">{record.progress}%</span>
    </div>
  );

  const renderTable = () => (
    <div className="table-section">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-index">序号</th>
              <th className="col-code">数据产品标识码</th>
              <th className="col-product">产品名称</th>
              <th className="col-product-type">产品类型</th>
              <th className="col-region">所属地域</th>
              <th className="col-domain">领域名称</th>
              <th className="col-provider">产品提供方</th>
              <th className="col-progress">产品进度</th>
              <th className="col-status">产品状态</th>
              <th className="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  暂无数据
                </td>
              </tr>
            ) : (
              paginatedList.map((record, index) => (
                <tr key={record.id}>
                  <td className="col-index">{(safePage - 1) * pageSize + index + 1}</td>
                  <td className="col-code" title={record.code}>{record.code}</td>
                  <td className="col-product" title={record.productName}>{record.productName}</td>
                  <td className="col-product-type"><span className="type-tag">{record.productType}</span></td>
                  <td className="col-region" title={record.region}>{record.region}</td>
                  <td className="col-domain">{record.domain}</td>
                  <td className="col-provider" title={record.provider}>{record.provider}</td>
                  <td className="col-progress">{renderProgress(record)}</td>
                  <td className="col-status"><span className={'status-tag ' + getStatusClass(record.status)}>{record.status}</span></td>
                  <td className="col-action">
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => handleView(record)}>查看</button>
                    </div>
                  </td>
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
            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
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

  const renderSteps = () => (
    <div className="detail-steps">
      {DETAIL_STEPS.map((step, idx) => (
        <div className="detail-step" key={step.name}>
          <div className="detail-step-node">
            <span className={'step-icon step-icon-' + step.status}>{step.status === 'done' ? '✓' : ''}</span>
            {idx < DETAIL_STEPS.length - 1 && (
              <span className={'step-line step-line-' + (step.status === 'done' ? 'done' : 'todo')}></span>
            )}
          </div>
          <div className="detail-step-meta">
            <div className="detail-step-name">{step.name}</div>
            <div className={'detail-step-time step-time-' + step.status}>{step.time}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderViewModal = () => (
    <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
      <div className="modal-wide" key={currentRecord?.id ?? 'detail'} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>产品详情</h3>
          <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
        </div>
        <div className="modal-body">
          {/* 顶部流程步骤条 */}
          {renderSteps()}

          <div className="detail-columns">
            {/* 左侧栏：基本信息（上） + 定价信息（下） */}
            <div className="detail-left">
              <div className="module-block">
                <div className="module-title">基本信息</div>
                <div className="detail-info-grid">
                  <div className="info-label">产品名称</div>
                  <div className="info-value">芯超核保 0909</div>
                  <div className="info-label">数据产品标识码</div>
                  <div className="info-value">691430103329382112A430029CKR8EL0</div>
                  <div className="info-label">产品类型</div>
                  <div className="info-value"><span className="type-tag">API 产品</span></div>
                  <div className="info-label">行业分类</div>
                  <div className="info-value">综合医院</div>
                  <div className="info-label">产品进度</div>
                  <div className="info-value">
                    <div className="progress-cell">
                      <div className="progress-track"><div className="progress-fill progress-green" style={{ width: '100%' }}></div></div>
                      <span className="progress-text">100%</span>
                    </div>
                  </div>
                  <div className="info-label">产品状态</div>
                  <div className="info-value"><span className="status-tag status-approved">已上架</span></div>
                  <div className="info-label">产品简介</div>
                  <div className="info-value info-value-span3">测试</div>
                </div>
              </div>

              <div className="module-block">
                <div className="module-title">定价信息</div>
                <div className="detail-info-grid">
                  <div className="info-label">计量方式</div>
                  <div className="info-value">按次数</div>
                  <div className="info-label">价格</div>
                  <div className="info-value">0.01 元 / 次</div>
                  <div className="info-label">产品配图</div>
                  <div className="info-value info-value-span3">
                    <div className="product-image-box">
                      <img src={PRODUCT_IMAGE_SVG} alt="产品配图" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧栏：产品交易记录 */}
            <div className="detail-right">
              <div className="module-block">
                <div className="module-title">产品交易记录</div>
                <div className="sub-list">
                  {DETAIL_SUBSCRIPTIONS.map((sub) => (
                    <div className="sub-record" key={sub.no}>
                      <div className="sub-head">
                        <span className="sub-dot">{sub.no}</span>
                        <span className="sub-time">{sub.time}</span>
                      </div>
                      <div className="sub-body">
                        <div className="sub-row"><span className="sub-key">订单编号</span><span className="sub-val">{sub.orderNo}</span></div>
                        <div className="sub-row"><span className="sub-key">数据需求方</span><span className="sub-val">{sub.demander}</span></div>
                        <div className="sub-row">
                          <span className="sub-key">订单状态</span>
                          <span className="sub-val"><span className="status-tag status-approved">{sub.orderStatus}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={() => setShowViewModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout
      activeMenu={activeMenu}
      breadcrumb="再开发数据产品监管"
      role={role}
      onRoleChange={setRole}
      roleOptions={['数据管理部门']}
      title="再开发数据产品监管"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      {renderFilter()}
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

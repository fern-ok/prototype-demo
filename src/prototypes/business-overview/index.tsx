/**
 * @name 业务概览
 * @mode axure
 *
 * 业务概览页面（数据管理部门视角），归属「其他」一级菜单下的二级菜单。
 * 页面顶部为「全省总览」概览卡（机构数据 / 资源与产品登记 / 产品流通三大板块），
 * 下方为各地域的机构备案分布卡片：每张卡片展示该地域的机构备案数量，支持卡片展开/收起。
 * 两类下钻（均为页面内视图切换，带返回导航）：
 *  1. 地域明细：市州卡片进入市州下钻视图——市州级概览卡 + 下辖区县机构备案卡片；
 *  2. 领域明细：地域 / 区县卡片进入领域下钻视图——「整体领域」汇总卡（机构数据 / 资源与产品登记 /
 *     产品流通）+ 各领域机构数据卡片；市州领域视图可再进入「区县领域概览」查看各区县机构数据。
 */

import { Fragment, useState } from 'react';
import { Undo2 } from 'lucide-react';
import Layout from '../../common/Layout';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';
import '../../common/backend-list.css';

// 地域选项（省本级 + 14 市州，与全平台口径一致）
const REGION_OPTIONS = [
  '省本级', '长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '常德市', '张家界市',
  '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西土家族苗族自治州'
];

// 全省总览 - 机构数据板块
const OVERVIEW_ORG_DATA: Array<{ label: string; value: number }> = [
  { label: '数据管理部门', value: 1 },
  { label: '行业主管部门', value: 10 },
  { label: '实施机构', value: 12 },
  { label: '运营机构', value: 12 },
  { label: '其他经营主体', value: 12 }
];

// 全省总览 - 资源与产品登记板块
const OVERVIEW_RESOURCE_DATA: Array<{ label: string; value: number }> = [
  { label: '数据资源登记', value: 30 },
  { label: '数据资源授权', value: 10 },
  { label: '基础数据产品', value: 60 },
  { label: '场景发布', value: 30 },
  { label: '场景申报数', value: 300 },
  { label: '再开发数据产品', value: 90 }
];

// 全省总览 - 产品流通板块（流通率为派生指标，附说明）
const OVERVIEW_CIRCULATION_DATA: Array<{ label: string; value: number | string; hint?: boolean }> = [
  { label: '流通数据产品', value: 30 },
  { label: '有效交易订单', value: 10 },
  { label: '调用成功次数', value: 10000 },
  { label: '产品订单总额', value: 40000 },
  { label: '产品流通率', value: '33.33%', hint: true }
];

// 地域卡片 - 机构备案 / 市州概览 - 机构数据（演示数据，与图片中各级卡片展示一致）
const REGION_ORG_DATA: Array<{ label: string; value: number }> = [
  { label: '数据管理部门', value: 12 },
  { label: '行业主管部门', value: 10 },
  { label: '实施机构', value: 12 },
  { label: '运营机构', value: 12 },
  { label: '其他经营主体', value: 12 }
];

// 领域视图 - 机构数据（按领域口径，无数据管理部门维度）
const DOMAIN_ORG_DATA: Array<{ label: string; value: number }> = [
  { label: '行业主管部门', value: 1 },
  { label: '实施机构', value: 1 },
  { label: '运营机构', value: 1 },
  { label: '其他经营主体', value: 12 }
];

// 领域卡片（领域下钻视图中逐领域展示）
const DOMAIN_CARDS = ['卫健领域', '科技领域', '交通领域', '文旅领域', '金融领域'];

// 市州下辖区县（用于地域明细下钻视图；省本级无下级地域，按钮不展示）
const DISTRICT_POOL: Record<string, string[]> = {
  '长沙市': ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区'],
  '株洲市': ['天元区', '荷塘区', '芦淞区', '石峰区', '渌口区'],
  '湘潭市': ['雨湖区', '岳塘区', '湘潭县', '湘乡市', '韶山市'],
  '衡阳市': ['雁峰区', '石鼓区', '珠晖区', '蒸湘区', '南岳区'],
  '岳阳市': ['岳阳楼区', '云溪区', '君山区', '汨罗市', '临湘市'],
  '常德市': ['武陵区', '鼎城区', '津市市', '安乡县', '汉寿县'],
  '张家界市': ['永定区', '武陵源区', '慈利县', '桑植县'],
  '益阳市': ['赫山区', '资阳区', '沅江市', '南县', '桃江县'],
  '郴州市': ['北湖区', '苏仙区', '资兴市', '桂阳县', '宜章县'],
  '永州市': ['零陵区', '冷水滩区', '祁阳市', '东安县', '双牌县'],
  '怀化市': ['鹤城区', '洪江市', '沅陵县', '辰溪县', '溆浦县'],
  '娄底市': ['娄星区', '冷水江市', '涟源市', '双峰县', '新化县'],
  '湘西土家族苗族自治州': ['吉首市', '泸溪县', '凤凰县', '花垣县', '保靖县']
};

// 机构数据弹窗 - 各角色的单位名称模板（按角色生成演示机构名，取模轮转保证不重复）
const ORG_NAME_TEMPLATES: Record<string, string[]> = {
  '数据管理部门': ['数据资源管理局', '数据局', '大数据管理局', '政务服务和大数据局'],
  '行业主管部门': ['卫生健康委员会', '教育局', '科学技术局', '交通运输局', '农业农村局', '工业和信息化局', '自然资源和规划局', '生态环境局', '文化旅游广电体育局', '市场监督管理局', '水利局', '林业局'],
  '实施机构': ['大数据中心', '信息中心', '数据服务中心', '政务大数据中心'],
  '运营机构': ['数据运营有限公司', '大数据产业发展有限公司', '数字城市建设运营有限公司', '数据集团有限公司'],
  '其他经营主体': ['云数据科技有限公司', '信息技术有限公司', '智能科技有限公司', '数据服务有限公司']
};

// 机构数据弹窗 - 授权运营类型 / 领域名称选项（实施机构、运营机构列表展示）
const MODAL_AUTH_TYPE_OPTIONS = ['整体授权', '分领域授权'];
const MODAL_DOMAIN_OPTIONS = ['卫健领域', '科技领域', '交通领域', '文旅领域', '金融领域'];

/** 机构数据弹窗 - 各角色列表列配置（按角色展示不同字段，与机构监管列表口径一致） */
const ORG_MODAL_COLUMNS: Record<string, Array<{ key: string; label: string }>> = {
  '数据管理部门': [
    { key: 'region', label: '所属地域' },
    { key: 'name', label: '单位/企业名称' },
    { key: 'credit', label: '统一社会信用代码' },
    { key: 'time', label: '创建时间' }
  ],
  '行业主管部门': [
    { key: 'batch', label: '批次' },
    { key: 'region', label: '所属地域' },
    { key: 'name', label: '单位/企业名称' },
    { key: 'credit', label: '统一社会信用代码' },
    { key: 'time', label: '创建时间' },
    { key: 'rel', label: '已备案实施机构' }
  ],
  '实施机构': [
    { key: 'region', label: '所属地域' },
    { key: 'authType', label: '授权运营类型' },
    { key: 'domain', label: '领域名称' },
    { key: 'name', label: '单位/企业名称' },
    { key: 'credit', label: '统一社会信用代码' },
    { key: 'time', label: '备案时间' },
    { key: 'rel', label: '已备案运营机构' }
  ],
  '运营机构': [
    { key: 'region', label: '所属地域' },
    { key: 'authType', label: '授权运营类型' },
    { key: 'domain', label: '领域名称' },
    { key: 'name', label: '单位/企业名称' },
    { key: 'credit', label: '统一社会信用代码' },
    { key: 'time', label: '备案时间' },
    { key: 'rel', label: '已授权其他经营主体' }
  ],
  '其他经营主体': [
    { key: 'region', label: '所属地域' },
    { key: 'name', label: '单位/企业名称' },
    { key: 'credit', label: '统一社会信用代码' },
    { key: 'time', label: '授权时间' }
  ]
};

/** 简单字符串哈希（确定性伪随机，保证每次渲染生成的演示数据一致） */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 生成机构数据弹窗的演示机构列表（行数与卡片展示的指标数值一致） */
function buildOrgRows(m: { role: string; scopeName: string; regionPrefix: string; count: number }) {
  const templates = ORG_NAME_TEMPLATES[m.role] || ['数据有限公司'];
  const pad = (n: number) => String(n).padStart(2, '0');
  const rows: Array<Record<string, string | number>> = [];
  for (let i = 0; i < m.count; i++) {
    const h = hashCode(m.regionPrefix + '|' + m.role + '|' + i);
    const group = Math.floor(i / templates.length);
    const name = m.regionPrefix + templates[i % templates.length] + (group > 0 ? '(' + (group + 1) + ')' : '');
    const day = new Date(Date.UTC(2026, 0, 1) + (h % 280) * 86400000);
    rows.push({
      region: m.regionPrefix,
      name: name,
      credit: '9143' + String(h % 10000000000).padStart(10, '0') + String((h >>> 7) % 10000).padStart(4, '0') + 'X',
      batch: '第' + (1 + (h % 3)) + '批',
      time: day.getUTCFullYear() + '-' + pad(day.getUTCMonth() + 1) + '-' + pad(day.getUTCDate()) +
        ' ' + pad((h >>> 4) % 24) + ':' + pad((h >>> 9) % 60) + ':' + pad((h >>> 14) % 60),
      authType: MODAL_AUTH_TYPE_OPTIONS[h % 2],
      domain: MODAL_DOMAIN_OPTIONS[h % MODAL_DOMAIN_OPTIONS.length],
      rel: h % 5
    });
  }
  return rows;
}

const OriginalComponent = () => {
  const [role, setRole] = useState('数据管理部门');
  // 各卡片展开状态（默认收起，仅展示机构数据/机构备案；展开后追加资源与产品登记、产品流通板块）
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // 地域明细下钻：当前进入的市州名（null = 全省视图）
  const [areaDrill, setAreaDrill] = useState<string | null>(null);
  // 领域明细下钻：region 为进入来源地域 / 区县名，from 为返回目标（'province' 或市州名）
  const [domainDrill, setDomainDrill] = useState<{ region: string; from: string } | null>(null);
  // 区县领域概览：当前市州名（在领域下钻视图内再下钻一层）
  const [districtDomain, setDistrictDomain] = useState<string | null>(null);
  // 机构数据弹窗：点击卡片「机构数据」指标后，展示该角色在当前分类（全省/地域/区县/领域）下的机构列表
  const [orgModal, setOrgModal] = useState<{ role: string; scopeName: string; regionPrefix: string; count: number } | null>(null);

  const openOrgModal = (role: string, count: number, scopeName: string, regionPrefix: string) => {
    setOrgModal({ role: role, count: count, scopeName: scopeName, regionPrefix: regionPrefix });
  };
  const closeOrgModal = () => setOrgModal(null);

  const isExpanded = (key: string) => expanded[key] === true;
  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !isExpanded(key) }));
  };

  /** 打开领域下钻：记录返回目标（全省视图或所在市州视图） */
  const openDomainDrill = (region: string, from: string) => {
    setDistrictDomain(null);
    setDomainDrill({ region: region, from: from });
  };

  /** 返回地域概览：回到进入领域视图前的位置（全省或市州视图） */
  const backFromDomainDrill = () => {
    setDomainDrill(null);
    setDistrictDomain(null);
    if (areaDrill && domainDrill && domainDrill.from !== 'province') {
      setAreaDrill(domainDrill.from);
    } else if (domainDrill && domainDrill.from === 'province') {
      setAreaDrill(null);
    }
  };

  /** 指标组（label 在上、数值在下；hint 项带「?」口径角标；onRoleClick 传入时指标可点击，弹出该角色机构列表） */
  const renderMetrics = (
    items: Array<{ label: string; value: number | string; hint?: boolean }>,
    onRoleClick?: (role: string, count: number) => void
  ) => (
    <div className="overview-metrics">
      {items.map(function (it) {
        const clickable = !!onRoleClick;
        return (
          <div
            className={'metric' + (clickable ? ' metric-clickable' : '')}
            key={it.label}
            onClick={clickable ? function () { onRoleClick!(it.label, Number(it.value)); } : undefined}
            title={clickable ? '点击查看' + it.label + '机构列表' : undefined}
          >
            <div className="metric-label">
              {it.label}
              {it.hint && (
                <span className="metric-hint" title="产品流通率 = 流通数据产品 / 基础数据产品">?</span>
              )}
            </div>
            <div className="metric-value">{it.value}</div>
          </div>
        );
      })}
    </div>
  );

  /** 三大板块（机构数据 / 资源与产品登记 / 产品流通），全省总览、市州概览与领域汇总共用；onRoleClick 仅作用于「机构数据」板块 */
  const renderOverviewSections = (
    orgData: Array<{ label: string; value: number }>,
    onRoleClick?: (role: string, count: number) => void
  ) => (
    <div className="overview-sections">
      <div className="overview-section">
        <div className="overview-section-title">机构数据</div>
        {renderMetrics(orgData, onRoleClick)}
      </div>
      <div className="overview-divider" />
      <div className="overview-section">
        <div className="overview-section-title">资源与产品登记</div>
        {renderMetrics(OVERVIEW_RESOURCE_DATA)}
      </div>
      <div className="overview-divider" />
      <div className="overview-section">
        <div className="overview-section-title">产品流通</div>
        {renderMetrics(OVERVIEW_CIRCULATION_DATA)}
      </div>
    </div>
  );

  /**
   * 卡片展开板块：当前分类（地域 / 区县 / 领域）下的资源与产品登记、产品流通两栏数据。
   * 由卡片【展开/隐藏】按钮控制显隐，机构数据 / 机构备案板块常驻展示。
   */
  const renderExtraSections = () => (
    <div className="extra-sections">
      <div className="extra-section">
        <div className="overview-section-title">资源与产品登记</div>
        {renderMetrics(OVERVIEW_RESOURCE_DATA)}
      </div>
      <div className="extra-divider" />
      <div className="extra-section">
        <div className="overview-section-title">产品流通</div>
        {renderMetrics(OVERVIEW_CIRCULATION_DATA)}
      </div>
    </div>
  );

  /** 概览卡：title 左侧，actions 传入时展示标题右侧按钮组；onRoleClick 传入时「机构数据」指标可点击 */
  const renderOverviewCard = (
    title: string,
    orgData: Array<{ label: string; value: number }>,
    actions?: React.ReactNode,
    onRoleClick?: (role: string, count: number) => void
  ) => (
    <div className="overview-card">
      <div className="overview-card-head">
        <div className="overview-card-title">{title}</div>
        {actions && <div className="overview-card-actions">{actions}</div>}
      </div>
      {renderOverviewSections(orgData, onRoleClick)}
    </div>
  );

  /** 机构备案卡片（全省视图的地域卡片 / 市州下钻的区县卡片）；「机构备案」指标可点击弹出该角色机构列表 */
  const renderOrgCard = (name: string, showAreaBtn: boolean) => (
    <div className="region-card" key={name}>
      <div className="region-card-header">
        <div className="region-card-title">{name}</div>
        <div className="region-card-actions">
          {showAreaBtn && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setAreaDrill(name)}
            >
              地域明细
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openDomainDrill(name, areaDrill || 'province')}
          >
            领域明细
          </button>
          <button
            type="button"
            className="btn btn-default btn-sm"
            onClick={() => toggleExpand(name)}
          >
            {isExpanded(name) ? '隐藏' : '展开'}
          </button>
        </div>
      </div>
      <Fragment>
        <div className="region-subtitle">机构备案</div>
        {renderMetrics(REGION_ORG_DATA, (role, count) => openOrgModal(role, count, name, name))}
        {/* 展开/隐藏：当前分类下的资源与产品登记、产品流通数据 */}
        {isExpanded(name) && renderExtraSections()}
      </Fragment>
    </div>
  );

  /** 机构数据弹窗：展示当前分类下某角色的机构列表（列字段按角色区分，与机构监管列表口径一致） */
  const renderOrgModal = () => {
    if (!orgModal) return null;
    const rows = buildOrgRows(orgModal);
    const columns = ORG_MODAL_COLUMNS[orgModal.role] || [];
    return (
      <div className="org-modal-mask" onClick={closeOrgModal}>
        <div className="org-modal" onClick={function (e) { e.stopPropagation(); }}>
          <div className="org-modal-head">
            <div className="org-modal-title">
              {orgModal.scopeName} · {orgModal.role}（共 {rows.length} 条）
            </div>
            <button type="button" className="btn btn-default btn-sm" onClick={closeOrgModal}>
              关闭
            </button>
          </div>
          <div className="org-modal-body">
            <table className="org-modal-table">
              <thead>
                <tr>
                  <th className="org-modal-col-idx">序号</th>
                  {columns.map(function (c) {
                    return <th key={c.key}>{c.label}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map(function (r, i) {
                  return (
                    <tr key={i}>
                      <td className="org-modal-col-idx">{i + 1}</td>
                      {columns.map(function (c) {
                        return <td key={c.key}>{r[c.key]}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /** 领域下钻视图：标题行（进入区县领域概览 / 返回地域概览）+ 整体领域汇总卡 + 各领域卡片 */
  const renderDomainDrill = () => {
    if (!domainDrill) return null;
    const hasDistricts = (DISTRICT_POOL[domainDrill.region] || []).length > 0;
    return (
      <Fragment>
        <div className="overview-card domain-head-card">
          <div className="overview-card-head">
            <div className="overview-card-title accent">{domainDrill.region}</div>
            <div className="overview-card-actions">
              {hasDistricts && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setDistrictDomain(domainDrill.region)}
                >
                  进入区县领域概览
                </button>
              )}
              <button type="button" className="btn btn-primary btn-sm" onClick={backFromDomainDrill}>
                <Undo2 size={13} />
                返回地域概览
              </button>
            </div>
          </div>
          {/* 整体领域：按领域口径汇总的三大板块 */}
          <div className="domain-block-title accent">整体领域</div>
          {renderOverviewSections(DOMAIN_ORG_DATA, (role, count) =>
            openOrgModal(role, count, domainDrill.region + ' · 整体领域', domainDrill.region)
          )}
        </div>

        <div className="region-grid">
          {DOMAIN_CARDS.map(function (d) {
            return (
              <div className="region-card" key={d}>
                <div className="region-card-header">
                  <div className="region-card-title accent">{d}</div>
                  <div className="region-card-actions">
                    <button
                      type="button"
                      className="btn btn-default btn-sm"
                      onClick={() => toggleExpand(d)}
                    >
                      {isExpanded(d) ? '隐藏' : '展开'}
                    </button>
                  </div>
                </div>
                <Fragment>
                  <div className="region-subtitle">机构数据</div>
                  {renderMetrics(DOMAIN_ORG_DATA, (role, count) =>
                    openOrgModal(role, count, d + ' · ' + domainDrill.region, domainDrill.region)
                  )}
                  {/* 展开/隐藏：当前领域下的资源与产品登记、产品流通数据 */}
                  {isExpanded(d) && renderExtraSections()}
                </Fragment>
              </div>
            );
          })}
        </div>
      </Fragment>
    );
  };

  /** 区县领域概览：市州下辖区县的机构数据卡片 */
  const renderDistrictDomain = () => {
    if (!districtDomain) return null;
    const districts = DISTRICT_POOL[districtDomain] || [];
    return (
      <Fragment>
        <div className="area-drill-nav">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setDistrictDomain(null)}>
            <Undo2 size={13} />
            返回领域概览
          </button>
          <span className="area-drill-crumb">业务概览 / {districtDomain} / 区县领域概览</span>
        </div>
        <div className="region-grid">
          {districts.map(function (d) {
            return (
              <div className="region-card" key={d}>
                <div className="region-card-header">
                  <div className="region-card-title">{d}</div>
                  <div className="region-card-actions">
                    <button
                      type="button"
                      className="btn btn-default btn-sm"
                      onClick={() => toggleExpand('dd-' + d)}
                    >
                      {isExpanded('dd-' + d) ? '隐藏' : '展开'}
                    </button>
                  </div>
                </div>
                <Fragment>
                  <div className="region-subtitle">机构数据</div>
                  {renderMetrics(DOMAIN_ORG_DATA, (role, count) =>
                    openOrgModal(role, count, d + ' · ' + districtDomain + '领域', districtDomain)
                  )}
                  {/* 展开/隐藏：当前区县领域下的资源与产品登记、产品流通数据 */}
                  {isExpanded('dd-' + d) && renderExtraSections()}
                </Fragment>
              </div>
            );
          })}
        </div>
      </Fragment>
    );
  };

  /** 市州下钻视图：市州级概览卡 + 下辖区县机构备案卡片 */
  const renderAreaDrill = () => {
    if (!areaDrill) return null;
    const districts = DISTRICT_POOL[areaDrill] || [];
    return (
      <Fragment>
        <div className="area-drill-nav">
          <button type="button" className="btn btn-default btn-sm" onClick={() => setAreaDrill(null)}>
            返回业务概览
          </button>
          <span className="area-drill-crumb">业务概览 / {areaDrill}</span>
        </div>
        {/* 市州级概览卡：机构数据取市州口径，其余板块与全省总览一致 */}
        {renderOverviewCard(areaDrill, REGION_ORG_DATA, (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openDomainDrill(areaDrill, areaDrill)}
          >
            领域明细
          </button>
        ), (role, count) => openOrgModal(role, count, areaDrill, areaDrill))}
        <div className="region-grid">
          {districts.map(function (d) {
            return renderOrgCard(d, false);
          })}
        </div>
      </Fragment>
    );
  };

  return (
    <Layout
      activeMenu="business-overview"
      breadcrumb="业务概览"
      role={role}
      onRoleChange={setRole}
      roleOptions={['数据管理部门']}
      title="业务概览"
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      {districtDomain ? (
        renderDistrictDomain()
      ) : domainDrill ? (
        renderDomainDrill()
      ) : areaDrill ? (
        renderAreaDrill()
      ) : (
        <Fragment>
          {/* 全省总览概览卡 */}
          {renderOverviewCard('全省总览', OVERVIEW_ORG_DATA, undefined, (role, count) =>
            openOrgModal(role, count, '全省', '湖南省')
          )}

          {/* 各地域机构备案分布卡片 */}
          <div className="region-grid">
            {REGION_OPTIONS.map(function (region) {
              return renderOrgCard(region, region !== '省本级');
            })}
          </div>
        </Fragment>
      )}

      {/* 机构数据弹窗（点击卡片「机构数据 / 机构备案」指标触发） */}
      {renderOrgModal()}
    </Layout>
  );
};

const Component = () => <OriginalComponent />;

export default Component;

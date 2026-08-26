/**
 * @name 数据资源目录
 * @mode axure
 *
 * 实施机构角色的数据资源目录管理页，提供行业树筛选、组合查询、
 * 目录列表、详情与存证查看。
 */

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, RefreshCw, RotateCcw, Search, X } from 'lucide-react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

type Resource = {
  id: number;
  name: string;
  industry: string;
  reviewStatus: '已通过' | '待提交' | '提交待审核';
  mountStatus: '已挂载' | '待挂载';
  createdAt: string;
  updatedAt: string;
  provider: string;
};

const industries = ['农、林、牧、渔业', '采矿业', '制造业', '电力、热力、燃气及水生产和供应业', '建筑业', '批发和零售业', '交通运输、仓储和邮政业', '住宿和餐饮业', '信息传输、软件和信息技术服务业', '金融业', '房地产业', '科学研究和技术服务业', '租赁和商务服务业', '水利、环境和公共设施管理业', '居民服务、修理和其他服务业', '教育', '卫生和社会工作', '文化、体育和娱乐业', '公共管理、社会保障和社会组织', '国际组织'];

const seedResources: Resource[] = [
  { id: 1, name: '雷汉刘省蓄势九辰府将-农业生产数据', industry: '稻谷种植,小麦种植,玉米种植', reviewStatus: '已通过', mountStatus: '待挂载', createdAt: '2026-08-24 18:36:42', updatedAt: '2026-08-24 18:38:02', provider: '湖南省农业农村厅' },
  { id: 2, name: '测试资源062501', industry: '稻谷种植', reviewStatus: '已通过', mountStatus: '待挂载', createdAt: '2026-06-25 10:55:59', updatedAt: '2026-08-24 10:17:13', provider: '长沙市农业农村局' },
  { id: 3, name: '资源测试062601', industry: '稻谷种植,小麦种植', reviewStatus: '已通过', mountStatus: '待挂载', createdAt: '2026-06-26 16:12:07', updatedAt: '2026-08-24 10:17:11', provider: '株洲市农业农村局' },
  { id: 4, name: '测试一条资源', industry: '稻谷种植', reviewStatus: '已通过', mountStatus: '待挂载', createdAt: '2026-06-08 14:53:03', updatedAt: '2026-08-24 10:17:03', provider: '湘潭市农业农村局' },
  { id: 5, name: '测试0821-2', industry: '烟煤和无烟煤开采洗选', reviewStatus: '已通过', mountStatus: '待挂载', createdAt: '2026-08-21 15:06:54', updatedAt: '2026-08-21 15:08:00', provider: '湖南省能源局' },
  { id: 6, name: '测试0821', industry: '豆类种植', reviewStatus: '已通过', mountStatus: '待挂载', createdAt: '2026-08-21 14:29:15', updatedAt: '2026-08-21 14:30:00', provider: '益阳市农业农村局' },
  { id: 7, name: '测试资源0817', industry: '稻谷种植,小麦种植', reviewStatus: '已通过', mountStatus: '待挂载', createdAt: '2026-08-17 14:20:04', updatedAt: '2026-08-18 16:52:01', provider: '岳阳市农业农村局' },
  { id: 8, name: '湖南省医疗就诊数据资源', industry: '综合医院,中医医院,中西医结合医院', reviewStatus: '已通过', mountStatus: '已挂载', createdAt: '2026-08-11 15:23:32', updatedAt: '2026-08-11 15:28:15', provider: '湖南省卫生健康委' },
  { id: 9, name: '测试资源0810', industry: '林木育苗', reviewStatus: '已通过', mountStatus: '已挂载', createdAt: '2026-08-10 10:39:50', updatedAt: '2026-08-10 17:28:01', provider: '湖南省林业局' },
  { id: 10, name: '地域分类为全国的数据资源', industry: '稻谷种植', reviewStatus: '已通过', mountStatus: '已挂载', createdAt: '2026-07-28 09:21:45', updatedAt: '2026-08-06 11:27:24', provider: '湖南省农业农村厅' },
];

const statusClass = (status: Resource['reviewStatus'] | Resource['mountStatus']) =>
  status === '已通过' || status === '已挂载' ? 'status success' : status === '待挂载' ? 'status info' : 'status warning';

const OriginalComponent = () => {
  const [keyword, setKeyword] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [mountStatus, setMountStatus] = useState('');
  const [industry, setIndustry] = useState('');
  const [createdStart, setCreatedStart] = useState('');
  const [createdEnd, setCreatedEnd] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState<Resource | null>(null);
  const [showProof, setShowProof] = useState<Resource | null>(null);

  const filtered = useMemo(() => seedResources.filter(item =>
    (!keyword || item.name.includes(keyword) || item.industry.includes(keyword)) &&
    (!resourceName || item.name.includes(resourceName)) &&
    (!reviewStatus || item.reviewStatus === reviewStatus) &&
    (!mountStatus || item.mountStatus === mountStatus) &&
    (!industry || item.industry.includes(industry)) &&
    (!createdStart || item.createdAt.slice(0, 10) >= createdStart) &&
    (!createdEnd || item.createdAt.slice(0, 10) <= createdEnd)
  ), [keyword, resourceName, reviewStatus, mountStatus, industry, createdStart, createdEnd]);

  const reset = () => {
    setKeyword(''); setResourceName(''); setReviewStatus(''); setMountStatus('');
    setIndustry(''); setCreatedStart(''); setCreatedEnd(''); setPage(1);
  };

  const toggleIndustry = (item: string) => setExpanded(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);

  return (
    <Layout activeMenu="data-resource-catalog" breadcrumb="数据资源目录" role="实施机构" onRoleChange={() => undefined} roleOptions={['实施机构']} title="数据资源目录">
      <div className="catalog-page">
        <div className="catalog-toolbar">
          <div className="catalog-search">
            <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="请输入搜索关键字" />
            <Search size={16} />
          </div>
          <button className="icon-button" title="刷新" onClick={() => setPage(1)}><RefreshCw size={16} /></button>
        </div>
        <div className="catalog-content">
          <aside className="industry-panel">
            <div className="industry-search">
              <input placeholder="搜索行业分类" onChange={e => setIndustry(e.target.value)} />
              <Search size={14} />
            </div>
            <button className={'industry-root' + (!industry ? ' selected' : '')} onClick={() => setIndustry('')}>全部</button>
            {industries.map(item => (
              <div key={item}>
                <button className={'industry-item' + (industry === item ? ' selected' : '')} onClick={() => { setIndustry(item); toggleIndustry(item); }}>
                  {expanded.includes(item) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{item}
                </button>
                {expanded.includes(item) && <div className="industry-child">全部资源</div>}
              </div>
            ))}
          </aside>
          <section className="catalog-main">
            <div className="filter-panel">
              <label>资源名称<input value={resourceName} onChange={e => setResourceName(e.target.value)} placeholder="请输入" /></label>
              <label>审核状态<select value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}><option value="">请选择</option><option>待提交</option><option>提交待审核</option><option>已通过</option></select></label>
              <label>数据源挂载状态<select value={mountStatus} onChange={e => setMountStatus(e.target.value)}><option value="">请选择</option><option>待挂载</option><option>已挂载</option></select></label>
              <label className="date-label">创建时间<div className="date-range"><input type="date" value={createdStart} onChange={e => setCreatedStart(e.target.value)} /><span>-</span><input type="date" value={createdEnd} onChange={e => setCreatedEnd(e.target.value)} /></div></label>
              <div className="filter-actions"><button className="btn primary" onClick={() => setPage(1)}>查询</button><button className="btn" onClick={reset}>重置</button><button className="btn" onClick={() => setPage(1)}>刷新</button></div>
            </div>
            <div className="table-heading"><span>共{filtered.length || 128}条记录</span><button className="btn primary add-button" onClick={() => setShowAdd(true)}><Plus size={16} />新增</button></div>
            <div className="table-wrap">
              <table className="catalog-table">
                <thead><tr><th>序号</th><th>资源名称</th><th>行业分类</th><th>审核状态</th><th>数据源挂载状态</th><th>创建时间</th><th>更新时间</th><th>操作</th></tr></thead>
                <tbody>{filtered.slice((page - 1) * 10, page * 10).map((item, index) => <tr key={item.id}>
                  <td>{(page - 1) * 10 + index + 1}</td><td className="ellipsis" title={item.name}>{item.name}</td><td className="ellipsis" title={item.industry}>{item.industry}</td>
                  <td><span className={statusClass(item.reviewStatus)}>{item.reviewStatus}</span></td><td><span className={statusClass(item.mountStatus)}>{item.mountStatus}</span></td>
                  <td>{item.createdAt}</td><td>{item.updatedAt}</td><td className="actions"><button onClick={() => setShowView(item)}>查看</button><button onClick={() => setShowProof(item)}>查看存证</button></td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="pagination"><span>共128条记录</span><div><button disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))}>‹</button><button className="active">1</button><button onClick={() => setPage(2)}>2</button><button onClick={() => setPage(3)}>3</button><button onClick={() => setPage(4)}>4</button><span>…</span><button onClick={() => setPage(13)}>13</button><button onClick={() => setPage(Math.min(13, page + 1))}>›</button><select><option>10条/页</option><option>20条/页</option></select><span>跳至</span><input value={page} onChange={e => setPage(Math.max(1, Math.min(13, Number(e.target.value) || 1)))} />页</div></div>
          </section>
        </div>
      </div>
      {(showAdd || showView || showProof) && <div className="modal-overlay" onClick={() => { setShowAdd(false); setShowView(null); setShowProof(null); }}>
        <div className="catalog-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-head"><h3>{showAdd ? '新增数据资源' : showProof ? '区块链存证' : '资源详情'}</h3><button onClick={() => { setShowAdd(false); setShowView(null); setShowProof(null); }}><X size={18} /></button></div>
          <div className="modal-body">{showAdd ? <><label>资源名称<input placeholder="请输入资源名称" /></label><label>行业分类<select><option>请选择</option>{industries.map(item => <option key={item}>{item}</option>)}</select></label><label>资源描述<textarea rows={4} placeholder="请输入资源描述" /></label></> : showProof ? <div className="proof-box"><div><b>存证编号</b><span>BC-20260824-000128</span></div><div><b>上链时间</b><span>{showProof?.updatedAt}</span></div><div><b>区块高度</b><span>18,426,901</span></div><div><b>交易哈希</b><span className="hash">0x9f0d...e82a</span></div></div> : <div className="detail-grid"><b>资源名称</b><span>{showView?.name}</span><b>提供机构</b><span>{showView?.provider}</span><b>行业分类</b><span>{showView?.industry}</span><b>审核状态</b><span>{showView?.reviewStatus}</span><b>挂载状态</b><span>{showView?.mountStatus}</span><b>更新时间</b><span>{showView?.updatedAt}</span></div>}</div>
          <div className="modal-foot"><button className="btn" onClick={() => { setShowAdd(false); setShowView(null); setShowProof(null); }}>关闭</button>{showAdd && <button className="btn primary" onClick={() => setShowAdd(false)}>保存</button>}</div>
        </div>
      </div>}
    </Layout>
  );
};

const Component = () => <PasswordGuard><OriginalComponent /></PasswordGuard>;
export default Component;

/**
 * @name 我的需求
 * @mode axure
 *
 * 门户个人中心的需求列表，展示当前用户发起的全部需求。
 */
import { useMemo, useState } from 'react';
import PortalLayout from '../../common/PortalLayout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

type Status = '已上报' | '已响应' | '意向达成';
interface Demand { id: number; code: string; title: string; budget: string; updateTime: string; deadline: string; status: Status; }
const seed: Demand[] = [
  { id: 1, code: 'XQ2026063000000002', title: '医疗影像辅助诊断数据需求', budget: '50,000-80,000 元', updateTime: '2026-08-18 09:20:00', deadline: '2026-09-30', status: '已上报' },
  { id: 2, code: 'XQ2026063000000003', title: '城市交通拥堵分析数据需求', budget: '30,000 元', updateTime: '2026-08-17 10:30:00', deadline: '2026-09-20', status: '已响应' },
  { id: 3, code: 'XQ2026063000000004', title: '文旅客流趋势预测数据需求', budget: '面议', updateTime: '2026-08-15 16:42:00', deadline: '2026-10-15', status: '意向达成' }
];

const OriginalComponent = () => {
  const [code, setCode] = useState(''); const [title, setTitle] = useState(''); const [status, setStatus] = useState('');
  const [start, setStart] = useState(''); const [end, setEnd] = useState(''); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [view, setView] = useState<Demand | null>(null);
  const filtered = useMemo(() => seed.filter(item => (!code || item.code.includes(code)) && (!title || item.title.includes(title)) && (!status || item.status === status) && (!start || item.updateTime >= start) && (!end || item.updateTime <= `${end} 23:59:59`)), [code, title, status, start, end]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const safePage = Math.min(page, totalPages); const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const reset = () => { setCode(''); setTitle(''); setStatus(''); setStart(''); setEnd(''); setPage(1); };
  return <PortalLayout className="my-demand-page" activeNav="none" specContent={specContent} changeLogContent={changeLogContent}>
    <main className="my-demand-main"><section className="my-demand-shell"><aside className="profile-tabs"><h1>个人中心</h1><nav><button onClick={() => window.location.href = '/prototypes/authorized-operation-portal-profile.html'}>账号信息</button><button>主体认证</button><button className="menu-orange">我的订阅</button><button className="active menu-orange">我的需求</button><button className="menu-orange">我的应用</button><button className="menu-orange">我的收藏</button><button>我的反馈</button></nav></aside><section className="my-demand-content">
      <div className="demand-filter"><label>需求编号：<input value={code} placeholder="请输入" onChange={e => { setCode(e.target.value); setPage(1); }} /></label><label>需求标题：<input value={title} placeholder="请输入" onChange={e => { setTitle(e.target.value); setPage(1); }} /></label><label>需求状态：<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">请选择</option><option>已上报</option><option>已响应</option><option>意向达成</option></select></label><label>操作时间：<span className="date-range"><input type="date" value={start} onChange={e => setStart(e.target.value)} /><i>-</i><input type="date" value={end} onChange={e => setEnd(e.target.value)} /></span></label><div className="filter-actions"><button className="query-btn" onClick={() => setPage(1)}>查询</button><button className="reset-btn" onClick={reset}>重置</button></div></div>
      <table className="my-demand-table"><thead><tr><th>需求编号</th><th>需求标题</th><th>资金预算</th><th>操作时间</th><th>需求截止日期</th><th>需求状态</th><th>操作</th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td>{item.code}</td><td>{item.title}</td><td>{item.budget}</td><td>{item.updateTime}</td><td>{item.deadline}</td><td><span className={`demand-status ${item.status}`}>{item.status}</span></td><td><button className="view-btn" onClick={() => setView(item)}>查看</button></td></tr>)}{rows.length === 0 && <tr><td colSpan={7} className="empty">暂无数据</td></tr>}</tbody></table>
      <div className="my-demand-pagination"><span>共 {filtered.length} 条</span><select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}><option value={10}>10条/页</option><option value={20}>20条/页</option></select><button disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</button><b>{safePage}</b><button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>›</button><span>前往 <input value={safePage} onChange={e => { const v = Number(e.target.value); if (v >= 1 && v <= totalPages) setPage(v); }} /> 页</span></div>
      {view && <div className="demand-view-overlay" onClick={() => setView(null)}><div className="demand-view-modal" onClick={e => e.stopPropagation()}><header><h3>需求详情</h3><button onClick={() => setView(null)}>×</button></header><div className="demand-view-body"><p><strong>需求编号</strong>{view.code}</p><p><strong>需求标题</strong>{view.title}</p><p><strong>资金预算</strong>{view.budget}</p><p><strong>需求截止日期</strong>{view.deadline}</p><p><strong>需求状态</strong>{view.status}</p><p><strong>操作时间</strong>{view.updateTime}</p></div></div></div>}
    </section></section></main>
  </PortalLayout>;
};
const Component = () => <PasswordGuard><OriginalComponent /></PasswordGuard>;
export default Component;
if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) (window as any).__AXHUB_DEFINE_COMPONENT__(Component);

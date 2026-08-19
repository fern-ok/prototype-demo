/**
 * @name 门户发布需求
 * @mode axure
 *
 * 参考资料：C:/Users/Lenovo/Desktop/发布需求.txt、发布需求html.txt
 */

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Layers3, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import PortalLayout from '../../common/PortalLayout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import './style.css';

type Demand = { id: number; title: string; industry: string; budget: string; budgetValue?: number; deadline: string; description: string; dataTypes: string[] };

const industries = ['全部', '农、林、牧、渔业', '采矿业', '制造业', '电力、热力、燃气及水生产和供应业', '建筑业', '批发和零售业', '交通运输、仓储和邮政业', '住宿和餐饮业', '信息传输、软件和信息技术服务业', '金融业', '房地产业', '租赁和商务服务业', '科学研究和技术服务业', '水利、环境和公共设施管理业', '居民服务、修理和其他服务业', '卫生和社会工作', '文化、体育和娱乐业'];
const budgetOptions = ['5千以下', '5千-1万', '1万-5万', '5万-10万', '10万以上', '面议'];

const initialDemands: Demand[] = [
  { id: 1, title: '医疗影像辅助诊断数据需求', industry: '卫生和社会工作', budget: '50,000-80,000 元', budgetValue: 80000, deadline: '2026-09-30', description: '用于构建医疗影像辅助诊断模型，需近三年脱敏影像及标注数据。', dataTypes: ['数据资源'] },
  { id: 2, title: '城市交通拥堵分析数据需求', industry: '交通运输、仓储和邮政业', budget: '30,000 元', budgetValue: 30000, deadline: '2026-09-20', description: '需要城市路网流量、速度和事件数据，支撑交通态势分析与预测。', dataTypes: ['数据资源', '数据产品'] },
  { id: 3, title: '文旅客流趋势预测数据需求', industry: '文化、体育和娱乐业', budget: '面议', deadline: '2026-10-15', description: '面向景区客流预测和营销分析，关注节假日客流及来源地数据。', dataTypes: ['数据产品'] },
];

const createForm = () => ({ title: '', dataTypes: [] as string[], industry: '', budgetMode: 'price', budget: '', description: '', deadline: '', contact: '', phone: '', isPublic: 'yes' });

const OriginalComponent = () => {
  const [demands, setDemands] = useState(initialDemands);
  const [industry, setIndustry] = useState('全部');
  const [budgets, setBudgets] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'deadline' | 'budgetValue'>('deadline');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(createForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => demands.filter(item => (industry === '全部' || item.industry === industry) && (budgets.length === 0 || budgets.some(option => matchBudget(item, option)))).sort((a, b) => {
    const first = sortField === 'deadline' ? a.deadline.localeCompare(b.deadline) : (a.budgetValue ?? Number.MAX_SAFE_INTEGER) - (b.budgetValue ?? Number.MAX_SAFE_INTEGER);
    return sortAsc ? first : -first;
  }), [demands, industry, budgets, sortField, sortAsc]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const counts = (name: string) => name === '全部' ? demands.length : demands.filter(item => item.industry === name).length;

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => { setForm(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: '' })); };
  const closeModal = () => { setModalOpen(false); setForm(createForm()); setErrors({}); };
  const toggleDataType = (type: string) => setField('dataTypes', form.dataTypes.includes(type) ? form.dataTypes.filter(item => item !== type) : [...form.dataTypes, type]);
  const toggleBudget = (budget: string) => { setBudgets(previous => previous.includes(budget) ? previous.filter(item => item !== budget) : [...previous, budget]); setPage(1); };
  const changeSort = (field: 'deadline' | 'budgetValue') => { if (sortField === field) setSortAsc(value => !value); else { setSortField(field); setSortAsc(true); } };
  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = '请输入需求标题';
    if (!form.dataTypes.length) nextErrors.dataTypes = '请选择需求数据分类';
    if (!form.industry) nextErrors.industry = '请选择行业分类';
    if (form.budgetMode === 'price' && (!form.budget || Number(form.budget) <= 0)) nextErrors.budget = '请输入有效的资金预算';
    if (!form.description.trim()) nextErrors.description = '请输入需求描述';
    if (!form.deadline) nextErrors.deadline = '请选择需求截止日期';
    if (form.deadline && form.deadline < '2026-08-19') nextErrors.deadline = '需求截止日期不能早于今天';
    if (!form.contact.trim()) nextErrors.contact = '请输入联系人';
    if (!/^1\d{10}$/.test(form.phone)) nextErrors.phone = '请输入11位手机号码';
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    setDemands(previous => [{ id: Date.now(), title: form.title.trim(), industry: form.industry, budget: form.budgetMode === 'negotiable' ? '面议' : `${Number(form.budget).toLocaleString('zh-CN')} 元`, budgetValue: form.budgetMode === 'negotiable' ? undefined : Number(form.budget), deadline: form.deadline, description: form.description.trim(), dataTypes: form.dataTypes }, ...previous]);
    setIndustry('全部'); setBudgets([]); setPage(1); closeModal();
  };

  return <PortalLayout className="publish-demand-page" activeNav="demand" specContent={specContent}>
    <section className="demand-hero" />
    <main className="publish-demand-main">
      <aside className="demand-industry-panel"><div className="demand-industry-title"><Layers3 size={19} />行业分类</div><div className="demand-industry-list">{industries.map(item => <button key={item} className={industry === item ? 'active' : ''} onClick={() => { setIndustry(item); setPage(1); }}><span>{item}</span><b>（{counts(item)}）</b></button>)}</div></aside>
      <section className="demand-content">
        <div className="demand-filter-panel"><div className="demand-callout"><div>未找到合适的数据产品？有数据资源或产品提供？快来发布需求，供需双向精准匹配，让合作更高效</div><span>→</span><button onClick={() => setModalOpen(true)}><Plus size={17} />发布需求</button></div><div className="budget-filter"><strong>资金预算：</strong><label><input type="checkbox" checked={budgets.length === 0} onChange={() => { setBudgets([]); setPage(1); }} />全部</label>{budgetOptions.map(item => <label key={item}><input type="checkbox" checked={budgets.includes(item)} onChange={() => toggleBudget(item)} />{item}</label>)}</div></div>
        <div className="demand-list-header"><div><i /> <h1>需求列表</h1></div><div className="demand-sort">排序：<button className={sortField === 'deadline' ? 'selected' : ''} onClick={() => changeSort('deadline')}>截止时间 {sortField === 'deadline' && (sortAsc ? '↑' : '↓')}</button><button className={sortField === 'budgetValue' ? 'selected' : ''} onClick={() => changeSort('budgetValue')}>资金预算 {sortField === 'budgetValue' && (sortAsc ? '↑' : '↓')}</button><span>共 {filtered.length} 个需求</span></div></div>
        <div className="demand-card-list">{rows.map(item => <article key={item.id} className="portal-demand-card"><div className="demand-card-icon">需</div><div className="demand-card-info"><h2>{item.title}</h2><div className="demand-card-meta"><span><Layers3 size={16} />{item.industry}</span><span><CalendarDays size={16} />{item.deadline}</span></div><p>{item.description}</p><small>{item.dataTypes.join('、')}</small></div><strong className={item.budget === '面议' ? 'negotiable' : ''}>{item.budget}</strong></article>)}{rows.length === 0 && <div className="demand-empty">暂无符合条件的公开需求</div>}</div>
        <div className="portal-demand-pagination"><span>共 {filtered.length} 条</span><select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10条/页</option><option value={20}>20条/页</option></select><button disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button><button className="active">{safePage}</button><button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button><span>前往</span><input value={safePage} type="number" min={1} max={totalPages} onChange={event => setPage(Math.max(1, Math.min(totalPages, Number(event.target.value) || 1)))} /><span>页</span></div>
      </section>
    </main>
    {isModalOpen && <div className="publish-modal-overlay" onClick={closeModal}><section className="publish-modal" onClick={event => event.stopPropagation()}><header><h2>发布需求</h2><button onClick={closeModal} aria-label="关闭"><X size={20} /></button></header><div className="publish-form"><FormItem label="需求标题" required error={errors.title}><input value={form.title} placeholder="请输入标题" onChange={event => setField('title', event.target.value)} /></FormItem><FormItem label="需求数据分类" required error={errors.dataTypes}><div className="form-choice-row">{['数据资源', '数据产品'].map(type => <label key={type}><input type="checkbox" checked={form.dataTypes.includes(type)} onChange={() => toggleDataType(type)} />{type}</label>)}</div></FormItem><FormItem label="行业分类" required error={errors.industry}><select value={form.industry} onChange={event => setField('industry', event.target.value)}><option value="">请选择</option>{industries.slice(1).map(item => <option key={item}>{item}</option>)}</select></FormItem><FormItem label="资金预算" required error={errors.budget}><div className="budget-control"><label><input type="radio" checked={form.budgetMode === 'price'} onChange={() => setField('budgetMode', 'price')} />输入价格</label><label><input type="radio" checked={form.budgetMode === 'negotiable'} onChange={() => setField('budgetMode', 'negotiable')} />面议</label>{form.budgetMode === 'price' && <div><input type="number" min="0" value={form.budget} placeholder="请输入金额" onChange={event => setField('budget', event.target.value)} /><span>元</span></div>}</div></FormItem><FormItem label="需求描述" required error={errors.description}><textarea rows={4} value={form.description} placeholder="请输入需求描述" onChange={event => setField('description', event.target.value)} /></FormItem><FormItem label="需求截止日期" required error={errors.deadline}><input type="date" min="2026-08-19" value={form.deadline} onChange={event => setField('deadline', event.target.value)} /></FormItem><div className="form-two-columns"><FormItem label="联系人" required error={errors.contact}><input value={form.contact} placeholder="请输入联系人" onChange={event => setField('contact', event.target.value)} /></FormItem><FormItem label="联系方式" required error={errors.phone}><input value={form.phone} placeholder="请输入联系方式" onChange={event => setField('phone', event.target.value)} /></FormItem></div><FormItem label="是否公开" required><div className="form-choice-row"><label><input type="radio" checked={form.isPublic === 'yes'} onChange={() => setField('isPublic', 'yes')} />是</label><label><input type="radio" checked={form.isPublic === 'no'} onChange={() => setField('isPublic', 'no')} />否</label></div></FormItem></div><footer><button className="cancel" onClick={closeModal}>取消</button><button className="submit" onClick={submit}>提交</button></footer></section></div>}
  </PortalLayout>;
};

const FormItem = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => <div className={'publish-form-item' + (error ? ' has-error' : '')}><label>{required && <em>*</em>}{label}</label><div className="publish-form-control">{children}{error && <span className="publish-error">{error}</span>}</div></div>;
const matchBudget = (item: Demand, option: string) => { if (option === '面议') return item.budget === '面议'; const value = item.budgetValue ?? -1; return option === '5千以下' ? value >= 0 && value < 5000 : option === '5千-1万' ? value >= 5000 && value < 10000 : option === '1万-5万' ? value >= 10000 && value < 50000 : option === '5万-10万' ? value >= 50000 && value < 100000 : value >= 100000; };
const Component = () => <PasswordGuard><OriginalComponent /></PasswordGuard>;
export default Component;
if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) (window as any).__AXHUB_DEFINE_COMPONENT__(Component);

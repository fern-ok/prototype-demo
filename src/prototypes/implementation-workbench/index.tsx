/**
 * @name 实施机构工作台
 * @mode axure
 *
 * 实施机构首页工作台，聚合资源总览、待办任务、消息通知和统计分析。
 */

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  FileCheck2,
  FileSearch,
  FileText,
  FolderOpen,
  Grid2X2,
  KeyRound,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import './style.css';

type TaskTab = '待处理' | '已处理';
type NoticeTab = '未读' | '已读';

interface WorkTask {
  id: number;
  type: string;
  title: string;
  documentNo: string;
  initiator: string;
  createTime: string;
  updateTime: string;
  href: string;
  handled: boolean;
}

interface NoticeMessage {
  id: number;
  title: string;
  content: string;
  trigger: string;
  time: string;
  read: boolean;
}

type MenuGroup =
  | {
      title: string;
      icon: ComponentType<{ size?: number }>;
      items: Array<{ label: string; href: string }>;
    }
  | {
      title: string;
      icon: ComponentType<{ size?: number }>;
      href: string;
    };

const menuGroups: MenuGroup[] = [
  {
    title: '备案管理',
    icon: FolderOpen,
    items: [
      { label: '实施方案联审', href: '#' },
      { label: '实施方案备案', href: '#' },
      { label: '运营机构备案', href: '#' },
      { label: '运营协议备案', href: '/prototypes/operation-agreement-filing.html' },
      { label: '其他经营主体备案', href: '#' },
      { label: '产品和服务清单备案', href: '/prototypes/product-service-filing.html' },
    ],
  },
  { title: '数据资源目录', icon: Database, href: '#' },
  { title: '数据资源授权', icon: KeyRound, href: '/prototypes/data-resource-auth.html' },
  { title: '数据资源初审', icon: FileSearch, href: '/prototypes/data-resource-review.html' },
  { title: '数据资源复审', icon: FileCheck2, href: '/prototypes/data-resource-recheck.html' },
  { title: '产品安全审查', icon: ShieldCheck, href: '/prototypes/product-security-review.html' },
  { title: '场景申请管理', icon: UserRound, href: '#' },
  { title: '数据产品库', icon: Grid2X2, href: '#' },
];

const taskSeed: WorkTask[] = [
  { id: 1, type: '产品安全审查', title: '产品安全审查申请待处理', documentNo: 'AQSC2026081000000013', initiator: '湖南省卫生健康委员会', createTime: '2026-08-10 17:35', updateTime: '2026-08-11 09:42', href: '/prototypes/product-security-review.html', handled: false },
  { id: 2, type: '场景申请', title: '博强产品再开发场景待复核', documentNo: 'CJ2026080400000031', initiator: '博强数据科技有限公司', createTime: '2026-08-04 16:17', updateTime: '2026-08-10 16:17', href: '#', handled: false },
  { id: 3, type: '数据资源授权', title: '医疗就诊数据授权申请待初审', documentNo: 'SQ2026081000000020', initiator: '杭州医保智能科技有限公司', createTime: '2026-08-10 10:41', updateTime: '2026-08-10 10:41', href: '/prototypes/data-resource-auth.html', handled: false },
  { id: 4, type: '产品和服务清单备案', title: '公共卫生数据服务清单已补充', documentNo: 'CPBA2026081000000008', initiator: '湖南数据产业集团', createTime: '2026-08-10 14:28', updateTime: '2026-08-10 15:02', href: '/prototypes/product-service-filing.html', handled: true },
  { id: 5, type: '运营协议备案', title: '数据资源运营服务协议已备案', documentNo: 'XYBA2026080900000006', initiator: '湖南省数据交易服务中心', createTime: '2026-08-08 10:16', updateTime: '2026-08-09 17:36', href: '/prototypes/operation-agreement-filing.html', handled: true },
];

const noticeSeed: NoticeMessage[] = [
  { id: 1, title: '产品安全审查申请通知', content: '您有新的产品安全审查申请待处理，申请单号 AQSC2026081000000013。', trigger: '产品安全审查提交', time: '2026-08-11 09:42', read: false },
  { id: 2, title: '数据资源授权初审通知', content: '医疗就诊数据授权申请已进入初审环节，请及时办理。', trigger: '授权申请提交', time: '2026-08-10 10:41', read: false },
  { id: 3, title: '运营协议备案通过通知', content: '数据资源运营服务协议备案已完成，可在备案管理中查看。', trigger: '备案审核通过', time: '2026-08-09 17:36', read: true },
  { id: 4, title: '系统维护通知', content: '平台将于今晚 22:00 进行例行维护，预计持续 30 分钟。', trigger: '系统自动触发', time: '2026-08-09 09:00', read: true },
];

const resourceTrend = '0,95 45,90 90,75 135,84 180,38 225,58 270,52 315,72 360,35 405,49 450,22 495,44 540,30';
const authTrend = '0,90 45,82 90,86 135,64 180,70 225,44 270,55 315,28 360,36 405,48 450,26 495,34 540,18';

const OriginalComponent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [taskTab, setTaskTab] = useState<TaskTab>('待处理');
  const [noticeTab, setNoticeTab] = useState<NoticeTab>('未读');
  const [tasks, setTasks] = useState(taskSeed);
  const [notices, setNotices] = useState(noticeSeed);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [selectedNoticeIds, setSelectedNoticeIds] = useState<number[]>([]);

  const visibleTasks = useMemo(() => tasks.filter(task => task.handled === (taskTab === '已处理')), [tasks, taskTab]);
  const visibleNotices = useMemo(() => notices.filter(notice => notice.read === (noticeTab === '已读')), [notices, noticeTab]);
  const pendingTaskCount = tasks.filter(task => !task.handled).length;
  const unreadNoticeCount = notices.filter(notice => !notice.read).length;

  const switchTaskTab = (tab: TaskTab) => {
    setTaskTab(tab);
    setSelectedTaskIds([]);
  };

  const switchNoticeTab = (tab: NoticeTab) => {
    setNoticeTab(tab);
    setSelectedNoticeIds([]);
  };

  const toggleTask = (id: number) => {
    setSelectedTaskIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const toggleNotice = (id: number) => {
    setSelectedNoticeIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const markTasksHandled = (ids: number[]) => {
    setTasks(current => current.map(task => ids.includes(task.id) ? { ...task, handled: true } : task));
    setSelectedTaskIds([]);
  };

  const deleteTasks = (ids: number[]) => {
    setTasks(current => current.filter(task => !ids.includes(task.id)));
    setSelectedTaskIds([]);
  };

  const markNoticesRead = (ids: number[]) => {
    setNotices(current => current.map(notice => ids.includes(notice.id) ? { ...notice, read: true } : notice));
    setSelectedNoticeIds([]);
  };

  const deleteNotices = (ids: number[]) => {
    setNotices(current => current.filter(notice => !ids.includes(notice.id)));
    setSelectedNoticeIds([]);
  };

  return (
    <div className="workbench-page">
      <header className="workbench-header">
        <div className="workbench-brand">
          <div className="workbench-brand-mark"><Database size={24} /></div>
          <span>公共数据资源授权运营管理平台</span>
        </div>
        <div className="workbench-header-right">
          <button className="header-icon-button" type="button" title="刷新工作台"><RefreshCw size={18} /></button>
          <button className="header-icon-button" type="button" title="消息通知">
            <Bell size={19} />
            <span className="notice-dot">{unreadNoticeCount}</span>
          </button>
          <button className="workbench-user" type="button">
            <span className="user-avatar">唐</span>
            <span className="user-summary"><strong>唐**</strong><small>湖南省卫生健康委信息统计中心84</small></span>
            <ChevronDown size={15} />
          </button>
        </div>
      </header>

      <div className="workbench-body">
        <aside className={'workbench-sidebar' + (sidebarOpen ? '' : ' collapsed')}>
          <button className="sidebar-workbench-link active" type="button">
            <LayoutDashboard size={17} /><span>实施机构工作台</span>
          </button>
          <nav className="workbench-nav">
            {menuGroups.map((group) => {
              const Icon = group.icon;
              if ('items' in group) {
                return (
                  <div className="workbench-nav-group" key={group.title}>
                    <button className="workbench-nav-group-title" type="button">
                      <span><Icon size={16} />{sidebarOpen && group.title}</span><ChevronDown size={14} />
                    </button>
                    {sidebarOpen && <div className="workbench-subnav">{group.items.map(item => <a href={item.href} key={item.label}>{item.label}</a>)}</div>}
                  </div>
                );
              }
              return <a className="workbench-nav-link" href={group.href} key={group.title}><Icon size={16} />{sidebarOpen && <span>{group.title}</span>}</a>;
            })}
            <div className="workbench-nav-divider" />
            <a className="workbench-nav-link" href="#"><Settings size={16} />{sidebarOpen && <span>系统管理</span>}<ChevronDown size={14} /></a>
          </nav>
          <button className="sidebar-collapse-button" type="button" title={sidebarOpen ? '收起菜单' : '展开菜单'} onClick={() => setSidebarOpen(value => !value)}>
            <Menu size={17} />
          </button>
        </aside>

        <main className="workbench-main">
          <div className="workbench-page-heading">
            <div>
              <div className="breadcrumb">首页 <ChevronRight size={13} /> 实施机构工作台</div>
              <h1>实施机构工作台</h1>
            </div>
          </div>

          <section className="metric-grid">
            <MetricCard icon={<Database size={20} />} label="数据资源总数" value="118" extra="今日新增 0" tone="blue" />
            <MetricCard icon={<KeyRound size={20} />} label="数据资源授权总数" value="93" extra="今日新增 0" tone="violet" />
            <MetricCard icon={<FileText size={20} />} label="基础数据产品总数" value="68" extra="今日新增 0" tone="orange" />
            <MetricCard icon={<Grid2X2 size={20} />} label="再开发数据产品总数" value="26" extra="今日新增 2" tone="green" />
          </section>

          <div className="workbench-grid middle-grid">
            <section className="panel list-panel">
              <PanelHeader title="待办任务" subtitle="待处理支持跳转办理和标记已处理，已处理支持删除记录" />
              <Tabs
                items={[
                  { label: '待处理', value: '待处理', count: pendingTaskCount },
                  { label: '已处理', value: '已处理', count: tasks.filter(task => task.handled).length },
                ]}
                active={taskTab}
                onChange={switchTaskTab}
              />
              <div className="list-toolbar">
                <span>{selectedTaskIds.length > 0 ? `已选 ${selectedTaskIds.length} 条` : `共 ${visibleTasks.length} 条`}</span>
                {taskTab === '待处理' ? (
                  <button type="button" disabled={selectedTaskIds.length === 0} onClick={() => markTasksHandled(selectedTaskIds)}><Check size={14} />批量标记已处理</button>
                ) : (
                  <button type="button" disabled={selectedTaskIds.length === 0} onClick={() => deleteTasks(selectedTaskIds)}><Trash2 size={14} />批量删除</button>
                )}
              </div>
              <div className="work-list">
                {visibleTasks.map(task => (
                  <div className="work-row" key={task.id}>
                    <CheckBox checked={selectedTaskIds.includes(task.id)} onChange={() => toggleTask(task.id)} />
                    <div className="row-icon task"><ClipboardIcon /></div>
                    <div className="row-content">
                      <div className="row-title"><strong>{task.title}</strong><span>{task.type}</span></div>
                      <p>{task.documentNo} · {task.initiator}</p>
                      <div className="row-meta"><span>创建 {task.createTime}</span><span>更新 {task.updateTime}</span></div>
                    </div>
                    <div className="row-actions">
                      {taskTab === '待处理' ? (
                        <>
                          <a href={task.href}>处理列表页 <ChevronRight size={14} /></a>
                          <button type="button" title="标记已处理" onClick={() => markTasksHandled([task.id])}><Check size={16} /></button>
                        </>
                      ) : (
                        <button type="button" title="删除记录" onClick={() => deleteTasks([task.id])}><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                ))}
                {visibleTasks.length === 0 && <EmptyState text="暂无任务记录" />}
              </div>
            </section>

            <section className="panel list-panel">
              <PanelHeader title="消息通知" subtitle="展示系统自动触发的通知消息，支持未读/已读管理" />
              <Tabs
                items={[
                  { label: '未读', value: '未读', count: unreadNoticeCount },
                  { label: '已读', value: '已读', count: notices.filter(notice => notice.read).length },
                ]}
                active={noticeTab}
                onChange={switchNoticeTab}
              />
              <div className="list-toolbar">
                <span>{selectedNoticeIds.length > 0 ? `已选 ${selectedNoticeIds.length} 条` : `共 ${visibleNotices.length} 条`}</span>
                {noticeTab === '未读' ? (
                  <button type="button" disabled={selectedNoticeIds.length === 0} onClick={() => markNoticesRead(selectedNoticeIds)}><Check size={14} />批量标记已读</button>
                ) : (
                  <button type="button" disabled={selectedNoticeIds.length === 0} onClick={() => deleteNotices(selectedNoticeIds)}><Trash2 size={14} />批量删除</button>
                )}
              </div>
              <div className="work-list">
                {visibleNotices.map(notice => (
                  <div className="work-row notice-row" key={notice.id}>
                    <CheckBox checked={selectedNoticeIds.includes(notice.id)} onChange={() => toggleNotice(notice.id)} />
                    <div className="row-icon notice"><Bell size={16} /></div>
                    <div className="row-content">
                      <div className="row-title"><strong>{notice.title}</strong><span>{notice.trigger}</span></div>
                      <p>{notice.content}</p>
                      <div className="row-meta"><span>{notice.time}</span></div>
                    </div>
                    <div className="row-actions">
                      {noticeTab === '未读' ? (
                        <button type="button" title="标记已读" onClick={() => markNoticesRead([notice.id])}><Check size={16} /></button>
                      ) : (
                        <button type="button" title="删除消息" onClick={() => deleteNotices([notice.id])}><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                ))}
                {visibleNotices.length === 0 && <EmptyState text="暂无消息记录" />}
              </div>
            </section>
          </div>

          <div className="chart-grid">
            <TrendPanel title="数据资源上架趋势分析" legend="数据资源上架（个）" value="28" points={resourceTrend} tone="blue" />
            <TrendPanel title="数据资源授权趋势分析" legend="数据资源授权（次）" value="36" points={authTrend} tone="violet" />
          </div>
        </main>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, extra, tone }: { icon: ReactNode; label: string; value: string; extra: string; tone: string }) => (
  <div className="metric-card">
    <div className={'metric-icon ' + tone}>{icon}</div>
    <div className="metric-copy">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{extra}</small>
    </div>
  </div>
);

const PanelHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="panel-heading">
    <div><h2>{title}</h2><span className="panel-subtitle">{subtitle}</span></div>
  </div>
);

const Tabs = <T extends string>({ items, active, onChange }: { items: Array<{ label: string; value: T; count: number }>; active: T; onChange: (value: T) => void }) => (
  <div className="tabs-row">
    {items.map(item => (
      <button key={item.value} type="button" className={active === item.value ? 'active' : ''} onClick={() => onChange(item.value)}>
        {item.label}<span>{item.count}</span>
      </button>
    ))}
  </div>
);

const CheckBox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <label className="task-checkbox"><input type="checkbox" checked={checked} onChange={onChange} /><span /></label>
);

const ClipboardIcon = () => <FileText size={17} />;

const EmptyState = ({ text }: { text: string }) => <div className="empty-state">{text}</div>;

const TrendPanel = ({ title, legend, value, points, tone }: { title: string; legend: string; value: string; points: string; tone: string }) => {
  const [range, setRange] = useState('近30天');

  return (
    <section className="panel chart-panel">
      <div className="panel-heading chart-heading">
        <div><h2>{title}</h2><span className="panel-subtitle">统计周期：{range} · 更新于 2026-08-11 09:30</span></div>
        <div className="segmented-control">
          {['全部', '近一年', '近30天', '近7天'].map(item => (
            <button type="button" key={item} className={range === item ? 'active' : ''} onClick={() => setRange(item)}>{item}</button>
          ))}
        </div>
      </div>
      <div className="chart-kpis">
        <div><span>本周期新增</span><strong>{value}</strong><small>{legend}</small></div>
        <div><span>环比变化</span><strong>+24.6%</strong><small>较上个周期</small></div>
      </div>
      <div className="line-chart">
        <div className="chart-y-labels"><span>40</span><span>30</span><span>20</span><span>0</span></div>
        <div className="chart-canvas">
          <div className="chart-grid-lines"><i /><i /><i /><i /></div>
          <svg viewBox="0 0 540 110" preserveAspectRatio="none" aria-label={title}>
            <defs>
              <linearGradient id={`workbench-fill-${tone}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={tone === 'blue' ? '#3989ff' : '#7b61ff'} stopOpacity=".25" />
                <stop offset="1" stopColor={tone === 'blue' ? '#3989ff' : '#7b61ff'} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={`0,110 ${points} 540,110`} fill={`url(#workbench-fill-${tone})`} />
            <polyline points={points} fill="none" stroke={tone === 'blue' ? '#1677ff' : '#7b61ff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="chart-x-labels"><span>07-13</span><span>07-20</span><span>07-27</span><span>08-03</span><span>08-10</span></div>
        </div>
      </div>
      <div className="chart-legend"><span><i className={tone} />{legend}</span><button type="button">导出统计</button></div>
    </section>
  );
};

export default OriginalComponent;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(OriginalComponent);
}

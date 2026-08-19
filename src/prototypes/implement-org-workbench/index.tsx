/**
 * @name 工作台
 * @mode axure
 *
 * 后台一级菜单中的四角色工作台页面，主体内容直接内置，不再依赖其他工作台目录。
 */

import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  Check,
  CircleHelp,
  Database,
  FileText,
  Grid2X2,
  KeyRound,
  Trash2,
} from 'lucide-react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

type TaskTab = '待处理' | '已处理';
type NoticeTab = '未读' | '已读';

interface WorkTask {
  id: number;
  title: string;
  content: string;
  time: string;
  href: string;
  handled: boolean;
}

interface NoticeMessage {
  id: number;
  title: string;
  content: string;
  time: string;
  read: boolean;
}

const taskSeed: WorkTask[] = [
  { id: 1, title: '产品上架', content: '您开发的数据产品“$产品名称$”已通过登记，请在3个工作日内通过流通服务平台发布上架', time: '2026-08-10 17:35', href: '/prototypes/data-resource-auth.html', handled: false },
  { id: 2, title: '产品上架', content: '您开发的数据产品“$产品名称$”已通过登记，请在3个工作日内通过流通服务平台发布上架', time: '2026-08-04 16:17', href: '/prototypes/product-security-review.html', handled: false },
  { id: 3, title: '产品上架', content: '您开发的数据产品“$产品名称$”已通过登记，请在3个工作日内通过流通服务平台发布上架', time: '2026-08-10 10:41', href: '/prototypes/product-service-filing.html', handled: true },
];

const noticeSeed: NoticeMessage[] = [
  { id: 1, title: '产品登记', content: '您提交的产品登记“$产品名称$”审核通过，请及时查看！', time: '2026-08-10 10:41', read: false },
  { id: 2, title: '产品登记', content: '您提交的数据产品“$产品名称$”登记申请审核不通过，请及时查看！', time: '2026-08-10 09:42', read: false },
  { id: 3, title: '产品登记', content: '您提交的产品登记“$产品名称$”审核通过，请及时查看！', time: '2026-08-09 17:36', read: true },
];

const resourceTrend = '0,95 45,90 90,75 135,84 180,38 225,58 270,52 315,72 360,35 405,49 450,22 495,44 540,30';
const authTrend = '0,90 45,82 90,86 135,64 180,70 225,44 270,55 315,28 360,36 405,48 450,26 495,34 540,18';

const roleOptions = ['实施机构', '运营机构', '其他经营主体', '行业管理部门'] as const;
type WorkbenchRole = typeof roleOptions[number];
const redevelopmentSteps = [
  { title: '场景申请', description: '根据运营机构发布的场景，选取匹配业务需求的基础数据产品，上传再开发申请书，提交场景申请。' },
  { title: '签署协议', description: '场景申请通过后，与对应运营机构线下签订再开发协议，由运营机构负责将再开发协议上传至平台。' },
  { title: '产品开发', description: '按照再开发协议约定的授权范围、数据用途和安全要求开展产品再开发，并自行组织内部功能测试、性能测试等。' },
  { title: '产品编目', description: '关联开发完成的产品任务，准确录入产品名称、类型、简介等核心基本信息，并按平台要求上传相关附件。' },
  { title: '安全审查', description: '提交安全审查申请，由运营机构对产品授权使用范围、数据暴露风险、算法隐私保护等内容进行审查并出具意见。' },
  { title: '产品上架', description: '安全审查通过后提交产品上架申请，经区域功能节点审核确认，产品将自动上架至全省公共数据授权运营门户。' },
];
const subscriptionTop10 = [
  { product: '企业信用风险评估数据产品', operator: '湖南数据产业集团', count: 1268 },
  { product: '医疗机构服务能力分析', operator: '湖南健康大数据公司', count: 1124 },
  { product: '城市交通运行指数', operator: '湘江智慧运营公司', count: 986 },
  { product: '重点企业画像数据产品', operator: '湖南数据产业集团', count: 864 },
  { product: '文旅消费趋势洞察', operator: '湖南文旅数据公司', count: 758 },
  { product: '农业生产经营分析', operator: '湖南农业数据公司', count: 643 },
  { product: '公共就业服务画像', operator: '湖南人社数据公司', count: 576 },
  { product: '能源用电行为分析', operator: '湖南能源数据公司', count: 492 },
  { product: '供应链运行监测产品', operator: '湖南数据产业集团', count: 418 },
  { product: '园区经济活力指数', operator: '湘江智慧运营公司', count: 365 },
];
const roleConfigs: Record<WorkbenchRole, { metrics: Array<{ label: string; value: string; extra: string; tone: string; icon: ReactNode }>; taskSeed: WorkTask[]; noticeSeed: NoticeMessage[]; trendTitle: string; trendLegend: string; trendValue: string; trendPoints: string; secondTitle: string; secondLegend: string; secondValue: string; secondPoints: string }> = {
  '实施机构': {
    metrics: [
      { icon: <Database size={20} />, label: '数据资源总数', value: '118', extra: '今日新增 0', tone: 'blue' },
      { icon: <KeyRound size={20} />, label: '数据资源授权总数', value: '93', extra: '今日新增 0', tone: 'violet' },
      { icon: <FileText size={20} />, label: '基础数据产品总数', value: '68', extra: '今日新增 0', tone: 'orange' },
      { icon: <Grid2X2 size={20} />, label: '再开发数据产品总数', value: '26', extra: '今日新增 2', tone: 'green' },
    ], taskSeed, noticeSeed, trendTitle: '数据资源上架趋势分析', trendLegend: '数据资源上架（个）', trendValue: '28', trendPoints: resourceTrend, secondTitle: '数据资源授权趋势分析', secondLegend: '数据资源授权（次）', secondValue: '36', secondPoints: authTrend,
  },
  '运营机构': {
    metrics: [
      { icon: <Database size={20} />, label: '基础数据产品总数', value: '19', extra: '今日新增 0', tone: 'blue' },
      { icon: <KeyRound size={20} />, label: '基础数据产品授权总数', value: '19', extra: '今日新增 0', tone: 'violet' },
      { icon: <FileText size={20} />, label: '再开发数据产品总数', value: '26', extra: '今日新增 2', tone: 'orange' },
      { icon: <Grid2X2 size={20} />, label: '其他经营主体总数', value: '5', extra: '今日新增 0', tone: 'green' },
    ],
    taskSeed: [
      { id: 1, title: '数据探查', content: '您有新的数据探查申请待审核，申请单号“$申请单号$”，请及时处理！', time: '2026-08-10 17:35', href: '/prototypes/data-resource-review.html', handled: false },
      { id: 2, title: '产品安全审查', content: '您有新的产品安全审查申请待审查，申请单号“$申请单号$”，请及时处理！', time: '2026-08-04 16:17', href: '/prototypes/product-security-review.html', handled: false },
      { id: 3, title: '产品上架', content: '您开发的数据产品“$产品名称$”已通过登记，请在3个工作日内通过授权运营平台发布上架', time: '2026-08-10 10:41', href: '/prototypes/authorized-operation-portal-products.html', handled: false },
      { id: 4, title: '数据探查', content: '您有新的数据探查申请待审核，申请单号“$申请单号$”，请及时处理！', time: '2026-08-09 17:36', href: '/prototypes/data-resource-review.html', handled: true },
      { id: 5, title: '产品安全审查', content: '您有新的产品安全审查申请待审查，申请单号“$申请单号$”，请及时处理！', time: '2026-08-08 10:16', href: '/prototypes/product-security-review.html', handled: true },
    ],
    noticeSeed: [
      { id: 1, title: '资源目录', content: '您提交的资源授权单“$资源授权单名称$”审核通过，请及时查看！', time: '2026-08-10 10:41', read: false },
      { id: 2, title: '资源授权', content: '实施机构已新增一条资源授权单“$资源授权单名称$”，请及时查看！', time: '2026-08-10 09:42', read: false },
      { id: 3, title: '资源授权', content: '您提交的资源授权单“$资源授权单名称$”审核不通过，请及时查看！', time: '2026-08-09 17:36', read: true },
      { id: 4, title: '平台资源', content: '您提交的平台资源申请审核通过，申请单号“$申请单号$”，请及时查看！', time: '2026-08-09 09:00', read: true },
    ],
    trendTitle: '基础数据产品上架趋势分析', trendLegend: '基础数据产品上架（个）', trendValue: '14', trendPoints: resourceTrend, secondTitle: '基础数据产品类型占比', secondLegend: 'API 产品 / 数据集', secondValue: '19', secondPoints: authTrend,
  },
  '其他经营主体': {
    metrics: [
      { icon: <Database size={20} />, label: '场景申请总数', value: '8', extra: '今日新增 1', tone: 'blue' },
      { icon: <KeyRound size={20} />, label: '再开发数据产品总数', value: '5', extra: '今日新增 0', tone: 'violet' },
      { icon: <FileText size={20} />, label: '再开发数据产品订阅总数', value: '3', extra: '今日新增 1', tone: 'orange' },
      { icon: <Grid2X2 size={20} />, label: '再开发数据产品调用总数', value: '12', extra: '今日新增 2', tone: 'green' },
    ], taskSeed, noticeSeed, trendTitle: '再开发数据产品上架趋势', trendLegend: '产品上架（个）', trendValue: '8', trendPoints: resourceTrend, secondTitle: '再开发数据产品订阅趋势', secondLegend: '产品订阅（次）', secondValue: '12', secondPoints: authTrend,
  },
  '行业管理部门': { metrics: [{ icon: <Database size={20} />, label: '数据资源总数', value: '246', extra: '今日新增 3', tone: 'blue' },
    { icon: <KeyRound size={20} />, label: '基础数据产品总数', value: '93', extra: '今日新增 2', tone: 'violet' },
    { icon: <FileText size={20} />, label: '再开发数据产品总数', value: '16', extra: '今日新增 4', tone: 'orange' },
    { icon: <Grid2X2 size={20} />, label: '主体数量', value: '11', extra: '今日新增 0', tone: 'green' }], taskSeed, noticeSeed, trendTitle: '平台产品上架趋势', trendLegend: '上架数量（个）', trendValue: '42', trendPoints: resourceTrend, secondTitle: '授权运营类型占比', secondLegend: '基础 / 再开发', secondValue: '93', secondPoints: authTrend },
};

const OriginalComponent = () => {
  const [role, setRole] = useState<WorkbenchRole>('实施机构');
  const config = roleConfigs[role];
  const [taskTab, setTaskTab] = useState<TaskTab>('待处理');
  const [noticeTab, setNoticeTab] = useState<NoticeTab>('已读');
  const [tasks, setTasks] = useState<WorkTask[]>(config.taskSeed);
  const [notices, setNotices] = useState<NoticeMessage[]>(config.noticeSeed);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [selectedNoticeIds, setSelectedNoticeIds] = useState<number[]>([]);

  const visibleTasks = useMemo(() => tasks.filter(task => task.handled === (taskTab === '已处理')), [tasks, taskTab]);
  const visibleNotices = useMemo(() => notices.filter(notice => notice.read === (noticeTab === '已读')), [notices, noticeTab]);
  const pendingTaskCount = tasks.filter(task => !task.handled).length;
  const unreadNoticeCount = notices.filter(notice => !notice.read).length;

  useEffect(() => {
    setTasks(config.taskSeed);
    setNotices(config.noticeSeed);
    setTaskTab('待处理');
    setNoticeTab('未读');
    setSelectedTaskIds([]);
    setSelectedNoticeIds([]);
  }, [role]);

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
    <Layout
      activeMenu="implement-org-workbench"
      breadcrumb="工作台"
      role={role}
      onRoleChange={(nextRole) => setRole(nextRole as WorkbenchRole)}
      roleOptions={[...roleOptions]}
      title={`${role}工作台`}
    >
      <div className="implement-org-workbench-body">
        <div className="workbench-main-content">
          {role === '其他经营主体' && <RedevelopmentGuide />}
          <section className="metric-grid">
            {config.metrics.map(metric => <MetricCard key={metric.label} {...metric} />)}
          </section>

          <div className={'workbench-grid middle-grid' + (role === '行业管理部门' ? ' department-middle-grid' : '')}>
            {role !== '行业管理部门' && <section className="panel list-panel">
              <PanelHeader title="待办任务" />
              <Tabs
                items={[
                  { label: '待处理', value: '待处理' },
                  { label: '已处理', value: '已处理' },
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
                      <div className="row-title"><strong>{task.title}</strong></div>
                      <p>{task.content}</p>
                      <div className="row-meta"><span>{task.time}</span></div>
                    </div>
                    <div className="row-actions">
                      {taskTab === '待处理' ? (
                        <>
                          <a href={task.href}>处理</a>
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
            </section>}

            <section className="panel list-panel">
              <PanelHeader title="消息通知" />
              <Tabs
                items={[
                  { label: '未读', value: '未读' },
                  { label: '已读', value: '已读'},
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
                      <div className="row-title"><strong>{notice.title}</strong></div>
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
            {role === '行业管理部门' && <SubscriptionTop10 />}
          </div>

          {role !== '行业管理部门' && <div className="chart-grid">
            <TrendPanel title={config.trendTitle} legend={config.trendLegend} value={config.trendValue} points={config.trendPoints} tone="blue" defaultRange={role === '运营机构' ? '近7天' : '近30天'} />
            {role === '运营机构' ? <DonutPanel /> : <TrendPanel title={config.secondTitle} legend={config.secondLegend} value={config.secondValue} points={config.secondPoints} tone="violet" />}
          </div>}
        </div>
      </div>
    </Layout>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

const RedevelopmentGuide = () => (
  <section className="redevelopment-guide" aria-labelledby="redevelopment-guide-title">
    <div className="redevelopment-guide-heading">
      <h2 id="redevelopment-guide-title">数据产品再开发步骤向导</h2>
      <span className="guide-help" tabIndex={0} aria-label="查看数据产品再开发步骤说明">
        <CircleHelp size={17} aria-hidden="true" />
        <span className="guide-help-tooltip" role="tooltip">
          {redevelopmentSteps.map((step, index) => <span key={step.title}><strong>{index + 1}. {step.title}</strong>{step.description}</span>)}
        </span>
      </span>
    </div>
    <ol className="redevelopment-steps">
      {redevelopmentSteps.map(step => <li key={step.title}>{step.title}</li>)}
    </ol>
  </section>
);

const SubscriptionTop10 = () => {
  const maxCount = subscriptionTop10[0].count;

  return (
    <section className="panel subscription-top-panel">
      <PanelHeader title="再开发数据产品订阅 TOP10" />
      <ol className="subscription-top-list">
        {subscriptionTop10.map((item, index) => (
          <li key={item.product}>
            <span className={'subscription-rank rank-' + (index + 1)}>{index + 1}</span>
            <div className="subscription-product">
              <strong>{item.product}</strong>
              <span>{item.operator}</span>
              <i><b style={{ width: `${(item.count / maxCount) * 100}%` }} /></i>
            </div>
            <em>{item.count.toLocaleString()} 次</em>
          </li>
        ))}
      </ol>
    </section>
  );
};

const MetricCard = ({ icon, label, value, extra, tone }: { icon: ReactNode; label: string; value: string; extra: string; tone: string }) => (
  <div className={'metric-card ' + tone}>
    <div className={'metric-icon ' + tone}>{icon}</div>
    <div className="metric-copy">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{extra}</small>
    </div>
  </div>
);

const PanelHeader = ({ title }: { title: string }) => (
  <div className="panel-heading">
    <div><h2>{title}</h2></div>
  </div>
);

const Tabs = <T extends string>({ items, active, onChange }: { items: Array<{ label: string; value: T }>; active: T; onChange: (value: T) => void }) => (
  <div className="tabs-row">
    {items.map(item => (
      <button key={item.value} type="button" className={active === item.value ? 'active' : ''} onClick={() => onChange(item.value)}>
        {item.label}
      </button>
    ))}
  </div>
);

const CheckBox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <label className="task-checkbox"><input type="checkbox" checked={checked} onChange={onChange} /><span /></label>
);

const ClipboardIcon = () => <FileText size={17} />;

const EmptyState = ({ text }: { text: string }) => <div className="empty-state">{text}</div>;

const TrendPanel = ({ title, legend, value, points, tone, defaultRange = '近30天' }: { title: string; legend: string; value: string; points: string; tone: string; defaultRange?: string }) => {
  const [range, setRange] = useState(defaultRange);

  useEffect(() => {
    setRange(defaultRange);
  }, [defaultRange]);

  return (
    <section className="panel chart-panel">
      <div className="panel-heading chart-heading">
        <div><h2>{title}</h2></div>
        <div className="segmented-control">
          {['全部', '近一年', '近30天', '近7天'].map(item => (
            <button type="button" key={item} className={range === item ? 'active' : ''} onClick={() => setRange(item)}>{item}</button>
          ))}
        </div>
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

const DonutPanel = () => (
  <section className="panel chart-panel donut-panel">
    <div className="panel-heading"><div><h2>基础数据产品类型占比</h2></div></div>
    <div className="donut-content">
      <div className="donut-chart" role="img" aria-label="基础数据产品类型占比：API 产品 12 个，数据集 7 个">
        <div><strong>19</strong><span>产品总数</span></div>
      </div>
      <div className="donut-legend">
        <div><i className="blue" /><span>API 产品</span><strong>12</strong><em>63.2%</em></div>
        <div><i className="violet" /><span>数据集</span><strong>7</strong><em>36.8%</em></div>
      </div>
    </div>
    <div className="chart-legend"><span><i className="blue" />产品类型占比</span><button type="button">导出统计</button></div>
  </section>
);

export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}

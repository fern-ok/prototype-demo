/**
 * @name 实施机构工作台
 * @mode axure
 *
 * 实施机构工作台，展示待办任务统计、快捷入口和最近动态
 */

import { useState } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import { FileText, ShieldCheck, KeyRound, FileSearch, FileCheck, ClipboardList, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import './style.css';

interface TodoItem {
  id: number;
  title: string;
  type: '备案' | '安全审查' | '资源授权' | '初审' | '复审';
  status: '待处理' | '进行中' | '已完成';
  deadline: string;
  link: string;
}

interface StatCard {
  label: string;
  value: number;
  icon: typeof FileText;
  color: string;
  bgColor: string;
}

const todoSeedData: TodoItem[] = [
  { id: 1, title: '省级医保实时监控API - 安全审查', type: '安全审查', status: '待处理', deadline: '2026-08-12', link: '/prototypes/product-security-review.html' },
  { id: 2, title: '医疗健康第1批产品和服务清单备案 - 确认', type: '备案', status: '待处理', deadline: '2026-08-14', link: '/prototypes/product-service-filing.html' },
  { id: 3, title: '交通感知数据集 - 数据资源初审', type: '初审', status: '待处理', deadline: '2026-08-15', link: '/prototypes/data-resource-review.html' },
  { id: 4, title: '城市出行数据报告 - 数据资源复审', type: '复审', status: '进行中', deadline: '2026-08-16', link: '/prototypes/data-resource-recheck.html' },
  { id: 5, title: '自然资源空间数据 - 授权申请', type: '资源授权', status: '待处理', deadline: '2026-08-18', link: '/prototypes/data-resource-auth.html' },
  { id: 6, title: '教育质量评估数据集 - 安全审查', type: '安全审查', status: '已完成', deadline: '2026-08-08', link: '/prototypes/product-security-review.html' },
  { id: 7, title: '文旅消费数据分析报告 - 初审', type: '初审', status: '已完成', deadline: '2026-08-06', link: '/prototypes/data-resource-review.html' },
];

const quickEntries = [
  { label: '产品和服务清单备案', icon: FileText, link: '/prototypes/product-service-filing.html', color: '#0f63f4' },
  { label: '运营协议备案', icon: ClipboardList, link: '/prototypes/operation-agreement-filing.html', color: '#52c41a' },
  { label: '产品安全审查', icon: ShieldCheck, link: '/prototypes/product-security-review.html', color: '#fa8c16' },
  { label: '数据资源授权', icon: KeyRound, link: '/prototypes/data-resource-auth.html', color: '#722ed1' },
  { label: '数据资源初审', icon: FileSearch, link: '/prototypes/data-resource-review.html', color: '#13c2c2' },
  { label: '数据资源复审', icon: FileCheck, link: '/prototypes/data-resource-recheck.html', color: '#eb2f96' },
];

const OriginalComponent = () => {
  const [role, setRole] = useState('实施机构');

  const pendingCount = todoSeedData.filter(t => t.status === '待处理').length;
  const inProgressCount = todoSeedData.filter(t => t.status === '进行中').length;
  const completedCount = todoSeedData.filter(t => t.status === '已完成').length;

  const statCards: StatCard[] = [
    { label: '待处理任务', value: pendingCount, icon: Clock, color: '#fa8c16', bgColor: '#fff7e6' },
    { label: '进行中任务', value: inProgressCount, icon: AlertCircle, color: '#1890ff', bgColor: '#e6f7ff' },
    { label: '已完成任务', value: completedCount, icon: CheckCircle2, color: '#52c41a', bgColor: '#f6ffed' },
    { label: '总任务数', value: todoSeedData.length, icon: ClipboardList, color: '#722ed1', bgColor: '#f9f0ff' },
  ];

  const statusTagClass = (status: string) => {
    switch (status) {
      case '待处理': return 'todo-status todo-status-pending';
      case '进行中': return 'todo-status todo-status-progress';
      case '已完成': return 'todo-status todo-status-done';
      default: return 'todo-status';
    }
  };

  const typeTagClass = (type: string) => {
    switch (type) {
      case '备案': return 'todo-type todo-type-filing';
      case '安全审查': return 'todo-type todo-type-security';
      case '资源授权': return 'todo-type todo-type-auth';
      case '初审': return 'todo-type todo-type-review';
      case '复审': return 'todo-type todo-type-recheck';
      default: return 'todo-type';
    }
  };

  return (
    <Layout
      activeMenu="implement-org-workbench"
      breadcrumb="实施机构工作台"
      role={role}
      onRoleChange={setRole}
      roleOptions={['实施机构']}
      title="实施机构工作台"
    >
      <div className="workbench-container">
        {/* 统计卡片 */}
        <div className="workbench-stats">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div className="stat-card" key={idx}>
                <div className="stat-card-icon" style={{ background: card.bgColor, color: card.color }}>
                  <Icon size={24} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-value">{card.value}</span>
                  <span className="stat-card-label">{card.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 快捷入口 */}
        <div className="workbench-section">
          <div className="workbench-section-header">
            <h2>快捷入口</h2>
          </div>
          <div className="quick-entries">
            {quickEntries.map((entry, idx) => {
              const Icon = entry.icon;
              return (
                <a className="quick-entry-card" href={entry.link} key={idx}>
                  <div className="quick-entry-icon" style={{ color: entry.color }}>
                    <Icon size={28} />
                  </div>
                  <span className="quick-entry-label">{entry.label}</span>
                  <ArrowRight className="quick-entry-arrow" size={16} />
                </a>
              );
            })}
          </div>
        </div>

        {/* 待办列表 */}
        <div className="workbench-section">
          <div className="workbench-section-header">
            <h2>待办任务</h2>
            <span className="workbench-section-subtitle">共 {todoSeedData.length} 条任务</span>
          </div>
          <div className="workbench-todo-table-wrap">
            <table className="workbench-todo-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>序号</th>
                  <th>任务名称</th>
                  <th style={{ width: 100 }}>任务类型</th>
                  <th style={{ width: 90 }}>状态</th>
                  <th style={{ width: 120 }}>截止日期</th>
                  <th style={{ width: 80 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {todoSeedData.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="todo-col-num">{idx + 1}</td>
                    <td className="todo-col-title">{item.title}</td>
                    <td><span className={typeTagClass(item.type)}>{item.type}</span></td>
                    <td><span className={statusTagClass(item.status)}>{item.status}</span></td>
                    <td className="todo-col-deadline">{item.deadline}</td>
                    <td>
                      <a className="todo-action-link" href={item.link}>前往处理</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default Component;

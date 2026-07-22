/**
 * @name 数据产品再开发步骤向导
 * @mode axure
 * 
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 * 
 * 数据产品再开发步骤向导页面，产品登记和产品上架支持并行操作
 */

import { useState } from 'react';
import './style.css';

const Component = () => {
  const [activeStep, setActiveStep] = useState(2);

  const steps = [
    {
      id: 'apply',
      title: '数据申请',
      subtitle: '申请编号',
      description: '数据产品开发前确认所需产品是否在运',
      description2: '营组件中并符合安全要求，进行数据申请',
      status: 'completed',
      icon: 'file-text',
      color: '#409eff'
    },
    {
      id: 'develop',
      title: '产品开发',
      subtitle: '技术开发',
      description: '在已发布的场景中，确认需要开发什么',
      description2: '数据产品并进行开发，提交审核审批',
      status: 'completed',
      icon: 'code',
      color: '#67c23a'
    },
    {
      id: 'review',
      title: '产品安全审查',
      subtitle: '安全评估',
      description: '在开发平台中对产品开发完成后提交产品',
      description2: '安全审查，审查通过后会开发平台会进',
      description3: '行产品打回。',
      status: 'active',
      icon: 'shield-check',
      color: '#e6a23c'
    }
  ];

  const parallelSteps = [
    {
      id: 'register',
      title: '产品登记',
      subtitle: '信息登记',
      description: '产品安全审查通过的产品，可提交产品登',
      description2: '记。',
      status: 'pending',
      icon: 'clipboard-list',
      color: '#909399',
      disabled: activeStep < 2
    },
    {
      id: 'online',
      title: '产品上架',
      subtitle: '上架发布',
      description: '已提交产品登记后的产品，可进行产品上',
      description2: '架操作，上架后的产品展示到权限管控',
      description3: '平台可被搜索和订阅。',
      status: 'pending',
      icon: 'upload',
      color: '#909399',
      disabled: activeStep < 2
    }
  ];

  const stats = [
    { label: '数据产品申请数(个)', value: 0, applying: 0 },
    { label: '场景申请数(个)', value: 2, applying: 0 },
    { label: '平台资源申请数(次)', value: 0, applying: 0 },
    { label: '数据产品数(个)', value: 3, applying: 4 }
  ];

  const tasks = [];

  const getIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      'file-text': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      'code': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      ),
      'shield-check': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c0 5.5-3.8 10.7-9 12-5.2-1.3-9-6.5-9-12 0-1.1.2-2.1.5-3"/>
        </svg>
      ),
      'clipboard-list': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="1" width="5" height="3"/>
          <path d="M16 3H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
          <path d="M14 21H2"/>
          <path d="M10 17H2"/>
          <path d="M14 13H2"/>
          <path d="M10 9H2"/>
        </svg>
      ),
      'upload': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      ),
      'check': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )
    };
    return icons[iconName] || icons['file-text'];
  };

  return (
    <div className="wizard-container">
      <div className="page-header">
        <div className="header-left">
          <h1>数据产品再开发步骤向导</h1>
          <p className="subtitle">了解数据产品从申请到上架的完整流程</p>
        </div>
        <div className="header-right">
          <button className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            开始申请
          </button>
        </div>
      </div>

      <div className="wizard-section">
        <div className="section-title">
          <h2>开发流程</h2>
          <p>完成以下步骤，即可完成数据产品的开发与上架</p>
        </div>

        <div className="linear-steps">
          {steps.map((step, index) => (
            <div key={step.id} className="step-wrapper">
              <div className={`step-card ${step.status}`}>
                <div className="step-icon" style={{ backgroundColor: step.color }}>
                  {step.status === 'completed' ? getIcon('check') : getIcon(step.icon)}
                </div>
                <div className="step-content">
                  <div className="step-header">
                    <span className="step-number">0{index + 1}</span>
                    <span className="step-title">{step.title}</span>
                    <span className="step-subtitle">{step.subtitle}</span>
                  </div>
                  <div className="step-description">
                    <p>{step.description}</p>
                    {step.description2 && <p>{step.description2}</p>}
                    {step.description3 && <p>{step.description3}</p>}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`step-connector ${steps[index + 1].status !== 'pending' ? 'active' : ''}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dcdfe6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="parallel-section">
          <div className="parallel-header">
            <div className="parallel-connector">
              <svg width="12" height="40" viewBox="0 0 24 80" fill="none" stroke="#e6a23c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 0v40"/>
              </svg>
            </div>
            <div className="parallel-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8M12 8v8"/>
              </svg>
              <span>并行步骤</span>
            </div>
          </div>

          <div className="parallel-steps">
            {parallelSteps.map((step) => (
              <div key={step.id} className={`parallel-step ${step.disabled ? 'disabled' : ''}`}>
                <div className="step-card parallel-card">
                  <div className="step-icon" style={{ backgroundColor: step.disabled ? '#c0c4cc' : step.color }}>
                    {getIcon(step.icon)}
                  </div>
                  <div className="step-content">
                    <div className="step-header">
                      <span className="step-number">0{steps.length + (step.id === 'register' ? 1 : 2)}</span>
                      <span className="step-title">{step.title}</span>
                      <span className="step-subtitle">{step.subtitle}</span>
                    </div>
                    <div className="step-description">
                      <p>{step.description}</p>
                      {step.description2 && <p>{step.description2}</p>}
                      {step.description3 && <p>{step.description3}</p>}
                    </div>
                  </div>
                </div>
                {step.disabled && (
                  <div className="step-overlay">
                    <div className="overlay-content">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#909399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                      <span>请先完成产品安全审查</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="parallel-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#409eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            <span>产品登记与产品上架无先后顺序要求，可根据实际业务需求选择操作顺序</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-title">
          <h2>关键指标统计</h2>
        </div>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">
                {index === 0 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#409eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                )}
                {index === 1 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#67c23a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                )}
                {index === 2 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e6a23c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/>
                  </svg>
                )}
                {index === 3 && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#909399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                )}
              </div>
              <div className="stat-content">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
                {stat.applying > 0 && (
                  <span className="stat-applying">申请中: {stat.applying}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="tasks-section">
        <div className="section-title">
          <h2>我的待办</h2>
        </div>
        <div className="tasks-table">
          <table>
            <thead>
              <tr>
                <th>工单编号</th>
                <th>产品名称</th>
                <th>产品类型</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={4}>暂无数据</td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.id}</td>
                    <td>{task.name}</td>
                    <td>{task.type}</td>
                    <td><button className="btn-link">处理</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Component;
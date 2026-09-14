/**
 * @name 其他经营主体工作台
 * @mode axure
 *
 * 其他经营主体登录后台后的工作台首页，复用后台公共 Layout。
 * 主体内容严格参考用户提供的设计图：数据产品再开发步骤向导 + 关键指标统计。
 */

// 注意：本项目使用 classic JSX 运行时，JSX 会被编译为 React.createElement，
// 因此必须显式默认引入 React（不能只用具名导入），否则模块求值/渲染时会出现
// "React is not defined"。此处与 implement-org-workbench 保持一致。
import React, { useState, type FunctionComponent } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

// 数据产品再开发六步流程，步骤说明直接展示在步骤下方
const redevelopmentSteps = [
  { title: '场景申请', description: '根据运营机构发布的场景，选取匹配业务需求的基础数据产品，上传再开发申请书，提交场景申请。' },
  { title: '签署协议', description: '场景申请通过后，与对应运营机构线下签订再开发协议，由运营机构负责将再开发协议上传至平台。' },
  { title: '产品开发', description: '按照再开发协议约定的授权范围、数据用途和安全要求开展产品再开发，并自行组织内部功能测试、性能测试等。' },
  { title: '产品编目', description: '关联开发完成的产品任务，准确录入产品名称、类型、简介等核心基本信息，并按平台要求上传相关附件。' },
  { title: '安全审查', description: '提交安全审查申请，由运营机构对产品授权使用范围、数据暴露风险、算法隐私保护等内容进行审查并出具意见。' },
  { title: '产品上架', description: '安全审查通过后提交产品上架申请，经区域功能节点审核确认，产品将自动上架至全省公共数据授权运营门户。' },
];

type MetricIconKey = 'explore' | 'scene' | 'resource' | 'product';

const metrics: Array<{ icon: MetricIconKey; label: string; value: string; extraLabel: string; extraValue: string }> = [
  { icon: 'explore', label: '数据探查申请数(次)', value: '2', extraLabel: '申请中：', extraValue: '1' },
  { icon: 'scene', label: '场景申请数(次)', value: '29', extraLabel: '申请中：', extraValue: '13' },
  { icon: 'resource', label: '平台资源申请数(次)', value: '0', extraLabel: '申请中：', extraValue: '4' },
  { icon: 'product', label: '数据产品数(个)', value: '4', extraLabel: '订单总数：', extraValue: '8' },
];

/* 指标图标：文档+代码符号、平台资源申请、数据产品（立方体），均为内联 SVG，未引入新依赖 */
const ExploreIcon = () => (
  <svg viewBox="0 0 32 34" aria-hidden="true">
    <path d="M3 4.4A2.4 2.4 0 0 1 5.4 2H18l6 6v15.6a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 23.6Z" fill="#0b5ba8" />
    <path d="M18 2l6 6h-6Z" fill="#1e7fd0" />
    <path d="M12.1 10.6 9.3 13.6l2.8 3" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.9 10.6l2.8 3-2.8 3" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.7 9.9l-2.2 7.4" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="24.6" cy="28.4" r="5.4" fill="#e7c9a1" />
    <path d="M26.5 26.5 22.7 30.3" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ResourceIcon = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <rect x="3" y="4" width="26" height="14.5" rx="2.6" fill="#0b5ba8" />
    <path d="M8.4 11.2h15.2" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M13.2 9.4l2.1 1.8-2.1 1.8-2.1-1.8Z" fill="#0b5ba8" stroke="#fff" strokeWidth="1.3" />
    <path d="M18.8 9.4l2.1 1.8-2.1 1.8-2.1-1.8Z" fill="#0b5ba8" stroke="#fff" strokeWidth="1.3" />
    <rect x="3" y="22.4" width="26" height="4.2" rx="2.1" fill="#e7c9a1" />
    <path d="M9.4 21.6l2 2.9-2 2.9-2-2.9Z" fill="#e7c9a1" stroke="#fff" strokeWidth="1.2" />
  </svg>
);

const ProductIcon = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 3 28.5 10 16 17 3.5 10Z" fill="#1668b3" />
    <path d="M3.5 10 16 17v12L3.5 22Z" fill="#0b4f96" />
    <path d="M28.5 10 16 17v12l12.5-7Z" fill="#e0be96" />
    <path d="M12.6 21v-4.6M12.6 16.4l3.5 1.9" fill="none" stroke="#f2fafd" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// 图标以「组件引用」形式登记，避免在模块顶层执行 JSX（即 React.createElement 不在模块求值时运行）
const metricIcons: Record<MetricIconKey, FunctionComponent> = {
  explore: ExploreIcon,
  scene: ExploreIcon,
  resource: ResourceIcon,
  product: ProductIcon,
};

const MetricIcon = ({ icon }: { icon: MetricIconKey }) => {
  const Icon = metricIcons[icon];
  return (
    <span className={'oew-metric-icon ' + icon}>
      <Icon />
    </span>
  );
};

const OriginalComponent = () => {
  const [role, setRole] = useState('其他经营主体');

  return (
    <Layout
      activeMenu="other-entity-workbench"
      breadcrumb="其他经营主体工作台"
      role={role}
      onRoleChange={setRole}
      roleOptions={['其他经营主体']}
      specContent={specContent}
      changeLogContent={changeLogContent}
    >
      <div className="oew-page">
        <section className="oew-panel" aria-labelledby="oew-guide-title">
          <h2 className="oew-panel-title" id="oew-guide-title">数据产品再开发步骤向导</h2>
          <ol className="oew-steps">
            {redevelopmentSteps.map(step => (
              <li className="oew-step" key={step.title}>
                <div className="oew-step-band"><span>{step.title}</span></div>
                <p className="oew-step-desc">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="oew-panel oew-metrics-panel" aria-labelledby="oew-metrics-title">
          <h2 className="oew-panel-title" id="oew-metrics-title">关键指标统计</h2>
          <div className="oew-metrics">
            {metrics.map(item => (
              <div className="oew-metric" key={item.label}>
                <div className="oew-metric-head">
                  <MetricIcon icon={item.icon} />
                  <strong className="oew-metric-value">{item.value}</strong>
                </div>
                <div className="oew-metric-foot">
                  <span className="oew-metric-label">{item.label}</span>
                  <span className="oew-metric-extra">{item.extraLabel}<b>{item.extraValue}</b></span>
                </div>
              </div>
            ))}
          </div>
        </section>
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

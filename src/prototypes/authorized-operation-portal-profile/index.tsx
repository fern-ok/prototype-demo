/**
 * @name 授权运营平台门户个人中心
 * @mode axure
 *
 * 参考资料：
 * - C:/Users/Lenovo/Desktop/个人中心html.txt
 * - 用户提供的个人中心截图
 *
 * 公共数据资源授权运营管理平台门户个人中心原型
 */

import { UserRound } from 'lucide-react';
import PortalLayout from '../../common/PortalLayout';
import PasswordGuard from '../../common/PasswordGuard';
import specContent from './spec.md?raw';
import changeLogContent from './change.md?raw';
import './style.css';

const menuItems = ['账号信息', '主体认证', '我的订阅', '我的需求', '我的应用', '我的收藏', '我的反馈'];
const roleTags = ['数据基础设施运营方', '运营机构', '数源机构'];

const basicInfo = [
  ['法人类型', '企事业单位法人'],
  ['单位/企业名称', '湖南数据产业集团'],
  ['统一社会信用代码', '91430105750602924H'],
  ['法定代表人', '数***'],
  ['核验类别', '身份证'],
  ['证件号码', '430************214'],
  ['手机号码', '188****8899'],
];

const OriginalComponent = () => (
  <PortalLayout className="profile-page" activeNav="none" specContent={specContent} changeLogContent={changeLogContent}>
    <main className="profile-main">
      <section className="profile-shell">
        <aside className="profile-tabs">
          <h1>个人中心</h1>
          <nav>{menuItems.map((item, index) => <button className={[index === 0 ? 'active' : '', ['我的订阅', '我的需求', '我的应用', '我的收藏'].includes(item) ? 'menu-orange' : ''].filter(Boolean).join(' ')} key={item}>{item}</button>)}</nav>
        </aside>
        <section className="profile-content">
          <div className="info-section">
            <SectionTitle title="注册信息" />
            <div className="register-row">
              <div className="avatar"><UserRound size={48} /></div>
              <div className="register-info">
                <div className="role-tags">{roleTags.map(tag => <span key={tag}>{tag}</span>)}</div>
                <InfoLine label="注册时间" value="2025-03-07 19:42:18" />
                <InfoLine label="账号ID" value="1897976092152287233" />
                <InfoLine label="身份标识" value="91430105750602924H" />
              </div>
            </div>
          </div>

          <div className="info-section basic-section">
            <SectionTitle title="基本信息" />
            <div className="basic-list">{basicInfo.map(([label, value]) => <InfoLine key={label} label={label} value={value} />)}</div>
          </div>
          <div className="profile-decoration" aria-hidden="true"></div>
        </section>
      </section>
    </main>
  </PortalLayout>
);

const SectionTitle = ({ title }: { title: string }) => <h2 className="section-title"><i></i>{title}</h2>;
const InfoLine = ({ label, value }: { label: string; value: string }) => <div className="info-line"><span>{label}：</span><strong>{value}</strong></div>;

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}

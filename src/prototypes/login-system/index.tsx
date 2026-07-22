/**
 * @name 登录系统
 * @mode axure
 * 
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 * 
 * Element UI 风格的登录页面原型
 */

import { useState } from 'react';
import './style.css';

const Component = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [showDocModal, setShowDocModal] = useState(false);
  const [activeTab, setActiveTab] = useState('doc');

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      newErrors.username = '请输入账号';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(username) && 
               !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      newErrors.username = '请输入有效的邮箱或用户名';
    }
    
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6 || password.length > 20) {
      newErrors.password = '密码长度应在6-20位之间';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    alert(`登录成功!\n账号: ${username}\n记住我: ${rememberMe}`);
  };

  return (
    <div className="login-container">
      <button type="button" className="doc-button" onClick={() => setShowDocModal(true)}>
        说明
      </button>
      <div className="login-card">
        <div className="login-header">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </div>
            <h1 className="login-title">系统登录</h1>
            <p className="login-subtitle">欢迎使用管理系统</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-item">
            <label className="form-label">账号</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="请输入账号或邮箱"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) {
                    setErrors(prev => ({ ...prev, username: undefined }));
                  }
                }}
              />
            </div>
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-item">
            <label className="form-label">密码</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  ) : (
                    <path d="M9.87 19.87a2 2 0 0 1-2.83 0"/>
                  )}
                  <path d="M9 12a3 3 0 0 0-4.89-2.49"/>
                  <path d="M15 12a3 3 0 0 1 4.89-2.49"/>
                  <path d="M15.54 9.46a2 2 0 0 1 0 2.83"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-item">
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-box"></span>
              <span className="checkbox-label">记住我</span>
            </label>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <svg className="loading-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle className="loading-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                登录中...
              </>
            ) : (
              '登 录'
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="#" className="footer-link">忘记密码?</a>
          <span className="footer-divider">|</span>
          <a href="#" className="footer-link">立即注册</a>
        </div>
      </div>

      {showDocModal && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>登录系统</h3>
              <button className="modal-close" onClick={() => setShowDocModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-tabs">
                <button 
                  className={activeTab === 'doc' ? 'tab-active' : ''} 
                  onClick={() => setActiveTab('doc')}
                >
                  规格文档
                </button>
                <button 
                  className={activeTab === 'code' ? 'tab-active' : ''} 
                  onClick={() => setActiveTab('code')}
                >
                  参考代码
                </button>
              </div>
              <div className="modal-content-area">
                {activeTab === 'doc' ? (
                  <>
                    <h4>一、功能概述</h4>
                    <p>页面用于用户身份验证，提供安全、简洁的登录入口，支持账号密码登录、记住我、忘记密码等功能。</p>
                    
                    <h4>二、功能清单</h4>
                    <ul>
                      <li>账号输入框：支持输入用户名/邮箱</li>
                      <li>密码输入框：支持密码输入与显示/隐藏切换</li>
                      <li>记住我复选框：记住登录状态</li>
                      <li>登录按钮：提交登录表单</li>
                      <li>忘记密码链接：跳转到密码找回页面</li>
                      <li>注册链接：跳转到注册页面</li>
                      <li>表单验证：实时验证输入格式</li>
                      <li>加载状态：登录请求中的加载反馈</li>
                    </ul>
                    
                    <h4>三、交互要点</h4>
                    <ul>
                      <li>输入框聚焦：显示边框高亮与浮动标签</li>
                      <li>密码显示/隐藏：点击眼睛图标切换</li>
                      <li>表单验证：输入时实时反馈，提交前校验</li>
                      <li>登录按钮：点击后显示加载状态，禁止重复提交</li>
                    </ul>
                    
                    <h4>四、参考资料</h4>
                    <ul>
                      <li>/skills/axure-export-workflow/SKILL.md</li>
                      <li>/rules/axure-api-guide.md</li>
                    </ul>
                  </>
                ) : (
                  <pre className="code-block">
{`/**
 * @name 登录系统
 * @mode axure
 * 
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 * 
 * Element UI 风格的登录页面原型
 */

import { useState } from 'react';
import './style.css';

const Component = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDocModal, setShowDocModal] = useState(false);
  const [activeTab, setActiveTab] = useState('doc');

  const validateForm = () => {
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = '请输入账号';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/.test(username) && 
               !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      newErrors.username = '请输入有效的邮箱或用户名';
    }
    
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6 || password.length > 20) {
      newErrors.password = '密码长度应在6-20位之间';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    alert('登录成功!');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </div>
            <h1 className="login-title">系统登录</h1>
            <p className="login-subtitle">欢迎使用管理系统</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-item">
            <label className="form-label">账号</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                className={errors.username ? 'form-input error' : 'form-input'}
                placeholder="请输入账号或邮箱"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) {
                    setErrors(prev => ({ ...prev, username: undefined }));
                  }
                }}
              />
            </div>
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-item">
            <label className="form-label">密码</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                className={errors.password ? 'form-input error' : 'form-input'}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  ) : (
                    <path d="M9.87 19.87a2 2 0 0 1-2.83 0"/>
                  )}
                  <path d="M9 12a3 3 0 0 0-4.89-2.49"/>
                  <path d="M15 12a3 3 0 0 1 4.89-2.49"/>
                  <path d="M15.54 9.46a2 2 0 0 1 0 2.83"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-item">
            <label className="checkbox-wrapper">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="checkbox-input"/>
              <span className="checkbox-box"></span>
              <span className="checkbox-label">记住我</span>
            </label>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <svg className="loading-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle className="loading-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                登录中...
              </>
            ) : ('登 录')}
          </button>

          <button type="button" className="doc-button" onClick={() => setShowDocModal(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            查看规格文档
          </button>
        </form>

        <div className="login-footer">
          <a href="#" className="footer-link">忘记密码?</a>
          <span className="footer-divider">|</span>
          <a href="#" className="footer-link">立即注册</a>
        </div>
      </div>
    </div>
  );
};

export default Component;`}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Component;
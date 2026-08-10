/**
 * @name 全局密码守卫
 *
 * 用于保护原型项目，未输入正确密码时显示密码输入界面
 * 密码校验通过后，本次浏览期间所有页面都可访问（sessionStorage 记录）
 */

import { useState, ReactNode, useEffect } from 'react';
import { Lock, Shield } from 'lucide-react';
import './password-guard.css';

const PASSWORD = 'Abc12!sf368Ab';
const STORAGE_KEY = '__axhub_auth_passed__';

const isAuthenticated = (): boolean => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const setAuthenticated = () => {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
};

interface PasswordGuardProps {
  children: ReactNode;
}

const PasswordGuard = ({ children }: PasswordGuardProps) => {
  const [passed, setPassed] = useState<boolean>(isAuthenticated());
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  // 同步其他标签页的登录状态
  useEffect(() => {
    const handler = () => setPassed(isAuthenticated());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      setAuthenticated();
      setPassed(true);
      setError('');
    } else {
      setError('密码不正确，请重新输入');
      setInput('');
    }
  };

  if (passed) {
    return <>{children}</>;
  }

  return (
    <div className="pg-lock-screen">
      <div className="pg-lock-card">
        <div className="pg-lock-icon">
          <Shield size={40} />
        </div>
        <h1 className="pg-lock-title">访问受限</h1>
        <p className="pg-lock-subtitle">该原型项目需要密码才能访问</p>
        <form className="pg-lock-form" onSubmit={handleSubmit}>
          <div className="pg-input-wrapper">
            <Lock size={16} className="pg-input-icon" />
            <input
              type="password"
              className="pg-input"
              placeholder="请输入访问密码"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
          </div>
          {error && <div className="pg-error">{error}</div>}
          <button type="submit" className="pg-submit-btn">
            进入项目
          </button>
        </form>
        <p className="pg-lock-hint">© 2026 公共数据资源授权运营管理平台</p>
      </div>
    </div>
  );
};

export default PasswordGuard;

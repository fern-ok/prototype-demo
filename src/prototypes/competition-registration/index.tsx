/**
 * @name 数据要素×比赛报名页面
 * @mode axure
 * 
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 * 
 * 比赛报名页面，重点突出隐私政策授权的明确勾选
 */

import { useState } from 'react';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

const OriginalComponent = () => {
  const [formData, setFormData] = useState({
    teamName: '',
    units: [{
      unitName: '',
      creditCode: '',
      legalType: '',
      businessTerm: ['', ''],
      description: '',
      legalPerson: '',
      legalPersonType: '',
      legalPersonId: '',
      legalPersonExpire: ['', '']
    }],
    recommendCity: '',
    recommendUnit: '',
    track: '',
    topic: '',
    members: [{
      role: '队长',
      name: '',
      unit: '',
      idCard: '',
      phone: ''
    }, {
      role: '队员',
      name: '',
      unit: '',
      idCard: '',
      phone: ''
    }],
    agreePrivacy: false,
    agreeAuthorization: false
  });

  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const handleSubmit = () => {
    if (!formData.agreePrivacy) {
      alert('请阅读并同意隐私政策');
      return;
    }
    if (!formData.agreeAuthorization) {
      alert('请确认同意授权单位信息');
      return;
    }
    alert('报名成功！');
  };

  const addMember = () => {
    if (formData.members.length < 5) {
      setFormData({
        ...formData,
        members: [...formData.members, {
          role: '队员',
          name: '',
          unit: '',
          idCard: '',
          phone: ''
        }]
      });
    }
  };

  const removeMember = (index: number) => {
    if (formData.members.length > 1) {
      setFormData({
        ...formData,
        members: formData.members.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div className="registration-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#409eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>湖南数赛</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#909399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>用户首页</span>
          </button>
          <button className="nav-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#409eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span>报名参赛</span>
          </button>
          <button className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#909399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
              <path d="M19 19v-6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
              <path d="M5 10h14"/>
              <path d="M12 14v7"/>
            </svg>
            <span>报名结果</span>
          </button>
          <button className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#909399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span>资料修改</span>
          </button>
          <button className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#909399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>用户信息</span>
          </button>
        </nav>
      </div>

      <div className="main-content">
        <div className="page-header">
          <h1>数据要素×比赛报名</h1>
          <p>请填写参赛团队信息，带<span className="required">*</span>为必填项</p>
        </div>

        <form className="registration-form">
          <div className="form-section">
            <h2 className="section-title">团队信息</h2>
            <div className="form-item">
              <label>团队名称<span className="required">*</span></label>
              <input 
                type="text" 
                placeholder="请输入团队名称"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h2 className="section-title">单位信息</h2>
              <p className="section-desc">支持填写1-5个参赛单位，成员单位可从下方单位列表中直接选择。每家参赛单位（含牵头及成员单位）单家最多可组建5支参赛团队，单支团队仅能提交1个参赛项目。</p>
            </div>

            <div className="unit-card">
              <div className="unit-header">
                <span className="unit-label">单位1</span>
                <span className="unit-role">牵头单位</span>
                <span className="current-tag">当前为牵头单位</span>
              </div>

              <div className="form-section-inner">
                <h3>单位基本信息</h3>
                <div className="form-grid">
                  <div className="form-item">
                    <label>单位名称<span className="required">*</span></label>
                    <input 
                      type="text" 
                      placeholder="请输入单位名称"
                      value={formData.units[0].unitName}
                      onChange={(e) => {
                        const units = [...formData.units];
                        units[0].unitName = e.target.value;
                        setFormData({ ...formData, units });
                      }}
                    />
                  </div>
                  <div className="form-item">
                    <label>统一社会信用代码<span className="required">*</span></label>
                    <input 
                      type="text" 
                      placeholder="请输入统一社会信用代码"
                      value={formData.units[0].creditCode}
                      onChange={(e) => {
                        const units = [...formData.units];
                        units[0].creditCode = e.target.value;
                        setFormData({ ...formData, units });
                      }}
                    />
                  </div>
                  <div className="form-item">
                    <label>法人类型<span className="required">*</span></label>
                    <select 
                      value={formData.units[0].legalType}
                      onChange={(e) => {
                        const units = [...formData.units];
                        units[0].legalType = e.target.value;
                        setFormData({ ...formData, units });
                      }}
                    >
                      <option value="">请选择法人类型</option>
                      <option value="enterprise">企业法人</option>
                      <option value="institution">事业单位法人</option>
                      <option value="government">机关法人</option>
                      <option value="social">社会团体法人</option>
                    </select>
                  </div>
                  <div className="form-item">
                    <label>经营期限</label>
                    <div className="date-range">
                      <div className="date-input"><input
                        type="date"
                        value={formData.units[0].businessTerm[0]}
                        onChange={(e) => {
                          const units = [...formData.units];
                          units[0].businessTerm[0] = e.target.value;
                          setFormData({ ...formData, units });
                        }}
                      /></div>
                      <span className="date-separator">-</span>
                      <div className="date-input"><input
                        type="date"
                        value={formData.units[0].businessTerm[1]}
                        onChange={(e) => {
                          const units = [...formData.units];
                          units[0].businessTerm[1] = e.target.value;
                          setFormData({ ...formData, units });
                        }}
                      /></div>
                    </div>
                  </div>
                </div>

                <div className="form-item">
                  <label>单位/企业简介</label>
                  <textarea 
                    placeholder="请输入单位简介（限1000字）"
                    value={formData.units[0].description}
                    onChange={(e) => {
                      const units = [...formData.units];
                      units[0].description = e.target.value;
                      setFormData({ ...formData, units });
                    }}
                  />
                </div>

                <div className="form-item">
                  <label>单位证照<span className="required">*</span></label>
                  <div className="upload-area">
                    <button type="button" className="upload-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#409eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span>选择文件</span>
                    </button>
                    <p className="upload-hint">支持《营业执照》《医疗机构执业许可证》《事业单位法人证书》等，格式要求 jpg、jpeg、png，大小限 50MB。</p>
                  </div>
                </div>
              </div>

              <div className="form-section-inner">
                <h3>法定代表人信息</h3>
                <div className="form-grid">
                  <div className="form-item">
                    <label>法定代表人<span className="required">*</span></label>
                    <input 
                      type="text" 
                      placeholder="请输入法定代表人姓名"
                      value={formData.units[0].legalPerson}
                      onChange={(e) => {
                        const units = [...formData.units];
                        units[0].legalPerson = e.target.value;
                        setFormData({ ...formData, units });
                      }}
                    />
                  </div>
                  <div className="form-item">
                    <label>法定代表人证件类型<span className="required">*</span></label>
                    <select 
                      value={formData.units[0].legalPersonType}
                      onChange={(e) => {
                        const units = [...formData.units];
                        units[0].legalPersonType = e.target.value;
                        setFormData({ ...formData, units });
                      }}
                    >
                      <option value="">请选择法定代表人证件类型</option>
                      <option value="idcard">身份证</option>
                      <option value="passport">护照</option>
                    </select>
                  </div>
                  <div className="form-item">
                    <label>法定代表人证件号码<span className="required">*</span></label>
                    <input 
                      type="text" 
                      placeholder="请输入证件号码"
                      value={formData.units[0].legalPersonId}
                      onChange={(e) => {
                        const units = [...formData.units];
                        units[0].legalPersonId = e.target.value;
                        setFormData({ ...formData, units });
                      }}
                    />
                  </div>
                  <div className="form-item">
                    <label>有效期限</label>
                    <div className="date-range">
                      <div className="date-input"><input
                        type="date"
                        value={formData.units[0].legalPersonExpire[0]}
                        onChange={(e) => {
                          const units = [...formData.units];
                          units[0].legalPersonExpire[0] = e.target.value;
                          setFormData({ ...formData, units });
                        }}
                      /></div>
                      <span className="date-separator">-</span>
                      <div className="date-input"><input
                        type="date"
                        value={formData.units[0].legalPersonExpire[1]}
                        onChange={(e) => {
                          const units = [...formData.units];
                          units[0].legalPersonExpire[1] = e.target.value;
                          setFormData({ ...formData, units });
                        }}
                      /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button type="button" className="add-unit-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#409eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              新增单位
            </button>
          </div>

          <div className="form-section">
            <h2 className="section-title">推荐信息</h2>
            <div className="form-grid">
              <div className="form-item">
                <label>推荐市州<span className="required">*</span></label>
                <select 
                  value={formData.recommendCity}
                  onChange={(e) => setFormData({ ...formData, recommendCity: e.target.value })}
                >
                  <option value="">请选择推荐市州</option>
                  <option value="changsha">长沙市</option>
                  <option value="zhuzhou">株洲市</option>
                  <option value="xiangtan">湘潭市</option>
                  <option value="衡阳">衡阳市</option>
                  <option value="shaoyang">邵阳市</option>
                </select>
              </div>
              <div className="form-item">
                <label>推荐单位<span className="required">*</span></label>
                <input 
                  type="text" 
                  placeholder="请输入推荐单位"
                  value={formData.recommendUnit}
                  onChange={(e) => setFormData({ ...formData, recommendUnit: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">参赛信息</h2>
            <div className="form-grid">
              <div className="form-item">
                <label>赛道<span className="required">*</span></label>
                <select 
                  value={formData.track}
                  onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                >
                  <option value="">请选择赛道</option>
                  <option value="track1">数据要素创新应用赛道</option>
                  <option value="track2">数据安全与隐私保护赛道</option>
                  <option value="track3">数据治理与质量提升赛道</option>
                </select>
              </div>
              <div className="form-item">
                <label>赛题<span className="required">*</span></label>
                <select 
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                >
                  <option value="">请选择赛题</option>
                  <option value="topic1">开放数据创新应用</option>
                  <option value="topic2">数据安全技术创新</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h2 className="section-title">成员信息</h2>
              <p className="section-desc">请添加1-5名参赛代表（含队长），每名参赛代表仅可代表1个团队参赛</p>
            </div>

            <table className="members-table">
              <thead>
                <tr>
                  <th>角色</th>
                  <th>成员姓名</th>
                  <th>单位</th>
                  <th>身份证号</th>
                  <th>手机号</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {formData.members.map((member, index) => (
                  <tr key={index}>
                    <td>
                      <span className={`role-tag ${member.role === '队长' ? 'captain' : ''}`}>{member.role}</span>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="请输入姓名"
                        value={member.name}
                        onChange={(e) => {
                          const members = [...formData.members];
                          members[index].name = e.target.value;
                          setFormData({ ...formData, members });
                        }}
                      />
                    </td>
                    <td>
                      <select 
                        value={member.unit}
                        onChange={(e) => {
                          const members = [...formData.members];
                          members[index].unit = e.target.value;
                          setFormData({ ...formData, members });
                        }}
                      >
                        <option value="">请选择或输入单位</option>
                        <option value="unit1">单位1</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="请输入身份证号"
                        value={member.idCard}
                        onChange={(e) => {
                          const members = [...formData.members];
                          members[index].idCard = e.target.value;
                          setFormData({ ...formData, members });
                        }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        placeholder="请输入手机号"
                        value={member.phone}
                        onChange={(e) => {
                          const members = [...formData.members];
                          members[index].phone = e.target.value;
                          setFormData({ ...formData, members });
                        }}
                      />
                    </td>
                    <td>
                      <button 
                        type="button" 
                        className="remove-btn" 
                        onClick={() => removeMember(index)}
                        disabled={formData.members.length <= 1}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#909399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {formData.members.length < 5 && (
              <button type="button" className="add-member-btn" onClick={addMember}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#409eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                新增成员
              </button>
            )}
          </div>

          <div className="form-section">
            <h2 className="section-title">隐私授权</h2>
            
            <div className="agreement-section">
              <label className="agreement-item">
                <input 
                  type="checkbox" 
                  checked={formData.agreePrivacy}
                  onChange={(e) => setFormData({ ...formData, agreePrivacy: e.target.checked })}
                />
                <span className="checkbox-custom"></span>
                <span className="agreement-text">
                  我已阅读并同意
                  <button type="button" className="policy-link" onClick={() => setShowPolicyModal(true)}>《隐私政策》</button>
                </span>
              </label>
            </div>

            <div className="authorization-section">
              <div className="auth-header">
                <label className="auth-checkbox">
                  <input 
                    type="checkbox" 
                    checked={formData.agreeAuthorization}
                    onChange={(e) => setFormData({ ...formData, agreeAuthorization: e.target.checked })}
                  />
                  <span className="checkbox-custom"></span>
                </label>
                <div className="auth-content">
                  <h4>同意授权单位信息至湖南省公共数据流通利用基础设施</h4>
                  <p>
                    我同意将本次报名所填写的单位信息（包括但不限于单位名称、统一社会信用代码、法定代表人信息等）授权至湖南省公共数据流通利用基础设施，用于比赛相关的数据核验、资质审核及赛事管理。
                  </p>
                  <div className="sms-notice">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e6a23c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>
                      <strong>重要提示：</strong>勾选此选项后，您将收到来自湖南省公共数据流通利用基础设施的短信通知，请留意查收。如有疑问，请联系赛事组委会。
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary">保存草稿</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              提交报名
            </button>
          </div>
        </form>
      </div>

      {showPolicyModal && (
        <div className="modal-overlay" onClick={() => setShowPolicyModal(false)}>
          <div className="modal-content policy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>隐私政策</h3>
              <button className="modal-close" onClick={() => setShowPolicyModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <h4>1. 数据收集</h4>
              <p>我们收集您提交的报名信息，包括但不限于单位名称、统一社会信用代码、法定代表人信息、成员信息等。</p>
              <h4>2. 数据使用</h4>
              <p>您的信息将用于比赛的资质审核、赛事管理及相关通知。</p>
              <h4>3. 数据授权</h4>
              <p>您可以选择授权单位信息至湖南省公共数据流通利用基础设施，用于数据核验和赛事管理。授权后将收到短信通知。</p>
              <h4>4. 数据保护</h4>
              <p>我们采取严格的安全措施保护您的个人信息，防止未经授权的访问、使用或披露。</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowPolicyModal(false)}>我已阅读</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;
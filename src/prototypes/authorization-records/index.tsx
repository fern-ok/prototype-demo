/**
 * @name 授权记录
 * @mode axure
 * 
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 * 
 * 授权记录页面，支持两种授权方式：
 * 1. 实施机构主动授权给运营机构
 * 2. 运营机构主动申请数据资源
 */

import { useState } from 'react';
import './style.css';

const Component = () => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<Record<string, any> | null>(null);

  const records = [
    {
      id: 1,
      time: '2026-07-03 09:37:03',
      type: 'active',
      title: '新增数据资源授权',
      count: 1,
      resources: ['湖南省·卫生·医疗就诊数据'],
      status: '已授权'
    },
    {
      id: 2,
      time: '2026-07-02 15:38:41',
      type: 'apply',
      title: '数据资源申请审批',
      count: 1,
      resources: ['测试0702-hsh'],
      status: '已通过'
    },
    {
      id: 3,
      time: '2026-07-02 15:30:27',
      type: 'active',
      title: '新增数据资源授权',
      count: 1,
      resources: ['可信医疗资源32-062301'],
      status: '已授权'
    },
    {
      id: 4,
      time: '2026-07-01 16:21:03',
      type: 'apply',
      title: '数据资源申请审批',
      count: 1,
      resources: ['湖南市场经营扩展码二'],
      status: '已驳回',
      rejectReason: '数据敏感度较高，需提供更详细的使用方案'
    },
    {
      id: 5,
      time: '2026-07-01 10:08:41',
      type: 'active',
      title: '新增数据资源授权',
      count: 1,
      resources: ['测试资源070101'],
      status: '已授权'
    },
    {
      id: 6,
      time: '2026-06-30 14:22:15',
      type: 'apply',
      title: '数据资源申请审批',
      count: 1,
      resources: ['湖南省·交通·道路监控数据'],
      status: '待审批'
    }
  ];

  const handleViewDetail = (record: Record<string, any>) => {
    setDetailData(record);
    setShowDetailModal(true);
  };

  const getTypeLabel = (type: string) => {
    return type === 'active' ? '实施机构发起授权' : '运营机构发起申请';
  };

  const getTypeDescription = (type: string) => {
    return type === 'active' ? '由实施机构主动授权给运营机构' : '由运营机构向实施机构申请';
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case '已授权':
      case '已通过':
        return 'status-approved';
      case '待审批':
        return 'status-pending';
      case '已驳回':
        return 'status-rejected';
      default:
        return 'status-default';
    }
  };

  return (
    <div className="auth-container">
      <div className="page-header">
        <h2>授权记录</h2>
        <button className="close-btn" onClick={() => {}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-row">
          <label className="filter-label">授权时间</label>
          <div className="date-input-group">
            <input type="date" placeholder="开始日期"/>
            <span className="date-divider">-</span>
            <input type="date" placeholder="结束日期"/>
          </div>
        </div>
        <div className="filter-row">
          <label className="filter-label">授权发起方</label>
          <select className="source-select">
            <option value="">全部</option>
            <option value="active">实施机构</option>
            <option value="apply">运营机构</option>
          </select>
        </div>
      </div>

      <div className="timeline-list">
        {records.map((record, index) => (
          <div key={record.id} className="timeline-item" onClick={() => handleViewDetail(record)}>
            <div className="timeline-line">
              <div className={`timeline-dot ${record.type === 'active' ? 'dot-active' : 'dot-apply'}`}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {record.type === 'active' ? (
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  ) : (
                    <>
                      <path d="M12 19v-6"/>
                      <path d="M12 5v6"/>
                      <path d="M5 12h6"/>
                      <path d="M13 12h6"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  )}
                </svg>
              </div>
              {index < records.length - 1 && <div className="connector-line"></div>}
            </div>
            
            <div className="item-content">
              <div className="item-time">{record.time}</div>
              
              <div className="item-title-row">
                <span className="item-title">{record.title} ({record.count})</span>
                <span className={`type-tag ${record.type === 'active' ? 'tag-active' : 'tag-apply'}`}>
                  {getTypeLabel(record.type)}
                </span>
                <span className={`status-tag ${getStatusClass(record.status)}`}>{record.status}</span>
              </div>
              
              <div className="item-desc">{getTypeDescription(record.type)}</div>
              
              <div className="resource-tags">
                {record.resources.map((resource: string, i: number) => (
                  <span key={i} className="resource-tag">{resource}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showDetailModal && detailData && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>授权详情</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>授权时间</label>
                  <span>{detailData.time}</span>
                </div>
                <div className="detail-item">
                  <label>授权发起方</label>
                  <span className={`type-tag ${detailData.type === 'active' ? 'tag-active' : 'tag-apply'}`}>
                    {getTypeLabel(detailData.type)}
                  </span>
                </div>
                <div className="detail-item">
                  <label>授权说明</label>
                  <span>{getTypeDescription(detailData.type)}</span>
                </div>
                <div className="detail-item">
                  <label>数据资源</label>
                  <div className="resource-list">
                    {detailData.resources.map((r: string, i: number) => (
                      <span key={i} className="resource-tag">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="detail-item">
                  <label>状态</label>
                  <span className={`status-tag ${getStatusClass(detailData.status)}`}>{detailData.status}</span>
                </div>
                {detailData.rejectReason && (
                  <div className="detail-item full">
                    <label>驳回原因</label>
                    <span className="reject-reason">{detailData.rejectReason}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Component;
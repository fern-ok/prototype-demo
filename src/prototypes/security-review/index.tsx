/**
 * @name 安全审查管理
 * @mode axure
 * 
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 * 
 * 产品安全审查管理页面，支持审查列表查看、编辑、重新提交等功能
 */

import { useState } from 'react';
import './style.css';

const Component = () => {
  const [searchForm, setSearchForm] = useState({
    applyNo: '',
    productName: '',
    productType: '',
    productSource: '',
    createTime: ['', ''],
    applyTime: ['', ''],
    reviewTime: ['', ''],
    reviewStatus: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const reviewList = [
    {
      id: 1,
      applyNo: 'AQSC1803224511',
      productName: '智能化医保核保开发',
      productType: 'API产品',
      industry: '制造业',
      source: '可信数据空间',
      createTime: '2022-03-10 20:21:11',
      applyTime: '2022-03-10 20:21:11',
      reviewTime: '2022-03-10 20:21:11',
      status: 'passed',
      tasks: ['任务A-001', '任务A-002']
    },
    {
      id: 2,
      applyNo: 'AQSC1803224512',
      productName: '智能化医保核保开发',
      productType: 'API产品',
      industry: '制造业',
      source: '可信数据空间',
      createTime: '2022-03-10 20:21:11',
      applyTime: '2022-03-10 20:21:11',
      reviewTime: '2022-03-10 20:21:11',
      status: 'rejected',
      tasks: ['任务B-001', '任务B-002'],
      rejectReason: '安全评估未通过，需补充加密算法说明'
    },
    {
      id: 3,
      applyNo: 'AQSC1803224513',
      productName: '智能化医保核保开发',
      productType: 'API产品',
      industry: '制造业',
      source: '数据开发中心',
      createTime: '2022-03-10 20:21:11',
      applyTime: '2022-03-10 20:21:11',
      reviewTime: '',
      status: 'pending',
      tasks: []
    },
    {
      id: 4,
      applyNo: 'AQSC1803224514',
      productName: '智能化医保核保开发',
      productType: 'API产品',
      industry: '制造业',
      source: '数据开发中心',
      createTime: '2022-03-10 20:21:11',
      applyTime: '',
      reviewTime: '',
      status: 'draft',
      tasks: []
    }
  ];

  const allTasks = [
    { id: 'task-001', name: '任务A-001', status: 'completed' },
    { id: 'task-002', name: '任务A-002', status: 'completed' },
    { id: 'task-003', name: '任务B-001', status: 'completed' },
    { id: 'task-004', name: '任务B-002', status: 'completed' },
    { id: 'task-005', name: '任务C-001', status: 'pending' },
    { id: 'task-006', name: '任务C-002', status: 'pending' },
    { id: 'task-007', name: '任务D-001', status: 'pending' },
    { id: 'task-008', name: '任务D-002', status: 'pending' }
  ];

  const handleEdit = (item) => {
    setCurrentProduct(item);
    setShowEditModal(true);
  };

  const handleSubmit = () => {
    alert('重新提交安全审查成功！');
    setShowEditModal(false);
  };

  const getStatusText = (status) => {
    const map = {
      passed: '审查通过',
      rejected: '审查不通过',
      pending: '待审查',
      draft: '草稿'
    };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    const map = {
      passed: 'status-passed',
      rejected: 'status-rejected',
      pending: 'status-pending',
      draft: 'status-draft'
    };
    return map[status] || '';
  };

  return (
    <div className="review-container">
      <div className="page-header">
        <h1>安全审查管理</h1>
      </div>

      <div className="search-panel">
        <div className="search-row">
          <div className="form-item">
            <label>申请单号</label>
            <input
              type="text"
              placeholder="请输入"
              value={searchForm.applyNo}
              onChange={(e) => setSearchForm({ ...searchForm, applyNo: e.target.value })}
            />
          </div>
          <div className="form-item">
            <label>产品名称</label>
            <input
              type="text"
              placeholder="请输入"
              value={searchForm.productName}
              onChange={(e) => setSearchForm({ ...searchForm, productName: e.target.value })}
            />
          </div>
          <div className="form-item">
            <label>产品类型</label>
            <select value={searchForm.productType} onChange={(e) => setSearchForm({ ...searchForm, productType: e.target.value })}>
              <option value="">全部</option>
              <option value="API">API产品</option>
              <option value="WEB">WEB产品</option>
              <option value="APP">APP产品</option>
            </select>
          </div>
          <div className="form-item">
            <label>产品来源</label>
            <select value={searchForm.productSource} onChange={(e) => setSearchForm({ ...searchForm, productSource: e.target.value })}>
              <option value="">全部</option>
              <option value="space">可信数据空间</option>
              <option value="center">数据开发中心</option>
            </select>
          </div>
        </div>
        <div className="search-row">
          <div className="form-item">
            <label>创建时间</label>
            <div className="date-range">
              <input type="date" value={searchForm.createTime[0]} onChange={(e) => setSearchForm({ ...searchForm, createTime: [e.target.value, searchForm.createTime[1]] })} />
              <span>—</span>
              <input type="date" value={searchForm.createTime[1]} onChange={(e) => setSearchForm({ ...searchForm, createTime: [searchForm.createTime[0], e.target.value] })} />
            </div>
          </div>
          <div className="form-item">
            <label>申请时间</label>
            <div className="date-range">
              <input type="date" value={searchForm.applyTime[0]} onChange={(e) => setSearchForm({ ...searchForm, applyTime: [e.target.value, searchForm.applyTime[1]] })} />
              <span>—</span>
              <input type="date" value={searchForm.applyTime[1]} onChange={(e) => setSearchForm({ ...searchForm, applyTime: [searchForm.applyTime[0], e.target.value] })} />
            </div>
          </div>
          <div className="form-item">
            <label>审查时间</label>
            <div className="date-range">
              <input type="date" value={searchForm.reviewTime[0]} onChange={(e) => setSearchForm({ ...searchForm, reviewTime: [e.target.value, searchForm.reviewTime[1]] })} />
              <span>—</span>
              <input type="date" value={searchForm.reviewTime[1]} onChange={(e) => setSearchForm({ ...searchForm, reviewTime: [searchForm.reviewTime[0], e.target.value] })} />
            </div>
          </div>
          <div className="form-item">
            <label>审查状态</label>
            <select value={searchForm.reviewStatus} onChange={(e) => setSearchForm({ ...searchForm, reviewStatus: e.target.value })}>
              <option value="">全部</option>
              <option value="passed">审查通过</option>
              <option value="rejected">审查不通过</option>
              <option value="pending">待审查</option>
              <option value="draft">草稿</option>
            </select>
          </div>
        </div>
        <div className="search-actions">
          <button className="btn btn-reset">重置</button>
          <button className="btn btn-search">查询</button>
          <button className="btn btn-add">新增</button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>申请单号</th>
              <th>产品名称</th>
              <th>产品类型</th>
              <th>行业分类</th>
              <th>产品来源</th>
              <th>创建时间</th>
              <th>申请时间</th>
              <th>审查时间</th>
              <th>审查状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reviewList.map((item, index) => (
              <tr key={item.id} className={item.status === 'rejected' ? 'highlight-row' : ''}>
                <td>{index + 1}</td>
                <td>{item.applyNo}</td>
                <td>{item.productName}</td>
                <td>{item.productType}</td>
                <td>{item.industry}</td>
                <td>{item.source}</td>
                <td>{item.createTime}</td>
                <td>{item.applyTime}</td>
                <td>{item.reviewTime}</td>
                <td><span className={`status-tag ${getStatusClass(item.status)}`}>{getStatusText(item.status)}</span></td>
                <td>
                  <button className="link-btn">查看</button>
                  {item.status === 'rejected' && <button className="link-btn" onClick={() => handleEdit(item)}>编辑</button>}
                  {item.status === 'draft' && <button className="link-btn">编辑</button>}
                  {item.status === 'draft' && <button className="link-btn">删除</button>}
                  {item.status === 'draft' && <button className="link-btn">提交安全审查</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button className="page-btn">‹</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <button className="page-btn">4</button>
          <button className="page-btn">5</button>
          <span>...</span>
          <button className="page-btn">50</button>
          <button className="page-btn">›</button>
          <span className="page-info">10条/页</span>
          <span className="page-jump">跳至 <input type="text" /> 页</span>
        </div>
      </div>

      {showEditModal && currentProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑产品信息 - 重新提交安全审查</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              {currentProduct.status === 'rejected' && currentProduct.rejectReason && (
                <div className="reject-info">
                  <div className="reject-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F56C6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <div className="reject-content">
                    <span className="reject-label">驳回原因：</span>
                    <span className="reject-text">{currentProduct.rejectReason}</span>
                  </div>
                </div>
              )}

              <div className="form-section">
                <h4>产品基本信息</h4>
                <div className="form-grid">
                  <div className="form-item">
                    <label>产品名称</label>
                    <input type="text" defaultValue={currentProduct.productName} />
                  </div>
                  <div className="form-item">
                    <label>产品类型</label>
                    <select defaultValue={currentProduct.productType}>
                      <option value="API产品">API产品</option>
                      <option value="WEB产品">WEB产品</option>
                      <option value="APP产品">APP产品</option>
                    </select>
                  </div>
                  <div className="form-item">
                    <label>行业分类</label>
                    <input type="text" defaultValue={currentProduct.industry} />
                  </div>
                  <div className="form-item">
                    <label>产品来源</label>
                    <select defaultValue={currentProduct.source === '可信数据空间' ? 'space' : 'center'}>
                      <option value="space">可信数据空间</option>
                      <option value="center">数据开发中心</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h4>开发任务选择</h4>
                  {currentProduct.tasks && currentProduct.tasks.length > 0 && (
                    <div className="warning-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E6A23C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 9v2m0 4h.01"/>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      <span>原有任务已失效，请重新选择</span>
                    </div>
                  )}
                </div>
                
                <div className="task-select-container">
                  <div className="task-legend">
                    <div className="legend-item">
                      <span className="legend-dot disabled"></span>
                      <span>已选任务（不可再选）</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot available"></span>
                      <span>可选任务</span>
                    </div>
                  </div>

                  <div className="task-list">
                    {allTasks.map((task) => {
                      const isOldTask = currentProduct.tasks && currentProduct.tasks.includes(task.name);
                      return (
                        <label key={task.id} className={`task-item ${isOldTask ? 'disabled-task' : ''}`}>
                          <input 
                            type="checkbox" 
                            disabled={isOldTask}
                          />
                          <span className="task-checkbox"></span>
                          <span className="task-name">{task.name}</span>
                          {isOldTask && <span className="task-tag old-task">原任务</span>}
                          {!isOldTask && task.status === 'pending' && <span className="task-tag new-task">新任务</span>}
                        </label>
                      );
                    })}
                  </div>

                  {currentProduct.tasks && currentProduct.tasks.length > 0 && (
                    <div className="task-hint">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#409EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                      </svg>
                      <span>原有的开发任务已被标记为不可选择，请从新任务中选择</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h4>补充说明</h4>
                <textarea placeholder="请输入针对驳回问题的修改说明..." rows={4}></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setShowEditModal(false)}>取消</button>
              <button className="btn btn-submit" onClick={handleSubmit}>重新提交审查</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Component;
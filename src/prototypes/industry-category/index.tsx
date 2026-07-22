/**
 * @name 行业分类管理
 * @mode axure
 * 
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 * 
 * 行业分类管理页面，左侧树形结构，右侧管理列表
 */

import { useState } from 'react';
import './style.css';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
  status: 'active' | 'inactive';
  sortOrder: number;
  description: string;
}

const Component = () => {
  const [treeData, setTreeData] = useState<Category[]>([
    {
      id: 'c1',
      name: '制造业',
      parentId: null,
      status: 'active',
      sortOrder: 1,
      description: '制造业分类',
      children: [
        {
          id: 'c1-1',
          name: '机械制造',
          parentId: 'c1',
          status: 'active',
          sortOrder: 1,
          description: '机械制造子分类'
        },
        {
          id: 'c1-2',
          name: '电子制造',
          parentId: 'c1',
          status: 'active',
          sortOrder: 2,
          description: '电子制造子分类',
          children: [
            {
              id: 'c1-2-1',
              name: '半导体',
              parentId: 'c1-2',
              status: 'active',
              sortOrder: 1,
              description: '半导体子分类'
            }
          ]
        },
        {
          id: 'c1-3',
          name: '汽车制造',
          parentId: 'c1',
          status: 'inactive',
          sortOrder: 3,
          description: '汽车制造子分类'
        }
      ]
    },
    {
      id: 'c2',
      name: '服务业',
      parentId: null,
      status: 'active',
      sortOrder: 2,
      description: '服务业分类',
      children: [
        {
          id: 'c2-1',
          name: '金融服务',
          parentId: 'c2',
          status: 'active',
          sortOrder: 1,
          description: '金融服务子分类'
        },
        {
          id: 'c2-2',
          name: '医疗服务',
          parentId: 'c2',
          status: 'active',
          sortOrder: 2,
          description: '医疗服务子分类'
        }
      ]
    },
    {
      id: 'c3',
      name: '信息技术',
      parentId: null,
      status: 'active',
      sortOrder: 3,
      description: '信息技术分类',
      children: [
        {
          id: 'c3-1',
          name: '软件开发',
          parentId: 'c3',
          status: 'active',
          sortOrder: 1,
          description: '软件开发子分类'
        },
        {
          id: 'c3-2',
          name: '互联网',
          parentId: 'c3',
          status: 'active',
          sortOrder: 2,
          description: '互联网子分类'
        }
      ]
    },
    {
      id: 'c4',
      name: '农林牧渔',
      parentId: null,
      status: 'inactive',
      sortOrder: 4,
      description: '农林牧渔分类'
    }
  ]);

  const [expandedIds, setExpandedIds] = useState<string[]>(['c1', 'c2']);
  const [selectedId, setSelectedId] = useState<string>('c1');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [deleteItem, setDeleteItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
    status: 'active',
    sortOrder: 0,
    description: ''
  });

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelect = (item: Category) => {
    setSelectedId(item.id);
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      parentId: selectedId,
      status: 'active',
      sortOrder: 0,
      description: ''
    });
    setShowAddModal(true);
  };

  const handleEdit = (item: Category) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      parentId: item.parentId || '',
      status: item.status,
      sortOrder: item.sortOrder,
      description: item.description
    });
    setShowEditModal(true);
  };

  const handleDelete = (item: Category) => {
    setDeleteItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteItem) {
      setTreeData(prev => removeCategory(prev, deleteItem.id));
      setShowDeleteModal(false);
      setDeleteItem(null);
      if (selectedId === deleteItem.id) {
        setSelectedId('');
      }
      alert('删除成功！');
    }
  };

  const removeCategory = (categories: Category[], id: string): Category[] => {
    return categories.filter(cat => cat.id !== id).map(cat => ({
      ...cat,
      children: cat.children ? removeCategory(cat.children, id) : undefined
    }));
  };

  const getParentOptions = (categories: Category[], parentId: string | null = null, prefix = '') => {
    let options: { value: string; label: string }[] = [];
    categories.forEach(cat => {
      if (cat.parentId === parentId) {
        options.push({ value: cat.id, label: prefix + cat.name });
        if (cat.children) {
          options = [...options, ...getParentOptions(cat.children, cat.id, prefix + '├─')];
        }
      }
    });
    return options;
  };

  const handleSubmit = (isEdit: boolean) => {
    if (!formData.name.trim()) {
      alert('请输入分类名称');
      return;
    }

    if (isEdit && editingItem) {
      setTreeData(prev => updateCategory(prev, editingItem.id, formData));
      alert('编辑成功！');
    } else {
      const newId = `new-${Date.now()}`;
      const newCategory: Category = {
        id: newId,
        name: formData.name,
        parentId: formData.parentId || null,
        status: formData.status as 'active' | 'inactive',
        sortOrder: formData.sortOrder,
        description: formData.description
      };
      setTreeData(prev => addCategory(prev, newCategory));
      alert('新增成功！');
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setFormData({ name: '', parentId: '', status: 'active', sortOrder: 0, description: '' });
  };

  const updateCategory = (categories: Category[], id: string, data: typeof formData): Category[] => {
    return categories.map(cat => {
      if (cat.id === id) {
        return {
          ...cat,
          name: data.name,
          status: data.status as 'active' | 'inactive',
          sortOrder: data.sortOrder,
          description: data.description
        };
      }
      return {
        ...cat,
        children: cat.children ? updateCategory(cat.children, id, data) : undefined
      };
    });
  };

  const addCategory = (categories: Category[], newCat: Category): Category[] => {
    if (!newCat.parentId) {
      return [...categories, newCat];
    }
    return categories.map(cat => {
      if (cat.id === newCat.parentId) {
        return {
          ...cat,
          children: [...(cat.children || []), newCat]
        };
      }
      return {
        ...cat,
        children: cat.children ? addCategory(cat.children, newCat) : undefined
      };
    });
  };

  const getAllCategories = (categories: Category[]): Category[] => {
    let result: Category[] = [];
    categories.forEach(cat => {
      result.push(cat);
      if (cat.children) {
        result = [...result, ...getAllCategories(cat.children)];
      }
    });
    return result;
  };

  const selectedCategory = getAllCategories(treeData).find(cat => cat.id === selectedId);
  const allCategories = getAllCategories(treeData);

  const renderTree = (categories: Category[], level = 0) => {
    return categories.map(cat => (
      <div key={cat.id}>
        <div 
          className={`tree-item ${selectedId === cat.id ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 16}px` }}
          onClick={() => handleSelect(cat)}
        >
          {cat.children && cat.children.length > 0 && (
            <button 
              className={`expand-btn ${expandedIds.includes(cat.id) ? 'expanded' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(cat.id);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9h12M12 6v12"/>
              </svg>
            </button>
          )}
          {!cat.children && <span className="expand-placeholder"></span>}
          <span className="tree-icon">
            {cat.children && cat.children.length > 0 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            )}
          </span>
          <span className="tree-label">{cat.name}</span>
          <span className={`status-dot ${cat.status}`}></span>
        </div>
        {cat.children && cat.children.length > 0 && expandedIds.includes(cat.id) && (
          <div className="tree-children">
            {renderTree(cat.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="category-container">
      <div className="page-header">
        <h1>行业分类管理</h1>
      </div>

      <div className="main-content">
        <div className="left-panel">
          <div className="panel-header">
            <h3>行业分类树</h3>
            <button className="btn-add-tree" onClick={handleAdd}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              新增
            </button>
          </div>
          <div className="tree-container">
            {renderTree(treeData)}
          </div>
        </div>

        <div className="right-panel">
          <div className="panel-header">
            <h3>{selectedCategory ? selectedCategory.name : '选择分类'} - 子分类列表</h3>
            <div className="panel-actions">
              <button className="btn btn-primary" onClick={handleAdd}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                新增子分类
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>分类名称</th>
                  <th>状态</th>
                  <th>排序</th>
                  <th>描述</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {allCategories
                  .filter(cat => cat.parentId === selectedId)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((cat, index) => (
                    <tr key={cat.id}>
                      <td>{index + 1}</td>
                      <td>{cat.name}</td>
                      <td><span className={`status-tag ${cat.status}`}>{cat.status === 'active' ? '启用' : '禁用'}</span></td>
                      <td>{cat.sortOrder}</td>
                      <td>{cat.description || '-'}</td>
                      <td>
                        <button className="action-btn edit" onClick={() => handleEdit(cat)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(cat)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                {allCategories.filter(cat => cat.parentId === selectedId).length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-row">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showEditModal ? '编辑分类' : '新增分类'}</h3>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-item">
                <label>分类名称 *</label>
                <input 
                  type="text" 
                  placeholder="请输入分类名称"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-item">
                <label>上级分类</label>
                <select 
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="">无（顶级分类）</option>
                  {getParentOptions(treeData).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-item">
                <label>状态</label>
                <div className="radio-group">
                  <label className="radio-item">
                    <input 
                      type="radio" 
                      name="status" 
                      value="active" 
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    />
                    <span>启用</span>
                  </label>
                  <label className="radio-item">
                    <input 
                      type="radio" 
                      name="status" 
                      value="inactive" 
                      checked={formData.status === 'inactive'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    />
                    <span>禁用</span>
                  </label>
                </div>
              </div>
              <div className="form-item">
                <label>排序号</label>
                <input 
                  type="number" 
                  placeholder="请输入排序号"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-item">
                <label>描述</label>
                <textarea 
                  placeholder="请输入分类描述"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>取消</button>
              <button className="btn btn-primary" onClick={() => handleSubmit(showEditModal)}>
                {showEditModal ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteItem && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F56C6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div className="confirm-message">
              <h3>确认删除</h3>
              <p>确定要删除分类「{deleteItem.name}」吗？</p>
              {deleteItem.children && deleteItem.children.length > 0 && (
                <p className="warning-text">该分类下有子分类，删除后将一并删除！</p>
              )}
            </div>
            <div className="confirm-actions">
              <button className="btn btn-cancel" onClick={() => setShowDeleteModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={confirmDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Component;
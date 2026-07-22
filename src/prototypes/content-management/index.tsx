import React from 'react';

/**
 * @name 内容管理 - 内容创作与编辑模块
 * @mode axure
 * 
 * 参考资料：
 * - /skills/axure-export-workflow/SKILL.md
 * - /rules/axure-api-guide.md
 * 
 * 功能：查看、创建、编辑、删除创作内容，支持 Markdown 富文本编辑和内容状态管理
 */

var statusConfig = {
  draft: { label: '草稿', color: '#d9d9d9', bgColor: '#fafafa' },
  pending: { label: '待审核', color: '#faad14', bgColor: '#fff7e6' },
  approved: { label: '已审核', color: '#1890ff', bgColor: '#e6f7ff' },
  published: { label: '已发布', color: '#52c41a', bgColor: '#f6ffed' },
  offline: { label: '已下线', color: '#ff4d4f', bgColor: '#fff2f0' }
};

var initialContents = [
  {
    id: '1',
    title: '2024年产品更新公告',
    summary: '介绍2024年产品的重大更新和新功能',
    content: '# 2024年产品更新公告\n\n## 新增功能\n\n### 1. 智能推荐系统\n基于用户行为分析的个性化推荐服务。\n\n### 2. 移动端适配\n全面支持 iOS 和 Android 移动端访问。\n\n## 更新内容\n\n- 性能优化\n- Bug 修复\n- 界面优化',
    status: 'published',
    author: '张三',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    title: '使用指南：如何创建内容',
    summary: '详细介绍如何使用内容管理系统创建和发布内容',
    content: '# 使用指南\n\n欢迎使用内容管理系统！\n\n## 创建内容步骤\n\n1. 点击「新建内容」按钮\n2. 填写标题和摘要\n3. 使用编辑器编写内容\n4. 选择状态并保存\n\n## Markdown 支持\n\n支持 **粗体**、*斜体*、[链接](https://example.com) 等格式。',
    status: 'approved',
    author: '李四',
    createdAt: '2024-01-18',
    updatedAt: '2024-01-19'
  },
  {
    id: '3',
    title: '技术博客：React 性能优化技巧',
    summary: '分享 React 应用性能优化的实用技巧',
    content: '# React 性能优化技巧\n\n## 1. 使用 memo 优化组件\n\n```jsx\nconst MemoizedComponent = React.memo(MyComponent);\n```\n\n## 2. 使用 useMemo 缓存计算结果\n\n```jsx\nconst result = useMemo(function() {\n  return computeExpensiveValue(a, b);\n}, [a, b]);\n```',
    status: 'pending',
    author: '王五',
    createdAt: '2024-01-22',
    updatedAt: '2024-01-22'
  },
  {
    id: '4',
    title: '关于我们的团队',
    summary: '介绍公司团队和文化',
    content: '# 关于我们\n\n## 团队介绍\n\n我们是一支充满激情的团队，致力于提供最好的产品和服务。\n\n![团队照片](https://picsum.photos/800/400)\n\n## 价值观\n\n- 用户至上\n- 创新进取\n- 合作共赢',
    status: 'draft',
    author: '赵六',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: '5',
    title: '活动预告：线下沙龙',
    summary: '即将举办的线下技术沙龙活动',
    content: '# 线下技术沙龙\n\n## 活动信息\n\n**时间**：2024年2月1日 14:00\n\n**地点**：北京市朝阳区科技园A座\n\n## 报名方式\n\n请发送邮件至 contact@example.com 报名。',
    status: 'offline',
    author: '张三',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-28'
  }
];

var styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f1f1f',
    margin: 0
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    gap: '6px'
  },
  btnPrimary: {
    backgroundColor: '#1890ff',
    color: '#fff'
  },
  btnSecondary: {
    backgroundColor: '#fff',
    color: '#666',
    border: '1px solid #d9d9d9'
  },
  searchBar: {
    display: 'flex',
    gap: '16px',
    padding: '0 24px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
    alignItems: 'center'
  },
  searchInputWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    padding: '0 12px'
  },
  searchInput: {
    flex: 1,
    height: '36px',
    border: 'none',
    outline: 'none',
    fontSize: '14px'
  },
  filterSelect: {
    height: '36px',
    padding: '0 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer'
  },
  contentList: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px 24px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e8e8e8'
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid #e8e8e8',
    fontSize: '14px',
    color: '#333'
  },
  statusTag: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid'
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  editBtn: {
    backgroundColor: '#f0f5ff',
    color: '#1890ff'
  },
  deleteBtn: {
    backgroundColor: '#fff2f0',
    color: '#ff4d4f'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    color: '#999'
  },
  editorHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e8e8e8'
  },
  editorTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f1f1f',
    margin: 0
  },
  editorForm: {
    maxWidth: '900px',
    margin: '24px auto',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: '24px'
  },
  formGroup: {
    marginBottom: '24px'
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px'
  },
  formInput: {
    width: '100%',
    height: '40px',
    padding: '0 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  formTextarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  statusOptions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  statusOption: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    border: '2px solid transparent',
    transition: 'all 0.2s'
  },
  editorWrapper: {
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  editorToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e8e8e8'
  },
  toolbarBtn: {
    padding: '6px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s'
  },
  toolbarBtnActive: {
    backgroundColor: '#1890ff',
    color: '#fff'
  },
  toolbarHint: {
    fontSize: '12px',
    color: '#999'
  },
  markdownTextarea: {
    width: '100%',
    minHeight: '400px',
    padding: '16px',
    border: 'none',
    fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff'
  },
  previewContent: {
    minHeight: '400px',
    padding: '16px',
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#333'
  }
};

var Component = function() {
  var contents = React.useState(initialContents)[0];
  var setContents = React.useState(initialContents)[1];
  var activeTab = React.useState('list')[0];
  var setActiveTab = React.useState('list')[1];
  var editingId = React.useState(null)[0];
  var setEditingId = React.useState(null)[1];
  var searchKeyword = React.useState('')[0];
  var setSearchKeyword = React.useState('')[1];
  var filterStatus = React.useState('all')[0];
  var setFilterStatus = React.useState('all')[1];
  var formData = React.useState({
    title: '',
    summary: '',
    content: '',
    status: 'draft'
  })[0];
  var setFormData = React.useState({
    title: '',
    summary: '',
    content: '',
    status: 'draft'
  })[1];
  var editorMode = React.useState('markdown')[0];
  var setEditorMode = React.useState('markdown')[1];

  var filteredContents = React.useMemo(function() {
    var result = [];
    for (var i = 0; i < contents.length; i++) {
      var item = contents[i];
      var matchKeyword = !searchKeyword || 
        item.title.toLowerCase().indexOf(searchKeyword.toLowerCase()) !== -1 ||
        item.summary.toLowerCase().indexOf(searchKeyword.toLowerCase()) !== -1;
      var matchStatus = filterStatus === 'all' || item.status === filterStatus;
      if (matchKeyword && matchStatus) {
        result.push(item);
      }
    }
    return result;
  }, [contents, searchKeyword, filterStatus]);

  var handleCreate = React.useCallback(function() {
    setFormData({ title: '', summary: '', content: '', status: 'draft' });
    setEditingId(null);
    setActiveTab('create');
  }, []);

  var handleEdit = React.useCallback(function(id) {
    for (var i = 0; i < contents.length; i++) {
      if (contents[i].id === id) {
        setFormData({
          title: contents[i].title,
          summary: contents[i].summary,
          content: contents[i].content,
          status: contents[i].status
        });
        break;
      }
    }
    setEditingId(id);
    setActiveTab('edit');
  }, [contents]);

  var handleSave = React.useCallback(function() {
    if (!formData.title.trim()) {
      alert('请输入标题');
      return;
    }
    if (!formData.content.trim()) {
      alert('请输入内容');
      return;
    }
    
    var now = new Date().toISOString().split('T')[0];
    
    if (editingId) {
      var newContents = [];
      for (var i = 0; i < contents.length; i++) {
        var item = contents[i];
        if (item.id === editingId) {
          newContents.push({
            id: editingId,
            title: formData.title,
            summary: formData.summary,
            content: formData.content,
            status: formData.status,
            author: item.author,
            createdAt: item.createdAt,
            updatedAt: now
          });
        } else {
          newContents.push(item);
        }
      }
      setContents(newContents);
      alert('内容更新成功！');
    } else {
      var newContent = {
        id: String(Date.now()),
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        status: formData.status,
        author: '当前用户',
        createdAt: now,
        updatedAt: now
      };
      setContents([newContent].concat(contents));
      alert('内容创建成功！');
    }
    
    setActiveTab('list');
  }, [editingId, formData, contents]);

  var handleDelete = React.useCallback(function(id) {
    if (confirm('确定要删除这条内容吗？')) {
      var newContents = [];
      for (var i = 0; i < contents.length; i++) {
        if (contents[i].id !== id) {
          newContents.push(contents[i]);
        }
      }
      setContents(newContents);
      alert('删除成功！');
    }
  }, [contents]);

  var handleBack = React.useCallback(function() {
    setActiveTab('list');
    setEditingId(null);
  }, []);

  var handleFieldChange = React.useCallback(function(field, value) {
    setFormData(function(prev) {
      var newData = {};
      for (var key in prev) {
        newData[key] = prev[key];
      }
      newData[field] = value;
      return newData;
    });
  }, []);

  var renderMarkdown = function(text) {
    if (!text) return { __html: '' };
    
    var html = text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^\#{1,6}\s(.+)$/gm, function(match) {
        var level = match.match(/^\#{1,6}/)[0].length;
        var content = match.replace(/^\#{1,6}\s/, '');
        return '<h' + level + '>' + content + '</h' + level + '>';
      })
      .replace(/^\-\s(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.+<\/li>)/g, '<ul>$1</ul>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;" />')
      .replace(/\n/g, '<br>');
    
    return { __html: html };
  };

  var renderListView = function() {
    return (
      React.createElement('div', { style: styles.container },
        React.createElement('div', { style: styles.toolbar },
          React.createElement('h1', { style: styles.pageTitle }, '内容管理'),
          React.createElement('button', { 
            style: Object.assign({}, styles.btn, styles.btnPrimary),
            onClick: handleCreate
          }, '+ 新建')
        ),
        React.createElement('div', { style: styles.searchBar },
          React.createElement('div', { style: styles.searchInputWrapper },
            React.createElement('input', {
              type: 'text',
              style: styles.searchInput,
              placeholder: '搜索标题或摘要...',
              value: searchKeyword,
              onChange: function(e) { setSearchKeyword(e.target.value); }
            })
          ),
          React.createElement('select', {
            style: styles.filterSelect,
            value: filterStatus,
            onChange: function(e) { setFilterStatus(e.target.value); }
          },
            React.createElement('option', { value: 'all' }, '全部状态'),
            React.createElement('option', { value: 'draft' }, '草稿'),
            React.createElement('option', { value: 'pending' }, '待审核'),
            React.createElement('option', { value: 'approved' }, '已审核'),
            React.createElement('option', { value: 'published' }, '已发布'),
            React.createElement('option', { value: 'offline' }, '已下线')
          )
        ),
        React.createElement('div', { style: styles.contentList },
          filteredContents.length === 0 ?
            React.createElement('div', { style: styles.emptyState },
              React.createElement('p', null, '暂无内容')
            ) :
            React.createElement('table', { style: styles.table },
              React.createElement('thead', null,
                React.createElement('tr', null,
                  React.createElement('th', { style: styles.th }, '标题'),
                  React.createElement('th', { style: styles.th }, '摘要'),
                  React.createElement('th', { style: styles.th }, '状态'),
                  React.createElement('th', { style: styles.th }, '作者'),
                  React.createElement('th', { style: styles.th }, '更新时间'),
                  React.createElement('th', { style: styles.th }, '操作')
                )
              ),
              React.createElement('tbody', null,
                filteredContents.map(function(item) {
                  var status = statusConfig[item.status];
                  return (
                    React.createElement('tr', { key: item.id },
                      React.createElement('td', { style: Object.assign({}, styles.td, { fontWeight: 500, color: '#1890ff' }) }, item.title),
                      React.createElement('td', { style: Object.assign({}, styles.td, { color: '#666', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }) }, item.summary),
                      React.createElement('td', { style: styles.td },
                        React.createElement('span', {
                          style: Object.assign({}, styles.statusTag, {
                            backgroundColor: status.bgColor,
                            color: status.color,
                            borderColor: status.color
                          })
                        }, status.label)
                      ),
                      React.createElement('td', { style: styles.td }, item.author),
                      React.createElement('td', { style: styles.td }, item.updatedAt),
                      React.createElement('td', { style: styles.td },
                        React.createElement('button', {
                          style: Object.assign({}, styles.actionBtn, styles.editBtn),
                          onClick: function() { handleEdit(item.id); }
                        }, '编辑'),
                        React.createElement('button', {
                          style: Object.assign({}, styles.actionBtn, styles.deleteBtn),
                          onClick: function() { handleDelete(item.id); }
                        }, '删除')
                      )
                    )
                  );
                })
              )
            )
        )
      )
    );
  };

  var renderEditView = function() {
    var isEdit = editingId !== null;
    
    var statusKeys = Object.keys(statusConfig);
    var statusOptions = statusKeys.map(function(key) {
      var status = statusConfig[key];
      return (
        React.createElement('label', { key: key, style: styles.statusOption },
          React.createElement('input', {
            type: 'radio',
            name: 'status',
            value: key,
            checked: formData.status === key,
            onChange: function(e) { handleFieldChange('status', e.target.value); }
          }),
          React.createElement('span', {
            style: Object.assign({}, styles.statusBadge, {
              backgroundColor: formData.status === key ? status.bgColor : '#fafafa',
              color: formData.status === key ? status.color : '#666',
              borderColor: formData.status === key ? status.color : '#d9d9d9'
            })
          }, status.label)
        )
      );
    });

    return (
      React.createElement('div', { style: styles.container },
        React.createElement('div', { style: styles.editorHeader },
          React.createElement('button', {
            style: Object.assign({}, styles.btn, styles.btnSecondary),
            onClick: handleBack
          }, '返回'),
          React.createElement('h1', { style: styles.editorTitle }, isEdit ? '编辑内容' : '新建内容'),
          React.createElement('button', {
            style: Object.assign({}, styles.btn, styles.btnPrimary),
            onClick: handleSave
          }, isEdit ? '保存修改' : '保存内容')
        ),
        React.createElement('div', { style: styles.editorForm },
          React.createElement('div', { style: styles.formGroup },
            React.createElement('label', { style: styles.formLabel }, '标题'),
            React.createElement('input', {
              type: 'text',
              style: styles.formInput,
              placeholder: '请输入内容标题',
              value: formData.title,
              onChange: function(e) { handleFieldChange('title', e.target.value); }
            })
          ),
          React.createElement('div', { style: styles.formGroup },
            React.createElement('label', { style: styles.formLabel }, '摘要'),
            React.createElement('textarea', {
              style: styles.formTextarea,
              placeholder: '请输入内容摘要（简短描述）',
              rows: 3,
              value: formData.summary,
              onChange: function(e) { handleFieldChange('summary', e.target.value); }
            })
          ),
          React.createElement('div', { style: styles.formGroup },
            React.createElement('label', { style: styles.formLabel }, '状态'),
            React.createElement('div', { style: styles.statusOptions }, statusOptions)
          ),
          React.createElement('div', { style: styles.formGroup },
            React.createElement('label', { style: styles.formLabel }, '内容'),
            React.createElement('div', { style: styles.editorWrapper },
              React.createElement('div', { style: styles.editorToolbar },
                React.createElement('div', null,
                  React.createElement('button', {
                    style: Object.assign({}, styles.toolbarBtn, editorMode === 'markdown' ? styles.toolbarBtnActive : {}),
                    onClick: function() { setEditorMode('markdown'); }
                  }, 'Markdown'),
                  React.createElement('button', {
                    style: Object.assign({}, styles.toolbarBtn, editorMode === 'preview' ? styles.toolbarBtnActive : {}),
                    onClick: function() { setEditorMode('preview'); }
                  }, '预览')
                ),
                React.createElement('span', { style: styles.toolbarHint }, '支持 Markdown 语法')
              ),
              React.createElement('div', { style: styles.editorContent },
                editorMode === 'markdown' ?
                  React.createElement('textarea', {
                    style: styles.markdownTextarea,
                    placeholder: '请输入内容（支持 Markdown 格式）...',
                    rows: 20,
                    value: formData.content,
                    onChange: function(e) { handleFieldChange('content', e.target.value); }
                  }) :
                  React.createElement('div', {
                    style: styles.previewContent,
                    dangerouslySetInnerHTML: renderMarkdown(formData.content)
                  })
              )
            )
          )
        )
      )
    );
  };

  if (activeTab === 'list') {
    return renderListView();
  } else {
    return renderEditView();
  }
};

export default Component;
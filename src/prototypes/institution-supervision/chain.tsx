/**
 * @name 备案关系链路
 *
 * 机构监管页面的第二视图：以数据管理部门为起点，逐级下钻查看完整备案关系链路
 * 数据管理部门 → 行业主管部门 → 实施机构 → 运营机构 → 其他经营主体。
 * 承载：链路概览统计、层级面包屑、当前层筛选与列表、逐级下钻与逐级返回、
 * 上下级联动刷新、加载中与无数据展示。
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, RefreshCw } from 'lucide-react';
import RegionCascader from '../../common/RegionCascader';
import {
  CHAIN_LEVELS,
  ChainNode,
  Institution,
  LevelPayload,
  buildLevelPayload,
  buildRoleSpecific,
  buildScopeKey,
  computeScopes,
  createRootNode,
  filterLevelList,
  levelMeta
} from './chain-shared';

/** 模拟接口延迟（毫秒）：层级切换 / 查询 / 刷新均走一次加载 */
const LOAD_DELAY = 300;

export default function FilingChainView({ records }: { records: Institution[] }) {
  /** 层级路径：path[i] 描述第 i+1 层及其上级机构；path[0] 为数据管理部门根层 */
  const [path, setPath] = useState<ChainNode[]>(function () { return [createRootNode()]; });
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<LevelPayload | null>(null);
  /** 强制重新加载计数（查询 / 刷新时递增） */
  const [dataVersion, setDataVersion] = useState(0);
  /** 层级数据缓存：key = 层级:上级机构，父层缓存保留以支撑逐级返回即时呈现 */
  const cacheRef = useRef<Record<string, LevelPayload>>({});

  const [currentRecord, setCurrentRecord] = useState<Institution | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const currentNode = path[path.length - 1];
  const meta = levelMeta(currentNode.level);
  const isLastLevel = currentNode.level === CHAIN_LEVELS.length;
  const scopeKey = buildScopeKey(currentNode);

  // 层级数据加载：命中缓存直接呈现，否则模拟一次接口请求
  useEffect(
    function () {
      const cached = cacheRef.current[scopeKey];
      if (cached) {
        setPayload(cached);
        setLoading(false);
        return;
      }
      setLoading(true);
      const timer = window.setTimeout(function () {
        const next = buildLevelPayload(records, path);
        cacheRef.current[scopeKey] = next;
        setPayload(next);
        setLoading(false);
      }, LOAD_DELAY);
      return function () { window.clearTimeout(timer); };
    },
    // 仅按「层级 + 上级机构」与刷新计数触发；筛选与分页为本地即时计算
    [scopeKey, dataVersion]
  );

  /** 链路概览：当前路径下各层级可达数量（逐层收敛） */
  const scopes = useMemo(function () {
    return computeScopes(records, path);
  }, [records, path]);

  const filteredList = useMemo(function () {
    if (!payload) return [];
    return filterLevelList(payload.list, currentNode.filters, currentNode.level);
  }, [payload, currentNode.filters, currentNode.level]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / currentNode.pageSize));
  const safePage = Math.min(currentNode.page, totalPages);
  const pagedList = filteredList.slice((safePage - 1) * currentNode.pageSize, safePage * currentNode.pageSize);

  const updateCurrent = function (patch: Partial<ChainNode>) {
    setPath(function (prev) {
      const next = prev.slice();
      next[next.length - 1] = Object.assign({}, next[next.length - 1], patch);
      return next;
    });
  };

  const updateFilter = function (key: string, value: string) {
    const filters = Object.assign({}, currentNode.filters);
    filters[key] = value;
    updateCurrent({ filters: filters });
  };

  /** 下钻：以当前行机构作为上级进入下一层，重置下级的分页与筛选 */
  const enterChild = function (record: Institution) {
    if (isLastLevel) return;
    setPath(function (prev) {
      return prev.concat([
        {
          level: currentNode.level + 1,
          parentId: record.id,
          parentName: record.orgName,
          page: 1,
          pageSize: currentNode.pageSize,
          filters: {}
        }
      ]);
    });
  };

  /** 面包屑跨级返回：截断到目标层级，被截断层的缓存随之失效 */
  const gotoLevel = function (index: number) {
    setPath(function (prev) {
      if (index >= prev.length) return prev;
      return prev.slice(0, index + 1);
    });
  };

  /** 返回上一级 */
  const backOne = function () {
    setPath(function (prev) {
      if (prev.length <= 1) return prev;
      return prev.slice(0, prev.length - 1);
    });
  };

  const handleQuery = function () {
    updateCurrent({ page: 1 });
    setDataVersion(function (v) { return v + 1; });
  };

  const handleReset = function () {
    updateCurrent({ page: 1, filters: {} });
    setDataVersion(function (v) { return v + 1; });
  };

  /** 刷新当前层：清空当前层及其全部子层缓存后重新加载，父层缓存保留 */
  const handleRefresh = function () {
    Object.keys(cacheRef.current).forEach(function (key) {
      const level = Number(key.split(':')[0]);
      if (level >= currentNode.level) delete cacheRef.current[key];
    });
    setDataVersion(function (v) { return v + 1; });
  };

  const handleView = function (record: Institution) {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  const filters = currentNode.filters;
  const stats = payload ? payload.stats : null;
  const roleSpecific = currentRecord ? buildRoleSpecific(currentRecord) : null;

  const renderOverview = () => (
    <Fragment>
      <div className="chain-overview">
        {CHAIN_LEVELS.map(function (item, idx) {
          const count = (scopes[item.level] || []).length;
          const reached = path.length >= item.level;
          const active = item.level === currentNode.level;
          const cls = 'chain-overview-item' + (active ? ' active' : '') + (reached ? '' : ' disabled');
          return (
            <Fragment key={item.level}>
              {idx > 0 && <ChevronRight size={14} className="chain-overview-arrow" />}
              <button
                type="button"
                className={cls}
                disabled={!reached || active}
                onClick={() => gotoLevel(item.level - 1)}
                title={reached ? '查看该层级列表' : '请先逐级下钻至该层级'}
              >
                {item.title}
                <b>{loading && active ? '--' : count}</b>
              </button>
            </Fragment>
          );
        })}
      </div>
      {/* 省本级 / 地市数量区分：行内小字随概览条展示，不再单独占一个统计卡区域 */}
      <div className="chain-region-line">
        <span className="chain-region-label">地域分布</span>
        {loading || !stats ? (
          <span className="chain-region-value">--</span>
        ) : (
          <Fragment>
            <span className="chain-region-value">省本级 <b>{stats.province}</b></span>
            <span className="chain-region-sep">·</span>
            <span className="chain-region-value">地市 <b>{stats.city}</b></span>
          </Fragment>
        )}
      </div>
    </Fragment>
  );

  const renderBreadcrumb = () => (
    <div className="chain-nav">
      <div className="chain-crumbs">
        {path.map(function (node, idx) {
          const isCurrent = idx === path.length - 1;
          const label = idx === 0 ? '数据管理部门' : node.parentName;
          return (
            <Fragment key={node.level}>
              {idx > 0 && <ChevronRight size={14} className="chain-crumb-sep" />}
              <button
                type="button"
                className={'chain-crumb' + (isCurrent ? ' current' : '')}
                disabled={isCurrent}
                onClick={() => gotoLevel(idx)}
              >
                {label}
              </button>
            </Fragment>
          );
        })}
        <span className="chain-level-tag">当前层级：{meta.title}</span>
        {isLastLevel && <span className="chain-level-tag muted">链路末级</span>}
      </div>
      <div className="chain-nav-right">
        <button type="button" className="btn btn-default btn-sm" onClick={backOne} disabled={path.length <= 1 || loading}>
          <ArrowLeft size={13} />
          返回上一级
        </button>
        <button type="button" className="btn btn-default btn-sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          刷新
        </button>
      </div>
    </div>
  );

  /**
   * 当前层统计卡（2026-10-19 起不再挂载，代码保留备查）：
   * 需求已去掉链路列表上方的整个统计区域，省本级 / 地市区分以行内小字随链路概览条展示。
   */
  const renderStats = () => (
    <div className="chain-stats">
      <div className="chain-stat-card">
        <div className="chain-stat-label">{meta.title}数量</div>
        <div className="chain-stat-value">{loading || !stats ? '--' : stats.total}</div>
      </div>
      <div className="chain-stat-card">
        <div className="chain-stat-label">{isLastLevel ? '末级机构' : '有下级 / 无下级'}</div>
        <div className="chain-stat-value">
          {loading || !stats ? '--' : isLastLevel ? stats.total + ' 家' : stats.withChild + ' / ' + stats.withoutChild}
        </div>
      </div>
    </div>
  );

  const renderFilter = () => (
    <div className="filter-section">
      <div className="filter-row">
        {meta.filters.map(function (f) {
          if (f.type === 'region') {
            return <RegionCascader key={f.key} value={filters.region || ''} onChange={(v) => updateFilter('region', v)} />;
          }
          if (f.type === 'select') {
            return (
              <div className="filter-item filter-item-select" key={f.key}>
                <label>{f.label}</label>
                <select value={filters[f.key] || ''} onChange={(e) => updateFilter(f.key, e.target.value)}>
                  <option value="">请选择</option>
                  {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            );
          }
          if (f.type === 'date-range') {
            return (
              <div className="filter-item" key={f.key}>
                <label>{f.label}</label>
                <div className="date-range-control">
                  <input
                    type="date"
                    aria-label={f.label + '起'}
                    value={filters.timeStart || ''}
                    onChange={(e) => updateFilter('timeStart', e.target.value)}
                  />
                  <span className="date-range-sep">至</span>
                  <input
                    type="date"
                    aria-label={f.label + '止'}
                    value={filters.timeEnd || ''}
                    onChange={(e) => updateFilter('timeEnd', e.target.value)}
                  />
                </div>
              </div>
            );
          }
          return (
            <div className="filter-item" key={f.key}>
              <label>{f.label}</label>
              <input
                type="text"
                placeholder="请输入"
                value={filters[f.key] || ''}
                onChange={(e) => updateFilter(f.key, e.target.value)}
              />
            </div>
          );
        })}
      </div>
      <div className="filter-actions">
        <div className="filter-actions-left">
          <button className="btn btn-primary btn-sm" onClick={handleQuery} disabled={loading}>查询</button>
          <button className="btn btn-default btn-sm" onClick={handleReset} disabled={loading}>重置</button>
        </div>
      </div>
    </div>
  );

  const renderCell = (key: string, record: Institution, rowIndex: number) => {
    switch (key) {
      case 'index':
        return (safePage - 1) * currentNode.pageSize + rowIndex + 1;
      case 'batch':
        return record.batch || '-';
      case 'region':
        return record.region;
      case 'authType':
        return record.authType;
      case 'domain':
        return record.domain;
      case 'orgName':
        return record.orgName;
      case 'creditCode':
        return record.creditCode;
      case 'filingTime':
        return record.filingTime;
      case 'period':
        return record.filingTime.slice(0, 10) + ' 至 2031-12-31';
      case 'parentOrg':
        return payload && payload.parentNames[record.id] ? payload.parentNames[record.id] : '-';
      case 'childCount': {
        const count = payload ? payload.childCounts[record.id] || 0 : 0;
        return count > 0
          ? (
            <button
              className="link-number"
              onClick={() => enterChild(record)}
              title={'点击查看' + meta.childTitle}
            >
              {count}
            </button>
          )
          : <span className="chain-zero">0</span>;
      }
      case 'ops': {
        const count = payload ? payload.childCounts[record.id] || 0 : 0;
        return (
          <div className="chain-ops">
            {!isLastLevel && (
              <button
                className="link-text"
                disabled={count === 0}
                onClick={() => enterChild(record)}
                title={count === 0 ? '暂无下级备案机构' : '查看' + meta.childTitle}
              >
                查看下级
              </button>
            )}
            <button className="link-text" onClick={() => handleView(record)}>查看</button>
          </div>
        );
      }
      default:
        return '-';
    }
  };

  const renderSkeleton = () => (
    <div className="chain-skeleton">
      {Array.from({ length: 8 }, function (_, i) {
        return <div className="chain-skeleton-row" key={i} />;
      })}
    </div>
  );

  const renderEmpty = () => {
    const levelEmpty = !payload || payload.list.length === 0;
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭</div>
        {levelEmpty ? '该' + (path.length > 1 ? '上级机构' : '层级') + '下暂无' + meta.title + '备案数据' : '未找到符合条件的机构'}
        <div className="chain-empty-actions">
          {levelEmpty && path.length > 1 && (
            <button className="btn btn-default btn-sm" onClick={backOne}>返回上一级</button>
          )}
          {!levelEmpty && (
            <button className="btn btn-default btn-sm" onClick={handleReset}>重置筛选</button>
          )}
        </div>
      </div>
    );
  };

  const renderTable = () => (
    <div className="table-section">
      <div className="list-toolbar">
        <div className="list-toolbar-left">
          <span className="list-toolbar-total">
            {meta.title}列表 · 共 <b>{filteredList.length}</b> 条
            {!loading && payload && filteredList.length !== payload.list.length && (
              <span className="chain-scope-tip">（本层共 {payload.list.length} 条，已按筛选条件过滤）</span>
            )}
          </span>
        </div>
      </div>
      <div className="table-wrapper">
        {loading ? (
          renderSkeleton()
        ) : filteredList.length === 0 ? (
          renderEmpty()
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {meta.columns.map(function (col) {
                  return <th key={col.key} style={{ width: col.width }}>{col.title}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {pagedList.map(function (record, index) {
                return (
                  <tr key={record.id}>
                    {meta.columns.map(function (col) {
                      return <td key={col.key}>{renderCell(col.key, record, index)}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filteredList.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">共 {filteredList.length} 条记录</div>
          <div className="pagination-controls">
            <button className="page-btn" disabled={safePage <= 1} onClick={() => updateCurrent({ page: Math.max(1, safePage - 1) })}>上一页</button>
            {Array.from({ length: totalPages }, function (_, i) { return i + 1; })
              .filter(function (p) { return p === 1 || p === totalPages || Math.abs(p - safePage) <= 1; })
              .map(function (page, idx, arr) {
                return (
                  <span key={page} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ color: '#999' }}>...</span>}
                    <button
                      className={'page-number' + (page === safePage ? ' active' : '')}
                      onClick={() => updateCurrent({ page: page })}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}
            <button className="page-btn" disabled={safePage >= totalPages} onClick={() => updateCurrent({ page: Math.min(totalPages, safePage + 1) })}>下一页</button>
            <select
              className="page-size-select"
              value={currentNode.pageSize}
              onChange={(e) => updateCurrent({ pageSize: Number(e.target.value), page: 1 })}
            >
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const renderViewModal = () => {
    if (!currentRecord || !roleSpecific) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
        <div className="modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>机构备案详情</h3>
            <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="section-title"><span className="title-bar"></span>基本信息</div>
            <div className="view-info-grid">
              <div className="info-label">单位/企业名称</div>
              <div className="info-value-span">{currentRecord.orgName}</div>
              <div className="info-label">统一社会信用代码</div>
              <div className="info-value">{currentRecord.creditCode}</div>
              <div className="info-label">所属地域</div>
              <div className="info-value">{currentRecord.region}</div>
              <div className="info-label">授权运营类型</div>
              <div className="info-value">{currentRecord.authType}</div>
              <div className="info-label">领域名称</div>
              <div className="info-value">{currentRecord.domain}</div>
              <div className="info-label">机构角色</div>
              <div className="info-value"><span className="role-tag">{currentRecord.role}</span></div>
              <div className="info-label">备案时间</div>
              <div className="info-value">{currentRecord.filingTime}</div>
            </div>

            <div className="section-title"><span className="title-bar"></span>{roleSpecific.title}</div>
            <div className="view-info-grid">
              {roleSpecific.items.map(function (it, idx) {
                return (
                  <Fragment key={idx}>
                    <div className="info-label">{it.label}</div>
                    {it.span
                      ? <div className="info-value-span">{it.value}</div>
                      : <div className="info-value">{it.value}</div>}
                  </Fragment>
                );
              })}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-default" onClick={() => setShowViewModal(false)}>关闭</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chain-view">
      {renderOverview()}
      {renderBreadcrumb()}
      {/* 统计卡区域已按需求移除（renderStats 保留未挂载），层级数量见链路概览条与列表工具条 */}
      {renderFilter()}
      {renderTable()}
      {showViewModal && renderViewModal()}
    </div>
  );
}

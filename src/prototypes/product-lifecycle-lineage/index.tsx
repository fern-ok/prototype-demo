/**
 * @name 数据血缘（独立整页）
 * @mode axure
 *
 * 由「产品生命周期」列表页「数据血缘」按钮跳转进入的独立整页。
 * 通过 URL 参数 ?code=数据产品标识码 定位记录，全屏渲染血缘辐射图谱，
 * 点击节点从右侧滑出抽屉展示节点信息；支持直接访问与刷新。
 *
 * 画布交互：整体拖拽平移（鼠标 / 触控）、滚轮 / 双指手势缩放（保持缩放比例）、
 * 重置视图按钮与 R 快捷键重置画布内容。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import {
  LifecycleRecord,
  LineageNode,
  getRecordByCode,
  buildLineage,
  LineageGraph,
  LINEAGE_LEGEND,
  NODE_STYLE as LEGEND_STYLE
} from '../product-lifecycle/lifecycle-shared';
import '../product-lifecycle/style.css';
import '../../common/backend-list.css';
import './lineage-style.css';

const LIST_PAGE_URL = '/prototypes/product-lifecycle.html';

/* 画布平移 / 缩放参数 */
const MIN_SCALE = 0.4;
const MAX_SCALE = 3;
const WHEEL_SENSITIVITY = 0.0016;
const DRAG_THRESHOLD = 4;

type TabKey = 'basic' | 'auth';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

const OriginalComponent = () => {
  const code = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || '';
  }, []);

  const record: LifecycleRecord | undefined = useMemo(() => getRecordByCode(code), [code]);
  const lineage = useMemo(() => (record ? buildLineage(record) : { layers: [], edges: [] }), [record]);

  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  /* ---------------- 画布平移 / 缩放状态 ---------------- */
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef<Transform>(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const setBoth = useCallback((t: Transform) => {
    transformRef.current = t;
    setTransform(t);
  }, []);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panStateRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchStateRef = useRef<{
    startScale: number;
    startX: number;
    startY: number;
    startDist: number;
    midX: number;
    midY: number;
  } | null>(null);
  const dragMovedRef = useRef(false);

  /** 以容器内某点为锚点进行缩放（保持该点屏幕位置不变） */
  const applyZoom = useCallback((factor: number, anchorX: number, anchorY: number) => {
    const prev = transformRef.current;
    const newScale = clampScale(prev.scale * factor);
    if (newScale === prev.scale) return;
    const ratio = newScale / prev.scale;
    const x = anchorX - (anchorX - prev.x) * ratio;
    const y = anchorY - (anchorY - prev.y) * ratio;
    setBoth({ x, y, scale: newScale });
  }, [setBoth]);

  /** 原生非被动 wheel 监听，以光标为锚点缩放 */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * WHEEL_SENSITIVITY);
      applyZoom(factor, cx, cy);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragMovedRef.current = false;
    if (pointersRef.current.size === 1) {
      const t = transformRef.current;
      panStateRef.current = { x: e.clientX, y: e.clientY, tx: t.x, ty: t.y };
    } else if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const rect = viewportRef.current!.getBoundingClientRect();
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
      const t = transformRef.current;
      pinchStateRef.current = { startScale: t.scale, startX: t.x, startY: t.y, startDist: dist, midX, midY };
      panStateRef.current = null;
    }
    // 监听挂到 window，使拖拽可超出视口且不影响节点点击（不使用 pointer capture 以免吞掉 click）
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1 && panStateRef.current) {
      const dx = e.clientX - panStateRef.current.x;
      const dy = e.clientY - panStateRef.current.y;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) dragMovedRef.current = true;
      setBoth({ x: panStateRef.current.tx + dx, y: panStateRef.current.ty + dy, scale: transformRef.current.scale });
    } else if (pointersRef.current.size === 2 && pinchStateRef.current) {
      const pts = [...pointersRef.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const rect = viewportRef.current!.getBoundingClientRect();
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
      const p = pinchStateRef.current;
      const newScale = clampScale(p.startScale * (dist / p.startDist));
      const x = midX - ((midX - p.startX) / p.startScale) * newScale;
      const y = midY - ((midY - p.startY) / p.startScale) * newScale;
      setBoth({ x, y, scale: newScale });
    }
  }, [setBoth]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 1) {
      const [pt] = [...pointersRef.current.values()];
      const t = transformRef.current;
      panStateRef.current = { x: pt.x, y: pt.y, tx: t.x, ty: t.y };
    } else if (pointersRef.current.size === 0) {
      panStateRef.current = null;
      pinchStateRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    }
  }, [handlePointerMove]);

  const resetView = useCallback(() => {
    setBoth({ x: 0, y: 0, scale: 1 });
  }, [setBoth]);

  const zoomByButton = useCallback((factor: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    applyZoom(factor, rect.width / 2, rect.height / 2);
  }, [applyZoom]);

  /** R 快捷键重置视图；+/-（=）缩放 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'r' || e.key === 'R') {
        resetView();
      } else if (e.key === '+' || e.key === '=') {
        zoomByButton(1.2);
      } else if (e.key === '-' || e.key === '_') {
        zoomByButton(1 / 1.2);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [resetView, zoomByButton]);

  /* ---------------- 节点点击（拖拽时忽略） ---------------- */
  const handleNodeClick = (node: LineageNode) => {
    if (dragMovedRef.current) return;
    setSelectedNode(node);
    setDrawerOpen(true);
    setActiveTab('basic');
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedNode(null), 220);
  };

  const isCenterNode = (node: LineageNode) => record && node.name === record.productName;

  const renderDrawerContent = () => {
    if (!selectedNode || !record) return null;
    const isCenter = isCenterNode(selectedNode);
    return (
      <div className="lineage-drawer-body">
        <div className="drawer-tabs">
          <button className={'drawer-tab ' + (activeTab === 'basic' ? 'active' : '')} onClick={() => setActiveTab('basic')}>基本信息</button>
          <button className={'drawer-tab ' + (activeTab === 'auth' ? 'active' : '')} onClick={() => setActiveTab('auth')}>授权信息</button>
        </div>
        {activeTab === 'basic' ? (
          <div className="drawer-info-grid">
            <div className="drawer-info-label">节点名称</div>
            <div className="drawer-info-value" title={selectedNode.name}>{selectedNode.name}</div>
            <div className="drawer-info-label">节点类型</div>
            <div className="drawer-info-value"><span className="type-tag">{selectedNode.type}</span></div>
            {isCenter && (
              <>
                <div className="drawer-info-label">产品标识码</div>
                <div className="drawer-info-value">{record.productCode}</div>
                <div className="drawer-info-label">产品类型</div>
                <div className="drawer-info-value">{record.productType}</div>
                <div className="drawer-info-label">行业分类</div>
                <div className="drawer-info-value">{record.domain}</div>
                <div className="drawer-info-label">地域分类</div>
                <div className="drawer-info-value">{record.region}</div>
                <div className="drawer-info-label">产品提供方</div>
                <div className="drawer-info-value" title={record.provider}>{record.provider}</div>
                <div className="drawer-info-label">产品简介</div>
                <div className="drawer-info-value drawer-info-desc">{record.productDesc}</div>
              </>
            )}
            {!isCenter && (
              <>
                <div className="drawer-info-label">所属来源</div>
                <div className="drawer-info-value">{record.productName}</div>
                <div className="drawer-info-label">关联产品标识码</div>
                <div className="drawer-info-value">{record.productCode}</div>
              </>
            )}
          </div>
        ) : (
          <div className="drawer-info-grid">
            <div className="drawer-info-label">授权状态</div>
            <div className="drawer-info-value">已授权</div>
            <div className="drawer-info-label">授权对象</div>
            <div className="drawer-info-value">运营机构</div>
            <div className="drawer-info-label">授权时间</div>
            <div className="drawer-info-value">{record.updateTime}</div>
            <div className="drawer-info-label">授权范围</div>
            <div className="drawer-info-value">{record.region}</div>
          </div>
        )}
      </div>
    );
  };

  const renderNotFound = () => (
    <div className="lineage-not-found">
      <div className="empty-state-icon">🔍</div>
      <p className="lineage-not-found-text">
        {code ? '未找到对应的数据产品（标识码：' + code + '）' : '缺少数据产品标识码参数'}
      </p>
      <a className="btn btn-primary" href={LIST_PAGE_URL}>返回产品生命周期</a>
    </div>
  );

  const renderContent = () => (
    <div className="lineage-fullscreen">
      <div className="lineage-topbar">
        <a className="lineage-back" href={LIST_PAGE_URL}>
          <span className="lineage-back-arrow">‹</span>
          返回产品生命周期
        </a>
        <div className="lineage-legend">
          {LINEAGE_LEGEND.map(function (type) {
            const style = LEGEND_STYLE[type];
            return (
              <span key={type} className="lineage-legend-item">
                <i className="lineage-legend-swatch" style={{ background: style.fill, borderColor: style.stroke }} />
                {type}
              </span>
            );
          })}
        </div>
      </div>

      <div className="lineage-canvas-fullscreen">
        {lineage.layers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            暂无血缘关系
          </div>
        ) : (
          <div
            ref={viewportRef}
            className="lineage-viewport"
            onPointerDown={onPointerDown}
            style={{
              transform: 'translate(' + transform.x + 'px, ' + transform.y + 'px) scale(' + transform.scale + ')'
            }}
          >
            <LineageGraph
              layers={lineage.layers}
              edges={lineage.edges}
              onNodeClick={handleNodeClick}
              selectedNodeName={selectedNode?.name}
            />
          </div>
        )}

        <div className="lineage-view-tools">
          <button className="lineage-view-btn" onClick={() => zoomByButton(1.2)} title="放大" aria-label="放大">＋</button>
          <div className="lineage-view-zoom">{Math.round(transform.scale * 100)}%</div>
          <button className="lineage-view-btn" onClick={() => zoomByButton(1 / 1.2)} title="缩小" aria-label="缩小">－</button>
          <button className="lineage-view-btn lineage-view-reset" onClick={resetView} title="重置视图（快捷键 R）" aria-label="重置视图">⟳</button>
        </div>
      </div>

      {drawerOpen && <div className="lineage-drawer-mask" onClick={closeDrawer} />}
      <aside className={'lineage-drawer ' + (drawerOpen ? 'open' : '')}>
        <div className="lineage-drawer-header">
          <h3>{selectedNode ? selectedNode.type : '节点信息'}</h3>
          <button className="lineage-drawer-close" onClick={closeDrawer} aria-label="关闭">×</button>
        </div>
        {renderDrawerContent()}
      </aside>
    </div>
  );

  return (
    <Layout
      activeMenu="product-lifecycle"
      breadcrumb="产品生命周期"
      role="运营机构"
      onRoleChange={() => {}}
      roleOptions={['运营机构']}
    >
      <div className="lineage-page">
        {record ? renderContent() : renderNotFound()}
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

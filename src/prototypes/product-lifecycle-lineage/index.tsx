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
  NODE_STYLE as LEGEND_STYLE,
  NODE_W,
  NODE_H,
  computeNodePositions,
  AuthRecord,
  TradeRecord,
  buildAuthList,
  buildTradeList
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

/* 缩略图（概览）参数 */
const MINI_W = 200;
const MINI_H = 140;
const MINI_MIN_BOX = 12; // 视口框最小尺寸（px），防止放大时缩成看不见
const MINI_THROTTLE = 100; // 缩略图视口框同步更新节流（ms）

type TabKey = 'basic' | 'auth' | 'trade';

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
  const [listPage, setListPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  /** 依据节点类型确定抽屉页签：数据资源 + 基本信息/授权信息；基础产品 + 基本信息/授权信息；再开发产品 + 基本信息/交易信息 */
  const getTabs = useCallback((type: string): TabKey[] => {
    if (type === '数据资源') return ['basic', 'auth'];
    if (type === '基础产品') return ['basic', 'auth'];
    if (type === '再开发产品') return ['basic', 'trade'];
    return ['basic'];
  }, []);

  /** 切换页签 / 节点时，列表分页回到第一页 */
  useEffect(() => { setListPage(1); }, [selectedNode, activeTab]);

  /** 由节点名派生可复现的授权信息 / 交易信息演示数据（各节点互不相同） */
  const authList = useMemo<AuthRecord[]>(() => (selectedNode ? buildAuthList(selectedNode.name) : []), [selectedNode]);
  const tradeList = useMemo<TradeRecord[]>(() => (selectedNode ? buildTradeList(selectedNode.name) : []), [selectedNode]);

  /* ---------------- 节点筛选（按资源名称 / 产品名称） ---------------- */
  const [filterText, setFilterText] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBoxRef = useRef<HTMLDivElement>(null);

  /** 图谱全部节点（数据资源 + 基础产品 + 再开发产品），作为筛选候选 */
  const allNodes = useMemo(() => lineage.layers.flatMap((l) => l.nodes), [lineage]);

  /** 命中的节点名称：按关键字对节点名称模糊匹配（资源名称与产品名称统一匹配） */
  const matchedNames = useMemo(() => {
    const kw = filterText.trim().toLowerCase();
    if (!kw) return [];
    return allNodes.filter((n) => n.name.toLowerCase().includes(kw)).map((n) => n.name);
  }, [filterText, allNodes]);

  /** 下拉候选：按关键字过滤后的节点列表 */
  const filterOptions = useMemo(() => {
    const kw = filterText.trim().toLowerCase();
    if (!kw) return allNodes;
    return allNodes.filter((n) => n.name.toLowerCase().includes(kw));
  }, [filterText, allNodes]);

  /** 点击筛选框外部时收起下拉候选 */
  useEffect(() => {
    if (!filterOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (filterBoxRef.current && !filterBoxRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [filterOpen]);

  /* ---------------- 画布平移 / 缩放状态 ---------------- */
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef<Transform>(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  /** 画布内容区尺寸（未缩放的布局尺寸），供坐标换算 / 钳制 / 缩略图使用 */
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 960, height: 540 });
  const canvasSizeRef = useRef(canvasSize);
  useEffect(() => { canvasSizeRef.current = canvasSize; }, [canvasSize]);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setCanvasSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const setBoth = useCallback((t: Transform) => {
    transformRef.current = t;
    setTransform(t);
  }, []);

  /**
   * 按 G6 / X6 标准钳制画布平移范围：内容始终覆盖可视区域，不允许把整图拖到视口外。
   * 缩放比例 < 1（内容小于视口）时整体居中，不允许平移。
   */
  const clampTransform = useCallback((t: Transform): Transform => {
    const { width, height } = canvasSizeRef.current;
    if (width <= 0 || height <= 0) return t;
    const s = t.scale;
    if (s < 1) return { ...t, x: (width * (1 - s)) / 2, y: (height * (1 - s)) / 2 };
    return {
      ...t,
      x: Math.min(0, Math.max(width * (1 - s), t.x)),
      y: Math.min(0, Math.max(height * (1 - s), t.y))
    };
  }, []);

  /** 钳制后的平移 / 缩放写入，用户交互一律走此函数 */
  const setBothClamped = useCallback((t: Transform) => setBoth(clampTransform(t)), [setBoth, clampTransform]);

  /* ---------------- 缩略图（概览）状态 ---------------- */
  const [miniOpen, setMiniOpen] = useState(true);
  /** 缩略图视口框使用节流后的变换，避免高频重绘（100ms） */
  const [miniTransform, setMiniTransform] = useState<Transform>(transform);
  const miniThrottleRef = useRef(0);
  const miniTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const miniSvgRef = useRef<SVGSVGElement>(null);
  const miniDragRef = useRef(false);

  useEffect(() => {
    const elapsed = performance.now() - miniThrottleRef.current;
    if (elapsed >= MINI_THROTTLE) {
      miniThrottleRef.current = performance.now();
      setMiniTransform(transform);
    } else {
      if (miniTimerRef.current) clearTimeout(miniTimerRef.current);
      miniTimerRef.current = setTimeout(() => {
        miniThrottleRef.current = performance.now();
        setMiniTransform(transform);
      }, MINI_THROTTLE - elapsed);
    }
    return () => { if (miniTimerRef.current) clearTimeout(miniTimerRef.current); };
  }, [transform]);

  /** 缩略图坐标换算：内容坐标 -> 缩略图像素，并居中适配 200x140 容器 */
  const miniMetrics = useCallback(() => {
    const { width, height } = canvasSizeRef.current;
    const scale = Math.min(MINI_W / Math.max(width, 1), MINI_H / Math.max(height, 1));
    const ox = (MINI_W - width * scale) / 2;
    const oy = (MINI_H - height * scale) / 2;
    return { scale, ox, oy, width, height };
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
    setBothClamped({ x, y, scale: newScale });
  }, [setBothClamped]);

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
      setBothClamped({ x: panStateRef.current.tx + dx, y: panStateRef.current.ty + dy, scale: transformRef.current.scale });
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
      setBothClamped({ x, y, scale: newScale });
    }
  }, [setBothClamped]);

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

  /* ---------------- 缩略图（概览）交互：拖动视口框 / 点击空白平移主画布 ---------------- */

  /** 将主画布平移到使指定内容坐标位于当前视口中心（受边界钳制约束） */
  const panToContentCenter = useCallback((cx: number, cy: number) => {
    const { width, height } = canvasSizeRef.current;
    const s = transformRef.current.scale;
    setBothClamped({ x: width / 2 - s * cx, y: height / 2 - s * cy, scale: s });
  }, [setBothClamped]);

  /** 缩略图指针事件：点击空白或拖动视口框均将对应内容点设为视口中心 */
  const panToMiniPoint = useCallback((clientX: number, clientY: number) => {
    const svg = miniSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const { scale, ox, oy } = miniMetrics();
    panToContentCenter((px - ox) / scale, (py - oy) / scale);
  }, [miniMetrics, panToContentCenter]);

  const onMiniPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    miniDragRef.current = true;
    panToMiniPoint(e.clientX, e.clientY);
    window.addEventListener('pointermove', onMiniPointerMoveWin);
    window.addEventListener('pointerup', onMiniPointerUpWin);
    window.addEventListener('pointercancel', onMiniPointerUpWin);
  };

  const onMiniPointerMoveWin = useCallback((e: PointerEvent) => {
    if (!miniDragRef.current) return;
    panToMiniPoint(e.clientX, e.clientY);
  }, [panToMiniPoint]);

  const onMiniPointerUpWin = useCallback(() => {
    miniDragRef.current = false;
    window.removeEventListener('pointermove', onMiniPointerMoveWin);
    window.removeEventListener('pointerup', onMiniPointerUpWin);
    window.removeEventListener('pointercancel', onMiniPointerUpWin);
  }, [onMiniPointerMoveWin]);

  /** 将指定节点平移到视口中心（供搜索定位使用） */
  const centerOnNode = useCallback((nodeName: string) => {
    const { width, height } = canvasSizeRef.current;
    if (width <= 0 || height <= 0) return;
    const pos = computeNodePositions(lineage.layers, width, height)[nodeName];
    if (!pos) return;
    panToContentCenter(pos.x, pos.y);
  }, [lineage, panToContentCenter]);

  /** 搜索定位：当筛选条件命中唯一节点时，自动将其平移到视口中心（缩略图视口框随之同步） */
  const prevMatchCountRef = useRef(0);
  useEffect(() => {
    const count = matchedNames.length;
    if (count === 1 && prevMatchCountRef.current !== 1) centerOnNode(matchedNames[0]);
    prevMatchCountRef.current = count;
  }, [matchedNames, centerOnNode]);

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

  /** 抽屉内可翻页列表（授权信息 / 交易信息通用） */
  const DrawerList = <T extends { seq: number }>(props: {
    rows: T[];
    columns: { key: Extract<keyof T, string>; title: string; cls?: string }[];
    page: number;
    pageSize: number;
    onPageChange: (p: number) => void;
    onPageSizeChange: (n: number) => void;
  }) => {
    const total = props.rows.length;
    const totalPages = Math.max(1, Math.ceil(total / props.pageSize));
    const safePage = Math.min(props.page, totalPages);
    const start = (safePage - 1) * props.pageSize;
    const pageRows = props.rows.slice(start, start + props.pageSize);
    return (
      <div className="drawer-list">
        <table className="drawer-table">
          <thead>
            <tr>
              <th className="col-seq">序号</th>
              {props.columns.map((c) => <th key={c.key} className={c.cls}>{c.title}</th>)}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td className="drawer-table-empty" colSpan={props.columns.length + 1}>暂无数据</td></tr>
            ) : pageRows.map((r, i) => (
              <tr key={r.seq}>
                <td className="col-seq">{start + i + 1}</td>
                {props.columns.map((c) => <td key={c.key} className={c.cls} title={String(r[c.key])}>{String(r[c.key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="drawer-list-pagination">
          <span className="pagination-info">共 {total} 条记录</span>
          <div className="pagination-controls">
            <button className="page-btn" disabled={safePage <= 1} onClick={() => props.onPageChange(Math.max(1, safePage - 1))}>上一页</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: '#999' }}>...</span>}
                  <button className={'page-number' + (p === safePage ? ' active' : '')} onClick={() => props.onPageChange(p)}>{p}</button>
                </span>
              ))}
            <button className="page-btn" disabled={safePage >= totalPages} onClick={() => props.onPageChange(Math.min(totalPages, safePage + 1))}>下一页</button>
            <select className="page-size-select" value={props.pageSize} onChange={(e) => props.onPageSizeChange(Number(e.target.value))}>
              <option value={5}>5 条/页</option>
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  /** 基本信息页签：依据节点类型展示不同字段集 */
  const renderBasicInfo = () => {
    if (!selectedNode || !record) return null;
    const isCenter = isCenterNode(selectedNode);
    const detail = selectedNode.detail;
    const isResource = selectedNode.type === '数据资源' && !!detail;
    const productDetail = selectedNode.productDetail;
    if (isResource) {
      return (
        <div className="drawer-info-grid">
          <div className="drawer-info-label">资源名称</div>
          <div className="drawer-info-value" title={detail!.resourceName}>{detail!.resourceName}</div>
          <div className="drawer-info-label">数据资源标识码</div>
          <div className="drawer-info-value">{detail!.resourceCode}</div>
          <div className="drawer-info-label">行业分类</div>
          <div className="drawer-info-value">{detail!.industry}</div>
          <div className="drawer-info-label">是否涉及个人信息</div>
          <div className="drawer-info-value">{detail!.involvesPersonal}</div>
          <div className="drawer-info-label">资源格式</div>
          <div className="drawer-info-value">{detail!.format}</div>
          <div className="drawer-info-label">数据来源</div>
          <div className="drawer-info-value">{detail!.source}</div>
          <div className="drawer-info-label">更新频率</div>
          <div className="drawer-info-value">{detail!.updateFreq}</div>
          <div className="drawer-info-label">覆盖时间范围</div>
          <div className="drawer-info-value">{detail!.coverage}</div>
          <div className="drawer-info-label">地域分类</div>
          <div className="drawer-info-value">{detail!.region}</div>
          <div className="drawer-info-label">资源持有方</div>
          <div className="drawer-info-value" title={detail!.holder}>{detail!.holder}</div>
          <div className="drawer-info-label">资源摘要</div>
          <div className="drawer-info-value drawer-info-desc">{detail!.summary}</div>
        </div>
      );
    }
    if (productDetail) {
      return (
        <div className="drawer-info-grid">
          <div className="drawer-info-label">产品名称</div>
          <div className="drawer-info-value" title={productDetail.productName}>{productDetail.productName}</div>
          <div className="drawer-info-label">数据产品标识码</div>
          <div className="drawer-info-value">{productDetail.productCode}</div>
          <div className="drawer-info-label">产品类型</div>
          <div className="drawer-info-value"><span className="type-tag">{productDetail.productType}</span></div>
          <div className="drawer-info-label">覆盖时间范围</div>
          <div className="drawer-info-value">{productDetail.coverage}</div>
          <div className="drawer-info-label">行业分类</div>
          <div className="drawer-info-value">{productDetail.industry}</div>
          <div className="drawer-info-label">地域分类</div>
          <div className="drawer-info-value">{productDetail.region}</div>
          <div className="drawer-info-label">是否涉及个人信息</div>
          <div className="drawer-info-value">{productDetail.involvesPersonal}</div>
          <div className="drawer-info-label">交付方式</div>
          <div className="drawer-info-value">{productDetail.deliveryMethod}</div>
          <div className="drawer-info-label">授权使用</div>
          <div className="drawer-info-value">{productDetail.authorizedUse}</div>
          <div className="drawer-info-label">数据主体</div>
          <div className="drawer-info-value">{productDetail.dataSubject}</div>
          <div className="drawer-info-label">数据规模</div>
          <div className="drawer-info-value">{productDetail.dataScale}</div>
          <div className="drawer-info-label">更新频率</div>
          <div className="drawer-info-value">{productDetail.updateFreq}</div>
          <div className="drawer-info-label">个人或企业授权使用</div>
          <div className="drawer-info-value">{productDetail.personalOrEnterpriseAuth}</div>
          <div className="drawer-info-label">产品简介</div>
          <div className="drawer-info-value drawer-info-desc">{productDetail.productDesc}</div>
          <div className="drawer-info-label">使用限制</div>
          <div className="drawer-info-value drawer-info-desc">{productDetail.usageLimit}</div>
          <div className="drawer-info-label">提供方名称</div>
          <div className="drawer-info-value" title={productDetail.providerName}>{productDetail.providerName}</div>
        </div>
      );
    }
    return (
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
    );
  };

  /** 数据资源节点「授权信息」页签：展示固定六字段 */
  const renderResourceAuthInfo = () => (
    <div className="drawer-info-grid">
      <div className="drawer-info-label">资源授权单名称</div>
      <div className="drawer-info-value">省本级卫生健康第8批资源授权</div>
      <div className="drawer-info-label">实施机构</div>
      <div className="drawer-info-value">湖南省卫生健康委信息统计中心</div>
      <div className="drawer-info-label">运营机构</div>
      <div className="drawer-info-value">湖南数据产业集团</div>
      <div className="drawer-info-label">授权发起方</div>
      <div className="drawer-info-value">运营机构</div>
      <div className="drawer-info-label">授权时间</div>
      <div className="drawer-info-value">2026-06-15 14:20:00</div>
      <div className="drawer-info-label">授权期限</div>
      <div className="drawer-info-value">2026-06-04 至 2031-06-04</div>
    </div>
  );

  const TAB_LABEL: Record<TabKey, string> = { basic: '基本信息', auth: '授权信息', trade: '交易信息' };

  const renderDrawerContent = () => {
    if (!selectedNode || !record) return null;
    const tabs = getTabs(selectedNode.type);
    return (
      <div className="lineage-drawer-body">
        <div className="drawer-tabs">
          {tabs.map((t) => (
            <button key={t} className={'drawer-tab ' + (activeTab === t ? 'active' : '')} onClick={() => setActiveTab(t)}>{TAB_LABEL[t]}</button>
          ))}
        </div>
        {activeTab === 'basic' ? (
          renderBasicInfo()
        ) : activeTab === 'auth' ? (
          selectedNode.type === '数据资源' ? (
            renderResourceAuthInfo()
          ) : (
            <DrawerList
              rows={authList}
              columns={[{ key: 'org', title: '运营机构', cls: 'col-org' }, { key: 'authTime', title: '授权时间', cls: 'col-time' }]}
              page={listPage}
              pageSize={pageSize}
              onPageChange={setListPage}
              onPageSizeChange={(n) => { setPageSize(n); setListPage(1); }}
            />
          )
        ) : (
          <DrawerList
            rows={tradeList}
            columns={[{ key: 'demander', title: '数据需求方', cls: 'col-demander' }, { key: 'createdAt', title: '创建时间', cls: 'col-time' }]}
            page={listPage}
            pageSize={pageSize}
            onPageChange={setListPage}
            onPageSizeChange={(n) => { setPageSize(n); setListPage(1); }}
          />
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

      <div className="lineage-canvas-fullscreen" ref={canvasRef}>
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
              highlightNames={matchedNames}
            />
          </div>
        )}

        {/* 左上角可搜索筛选框：固定定位、不随画布平移缩放，层级高于图谱 */}
        <div className="lineage-filter" ref={filterBoxRef}>
          <div className="lineage-filter-box">
            <svg className="lineage-filter-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input
              className="lineage-filter-input"
              value={filterText}
              placeholder="搜索资源名称 / 产品名称"
              onChange={(e) => { setFilterText(e.target.value); setFilterOpen(true); }}
              onFocus={() => setFilterOpen(true)}
            />
            {filterText && (
              <button
                className="lineage-filter-clear"
                title="清空筛选"
                aria-label="清空筛选"
                onClick={() => { setFilterText(''); setFilterOpen(false); }}
              >×</button>
            )}
          </div>
          {filterText.trim() !== '' && (
            <span className={'lineage-filter-count' + (matchedNames.length === 0 ? ' zero' : '')}>
              {matchedNames.length > 0 ? '匹配 ' + matchedNames.length + ' 个节点' : '无匹配节点'}
            </span>
          )}
          {filterOpen && (
            <ul className="lineage-filter-dropdown">
              {filterOptions.length === 0 ? (
                <li className="lineage-filter-empty">无匹配结果</li>
              ) : (
                filterOptions.map((n) => {
                  const style = LEGEND_STYLE[n.type] || LEGEND_STYLE['基础产品'];
                  return (
                    <li
                      key={n.name}
                      className={'lineage-filter-option' + (n.name === filterText ? ' active' : '')}
                      onMouseDown={(e) => { e.preventDefault(); setFilterText(n.name); centerOnNode(n.name); }}
                      onClick={() => setFilterOpen(false)}
                    >
                      <i className="lineage-filter-option-swatch" style={{ background: style.fill, borderColor: style.stroke }} />
                      <span className="lineage-filter-option-name" title={n.name}>{n.name}</span>
                      <span className="lineage-filter-option-type">{n.type}</span>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        <div className="lineage-view-tools">
          <button className="lineage-view-btn" onClick={() => zoomByButton(1.2)} title="放大" aria-label="放大">＋</button>
          <div className="lineage-view-zoom">{Math.round(transform.scale * 100)}%</div>
          <button className="lineage-view-btn" onClick={() => zoomByButton(1 / 1.2)} title="缩小" aria-label="缩小">－</button>
          <button className="lineage-view-btn lineage-view-reset" onClick={resetView} title="重置视图（快捷键 R）" aria-label="重置视图">⟳</button>
        </div>

        {/* 缩略图（概览）：右下角，位于缩放工具栏上方；固定定位、不随画布变换 */}
        {miniOpen && lineage.layers.length > 0 && (() => {
          const mScale = Math.min(MINI_W / Math.max(canvasSize.width, 1), MINI_H / Math.max(canvasSize.height, 1));
          const mOx = (MINI_W - canvasSize.width * mScale) / 2;
          const mOy = (MINI_H - canvasSize.height * mScale) / 2;
          const miniNodes = lineage.layers.flatMap((l) => l.nodes);
          const miniPos = computeNodePositions(lineage.layers, canvasSize.width, canvasSize.height);
          const s = miniTransform.scale;
          const vw = canvasSize.width / s;
          const vh = canvasSize.height / s;
          const vx = -miniTransform.x / s;
          const vy = -miniTransform.y / s;
          let bx: number;
          let by: number;
          let bw: number;
          let bh: number;
          if (s < 1) {
            // 内容整体小于视口：全部可见，视口框填满图形区域（此时拖动无效果）
            bw = canvasSize.width * mScale;
            bh = canvasSize.height * mScale;
            bx = mOx;
            by = mOy;
          } else {
            bw = Math.max(vw * mScale, MINI_MIN_BOX);
            bh = Math.max(vh * mScale, MINI_MIN_BOX);
            bx = Math.max(0, Math.min(MINI_W - bw, mOx + vx * mScale));
            by = Math.max(0, Math.min(MINI_H - bh, mOy + vy * mScale));
          }
          return (
            <div className="lineage-minimap" style={{ width: MINI_W, height: MINI_H }}>
              <button
                className="lineage-minimap-collapse"
                title="收起概览"
                aria-label="收起概览"
                onClick={() => setMiniOpen(false)}
              >−</button>
              <svg
                ref={miniSvgRef}
                className="lineage-minimap-svg"
                width={MINI_W}
                height={MINI_H}
                onPointerDown={onMiniPointerDown}
                onWheel={(e) => { e.stopPropagation(); e.preventDefault(); }}
              >
                <rect
                  className="lineage-minimap-canvas-bg"
                  x={mOx}
                  y={mOy}
                  width={canvasSize.width * mScale}
                  height={canvasSize.height * mScale}
                />
                {lineage.edges.map((e, idx) => {
                  const p1 = miniPos[e.from];
                  const p2 = miniPos[e.to];
                  if (!p1 || !p2) return null;
                  return (
                    <line
                      key={'me-' + idx}
                      className="lineage-minimap-edge"
                      x1={mOx + p1.x * mScale}
                      y1={mOy + p1.y * mScale}
                      x2={mOx + p2.x * mScale}
                      y2={mOy + p2.y * mScale}
                    />
                  );
                })}
                {miniNodes.map((n) => {
                  const p = miniPos[n.name];
                  if (!p) return null;
                  const style = LEGEND_STYLE[n.type] || LEGEND_STYLE['基础产品'];
                  return (
                    <rect
                      key={'mn-' + n.name}
                      className="lineage-minimap-node"
                      x={mOx + (p.x - NODE_W / 2) * mScale}
                      y={mOy + (p.y - NODE_H / 2) * mScale}
                      width={NODE_W * mScale}
                      height={NODE_H * mScale}
                      fill={style.fill}
                      stroke={style.stroke}
                    />
                  );
                })}
                <rect
                  className="lineage-minimap-viewport"
                  x={bx}
                  y={by}
                  width={bw}
                  height={bh}
                />
              </svg>
            </div>
          );
        })()}

        {/* 缩略图收起后，右下角（缩放工具栏上方）浮现「显示概览」按钮 */}
        {!miniOpen && (
          <button className="lineage-minimap-restore" onClick={() => setMiniOpen(true)}>显示概览</button>
        )}
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

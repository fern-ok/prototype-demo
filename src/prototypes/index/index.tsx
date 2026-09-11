/**
 * @name 项目首页（原型目录）
 * @mode axure
 *
 * 公共数据资源授权运营管理平台 - 原型预览首页
 * 展示原型版本列表，支持展开/收起各版本的变更记录
 * 顶部提供"版本变更记录"与"业务流程图"两个 TAB 切换
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, Crosshair, ExternalLink, Image as ImageIcon, LayoutDashboard, LayoutGrid, List, Loader2, Maximize2, Monitor, RotateCcw, Search, Shield, X, ZoomIn, ZoomOut } from 'lucide-react';
import v20260824 from './versions/20260824.md?raw';
import v20260904 from './versions/20260904.md?raw';
import v20260924 from './versions/20260924.md?raw';
import v20261023 from './versions/20261023.md?raw';
import changeFlowImg from './images/变更撤销.svg';
import shengImg from './images/省本级备案.png';
import dishiImg from './images/地市区县备案.png';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

const versions = [
  {
    version: '20260924',
    title: '20260924版本',
    content: v20260924,
  },
  {
    version: '20261023',
    title: '20261023版本',
    content: v20261023,
  },
  {
    version: '20260824',
    title: '20260824版本',
    content: v20260824,
  },
  {
    version: '20260904',
    title: '20260904版本',
    content: v20260904,
  },

];

/* ============================================================
 * 业务流程图配置
 * 后续新增 / 删除流程，只需在 flowCategories 中增删条目即可，
 * 模块筛选、搜索、计数均从该数据自动派生。
 * ========================================================== */
type FlowItem = {
  key: string;            // 唯一标识（同时作为锚点 key）
  name: string;           // 流程名称
  summary: string;        // 一句话说明
  src: string;            // 流程图素材（完整分辨率原图，用于放大查看）
  thumb?: string;         // 低分辨率占位图（加载原图期间显示，可选）
  placeholder?: boolean;  // 是否为占位素材
};

type FlowCategory = {
  key: string;
  title: string;
  description: string;
  flows: FlowItem[];
};

const flowCategories: FlowCategory[] = [
  {
    key: 'data-resource-change',
    title: '数据资源变更和撤销流程',
    description: '数据资源从变更申请到最终生效的完整链路与责任节点。',
    flows: [
      {
        key: 'dr-change-overview',
        name: '数据资源变更和撤销流程',
        summary: '提交变更 → 区域节点审核 → 变更生效。',
        src: changeFlowImg,
      },
    ],
  },
  {
    key: 'revoke',
    title: '备案流程',
    description: '',
    flows: [
      {
        key: 'revoke-overview',
        name: '省本级备案流程',
        summary: '',
        src: shengImg,
      },
      {
        key: 'revoke-auth',
        name: '地市区县备案流程',
        summary: '',
        src: dishiImg,
        placeholder: false,
      },
    ],
  },
];

/* 关键字命中高亮 */
const HighlightText = ({ text, keyword }: { text: string; keyword: string }) => {
  const kw = keyword.trim();
  if (!kw) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerKw = kw.toLowerCase();
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let hit = lowerText.indexOf(lowerKw);
  while (hit !== -1) {
    if (hit > cursor) nodes.push(<span key={`t${hit}`}>{text.slice(cursor, hit)}</span>);
    nodes.push(<mark className="flow-hl" key={`m${hit}`}>{text.slice(hit, hit + kw.length)}</mark>);
    cursor = hit + kw.length;
    hit = lowerText.indexOf(lowerKw, cursor);
  }
  if (cursor < text.length) nodes.push(<span key={`t${cursor}`}>{text.slice(cursor)}</span>);
  return <>{nodes}</>;
};

/* 判断流程是否命中关键字 */
const matchKeyword = (flow: FlowItem, kw: string) => {
  const key = kw.trim().toLowerCase();
  if (!key) return true;
  return (
    flow.name.toLowerCase().includes(key) ||
    flow.summary.toLowerCase().includes(key)
  );
};

type FlowTabProps = {
  onPreview: (item: FlowItem) => void;
};

const FlowTab = ({ onPreview }: FlowTabProps) => {
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [expandedFlows, setExpandedFlows] = useState<Set<string>>(new Set());
  const [locatingKey, setLocatingKey] = useState<string | null>(null);
  const [locateNonce, setLocateNonce] = useState(0);
  const locatingTimer = useRef<number | undefined>(undefined);

  // 模拟加载过程，便于查看 loading 占位
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => () => window.clearTimeout(locatingTimer.current), []);

  const allFlows = useMemo(() => flowCategories.flatMap(c => c.flows), []);

  // 实时过滤：关键字 + 模块
  const filteredCategories = useMemo(() => {
    const kw = keyword.trim();
    return flowCategories
      .map(category => ({
        ...category,
        flows: category.flows.filter(
          f => matchKeyword(f, kw),
        ),
      }))
      .filter(category => category.flows.length > 0);
  }, [keyword]);

  const matchedCount = useMemo(
    () => filteredCategories.reduce((sum, c) => sum + c.flows.length, 0),
    [filteredCategories],
  );

  const toggleFlow = useCallback((key: string) => {
    setExpandedFlows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // 全部展开 / 全部收起（仅作用于当前筛选结果，不影响其他条目的既有状态）
  const expandAll = useCallback(() => {
    setExpandedFlows(prev => {
      const next = new Set(prev);
      filteredCategories.forEach(c => c.flows.forEach(f => next.add(f.key)));
      return next;
    });
  }, [filteredCategories]);

  const collapseAll = useCallback(() => {
    setExpandedFlows(prev => {
      const next = new Set(prev);
      filteredCategories.forEach(c => c.flows.forEach(f => next.delete(f.key)));
      return next;
    });
  }, [filteredCategories]);

  // 锚点定位：切到列表视图 → 清除筛选 → 展开目标
  const locateFlow = useCallback((flow: FlowItem) => {
    setViewMode('list');
    setKeyword('');
    setModuleFilter('all');
    setExpandedFlows(prev => new Set(prev).add(flow.key));
    setLocatingKey(flow.key);
    setLocateNonce(n => n + 1);

    window.clearTimeout(locatingTimer.current);
    locatingTimer.current = window.setTimeout(() => setLocatingKey(null), 2200);
  }, []);

  // 等列表渲染完成后再滚动到目标流程，避免 DOM 未就绪导致定位失效
  useEffect(() => {
    if (!locatingKey || viewMode !== 'list') return;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-flow-key="${locatingKey}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });
    return () => cancelAnimationFrame(raf);
  }, [locatingKey, locateNonce, viewMode]);

  const resetFilter = useCallback(() => {
    setKeyword('');
    setModuleFilter('all');
  }, []);

  if (loading) {
    return (
      <div className="flow-tab">
        <div className="flow-loading">
          <Loader2 className="flow-loading-spin" size={28} />
          <span>正在加载业务流程图…</span>
        </div>
      </div>
    );
  }

  if (flowCategories.length === 0) {
    return (
      <div className="flow-tab">
        <div className="flow-empty">
          <ImageIcon size={40} />
          <h4>暂无业务流程图</h4>
          <p>当前还未配置任何业务流程图，后续可在配置中扩展。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-tab">
      {/* 工具栏：搜索 + 模块筛选 + 视图切换 + 全部展开收起 */}
      <div className="flow-toolbar">
        <div className="flow-search">
          <Search size={16} />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索流程名称"
            aria-label="搜索流程图"
          />
          {keyword && (
            <button type="button" className="flow-search-clear" onClick={() => setKeyword('')} aria-label="清空搜索">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flow-toolbar-right">
          <span className="flow-result-count">
            匹配 <strong>{matchedCount}</strong> / {allFlows.length}
          </span>
          <div className="flow-view-switch" role="group" aria-label="视图切换">
            <button
              type="button"
              className={'flow-view-btn' + (viewMode === 'list' ? ' active' : '')}
              onClick={() => setViewMode('list')}
              title="列表视图"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className={'flow-view-btn' + (viewMode === 'grid' ? ' active' : '')}
              onClick={() => setViewMode('grid')}
              title="缩略图视图"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
          <button type="button" className="header-btn" onClick={expandAll}>全部展开</button>
          <button type="button" className="header-btn" onClick={collapseAll}>全部收起</button>
        </div>
      </div>

      {matchedCount === 0 ? (
        <div className="flow-empty">
          <Search size={36} />
          <h4>未找到匹配的流程图</h4>
          <p>试试调整关键字或切换业务模块筛选条件。</p>
          <button type="button" className="flow-reset-btn" onClick={resetFilter}>清除筛选条件</button>
        </div>
      ) : viewMode === 'list' ? (
        /* 列表视图：默认收起的紧凑卡片 */
        <div className="flow-list">
          {filteredCategories.map(category => (
            <section key={category.key} className="flow-category">
              <header className="flow-category-header">
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </header>
              <div className="flow-items">
                {category.flows.map(flow => {
                  const isExpanded = expandedFlows.has(flow.key);
                  return (
                    <div
                      key={flow.key}
                      data-flow-key={flow.key}
                      className={
                        'flow-item' +
                        (isExpanded ? ' expanded' : '') +
                        (locatingKey === flow.key ? ' locating' : '')
                      }
                    >
                      <button
                        type="button"
                        className="flow-item-head"
                        onClick={() => toggleFlow(flow.key)}
                        aria-expanded={isExpanded}
                      >
                        <span className="flow-name">
                          <HighlightText text={flow.name} keyword={keyword} />
                          {flow.placeholder && <em className="flow-tag-placeholder">占位</em>}
                        </span>
                        <span className="flow-summary">
                          <HighlightText text={flow.summary} keyword={keyword} />
                        </span>
                        <span className="flow-toggle">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="flow-item-body">
                          <div
                            className="flow-figure"
                            role="button"
                            tabIndex={0}
                            onClick={() => onPreview(flow)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(flow); } }}
                          >
                            <img src={flow.src} alt={flow.name} loading="lazy" />
                            <span className="flow-figure-hint">
                              <Maximize2 size={14} /> 点击查看大图
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* 缩略图视图：网格化预览 */
        <div className="flow-list">
          {filteredCategories.map(category => (
            <section key={category.key} className="flow-category">
              <header className="flow-category-header">
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </header>
              <div className="flow-grid">
                {category.flows.map(flow => (
                  <div key={flow.key} className="flow-thumb-card" data-flow-key={`thumb-${flow.key}`}>
                    <div
                      className="flow-thumb"
                      role="button"
                      tabIndex={0}
                      onClick={() => onPreview(flow)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview(flow); } }}
                    >
                      <img src={flow.src} alt={flow.name} loading="lazy" />
                      <span className="flow-thumb-mask"><Maximize2 size={14} /> 放大查看</span>
                    </div>
                    <div className="flow-thumb-meta">
                      <div className="flow-thumb-title">
                        <strong><HighlightText text={flow.name} keyword={keyword} /></strong>
                        {flow.placeholder && <em className="flow-tag-placeholder">占位</em>}
                      </div>
                      <p className="flow-thumb-summary">
                        <HighlightText text={flow.summary} keyword={keyword} />
                      </p>
                      <button type="button" className="flow-locate-btn" onClick={() => locateFlow(flow)}>
                        <Crosshair size={14} /> 定位到完整流程
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

/* 流程图大图预览弹层 */
type FlowPreviewProps = {
  item: FlowItem | null;
  onClose: () => void;
};

/* ============================================================
 * 流程图查看器：局部放大 / 平移 / 框选 / 放大镜
 * - 以光标（或双指中点）为中心缩放，放大后可拖拽平移
 * - 框选放大：拖拽矩形选区，将该区域填充至视口
 * - Loupe：悬停时以更高倍率实时显示局部
 * - 加载高清原图，缩略图作为占位；支持失败重试
 * - 键盘：+/- 缩放、方向键平移、Esc 关闭；移动端双指手势
 * ========================================================== */
const MIN_SCALE = 0.1;
const MAX_SCALE = 30;
const LOUPE_SIZE = 180;
const LOUPE_FACTOR = 2.5;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const FlowViewer = ({ item }: { item: FlowItem }) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchRef = useRef<{ dist: number } | null>(null);
  const boxStartRef = useRef<{ x: number; y: number } | null>(null);
  const fitModeRef = useRef(true);
  // 用 ref 保存最新视图状态，避免原生事件闭包读到旧值
  const viewRef = useRef({ scale: 1, tx: 0, ty: 0 });

  const [nw, setNw] = useState(0);
  const [nh, setNh] = useState(0);
  const [scale, setScaleState] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [mode, setMode] = useState<'pan' | 'box'>('pan');
  const [loupe, setLoupe] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: -9999, y: -9999 });
  const [box, setBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);

  const getRect = () => viewportRef.current?.getBoundingClientRect() ?? new DOMRect();

  const applyView = (s: number, nx: number, ny: number, autoFit: boolean) => {
    const cs = clamp(s, MIN_SCALE, MAX_SCALE);
    viewRef.current = { scale: cs, tx: nx, ty: ny };
    setScaleState(cs);
    setTx(nx);
    setTy(ny);
    fitModeRef.current = autoFit;
  };

  const fitView = useCallback(() => {
    const r = getRect();
    if (!nw || !nh || r.width === 0) return;
    const s = Math.min(r.width / nw, r.height / nh);
    applyView(s, (r.width - nw * s) / 2, (r.height - nh * s) / 2, true);
  }, [nw, nh]);

  const oneToOne = useCallback(() => {
    const r = getRect();
    if (!nw || !nh) return;
    applyView(1, (r.width - nw) / 2, (r.height - nh) / 2, false);
  }, [nw, nh]);

  // 图片加载完成后按当前视口适配
  useEffect(() => { fitView(); }, [fitView, retry]);

  // 窗口尺寸变化时若处于"适应"模式则重新适配
  useEffect(() => {
    const onResize = () => { if (fitModeRef.current) fitView(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fitView]);

  // 以 (cx,cy) 屏幕点为中心缩放
  const zoomAt = (next: number, cx: number, cy: number) => {
    const v = viewRef.current;
    const s = clamp(next, MIN_SCALE, MAX_SCALE);
    const ratio = s / (v.scale || s);
    applyView(s, cx - (cx - v.tx) * ratio, cy - (cy - v.ty) * ratio, false);
  };

  const zoomCenter = (factor: number) => {
    const r = getRect();
    zoomAt(viewRef.current.scale * factor, r.width / 2, r.height / 2);
  };

  // 原生非被动 wheel 监听，确保能 preventDefault
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (viewRef.current.scale <= 0) return;
      if (status !== 'ready') return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(viewRef.current.scale * factor, cx, cy);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [status]);

  // 键盘：+/- 缩放、方向键平移（Esc 由外层处理）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (status !== 'ready') return;
      const step = 48;
      const v = viewRef.current;
      switch (e.key) {
        case '+': case '=': e.preventDefault(); zoomCenter(1.2); break;
        case '-': case '_': e.preventDefault(); zoomCenter(1 / 1.2); break;
        case 'ArrowLeft': e.preventDefault(); applyView(v.scale, v.tx - step, v.ty, false); break;
        case 'ArrowRight': e.preventDefault(); applyView(v.scale, v.tx + step, v.ty, false); break;
        case 'ArrowUp': e.preventDefault(); applyView(v.scale, v.tx, v.ty - step, false); break;
        case 'ArrowDown': e.preventDefault(); applyView(v.scale, v.tx, v.ty + step, false); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status]);

  const applyBoxZoom = (b: { x0: number; y0: number; x1: number; y1: number }, r: DOMRect) => {
    const v = viewRef.current;
    const sw = b.x1 - b.x0;
    const sh = b.y1 - b.y0;
    if (sw <= 0 || sh <= 0) return;
    const s = clamp(v.scale * Math.min(r.width / sw, r.height / sh), MIN_SCALE, MAX_SCALE);
    const scx = (b.x0 + b.x1) / 2;
    const scy = (b.y0 + b.y1) / 2;
    const pnx = (scx - v.tx) / v.scale;
    const pny = (scy - v.ty) / v.scale;
    applyView(s, r.width / 2 - pnx * s, r.height / 2 - pny * s, false);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (status !== 'ready') return;
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* 部分环境（如合成事件）下 setPointerCapture 会抛错，忽略即可 */
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = viewportRef.current!.getBoundingClientRect();

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current = { dist };
      return;
    }
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (mode === 'box') {
      boxStartRef.current = { x, y };
      setBox({ x0: x, y0: y, x1: x, y1: y });
    } else {
      const v = viewRef.current;
      dragRef.current = { x: e.clientX, y: e.clientY, tx: v.tx, ty: v.ty };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = viewportRef.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    // 放大镜模式：即使未按下鼠标（悬停）也实时更新位置
    if (loupe) setLoupePos({ x, y });

    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchRef.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || pinchRef.current.dist;
      const midX = (pts[0].x + pts[1].x) / 2 - r.left;
      const midY = (pts[0].y + pts[1].y) / 2 - r.top;
      const factor = dist / (pinchRef.current.dist || dist);
      pinchRef.current.dist = dist;
      zoomAt(viewRef.current.scale * factor, midX, midY);
      return;
    }

    if (mode === 'box' && boxStartRef.current) {
      setBox(b => (b ? { ...b, x1: x, y1: y } : b));
      return;
    }
    if (dragRef.current) {
      const d = dragRef.current;
      applyView(viewRef.current.scale, d.tx + (e.clientX - d.x), d.ty + (e.clientY - d.y), false);
    }
    if (loupe) setLoupePos({ x, y });
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasBox = mode === 'box' && boxStartRef.current;
    const start = boxStartRef.current;
    boxStartRef.current = null;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;

    if (wasBox && start) {
      const r = viewportRef.current!.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      setBox(null);
      const x0 = Math.min(start.x, x);
      const x1 = Math.max(start.x, x);
      const y0 = Math.min(start.y, y);
      const y1 = Math.max(start.y, y);
      if (x1 - x0 > 8 && y1 - y0 > 8) applyBoxZoom({ x0, y0, x1, y1 }, r);
    }
    dragRef.current = null;
  };

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const r = viewportRef.current?.getBoundingClientRect();
    setNw(w);
    setNh(h);
    if (r && r.width > 0 && w && h) {
      const s = Math.min(r.width / w, r.height / h);
      applyView(s, (r.width - w * s) / 2, (r.height - h * s) / 2, true);
    }
    setStatus('ready');
  };

  const retryNow = () => {
    setRetry(n => n + 1);
    setStatus('loading');
  };

  const cursorClass =
    mode === 'box' ? 'is-box' : loupe ? 'is-loupe' : '';

  const pnx = nw ? (loupePos.x - tx) / scale : 0;
  const pny = nh ? (loupePos.y - ty) / scale : 0;

  return (
    <>
      <div className="vp-toolbar">
        <button type="button" onClick={() => zoomCenter(1 / 1.2)} title="缩小 (-)"><ZoomOut size={16} /></button>
        <span className="vp-zoom">{Math.round(scale * 100)}%</span>
        <button type="button" onClick={() => zoomCenter(1.2)} title="放大 (+)"><ZoomIn size={16} /></button>
        <button type="button" onClick={oneToOne} title="原始尺寸 1:1">1:1</button>
        <button type="button" onClick={fitView} title="适应窗口"><Maximize2 size={16} /></button>
        <button type="button" onClick={fitView} title="重置"><RotateCcw size={16} /></button>
        <span className="vp-sep" />
        <button
          type="button"
          className={mode === 'box' ? 'active' : ''}
          onClick={() => setMode(m => (m === 'box' ? 'pan' : 'box'))}
          title="框选放大：拖拽矩形选区放大该区域"
        ><Crosshair size={16} /> 框选</button>
        <button
          type="button"
          className={loupe ? 'active' : ''}
          onClick={() => setLoupe(l => !l)}
          title="放大镜：悬停实时查看局部"
        >放大镜</button>
      </div>

      <div
        ref={viewportRef}
        className={`vp-viewport ${cursorClass}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={() => loupe && setLoupePos({ x: -9999, y: -9999 })}
      >
        {item.thumb && (
          <img className="vp-thumb" src={item.thumb} alt="" aria-hidden="true" />
        )}
        <img
          key={retry}
          className="vp-img"
          src={item.src}
          alt={item.name}
          draggable={false}
          onLoad={onImgLoad}
          onError={() => setStatus('error')}
          style={{
            width: nw || 'auto',
            height: nh || 'auto',
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            opacity: status === 'ready' ? 1 : 0,
            visibility: nw ? 'visible' : 'hidden',
          }}
        />
        {box && (
          <div
            className="vp-box"
            style={{
              left: Math.min(box.x0, box.x1),
              top: Math.min(box.y0, box.y1),
              width: Math.abs(box.x1 - box.x0),
              height: Math.abs(box.y1 - box.y0),
            }}
          />
        )}
        {loupe && status === 'ready' && nw > 0 && (
          <div
            className="vp-loupe"
            style={{
              left: loupePos.x - LOUPE_SIZE / 2,
              top: loupePos.y - LOUPE_SIZE / 2,
              backgroundImage: `url(${item.src})`,
              backgroundSize: `${nw * scale * LOUPE_FACTOR}px ${nh * scale * LOUPE_FACTOR}px`,
              backgroundPosition: `${-(pnx * scale * LOUPE_FACTOR - LOUPE_SIZE / 2)}px ${-(pny * scale * LOUPE_FACTOR - LOUPE_SIZE / 2)}px`,
            }}
          />
        )}
        {status !== 'ready' && (
          <div className="vp-status">
            {status === 'loading' ? (
              <>
                <Loader2 className="vp-spin" size={26} />
                <span>正在加载高清原图…</span>
              </>
            ) : (
              <>
                <span>图片加载失败</span>
                <button type="button" className="vp-retry" onClick={retryNow}>重试</button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const FlowPreview = ({ item, onClose }: FlowPreviewProps) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!item) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="flow-preview-mask" onClick={onClose}>
      <div
        className="flow-preview-dialog"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flow-preview-header">
          <div>
            <h3>
              {item.name}
            </h3>
            <p>
              {item.summary}
            </p>
          </div>
          <button type="button" className="flow-preview-close" onClick={onClose} aria-label="关闭预览">
            <X size={18} />
          </button>
        </div>
        {/* key 绑定 item.key：每次打开（含切换不同流程）重新挂载，缩放状态自然重置 */}
        <FlowViewer key={item.key} item={item} />
      </div>
    </div>
  );
};

const OriginalComponent = () => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set([versions[0].version]));
  const [activeTab, setActiveTab] = useState<'versions' | 'flows'>('versions');
  const [previewItem, setPreviewItem] = useState<FlowItem | null>(null);

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedVersions(new Set(versions.map(v => v.version)));
  };

  const collapseAll = () => {
    setExpandedVersions(new Set());
  };

  return (
    <div className="index-page">
      <header className="index-header">
        <div className="index-header-inner">
          <div className="index-brand">
            <div className="brand-logo">
              <Shield size={28} />
            </div>
            <div className="brand-text">
              <h1>公共数据资源授权运营管理平台</h1>
              <p>原型预览与版本管理</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="header-btn" onClick={() => { expandAll(); }}>
              展开全部
            </button>
            <button className="header-btn" onClick={() => { collapseAll(); }}>
              收起全部
            </button>
          </div>
        </div>
      </header>

      <main className="index-main">
        <section className="entry-cards">
          <a className="entry-card" href="/prototypes/authorized-operation-portal.html">
            <div className="entry-card-icon portal">
              <Monitor size={36} />
            </div>
            <div className="entry-card-info">
              <h3>查看门户原型</h3>
            </div>
            <ExternalLink className="entry-card-arrow" size={20} />
          </a>
          <a className="entry-card" href="/prototypes/product-security-review.html">
            <div className="entry-card-icon admin">
              <LayoutDashboard size={36} />
            </div>
            <div className="entry-card-info">
              <h3>查看后台原型</h3>
            </div>
            <ExternalLink className="entry-card-arrow" size={20} />
          </a>
        </section>

        <section className="version-list">
          <div className="version-list-header">
            <div className="version-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'versions'}
                className={'version-tab' + (activeTab === 'versions' ? ' active' : '')}
                onClick={() => setActiveTab('versions')}
              >
                版本变更记录
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'flows'}
                className={'version-tab' + (activeTab === 'flows' ? ' active' : '')}
                onClick={() => setActiveTab('flows')}
              >
                业务流程图
              </button>
            </div>
            {activeTab === 'versions' && (
              <span className="version-count">共 {versions.length} 个版本</span>
            )}
          </div>

          {activeTab === 'versions' ? (
            <div className="version-list-body">
              {versions.map((item) => {
                const isExpanded = expandedVersions.has(item.version);
                return (
                  <div key={item.version} className={'version-card' + (isExpanded ? ' expanded' : '')}>
                    <div className="version-card-header" onClick={() => toggleVersion(item.version)}>
                      <div className="version-title">
                        <span className="version-badge">v{item.version}</span>
                        <h3>{item.title}</h3>
                      </div>
                      <div className="version-toggle">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="version-card-body">
                        <div className="version-content" dangerouslySetInnerHTML={{ __html: item.content.replace(/\n/g, '<br/>').replace('../images/变更撤销.svg', changeFlowImg) }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="version-list-body">
              <FlowTab onPreview={setPreviewItem} />
            </div>
          )}
        </section>
      </main>

      <footer className="index-footer">
        <p>© 2026 公共数据资源授权运营管理平台 · 原型预览系统</p>
      </footer>

      <FlowPreview item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
};

const Component = () => (
  <PasswordGuard>
    <OriginalComponent />
  </PasswordGuard>
);

export default Component;

if (typeof window !== 'undefined' && (window as any).__AXHUB_DEFINE_COMPONENT__) {
  (window as any).__AXHUB_DEFINE_COMPONENT__(Component);
}

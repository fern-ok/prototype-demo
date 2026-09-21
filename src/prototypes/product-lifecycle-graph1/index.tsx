/**
 * @name 生命图谱1（线性无分支 · 独立整页）
 * @mode axure
 *
 * 由「产品生命周期」列表页「生命图谱1」按钮跳转进入的独立整页，
 * 与「生命图谱」并列，采用与其完全一致的节点视觉形式（圆角矩形、编号、
 * 阶段名、分类标签、箭头连线），但严格按时间先后顺序线性展示流程节点：
 *   - 仅展示已经实际执行过的步骤，未进行的步骤一律不显示；
 *   - 不存在任何支线或分支，流程节点依时间先后依次排列；
 *   - 例如：上架节点之后接续变更节点，再接续下架节点，最后接续上架节点，
 *     形成单一时间序列。
 * 通过 URL 参数 ?code=数据产品标识码 定位记录，支持直接访问与刷新。
 */

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import {
  LifecycleRecord,
  getRecordByCode,
  getStageStatusClass,
  seedRecords
} from '../product-lifecycle/lifecycle-shared';
import '../product-lifecycle/style.css';
import '../product-lifecycle-lineage/lineage-style.css';
import '../product-lifecycle-graph/graph-style.css';
import './graph1-style.css';

const LIST_PAGE_URL = '/prototypes/product-lifecycle.html';

/* ---------------- 与生命图谱完全一致的分类与配色 ---------------- */

type StageCat = 'pre' | 'core' | 'loop' | 'end';

type StageStatus = 'done' | 'current';

const CAT_LABEL: Record<StageCat, string> = {
  pre: '前置阶段',
  core: '核心流转',
  loop: '变更循环',
  end: '终止环节'
};

const CAT_STYLE: Record<StageCat, { fill: string; stroke: string; accent: string }> = {
  pre: { fill: '#e6f7ff', stroke: '#91d5ff', accent: '#1890ff' },
  core: { fill: '#f6ffed', stroke: '#b7eb8f', accent: '#52c41a' },
  loop: { fill: '#fff2e8', stroke: '#ffbb96', accent: '#fa541c' },
  end: { fill: '#fff1f0', stroke: '#ffa39e', accent: '#f5222d' }
};

interface FlowStage {
  key: string;
  label: string;
  cat: StageCat;
  desc: string;
  org: string;
}

const STAGES: FlowStage[] = [
  { key: 'dev', label: '开发', cat: 'pre', org: '产品运营机构', desc: '数据提供方或运营机构完成数据产品的需求设计、数据加工与接口 / 数据集封装，形成可交付的产品雏形。' },
  { key: 'catalog', label: '编目', cat: 'pre', org: '数据提供方', desc: '将开发完成的产品按统一元数据标准进行编目，录入数据资源 / 产品目录，形成可检索的资产条目。' },
  { key: 'review', label: '安全审查', cat: 'core', org: '数据管理部门', desc: '数据管理部门对产品开展合规性与安全性审查，审查通过后进入登记环节；不通过则退回修改后重新提交。' },
  { key: 'register', label: '登记', cat: 'core', org: '运营机构', desc: '运营机构对通过审查的产品进行登记赋码，确立产品的合法运营身份与资产编号。' },
  { key: 'shelf', label: '上架', cat: 'core', org: '运营机构', desc: '登记完成的产品在运营平台正式上架，对外提供订阅、调用与交付能力。' },
  { key: 'trade', label: '交易', cat: 'core', org: '运营机构 / 需求方', desc: '产品上架后，数据需求方发起订阅 / 调用，形成交易与交付记录，是产品价值兑现环节。' },
  { key: 'change', label: '变更', cat: 'loop', org: '产品运营机构', desc: '对已登记 / 上架的产品发起变更（内容、接口、资费、范围等）。变更可发生在登记、上架或交易之后，需重新经过安全审查与登记后方可再次上架，同一产品可反复多次。' },
  { key: 'unshelf', label: '下架', cat: 'core', org: '运营机构', desc: '因业务调整、合规要求或产品终止，运营机构将产品从平台下架，停止对外提供服务。' },
  { key: 'revoke', label: '撤销', cat: 'end', org: '数据管理部门 / 运营机构', desc: '产品在登记之后彻底退出运营，注销登记与资产条目，不可恢复。' }
];

const STAGE_INDEX: Record<string, number> = {
  dev: 0,
  catalog: 1,
  review: 2,
  register: 3,
  shelf: 4,
  trade: 5,
  unshelf: 6,
  revoke: 7
};

const CURRENT_MAP: Record<string, string> = {
  安全审查: 'review',
  产品登记: 'register',
  产品上架: 'shelf',
  产品交付: 'trade',
  产品下架: 'unshelf'
};

const NODE_W = 126;
const NODE_H = 62;
const NODE_GAP = 58;
const ROW_SHIFT = 28; // 奇数行向左错开，使换行处形成带水平箭头的转折
const START_X = 88 + ROW_SHIFT;
const CENTER_Y = 180;

const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);

const hashStr = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** 由记录与阶段顺序稳定派生操作时间（yyyy-MM-dd HH:mm:ss），orderNo 越小时间越早 */
const deriveTime = (record: LifecycleRecord, orderNo: number): string => {
  const baseMonth = Number(record.updateTime.slice(5, 7)) || 8;
  const abs = 2026 * 12 + (baseMonth - 1) - orderNo;
  const year = Math.floor(abs / 12);
  const month = (abs % 12) + 1;
  const day = ((record.id * 7 + orderNo * 5) % 27) + 1;
  const hh = 8 + ((record.id + orderNo) % 10);
  const mm = (record.id * 11 + orderNo * 7) % 60;
  const ss = (record.id * 29 + orderNo * 13) % 60;
  return year + '-' + pad2(month) + '-' + pad2(day) + ' ' + pad2(hh) + ':' + pad2(mm) + ':' + pad2(ss);
};

const clipText = (text: string, max: number) => (text.length > max ? text.slice(0, max - 1) + '…' : text);

/** 由标识码派生「变更」发生次数（0~3，稳定可复现），与生命图谱口径一致 */
const deriveChangeCount = (record: LifecycleRecord): number => record.id % 4;

const cycleRand = (seed: number) => {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

interface LinearNode {
  /** 显示序号（从 1 开始） */
  no: number;
  /** 阶段 key */
  key: string;
  /** 显示名称 */
  label: string;
  /** 分类 */
  cat: StageCat;
  /** done / current */
  status: StageStatus;
  /** 操作时间 */
  time: string;
  /** 该节点是第几次出现（用于 上架/下架/变更 的 ×N 徽标） */
  seq?: number;
}

/**
 * 构建严格线性的已执行节点序列。
 * 顺序：开发 → 编目 → 安全审查 → 登记 → 首次上架 → [变更 × N] →
 *      （下架 → 再上架）循环 → 交易（若已执行）→ 撤销（若已执行）。
 */
const buildLinearNodes = (record: LifecycleRecord): LinearNode[] => {
  const currentKey = CURRENT_MAP[record.currentStage] || 'review';
  const currentIndex = STAGE_INDEX[currentKey] ?? 2;
  const changeCount = deriveChangeCount(record);
  const nodes: LinearNode[] = [];
  let order = 0;
  let no = 1;

  const push = (key: string, status: StageStatus, seq?: number) => {
    const stage = STAGES.find((s) => s.key === key) || STAGES[0];
    nodes.push({
      no,
      key,
      label: stage.label,
      cat: stage.cat,
      status,
      time: deriveTime(record, order),
      seq
    });
    no += 1;
    order += 1;
  };

  // 1) 前置阶段与登记（按当前阶段回溯均已执行）
  ['dev', 'catalog', 'review', 'register'].forEach((k) => {
    const idx = STAGE_INDEX[k];
    if (idx <= currentIndex) push(k, idx === currentIndex ? 'current' : 'done');
  });

  // 2) 上架生命周期：严格线性展开每一次上架 / 下架 / 变更
  if (currentIndex >= STAGE_INDEX.shelf) {
    const rounds = record.id % 3;
    const shelfCount = rounds + 1;
    const openShelf = currentKey === 'shelf' || currentKey === 'trade';
    const openUnshelf = currentKey === 'unshelf';
    const unshelfCount = openUnshelf ? rounds + 1 : rounds;

    // 首次上架
    push('shelf', openShelf && shelfCount === 1 ? 'current' : 'done', 1);

    // 变更集中发生在首次上架之后（每次变更作为一个独立线性节点）
    for (let c = 0; c < changeCount; c++) {
      push('change', 'done', c + 1);
    }

    // 后续循环：下架 → 再上架
    for (let i = 0; i < rounds; i++) {
      const isLastUnshelf = openUnshelf && i === unshelfCount - 1;
      push('unshelf', isLastUnshelf ? 'current' : 'done', i + 1);
      const isLastShelf = openShelf && i + 2 === shelfCount;
      push('shelf', isLastShelf ? 'current' : 'done', i + 2);
    }
  }

  // 3) 交易 / 撤销（若已执行）
  if (currentIndex >= STAGE_INDEX.trade) push('trade', currentKey === 'trade' ? 'current' : 'done');
  if (currentIndex >= STAGE_INDEX.revoke) push('revoke', 'done');

  return nodes;
};

/**
 * 第一条数据（列表按更新时间倒序后的首行）固定演示数据：
 * 共 20 个步骤，严格线性、无分支，按时间先后依次排列。
 * 序列：开发 → 编目 → 安全审查 → 登记 → 变更(登记后) → 上架① → 变更(上架后)
 *       → 交易① → 下架① → 上架② → 变更③ → 交易② → 下架② → 上架③ → 变更④
 *       → 交易③ → 下架③ → 上架④ → 交易④ → 撤销。
 */
const buildFixedDemoNodes = (record: LifecycleRecord): LinearNode[] => {
  const steps: Array<{ key: string; seq?: number; status: StageStatus }> = [
    { key: 'dev', status: 'done' },
    { key: 'catalog', status: 'done' },
    { key: 'review', status: 'done' },
    { key: 'register', status: 'done' },
    { key: 'change', seq: 1, status: 'done' },
    { key: 'shelf', seq: 1, status: 'done' },
    { key: 'change', seq: 2, status: 'done' },
    { key: 'trade', seq: 1, status: 'done' },
    { key: 'unshelf', seq: 1, status: 'done' },
    { key: 'shelf', seq: 2, status: 'done' },
    { key: 'change', seq: 3, status: 'done' },
    { key: 'trade', seq: 2, status: 'done' },
    { key: 'unshelf', seq: 2, status: 'done' },
    { key: 'shelf', seq: 3, status: 'done' },
    { key: 'change', seq: 4, status: 'done' },
    { key: 'trade', seq: 3, status: 'done' },
    { key: 'unshelf', seq: 3, status: 'done' },
    { key: 'shelf', seq: 4, status: 'done' },
    { key: 'trade', seq: 4, status: 'done' },
    { key: 'revoke', status: 'current' }
  ];

  return steps.map((s, idx) => {
    const stage = STAGES.find((st) => st.key === s.key) || STAGES[0];
    return {
      no: idx + 1,
      key: s.key,
      label: stage.label,
      cat: stage.cat,
      status: s.status,
      time: deriveTime(record, steps.length - 1 - idx),
      seq: s.seq
    };
  });
};

/* ---------------- 线性图谱（SVG，复用生命图谱节点视觉） ---------------- */

interface LinearGraphProps {
  nodes: LinearNode[];
  record: LifecycleRecord;
  onNodeClick?: (node: LinearNode) => void;
  selectedKey?: string | null;
}

const LinearLifecycleGraph = ({ nodes, record, onNodeClick, selectedKey }: LinearGraphProps) => {
  const PER_ROW = 8;
  const ROW_GAP = 70;
  const topY = CENTER_Y - NODE_H / 2;
  const totalRows = Math.max(1, Math.ceil(nodes.length / PER_ROW));
  const totalWidth = START_X * 2 + (PER_ROW - 1) * (NODE_W + NODE_GAP);
  const totalHeight = topY + (totalRows - 1) * (NODE_H + ROW_GAP) + NODE_H + topY;

  const isReversedRow = (row: number) => row % 2 === 1;

  const nodeCol = (idx: number) => {
    const row = Math.floor(idx / PER_ROW);
    const col = idx % PER_ROW;
    return isReversedRow(row) ? PER_ROW - 1 - col : col;
  };
  const nodeX = (col: number, row: number) => START_X + col * (NODE_W + NODE_GAP) - (isReversedRow(row) ? ROW_SHIFT : 0);
  const centerY = (row: number) => CENTER_Y + row * (NODE_H + ROW_GAP);

  const renderEdge = (fromIdx: number, toIdx: number) => {
    const fromRow = Math.floor(fromIdx / PER_ROW);
    const toRow = Math.floor(toIdx / PER_ROW);
    const fromCol = nodeCol(fromIdx);
    const toCol = nodeCol(toIdx);
    const cx1 = nodeX(fromCol, fromRow);
    const cy1 = centerY(fromRow);
    const cx2 = nodeX(toCol, toRow);
    const cy2 = centerY(toRow);

    if (fromRow === toRow) {
      // 同一行内：从源节点朝向目标节点的一侧边缘连到目标节点对侧边缘
      const reversed = isReversedRow(fromRow);
      const x1 = reversed ? cx1 - NODE_W / 2 : cx1 + NODE_W / 2;
      const x2 = reversed ? cx2 + NODE_W / 2 : cx2 - NODE_W / 2;
      const d = 'M ' + x1 + ' ' + cy1 + ' L ' + x2 + ' ' + cy2;
      return (
        <g key={'e-' + fromIdx + '-' + toIdx}>
          <path d={d} fill="none" stroke="#c2ccdb" strokeWidth={1.6} markerEnd="url(#life-graph-arrow)" />
        </g>
      );
    }

    // 换行：采用「下 → 横 → 下」的阶梯连线，箭头置于水平段，指向下一行阅读方向
    const x1 = cx1; // 源节点中心 x
    const x2 = cx2; // 目标节点中心 x
    const ySourceBottom = cy1 + NODE_H / 2;
    const yTargetTop = cy2 - NODE_H / 2;
    const yMid = (ySourceBottom + yTargetTop) / 2;
    const dVertical1 = 'M ' + x1 + ' ' + ySourceBottom + ' L ' + x1 + ' ' + yMid;
    const dHorizontal = 'M ' + x1 + ' ' + yMid + ' L ' + x2 + ' ' + yMid;
    const dVertical2 = 'M ' + x2 + ' ' + yMid + ' L ' + x2 + ' ' + yTargetTop;
    return (
      <g key={'e-' + fromIdx + '-' + toIdx}>
        <path d={dVertical1} fill="none" stroke="#c2ccdb" strokeWidth={1.6} />
        <path d={dHorizontal} fill="none" stroke="#c2ccdb" strokeWidth={1.6} markerEnd="url(#life-graph-arrow)" />
        <path d={dVertical2} fill="none" stroke="#c2ccdb" strokeWidth={1.6} />
      </g>
    );
  };

  const renderNode = (node: LinearNode, idx: number) => {
    const style = CAT_STYLE[node.cat];
    const isSelected = selectedKey === node.key + '-' + idx;
    const isCurrent = node.status === 'current';
    const row = Math.floor(idx / PER_ROW);
    const col = nodeCol(idx);
    const x = nodeX(col, row) - NODE_W / 2;
    const y = centerY(row) - NODE_H / 2;
    const badge = ['shelf', 'unshelf', 'change'].includes(node.key) && (node.seq || 1) > 1;

    return (
      <g
        key={'n-' + node.key + '-' + idx}
        className={'life-node life-cat-' + node.cat + (isSelected ? ' selected' : '') + (isCurrent ? ' is-current' : '')}
        transform={'translate(' + x + ', ' + y + ')'}
        onClick={() => onNodeClick && onNodeClick(node)}
        style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
      >
        <title>{node.label}</title>
        <rect
          width={NODE_W}
          height={NODE_H}
          rx={8}
          fill={style.fill}
          stroke={isSelected || isCurrent ? style.accent : style.stroke}
          strokeWidth={isSelected || isCurrent ? 2.5 : 1.4}
        />
        <text x={12} y={22} className="life-node-index" fill={style.accent}>{node.no}</text>
        <text x={NODE_W / 2} y={34} textAnchor="middle" className="life-node-name" fill={style.accent}>{clipText(node.label, 6)}</text>
        <text x={NODE_W / 2} y={52} textAnchor="middle" className="life-node-cat" fill={style.accent}>{CAT_LABEL[node.cat]}</text>
        {badge && (
          <g transform={'translate(' + (NODE_W - 26) + ', 11)'}>
            <circle r={11} fill={style.accent} />
            <text x={0} y={4} textAnchor="middle" className="life-node-badge">×{node.seq}</text>
          </g>
        )}
      </g>
    );
  };

  return (
    <svg className="life-graph-svg" viewBox={'0 0 ' + totalWidth + ' ' + totalHeight} width={totalWidth} height={totalHeight} role="img" aria-label="产品生命周期线性图谱">
      <defs>
        <marker id="life-graph-arrow" markerWidth="10" markerHeight="10" refX="8.5" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill="#9aa7bd" />
        </marker>
      </defs>
      {nodes.length > 1 && nodes.slice(0, -1).map((_, i) => renderEdge(i, i + 1))}
      {nodes.map((n, i) => renderNode(n, i))}
    </svg>
  );
};

/* ---------------- 发起 / 审批信息（复用生命图谱逻辑，仅展示已执行阶段） ---------------- */

const HANDLER_POOL = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵磊'];
const AUDIT_ORG_NAME = '湖南省公共数据运营中心';

interface StagePartyInfo {
  withApproval: boolean;
  org: string;
  handler: string;
  time: string;
  auditOrg: string;
  auditHandler: string;
  auditResult: string;
  auditOpinion: string;
  auditTime: string;
}

const buildStagePartyInfo = (record: LifecycleRecord, node: LinearNode): StagePartyInfo => {
  const stage = STAGES.find((s) => s.key === node.key) || STAGES[0];
  const approvalStages = ['review', 'register', 'shelf', 'trade', 'unshelf', 'change', 'revoke'];
  const seed = hashStr(record.productCode + '|' + node.key + '|' + (node.seq || 0));
  const pick = (salt: number) => HANDLER_POOL[(seed + salt) % HANDLER_POOL.length];
  const effStatus = node.status === 'current' ? record.stageStatus : '已完成';
  const passed = effStatus === '已完成';
  const rejected = effStatus === '已驳回';

  return {
    withApproval: approvalStages.includes(stage.key),
    org: record.provider,
    handler: pick(1),
    time: node.time,
    auditOrg: AUDIT_ORG_NAME,
    auditHandler: pick(4),
    auditResult: passed ? '审核通过' : rejected ? '审核不通过' : '—',
    auditOpinion: passed ? '通过' : rejected ? '材料不符合要求已被驳回，请修改后重新提交' : '—',
    auditTime: passed || rejected ? node.time : '—'
  };
};

/* ---------------- 页面 ---------------- */

const OriginalComponent = () => {
  const code = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || '';
  }, []);

  const record: LifecycleRecord | undefined = useMemo(() => getRecordByCode(code), [code]);

  // 第一条数据（列表按更新时间倒序后的首行）使用固定的 20 步演示数据
  const firstRecordCode = useMemo(() => {
    const sorted = [...seedRecords].sort((a, b) => b.updateTime.localeCompare(a.updateTime));
    return sorted[0]?.productCode || '';
  }, []);
  const isFixedDemo = !!record && (code === firstRecordCode || code === 'DP430300202602019');
  const effectiveRecord: LifecycleRecord | undefined = useMemo(() => {
    if (!record) return undefined;
    if (!isFixedDemo) return record;
    return { ...record, currentStage: '撤销', stageStatus: '已完成' };
  }, [record, isFixedDemo]);
  const nodes = useMemo<LinearNode[]>(
    () => (effectiveRecord ? (isFixedDemo ? buildFixedDemoNodes(effectiveRecord) : buildLinearNodes(effectiveRecord)) : []),
    [effectiveRecord, isFixedDemo]
  );

  const [selectedNode, setSelectedNode] = useState<LinearNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback((node: LinearNode) => {
    setSelectedNode(node);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedNode(null), 220);
  };

  const currentStageLabel = effectiveRecord
    ? CURRENT_MAP[effectiveRecord.currentStage]
      ? (STAGES.find((s) => s.key === CURRENT_MAP[effectiveRecord.currentStage])?.label || effectiveRecord.currentStage)
      : effectiveRecord.currentStage
    : '';

  const renderNotFound = () => (
    <div className="lineage-not-found">
      <div className="empty-state-icon">🔍</div>
      <p className="lineage-not-found-text">
        {code ? '未找到对应的数据产品（标识码：' + code + '）' : '缺少数据产品标识码参数'}
      </p>
      <a className="btn btn-primary" href={LIST_PAGE_URL}>返回产品生命周期</a>
    </div>
  );

  const party = selectedNode && effectiveRecord ? buildStagePartyInfo(effectiveRecord, selectedNode) : null;

  const renderContent = () => {
    if (!effectiveRecord) return null;
    return (
      <div className="life-graph-fullscreen">
        <div className="life-graph-topbar">
          <a className="lineage-back" href={LIST_PAGE_URL}>
            <span className="lineage-back-arrow">‹</span>
            返回产品生命周期
          </a>
          <div className="life-graph-title">生命图谱1</div>
          <div className="life-graph-summary">
            <span className="life-summary-code" title={effectiveRecord.productCode}>{effectiveRecord.productCode}</span>
            <span className="life-summary-sep">·</span>
            <span className="life-summary-name" title={effectiveRecord.productName}>{effectiveRecord.productName}</span>
            <span className="life-summary-tag">当前阶段：{currentStageLabel}</span>
          </div>
          <div className="life-graph-legend">
            {(['pre', 'core', 'loop', 'end'] as StageCat[]).map((cat) => {
              const style = CAT_STYLE[cat];
              return (
                <span key={cat} className="lineage-legend-item">
                  <i className="lineage-legend-swatch" style={{ background: style.fill, borderColor: style.stroke }} />
                  {CAT_LABEL[cat]}
                </span>
              );
            })}
          </div>
        </div>

        <div className="life-graph1-hint">
          以下为该产品<strong>已实际执行</strong>的生命周期步骤，按时间先后顺序线性排列；未执行步骤不展示，且无任何分支 / 回路。
        </div>

        <div className="lineage-canvas-fullscreen" ref={canvasRef}>
          <div className="lineage-viewport" style={{ transform: 'translate(0px, 0px) scale(1)' }}>
            <LinearLifecycleGraph
              nodes={nodes}
              record={effectiveRecord}
              onNodeClick={handleNodeClick}
              selectedKey={selectedNode ? selectedNode.key + '-' + nodes.findIndex((n) => n === selectedNode) : null}
            />
          </div>
        </div>

        {drawerOpen && <div className="lineage-drawer-mask" onClick={closeDrawer} />}
        <aside className={'life-drawer ' + (drawerOpen ? 'open' : '')}>
          <div className="lineage-drawer-header">
            <h3>{selectedNode ? selectedNode.label : '阶段说明'}</h3>
            <button className="lineage-drawer-close" onClick={closeDrawer} aria-label="关闭">×</button>
          </div>
          {selectedNode && record && (
            <div className="lineage-drawer-body">
              <div className={'timeline-item' + (selectedNode.status === 'current' ? ' is-current' : '')}>
                <div className="timeline-head">
                  <span className="timeline-index">{selectedNode.no}</span>
                  <span className="timeline-stage">{selectedNode.label}</span>
                  <span className={'status-tag ' + (selectedNode.status === 'current' ? getStageStatusClass(record.stageStatus) : 'status-approved')}>
                    {selectedNode.status === 'current' ? record.stageStatus : '已完成'}
                  </span>
                </div>

                {party ? (
                  <>
                    <div className="timeline-block">
                      <div className="timeline-block-title">发起信息</div>
                      <div className="timeline-fields">
                        <div className="timeline-field"><span className="timeline-field-label">单位名称</span><span className="timeline-field-value" title={party.org}>{party.org}</span></div>
                        <div className="timeline-field"><span className="timeline-field-label">法人经办人姓名</span><span className="timeline-field-value">{party.handler}</span></div>
                        <div className="timeline-field"><span className="timeline-field-label">操作时间</span><span className="timeline-field-value">{party.time}</span></div>
                      </div>
                    </div>

                    {party.withApproval && (
                      <div className="timeline-block">
                        <div className="timeline-block-title">审批信息</div>
                        <div className="timeline-fields">
                          <div className="timeline-field"><span className="timeline-field-label">单位名称</span><span className="timeline-field-value" title={party.auditOrg}>{party.auditOrg}</span></div>
                          <div className="timeline-field"><span className="timeline-field-label">法人经办人姓名</span><span className="timeline-field-value">{party.auditHandler}</span></div>
                          <div className="timeline-field"><span className="timeline-field-label">审核结果</span><span className="timeline-field-value">{party.auditResult === '审核通过' ? <span className="audit-tag audit-pass">审核通过</span> : party.auditResult === '审核不通过' ? <span className="audit-tag audit-fail">审核不通过</span> : '—'}</span></div>
                          <div className="timeline-field"><span className="timeline-field-label">审核意见</span><span className="timeline-field-value" title={party.auditOpinion}>{party.auditOpinion}</span></div>
                          <div className="timeline-field"><span className="timeline-field-label">操作时间</span><span className="timeline-field-value">{party.auditTime}</span></div>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}

                <div className="life-drawer-desc">
                  <div className="life-drawer-label">阶段说明</div>
                  <p>{(STAGES.find((s) => s.key === selectedNode.key)?.desc) || ''}</p>
                </div>

                {selectedNode.key === 'change' && (
                  <div className="life-drawer-note">变更作为已发生的线性节点，按时间顺序插入在上架之后、下架 / 再上架之前。本产品当前记录包含该次变更。</div>
                )}
                {selectedNode.key === 'shelf' && (
                  <div className="life-drawer-note">本节点为第 {selectedNode.seq || 1} 次上架，已实际执行。</div>
                )}
                {selectedNode.key === 'unshelf' && (
                  <div className="life-drawer-note">本节点为第 {selectedNode.seq || 1} 次下架，已实际执行。</div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    );
  };

  return (
    <Layout
      activeMenu="product-lifecycle"
      breadcrumb="产品生命周期"
      role="运营机构"
      onRoleChange={() => {}}
      roleOptions={['运营机构']}
    >
      <div className="life-graph-page">
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

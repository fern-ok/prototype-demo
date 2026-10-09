/**
 * @name 生命周期1（蛇形回折跑道时间轴 · 独立整页）
 * @mode axure
 *
 * 由「产品生命周期」列表页「生命周期1」按钮跳转进入的独立整页，
 * 与「生命周期」并列，但采用全新的「蛇形回折跑道时间轴」形态呈现产品生命周期：
 *   - 时间主线从画布左上起始，向右延伸，到达画布边界时平滑向下折返，继续向右排布，
 *     形成蛇形回折的连续时间带（跑道）；
 *   - 跑道按业务阶段使用不同低饱和底色分段，白色竖刻度线标记各步骤的操作时间；
 *   - 业务节点卡片沿跑道依次排布，展示序号 / 步骤名称 / 阶段分类；
 *     多次发生的步骤（上架 / 下架 / 变更）右上角增加角标标识发生次数；
 *   - 节点之间使用沿跑道走向的短小箭头，标识时间流转方向；
 *   - 仅展示已经实际执行过的步骤，未进行的步骤一律不显示，且无任何分支 / 回路；
 *   - 画布支持拖拽平移、滚轮缩放，右下角保留缩放工具栏，并提供右下角鸟瞰缩略小地图。
 * 通过 URL 参数 ?code=数据产品标识码 定位记录，支持直接访问与刷新。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

/* ---------------- 与生命周期完全一致的分类与配色 ---------------- */

type StageCat = 'pre' | 'core' | 'loop' | 'end';

type StageStatus = 'done' | 'current' | 'rejected';

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

/** 运营周期环节状态配色（替代原前置 / 核心 / 变更 / 终止 的分类配色）：待处理(蓝) / 审核不通过(红) / 审核通过(绿) */
export const TRACK_STATUS_STYLE: Record<string, { fill: string; stroke: string; accent: string }> = {
  待处理: { fill: '#e6f7ff', stroke: '#91d5ff', accent: '#1890ff' },
  审核不通过: { fill: '#fff1f0', stroke: '#ffa39e', accent: '#f5222d' },
  审核通过: { fill: '#f6ffed', stroke: '#b7eb8f', accent: '#52c41a' }
};

/** 由环节执行状态推导运营周期展示状态：当前进行中的环节记为「待处理」（若当前阶段状态为驳回则显示「审核不通过」），
 * 已驳回节点显示「审核不通过」，其余已执行完成环节记为「审核通过」。 */
export const trackNodeStatus = (status: StageStatus, stageStatus?: string): '待处理' | '审核通过' | '审核不通过' => {
  if (status === 'rejected') return '审核不通过';
  if (status === 'current') {
    const s = stageStatus || '';
    if (s.includes('不通过') || s.includes('未通过')) return '审核不通过';
    return '待处理';
  }
  return '审核通过';
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
  { key: 'register', label: '首次登记', cat: 'core', org: '运营机构', desc: '运营机构对通过审查的产品进行登记赋码，确立产品的合法运营身份与资产编号。' },
  { key: 'shelf', label: '上架', cat: 'core', org: '运营机构', desc: '登记完成的产品在运营平台正式上架，对外提供订阅、调用与交付能力。' },
  { key: 'trade', label: '交易', cat: 'core', org: '运营机构 / 需求方', desc: '产品上架后，数据需求方发起订阅 / 调用，形成交易与交付记录，是产品价值兑现环节。' },
  { key: 'change', label: '变更登记', cat: 'loop', org: '产品运营机构', desc: '对已登记 / 上架的产品发起变更（内容、接口、资费、范围等）。变更可发生在登记、上架或交易之后，需重新经过安全审查与登记后方可再次上架，同一产品可反复多次。' },
  { key: 'unshelf', label: '下架', cat: 'core', org: '运营机构', desc: '因业务调整、合规要求或产品终止，运营机构将产品从平台下架，停止对外提供服务。' },
  { key: 'revoke', label: '撤销登记', cat: 'end', org: '数据管理部门 / 运营机构', desc: '产品在登记之后彻底退出运营，注销登记与资产条目，不可恢复。' }
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
  产品交易: 'trade',
  产品下架: 'unshelf'
};

/* ---------------- 跑道时间轴几何参数 ---------------- */

const PER_ROW = 8;
// 节点节距（相邻节点中心距）与卡片宽度：二者之差即卡片之间的空隙。
// 2026-09-24 起加大节距 / 收窄卡片，使节点之间留出明显空隙（节距 162 - 卡宽 118 = 44px）。
const SLOT = 162;
const MARGIN = 60;
// 横向泳道起点 / 终点：向内缩进，为两侧 180° U 形弯道（半圆，半径 = ROW_H/2）预留回转空间
const X0 = 200;
const TRACK_X1 = X0 + PER_ROW * SLOT;
const DESIGN_W = TRACK_X1 + 200;
const TRACK_H = 140;
const NODE_W = 118;
const NODE_H = 92;
// 跑道分段色块相对节距两侧的内缩量：内缩越大，相邻色块之间的留白越明显（当前 = 节距 162 - 2×7 = 148 宽，块间空隙 14px）
const SEG_INSET = 7;
const ROW_H = 230;
// U 形弯道中心线半径：相邻泳道中心距为 ROW_H，半圆回折最小半径即 ROW_H/2，保证切线连续、无锐角接缝
const BEND_R = ROW_H / 2;
const PAD_TOP = 150;
const MM_W = 220;

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

/** 由标识码派生「变更」发生次数（0~3，稳定可复现），与生命周期口径一致 */
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
  // 注：当前进行中的环节只应有一个。currentKey === 'shelf' 时仅把当前这一次上架标为 current；
  // currentKey === 'trade' 时所有上架 / 下架 / 变更均已执行完成；currentKey === 'unshelf' 时仅当前这一次下架标为 current。
  if (currentIndex >= STAGE_INDEX.shelf) {
    const rounds = record.id % 3;
    const shelfCount = rounds + 1;
    const unshelfCount = currentKey === 'unshelf' ? rounds + 1 : rounds;

    // 首次上架
    push('shelf', currentKey === 'shelf' && shelfCount === 1 ? 'current' : 'done', 1);

    // 变更集中发生在首次上架之后（每次变更作为一个独立线性节点）
    for (let c = 0; c < changeCount; c++) {
      push('change', 'done', c + 1);
    }

    // 后续循环：下架 → 再上架
    for (let i = 0; i < rounds; i++) {
      const isLastUnshelf = currentKey === 'unshelf' && i === unshelfCount - 1;
      push('unshelf', isLastUnshelf ? 'current' : 'done', i + 1);
      const isLastShelf = currentKey === 'shelf' && i + 2 === shelfCount;
      push('shelf', isLastShelf ? 'current' : 'done', i + 2);
    }
  }

  // 3) 交易 / 撤销（若已执行）
  if (currentIndex >= STAGE_INDEX.trade) push('trade', currentKey === 'trade' ? 'current' : 'done');
  if (currentIndex >= STAGE_INDEX.revoke) push('revoke', currentKey === 'revoke' ? 'current' : 'done');

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
    { key: 'change', seq: 3, status: 'rejected' },
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

/* ---------------- 跑道时间轴布局（蛇形回折） ---------------- */

interface TrackPosition {
  no: number;
  key: string;
  label: string;
  cat: StageCat;
  status: StageStatus;
  time: string;
  seq?: number;
  x: number;
  y: number;
  row: number;
  dir: 1 | -1;
  idx: number;
}

interface TrackFold {
  x: number;
  yTop: number;
  yBottom: number;
  fromIdx: number;
  toIdx: number;
  row: number;
}

interface TrackLayout {
  rows: number;
  positions: TrackPosition[];
  folds: TrackFold[];
  DESIGN_W: number;
  DESIGN_H: number;
  X0: number;
  X1: number;
  rowY: (r: number) => number;
}

const computeTrackLayout = (nodes: LinearNode[]): TrackLayout => {
  const isReversedRow = (r: number) => r % 2 === 1;
  const rows = Math.max(1, Math.ceil(nodes.length / PER_ROW));
  const nodeX = (i: number) => {
    const r = Math.floor(i / PER_ROW);
    const col = i % PER_ROW;
    const actual = isReversedRow(r) ? PER_ROW - 1 - col : col;
    return X0 + (actual + 0.5) * SLOT;
  };
  const rowY = (r: number) => PAD_TOP + r * ROW_H;
  const positions: TrackPosition[] = nodes.map((n, i) => {
    const r = Math.floor(i / PER_ROW);
    return {
      ...n,
      x: nodeX(i),
      y: rowY(r),
      row: r,
      dir: isReversedRow(r) ? -1 : 1,
      idx: i
    };
  });
  const folds: TrackFold[] = [];
  for (let r = 0; r < rows - 1; r++) {
    folds.push({
      x: isReversedRow(r) ? X0 : TRACK_X1,
      yTop: rowY(r),
      yBottom: rowY(r + 1),
      fromIdx: r * PER_ROW + PER_ROW - 1,
      toIdx: (r + 1) * PER_ROW,
      row: r
    });
  }
  const DESIGN_H = rowY(rows - 1) + TRACK_H / 2 + MARGIN + 12;
  return { rows, positions, folds, DESIGN_W, DESIGN_H, X0, X1: TRACK_X1, rowY };
};

/* ---------------- 跑道时间轴（SVG） ---------------- */

interface TrackGraphProps {
  layout: TrackLayout;
  stageStatus?: string;
  onNodeClick?: (node: LinearNode) => void;
  selectedKey?: string | null;
}

const TrackLifecycleGraph = ({ layout, stageStatus, onNodeClick, selectedKey }: TrackGraphProps) => {
  const { rows, positions, folds, DESIGN_W, DESIGN_H, X0, X1, rowY } = layout;
  const mmScale = MM_W / DESIGN_W;
  const mmH = DESIGN_H * mmScale;

  // 单条连续中心线路径：横向泳道 + 180° 半圆 U 形弯道（弧线与直道相切，切线连续，行与行过渡平滑无尖锐折角）。
  // 偶数行由 X0 向右至 TRACK_X1，奇数行折返由 TRACK_X1 向左至 X0；行末在右/左端做半圆回折衔接下一行。
  let trackPath = 'M ' + X0 + ' ' + rowY(0);
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 0) {
      trackPath += ' L ' + TRACK_X1 + ' ' + rowY(r);
      if (r < rows - 1) {
        // 右端半圆回折（顺时针 sweep=1）
        trackPath += ' A ' + BEND_R + ' ' + BEND_R + ' 0 0 1 ' + TRACK_X1 + ' ' + rowY(r + 1);
      }
    } else {
      trackPath += ' L ' + X0 + ' ' + rowY(r);
      if (r < rows - 1) {
        // 左端半圆回折（逆时针 sweep=0）
        trackPath += ' A ' + BEND_R + ' ' + BEND_R + ' 0 0 0 ' + X0 + ' ' + rowY(r + 1);
      }
    }
  }

  const renderEdges = () => {
    const items: React.ReactElement[] = [];
    // 同行内短箭头（沿跑道走向）
    for (let i = 0; i < positions.length - 1; i++) {
      const p = positions[i];
      const next = positions[i + 1];
      if (p.row === next.row) {
        const dir = p.dir;
        const x1 = p.x + dir * (NODE_W / 2 + 8);
        const x2 = next.x - dir * (NODE_W / 2 + 8);
        items.push(
          <path
            key={'ar-' + i}
            d={'M ' + x1 + ' ' + p.y + ' L ' + x2 + ' ' + p.y}
            stroke="#9aa7bd"
            strokeWidth={1.6}
            fill="none"
            markerEnd="url(#track-arrow)"
          />
        );
      }
    }
    // 折返处弧形箭头：严格沿跑道中心线绘制 180° 半圆弧
    // （起止点取相邻两行中心线 y，半径 = BEND_R，与跑道基底半圆完全重合，弧线居中不偏摆）
    folds.forEach((f) => {
      const sweep = f.x === TRACK_X1 ? 1 : 0;
      const d =
        'M ' + f.x + ' ' + f.yTop +
        ' A ' + BEND_R + ' ' + BEND_R + ' 0 0 ' + sweep + ' ' + f.x + ' ' + f.yBottom;
      items.push(
        <path
          key={'fa-' + f.fromIdx}
          d={d}
          stroke="#9aa7bd"
          strokeWidth={1.6}
          fill="none"
          markerEnd="url(#track-arrow)"
        />
      );
    });
    return items;
  };

  return (
    <svg
      className="life-graph-svg"
      viewBox={'0 0 ' + DESIGN_W + ' ' + DESIGN_H}
      width={DESIGN_W}
      height={DESIGN_H}
      role="img"
      aria-label="产品生命周期蛇形跑道时间轴"
    >
      <defs>
        <marker id="track-arrow" markerWidth="10" markerHeight="10" refX="8.5" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill="#9aa7bd" />
        </marker>
      </defs>

      {/* 跑道基底：单条连续中心线路径粗描边形成平滑 U 形回折跑道
          （外层稍宽描边作边框，内层同色填充；弧线与直道相切，行与行之间过渡无锐角、视觉连贯自然） */}
      <path
        d={trackPath}
        className="track-band-border"
        fill="none"
        stroke="#d4dde9"
        strokeWidth={TRACK_H + 3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={trackPath}
        className="track-band-fill"
        fill="none"
        stroke="#e7edf5"
        strokeWidth={TRACK_H}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 时间流转流动虚线动画：按需求取消，不再渲染（如需恢复，重新加入此处 track-flow path 即可） */}

      {/* 跑道按环节状态分段着色（低饱和底色）：待处理(蓝) / 审核不通过(红) / 审核通过(绿) */}
      {positions.map((p) => {
        const tStyle = TRACK_STATUS_STYLE[trackNodeStatus(p.status, stageStatus)];
        return (
          <rect
            key={'seg-' + p.idx}
            x={p.x - SLOT / 2 + SEG_INSET}
            y={rowY(p.row) - TRACK_H / 2 + 4}
            width={SLOT - SEG_INSET * 2}
            height={TRACK_H - 8}
            rx={10}
            fill={tStyle.fill}
            stroke={tStyle.stroke}
            strokeWidth={1}
            opacity={0.92}
          />
        );
      })}

      {/* 白色竖刻度线 + 操作时间标签
          （2026-09-24 起刻度线按需求隐藏：line 上加了 track-tick 类，
            由 graph1-style.css 统一 display:none；渲染代码保留不删，
            如需恢复，删除 .track-tick 的 display: none 即可） */}
      {positions.map((p) => (
        <g key={'tick-' + p.idx}>
          <line
            className="track-tick"
            x1={p.x}
            y1={rowY(p.row) - TRACK_H / 2 - 6}
            x2={p.x}
            y2={rowY(p.row) + TRACK_H / 2 + 6}
            stroke="#ffffff"
            strokeWidth={2.5}
            opacity={0.95}
          />
          <text x={p.x} y={rowY(p.row) + TRACK_H / 2 + 22} textAnchor="middle" className="track-time">{p.time.slice(5, 16)}</text>
        </g>
      ))}

      {/* 时间流转箭头 */}
      {renderEdges()}


      {/* 业务节点卡片：配色改为按环节状态（待处理蓝 / 审核不通过红 / 审核通过绿），不再区分前置 / 核心 / 变更 / 终止 */}
      {positions.map((p) => {
        const tStyle = TRACK_STATUS_STYLE[trackNodeStatus(p.status, stageStatus)];
        const isSelected = selectedKey === p.key + '-' + p.idx;
        const isCurrent = p.status === 'current';
        const badge = ['shelf', 'unshelf', 'change'].includes(p.key) && (p.seq || 1) > 1;
        return (
          <g
            key={'card-' + p.idx}
            className={'track-card-g' + (isSelected ? ' selected' : '') + (isCurrent ? ' is-current' : '')}
            transform={'translate(' + (p.x - NODE_W / 2) + ', ' + (p.y - NODE_H / 2) + ')'}
            onClick={() => onNodeClick && onNodeClick(p)}
            style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
          >
            <title>{p.label + '（' + p.time + '）'}</title>
            <rect
              width={NODE_W}
              height={NODE_H}
              rx={12}
              fill="#ffffff"
              stroke={isSelected || isCurrent ? tStyle.accent : '#dfe6ef'}
              strokeWidth={isSelected || isCurrent ? 3 : 1.5}
            />
            <rect width={NODE_W} height={6} rx={3} fill={tStyle.accent} />
            <text x={14} y={32} className="track-card-index" fill={tStyle.accent}>{p.no}</text>
            <text x={NODE_W / 2} y={56} textAnchor="middle" className="track-card-name">{clipText(p.label, 6)}</text>
            <text x={NODE_W / 2} y={80} textAnchor="middle" className="track-card-time">{p.time.slice(5, 16)}</text>
            <text x={NODE_W / 2} y={80} textAnchor="middle" className="track-card-cat" fill={tStyle.accent}>{trackNodeStatus(p.status, stageStatus)}</text>
            {badge && (
              <g transform={'translate(' + (NODE_W - 24) + ', 16)'}>
                <circle r={12} fill={tStyle.accent} />
                <text x={0} y={5} textAnchor="middle" className="track-badge">×{p.seq}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------- 鸟瞰缩略小地图 ---------------- */

interface MinimapProps {
  layout: TrackLayout;
  transform: { x: number; y: number; scale: number };
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onNavigate: (t: { x: number; y: number; scale: number }) => void;
  stageStatus?: string;
}

const LifecycleMinimap = ({ layout, transform, canvasRef, onNavigate, stageStatus }: MinimapProps) => {
  const mmRef = useRef<SVGSVGElement>(null);
  const mmScale = MM_W / layout.DESIGN_W;
  const mmH = layout.DESIGN_H * mmScale;
  const draggingRef = useRef(false);

  const navigateTo = useCallback(
    (clientX: number, clientY: number) => {
      const svg = mmRef.current;
      const cont = canvasRef.current;
      if (!svg || !cont) return;
      const r = svg.getBoundingClientRect();
      const cx = (clientX - r.left) / mmScale;
      const cy = (clientY - r.top) / mmScale;
      const cr = cont.getBoundingClientRect();
      const s = transform.scale;
      onNavigate({ x: cr.width / 2 - cx * s, y: cr.height / 2 - cy * s, scale: s });
    },
    [mmScale, canvasRef, onNavigate, transform.scale]
  );

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;
      navigateTo(e.clientX, e.clientY);
    },
    [navigateTo]
  );

  const onUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  }, [onMove]);

  const onDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.stopPropagation();
      draggingRef.current = true;
      navigateTo(e.clientX, e.clientY);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [navigateTo, onMove, onUp]
  );

  const vx0 = -transform.x / transform.scale;
  const vy0 = -transform.y / transform.scale;
  const vw0 = (canvasRef.current?.getBoundingClientRect().width || 800) / transform.scale;
  const vh0 = (canvasRef.current?.getBoundingClientRect().height || 600) / transform.scale;
  const mmVX = Math.max(0, vx0) * mmScale;
  const mmVY = Math.max(0, vy0) * mmScale;
  const mmVW = Math.min(vw0, layout.DESIGN_W - Math.max(0, vx0)) * mmScale;
  const mmVH = Math.min(vh0, layout.DESIGN_H - Math.max(0, vy0)) * mmScale;

  return (
    <div className="life-minimap" onWheel={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <div className="life-minimap-title">鸟瞰缩略图</div>
      <svg
        ref={mmRef}
        className="life-minimap-svg"
        width={MM_W}
        height={mmH}
        viewBox={'0 0 ' + layout.DESIGN_W + ' ' + layout.DESIGN_H}
        onPointerDown={onDown}
      >
        <rect x={0} y={0} width={layout.DESIGN_W} height={layout.DESIGN_H} fill="#f4f7fb" stroke="#d4dde9" strokeWidth={2} />
        {layout.folds.map((f) => (
          <rect key={'mf-' + f.fromIdx} x={f.x - TRACK_H / 2} y={f.yTop} width={TRACK_H} height={f.yBottom - f.yTop} fill="#e7edf5" />
        ))}
        {layout.positions.map((p) => (
          <rect key={'mn-' + p.idx} x={p.x - NODE_W / 2} y={p.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={6} fill={TRACK_STATUS_STYLE[trackNodeStatus(p.status, stageStatus)].accent} opacity={0.55} />
        ))}
        <rect
          className="life-minimap-viewport"
          x={mmVX}
          y={mmVY}
          width={mmVW}
          height={mmVH}
        />
      </svg>
    </div>
  );
};

/* ---------------- 发起 / 审批信息（复用生命周期逻辑，仅展示已执行阶段） ---------------- */

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
  const effStatus =
    node.status === 'current' ? record.stageStatus : node.status === 'rejected' ? '已驳回' : '已完成';
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

/* ---------------- 画布平移 / 缩放状态 ---------------- */

const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const WHEEL_SENSITIVITY = 0.0016;
const DRAG_THRESHOLD = 4;

interface PanTransform {
  x: number;
  y: number;
  scale: number;
}

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

/* ---------------- 跑道时间轴主视图（「运营周期」视图复用的完整内容） ---------------- */

/**
 * 「生命周期1」完整主内容：蛇形回折跑道时间轴画布（平移 / 缩放 / 重置）、
 * 右下角缩放工具栏与鸟瞰缩略小地图、节点点击抽屉（发起信息 / 审批信息）。
 * 独立整页「生命周期1」与「生命周期」页「运营周期」视图共用本组件，保证两处内容完全一致。
 */
export const LifecycleTrackView = ({ record }: { record: LifecycleRecord }) => {
  // 第一条数据（列表按更新时间倒序后的首行）使用固定的 20 步演示数据
  const firstRecordCode = useMemo(() => {
    const sorted = [...seedRecords].sort((a, b) => b.updateTime.localeCompare(a.updateTime));
    return sorted[0]?.productCode || '';
  }, []);
  const isFixedDemo = record.productCode === firstRecordCode || record.productCode === 'DP430300202602019';
  const effectiveRecord: LifecycleRecord = useMemo(() => {
    if (!isFixedDemo) return record;
    return { ...record, currentStage: '撤销', stageStatus: '已完成' };
  }, [record, isFixedDemo]);
  const nodes = useMemo<LinearNode[]>(
    () => (isFixedDemo ? buildFixedDemoNodes(effectiveRecord) : buildLinearNodes(effectiveRecord)),
    [effectiveRecord, isFixedDemo]
  );
  const layout = useMemo<TrackLayout>(() => computeTrackLayout(nodes), [nodes]);

  const [selectedNode, setSelectedNode] = useState<LinearNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<PanTransform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef<PanTransform>(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  const setBoth = useCallback((t: PanTransform) => {
    transformRef.current = t;
    setTransform(t);
  }, []);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panStateRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const dragMovedRef = useRef(false);

  /** 适配容器：等比缩放并居中设计稿 */
  const fitView = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const scale = Math.min(rect.width / layout.DESIGN_W, rect.height / layout.DESIGN_H);
    const x = (rect.width - layout.DESIGN_W * scale) / 2;
    const y = (rect.height - layout.DESIGN_H * scale) / 2;
    setBoth({ x, y, scale: clampScale(scale) });
  }, [setBoth, layout]);

  useEffect(() => {
    const id = window.setTimeout(fitView, 60);
    window.addEventListener('resize', fitView);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', fitView);
    };
  }, [fitView]);

  const applyZoom = useCallback((factor: number, anchorX: number, anchorY: number) => {
    const prev = transformRef.current;
    const newScale = clampScale(prev.scale * factor);
    if (newScale === prev.scale) return;
    const ratio = newScale / prev.scale;
    const x = anchorX - (anchorX - prev.x) * ratio;
    const y = anchorY - (anchorY - prev.y) * ratio;
    setBoth({ x, y, scale: newScale });
  }, [setBoth]);

  useEffect(() => {
    const el = canvasRef.current;
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
    }
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
    }
  }, [setBoth]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) {
      panStateRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    }
  }, [handlePointerMove]);

  const zoomByButton = useCallback((factor: number) => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    applyZoom(factor, rect.width / 2, rect.height / 2);
  }, [applyZoom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'r' || e.key === 'R') {
        fitView();
      } else if (e.key === '+' || e.key === '=') {
        zoomByButton(1.2);
      } else if (e.key === '-' || e.key === '_') {
        zoomByButton(1 / 1.2);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fitView, zoomByButton]);

  const handleNodeClick = useCallback((node: LinearNode) => {
    if (dragMovedRef.current) return;
    setSelectedNode(node);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedNode(null), 220);
  };

  const party = selectedNode ? buildStagePartyInfo(effectiveRecord, selectedNode) : null;

  return (
    <>
      <div className="lineage-canvas-fullscreen" ref={canvasRef}>
          <div
            className="lineage-viewport"
            onPointerDown={onPointerDown}
            style={{ transform: 'translate(' + transform.x + 'px, ' + transform.y + 'px) scale(' + transform.scale + ')' }}
          >
            <TrackLifecycleGraph
              layout={layout}
              stageStatus={effectiveRecord.stageStatus}
              onNodeClick={handleNodeClick}
              selectedKey={selectedNode ? selectedNode.key + '-' + nodes.findIndex((n) => n === selectedNode) : null}
            />
          </div>

          <div className="lineage-view-tools">
            <button className="lineage-view-btn" onClick={() => zoomByButton(1.2)} title="放大" aria-label="放大">＋</button>
            <div className="lineage-view-zoom">{Math.round(transform.scale * 100)}%</div>
            <button className="lineage-view-btn" onClick={() => zoomByButton(1 / 1.2)} title="缩小" aria-label="缩小">－</button>
            <button className="lineage-view-btn lineage-view-reset" onClick={fitView} title="重置视图（快捷键 R）" aria-label="重置视图">⟳</button>
          </div>

          <LifecycleMinimap layout={layout} transform={transform} canvasRef={canvasRef} onNavigate={setBoth} stageStatus={effectiveRecord.stageStatus} />
        </div>

        {drawerOpen && <div className="lineage-drawer-mask" onClick={closeDrawer} />}
        <aside className={'life-drawer ' + (drawerOpen ? 'open' : '') + (selectedNode?.key === 'trade' ? ' trade-wide' : '')}>
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
                  <span className={'status-tag ' + (selectedNode.status === 'current' ? getStageStatusClass(record.stageStatus) : selectedNode.status === 'rejected' ? getStageStatusClass('已驳回') : 'status-approved')} style={{ display: 'none' }}>
                    {selectedNode.status === 'current' ? record.stageStatus : selectedNode.status === 'rejected' ? '已驳回' : '已完成'}
                  </span>
                </div>

                {selectedNode.key === 'trade' ? (
                  <>
                    <div className="timeline-block trade-stats-block">
                      <div className="timeline-block-title">交易统计</div>
                      <div className="timeline-fields">
                        <div className="timeline-field"><span className="timeline-field-label">产品提供方</span><span className="timeline-field-value">湖南数据产业集团有限公司</span></div>
                        <div className="timeline-field"><span className="timeline-field-label">调用成功次数（次）</span><span className="timeline-field-value">12,684,500</span></div>
                        <div className="timeline-field"><span className="timeline-field-label">订单总额（元）</span><span className="timeline-field-value">45,365,700</span></div>
                      </div>
                    </div>

                    <div className="timeline-block">
                      <div className="timeline-block-title">订单信息</div>
                      <table className="life-orders-table">
                        <thead>
                          <tr>
                            <th style={{ width: 48 }}>序号</th>
                            <th>订单编号</th>
                            <th>数据需求方</th>
                            <th>订单状态</th>
                            <th>更新时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>1</td>
                            <td>CPDY2026090900000002</td>
                            <td>湖南乐途科技有限公司</td>
                            <td><span className="audit-tag audit-pass">已完成</span></td>
                            <td>2026-06-05 14:20:15</td>
                          </tr>
                          <tr>
                            <td>2</td>
                            <td>CPDY2026090900000003</td>
                            <td>湖南天河国云科技有限公司</td>
                            <td><span className="audit-tag audit-pass">已完成</span></td>
                            <td>2026-06-01 09:30:22</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : party ? (
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

              </div>
            </div>
          )}
        </aside>
    </>
  );
};

/* ---------------- 页面 ---------------- */

const OriginalComponent = () => {
  const code = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || '';
  }, []);

  const record: LifecycleRecord | undefined = useMemo(() => getRecordByCode(code), [code]);

  // 顶栏所需：第一条数据（列表按更新时间倒序后的首行）固定演示数据时，当前阶段覆盖为「撤销」
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

  const currentStageLabel = effectiveRecord
    ? effectiveRecord.currentStage === '产品上架' || effectiveRecord.currentStage === '产品下架'
      ? '产品上下架'
      : CURRENT_MAP[effectiveRecord.currentStage]
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

  const renderContent = () => {
    if (!record || !effectiveRecord) return null;
    return (
      <div className="life-graph-fullscreen">
        <div className="life-graph-topbar">
          <a className="lineage-back" href={LIST_PAGE_URL}>
            <span className="lineage-back-arrow">‹</span>
            返回产品生命周期
          </a>
          <div className="life-graph-title">生命周期1</div>
          <div className="life-graph-summary">
            <span className="life-summary-code" title={effectiveRecord.productCode}>{effectiveRecord.productCode}</span>
            <span className="life-summary-sep">·</span>
            <span className="life-summary-name" title={effectiveRecord.productName}>{effectiveRecord.productName}</span>
            <span className="life-summary-tag">当前阶段：{currentStageLabel}</span>
          </div>
          <div className="life-graph-legend" style={{ display: 'none' }}>
            {(['待处理', '审核不通过', '审核通过'] as const).map((st) => {
              const s = TRACK_STATUS_STYLE[st];
              return (
                <span key={st} className="lineage-legend-item">
                  <i className="lineage-legend-swatch" style={{ background: s.fill, borderColor: s.stroke }} />
                  {st}
                </span>
              );
            })}
          </div>
        </div>

        <LifecycleTrackView record={record} />
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

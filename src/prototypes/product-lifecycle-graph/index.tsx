/**
 * @name 生命周期（独立整页）
 * @mode axure
 *
 * 由「产品生命周期」列表页「生命周期」按钮跳转进入的独立整页。
 * 通过 URL 参数 ?code=数据产品标识码 定位记录，以「运营周期 / 操作记录」双视图展示产品生命周期；
 * 提供阶段状态、运营周期（上架 / 下架区间）与操作记录等信息，点击节点从右侧滑出抽屉展示阶段说明。
 * 交互与展示方式参照「数据血缘」独立整页（节点抽屉、返回入口）。
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../../common/Layout';
import PasswordGuard from '../../common/PasswordGuard';
import {
  LifecycleRecord,
  getRecordByCode,
  getStageStatusClass
} from '../product-lifecycle/lifecycle-shared';
import '../product-lifecycle/style.css';
import '../product-lifecycle-lineage/lineage-style.css';
import '../../common/backend-list.css';
import './graph-style.css';
import { LifecycleTrackView, TRACK_STATUS_STYLE } from '../product-lifecycle-graph1/index';
import '../product-lifecycle-graph1/graph1-style.css';

const LIST_PAGE_URL = '/prototypes/product-lifecycle.html';

/* 画布平移 / 缩放参数 */
const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const WHEEL_SENSITIVITY = 0.0016;
const DRAG_THRESHOLD = 4;

/** 设计坐标系尺寸（SVG 固定设计稿，由画布变换适配容器） */
const DESIGN_W = 1340;
const DESIGN_H = 480;

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

/* ---------------- 生命周期阶段模型 ---------------- */

type StageCat = 'pre' | 'core' | 'loop' | 'end';
type StageStatus = 'done' | 'current' | 'future' | 'change-done' | 'available';

interface FlowStage {
  key: string;
  label: string;
  cat: StageCat;
  desc: string;
  org: string;
}

const STAGES: FlowStage[] = [
  {
    key: 'dev',
    label: '开发',
    cat: 'pre',
    org: '产品运营机构',
    desc: '数据提供方或运营机构完成数据产品的需求设计、数据加工与接口 / 数据集封装，形成可交付的产品雏形。'
  },
  {
    key: 'catalog',
    label: '编目',
    cat: 'pre',
    org: '数据提供方',
    desc: '将开发完成的产品按统一元数据标准进行编目，录入数据资源 / 产品目录，形成可检索的资产条目。'
  },
  {
    key: 'review',
    label: '安全审查',
    cat: 'core',
    org: '数据管理部门',
    desc: '数据管理部门对产品开展合规性与安全性审查，审查通过后进入登记环节；不通过则退回修改后重新提交。'
  },
  {
    key: 'register',
    label: '登记',
    cat: 'core',
    org: '运营机构',
    desc: '运营机构对通过审查的产品进行登记赋码，确立产品的合法运营身份与资产编号。'
  },
  {
    key: 'shelf',
    label: '上架',
    cat: 'core',
    org: '运营机构',
    desc: '登记完成的产品在运营平台正式上架，对外提供订阅、调用与交付能力。'
  },
  {
    key: 'trade',
    label: '交易',
    cat: 'core',
    org: '运营机构 / 需求方',
    desc: '产品上架后，数据需求方发起订阅 / 调用，形成交易与交付记录，是产品价值兑现环节。'
  },
  {
    key: 'change',
    label: '变更',
    cat: 'loop',
    org: '产品运营机构',
    desc: '对已登记 / 上架的产品发起变更（内容、接口、资费、范围等）。变更可发生在登记、上架或交易之后，需重新经过安全审查与登记后方可再次上架，同一产品可反复多次变更。'
  },
  {
    key: 'unshelf',
    label: '下架',
    cat: 'core',
    org: '运营机构',
    desc: '因业务调整、合规要求或产品终止，运营机构将产品从平台下架，停止对外提供服务。'
  },
  {
    key: 'revoke',
    label: '撤销',
    cat: 'end',
    org: '数据管理部门 / 运营机构',
    desc: '产品在登记之后彻底退出运营，注销登记与资产条目，不可恢复。撤销后不再有上架、交易环节，是生命周期的终止分支。'
  }
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

/** 列表记录当前阶段 → 图谱主干阶段 映射 */
const CURRENT_MAP: Record<string, string> = {
  安全审查: 'review',
  产品登记: 'register',
  产品上架: 'shelf',
  产品交易: 'trade',
  产品下架: 'unshelf'
};

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


/** 由记录推导「变更」发生次数（稳定可复现，0~3） */
const deriveChangeCount = (record: LifecycleRecord): number => record.id % 4;

/** 依据记录当前阶段推导各节点状态 */
const buildStatusMap = (record: LifecycleRecord, changeCount: number): Record<string, StageStatus> => {
  const currentKey = CURRENT_MAP[record.currentStage] || 'review';
  const currentIndex = STAGE_INDEX[currentKey] ?? 2;
  const map: Record<string, StageStatus> = {};
  STAGES.forEach((s) => {
    if (s.cat === 'pre') {
      map[s.key] = 'done';
    } else if (s.cat === 'loop') {
      // 变更可在登记 / 上架 / 交易之后发起；已发生则标记为已多次变更
      if (changeCount > 0) map[s.key] = 'change-done';
      else if (currentIndex >= STAGE_INDEX.register) map[s.key] = 'available';
      else map[s.key] = 'future';
    } else if (s.cat === 'end') {
      // 撤销发生在登记之后（本产品尚未撤销，故为可进行状态）
      map[s.key] = currentIndex >= STAGE_INDEX.register ? 'available' : 'future';
    } else {
      const idx = STAGE_INDEX[s.key];
      if (idx < currentIndex) map[s.key] = 'done';
      else if (idx === currentIndex) map[s.key] = 'current';
      else map[s.key] = 'future';
    }
  });
  return map;
};

/* ---------------- 阶段「发起信息 / 审批信息」（参照时间轴的表现方式） ---------------- */

/** 参与「发起信息 / 审批信息」两方记录的阶段 */
const APPROVAL_STAGES = ['review', 'register', 'shelf', 'trade', 'unshelf', 'change', 'revoke'];

const HANDLER_POOL = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵磊'];
const AUDIT_ORG_NAME = '湖南省公共数据运营中心';

interface StagePartyInfo {
  /** 是否展示「审批信息」块（开发 / 编目无审批环节） */
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

const hashStr = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);

/** 由记录与阶段序号稳定派生操作时间（yyyy-MM-dd HH:mm:ss） */
const deriveStageTime = (record: LifecycleRecord, orderNo: number, offsetMonths: number): string => {
  const baseMonth = Number(record.updateTime.slice(5, 7)) || 8;
  const abs = 2026 * 12 + (baseMonth - 1) - Math.max(0, offsetMonths);
  const year = Math.floor(abs / 12);
  const month = (abs % 12) + 1;
  const day = ((record.id * 7 + orderNo * 5) % 27) + 1;
  const hh = 8 + ((record.id + orderNo) % 10);
  const mm = (record.id * 11 + orderNo * 7) % 60;
  const ss = (record.id * 29 + orderNo * 13) % 60;
  return year + '-' + pad2(month) + '-' + pad2(day) + ' ' + pad2(hh) + ':' + pad2(mm) + ':' + pad2(ss);
};

/** 生成某一阶段的「发起信息 / 审批信息」；尚未发生的阶段返回 null */
const buildStagePartyInfo = (
  record: LifecycleRecord,
  stage: FlowStage,
  status: StageStatus,
  currentIndex: number
): StagePartyInfo | null => {
  const occurred =
    stage.cat === 'pre' || status === 'done' || status === 'current' || status === 'change-done';
  if (!occurred) return null;

  const orderNo = stage.key === 'change' ? STAGE_INDEX.shelf : STAGE_INDEX[stage.key] ?? 0;
  const time = deriveStageTime(record, orderNo + 1, currentIndex - orderNo);

  const seed = hashStr(record.productCode + '|' + stage.key);
  const pick = (salt: number) => HANDLER_POOL[(seed + salt) % HANDLER_POOL.length];

  const effStatus = status === 'current' ? record.stageStatus : '已完成';
  const passed = effStatus === '已完成';
  const rejected = effStatus === '已驳回';

  return {
    withApproval: APPROVAL_STAGES.includes(stage.key),
    org: record.provider,
    handler: pick(1),
    time: time,
    auditOrg: AUDIT_ORG_NAME,
    auditHandler: pick(4),
    auditResult: passed ? '审核通过' : rejected ? '审核不通过' : '—',
    auditOpinion: passed ? '通过' : rejected ? '材料不符合要求已被驳回，请修改后重新提交' : '—',
    auditTime: passed || rejected ? time : '—'
  };
};

/** 阶段状态标签文案与配色 */
const buildStageTag = (
  stage: FlowStage,
  status: StageStatus,
  changeCount: number,
  record: LifecycleRecord
): { text: string; cls: string } => {
  if (stage.key === 'change') {
    if (changeCount > 0) return { text: '已变更 ' + changeCount + ' 次', cls: 'status-processing' };
    if (status === 'available') return { text: '可进行', cls: 'status-pending' };
    return { text: '未开始', cls: 'status-frozen' };
  }
  if (status === 'current') return { text: record.stageStatus, cls: getStageStatusClass(record.stageStatus) };
  if (status === 'done') return { text: '已完成', cls: 'status-approved' };
  if (status === 'available') return { text: '可进行', cls: 'status-pending' };
  return { text: '未开始', cls: 'status-frozen' };
};

/* ---------------- 操作记录视图（7 环节切换 + 操作记录列表） ---------------- */

/** 操作记录视图覆盖的 7 个环节 key（固定顺序：开发、编目、安全审查、登记、上架、交易、下架） */
const RECORD_STAGE_KEYS = ['dev', 'catalog', 'review', 'register', 'shelf', 'trade', 'unshelf'];

/** 操作记录视图覆盖的 7 个环节（按 STAGES 定义顺序过滤，保证固定顺序） */
const RECORD_STAGES: FlowStage[] = STAGES.filter((s) => RECORD_STAGE_KEYS.indexOf(s.key) >= 0);

interface StageOpRecord {
  seq: number;
  time: string;
  handler: string;
  org: string;
  auditOpinion: string;
  auditResult: string;
}

/**
 * 生成某一环节的操作记录列表（稳定可复现）。
 * 上架 / 下架按运营周期次数生成多条（第 N 次），其余环节各 1 条；尚未发生的环节返回空数组。
 * 开发 / 编目无审批环节，审核结果与审核意见展示占位说明。
 */
const buildStageOpRecords = (
  record: LifecycleRecord,
  stage: FlowStage,
  status: StageStatus,
  currentIndex: number,
  serviceCycles: { shelfCount: number; unshelfCount: number }
): StageOpRecord[] => {
  const occurred =
    stage.cat === 'pre' || status === 'done' || status === 'current' || status === 'change-done';
  if (!occurred) return [];

  const orderNo = STAGE_INDEX[stage.key] ?? 0;
  const count =
    stage.key === 'shelf'
      ? Math.max(1, serviceCycles.shelfCount)
      : stage.key === 'unshelf'
        ? Math.max(1, serviceCycles.unshelfCount)
        : 1;

  const seed = hashStr(record.productCode + '|' + stage.key);
  const withApproval = APPROVAL_STAGES.includes(stage.key);
  const effStatus = status === 'current' ? record.stageStatus : '已完成';

  const list: StageOpRecord[] = [];
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    // 当前进行中的环节：仅最后一次操作取当前阶段状态，此前各次均为已完成
    const itemStatus = isLast ? effStatus : '已完成';
    const passed = itemStatus === '已完成';
    const rejected = itemStatus === '已驳回';
    list.push({
      seq: i + 1,
      time: deriveStageTime(record, orderNo + 1 + i, Math.max(0, currentIndex - orderNo - i)),
      handler: HANDLER_POOL[(seed + 1 + i * 3) % HANDLER_POOL.length],
      org: record.provider,
      auditResult: !withApproval ? '—' : passed ? '审核通过' : rejected ? '审核不通过' : '—',
      auditOpinion: !withApproval
        ? '本环节无审批环节'
        : passed
          ? '通过'
          : rejected
            ? '材料不符合要求已被驳回，请修改后重新提交'
            : '—'
    });
  }
  return list;
};

/** 「操作记录」视图：顶部 7 个环节固定顺序横向切换，下方展示对应环节的操作记录列表 */
const StageRecordsView = ({
  record,
  statusMap,
  currentIndex,
  serviceCycles
}: {
  record: LifecycleRecord;
  statusMap: Record<string, StageStatus>;
  currentIndex: number;
  serviceCycles: { shelfCount: number; unshelfCount: number };
}) => {
  const [activeKey, setActiveKey] = useState<string>(RECORD_STAGES[0].key);
  const activeStage = RECORD_STAGES.find((s) => s.key === activeKey) || RECORD_STAGES[0];
  const status = statusMap[activeStage.key] || 'future';
  const records = useMemo(
    () => buildStageOpRecords(record, activeStage, status, currentIndex, serviceCycles),
    [record, activeStage, status, currentIndex, serviceCycles]
  );

  return (
    <div className="life-records">
      {/* 环节流程图：按业务流转顺序排列节点，连线箭头体现方向；已完成 / 进行中正常醒目，未流转弱化；点击节点切换下方操作记录列表 */}
      <div className="life-records-flow">
        {RECORD_STAGES.map((s, i) => {
          const st = statusMap[s.key] || 'future';
          const occurred = s.cat === 'pre' || st === 'done' || st === 'current' || st === 'change-done';
          const style = CAT_STYLE[s.cat];
          const isActive = s.key === activeKey;
          const prevOccurred =
            i === 0 ||
            (() => {
              const p = RECORD_STAGES[i - 1];
              const pst = statusMap[p.key] || 'future';
              return p.cat === 'pre' || pst === 'done' || pst === 'current' || pst === 'change-done';
            })();
          return (
            <Fragment key={s.key}>
              {i > 0 && (
                <span className={'life-flow-arrow' + (prevOccurred && occurred ? ' on' : '')} aria-hidden="true">
                  <svg width="36" height="12" viewBox="0 0 36 12">
                    <line x1="0" y1="6" x2="26" y2="6" strokeWidth="2" />
                    <polygon points="25,1 36,6 25,11" />
                  </svg>
                </span>
              )}
              <button
                className={
                  'life-flow-node' +
                  (occurred ? ' occurred' : ' future') +
                  (st === 'current' ? ' current' : '') +
                  (isActive ? ' active' : '')
                }
                style={
                  occurred
                    ? {
                        background: style.fill,
                        borderColor: st === 'current' ? style.accent : style.stroke,
                        borderWidth: st === 'current' ? 2 : 1
                      }
                    : undefined
                }
                onClick={() => setActiveKey(s.key)}
              >
                <span className="life-flow-node-no" style={occurred ? { background: style.accent } : undefined}>
                  {i + 1}
                </span>
                <span className="life-flow-node-text">
                  <span className="life-flow-node-label" style={occurred ? { color: style.accent } : undefined}>
                    {s.label}
                  </span>
                  <span className="life-flow-node-cat">{CAT_LABEL[s.cat]}</span>
                </span>
              </button>
            </Fragment>
          );
        })}
      </div>

      {records.length === 0 ? (
        <div className="life-records-empty">
          <div className="empty-state-icon">📭</div>
          <p className="life-cycles-empty-text">当前环节暂无操作记录（该环节尚未发生）。</p>
        </div>
      ) : (
        <div className="life-records-table-wrap">
          <table className="life-cycles-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>序号</th>
                <th>操作时间</th>
                <th>法人经办人姓名</th>
                <th>单位名称</th>
                <th>审核意见</th>
                <th>审核结果</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.seq}>
                  <td>{r.seq}</td>
                  <td className="life-cycle-mono">{r.time}</td>
                  <td>{r.handler}</td>
                  <td>{r.org}</td>
                  <td>{r.auditOpinion}</td>
                  <td>
                    <span
                      className={
                        'life-record-result ' +
                        (r.auditResult === '审核通过' ? 'pass' : r.auditResult === '审核不通过' ? 'reject' : 'none')
                      }
                    >
                      {r.auditResult}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ---------------- 运营周期（多次上架 / 下架 / 再上架循环） ---------------- */

export interface ServiceCycle {
  /** 第几次（按时间顺序 1 起） */
  seq: number;
  type: 'shelf' | 'unshelf';
  /** 起始日期 yyyy-MM-dd */
  start: string;
  /** 结束日期；null 表示当前仍在进行（在售 / 停售中） */
  end: string | null;
  status: 'done' | 'current';
  /** 持续天数；进行中时为已持续天数 */
  durationDays: number;
}

type CycleState = 'none' | 'selling' | 'suspended';

/** 线性同余伪随机（由种子派生，稳定可复现） */
const cycleRand = (seed: number) => {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const addDays = (base: Date, days: number): Date => {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
};

const fmtDate = (d: Date): string => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());

/**
 * 由记录推导「运营周期」：产品在登记上架后可能经历多次「上架 → 下架 → 再上架」循环。
 * 妥善处理的状态切换：在售（上架中）、停售（下架中）、未上架、单次上架无下架、多次循环。
 * 时间区间稳定可复现（由标识码派生），并妥善处理当前进行中的开放区间。
 */
const buildServiceCycles = (
  record: LifecycleRecord,
  currentIndex: number
): { cycles: ServiceCycle[]; shelfCount: number; unshelfCount: number; currentState: CycleState } => {
  const shelfIdx = STAGE_INDEX.shelf;
  if (currentIndex < shelfIdx) {
    // 尚未上架：无运营周期
    return { cycles: [], shelfCount: 0, unshelfCount: 0, currentState: 'none' };
  }

  // 额外再上架轮次（0~2）：体现「再上架」循环的次数差异
  const rounds = record.id % 3;
  const shelfCount = rounds + 1;
  const stageKey = CURRENT_MAP[record.currentStage] || 'shelf';
  const openShelf = stageKey === 'shelf' || stageKey === 'trade';
  const openUnshelf = stageKey === 'unshelf';
  const unshelfCount = openUnshelf ? rounds + 1 : rounds;

  // 按时间顺序构造「上架 / 下架」交替序列，末位为当前进行中的开放区间
  const order: { type: 'shelf' | 'unshelf'; open: boolean }[] = [];
  for (let i = 0; i < shelfCount; i++) {
    order.push({ type: 'shelf', open: openShelf && i === shelfCount - 1 });
    if (i < unshelfCount) order.push({ type: 'unshelf', open: openUnshelf && i === unshelfCount - 1 });
  }

  const seed = hashStr(record.productCode + '|cycles');
  const rand = cycleRand(seed);
  const shelfDur = () => 70 + Math.floor(rand() * 160); // 70~230 天
  const unshelfDur = () => 25 + Math.floor(rand() * 95); // 25~120 天
  const durations = order.map((o) => (o.type === 'shelf' ? shelfDur() : unshelfDur()));
  const sumClosed = durations.reduce((a, d, i) => a + (order[i].open ? 0 : d), 0);
  const openDur = order.some((o) => o.open) ? 35 + Math.floor(rand() * 65) : 0;

  const baseDate = new Date(
    Number(record.updateTime.slice(0, 4)),
    Number(record.updateTime.slice(5, 7)) - 1,
    Number(record.updateTime.slice(8, 10))
  );
  const firstStart = addDays(baseDate, -(sumClosed + openDur));

  const cycles: ServiceCycle[] = [];
  let cursor = firstStart;
  let seq = 0;
  for (let i = 0; i < order.length; i++) {
    seq++;
    const o = order[i];
    const start = cursor;
    if (o.open) {
      const elapsed = Math.max(1, Math.round((baseDate.getTime() - start.getTime()) / 86400000));
      cycles.push({ seq, type: o.type, start: fmtDate(start), end: null, status: 'current', durationDays: elapsed });
    } else {
      const dur = durations[i];
      const end = addDays(start, dur);
      cycles.push({ seq, type: o.type, start: fmtDate(start), end: fmtDate(end), status: 'done', durationDays: dur });
      cursor = end;
    }
  }

  const currentState: CycleState = openShelf ? 'selling' : openUnshelf ? 'suspended' : 'none';
  return { cycles, shelfCount, unshelfCount, currentState };
};


/* ---------------- 页面 ---------------- */

const OriginalComponent = () => {
  const code = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || '';
  }, []);

  const record: LifecycleRecord | undefined = useMemo(() => getRecordByCode(code), [code]);
  const changeCount = useMemo(() => (record ? deriveChangeCount(record) : 0), [record]);
  const statusMap = useMemo<Record<string, StageStatus>>(
    () => (record ? buildStatusMap(record, changeCount) : {}),
    [record, changeCount]
  );

  /** 当前阶段在主干中的序号（用于推导各阶段操作时间） */
  const currentIndex = useMemo(() => {
    if (!record) return 2;
    const key = CURRENT_MAP[record.currentStage] || 'review';
    return STAGE_INDEX[key] ?? 2;
  }, [record]);

  /** 运营周期：多次上架 / 下架 / 再上架的区间与先后顺序 */
  const serviceCycles = useMemo(
    () => (record ? buildServiceCycles(record, currentIndex) : { cycles: [], shelfCount: 0, unshelfCount: 0, currentState: 'none' as CycleState }),
    [record, currentIndex]
  );

  /** 视图切换：运营周期 / 操作记录 */
  const [viewMode, setViewMode] = useState<'cycles' | 'records'>('cycles');

  const [selectedStage, setSelectedStage] = useState<FlowStage | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* 画布平移 / 缩放状态 */
  const canvasRef = useRef<HTMLDivElement>(null);
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
  const dragMovedRef = useRef(false);

  /** 适配容器：等比缩放并居中设计稿 */
  const fitView = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const scale = Math.min(rect.width / DESIGN_W, rect.height / DESIGN_H);
    const x = (rect.width - DESIGN_W * scale) / 2;
    const y = (rect.height - DESIGN_H * scale) / 2;
    setBoth({ x, y, scale: clampScale(scale) });
  }, [setBoth]);

  useEffect(() => {
    const id = window.setTimeout(fitView, 60);
    window.addEventListener('resize', fitView);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', fitView);
    };
  }, [fitView, record]);

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

  const handleStageClick = (stage: FlowStage) => {
    if (dragMovedRef.current) return;
    setSelectedStage(stage);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedStage(null), 220);
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

  const currentStageLabel = record ? (CURRENT_MAP[record.currentStage] ? STAGES.find((s) => s.key === CURRENT_MAP[record.currentStage])?.label : record.currentStage) : '';

  /* 抽屉内容（参照时间轴：发起信息 / 审批信息） */
  const drawerStatus: StageStatus = selectedStage ? statusMap[selectedStage.key] || 'future' : 'future';
  const drawerTag = selectedStage && record ? buildStageTag(selectedStage, drawerStatus, changeCount, record) : null;
  const drawerParty = selectedStage && record ? buildStagePartyInfo(record, selectedStage, drawerStatus, currentIndex) : null;
  const drawerStageNo = selectedStage
    ? selectedStage.key === 'change'
      ? '↻'
      : String((STAGE_INDEX[selectedStage.key] ?? 0) + 1)
    : '';

  const renderContent = () => {
    if (!record) return null;
    return (
    <div className="life-graph-fullscreen">
      <div className="life-graph-topbar">
        <a className="lineage-back" href={LIST_PAGE_URL}>
          <span className="lineage-back-arrow">‹</span>
          返回产品生命周期
        </a>
        <div className="life-graph-title">生命周期</div>
        <div className="life-graph-summary">
          <span className="life-summary-code" title={record?.productCode}>{record?.productCode}</span>
          <span className="life-summary-sep">·</span>
          <span className="life-summary-name" title={record?.productName}>{record?.productName}</span>
          <span className="life-summary-tag">当前阶段：{currentStageLabel}</span>
        </div>
        <div className="life-graph-viewswitch">
          <button
            className={'life-view-btn' + (viewMode === 'cycles' ? ' active' : '')}
            onClick={() => setViewMode('cycles')}
          >
            运营周期
          </button>
          <button
            className={'life-view-btn' + (viewMode === 'records' ? ' active' : '')}
            onClick={() => setViewMode('records')}
          >
            操作记录
          </button>
        </div>
        <div className="life-graph-legend">
          {viewMode === 'cycles' ? (
            (['待处理', '审核不通过', '审核通过'] as const).map((st) => {
              const s = TRACK_STATUS_STYLE[st];
              return (
                <span key={st} className="lineage-legend-item">
                  <i className="lineage-legend-swatch" style={{ background: s.fill, borderColor: s.stroke }} />
                  {st}
                </span>
              );
            })
          ) : (
            (['pre', 'core', 'loop', 'end'] as StageCat[]).map((cat) => {
              const style = CAT_STYLE[cat];
              return (
                <span key={cat} className="lineage-legend-item">
                  <i className="lineage-legend-swatch" style={{ background: style.fill, borderColor: style.stroke }} />
                  {CAT_LABEL[cat]}
                </span>
              );
            })
          )}
        </div>
      </div>

      {viewMode === 'cycles' ? (
        /* 运营周期视图：内容完整替换为「生命周期1」全部内容（复用其共享组件 LifecycleTrackView，保证与生命周期1完全一致；原甘特时间轴面板已整体移除，不保留任何原有内容） */
        <LifecycleTrackView record={record} />
      ) : (
        /* 操作记录视图：7 环节固定顺序切换 + 对应环节操作记录列表 */
        <StageRecordsView
          record={record}
          statusMap={statusMap}
          currentIndex={currentIndex}
          serviceCycles={serviceCycles}
        />
      )}

      {drawerOpen && <div className="lineage-drawer-mask" onClick={closeDrawer} />}
      <aside className={'life-drawer ' + (drawerOpen ? 'open' : '')}>
        <div className="lineage-drawer-header">
          <h3>{selectedStage ? selectedStage.label : '阶段说明'}</h3>
          <button className="lineage-drawer-close" onClick={closeDrawer} aria-label="关闭">×</button>
        </div>
        {selectedStage && drawerTag && (
          <div className="lineage-drawer-body">
            <div className={'timeline-item' + (drawerStatus === 'current' ? ' is-current' : '')}>
              <div className="timeline-head">
                <span className="timeline-index">{drawerStageNo}</span>
                <span className="timeline-stage">{selectedStage.label}</span>
                <span className={'status-tag ' + drawerTag.cls}>{drawerTag.text}</span>
              </div>

              {drawerParty ? (
                <>
                  <div className="timeline-block">
                    <div className="timeline-block-title">发起信息</div>
                    <div className="timeline-fields">
                      <div className="timeline-field">
                        <span className="timeline-field-label">单位名称</span>
                        <span className="timeline-field-value" title={drawerParty.org}>{drawerParty.org}</span>
                      </div>
                      <div className="timeline-field">
                        <span className="timeline-field-label">法人经办人姓名</span>
                        <span className="timeline-field-value">{drawerParty.handler}</span>
                      </div>
                      <div className="timeline-field">
                        <span className="timeline-field-label">操作时间</span>
                        <span className="timeline-field-value">{drawerParty.time}</span>
                      </div>
                    </div>
                  </div>

                  {drawerParty.withApproval && (
                    <div className="timeline-block">
                      <div className="timeline-block-title">审批信息</div>
                      <div className="timeline-fields">
                        <div className="timeline-field">
                          <span className="timeline-field-label">单位名称</span>
                          <span className="timeline-field-value" title={drawerParty.auditOrg}>{drawerParty.auditOrg}</span>
                        </div>
                        <div className="timeline-field">
                          <span className="timeline-field-label">法人经办人姓名</span>
                          <span className="timeline-field-value">{drawerParty.auditHandler}</span>
                        </div>
                        <div className="timeline-field">
                          <span className="timeline-field-label">审核结果</span>
                          <span className="timeline-field-value">
                            {drawerParty.auditResult === '审核通过' ? (
                              <span className="audit-tag audit-pass">审核通过</span>
                            ) : drawerParty.auditResult === '审核不通过' ? (
                              <span className="audit-tag audit-fail">审核不通过</span>
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>
                        <div className="timeline-field">
                          <span className="timeline-field-label">审核意见</span>
                          <span className="timeline-field-value" title={drawerParty.auditOpinion}>{drawerParty.auditOpinion}</span>
                        </div>
                        <div className="timeline-field">
                          <span className="timeline-field-label">操作时间</span>
                          <span className="timeline-field-value">{drawerParty.auditTime}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="timeline-block">
                  <div className="timeline-block-title">发起信息 / 审批信息</div>
                  <div className="timeline-fields">
                    <div className="timeline-field">
                      <span className="timeline-field-label">当前状态</span>
                      <span className="timeline-field-value">
                        {selectedStage.key === 'revoke' ? '尚未撤销' : '该阶段尚未开始'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="life-drawer-desc">
                <div className="life-drawer-label">阶段说明</div>
                <p>{selectedStage.desc}</p>
              </div>

              {selectedStage.key === 'change' && (
                <div className="life-drawer-note">
                  变更可发生在登记 / 上架 / 交易之后（对应图中三条「发起变更」分支）；变更后需重新经安全审查、登记再上架，可反复多次。本产品已发生 {changeCount} 次变更。
                </div>
              )}
              {selectedStage.key === 'revoke' && (
                <div className="life-drawer-note">
                  撤销发生在登记之后；产品一旦撤销即彻底终止，不再有后续上架、交易环节。
                </div>
              )}
              {selectedStage.key === 'shelf' && (
                <div className="life-drawer-note">
                  上架后即对外提供服务。本产品累计上架 {serviceCycles.shelfCount} 次
                  {serviceCycles.currentState === 'selling' ? '，当前处于在售状态' : ''}
                  ；可在顶部「运营周期」视图中查看每一次上架 / 下架的区间与先后顺序。
                </div>
              )}
              {selectedStage.key === 'unshelf' && (
                <div className="life-drawer-note">
                  下架后停止对外服务。本产品累计下架 {serviceCycles.unshelfCount} 次
                  {serviceCycles.currentState === 'suspended' ? '，当前处于停售状态' : ''}
                  ；可在顶部「运营周期」视图中查看每一次上架 / 下架的区间与先后顺序。
                </div>
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

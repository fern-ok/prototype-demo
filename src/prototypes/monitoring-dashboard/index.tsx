/**
 * @name 监控大屏
 * @mode axure
 *
 * 参考资料：
 * - C:/Users/Lenovo/Desktop/监控大屏html.txt
 * - C:/Users/Lenovo/Desktop/监控大屏.txt
 * - 用户提供的监控大屏截图
 *
 * 公共数据授权运营管理平台 / 监控大屏
 */

import * as echarts from 'echarts';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  ChevronDown,
  Database,
  Layers,
  Rocket,
} from 'lucide-react';
import PasswordGuard from '../../common/PasswordGuard';
import './style.css';

/* ====================== 示例数据 ====================== */
const stats = [
  {
    label: '数据资源总数',
    value: '436',
    unit: '个',
    icon: Database,
    sub: [
      { name: '已上链', value: '434', unit: '个' },
      { name: '资源授权', value: '394', unit: '次' },
    ],
  },
  {
    label: '场景总数',
    value: '159',
    unit: '个',
    icon: Layers,
    sub: [
      { name: '场景申请', value: '188', unit: '个' },
      { name: '场景授权', value: '151', unit: '次' },
    ],
  },
  {
    label: '基础数据产品总数',
    value: '196',
    unit: '个',
    icon: Box,
    sub: [
      { name: '已上链', value: '196', unit: '个' },
      { name: '产品授权', value: '272', unit: '次' },
    ],
  },
  {
    label: '再开发数据产品总数',
    value: '137',
    unit: '个',
    icon: Rocket,
    sub: [
      { name: '有效订单数', value: '108', unit: '个' },
      { name: '产品交易总额', value: '97', unit: '元' },
    ],
  },
];

const industryRatio = [
  { name: '卫生健康', value: 32, color: '#1e88ff' },
  { name: '农林牧渔', value: 18, color: '#7c4dff' },
  { name: '电力热力', value: 12, color: '#00d4ff' },
  { name: '采矿', value: 8, color: '#26c6da' },
  { name: '制造业', value: 10, color: '#ff9d4d' },
  { name: '建筑业', value: 6, color: '#ffd54d' },
  { name: '批发零售', value: 5, color: '#ef5350' },
  { name: '交通运输', value: 5, color: '#66bb6a' },
  { name: '信息传输软件', value: 4, color: '#42a5f5' },
];

const domainPoints = [
  { name: '卫生健康', value: '182', x: 52, y: 35 },
  { name: '三农领域', value: '50',  x: 36, y: 62 },
  { name: '科技创新', value: '51',  x: 56, y: 24 },
  { name: '医疗保障', value: '42',  x: 62, y: 42 },
  { name: '农业农村', value: '2',   x: 32, y: 72 },
  { name: '软件开发', value: '15',  x: 68, y: 36 },
  { name: '工业制造', value: '2',   x: 60, y: 56 },
  { name: '电子通信', value: '6',   x: 44, y: 80 },
  { name: '航天航空', value: '12',  x: 50, y: 88 },
];

const industryBars = [
  { name: '卫生健康', value: 182 },
  { name: '三农领域', value: 50 },
  { name: '科技创新', value: 51 },
  { name: '医疗保障', value: 42 },
  { name: '软件开发', value: 15 },
  { name: '航天航空', value: 12 },
  { name: '电子通信', value: 6 },
  { name: '工业制造', value: 2 },
  { name: '农业农村', value: 2 },
];

const trendMonths = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
const trendValues = [12, 38, 18, 35, 25, 18];

const basicTop10 = [
  { name: '测试728基础产品', value: 8 },
  { name: '招商-开发中心基础产品 API', value: 7 },
  { name: '招商-开发中心基础产品数据源', value: 6 },
  { name: '一般产品API00X0', value: 5 },
  { name: '一般产品API00X2', value: 4 },
  { name: '开发中心基础产品API01', value: 4 },
  { name: '开发中心基础产品02', value: 3 },
  { name: '产品数据源SDK3', value: 3 },
  { name: '08051037-金API', value: 2 },
  { name: '开发中心产品数据源01', value: 2 },
];

const redevTop10 = [
  { name: '核极API二级产品', value: 4 },
  { name: '招商-开发中心再开产品 API', value: 3 },
  { name: '卫健委医疗资源060902', value: 3 },
  { name: '湖南省医疗就诊数据再开发', value: 2 },
  { name: '北京医保诊断核验查询', value: 2 },
  { name: '体检全生命周期数据 API', value: 2 },
  { name: '中信体检 34', value: 1 },
  { name: '一般产品/MT07B', value: 1 },
  { name: '可信医数据二-医产品06', value: 1 },
  { name: '再开发产品082-产品', value: 1 },
];

/* ====================== 通用图表 Hook ====================== */
function useECharts(option: echarts.EChartsCoreOption) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chartRef.current) chartRef.current.setOption(option, true);
  }, [option]);

  return ref;
}

/* ====================== 环形图：行业占比 ====================== */
function IndustryRing() {
  const option = useMemo<echarts.EChartsCoreOption>(
    () => ({
      tooltip: { trigger: 'item', backgroundColor: 'rgba(10,30,70,0.9)', borderColor: '#1e88ff', textStyle: { color: '#fff' } },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#0a1f44', borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          data: industryRatio.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
        },
      ],
    }),
    [],
  );
  const ref = useECharts(option);
  return <div ref={ref} className="chart" />;
}

/* ====================== 行业环形图：数据资源行业分布 ====================== */
const INDUSTRY_COLORS = ['#3d8bff', '#22d3ee', '#f5a623', '#8b5cf6', '#22c55e', '#ef4444', '#14b8a6', '#eab308', '#ec4899'];

function IndustryDonut() {
  const option = useMemo<echarts.EChartsCoreOption>(
    () => ({
      tooltip: { trigger: 'item', backgroundColor: 'rgba(10,30,70,0.9)', borderColor: '#1e88ff', textStyle: { color: '#fff' } },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['52%', '78%'],
          center: ['50%', '50%'],
          itemStyle: { borderColor: '#0a1f44', borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          data: industryBars.map((d, i) => ({ name: d.name, value: d.value, itemStyle: { color: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length] } })),
        },
      ],
    }),
    [],
  );
  const ref = useECharts(option);
  return <div ref={ref} className="chart" />;
}

/* ====================== 折线图：订阅趋势 ====================== */
function TrendLine() {
  const option = useMemo<echarts.EChartsCoreOption>(
    () => ({
      grid: { top: 24, right: 16, bottom: 28, left: 36 },
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(10,30,70,0.9)', borderColor: '#1e88ff', textStyle: { color: '#fff' } },
      xAxis: {
        type: 'category',
        data: trendMonths,
        axisLine: { lineStyle: { color: 'rgba(80,160,230,0.5)' } },
        axisTick: { show: false },
        axisLabel: { color: '#9ec6f5', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 40,
        interval: 10,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9ec6f5', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(80,160,230,0.15)' } },
      },
      series: [
        {
          type: 'line',
          data: trendValues,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: '#00d4ff', borderColor: '#fff', borderWidth: 2 },
          lineStyle: { color: '#00d4ff', width: 2, shadowColor: 'rgba(0,212,255,0.6)', shadowBlur: 8 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,212,255,0.45)' },
              { offset: 1, color: 'rgba(0,212,255,0.02)' },
            ]),
          },
        },
      ],
    }),
    [],
  );
  const ref = useECharts(option);
  return <div ref={ref} className="chart" />;
}

/* ====================== 横向条形图 TOP10 ====================== */
function TopBar({ data, color }: { data: { name: string; value: number }[]; color: [string, string] }) {
  const option = useMemo<echarts.EChartsCoreOption>(
    () => ({
      grid: { top: 4, right: 28, bottom: 4, left: 12 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(10,30,70,0.9)', borderColor: '#1e88ff', textStyle: { color: '#fff' } },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.name),
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: data.map(d => d.value),
          barWidth: 9,
          itemStyle: {
            borderRadius: 2,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: color[0] },
              { offset: 1, color: color[1] },
            ]),
          },
        },
      ],
    }),
    [data, color],
  );
  const ref = useECharts(option);
  return <div ref={ref} className="chart" />;
}

/* ====================== 湖南地图（SVG + 气泡） ====================== */
function HunanMap() {
  return (
    <div className="map-stage">
      <svg className="hunan-svg" viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="map-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(30,136,255,0.35)" />
            <stop offset="100%" stopColor="rgba(10,30,70,0.05)" />
          </linearGradient>
        </defs>
        {/* 简化版湖南轮廓 */}
        <path
          d="M150,30 L210,18 L260,28 L300,50 L330,95 L348,150 L342,210 L320,265 L268,300 L210,322 L155,318 L105,295 L70,250 L48,190 L52,130 L78,75 L112,48 Z"
          fill="url(#map-fill)"
          stroke="rgba(0,212,255,0.7)"
          strokeWidth="1.4"
        />
        {/* 内部细分线 */}
        <g stroke="rgba(80,160,230,0.35)" strokeWidth="0.6" fill="none">
          <path d="M90,90 L150,120 L200,140 L240,180 L280,220 L300,260" />
          <path d="M120,60 L160,100 L180,160 L200,220 L210,300" />
          <path d="M260,40 L270,100 L290,160 L300,220 L310,280" />
        </g>
        {/* 城市定位点 */}
        <g fill="rgba(0,212,255,0.85)">
          <circle cx="120" cy="80" r="1.5" />
          <circle cx="160" cy="120" r="1.5" />
          <circle cx="200" cy="140" r="1.5" />
          <circle cx="240" cy="180" r="1.5" />
          <circle cx="280" cy="220" r="1.5" />
          <circle cx="180" cy="240" r="1.5" />
          <circle cx="220" cy="280" r="1.5" />
        </g>
      </svg>
      {domainPoints.map(p => (
        <div key={p.name} className="map-bubble" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <span className="num">{p.value}</span>
          <span className="line" />
          <span className="label">{p.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ====================== 面板 ====================== */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-title">
        <span className="diamond" />
        <span>{title}</span>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

/* ====================== 顶部标题 ====================== */
function ScreenTitle() {
  return (
    <div className="title-wrap">
      <span className="corner-deco tl" />
      <span className="corner-deco tr" />
      <span className="corner-deco bl" />
      <span className="corner-deco br" />
      <span className="title">公共数据授权运营大屏</span>
    </div>
  );
}

/* ====================== 指标卡 ====================== */
function StatCards() {
  return (
    <div className="statistic-list">
      {stats.map(item => {
        const Icon = item.icon;
        return (
          <div className="panel" key={item.label}>
            <div className="stat-module">
              <div className="stat-head">
                <div className="stat-icon"><Icon size={22} /></div>
                <div className="stat-text">
                  <div className="name">{item.label}</div>
                  <div className="cont">
                    <span className="num">{item.value}</span>
                    <span className="unit">{item.unit}</span>
                  </div>
                </div>
              </div>
              <div className="stat-info">
                {item.sub.map(s => (
                  <div className="row-cell" key={s.name}>
                    <span className="name">{s.name}</span>
                    <span className="num">{s.value}</span>
                    <span className="unit">{s.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ====================== 页面内容 ====================== */
/** 设计稿基准尺寸：所有元素按此尺寸固定布局，再整体等比缩放适配视口 */
const STAGE_W = 1920;
const STAGE_H = 1080;

// 独立全屏页面：不套用 PortalLayout，去掉公共顶部导航与页脚
const OriginalComponent = () => {
  // 等比缩放适配：取宽高缩小比例的较小值，保证内容在任意分辨率/宽高比下完整呈现、无滚动条
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <div className="screen-viewport">
      <div className="data-screen" style={{ transform: `scale(${scale})` }}>
        {/* 背景仅保留 HUNAN 字样；地图只在中间面板渲染一次，避免重影 */}
        <div className="bg-hunan">HUNAN</div>

    {/* 标题 */}
    <ScreenTitle />

    {/* 内容 */}
    <div className="content-wrap">
      {/* 顶部 4 指标卡 */}
      <div className="row row-stats">
        <StatCards />
      </div>

      {/* 主区域三列：左（行业占比+趋势分析） | 中（领域分布地图贯通） | 右（行业分布+两个TOP10） */}
      <div className="row row-main">
        <div className="main-col main-col-left">
          <Panel title="再开发数据产品订单数行业占比">
            <div className="ring-wrap">
              <IndustryRing />
              <div className="industry-legend">
                {industryRatio.map(d => (
                  <span className="item" key={d.name}>
                    <span className="dot" style={{ background: d.color }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="再开发数据产品订单数趋势分析">
            <TrendLine />
          </Panel>
        </div>

        <div className="main-col main-col-center">
          <Panel title="数据资源领域名称分布">
            <HunanMap />
          </Panel>
        </div>

        <div className="main-col main-col-right">
          <Panel title="数据资源行业分布">
            <div className="industry-donut">
              <div className="donut-box">
                <IndustryDonut />
              </div>
              <div className="industry-legend-grid">
                {industryBars.map((d, i) => (
                  <span className="item" key={d.name} title={d.name}>
                    <span className="dot" style={{ background: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length] }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="基础数据产品授权次数TOP10">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
                {basicTop10.slice(0, 5).map((d, idx) => (
                  <div className="top-row" key={d.name}>
                    <span className="rank">{idx + 1}</span>
                    <span className="name" title={d.name}>{d.name}</span>
                    <span className="val">{d.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ position: 'relative', minHeight: 0 }}>
                <TopBar data={basicTop10.slice(0, 5)} color={['#0a3a8e', '#1e88ff']} />
              </div>
            </div>
          </Panel>

          <Panel title="再开发数据产品订单数TOP10">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
                {redevTop10.slice(0, 5).map((d, idx) => (
                  <div className="top-row" key={d.name}>
                    <span className="rank">{idx + 1}</span>
                    <span className="name" title={d.name}>{d.name}</span>
                    <span className="val">{d.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ position: 'relative', minHeight: 0 }}>
                <TopBar data={redevTop10.slice(0, 5)} color={['#0a3a8e', '#00d4ff']} />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
      </div>
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
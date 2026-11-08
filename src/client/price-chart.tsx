import React, { useEffect, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import * as d3 from 'd3';
import { gsap } from 'gsap';
import {
  computeAdvancedPriceTrends,
  AdvancedPriceTrendsAnalytics,
  AdvancedPriceTrendPoint,
  D3TrendViewMode,
  VolatilityEventFlag,
  HighVolatilityThresholdConfig,
  VolatilityThresholdBreach,
  resolveD3ModeGsapTransitionProfile,
  D3_ZOOM_MIN_SCALE,
  D3_ZOOM_MAX_SCALE,
  D3_ZOOM_STEP_FACTOR,
  D3_PAN_STEP_PX,
  D3ZoomPanTransformInput,
  D3ZoomedVisibleWindow,
  clampD3ZoomPanTransform,
  computeD3WheelZoomTransform,
  computeD3DragPanTransform,
  resolveD3ZoomedVisibleWindow,
} from '../logic/inventory';

export interface PricePoint {
  month: string;
  price: number;
  marketAvg?: number;
}

export interface ChartOptions {
  variant?: 'card' | 'drawer' | 'alert-sparkline';
  accentColor?: string;
  showMarketAvg?: boolean;
  height?: number;
  targetPrice?: number;
}

export interface D3VolatilityChartOptions {
  mode?: D3TrendViewMode;
  previousMode?: D3TrendViewMode | null;
  animateTransition?: boolean;
  reducedMotion?: boolean;
  height?: number;
  accentColor?: string;
  secondaryColor?: string;
  selectedEventMonth?: string | null;
  thresholdConfig?: Partial<HighVolatilityThresholdConfig>;
  legendVisible?: boolean;
  zoomTransform?: D3ZoomPanTransformInput | null;
  onPointHover?: (point: AdvancedPriceTrendPoint, analytics: AdvancedPriceTrendsAnalytics) => void;
  onPointSelect?: (point: AdvancedPriceTrendPoint, analytics: AdvancedPriceTrendsAnalytics) => void;
  onPeakEventSelect?: (
    event: VolatilityEventFlag,
    point: AdvancedPriceTrendPoint,
    analytics: AdvancedPriceTrendsAnalytics
  ) => void;
  onZoomPanChange?: (
    zoomState: D3ZoomedVisibleWindow,
    analytics: AdvancedPriceTrendsAnalytics
  ) => void;
}

interface PriceHistoryChartProps {
  data: PricePoint[];
  options?: ChartOptions;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data, options }) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const variant = options?.variant || 'card';
  const isDrawer = variant === 'drawer';
  const isAlertSparkline = variant === 'alert-sparkline';
  const defaultWidth = isAlertSparkline ? 440 : isDrawer ? 380 : 210;
  const chartHeight = options?.height || (isAlertSparkline ? 124 : isDrawer ? 168 : 112);
  const [width, setWidth] = useState<number>(defaultWidth);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width || el.clientWidth || defaultWidth);
      if (w > 80) {
        setWidth(w);
      }
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [defaultWidth]);

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const prices = data.map((d) => Number(d.price) || 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgVal = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;

  const rawTarget = Number(options?.targetPrice);
  const hasTargetPrice = Number.isFinite(rawTarget) && rawTarget > 0;
  const domainCandidates = hasTargetPrice ? [...prices, rawTarget] : prices;
  const minVal = Math.min(...domainCandidates);
  const maxVal = Math.max(...domainCandidates);
  const pad = Math.max(5, Math.round((maxVal - minVal) * 0.25));
  const domainMin = Math.max(0, Math.floor(minVal - pad));
  const domainMax = Math.ceil(maxVal + pad);
  const strokeColor = options?.accentColor || (isAlertSparkline ? '#38bdf8' : '#ffd23f');

  const targetStrokeColor =
    hasTargetPrice && rawTarget < minPrice - 0.05
      ? '#f59e0b'
      : '#10b981';

  const hostClass = isAlertSparkline
    ? 'vb-recharts-host vb-recharts-alert-sparkline'
    : isDrawer
      ? 'vb-recharts-host vb-recharts-drawer'
      : 'vb-recharts-host vb-recharts-card';

  const hostTestId = isAlertSparkline
    ? 'alert-sparkline-recharts-host'
    : isDrawer
      ? 'drawer-recharts-host'
      : 'card-recharts-host';

  return (
    <div
      ref={wrapRef}
      className={hostClass}
      data-testid={hostTestId}
      data-target-price={hasTargetPrice ? rawTarget.toFixed(2) : undefined}
      data-six-month-low={minPrice.toFixed(2)}
      data-six-month-high={maxPrice.toFixed(2)}
      style={{ width: '100%' }}
    >
      <LineChart
        width={width}
        height={chartHeight}
        data={data}
        margin={
          isAlertSparkline
            ? { top: 10, right: 14, left: -6, bottom: 2 }
            : isDrawer
              ? { top: 10, right: 12, left: -4, bottom: 4 }
              : { top: 8, right: 8, left: -10, bottom: 2 }
        }
      >
        <CartesianGrid stroke="#24324a" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="#7c8494"
          tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={{ stroke: '#24324a' }}
          tickLine={false}
        />
        <YAxis
          domain={[domainMin, domainMax]}
          stroke="#7c8494"
          tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${Math.round(Number(v))}`}
          width={48}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f172a',
            border: '1px solid #24324a',
            borderRadius: '8px',
            padding: '6px 10px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: '#f8fafc',
            boxShadow: '0 10px 24px rgba(0,0,0,0.55)',
          }}
          itemStyle={{ color: strokeColor, padding: 0 }}
          labelStyle={{ color: '#94a3b8', marginBottom: '2px', fontWeight: 700 }}
          formatter={(value: unknown, name: unknown) => [
            `$${Number(value).toFixed(2)}`,
            name === 'marketAvg' ? 'Market Avg' : '6M Historical Price',
          ]}
        />
        <ReferenceLine
          y={avgVal}
          stroke="rgba(148, 163, 184, 0.35)"
          strokeDasharray="2 2"
        />
        {hasTargetPrice && (
          <ReferenceLine
            y={rawTarget}
            stroke={targetStrokeColor}
            strokeWidth={2}
            strokeDasharray="5 3"
            label={{
              value: `Target $${rawTarget.toFixed(2)}`,
              position: 'insideTopRight',
              fill: targetStrokeColor,
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        )}
        {isDrawer && (
          <Line
            type="monotone"
            dataKey="marketAvg"
            stroke="#636b78"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
        )}
        <Line
          type="monotone"
          dataKey="price"
          stroke={strokeColor}
          strokeWidth={2.25}
          dot={{
            r: isDrawer || isAlertSparkline ? 3.25 : 2.5,
            fill: '#0f172a',
            stroke: strokeColor,
            strokeWidth: 2,
          }}
          activeDot={{ r: 5, fill: strokeColor, stroke: '#090d16', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
};

function regimeColor(regime: AdvancedPriceTrendPoint['volatilityRegime']): string {
  if (regime === 'high') return '#f43f5e';
  if (regime === 'elevated') return '#f59e0b';
  if (regime === 'moderate') return '#38bdf8';
  return '#10b981';
}

const activeTimelines = new WeakMap<Element, gsap.core.Timeline>();

function renderD3AdvancedTrendsIntoContainer(
  container: HTMLElement,
  rawData: PricePoint[],
  options?: D3VolatilityChartOptions
): AdvancedPriceTrendsAnalytics {
  const analytics = computeAdvancedPriceTrends(rawData, options?.thresholdConfig);
  const points = analytics.points;
  const peakEvents = analytics.peakEvents || [];
  const peakEventByMonth = new Map<string, VolatilityEventFlag>();
  peakEvents.forEach((ev) => peakEventByMonth.set(ev.month, ev));

  const thresholdEval = analytics.highVolatilityThreshold;
  const breachByMonth = new Map<string, VolatilityThresholdBreach>();
  if (thresholdEval && Array.isArray(thresholdEval.breaches)) {
    thresholdEval.breaches.forEach((b) => breachByMonth.set(b.month, b));
  }

  const mode: D3TrendViewMode = options?.mode || 'composite';
  const svgHeight = options?.height || 196;
  const measuredWidth = Math.floor(container.getBoundingClientRect().width || container.clientWidth || 380);
  const svgWidth = Math.max(300, measuredWidth);

  const margin = { top: 22, right: 38, bottom: 26, left: 44 };
  const innerW = Math.max(180, svgWidth - margin.left - margin.right);
  const innerH = Math.max(100, svgHeight - margin.top - margin.bottom);

  // Detect previous mode before clearing SVG
  const existingSvg = container.querySelector('svg[data-testid="d3-volatility-svg"]');
  const detectedPrevMode =
    options?.previousMode !== undefined
      ? options.previousMode
      : ((existingSvg?.getAttribute('data-d3-mode') as D3TrendViewMode | null) ?? null);

  // Kill any running GSAP timeline on this container
  const runningTl = activeTimelines.get(container);
  if (runningTl) {
    runningTl.kill();
    activeTimelines.delete(container);
  }
  gsap.killTweensOf(container);

  const gsapProfile = resolveD3ModeGsapTransitionProfile(detectedPrevMode, mode, {
    reducedMotion: options?.reducedMotion,
  });

  const prevCount = Number(container.getAttribute('data-gsap-transition-count') || '0');
  const nextCount = gsapProfile.isModeSwitch ? prevCount + 1 : prevCount;
  container.setAttribute('data-d3-mode', mode);
  container.setAttribute('data-gsap-from-mode', gsapProfile.fromMode);
  container.setAttribute('data-gsap-to-mode', gsapProfile.toMode);
  container.setAttribute('data-gsap-direction', String(gsapProfile.direction));
  container.setAttribute('data-gsap-transition-count', String(nextCount));
  container.setAttribute('data-peak-event-count', String(peakEvents.length));
  const legendVisible = options?.legendVisible !== false;
  container.setAttribute('data-threshold-enabled', String(Boolean(thresholdEval?.enabled)));
  container.setAttribute('data-threshold-sigma', String(thresholdEval?.sigmaThreshold ?? 2));
  container.setAttribute('data-legend-visible', String(legendVisible));
  container.setAttribute(
    'data-threshold-breach-count',
    String(thresholdEval?.enabled ? thresholdEval.breachCount : 0)
  );

  // Clear previous D3 SVG content
  const rootSel = d3.select(container);
  rootSel.selectAll('*').remove();

  const svg = rootSel
    .append('svg')
    .attr('class', 'vb-d3-trends-svg')
    .attr('data-testid', 'd3-volatility-svg')
    .attr('data-d3-mode', mode)
    .attr('data-mode', mode)
    .attr('data-volatility-index', String(analytics.sixMonthVolatilityIndex))
    .attr('data-peak-month', analytics.peakVolatilityMonth)
    .attr('data-threshold-enabled', String(Boolean(thresholdEval?.enabled)))
    .attr('data-threshold-sigma', String(thresholdEval?.sigmaThreshold ?? 2))
    .attr('data-legend-visible', String(legendVisible))
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .attr('width', '100%')
    .attr('height', svgHeight)
    .style('display', 'block')
    .style('overflow', 'visible');

  // SVG Gradients & Viewport Clip Paths for Zoom/Pan
  const defs = svg.append('defs');

  defs
    .append('clipPath')
    .attr('id', 'vb-d3-plot-clip')
    .append('rect')
    .attr('x', -6)
    .attr('y', -18)
    .attr('width', innerW + 12)
    .attr('height', innerH + 28);

  defs
    .append('clipPath')
    .attr('id', 'vb-d3-xaxis-clip')
    .append('rect')
    .attr('x', -14)
    .attr('y', -6)
    .attr('width', innerW + 28)
    .attr('height', 32);

  const envGrad = defs
    .append('linearGradient')
    .attr('id', 'vb-d3-envelope-grad')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  envGrad.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.26);
  envGrad.append('stop').attr('offset', '100%').attr('stop-color', '#2dd4bf').attr('stop-opacity', 0.04);

  const volAreaGrad = defs
    .append('linearGradient')
    .attr('id', 'vb-d3-vol-area-grad')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  volAreaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffd23f').attr('stop-opacity', 0.28);
  volAreaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#ffd23f').attr('stop-opacity', 0.02);

  const threshBandGrad = defs
    .append('linearGradient')
    .attr('id', 'vb-d3-threshold-band-grad')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  threshBandGrad.append('stop').attr('offset', '0%').attr('stop-color', '#c084fc').attr('stop-opacity', 0.22);
  threshBandGrad.append('stop').attr('offset', '100%').attr('stop-color', '#a855f7').attr('stop-opacity', 0.04);

  const g = svg
    .append('g')
    .attr('class', 'd3-chart-root')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const stageViewportG = g
    .append('g')
    .attr('class', 'd3-stage-viewport')
    .attr('clip-path', 'url(#vb-d3-plot-clip)');

  const stageG = stageViewportG.append('g').attr('class', 'd3-stage-group');
  const thresholdBgLayer = stageG.append('g').attr('class', 'd3-threshold-bg-layer');

  const months = points.map((d) => d.month);
  const xPoint = d3
    .scalePoint<string>()
    .domain(months)
    .range([14, innerW - 14]);

  const xBand = d3
    .scaleBand<string>()
    .domain(months)
    .range([0, innerW])
    .paddingInner(0.38)
    .paddingOuter(0.12);

  // Horizontal grid lines
  const gridTicks = [0.2, 0.5, 0.8];
  g.selectAll('.d3-grid-line')
    .data(gridTicks)
    .enter()
    .append('line')
    .attr('class', 'd3-grid-line')
    .attr('x1', 0)
    .attr('x2', innerW)
    .attr('y1', (t) => Math.round(innerH * t))
    .attr('y2', (t) => Math.round(innerH * t))
    .attr('stroke', '#1e293b')
    .attr('stroke-dasharray', '3 3');

  let resolveEventAnchorY: (ev: VolatilityEventFlag) => number = () => Math.round(innerH * 0.35);
  let resolveThresholdLineY = (): number => Math.round(innerH * 0.32);
  let resolveThresholdNodeY: (b: VolatilityThresholdBreach) => number = () => Math.round(innerH * 0.32);

  if (mode === 'composite') {
    const allPrices = points.flatMap((p) => [p.lowerBand, p.upperBand, p.price]);
    const minP = d3.min(allPrices) ?? analytics.sixMonthLow * 0.9;
    const maxP = d3.max(allPrices) ?? analytics.sixMonthHigh * 1.1;
    const padP = Math.max(4, (maxP - minP) * 0.18);

    const yPrice = d3
      .scaleLinear()
      .domain([Math.max(0, minP - padP), maxP + padP])
      .range([innerH, 0]);

    const yVol = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerH, Math.round(innerH * 0.18)]);

    resolveEventAnchorY = (ev) =>
      ev.severity === 'drawdown-trough' ? yPrice(ev.price) : yVol(ev.volatilityIndex);
    resolveThresholdLineY = () => yVol(thresholdEval.thresholdVolatilityIndex);
    resolveThresholdNodeY = (b) => yVol(b.volatilityIndex);

    // 1. Volatility Envelope Area (upperBand to lowerBand)
    const envelopeArea = d3
      .area<AdvancedPriceTrendPoint>()
      .x((d) => xPoint(d.month) ?? 0)
      .y0((d) => yPrice(d.lowerBand))
      .y1((d) => yPrice(d.upperBand))
      .curve(d3.curveMonotoneX);

    stageG
      .append('path')
      .datum(points)
      .attr('class', 'd3-volatility-envelope')
      .attr('fill', 'url(#vb-d3-envelope-grad)')
      .attr('stroke', 'rgba(56, 189, 248, 0.32)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 2')
      .attr('d', envelopeArea);

    // 2. 6M Volatility Index Bars along bottom
    stageG
      .selectAll('.d3-volatility-bar')
      .data(points)
      .enter()
      .append('rect')
      .attr('class', 'd3-volatility-bar d3-vol-bar')
      .attr('data-month', (d) => d.month)
      .attr('data-target-y', (d) => yVol(d.volatilityIndex))
      .attr('data-target-h', (d) => Math.max(3, innerH - yVol(d.volatilityIndex)))
      .attr('x', (d) => (xPoint(d.month) ?? 0) - Math.min(18, xBand.bandwidth() / 2))
      .attr('width', Math.min(36, xBand.bandwidth()))
      .attr('y', (d) => yVol(d.volatilityIndex))
      .attr('height', (d) => Math.max(3, innerH - yVol(d.volatilityIndex)))
      .attr('rx', 3)
      .attr('fill', (d) => regimeColor(d.volatilityRegime))
      .attr('fill-opacity', 0.26)
      .attr('stroke', (d) => regimeColor(d.volatilityRegime))
      .attr('stroke-opacity', 0.65)
      .attr('stroke-width', 1);

    // 3. Rolling Mean Reference Line
    const rollingLine = d3
      .line<AdvancedPriceTrendPoint>()
      .x((d) => xPoint(d.month) ?? 0)
      .y((d) => yPrice(d.rollingMean))
      .curve(d3.curveMonotoneX);

    stageG
      .append('path')
      .datum(points)
      .attr('class', 'd3-rolling-mean-line')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(148, 163, 184, 0.55)')
      .attr('stroke-width', 1.4)
      .attr('stroke-dasharray', '4 3')
      .attr('d', rollingLine);

    // 4. Volatility Index Curve (Electric Gold)
    const volLine = d3
      .line<AdvancedPriceTrendPoint>()
      .x((d) => xPoint(d.month) ?? 0)
      .y((d) => yVol(d.volatilityIndex))
      .curve(d3.curveMonotoneX);

    stageG
      .append('path')
      .datum(points)
      .attr('class', 'd3-volatility-line d3-anim-path')
      .attr('fill', 'none')
      .attr('stroke', '#ffd23f')
      .attr('stroke-width', 2)
      .attr('d', volLine);

    // 5. Historical Price Curve (Quantum Cyan)
    const priceLine = d3
      .line<AdvancedPriceTrendPoint>()
      .x((d) => xPoint(d.month) ?? 0)
      .y((d) => yPrice(d.price))
      .curve(d3.curveMonotoneX);

    stageG
      .append('path')
      .datum(points)
      .attr('class', 'd3-price-line d3-anim-path')
      .attr('fill', 'none')
      .attr('stroke', '#2dd4bf')
      .attr('stroke-width', 2.4)
      .attr('d', priceLine);

    // Left Axis (Price USD)
    const leftAxis = d3
      .axisLeft(yPrice)
      .ticks(4)
      .tickFormat((v) => `$${Math.round(Number(v))}`);
    g.append('g')
      .attr('class', 'd3-axis d3-axis-left')
      .call(leftAxis)
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').remove())
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', '#94a3b8')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-size', '9.5px')
      );

    // Right Axis (Volatility Index 0-100)
    const rightAxis = d3
      .axisRight(yVol)
      .tickValues([0, 50, 100])
      .tickFormat((v) => `${v}v`);
    g.append('g')
      .attr('class', 'd3-axis d3-axis-right')
      .attr('transform', `translate(${innerW},0)`)
      .call(rightAxis)
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').remove())
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', '#ffd23f')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-size', '9.5px')
      );

    // Volatility & Price Nodes
    stageG
      .selectAll('.d3-vol-node')
      .data(points)
      .enter()
      .append('circle')
      .attr('class', 'd3-vol-node d3-vol-dot d3-anim-node')
      .attr('cx', (d) => xPoint(d.month) ?? 0)
      .attr('cy', (d) => yVol(d.volatilityIndex))
      .attr('r', 3.2)
      .attr('fill', '#090d16')
      .attr('stroke', '#ffd23f')
      .attr('stroke-width', 2);

    stageG
      .selectAll('.d3-price-node')
      .data(points)
      .enter()
      .append('circle')
      .attr('class', 'd3-price-node d3-price-dot d3-anim-node')
      .attr('cx', (d) => xPoint(d.month) ?? 0)
      .attr('cy', (d) => yPrice(d.price))
      .attr('r', 3.8)
      .attr('fill', '#090d16')
      .attr('stroke', '#2dd4bf')
      .attr('stroke-width', 2.2);
  } else if (mode === 'volatility-bars') {
    const yVol = d3.scaleLinear().domain([0, 100]).range([innerH, 12]);
    resolveEventAnchorY = (ev) => yVol(ev.volatilityIndex);
    resolveThresholdLineY = () => yVol(thresholdEval.thresholdVolatilityIndex);
    resolveThresholdNodeY = (b) => yVol(b.volatilityIndex);

    // Regime threshold lines
    const thresholds = [
      { val: 30, label: 'Mod (30)', color: '#38bdf8' },
      { val: 65, label: 'High (65)', color: '#f43f5e' },
    ];
    thresholds.forEach((th) => {
      stageG
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', yVol(th.val))
        .attr('y2', yVol(th.val))
        .attr('stroke', th.color)
        .attr('stroke-opacity', 0.4)
        .attr('stroke-dasharray', '4 3');
    });

    const volArea = d3
      .area<AdvancedPriceTrendPoint>()
      .x((d) => xPoint(d.month) ?? 0)
      .y0(innerH)
      .y1((d) => yVol(d.volatilityIndex))
      .curve(d3.curveMonotoneX);

    stageG
      .append('path')
      .datum(points)
      .attr('class', 'd3-vol-area')
      .attr('fill', 'url(#vb-d3-vol-area-grad)')
      .attr('d', volArea);

    stageG
      .selectAll('.d3-volatility-bar')
      .data(points)
      .enter()
      .append('rect')
      .attr('class', 'd3-volatility-bar d3-vol-bar')
      .attr('data-month', (d) => d.month)
      .attr('data-target-y', (d) => yVol(d.volatilityIndex))
      .attr('data-target-h', (d) => Math.max(4, innerH - yVol(d.volatilityIndex)))
      .attr('x', (d) => (xPoint(d.month) ?? 0) - Math.min(20, xBand.bandwidth() / 2))
      .attr('width', Math.min(40, xBand.bandwidth()))
      .attr('y', (d) => yVol(d.volatilityIndex))
      .attr('height', (d) => Math.max(4, innerH - yVol(d.volatilityIndex)))
      .attr('rx', 4)
      .attr('fill', (d) => regimeColor(d.volatilityRegime))
      .attr('fill-opacity', 0.72)
      .attr('stroke', (d) => regimeColor(d.volatilityRegime))
      .attr('stroke-width', 1.2);

    stageG
      .selectAll('.d3-bar-val-label')
      .data(points)
      .enter()
      .append('text')
      .attr('class', 'd3-bar-val-label d3-anim-node')
      .attr('x', (d) => xPoint(d.month) ?? 0)
      .attr('y', (d) => Math.max(14, yVol(d.volatilityIndex) - 5))
      .attr('text-anchor', 'middle')
      .attr('fill', '#f8fafc')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9.5px')
      .attr('font-weight', '700')
      .text((d) => `${d.volatilityIndex.toFixed(0)}`);

    const leftAxis = d3
      .axisLeft(yVol)
      .tickValues([0, 25, 50, 75, 100])
      .tickFormat((v) => `${v}`);
    g.append('g')
      .attr('class', 'd3-axis d3-axis-left')
      .call(leftAxis)
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').remove())
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', '#ffd23f')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-size', '9.5px')
      );
  } else {
    // 'zscore' mode: Standardized Z-Score deviation vs 6M Mean
    const maxAbsZ = Math.max(1.8, d3.max(points, (d) => Math.abs(d.zScore)) ?? 1.8);
    const yZ = d3
      .scaleLinear()
      .domain([-maxAbsZ - 0.3, maxAbsZ + 0.3])
      .range([innerH, 10]);

    resolveEventAnchorY = (ev) => yZ(ev.zScore);
    resolveThresholdLineY = () => yZ(Math.min(maxAbsZ, thresholdEval.zScoreCutoff));
    resolveThresholdNodeY = (b) => yZ(b.priceZScore);

    // 0-sigma baseline
    stageG
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', yZ(0))
      .attr('y2', yZ(0))
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3 3');

    const zLine = d3
      .line<AdvancedPriceTrendPoint>()
      .x((d) => xPoint(d.month) ?? 0)
      .y((d) => yZ(d.zScore))
      .curve(d3.curveMonotoneX);

    stageG
      .append('path')
      .datum(points)
      .attr('class', 'd3-zscore-line d3-anim-path')
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.2)
      .attr('d', zLine);

    stageG
      .selectAll('.d3-zscore-node')
      .data(points)
      .enter()
      .append('circle')
      .attr('class', 'd3-zscore-node d3-z-dot d3-anim-node')
      .attr('cx', (d) => xPoint(d.month) ?? 0)
      .attr('cy', (d) => yZ(d.zScore))
      .attr('r', 4.2)
      .attr('fill', (d) => (d.zScore <= -0.5 ? '#10b981' : d.zScore >= 0.5 ? '#f59e0b' : '#38bdf8'))
      .attr('stroke', '#090d16')
      .attr('stroke-width', 1.8);

    stageG
      .selectAll('.d3-zscore-label')
      .data(points)
      .enter()
      .append('text')
      .attr('class', 'd3-zscore-label d3-anim-node')
      .attr('x', (d) => xPoint(d.month) ?? 0)
      .attr('y', (d) => (d.zScore >= 0 ? yZ(d.zScore) - 7 : yZ(d.zScore) + 14))
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9.5px')
      .attr('font-weight', '700')
      .text((d) => `${d.zScore >= 0 ? '+' : ''}${d.zScore.toFixed(2)}σ`);

    const leftAxis = d3
      .axisLeft(yZ)
      .ticks(5)
      .tickFormat((v) => `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}σ`);
    g.append('g')
      .attr('class', 'd3-axis d3-axis-left')
      .call(leftAxis)
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').remove())
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', '#94a3b8')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-size', '9.5px')
      );
  }

  // High Volatility Threshold Layer (when enabled in configuration)
  if (thresholdEval && thresholdEval.enabled) {
    const thresholdLayer = stageG
      .append('g')
      .attr('class', 'd3-threshold-layer')
      .attr('data-testid', 'd3-threshold-layer')
      .attr('data-sigma-threshold', String(thresholdEval.sigmaThreshold))
      .attr('data-breach-count', String(thresholdEval.breachCount));

    const cutoffY = Math.max(8, Math.min(innerH - 8, resolveThresholdLineY()));

    // 1. Horizontal Threshold Cutoff Line & Exceedance Zone
    thresholdBgLayer
      .append('rect')
      .attr('class', 'd3-threshold-exceedance-zone')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerW)
      .attr('height', Math.max(4, cutoffY))
      .attr('fill', 'rgba(192, 132, 252, 0.045)');

    thresholdLayer
      .append('line')
      .attr('class', 'd3-threshold-cutoff-line')
      .attr('data-testid', 'd3-threshold-cutoff-line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', cutoffY)
      .attr('y2', cutoffY)
      .attr('stroke', '#c084fc')
      .attr('stroke-width', 1.4)
      .attr('stroke-dasharray', '5 3')
      .attr('stroke-opacity', 0.9);

    const cutoffText = `≥${thresholdEval.sigmaLabel} (${thresholdEval.thresholdVolatilityIndex.toFixed(0)}v)`;
    const cutoffLabelW = Math.max(66, cutoffText.length * 5.4 + 10);
    const cutoffLabelG = thresholdLayer
      .append('g')
      .attr('class', 'd3-threshold-cutoff-label d3-anim-node')
      .attr('data-testid', 'd3-threshold-cutoff-label')
      .attr('transform', `translate(4, ${Math.max(10, cutoffY - 8)})`);

    cutoffLabelG
      .append('rect')
      .attr('x', 0)
      .attr('y', -7)
      .attr('width', cutoffLabelW)
      .attr('height', 14)
      .attr('rx', 3.5)
      .attr('fill', 'rgba(88, 28, 135, 0.85)')
      .attr('stroke', '#c084fc')
      .attr('stroke-width', 1);

    cutoffLabelG
      .append('text')
      .attr('x', cutoffLabelW / 2)
      .attr('y', 2.5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f3e8ff')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '8px')
      .attr('font-weight', '800')
      .text(cutoffText);

    // 2. Highlighted Breach Period Column Bands & Sigma Breach Markers
    const bandHalfW = Math.max(14, Math.min(22, xBand.bandwidth() * 0.62));
    thresholdEval.breaches.forEach((breach) => {
      const cx = xPoint(breach.month) ?? 0;
      const cy = resolveThresholdNodeY(breach);

      // Highlighted Period Column Band behind bars/curves
      thresholdBgLayer
        .append('rect')
        .attr('class', 'd3-threshold-period-band')
        .attr('data-testid', 'd3-threshold-period-band')
        .attr('data-month', breach.month)
        .attr('data-effective-sigma', String(breach.effectiveSigmaScore))
        .attr('x', Math.max(0, cx - bandHalfW))
        .attr('y', 2)
        .attr('width', bandHalfW * 2)
        .attr('height', Math.max(10, innerH - 2))
        .attr('rx', 5)
        .attr('fill', 'url(#vb-d3-threshold-band-grad)')
        .attr('stroke', 'rgba(192, 132, 252, 0.45)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2 2');

      const breachG = thresholdLayer
        .append('g')
        .attr('class', 'd3-threshold-breach-marker')
        .attr('data-testid', 'd3-threshold-breach-marker')
        .attr('data-month', breach.month)
        .attr('data-effective-sigma', String(breach.effectiveSigmaScore));

      // Glowing violet ring at breached data point
      breachG
        .append('circle')
        .attr('class', 'd3-threshold-breach-ring d3-anim-node')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 9.2)
        .attr('fill', 'none')
        .attr('stroke', '#c084fc')
        .attr('stroke-width', 1.4)
        .attr('stroke-dasharray', '2 2');

      // Bottom period sigma badge inside the highlighted period band
      const sigmaBadgeText = `${breach.effectiveSigmaScore.toFixed(1)}σ`;
      const sigmaBadgeW = Math.max(32, sigmaBadgeText.length * 5.6 + 8);
      const badgeClampedX = Math.max(sigmaBadgeW / 2, Math.min(innerW - sigmaBadgeW / 2, cx));
      const badgeG = breachG
        .append('g')
        .attr('class', 'd3-threshold-breach-badge d3-anim-node')
        .attr('data-testid', 'd3-threshold-breach-badge')
        .attr('data-month', breach.month)
        .attr('transform', `translate(${badgeClampedX}, ${innerH - 9})`);

      badgeG
        .append('rect')
        .attr('x', -sigmaBadgeW / 2)
        .attr('y', -7)
        .attr('width', sigmaBadgeW)
        .attr('height', 13)
        .attr('rx', 3.5)
        .attr('fill', 'rgba(88, 28, 135, 0.9)')
        .attr('stroke', '#c084fc')
        .attr('stroke-width', 1);

      badgeG
        .append('text')
        .attr('x', 0)
        .attr('y', 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e9d5ff')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', '8px')
        .attr('font-weight', '800')
        .text(sigmaBadgeText);
    });
  }

  // Automatic Vertical Peak Volatility Event Markers & Halo Callouts
  if (peakEvents.length > 0) {
    const markersGroup = stageG
      .append('g')
      .attr('class', 'd3-peak-markers-layer')
      .attr('data-testid', 'd3-peak-markers-layer');

    peakEvents.forEach((ev) => {
      const cx = xPoint(ev.month) ?? 0;
      const cy = resolveEventAnchorY(ev);
      const isPrimary = ev.isPrimaryPeak;
      const accent = isPrimary ? '#f43f5e' : '#f59e0b';
      const pillBg = isPrimary ? 'rgba(244, 63, 94, 0.24)' : 'rgba(245, 158, 11, 0.22)';
      const pillW = Math.max(54, ev.shortTag.length * 5.8 + 10);
      const clampedPillX = Math.max(pillW / 2, Math.min(innerW - pillW / 2, cx));

      const markerG = markersGroup
        .append('g')
        .attr('class', `d3-peak-event-marker ${isPrimary ? 'is-primary-peak' : 'is-secondary-peak'}`)
        .attr('data-testid', 'd3-peak-event-marker')
        .attr('data-month', ev.month)
        .attr('data-severity', ev.severity)
        .attr('data-is-primary', String(isPrimary))
        .attr('data-volatility-index', String(ev.volatilityIndex));

      // 1. Vertical Dashed Event Marker Line
      markerG
        .append('line')
        .attr('class', 'd3-peak-marker-line')
        .attr('x1', cx)
        .attr('x2', cx)
        .attr('y1', 4)
        .attr('y2', innerH)
        .attr('stroke', accent)
        .attr('stroke-width', isPrimary ? 1.5 : 1.2)
        .attr('stroke-dasharray', isPrimary ? '3 2' : '2 3')
        .attr('stroke-opacity', isPrimary ? 0.9 : 0.72);

      // 2. Concentric Pulse Halo Ring at Node Coordinate
      markerG
        .append('circle')
        .attr('class', 'd3-peak-marker-halo d3-anim-node')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', isPrimary ? 7.5 : 6.2)
        .attr('fill', isPrimary ? 'rgba(244, 63, 94, 0.18)' : 'rgba(245, 158, 11, 0.15)')
        .attr('stroke', accent)
        .attr('stroke-width', 1.4);

      // 3. Top Flag Callout Pill
      const pillG = markerG
        .append('g')
        .attr('class', 'd3-peak-marker-pill d3-anim-node')
        .attr('data-testid', 'd3-peak-marker-pill')
        .attr('data-month', ev.month)
        .attr('transform', `translate(${clampedPillX}, -6)`);

      pillG
        .append('rect')
        .attr('x', -pillW / 2)
        .attr('y', -8)
        .attr('width', pillW)
        .attr('height', 15)
        .attr('rx', 4)
        .attr('fill', pillBg)
        .attr('stroke', accent)
        .attr('stroke-width', 1);

      pillG
        .append('text')
        .attr('x', 0)
        .attr('y', 2.5)
        .attr('text-anchor', 'middle')
        .attr('fill', isPrimary ? '#fda4af' : '#fde68a')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', '8.5px')
        .attr('font-weight', '800')
        .text(ev.shortTag);
    });
  }

  // Bottom X-Axis (Months May..Oct) with clip-path for smooth zoom/pan
  const bottomAxis = d3.axisBottom(xPoint);
  const bottomAxisG = g
    .append('g')
    .attr('class', 'd3-axis d3-axis-bottom')
    .attr('clip-path', 'url(#vb-d3-xaxis-clip)')
    .attr('transform', `translate(0,${innerH})`)
    .call(bottomAxis)
    .call((sel) => sel.select('.domain').attr('stroke', '#24324a'))
    .call((sel) => sel.selectAll('line').remove())
    .call((sel) =>
      sel
        .selectAll('text')
        .attr('fill', '#cbd5e1')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
    );

  // Interactive Peak Volatility Event Tooltip Banner inside Container
  const tooltipEl = rootSel
    .append('div')
    .attr('class', 'spec-d3-event-tooltip')
    .attr('data-testid', 'spec-d3-event-tooltip')
    .attr('role', 'status')
    .attr('aria-live', 'polite');

  const renderEventTooltipContent = (
    ev: VolatilityEventFlag | null,
    breachOverride?: VolatilityThresholdBreach | null
  ) => {
    const matchedBreach =
      breachOverride ||
      (ev && thresholdEval?.enabled ? breachByMonth.get(ev.month) || null : null);

    if (!ev && !matchedBreach) {
      tooltipEl.classed('is-visible', false).attr('data-event-month', '');
      return;
    }

    if (!ev && matchedBreach) {
      const momSign = matchedBreach.monthlyChangePct > 0 ? '+' : '';
      const zSign = matchedBreach.priceZScore >= 0 ? '+' : '';
      tooltipEl
        .classed('is-visible', true)
        .classed('is-primary', false)
        .classed('is-secondary', true)
        .attr('data-event-month', matchedBreach.month)
        .attr('data-event-severity', 'threshold-breach')
        .html(
          `<div class="spec-d3-et-top">` +
            `<span class="spec-d3-et-tag">⚡ ${thresholdEval.sigmaLabel} THRESHOLD BREACH</span>` +
            `<span class="spec-d3-et-metrics">${matchedBreach.month} · $${matchedBreach.price.toFixed(2)} · <strong>${matchedBreach.volatilityIndex.toFixed(1)}v</strong> (${momSign}${matchedBreach.monthlyChangePct.toFixed(1)}% MoM · ${zSign}${matchedBreach.priceZScore.toFixed(2)}σ)</span>` +
          `</div>` +
          `<div class="spec-d3-et-desc">${matchedBreach.summary}</div>`
        );
      return;
    }

    const activeEv = ev!;
    const isPrimary = activeEv.isPrimaryPeak;
    const momSign = activeEv.monthlyChangePct > 0 ? '+' : '';
    const zSign = activeEv.zScore >= 0 ? '+' : '';
    const badgeTag = isPrimary
      ? '⚡ PEAK VOLATILITY EVENT'
      : activeEv.severity === 'drawdown-trough'
        ? '↘ 6M DRAWDOWN TROUGH'
        : 'Δ ELEVATED SWING EVENT';
    const breachPillHtml = matchedBreach
      ? ` <span class="spec-d3-et-sigma-pill">≥${thresholdEval.sigmaLabel} (${matchedBreach.effectiveSigmaScore.toFixed(1)}σ)</span>`
      : '';

    tooltipEl
      .classed('is-visible', true)
      .classed('is-primary', isPrimary)
      .classed('is-secondary', !isPrimary)
      .attr('data-event-month', activeEv.month)
      .attr('data-event-severity', activeEv.severity)
      .html(
        `<div class="spec-d3-et-top">` +
          `<span class="spec-d3-et-tag">${badgeTag}${breachPillHtml}</span>` +
          `<span class="spec-d3-et-metrics">${activeEv.month} · $${activeEv.price.toFixed(2)} · <strong>${activeEv.volatilityIndex.toFixed(1)}v</strong> (${momSign}${activeEv.monthlyChangePct.toFixed(1)}% MoM · ${zSign}${activeEv.zScore.toFixed(2)}σ)</span>` +
        `</div>` +
        `<div class="spec-d3-et-desc">${activeEv.summary}</div>`
      );
  };

  // Determine default active peak event (either options.selectedEventMonth or primary peak event)
  const initialPeakEvent =
    (options?.selectedEventMonth ? peakEventByMonth.get(options.selectedEventMonth) : null) ||
    peakEvents.find((ev) => ev.isPrimaryPeak) ||
    peakEvents[0] ||
    null;

  renderEventTooltipContent(initialPeakEvent);

  // ── Mouse-Wheel Zoom & Drag-to-Pan State & Coordinate Engine ──
  let currentZoom = clampD3ZoomPanTransform(options?.zoomTransform, innerW);
  const tx = (month: string): number => ((xPoint(month) ?? 0) * currentZoom.k) + currentZoom.x;

  // Interactive hover crosshair & hit columns
  const hoverGuide = g
    .append('line')
    .attr('class', 'd3-hover-guide')
    .attr('y1', 0)
    .attr('y2', innerH)
    .attr('stroke', '#ffd23f')
    .attr('stroke-width', 1.2)
    .attr('stroke-dasharray', '2 2')
    .style('opacity', 0);

  const notifyHover = (d: AdvancedPriceTrendPoint, isClick?: boolean) => {
    if (options?.onPointHover) {
      options.onPointHover(d, analytics);
    }
    if (options?.onPointSelect) {
      options.onPointSelect(d, analytics);
    }
    const matchedEv = peakEventByMonth.get(d.month) || null;
    const matchedBreach = thresholdEval?.enabled ? breachByMonth.get(d.month) || null : null;
    if (matchedEv || matchedBreach) {
      renderEventTooltipContent(matchedEv, matchedBreach);
      if (isClick && matchedEv && options?.onPeakEventSelect) {
        options.onPeakEventSelect(matchedEv, d, analytics);
      }
    }
  };

  let isPointerDragging = false;
  let pointerMovedPx = 0;

  const colW = innerW / Math.max(1, points.length);
  const hitCols = g
    .selectAll<SVGRectElement, AdvancedPriceTrendPoint>('.d3-hit-col')
    .data(points)
    .enter()
    .append('rect')
    .attr('class', 'd3-hit-col')
    .attr('data-month', (d) => d.month)
    .attr('data-is-peak-event', (d) => String(peakEventByMonth.has(d.month)))
    .attr('x', (_, i) => i * colW)
    .attr('y', -12)
    .attr('width', colW)
    .attr('height', innerH + 16)
    .attr('fill', 'transparent')
    .style('cursor', 'grab')
    .on('mouseenter', function (_, d) {
      if (isPointerDragging) return;
      const cx = tx(d.month);
      if (cx >= -6 && cx <= innerW + 6) {
        hoverGuide.attr('x1', cx).attr('x2', cx).style('opacity', 0.85);
      }
      notifyHover(d, false);
    })
    .on('click', function (_, d) {
      if (pointerMovedPx > 5) return;
      const cx = tx(d.month);
      if (cx >= -6 && cx <= innerW + 6) {
        hoverGuide.attr('x1', cx).attr('x2', cx).style('opacity', 0.95);
      }
      notifyHover(d, true);
    })
    .on('mouseleave', function () {
      hoverGuide.style('opacity', 0);
    });

  // Real-time geometry recalculation for mouse-wheel zoom & drag-to-pan
  const updateGeometriesForZoomPan = () => {
    const scaleFactor = Math.min(1.45, Math.sqrt(currentZoom.k));
    const barBaseW = mode === 'volatility-bars' ? 40 : 36;
    const barHalfLimit = mode === 'volatility-bars' ? 20 : 18;
    const scaledBarW = Math.min(barBaseW * scaleFactor, xBand.bandwidth() * currentZoom.k * 0.85);
    const scaledBarHalf = Math.min(barHalfLimit * scaleFactor, scaledBarW / 2);

    if (mode === 'composite') {
      const allPrices = points.flatMap((p) => [p.lowerBand, p.upperBand, p.price]);
      const minP = d3.min(allPrices) ?? analytics.sixMonthLow * 0.9;
      const maxP = d3.max(allPrices) ?? analytics.sixMonthHigh * 1.1;
      const padP = Math.max(4, (maxP - minP) * 0.18);
      const yPrice = d3
        .scaleLinear()
        .domain([Math.max(0, minP - padP), maxP + padP])
        .range([innerH, 0]);
      const yVol = d3
        .scaleLinear()
        .domain([0, 100])
        .range([innerH, Math.round(innerH * 0.18)]);

      const envGen = d3
        .area<AdvancedPriceTrendPoint>()
        .x((d) => tx(d.month))
        .y0((d) => yPrice(d.lowerBand))
        .y1((d) => yPrice(d.upperBand))
        .curve(d3.curveMonotoneX);
      stageG.select<SVGPathElement>('.d3-volatility-envelope').attr('d', envGen(points) || '');

      const rollGen = d3
        .line<AdvancedPriceTrendPoint>()
        .x((d) => tx(d.month))
        .y((d) => yPrice(d.rollingMean))
        .curve(d3.curveMonotoneX);
      stageG.select<SVGPathElement>('.d3-rolling-mean-line').attr('d', rollGen(points) || '');

      const volLineGen = d3
        .line<AdvancedPriceTrendPoint>()
        .x((d) => tx(d.month))
        .y((d) => yVol(d.volatilityIndex))
        .curve(d3.curveMonotoneX);
      stageG.select<SVGPathElement>('.d3-volatility-line').attr('d', volLineGen(points) || '');

      const priceLineGen = d3
        .line<AdvancedPriceTrendPoint>()
        .x((d) => tx(d.month))
        .y((d) => yPrice(d.price))
        .curve(d3.curveMonotoneX);
      stageG.select<SVGPathElement>('.d3-price-line').attr('d', priceLineGen(points) || '');

      stageG
        .selectAll<SVGRectElement, AdvancedPriceTrendPoint>('.d3-volatility-bar')
        .attr('x', (d) => tx(d.month) - scaledBarHalf)
        .attr('width', scaledBarW);

      stageG
        .selectAll<SVGCircleElement, AdvancedPriceTrendPoint>('.d3-vol-node')
        .attr('cx', (d) => tx(d.month));

      stageG
        .selectAll<SVGCircleElement, AdvancedPriceTrendPoint>('.d3-price-node')
        .attr('cx', (d) => tx(d.month));
    } else if (mode === 'volatility-bars') {
      const yVol = d3.scaleLinear().domain([0, 100]).range([innerH, 12]);
      const volAreaGen = d3
        .area<AdvancedPriceTrendPoint>()
        .x((d) => tx(d.month))
        .y0(innerH)
        .y1((d) => yVol(d.volatilityIndex))
        .curve(d3.curveMonotoneX);
      stageG.select<SVGPathElement>('.d3-vol-area').attr('d', volAreaGen(points) || '');

      stageG
        .selectAll<SVGRectElement, AdvancedPriceTrendPoint>('.d3-volatility-bar')
        .attr('x', (d) => tx(d.month) - scaledBarHalf)
        .attr('width', scaledBarW);

      stageG
        .selectAll<SVGTextElement, AdvancedPriceTrendPoint>('.d3-bar-val-label')
        .attr('x', (d) => tx(d.month));
    } else {
      const maxAbsZ = Math.max(1.8, d3.max(points, (d) => Math.abs(d.zScore)) ?? 1.8);
      const yZ = d3
        .scaleLinear()
        .domain([-maxAbsZ - 0.3, maxAbsZ + 0.3])
        .range([innerH, 10]);
      const zLineGen = d3
        .line<AdvancedPriceTrendPoint>()
        .x((d) => tx(d.month))
        .y((d) => yZ(d.zScore))
        .curve(d3.curveMonotoneX);
      stageG.select<SVGPathElement>('.d3-zscore-line').attr('d', zLineGen(points) || '');

      stageG
        .selectAll<SVGCircleElement, AdvancedPriceTrendPoint>('.d3-zscore-node')
        .attr('cx', (d) => tx(d.month));

      stageG
        .selectAll<SVGTextElement, AdvancedPriceTrendPoint>('.d3-zscore-label')
        .attr('x', (d) => tx(d.month));
    }

    // Update High Volatility Threshold breach bands, rings, and badges
    if (thresholdEval && thresholdEval.enabled) {
      const bandHalfW = Math.max(14, Math.min(24 * scaleFactor, xBand.bandwidth() * 0.62 * scaleFactor));
      thresholdBgLayer
        .selectAll<SVGRectElement, unknown>('.d3-threshold-period-band')
        .each(function () {
          const el = d3.select(this);
          const m = el.attr('data-month') || '';
          const cx = tx(m);
          el.attr('x', cx - bandHalfW).attr('width', bandHalfW * 2);
        });

      stageG
        .selectAll<SVGGElement, unknown>('.d3-threshold-breach-marker')
        .each(function () {
          const gEl = d3.select(this);
          const m = gEl.attr('data-month') || '';
          const cx = tx(m);
          gEl.select('.d3-threshold-breach-ring').attr('cx', cx);
          gEl
            .select('.d3-threshold-breach-badge')
            .attr('transform', `translate(${cx}, ${innerH - 9})`);
        });
    }

    // Update Peak Volatility Event markers
    if (peakEvents.length > 0) {
      stageG
        .selectAll<SVGGElement, unknown>('.d3-peak-event-marker')
        .each(function () {
          const gEl = d3.select(this);
          const m = gEl.attr('data-month') || '';
          const ev = peakEventByMonth.get(m);
          const cx = tx(m);
          gEl.select('.d3-peak-marker-line').attr('x1', cx).attr('x2', cx);
          gEl.select('.d3-peak-marker-halo').attr('cx', cx);
          const pillW = ev ? Math.max(54, ev.shortTag.length * 5.8 + 10) : 58;
          const clampedPillX = currentZoom.isZoomed
            ? cx
            : Math.max(pillW / 2, Math.min(innerW - pillW / 2, cx));
          gEl.select('.d3-peak-marker-pill').attr('transform', `translate(${clampedPillX}, -6)`);
        });
    }

    // Update Bottom X-Axis Ticks
    bottomAxisG.selectAll<SVGGElement, string>('.tick').each(function (d) {
      const tickX = tx(String(d));
      const inBounds = tickX >= -10 && tickX <= innerW + 10;
      d3.select(this)
        .attr('transform', `translate(${tickX},0)`)
        .attr('opacity', inBounds ? 1 : 0);
    });

    // Update Interactive Hit Columns to match zoomed positions
    const hitSpan = Math.max(24, (innerW / Math.max(1, points.length - 1)) * currentZoom.k);
    hitCols
      .attr('x', (d) => tx(d.month) - hitSpan / 2)
      .attr('width', hitSpan)
      .style('cursor', isPointerDragging ? 'grabbing' : currentZoom.isZoomed ? 'grab' : 'crosshair');
  };

  const applyZoomPanState = (
    nextInput: D3ZoomPanTransformInput,
    source = 'programmatic'
  ): D3ZoomedVisibleWindow => {
    currentZoom = clampD3ZoomPanTransform(nextInput, innerW);
    const windowState = resolveD3ZoomedVisibleWindow(months, innerW, currentZoom, 14);

    container.setAttribute('data-zoom-k', String(currentZoom.k));
    container.setAttribute('data-zoom-x', String(currentZoom.x));
    container.setAttribute('data-is-zoomed', String(currentZoom.isZoomed));
    container.setAttribute('data-visible-window', windowState.windowLabel);
    container.setAttribute('data-visible-months', windowState.visibleMonths.join(','));
    container.setAttribute('data-zoom-source', source);
    container.classList.toggle('is-d3-zoomed', currentZoom.isZoomed);

    svg
      .attr('data-zoom-k', String(currentZoom.k))
      .attr('data-zoom-x', String(currentZoom.x))
      .attr('data-is-zoomed', String(currentZoom.isZoomed))
      .attr('data-visible-window', windowState.windowLabel)
      .attr('data-visible-months', windowState.visibleMonths.join(','));

    updateGeometriesForZoomPan();

    if (options?.onZoomPanChange) {
      options.onZoomPanChange(windowState, analytics);
    }
    return windowState;
  };

  // Apply initial zoom/pan state
  applyZoomPanState(currentZoom, 'init');

  // Wire Mouse-Wheel Zoom & Drag-to-Pan on SVG
  const svgNode = svg.node();
  if (svgNode) {
    svgNode.addEventListener(
      'wheel',
      (evt: WheelEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        const rect = svgNode.getBoundingClientRect();
        const rawClientX = evt.clientX - rect.left - margin.left;
        const anchorX =
          Number.isFinite(rawClientX) && rect.width > 0
            ? Math.max(0, Math.min(innerW, rawClientX))
            : innerW / 2;
        const nextZoom = computeD3WheelZoomTransform(
          currentZoom,
          evt.deltaY,
          anchorX,
          innerW
        );
        hoverGuide.style('opacity', 0);
        applyZoomPanState(nextZoom, 'wheel');
      },
      { passive: false }
    );

    let dragStartX = 0;
    let dragStartTransform = currentZoom;

    const onWindowMouseMove = (moveEvt: MouseEvent) => {
      if (!isPointerDragging) return;
      const dx = moveEvt.clientX - dragStartX;
      pointerMovedPx = Math.max(pointerMovedPx, Math.abs(dx));
      if (!dragStartTransform.isZoomed) return;
      const nextZoom = computeD3DragPanTransform(dragStartTransform, dx, innerW);
      hoverGuide.style('opacity', 0);
      applyZoomPanState(nextZoom, 'drag');
    };

    const onWindowMouseUp = () => {
      if (!isPointerDragging) return;
      isPointerDragging = false;
      container.setAttribute('data-is-dragging', 'false');
      container.classList.remove('is-d3-dragging');
      updateGeometriesForZoomPan();
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };

    svgNode.addEventListener('mousedown', (downEvt: MouseEvent) => {
      if (downEvt.button !== 0) return;
      isPointerDragging = true;
      pointerMovedPx = 0;
      dragStartX = downEvt.clientX;
      dragStartTransform = { ...currentZoom };
      container.setAttribute('data-is-dragging', 'true');
      container.classList.add('is-d3-dragging');
      updateGeometriesForZoomPan();
      window.addEventListener('mousemove', onWindowMouseMove);
      window.addEventListener('mouseup', onWindowMouseUp);
    });

    svgNode.addEventListener('dblclick', (dblEvt: MouseEvent) => {
      dblEvt.preventDefault();
      if (currentZoom.isZoomed) {
        applyZoomPanState({ k: 1, x: 0 }, 'dblclick-reset');
      } else {
        const rect = svgNode.getBoundingClientRect();
        const rawClientX = dblEvt.clientX - rect.left - margin.left;
        const anchorX =
          Number.isFinite(rawClientX) && rect.width > 0
            ? Math.max(0, Math.min(innerW, rawClientX))
            : innerW / 2;
        const zoomed = computeD3WheelZoomTransform(currentZoom, -180, anchorX, innerW);
        applyZoomPanState(zoomed, 'dblclick-zoom');
      }
    });
  }

  // Expose Imperative Controller on Container for Toolbar Controls & Tests
  (container as any).__voltboxD3ZoomController = {
    applyTransform: (nextTransform: D3ZoomPanTransformInput, source = 'api') =>
      applyZoomPanState(nextTransform, source),
    zoomBy: (factor = D3_ZOOM_STEP_FACTOR, anchorRatio = 0.5) => {
      const safeRatio = Math.max(0, Math.min(1, Number(anchorRatio) || 0.5));
      const anchorX = innerW * safeRatio;
      const syntheticDeltaY = factor >= 1 ? -Math.round((factor - 1) * 280) : Math.round((1 / factor - 1) * 280);
      const next = computeD3WheelZoomTransform(currentZoom, syntheticDeltaY, anchorX, innerW);
      return applyZoomPanState(next, 'toolbar-zoom');
    },
    panBy: (deltaX = D3_PAN_STEP_PX) => {
      const next = computeD3DragPanTransform(currentZoom, deltaX, innerW);
      return applyZoomPanState(next, 'toolbar-pan');
    },
    resetZoom: () => applyZoomPanState({ k: 1, x: 0 }, 'toolbar-reset'),
    getState: () => resolveD3ZoomedVisibleWindow(months, innerW, currentZoom, 14),
  };

  // Subtle GSAP transition choreography when rendering or switching between modes
  const shouldAnimate = options?.animateTransition !== false && !gsapProfile.reducedMotion;
  if (shouldAnimate) {
    container.setAttribute('data-gsap-transition-state', 'running');
    svg.attr('data-gsap-transition-state', 'running');

    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        container.setAttribute('data-gsap-transition-state', 'completed');
        svg.attr('data-gsap-transition-state', 'completed');
        activeTimelines.delete(container);
      },
    });
    activeTimelines.set(container, tl);

    const stageNode = stageG.node();
    if (stageNode) {
      tl.fromTo(
        stageNode,
        {
          opacity: gsapProfile.isModeSwitch ? 0.24 : 0.65,
          x: gsapProfile.stageShiftPx,
        },
        {
          opacity: 1,
          x: 0,
          duration: gsapProfile.stageDurationSec,
          ease: gsapProfile.stageEase,
        },
        0
      );
    }

    // Envelope / Area subtle vertical reveal
    const areas = container.querySelectorAll('.d3-volatility-envelope, .d3-vol-area');
    if (areas.length > 0) {
      tl.fromTo(
        areas,
        {
          opacity: 0,
          scaleY: 0.85,
          transformOrigin: '50% 100%',
        },
        {
          opacity: 1,
          scaleY: 1,
          duration: 0.38,
          ease: 'power2.out',
        },
        0.02
      );
    }

    // Volatility bars staggered rise from baseline
    const bars = Array.from(container.querySelectorAll<SVGRectElement>('.d3-volatility-bar'));
    if (bars.length > 0) {
      bars.forEach((bar, idx) => {
        const targetY = Number(bar.getAttribute('data-target-y') || bar.getAttribute('y') || innerH);
        const targetH = Number(bar.getAttribute('data-target-h') || bar.getAttribute('height') || 4);
        tl.fromTo(
          bar,
          {
            attr: { y: innerH, height: 0 },
            opacity: 0.25,
          },
          {
            attr: { y: targetY, height: targetH },
            opacity: 1,
            duration: gsapProfile.barDurationSec,
            ease: gsapProfile.barEase,
          },
          0.03 + idx * gsapProfile.barStaggerSec
        );
      });
    }

    // Peak event vertical marker lines & threshold cutoff line subtle reveal
    const markerLines = container.querySelectorAll('.d3-peak-marker-line, .d3-threshold-cutoff-line');
    if (markerLines.length > 0) {
      tl.fromTo(
        markerLines,
        { opacity: 0, scaleY: 0.2, transformOrigin: '50% 0%' },
        { opacity: 0.9, scaleY: 1, duration: 0.36, stagger: 0.04, ease: 'power2.out' },
        0.04
      );
    }

    const thresholdBands = container.querySelectorAll('.d3-threshold-period-band');
    if (thresholdBands.length > 0) {
      tl.fromTo(
        thresholdBands,
        { opacity: 0, scaleY: 0.65, transformOrigin: '50% 100%' },
        { opacity: 1, scaleY: 1, duration: 0.34, stagger: 0.045, ease: 'power2.out' },
        0.03
      );
    }

    // Line curves subtle stroke-dashoffset draw
    const paths = Array.from(container.querySelectorAll<SVGPathElement>('.d3-anim-path'));
    paths.forEach((pathEl) => {
      try {
        const totalLen = Math.max(40, Math.ceil(pathEl.getTotalLength()));
        tl.fromTo(
          pathEl,
          {
            strokeDasharray: totalLen,
            strokeDashoffset: Math.round(totalLen * 0.42),
            opacity: 0.35,
          },
          {
            strokeDashoffset: 0,
            opacity: 1,
            duration: gsapProfile.pathDurationSec,
            ease: gsapProfile.pathEase,
            onComplete: () => {
              pathEl.removeAttribute('stroke-dasharray');
              pathEl.removeAttribute('stroke-dashoffset');
            },
          },
          0.03
        );
      } catch {
        // Fallback if SVG geometry measurement is unavailable
      }
    });

    // Data nodes, peak marker pills & labels staggered entrance
    const nodes = container.querySelectorAll('.d3-anim-node');
    if (nodes.length > 0) {
      tl.fromTo(
        nodes,
        {
          opacity: 0,
          scale: 0.55,
          transformOrigin: '50% 50%',
        },
        {
          opacity: 1,
          scale: 1,
          duration: gsapProfile.nodeDurationSec,
          stagger: gsapProfile.nodeStaggerSec,
          ease: gsapProfile.nodeEase,
        },
        0.06
      );
    }
  } else {
    container.setAttribute('data-gsap-transition-state', 'completed');
    svg.attr('data-gsap-transition-state', 'completed');
  }

  return analytics;
}

const mountedRoots = new WeakMap<Element, Root>();

declare global {
  interface Window {
    d3?: typeof d3;
    gsap?: typeof gsap;
    renderVoltboxPriceChart?: (
      container: HTMLElement | null,
      data: PricePoint[],
      options?: ChartOptions
    ) => void;
    renderVoltboxD3AdvancedPriceTrends?: (
      container: HTMLElement | null,
      data: PricePoint[],
      options?: D3VolatilityChartOptions
    ) => AdvancedPriceTrendsAnalytics | null;
  }
}

window.d3 = d3;
window.gsap = gsap;

window.renderVoltboxPriceChart = function (
  container: HTMLElement | null,
  data: PricePoint[],
  options?: ChartOptions
) {
  if (!container) return;
  let root = mountedRoots.get(container);
  if (!root) {
    root = createRoot(container);
    mountedRoots.set(container, root);
  }
  root.render(<PriceHistoryChart data={data} options={options} />);
};

window.renderVoltboxD3AdvancedPriceTrends = function (
  container: HTMLElement | null,
  data: PricePoint[],
  options?: D3VolatilityChartOptions
): AdvancedPriceTrendsAnalytics | null {
  if (!container) return null;
  return renderD3AdvancedTrendsIntoContainer(container, data, options);
};




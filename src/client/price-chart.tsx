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

const mountedRoots = new WeakMap<Element, Root>();

declare global {
  interface Window {
    renderVoltboxPriceChart?: (
      container: HTMLElement | null,
      data: PricePoint[],
      options?: ChartOptions
    ) => void;
  }
}

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

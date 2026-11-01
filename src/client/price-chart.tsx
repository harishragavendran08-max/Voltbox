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
  variant?: 'card' | 'drawer';
  accentColor?: string;
  showMarketAvg?: boolean;
  height?: number;
}

interface PriceHistoryChartProps {
  data: PricePoint[];
  options?: ChartOptions;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data, options }) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const isDrawer = options?.variant === 'drawer';
  const defaultWidth = isDrawer ? 380 : 210;
  const chartHeight = options?.height || (isDrawer ? 168 : 112);
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
  const minVal = Math.min(...prices);
  const maxVal = Math.max(...prices);
  const avgVal = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
  const pad = Math.max(5, Math.round((maxVal - minVal) * 0.25));
  const domainMin = Math.max(0, Math.floor(minVal - pad));
  const domainMax = Math.ceil(maxVal + pad);
  const strokeColor = options?.accentColor || '#ffd23f';

  return (
    <div
      ref={wrapRef}
      className={`vb-recharts-host ${isDrawer ? 'vb-recharts-drawer' : 'vb-recharts-card'}`}
      data-testid={isDrawer ? 'drawer-recharts-host' : 'card-recharts-host'}
      style={{ width: '100%' }}
    >
      <LineChart
        width={width}
        height={chartHeight}
        data={data}
        margin={
          isDrawer
            ? { top: 10, right: 12, left: -4, bottom: 4 }
            : { top: 8, right: 8, left: -10, bottom: 2 }
        }
      >
        <CartesianGrid stroke="#262b36" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="#7c8494"
          tick={{ fill: '#8e96a6', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={{ stroke: '#262b36' }}
          tickLine={false}
        />
        <YAxis
          domain={[domainMin, domainMax]}
          stroke="#7c8494"
          tick={{ fill: '#8e96a6', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${Math.round(Number(v))}`}
          width={48}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#13161c',
            border: '1px solid #2e3442',
            borderRadius: '8px',
            padding: '6px 10px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: '#e7e9ee',
            boxShadow: '0 10px 24px rgba(0,0,0,0.5)',
          }}
          itemStyle={{ color: strokeColor, padding: 0 }}
          labelStyle={{ color: '#9aa1ad', marginBottom: '2px', fontWeight: 700 }}
          formatter={(value: unknown, name: unknown) => [
            `$${Number(value).toFixed(2)}`,
            name === 'marketAvg' ? 'Market Avg' : 'Voltbox Price',
          ]}
        />
        <ReferenceLine
          y={avgVal}
          stroke="rgba(45, 212, 191, 0.35)"
          strokeDasharray="2 2"
        />
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
          dot={{ r: isDrawer ? 3.5 : 2.5, fill: '#14171e', stroke: strokeColor, strokeWidth: 2 }}
          activeDot={{ r: 5, fill: strokeColor, stroke: '#0f1115', strokeWidth: 2 }}
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

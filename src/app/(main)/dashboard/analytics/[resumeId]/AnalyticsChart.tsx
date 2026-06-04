'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import styles from './Analytics.module.css';

interface TimelineItem {
  date: string;
  count: number;
}

interface AnalyticsChartProps {
  timeline: TimelineItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div className={styles.chartTooltip} style={{ position: 'relative', transform: 'none' }}>
        <div className={styles.tooltipDate}>{formattedDate}</div>
        <div className={styles.tooltipValue}>
          <span className={styles.tooltipValueNumber}>{payload[0].value}</span>
          <span className={styles.tooltipValueText}> views</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsChart({ timeline }: AnalyticsChartProps) {
  if (!timeline || timeline.length === 0) return null;

  // Format data for recharts
  const data = timeline.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }));

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>Views Timeline (Last 30 Days)</h2>
        <span className={styles.chartLiveBadge}>Interactive</span>
      </div>

      <div className={styles.chartContainer} style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(tick) => {
                const date = new Date(tick);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              dy={10}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(160, 120, 85, 0.25)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCount)"
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff', fill: 'var(--primary)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

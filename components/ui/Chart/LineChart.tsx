'use client';

// v2 #2: 자체 SVG multi-line chart (차트 라이브러리 의존성 없이).
// X축: timestamp (ms epoch), Y축: numeric value. 각 series별 line + 색.
// hover 시 가장 가까운 point의 tooltip 표시.

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface LinePoint {
  date: string; // ISO 8601
  value: number;
}

export interface LineSeries {
  name: string;
  color: string; // CSS color
  points: LinePoint[];
}

interface LineChartProps {
  series: LineSeries[];
  height?: number;
  formatY?: (n: number) => string;
  formatX?: (iso: string) => string;
  className?: string;
}

const DEFAULT_HEIGHT = 280;
const PAD_LEFT = 56;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 32;

function defaultFormatY(n: number): string {
  if (Math.abs(n) >= 1e8) return `₩${(n / 1e8).toFixed(1)}억`;
  if (Math.abs(n) >= 1e4) return `₩${Math.round(n / 1e4).toLocaleString()}만`;
  return `₩${Math.round(n).toLocaleString()}`;
}

function defaultFormatX(iso: string): string {
  // YYYY-MM-DD → 'YY/MM/DD
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso.slice(0, 10);
  return `${m[1].slice(2)}/${m[2]}/${m[3]}`;
}

export function LineChart({
  series,
  height = DEFAULT_HEIGHT,
  formatY = defaultFormatY,
  formatX = defaultFormatX,
  className,
}: LineChartProps) {
  const [hover, setHover] = useState<{
    seriesIdx: number;
    pointIdx: number;
  } | null>(null);

  const dims = useMemo(() => {
    const allPoints = series.flatMap((s) =>
      s.points.map((p) => ({ ...p, ms: new Date(p.date).getTime() })),
    );
    if (allPoints.length === 0) {
      return null;
    }
    const minMs = Math.min(...allPoints.map((p) => p.ms));
    const maxMs = Math.max(...allPoints.map((p) => p.ms));
    const minY = Math.min(0, ...allPoints.map((p) => p.value));
    const maxY = Math.max(...allPoints.map((p) => p.value));
    return { minMs, maxMs, minY, maxY };
  }, [series]);

  if (!dims || series.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-dashed border-line-2 text-[12.5px] text-muted',
          className,
        )}
        style={{ height }}
      >
        표시할 데이터가 없습니다.
      </div>
    );
  }

  const { minMs, maxMs, minY, maxY } = dims;
  const yRange = maxY - minY || 1;
  const xRange = maxMs - minMs || 1;

  const width = 800; // viewBox 폭. 컨테이너에 맞춰 scale.
  const innerW = width - PAD_LEFT - PAD_RIGHT;
  const innerH = height - PAD_TOP - PAD_BOTTOM;

  const xScale = (ms: number) =>
    PAD_LEFT + ((ms - minMs) / xRange) * innerW;
  const yScale = (v: number) =>
    PAD_TOP + innerH - ((v - minY) / yRange) * innerH;

  // Y축 grid: 5 ticks
  const yTicks: Array<{ v: number; y: number; label: string }> = [];
  for (let i = 0; i <= 4; i++) {
    const v = minY + (yRange * i) / 4;
    yTicks.push({ v, y: yScale(v), label: formatY(v) });
  }

  // X축 ticks: 시작 + 중간 2개 + 끝
  const xTicks: Array<{ ms: number; x: number; label: string }> = [];
  for (let i = 0; i <= 3; i++) {
    const ms = minMs + (xRange * i) / 3;
    const iso = new Date(ms).toISOString();
    xTicks.push({ ms, x: xScale(ms), label: formatX(iso) });
  }

  // 각 series의 path 문자열
  const paths = series.map((s) => {
    const pts = s.points
      .map((p) => ({ ms: new Date(p.date).getTime(), v: p.value }))
      .sort((a, b) => a.ms - b.ms);
    if (pts.length === 0) return '';
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.ms)} ${yScale(p.v)}`)
      .join(' ');
  });

  const hovered =
    hover != null
      ? series[hover.seriesIdx]?.points[hover.pointIdx]
      : null;
  const hoveredSeries = hover != null ? series[hover.seriesIdx] : null;

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="MA 평균 단가 timeline 차트"
      >
        {/* Y축 grid + labels */}
        {yTicks.map((t, i) => (
          <g key={`y-${i}`}>
            <line
              x1={PAD_LEFT}
              x2={width - PAD_RIGHT}
              y1={t.y}
              y2={t.y}
              stroke="rgb(var(--line-2))"
              strokeDasharray="2,3"
              strokeWidth="1"
            />
            <text
              x={PAD_LEFT - 6}
              y={t.y + 3}
              textAnchor="end"
              fontSize="10"
              fill="rgb(var(--muted-2))"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* X축 labels */}
        {xTicks.map((t, i) => (
          <text
            key={`x-${i}`}
            x={t.x}
            y={height - PAD_BOTTOM + 14}
            textAnchor="middle"
            fontSize="10"
            fill="rgb(var(--muted-2))"
          >
            {t.label}
          </text>
        ))}

        {/* 각 series 라인 */}
        {paths.map((d, i) => (
          <path
            key={`line-${i}`}
            d={d}
            stroke={series[i].color}
            strokeWidth="2"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* 각 series의 point 마커 + invisible hover targets */}
        {series.map((s, si) => (
          <g key={`points-${si}`}>
            {s.points.map((p, pi) => {
              const ms = new Date(p.date).getTime();
              const cx = xScale(ms);
              const cy = yScale(p.value);
              return (
                <g key={`p-${si}-${pi}`}>
                  <circle cx={cx} cy={cy} r="3" fill={s.color} />
                  <circle
                    cx={cx}
                    cy={cy}
                    r="10"
                    fill="transparent"
                    onMouseEnter={() => setHover({ seriesIdx: si, pointIdx: pi })}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: 'crosshair' }}
                  />
                </g>
              );
            })}
          </g>
        ))}

        {/* Hover tooltip — SVG foreignObject 대신 단순 text rect */}
        {hovered && hoveredSeries && (() => {
          const ms = new Date(hovered.date).getTime();
          const tx = xScale(ms);
          const ty = yScale(hovered.value);
          // tooltip은 point 우상단. 우측 경계 넘으면 좌측으로.
          const tooltipW = 140;
          const tooltipH = 44;
          const px =
            tx + tooltipW + 8 > width - PAD_RIGHT
              ? tx - tooltipW - 8
              : tx + 8;
          const py = Math.max(PAD_TOP, ty - tooltipH - 4);
          return (
            <g pointerEvents="none">
              <rect
                x={px}
                y={py}
                width={tooltipW}
                height={tooltipH}
                rx="4"
                fill="rgb(var(--ink))"
                opacity="0.95"
              />
              <text
                x={px + 8}
                y={py + 16}
                fontSize="11"
                fontWeight="600"
                fill="white"
              >
                {hoveredSeries.name} · {formatX(hovered.date)}
              </text>
              <text
                x={px + 8}
                y={py + 32}
                fontSize="11"
                fill="rgba(255,255,255,0.85)"
              >
                {formatY(hovered.value)}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 px-2">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-3 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[11.5px] font-medium text-ink-2">
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

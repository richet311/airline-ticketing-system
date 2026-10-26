export const CHART_BLUE = "#1a66da";
export const PIE_COLORS = ["#0b2e6b", "#1a66da", "#6fa8f0", "#c9ddfa"];

const AXIS = "#d1d5db";
const TEXT = "#4b5563";

export function BarChart({ data, format }: { data: { label: string; value: number }[]; format: (value: number) => string }) {
  const width = 640;
  const labelWidth = 110;
  const valueWidth = 70;
  const rowHeight = 28;
  const barSpace = width - labelWidth - valueWidth;
  const max = Math.max(...data.map((d) => d.value), 1);
  const height = data.length * rowHeight;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl" role="img" aria-label="Bar chart">
      <line x1={labelWidth} y1={0} x2={labelWidth} y2={height} stroke={AXIS} />
      {data.map((d, i) => {
        const y = i * rowHeight;
        const barWidth = Math.max(2, (d.value / max) * barSpace);
        return (
          <g key={d.label}>
            <title>{`${d.label}: ${format(d.value)}`}</title>
            <text x={labelWidth - 8} y={y + rowHeight / 2} textAnchor="end" dominantBaseline="middle" fontSize="12" fill={TEXT}>
              {d.label}
            </text>
            <rect x={labelWidth} y={y + 6} width={barWidth} height={rowHeight - 12} rx={4} fill={CHART_BLUE} />
            <text x={labelWidth + barWidth + 6} y={y + rowHeight / 2} dominantBaseline="middle" fontSize="12" fill={TEXT}>
              {format(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function PieChart({ data, format }: { data: { label: string; value: number }[]; format: (value: number) => string }) {
  const size = 220;
  const radius = 100;
  const center = size / 2;
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

  const slices = data.map((d, i) => {
    const before = data.slice(0, i).reduce((sum, earlier) => sum + earlier.value, 0);
    const start = -Math.PI / 2 + (before / total) * Math.PI * 2;
    const sweep = (d.value / total) * Math.PI * 2;
    const end = start + sweep;
    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    const large = sweep > Math.PI ? 1 : 0;
    const path =
      sweep >= Math.PI * 2 - 0.0001
        ? `M ${center - radius} ${center} a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 ${-radius * 2} 0`
        : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
    return { ...d, path, color: PIE_COLORS[i % PIE_COLORS.length], share: (d.value / total) * 100 };
  });

  return (
    <div className="flex flex-wrap items-center gap-8">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-56" role="img" aria-label="Pie chart">
        {slices.map((slice) => (
          <path key={slice.label} d={slice.path} fill={slice.color} stroke="#ffffff" strokeWidth={2}>
            <title>{`${slice.label}: ${format(slice.value)} (${slice.share.toFixed(1)}%)`}</title>
          </path>
        ))}
        <circle cx={center} cy={center} r={radius} fill="none" stroke={AXIS} strokeWidth={1} />
      </svg>
      <ul className="space-y-2 text-sm text-gray-700">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm border border-gray-300" style={{ backgroundColor: slice.color }} />
            <span className="font-semibold">{slice.label}</span>
            <span>
              {format(slice.value)} · {slice.share.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LineChart({ data, format }: { data: { label: string; value: number }[]; format: (value: number) => string }) {
  const width = 640;
  const height = 260;
  const left = 70;
  const right = 20;
  const top = 15;
  const bottom = 40;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const highest = Math.max(...data.map((d) => d.value), 1);
  const lowest = Math.min(...data.map((d) => d.value), 0);
  const rough = (highest - lowest) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude;
  const min = Math.floor(lowest / step) * step;
  const max = Math.ceil(highest / step) * step;
  const x = (i: number) => left + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth);
  const y = (value: number) => top + plotHeight - ((value - min) / (max - min)) * plotHeight;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);
  const tickLabel = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl" role="img" aria-label="Line chart">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke={AXIS} strokeDasharray="3 3" />
          <text x={left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill={TEXT}>
            {tickLabel(tick)}
          </text>
        </g>
      ))}
      <polyline points={points} fill="none" stroke={CHART_BLUE} strokeWidth={2} />
      {data.map((d, i) => (
        <circle key={d.label} cx={x(i)} cy={y(d.value)} r={4} fill={CHART_BLUE} stroke="#ffffff" strokeWidth={2}>
          <title>{`${d.label}: ${format(d.value)}`}</title>
        </circle>
      ))}
      {data.map((d, i) =>
        i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2) ? (
          <text
            key={d.label}
            x={x(i)}
            y={height - 15}
            textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
            fontSize="11"
            fill={TEXT}
          >
            {d.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

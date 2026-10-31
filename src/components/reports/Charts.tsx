export const CHART_BLUE = "#1a66da";
export const PIE_COLORS = ["#0b2e6b", "#1a66da", "#6fa8f0", "#c9ddfa"];

const AXIS = "#d1d5db";
const TEXT = "#4b5563";

export function BarChart({
  data,
  format,
  max = Math.max(...data.map((d) => d.value), 1),
}: {
  data: { label: string; value: number }[];
  format: (value: number) => string;
  max?: number;
}) {
  const width = 640;
  const labelWidth = 130;
  const valueWidth = 70;
  const rowHeight = 28;
  const barSpace = width - labelWidth - valueWidth;
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

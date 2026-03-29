import { motion } from 'motion/react';

interface ScentRadarProps {
  stats: { name: string; color: string; percentage: number }[];
}

function splitLabel(name: string): [string, string | null] {
  if (name.length <= 5) return [name, null];
  const mid = Math.ceil(name.length / 2);
  return [name.slice(0, mid), name.slice(mid)];
}

export function ScentRadar({ stats }: ScentRadarProps) {
  const cx = 110, cy = 110, maxRadius = 70;
  const levels = [0.25, 0.5, 0.75, 1];
  const angleStep = (2 * Math.PI) / stats.length;
  const maxPct = Math.max(...stats.map(s => s.percentage), 1);
  const normalize = (pct: number) => pct / maxPct;

  const toXY = (index: number, radius: number) => {
    const angle = index * angleStep - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const slices = stats.map((s, i) => {
    const r = maxRadius * normalize(s.percentage);
    const p0 = toXY(i, r);
    const p1 = toXY((i + 1) % stats.length, maxRadius * normalize(stats[(i + 1) % stats.length].percentage));
    return { color: s.color, points: `${cx},${cy} ${p0.x},${p0.y} ${p1.x},${p1.y}` };
  });

  const outlinePoints = stats
    .map((s, i) => { const p = toXY(i, maxRadius * normalize(s.percentage)); return `${p.x},${p.y}`; })
    .join(' ');

  return (
    <svg width="220" height="220" viewBox="0 0 220 220">
      {levels.map((level) => (
        <polygon
          key={level}
          points={stats.map((_, i) => { const p = toXY(i, maxRadius * level); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="#E8E6E1" strokeWidth="0.5"
        />
      ))}
      {stats.map((_, i) => {
        const p = toXY(i, maxRadius);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E8E6E1" strokeWidth="0.5" />;
      })}

      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 0.6 }}>
        {slices.map((slice, i) => (
          <polygon key={i} points={slice.points} fill={slice.color} opacity={0.25} />
        ))}
      </motion.g>

      <motion.polygon
        points={outlinePoints}
        fill="none" stroke="rgba(107,123,94,0.5)" strokeWidth="1.2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.5 }}
      />

      {stats.map((s, i) => {
        const p = toXY(i, maxRadius * normalize(s.percentage));
        return (
          <motion.circle key={i} cx={p.x} cy={p.y} r="3.5" fill={s.color}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 1.2 + i * 0.05, type: 'spring' }}
          />
        );
      })}

      {stats.map((s, i) => {
        const p = toXY(i, maxRadius + 22);
        const [line1, line2] = splitLabel(s.name);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
            fill={s.color} fontWeight="500" style={{ fontSize: '7px' }}>
            {line2 ? (
              <>
                <tspan x={p.x} dy="-0.6em">{line1}</tspan>
                <tspan x={p.x} dy="1.2em">{line2}</tspan>
              </>
            ) : (
              line1
            )}
          </text>
        );
      })}
    </svg>
  );
}

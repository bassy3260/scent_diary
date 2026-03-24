import { motion } from 'motion/react';
import { buildAccordStats } from '../../utils/mypage';
import type { RecommendDetailResult } from '../../types/mypage.types';
import { ScentRadar } from './ScentRadar';

interface ScentDnaSectionProps {
  results: RecommendDetailResult[];
  delay?: number;
}

export function ScentDnaSection({ results, delay = 1 }: ScentDnaSectionProps) {
  const stats = buildAccordStats(results).slice(0, 5);
  if (stats.length === 0) return null;

  return (
    <motion.div
      className="mt-6 p-5 rounded-2xl"
      style={{ backgroundColor: '#F5F3EF' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      <p className="text-[#B8B4AE] mb-1" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
        YOUR SCENT DNA
      </p>
      <p className="text-[#1A1A1A] mb-4" style={{ fontSize: '0.9375rem', fontFamily: "'Playfair Display', serif" }}>
        이번 추천에서 읽은 취향 결
      </p>

      <div className="flex justify-center mb-4">
        <ScentRadar stats={stats} />
      </div>

      <div className="space-y-2.5">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.1 + index * 0.06, duration: 0.35 }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#1A1A1A]" style={{ fontSize: '0.75rem' }}>{stat.name}</span>
                <span className="text-[#8A8680]" style={{ fontSize: '0.6875rem' }}>{stat.percentage}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E8E6E1]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: stat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentage}%` }}
                  transition={{ delay: delay + 0.2 + index * 0.06, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

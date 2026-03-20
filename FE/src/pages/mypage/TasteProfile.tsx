import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { useAppStore } from '../../store';
import { mockPerfumes } from '../../constants/perfumes';

export function TasteProfile() {
  const { navigateTo, savedPerfumes } = useAppStore();
  const saved = savedPerfumes.length > 0
    ? mockPerfumes.filter(p => savedPerfumes.includes(p.id))
    : mockPerfumes.slice(0, 3);

  // Calculate stats
  const allAccords = saved.flatMap(p => p.accords);
  const accordStats: Record<string, { total: number; color: string; count: number }> = {};
  allAccords.forEach(a => {
    if (!accordStats[a.name]) accordStats[a.name] = { total: 0, color: a.color, count: 0 };
    accordStats[a.name].total += a.percentage;
    accordStats[a.name].count++;
  });
  const sortedAccords = Object.entries(accordStats)
    .map(([name, data]) => ({ name, avg: Math.round(data.total / data.count), color: data.color }))
    .sort((a, b) => b.avg - a.avg);

  const allNotes = saved.flatMap(p => [...p.topNotes, ...p.middleNotes, ...p.baseNotes]);
  const noteCounts: Record<string, number> = {};
  allNotes.forEach(n => { noteCounts[n.name] = (noteCounts[n.name] || 0) + 1; });
  const topNotes = Object.entries(noteCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-3 flex items-center gap-3">
        <motion.button onClick={() => navigateTo('mypage')} whileTap={{ scale: 0.9 }}>
          <ChevronLeft size={24} className="text-[#8A8680]" />
        </motion.button>
        <div>
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>TASTE ANALYSIS</p>
          <h3 className="text-[#1A1A1A]" style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
            취향 분석
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {/* Summary */}
        <motion.div
          className="p-5 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #1A1A1A, #2A2A28)' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-white/40" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>나의 향 정체성</p>
          <p className="text-white mt-2" style={{ fontSize: '1.125rem', lineHeight: 1.5, fontFamily: "'Playfair Display', serif" }}>
            {sortedAccords[0]?.name || 'Woody'}한 베이스에<br/>
            {sortedAccords[1]?.name || 'Aromatic'}한 감성을 더한 취향
          </p>
        </motion.div>

        {/* Accord chart */}
        <motion.div className="mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <p className="text-[#B8B4AE] mb-4" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            선호 어코드 비율
          </p>
          <div className="space-y-3">
            {sortedAccords.slice(0, 6).map((accord, i) => (
              <motion.div key={accord.name} className="flex items-center gap-3"
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}>
                <span className="w-14 text-right text-[#8A8680]" style={{ fontSize: '0.8125rem' }}>{accord.name}</span>
                <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: `${accord.color}0D` }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${accord.color}25, ${accord.color}50)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${accord.avg}%` }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="flex items-center h-full px-2 text-[#1A1A1A]" style={{ fontSize: '0.6875rem' }}>
                      {accord.avg}%
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top notes */}
        <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <p className="text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>자주 등장하는 노트</p>
          <div className="flex flex-wrap gap-2">
            {topNotes.map(([note, count], i) => (
              <motion.span
                key={note}
                className="px-3 py-1.5 rounded-full border border-[#E8E6E1] text-[#1A1A1A]"
                style={{ fontSize: '0.8125rem' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + i * 0.05 }}
              >
                {note} <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>×{count}</span>
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

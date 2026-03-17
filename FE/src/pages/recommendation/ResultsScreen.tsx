import { motion } from 'motion/react';
import { mockPerfumes, mockRecommendationHistory } from '../../constants/perfumes';
import { useAppStore } from '../../store';
import { PerfumeCard } from '../../components/perfume/PerfumeCard';
import { RefreshCw, BookOpen, Leaf, Droplets, Wind, Sun, Flower2 } from 'lucide-react';

// SVG Radar chart component for scent DNA
function ScentRadar() {
  const traits = [
    { label: '우디', value: 0.82, angle: -90 },
    { label: '플로럴', value: 0.64, angle: -18 },
    { label: '시트러스', value: 0.38, angle: 54 },
    { label: '프레시', value: 0.45, angle: 126 },
    { label: '머스크', value: 0.71, angle: 198 },
  ];

  const cx = 80;
  const cy = 80;
  const maxR = 60;
  const levels = [0.25, 0.5, 0.75, 1];

  const toXY = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  // Build radar polygon
  const radarPoints = traits.map(t => {
    const p = toXY(t.angle, maxR * t.value);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {/* Grid rings */}
      {levels.map(l => (
        <polygon
          key={l}
          points={traits.map(t => {
            const p = toXY(t.angle, maxR * l);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none"
          stroke="#E8E6E1"
          strokeWidth="0.5"
        />
      ))}
      {/* Axis lines */}
      {traits.map(t => {
        const p = toXY(t.angle, maxR);
        return (
          <line key={t.label} x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke="#E8E6E1" strokeWidth="0.5" />
        );
      })}
      {/* Data polygon */}
      <motion.polygon
        points={radarPoints}
        fill="rgba(107,123,94,0.12)"
        stroke="#6B7B5E"
        strokeWidth="1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
      />
      {/* Data points */}
      {traits.map((t, i) => {
        const p = toXY(t.angle, maxR * t.value);
        return (
          <motion.circle
            key={t.label}
            cx={p.x} cy={p.y} r="3"
            fill="#6B7B5E"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2 + i * 0.05, type: 'spring' }}
          />
        );
      })}
      {/* Labels */}
      {traits.map(t => {
        const p = toXY(t.angle, maxR + 16);
        return (
          <text
            key={t.label}
            x={p.x} y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#8A8680"
            style={{ fontSize: '0.5625rem' }}
          >
            {t.label}
          </text>
        );
      })}
    </svg>
  );
}

export function ResultsScreen() {
  const { profile, navigateTo, setSelectedPerfumeId, selectedHistoryId, setSelectedHistoryId, recommendationHistory } = useAppStore();

  // 히스토리에서 접근한 경우 해당 항목의 데이터 사용
  const allHistory = [...recommendationHistory, ...mockRecommendationHistory];
  const historyItem = selectedHistoryId
    ? allHistory.find(h => h.id === selectedHistoryId) ?? null
    : null;

  const displayPerfumes = historyItem
    ? mockPerfumes.filter(p => historyItem.resultIds.includes(p.id))
    : mockPerfumes.slice(0, 3);

  const heroPerfume = displayPerfumes[0] ?? mockPerfumes[0];
  const restPerfumes = displayPerfumes.length > 1 ? displayPerfumes.slice(1) : mockPerfumes.slice(1);

  const summaryLine = historyItem
    ? `"${historyItem.emotionText}"`
    : profile.emotionText
      ? `"${profile.emotionText.slice(0, 50)}${profile.emotionText.length > 50 ? '...' : ''}"`
      : '따뜻한 시더우드, 촉촉한 녹색 공기, 조용한 럭셔리';

  const displayMoods = historyItem
    ? historyItem.conditions.mood
    : profile.moodKeywords.slice(0, 3);

  const handleViewDetail = (id: string) => {
    setSelectedPerfumeId(id);
    useAppStore.getState().pushTo('detail');
  };

  const handleBack = () => {
    setSelectedHistoryId(null);
    navigateTo('history');
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* Header */}
      <div className="pt-6 px-6 pb-4">
        {/* 히스토리에서 왔을 때 뒤로 가기 버튼 */}
        {historyItem && (
          <motion.button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#8A8680] mb-4"
            style={{ fontSize: '0.8125rem' }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            추천 히스토리
          </motion.button>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
            {historyItem ? `${historyItem.date} · PAST CURATION` : 'YOUR SCENT CURATION'}
          </p>
          <h2 className="mt-2 text-[#1A1A1A]" style={{ fontSize: '1.375rem', lineHeight: 1.35, fontFamily: "'Playfair Display', serif" }}>
            {summaryLine}
          </h2>
        </motion.div>

        <motion.div className="flex flex-wrap gap-1.5 mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {displayMoods.map(k => (
            <span key={k} className="px-2.5 py-1 rounded-full border border-[#E8E6E1] text-[#8A8680]"
              style={{ fontSize: '0.6875rem' }}>{k}</span>
          ))}
        </motion.div>
      </div>

      {/* Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <p className="px-2 mb-2 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            BEST MATCH
          </p>
          <PerfumeCard perfume={heroPerfume} isHero rank={1} onTap={() => handleViewDetail(heroPerfume.id)} showReason />
        </motion.div>

        {/* More recommendations */}
        <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <p className="px-2 mb-3 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            더 많은 추천
          </p>
          <div className="space-y-2.5">
            {restPerfumes.map((perfume, i) => (
              <motion.div key={perfume.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.08 }}>
                <PerfumeCard perfume={perfume} rank={i + 2} onTap={() => handleViewDetail(perfume.id)} showReason />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 나의 향 취향 DNA */}
        <motion.div
          className="mt-6 p-5 rounded-2xl"
          style={{ backgroundColor: '#F5F3EF' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-[#B8B4AE] mb-1" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            YOUR SCENT DNA
          </p>
          <p className="text-[#1A1A1A] mb-4" style={{ fontSize: '0.9375rem', fontFamily: "'Playfair Display', serif" }}>
            이번 추천의 향 성격
          </p>

          {/* Radar visualization */}
          <div className="flex justify-center mb-4">
            <ScentRadar />
          </div>

          {/* Scent DNA trait bars */}
          <div className="space-y-2.5">
            {[
              { icon: Leaf, label: '우디 & 그린', value: 82, color: '#6B7B5E', desc: '숲속을 걷는 듯한 자연스러운 잔향' },
              { icon: Flower2, label: '플로럴', value: 64, color: '#B8A5C8', desc: '은은한 꽃잎의 부드러운 여운' },
              { icon: Droplets, label: '머스크 & 앰버', value: 71, color: '#B8A88A', desc: '피부에 녹아드는 포근한 온기' },
              { icon: Wind, label: '프레시 & 아쿠아', value: 45, color: '#8BA4B8', desc: '맑은 공기처럼 깨끗한 첫인상' },
              { icon: Sun, label: '시트러스', value: 38, color: '#C4956A', desc: '밝고 가벼운 상쾌한 터치' },
            ].map((trait, i) => (
              <motion.div
                key={trait.label}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + i * 0.06, duration: 0.35, ease: [0, 0, 0.2, 1] }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${trait.color}15` }}>
                  <trait.icon size={14} style={{ color: trait.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#1A1A1A]" style={{ fontSize: '0.75rem' }}>{trait.label}</span>
                    <span className="text-[#8A8680]" style={{ fontSize: '0.6875rem' }}>{trait.value}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E8E6E1]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: trait.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${trait.value}%` }}
                      transition={{ delay: 1.2 + i * 0.06, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </div>
                  <p className="text-[#B8B4AE] mt-0.5" style={{ fontSize: '0.625rem' }}>{trait.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom action buttons */}
          <motion.div
            className="flex gap-2 mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            <button
              className="flex-1 py-3 rounded-xl border border-[#E8E6E1] text-[#8A8680] flex items-center justify-center gap-1.5"
              style={{ fontSize: '0.75rem' }}
              onClick={() => {
                setSelectedHistoryId(null);
                navigateTo('text-choice');
              }}
            >
              <RefreshCw size={14} /> 다시 추천받기
            </button>
            <button
              className="flex-1 py-3 rounded-xl border border-[#E8E6E1] text-[#8A8680] flex items-center justify-center gap-1.5"
              style={{ fontSize: '0.75rem' }}
              onClick={() => navigateTo('diary-write')}
            >
              <BookOpen size={14} /> 다이어리에 기록
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

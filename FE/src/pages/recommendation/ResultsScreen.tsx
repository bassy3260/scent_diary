import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, BookOpen, Leaf, Droplets, Wind, Sun, Flower2 } from 'lucide-react';
import { useAppStore } from '../../store';
import { useRecommendationStore } from '../../store';
import { hasPerfumeId, formatMyPageDate, getAccordColor, getRecommendationSummaryText } from '../../utils/mypage';
import type { RecommendDetailNotes, RecommendDetailResult } from '../../types/mypage.types';

function ScentRadar() {
  const traits = [
    { label: 'Woody', value: 0.82, angle: -90 },
    { label: 'Floral', value: 0.64, angle: -18 },
    { label: 'Citrus', value: 0.38, angle: 54 },
    { label: 'Fresh', value: 0.45, angle: 126 },
    { label: 'Musky', value: 0.71, angle: 198 },
  ];

  const cx = 80;
  const cy = 80;
  const maxRadius = 60;
  const levels = [0.25, 0.5, 0.75, 1];

  const toXY = (angle: number, radius: number) => {
    const radian = (angle * Math.PI) / 180;

    return {
      x: cx + radius * Math.cos(radian),
      y: cy + radius * Math.sin(radian),
    };
  };

  const radarPoints = traits.map((trait) => {
    const point = toXY(trait.angle, maxRadius * trait.value);
    return `${point.x},${point.y}`;
  }).join(' ');

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {levels.map((level) => (
        <polygon
          key={level}
          points={traits.map((trait) => {
            const point = toXY(trait.angle, maxRadius * level);
            return `${point.x},${point.y}`;
          }).join(' ')}
          fill="none"
          stroke="#E8E6E1"
          strokeWidth="0.5"
        />
      ))}

      {traits.map((trait) => {
        const point = toXY(trait.angle, maxRadius);

        return (
          <line
            key={trait.label}
            x1={cx}
            y1={cy}
            x2={point.x}
            y2={point.y}
            stroke="#E8E6E1"
            strokeWidth="0.5"
          />
        );
      })}

      <motion.polygon
        points={radarPoints}
        fill="rgba(107,123,94,0.12)"
        stroke="#6B7B5E"
        strokeWidth="1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
      />

      {traits.map((trait, index) => {
        const point = toXY(trait.angle, maxRadius * trait.value);

        return (
          <motion.circle
            key={trait.label}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#6B7B5E"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2 + index * 0.05, type: 'spring' }}
          />
        );
      })}

      {traits.map((trait) => {
        const point = toXY(trait.angle, maxRadius + 16);

        return (
          <text
            key={trait.label}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#8A8680"
            style={{ fontSize: '0.5625rem' }}
          >
            {trait.label}
          </text>
        );
      })}
    </svg>
  );
}

function NoteGroup({ title, notes, color }: { title: string; notes: string[]; color: string }) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {notes.map((note) => (
          <span
            key={`${title}-${note}`}
            className="px-2.5 py-1 rounded-full"
            style={{
              fontSize: '0.75rem',
              backgroundColor: `${color}12`,
              color,
              border: `1px solid ${color}25`,
            }}
          >
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}

interface HistoricalResultCardProps {
  result: RecommendDetailResult;
  rank: number;
  isHero?: boolean;
  onTap?: (() => void) | null;
}

function HistoricalResultCard({ result, rank, isHero = false, onTap }: HistoricalResultCardProps) {
  if (isHero) {
    return (
      <>
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #FFFFFF 0%, #F5F3EF 100%)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.05)',
            cursor: onTap ? 'pointer' : 'default',
          }}
          whileTap={onTap ? { scale: 0.98 } : {}}
          onClick={onTap ?? undefined}
        >
          <div className="relative w-full h-52 overflow-hidden">
            <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, transparent 35%, rgba(250,250,248,0.92) 100%)' }}
            />
            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <span className="text-white" style={{ fontSize: '0.75rem' }}>
                #{rank}
              </span>
            </div>
          </div>

          <div className="px-5 pb-5 -mt-2 relative z-10">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {result.accords.slice(0, 3).map((accord) => (
                <span
                  key={`${result.perfumeId}-${accord}`}
                  className="px-2 py-0.5 rounded-md text-white"
                  style={{ fontSize: '0.6875rem', backgroundColor: getAccordColor(accord) }}
                >
                  {accord}
                </span>
              ))}
            </div>
            <p className="text-[#8A8680]" style={{ fontSize: '0.75rem' }}>
              {result.brand}
            </p>
            <h3
              className="text-[#1A1A1A] mt-0.5"
              style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}
            >
              {result.name}
            </h3>
          </div>
        </motion.div>

        <p className="text-[#8A8680] px-1 mt-2.5" style={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
          {result.reason}
        </p>
      </>
    );
  }

  return (
    <motion.div
      className="flex gap-4 p-3 rounded-2xl"
      style={{
        background: 'linear-gradient(145deg, #FFFFFF 0%, #F5F3EF 100%)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        cursor: onTap ? 'pointer' : 'default',
      }}
      whileTap={onTap ? { scale: 0.98 } : {}}
      onClick={onTap ?? undefined}
    >
      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
        <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#1A1A1A]/80 flex items-center justify-center">
          <span className="text-white" style={{ fontSize: '0.5625rem' }}>
            #{rank}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          {result.accords.slice(0, 2).map((accord) => (
            <span
              key={`${result.perfumeId}-${accord}`}
              className="px-1.5 py-0.5 rounded text-white"
              style={{ fontSize: '0.5625rem', backgroundColor: getAccordColor(accord) }}
            >
              {accord}
            </span>
          ))}
        </div>
        <p className="text-[#8A8680] mt-0.5" style={{ fontSize: '0.6875rem' }}>
          {result.brand}
        </p>
        <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.9375rem' }}>
          {result.name}
        </p>
        <p className="text-[#8A8680] mt-1.5" style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
          {result.reason}
        </p>
      </div>
      <div
        className="w-1 rounded-full self-stretch"
        style={{ backgroundColor: `${getAccordColor(result.accords[0] ?? '')}40` }}
      />
    </motion.div>
  );
}

function HistoricalNotesSection({ notes }: { notes: RecommendDetailNotes }) {
  return (
    <motion.div
      className="mt-6 p-5 rounded-2xl"
      style={{ backgroundColor: '#F5F3EF' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
    >
      <p className="text-[#B8B4AE] mb-1" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
        NOTE COMPOSITION
      </p>
      <p className="text-[#1A1A1A] mb-4" style={{ fontSize: '0.9375rem', fontFamily: "'Playfair Display', serif" }}>
        이번 추천의 노트 구조
      </p>
      <div className="space-y-4">
        <NoteGroup title="Top Notes" notes={notes.top} color="#8BA4B8" />
        <NoteGroup title="Middle Notes" notes={notes.middle} color="#C8A5A5" />
        <NoteGroup title="Base Notes" notes={notes.base} color="#6B7B5E" />
      </div>
    </motion.div>
  );
}

export function ResultsScreen() {
  const profile = useAppStore((state) => state.profile);
  const navigateTo = useAppStore((state) => state.navigateTo);
  const setSelectedPerfumeId = useAppStore((state) => state.setSelectedPerfumeId);
  const selectedHistoryId = useAppStore((state) => state.selectedHistoryId);
  const setSelectedHistoryId = useAppStore((state) => state.setSelectedHistoryId);
  const selectedRecommendationDetail = useAppStore((state) => state.selectedRecommendationDetail);
  const selectedRecommendationDetailId = useAppStore((state) => state.selectedRecommendationDetailId);
  const fetchRecommendationDetail = useAppStore((state) => state.fetchRecommendationDetail);
  const clearSelectedRecommendationDetail = useAppStore((state) => state.clearSelectedRecommendationDetail);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);

  const selectedHistoryNumericId = selectedHistoryId ? Number(selectedHistoryId) : null;
  const isHistoryMode = selectedHistoryNumericId !== null && !Number.isNaN(selectedHistoryNumericId);
  const historyDetail = isHistoryMode && selectedRecommendationDetailId === selectedHistoryNumericId
    ? selectedRecommendationDetail
    : null;

  useEffect(() => {
    if (!isHistoryMode || selectedHistoryNumericId === null) {
      return;
    }

    if (selectedRecommendationDetailId === selectedHistoryNumericId && selectedRecommendationDetail) {
      return;
    }

    void fetchRecommendationDetail(selectedHistoryNumericId);
  }, [
    fetchRecommendationDetail,
    isHistoryMode,
    selectedHistoryNumericId,
    selectedRecommendationDetail,
    selectedRecommendationDetailId,
  ]);

  const { textResult, imageResult } = useRecommendationStore();
  const currentResults = useMemo(
    () => textResult?.results ?? imageResult?.results ?? [],
    [textResult, imageResult],
  );
  const fallbackHeroResult = currentResults[0] ?? null;
  const fallbackRestResults = currentResults.slice(1);

  const summaryLine = historyDetail
    ? getRecommendationSummaryText(historyDetail.input)
    : profile.emotionText
      ? `"${profile.emotionText.slice(0, 50)}${profile.emotionText.length > 50 ? '...' : ''}"`
      : '오늘의 분위기에 어울리는 향을 골라봤어요.';

  const displayKeywords = historyDetail
    ? historyDetail.input.keywords ?? []
    : profile.moodKeywords.slice(0, 3);

  const handleViewDetail = (perfumeId: number) => {
    setSelectedPerfumeId(perfumeId);
    useAppStore.getState().pushTo('detail');
  };

  const handleBack = () => {
    clearSelectedRecommendationDetail();
    setSelectedHistoryId(null);
    navigateTo('history');
  };

  const handleRestart = () => {
    clearSelectedRecommendationDetail();
    setSelectedHistoryId(null);
    navigateTo('text-choice');
  };

  const heroHistoricalResult = historyDetail?.results[0] ?? null;
  const restHistoricalResults = heroHistoricalResult ? historyDetail?.results.slice(1, 3) ?? [] : [];

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-4">
        {isHistoryMode && (
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
            {historyDetail
              ? `${formatMyPageDate(historyDetail.createTime, { year: 'numeric', month: 'long', day: 'numeric' })} · PAST CURATION`
              : 'YOUR SCENT CURATION'}
          </p>
          <h2
            className="mt-2 text-[#1A1A1A]"
            style={{ fontSize: '1.375rem', lineHeight: 1.35, fontFamily: "'Playfair Display', serif" }}
          >
            {summaryLine}
          </h2>
        </motion.div>

        {displayKeywords.length > 0 && (
          <motion.div className="flex flex-wrap gap-1.5 mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {displayKeywords.map((keyword) => (
              <span
                key={keyword}
                className="px-2.5 py-1 rounded-full border border-[#E8E6E1] text-[#8A8680]"
                style={{ fontSize: '0.6875rem' }}
              >
                {keyword}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {error && isHistoryMode && !historyDetail && (
          <div
            className="mb-4 px-4 py-3 rounded-2xl text-[#C45050]"
            style={{ backgroundColor: 'rgba(196, 80, 80, 0.08)', fontSize: '0.8125rem' }}
          >
            {error}
          </div>
        )}

        {isHistoryMode && !historyDetail ? (
          <motion.div className="py-20 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[#8A8680]" style={{ fontSize: '0.9375rem' }}>
              {loading ? '추천 결과를 불러오는 중이에요.' : '추천 결과를 찾지 못했어요.'}
            </p>
          </motion.div>
        ) : historyDetail && heroHistoricalResult ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
              <p className="px-2 mb-2 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                BEST MATCH
              </p>
              <HistoricalResultCard
                result={heroHistoricalResult}
                isHero
                rank={1}
                onTap={hasPerfumeId(heroHistoricalResult) ? () => handleViewDetail(heroHistoricalResult.perfumeId!) : null}
              />
            </motion.div>

            {restHistoricalResults.length > 0 && (
              <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
                <p className="px-2 mb-3 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                  더 많은 추천
                </p>
                <div className="space-y-2.5">
                  {restHistoricalResults.map((result, index) => (
                    <motion.div
                      key={`${result.perfumeId}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 + index * 0.08 }}
                    >
                      <HistoricalResultCard
                        result={result}
                        rank={index + 2}
                        onTap={hasPerfumeId(result) ? () => handleViewDetail(result.perfumeId!) : null}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <HistoricalNotesSection notes={heroHistoricalResult.notes} />
          </>
        ) : fallbackHeroResult ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
              <p className="px-2 mb-2 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                BEST MATCH
              </p>
              <HistoricalResultCard
                result={fallbackHeroResult as RecommendDetailResult}
                isHero
                rank={1}
                onTap={hasPerfumeId(fallbackHeroResult) ? () => handleViewDetail(fallbackHeroResult.perfumeId!) : null}
              />
            </motion.div>

            {fallbackRestResults.length > 0 && (
              <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <p className="px-2 mb-3 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                  더 많은 추천
                </p>
                <div className="space-y-2.5">
                  {fallbackRestResults.map((result, index) => (
                    <motion.div key={`${result.perfumeId}-${index}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + index * 0.08 }}>
                      <HistoricalResultCard
                        result={result as RecommendDetailResult}
                        rank={index + 2}
                        onTap={hasPerfumeId(result) ? () => handleViewDetail(result.perfumeId!) : null}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

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
                이번 추천에서 읽은 취향 결
              </p>

              <div className="flex justify-center mb-4">
                <ScentRadar />
              </div>

              <div className="space-y-2.5">
                {[
                  { icon: Leaf, label: 'Woody & Green', value: 82, color: '#6B7B5E', desc: '숲속을 걷는 듯한 자연스러운 분위기' },
                  { icon: Flower2, label: 'Floral', value: 64, color: '#B8A5C8', desc: '은은한 꽃 향의 부드러운 결' },
                  { icon: Droplets, label: 'Musky & Soft', value: 71, color: '#B8A88A', desc: '잔향으로 남는 포근한 느낌' },
                  { icon: Wind, label: 'Fresh & Airy', value: 45, color: '#8BA4B8', desc: '맑은 공기처럼 가벼운 인상' },
                  { icon: Sun, label: 'Citrus', value: 38, color: '#C4956A', desc: '밝고 산뜻한 첫인상 포인트' },
                ].map((trait, index) => (
                  <motion.div
                    key={trait.label}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + index * 0.06, duration: 0.35, ease: [0, 0, 0.2, 1] }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${trait.color}15` }}
                    >
                      <trait.icon size={14} style={{ color: trait.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#1A1A1A]" style={{ fontSize: '0.75rem' }}>
                          {trait.label}
                        </span>
                        <span className="text-[#8A8680]" style={{ fontSize: '0.6875rem' }}>
                          {trait.value}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E8E6E1]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: trait.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${trait.value}%` }}
                          transition={{ delay: 1.2 + index * 0.06, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                        />
                      </div>
                      <p className="text-[#B8B4AE] mt-0.5" style={{ fontSize: '0.625rem' }}>
                        {trait.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        ) : null}

        <motion.div
          className="flex gap-2 mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15 }}
        >
          <button
            className="flex-1 py-3 rounded-xl border border-[#E8E6E1] text-[#8A8680] flex items-center justify-center gap-1.5"
            style={{ fontSize: '0.75rem' }}
            onClick={handleRestart}
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
      </div>
    </div>
  );
}

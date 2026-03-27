import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, BookOpen } from 'lucide-react';
import { useAppStore } from '../../store';
import { useRecommendationStore, useDiaryStore } from '../../store';
import { hasPerfumeId, formatMyPageDate, getRecommendationSummaryText } from '../../utils/mypage';
import type { RecommendDetailResult } from '../../types/mypage.types';
import { ResultCard } from '../../components/recommendation/ResultCard';
import { ScentDnaSection } from '../../components/recommendation/ScentDnaSection';

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
  const { setDiaryPrefill } = useDiaryStore();

  const selectedHistoryNumericId = selectedHistoryId ? Number(selectedHistoryId) : null;
  const isHistoryMode = selectedHistoryNumericId !== null && !Number.isNaN(selectedHistoryNumericId);
  const historyDetail = isHistoryMode && selectedRecommendationDetailId === selectedHistoryNumericId
    ? selectedRecommendationDetail
    : null;

  useEffect(() => {
    if (!isHistoryMode || selectedHistoryNumericId === null) return;
    if (selectedRecommendationDetailId === selectedHistoryNumericId && selectedRecommendationDetail) return;
    void fetchRecommendationDetail(selectedHistoryNumericId);
  }, [fetchRecommendationDetail, isHistoryMode, selectedHistoryNumericId, selectedRecommendationDetail, selectedRecommendationDetailId]);

  const { textResult, imageResult } = useRecommendationStore();
  const currentResults = useMemo(
    () => textResult?.results ?? imageResult?.results ?? [],
    [textResult, imageResult],
  );
  const fallbackHeroResult = currentResults[0] ?? null;
  const fallbackRestResults = currentResults.slice(1);

  const uploadedImage = isHistoryMode
    ? (historyDetail?.input.image ?? null)
    : (imageResult?.input.image ?? null);

  const summaryLine = historyDetail
    ? getRecommendationSummaryText(historyDetail.input)
    : profile.emotionText
      ? `"${profile.emotionText.slice(0, 50)}${profile.emotionText.length > 50 ? '...' : ''}"`
      : '오늘의 분위기에 어울리는 향을 골라봤어요.';

  const displayKeyword = historyDetail
    ? (historyDetail.input.keyword ?? null)
    : imageResult
      ? (imageResult.input.keyword ?? null)
      : null;

  const heroHistoricalResult = historyDetail?.results[0] ?? null;
  const restHistoricalResults = heroHistoricalResult ? historyDetail?.results.slice(1, 3) ?? [] : [];

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
    navigateTo('recommend-prestep');
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* Header */}
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
          {uploadedImage ? (
            <>
              <p className="mt-2 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>당신의 무드</p>
              <h2
                className="mt-1 text-[#1A1A1A]"
                style={{ fontSize: '1.375rem', lineHeight: 1.35, fontFamily: "'Playfair Display', serif" }}
              >
                {displayKeyword ?? ''}
              </h2>
            </>
          ) : (
            <>
              <h2
                className="mt-2 text-[#1A1A1A]"
                style={{ fontSize: '1.375rem', lineHeight: 1.35, fontFamily: "'Playfair Display', serif" }}
              >
                {summaryLine}
              </h2>
            </>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {uploadedImage && (
          <motion.div className="mb-5" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="w-full rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: '#F0EEE9', maxHeight: '320px' }}>
              <img src={uploadedImage} alt="업로드한 사진" className="w-full object-contain" style={{ maxHeight: '320px' }} />
            </div>
          </motion.div>
        )}
        {error && isHistoryMode && !historyDetail && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-[#C45050]" style={{ backgroundColor: 'rgba(196, 80, 80, 0.08)', fontSize: '0.8125rem' }}>
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
              <p className="px-2 mb-2 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>BEST MATCH</p>
              <ResultCard
                result={heroHistoricalResult}
                isHero
                rank={1}
                onTap={hasPerfumeId(heroHistoricalResult) ? () => handleViewDetail(heroHistoricalResult.perfumeId!) : null}
              />
            </motion.div>

            {restHistoricalResults.length > 0 && (
              <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
                <p className="px-2 mb-3 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>더 많은 추천</p>
                <div className="space-y-2.5">
                  {restHistoricalResults.map((result, index) => (
                    <motion.div key={`${result.perfumeId}-${index}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 + index * 0.08 }}>
                      <ResultCard
                        result={result}
                        rank={index + 2}
                        onTap={hasPerfumeId(result) ? () => handleViewDetail(result.perfumeId!) : null}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <ScentDnaSection results={historyDetail.results} />
          </>
        ) : fallbackHeroResult ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
              <p className="px-2 mb-2 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>BEST MATCH</p>
              <ResultCard
                result={fallbackHeroResult as RecommendDetailResult}
                isHero
                rank={1}
                onTap={hasPerfumeId(fallbackHeroResult) ? () => handleViewDetail(fallbackHeroResult.perfumeId!) : null}
              />
            </motion.div>

            {fallbackRestResults.length > 0 && (
              <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <p className="px-2 mb-3 text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>더 많은 추천</p>
                <div className="space-y-2.5">
                  {fallbackRestResults.map((result, index) => (
                    <motion.div key={`${result.perfumeId}-${index}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + index * 0.08 }}>
                      <ResultCard
                        result={result as RecommendDetailResult}
                        rank={index + 2}
                        onTap={hasPerfumeId(result) ? () => handleViewDetail(result.perfumeId!) : null}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <ScentDnaSection results={currentResults as RecommendDetailResult[]} />
          </>
        ) : null}

        {/* Actions */}
        <motion.div className="flex gap-2 mt-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15 }}>
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
            onClick={() => {
              const hero = historyDetail?.results[0] ?? currentResults[0] ?? null;
              if (hero) {
                setDiaryPrefill({
                  perfumeId: hero.perfumeId,
                  name: hero.name,
                  brand: hero.brand,
                  image: hero.image,
                });
              }
              navigateTo('diary-write');
            }}
          >
            <BookOpen size={14} /> 다이어리에 기록
          </button>
        </motion.div>
      </div>
    </div>
  );
}

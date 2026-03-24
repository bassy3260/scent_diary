import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store';
import { formatMyPageDate, getRecommendationSummaryText } from '../../utils/mypage';
import type { RecommendItem } from '../../types/mypage.types';

export function HistoryScreen() {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const recommendationHistory = useAppStore((state) => state.recommendationHistory);
  const fetchRecommendationHistory = useAppStore((state) => state.fetchRecommendationHistory);
  const fetchRecommendationDetail = useAppStore((state) => state.fetchRecommendationDetail);
  const setSelectedHistoryId = useAppStore((state) => state.setSelectedHistoryId);
  const clearSelectedRecommendationDetail = useAppStore((state) => state.clearSelectedRecommendationDetail);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const [openingId, setOpeningId] = useState<number | null>(null);

  useEffect(() => {
    void fetchRecommendationHistory();
  }, [fetchRecommendationHistory]);

  const handleViewResult = async (item: RecommendItem) => {
    if (openingId !== null) {
      return;
    }

    setOpeningId(item.recommendResultId);

    try {
      clearSelectedRecommendationDetail();
      await fetchRecommendationDetail(item.recommendResultId);
      setSelectedHistoryId(String(item.recommendResultId));
      navigateTo('results');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-3 flex items-center">
        <motion.button
          onClick={() => navigateTo('mypage')}
          whileTap={{ scale: 0.95 }}
          className="mr-3"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8A8680"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </motion.button>
        <div className="flex-1">
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
            HISTORY
          </p>
          <h3
            className="text-[#1A1A1A]"
            style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}
          >
            추천 히스토리
          </h3>
        </div>
      </div>

      {recommendationHistory.length > 0 && (
        <motion.p
          className="px-6 mb-1 text-[#B8B4AE]"
          style={{ fontSize: '0.6875rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          항목을 누르면 저장된 추천 결과를 다시 볼 수 있어요.
        </motion.p>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-2xl text-[#C45050]"
            style={{ backgroundColor: 'rgba(196, 80, 80, 0.08)', fontSize: '0.8125rem' }}
          >
            {error}
          </div>
        )}

        {loading && recommendationHistory.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-[#8A8680]" style={{ fontSize: '0.9375rem' }}>
              추천 히스토리를 불러오는 중이에요.
            </p>
          </motion.div>
        ) : recommendationHistory.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-[#B8B4AE]" style={{ fontSize: '0.9375rem' }}>
              아직 저장된 추천 기록이 없어요.
            </p>
            <motion.button
              className="mt-4 px-5 py-3 rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg, #6B7B5E, #8FA380)', fontSize: '0.875rem' }}
              onClick={() => navigateTo('recommend-prestep')}
              whileTap={{ scale: 0.95 }}
            >
              첫 추천 받으러 가기
            </motion.button>
          </motion.div>
        ) : (
          recommendationHistory.map((item, index) => {
            const chips = item.input.keywords?.slice(0, 2) ?? [];
            const summary = getRecommendationSummaryText(item.input);
            const isOpening = openingId === item.recommendResultId;

            return (
              <motion.button
                key={item.recommendResultId}
                type="button"
                className="w-full mb-3 rounded-2xl overflow-hidden text-left"
                style={{
                  background: 'linear-gradient(145deg, #FFFFFF, #F8F7F4)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => void handleViewResult(item)}
                whileTap={{ scale: 0.98 }}
                disabled={isOpening}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5 gap-3">
                    <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
                      {formatMyPageDate(item.createTime)}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {item.input.image ? (
                        <span
                          className="px-2 py-0.5 rounded-full bg-[#B8A5C8]/10 text-[#B8A5C8] border border-[#B8A5C8]/20"
                          style={{ fontSize: '0.625rem' }}
                        >
                          이미지 추천
                        </span>
                      ) : (
                        chips.map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded-full bg-[#F5F3EF] text-[#8A8680]"
                            style={{ fontSize: '0.625rem' }}
                          >
                            {kw}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <p
                    className="text-[#1A1A1A] truncate"
                    style={{ fontSize: '0.875rem', lineHeight: 1.5 }}
                  >
                    {summary}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1.5 items-center">
                      {item.input.image && (
                        <div className="w-7 h-9 rounded overflow-hidden border border-[#B8A5C8]/30 shrink-0">
                          <img src={item.input.image} alt="업로드 사진" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {item.results.slice(0, 3).map((result) => (
                        <div
                          key={`${item.recommendResultId}-${result.name}`}
                          className="w-7 h-7 rounded overflow-hidden border border-[#E8E6E1]"
                        >
                          <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[#6B7B5E]" style={{ fontSize: '0.6875rem' }}>
                      {isOpening ? '불러오는 중...' : '결과 보기 →'}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * HistoryScreen
 *
 * 과거 추천 요청 이력을 타임라인으로 보여주는 화면입니다.
 * 각 항목을 탭하면 해당 추천 결과 화면(results)으로 복원됩니다.
 */
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAppStore } from '../../store';
import { mockPerfumes } from '../../constants/perfumes';
import type { RecommendationHistory } from '../../types/recommendation.types';

export function HistoryScreen() {
  const {
    navigateTo,
    recommendationHistory,
    deleteRecommendationHistory,
    setSelectedHistoryId,
  } = useAppStore();

  const [isEditMode, setIsEditMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const history = recommendationHistory;

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      deleteRecommendationHistory(id);
      setDeletingId(null);
    }, 280);
  };

  const handleViewResult = (rec: RecommendationHistory) => {
    if (isEditMode) return;
    setSelectedHistoryId(rec.id);
    navigateTo('results');
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* 헤더 */}
      <div className="pt-6 px-6 pb-3 flex items-center">
        <motion.button
          onClick={() => { setIsEditMode(false); navigateTo('mypage'); }}
          whileTap={{ scale: 0.95 }}
          className="mr-3"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A8680" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </motion.button>
        <div className="flex-1">
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>HISTORY</p>
          <h3 className="text-[#1A1A1A]" style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
            추천 히스토리
          </h3>
        </div>
        {history.length > 0 && (
          <motion.button
            onClick={() => setIsEditMode((prev) => !prev)}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 rounded-lg"
            style={{ background: isEditMode ? '#1A1A1A' : 'transparent' }}
          >
            <span style={{ fontSize: '0.8125rem', color: isEditMode ? '#FFFFFF' : '#8A8680' }}>
              {isEditMode ? '완료' : '삭제'}
            </span>
          </motion.button>
        )}
      </div>

      {!isEditMode && history.length > 0 && (
        <motion.p
          className="px-6 mb-1 text-[#B8B4AE]"
          style={{ fontSize: '0.6875rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          항목을 탭하면 추천 결과를 다시 볼 수 있어요
        </motion.p>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {history.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-[#B8B4AE]" style={{ fontSize: '0.9375rem' }}>아직 추천 기록이 없어요</p>
            <motion.button
              className="mt-4 px-5 py-3 rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg, #6B7B5E, #8FA380)', fontSize: '0.875rem' }}
              onClick={() => navigateTo('text-choice')}
              whileTap={{ scale: 0.95 }}
            >
              첫 추천 받으러 가기
            </motion.button>
          </motion.div>
        ) : (
          history.map((rec: RecommendationHistory, i: number) => (
            <motion.div
              key={rec.id}
              className="mb-3 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #FFFFFF, #F8F7F4)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                cursor: isEditMode ? 'default' : 'pointer',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: deletingId === rec.id ? 0 : 1,
                y: 0,
                scale: deletingId === rec.id ? 0.95 : 1,
              }}
              transition={{ delay: deletingId === rec.id ? 0 : i * 0.06, duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={() => handleViewResult(rec)}
              whileTap={!isEditMode ? { scale: 0.98 } : {}}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#B8B4AE]" style={{ fontSize: '0.75rem' }}>{rec.date}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {rec.conditions.mood.slice(0, 2).map((m: string) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-full bg-[#F5F3EF] text-[#8A8680]"
                          style={{ fontSize: '0.625rem' }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                    <AnimatePresence>
                      {isEditMode && (
                        <motion.button
                          className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center"
                          onClick={(e) => { e.stopPropagation(); handleDelete(rec.id); }}
                          whileTap={{ scale: 0.82 }}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>
                  "{rec.emotionText}"
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
                      {rec.conditions.gender}
                    </span>
                    <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
                      · {rec.resultIds.length}개 추천
                    </span>
                  </div>
                  {!isEditMode && (
                    <span className="text-[#6B7B5E]" style={{ fontSize: '0.6875rem' }}>
                      결과 보기 →
                    </span>
                  )}
                </div>

                {!isEditMode && rec.resultIds.length > 0 && (
                  <div className="flex gap-1.5 mt-3">
                    {rec.resultIds.slice(0, 3).map((id) => {
                      const p = mockPerfumes.find((pp) => pp.id === id);
                      return p ? (
                        <div key={id} className="w-9 h-9 rounded-lg overflow-hidden border border-[#E8E6E1]">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

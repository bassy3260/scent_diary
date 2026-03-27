import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store';
import { buildAccordStats } from '../../utils/mypage';
import { myApi } from '../../api/my.api';
import type { PreferenceRecommendItem } from '../../types/mypage.types';

export function TasteProfile() {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const likedPerfumes = useAppStore((state) => state.likedPerfumes);
  const myPerfumes = useAppStore((state) => state.myPerfumes);
  const fetchLikes = useAppStore((state) => state.fetchLikes);
  const fetchMyPerfumes = useAppStore((state) => state.fetchMyPerfumes);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);

  const [recs, setRecs] = useState<PreferenceRecommendItem[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    void Promise.all([fetchLikes(), fetchMyPerfumes()]);
  }, [fetchLikes, fetchMyPerfumes]);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        setRecsLoading(true);
        const response = await myApi.getPreferenceRecommend();
        setRecs(response);
      } catch (e) {
        setRecsError((e as Error).message);
      } finally {
        setRecsLoading(false);
      }
    };
    void fetchRecs();
  }, []);

  const tasteSource = likedPerfumes.length > 0 ? likedPerfumes : myPerfumes;
  const accordStats = useMemo(() => buildAccordStats(tasteSource), [tasteSource]);
  const topAccords = accordStats.slice(0, 8);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? recs.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === recs.length - 1 ? 0 : prev + 1));
  };

  const currentPerfume = recs[currentIndex];

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-3 flex items-center gap-3">
        <motion.button onClick={() => navigateTo('mypage')} whileTap={{ scale: 0.9 }}>
          <ChevronLeft size={24} className="text-[#8A8680]" />
        </motion.button>
        <div>
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
            TASTE ANALYSIS
          </p>
          <h3
            className="text-[#1A1A1A]"
            style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}
          >
            취향 분석
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-2xl text-[#C45050]"
            style={{ backgroundColor: 'rgba(196, 80, 80, 0.08)', fontSize: '0.8125rem' }}
          >
            {error}
          </div>
        )}

        {loading && tasteSource.length === 0 ? (
          <motion.div className="py-20 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[#8A8680]" style={{ fontSize: '0.9375rem' }}>
              취향 데이터를 불러오는 중이에요.
            </p>
          </motion.div>
        ) : accordStats.length === 0 ? (
          <motion.div className="py-20 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[#8A8680]" style={{ fontSize: '0.9375rem', lineHeight: 1.7 }}>
              좋아요 향수나 내 향수가 쌓이면
              <br />
              취향 분석을 더 자세히 보여드릴게요.
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="p-5 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #1A1A1A, #2A2A28)' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-white/40" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                나의 향 정체성
              </p>
              <p
                className="text-white mt-2"
                style={{ fontSize: '1.125rem', lineHeight: 1.5, fontFamily: "'Playfair Display', serif" }}
              >
                {topAccords[0]?.name ?? 'Woody'}를 중심으로
                <br />
                {topAccords[1]?.name ?? 'Aromatic'} 감성이 어우러진 취향
              </p>
            </motion.div>

            <motion.div className="mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <p className="text-[#B8B4AE] mb-4" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                선호 어코드 비율
              </p>
              <div className="space-y-3">
                {accordStats.slice(0, 6).map((accord, index) => (
                  <motion.div
                    key={accord.name}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                  >
                    <span className="w-14 text-right text-[#8A8680]" style={{ fontSize: '0.8125rem' }}>
                      {accord.name}
                    </span>
                    <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: `${accord.color}0D` }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${accord.color}25, ${accord.color}55)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(accord.percentage, 8)}%` }}
                        transition={{ delay: 0.4 + index * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <span className="flex items-center h-full px-2 text-[#1A1A1A]" style={{ fontSize: '0.6875rem' }}>
                          {accord.percentage}%
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <p className="text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                자주 등장하는 어코드
              </p>
              <div className="flex flex-wrap gap-2">
                {topAccords.map((accord, index) => (
                  <motion.span
                    key={accord.name}
                    className="px-3 py-1.5 rounded-full border text-[#1A1A1A]"
                    style={{
                      fontSize: '0.8125rem',
                      borderColor: `${accord.color}35`,
                      backgroundColor: `${accord.color}10`,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 + index * 0.05 }}
                  >
                    {accord.name}
                    <span className="text-[#8A8680] ml-1" style={{ fontSize: '0.6875rem' }}>
                      ×{accord.count}
                    </span>
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Preference Recommendations */}
            <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              <p className="text-[#B8B4AE] mb-4" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                이런 향수는 어때요?
              </p>
              {recsLoading ? (
                <div className="text-center py-10">
                  <p className="text-[#8A8680]" style={{ fontSize: '0.9375rem' }}>
                    추천 향수를 불러오는 중...
                  </p>
                </div>
              ) : recsError ? (
                <div
                  className="px-4 py-3 rounded-2xl text-[#C45050]"
                  style={{ backgroundColor: 'rgba(196, 80, 80, 0.08)', fontSize: '0.8125rem' }}
                >
                  {recsError}
                </div>
              ) : recs.length > 0 && currentPerfume ? (
                <div className="relative">
                  <motion.div
                    key={currentIndex}
                    className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <img
                      src={currentPerfume.image_route}
                      alt={currentPerfume.perfume_name}
                      className="w-24 h-24 object-cover rounded-lg mb-3"
                    />
                    <p className="text-[#1A1A1A] font-medium text-center" style={{ fontSize: '0.9375rem' }}>
                      {currentPerfume.perfume_name}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {currentPerfume.accords.map((accord) => (
                        <span
                          key={accord}
                          className="px-2 py-0.5 rounded-full text-xs text-[#8A8680]"
                          style={{ backgroundColor: '#F0F0F0' }}
                        >
                          {accord}
                        </span>
                      ))}
                    </div>
                  </motion.div>

                  {recs.length > 1 && (
                    <>
                      <motion.button
                        onClick={handlePrev}
                        className="absolute top-1/2 left-[-8px] -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-md"
                        whileTap={{ scale: 0.9 }}
                      >
                        <ChevronLeft size={20} className="text-[#1A1A1A]" />
                      </motion.button>
                      <motion.button
                        onClick={handleNext}
                        className="absolute top-1/2 right-[-8px] -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-md"
                        whileTap={{ scale: 0.9 }}
                      >
                        <ChevronRight size={20} className="text-[#1A1A1A]" />
                      </motion.button>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-[#8A8680]" style={{ fontSize: '0.9375rem' }}>
                    추천할 향수가 없어요.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useAppStore } from '../../store';
import { formatMyPageDate } from '../../utils/mypage';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';

export function MyReviewsScreen() {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const setSelectedPerfumeId = useAppStore((state) => state.setSelectedPerfumeId);
  const myReviews = useAppStore((state) => state.myReviews);
  const myReviewsPageInfo = useAppStore((state) => state.myReviewsPageInfo);
  const fetchMyReviews = useAppStore((state) => state.fetchMyReviews);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = myReviewsPageInfo?.totalPages ?? 1;

  useEffect(() => {
    void fetchMyReviews(currentPage);
  }, [fetchMyReviews, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0 });
  };

  const renderStars = (rating: string) => {
    const num = Math.min(5, Math.max(1, Number(rating) || 0));
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            style={{
              fill: i < num ? '#C4956A' : 'transparent',
              color: i < num ? '#C4956A' : '#D4D0CA',
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-3 flex items-center">
        <motion.button
          onClick={() => navigateTo('mypage')}
          whileTap={{ scale: 0.95 }}
          className="mr-3"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A8680" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </motion.button>
        <div className="flex-1">
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>REVIEWS</p>
          <h3 className="text-[#1A1A1A]" style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
            내 리뷰
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-[#C45050]" style={{ backgroundColor: 'rgba(196,80,80,0.08)', fontSize: '0.8125rem' }}>
            {error}
          </div>
        )}

        {loading && myReviews.length === 0 ? (
          <motion.div className="flex flex-col items-center justify-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[#8A8680]" style={{ fontSize: '0.9375rem' }}>리뷰를 불러오는 중이에요.</p>
          </motion.div>
        ) : myReviews.length === 0 ? (
          <motion.div className="flex flex-col items-center justify-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[#B8B4AE]" style={{ fontSize: '0.9375rem' }}>아직 작성한 리뷰가 없어요.</p>
          </motion.div>
        ) : (
          <div className="space-y-3 mt-2">
            {myReviews.map((review, index) => (
              <motion.button
                key={review.reviewId}
                className="w-full rounded-2xl overflow-hidden text-left"
                style={{ background: 'linear-gradient(145deg, #FFFFFF, #F8F7F4)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => {
                  setSelectedPerfumeId(review.perfume.perfumeId);
                  useAppStore.getState().pushTo('detail');
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="p-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#E8E6E1]">
                      <ImageWithFallback
                        src={review.perfume.image}
                        alt={review.perfume.perfumeName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[#8A8680] truncate" style={{ fontSize: '0.6875rem' }}>{review.perfume.brand}</p>
                          <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.9375rem', lineHeight: 1.3 }}>{review.perfume.perfumeName}</p>
                        </div>
                        <p className="text-[#B8B4AE] shrink-0" style={{ fontSize: '0.6875rem' }}>
                          {formatMyPageDate(review.createTime)}
                        </p>
                      </div>
                      <div className="mt-1">{renderStars(review.rating)}</div>
                    </div>
                  </div>
                  {review.detail && (
                    <p className="mt-3 text-[#8A8680]" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                      {review.detail}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <motion.div className="flex items-center justify-center gap-3 pt-4 pb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: currentPage === 1 ? '#F0EEE9' : '#1A1A1A', color: currentPage === 1 ? '#B8B4AE' : '#FFFFFF' }}
              whileTap={currentPage > 1 ? { scale: 0.88 } : {}}
            >
              <ChevronLeft size={15} />
            </motion.button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                const isActive = page === currentPage;
                return (
                  <motion.button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    disabled={loading}
                    className="rounded-full"
                    style={{ height: 6, backgroundColor: isActive ? '#6B7B5E' : '#D8D5CF' }}
                    animate={{ width: isActive ? 18 : 6 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                );
              })}
            </div>
            <motion.button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: currentPage === totalPages ? '#F0EEE9' : '#1A1A1A', color: currentPage === totalPages ? '#B8B4AE' : '#FFFFFF' }}
              whileTap={currentPage < totalPages ? { scale: 0.88 } : {}}
            >
              <ChevronRight size={15} />
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
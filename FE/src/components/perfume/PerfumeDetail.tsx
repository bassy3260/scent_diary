import { motion } from 'motion/react';
import { ChevronLeft, Heart, BookOpen, Star, ChevronDown, Archive } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { NotePyramid } from './NotePyramid';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface PerfumeDetailProps {
  onBack: () => void;
}

export function PerfumeDetail({ onBack }: PerfumeDetailProps) {
  const {
    selectedPerfumeId, perfumeDetail, isLoading, error,
    savedPerfumes, myCollection,
    fetchPerfumeDetail, likePerfume, collectPerfume, submitReview,
    navigateTo,
  } = useAppStore();

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSaved = selectedPerfumeId !== null && savedPerfumes.includes(selectedPerfumeId);
  const isCollected = selectedPerfumeId !== null && myCollection.includes(selectedPerfumeId);

  useEffect(() => {
    if (selectedPerfumeId !== null) {
      fetchPerfumeDetail(selectedPerfumeId);
    }
  }, [selectedPerfumeId, fetchPerfumeDetail]);

  const handleLike = () => {
    if (selectedPerfumeId !== null) likePerfume(selectedPerfumeId);
  };

  const handleCollect = () => {
    if (selectedPerfumeId !== null) collectPerfume(selectedPerfumeId);
  };

  const handleSubmitReview = async () => {
    if (selectedPerfumeId === null || reviewRating === 0 || !reviewContent.trim()) return;
    setIsSubmitting(true);
    try {
      await submitReview(selectedPerfumeId, reviewRating, reviewContent.trim());
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#FAFAF8' }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#6B7B5E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !perfumeDetail) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: '#FAFAF8' }}>
        <p className="text-[#8A8680]">{error ?? '향수 정보를 불러올 수 없습니다.'}</p>
        <button className="text-[#6B7B5E]" onClick={onBack}>돌아가기</button>
      </div>
    );
  }

  const avgRating = perfumeDetail.reviews?.length
    ? perfumeDetail.reviews.reduce((sum, r) => sum + r.rating, 0) / perfumeDetail.reviews.length
    : null;

  const topAccords = perfumeDetail.accords.slice(0, 3);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* Hero image */}
      <div className="relative w-full h-72 shrink-0">
        <div className="w-full h-full">
          <ImageWithFallback src={perfumeDetail.image} alt={perfumeDetail.name} className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(250,250,248,0.25) 0%, transparent 25%, rgba(250,250,248,0.9) 82%, #FAFAF8 100%)',
        }} />

        <div className="absolute top-5 left-4 right-4 flex items-center justify-between z-10">
          <motion.button
            className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center"
            style={{ backdropFilter: 'blur(12px)' }}
            onClick={onBack}
            whileTap={{ scale: 0.93 }}
          >
            <ChevronLeft size={20} />
          </motion.button>
          <div className="flex gap-2">
            {/* 수집 버튼 */}
            <motion.button
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isCollected ? '#6B7B5E' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
              }}
              onClick={handleCollect}
              whileTap={{ scale: 0.93 }}
            >
              <Archive size={16} stroke={isCollected ? '#FAFAF8' : '#1A1A1A'} />
            </motion.button>
            {/* 좋아요 버튼 */}
            <motion.button
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isSaved ? '#1A1A1A' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
              }}
              onClick={handleLike}
              whileTap={{ scale: 0.93 }}
            >
              <Heart size={16} fill={isSaved ? '#FAFAF8' : 'none'} stroke={isSaved ? '#FAFAF8' : '#1A1A1A'} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto -mt-8 relative z-10 pb-24">
        <div className="px-6">
          <p className="text-[#8A8680]" style={{ fontSize: '0.875rem' }}>{perfumeDetail.brand}</p>
          <h1
            className="text-[#1A1A1A] mt-1"
            style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif" }}
          >
            {perfumeDetail.name}
          </h1>

          {/* 가격 */}
          {perfumeDetail.price && (
            <div className="mt-3">
              <span className="text-[#6B7B5E]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {perfumeDetail.price.toLocaleString()}원
              </span>
            </div>
          )}

          {/* 어코드 뱃지 */}
          {topAccords.length > 0 && (
            <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <p className="text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>어코드</p>
              <div className="flex gap-2 flex-wrap">
                {topAccords.map(accord => (
                  <span
                    key={accord}
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      fontSize: '0.8125rem',
                      backgroundColor: 'rgba(107,123,94,0.1)',
                      color: '#6B7B5E',
                      border: '1px solid rgba(107,123,94,0.2)',
                    }}
                  >
                    {accord}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Note Pyramid */}
          <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center gap-2 mb-4">
              <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>노트 구조</p>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #E8E6E1 0%, transparent 100%)' }} />
              <span className="text-[#B8B4AE]" style={{ fontSize: '0.625rem', letterSpacing: '0.04em' }}>탭으로 레이어 전환</span>
            </div>
            <NotePyramid notes={perfumeDetail.notes} />
          </motion.div>

          {/* 향 이야기 */}
          {perfumeDetail.description && (
            <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>향 이야기</p>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #E8E6E1 0%, transparent 100%)' }} />
              </div>
              <p className="text-[#4A4742]" style={{ fontSize: '0.875rem', lineHeight: 1.8 }}>
                {perfumeDetail.description}
              </p>
            </motion.div>
          )}

          {/* Reviews */}
          {perfumeDetail.reviews?.length > 0 && (
            <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              {avgRating !== null && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F5F3EF] mb-4">
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className="text-[#1A1A1A]" style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-[#B8B4AE]" style={{ fontSize: '0.8125rem' }}>/ 5</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} size={14}
                          fill={idx < Math.round(avgRating) ? '#C4A056' : 'none'}
                          stroke={idx < Math.round(avgRating) ? '#C4A056' : '#E8E6E1'}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
                      리뷰 {perfumeDetail.reviews.length}개 기준
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                사용자 리뷰 ({perfumeDetail.reviews.length})
              </p>
              <div className="space-y-3">
                {(showAllReviews ? perfumeDetail.reviews : perfumeDetail.reviews.slice(0, 1)).map((review, i) => (
                  <motion.div
                    key={i}
                    className="p-4 rounded-xl bg-white"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1A1A1A]" style={{ fontSize: '0.875rem' }}>{review.nickname}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} size={10}
                              fill={idx < review.rating ? '#C4A056' : 'none'}
                              stroke={idx < review.rating ? '#C4A056' : '#E8E6E1'}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
                        {review.createdAt.slice(0, 10)}
                      </span>
                    </div>
                    <p className="text-[#1A1A1A]" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                      {review.content}
                    </p>
                  </motion.div>
                ))}
              </div>
              {perfumeDetail.reviews.length > 1 && (
                <motion.button
                  className="w-full mt-3 py-2.5 rounded-xl border border-[#E8E6E1] text-[#8A8680] flex items-center justify-center gap-1.5"
                  style={{ fontSize: '0.8125rem' }}
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  whileTap={{ scale: 0.97 }}
                >
                  {showAllReviews ? '접기' : `전체보기 (${perfumeDetail.reviews.length})`}
                  <ChevronDown size={14} style={{ transform: showAllReviews ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* 리뷰 작성 폼 */}
          {showReviewForm && (
            <motion.div
              className="mt-4 p-4 rounded-2xl bg-[#F5F3EF]"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-[#1A1A1A] mb-3" style={{ fontSize: '0.875rem', fontWeight: 600 }}>리뷰 작성</p>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <button key={idx} onClick={() => setReviewRating(idx + 1)}>
                    <Star size={24}
                      fill={idx < reviewRating ? '#C4A056' : 'none'}
                      stroke={idx < reviewRating ? '#C4A056' : '#E8E6E1'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full p-3 rounded-xl bg-white border border-[#E8E6E1] outline-none resize-none text-[#1A1A1A]"
                style={{ fontSize: '0.875rem', lineHeight: 1.6 }}
                rows={3}
                placeholder="이 향수에 대한 솔직한 리뷰를 남겨주세요..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
              />
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 py-2.5 rounded-xl border border-[#E8E6E1] text-[#8A8680]"
                  style={{ fontSize: '0.875rem' }}
                  onClick={() => setShowReviewForm(false)}
                >
                  취소
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl text-white"
                  style={{ fontSize: '0.875rem', backgroundColor: reviewRating > 0 && reviewContent.trim() ? '#6B7B5E' : '#C8C4BE' }}
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || reviewRating === 0 || !reviewContent.trim()}
                >
                  {isSubmitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </motion.div>
          )}

          {/* CTA 버튼들 */}
          <div className="flex gap-2 mt-8">
            <motion.button
              className="flex-1 py-3.5 rounded-2xl border border-[#6B7B5E]/20 text-[#6B7B5E] flex items-center justify-center gap-2"
              style={{ fontSize: '0.875rem' }}
              onClick={() => setShowReviewForm(!showReviewForm)}
              whileTap={{ scale: 0.97 }}
            >
              <Star size={14} />
              리뷰 쓰기
            </motion.button>
            <motion.button
              className="flex-1 py-3.5 rounded-2xl border border-[#6B7B5E]/20 text-[#6B7B5E] flex items-center justify-center gap-2"
              style={{ fontSize: '0.875rem' }}
              onClick={() => navigateTo('diary-write')}
              whileTap={{ scale: 0.97 }}
            >
              <BookOpen size={14} />
              오늘의 향으로 기록
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

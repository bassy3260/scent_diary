import { motion } from 'motion/react';
import { ChevronLeft, Heart, BookOpen, Star, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../store';
import type { Perfume } from '../../types/perfume.types';
import { NotePyramid } from './NotePyramid';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface PerfumeDetailProps {
  perfume: Perfume;
  onBack: () => void;
}

export function PerfumeDetail({ perfume, onBack }: PerfumeDetailProps) {
  const { savedPerfumes, toggleSavedPerfume, navigateTo } = useAppStore();
  const isSaved = savedPerfumes.includes(perfume.id);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // 전체 평점 계산
  const avgRating = perfume.reviews?.length
    ? perfume.reviews.reduce((sum, r) => sum + r.rating, 0) / perfume.reviews.length
    : null;

  // 상위 3개 어코드 뱃지
  const topAccords = [...perfume.accords]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* Hero image */}
      <motion.div
        className="relative w-full h-72 shrink-0"
        layoutId={`perfume-card-${perfume.id}`}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <motion.div layoutId={`perfume-image-${perfume.id}`} className="w-full h-full">
          <ImageWithFallback src={perfume.image} alt={perfume.name} className="w-full h-full object-cover" />
        </motion.div>
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
            <motion.button
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isSaved ? '#1A1A1A' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
              }}
              onClick={() => toggleSavedPerfume(perfume.id)}
              whileTap={{ scale: 0.93 }}
            >
              <Heart size={16} fill={isSaved ? '#FAFAF8' : 'none'} stroke={isSaved ? '#FAFAF8' : '#1A1A1A'} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto -mt-8 relative z-10 pb-24">
        <div className="px-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-lg text-white" style={{ fontSize: '0.75rem', backgroundColor: perfume.familyColor }}>
              {perfume.family}
            </span>
          </div>

          <p className="text-[#8A8680]" style={{ fontSize: '0.875rem' }}>{perfume.brand}</p>
          <motion.h1
            layoutId={`perfume-name-${perfume.id}`}
            className="text-[#1A1A1A] mt-1"
            style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif" }}
          >
            {perfume.name}
          </motion.h1>

          {/* 가격 정보 */}
          {perfume.price && (
            <motion.div
              className="mt-3 flex items-center gap-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <span className="text-[#6B7B5E]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {perfume.price}
              </span>
            </motion.div>
          )}

          {/* 향 이야기 — 추천 이유 자리를 대체 */}
          <motion.div className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: '#F5F3EF' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35, ease: [0, 0, 0.2, 1] }}>
            <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>향 이야기</p>
            <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem', lineHeight: 1.8, fontFamily: "'Playfair Display', serif" }}>
              {perfume.story}
            </p>
          </motion.div>

          {/* Note Pyramid */}
          <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.35 }}>
            <div className="flex items-center gap-2 mb-4">
              <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>노트 구조</p>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #E8E6E1 0%, transparent 100%)' }} />
              <span className="text-[#B8B4AE]" style={{ fontSize: '0.625rem', letterSpacing: '0.04em' }}>탭으로 레이어 전환</span>
            </div>
            <NotePyramid perfume={perfume} />
          </motion.div>

          {/* 어코드 — 퍼센트/차트 없이 상위 3개 뱃지만 */}
          <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.35 }}>
            <p className="text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>어코드</p>
            <div className="flex gap-2 flex-wrap">
              {topAccords.map(accord => (
                <span
                  key={accord.name}
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    fontSize: '0.8125rem',
                    backgroundColor: `${accord.color}18`,
                    color: accord.color,
                    border: `1px solid ${accord.color}30`,
                  }}
                >
                  {accord.name}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Reviews */}
          {perfume.reviews?.length && (
            <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.35 }}>
              {/* 전체 평점 요약 */}
              {avgRating !== null && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F5F3EF] mb-4">
                  <div className="flex items-baseline gap-1 shrink-0 whitespace-nowrap">
                    <span className="text-[#1A1A1A]" style={{ fontSize: '2rem', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-[#B8B4AE]" style={{ fontSize: '0.8125rem' }}>/ 5</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={14}
                          fill={idx < Math.round(avgRating) ? '#C4A056' : 'none'}
                          stroke={idx < Math.round(avgRating) ? '#C4A056' : '#E8E6E1'}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
                      리뷰 {perfume.reviews!.length}개 기준
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>사용자 리뷰 ({perfume.reviews?.length || 0})</p>
              </div>
              <div className="space-y-3">
                {(showAllReviews ? perfume.reviews : perfume.reviews.slice(0, 1)).map((review, i) => (
                  <motion.div
                    key={i}
                    className="p-4 rounded-xl bg-white"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.05, duration: 0.3 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1A1A1A]" style={{ fontSize: '0.875rem' }}>{review.userName}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              size={10}
                              fill={idx < review.rating ? '#C4A056' : 'none'}
                              stroke={idx < review.rating ? '#C4A056' : '#E8E6E1'}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>{review.date}</span>
                    </div>
                    <p className="text-[#1A1A1A]" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                      {review.comment}
                    </p>
                  </motion.div>
                ))}
              </div>
              {perfume.reviews.length > 1 && (
                <motion.button
                  className="w-full mt-3 py-2.5 rounded-xl border border-[#E8E6E1] text-[#8A8680] flex items-center justify-center gap-1.5 hover:bg-[#F5F3EF]"
                  style={{ fontSize: '0.8125rem' }}
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  whileTap={{ scale: 0.97 }}
                >
                  {showAllReviews ? '접기' : `전체보기 (${perfume.reviews.length})`}
                  <ChevronDown
                    size={14}
                    style={{
                      transform: showAllReviews ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }}
                  />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Record CTA */}
          <motion.button
            className="w-full mt-8 py-3.5 rounded-2xl border border-[#6B7B5E]/20 text-[#6B7B5E] flex items-center justify-center gap-2"
            style={{ fontSize: '0.875rem' }}
            onClick={() => navigateTo('diary-write')}
            whileTap={{ scale: 0.97 }}
          >
            <BookOpen size={14} />
            오늘의 향으로 기록하기
          </motion.button>
        </div>
      </div>
    </div>
  );
}

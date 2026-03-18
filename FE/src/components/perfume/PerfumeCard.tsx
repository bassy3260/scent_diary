import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useAppStore } from '../../store';
import type { Perfume } from '../../types/perfume.types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface PerfumeCardProps {
  perfume: Perfume;
  isHero?: boolean;
  rank?: number;
  onTap?: () => void;
  showReason?: boolean;
}

export function PerfumeCard({ perfume, isHero = false, rank, onTap, showReason = false }: PerfumeCardProps) {
  const { savedPerfumes, toggleSavedPerfume } = useAppStore();
  const isSaved = savedPerfumes.includes(perfume.id);

  if (isHero) {
    return (
      <>
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #FFFFFF 0%, #F5F3EF 100%)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.05)',
          }}
          whileTap={{ scale: 0.98 }}
          onClick={onTap}
          layoutId={`perfume-card-${perfume.id}`}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          <div className="relative w-full h-52 overflow-hidden">
            <motion.div layoutId={`perfume-image-${perfume.id}`} className="w-full h-full">
              <ImageWithFallback src={perfume.image} alt={perfume.name} className="w-full h-full object-cover" />
            </motion.div>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(180deg, transparent 35%, rgba(250,250,248,0.9) 100%)',
            }} />
            {rank && (
              <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '0.75rem' }}>#{rank}</span>
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <motion.button
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isSaved ? '#1A1A1A' : 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(10px)',
                }}
                onClick={(e) => { e.stopPropagation(); toggleSavedPerfume(perfume.id); }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart size={14} fill={isSaved ? '#FAFAF8' : 'none'} stroke={isSaved ? '#FAFAF8' : '#1A1A1A'} />
              </motion.button>
            </div>
          </div>

          <div className="px-5 pb-5 -mt-2 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md text-white"
                style={{ fontSize: '0.6875rem', backgroundColor: perfume.familyColor }}>
                {perfume.family}
              </span>
            </div>
            <p className="text-[#8A8680]" style={{ fontSize: '0.75rem' }}>{perfume.brand}</p>
            <motion.h3
              layoutId={`perfume-name-${perfume.id}`}
              className="text-[#1A1A1A] mt-0.5"
              style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}
            >
              {perfume.name}
            </motion.h3>
          </div>
        </motion.div>

        {/* 추천 이유 — 카드 밖 하단 */}
        {showReason && perfume.reason && (
          <p
            className="text-[#8A8680] px-1 mt-2.5"
            style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}
          >
            {perfume.reason}
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <motion.div
        className="flex gap-4 p-3 rounded-2xl"
        style={{
          background: 'linear-gradient(145deg, #FFFFFF 0%, #F5F3EF 100%)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        }}
        whileTap={{ scale: 0.98 }}
        onClick={onTap}
        layoutId={`perfume-card-${perfume.id}`}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
          <motion.div layoutId={`perfume-image-${perfume.id}`} className="w-full h-full">
            <ImageWithFallback src={perfume.image} alt={perfume.name} className="w-full h-full object-cover" />
          </motion.div>
          {rank && (
            <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#1A1A1A]/80 flex items-center justify-center">
              <span className="text-white" style={{ fontSize: '0.5625rem' }}>#{rank}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-white"
              style={{ fontSize: '0.5625rem', backgroundColor: perfume.familyColor }}>
              {perfume.family}
            </span>
          </div>
          <p className="text-[#8A8680] mt-0.5" style={{ fontSize: '0.6875rem' }}>{perfume.brand}</p>
          <motion.p
            layoutId={`perfume-name-${perfume.id}`}
            className="text-[#1A1A1A] truncate"
            style={{ fontSize: '0.9375rem' }}
          >
            {perfume.name}
          </motion.p>
        </div>
        <div className="flex flex-col gap-1.5 justify-center">
          <motion.button
            className="w-8 h-8 rounded-full flex items-center justify-center border border-[#E8E6E1]"
            onClick={(e) => { e.stopPropagation(); toggleSavedPerfume(perfume.id); }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart size={12} fill={isSaved ? '#1A1A1A' : 'none'} stroke="#1A1A1A" />
          </motion.button>
        </div>
      </motion.div>

      {/* 추천 이유 — 카드 밖 하단 */}
      {showReason && perfume.reason && (
        <p
          className="text-[#8A8680] px-1 mt-2"
          style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}
        >
          {perfume.reason.length > 80 ? `${perfume.reason.slice(0, 80)}…` : perfume.reason}
        </p>
      )}
    </>
  );
}

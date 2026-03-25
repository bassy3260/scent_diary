import { motion } from 'motion/react';
import { getAccordColor } from '../../utils/mypage';
import type { RecommendDetailResult } from '../../types/mypage.types';

interface ResultCardProps {
  result: RecommendDetailResult;
  rank: number;
  isHero?: boolean;
  onTap?: (() => void) | null;
}

export function ResultCard({ result, rank, isHero = false, onTap }: ResultCardProps) {
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
              <span className="text-white" style={{ fontSize: '0.75rem' }}>#{rank}</span>
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
            <p className="text-[#8A8680]" style={{ fontSize: '0.75rem' }}>{result.brand}</p>
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
          <span className="text-white" style={{ fontSize: '0.5625rem' }}>#{rank}</span>
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
        <p className="text-[#8A8680] mt-0.5" style={{ fontSize: '0.6875rem' }}>{result.brand}</p>
        <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.9375rem' }}>{result.name}</p>
        <p className="text-[#8A8680] mt-1.5" style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>{result.reason}</p>
      </div>
      <div
        className="w-1 rounded-full self-stretch"
        style={{ backgroundColor: `${getAccordColor(result.accords[0] ?? '')}40` }}
      />
    </motion.div>
  );
}

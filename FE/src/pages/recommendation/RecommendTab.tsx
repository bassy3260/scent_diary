import { motion } from 'motion/react';
import { Sparkles, Camera, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store';

export function RecommendTab() {
  const { navigateTo, setIsGiftMode } = useAppStore();

  const trendingKeywords = [
    '비 온 뒤 숲', '클린한 아침', '따뜻한 우드',
    '해변의 바람', '밤의 꽃', '포근한 캐시미어',
  ];

  const handleTrendingKeyword = (kw: string) => {
    useAppStore.getState().updateProfile({ emotionText: kw });
    setIsGiftMode(false);
    navigateTo('recommend-prestep');
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-3">
        <motion.p
          className="text-[#B8B4AE]"
          style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          RECOMMEND
        </motion.p>
        <motion.h2
          className="mt-2 text-[#1A1A1A]"
          style={{ fontSize: '1.625rem', lineHeight: 1.3, fontFamily: "'Playfair Display', serif" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
        >
          오늘은 어떤 향을<br />찾고 계신가요?
        </motion.h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {/* Two input modes */}
        <motion.div
          className="grid grid-cols-2 gap-3 mt-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* 텍스트로 추천받기 */}
          <motion.button
            className="p-5 rounded-2xl flex flex-col items-start gap-3 text-left relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #F5F3EF, #FAFAF8)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
            }}
            onClick={() => navigateTo('text-choice')}
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <motion.div
              className="w-10 h-10 rounded-full bg-[#6B7B5E]/10 flex items-center justify-center"
              whileHover={{ rotate: 15 }}
            >
              <Sparkles size={18} className="text-[#6B7B5E]" />
            </motion.div>
            <div>
              <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>텍스트로</p>
              <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>추천받기</p>
            </div>
            <p className="text-[#B8B4AE]" style={{ fontSize: '0.75rem' }}>
              감정 표현으로
            </p>
          </motion.button>

          {/* 이미지로 추천받기 */}
          <motion.button
            className="p-5 rounded-2xl flex flex-col items-start gap-3 text-left relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #F5F3EF, #FAFAF8)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
            }}
            onClick={() => navigateTo('photo-recommend')}
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <motion.div
              className="w-10 h-10 rounded-full bg-[#B8A5C8]/10 flex items-center justify-center"
              whileHover={{ rotate: -15 }}
            >
              <Camera size={18} className="text-[#B8A5C8]" />
            </motion.div>
            <div>
              <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>이미지로</p>
              <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>추천받기</p>
            </div>
            <p className="text-[#B8B4AE]" style={{ fontSize: '0.75rem' }}>
              사진 업로드로
            </p>
          </motion.button>
        </motion.div>

        {/* Trending keywords */}
        <motion.div
          className="mt-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={12} className="text-[#6B7B5E]" />
            <p className="text-[#8A8680]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
              지금 인기 있는 분위기
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingKeywords.map((kw, i) => (
              <motion.button
                key={kw}
                className="px-4 py-2.5 rounded-full bg-[#F5F3EF] text-[#1A1A1A]"
                style={{ fontSize: '0.8125rem' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 500, damping: 25 }}
                whileTap={{ scale: 0.9 }}
                whileHover={{ y: -2 }}
                onClick={() => handleTrendingKeyword(kw)}
              >
                {kw}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* New Recommendation CTA */}
        <motion.button
          className="w-full mt-7 py-4 rounded-2xl flex items-center justify-center gap-2"
          style={{
            fontSize: '0.9375rem',
            background: 'linear-gradient(135deg, #1A1A1A, #2D2D2D)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(26,26,26,0.2)',
          }}
          onClick={() => navigateTo('text-choice')}
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Sparkles size={16} />
          새로운 추천 받기
        </motion.button>

        {/* Guide text */}
        <motion.div
          className="mt-6 p-4 rounded-2xl"
          style={{ background: 'linear-gradient(145deg, #F8F7F4, #F2F0EC)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-[#8A8680]" style={{ fontSize: '0.75rem', lineHeight: 1.7 }}>
            💡 추천받은 향수는 <span className="text-[#6B7B5E]">마이 탭 → 추천 히스토리</span>에서 다시 확인할 수 있어요.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

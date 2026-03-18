import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const steps = [
  {
    title: '당신의 감성으로\n향을 찾아드려요',
    subtitle: '기분, 기억, 분위기를 말해주세요.\nAI가 당신만의 향을 큐레이션합니다.',
    orbColors: ['#A3B18A', '#6B7B5E', '#B8A88A'],
    gradient: 'linear-gradient(135deg, rgba(163,177,138,0.15) 0%, rgba(184,168,138,0.08) 100%)',
  },
  {
    title: '어려운 용어 없이\n느낌만으로 충분해요',
    subtitle: '향수를 몰라도 괜찮아요.\n자유로운 문장이나 키워드면 됩니다.',
    orbColors: ['#B8A5C8', '#8BA4B8', '#C8A5A5'],
    gradient: 'linear-gradient(135deg, rgba(184,165,200,0.15) 0%, rgba(139,164,184,0.08) 100%)',
  },
  {
    title: 'AI가 당신의 말을\n향 노트로 번역해요',
    subtitle: '탑, 미들, 베이스 노트로 해석하고\n어울리는 향수를 찾아냅니다.',
    orbColors: ['#C4956A', '#B8A88A', '#D4C5A9'],
    gradient: 'linear-gradient(135deg, rgba(196,149,106,0.15) 0%, rgba(184,168,138,0.08) 100%)',
  },
  {
    title: '추천, 저장, 기록까지\n나만의 향 라이브러리',
    subtitle: '마음에 드는 향수를 저장하고,\n향수 다이어리로 취향을 쌓아가세요.',
    orbColors: ['#C8A5A5', '#A3B18A', '#B8A5C8'],
    gradient: 'linear-gradient(135deg, rgba(200,165,165,0.15) 0%, rgba(163,177,138,0.08) 100%)',
  },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];

  const handleNext = () => {
    if (current < steps.length - 1) setCurrent(current + 1);
    else onComplete();
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ background: '#FAFAF8' }}>
      {/* Skip */}
      <motion.button
        className="absolute top-14 right-6 z-20 text-[#B8B4AE] tracking-wide"
        style={{ fontSize: '0.8125rem' }}
        onClick={onComplete}
        whileTap={{ scale: 0.95 }}
      >
        건너뛰기
      </motion.button>

      {/* Progress */}
      <div className="flex gap-2 pt-6 px-6 z-10">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className="h-[2.5px] rounded-full"
            style={{
              flex: i === current ? 2.5 : 1,
              backgroundColor: i <= current ? '#1A1A1A' : '#E8E6E1',
            }}
            animate={{
              flex: i === current ? 2.5 : 1,
              backgroundColor: i <= current ? '#1A1A1A' : '#E8E6E1',
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="flex-1 flex flex-col px-8 pt-12"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[#1A1A1A] whitespace-pre-line" style={{ fontSize: '2rem', lineHeight: 1.15, fontFamily: "'Playfair Display', serif" }}>
            {step.title}
          </h1>
          <p className="mt-5 text-[#8A8680] whitespace-pre-line" style={{ fontSize: '0.9375rem', lineHeight: 1.7 }}>
            {step.subtitle}
          </p>

          {/* Visual */}
          <div className="flex-1 flex items-center justify-center relative">
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full"
              style={{ background: step.gradient, filter: 'blur(50px)' }}
              animate={{ scale: [1, 1.06, 0.97, 1] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Main orb */}
            <motion.div
              className="relative w-44 h-44 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${step.orbColors[0]}28 0%, ${step.orbColors[1]}1A 50%, ${step.orbColors[2]}12 100%)`,
                boxShadow: `0 24px 80px ${step.orbColors[0]}12, inset 0 0 50px rgba(255,255,255,0.3)`,
              }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute inset-4 rounded-full"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, transparent 50%)' }} />

              {/* Floating elements */}
              {step.orbColors.map((color, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: color,
                    opacity: 0.4,
                    top: `${15 + i * 28}%`,
                    left: `${-8 + i * 42}%`,
                    filter: 'blur(1px)',
                  }}
                  animate={{
                    x: [0, 12 * (i + 1), -6 * (i + 1), 0],
                    y: [0, -10 * (i + 1), 5, 0],
                    opacity: [0.25, 0.5, 0.3, 0.25],
                  }}
                  transition={{ duration: 4 + i * 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                />
              ))}
            </motion.div>

            {/* Scattered particles */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 6 + i * 3,
                  height: 6 + i * 3,
                  background: `${step.orbColors[i % 3]}30`,
                  filter: 'blur(2px)',
                  left: `${12 + i * 18}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -18 - i * 4, 8, 0],
                  x: [0, 6, -6, 0],
                  opacity: [0.2, 0.4, 0.15, 0.2],
                }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* CTA */}
      <div className="px-6 pb-10">
        <motion.button
          className="w-full py-4 rounded-2xl bg-[#1A1A1A] text-white tracking-wide"
          style={{ fontSize: '0.9375rem' }}
          onClick={handleNext}
          whileTap={{ scale: 0.98 }}
        >
          {current < steps.length - 1 ? '다음' : '시작하기'}
        </motion.button>
      </div>
    </div>
  );
}

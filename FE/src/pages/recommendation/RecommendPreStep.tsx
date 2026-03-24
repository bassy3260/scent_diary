import { ChevronLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store';
import { PRICE_RANGES } from '../../constants/ui.constants';

interface RecommendPreStepProps {
  onComplete: () => void;
  onBack?: () => void;
}

// 2단계 플로우: price → notePreference
const STEPS = ['price', 'notePreference'] as const;
type StepKey = typeof STEPS[number];

export function RecommendPreStep({ onComplete, onBack }: RecommendPreStepProps) {
  const { updateProfile } = useAppStore();
  const [step, setStep] = useState(0);
  const [priceRange, setPriceRange] = useState('');
  const [notePreference, setNotePreference] = useState('');

  const currentStepKey: StepKey = STEPS[step];

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else onBack?.();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      updateProfile({ priceRange, notePreference });
      onComplete();
    }
  };

  const canProceed = () => {
    switch (currentStepKey) {
      case 'price': return !!priceRange;
      case 'notePreference': return !!notePreference;
      default: return false;
    }
  };

  const questionText: Record<StepKey, string> = {
    price: '예산은\n어느 정도인가요?',
    notePreference: '어떤 향을\n중요하게 생각하시나요?',
  };

  const subText: Record<StepKey, string> = {
    price: '가격대에 맞는 향수를 추천해드릴게요.',
    notePreference: '향수의 변화 과정에서 중요한 부분을 선택해주세요.',
  };

  const renderOptions = () => {
    switch (currentStepKey) {
      case 'price':
        return (
          <div className="flex flex-col gap-3 mt-6">
            {PRICE_RANGES.map((priceItem, i) => {
              const selected = priceRange === priceItem.label;
              return (
                <motion.button
                  key={priceItem.label}
                  className="w-full py-4 px-5 rounded-2xl border-2 flex items-center gap-4 text-left relative overflow-hidden"
                  style={{
                    borderColor: selected ? '#6B7B5E' : 'rgba(0,0,0,0.06)',
                    backgroundColor: selected ? '#6B7B5E08' : '#FFFFFF',
                  }}
                  onClick={() => setPriceRange(priceItem.label)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 500, damping: 30 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden text-2xl"
                    style={{
                      background: selected ? '#6B7B5E15' : '#F5F3EF',
                      boxShadow: selected
                        ? '0 0 0 2.5px #6B7B5E44'
                        : '0 0 0 1.5px rgba(0,0,0,0.06)',
                    }}
                    animate={selected ? { scale: 1.08 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                  >
                    {priceItem.emoji}
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>{priceItem.label}</p>
                  </div>
                  {selected && (
                    <motion.div
                      className="w-6 h-6 rounded-full bg-[#6B7B5E] flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        );

      case 'notePreference':
        return (
          <div className="flex flex-col gap-3 mt-6">
            <motion.button
              key="TOP"
              className="w-full py-4 px-5 rounded-2xl border-2 flex items-center gap-4 text-left relative overflow-hidden"
              style={{
                borderColor: notePreference === 'TOP' ? '#6B7B5E' : 'rgba(0,0,0,0.06)',
                backgroundColor: notePreference === 'TOP' ? '#6B7B5E08' : '#FFFFFF',
              }}
              onClick={() => setNotePreference('TOP')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0 * 0.08, type: 'spring', stiffness: 500, damping: 30 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden text-2xl"
                style={{
                  background: notePreference === 'TOP' ? '#6B7B5E15' : '#F5F3EF',
                  boxShadow: notePreference === 'TOP'
                    ? '0 0 0 2.5px #6B7B5E44'
                    : '0 0 0 1.5px rgba(0,0,0,0.06)',
                }}
                animate={notePreference === 'TOP' ? { scale: 1.08 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 15 }}
              >
                ✨
              </motion.div>
              <div className="flex-1">
                <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>첫향 (탑노트)</p>
                <p className="text-[#B8B4AE] mt-0.5" style={{ fontSize: '0.75rem' }}>
                  뿌린 직후 5~10분간 느껴지는 첫인상
                </p>
              </div>
              {notePreference === 'TOP' && (
                <motion.div
                  className="w-6 h-6 rounded-full bg-[#6B7B5E] flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
            <motion.button
              key="MIDDLE"
              className="w-full py-4 px-5 rounded-2xl border-2 flex items-center gap-4 text-left relative overflow-hidden"
              style={{
                borderColor: notePreference === 'MIDDLE' ? '#6B7B5E' : 'rgba(0,0,0,0.06)',
                backgroundColor: notePreference === 'MIDDLE' ? '#6B7B5E08' : '#FFFFFF',
              }}
              onClick={() => setNotePreference('MIDDLE')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 * 0.08, type: 'spring', stiffness: 500, damping: 30 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden text-2xl"
                style={{
                  background: notePreference === 'MIDDLE' ? '#6B7B5E15' : '#F5F3EF',
                  boxShadow: notePreference === 'MIDDLE'
                    ? '0 0 0 2.5px #6B7B5E44'
                    : '0 0 0 1.5px rgba(0,0,0,0.06)',
                }}
                animate={notePreference === 'MIDDLE' ? { scale: 1.08 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 15 }}
              >
                💫
              </motion.div>
              <div className="flex-1">
                <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>미들노트 (하트노트)</p>
                <p className="text-[#B8B4AE] mt-0.5" style={{ fontSize: '0.75rem' }}>
                  향수의 핵심, 30분~2시간 지속되는 향
                </p>
              </div>
              {notePreference === 'MIDDLE' && (
                <motion.div
                  className="w-6 h-6 rounded-full bg-[#6B7B5E] flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
            <motion.button
              key="BASE"
              className="w-full py-4 px-5 rounded-2xl border-2 flex items-center gap-4 text-left relative overflow-hidden"
              style={{
                borderColor: notePreference === 'BASE' ? '#6B7B5E' : 'rgba(0,0,0,0.06)',
                backgroundColor: notePreference === 'BASE' ? '#6B7B5E08' : '#FFFFFF',
              }}
              onClick={() => setNotePreference('BASE')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2 * 0.08, type: 'spring', stiffness: 500, damping: 30 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden text-2xl"
                style={{
                  background: notePreference === 'BASE' ? '#6B7B5E15' : '#F5F3EF',
                  boxShadow: notePreference === 'BASE'
                    ? '0 0 0 2.5px #6B7B5E44'
                    : '0 0 0 1.5px rgba(0,0,0,0.06)',
                }}
                animate={notePreference === 'BASE' ? { scale: 1.08 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 15 }}
              >
                🌙
              </motion.div>
              <div className="flex-1">
                <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>잔향 (베이스노트)</p>
                <p className="text-[#B8B4AE] mt-0.5" style={{ fontSize: '0.75rem' }}>
                  오래 지속되는 깊고 묵직한 마지막 향
                </p>
              </div>
              {notePreference === 'BASE' && (
                <motion.div
                  className="w-6 h-6 rounded-full bg-[#6B7B5E] flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: '#FAFAF8' }}>
      {/* Header with progress */}
      <div className="pt-6 px-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            onClick={handleBack}
            className="text-[#8A8680] w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F3EF]"
            whileTap={{ scale: 0.85 }}
          >
            <ChevronLeft size={18} />
          </motion.button>

          {/* Segmented progress */}
          <div className="flex-1 flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: '#ECEAE5' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      i < step
                        ? '#6B7B5E'
                        : i === step
                          ? 'linear-gradient(90deg, #6B7B5E, #8FA380)'
                          : 'transparent',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: i <= step ? '100%' : '0%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i <= step ? i * 0.05 : 0 }}
                />
              </div>
            ))}
          </div>

          <span className="text-[#B8B4AE] min-w-[2rem] text-right" style={{ fontSize: '0.6875rem' }}>
            {step + 1}/{STEPS.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            {/* Question */}
            <motion.div
              className="mt-2"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.1 }}
            >
              <h1
                className="whitespace-pre-line text-[#1A1A1A]"
                style={{ fontSize: '1.75rem', lineHeight: 1.2, fontFamily: "'Playfair Display', serif" }}
              >
                {questionText[currentStepKey]}
              </h1>
              <motion.p
                className="mt-3 text-[#8A8680]"
                style={{ fontSize: '0.875rem', lineHeight: 1.6 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {subText[currentStepKey]}
              </motion.p>
            </motion.div>

            {renderOptions()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA Button */}
      <div className="px-6 pb-10 pt-4">
        <motion.button
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 tracking-wide"
          style={{
            fontSize: '0.9375rem',
            backgroundColor: canProceed() ? '#6B7B5E' : '#E8E6E1',
            color: canProceed() ? '#FAFAF8' : '#B8B4AE',
          }}
          onClick={handleNext}
          disabled={!canProceed()}
          whileTap={canProceed() ? { scale: 0.96 } : {}}
          animate={canProceed() ? { boxShadow: '0 6px 24px rgba(107,123,94,0.25)' } : { boxShadow: '0 0px 0px rgba(0,0,0,0)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {step === STEPS.length - 1 ? (
            <>
              <Sparkles size={16} />
              감정 입력으로
            </>
          ) : (
            '계속'
          )}
        </motion.button>
      </div>
    </div>
  );
}

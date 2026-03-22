import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store';
import { SAMPLE_PROMPTS, MOOD_KEYWORDS } from '../../constants/ui.constants';
import { Sparkles, ArrowRight, ChevronLeft } from 'lucide-react';

interface EmotionInputProps {
  onComplete: () => void;
  onBack?: () => void;
}

export function EmotionInput({ onComplete, onBack }: EmotionInputProps) {
  const { profile, updateProfile } = useAppStore();
  const [text, setText] = useState(profile.emotionText);
  const [moodKeywords, setMoodKeywords] = useState<string[]>(profile.moodKeywords || []);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % SAMPLE_PROMPTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    updateProfile({ emotionText: text, moodKeywords });
    onComplete();
  };

  const toggleMood = (keyword: string) => {
    setMoodKeywords(prev => {
      const isCurrentlySelected = prev.includes(keyword);

      if (isCurrentlySelected) {
        // 선택 해제 시 배열에서만 제거 (텍스트는 그대로 유지)
        return prev.filter(k => k !== keyword);
      } else {
        // 선택 시 텍스트 필드에도 추가
        if (prev.length < 3) {
          setText((currentText: string) => {
            const sep = currentText.length > 0 ? ', ' : '';
            return currentText + sep + keyword;
          });
          return [...prev, keyword];
        }
        return prev;
      }
    });
  };

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: '#FAFAF8' }}>
      {/* Header */}
      <div className="pt-6 px-6">
        {onBack && (
          <motion.button
            className="mb-4 text-[#8A8680] w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F3EF]"
            onClick={onBack}
            whileTap={{ scale: 0.85 }}
          >
            <ChevronLeft size={22} />
          </motion.button>
        )}

        {/* Active condition chips from prestep */}
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.ageRange && (
            <motion.span
              className="px-3 py-1.5 rounded-full text-[#8A8680] border border-[#E8E6E1]"
              style={{ fontSize: '0.75rem' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {profile.ageRange}
            </motion.span>
          )}
          {profile.gender && (
            <motion.span
              className="px-3 py-1.5 rounded-full text-[#8A8680] border border-[#E8E6E1]"
              style={{ fontSize: '0.75rem' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.05 }}
            >
              {profile.gender}
            </motion.span>
          )}
        </div>

        <h1 className="text-[#1A1A1A]" style={{ fontSize: '1.875rem', lineHeight: 1.2, fontFamily: "'Playfair Display', serif" }}>
          원하는 향의 느낌을<br/>자유롭게 표현해주세요
        </h1>
        <p className="mt-3 text-[#8A8680]" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
          기분, 장소, 기억, 상황 — 어떤 말이든 좋아요.
        </p>
      </div>

      {/* Input area */}
      <div className="flex-1 px-6 pt-5 overflow-y-auto">
        <motion.div
          className="rounded-2xl border-2 p-4 min-h-[130px] transition-all"
          style={{
            borderColor: isFocused ? '#6B7B5E' : 'rgba(0,0,0,0.05)',
            backgroundColor: isFocused ? 'rgba(107,123,94,0.02)' : 'rgba(0,0,0,0.01)',
          }}
          animate={{
            boxShadow: isFocused ? '0 8px 32px rgba(107,123,94,0.06)' : '0 0 0 rgba(0,0,0,0)',
          }}
        >
          <textarea
            className="w-full bg-transparent resize-none text-[#1A1A1A] placeholder:text-[#D4D0CA] outline-none"
            style={{ fontSize: '1rem', lineHeight: 1.7 }}
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={SAMPLE_PROMPTS[placeholderIdx]}
          />
          {text.length > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8E6E1]/50">
              <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>{text.length}자</span>
              <Sparkles size={13} className="text-[#6B7B5E]/60" />
            </div>
          )}
        </motion.div>

        {/* Mood keywords (빠른 추가 대체) */}
        <div className="mt-5 mb-6">
          <p className="text-[#8A8680] mb-2.5" style={{ fontSize: '0.6875rem', letterSpacing: '0.05em' }}>
            빠른 추가
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {MOOD_KEYWORDS.map((kw, i) => {
              const isSelected = moodKeywords.includes(kw.label);
              return (
                <motion.button
                  key={kw.label}
                  className="py-3 rounded-full border-2 flex items-center justify-center gap-1.5"
                  style={{
                    borderColor: isSelected ? kw.color : 'rgba(0,0,0,0.06)',
                    backgroundColor: isSelected ? `${kw.color}15` : '#FFFFFF',
                    color: isSelected ? '#1A1A1A' : '#8A8680',
                    fontSize: '0.875rem',
                  }}
                  onClick={() => toggleMood(kw.label)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: isSelected ? -4 : 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 500, damping: 22 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {kw.label}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, width: 0 }}
                      animate={{ scale: 1, width: 'auto' }}
                      exit={{ scale: 0, width: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke={kw.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
          {moodKeywords.length > 0 && (
            <motion.p
              className="w-full text-center text-[#6B7B5E] mt-2"
              style={{ fontSize: '0.75rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {moodKeywords.length}/3 선택됨
            </motion.p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 pt-4">
        <motion.button
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 tracking-wide transition-all"
          style={{
            fontSize: '0.9375rem',
            backgroundColor: text.length > 5 ? '#1A1A1A' : '#E8E6E1',
            color: text.length > 5 ? '#FAFAF8' : '#B8B4AE',
          }}
          onClick={handleSubmit}
          disabled={text.length <= 5}
          whileTap={text.length > 5 ? { scale: 0.98 } : {}}
        >
          내 향을 분석하기
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}

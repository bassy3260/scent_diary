import { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { useAppStore } from '../../store';
import { AGE_RANGES, PROFILE_GENDERS } from '../../constants/ui.constants';

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

export function ProfileSetupScreen({ onComplete }: ProfileSetupScreenProps) {
  const profile = useAppStore((state) => state.profile);
  const signupDraft = useAppStore((state) => state.signupDraft);
  const signup = useAppStore((state) => state.signup);
  const [ageRange, setAgeRange] = useState(profile.ageRange || profile.age || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const canContinue = Boolean(signupDraft) && Boolean(ageRange) && Boolean(gender) && !loading;

  const handleComplete = async () => {
    if (!canContinue) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup({
        age: ageRange,
        gender,
      });
      setSubmitted(true);
      window.setTimeout(() => {
        onComplete();
      }, 900);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '회원가입을 완료하지 못했어요. 다시 시도해 주세요.');
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#FAFAF8' }}>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        >
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6B7B5E, #8FA380)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 18, delay: 0.05 }}
          >
            <User size={26} className="text-white" />
          </motion.div>
          <p className="text-[#1A1A1A]" style={{ fontSize: '1.125rem', fontFamily: "'Playfair Display', serif" }}>
            회원가입이 완료되었어요
          </p>
          <p className="text-[#8A8680] text-center" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
            이제 로그인해서 ScentLog를 시작해 볼까요?
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-14 px-6 pb-6">
        <motion.div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6B7B5E] to-[#8FA380] flex items-center justify-center mb-5"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <User size={28} className="text-white" />
        </motion.div>
        <motion.h1
          className="text-[#1A1A1A]"
          style={{ fontSize: '1.75rem', fontFamily: "'Playfair Display', serif" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          프로필 설정
        </motion.h1>
        <motion.p
          className="text-[#8A8680] mt-2"
          style={{ fontSize: '0.9375rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          더 잘 어울리는 향을 추천하기 위해
          <br />
          몇 가지 정보를 알려 주세요.
        </motion.p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-[#B8B4AE] mb-2" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            닉네임
          </label>
          <div
            className="w-full px-4 py-3.5 rounded-xl bg-[#F5F3EF] border border-[#E8E6E1] text-[#8A8680]"
            style={{ fontSize: '0.9375rem' }}
          >
            {signupDraft?.nickname || profile.nickname || '닉네임 정보가 없어요'}
          </div>
          <p className="text-[#B8B4AE] mt-1.5" style={{ fontSize: '0.6875rem' }}>
            1단계에서 입력한 닉네임이에요
          </p>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            성별
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PROFILE_GENDERS.map((option) => (
              <motion.button
                key={option}
                className="py-3 rounded-xl transition-colors"
                style={{
                  background: gender === option ? 'linear-gradient(135deg, #6B7B5E, #8FA380)' : '#FFFFFF',
                  color: gender === option ? '#FFFFFF' : '#8A8680',
                  fontSize: '0.875rem',
                  border: gender === option ? 'none' : '1px solid #E8E6E1',
                }}
                onClick={() => {
                  setGender(option);
                  if (error) {
                    setError('');
                  }
                }}
                whileTap={{ scale: 0.97 }}
              >
                {option}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="block text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            연령대
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AGE_RANGES.map((range) => (
              <motion.button
                key={range}
                className="py-3 rounded-xl transition-colors"
                style={{
                  background: ageRange === range ? 'linear-gradient(135deg, #6B7B5E, #8FA380)' : '#FFFFFF',
                  color: ageRange === range ? '#FFFFFF' : '#8A8680',
                  fontSize: '0.875rem',
                  border: ageRange === range ? 'none' : '1px solid #E8E6E1',
                }}
                onClick={() => {
                  setAgeRange(range);
                  if (error) {
                    setError('');
                  }
                }}
                whileTap={{ scale: 0.97 }}
              >
                {range}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {!signupDraft && (
          <p className="text-[#C45050] mt-5" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
            회원가입 정보가 없어요. 처음 단계부터 다시 진행해 주세요.
          </p>
        )}

        {error && (
          <p className="text-[#C45050] mt-5" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
            {error}
          </p>
        )}
      </div>

      <div className="px-6 pb-10">
        <motion.button
          className="w-full py-4 rounded-2xl tracking-wide transition-all"
          style={{
            background: canContinue ? '#1A1A1A' : '#E8E6E1',
            color: canContinue ? '#FFFFFF' : '#B8B4AE',
            fontSize: '0.9375rem',
          }}
          onClick={() => void handleComplete()}
          disabled={!canContinue}
          whileTap={canContinue ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {loading ? '회원가입 중...' : '완료'}
        </motion.button>
      </div>
    </div>
  );
}

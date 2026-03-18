import { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store';
import { AGE_RANGES, PROFILE_GENDERS } from '../../constants/ui.constants';
import { User } from 'lucide-react';

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

export function ProfileSetupScreen({ onComplete }: ProfileSetupScreenProps) {
  const { profile, updateProfile } = useAppStore();
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');

  const handleComplete = () => {
    if (!ageRange || !gender) return;
    updateProfile({ ageRange, gender });
    onComplete();
  };

  const canContinue = ageRange && gender;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* Header */}
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
          당신에게 어울리는 향을 추천하기 위해{'\n'}몇 가지 정보가 필요해요.
        </motion.p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Nickname (읽기 전용) */}
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
            {profile.nickname || '닉네임 없음'}
          </div>
          <p className="text-[#B8B4AE] mt-1.5" style={{ fontSize: '0.6875rem' }}>
            회원가입 시 입력한 닉네임입니다
          </p>
        </motion.div>

        {/* Gender */}
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
            {PROFILE_GENDERS.map((g) => (
              <motion.button
                key={g}
                className="py-3 rounded-xl transition-colors"
                style={{
                  background: gender === g ? 'linear-gradient(135deg, #6B7B5E, #8FA380)' : '#FFFFFF',
                  color: gender === g ? '#FFFFFF' : '#8A8680',
                  fontSize: '0.875rem',
                  border: gender === g ? 'none' : '1px solid #E8E6E1',
                }}
                onClick={() => setGender(g)}
                whileTap={{ scale: 0.97 }}
              >
                {g}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Age Range */}
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
                onClick={() => setAgeRange(range)}
                whileTap={{ scale: 0.97 }}
              >
                {range}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10">
        <motion.button
          className="w-full py-4 rounded-2xl tracking-wide transition-all"
          style={{
            background: canContinue ? '#1A1A1A' : '#E8E6E1',
            color: canContinue ? '#FFFFFF' : '#B8B4AE',
            fontSize: '0.9375rem',
          }}
          onClick={handleComplete}
          disabled={!canContinue}
          whileTap={canContinue ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          완료
        </motion.button>
      </div>
    </div>
  );
}

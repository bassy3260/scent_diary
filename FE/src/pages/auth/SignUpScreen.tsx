import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Eye, EyeOff, Check } from 'lucide-react';
import { useAppStore } from '../../store';

interface SignUpScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export function SignUpScreen({ onBack, onComplete }: SignUpScreenProps) {
  const { updateProfile } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const isConfirmValid = password === confirmPassword && confirmPassword.length > 0;
  const isNicknameValid = nickname.trim().length >= 2;

  const canSubmit = isEmailValid && isPasswordValid && isConfirmValid && isNicknameValid && agreed;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // 닉네임을 store에 저장
    updateProfile({ nickname: nickname.trim() });
    setSubmitted(true);
    setTimeout(() => {
      onComplete();
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#FAFAF8' }}>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6B7B5E, #8FA380)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
          >
            <Check size={28} className="text-white" />
          </motion.div>
          <p className="text-[#1A1A1A]" style={{ fontSize: '1.125rem', fontFamily: "'Playfair Display', serif" }}>
            가입이 완료되었어요
          </p>
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.875rem' }}>
            향기록에 오신 걸 환영합니다
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* 헤더 */}
      <div className="pt-6 px-6 pb-4 flex items-center gap-3 shrink-0">
        <motion.button
          className="w-9 h-9 rounded-full bg-[#F5F3EF] flex items-center justify-center"
          onClick={onBack}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={18} className="text-[#8A8680]" />
        </motion.button>
        <div>
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>SIGN UP</p>
          <h2 className="text-[#1A1A1A]" style={{ fontSize: '1.375rem', fontFamily: "'Playfair Display', serif" }}>
            회원가입
          </h2>
        </div>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* 닉네임 */}
        <div className="mb-5">
          <label className="block text-[#B8B4AE] mb-2" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="2자 이상 입력하세요"
            className="w-full px-4 py-3.5 rounded-2xl bg-white border text-[#1A1A1A] placeholder:text-[#D4D0C8] outline-none transition-colors"
            style={{
              fontSize: '0.9375rem',
              borderColor: nickname.length > 0 ? (isNicknameValid ? '#6B7B5E' : '#E8E6E1') : '#E8E6E1',
            }}
            maxLength={12}
          />
          <p className="text-[#B8B4AE] mt-1.5 text-right" style={{ fontSize: '0.6875rem' }}>
            {nickname.length}/12
          </p>
        </div>

        {/* 이메일 */}
        <div className="mb-5">
          <label className="block text-[#B8B4AE] mb-2" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full px-4 py-3.5 rounded-2xl bg-white border text-[#1A1A1A] placeholder:text-[#D4D0C8] outline-none transition-colors"
            style={{
              fontSize: '0.9375rem',
              borderColor: email.length > 0 ? (isEmailValid ? '#6B7B5E' : '#E8E6E1') : '#E8E6E1',
            }}
          />
          {email.length > 0 && !isEmailValid && (
            <p className="text-[#C4956A] mt-1" style={{ fontSize: '0.6875rem' }}>올바른 이메일 형식이 아니에요</p>
          )}
        </div>

        {/* 비밀번호 */}
        <div className="mb-5">
          <label className="block text-[#B8B4AE] mb-2" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            비밀번호
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8자 이상 입력하세요"
              className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white border text-[#1A1A1A] placeholder:text-[#D4D0C8] outline-none transition-colors"
              style={{
                fontSize: '0.9375rem',
                borderColor: password.length > 0 ? (isPasswordValid ? '#6B7B5E' : '#E8E6E1') : '#E8E6E1',
              }}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8B4AE]"
              onClick={() => setShowPassword(v => !v)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password.length > 0 && !isPasswordValid && (
            <p className="text-[#C4956A] mt-1" style={{ fontSize: '0.6875rem' }}>8자 이상 입력해주세요</p>
          )}
        </div>

        {/* 비밀번호 확인 */}
        <div className="mb-6">
          <label className="block text-[#B8B4AE] mb-2" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
            비밀번호 확인
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white border text-[#1A1A1A] placeholder:text-[#D4D0C8] outline-none transition-colors"
              style={{
                fontSize: '0.9375rem',
                borderColor: confirmPassword.length > 0 ? (isConfirmValid ? '#6B7B5E' : '#E8E6E1') : '#E8E6E1',
              }}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8B4AE]"
              onClick={() => setShowConfirm(v => !v)}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword.length > 0 && !isConfirmValid && (
            <p className="text-[#C4956A] mt-1" style={{ fontSize: '0.6875rem' }}>비밀번호가 일치하지 않아요</p>
          )}
        </div>

        {/* 약관 동의 */}
        <motion.button
          className="w-full flex items-center gap-3 p-4 rounded-2xl mb-6"
          style={{ backgroundColor: agreed ? '#6B7B5E08' : '#F5F3EF', border: `1.5px solid ${agreed ? '#6B7B5E30' : 'transparent'}` }}
          onClick={() => setAgreed(v => !v)}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: agreed ? '#6B7B5E' : '#E8E6E1' }}
            animate={{ backgroundColor: agreed ? '#6B7B5E' : '#E8E6E1' }}
            transition={{ duration: 0.18 }}
          >
            {agreed && <Check size={11} className="text-white" />}
          </motion.div>
          <p className="text-left text-[#8A8680]" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
            <span className="text-[#1A1A1A]">이용약관</span> 및 <span className="text-[#1A1A1A]">개인정보처리방침</span>에 동의합니다
          </p>
        </motion.button>

        {/* 가입 버튼 */}
        <motion.button
          className="w-full py-4 rounded-2xl tracking-wide"
          style={{
            fontSize: '0.9375rem',
            background: canSubmit ? 'linear-gradient(135deg, #6B7B5E 0%, #8FA380 100%)' : '#E8E6E1',
            color: canSubmit ? '#FAFAF8' : '#B8B4AE',
            boxShadow: canSubmit ? '0 6px 24px rgba(107,123,94,0.25)' : 'none',
          }}
          onClick={handleSubmit}
          disabled={!canSubmit}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
          transition={{ duration: 0.15 }}
        >
          가입하기
        </motion.button>
      </div>
    </div>
  );
}

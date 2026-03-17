import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onBack: () => void;
  onComplete: () => void;
  onGoSignup: () => void;
}

export function LoginScreen({ onBack, onComplete, onGoSignup }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = isEmailValid && password.length >= 8;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onComplete();
    }, 900);
  };

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
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>LOG IN</p>
          <h2 className="text-[#1A1A1A]" style={{ fontSize: '1.375rem', fontFamily: "'Playfair Display', serif" }}>
            로그인
          </h2>
        </div>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
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
            autoComplete="email"
          />
          {email.length > 0 && !isEmailValid && (
            <p className="text-[#C4956A] mt-1" style={{ fontSize: '0.6875rem' }}>올바른 이메일 형식이 아니에요</p>
          )}
        </div>

        {/* 비밀번호 */}
        <div className="mb-8">
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
                borderColor: password.length > 0 ? (password.length >= 8 ? '#6B7B5E' : '#E8E6E1') : '#E8E6E1',
              }}
              autoComplete="current-password"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8B4AE]"
              onClick={() => setShowPassword(v => !v)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* 로그인 버튼 */}
        <motion.button
          className="w-full py-4 rounded-2xl tracking-wide"
          style={{
            fontSize: '0.9375rem',
            backgroundColor: canSubmit ? '#1A1A1A' : '#E8E6E1',
            color: canSubmit ? '#FAFAF8' : '#B8B4AE',
          }}
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
        >
          {loading ? '로그인 중...' : '로그인'}
        </motion.button>

        {/* 회원가입 링크 */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <span className="text-[#B8B4AE]" style={{ fontSize: '0.875rem' }}>아직 계정이 없으신가요?</span>
          <motion.button
            className="text-[#6B7B5E] underline underline-offset-2"
            style={{ fontSize: '0.875rem' }}
            onClick={onGoSignup}
            whileTap={{ scale: 0.96 }}
          >
            회원가입
          </motion.button>
        </div>
      </div>
    </div>
  );
}

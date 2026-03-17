import { motion } from 'motion/react';

interface AuthEntryScreenProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function AuthEntryScreen({ onLogin, onSignup }: AuthEntryScreenProps) {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* 상단 여백 + 브랜드 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* 로고 오브 */}
        <motion.div
          className="relative w-24 h-24 rounded-full mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(107,123,94,0.18) 0%, rgba(184,168,138,0.12) 100%)',
            boxShadow: '0 16px 60px rgba(107,123,94,0.10), inset 0 0 30px rgba(255,255,255,0.25)',
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-3 rounded-full"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 60%)' }}
          />
          {/* 작은 오브 */}
          <motion.div
            className="absolute w-4 h-4 rounded-full"
            style={{ background: '#A3B18A', opacity: 0.45, top: '10%', left: '-8%', filter: 'blur(1px)' }}
            animate={{ x: [0, 8, -4, 0], y: [0, -6, 3, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-3 h-3 rounded-full"
            style={{ background: '#B8A88A', opacity: 0.38, bottom: '8%', right: '-6%', filter: 'blur(1px)' }}
            animate={{ x: [0, -6, 3, 0], y: [0, 8, -4, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          />
        </motion.div>

        <motion.p
          className="text-[#B8B4AE] tracking-widest mb-2"
          style={{ fontSize: '0.6875rem', letterSpacing: '0.2em' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          향기록
        </motion.p>

        <motion.h1
          className="text-[#1A1A1A] text-center mb-3"
          style={{ fontSize: '1.875rem', lineHeight: 1.2, fontFamily: "'Playfair Display', serif" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
        >
          나만의 향을<br />기록하세요
        </motion.h1>

        <motion.p
          className="text-[#8A8680] text-center"
          style={{ fontSize: '0.875rem', lineHeight: 1.7 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          계속하려면 로그인 또는 회원가입을<br />해주세요.
        </motion.p>
      </div>

      {/* 하단 버튼 */}
      <motion.div
        className="px-6 pb-10 flex flex-col gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {/* 로그인 */}
        <motion.button
          className="w-full py-4 rounded-2xl bg-[#1A1A1A] text-white tracking-wide"
          style={{ fontSize: '0.9375rem' }}
          onClick={onLogin}
          whileTap={{ scale: 0.98 }}
        >
          로그인
        </motion.button>

        {/* 회원가입 */}
        <motion.button
          className="w-full py-4 rounded-2xl border border-[#E8E6E1] text-[#1A1A1A] tracking-wide"
          style={{ fontSize: '0.9375rem', backgroundColor: '#FAFAF8' }}
          onClick={onSignup}
          whileTap={{ scale: 0.98 }}
        >
          회원가입
        </motion.button>
      </motion.div>
    </div>
  );
}

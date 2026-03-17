import { motion } from 'motion/react';
import { User, Gift, ChevronLeft } from 'lucide-react';
import { useAppStore } from '../../store';

interface TextRecommendChoiceProps {
  onBack: () => void;
}

export function TextRecommendChoice({ onBack }: TextRecommendChoiceProps) {
  const { setIsGiftMode, navigateTo } = useAppStore();

  const handleForMe = () => {
    setIsGiftMode(false);
    navigateTo('recommend-prestep');
  };

  const handleForGift = () => {
    setIsGiftMode(true);
    navigateTo('recommend-prestep');
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* Header */}
      <div className="pt-6 px-6 pb-3">
        <motion.button
          onClick={onBack}
          className="text-[#8A8680] w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F3EF] mb-4"
          whileTap={{ scale: 0.85 }}
        >
          <ChevronLeft size={18} />
        </motion.button>

        <motion.p
          className="text-[#B8B4AE]"
          style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          TEXT RECOMMEND
        </motion.p>
        <motion.h2
          className="mt-2 text-[#1A1A1A]"
          style={{ fontSize: '1.625rem', lineHeight: 1.3, fontFamily: "'Playfair Display', serif" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
        >
          누구를 위한{'\n'}추천인가요?
        </motion.h2>
      </div>

      {/* Choices */}
      <div className="flex-1 px-6 pt-8 pb-28">
        <div className="space-y-4">
          {/* For Me */}
          <motion.button
            className="w-full p-6 rounded-3xl text-left relative overflow-hidden transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #6B7B5E, #8FA380)',
              boxShadow: '0 8px 32px rgba(107,123,94,0.25)',
            }}
            onClick={handleForMe}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -4 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(107,123,94,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(107,123,94,0.25)';
            }}
          >
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <div className="relative z-10">
              <motion.div
                className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <User size={24} className="text-white" />
              </motion.div>

              <h3 className="text-white mb-2" style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
                나를 위한 추천
              </h3>
              <p className="text-white/80" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                나에게 어울리는 향을 찾아요.
              </p>
            </div>
          </motion.button>

          {/* For Gift */}
          <motion.button
            className="w-full p-6 rounded-3xl text-left relative overflow-hidden transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #B8A5C8, #A89BB8)',
              boxShadow: '0 8px 32px rgba(184,165,200,0.25)',
            }}
            onClick={handleForGift}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -4 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(184,165,200,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(184,165,200,0.25)';
            }}
          >
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />

            <div className="relative z-10">
              <motion.div
                className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4"
                whileHover={{ rotate: -10, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <Gift size={24} className="text-white" />
              </motion.div>

              <h3 className="text-white mb-2" style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
                선물 추천
              </h3>
              <p className="text-white/80" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                소중한 사람에게 어울리는 향을 찾아요.
              </p>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

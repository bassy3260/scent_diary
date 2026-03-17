import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LaunchScreenProps {
  onComplete: () => void;
}

export function LaunchScreen({ onComplete }: LaunchScreenProps) {
  const [phase, setPhase] = useState(0);
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleTap = () => {
    if (phase < 2 || tapped) return; // wait until at least tagline is visible
    setTapped(true);
    setPhase(4);
    setTimeout(() => onComplete(), 500);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
      style={{ background: 'linear-gradient(180deg, #FAFAF8 0%, #F5F2ED 40%, #EBE7E0 100%)' }}
      onClick={handleTap}
    >

      {/* Ambient layers */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(163,177,138,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(184,168,138,0.1) 0%, transparent 70%)',
          filter: 'blur(50px)',
          top: '25%', right: '-8%',
        }}
        animate={{ x: [0, -25, 20, 0], y: [0, 25, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[250px] h-[250px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(184,165,200,0.08) 0%, transparent 70%)',
          filter: 'blur(45px)',
          bottom: '20%', left: '-5%',
        }}
        animate={{ x: [0, 20, -10, 0], y: [0, -20, 12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating particles - scent notes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            background: ['#A3B18A', '#B8A88A', '#8BA4B8', '#B8A5C8', '#C8A5A5', '#C4956A', '#D4C5A9', '#6B7B5E'][i],
            opacity: 0,
            left: `${15 + i * 10}%`,
            top: `${25 + (i % 4) * 15}%`,
          }}
          animate={{
            y: [0, -25 - i * 4, 8, 0],
            x: [0, 8 - i * 2, -4, 0],
            opacity: [0, 0.4, 0.2, 0],
            scale: [0.5, 1.2, 0.7, 0.5],
          }}
          transition={{ duration: 5 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Glass orb */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: phase >= 0 ? 1 : 0, opacity: phase >= 0 ? 1 : 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-12"
        >
          <div className="w-28 h-28 rounded-full relative"
            style={{
              background: 'linear-gradient(135deg, rgba(163,177,138,0.25) 0%, rgba(184,168,138,0.18) 40%, rgba(184,165,200,0.12) 80%)',
              boxShadow: '0 0 80px rgba(163,177,138,0.12), inset 0 0 40px rgba(255,255,255,0.35)',
            }}>
            <div className="absolute inset-3 rounded-full"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, transparent 55%)' }} />
            {/* Inner glow pulse */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle at 45% 40%, rgba(255,255,255,0.3) 0%, transparent 50%)' }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          {/* Orbital rings */}
          <motion.div
            className="absolute inset-[-16px] rounded-full border border-[#A3B18A]/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#A3B18A]/35" />
          </motion.div>
          <motion.div
            className="absolute inset-[-32px] rounded-full border border-[#B8A88A]/8"
            animate={{ rotate: -360 }}
            transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#B8A88A]/25" />
          </motion.div>
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <h1 className="tracking-[-0.03em] text-[#1A1A1A]" style={{ fontSize: '2.5rem', fontFamily: "'Playfair Display', serif" }}>
            향기록(錄)
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="mt-5 text-[#8A8680] tracking-[0.15em]"
          style={{ fontSize: '0.75rem' }}
          initial={{ opacity: 0, y: 12 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          감정을, 향으로.
        </motion.p>

        {/* Sub tagline */}
        <motion.p
          className="mt-2 text-[#B8B4AE] tracking-[0.08em]"
          style={{ fontSize: '0.6875rem' }}
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 0.7 } : {}}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          Emotion, distilled.
        </motion.p>
      </div>

      {/* Tap hint */}
      <motion.p
        className="absolute bottom-16 text-[#B8B4AE] tracking-[0.06em]"
        style={{ fontSize: '0.6875rem' }}
        initial={{ opacity: 0 }}
        animate={phase >= 3 && !tapped ? { opacity: [0, 0.6, 0] } : { opacity: 0 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        화면을 탭하여 시작
      </motion.p>

      {/* Fade out */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div
            className="absolute inset-0 z-20"
            style={{ background: '#FAFAF8' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

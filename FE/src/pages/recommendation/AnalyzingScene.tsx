import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ANALYZING_MESSAGES, PRICE_RANGES } from '../../constants/ui.constants';
import { useAppStore } from '../../store';

interface AnalyzingSceneProps {
  onComplete: () => void;
}

function priceRangeToInt(priceRange: string): number {
  const found = PRICE_RANGES.find(p => p.label === priceRange);
  if (!found || found.value === 'any' || found.value === null) return 1000000;
  const upper = found.value.split('~').filter(Boolean).pop();
  return upper ? parseInt(upper, 10) : 0;
}

export function AnalyzingScene({ onComplete }: AnalyzingSceneProps) {
  const [messageIdx, setMessageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const { recommendByText, recommendByImage } = useAppStore();
  const called = useRef(false);

  useEffect(() => {
    useAppStore.setState({ textResult: null, imageResult: null });
  }, []);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIdx(prev => (prev + 1) % ANALYZING_MESSAGES.length);
    }, 1400);
    const progInterval = setInterval(() => {
      setProgress(prev => prev >= 100 ? 100 : prev + 1.2);
    }, 55);

    if (!called.current) {
      called.current = true;
      const { profile } = useAppStore.getState();
      const price = priceRangeToInt(profile.priceRange);
      const note = profile.notePreference || 'TOP';
      const minDelay = new Promise<void>(resolve => setTimeout(resolve, 4000));

      let apiCall: Promise<void>;
      const markFreshAndComplete = () => {
        useAppStore.setState({ resultsMode: 'fresh' });
        onComplete();
      };

      if (profile.imageRoute) {
        apiCall = recommendByImage({ image_route: profile.imageRoute, price, note });
        Promise.all([apiCall, minDelay]).then(markFreshAndComplete).catch(markFreshAndComplete);
      } else {
        const parts = [profile.emotionText, ...(profile.moodKeywords || [])].filter(s => s && s.trim() !== '');
        const keyword = parts.join(', ');
        apiCall = recommendByText({ keyword, price, note });
        Promise.all([apiCall, minDelay]).then(markFreshAndComplete).catch(markFreshAndComplete);
      }
    }

    return () => { clearInterval(msgInterval); clearInterval(progInterval); };
  }, [onComplete, recommendByText]);

  const emergingNotes = ['Cedar', 'Moss', 'Amber', 'Musk', 'Bergamot', 'Vetiver'];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FAFAF8 0%, #F0EDE8 100%)' }}>

      {/* Pulse rings */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: 180 + i * 70,
            height: 180 + i * 70,
            borderColor: `rgba(107,123,94,${0.06 - i * 0.012})`,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}

      {/* Central orb */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-36 h-36 rounded-full relative"
          style={{
            background: 'linear-gradient(135deg, rgba(163,177,138,0.3) 0%, rgba(184,168,138,0.22) 40%, rgba(184,165,200,0.18) 70%, rgba(196,149,106,0.12) 100%)',
            boxShadow: '0 24px 80px rgba(107,123,94,0.12), 0 0 120px rgba(163,177,138,0.08)',
          }}>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.5) 0%, transparent 55%)' }}
            animate={{ opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Orbiting particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: ['#A3B18A', '#B8A88A', '#8BA4B8', '#C4956A', '#B8A5C8', '#C8A5A5'][i],
                top: '50%', left: '50%',
              }}
              animate={{
                x: [Math.cos(i * 1.05) * 35, Math.cos(i * 1.05 + Math.PI) * 35],
                y: [Math.sin(i * 1.05) * 35, Math.sin(i * 1.05 + Math.PI) * 35],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{ duration: 2.5 + i * 0.25, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
            />
          ))}
        </div>

        {/* Orbital ring 1 */}
        <motion.div
          className="absolute inset-[-22px] rounded-full border border-[#A3B18A]/12"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#A3B18A]/40" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#B8A88A]/30" />
        </motion.div>

        {/* Orbital ring 2 */}
        <motion.div
          className="absolute inset-[-44px] rounded-full border border-[#B8A88A]/8"
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-1/2 right-0 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#8BA4B8]/35" />
        </motion.div>
      </motion.div>

      {/* Emerging notes */}
      <div className="relative z-10 mt-14 h-8">
        <div className="flex gap-4 justify-center">
          {emergingNotes.map((note, i) => (
            <motion.span
              key={note}
              className="text-[#8A8680]"
              style={{ fontSize: '0.75rem' }}
              animate={{
                opacity: [0, 0.5, 0],
                y: [12, 0, -6],
              }}
              transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
            >
              {note}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Status message */}
      <motion.div
        className="relative z-10 mt-8"
        key={messageIdx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <p className="text-[#1A1A1A] text-center" style={{ fontSize: '1rem' }}>
          {ANALYZING_MESSAGES[messageIdx]}
        </p>
      </motion.div>

      {/* Progress */}
      <div className="relative z-10 mt-6 w-48">
        <div className="h-[2px] bg-[#E8E6E1] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #6B7B5E, #A3B18A)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.08 }}
          />
        </div>
      </div>
    </div>
  );
}

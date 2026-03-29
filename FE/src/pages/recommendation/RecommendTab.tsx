import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, Camera } from 'lucide-react';
import { useAppStore } from '../../store';
import { myApi, type PopularPerfume } from '../../api/my.api';

const SLIDE_INTERVAL = 5000;

export function RecommendTab() {
  const { navigateTo } = useAppStore();

  const [popular, setPopular] = useState<PopularPerfume[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    myApi.getPopularLikes().then((res) => setPopular(res ?? [])).catch(() => {});
  }, []);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIdx((prev) => (prev + 1) % popular.length);
    }, SLIDE_INTERVAL);
  };

  useEffect(() => {
    if (popular.length < 2) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [popular]);

  const goTo = (next: number) => {
    const len = popular.length;
    setDirection(next > currentIdx || (currentIdx === len - 1 && next === 0) ? 1 : -1);
    setCurrentIdx(next);
    resetTimer();
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -40) goTo((currentIdx + 1) % popular.length);
    else if (info.offset.x > 40) goTo((currentIdx - 1 + popular.length) % popular.length);
  };

  const current = popular[currentIdx];

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-3">
        <motion.p
          className="text-[#B8B4AE]"
          style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          RECOMMEND
        </motion.p>
        <motion.h2
          className="mt-2 text-[#1A1A1A]"
          style={{ fontSize: '1.625rem', lineHeight: 1.3, fontFamily: "'Playfair Display', serif" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
        >
          오늘은 어떤 향을<br />찾고 계신가요?
        </motion.h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {/* Two input modes */}
        <motion.div
          className="grid grid-cols-2 gap-3 mt-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
        >
          <motion.button
            className="p-5 rounded-2xl flex flex-col items-start gap-3 text-left relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #7D9470, #A0B494)', boxShadow: '0 4px 20px rgba(107,123,94,0.25)' }}
            onClick={() => navigateTo('recommend-prestep')}
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <motion.div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} whileHover={{ rotate: 15 }}>
              <Sparkles size={18} className="text-white" />
            </motion.div>
            <div>
              <p className="text-white" style={{ fontSize: '0.9375rem' }}>텍스트로</p>
              <p className="text-white" style={{ fontSize: '0.9375rem' }}>추천받기</p>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)' }}>감정 표현으로</p>
          </motion.button>

          <motion.button
            className="p-5 rounded-2xl flex flex-col items-start gap-3 text-left relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #9B7FB5, #BBA5D0)', boxShadow: '0 4px 20px rgba(155,127,181,0.25)' }}
            onClick={() => navigateTo('photo-recommend')}
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <motion.div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} whileHover={{ rotate: -15 }}>
              <Camera size={18} className="text-white" />
            </motion.div>
            <div>
              <p className="text-white" style={{ fontSize: '0.9375rem' }}>이미지로</p>
              <p className="text-white" style={{ fontSize: '0.9375rem' }}>추천받기</p>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)' }}>사진 업로드로</p>
          </motion.button>
        </motion.div>

        {/* Guide text */}
        <motion.div
          className="mt-4 p-4 rounded-2xl"
          style={{ background: 'linear-gradient(145deg, #F8F7F4, #F2F0EC)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <p className="text-[#8A8680]" style={{ fontSize: '0.75rem', lineHeight: 1.7 }}>
            💡 추천받은 향수는 <span className="text-[#6B7B5E]">마이 탭 → 추천 히스토리</span>에서 다시 확인할 수 있어요.
          </p>
        </motion.div>

        {/* 지금 인기있는 향수 carousel */}
        {popular.length > 0 && (
          <motion.div className="mt-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <p className="text-[#8A8680] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
              지금 인기있는 향수
            </p>
            <div className="relative overflow-hidden rounded-2xl">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                {current && (
                  <motion.div
                    key={currentIdx}
                    custom={direction}
                    variants={{
                      enter: (d: number) => ({ x: d * 80, opacity: 0 }),
                      center: { x: 0, opacity: 1 },
                      exit: (d: number) => ({ x: d * -80, opacity: 0 }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-4 p-4 cursor-grab active:cursor-grabbing"
                    style={{ background: 'linear-gradient(145deg, #F5F3EF, #FAFAF8)', borderRadius: '1rem' }}
                    onClick={() => {
                      useAppStore.getState().setSelectedPerfumeId(current.perfumeId);
                      useAppStore.getState().pushTo('detail');
                    }}
                  >
                    <img
                      src={current.image}
                      alt={current.name}
                      className="w-20 h-20 object-cover rounded-xl shrink-0"
                      draggable={false}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#B8B4AE] truncate" style={{ fontSize: '0.6875rem' }}>{current.brand}</p>
                      <p className="text-[#1A1A1A] font-medium mt-0.5 leading-snug" style={{ fontSize: '0.9375rem' }}>
                        {current.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {current.accords.slice(0, 3).map((a) => (
                          <span key={a} className="px-2 py-0.5 rounded-full text-[#8A8680]" style={{ fontSize: '0.6875rem', backgroundColor: '#ECEAE5' }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 페이지 도트 */}
            <div className="flex justify-center gap-1.5 mt-3">
              {popular.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentIdx ? '16px' : '6px',
                    height: '6px',
                    backgroundColor: i === currentIdx ? '#8A8680' : '#D4D0CB',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
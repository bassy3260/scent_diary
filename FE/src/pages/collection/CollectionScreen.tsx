import { motion, AnimatePresence } from 'motion/react';
import { Heart, Droplets, ChevronLeft } from 'lucide-react';
import { mockPerfumes } from '../../constants/perfumes';
import { useAppStore } from '../../store';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { useState, useMemo } from 'react';

const ALL_FILTER = '전체';

export function CollectionScreen() {
  const { savedPerfumes, navigateTo, setSelectedPerfumeId, toggleSavedPerfume } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER);

  const saved = mockPerfumes.filter(p => savedPerfumes.includes(p.id));

  // 어코드 필터 목록 (대표 어코드 기준, 개수순)
  const accordFilters = useMemo(() => {
    const map = new Map<string, { color: string; count: number }>();
    saved.forEach(p => {
      const primary = p.accords[0];
      if (!primary) return;
      const ex = map.get(primary.name);
      if (ex) ex.count++;
      else map.set(primary.name, { color: primary.color, count: 1 });
    });
    return Array.from(map.entries())
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.count - a.count);
  }, [saved]);

  const activeAccordColor = useMemo(
    () => accordFilters.find(f => f.name === activeFilter)?.color ?? null,
    [activeFilter, accordFilters]
  );

  const filteredPerfumes = useMemo(() => {
    if (activeFilter === ALL_FILTER) return saved;
    return saved.filter(p => p.accords[0]?.name === activeFilter);
  }, [saved, activeFilter]);

  const handleViewDetail = (id: string) => {
    setSelectedPerfumeId(id);
    useAppStore.getState().pushTo('detail');
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* 헤더 */}
      <div className="pt-6 px-5 pb-3 flex items-center gap-3 shrink-0">
        <motion.button onClick={() => navigateTo('mypage')} whileTap={{ scale: 0.9 }}>
          <ChevronLeft size={22} className="text-[#8A8680]" />
        </motion.button>
        <div className="flex-1">
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.625rem', letterSpacing: '0.12em' }}>
            WISHLIST
          </p>
          <h2 className="text-[#1A1A1A]" style={{ fontSize: '1.1875rem', fontFamily: "'Playfair Display', serif" }}>
            나의 찜 목록
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {saved.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 px-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full bg-[#F5F3EF] flex items-center justify-center mb-4"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <Droplets size={22} className="text-[#C8A5A5]" />
            </motion.div>
            <p className="text-[#8A8680] text-center mb-5" style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
              아직 찜한 향수가 없어요.<br/>마음에 드는 향수를 찜해보세요.
            </p>
            <motion.button
              className="px-5 py-2.5 rounded-2xl bg-[#1A1A1A] text-white"
              style={{ fontSize: '0.8125rem', fontWeight: 600 }}
              onClick={() => navigateTo('home')}
              whileTap={{ scale: 0.95 }}
            >
              추천 받으러 가기
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* ── 요약 카드 ─────────────────────────────────────────── */}
            <motion.div
              className="mx-5 mb-3 px-4 py-3 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #F5F3EF, #EDE9E0)' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#B8B4AE]" style={{ fontSize: '0.625rem', letterSpacing: '0.08em' }}>
                    총 찜한 향수
                  </p>
                  <p className="text-[#1A1A1A] mt-0.5" style={{ fontSize: '1.625rem', fontFamily: "'Playfair Display', serif" }}>
                    {saved.length}
                    <span className="text-[#8A8680] ml-1" style={{ fontSize: '0.75rem' }}>개</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(200,165,165,0.18)' }}
                  >
                    <Heart size={16} className="text-[#C8A5A5]" fill="#C8A5A5" />
                  </div>
                  <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>
                    {accordFilters.length}개 계열
                  </p>
                </div>
              </div>
              {/* 어코드 분포 바 */}
              {accordFilters.length > 0 && (
                <div className="mt-2.5 flex gap-0.5 h-1 rounded-full overflow-hidden">
                  {accordFilters.map(g => (
                    <div key={g.name} style={{ flex: g.count, backgroundColor: g.color, opacity: 0.68 }} />
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── 어코드 태그 필터 ──────────────────────────────────── */}
            <div className="px-5 pb-2.5 flex flex-wrap gap-1.5">
              {/* 전체 태그 */}
              <motion.button
                onClick={() => setActiveFilter(ALL_FILTER)}
                className="flex items-center gap-1 rounded-full transition-colors"
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: activeFilter === ALL_FILTER ? 600 : 400,
                  padding: '3px 10px',
                  background: activeFilter === ALL_FILTER ? '#1A1A1A' : 'transparent',
                  color: activeFilter === ALL_FILTER ? '#FFFFFF' : '#8A8680',
                  border: `1px solid ${activeFilter === ALL_FILTER ? '#1A1A1A' : '#D8D5CF'}`,
                }}
                whileTap={{ scale: 0.93 }}
              >
                전체
                <span style={{
                  fontSize: '0.5625rem',
                  color: activeFilter === ALL_FILTER ? 'rgba(255,255,255,0.65)' : '#B8B4AE',
                  marginLeft: 1,
                }}>
                  {saved.length}
                </span>
              </motion.button>

              {/* 어코드 태그 */}
              {accordFilters.map(accord => {
                const isActive = activeFilter === accord.name;
                return (
                  <motion.button
                    key={accord.name}
                    onClick={() => setActiveFilter(accord.name)}
                    className="flex items-center gap-1 rounded-full transition-colors"
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: isActive ? 600 : 400,
                      padding: '3px 10px',
                      background: isActive ? accord.color : 'transparent',
                      color: isActive ? '#FFFFFF' : '#6B6862',
                      border: `1px solid ${isActive ? accord.color : '#D8D5CF'}`,
                    }}
                    whileTap={{ scale: 0.93 }}
                  >
                    {!isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 inline-block"
                        style={{ backgroundColor: accord.color, opacity: 0.85 }}
                      />
                    )}
                    {accord.name}
                    <span style={{
                      fontSize: '0.5625rem',
                      color: isActive ? 'rgba(255,255,255,0.65)' : '#B8B4AE',
                      marginLeft: 1,
                    }}>
                      {accord.count}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* ── 결과 수 레이블 ────────────────────────────────────── */}
            <div className="px-5 pb-1.5 flex items-center gap-1.5">
              {activeFilter !== ALL_FILTER && activeAccordColor && (
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeAccordColor }} />
              )}
              <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
                {activeFilter === ALL_FILTER
                  ? `전체 ${filteredPerfumes.length}개`
                  : `${activeFilter} · ${filteredPerfumes.length}개`}
              </p>
            </div>

            {/* ── 향수 리스트 ───────────────────────────────────────── */}
            <div className="px-5 space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredPerfumes.map((perfume, i) => (
                  <motion.div
                    key={perfume.id}
                    layout
                    className="flex items-center gap-3 rounded-xl"
                    style={{
                      background: '#FFFFFF',
                      boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                      padding: '8px 10px',
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => handleViewDetail(perfume.id)}
                  >
                    {/* 썸네일 */}
                    <div className="w-[48px] h-[48px] rounded-xl overflow-hidden shrink-0">
                      <ImageWithFallback
                        src={perfume.image}
                        alt={perfume.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 텍스트 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem', letterSpacing: '0.01em' }}>
                        {perfume.brand}
                      </p>
                      <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 1 }}>
                        {perfume.name}
                      </p>
                      {/* 하단 태그 행 */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="px-1.5 rounded text-white"
                          style={{
                            fontSize: '0.5rem',
                            fontWeight: 600,
                            paddingTop: 2,
                            paddingBottom: 2,
                            backgroundColor: perfume.familyColor,
                          }}
                        >
                          {perfume.family}
                        </span>
                        <span className="text-[#C8C4BE]" style={{ fontSize: '0.5625rem' }}>
                          {perfume.price}
                        </span>
                      </div>
                    </div>

                    {/* 찜 버튼 */}
                    <motion.button
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(200,165,165,0.12)' }}
                      onClick={e => {
                        e.stopPropagation();
                        toggleSavedPerfume(perfume.id);
                      }}
                      whileTap={{ scale: 0.8 }}
                    >
                      <Heart size={14} fill="#C8A5A5" stroke="#C8A5A5" />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* 필터 결과 없음 */}
              {filteredPerfumes.length === 0 && (
                <motion.div
                  className="flex flex-col items-center py-10 text-[#B8B4AE]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Droplets size={24} className="mb-2 opacity-35" />
                  <p style={{ fontSize: '0.8125rem' }}>해당 계열의 향수가 없어요</p>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

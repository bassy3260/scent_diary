import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, Package, X, Search, Layers } from 'lucide-react';
import { useAppStore } from '../../store';
import { mockPerfumes } from '../../constants/perfumes';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { useState, useMemo } from 'react';

const ALL_FILTER = '전체';

export function MyCollectionScreen() {
  const { myCollection, navigateTo, setSelectedPerfumeId, toggleMyCollection } = useAppStore();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER);

  const collectedPerfumes = mockPerfumes.filter(p => myCollection.includes(p.id));

  // 어코드 필터 목록 (대표 어코드 기준, 개수순)
  const accordFilters = useMemo(() => {
    const map = new Map<string, { color: string; count: number }>();
    collectedPerfumes.forEach(p => {
      const primary = p.accords[0];
      if (!primary) return;
      const ex = map.get(primary.name);
      if (ex) ex.count++;
      else map.set(primary.name, { color: primary.color, count: 1 });
    });
    return Array.from(map.entries())
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.count - a.count);
  }, [collectedPerfumes]);

  const activeAccordColor = useMemo(
    () => accordFilters.find(f => f.name === activeFilter)?.color ?? null,
    [activeFilter, accordFilters]
  );

  const filteredPerfumes = useMemo(() => {
    if (activeFilter === ALL_FILTER) return collectedPerfumes;
    return collectedPerfumes.filter(p => p.accords[0]?.name === activeFilter);
  }, [collectedPerfumes, activeFilter]);

  const availablePerfumes = mockPerfumes
    .filter(p => !myCollection.includes(p.id))
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.family.toLowerCase().includes(q);
    });

  const handleViewDetail = (id: string) => {
    setSelectedPerfumeId(id);
    useAppStore.getState().pushTo('detail');
  };

  const isEmpty = collectedPerfumes.length === 0;

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: '#FAFAF8' }}>

      {/* ── 헤더 ─────────────────────────────────────────────────────── */}
      <div className="pt-6 px-5 pb-3 flex items-center gap-3 shrink-0">
        <motion.button onClick={() => navigateTo('mypage')} whileTap={{ scale: 0.9 }}>
          <ChevronLeft size={22} className="text-[#8A8680]" />
        </motion.button>
        <div className="flex-1">
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.625rem', letterSpacing: '0.12em' }}>
            MY COLLECTION
          </p>
          <h2 className="text-[#1A1A1A]" style={{ fontSize: '1.1875rem', fontFamily: "'Playfair Display', serif" }}>
            나의 컬렉션
          </h2>
        </div>
      </div>

      {/* ── 본문 ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* ── 빈 상태 ──────────────────────────────────────────────── */}
        {isEmpty ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 px-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full bg-[#F5F3EF] flex items-center justify-center mb-4"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            >
              <Package size={22} className="text-[#9BA88B]" />
            </motion.div>
            <p className="text-[#8A8680] text-center mb-5" style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
              보유한 향수를 추가해보세요.<br />나만의 향수 컬렉션을 만들어보세요.
            </p>
            <motion.button
              className="px-5 py-2.5 rounded-2xl bg-[#1A1A1A] text-white flex items-center gap-1.5"
              style={{ fontSize: '0.8125rem', fontWeight: 600 }}
              onClick={() => setShowAddSheet(true)}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={14} />
              향수 추가하기
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
                    총 보유 향수
                  </p>
                  <p className="text-[#1A1A1A] mt-0.5" style={{ fontSize: '1.625rem', fontFamily: "'Playfair Display', serif" }}>
                    {collectedPerfumes.length}
                    <span className="text-[#8A8680] ml-1" style={{ fontSize: '0.75rem' }}>병</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(155,168,139,0.18)' }}
                  >
                    <Layers size={16} className="text-[#9BA88B]" />
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
                  {collectedPerfumes.length}
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

                    {/* 삭제 버튼 */}
                    <motion.button
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: '#F0EEE9' }}
                      onClick={e => {
                        e.stopPropagation();
                        toggleMyCollection(perfume.id);
                      }}
                      whileTap={{ scale: 0.8 }}
                    >
                      <X size={11} className="text-[#A8A49E]" />
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
                  <Package size={24} className="mb-2 opacity-35" />
                  <p style={{ fontSize: '0.8125rem' }}>해당 계열의 향수가 없어요</p>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── FAB: 향수 추가하기 ────────────────────────────────────────── */}
      {!isEmpty && (
        <motion.button
          className="absolute bottom-5 right-4 flex items-center gap-1.5 rounded-full text-white"
          style={{
            background: 'linear-gradient(135deg, #4A5240, #2E3328)',
            boxShadow: '0 4px 18px rgba(74,82,64,0.34)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            padding: '10px 18px',
          }}
          onClick={() => setShowAddSheet(true)}
          whileTap={{ scale: 0.93 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Plus size={15} />
          향수 추가하기
        </motion.button>
      )}

      {/* ── 향수 추가 바텀 시트 ───────────────────────────────────────── */}
      <AnimatePresence>
        {showAddSheet && (
          <>
            <motion.div
              className="absolute inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowAddSheet(false); setSearchQuery(''); }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl z-50 flex flex-col"
              style={{
                background: '#FAFAF8',
                maxHeight: '78vh',
                boxShadow: '0 -4px 28px rgba(0,0,0,0.10)',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* 핸들 바 */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-9 h-1 rounded-full bg-[#E5E2DC]" />
              </div>

              {/* 헤더 */}
              <div className="pt-2 px-5 pb-3 flex items-center justify-between border-b border-[#F0EEE9] shrink-0">
                <div>
                  <h3 className="text-[#1A1A1A]" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>
                    향수 추가하기
                  </h3>
                  <p className="text-[#B8B4AE] mt-0.5" style={{ fontSize: '0.6875rem' }}>
                    {availablePerfumes.length}개 중 선택
                  </p>
                </div>
                <motion.button
                  className="w-8 h-8 rounded-full bg-[#F5F3EF] flex items-center justify-center"
                  onClick={() => { setShowAddSheet(false); setSearchQuery(''); }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} className="text-[#8A8680]" />
                </motion.button>
              </div>

              {/* 검색 */}
              <div className="px-5 py-2.5 shrink-0">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8B4AE]" />
                  <input
                    type="text"
                    placeholder="향수 이름, 브랜드 검색..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F3EF] text-[#1A1A1A] placeholder:text-[#B8B4AE]"
                    style={{ fontSize: '0.8125rem', outline: 'none' }}
                  />
                </div>
              </div>

              {/* 목록 */}
              <div className="flex-1 overflow-y-auto px-5 pb-6">
                {availablePerfumes.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-[#B8B4AE]">
                    <Package size={24} className="mb-2 opacity-35" />
                    <p style={{ fontSize: '0.8125rem' }}>추가 가능한 향수가 없어요</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availablePerfumes.map((p, i) => (
                      <motion.div
                        key={p.id}
                        className="flex items-center gap-3 rounded-xl"
                        style={{
                          background: '#FFFFFF',
                          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                          padding: '8px 10px',
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                          <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>{p.brand}</p>
                          <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 1 }}>
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className="rounded text-white"
                              style={{ fontSize: '0.5rem', fontWeight: 600, padding: '2px 6px', backgroundColor: p.familyColor }}
                            >
                              {p.family}
                            </span>
                            <span className="text-[#C8C4BE]" style={{ fontSize: '0.5625rem' }}>{p.price}</span>
                          </div>
                        </div>
                        <motion.button
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'linear-gradient(135deg, #9BA88B, #8A9A7A)' }}
                          onClick={() => toggleMyCollection(p.id)}
                          whileTap={{ scale: 0.82 }}
                        >
                          <Plus size={14} className="text-white" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

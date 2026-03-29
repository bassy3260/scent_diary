import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, Package, Layers, X, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '../../store';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { buildAccordStats, getAccordColor } from '../../utils/mypage';
import type { MyPerfumeItem } from '../../types/mypage.types';

const ALL_FILTER = '전체';

export function MyCollectionScreen() {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const setSelectedPerfumeId = useAppStore((state) => state.setSelectedPerfumeId);
  const myPerfumes = useAppStore((state) => state.myPerfumes);
  const myPerfumesPageInfo = useAppStore((state) => state.myPerfumesPageInfo);
  const fetchMyPerfumes = useAppStore((state) => state.fetchMyPerfumes);
  const removeMyPerfume = useAppStore((state) => state.removeMyPerfume);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER);
  const [currentPage, setCurrentPage] = useState(0);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const PAGE_SIZE = 5;

  useEffect(() => {
    void fetchMyPerfumes();
  }, [fetchMyPerfumes]);

  const accordFilters = useMemo(() => buildAccordStats(myPerfumes), [myPerfumes]);
  const activeAccordColor = accordFilters.find((filter) => filter.name === activeFilter)?.color ?? null;
  const filteredPerfumes = useMemo(
    () => (activeFilter === ALL_FILTER
      ? myPerfumes
      : myPerfumes.filter((perfume) => perfume.accords.includes(activeFilter))),
    [activeFilter, myPerfumes],
  );
  const totalCount = myPerfumesPageInfo?.totalElements ?? myPerfumes.length;

  const totalPages = Math.ceil(filteredPerfumes.length / PAGE_SIZE);
  const pagedPerfumes = filteredPerfumes.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(0);
  };

  const handleViewDetail = (perfume: MyPerfumeItem) => {
    setSelectedPerfumeId(perfume.perfumeId);
    useAppStore.getState().pushTo('detail');
  };

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-5 pb-3 flex items-center gap-3 shrink-0">
        <motion.button onClick={() => navigateTo('mypage')} whileTap={{ scale: 0.9 }}>
          <ChevronLeft size={22} className="text-[#8A8680]" />
        </motion.button>
        <div className="flex-1">
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.625rem', letterSpacing: '0.12em' }}>
            MY COLLECTION
          </p>
          <h2
            className="text-[#1A1A1A]"
            style={{ fontSize: '1.1875rem', fontFamily: "'Playfair Display', serif" }}
          >
            나의 컬렉션
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {error && (
          <div
            className="mx-5 mb-4 px-4 py-3 rounded-2xl text-[#C45050]"
            style={{ backgroundColor: 'rgba(196, 80, 80, 0.08)', fontSize: '0.8125rem' }}
          >
            {error}
          </div>
        )}

        {loading && myPerfumes.length === 0 ? (
          <motion.div className="flex flex-col items-center justify-center py-20 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[#8A8680]" style={{ fontSize: '0.875rem' }}>
              내 향수 목록을 불러오는 중이에요.
            </p>
          </motion.div>
        ) : myPerfumes.length === 0 ? (
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
              등록된 내 향수가 아직 없어요.
              <br />
              향수를 둘러보고 컬렉션을 채워보세요.
            </p>
            <motion.button
              className="px-5 py-2.5 rounded-2xl bg-[#1A1A1A] text-white"
              style={{ fontSize: '0.8125rem', fontWeight: 600 }}
              onClick={() => navigateTo('search')}
              whileTap={{ scale: 0.95 }}
            >
              향수 둘러보기
            </motion.button>
          </motion.div>
        ) : (
          <>
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
                  <p
                    className="text-[#1A1A1A] mt-0.5"
                    style={{ fontSize: '1.625rem', fontFamily: "'Playfair Display', serif" }}
                  >
                    {totalCount}
                    <span className="text-[#8A8680] ml-1" style={{ fontSize: '0.75rem' }}>
                      병
                    </span>
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
              {accordFilters.length > 0 && (
                <div className="mt-2.5 flex gap-0.5 h-1 rounded-full overflow-hidden">
                  {accordFilters.map((filter) => (
                    <div key={filter.name} style={{ flex: filter.count, backgroundColor: filter.color, opacity: 0.68 }} />
                  ))}
                </div>
              )}
            </motion.div>

            <div className="px-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {activeFilter !== ALL_FILTER && activeAccordColor && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeAccordColor }} />
                )}
                <p className="text-[#8A8680]" style={{ fontSize: '0.75rem' }}>
                  {activeFilter === ALL_FILTER
                    ? `전체 ${filteredPerfumes.length}개`
                    : `${activeFilter} 계열 · ${filteredPerfumes.length}개`}
                </p>
                {activeFilter !== ALL_FILTER && (
                  <motion.button
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#E8E6E1' }}
                    onClick={() => handleFilterChange(ALL_FILTER)}
                    whileTap={{ scale: 0.85 }}
                  >
                    <X size={9} className="text-[#8A8680]" />
                  </motion.button>
                )}
              </div>
              <motion.button
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  background: activeFilter !== ALL_FILTER ? '#1A1A1A' : '#F0EEE9',
                  color: activeFilter !== ALL_FILTER ? '#FFFFFF' : '#6B6862',
                  fontSize: '0.6875rem',
                }}
                onClick={() => setFilterSheetOpen(true)}
                whileTap={{ scale: 0.93 }}
              >
                <SlidersHorizontal size={12} />
                계열 필터
              </motion.button>
            </div>

            <div className="px-5 space-y-2">
              <AnimatePresence mode="popLayout">
                {pagedPerfumes.map((perfume, index) => {
                  return (
                    <motion.div
                      key={perfume.memberPerfumeId}
                      layout
                      className="flex items-center gap-3 rounded-xl"
                      style={{
                        background: '#FFFFFF',
                        boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                        padding: '8px 10px',
                        cursor: 'pointer',
                      }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      onClick={() => handleViewDetail(perfume)}
                    >
                      <div className="w-[48px] h-[48px] rounded-xl overflow-hidden shrink-0">
                        <ImageWithFallback
                          src={perfume.image}
                          alt={perfume.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem', letterSpacing: '0.01em' }}>
                          {perfume.brand}
                        </p>
                        <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 1 }}>
                          {perfume.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {perfume.accords.slice(0, 2).map((accord) => (
                            <span
                              key={`${perfume.memberPerfumeId}-${accord}`}
                              className="px-1.5 rounded text-white"
                              style={{
                                fontSize: '0.5rem',
                                fontWeight: 600,
                                paddingTop: 2,
                                paddingBottom: 2,
                                backgroundColor: getAccordColor(accord),
                              }}
                            >
                              {accord}
                            </span>
                          ))}
                        </div>
                      </div>

                      <motion.button
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: '#F0EEE9' }}
                        onClick={(event) => {
                          event.stopPropagation();
                          void removeMyPerfume(perfume.memberPerfumeId);
                        }}
                        whileTap={{ scale: 0.8 }}
                      >
                        <X size={11} className="text-[#A8A49E]" />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <motion.div
                className="flex items-center justify-center gap-3 py-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: currentPage === 0 ? '#F0EEE9' : '#1A1A1A',
                    color: currentPage === 0 ? '#B8B4AE' : '#FFFFFF',
                  }}
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  whileTap={currentPage > 0 ? { scale: 0.88 } : {}}
                >
                  <ChevronLeft size={15} />
                </motion.button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className="rounded-full"
                      style={{
                        width: i === currentPage ? 18 : 6,
                        height: 6,
                        backgroundColor: i === currentPage
                          ? (activeAccordColor ?? '#1A1A1A')
                          : '#D8D5CF',
                      }}
                      animate={{ width: i === currentPage ? 18 : 6 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  ))}
                </div>

                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: currentPage === totalPages - 1 ? '#F0EEE9' : '#1A1A1A',
                    color: currentPage === totalPages - 1 ? '#B8B4AE' : '#FFFFFF',
                  }}
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  whileTap={currentPage < totalPages - 1 ? { scale: 0.88 } : {}}
                >
                  <ChevronLeft size={15} className="rotate-180" />
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* 어코드 필터 바텀시트 */}
      <AnimatePresence>
        {filterSheetOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(0,0,0,0.35)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilterSheetOpen(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl px-5 pt-5"
              style={{ background: '#FAFAF8', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
                  계열 필터
                </p>
                <motion.button
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: '#F0EEE9' }}
                  onClick={() => setFilterSheetOpen(false)}
                  whileTap={{ scale: 0.85 }}
                >
                  <X size={13} className="text-[#8A8680]" />
                </motion.button>
              </div>

              <div className="flex flex-wrap gap-2">
                <motion.button
                  onClick={() => { handleFilterChange(ALL_FILTER); setFilterSheetOpen(false); }}
                  className="flex items-center gap-1 rounded-full"
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: activeFilter === ALL_FILTER ? 600 : 400,
                    padding: '6px 14px',
                    background: activeFilter === ALL_FILTER ? '#1A1A1A' : '#F0EEE9',
                    color: activeFilter === ALL_FILTER ? '#FFFFFF' : '#6B6862',
                  }}
                  whileTap={{ scale: 0.93 }}
                >
                  전체
                  <span style={{ fontSize: '0.6875rem', opacity: 0.6, marginLeft: 2 }}>
                    {myPerfumes.length}
                  </span>
                </motion.button>

                {accordFilters.map((filter) => {
                  const isActive = activeFilter === filter.name;
                  return (
                    <motion.button
                      key={filter.name}
                      onClick={() => { handleFilterChange(filter.name); setFilterSheetOpen(false); }}
                      className="flex items-center gap-1.5 rounded-full"
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 600 : 400,
                        padding: '6px 14px',
                        background: isActive ? filter.color : '#F0EEE9',
                        color: isActive ? '#FFFFFF' : '#6B6862',
                      }}
                      whileTap={{ scale: 0.93 }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : filter.color }}
                      />
                      {filter.name}
                      <span style={{ fontSize: '0.6875rem', opacity: 0.6, marginLeft: 1 }}>
                        {filter.count}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

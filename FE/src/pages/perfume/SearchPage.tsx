import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';

export function SearchScreen() {
  const setSelectedPerfumeId = useAppStore((s) => s.setSelectedPerfumeId);
  const searchPerfumes = useAppStore((s) => s.searchPerfumes);
  const browsePerfumes = useAppStore((s) => s.browsePerfumes);
  const searchResults = useAppStore((s) => s.searchResults);
  const browseResults = useAppStore((s) => s.browseResults);
  const browsePage = useAppStore((s) => s.browsePage);
  const browseTotalPages = useAppStore((s) => s.browseTotalPages);
  const browseTotalElements = useAppStore((s) => s.browseTotalElements);
  const isLoading = useAppStore((s) => s.isLoading);
  const query = useAppStore((s) => s.searchQuery);
  const setQuery = useAppStore((s) => s.setSearchQuery);

  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountRef = useRef(true);

  // Load first page on mount (skip if search results already exist from back navigation)
  useEffect(() => {
    if (!query) void browsePerfumes(0);
  }, [browsePerfumes]);

  // Debounced search — skip re-fetch on initial mount if results already exist
  useEffect(() => {
    if (!query) return;
    if (isMountRef.current) {
      isMountRef.current = false;
      if (searchResults.length > 0) return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void searchPerfumes(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchPerfumes]);

  const handleViewDetail = (perfumeId: number) => {
    setSelectedPerfumeId(perfumeId);
    useAppStore.getState().pushTo('detail');
  };

  const handlePageChange = (next: number) => {
    void browsePerfumes(next);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      {/* Header */}
      <div className="pt-6 px-5 pb-3">
        <h2 className="text-[#1A1A1A] mb-4" style={{ fontSize: '1.375rem', fontFamily: "'Playfair Display', serif" }}>
          탐색
        </h2>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search size={15} className="text-[#8A8680]" />
          </div>
          <input
            className="w-full pl-10 pr-9 py-3 rounded-2xl border-2 bg-white/70 text-[#1A1A1A] outline-none transition-all"
            style={{ fontSize: '0.875rem', borderColor: isFocused ? '#6B7B5E' : 'rgba(0,0,0,0.06)' }}
            placeholder="브랜드, 향수명"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {query && (
            <motion.button
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#E8E6E1] flex items-center justify-center"
              onClick={() => setQuery('')}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
            >
              <X size={10} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        <AnimatePresence mode="wait">
          {query.length > 0 ? (
            /* Search results — list layout */
            <motion.div key="results" className="px-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="w-5 h-5 rounded-full border-2 border-[#6B7B5E] border-t-transparent animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 mt-3">
                  {searchResults.map((p, i) => (
                    <motion.div
                      key={p.perfumeId ?? p.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleViewDetail(p.perfumeId ?? p.id)}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#8A8680] truncate" style={{ fontSize: '0.6875rem' }}>{p.brand}</p>
                        <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.9375rem' }}>{p.name}</p>
                        {p.accords.length > 0 && (
                          <p className="text-[#8A8680] truncate" style={{ fontSize: '0.75rem' }}>{p.accords.slice(0, 3).join(' · ')}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16">
                  <p className="text-[#8A8680]" style={{ fontSize: '0.875rem' }}>"{query}"에 대한 결과가 없어요</p>
                </div>
              )}
            </motion.div>
          ) : (
            /* Browse — 2-column grid + pagination */
            <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="px-5 pt-1 pb-3 flex items-center justify-between">
                <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                  ALL PERFUMES{browseTotalElements > 0 ? ` · ${browseTotalElements.toLocaleString()}종` : ''}
                </p>
                <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
                  {browsePage + 1} / {browseTotalPages}
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="w-5 h-5 rounded-full border-2 border-[#6B7B5E] border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="px-4 grid grid-cols-2 gap-3">
                  {browseResults.map((p, i) => (
                    <motion.div
                      key={p.perfumeId ?? p.id}
                      className="rounded-2xl overflow-hidden cursor-pointer"
                      style={{ background: 'linear-gradient(145deg, #FFFFFF 0%, #F5F3EF 100%)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleViewDetail(p.perfumeId ?? p.id)}
                    >
                      <div className="w-full overflow-hidden" style={{ aspectRatio: '3/4' }}>
                        <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="text-[#8A8680] truncate" style={{ fontSize: '0.625rem' }}>{p.brand}</p>
                        <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.8125rem' }}>{p.name}</p>
                        {p.accords.length > 0 && (
                          <p className="text-[#B8B4AE] truncate mt-0.5" style={{ fontSize: '0.625rem' }}>{p.accords.slice(0, 2).join(' · ')}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && browseTotalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 pb-2">
                  <motion.button
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: browsePage === 0 ? '#F0EEE9' : '#1A1A1A', color: browsePage === 0 ? '#C0BDB8' : 'white' }}
                    onClick={() => handlePageChange(browsePage - 1)}
                    disabled={browsePage === 0}
                    whileTap={browsePage > 0 ? { scale: 0.9 } : {}}
                  >
                    <ChevronLeft size={16} />
                  </motion.button>

                  <div className="flex gap-1.5">
                    {Array.from({ length: Math.min(browseTotalPages, 7) }, (_, i) => {
                      const page = browseTotalPages <= 7 ? i : i + Math.max(0, Math.min(browsePage - 3, browseTotalPages - 7));
                      return (
                        <motion.button
                          key={page}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: page === browsePage ? '#1A1A1A' : '#D8D5D0' }}
                          onClick={() => handlePageChange(page)}
                          whileTap={{ scale: 0.8 }}
                        />
                      );
                    })}
                  </div>

                  <motion.button
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: browsePage >= browseTotalPages - 1 ? '#F0EEE9' : '#1A1A1A', color: browsePage >= browseTotalPages - 1 ? '#C0BDB8' : 'white' }}
                    onClick={() => handlePageChange(browsePage + 1)}
                    disabled={browsePage >= browseTotalPages - 1}
                    whileTap={browsePage < browseTotalPages - 1 ? { scale: 0.9 } : {}}
                  >
                    <ChevronRight size={16} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
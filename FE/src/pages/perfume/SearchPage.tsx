import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import { POPULAR_NOTES, TRENDING_TAGS } from '../../constants/ui.constants';
import { useAppStore } from '../../store';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';

export function SearchScreen() {
  const { setSelectedPerfumeId, searchPerfumes, searchResults, isLoading } = useAppStore();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchPerfumes(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchPerfumes]);

  const handleViewDetail = (perfumeId: number) => {
    setSelectedPerfumeId(perfumeId);
    useAppStore.getState().pushTo('detail');
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-2">
        <h2 className="text-[#1A1A1A] mb-4" style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif" }}>
          탐색
        </h2>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search size={16} className="text-[#8A8680]" />
          </div>
          <input
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border-2 bg-white/60 text-[#1A1A1A] outline-none transition-all"
            style={{ fontSize: '0.9375rem', borderColor: isFocused ? '#6B7B5E' : 'rgba(0,0,0,0.05)' }}
            placeholder="브랜드, 향수, 노트명..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {query && (
            <motion.button
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E8E6E1] flex items-center justify-center"
              onClick={() => setQuery('')}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
            >
              <X size={12} />
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-28">
        <AnimatePresence mode="wait">
          {query.length > 0 ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="w-6 h-6 rounded-full border-2 border-[#6B7B5E] border-t-transparent animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {searchResults.map((p, i) => (
                    <motion.div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleViewDetail(p.id)}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                        <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#8A8680]" style={{ fontSize: '0.6875rem' }}>{p.brand}</p>
                        <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>{p.name}</p>
                        {p.accords.length > 0 && (
                          <p className="text-[#8A8680]" style={{ fontSize: '0.75rem' }}>{p.accords.slice(0, 3).join(' · ')}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16">
                  <p className="text-[#8A8680]" style={{ fontSize: '0.9375rem' }}>"{query}"에 대한 결과가 없어요</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mt-5">
                <p className="text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>인기 노트</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_NOTES.map(note => (
                    <motion.button key={note}
                      className="px-4 py-2.5 rounded-full border border-[#E8E6E1] text-[#1A1A1A] bg-white/50"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => setQuery(note)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {note}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <p className="text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>트렌딩 무드</p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TAGS.map(tag => (
                    <motion.button key={tag}
                      className="px-4 py-2.5 rounded-full bg-[#F5F3EF] text-[#8A8680]"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => setQuery(tag)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tag}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

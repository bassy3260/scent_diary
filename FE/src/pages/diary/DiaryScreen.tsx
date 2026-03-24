import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Calendar, List, Plus, X } from 'lucide-react';
import { useAppStore } from '../../store';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import type { DiaryListItem, TryDiaryListItem, DiaryDetailData, TryDiaryDetailData } from '../../types/diary.types';

type ViewMode = 'calendar' | 'list';
type TypeFilter = 'all' | 'diary' | 'tasting';

const TYPE_CONFIG = {
  diary:   { label: '향수 일기', color: '#6B7B5E', bg: '#6B7B5E14' },
  tasting: { label: '시향 일지', color: '#8BA4B8', bg: '#8BA4B814' },
};

// ─── 향수 일기 카드 ────────────────────────────────────
function DiaryCard({ entry, onClick }: { entry: DiaryListItem; onClick: () => void }) {
  return (
    <motion.div
      className="mb-3 rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: 'linear-gradient(145deg, #FFFFFF, #F8F7F4)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2.5">
          <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{entry.title}</p>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
              {entry.createTime.slice(5, 10).replace('-', '.')}
            </span>
            <span className="px-1.5 py-0.5 rounded-full"
              style={{ fontSize: '0.5625rem', backgroundColor: TYPE_CONFIG.diary.bg, color: TYPE_CONFIG.diary.color }}>
              향수 일기
            </span>
          </div>
        </div>

        {entry.perfume && (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg overflow-hidden">
              <ImageWithFallback src={entry.perfume.perfumeImageUrl} alt={entry.perfume.perfumeName} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>{entry.perfume.brand}</p>
              <p className="text-[#1A1A1A]" style={{ fontSize: '0.6875rem' }}>{entry.perfume.perfumeName}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── 시향 일지 카드 ────────────────────────────────────
function TastingCard({ entry, onClick }: { entry: TryDiaryListItem; onClick: () => void }) {
  return (
    <motion.div
      className="mb-3 rounded-2xl overflow-hidden cursor-pointer relative"
      style={{ background: 'linear-gradient(145deg, #FFFFFF, #F6F8FA)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: '#8BA4B8' }} />
      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {entry.thumbnail && (
              <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                <ImageWithFallback src={entry.thumbnail} alt={entry.perfumeName} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.875rem' }}>{entry.perfumeName}</p>
              <p className="text-[#B8B4AE]" style={{ fontSize: '0.625rem' }}>{entry.brand}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
              {entry.createTime.slice(5, 10).replace('-', '.')}
            </span>
            <span className="px-1.5 py-0.5 rounded-full"
              style={{ fontSize: '0.5625rem', backgroundColor: TYPE_CONFIG.tasting.bg, color: TYPE_CONFIG.tasting.color }}>
              시향 일지
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── 향수 일기 상세 ────────────────────────────────────
function DiaryDetail({ detail, onClose }: { detail: DiaryDetailData; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#FAFAF8' }}>
      <div className="pt-5 px-5 pb-3 flex items-center justify-between shrink-0">
        <motion.button className="w-9 h-9 rounded-full bg-[#F5F3EF] flex items-center justify-center" onClick={onClose} whileTap={{ scale: 0.9 }}>
          <X size={16} className="text-[#8A8680]" />
        </motion.button>
        <span className="px-2.5 py-1 rounded-full text-[#6B7B5E]" style={{ fontSize: '0.6875rem', backgroundColor: TYPE_CONFIG.diary.bg }}>
          향수 일기
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        <p className="text-[#B8B4AE] text-center mb-2" style={{ fontSize: '0.75rem' }}>
          {new Date(detail.createTime).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <h2 className="text-[#1A1A1A] text-center mb-5" style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>{detail.title}</h2>

        {/* 이미지 */}
        {detail.diaryImage?.length > 0 && (
          <div className="flex gap-2 mb-5 overflow-x-auto">
            {detail.diaryImage.map((img, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shrink-0" style={{ width: detail.diaryImage.length === 1 ? '100%' : 180, height: 160 }}>
                <img src={img.diaryImageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* 향수 */}
        {detail.perfume && (
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-5" style={{ background: 'linear-gradient(135deg,#F5F3EF,#EFF3F7)' }}>
            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
              <ImageWithFallback src={detail.perfume.perfumeImageUrl} alt={detail.perfume.perfumeName} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[#8A8680]" style={{ fontSize: '0.75rem' }}>{detail.perfume.brand}</p>
              <p className="text-[#1A1A1A]" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>{detail.perfume.perfumeName}</p>
            </div>
          </div>
        )}

        {/* 본문 */}
        <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(145deg,#FFFFFF,#F8F7F4)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <span className="block mb-2" style={{ fontSize: '2rem', lineHeight: 1, color: '#6B7B5E', opacity: 0.18, fontFamily: "'Playfair Display', serif" }}>"</span>
          <p className="text-[#2A2A2A]" style={{ fontSize: '0.9rem', lineHeight: 1.85, fontFamily: "'Playfair Display', serif" }}>
            {detail.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 시향 일지 상세 ────────────────────────────────────
function TastingDetail({ detail, onClose }: { detail: TryDiaryDetailData; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#FAFAF8' }}>
      <div className="pt-5 px-5 pb-3 flex items-center justify-between shrink-0">
        <motion.button className="w-9 h-9 rounded-full bg-[#F5F3EF] flex items-center justify-center" onClick={onClose} whileTap={{ scale: 0.9 }}>
          <X size={16} className="text-[#8A8680]" />
        </motion.button>
        <span className="px-2.5 py-1 rounded-full text-[#8BA4B8]" style={{ fontSize: '0.6875rem', backgroundColor: TYPE_CONFIG.tasting.bg }}>
          시향 일지
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        <p className="text-[#B8B4AE] text-center mb-2" style={{ fontSize: '0.75rem' }}>
          {new Date(detail.createTime).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <h2 className="text-[#1A1A1A] text-center mb-5" style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>{detail.title}</h2>

        <div className="space-y-3">
          {detail.tryItem.map((item) => (
            <div key={item.perfumeId} className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg,#EFF3F7,#F5F3EF)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <ImageWithFallback src={item.perfumeImageUrl} alt={item.perfumeName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-[#8BA4B8]" style={{ fontSize: '0.75rem' }}>{item.brand}</p>
                  <p className="text-[#1A1A1A]" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>{item.perfumeName}</p>
                </div>
              </div>
              <p className="text-[#4A4A4A]" style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────
export function DiaryScreen() {
  const {
    diaryEntries, tryDiaryEntries, diaryDetail, tryDiaryDetail,
    isDiaryLoading, fetchDiaries, fetchDiaryDetail, fetchTryDiaries, fetchTryDiaryDetail,
    navigateTo,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<{ type: 'diary'; id: number } | { type: 'try'; id: number } | null>(null);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // 초기 데이터 로드
  useEffect(() => {
    fetchDiaries({ page: 1, size: 50 });
    fetchTryDiaries({ page: 1, size: 50 });
  }, [fetchDiaries, fetchTryDiaries]);

  // 상세 로드
  useEffect(() => {
    if (!selectedEntry) return;
    if (selectedEntry.type === 'diary') fetchDiaryDetail(selectedEntry.id);
    else fetchTryDiaryDetail(selectedEntry.id);
  }, [selectedEntry, fetchDiaryDetail, fetchTryDiaryDetail]);

  // 날짜 도우미
  const toDateKey = (createTime: string) => createTime.slice(0, 10);

  // 필터링
  type AnyEntry = { _type: 'diary'; data: DiaryListItem } | { _type: 'try'; data: TryDiaryListItem };

  const allEntries: AnyEntry[] = [
    ...diaryEntries.map(d => ({ _type: 'diary' as const, data: d })),
    ...tryDiaryEntries.map(t => ({ _type: 'try' as const, data: t })),
  ].sort((a, b) => b.data.createTime.localeCompare(a.data.createTime));

  const filteredEntries = typeFilter === 'all' ? allEntries
    : typeFilter === 'diary' ? allEntries.filter(e => e._type === 'diary')
    : allEntries.filter(e => e._type === 'try');

  // 달력 날짜별 타입 맵
  const dateTypeMap = new Map<string, { hasDiary: boolean; hasTasting: boolean }>();
  filteredEntries.forEach(entry => {
    const key = toDateKey(entry.data.createTime);
    const ex = dateTypeMap.get(key) || { hasDiary: false, hasTasting: false };
    if (entry._type === 'diary') ex.hasDiary = true;
    else ex.hasTasting = true;
    dateTypeMap.set(key, ex);
  });

  // 달력 그리드
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  const monthEntries = filteredEntries.filter(e => e.data.createTime.startsWith(monthStr));
  const monthDiaryCount = monthEntries.filter(e => e._type === 'diary').length;
  const monthTastingCount = monthEntries.filter(e => e._type === 'try').length;
  const selectedDateEntries = selectedDate ? filteredEntries.filter(e => toDateKey(e.data.createTime) === selectedDate) : [];

  const formatDateKey = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handleCardClick = (entry: AnyEntry) => {
    if (entry._type === 'diary') setSelectedEntry({ type: 'diary', id: entry.data.diaryId });
    else setSelectedEntry({ type: 'try', id: (entry.data as TryDiaryListItem).tryDiaryId });
  };

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: '#FAFAF8' }}>
      {/* ── 헤더 ──────────────────────────────────────── */}
      <div className="pt-6 px-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#B8B4AE]" style={{ fontSize: '0.6rem', letterSpacing: '0.12em' }}>SCENT DIARY</p>
            <h2 className="text-[#1A1A1A]" style={{ fontSize: '1.375rem', fontFamily: "'Playfair Display', serif" }}>향수 다이어리</h2>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ backgroundColor: '#F5F3EF' }}>
          {([
            { id: 'calendar' as ViewMode, Icon: Calendar, label: '캘린더' },
            { id: 'list' as ViewMode, Icon: List, label: '리스트' },
          ] as const).map(v => (
            <button key={v.id} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
              style={{ backgroundColor: viewMode === v.id ? '#FFFFFF' : 'transparent', color: viewMode === v.id ? '#1A1A1A' : '#8A8680', fontSize: '0.8125rem', boxShadow: viewMode === v.id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none' }}
              onClick={() => setViewMode(v.id)}>
              <v.Icon size={13} />{v.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {([
            { id: 'all' as TypeFilter, label: '전체' },
            { id: 'diary' as TypeFilter, label: '향수 일기' },
            { id: 'tasting' as TypeFilter, label: '시향 일지' },
          ] as const).map(f => {
            const active = typeFilter === f.id;
            const color = f.id === 'diary' ? '#6B7B5E' : f.id === 'tasting' ? '#8BA4B8' : '#1A1A1A';
            return (
              <button key={f.id} className="px-3 py-1.5 rounded-full transition-all"
                style={{ fontSize: '0.75rem', backgroundColor: active ? (f.id === 'all' ? '#1A1A1A' : f.id === 'diary' ? TYPE_CONFIG.diary.bg : TYPE_CONFIG.tasting.bg) : '#F5F3EF', color: active ? (f.id === 'all' ? '#FFFFFF' : color) : '#8A8680', border: active ? `1.5px solid ${f.id === 'all' ? '#1A1A1A' : color}20` : '1.5px solid transparent' }}
                onClick={() => { setTypeFilter(f.id); setSelectedDate(null); }}>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 콘텐츠 ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {isDiaryLoading && diaryEntries.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#6B7B5E] border-t-transparent animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'calendar' ? (
              <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-4 mt-1">
                  <motion.button className="w-8 h-8 rounded-full bg-[#F5F3EF] flex items-center justify-center" onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); setSelectedDate(null); }} whileTap={{ scale: 0.9 }}>
                    <ChevronLeft size={16} className="text-[#8A8680]" />
                  </motion.button>
                  <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>{monthLabel}</p>
                  <motion.button className="w-8 h-8 rounded-full bg-[#F5F3EF] flex items-center justify-center" onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); setSelectedDate(null); }} whileTap={{ scale: 0.9 }}>
                    <ChevronLeft size={16} className="text-[#8A8680] rotate-180" />
                  </motion.button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1.5">
                  {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                    <div key={d} className="text-center text-[#B8B4AE]" style={{ fontSize: '0.625rem' }}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;
                    const key = formatDateKey(day);
                    const types = dateTypeMap.get(key);
                    const isToday = day === today.getDate() && calYear === today.getFullYear() && calMonth === today.getMonth();
                    const isSelected = selectedDate === key;
                    return (
                      <motion.button key={i} className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors"
                        style={{ backgroundColor: isSelected ? '#1A1A1A' : isToday ? '#6B7B5E12' : types ? '#F5F3EF' : 'transparent', border: isToday && !isSelected ? '1.5px solid #6B7B5E30' : 'none' }}
                        onClick={() => setSelectedDate(prev => prev === key ? null : key)}
                        whileTap={{ scale: 0.88 }}>
                        <span style={{ fontSize: '0.75rem', color: isSelected ? '#FFFFFF' : isToday ? '#6B7B5E' : '#1A1A1A' }}>{day}</span>
                        {types && (
                          <div className="flex gap-0.5">
                            {types.hasDiary && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? '#FFFFFF' : '#6B7B5E' }} />}
                            {types.hasTasting && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? '#FFFFFF' : '#8BA4B8' }} />}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-3 justify-center">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#6B7B5E]" /><span className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>향수 일기</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#8BA4B8]" /><span className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>시향 일지</span></div>
                </div>
                <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: '#F5F3EF' }}>
                  <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.625rem', letterSpacing: '0.08em' }}>이번 달 기록</p>
                  <div className="flex gap-5">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#6B7B5E]" /><span className="text-[#1A1A1A]" style={{ fontSize: '1.125rem' }}>{monthDiaryCount}</span><span className="text-[#8A8680]" style={{ fontSize: '0.6875rem' }}>향수 일기</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#8BA4B8]" /><span className="text-[#1A1A1A]" style={{ fontSize: '1.125rem' }}>{monthTastingCount}</span><span className="text-[#8A8680]" style={{ fontSize: '0.6875rem' }}>시향 일지</span></div>
                  </div>
                </div>
                <AnimatePresence>
                  {selectedDate && selectedDateEntries.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ type: 'tween', duration: 0.22 }} className="mt-4 overflow-hidden">
                      <p className="text-[#8A8680] mb-3" style={{ fontSize: '0.75rem' }}>{selectedDate.slice(5).replace('-', '월 ')}일의 기록</p>
                      {selectedDateEntries.map((entry, i) =>
                        entry._type === 'diary'
                          ? <DiaryCard key={i} entry={entry.data} onClick={() => handleCardClick(entry)} />
                          : <TastingCard key={i} entry={entry.data as TryDiaryListItem} onClick={() => handleCardClick(entry)} />
                      )}
                    </motion.div>
                  )}
                  {selectedDate && selectedDateEntries.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 text-center py-6">
                      <p className="text-[#B8B4AE]" style={{ fontSize: '0.8125rem' }}>이날의 기록이 없어요</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1">
                {filteredEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-[#B8B4AE]" style={{ fontSize: '0.9375rem' }}>아직 기록이 없어요</p>
                    <p className="text-[#D4D0CA] mt-1" style={{ fontSize: '0.8125rem' }}>오늘의 향을 기록해보세요</p>
                  </div>
                ) : (
                  filteredEntries.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, type: 'tween' }}>
                      {entry._type === 'diary'
                        ? <DiaryCard entry={entry.data} onClick={() => handleCardClick(entry)} />
                        : <TastingCard entry={entry.data as TryDiaryListItem} onClick={() => handleCardClick(entry)} />
                      }
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <motion.button
          className="w-full mt-3 py-4 rounded-2xl flex items-center justify-center gap-2"
          style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', fontSize: '0.9375rem' }}
          onClick={() => setShowTypeSheet(true)}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        >
          <Plus size={16} />오늘의 향 기록하기
        </motion.button>
      </div>

      {/* ── 타입 선택 바텀시트 ─────────────────────────── */}
      <AnimatePresence>
        {showTypeSheet && (
          <>
            <motion.div className="absolute inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTypeSheet(false)} />
            <motion.div className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-10" style={{ backgroundColor: '#FAFAF8' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}>
              <div className="w-10 h-1 rounded-full bg-[#E8E6E1] mx-auto mb-5" />
              <p className="text-[#1A1A1A] mb-1" style={{ fontSize: '1.0625rem', fontFamily: "'Playfair Display', serif" }}>기록 타입을 선택해주세요</p>
              <p className="text-[#B8B4AE] mb-6" style={{ fontSize: '0.8125rem' }}>어떤 향의 이야기를 남길까요?</p>
              <div className="space-y-3">
                <motion.button className="w-full p-4 rounded-2xl text-left" style={{ border: '1.5px solid #6B7B5E20', backgroundColor: '#6B7B5E08' }} onClick={() => { setShowTypeSheet(false); navigateTo('diary-write'); }} whileTap={{ scale: 0.98 }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#6B7B5E18' }}><span style={{ fontSize: '1.25rem' }}>📖</span></div>
                    <div>
                      <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>향수 일기</p>
                      <p className="text-[#8A8680]" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>오늘의 감정, 날씨, 하루를 향과 함께 기록해요</p>
                    </div>
                  </div>
                </motion.button>
                <motion.button className="w-full p-4 rounded-2xl text-left" style={{ border: '1.5px solid #8BA4B820', backgroundColor: '#8BA4B808' }} onClick={() => { setShowTypeSheet(false); navigateTo('tasting-write'); }} whileTap={{ scale: 0.98 }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#8BA4B818' }}><span style={{ fontSize: '1.25rem' }}>🧪</span></div>
                    <div>
                      <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>시향 일지</p>
                      <p className="text-[#8A8680]" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>맡아본 향수에 대한 인상과 평가를 기록해요</p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 상세 오버레이 ─────────────────────────────── */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div className="absolute inset-0 z-50" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}>
            {isDiaryLoading ? (
              <div className="w-full h-full flex items-center justify-center" style={{ background: '#FAFAF8' }}>
                <div className="w-8 h-8 rounded-full border-2 border-[#6B7B5E] border-t-transparent animate-spin" />
              </div>
            ) : selectedEntry.type === 'diary' && diaryDetail ? (
              <DiaryDetail detail={diaryDetail} onClose={() => setSelectedEntry(null)} />
            ) : selectedEntry.type === 'try' && tryDiaryDetail ? (
              <TastingDetail detail={tryDiaryDetail} onClose={() => setSelectedEntry(null)} />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

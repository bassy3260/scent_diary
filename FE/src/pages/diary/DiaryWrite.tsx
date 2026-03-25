import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, Camera, X, Search, Sparkles, Wand2, Plus } from 'lucide-react';
import { useAppStore } from '../../store';
import { usePerfumeStore, useDiaryStore, useMyPageStore } from '../../store';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { diaryApi } from '../../api/diary.api';

export function DiaryWrite() {
  const { navigateTo } = useAppStore();
  const { searchResults, searchPerfumes } = usePerfumeStore();
  const { createDiary, diaryPrefill, setDiaryPrefill } = useDiaryStore();
  const { likedPerfumes, myPerfumes, fetchLikes, fetchMyPerfumes } = useMyPageStore();

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedPerfumeId, setSelectedPerfumeId] = useState<number | null>(
    () => diaryPrefill?.perfumeId ?? null
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [showPerfumeSheet, setShowPerfumeSheet] = useState(false);
  const [perfumeSearch, setPerfumeSearch] = useState('');
  const [perfumeFilter, setPerfumeFilter] = useState<'all' | 'saved' | 'collection'>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // '전체' 탭만 API 검색, 찜/컬렉션은 클라이언트 필터링
  useEffect(() => {
    if (!showPerfumeSheet || perfumeFilter !== 'all') return;
    const timer = setTimeout(() => {
      searchPerfumes(perfumeSearch.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [perfumeSearch, searchPerfumes, showPerfumeSheet, perfumeFilter]);

  // 찜/컬렉션 탭 진입 시 데이터 로드
  useEffect(() => {
    if (!showPerfumeSheet) return;
    if (perfumeFilter === 'saved' && likedPerfumes.length === 0) fetchLikes(1, 200);
    if (perfumeFilter === 'collection' && myPerfumes.length === 0) fetchMyPerfumes(1, 200);
  }, [showPerfumeSheet, perfumeFilter]);

  const isPrefilled = diaryPrefill != null && selectedPerfumeId === diaryPrefill.perfumeId;

  const selectedPerfume = selectedPerfumeId !== null
    ? (
        (isPrefilled ? { ...diaryPrefill, accords: [] } : null) ??
        searchResults.find(p => p.perfumeId === selectedPerfumeId) ??
        likedPerfumes.find(p => p.perfumeId === selectedPerfumeId) ??
        myPerfumes.find(p => p.perfumeId === selectedPerfumeId) ??
        null
      )
    : null;

  const baseFilteredPerfumes = (() => {
    const query = perfumeSearch.trim().toLowerCase();
    if (perfumeFilter === 'saved') {
      return query
        ? likedPerfumes.filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
        : likedPerfumes;
    }
    if (perfumeFilter === 'collection') {
      return query
        ? myPerfumes.filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
        : myPerfumes;
    }
    return searchResults;
  })();

  const emptyMessage = (() => {
    if (perfumeSearch.trim()) return '검색 결과가 없어요';
    if (perfumeFilter === 'saved') return '찜한 향수가 없어요';
    if (perfumeFilter === 'collection') return '구매한 향수가 없어요';
    return '향수 목록을 불러오는 중이에요';
  })();

  const selectPerfume = (id: number) => {
    setSelectedPerfumeId(id);
    setShowPerfumeSheet(false);
    setPerfumeSearch('');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && photoUrls.length < 3) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
      import('../../api/s3').then(({ uploadImageToS3 }) => {
        uploadImageToS3(file).then(fileName => {
          setImageNames(prev => [...prev, fileName]);
        });
      });
    }
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== idx));
    setImageNames(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAiEnhance = useCallback(async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const result = await diaryApi.refineContent({
        content: note.trim(),
        perfumeName: selectedPerfume?.name ?? '',
        perfumeBrand: selectedPerfume?.brand ?? '',
      });
      setNote(result.content);
      setAiUsed(true);
    } catch {
      // 실패 시 원본 유지
    } finally {
      setAiLoading(false);
    }
  }, [aiLoading, note, selectedPerfume]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await createDiary({
        title: title.trim() || '오늘의 향',
        content: note,
        perfumeId: selectedPerfumeId ?? 0,
        images: imageNames,
      });
      setDiaryPrefill(null);
      navigateTo('diary');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('403') || msg.includes('401')) {
        setSaveError('로그인이 만료되었습니다. 다시 로그인해주세요.');
      } else {
        setSaveError(msg || '저장에 실패했습니다.');
      }
      setSaving(false);
    }
  };

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const hasContent = title.trim().length > 0 || note.trim().length > 0 || selectedPerfumeId !== null;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>

      {/* ── 헤더 ─────────────────────────────────────── */}
      <div className="pt-6 px-5 pb-3 flex items-center justify-between shrink-0">
        <motion.button
          className="w-9 h-9 rounded-full bg-[#F5F3EF] flex items-center justify-center"
          onClick={() => navigateTo('diary')}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={18} className="text-[#8A8680]" />
        </motion.button>
        <div className="text-center">
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.5rem', letterSpacing: '0.14em' }}>SCENT DIARY</p>
          <h3 className="text-[#1A1A1A]" style={{ fontSize: '1.0625rem', fontFamily: "'Playfair Display', serif" }}>오늘의 향 기록</h3>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* ── 날짜 strip ────────────────────────────────── */}
      <div className="px-5 pb-4 shrink-0">
        <div className="px-4 py-2.5 rounded-xl text-center" style={{ backgroundColor: '#F0EDE7' }}>
          <p className="text-[#6B7B5E]" style={{ fontSize: '0.8125rem' }}>{today}</p>
        </div>
      </div>

      {/* ── 스크롤 폼 ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">

        {/* 제목 입력 */}
        <section className="mb-5">
          <p className="text-[#B8B4AE] mb-2.5" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>제목</p>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-2xl outline-none text-[#1A1A1A] placeholder:text-[#D4D0CA]"
            style={{
              fontSize: '1rem',
              backgroundColor: '#F5F3EF',
              border: '1.5px solid transparent',
              fontFamily: "'Playfair Display', serif",
            }}
            placeholder="일기 제목을 입력하세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={50}
          />
        </section>

        {/* 향수 선택 */}
        <section className="mb-5">
          <p className="text-[#B8B4AE] mb-2.5" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>오늘 뿌린 향수</p>

          {selectedPerfume ? (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #EFF3F7 0%, #F5F3EF 100%)', border: '1.5px solid rgba(139,164,184,0.15)' }}>
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <ImageWithFallback src={selectedPerfume.image} alt={selectedPerfume.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#8A8680]" style={{ fontSize: '0.5625rem', letterSpacing: '0.06em' }}>{selectedPerfume.brand.toUpperCase()}</p>
                <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.9375rem' }}>{selectedPerfume.name}</p>
              </div>
              {!isPrefilled && (
                <motion.button
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(139,164,184,0.15)' }}
                  onClick={() => setSelectedPerfumeId(null)}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={12} className="text-[#8A8680]" />
                </motion.button>
              )}
            </div>
          ) : (
            <motion.button
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 border-dashed transition-colors hover:border-[#6B7B5E]"
              style={{ borderColor: '#E8E6E1' }}
              onClick={() => setShowPerfumeSheet(true)}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={14} className="text-[#B8B4AE]" />
              <span className="text-[#B8B4AE]" style={{ fontSize: '0.875rem' }}>향수 검색 또는 선택</span>
            </motion.button>
          )}
        </section>

        {/* 사진 — 최대 3개 */}
        <section className="mb-5">
          <p className="text-[#B8B4AE] mb-2.5" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>사진 (최대 3개)</p>

          {photoUrls.length > 0 && (
            <div className="flex gap-2 mb-2">
              {photoUrls.map((url, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden" style={{ width: 80, height: 80, flexShrink: 0 }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <motion.button
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={() => removePhoto(idx)}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={10} className="text-white" />
                  </motion.button>
                </div>
              ))}
            </div>
          )}

          {photoUrls.length < 3 && (
            <label>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              <motion.div
                className="w-full h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors hover:border-[#6B7B5E]"
                style={{ borderColor: '#E8E6E1' }}
                whileTap={{ scale: 0.98 }}
              >
                <Camera size={18} className="text-[#B8B4AE]" />
                <p className="text-[#8A8680]" style={{ fontSize: '0.8125rem' }}>
                  {photoUrls.length > 0 ? `사진 추가 (${photoUrls.length}/3)` : '사진 추가하기'}
                </p>
              </motion.div>
            </label>
          )}
        </section>

        {/* 오늘의 기록 */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>오늘의 기록</p>
            {aiUsed && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ fontSize: '0.5625rem', backgroundColor: '#6B7B5E14', color: '#6B7B5E' }}>
                <Sparkles size={9} />
                AI 다듬음
              </span>
            )}
          </div>
          <div className="relative">
            <textarea
              className="w-full min-h-[140px] p-4 rounded-2xl outline-none resize-none text-[#1A1A1A] placeholder:text-[#D4D0CA]"
              style={{
                fontSize: '0.9375rem',
                lineHeight: 1.8,
                backgroundColor: '#F5F3EF',
                border: '1.5px solid transparent',
                fontFamily: "'Playfair Display', serif",
                paddingBottom: '3.25rem',
              }}
              placeholder="오늘 하루와 향에 대한 이야기를 적어보세요..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <motion.button
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{
                fontSize: '0.6875rem',
                backgroundColor: note.length >= 3 && !aiLoading ? '#6B7B5E' : '#E8E6E1',
                color: note.length >= 3 && !aiLoading ? '#FFF' : '#B8B4AE',
                transition: 'background-color 0.2s',
              }}
              onClick={handleAiEnhance}
              disabled={aiLoading || note.length < 3}
              whileTap={note.length >= 3 ? { scale: 0.94 } : {}}
            >
              {aiLoading ? (
                <>
                  <motion.div
                    className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                  />
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <Wand2 size={11} />
                  <span>AI 다듬기</span>
                </>
              )}
            </motion.button>
          </div>
        </section>

        {/* ── 일기 미리보기 ──────────────────────────────── */}
        <AnimatePresence>
          {hasContent && (
            <motion.section
              className="mb-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.22 }}
            >
              <p className="text-[#B8B4AE] mb-2.5" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>미리보기</p>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #FFFFFF, #F8F7F4)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
              >
                {/* 사진 영역 */}
                {photoUrls.length > 0 && (
                  <div className={`grid gap-0.5 ${photoUrls.length === 1 ? 'grid-cols-1' : photoUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
                    style={{ maxHeight: 200 }}>
                    {photoUrls.map((url, idx) => (
                      <img key={idx} src={url} alt="" className="w-full object-cover" style={{ height: 200 }} />
                    ))}
                  </div>
                )}

                <div className="p-4">
                  {/* 날짜 */}
                  <p className="text-[#B8B4AE] mb-1.5" style={{ fontSize: '0.6875rem' }}>{today}</p>

                  {/* 제목 */}
                  {title.trim() && (
                    <p className="text-[#1A1A1A] mb-2.5" style={{ fontSize: '1rem', fontWeight: 600, fontFamily: "'Playfair Display', serif" }}>
                      {title}
                    </p>
                  )}

                  {/* 향수 */}
                  {selectedPerfume && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        <ImageWithFallback src={selectedPerfume.image} alt={selectedPerfume.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>{selectedPerfume.brand}</p>
                        <p className="text-[#1A1A1A]" style={{ fontSize: '0.8125rem' }}>{selectedPerfume.name}</p>
                      </div>
                    </div>
                  )}

                  {/* 본문 */}
                  {note.trim() && (
                    <p className="text-[#2A2A2A]"
                      style={{
                        fontSize: '0.875rem', lineHeight: 1.75,
                        fontFamily: "'Playfair Display', serif",
                        display: '-webkit-box', WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                      {note}
                    </p>
                  )}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* ── 에러 메시지 ────────────────────────────────── */}
      {saveError && (
        <div className="px-5 pb-2 shrink-0">
          <p className="text-center text-red-500" style={{ fontSize: '0.8125rem' }}>{saveError}</p>
        </div>
      )}

      {/* ── 하단 저장 버튼 ─────────────────────────────── */}
      <div className="px-5 pt-3 pb-6 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <motion.button
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
          style={{
            background: hasContent
              ? 'linear-gradient(135deg, #6B7B5E 0%, #8FA380 100%)'
              : '#E8E6E1',
            boxShadow: hasContent ? '0 4px 16px rgba(107,123,94,0.3)' : 'none',
          }}
          onClick={handleSave}
          disabled={!hasContent || saving}
          whileTap={hasContent ? { scale: 0.97 } : {}}
        >
          {saving ? (
            <>
              <motion.div
                className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
              />
              <span className="text-white" style={{ fontSize: '0.9375rem' }}>저장 중...</span>
            </>
          ) : (
            <>
              <Check size={16} className={hasContent ? 'text-white' : 'text-[#B8B4AE]'} />
              <span style={{ fontSize: '0.9375rem', color: hasContent ? '#FFFFFF' : '#B8B4AE' }}>일기 저장하기</span>
            </>
          )}
        </motion.button>
      </div>

      {/* ── 향수 바텀시트 ──────────────────────────────── */}
      <AnimatePresence>
        {showPerfumeSheet && (
          <>
            <motion.div
              className="absolute inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowPerfumeSheet(false); setPerfumeSearch(''); }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
              style={{ backgroundColor: '#FAFAF8', maxHeight: '78%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.26, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* 핸들 + 검색 */}
              <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#E8E6E1] mx-auto mb-4" />
                <p className="text-[#1A1A1A] mb-3" style={{ fontSize: '1.0625rem', fontFamily: "'Playfair Display', serif" }}>향수 선택</p>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl" style={{ backgroundColor: '#F5F3EF' }}>
                  <Search size={14} className="text-[#B8B4AE] shrink-0" />
                  <input
                    type="text"
                    placeholder="향수명 또는 브랜드 검색"
                    value={perfumeSearch}
                    onChange={e => setPerfumeSearch(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent outline-none text-[#1A1A1A] placeholder:text-[#B8B4AE]"
                    style={{ fontSize: '0.875rem' }}
                    autoFocus
                  />
                  {perfumeSearch && (
                    <button onClick={() => setPerfumeSearch('')}>
                      <X size={13} className="text-[#B8B4AE]" />
                    </button>
                  )}
                </div>
                {/* 필터 칩 */}
                <div className="flex items-center gap-2 mt-2.5">
                  {([
                    { key: 'all', label: '전체' },
                    { key: 'saved', label: '찜한 향수' },
                    { key: 'collection', label: '마이 컬렉션' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setPerfumeFilter(key)}
                      className="transition-all"
                      style={{
                        fontSize: '0.75rem',
                        padding: '4px 11px',
                        borderRadius: '999px',
                        border: perfumeFilter === key ? '1.5px solid #6B7B5E' : '1.5px solid rgba(0,0,0,0.09)',
                        backgroundColor: perfumeFilter === key ? '#6B7B5E' : 'transparent',
                        color: perfumeFilter === key ? '#FFFFFF' : '#8A8680',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 목록 */}
              <div className="flex-1 overflow-y-auto px-5 pb-8">
                {baseFilteredPerfumes.map(p => (
                  <motion.button
                    key={p.perfumeId}
                    className="w-full flex items-center gap-3 py-3 border-b last:border-b-0"
                    style={{ borderColor: '#F0EDE7' }}
                    onClick={() => selectPerfume(p.perfumeId)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                      <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem', letterSpacing: '0.06em' }}>{p.brand.toUpperCase()}</p>
                      <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.9375rem' }}>{p.name}</p>
                    </div>
                    {selectedPerfumeId === p.perfumeId && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#6B7B5E' }}>
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
                {baseFilteredPerfumes.length === 0 && (
                  <p className="text-center text-[#B8B4AE] py-10" style={{ fontSize: '0.875rem' }}>{emptyMessage}</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

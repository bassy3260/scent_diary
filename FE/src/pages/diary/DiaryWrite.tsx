import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, Camera, X, Search, Sparkles, Wand2, Plus } from 'lucide-react';
import { useAppStore } from '../../store';
import { mockPerfumes } from '../../constants/perfumes';
import { DIARY_MOODS, DIARY_WEATHERS } from '../../constants/ui.constants';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { DiaryCanvas, type DiaryFormData } from './DiaryCanvas';

const TAG_OPTIONS = ['데일리', '갤러리', '데이트', '오피스', '저녁', '독서', '산책', '여행', '기분전환', '특별한 날'];

const AI_SAMPLES = [
  '향이 피부에 스며들듯, 오늘도 조용히 흘러갔다. 기억에 남을 향기와 함께한 하루.',
  '빛이 조금씩 기울어가는 오후, 향 한 번 뿌리고 세상과 잠시 거리를 두었다.',
  '어떤 향은 감정보다 오래 머문다. 오늘 뿌린 향수처럼, 이 하루도 천천히 잔향으로 남길.',
  '오늘의 공기와 향수가 완벽하게 어울렸다. 이런 순간이 다시 오길 바라며.',
];

export function DiaryWrite() {
  const { navigateTo, savedPerfumes, myCollection } = useAppStore();

  const [stage, setStage] = useState<'form' | 'canvas'>('form');
  const [mood, setMood] = useState('');
  const [moodEmoji, setMoodEmoji] = useState('');
  const [weather, setWeather] = useState('');
  const [weatherEmoji, setWeatherEmoji] = useState('');
  const [note, setNote] = useState('');
  // 다중 향수 선택
  const [selectedPerfumeIds, setSelectedPerfumeIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  // 사진 최대 3개
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [showPerfumeSheet, setShowPerfumeSheet] = useState(false);
  const [perfumeSearch, setPerfumeSearch] = useState('');
  const [perfumeFilter, setPerfumeFilter] = useState<'all' | 'saved' | 'collection'>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);

  const selectedPerfumes = mockPerfumes.filter(p => selectedPerfumeIds.includes(p.id));

  const baseFilteredPerfumes = (() => {
    if (perfumeFilter === 'saved') return mockPerfumes.filter(p => savedPerfumes.includes(p.id));
    if (perfumeFilter === 'collection') return mockPerfumes.filter(p => myCollection.includes(p.id));
    return mockPerfumes;
  })();

  const filteredPerfumes = perfumeSearch.trim()
    ? baseFilteredPerfumes.filter(p =>
        p.name.toLowerCase().includes(perfumeSearch.toLowerCase()) ||
        p.brand.toLowerCase().includes(perfumeSearch.toLowerCase())
      )
    : baseFilteredPerfumes;

  const emptyMessage = (() => {
    if (perfumeSearch.trim()) return '검색 결과가 없어요';
    if (perfumeFilter === 'saved') return '찜한 향수가 없어요';
    if (perfumeFilter === 'collection') return '구매한 향수가 없어요';
    return '향수가 없어요';
  })();

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const togglePerfume = (id: string) => {
    setSelectedPerfumeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && photoUrls.length < 3) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrls(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    }
    // input 초기화 (같은 파일 재선택 허용)
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAiEnhance = useCallback(async () => {
    if (aiLoading) return;
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const sample = AI_SAMPLES[Math.floor(Math.random() * AI_SAMPLES.length)];
    const enhanced = note.trim() ? `${note.trim()}\n\n${sample}` : sample;
    setNote(enhanced);
    setAiUsed(true);
    setAiLoading(false);
  }, [aiLoading, note]);

  const formData: DiaryFormData = {
    mood, moodEmoji, weather, weatherEmoji, note,
    selectedPerfumeId: selectedPerfumeIds[0] ?? null,
    perfume: selectedPerfumes[0] ?? null,
    tags,
    photoUrl: photoUrls[0] ?? null,
  };

  if (stage === 'canvas') {
    return <DiaryCanvas formData={formData} onBack={() => setStage('form')} />;
  }

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

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

        {/* 기분 */}
        <section className="mb-5">
          <p className="text-[#B8B4AE] mb-2.5" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>오늘의 기분</p>
          <div className="flex flex-wrap gap-2">
            {DIARY_MOODS.map(m => (
              <motion.button
                key={m.label}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border whitespace-nowrap transition-colors"
                style={{
                  fontSize: '0.8125rem',
                  borderColor: mood === m.label ? '#6B7B5E' : 'rgba(0,0,0,0.07)',
                  backgroundColor: mood === m.label ? '#6B7B5E14' : 'transparent',
                  color: mood === m.label ? '#3D4A32' : '#8A8680',
                }}
                onClick={() => { setMood(m.label); setMoodEmoji(m.emoji); }}
                whileTap={{ scale: 0.94 }}
              >
                <span style={{ fontSize: '1rem' }}>{m.emoji}</span>
                <span>{m.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* 날씨 */}
        <section className="mb-5">
          <p className="text-[#B8B4AE] mb-2.5" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>날씨</p>
          <div className="flex flex-wrap gap-2">
            {DIARY_WEATHERS.map(w => (
              <motion.button
                key={w.label}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border whitespace-nowrap transition-colors"
                style={{
                  fontSize: '0.8125rem',
                  borderColor: weather === w.label ? '#6B7B5E' : 'rgba(0,0,0,0.07)',
                  backgroundColor: weather === w.label ? '#6B7B5E14' : 'transparent',
                  color: weather === w.label ? '#3D4A32' : '#8A8680',
                }}
                onClick={() => { setWeather(w.label); setWeatherEmoji(w.emoji); }}
                whileTap={{ scale: 0.94 }}
              >
                <span style={{ fontSize: '1rem' }}>{w.emoji}</span>
                <span>{w.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* 향수 선택 — 다중 선택 */}
        <section className="mb-5">
          <p className="text-[#B8B4AE] mb-2.5" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>오늘 뿌린 향수</p>

          {/* 선택된 향수 칩 목록 */}
          {selectedPerfumes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedPerfumes.map(p => (
                <motion.div
                  key={p.id}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #EFF3F7 0%, #F5F3EF 100%)', border: '1.5px solid rgba(139,164,184,0.2)' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                    <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[#1A1A1A]" style={{ fontSize: '0.8125rem' }}>{p.name}</span>
                  <motion.button
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'rgba(139,164,184,0.2)' }}
                    onClick={() => togglePerfume(p.id)}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={9} className="text-[#8A8680]" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}

          {/* 향수 추가 버튼 — 항상 표시 */}
          <motion.button
            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 border-dashed transition-colors hover:border-[#6B7B5E]"
            style={{ borderColor: '#E8E6E1' }}
            onClick={() => setShowPerfumeSheet(true)}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={14} className="text-[#B8B4AE]" />
            <span className="text-[#B8B4AE]" style={{ fontSize: '0.875rem' }}>
              {selectedPerfumes.length > 0 ? '향수 추가' : '향수 검색 또는 선택'}
            </span>
          </motion.button>
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
            {/* AI 버튼 */}
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

        {/* 사진 — 최대 3개 */}
        <section className="mb-5">
          <p className="text-[#B8B4AE] mb-2.5" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>사진 (최대 3개)</p>

          {/* 첨부된 사진들 */}
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

          {/* 사진 추가 버튼 — 3개 미만일 때만 표시 */}
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

        {/* 태그 */}
        <section className="mb-5">
          <p className="text-[#B8B4AE] mb-2.5" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>태그</p>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map(t => (
              <motion.button
                key={t}
                className="px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors"
                style={{
                  fontSize: '0.8125rem',
                  borderColor: tags.includes(t) ? '#6B7B5E' : 'rgba(0,0,0,0.07)',
                  backgroundColor: tags.includes(t) ? '#6B7B5E14' : 'transparent',
                  color: tags.includes(t) ? '#3D4A32' : '#8A8680',
                }}
                onClick={() => toggleTag(t)}
                whileTap={{ scale: 0.94 }}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </section>
      </div>

      {/* ── 하단 CTA ──────────────────────────────────── */}
      <div className="px-5 pt-3 pb-6 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <motion.button
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #6B7B5E 0%, #8FA380 100%)',
            boxShadow: '0 4px 16px rgba(107,123,94,0.3)',
          }}
          onClick={() => setStage('canvas')}
          whileTap={{ scale: 0.97 }}
        >
          <span style={{ fontSize: '1rem' }}>✦</span>
          <span className="text-white" style={{ fontSize: '0.9375rem' }}>캔버스에서 꾸미기</span>
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
                {filteredPerfumes.map(p => (
                  <motion.button
                    key={p.id}
                    className="w-full flex items-center gap-3 py-3 border-b last:border-b-0"
                    style={{ borderColor: '#F0EDE7' }}
                    onClick={() => {
                      togglePerfume(p.id);
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                      <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem', letterSpacing: '0.06em' }}>{p.brand.toUpperCase()}</p>
                      <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.9375rem' }}>{p.name}</p>
                    </div>
                    {selectedPerfumeIds.includes(p.id) && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#6B7B5E' }}>
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
                {filteredPerfumes.length === 0 && (
                  <p className="text-center text-[#B8B4AE] py-10" style={{ fontSize: '0.875rem' }}>{emptyMessage}</p>
                )}
              </div>

              {/* 완료 버튼 */}
              {selectedPerfumeIds.length > 0 && (
                <div className="px-5 pb-6 pt-2 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <motion.button
                    className="w-full py-3 rounded-2xl text-white flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #6B7B5E, #8FA380)', fontSize: '0.875rem' }}
                    onClick={() => { setShowPerfumeSheet(false); setPerfumeSearch(''); }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Check size={14} />
                    {selectedPerfumeIds.length}개 선택 완료
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

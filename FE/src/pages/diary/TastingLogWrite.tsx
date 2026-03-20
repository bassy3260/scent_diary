import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, Camera, X, Clock, Wind, Search } from 'lucide-react';
import { useAppStore } from '../../store';
import { mockPerfumes } from '../../constants/perfumes';
import {
  TASTING_SITUATIONS,
  TASTING_SEASONS,
  TASTING_MOODS,
} from '../../constants/ui.constants';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';

const TASTING_TAGS = ['클린', '우디', '플로럴', '시트러스', '아로마틱', '오리엔탈', '데일리', '오피스', '저녁', '갤러리', '데이트', '아침'];

function DotRating({ value, onChange, color = '#8BA4B8' }: { value: number; onChange: (v: number) => void; color?: string }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(i => (
        <motion.button
          key={i}
          className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
          style={{
            borderColor: i <= value ? color : '#E8E6E1',
            backgroundColor: i <= value ? color : 'transparent',
          }}
          onClick={() => onChange(i === value ? 0 : i)}
          whileTap={{ scale: 0.88 }}
        />
      ))}
    </div>
  );
}

export function TastingLogWrite() {
  const { navigateTo, addTastingLog } = useAppStore();

  const [selectedPerfumeId, setSelectedPerfumeId] = useState<string | null>(null);
  const [perfumeSearch, setPerfumeSearch] = useState('');
  const [situation, setSituation] = useState('');
  const [customSituation, setCustomSituation] = useState('');
  const [firstImpression, setFirstImpression] = useState('');
  const [laterImpression, setLaterImpression] = useState('');
  const [longevity, setLongevity] = useState(0);
  const [sillage, setSillage] = useState(0);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showPerfumeList, setShowPerfumeList] = useState(false);

  const selectedPerfume = mockPerfumes.find(p => p.id === selectedPerfumeId);
  const filteredPerfumes = mockPerfumes.filter(p =>
    p.name.toLowerCase().includes(perfumeSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(perfumeSearch.toLowerCase())
  );

  const toggleSeason = (s: string) =>
    setSeasons(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleMood = (m: string) =>
    setMoods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const canSave = firstImpression.length > 3;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const finalSituation = situation === '기타' ? customSituation : situation;
    addTastingLog({
      id: `t-${Date.now()}`,
      type: 'tasting',
      date: new Date().toISOString().slice(0, 10),
      perfumeId: selectedPerfumeId || undefined,
      situation: finalSituation,
      firstImpression,
      laterImpression,
      longevity,
      sillage,
      seasons,
      moods,
      note,
      tags,
      photoUrl: photoUrl || undefined,
    });
    navigateTo('diary');
  };

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: '#FAFAF8' }}>
      {/* Header */}
      <div className="pt-6 px-5 pb-3 flex items-center justify-between shrink-0">
        <motion.button
          className="w-9 h-9 rounded-full bg-[#F5F3EF] flex items-center justify-center"
          onClick={() => navigateTo('diary')}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={18} className="text-[#8A8680]" />
        </motion.button>
        <div className="text-center">
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.5rem', letterSpacing: '0.14em' }}>TASTING NOTE</p>
          <h3 className="text-[#1A1A1A]" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>시향 일지</h3>
        </div>
        <motion.button
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: canSave ? '#8BA4B8' : '#E8E6E1' }}
          onClick={handleSave}
          disabled={!canSave}
          whileTap={canSave ? { scale: 0.9 } : {}}
        >
          <Check size={16} className={canSave ? 'text-white' : 'text-[#B8B4AE]'} />
        </motion.button>
      </div>

      {/* Date strip */}
      <div className="px-5 pb-3 shrink-0">
        <div className="px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#EFF3F7' }}>
          <p className="text-[#8BA4B8] text-center" style={{ fontSize: '0.8125rem' }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10">

        {/* ── 향수 선택 ─────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>
            시향한 향수 <span className="text-[#8BA4B8]">*</span>
          </p>

          {selectedPerfume ? (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#EFF3F7,#F5F3EF)', border: '1.5px solid #8BA4B820' }}>
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <ImageWithFallback src={selectedPerfume.image} alt={selectedPerfume.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#8BA4B8] truncate" style={{ fontSize: '0.5625rem', letterSpacing: '0.06em' }}>{selectedPerfume.brand.toUpperCase()}</p>
                <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.9375rem' }}>{selectedPerfume.name}</p>
              </div>
              <motion.button
                className="w-7 h-7 rounded-full bg-[#8BA4B820] flex items-center justify-center shrink-0"
                onClick={() => setSelectedPerfumeId(null)}
                whileTap={{ scale: 0.9 }}
              >
                <X size={12} className="text-[#8A8680]" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              className="w-full p-3.5 rounded-2xl border-2 border-dashed flex items-center gap-2 transition-colors hover:border-[#8BA4B8]"
              style={{ borderColor: '#E8E6E1' }}
              onClick={() => setShowPerfumeList(true)}
              whileTap={{ scale: 0.98 }}
            >
              <Search size={16} className="text-[#B8B4AE] shrink-0" />
              <span className="text-[#B8B4AE]" style={{ fontSize: '0.875rem' }}>향수 검색 또는 선택</span>
            </motion.button>
          )}
        </div>

        {/* ── 시향 장소/상황 ─────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>시향 장소 / 상황</p>
          <div className="flex flex-wrap gap-1.5">
            {TASTING_SITUATIONS.map(s => (
              <motion.button
                key={s}
                className="px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors"
                style={{
                  fontSize: '0.8125rem',
                  borderColor: situation === s ? '#8BA4B8' : 'rgba(0,0,0,0.06)',
                  backgroundColor: situation === s ? '#8BA4B814' : 'transparent',
                  color: situation === s ? '#8BA4B8' : '#8A8680',
                }}
                onClick={() => setSituation(prev => prev === s ? '' : s)}
                whileTap={{ scale: 0.95 }}
              >
                {s}
              </motion.button>
            ))}
          </div>
          <AnimatePresence>
            {situation === '기타' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'tween', duration: 0.18 }}
                className="mt-2 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="직접 입력..."
                  value={customSituation}
                  onChange={e => setCustomSituation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl outline-none text-[#1A1A1A] placeholder:text-[#D4D0CA]"
                  style={{ fontSize: '0.875rem', backgroundColor: '#F5F3EF', border: '1px solid transparent' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 첫인상 ──────────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>
            첫인상 <span className="text-[#8BA4B8]">*</span>
          </p>
          <textarea
            className="w-full min-h-[100px] p-4 rounded-2xl outline-none resize-none text-[#1A1A1A] placeholder:text-[#D4D0CA]"
            style={{ fontSize: '0.875rem', lineHeight: 1.7, backgroundColor: '#F5F3EF', border: '1px solid transparent' }}
            placeholder="처음 뿌렸을 때 어떤 향이 느껴졌나요?"
            value={firstImpression}
            onChange={e => setFirstImpression(e.target.value)}
          />
        </div>

        {/* ── 잔향 ─────────────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>시간 경과 후 인상 (잔향)</p>
          <textarea
            className="w-full min-h-[80px] p-4 rounded-2xl outline-none resize-none text-[#1A1A1A] placeholder:text-[#D4D0CA]"
            style={{ fontSize: '0.875rem', lineHeight: 1.7, backgroundColor: '#F5F3EF', border: '1px solid transparent' }}
            placeholder="30분 ~ 2시간 후 어떻게 변했나요?"
            value={laterImpression}
            onChange={e => setLaterImpression(e.target.value)}
          />
        </div>

        {/* ── 지속력 / 확산력 ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-4 rounded-2xl" style={{ backgroundColor: '#EFF3F7' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <Clock size={13} className="text-[#8BA4B8]" />
              <p className="text-[#8BA4B8] whitespace-nowrap" style={{ fontSize: '0.6875rem' }}>지속력</p>
            </div>
            <DotRating value={longevity} onChange={setLongevity} />
            <p className="text-[#B8B4AE] mt-2" style={{ fontSize: '0.5625rem' }}>
              {longevity === 0 ? '평가 전' : longevity <= 2 ? '짧음' : longevity <= 3 ? '보통' : longevity <= 4 ? '좋음' : '매우 좋음'}
            </p>
          </div>
          <div className="p-4 rounded-2xl" style={{ backgroundColor: '#EFF3F7' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <Wind size={13} className="text-[#8BA4B8]" />
              <p className="text-[#8BA4B8] whitespace-nowrap" style={{ fontSize: '0.6875rem' }}>확산력</p>
            </div>
            <DotRating value={sillage} onChange={setSillage} />
            <p className="text-[#B8B4AE] mt-2" style={{ fontSize: '0.5625rem' }}>
              {sillage === 0 ? '평가 전' : sillage <= 2 ? '은은함' : sillage <= 3 ? '보통' : sillage <= 4 ? '풍성함' : '매우 강함'}
            </p>
          </div>
        </div>

        {/* ── 어울리는 계절 ─────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>어울리는 계절</p>
          <div className="flex gap-2">
            {TASTING_SEASONS.map(s => (
              <motion.button
                key={s}
                className="flex-1 py-2.5 rounded-xl border whitespace-nowrap transition-colors"
                style={{
                  fontSize: '0.8125rem',
                  borderColor: seasons.includes(s) ? '#8BA4B8' : 'rgba(0,0,0,0.06)',
                  backgroundColor: seasons.includes(s) ? '#8BA4B814' : '#F5F3EF',
                  color: seasons.includes(s) ? '#8BA4B8' : '#8A8680',
                }}
                onClick={() => toggleSeason(s)}
                whileTap={{ scale: 0.95 }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── 어울리는 무드 ─────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>어울리는 무드</p>
          <div className="flex flex-wrap gap-1.5">
            {TASTING_MOODS.map(m => (
              <motion.button
                key={m}
                className="px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors"
                style={{
                  fontSize: '0.8125rem',
                  borderColor: moods.includes(m) ? '#8BA4B8' : 'rgba(0,0,0,0.06)',
                  backgroundColor: moods.includes(m) ? '#8BA4B814' : 'transparent',
                  color: moods.includes(m) ? '#8BA4B8' : '#8A8680',
                }}
                onClick={() => toggleMood(m)}
                whileTap={{ scale: 0.95 }}
              >
                {m}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── 자유 메모 ─────────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>자유 메모</p>
          <textarea
            className="w-full min-h-[80px] p-4 rounded-2xl outline-none resize-none text-[#1A1A1A] placeholder:text-[#D4D0CA]"
            style={{ fontSize: '0.875rem', lineHeight: 1.7, backgroundColor: '#F5F3EF', border: '1px solid transparent' }}
            placeholder="구매 의향, 비교 향수, 어울리는 상황 등 자유롭게 기록해보세요"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {/* ── 사진 ──────────────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>사진</p>
          {photoUrl ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={photoUrl} alt="Uploaded" className="w-full h-40 object-cover" />
              <motion.button
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                style={{ backdropFilter: 'blur(8px)' }}
                onClick={() => setPhotoUrl(null)}
                whileTap={{ scale: 0.9 }}
              >
                <X size={14} className="text-white" />
              </motion.button>
            </div>
          ) : (
            <label>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              <motion.div
                className="w-full h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:border-[#8BA4B8]"
                style={{ borderColor: '#E8E6E1' }}
                whileTap={{ scale: 0.98 }}
              >
                <Camera size={20} className="text-[#B8B4AE]" />
                <p className="text-[#8A8680]" style={{ fontSize: '0.75rem' }}>사진 추가하기</p>
              </motion.div>
            </label>
          )}
        </div>

        {/* ── 태그 ──────────────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>태그</p>
          <div className="flex flex-wrap gap-1.5">
            {TASTING_TAGS.map(t => (
              <motion.button
                key={t}
                className="px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors"
                style={{
                  fontSize: '0.8125rem',
                  borderColor: tags.includes(t) ? '#8BA4B8' : 'rgba(0,0,0,0.06)',
                  backgroundColor: tags.includes(t) ? '#8BA4B814' : 'transparent',
                  color: tags.includes(t) ? '#8BA4B8' : '#8A8680',
                }}
                onClick={() => toggleTag(t)}
                whileTap={{ scale: 0.94 }}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 향수 선택 바텀시트 ─────────────────────────────── */}
      <AnimatePresence>
        {showPerfumeList && (
          <>
            <motion.div
              className="absolute inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPerfumeList(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
              style={{ backgroundColor: '#FAFAF8', maxHeight: '75%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.26, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#E8E6E1] mx-auto mb-4" />
                <p className="text-[#1A1A1A] mb-3" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>향수 선택</p>
                {/* Search */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#F5F3EF' }}>
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
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-8">
                {filteredPerfumes.map(p => (
                  <motion.button
                    key={p.id}
                    className="w-full flex items-center gap-3 py-3 border-b last:border-b-0"
                    style={{ borderColor: '#F5F3EF' }}
                    onClick={() => {
                      setSelectedPerfumeId(p.id);
                      setShowPerfumeList(false);
                      setPerfumeSearch('');
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                      <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem', letterSpacing: '0.06em' }}>{p.brand.toUpperCase()}</p>
                      <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.9375rem' }}>{p.name}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: selectedPerfumeId === p.id ? '#8BA4B8' : '#E8E6E1', backgroundColor: selectedPerfumeId === p.id ? '#8BA4B8' : 'transparent' }}>
                      {selectedPerfumeId === p.id && <Check size={10} className="text-white" />}
                    </div>
                  </motion.button>
                ))}
                {filteredPerfumes.length === 0 && (
                  <p className="text-center text-[#B8B4AE] py-8" style={{ fontSize: '0.875rem' }}>검색 결과가 없어요</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

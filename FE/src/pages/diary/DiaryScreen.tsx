import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Calendar, List, Plus, X, MapPin, Clock, Wind } from 'lucide-react';
import { useAppStore } from '../../store';
import { mockPerfumes } from '../../constants/perfumes';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import type { AnyDiaryEntry, CanvasElement, DiaryEntry, TastingLogEntry } from '../../types/diary.types';

type ViewMode = 'calendar' | 'list';
type TypeFilter = 'all' | 'diary' | 'tasting';

// ─── 타입 색상 / 레이블 ───────────────────────────────
const TYPE_CONFIG = {
  diary:   { label: '향수 일기', color: '#6B7B5E', bg: '#6B7B5E14', dot: '#6B7B5E' },
  tasting: { label: '시향 일지', color: '#8BA4B8', bg: '#8BA4B814', dot: '#8BA4B8' },
};

// ─── 별점 UI ──────────────────────────────────────────
function ScoreDots({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: i < value ? color : '#E8E6E1' }}
        />
      ))}
    </div>
  );
}

// ─── 향수 일기 카드 ────────────────────────────────────
function DiaryCard({ entry, onClick }: { entry: DiaryEntry; onClick: () => void }) {
  const perfume = mockPerfumes.find(p => p.id === entry.perfumeId);
  return (
    <motion.div
      className="mb-3 rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: 'linear-gradient(145deg, #FFFFFF, #F8F7F4)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '1.25rem' }}>{entry.moodEmoji}</span>
            <div>
              <span className="text-[#1A1A1A]" style={{ fontSize: '0.875rem' }}>{entry.mood}</span>
              <span className="text-[#B8B4AE] ml-1.5" style={{ fontSize: '0.75rem' }}>{entry.weatherEmoji}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
              {entry.date.slice(5).replace('-', '.')}
            </span>
            <span
              className="px-1.5 py-0.5 rounded-full"
              style={{ fontSize: '0.5625rem', letterSpacing: '0.02em', backgroundColor: TYPE_CONFIG.diary.bg, color: TYPE_CONFIG.diary.color }}
            >
              향수 일기
            </span>
          </div>
        </div>

        {/* Photo */}
        {entry.photoUrl && (
          <div className="mb-3 rounded-xl overflow-hidden">
            <img src={entry.photoUrl} alt="" className="w-full h-32 object-cover" />
          </div>
        )}

        {/* Note preview */}
        <p className="text-[#4A4A4A] mb-3"
          style={{ fontSize: '0.8125rem', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {entry.note}
        </p>

        {/* Bottom */}
        <div className="flex items-center justify-between">
          {perfume ? (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg overflow-hidden">
                <ImageWithFallback src={perfume.image} alt={perfume.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>{perfume.brand}</p>
                <p className="text-[#1A1A1A]" style={{ fontSize: '0.6875rem' }}>{perfume.name}</p>
              </div>
            </div>
          ) : <div />}
          <div className="flex gap-1">
            {entry.tags.slice(0, 2).map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-[#F5F3EF] text-[#8A8680]" style={{ fontSize: '0.5625rem' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── 시향 일지 카드 ────────────────────────────────────
function TastingCard({ entry, onClick }: { entry: TastingLogEntry; onClick: () => void }) {
  const perfume = mockPerfumes.find(p => p.id === entry.perfumeId);
  return (
    <motion.div
      className="mb-3 rounded-2xl overflow-hidden cursor-pointer relative"
      style={{ background: 'linear-gradient(145deg, #FFFFFF, #F6F8FA)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
    >
      {/* Dusty blue accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: '#8BA4B8' }} />

      <div className="pl-5 pr-4 py-4">
        {/* Top row */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex-1 min-w-0 pr-2">
            {perfume ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                  <ImageWithFallback src={perfume.image} alt={perfume.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-[#1A1A1A] truncate" style={{ fontSize: '0.875rem' }}>{perfume.name}</p>
                  <p className="text-[#B8B4AE]" style={{ fontSize: '0.625rem' }}>{perfume.brand}</p>
                </div>
              </div>
            ) : (
              <p className="text-[#8A8680]" style={{ fontSize: '0.875rem' }}>향수 미선택</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
              {entry.date.slice(5).replace('-', '.')}
            </span>
            <span
              className="px-1.5 py-0.5 rounded-full"
              style={{ fontSize: '0.5625rem', letterSpacing: '0.02em', backgroundColor: TYPE_CONFIG.tasting.bg, color: TYPE_CONFIG.tasting.color }}
            >
              시향 일지
            </span>
          </div>
        </div>

        {/* First impression */}
        <p className="text-[#4A4A4A] mb-2.5"
          style={{ fontSize: '0.8125rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {entry.firstImpression}
        </p>

        {/* Scores + Meta */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-[#B8B4AE]" />
              <span className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>지속력</span>
              <ScoreDots value={entry.longevity} color="#8BA4B8" />
            </div>
            <div className="flex items-center gap-1">
              <Wind size={10} className="text-[#B8B4AE]" />
              <span className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>확산력</span>
              <ScoreDots value={entry.sillage} color="#8BA4B8" />
            </div>
          </div>
          <div className="flex gap-1">
            {entry.seasons.slice(0, 2).map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded-full" style={{ fontSize: '0.5625rem', backgroundColor: '#EFF3F7', color: '#8BA4B8' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── 읽기 전용 캔버스 요소 ────────────────────────────
function ReadOnlyCanvasEl({ el, isDark }: { el: CanvasElement; isDark: boolean }) {
  const renderContent = () => {
    switch (el.type) {
      case 'photo':
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', background: '#FFF', padding: 4, boxShadow: '0 3px 12px rgba(0,0,0,0.15)' }}>
            <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, display: 'block' }} draggable={false} />
          </div>
        );
      case 'perfume':
        return (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg,#F5F3EF,#EFF3F7)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <img src={el.content} alt="" style={{ width: '68%', height: '68%', objectFit: 'contain' }} draggable={false} />
            {el.label && <p style={{ fontSize: '0.4375rem', color: '#8A8680', marginTop: 3, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.label}</p>}
          </div>
        );
      case 'text':
        return (
          <div style={{ width: '100%', height: '100%', padding: '8px 10px', fontSize: '0.75rem', lineHeight: 1.7, color: isDark ? 'rgba(255,255,255,0.9)' : '#2A2A2A', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)', borderRadius: 8, overflow: 'hidden', wordBreak: 'break-word', fontFamily: "'Playfair Display', serif" }}>
            {el.content}
          </div>
        );
      case 'sticker':
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.min(el.width, el.height) * 0.62, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', userSelect: 'none' }}>
            {el.content}
          </div>
        );
      case 'date-label':
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#9A9690', letterSpacing: '0.06em', fontFamily: "'Playfair Display', serif" }}>
            {el.content}
          </div>
        );
      case 'tag':
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(255,255,255,0.12)' : '#F5F3EF', borderRadius: 999, fontSize: '0.625rem', color: isDark ? 'rgba(255,255,255,0.7)' : '#8A8680', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingInline: 8 }}>
            {el.content}
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`, zIndex: el.zIndex, boxSizing: 'border-box', pointerEvents: 'none' }}>
      {renderContent()}
    </div>
  );
}

// ─── 읽기 전용 캔버스 뷰 ─────────────────────────────
function ReadOnlyCanvas({ elements, canvasBg }: { elements: CanvasElement[]; canvasBg: string }) {
  const isDark = canvasBg === '#1E1E1E';
  const maxBottom = elements.reduce((acc, el) => Math.max(acc, el.y + el.height + Math.abs(el.rotation) * 1.5), 280);
  const CANVAS_W = 320;
  const CANVAS_H = Math.max(320, maxBottom + 24);
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
        position: 'relative',
        backgroundColor: canvasBg,
        backgroundImage: isDark
          ? 'none'
          : 'radial-gradient(circle at 20% 80%, rgba(107,123,94,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,164,184,0.05) 0%, transparent 50%)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
      }}
    >
      {[...elements].sort((a, b) => a.zIndex - b.zIndex).map(el => (
        <ReadOnlyCanvasEl key={el.id} el={el} isDark={isDark} />
      ))}
    </div>
  );
}

// ─── 향수 일기 상세 ────────────────────────────────────
function DiaryDetail({ entry, onClose }: { entry: DiaryEntry; onClose: () => void }) {
  const hasCanvas = entry.canvasElements && entry.canvasElements.length > 0;
  const canvasBg = entry.canvasBg ?? '#FAFAF8';

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAFAF8' }}>
      {/* Header */}
      <div className="pt-5 px-5 pb-3 flex items-center justify-between shrink-0">
        <motion.button
          className="w-9 h-9 rounded-full bg-[#F5F3EF] flex items-center justify-center"
          onClick={onClose}
          whileTap={{ scale: 0.9 }}
        >
          <X size={16} className="text-[#8A8680]" />
        </motion.button>
        <span className="px-2.5 py-1 rounded-full text-[#6B7B5E]"
          style={{ fontSize: '0.6875rem', backgroundColor: TYPE_CONFIG.diary.bg }}>
          향수 일기
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto pb-10">

        {/* ── 캔버스 결과물 (메인 콘텐츠) ── */}
        {hasCanvas ? (
          <motion.div
            className="px-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'tween', duration: 0.35 }}
          >
            <ReadOnlyCanvas elements={entry.canvasElements!} canvasBg={canvasBg} />
          </motion.div>
        ) : (
          /* 캔버스 없을 때: 전통 방식으로 날짜·사진 표시 */
          <div className="px-5">
            <div className="text-center mb-5">
              <p className="text-[#B8B4AE] mb-1" style={{ fontSize: '0.75rem' }}>
                {new Date(entry.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span style={{ fontSize: '1.75rem' }}>{entry.moodEmoji}</span>
                <div className="text-left">
                  <p className="text-[#1A1A1A]" style={{ fontSize: '1.0625rem' }}>{entry.mood}</p>
                  <p className="text-[#B8B4AE]" style={{ fontSize: '0.75rem' }}>{entry.weatherEmoji} {entry.weather}</p>
                </div>
              </div>
            </div>
            {entry.photoUrl && (
              <div className="mb-5 rounded-2xl overflow-hidden">
                <img src={entry.photoUrl} alt="" className="w-full h-52 object-cover" />
              </div>
            )}
          </div>
        )}

        {/* ── AI 메모 (일기 본문) ── */}
        {entry.note && (
          <motion.div
            className="px-5 mt-5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'tween', duration: 0.35, delay: 0.12 }}
          >
            {/* 구분선 + 레이블 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: '#E8E6E1' }} />
              <span className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem', letterSpacing: '0.1em' }}>AI MEMO</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#E8E6E1' }} />
            </div>

            {/* 일기 본문 */}
            <div
              className="relative px-5 py-5 rounded-2xl"
              style={{
                background: 'linear-gradient(145deg, #FFFFFF, #F8F7F4)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
              }}
            >
              <span
                className="absolute top-3 left-4 select-none"
                style={{ fontSize: '2rem', lineHeight: 1, color: '#6B7B5E', opacity: 0.18, fontFamily: "'Playfair Display', serif" }}
              >
                "
              </span>
              <p
                className="text-[#2A2A2A] relative"
                style={{ fontSize: '0.9rem', lineHeight: 1.85, fontFamily: "'Playfair Display', serif", paddingTop: 4, zIndex: 1 }}
              >
                {entry.note}
              </p>
            </div>

            {/* 날짜 + 기분 푸터 */}
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem' }}>
                {new Date(entry.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="text-[#B8B4AE]" style={{ fontSize: '0.75rem' }}>
                {entry.moodEmoji} {entry.mood} · {entry.weatherEmoji} {entry.weather}
              </span>
            </div>

            {/* 태그 */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {entry.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-[#F5F3EF] text-[#8A8680]"
                    style={{ fontSize: '0.75rem' }}>{t}</span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── 시향 일지 상세 ────────────────────────────────────
function TastingDetail({ entry, onClose }: { entry: TastingLogEntry; onClose: () => void }) {
  const perfume = mockPerfumes.find(p => p.id === entry.perfumeId);
  return (
    <div className="flex flex-col h-full" style={{ background: '#FAFAF8' }}>
      {/* Header */}
      <div className="pt-5 px-5 pb-3 flex items-center justify-between">
        <motion.button
          className="w-9 h-9 rounded-full bg-[#F5F3EF] flex items-center justify-center"
          onClick={onClose}
          whileTap={{ scale: 0.9 }}
        >
          <X size={16} className="text-[#8A8680]" />
        </motion.button>
        <span className="px-2.5 py-1 rounded-full text-[#8BA4B8]"
          style={{ fontSize: '0.6875rem', backgroundColor: TYPE_CONFIG.tasting.bg }}>
          시향 일지
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {/* Perfume Hero */}
        {perfume ? (
          <div className="flex items-center gap-4 p-4 rounded-2xl mb-5"
            style={{ background: 'linear-gradient(135deg,#EFF3F7,#F5F3EF)' }}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
              <ImageWithFallback src={perfume.image} alt={perfume.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[#8BA4B8]" style={{ fontSize: '0.75rem' }}>{perfume.brand}</p>
              <p className="text-[#1A1A1A]" style={{ fontSize: '1.125rem', fontFamily: "'Playfair Display', serif" }}>{perfume.name}</p>
              <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', marginTop: 2 }}>{entry.date}</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl mb-5 bg-[#F5F3EF]">
            <p className="text-[#8A8680]" style={{ fontSize: '0.875rem' }}>향수 미선택</p>
          </div>
        )}

        {/* Situation */}
        {entry.situation && (
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={13} className="text-[#B8B4AE]" />
            <p className="text-[#8A8680]" style={{ fontSize: '0.8125rem' }}>{entry.situation}</p>
          </div>
        )}

        {/* Impressions */}
        <div className="space-y-3 mb-5">
          <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(145deg,#FFF,#F8F7F4)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <p className="text-[#B8B4AE] mb-1.5" style={{ fontSize: '0.625rem', letterSpacing: '0.08em' }}>첫인상</p>
            <p className="text-[#1A1A1A]" style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>{entry.firstImpression}</p>
          </div>
          {entry.laterImpression && (
            <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(145deg,#FFF,#F8F7F4)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <p className="text-[#B8B4AE] mb-1.5" style={{ fontSize: '0.625rem', letterSpacing: '0.08em' }}>시간 경과 후</p>
              <p className="text-[#1A1A1A]" style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>{entry.laterImpression}</p>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-4 rounded-2xl" style={{ backgroundColor: '#EFF3F7' }}>
            <div className="flex items-center gap-1 mb-2">
              <Clock size={12} className="text-[#8BA4B8]" />
              <p className="text-[#8BA4B8]" style={{ fontSize: '0.6875rem' }}>지속력</p>
            </div>
            <ScoreDots value={entry.longevity} color="#8BA4B8" />
            <p className="text-[#1A1A1A] mt-1" style={{ fontSize: '0.75rem' }}>{entry.longevity}/5</p>
          </div>
          <div className="p-4 rounded-2xl" style={{ backgroundColor: '#EFF3F7' }}>
            <div className="flex items-center gap-1 mb-2">
              <Wind size={12} className="text-[#8BA4B8]" />
              <p className="text-[#8BA4B8]" style={{ fontSize: '0.6875rem' }}>확산력</p>
            </div>
            <ScoreDots value={entry.sillage} color="#8BA4B8" />
            <p className="text-[#1A1A1A] mt-1" style={{ fontSize: '0.75rem' }}>{entry.sillage}/5</p>
          </div>
        </div>

        {/* Seasons & Moods */}
        <div className="mb-5">
          {entry.seasons.length > 0 && (
            <div className="mb-3">
              <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.625rem', letterSpacing: '0.08em' }}>어울리는 계절</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.seasons.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-full text-[#8BA4B8]"
                    style={{ fontSize: '0.75rem', backgroundColor: '#EFF3F7' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {entry.moods.length > 0 && (
            <div>
              <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.625rem', letterSpacing: '0.08em' }}>무드</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.moods.map(m => (
                  <span key={m} className="px-2.5 py-1 rounded-full bg-[#F5F3EF] text-[#8A8680]"
                    style={{ fontSize: '0.75rem' }}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Free note */}
        {entry.note && (
          <div className="p-4 rounded-2xl" style={{ backgroundColor: '#F5F3EF' }}>
            <p className="text-[#B8B4AE] mb-1.5" style={{ fontSize: '0.625rem', letterSpacing: '0.08em' }}>메모</p>
            <p className="text-[#4A4A4A]" style={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>{entry.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────
export function DiaryScreen() {
  const { diaryEntries, tastingLogs, navigateTo } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AnyDiaryEntry | null>(null);

  // Calendar month
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Data: use store entries directly (no fixture fallback)
  const allDiary = diaryEntries;
  const allTasting = tastingLogs;
  const allEntries: AnyDiaryEntry[] = [...allDiary, ...allTasting].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  // Filtered for list AND calendar (shared filter source)
  const filteredEntries =
    typeFilter === 'all' ? allEntries
    : typeFilter === 'diary' ? allEntries.filter(e => e.type === 'diary')
    : allEntries.filter(e => e.type === 'tasting');

  // Calendar date → type map — built from filteredEntries so filter is respected
  const dateTypeMap = new Map<string, { hasDiary: boolean; hasTasting: boolean }>();
  filteredEntries.forEach(entry => {
    const ex = dateTypeMap.get(entry.date) || { hasDiary: false, hasTasting: false };
    if (entry.type === 'diary') ex.hasDiary = true;
    else ex.hasTasting = true;
    dateTypeMap.set(entry.date, ex);
  });

  // Calendar grid
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  // Month stats — from filteredEntries so filter is respected
  const monthEntries = filteredEntries.filter(e => e.date.startsWith(monthStr));
  const monthDiaryCount = monthEntries.filter(e => e.type === 'diary').length;
  const monthTastingCount = monthEntries.filter(e => e.type === 'tasting').length;

  // Selected date entries — from filteredEntries so filter is respected
  const selectedDateEntries = selectedDate ? filteredEntries.filter(e => e.date === selectedDate) : [];

  const formatDateKey = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handleDateClick = (day: number) => {
    const key = formatDateKey(day);
    setSelectedDate(prev => prev === key ? null : key);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
  };

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: '#FAFAF8' }}>
      {/* ── 헤더 ──────────────────────────────────────── */}
      <div className="pt-6 px-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#B8B4AE]" style={{ fontSize: '0.6rem', letterSpacing: '0.12em' }}>SCENT DIARY</p>
            <h2 className="text-[#1A1A1A]" style={{ fontSize: '1.375rem', fontFamily: "'Playfair Display', serif" }}>
              향수 다이어리
            </h2>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ backgroundColor: '#F5F3EF' }}>
          {([
            { id: 'calendar' as ViewMode, Icon: Calendar, label: '캘린더' },
            { id: 'list' as ViewMode, Icon: List, label: '리스트' },
          ] as const).map(v => (
            <button
              key={v.id}
              className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
              style={{
                backgroundColor: viewMode === v.id ? '#FFFFFF' : 'transparent',
                color: viewMode === v.id ? '#1A1A1A' : '#8A8680',
                fontSize: '0.8125rem',
                boxShadow: viewMode === v.id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
              onClick={() => setViewMode(v.id)}
            >
              <v.Icon size={13} />
              {v.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5">
          {([
            { id: 'all' as TypeFilter, label: '전체' },
            { id: 'diary' as TypeFilter, label: '향수 일기' },
            { id: 'tasting' as TypeFilter, label: '시향 일지' },
          ] as const).map(f => {
            const active = typeFilter === f.id;
            const color = f.id === 'diary' ? '#6B7B5E' : f.id === 'tasting' ? '#8BA4B8' : '#1A1A1A';
            return (
              <button
                key={f.id}
                className="px-3 py-1.5 rounded-full transition-all"
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: active ? (f.id === 'all' ? '#1A1A1A' : f.id === 'diary' ? TYPE_CONFIG.diary.bg : TYPE_CONFIG.tasting.bg) : '#F5F3EF',
                  color: active ? (f.id === 'all' ? '#FFFFFF' : color) : '#8A8680',
                  border: active ? `1.5px solid ${f.id === 'all' ? '#1A1A1A' : color}20` : '1.5px solid transparent',
                }}
                onClick={() => { setTypeFilter(f.id); setSelectedDate(null); }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 콘텐츠 ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 pb-28">
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' ? (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4 mt-1">
                <motion.button
                  className="w-8 h-8 rounded-full bg-[#F5F3EF] flex items-center justify-center"
                  onClick={prevMonth} whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft size={16} className="text-[#8A8680]" />
                </motion.button>
                <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>{monthLabel}</p>
                <motion.button
                  className="w-8 h-8 rounded-full bg-[#F5F3EF] flex items-center justify-center"
                  onClick={nextMonth} whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft size={16} className="text-[#8A8680] rotate-180" />
                </motion.button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1.5">
                {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                  <div key={d} className="text-center text-[#B8B4AE]" style={{ fontSize: '0.625rem' }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;
                  const key = formatDateKey(day);
                  const types = dateTypeMap.get(key);
                  const isToday = day === today.getDate() && calYear === today.getFullYear() && calMonth === today.getMonth();
                  const isSelected = selectedDate === key;
                  return (
                    <motion.button
                      key={i}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 relative transition-colors"
                      style={{
                        backgroundColor: isSelected ? '#1A1A1A' : isToday ? '#6B7B5E12' : types ? '#F5F3EF' : 'transparent',
                        border: isToday && !isSelected ? '1.5px solid #6B7B5E30' : 'none',
                      }}
                      onClick={() => handleDateClick(day)}
                      whileTap={{ scale: 0.88 }}
                    >
                      <span style={{ fontSize: '0.75rem', color: isSelected ? '#FFFFFF' : isToday ? '#6B7B5E' : '#1A1A1A' }}>
                        {day}
                      </span>
                      {types && (
                        <div className="flex gap-0.5">
                          {types.hasDiary && (
                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? '#FFFFFF' : '#6B7B5E' }} />
                          )}
                          {types.hasTasting && (
                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? '#FFFFFF' : '#8BA4B8' }} />
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-3 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#6B7B5E]" />
                  <span className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>향수 일기</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#8BA4B8]" />
                  <span className="text-[#B8B4AE]" style={{ fontSize: '0.5625rem' }}>시향 일지</span>
                </div>
              </div>

              {/* Month stats */}
              <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: '#F5F3EF' }}>
                <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.625rem', letterSpacing: '0.08em' }}>이번 달 기록</p>
                <div className="flex gap-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#6B7B5E]" />
                    <span className="text-[#1A1A1A]" style={{ fontSize: '1.125rem' }}>{monthDiaryCount}</span>
                    <span className="text-[#8A8680]" style={{ fontSize: '0.6875rem' }}>향수 일기</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#8BA4B8]" />
                    <span className="text-[#1A1A1A]" style={{ fontSize: '1.125rem' }}>{monthTastingCount}</span>
                    <span className="text-[#8A8680]" style={{ fontSize: '0.6875rem' }}>시향 일지</span>
                  </div>
                </div>
              </div>

              {/* Selected date entries */}
              <AnimatePresence>
                {selectedDate && selectedDateEntries.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'tween', duration: 0.22 }}
                    className="mt-4 overflow-hidden"
                  >
                    <p className="text-[#8A8680] mb-3" style={{ fontSize: '0.75rem' }}>
                      {selectedDate.slice(5).replace('-', '월 ')}일의 기록
                    </p>
                    {selectedDateEntries.map(entry =>
                      entry.type === 'diary'
                        ? <DiaryCard key={entry.id} entry={entry} onClick={() => setSelectedEntry(entry)} />
                        : <TastingCard key={entry.id} entry={entry} onClick={() => setSelectedEntry(entry)} />
                    )}
                  </motion.div>
                )}
                {selectedDate && selectedDateEntries.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 text-center py-6"
                  >
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
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: 'tween' }}
                  >
                    {entry.type === 'diary'
                      ? <DiaryCard entry={entry} onClick={() => setSelectedEntry(entry)} />
                      : <TastingCard entry={entry} onClick={() => setSelectedEntry(entry)} />
                    }
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.button
          className="w-full mt-3 py-4 rounded-2xl flex items-center justify-center gap-2"
          style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', fontSize: '0.9375rem' }}
          onClick={() => setShowTypeSheet(true)}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Plus size={16} />
          오늘의 향 기록하기
        </motion.button>
      </div>

      {/* ── 타입 선택 바텀시트 ─────────────────────────── */}
      <AnimatePresence>
        {showTypeSheet && (
          <>
            <motion.div
              className="absolute inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTypeSheet(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-10"
              style={{ backgroundColor: '#FAFAF8' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-[#E8E6E1] mx-auto mb-5" />

              <p className="text-[#1A1A1A] mb-1" style={{ fontSize: '1.0625rem', fontFamily: "'Playfair Display', serif" }}>
                기록 타입을 선택해주세요
              </p>
              <p className="text-[#B8B4AE] mb-6" style={{ fontSize: '0.8125rem' }}>
                어떤 향의 이야기를 남길까요?
              </p>

              <div className="space-y-3">
                {/* 향수 일기 */}
                <motion.button
                  className="w-full p-4 rounded-2xl text-left transition-colors"
                  style={{ border: '1.5px solid #6B7B5E20', backgroundColor: '#6B7B5E08' }}
                  onClick={() => { setShowTypeSheet(false); navigateTo('diary-write'); }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#6B7B5E18' }}>
                      <span style={{ fontSize: '1.25rem' }}>📖</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>향수 일기</p>
                        <span className="px-1.5 py-0.5 rounded-full text-[#6B7B5E]"
                          style={{ fontSize: '0.5rem', backgroundColor: TYPE_CONFIG.diary.bg }}>감성형</span>
                      </div>
                      <p className="text-[#8A8680]" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                        오늘의 감정, 날씨, 하루를 향과 함께 기록해요
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* 시향 일지 */}
                <motion.button
                  className="w-full p-4 rounded-2xl text-left transition-colors"
                  style={{ border: '1.5px solid #8BA4B820', backgroundColor: '#8BA4B808' }}
                  onClick={() => { setShowTypeSheet(false); navigateTo('tasting-write'); }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#8BA4B818' }}>
                      <span style={{ fontSize: '1.25rem' }}>🧪</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>시향 일지</p>
                        <span className="px-1.5 py-0.5 rounded-full text-[#8BA4B8]"
                          style={{ fontSize: '0.5rem', backgroundColor: TYPE_CONFIG.tasting.bg }}>리뷰형</span>
                      </div>
                      <p className="text-[#8A8680]" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                        맡아본 향수에 대한 인상과 평가를 구조적으로 기록해요
                      </p>
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
          <motion.div
            className="absolute inset-0 z-50"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {selectedEntry.type === 'diary'
              ? <DiaryDetail entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
              : <TastingDetail entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Check, Type, Palette, Trash2,
  RotateCcw, RotateCw, Search, X, ChevronsUp,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { usePerfumeStore, useDiaryStore } from '../../store';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import type { CanvasElement } from '../../types/diary.types';
import type { PerfumeListItem } from '../../types/perfume.types';

// DiaryFormData — defined locally to avoid circular imports
export interface DiaryFormData {
  mood: string;
  moodEmoji: string;
  weather: string;
  weatherEmoji: string;
  note: string;
  selectedPerfumeId: number | null;
  perfume: PerfumeListItem | null;
  tags: string[];
  photoUrl: string | null;
  imageNames?: string[];
}

// ─── 스티커 팩 ────────────────────────────────────────
const STICKER_PACKS = [
  {
    name: '날씨',
    items: ['☀️', '🌤️', '⛅', '🌧️', '❄️', '🌈', '💨', '🌫️', '⭐', '🌙', '🌞', '🌀']
  },
  {
    name: '이모지',
    items: [
      '🌸', '🌿', '🌙', '✨', '💫', '🦋', '💭', '🍃', '🌊', '🔮', '🕯️', '🌻',
      '✦', '✧', '◌', '❋', '✿', '☽', '♡', '◇', '△', '∞', '⊹', '⋆',
      '🌹', '🪷', '🌺', '🌷', '🍵', '☕', '🫖', '🪴', '🎋', '🧴', '🪸', '🫧'
    ]
  },
];

// ─── 캔버스 배경 팔레트 ───────────────────────────────
const CANVAS_BGS = [
  { label: '크림', value: '#FAFAF8', dark: false },
  { label: '화이트', value: '#FFFFFF', dark: false },
  { label: '스카이', value: '#EFF3F7', dark: false },
  { label: '베이지', value: '#F5F0E8', dark: false },
  { label: '세이지', value: '#EEF3EE', dark: false },
  { label: '피치', value: '#F5EFEF', dark: false },
  { label: '라벤더', value: '#F0EEF5', dark: false },
  { label: '다크', value: '#1E1E1E', dark: true },
];

function createElementId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ─── 기본 캔버스 요소 생성 ─────────────────────────────
function generateDefaultElements(data: DiaryFormData): CanvasElement[] {
  const els: CanvasElement[] = [];
  let z = 1;

  // 날짜 라벨 (항상 상단 중앙)
  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  els.push({
    id: 'el-date',
    type: 'date-label',
    x: 55, y: 18,
    width: 210, height: 30,
    rotation: 0, zIndex: z++,
    content: dateStr,
  });

  // 사진 (좌상단)
  if (data.photoUrl) {
    els.push({
      id: 'el-photo',
      type: 'photo',
      x: 12, y: 58,
      width: 148, height: 118,
      rotation: -1.8, zIndex: z++,
      content: data.photoUrl,
    });
  }

  // 기분 스티커 (우상단)
  if (data.moodEmoji) {
    els.push({
      id: 'el-mood',
      type: 'sticker',
      x: data.photoUrl ? 235 : 250,
      y: 58,
      width: 54, height: 54,
      rotation: 8, zIndex: z++,
      content: data.moodEmoji,
    });
  }

  // 날씨 스티커 (기분 아래)
  if (data.weatherEmoji) {
    els.push({
      id: 'el-weather',
      type: 'sticker',
      x: data.photoUrl ? 248 : 262,
      y: 122,
      width: 44, height: 44,
      rotation: -5, zIndex: z++,
      content: data.weatherEmoji,
    });
  }

  // 기록 텍스트
  if (data.note) {
    els.push({
      id: 'el-text',
      type: 'text',
      x: 12,
      y: data.photoUrl ? 190 : 60,
      width: 210, height: 88,
      rotation: 0, zIndex: z++,
      content: data.note,
    });
  }

  // 향수 이미지
  if (data.perfume) {
    els.push({
      id: 'el-perfume',
      type: 'perfume',
      x: 200,
      y: data.photoUrl ? 205 : 160,
      width: 92, height: 92,
      rotation: 4, zIndex: z++,
      content: data.perfume.image,
      label: data.perfume.name,
    });
  }

  // 태그 칩
  const tagStartY = 18; // 날짜와 같은 y 위치
  data.tags.forEach((tag, i) => {
    const row = Math.floor(i / 2); // 2개씩 배치
    const col = i % 2;
    els.push({
      id: `el-tag-${i}`,
      type: 'tag',
      x: 185 + col * 62, // 날짜 옆 끝쪽
      y: tagStartY + row * 32,
      width: 56, height: 24,
      rotation: 0, zIndex: z++,
      content: tag,
    });
  });

  return els;
}

// ─── 캔버스 요소 렌더 컴포넌트 ────────────────────────
interface CanvasElementViewProps {
  el: CanvasElement;
  isSelected: boolean;
  isDragging: boolean;
  isDark: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onResizePointerDown: (e: React.PointerEvent) => void;
  onRotatePointerDown: (e: React.PointerEvent) => void;
  onDelete: () => void;
  onDoubleClick: () => void;
}

function CanvasElementView({
  el, isSelected, isDragging, isDark,
  onPointerDown, onResizePointerDown, onRotatePointerDown, onDelete, onDoubleClick,
}: CanvasElementViewProps) {
  const selBorder = isDark ? 'rgba(255,255,255,0.6)' : '#8BA4B8';

  const renderContent = () => {
    switch (el.type) {
      case 'photo':
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', background: '#FFF', padding: 4, boxShadow: '0 3px 12px rgba(0,0,0,0.15)' }}>
            <img
              src={el.content}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, display: 'block' }}
              draggable={false}
            />
          </div>
        );
      case 'perfume':
        return (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(145deg, #F5F3EF, #EFF3F7)',
            borderRadius: 16, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <img
              src={el.content}
              alt=""
              style={{ width: '68%', height: '68%', objectFit: 'contain' }}
              draggable={false}
            />
            {el.label && (
              <p style={{
                fontSize: '0.4375rem', color: '#8A8680',
                marginTop: 3, textAlign: 'center',
                maxWidth: '100%', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{el.label}</p>
            )}
          </div>
        );
      case 'text':
        return (
          <div style={{
            width: '100%', height: '100%',
            padding: '8px 10px',
            fontSize: '0.75rem', lineHeight: 1.7,
            color: isDark ? 'rgba(255,255,255,0.9)' : '#2A2A2A',
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)',
            borderRadius: 8,
            overflow: 'hidden', wordBreak: 'break-word',
            fontFamily: "'Playfair Display', serif",
          }}>
            {el.content}
          </div>
        );
      case 'sticker':
        return (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: Math.min(el.width, el.height) * 0.62,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
            userSelect: 'none',
          }}>
            {el.content}
          </div>
        );
      case 'date-label':
        return (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.625rem',
            color: isDark ? 'rgba(255,255,255,0.5)' : '#9A9690',
            letterSpacing: '0.06em',
            fontFamily: "'Playfair Display', serif",
          }}>
            {el.content}
          </div>
        );
      case 'tag':
        return (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDark ? 'rgba(255,255,255,0.12)' : '#F5F3EF',
            borderRadius: 999,
            fontSize: '0.625rem',
            color: isDark ? 'rgba(255,255,255,0.7)' : '#8A8680',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            paddingInline: 8,
          }}>
            {el.content}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: el.x, top: el.y,
        width: el.width, height: el.height,
        transform: `rotate(${el.rotation}deg)`,
        zIndex: el.zIndex,
        border: `2px solid ${isSelected ? selBorder : 'transparent'}`,
        borderRadius: 10,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxSizing: 'border-box',
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
    >
      {renderContent()}

      {/* 선택 핸들 */}
      {isSelected && (
        <>
          {/* 삭제 버튼 */}
          <div
            style={{
              position: 'absolute', top: -12, right: -12,
              width: 26, height: 26, borderRadius: '50%',
              background: '#E55',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10, cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
            onPointerDown={e => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          >
            <X size={12} color="white" />
          </div>

          {/* 리사이즈 핸들 */}
          <div
            style={{
              position: 'absolute', bottom: -7, right: -7,
              width: 18, height: 18, borderRadius: 4,
              background: '#8BA4B8',
              cursor: 'se-resize', zIndex: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
            onPointerDown={e => { e.preventDefault(); e.stopPropagation(); onResizePointerDown(e); }}
          />

          {/* 회전 핸들 */}
          <div
            style={{
              position: 'absolute', top: -7, left: -7,
              width: 18, height: 18, borderRadius: 4,
              background: '#8BA4B8',
              cursor: 'pointer', zIndex: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
            onPointerDown={e => { e.preventDefault(); e.stopPropagation(); onRotatePointerDown(e); }}
          />

          {/* 코너 마커 */}
          {[[-1,-1], [1,-1]].map(([sx, sy], i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: sy === -1 ? -5 : 'auto',
                bottom: sy === 1 ? -5 : 'auto',
                left: sx === -1 ? -5 : 'auto',
                right: sx === 1 ? -5 : 'auto',
                width: 8, height: 8, borderRadius: '50%',
                background: selBorder, zIndex: 10,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ─── 메인 캔버스 에디터 ────────────────────────────────
interface DiaryCanvasProps {
  formData: DiaryFormData;
  onBack: () => void;
}

export function DiaryCanvas({ formData, onBack }: DiaryCanvasProps) {
  const { navigateTo } = useAppStore();
  const { createDiary } = useDiaryStore();
  const { searchResults, searchPerfumes } = usePerfumeStore();

  const [elements, setElements] = useState<CanvasElement[]>(() => generateDefaultElements(formData));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasBg, setCanvasBg] = useState('#FAFAF8');
  const [isDark, setIsDark] = useState(false);

  // 모달 상태
  const [showStickerSheet, setShowStickerSheet] = useState(false);
  const [activeStickerTab, setActiveStickerTab] = useState(0);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showPerfumeSheet, setShowPerfumeSheet] = useState(false);
  const [perfumeSearch, setPerfumeSearch] = useState('');
  const [editingText, setEditingText] = useState<{ id: string; value: string } | null>(null);
  const [addingText, setAddingText] = useState(false);
  const [newTextValue, setNewTextValue] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // 드래그/리사이즈 refs
  const dragRef = useRef<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; w: number; h: number } | null>(null);
  const rotateRef = useRef<{ id: string; startX: number; startY: number } | null>(null);

  // 드래그/리사이즈 document 리스너
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        const id = dragRef.current.id;
        const elX = dragRef.current.elX;
        const elY = dragRef.current.elY;
        setElements(prev => prev.map(el =>
          el.id === id ? { ...el, x: elX + dx, y: elY + dy } : el
        ));
      }
      if (resizeRef.current) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        const id = resizeRef.current.id;
        const startW = resizeRef.current.w;
        const startH = resizeRef.current.h;
        setElements(prev => prev.map(el =>
          el.id === id
            ? { ...el, width: Math.max(40, startW + dx), height: Math.max(28, startH + dy) }
            : el
        ));
      }
      if (rotateRef.current) {
        const dx = e.clientX - rotateRef.current.startX;
        const dy = e.clientY - rotateRef.current.startY;
        const id = rotateRef.current.id;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        setElements(prev => prev.map(el =>
          el.id === id ? { ...el, rotation: angle } : el
        ));
      }
    };
    const onUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
      rotateRef.current = null;
      setDraggingId(null);
    };
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, []);

  const maxZIndex = elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) : 0;

  // 요소 핸들러
  const handleElementPointerDown = useCallback((e: React.PointerEvent, el: CanvasElement) => {
    e.preventDefault();
    e.stopPropagation();
    // 맨 앞으로
    const maxZ = Math.max(...elements.map(e => e.zIndex), 0);
    setElements(prev => prev.map(item =>
      item.id === el.id ? { ...item, zIndex: maxZ + 1 } : item
    ));
    setSelectedId(el.id);
    dragRef.current = {
      id: el.id,
      startX: e.clientX, startY: e.clientY,
      elX: el.x, elY: el.y,
    };
    setDraggingId(el.id);
  }, [elements]);

  const handleResizePointerDown = useCallback((e: React.PointerEvent, el: CanvasElement) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      id: el.id,
      startX: e.clientX, startY: e.clientY,
      w: el.width, h: el.height,
    };
  }, []);

  const handleRotatePointerDown = useCallback((e: React.PointerEvent, el: CanvasElement) => {
    e.preventDefault();
    e.stopPropagation();
    rotateRef.current = {
      id: el.id,
      startX: e.clientX, startY: e.clientY,
    };
  }, []);

  const handleCanvasPointerDown = () => {
    setSelectedId(null);
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedId(null);
  };

  const rotateElement = (id: string, delta: number) => {
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, rotation: el.rotation + delta } : el
    ));
  };

  const bringToFront = (id: string) => {
    const maxZ = Math.max(...elements.map(e => e.zIndex), 0);
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, zIndex: maxZ + 1 } : el
    ));
  };

  // 요소 추가
  const addSticker = (emoji: string) => {
    const newEl: CanvasElement = {
      id: createElementId('sticker'),
      type: 'sticker',
      x: randomBetween(60, 180), y: randomBetween(100, 200),
      width: 56, height: 56,
      rotation: randomBetween(-10, 10),
      zIndex: maxZIndex + 1,
      content: emoji,
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    setShowStickerSheet(false);
  };

  const addText = () => {
    if (!newTextValue.trim()) return;
    const newEl: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: 20, y: 150,
      width: 200, height: 80,
      rotation: 0,
      zIndex: maxZIndex + 1,
      content: newTextValue,
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    setNewTextValue('');
    setAddingText(false);
  };

  const addPerfume = (perfume: PerfumeListItem) => {
    const newEl: CanvasElement = {
      id: createElementId('perfume'),
      type: 'perfume',
      x: randomBetween(60, 140), y: randomBetween(80, 160),
      width: 90, height: 90,
      rotation: randomBetween(-5, 5),
      zIndex: maxZIndex + 1,
      content: perfume.image,
      label: perfume.name,
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    setShowPerfumeSheet(false);
    setPerfumeSearch('');
  };

  const confirmTextEdit = () => {
    if (!editingText) return;
    setElements(prev => prev.map(el =>
      el.id === editingText.id ? { ...el, content: editingText.value } : el
    ));
    setEditingText(null);
  };

  // 저장
  const handleSave = async () => {
    await createDiary({
      title: formData.note.slice(0, 30) || '오늘의 향',
      content: formData.note,
      perfumeId: formData.selectedPerfumeId ?? 0,
      imageNames: formData.imageNames,
    });
    navigateTo('diary');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (perfumeSearch.trim()) searchPerfumes(perfumeSearch.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [perfumeSearch, searchPerfumes]);

  const filteredPerfumes = searchResults;

  const selectedEl = elements.find(el => el.id === selectedId);
  const anyModal = showStickerSheet || showBgPicker || showPerfumeSheet || !!editingText || addingText;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#1A1A1A' }}>

      {/* ── 상단 바 ───────────────────────────────────── */}
      <div
        className="px-4 pt-6 pb-3 flex items-center justify-between shrink-0"
        style={{ background: '#1A1A1A' }}
      >
        <motion.button
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          onClick={onBack}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={18} className="text-white" />
        </motion.button>

        <div className="text-center">
          <p className="text-white/40" style={{ fontSize: '0.5rem', letterSpacing: '0.14em' }}>CANVAS</p>
          <p className="text-white" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>꾸미기</p>
        </div>

        <motion.button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
          style={{ backgroundColor: '#6B7B5E' }}
          onClick={handleSave}
          whileTap={{ scale: 0.92 }}
        >
          <Check size={13} className="text-white" />
          <span className="text-white" style={{ fontSize: '0.8125rem' }}>저장</span>
        </motion.button>
      </div>

      {/* ── 선택 요소 컨텍스트 툴바 ──────────────────── */}
      <AnimatePresence>
        {selectedEl && !anyModal && (
          <motion.div
            className="flex items-center justify-center gap-2 px-4 pb-2 shrink-0"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'tween', duration: 0.15 }}
          >
            <motion.button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              onClick={() => rotateElement(selectedEl.id, -15)}
              whileTap={{ scale: 0.9 }}
            >
              <RotateCcw size={13} className="text-white/70" />
              <span className="text-white/70" style={{ fontSize: '0.6875rem' }}>↺</span>
            </motion.button>
            <motion.button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              onClick={() => rotateElement(selectedEl.id, 15)}
              whileTap={{ scale: 0.9 }}
            >
              <RotateCw size={13} className="text-white/70" />
              <span className="text-white/70" style={{ fontSize: '0.6875rem' }}>↻</span>
            </motion.button>
            <motion.button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              onClick={() => bringToFront(selectedEl.id)}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronsUp size={13} className="text-white/70" />
              <span className="text-white/70" style={{ fontSize: '0.6875rem' }}>맨 앞</span>
            </motion.button>
            {selectedEl.type === 'text' && (
              <motion.button
                className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(139,164,184,0.3)' }}
                onClick={() => setEditingText({ id: selectedEl.id, value: selectedEl.content })}
                whileTap={{ scale: 0.9 }}
              >
                <Type size={12} className="text-[#8BA4B8]" />
                <span className="text-[#8BA4B8]" style={{ fontSize: '0.6875rem' }}>편집</span>
              </motion.button>
            )}
            <motion.button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(220,60,60,0.25)' }}
              onClick={() => deleteElement(selectedEl.id)}
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 size={12} className="text-[#FF7070]" />
              <span className="text-[#FF7070]" style={{ fontSize: '0.6875rem' }}>삭제</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 캔버스 아트보드 ───────────────────────────── */}
      <div className="flex-1 overflow-hidden px-3 pb-2 flex items-stretch">
        <div
          className="w-full rounded-2xl relative overflow-hidden"
          style={{
            backgroundColor: canvasBg,
            backgroundImage: isDark
              ? 'none'
              : 'radial-gradient(circle at 20% 80%, rgba(107,123,94,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,164,184,0.05) 0%, transparent 50%)',
          }}
          onPointerDown={handleCanvasPointerDown}
        >
          {/* 요소들 */}
          {[...elements].sort((a, b) => a.zIndex - b.zIndex).map(el => (
            <CanvasElementView
              key={el.id}
              el={el}
              isSelected={selectedId === el.id}
              isDragging={draggingId === el.id}
              isDark={isDark}
              onPointerDown={e => handleElementPointerDown(e, el)}
              onResizePointerDown={e => handleResizePointerDown(e, el)}
              onRotatePointerDown={e => handleRotatePointerDown(e, el)}
              onDelete={() => deleteElement(el.id)}
              onDoubleClick={() => {
                if (el.type === 'text') setEditingText({ id: el.id, value: el.content });
              }}
            />
          ))}

          {/* 빈 상태 힌트 */}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p style={{ color: '#C8C4BE', fontSize: '0.8125rem' }}>하단 도구로 요소를 추가해보세요</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 하단 툴바 ─────────────────────────────────── */}
      <div className="px-4 pt-2 pb-6 shrink-0">
        <div
          className="flex items-center justify-around px-2 py-3 rounded-2xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
          {/* 스티커 추가 */}
          <motion.button
            className="flex flex-col items-center gap-1"
            onClick={() => setShowStickerSheet(true)}
            whileTap={{ scale: 0.9 }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '1.125rem' }}>✨</span>
            </div>
            <span className="text-white/50 whitespace-nowrap" style={{ fontSize: '0.5625rem' }}>스티커</span>
          </motion.button>

          {/* 배경 변경 */}
          <motion.button
            className="flex flex-col items-center gap-1"
            onClick={() => setShowBgPicker(true)}
            whileTap={{ scale: 0.9 }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Palette size={18} className="text-white/70" />
            </div>
            <span className="text-white/50 whitespace-nowrap" style={{ fontSize: '0.5625rem' }}>배경</span>
          </motion.button>
        </div>
      </div>

      {/* ══════════════ 모달 레이어 ══════════════ */}

      {/* 스티커 바텀시트 */}
      <AnimatePresence>
        {showStickerSheet && (
          <>
            <motion.div
              className="absolute inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowStickerSheet(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl"
              style={{ backgroundColor: '#1C1C1E', maxHeight: '60%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="px-5 pt-4 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
                <p className="text-white mb-3" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>스티커</p>
                {/* 탭 */}
                <div className="flex gap-2 mb-3">
                  {STICKER_PACKS.map((pack, i) => (
                    <motion.button
                      key={pack.name}
                      className="px-3 py-1 rounded-full whitespace-nowrap"
                      style={{
                        fontSize: '0.75rem',
                        backgroundColor: activeStickerTab === i ? '#6B7B5E' : 'rgba(255,255,255,0.1)',
                        color: activeStickerTab === i ? '#FFF' : 'rgba(255,255,255,0.5)',
                      }}
                      onClick={() => setActiveStickerTab(i)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {pack.name}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: '200px' }}>
                <div className="grid grid-cols-6 gap-2">
                  {(STICKER_PACKS[activeStickerTab]?.items || []).map(emoji => (
                    <motion.button
                      key={emoji}
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.07)', fontSize: '1.5rem' }}
                      onClick={() => addSticker(emoji)}
                      whileTap={{ scale: 0.88 }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 배경 선택 바텀시트 */}
      <AnimatePresence>
        {showBgPicker && (
          <>
            <motion.div
              className="absolute inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBgPicker(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-4 pb-8"
              style={{ backgroundColor: '#1C1C1E' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
              <p className="text-white mb-4" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>배경 선택</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {CANVAS_BGS.map(bg => (
                  <motion.button
                    key={bg.value}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                    onClick={() => {
                      setCanvasBg(bg.value);
                      setIsDark(bg.dark);
                      setShowBgPicker(false);
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl"
                      style={{
                        backgroundColor: bg.value,
                        border: canvasBg === bg.value ? '2px solid #8BA4B8' : '2px solid rgba(255,255,255,0.15)',
                        boxShadow: canvasBg === bg.value ? '0 0 0 3px rgba(139,164,184,0.3)' : 'none',
                      }}
                    />
                    <span className="text-white/50 whitespace-nowrap" style={{ fontSize: '0.5625rem' }}>{bg.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 향수 선택 바텀시트 */}
      <AnimatePresence>
        {showPerfumeSheet && (
          <>
            <motion.div
              className="absolute inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowPerfumeSheet(false); setPerfumeSearch(''); }}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
              style={{ backgroundColor: '#1C1C1E', maxHeight: '70%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="px-5 pt-4 pb-3 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
                <p className="text-white mb-3" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>향수 추가</p>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Search size={14} className="text-white/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="향수명 또는 브랜드 검색"
                    value={perfumeSearch}
                    onChange={e => setPerfumeSearch(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-white/30"
                    style={{ fontSize: '0.875rem', color: '#FFF' }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-8">
                {filteredPerfumes.map(p => (
                  <motion.button
                    key={p.perfumeId}
                    className="w-full flex items-center gap-3 py-3 border-b last:border-b-0"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    onClick={() => addPerfume(p)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                      <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white/40" style={{ fontSize: '0.5625rem' }}>{p.brand}</p>
                      <p className="text-white truncate" style={{ fontSize: '0.9375rem' }}>{p.name}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 텍스트 추가 모달 */}
      <AnimatePresence>
        {addingText && (
          <>
            <motion.div
              className="absolute inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddingText(false)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-4 pb-8"
              style={{ backgroundColor: '#1C1C1E' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
              <p className="text-white mb-3" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>텍스트 추가</p>
              <textarea
                className="w-full min-h-[90px] p-4 rounded-xl outline-none resize-none placeholder:text-white/30"
                style={{ fontSize: '0.9375rem', lineHeight: 1.7, backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', fontFamily: "'Playfair Display', serif" }}
                placeholder="캔버스에 남길 문장을 입력하세요..."
                value={newTextValue}
                onChange={e => setNewTextValue(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <motion.button
                  className="flex-1 py-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}
                  onClick={() => { setAddingText(false); setNewTextValue(''); }}
                  whileTap={{ scale: 0.97 }}
                >
                  취소
                </motion.button>
                <motion.button
                  className="flex-1 py-3 rounded-xl"
                  style={{ backgroundColor: newTextValue.trim() ? '#6B7B5E' : 'rgba(255,255,255,0.08)', color: '#FFF', fontSize: '0.875rem' }}
                  onClick={addText}
                  disabled={!newTextValue.trim()}
                  whileTap={{ scale: 0.97 }}
                >
                  추가
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 텍스트 편집 모달 */}
      <AnimatePresence>
        {editingText && (
          <>
            <motion.div
              className="absolute inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={confirmTextEdit}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-4 pb-8"
              style={{ backgroundColor: '#1C1C1E' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
              <p className="text-white mb-3" style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>텍스트 편집</p>
              <textarea
                className="w-full min-h-[90px] p-4 rounded-xl outline-none resize-none placeholder:text-white/30"
                style={{ fontSize: '0.9375rem', lineHeight: 1.7, backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', fontFamily: "'Playfair Display', serif" }}
                value={editingText.value}
                onChange={e => setEditingText(prev => prev ? { ...prev, value: e.target.value } : null)}
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <motion.button
                  className="flex-1 py-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}
                  onClick={() => setEditingText(null)}
                  whileTap={{ scale: 0.97 }}
                >
                  취소
                </motion.button>
                <motion.button
                  className="flex-1 py-3 rounded-xl"
                  style={{ backgroundColor: '#6B7B5E', color: '#FFF', fontSize: '0.875rem' }}
                  onClick={confirmTextEdit}
                  whileTap={{ scale: 0.97 }}
                >
                  확인
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

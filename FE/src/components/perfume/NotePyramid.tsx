import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import type { PerfumeNotes } from '../../types/perfume.types';

interface NotePyramidProps {
  notes: PerfumeNotes;
  compact?: boolean;
}

// ── Color palette ──────────────────────────────────────────────────────────────
const LAYER_COLORS = [
  {
    front:  '#C8A84A', // amber gold
    shadow: '#A68828',
    bg:     'rgba(200,168,74,0.09)',
    border: 'rgba(200,168,74,0.30)',
    pill:   'rgba(200,168,74,0.15)',
    label:  '#7A5E10',
  },
  {
    front:  '#C07880', // dusty rose
    shadow: '#A05868',
    bg:     'rgba(192,120,128,0.09)',
    border: 'rgba(192,120,128,0.30)',
    pill:   'rgba(192,120,128,0.15)',
    label:  '#7A3048',
  },
  {
    front:  '#8AA8C4', // blue-gray slate
    shadow: '#6888A4',
    bg:     'rgba(138,168,196,0.09)',
    border: 'rgba(138,168,196,0.30)',
    pill:   'rgba(138,168,196,0.15)',
    label:  '#2E507A',
  },
];

const LAYERS_META = [
  { label: 'TOP',    korean: '탑 노트',    timing: '첫 15분'  },
  { label: 'MIDDLE', korean: '미들 노트',  timing: '2–4시간' },
  { label: 'BASE',   korean: '베이스 노트', timing: '6시간+'  },
];

// ── New clean flat pyramid coordinates ────────────────────────────────────
// ViewBox 0 0 280 200  |  Apex: (140,6)  |  Full base: y=194
// Half-width at y: ((y−6)/188) × 130
//
// TOP    y 6→68    triangle:   140,6   96,68   184,68
// MIDDLE y 72→136  trapezoid:  95,72   185,72  229,136  51,136
// BASE   y 140→194 trapezoid:  50,140  230,140 270,194  10,194
//
// 4 px transparent gap between each layer gives clean horizontal separation

const LAYERS_POLY = [
  { pts: '140,6 96,68 184,68' },                       // TOP
  { pts: '95,72 185,72 229,136 51,136' },              // MIDDLE
  { pts: '50,140 230,140 270,194 10,194' },            // BASE
];

// Label anchor positions (visual centroid of each shape)
const LBL2 = [
  { x: 140, y: 41,  sub: 56  },   // TOP
  { x: 140, y: 100, sub: 115 },   // MIDDLE
  { x: 140, y: 162, sub: 177 },   // BASE
];

// Right-side indicator dot Y positions
const DOT_Y2 = [41, 100, 162];

export function NotePyramid({ notes }: NotePyramidProps) {
  const [selectedLayer, setSelectedLayer] = useState<number>(0);
  const allNotes = [notes.top, notes.middle, notes.base];

  const op = (idx: number) => selectedLayer === idx ? 1 : 0.42;
  const tr = 'opacity 0.25s ease';

  return (
    <div>
      {/* ── Clean flat 3-layer pyramid SVG ──────────────────────────────── */}
      <div style={{ userSelect: 'none' }}>
        <svg
          viewBox="0 0 280 200"
          width="100%"
          style={{ display: 'block', maxHeight: 200 }}
          aria-label="향수 노트 피라미드"
        >
          <defs>
            {/* Per-layer top highlight */}
            <linearGradient id="lg-top" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="white" stopOpacity="0.28" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lg-mid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="white" stopOpacity="0.20" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lg-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="white" stopOpacity="0.14" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            {/* Soft white glow for active border */}
            <filter id="npglow2" x="-12%" y="-12%" width="124%" height="124%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5"
                floodColor="white" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* ── BASE ─────────────────────────────────── */}
          <polygon
            points={LAYERS_POLY[2].pts}
            fill={LAYER_COLORS[2].front}
            style={{ opacity: op(2), transition: tr, cursor: 'pointer' }}
            onClick={() => setSelectedLayer(2)}
          />
          <polygon
            points={LAYERS_POLY[2].pts}
            fill="url(#lg-base)"
            style={{ pointerEvents: 'none', opacity: op(2), transition: tr }}
          />

          {/* ── MIDDLE ───────────────────────────────── */}
          <polygon
            points={LAYERS_POLY[1].pts}
            fill={LAYER_COLORS[1].front}
            style={{ opacity: op(1), transition: tr, cursor: 'pointer' }}
            onClick={() => setSelectedLayer(1)}
          />
          <polygon
            points={LAYERS_POLY[1].pts}
            fill="url(#lg-mid)"
            style={{ pointerEvents: 'none', opacity: op(1), transition: tr }}
          />

          {/* ── TOP ──────────────────────────────────── */}
          <polygon
            points={LAYERS_POLY[0].pts}
            fill={LAYER_COLORS[0].front}
            style={{ opacity: op(0), transition: tr, cursor: 'pointer' }}
            onClick={() => setSelectedLayer(0)}
          />
          <polygon
            points={LAYERS_POLY[0].pts}
            fill="url(#lg-top)"
            style={{ pointerEvents: 'none', opacity: op(0), transition: tr }}
          />

          {/* ── Active-layer clean white border ──────── */}
          <polygon
            points={LAYERS_POLY[selectedLayer].pts}
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinejoin="round"
            filter="url(#npglow2)"
            style={{ pointerEvents: 'none', transition: 'all 0.25s ease' }}
          />

          {/* ── Text labels per layer ────────────────── */}
          {[0, 1, 2].map((idx) => (
            <g key={`lbl${idx}`} style={{ pointerEvents: 'none' }}>
              {/* Main label */}
              <text
                x={LBL2[idx].x}
                y={LBL2[idx].y}
                textAnchor="middle"
                fill="white"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.13em',
                  opacity: op(idx),
                  transition: tr,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {LAYERS_META[idx].label}
              </text>
              {/* Sub-label (timing) */}
              <text
                x={LBL2[idx].x}
                y={LBL2[idx].sub}
                textAnchor="middle"
                fill="rgba(255,255,255,0.85)"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.04em',
                  opacity: op(idx),
                  transition: tr,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {LAYERS_META[idx].timing}
              </text>
            </g>
          ))}

          {/* ── Animated right-side indicator dot ───── */}
          <motion.circle
            cx={272}
            cy={DOT_Y2[selectedLayer]}
            r={4}
            fill="white"
            stroke={LAYER_COLORS[selectedLayer].front}
            strokeWidth={1.5}
            layoutId="pyramid-indicator-dot"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        </svg>
      </div>

      {/* ── Layer selector tabs ──────────────────────────────────────── */}
      <div className="flex gap-2 mt-2">
        {LAYERS_META.map((meta, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedLayer(idx)}
            className="flex-1 py-1.5 rounded-full transition-all"
            style={{
              backgroundColor: selectedLayer === idx ? LAYER_COLORS[idx].front : 'transparent',
              border: `1.5px solid ${selectedLayer === idx ? LAYER_COLORS[idx].front : LAYER_COLORS[idx].border}`,
              fontSize: '0.6875rem',
              color: selectedLayer === idx ? 'white' : LAYER_COLORS[idx].label,
              fontWeight: selectedLayer === idx ? 700 : 400,
              letterSpacing: '0.02em',
            }}
          >
            {meta.korean}
          </button>
        ))}
      </div>

      {/* ── Notes detail card ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedLayer}
          className="mt-3 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: LAYER_COLORS[selectedLayer].bg,
            border: `1px solid ${LAYER_COLORS[selectedLayer].border}`,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
        >
          {/* Card header */}
          <div
            className="px-4 pt-3.5 pb-3 flex items-center gap-2"
            style={{ borderBottom: `1px solid ${LAYER_COLORS[selectedLayer].border}` }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: LAYER_COLORS[selectedLayer].front }}
            />
            <span
              className="text-[#1A1A1A]"
              style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}
            >
              {LAYERS_META[selectedLayer].korean}
            </span>
            <span
              className="ml-auto shrink-0 px-2 py-0.5 rounded-full"
              style={{
                fontSize: '0.625rem',
                color: LAYER_COLORS[selectedLayer].label,
                backgroundColor: LAYER_COLORS[selectedLayer].pill,
                letterSpacing: '0.02em',
              }}
            >
              {LAYERS_META[selectedLayer].timing}
            </span>
          </div>

          {/* Note pills */}
          <div className="px-4 pb-4 pt-3 flex flex-wrap gap-2">
            {allNotes[selectedLayer].map((note, idx) => (
              <motion.div
                key={note}
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.18 }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: LAYER_COLORS[selectedLayer].front }}
                />
                <span
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: LAYER_COLORS[selectedLayer].pill,
                    border: `1px solid ${LAYER_COLORS[selectedLayer].border}`,
                    fontSize: '0.75rem',
                    color: '#1A1A1A',
                    fontWeight: 600,
                  }}
                >
                  {note}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

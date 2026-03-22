/**
 * ScentLog Motion Design Tokens
 *
 * 앱 전체에서 일관된 모션 언어를 유지하기 위한 공통 설정.
 * - transform/opacity 중심 (GPU 가속, 60fps)
 * - spring은 절제: damping 높게, 통통 튀지 않게
 * - 맥락별 전환: 탭(fade) / 푸시(slide) / 시트(slide-up)
 */

const smoothEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const decelEase: [number, number, number, number] = [0, 0, 0.2, 1];

// Spring presets — 절제된 고급스러움
export const spring = {
  gentle: { type: 'spring' as const, stiffness: 260, damping: 28 },
  snappy: { type: 'spring' as const, stiffness: 400, damping: 32 },
};

// Tween presets
export const ease = {
  smooth: { duration: 0.3, ease: smoothEase },
  decel: { duration: 0.35, ease: decelEase },
};

// A. 탭 전환 — 짧은 페이드 + 미세한 스케일
export const tabVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.2, ease: smoothEase },
};

// B. 상세 진입 (push) — 오른쪽에서 슬라이드
export const pushVariants = {
  initial: { opacity: 0, x: 80 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.32, ease: smoothEase },
};

// C. 시트/모달 — 아래에서 올라옴
export const sheetVariants = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
  transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
};

// D. 기본 페이드 (launch 등)
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: 'easeInOut' as const },
};

/**
 * App.tsx — 앱 셸 (Application Shell)
 *
 * 이 파일의 책임은 딱 세 가지입니다:
 *  1. 현재 화면(screen)에 맞는 컴포넌트를 렌더링한다 → screenRegistry
 *  2. 화면 전환 애니메이션을 처리한다 → motion variants
 *  3. BottomNav 표시 여부를 결정하고 탭 전환을 처리한다
 *
 * 비즈니스 로직은 store 슬라이스로,
 * 화면 매핑은 navigation/screenRegistry로 이동했습니다.
 */
import { useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MobileFrame } from './components/layout/MobileFrame';
import { BottomNav, type TabId } from './components/layout/BottomNav';
import { useAppStore } from './store';
import { mockPerfumes } from './constants/perfumes';
import { tabVariants, pushVariants, sheetVariants, fadeVariants } from './motion';
import type { TransitionType } from './types';
import {
  renderScreen,
  getActiveTab,
  BOTTOM_NAV_SCREENS,
} from './navigation/screenRegistry';

function getVariants(type: TransitionType) {
  switch (type) {
    case 'tab':   return tabVariants;
    case 'push':  return pushVariants;
    case 'sheet': return sheetVariants;
    case 'fade':
    default:      return fadeVariants;
  }
}

export default function App() {
  const {
    screen, setScreen, navigateTo, goBack,
    selectedPerfumeId, transitionType,
    hasOnboarded, setHasOnboarded,
  } = useAppStore();

  // ─── 화면 전환 핸들러 ─────────────────────────────
  const onLaunchComplete = useCallback(() => {
    setScreen(hasOnboarded ? 'home' : 'onboarding');
  }, [hasOnboarded, setScreen]);

  const onOnboardingComplete = useCallback(() => {
    setScreen('auth-entry');
  }, [setScreen]);

  const onProfileComplete = useCallback(() => {
    setHasOnboarded(true);
    setScreen('home');
  }, [setHasOnboarded, setScreen]);

  const onEmotionComplete = useCallback(() => {
    navigateTo('analyzing');
  }, [navigateTo]);

  const onAnalyzingComplete = useCallback(() => {
    setScreen('results');
  }, [setScreen]);

  // screenRegistry에 전달할 핸들러 묶음
  const handlers = useMemo(() => ({
    onLaunchComplete,
    onOnboardingComplete,
    onProfileComplete,
    onEmotionComplete,
    onAnalyzingComplete,
    navigateTo,
    goBack,
  }), [onLaunchComplete, onOnboardingComplete, onProfileComplete,
      onEmotionComplete, onAnalyzingComplete, navigateTo, goBack]);

  // ─── 탭 전환 ──────────────────────────────────────
  const handleTabChange = useCallback((tab: TabId) => {
    const tabScreenMap: Record<TabId, Parameters<typeof setScreen>[0]> = {
      home:   'home',
      search: 'search',
      diary:  'diary',
      mypage: 'mypage',
    };
    setScreen(tabScreenMap[tab]);
  }, [setScreen]);

  // ─── 렌더링 ───────────────────────────────────────
  const selectedPerfume = mockPerfumes.find((p) => p.id === selectedPerfumeId);
  const showBottomNav = BOTTOM_NAV_SCREENS.includes(screen);
  const variants = useMemo(() => getVariants(transitionType), [transitionType]);

  return (
    <MobileFrame>
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen + (selectedPerfumeId || '')}
            className="w-full h-full"
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={variants.transition}
          >
            {renderScreen(screen, handlers, selectedPerfume)}
          </motion.div>
        </AnimatePresence>

        {showBottomNav && (
          <BottomNav
            activeTab={getActiveTab(screen)}
            onTabChange={handleTabChange}
          />
        )}
      </div>
    </MobileFrame>
  );
}

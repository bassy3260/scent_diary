/**
 * screenRegistry.tsx — 화면 레지스트리
 *
 * "어떤 screen 이름이 어떤 컴포넌트를 렌더링하는가"를 단일 파일로 관리합니다.
 *
 * 분리 이유:
 *  - App.tsx가 라우팅 셸 역할에만 집중할 수 있게 합니다.
 *  - 새 화면 추가 시 이 파일과 types(Screen 타입)만 수정하면 됩니다.
 *  - 화면과 탭의 관계, BottomNav 표시 여부도 이 파일에서 선언적으로 관리합니다.
 *
 * 사용법:
 *   const el = renderScreen(screen, handlers, selectedPerfume);
 */
import type { Screen } from '../types';
import type { TabId } from '../components/layout/BottomNav';

// ─── Screen 컴포넌트 imports ───────────────────────────
import { LaunchScreen }        from '../pages/onboarding/LaunchScreen';
import { OnboardingScreen }    from '../pages/onboarding/OnboardingScreen';
import { AuthEntryScreen }     from '../pages/auth/AuthEntryScreen';
import { LoginScreen }         from '../pages/auth/LoginScreen';
import { SignUpScreen }        from '../pages/auth/SignUpScreen';
import { ProfileSetupScreen }  from '../pages/auth/ProfileSetupScreen';
import { RecommendTab }        from '../pages/recommendation/RecommendTab';
import { TextRecommendChoice } from '../pages/recommendation/TextRecommendChoice';
import { RecommendPreStep }    from '../pages/recommendation/RecommendPreStep';
import { EmotionInput }        from '../pages/recommendation/EmotionInput';
import { AnalyzingScene }      from '../pages/recommendation/AnalyzingScene';
import { ResultsScreen }       from '../pages/recommendation/ResultsScreen';
import { PhotoRecommend }      from '../pages/recommendation/PhotoRecommend';
import { PerfumeDetail }       from '../components/perfume/PerfumeDetail';
import { CollectionScreen }    from '../pages/collection/CollectionScreen';
import { MyCollectionScreen }  from '../pages/collection/MyCollectionScreen';
import { SearchScreen }        from '../pages/perfume/SearchPage';
import { DiaryScreen }         from '../pages/diary/DiaryScreen';
import { DiaryWrite }          from '../pages/diary/DiaryWrite';
import { TastingLogWrite }     from '../pages/diary/TastingLogWrite';
import { MyPage }              from '../pages/mypage/MyPage';
import { TasteProfile }        from '../pages/mypage/TasteProfile';
import { HistoryScreen }       from '../pages/mypage/HistoryScreen';
import { SettingsScreen }      from '../pages/mypage/SettingsScreen';
import type { Perfume }        from '../types';

// ─── Handlers 타입 ────────────────────────────────────
export interface ScreenHandlers {
  onLaunchComplete: () => void;
  onOnboardingComplete: () => void;
  onProfileComplete: () => void;
  onEmotionComplete: () => void;
  onAnalyzingComplete: () => void;
  navigateTo: (screen: Screen) => void;
  goBack: () => void;
}

// ─── 화면 렌더러 ──────────────────────────────────────
export function renderScreen(
  screen: Screen,
  handlers: ScreenHandlers,
  selectedPerfume?: Perfume | null,
): React.ReactNode {
  const { onLaunchComplete, onOnboardingComplete, onProfileComplete,
          onEmotionComplete, onAnalyzingComplete, navigateTo, goBack } = handlers;

  switch (screen) {
    // 인증 플로우
    case 'launch':
      return <LaunchScreen onComplete={onLaunchComplete} />;
    case 'onboarding':
      return <OnboardingScreen onComplete={onOnboardingComplete} />;
    case 'auth-entry':
      return (
        <AuthEntryScreen
          onLogin={() => navigateTo('login')}
          onSignup={() => navigateTo('signup')}
        />
      );
    case 'login':
      return (
        <LoginScreen
          onBack={goBack}
          onComplete={() => navigateTo('profile')}
          onGoSignup={() => navigateTo('signup')}
        />
      );
    case 'signup':
      return <SignUpScreen onBack={goBack} onComplete={() => navigateTo('profile')} />;
    case 'profile':
      return <ProfileSetupScreen onComplete={onProfileComplete} />;

    // 홈(추천) 플로우
    case 'home':
      return <RecommendTab />;
    case 'text-choice':
      return <TextRecommendChoice onBack={goBack} />;
    case 'recommend-prestep':
      return <RecommendPreStep onComplete={() => navigateTo('emotion')} onBack={goBack} />;
    case 'emotion':
      return <EmotionInput onComplete={onEmotionComplete} onBack={goBack} />;
    case 'analyzing':
      return <AnalyzingScene onComplete={onAnalyzingComplete} />;
    case 'results':
      return <ResultsScreen />;
    case 'photo-recommend':
      return <PhotoRecommend />;

    // 향수 탐색
    case 'detail':
      return selectedPerfume
        ? <PerfumeDetail perfume={selectedPerfume} onBack={goBack} />
        : null;
    case 'collection':
      return <CollectionScreen />;
    case 'my-collection':
      return <MyCollectionScreen />;
    case 'search':
      return <SearchScreen />;

    // 다이어리
    case 'diary':
      return <DiaryScreen />;
    case 'diary-write':
      return <DiaryWrite />;
    case 'tasting-write':
      return <TastingLogWrite />;

    // 마이페이지
    case 'mypage':
      return <MyPage />;
    case 'taste-profile':
      return <TasteProfile />;
    case 'history':
      return <HistoryScreen />;
    case 'settings':
      return <SettingsScreen />;

    default:
      return null;
  }
}

// ─── 탭 결정 로직 ────────────────────────────────────
/**
 * 현재 screen에서 어떤 탭이 활성화되어야 하는지 결정합니다.
 * BottomNav와 getActiveTab 로직을 App.tsx 밖으로 분리했습니다.
 */
export function getActiveTab(screen: Screen): TabId {
  if (['home', 'text-choice', 'recommend-prestep', 'emotion', 'analyzing', 'photo-recommend'].includes(screen)) {
    return 'home';
  }
  if (screen === 'search') return 'search';
  if (['diary', 'diary-write', 'diary-detail', 'tasting-write'].includes(screen)) {
    return 'diary';
  }
  // results·history·collection 등은 마이페이지 탭에서 진입
  return 'mypage';
}

/**
 * BottomNav를 표시해야 하는 화면 목록.
 * 인증 플로우(launch, onboarding, auth-entry 등)에서는 숨깁니다.
 */
export const BOTTOM_NAV_SCREENS: Screen[] = [
  'home', 'results', 'search',
  'diary', 'mypage', 'collection', 'my-collection',
  'taste-profile', 'history',
];

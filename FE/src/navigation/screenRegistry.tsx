/**
 * screenRegistry.tsx screen registry
 */
import type { Screen } from "../types";
import type { TabId } from "../components/layout/BottomNav";

import { LaunchScreen } from "../pages/onboarding/LaunchScreen";
import { OnboardingScreen } from "../pages/onboarding/OnboardingScreen";
import { AuthEntryScreen } from "../pages/auth/AuthEntryScreen";
import { LoginScreen } from "../pages/auth/LoginScreen";
import { SignUpScreen } from "../pages/auth/SignUpScreen";
import { ProfileSetupScreen } from "../pages/auth/ProfileSetupScreen";
import { RecommendTab } from "../pages/recommendation/RecommendTab";
import { TextRecommendChoice } from "../pages/recommendation/TextRecommendChoice";
import { RecommendPreStep } from "../pages/recommendation/RecommendPreStep";
import { EmotionInput } from "../pages/recommendation/EmotionInput";
import { AnalyzingScene } from "../pages/recommendation/AnalyzingScene";
import { ResultsScreen } from "../pages/recommendation/ResultsScreen";
import { PhotoRecommend } from "../pages/recommendation/PhotoRecommend";
import { PerfumeDetail } from "../components/perfume/PerfumeDetail";
import { CollectionScreen } from "../pages/collection/CollectionScreen";
import { MyCollectionScreen } from "../pages/collection/MyCollectionScreen";
import { SearchScreen } from "../pages/perfume/SearchPage";
import { DiaryScreen } from "../pages/diary/DiaryScreen";
import { DiaryWrite } from "../pages/diary/DiaryWrite";
import { TastingLogWrite } from "../pages/diary/TastingLogWrite";
import { MyPage } from "../pages/mypage/MyPage";
import { TasteProfile } from "../pages/mypage/TasteProfile";
import { HistoryScreen } from "../pages/mypage/HistoryScreen";
import { SettingsScreen } from "../pages/mypage/SettingsScreen";
import type { Perfume } from "../types";

export interface ScreenHandlers {
  onLaunchComplete: () => void;
  onOnboardingComplete: () => void;
  onLoginComplete: () => void;
  onSignupComplete: () => void;
  onProfileComplete: () => void;
  onEmotionComplete: () => void;
  onAnalyzingComplete: () => void;
  navigateTo: (screen: Screen) => void;
  goBack: () => void;
}

export function renderScreen(
  screen: Screen,
  handlers: ScreenHandlers,
  _selectedPerfume?: Perfume | null,
): React.ReactNode {
  const {
    onLaunchComplete,
    onOnboardingComplete,
    onLoginComplete,
    onSignupComplete,
    onProfileComplete,
    onEmotionComplete,
    onAnalyzingComplete,
    navigateTo,
    goBack,
  } = handlers;

  switch (screen) {
    case "launch":
      return <LaunchScreen onComplete={onLaunchComplete} />;
    case "onboarding":
      return <OnboardingScreen onComplete={onOnboardingComplete} />;
    case "auth-entry":
      return (
        <AuthEntryScreen
          onLogin={() => navigateTo("login")}
          onSignup={() => navigateTo("signup")}
        />
      );
    case "login":
      return (
        <LoginScreen
          onBack={goBack}
          onComplete={onLoginComplete}
          onGoSignup={() => navigateTo("signup")}
        />
      );
    case "signup":
      return <SignUpScreen onBack={goBack} onComplete={onSignupComplete} />;
    case "profile":
      return <ProfileSetupScreen onComplete={onProfileComplete} />;

    case "home":
      return <RecommendTab />;
    case "text-choice":
      return <TextRecommendChoice onBack={goBack} />;
    case "recommend-prestep":
      return (
        <RecommendPreStep
          onComplete={() => navigateTo("emotion")}
          onBack={goBack}
        />
      );
    case "emotion":
      return <EmotionInput onComplete={onEmotionComplete} onBack={goBack} />;
    case "analyzing":
      return <AnalyzingScene onComplete={onAnalyzingComplete} />;
    case "results":
      return <ResultsScreen />;
    case "photo-recommend":
      return <PhotoRecommend />;

    case "detail":
      return <PerfumeDetail onBack={goBack} />;
    case "collection":
      return <CollectionScreen />;
    case "my-collection":
      return <MyCollectionScreen />;
    case "search":
      return <SearchScreen />;

    case "diary":
      return <DiaryScreen />;
    case "diary-write":
      return <DiaryWrite />;
    case "tasting-write":
      return <TastingLogWrite />;

    case "mypage":
      return <MyPage />;
    case "taste-profile":
      return <TasteProfile />;
    case "history":
      return <HistoryScreen />;
    case "settings":
      return <SettingsScreen />;

    default:
      return null;
  }
}

export function getActiveTab(screen: Screen): TabId {
  if (
    [
      "home",
      "text-choice",
      "recommend-prestep",
      "emotion",
      "analyzing",
      "photo-recommend",
    ].includes(screen)
  ) {
    return "home";
  }
  if (screen === "search") return "search";
  if (
    ["diary", "diary-write", "diary-detail", "tasting-write"].includes(screen)
  ) {
    return "diary";
  }
  return "mypage";
}

export const BOTTOM_NAV_SCREENS: Screen[] = [
  "home",
  "results",
  "search",
  "diary",
  "mypage",
  "collection",
  "my-collection",
  "taste-profile",
  "history",
];

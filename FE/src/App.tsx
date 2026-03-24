/**
 * App.tsx application shell
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MobileFrame } from "./components/layout/MobileFrame";
import { BottomNav, type TabId } from "./components/layout/BottomNav";
import { useAppStore } from "./store";
import {
  tabVariants,
  pushVariants,
  sheetVariants,
  fadeVariants,
} from "./motion";
import type { Screen, TransitionType } from "./types";
import {
  renderScreen,
  getActiveTab,
  BOTTOM_NAV_SCREENS,
} from "./navigation/screenRegistry";

const PUBLIC_SCREENS: Screen[] = [
  "launch",
  "onboarding",
  "auth-entry",
  "login",
  "signup",
  "profile",
];

const AUTH_ENTRY_SCREENS: Screen[] = [
  "onboarding",
  "auth-entry",
  "login",
  "signup",
  "profile",
];

function getVariants(type: TransitionType) {
  switch (type) {
    case "tab":
      return tabVariants;
    case "push":
      return pushVariants;
    case "sheet":
      return sheetVariants;
    case "fade":
    default:
      return fadeVariants;
  }
}

export default function App() {
  const {
    screen,
    setScreen,
    navigateTo,
    goBack,
    selectedPerfumeId,
    transitionType,
    hasOnboarded,
    setHasOnboarded,
    isAuthenticated,
    setAuthenticated,
    clearAuthState,
    fetchMe,
    initUserActivity
  } = useAppStore();

  const [hasCompletedLaunch, setHasCompletedLaunch] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(
    useAppStore.persist.hasHydrated(),
  );
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    setHasHydrated(useAppStore.persist.hasHydrated());

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let isCancelled = false;

    const restoreAuthentication = async () => {
      const storedToken = useAppStore.getState().accessToken;

      if (!storedToken) {
        clearAuthState();
        if (!isCancelled) {
          setIsAuthReady(true);
        }
        return;
      }

      try {
        setAuthenticated(storedToken);
        await fetchMe();
      } catch {
        if (!isCancelled) {
          clearAuthState();
        }
      } finally {
        if (!isCancelled) {
          setIsAuthReady(true);
        }
      }
    };

    void restoreAuthentication();

    return () => {
      isCancelled = true;
    };
  }, [clearAuthState, fetchMe, hasHydrated, setAuthenticated]);

  const onLaunchComplete = useCallback(() => {
    setHasCompletedLaunch(true);
  }, []);

  const onOnboardingComplete = useCallback(() => {
    setHasOnboarded(true);
    setScreen("auth-entry");
  }, [setHasOnboarded, setScreen]);

  const onLoginComplete = useCallback(() => {
    setScreen("home");
  }, [setScreen]);

  const onSignupComplete = useCallback(() => {
    setScreen("login");
  }, [setScreen]);

  const onProfileComplete = useCallback(() => {
    setHasOnboarded(true);
    setScreen("home");
  }, [setHasOnboarded, setScreen]);

  const onEmotionComplete = useCallback(() => {
    navigateTo("analyzing");
  }, [navigateTo]);

  const onAnalyzingComplete = useCallback(() => {
    setScreen("results");
  }, [setScreen]);

  useEffect(() => {
    initUserActivity();
  }, [initUserActivity]);

  useEffect(() => {
    if (!hasCompletedLaunch || !isAuthReady) {
      return;
    }

    if (screen === "launch") {
      if (isAuthenticated) {
        setScreen("home");
        return;
      }

      setScreen(hasOnboarded ? "auth-entry" : "onboarding");
      return;
    }

    if (isAuthenticated && AUTH_ENTRY_SCREENS.includes(screen)) {
      setScreen("home");
      return;
    }

    if (!isAuthenticated && !PUBLIC_SCREENS.includes(screen)) {
      setScreen(hasOnboarded ? "auth-entry" : "onboarding");
    }
  }, [
    hasCompletedLaunch,
    hasOnboarded,
    isAuthenticated,
    isAuthReady,
    screen,
    setScreen,
  ]);

  const handlers = useMemo(
    () => ({
      onLaunchComplete,
      onOnboardingComplete,
      onLoginComplete,
      onSignupComplete,
      onProfileComplete,
      onEmotionComplete,
      onAnalyzingComplete,
      navigateTo,
      goBack,
    }),
    [
      onLaunchComplete,
      onOnboardingComplete,
      onLoginComplete,
      onSignupComplete,
      onProfileComplete,
      onEmotionComplete,
      onAnalyzingComplete,
      navigateTo,
      goBack,
    ],
  );

  const handleTabChange = useCallback(
    (tab: TabId) => {
      const tabScreenMap: Record<TabId, Parameters<typeof setScreen>[0]> = {
        home: "home",
        search: "search",
        diary: "diary",
        mypage: "mypage",
      };
      setScreen(tabScreenMap[tab]);
    },
    [setScreen],
  );

  const selectedPerfume = null;
  const showBottomNav = BOTTOM_NAV_SCREENS.includes(screen);
  const variants = useMemo(() => getVariants(transitionType), [transitionType]);

  return (
    <MobileFrame>
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen + (selectedPerfumeId || "")}
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

import type { StateCreator } from 'zustand';
import type { Screen, TransitionType } from '../types/navigation.types';

export interface NavigationState {
  screen: Screen;
  prevScreen: Screen;
  transitionType: TransitionType;

  setScreen: (screen: Screen) => void;
  navigateTo: (screen: Screen) => void;
  pushTo: (screen: Screen) => void;
  sheetTo: (screen: Screen) => void;
  goBack: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createNavigationSlice: StateCreator<any, [], [], NavigationState> = (set) => ({
  screen: 'launch' as Screen,
  prevScreen: 'home' as Screen,
  transitionType: 'fade' as TransitionType,

  setScreen: (screen) => set({ screen, transitionType: 'tab' }),
  navigateTo: (screen) =>
    set((s: NavigationState) => ({ prevScreen: s.screen, screen, transitionType: 'fade' })),
  pushTo: (screen) =>
    set((s: NavigationState) => ({ prevScreen: s.screen, screen, transitionType: 'push' })),
  sheetTo: (screen) =>
    set((s: NavigationState) => ({ prevScreen: s.screen, screen, transitionType: 'sheet' })),
  goBack: () =>
    set((s: NavigationState) => ({ screen: s.prevScreen, transitionType: 'push' })),
});

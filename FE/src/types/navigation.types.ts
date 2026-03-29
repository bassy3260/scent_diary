export type Screen =
  | 'launch' | 'onboarding' | 'auth-entry' | 'login' | 'signup' | 'profile'
  | 'home' | 'text-choice' | 'recommend-prestep'
  | 'emotion' | 'analyzing' | 'results' | 'photo-recommend'
  | 'detail' | 'search' | 'collection' | 'my-collection'
  | 'diary' | 'diary-write' | 'diary-detail' | 'tasting-write'
  | 'mypage' | 'taste-profile' | 'history' | 'settings' | 'my-reviews';

export type TransitionType = 'tab' | 'push' | 'sheet' | 'fade';

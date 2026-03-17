export interface UserProfile {
  nickname: string;
  ageRange: string;
  gender: string;
  moodKeywords: string[];
  emotionText: string;
  tpo: string;
  priceRange: string;
  intensity: string;
  notePreference: string; // 'top' (첫향) | 'base' (잔향)
}

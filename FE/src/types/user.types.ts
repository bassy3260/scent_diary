export interface UserData {
  nickname: string;
  age: string;
  gender: string;
}

export interface UpdateUserRequest {
  password: string;
  birthYear: string;
  gender: string;
  nickname: string;
}

export interface UserProfile {
  nickname: string;
  age: string;
  ageRange: string;
  gender: string;
  moodKeywords: string[];
  emotionText: string;
  tpo: string;
  priceRange: string;
  intensity: string;
  notePreference: string;
}

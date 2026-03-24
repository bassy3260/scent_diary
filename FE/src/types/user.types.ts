import type { Gender } from "./auth.types";

export interface UserData {
  memberId?: number;
  id?: string;
  password?: string | null;
  nickname: string;
  birthYear?: number | null;
  age?: string;
  gender: Gender | string;
}

export interface UpdateUserRequest {
  password?: string;
  birthYear: number;
  gender: Gender;
  nickname: string;
}

export interface UserProfile {
  memberId: number | null;
  nickname: string;
  birthYear: number | null;
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

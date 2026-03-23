import type { Gender } from "../types/auth.types";
import type { UserData, UserProfile } from "../types/user.types";

const PROFILE_GENDER_LABELS: Record<Gender, string> = {
  FEMALE: "여성",
  MALE: "남성",
  NONE: "무관",
};

const REPRESENTATIVE_AGES_BY_RANGE: Record<string, number> = {
  "10대": 18,
  "20대 초반": 23,
  "20대 중반": 26,
  "20대 후반": 29,
  "30대": 34,
  "40대+": 45,
};

export function toProfileGender(gender?: string | null): string {
  const trimmed = gender?.trim();

  if (!trimmed) {
    return "";
  }

  const upper = trimmed.toUpperCase();

  if (upper === "FEMALE" || trimmed === "여자" || trimmed === "여성") {
    return PROFILE_GENDER_LABELS.FEMALE;
  }

  if (upper === "MALE" || trimmed === "남자" || trimmed === "남성") {
    return PROFILE_GENDER_LABELS.MALE;
  }

  if (upper === "NONE" || trimmed === "무관" || trimmed === "미설정") {
    return PROFILE_GENDER_LABELS.NONE;
  }

  return trimmed;
}

export function toApiGender(gender?: string | null): Gender {
  const trimmed = gender?.trim();

  if (!trimmed) {
    return "NONE";
  }

  const upper = trimmed.toUpperCase();

  if (upper === "FEMALE" || trimmed === "여자" || trimmed === "여성") {
    return "FEMALE";
  }

  if (upper === "MALE" || trimmed === "남자" || trimmed === "남성") {
    return "MALE";
  }

  return "NONE";
}

export function birthYearToAgeRange(
  birthYear?: number | null,
  referenceYear = new Date().getFullYear(),
): string {
  if (typeof birthYear !== "number" || Number.isNaN(birthYear)) {
    return "";
  }

  const age = referenceYear - birthYear + 1;

  if (age < 20) return "10대";
  if (age < 25) return "20대 초반";
  if (age < 28) return "20대 중반";
  if (age < 30) return "20대 후반";
  if (age < 40) return "30대";

  return "40대+";
}

export function ageRangeToBirthYear(
  ageRange?: string | null,
  referenceYear = new Date().getFullYear(),
): number | null {
  const trimmed = ageRange?.trim();

  if (!trimmed) {
    return null;
  }

  const representativeAge = REPRESENTATIVE_AGES_BY_RANGE[trimmed];

  if (!representativeAge) {
    return null;
  }

  return referenceYear - representativeAge + 1;
}

export function buildProfileUpdatesFromUser(
  user: UserData,
): Partial<UserProfile> {
  const ageRangeFromBirthYear = birthYearToAgeRange(user.birthYear);
  const ageRange = ageRangeFromBirthYear || user.age?.trim() || "";

  return {
    nickname: user.nickname ?? "",
    birthYear: typeof user.birthYear === "number" ? user.birthYear : null,
    age: ageRange,
    ageRange,
    gender: toProfileGender(user.gender),
  };
}

export type Gender = "FEMALE" | "MALE" | "NONE";

export interface LoginRequest {
  id: string;
  password: string;
}

export interface SignupRequest {
  id: string;
  password: string;
  nickname: string;
  birthYear: number;
  gender: Gender;
}

export interface LoginResponse {
  accessToken: string;
}

export interface AuthenticatedMember {
  memberId: number;
  id: string;
  password: string | null;
  birthYear: number;
  gender: Gender;
  nickname: string;
}

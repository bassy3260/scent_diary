/**
 * 인증 관련 API
 *
 * 현재는 로컬 상태(Zustand auth.store)로만 관리합니다.
 * API 연결 시 이 파일의 함수들을 실제 구현으로 교체하세요.
 */

import { apiClient } from './client';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  /** 이메일/비밀번호 로그인 */
  login: (body: LoginRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/login', body),

  /** 회원가입 */
  signup: (body: LoginRequest & { nickname: string }) =>
    apiClient.post<AuthResponse>('/api/v1/auth/signup', body),

  /** 로그아웃 */
  logout: () =>
    apiClient.post<void>('/api/v1/auth/logout'),

  /** 소셜 로그인 (카카오/구글) */
  socialLogin: (provider: 'kakao' | 'google', code: string) =>
    apiClient.post<AuthResponse>(`/api/v1/auth/${provider}`, { code }),
};

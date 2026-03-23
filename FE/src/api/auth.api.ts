import { apiClient } from "./client";
import type {
  AuthenticatedMember,
  LoginRequest,
  LoginResponse,
  SignupRequest,
} from "../types/auth.types";

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<LoginResponse>("/api/v1/auth/login", body, { auth: false }),

  signup: (body: SignupRequest) =>
    apiClient.post<void>("/api/v1/auth/signup", body, { auth: false }),

  getMe: () => apiClient.get<AuthenticatedMember>("/api/v1/users/me"),

  logout: () => apiClient.post<void>("/api/v1/auth/logout"),
};

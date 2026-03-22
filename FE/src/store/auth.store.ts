import type { StateCreator } from "zustand";
import { authApi } from "../api";

const AUTH_STORAGE_KEY = "scentlog.auth";

type PersistedAuthState = {
  accessToken: string | null;
  hasOnboarded: boolean;
};

export interface LoginRequest {
  id: string;
  password: string;
}

export interface SignupDraft {
  id: string;
  password: string;
  nickname: string;
}

export interface SignupPayload {
  birthYear?: number;
  age?: string;
  gender: string;
}

function readPersistedAuthState(): PersistedAuthState {
  if (typeof window === "undefined") {
    return {
      accessToken: null,
      hasOnboarded: false,
    };
  }

  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!stored) {
      return {
        accessToken: null,
        hasOnboarded: false,
      };
    }

    const parsed = JSON.parse(stored) as Partial<PersistedAuthState>;

    return {
      accessToken:
        typeof parsed.accessToken === "string" ? parsed.accessToken : null,
      hasOnboarded: parsed.hasOnboarded === true,
    };
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return {
      accessToken: null,
      hasOnboarded: false,
    };
  }
}

function persistAuthState(state: PersistedAuthState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

function toApiGender(gender: string): "FEMALE" | "MALE" | "NONE" {
  const normalized = gender.trim().toLowerCase();

  if (
    normalized === "female" ||
    normalized === "여성" ||
    normalized === "여자"
  ) {
    return "FEMALE";
  }

  if (normalized === "male" || normalized === "남성" || normalized === "남자") {
    return "MALE";
  }

  return "NONE";
}

function extractAccessToken(response: unknown): string {
  if (!response || typeof response !== "object") {
    throw new Error("로그인 응답이 올바르지 않습니다.");
  }

  const directToken =
    "accessToken" in response && typeof response.accessToken === "string"
      ? response.accessToken
      : null;

  if (directToken) {
    return directToken;
  }

  const wrappedData =
    "data" in response && response.data && typeof response.data === "object"
      ? response.data
      : null;

  if (
    wrappedData &&
    "accessToken" in wrappedData &&
    typeof wrappedData.accessToken === "string"
  ) {
    return wrappedData.accessToken;
  }

  throw new Error("accessToken을 찾을 수 없습니다.");
}

const initialPersistedAuthState = readPersistedAuthState();

export interface AuthState {
  hasOnboarded: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  signupDraft: SignupDraft | null;
  isAuthReady: boolean;
  isBootstrappingAuth: boolean;

  setHasOnboarded: (value: boolean) => void;
  setAuthenticated: (token: string) => void;
  clearAuthState: () => void;
  setSignupDraft: (draft: SignupDraft) => void;
  clearSignupDraft: () => void;
  bootstrapAuth: () => Promise<void>;
  login: (body: LoginRequest) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createAuthSlice: StateCreator<any, [], [], AuthState> = (
  set,
  get,
) => ({
  hasOnboarded: initialPersistedAuthState.hasOnboarded,
  isAuthenticated: Boolean(initialPersistedAuthState.accessToken),
  accessToken: initialPersistedAuthState.accessToken,
  signupDraft: null,
  isAuthReady: true,
  isBootstrappingAuth: false,

  setHasOnboarded: (value: boolean) => {
    set({ hasOnboarded: value });
    persistAuthState({
      accessToken: get().accessToken,
      hasOnboarded: value,
    });
  },

  setAuthenticated: (token: string) => {
    set({
      accessToken: token,
      isAuthenticated: true,
      isAuthReady: true,
      isBootstrappingAuth: false,
    });

    persistAuthState({
      accessToken: token,
      hasOnboarded: get().hasOnboarded,
    });
  },

  clearAuthState: () => {
    const { hasOnboarded } = get();

    set({
      accessToken: null,
      isAuthenticated: false,
      signupDraft: null,
      isAuthReady: true,
      isBootstrappingAuth: false,
    });

    persistAuthState({
      accessToken: null,
      hasOnboarded,
    });

    if (typeof get().resetProfile === "function") {
      get().resetProfile();
    }

    if (typeof get().resetMyPageState === "function") {
      get().resetMyPageState();
    }
  },

  setSignupDraft: (draft: SignupDraft) => {
    set({ signupDraft: draft });
  },

  clearSignupDraft: () => {
    set({ signupDraft: null });
  },

  bootstrapAuth: async () => {
    if (get().isBootstrappingAuth) return;

    const token = get().accessToken;

    if (!token) {
      set({
        isAuthenticated: false,
        isAuthReady: true,
        isBootstrappingAuth: false,
      });
      return;
    }

    set({
      isAuthenticated: true,
      isAuthReady: true,
      isBootstrappingAuth: false,
    });

    persistAuthState({
      accessToken: token,
      hasOnboarded: get().hasOnboarded,
    });
  },

  login: async (body: LoginRequest) => {
    set({
      isBootstrappingAuth: true,
      isAuthReady: false,
    });

    try {
      const loginApi = authApi.login as unknown as (
        payload: LoginRequest,
      ) => Promise<unknown>;
      const response = await loginApi(body);
      const accessToken = extractAccessToken(response);

      get().setAuthenticated(accessToken);
    } catch (error) {
      get().clearAuthState();
      throw error;
    } finally {
      set({
        isBootstrappingAuth: false,
        isAuthReady: true,
      });
    }
  },

  signup: async ({ birthYear, gender }: SignupPayload) => {
    const draft = get().signupDraft;

    if (!draft) {
      throw new Error("회원가입 초안 정보가 없어요. 다시 입력해 주세요.");
    }

    if (typeof birthYear !== "number") {
      throw new Error("출생연도 정보가 없어 회원가입을 완료할 수 없어요.");
    }

    const signupPayload = {
      id: draft.id,
      password: draft.password,
      nickname: draft.nickname,
      birthYear,
      gender: toApiGender(gender),
    };

    const signupApi = authApi.signup as unknown as (
      payload: typeof signupPayload,
    ) => Promise<unknown>;

    await signupApi(signupPayload);

    set({
      signupDraft: null,
    });

    if (typeof get().updateProfile === "function") {
      get().updateProfile({
        nickname: draft.nickname,
        gender,
      });
    }
  },

  logout: async () => {
    let logoutError: unknown;

    try {
      if (get().accessToken) {
        await authApi.logout();
      }
    } catch (error) {
      logoutError = error;
    } finally {
      get().clearAuthState();
    }

    if (logoutError) {
      throw logoutError;
    }
  },
});

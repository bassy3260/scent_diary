# ScentLog — 프론트엔드

향기록(ScentLog) 서비스의 프론트엔드 코드베이스입니다.

---

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| UI 프레임워크 | React 19 |
| 언어 | TypeScript 5 |
| 빌드 도구 | Vite 6 |
| 스타일링 | Tailwind CSS v4 |
| 상태 관리 | Zustand 5 |
| 애니메이션 | Motion (motion/react) |
| 아이콘 | lucide-react |

---

## 개발 환경 실행

```bash
cd FE
npm install
npm run dev      # http://127.0.0.1:5173
```

환경 변수는 `.env.local` 파일을 만들어 설정합니다:

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## 폴더 구조

```
FE/
├── index.html                  # Vite 진입점 (필수, 삭제 금지)
├── src/
│   ├── main.tsx                # React 앱 마운트 (index.html → #root)
│   ├── App.tsx                 # 앱 셸: 화면 전환 + 애니메이션 + BottomNav
│   ├── motion.ts               # 화면 전환 애니메이션 preset
│   │
│   ├── api/                    # ★ API 클라이언트 (백엔드 연동 시 여기를 수정)
│   │   ├── client.ts           # 기본 fetch 래퍼 (BASE_URL, 헤더, 에러 처리)
│   │   ├── auth.api.ts         # 로그인/회원가입 API
│   │   ├── perfume.api.ts      # 향수 목록/검색/상세 API
│   │   ├── recommendation.api.ts # 텍스트/사진 추천 API
│   │   ├── diary.api.ts        # 다이어리/테이스팅 로그 API
│   │   └── index.ts            # barrel export
│   │
│   ├── hooks/                  # 커스텀 훅 (API 훅, UI 유틸 훅 등)
│   │   └── index.ts
│   │
│   ├── pages/                  # 화면(Screen) 단위 컴포넌트
│   │   ├── auth/               # 로그인 · 회원가입 · 프로필 설정
│   │   ├── onboarding/         # 스플래시(LaunchScreen) + 온보딩 슬라이드
│   │   ├── recommendation/     # 홈(추천) 탭 전체 플로우
│   │   ├── perfume/            # 향수 검색(SearchPage)
│   │   ├── collection/         # 컬렉션 · 내 컬렉션
│   │   ├── diary/              # 다이어리 목록 · 작성 · 테이스팅 로그
│   │   └── mypage/             # 마이페이지 · 취향 프로필 · 히스토리 · 설정
│   │
│   ├── components/             # 재사용 가능한 UI 컴포넌트
│   │   ├── common/             # ImageWithFallback 등 범용 컴포넌트
│   │   ├── layout/             # MobileFrame (모바일 프레임 래퍼), BottomNav
│   │   ├── perfume/            # AccordChart, NotePyramid, PerfumeCard, PerfumeDetail
│   │   └── mypage/             # AgeGroupIllustrations, VibeIllustrations
│   │
│   ├── navigation/
│   │   └── screenRegistry.tsx  # screen 이름 → 컴포넌트 매핑 (라우팅 대신 사용)
│   │
│   ├── store/                  # Zustand 전역 상태
│   │   ├── index.ts            # 슬라이스를 하나의 store로 합성 + 선택자 export
│   │   ├── navigation.store.ts # 현재 screen, 전환 타입, 뒤로 가기 스택
│   │   ├── auth.store.ts       # 온보딩 여부, 인증 상태, accessToken
│   │   ├── user.store.ts       # 사용자 프로필
│   │   ├── perfume.store.ts    # 선택된 향수, 찜 목록, 내 컬렉션
│   │   ├── recommendation.store.ts # 추천 히스토리, 선물 모드
│   │   └── diary.store.ts      # 다이어리 항목, 테이스팅 로그
│   │
│   ├── types/                  # TypeScript 타입 정의
│   │   ├── index.ts            # barrel export (Screen 타입 포함)
│   │   ├── navigation.types.ts # Screen, TransitionType
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── perfume.types.ts
│   │   ├── recommendation.types.ts
│   │   ├── diary.types.ts
│   │   └── common.types.ts
│   │
│   ├── constants/              # 상수 및 더미 데이터
│   │   ├── perfumes.ts         # 향수 더미 데이터 (API 연결 시 제거 예정)
│   │   └── ui.constants.ts     # 드롭다운 목록, 태그, 메시지 등 UI 상수
│   │
│   └── styles/
│       ├── index.css           # 스타일 진입점 (main.tsx에서 import)
│       ├── tailwind.css        # Tailwind 지시어
│       ├── theme.css           # 디자인 토큰 (색상, 타이포그래피 CSS 변수)
│       └── fonts.css           # 웹폰트 설정
│
├── vite.config.ts              # Vite + Tailwind + React 플러그인 설정
├── tsconfig.json               # TypeScript 루트 설정 (app + node 참조)
├── tsconfig.app.json           # src/ 대상 TypeScript 설정
└── package.json
```

---

## 앱 동작 원리

### 라우터 없는 화면 전환

이 앱은 React Router를 사용하지 않습니다. 대신 **`screen` 문자열 상태**로 현재 화면을 관리합니다.

```
사용자 액션
    ↓
store.navigateTo('emotion')       ← navigation.store의 setScreen 호출
    ↓
App.tsx가 screen 변경을 감지
    ↓
screenRegistry.renderScreen(screen, handlers)
    ↓
해당 screen 컴포넌트를 motion 애니메이션으로 교체
```

**새 화면 추가 방법:**
1. `src/types/navigation.types.ts`의 `Screen` 타입에 새 이름 추가
2. `src/navigation/screenRegistry.tsx`의 `switch`에 케이스 추가
3. `src/pages/` 아래에 컴포넌트 파일 생성

### 화면 전환 애니메이션

`src/motion.ts`에서 4가지 전환 타입을 정의합니다:

| 타입 | 사용 상황 | 효과 |
|------|----------|------|
| `tab` | 탭 전환 | 페이드 + 미세 스케일 |
| `push` | 다음 단계로 이동 | 오른쪽에서 슬라이드 인 |
| `sheet` | 모달성 화면 | 아래에서 슬라이드 업 |
| `fade` | 기본 | 단순 페이드 |

### 상태 관리 (Zustand)

`store/index.ts`에서 6개의 슬라이스를 하나의 store로 합성합니다.
컴포넌트에서는 도메인별 선택자를 사용해 필요한 slice만 구독합니다:

```ts
// 전체 구독 (지양)
const state = useAppStore();

// 도메인별 선택자 (권장)
const { screen, navigateTo } = useNavigationStore();
const { isAuthenticated }    = useAuthStore();
const { selectedPerfumeId }  = usePerfumeStore();
```

### 상태 관리 기준

| 상태 유형 | 사용 도구 | 예시 |
|----------|---------|------|
| 여러 화면이 공유하는 상태 | Zustand | 현재 screen, 인증 토큰, 찜 목록 |
| 한 화면 안에서만 쓰는 상태 | `useState` | 입력값, 모달 열림 여부, 검색어 |

---

## 현재 화면 목록

| 그룹 | screen 이름 | 설명 |
|------|------------|------|
| 진입 | `launch` | 스플래시 |
| 진입 | `onboarding` | 온보딩 슬라이드 |
| 인증 | `auth-entry` | 로그인/회원가입 선택 |
| 인증 | `login` | 로그인 |
| 인증 | `signup` | 회원가입 |
| 인증 | `profile` | 프로필 설정 |
| 홈 | `home` | 추천 탭 (RecommendTab) |
| 홈 | `text-choice` | 텍스트 추천 방식 선택 |
| 홈 | `recommend-prestep` | 추천 사전 단계 |
| 홈 | `emotion` | 감정/키워드 입력 |
| 홈 | `analyzing` | 분석 중 화면 |
| 홈 | `results` | 추천 결과 |
| 홈 | `photo-recommend` | 사진 기반 추천 |
| 탐색 | `search` | 향수 검색 |
| 탐색 | `detail` | 향수 상세 |
| 탐색 | `collection` | 컬렉션 |
| 탐색 | `my-collection` | 내 컬렉션 |
| 다이어리 | `diary` | 다이어리 목록 |
| 다이어리 | `diary-write` | 다이어리 작성 |
| 다이어리 | `tasting-write` | 테이스팅 로그 작성 |
| 마이페이지 | `mypage` | 마이페이지 |
| 마이페이지 | `taste-profile` | 취향 프로필 |
| 마이페이지 | `history` | 추천 히스토리 |
| 마이페이지 | `settings` | 설정 |

---

## API 연동 가이드

현재는 `src/constants/perfumes.ts`의 더미 데이터를 사용합니다.
백엔드 API 연결 시 아래 순서로 작업합니다:

### 1. 환경 변수 설정

`.env.local` 파일 생성:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### 2. API 함수 구현

`src/api/*.api.ts` 파일에 실제 엔드포인트를 채워 넣습니다.
`src/api/client.ts`의 `apiClient`가 BASE_URL · 헤더 · 에러 처리를 자동으로 담당합니다.

```ts
// 사용 예
import { perfumeApi } from '../api';

const perfumes = await perfumeApi.getList();
```

### 3. 인증 토큰 처리

로그인 후 `accessToken`은 `auth.store.ts`에 저장됩니다.
API 요청 시 토큰을 헤더에 실어야 한다면 `src/api/client.ts`의 `request()` 함수를 수정합니다:

```ts
// client.ts 수정 예시
const token = useAppStore.getState().accessToken;
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

### 4. 더미 데이터 교체

`App.tsx`의 `mockPerfumes.find(...)` 부분을 실제 API 호출로 교체합니다.
각 store 슬라이스 액션에서 API를 호출하고 상태를 업데이트하는 방식으로 전환합니다.

---

## 주요 설계 특이사항

- **`index.html`은 삭제하면 안 됩니다.** Vite가 앱을 브라우저에 로드하기 위해 반드시 필요한 진입점입니다.
- **모바일 프레임**: `MobileFrame` 컴포넌트가 앱을 375px 모바일 화면으로 감쌉니다. 데스크탑에서도 모바일 UI처럼 보입니다.
- **Tailwind v4**: 별도 `tailwind.config.js` 없이 `@tailwindcss/vite` 플러그인으로 동작합니다. 커스텀 색상/토큰은 `src/styles/theme.css`의 `@theme` 블록에서 정의합니다.
- **더미 데이터**: `src/constants/perfumes.ts`는 API 연결 전까지의 임시 데이터입니다. 각 파일 상단 주석에 교체 방법이 안내되어 있습니다.

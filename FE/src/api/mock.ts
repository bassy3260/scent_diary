/**
 * API Mock 핸들러
 *
 * 개발/테스트 시 실제 API 서버 없이 더미 데이터를 반환합니다.
 * POST로 생성한 데이터는 인메모리 DB에 저장되어 GET 목록에 반영됩니다.
 *
 * 사용법:
 *   import { enableMocks } from './api/mock';
 *   enableMocks(); // main.tsx 등 앱 진입점에서 호출
 *
 * 해제:
 *   enableMocks(false);
 */

// ── 더미 향수 목록 (향수 검색 / 연결 시 사용) ─────────────────────────────────

const DUMMY_TOKEN = 'mock-access-token-for-testing';

const dummyUser = { nickname: '테스터', age: '20대', gender: '남성' };

const dummyPerfumes = [
  { perfumeId: 1, image: 'https://placehold.co/200x260?text=Chanel',   brand: 'Chanel',    name: 'Bleu de Chanel',        price: 120000, accords: ['woody', 'fresh', 'citrus'] },
  { perfumeId: 2, image: 'https://placehold.co/200x260?text=Dior',     brand: 'Dior',      name: 'Sauvage',               price: 140000, accords: ['fresh', 'aromatic', 'spicy'] },
  { perfumeId: 3, image: 'https://placehold.co/200x260?text=TomFord',  brand: 'Tom Ford',  name: 'Oud Wood',              price: 320000, accords: ['woody', 'smoky', 'warm spicy'] },
  { perfumeId: 4, image: 'https://placehold.co/200x260?text=JoMalone', brand: 'Jo Malone', name: 'Lime Basil & Mandarin', price: 180000, accords: ['citrus', 'aromatic', 'green'] },
];

function findPerfume(id: number) {
  return dummyPerfumes.find((p) => p.perfumeId === id) ?? dummyPerfumes[0];
}

// ── 인메모리 DB ────────────────────────────────────────────────────────────────

let diaryIdSeq = 3;
let tryDiaryIdSeq = 3;

// 향수 일기 목록 (초기 더미 2개)
const diaryDB: {
  diaryId: number; title: string; detail: string; createTime: string;
  diaryImage: { diaryImageUrl: string }[];
  perfume: { perfumeId: number; perfumeImageUrl: string; perfumeName: string; brand: string };
}[] = [
  {
    diaryId: 1,
    title: '오늘의 향수 일기',
    detail: '오늘은 Bleu de Chanel을 뿌렸다. 시트러스향이 상쾌했다.',
    createTime: '2025-03-15T09:00:00',
    diaryImage: [],
    perfume: { perfumeId: 1, perfumeImageUrl: dummyPerfumes[0].image, perfumeName: dummyPerfumes[0].name, brand: dummyPerfumes[0].brand },
  },
  {
    diaryId: 2,
    title: '주말 나들이',
    detail: 'Sauvage를 뿌리고 나갔다.',
    createTime: '2025-03-12T10:00:00',
    diaryImage: [],
    perfume: { perfumeId: 2, perfumeImageUrl: dummyPerfumes[1].image, perfumeName: dummyPerfumes[1].name, brand: dummyPerfumes[1].brand },
  },
];

// 시향 일지 목록 (초기 더미 2개)
const tryDiaryDB: {
  tryDiaryId: number; title: string; createTime: string;
  thumbnail: string; perfumeName: string; brand: string;
  tryItem: { perfumeId: number; perfumeImageUrl: string; perfumeName: string; brand: string; description: string }[];
}[] = [
  {
    tryDiaryId: 1,
    title: '백화점 시향 기록',
    createTime: '2025-03-14T15:00:00',
    thumbnail: dummyPerfumes[1].image,
    perfumeName: dummyPerfumes[1].name,
    brand: dummyPerfumes[1].brand,
    tryItem: [
      { perfumeId: 2, perfumeImageUrl: dummyPerfumes[1].image, perfumeName: dummyPerfumes[1].name, brand: dummyPerfumes[1].brand, description: '뿌리자마자 청량한 향이 확 퍼짐. 지속력도 좋고 남성적인 느낌.' },
      { perfumeId: 3, perfumeImageUrl: dummyPerfumes[2].image, perfumeName: dummyPerfumes[2].name, brand: dummyPerfumes[2].brand, description: '우디하고 묵직한 향. 겨울에 더 어울릴 것 같음.' },
    ],
  },
  {
    tryDiaryId: 2,
    title: '향수 매장 방문',
    createTime: '2025-03-10T13:00:00',
    thumbnail: dummyPerfumes[0].image,
    perfumeName: dummyPerfumes[0].name,
    brand: dummyPerfumes[0].brand,
    tryItem: [
      { perfumeId: 1, perfumeImageUrl: dummyPerfumes[0].image, perfumeName: dummyPerfumes[0].name, brand: dummyPerfumes[0].brand, description: '깔끔하고 세련된 향. 오피스 데일리로 딱이다.' },
    ],
  },
];

// ── 응답 헬퍼 ──────────────────────────────────────────────────────────────────

function ok<T>(data: T) {
  return new Response(JSON.stringify({ status: 200, message: 'success', data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function okBase(message = 'success') {
  return new Response(JSON.stringify({ status: 200, message }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function pageInfo<T>(list: T[]) {
  return { content: list, pageInfo: { totalElements: list.length, totalPages: 1, currentPage: 1 } };
}

// ── body 파싱 헬퍼 ─────────────────────────────────────────────────────────────

async function parseBody(init?: RequestInit): Promise<Record<string, unknown>> {
  if (!init?.body) return {};
  if (init.body instanceof FormData) {
    const diary = init.body.get('diary');
    if (typeof diary === 'string') return JSON.parse(diary) as Record<string, unknown>;
    return {};
  }
  if (typeof init.body === 'string') {
    try { return JSON.parse(init.body) as Record<string, unknown>; } catch { return {}; }
  }
  return {};
}

// ── URL 라우팅 ─────────────────────────────────────────────────────────────────

async function handleMockRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  const method = (init?.method ?? 'GET').toUpperCase();

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (url.includes('/api/v1/auth/login') && method === 'POST') {
    return ok({ accessToken: DUMMY_TOKEN });
  }
  if (url.includes('/api/v1/auth/signup') && method === 'POST') {
    return okBase('회원가입 성공');
  }
  if (url.includes('/api/v1/auth/logout') && method === 'POST') {
    return okBase('로그아웃 성공');
  }

  // ── User ──────────────────────────────────────────────────────────────────
  if (url.includes('/api/v1/users/me') && method === 'GET')    return ok(dummyUser);
  if (url.includes('/api/v1/users/me') && method === 'PUT')    return okBase('프로필 수정 성공');
  if (url.includes('/api/v1/users/me') && method === 'DELETE') return okBase('회원 탈퇴 성공');

  // ── Perfume ───────────────────────────────────────────────────────────────
  if (url.includes('/api/v1/perfume') && method === 'GET') {
    const idMatch = url.match(/\/api\/v1\/perfume\/(\d+)/);
    if (idMatch) {
      const p = findPerfume(Number(idMatch[1]));
      return ok({
        ...p,
        notes: { top: ['Lemon', 'Mint'], middle: ['Jasmine', 'Ginger'], base: ['Cedar', 'Vetiver'], single: [] },
        reviews: [
          { nickname: '향수러버', content: '정말 좋은 향이에요!', rating: 5, createdAt: '2025-03-10T10:00:00' },
          { nickname: '테스터99', content: '오래 지속되네요.',    rating: 4, createdAt: '2025-03-08T14:30:00' },
        ],
      });
    }
    return ok({ page: 1, size: 10, totalElements: dummyPerfumes.length, totalPages: 1, perfumes: dummyPerfumes });
  }
  if (url.includes('/api/v1/perfume/likes')   && method === 'POST') return okBase('좋아요 성공');
  if (url.includes('/api/v1/perfume/collect') && method === 'POST') return okBase('수집 성공');
  if (url.includes('/api/v1/perfume/review')  && method === 'POST') return okBase('리뷰 작성 성공');

  // ── My ────────────────────────────────────────────────────────────────────
  if (url.includes('/api/v1/my/likes') && method === 'GET') {
    const list = dummyPerfumes.slice(0, 2).map((p, i) => ({ ...p, likesId: i + 1 }));
    return ok({ page: 1, size: 10, totalElements: list.length, totalPages: 1, perfumes: list });
  }
  if (url.match(/\/api\/v1\/my\/likes\/\d+/)   && method === 'DELETE') return okBase('좋아요 삭제 성공');
  if (url.includes('/api/v1/my/perfume') && method === 'GET') {
    const list = dummyPerfumes.slice(1, 3).map((p, i) => ({ ...p, memberPerfumeId: i + 10 }));
    return ok({ page: 1, size: 10, totalElements: list.length, totalPages: 1, perfumes: list });
  }
  if (url.match(/\/api\/v1\/my\/perfume\/\d+/) && method === 'DELETE') return okBase('향수 삭제 성공');
  if (url.includes('/api/v1/my/review') && method === 'GET') {
    return ok({
      page: 1, size: 10, totalElements: 2, totalPages: 1,
      reviews: [
        { reviewId: 1, perfume: { perfumeId: 1, perfumeName: dummyPerfumes[0].name, brand: dummyPerfumes[0].brand, image: dummyPerfumes[0].image }, detail: '시트러스와 우디가 절묘하게 조화를 이뤄요.', rating: '5', createTime: '2025-03-10T10:00:00' },
        { reviewId: 2, perfume: { perfumeId: 2, perfumeName: dummyPerfumes[1].name, brand: dummyPerfumes[1].brand, image: dummyPerfumes[1].image }, detail: '남성적이고 신선한 향. 지속력이 좋아요.',     rating: '4', createTime: '2025-03-08T14:30:00' },
      ],
    });
  }
  if (url.match(/\/api\/v1\/my\/recommend\/\d+/) && method === 'GET') {
    return ok({
      createTime: '2025-03-15T12:00:00',
      input: { age: 25, keywords: ['청량한', '우디'], text: '봄날 산책할 때 어울리는 향수' },
      results: dummyPerfumes.slice(0, 2).map((p) => ({
        ...p, notes: { top: ['Lemon'], middle: ['Jasmine'], base: ['Cedar'] },
        reason: '봄날의 청량함과 우디한 베이스가 잘 어우러집니다.',
      })),
    });
  }
  if (url.includes('/api/v1/my/recommend') && method === 'GET') {
    return ok({
      page: 1, size: 10, totalElements: 1, totalPages: 1,
      recommendations: [{
        recommendResultId: 1, createTime: '2025-03-15T12:00:00',
        input: { age: 25, keywords: ['청량한', '우디'], text: '봄날 산책할 때 어울리는 향수' },
        results: dummyPerfumes.slice(0, 3).map((p) => ({ image: p.image, brand: p.brand, name: p.name })),
      }],
    });
  }

  // ── Recommendations ───────────────────────────────────────────────────────
  if (url.includes('/api/v1/recommend/text') && method === 'POST') {
    const body = await parseBody(init);
    return ok({
      createTime: new Date().toISOString(),
      input: { age: String(body.age ?? '20대'), keyword: String(body.keyword ?? '') },
      results: dummyPerfumes.slice(0, 3).map((p) => ({
        perfumeId: p.perfumeId, image: p.image, brand: p.brand, name: p.name,
        accords: p.accords,
        notes: { top: ['Lemon', 'Mint'], middle: ['Jasmine'], base: ['Cedar'], single: [] },
        reason: '키워드와 분위기가 잘 어울리는 향수입니다.',
      })),
    });
  }
  if (url.includes('/api/v1/recommend/image') && method === 'POST') {
    return ok({
      createTime: new Date().toISOString(),
      input: { image: 'uploaded_image.jpg' },
      results: dummyPerfumes.slice(1, 4).map((p) => ({
        perfumeId: p.perfumeId, image: p.image, brand: p.brand, name: p.name,
        accords: p.accords,
        notes: { top: ['Bergamot'], middle: ['Rose'], base: ['Musk'], single: [] },
        reason: '이미지의 분위기와 잘 어울리는 향수입니다.',
      })),
    });
  }
  if (url.includes('/api/v1/recommendations/history') && method === 'GET') {
    return ok([{ id: 'rec-001', date: '2025-03-15', emotionText: '봄날 산책할 때 어울리는 향수', conditions: { season: '봄', gender: '남성', ageRange: '20대', mood: ['청량한', '우디'] }, resultIds: ['1', '2'] }]);
  }

  // ── Diaries (인메모리 DB) ─────────────────────────────────────────────────
  if (url.includes('/api/v1/diaries') && method === 'GET') {
    const idMatch = url.match(/\/api\/v1\/diaries\/(\d+)/);
    if (idMatch) {
      const entry = diaryDB.find((d) => d.diaryId === Number(idMatch[1]));
      return entry ? ok(entry) : ok(diaryDB[0]);
    }
    const sorted = [...diaryDB].sort((a, b) => b.createTime.localeCompare(a.createTime));
    return ok(pageInfo(sorted));
  }
  if (url.includes('/api/v1/diaries') && method === 'POST') {
    const body = await parseBody(init);
    const perfumeId = Number(body.perfumeId ?? 0);
    const p = findPerfume(perfumeId);
    const newId = diaryIdSeq++;
    diaryDB.unshift({
      diaryId: newId,
      title: String(body.title ?? '새 일기'),
      detail: String(body.content ?? ''),
      createTime: new Date().toISOString(),
      diaryImage: [],
      perfume: { perfumeId: p.perfumeId, perfumeImageUrl: p.image, perfumeName: p.name, brand: p.brand },
    });
    console.log(`[Mock DB] 향수 일기 추가 → diaryId=${newId}, title="${body.title}", 총 ${diaryDB.length}개`);
    return ok({ diaryId: newId });
  }

  // ── Try Diary (인메모리 DB) ───────────────────────────────────────────────
  if (url.includes('/api/v1/try-diary') && method === 'GET') {
    const idMatch = url.match(/\/api\/v1\/try-diary\/(\d+)/);
    if (idMatch) {
      const entry = tryDiaryDB.find((d) => d.tryDiaryId === Number(idMatch[1]));
      return entry ? ok(entry) : ok(tryDiaryDB[0]);
    }
    const sorted = [...tryDiaryDB].sort((a, b) => b.createTime.localeCompare(a.createTime));
    return ok(pageInfo(sorted));
  }
  if (url.includes('/api/v1/try-diary') && method === 'POST') {
    const body = await parseBody(init);
    const tryItems = (body.tryItems ?? []) as { perfumeId: number; detail: string }[];
    const firstItem = tryItems[0];
    const firstPerfume = firstItem ? findPerfume(firstItem.perfumeId) : dummyPerfumes[0];
    const newId = tryDiaryIdSeq++;
    tryDiaryDB.unshift({
      tryDiaryId: newId,
      title: String(body.title ?? '새 시향 일지'),
      createTime: new Date().toISOString(),
      thumbnail: firstPerfume.image,
      perfumeName: firstPerfume.name,
      brand: firstPerfume.brand,
      tryItem: tryItems.map((item) => {
        const p = findPerfume(item.perfumeId);
        return { perfumeId: p.perfumeId, perfumeImageUrl: p.image, perfumeName: p.name, brand: p.brand, description: item.detail };
      }),
    });
    console.log(`[Mock DB] 시향 일지 추가 → tryDiaryId=${newId}, title="${body.title}", 총 ${tryDiaryDB.length}개`);
    return okBase('시향 일기 작성 성공');
  }

  return null; // mock 처리 안 함 → 실제 fetch로 넘어감
}

// ── fetch 패치 ─────────────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;

async function mockedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const mocked = await handleMockRequest(input, init);
  if (mocked) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = (init?.method ?? 'GET').toUpperCase();
    console.log(`[Mock API] ${method} ${url} → ${mocked.status}`);
    return mocked.clone();
  }
  return originalFetch(input, init);
}

// ── 공개 API ───────────────────────────────────────────────────────────────────

let enabled = false;

export function enableMocks(on = true) {
  if (on && !enabled) {
    globalThis.fetch = mockedFetch;
    enabled = true;
    console.log('[Mock API] 활성화됨 — POST로 생성한 데이터는 인메모리 DB에 반영됩니다.');
  } else if (!on && enabled) {
    globalThis.fetch = originalFetch;
    enabled = false;
    console.log('[Mock API] 비활성화됨 — 실제 API를 사용합니다.');
  }
}

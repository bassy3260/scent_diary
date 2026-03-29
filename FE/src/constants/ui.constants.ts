// ─── 프로필 설정 ──────────────────────────────────────
export const AGE_RANGES = ['10대', '20대 초반', '20대 중반', '20대 후반', '30대', '40대+'];
export const GENDERS = ['여성적', '남성적', '중성적'];
export const PROFILE_GENDERS = ['여성', '남성', '무관'];

export const PRICE_RANGES = [
  { label: '10만원 이하',     value: '~100000',       emoji: '💸', color: '#8BA4B8' },
  { label: '10만원 ~ 20만원', value: '100000~200000', emoji: '💰', color: '#6B7B5E' },
  { label: '20만원 ~ 30만원', value: '200000~300000', emoji: '💎', color: '#B8A88A' },
  { label: '30만원 이상',     value: '300000~',       emoji: '👑', color: '#C4A574' },
  { label: '가격 상관없음',   value: null,           emoji: '✨', color: '#B8A5C8' },
];

export const SEASONS = ['봄', '여름', '가을', '겨울', '사계절'];
export const SEASON_EMOJIS: Record<string, string> = {
  봄: '🌸', 여름: '☀️', 가을: '🍂', 겨울: '❄️', 사계절: '🌍',
};

// ─── 추천 플로우 ──────────────────────────────────────
export const MOOD_KEYWORDS = [
  { label: '상쾌한',   emoji: '💧', color: '#8BA4B8' },
  { label: '따뜻한',   emoji: '🔥', color: '#C4956A' },
  { label: '로맨틱',   emoji: '🌹', color: '#C8A5A5' },
  { label: '깨끗한',   emoji: '✨', color: '#E8E6E1' },
  { label: '자연적인', emoji: '🌿', color: '#A3B18A' },
  { label: '럭셔리',   emoji: '💎', color: '#B8A88A' },
  { label: '달콤한',   emoji: '🍯', color: '#D4C5A9' },
  { label: '관능적인', emoji: '🌙', color: '#B8A5C8' },
  { label: '우디한',   emoji: '🪵', color: '#6B7B5E' },
  { label: '산뜻한',   emoji: '❄️', color: '#8BA4B8' },
  { label: '신비로운', emoji: '🔮', color: '#B8A5C8' },
  { label: '우아한',   emoji: '🦢', color: '#D4C5A9' },
];

export const SAMPLE_PROMPTS = [
  '비 온 뒤 숲속 같은 향',
  '따뜻한 벽난로 옆 나무 오두막',
  '아침 햇살 속 깨끗한 흰 린넨',
  '한밤중 럭셔리 호텔 로비',
  '해질녘 장미 정원을 걷는 느낌',
  '고요한 해변의 시원한 바다 바람',
];

export const ANALYZING_MESSAGES = [
  '당신의 무드를 읽는 중...',
  '감정을 향 노트로 번역하는 중...',
  '향의 풍경을 그리는 중...',
  '당신의 말 속에서 하모니를 찾는 중...',
  '당신의 분위기에 맞는 향을 큐레이션하는 중...',
];

export const QUICK_TAGS = [
  '비 오는 날', '숲 산책', '깨끗한 세탁물', '나이트 아웃',
  '바다 바람', '따뜻한 포옹', '오래된 서재', '모닝 커피',
  '캔들 라이트', '봄날 정원', '실크 이불', '모닥불',
];

// ─── 다이어리 ─────────────────────────────────────────
export const DIARY_MOODS = [
  { label: '행복',   emoji: '😊' },
  { label: '평온',   emoji: '🌿' },
  { label: '설렘',   emoji: '✨' },
  { label: '차분',   emoji: '🌙' },
  { label: '에너지', emoji: '⚡' },
  { label: '로맨틱', emoji: '💕' },
  { label: '편안',   emoji: '☁️' },
  { label: '우울',   emoji: '🌧️' },
];

export const DIARY_WEATHERS = [
  { label: '맑음', emoji: '☀️' },
  { label: '흐림', emoji: '☁️' },
  { label: '비',   emoji: '🌧️' },
  { label: '눈',   emoji: '❄️' },
  { label: '바람', emoji: '💨' },
  { label: '안개', emoji: '🌫️' },
];

// ─── 탐색 ─────────────────────────────────────────────
export const POPULAR_NOTES = [
  'Sandalwood', 'Bergamot', 'Rose', 'Oud', 'Vetiver', 'Musk', 'Jasmine', 'Cedar',
];
export const TRENDING_TAGS = [
  '클린걸', '올드머니', '다크 아카데미아', '포근한 밤', '상쾌한 여름', '데이트',
];

// ─── 테이스팅 로그 ────────────────────────────────────
export const TASTING_SITUATIONS = [
  '백화점 향수 코너', '편집숍', '친구 집에서', '갤러리',
  '카페', '여행 중', '온라인 구매 전', '기타',
];
export const TASTING_SEASONS = ['봄', '여름', '가을', '겨울'];
export const TASTING_MOODS = [
  '상쾌한', '따뜻한', '로맨틱', '깨끗한', '자연적인',
  '럭셔리', '달콤한', '관능적인', '우디한', '신비로운',
];

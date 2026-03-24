
const ACCORD_COLOR_MAP: Record<string, string> = {
  // ── 영문 ──────────────────────────────
  Woody: '#6B7B5E',
  Aromatic: '#7A9E8E',
  Musky: '#B8A88A',
  Leather: '#8B6442',
  Fresh: '#7FB5C1',
  Floral: '#C8A5A5',
  Powdery: '#C4A8C8',
  Oud: '#6B4C3B',
  Spicy: '#C4956A',
  Sweet: '#D4A5B0',
  Citrus: '#E0C050',
  Green: '#7BAF6E',
  Earthy: '#8D7B68',
  Amber: '#C8882A',
  Fruity: '#E07878',
  Aquatic: '#5FA0C8',

  // ── 한국어 ─────────────────────────────
  시트러스: '#E0C050',
  프레시: '#7FB5C1',
  아쿠아틱: '#5FA0C8',
  그린: '#7BAF6E',
  플로럴: '#C8A5A5',
  '화이트 플로럴': '#E8D8D8',
  프루티: '#E07878',
  스위트: '#D4A5B0',
  바닐라: '#D4C4A0',
  구르망: '#B87840',
  우디: '#6B7B5E',
  머스키: '#B8A88A',
  앰버: '#C8882A',
  '웜 스파이시': '#C06030',
  '프레시 스파이시': '#60A890',
  아로마틱: '#7A9E8E',
  레더: '#8B6442',
  파우더리: '#C4A8C8',
  스모키: '#787878',
  어시: '#A0A0A0',
  오리엔탈: '#8050A0',
  알데하이드: '#B0C0C8',
  미네랄: '#7890A0',
  인센스: '#706080',
  '옐로우 플로럴': '#D8C050',
  솝: '#A8C8D8',
  오조닉: '#80C0D8',
  '소프트 스파이시': '#C89080',
  모씨: '#4E7A5E',
  락토닉: '#E0D0B0',
  애니멀릭: '#806050',
  솔티: '#7098A8',
  발사믹: '#7A5030',
  시프러스: '#6E8060',
};

export function getAccordColor(name: string) {
  return ACCORD_COLOR_MAP[name] ?? '#8A8680';
}

export interface AccordStat {
  name: string;
  color: string;
  count: number;
  percentage: number;
}

export function buildAccordStats(items: Array<{ accords: string[] }>): AccordStat[] {
  const counts = new Map<string, number>();
  let total = 0;

  items.forEach((item) => {
    item.accords.forEach((accord) => {
      counts.set(accord, (counts.get(accord) ?? 0) + 1);
      total += 1;
    });
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      color: getAccordColor(name),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function formatMyPageDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  },
) {
  if (!value) return '';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', options).format(parsed);
}

export function getRecommendationSummaryText(input: {
  keyword?: string | null;
  text?: string | null;
  keywords?: string[];
  image?: string | null;
}) {
  const keyword = input.keyword?.trim() || input.text?.trim();

  if (keyword) {
    return `"${keyword}"`;
  }

  if (input.keywords && input.keywords.length > 0) {
    return input.keywords.slice(0, 3).join(', ');
  }

  if (input.image) {
    return '이미지 기반 추천';
  }

  return '추천 기록';
}

export function hasPerfumeId(reference: { perfumeId?: number }): boolean {
  return reference.perfumeId !== undefined && reference.perfumeId !== null;
}

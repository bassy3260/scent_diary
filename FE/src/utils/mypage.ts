import { mockPerfumes } from '../constants/perfumes';
import type { Perfume } from '../types/perfume.types';

const ACCORD_COLOR_MAP: Record<string, string> = {
  Woody: '#6B7B5E',
  Aromatic: '#8BA4B8',
  Musky: '#B8A88A',
  Leather: '#C4956A',
  Fresh: '#8BA4B8',
  Floral: '#C8A5A5',
  Powdery: '#D8C7DB',
  Oud: '#8B6442',
  Spicy: '#C4956A',
  Sweet: '#D4C5A9',
  Citrus: '#E0B76A',
  Green: '#A3B18A',
  Earthy: '#8D7B68',
  Amber: '#B88746',
  Fruity: '#D98B7A',
  Aquatic: '#7FA9C7',
};

function normalizeText(value: string | undefined) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

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
  value: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  },
) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', options).format(parsed);
}

export function getRecommendationSummaryText(input: {
  text?: string | null;
  keywords?: string[];
  image?: string | null;
}) {
  const text = input.text?.trim();

  if (text) {
    return `"${text}"`;
  }

  if (input.keywords && input.keywords.length > 0) {
    return input.keywords.slice(0, 3).join(', ');
  }

  if (input.image) {
    return '이미지 기반 추천';
  }

  return '추천 기록';
}

export function findMockPerfumeMatch(reference: {
  perfumeId?: number;
  brand?: string;
  name?: string;
}): Perfume | null {
  if (reference.perfumeId !== undefined) {
    const matchedById = mockPerfumes.find((perfume) => perfume.id === String(reference.perfumeId));

    if (matchedById) {
      return matchedById;
    }
  }

  const brand = normalizeText(reference.brand);
  const name = normalizeText(reference.name);

  if (!brand && !name) {
    return null;
  }

  return (
    mockPerfumes.find(
      (perfume) =>
        normalizeText(perfume.brand) === brand &&
        normalizeText(perfume.name) === name,
    ) ?? null
  );
}

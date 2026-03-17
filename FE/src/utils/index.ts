// 날짜 포맷
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// 고유 ID 생성
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// 클래스명 병합 (Tailwind 조건부 합치기)
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

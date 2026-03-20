interface VibeIllustrationProps {
  vibe: string;
  size?: number;
}

export function VibeIllustration({ vibe, size = 48 }: VibeIllustrationProps) {
  const getIllustration = () => {
    switch (vibe) {
      case '여성적':
        return (
          <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            {/* 부드러운 꽃잎 형태 */}
            <g opacity="0.9">
              {/* 중앙 꽃 */}
              <circle cx="24" cy="24" r="4" fill="#B8A5C8" opacity="0.6" />

              {/* 꽃잎들 - 부드러운 곡선 */}
              <ellipse cx="24" cy="14" rx="3.5" ry="6" fill="#D4C5E0" opacity="0.7" />
              <ellipse cx="32" cy="18" rx="3.5" ry="6" fill="#D4C5E0" opacity="0.7" transform="rotate(60 32 18)" />
              <ellipse cx="32" cy="30" rx="3.5" ry="6" fill="#D4C5E0" opacity="0.7" transform="rotate(120 32 30)" />
              <ellipse cx="24" cy="34" rx="3.5" ry="6" fill="#D4C5E0" opacity="0.7" />
              <ellipse cx="16" cy="30" rx="3.5" ry="6" fill="#D4C5E0" opacity="0.7" transform="rotate(-120 16 30)" />
              <ellipse cx="16" cy="18" rx="3.5" ry="6" fill="#D4C5E0" opacity="0.7" transform="rotate(-60 16 18)" />

              {/* 작은 반짝임 */}
              <circle cx="28" cy="20" r="1.5" fill="#E8D5F0" opacity="0.8" />
              <circle cx="20" cy="28" r="1.5" fill="#E8D5F0" opacity="0.8" />
            </g>
          </svg>
        );

      case '남성적':
        return (
          <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            {/* 기하학적 각진 형태 */}
            <g opacity="0.9">
              {/* 중앙 사각형 */}
              <rect x="20" y="20" width="8" height="8" fill="#6B7B5E" opacity="0.7" />

              {/* 외곽 사각형들 - 대각선 배치 */}
              <rect x="12" y="12" width="6" height="6" fill="#8A9A7E" opacity="0.6" transform="rotate(45 15 15)" />
              <rect x="30" y="12" width="6" height="6" fill="#8A9A7E" opacity="0.6" transform="rotate(45 33 15)" />
              <rect x="12" y="30" width="6" height="6" fill="#8A9A7E" opacity="0.6" transform="rotate(45 15 33)" />
              <rect x="30" y="30" width="6" height="6" fill="#8A9A7E" opacity="0.6" transform="rotate(45 33 33)" />

              {/* 작은 강조점 */}
              <rect x="23" y="15" width="2" height="2" fill="#5A6A4E" opacity="0.8" />
              <rect x="23" y="31" width="2" height="2" fill="#5A6A4E" opacity="0.8" />
            </g>
          </svg>
        );

      case '중성적':
        return (
          <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
            {/* 균형잡힌 원형과 직선의 조화 */}
            <g opacity="0.9">
              {/* 중앙 원 */}
              <circle cx="24" cy="24" r="6" fill="#8BA4B8" opacity="0.6" />

              {/* 외곽 원들 - 균형잡힌 배치 */}
              <circle cx="24" cy="12" r="3" fill="#A5BED0" opacity="0.7" />
              <circle cx="34" cy="24" r="3" fill="#A5BED0" opacity="0.7" />
              <circle cx="24" cy="36" r="3" fill="#A5BED0" opacity="0.7" />
              <circle cx="14" cy="24" r="3" fill="#A5BED0" opacity="0.7" />

              {/* 연결선 - 직선과 원의 조화 */}
              <line x1="24" y1="18" x2="24" y2="15" stroke="#8BA4B8" strokeWidth="1.5" opacity="0.5" />
              <line x1="30" y1="24" x2="31" y2="24" stroke="#8BA4B8" strokeWidth="1.5" opacity="0.5" />
              <line x1="24" y1="30" x2="24" y2="33" stroke="#8BA4B8" strokeWidth="1.5" opacity="0.5" />
              <line x1="18" y1="24" x2="17" y2="24" stroke="#8BA4B8" strokeWidth="1.5" opacity="0.5" />

              {/* 작은 포인트 */}
              <circle cx="28" cy="18" r="1.2" fill="#C5D8E8" opacity="0.8" />
              <circle cx="20" cy="30" r="1.2" fill="#C5D8E8" opacity="0.8" />
            </g>
          </svg>
        );

      default:
        return null;
    }
  };

  return <>{getIllustration()}</>;
}

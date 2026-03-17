/**
 * AgeGroupIllustrations.tsx
 * Four premium circular SVG illustrations for the perfume recommendation UI,
 * one per age group: teen / early 20s / mid 20s / late 20s.
 *
 * Design language:
 *  - Soft radial gradient backgrounds, each age-group has its own palette
 *  - Consistent perfume bottle silhouette, styled differently per mood
 *  - Minimal supporting elements (botanicals, fruit, petals, resin drops)
 *  - No text, faces, or people — objects + colour palette carry the mood
 */

interface IllustrationProps {
  size?: number;
  className?: string;
}

// ─── 1. Teen ── Fruity · Peach · Berry · Youthful Freshness ──────────────────
export function TeenIllustration({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Background */}
        <radialGradient id="t-bg" cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#FFEADE" />
          <stop offset="60%" stopColor="#FFCDD8" />
          <stop offset="100%" stopColor="#F9AABB" />
        </radialGradient>
        {/* Bottle body */}
        <linearGradient id="t-bottle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFCEDB" />
          <stop offset="100%" stopColor="#F090AA" />
        </linearGradient>
        {/* Peach fruit */}
        <radialGradient id="t-peach" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FFD280" />
          <stop offset="100%" stopColor="#F09058" />
        </radialGradient>
        {/* Berry */}
        <radialGradient id="t-berry1" cx="30%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#E87898" />
          <stop offset="100%" stopColor="#C0405E" />
        </radialGradient>
        <radialGradient id="t-berry2" cx="30%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#D86888" />
          <stop offset="100%" stopColor="#A83458" />
        </radialGradient>
      </defs>

      {/* ── Background circle ── */}
      <circle cx="100" cy="100" r="100" fill="url(#t-bg)" />

      {/* Ambient inner glow */}
      <circle cx="68" cy="65" r="48" fill="white" fillOpacity="0.13" />
      <circle cx="140" cy="148" r="35" fill="#FFAAB8" fillOpacity="0.12" />

      {/* ── Peach (bottom-left) ── */}
      {/* peach body */}
      <ellipse cx="58" cy="128" rx="19" ry="21" fill="url(#t-peach)" />
      {/* peach blush */}
      <ellipse cx="67" cy="122" rx="9" ry="11" fill="#F0A070" fillOpacity="0.45" />
      {/* peach crease */}
      <path d="M57 107 Q60 128 57 149" stroke="#D07840" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.6" />
      {/* peach leaf */}
      <ellipse cx="55" cy="106" rx="7" ry="11" fill="#6EB87A" transform="rotate(-18 55 106)" />
      <path d="M55 98 Q58 106 55 114" stroke="#52A060" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.7" />

      {/* ── Berry cluster (right side) ── */}
      <circle cx="148" cy="88" r="12" fill="url(#t-berry1)" />
      <circle cx="156" cy="102" r="11" fill="url(#t-berry2)" />
      <circle cx="140" cy="103" r="10" fill="url(#t-berry1)" />
      {/* berry highlights */}
      <circle cx="144" cy="83" r="3.5" fill="white" fillOpacity="0.42" />
      <circle cx="152" cy="97" r="3" fill="white" fillOpacity="0.42" />
      <circle cx="137" cy="99" r="2.5" fill="white" fillOpacity="0.42" />
      {/* berry stems */}
      <path d="M148 76 Q150 70 151 63" stroke="#4C9458" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M156 91 Q159 84 158 77" stroke="#4C9458" strokeWidth="1.6" strokeLinecap="round" />

      {/* ── Perfume bottle (center) ── */}
      {/* bottle body – rounded globe shape */}
      <ellipse cx="103" cy="118" rx="24" ry="30" fill="url(#t-bottle)" />
      {/* glass shimmer */}
      <ellipse cx="94" cy="107" rx="7" ry="16" fill="white" fillOpacity="0.32" />
      <ellipse cx="115" cy="128" rx="3" ry="8" fill="white" fillOpacity="0.14" />
      {/* neck */}
      <rect x="96" y="86" width="14" height="12" rx="4" fill="#F4A8BE" />
      {/* cap – rose gold */}
      <rect x="92" y="72" width="22" height="16" rx="6" fill="#E8C0A0" />
      {/* cap highlight */}
      <ellipse cx="100" cy="78" rx="5" ry="6" fill="white" fillOpacity="0.38" />
      {/* cap ridge */}
      <rect x="92" y="85" width="22" height="3" rx="1.5" fill="#D8A888" />

      {/* ── Sparkles ── */}
      {/* large star */}
      <path
        d="M75 52 L76.8 57.5 L82.5 59 L76.8 60.5 L75 66 L73.2 60.5 L67.5 59 L73.2 57.5Z"
        fill="#FFE060"
        fillOpacity="0.92"
      />
      {/* medium star */}
      <path
        d="M152 54 L153.3 57.8 L157 59 L153.3 60.2 L152 64 L150.7 60.2 L147 59 L150.7 57.8Z"
        fill="#FFB8CC"
        fillOpacity="0.88"
      />
      {/* small stars / dots */}
      <path
        d="M52 82 L53 84.5 L55.5 85.5 L53 86.5 L52 89 L51 86.5 L48.5 85.5 L51 84.5Z"
        fill="#FFD090"
        fillOpacity="0.8"
      />
      <circle cx="137" cy="62" r="3.5" fill="#FFB8D0" fillOpacity="0.75" />
      <circle cx="72" cy="148" r="3" fill="#FFC890" fillOpacity="0.7" />
      <circle cx="163" cy="130" r="2.5" fill="#F4A0B8" fillOpacity="0.65" />
      <circle cx="43" cy="155" r="2" fill="#FFD080" fillOpacity="0.6" />
      <circle cx="168" cy="68" r="2" fill="#FFCCE0" fillOpacity="0.6" />
    </svg>
  );
}

// ─── 2. Early 20s ── Citrus · Green · Airy · Daily Vibe ──────────────────────
export function EarlyTwentiesIllustration({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="e-bg" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#EEF9F0" />
          <stop offset="55%" stopColor="#CCECD8" />
          <stop offset="100%" stopColor="#A8D8B8" />
        </radialGradient>
        <linearGradient id="e-bottle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D8F0E0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#80C8A0" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="e-citrus" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF5B0" />
          <stop offset="70%" stopColor="#F8D840" />
          <stop offset="100%" stopColor="#E0B820" />
        </radialGradient>
      </defs>

      {/* ── Background ── */}
      <circle cx="100" cy="100" r="100" fill="url(#e-bg)" />
      <circle cx="65" cy="60" r="52" fill="white" fillOpacity="0.14" />
      <circle cx="148" cy="155" r="38" fill="#88C8A0" fillOpacity="0.10" />

      {/* ── Citrus slice (left) ── */}
      {/* rind */}
      <circle cx="55" cy="118" r="22" fill="#E8B820" />
      {/* flesh */}
      <circle cx="55" cy="118" r="18" fill="url(#e-citrus)" />
      {/* pith ring */}
      <circle cx="55" cy="118" r="18" stroke="#F8E888" strokeWidth="2.5" fill="none" />
      {/* center */}
      <circle cx="55" cy="118" r="5" fill="#FEFBE8" />
      {/* segments – 6 lines from center */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x2 = 55 + Math.cos(rad) * 17;
        const y2 = 118 + Math.sin(rad) * 17;
        return (
          <line
            key={i}
            x1="55" y1="118" x2={x2} y2={y2}
            stroke="#F0D050" strokeWidth="1.2" strokeOpacity="0.7"
          />
        );
      })}
      {/* highlight */}
      <circle cx="48" cy="111" r="4" fill="white" fillOpacity="0.35" />

      {/* ── Fresh leaves (right) ── */}
      {/* leaf 1 */}
      <ellipse cx="152" cy="90" rx="9" ry="18" fill="#60B878" transform="rotate(20 152 90)" />
      <path d="M145 105 Q152 90 159 75" stroke="#48A060" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
      {/* leaf 2 */}
      <ellipse cx="162" cy="110" rx="8" ry="16" fill="#50C088" transform="rotate(40 162 110)" />
      <path d="M155 120 Q162 110 170 100" stroke="#38A870" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
      {/* leaf 3 small */}
      <ellipse cx="142" cy="108" rx="6" ry="12" fill="#70C890" transform="rotate(-10 142 108)" />

      {/* ── Perfume bottle (center) ── cylinder style ── */}
      {/* bottle body */}
      <rect x="84" y="82" width="30" height="50" rx="15" fill="url(#e-bottle)" />
      {/* glass shine */}
      <rect x="87" y="86" width="9" height="40" rx="4.5" fill="white" fillOpacity="0.30" />
      <rect x="105" y="95" width="4" height="28" rx="2" fill="white" fillOpacity="0.14" />
      {/* neck */}
      <rect x="90" y="70" width="18" height="14" rx="4" fill="#A8D8B8" />
      {/* cap – matte silver-green */}
      <rect x="87" y="56" width="24" height="16" rx="5" fill="#B8D0B0" />
      <rect x="87" y="56" width="24" height="6" rx="3" fill="#C8E0C0" />
      {/* cap highlight */}
      <rect x="90" y="58" width="8" height="10" rx="3" fill="white" fillOpacity="0.30" />
      {/* subtle label line */}
      <rect x="86" y="100" width="28" height="1.5" rx="0.75" fill="#70A880" fillOpacity="0.3" />
      <rect x="86" y="104" width="28" height="1.5" rx="0.75" fill="#70A880" fillOpacity="0.2" />

      {/* ── Airy bubbles ── */}
      <circle cx="68" cy="65" r="7" stroke="#98D0AC" strokeWidth="1.5" fill="white" fillOpacity="0.18" />
      <circle cx="78" cy="52" r="5" stroke="#80C898" strokeWidth="1.2" fill="white" fillOpacity="0.15" />
      <circle cx="143" cy="58" r="6" stroke="#88D0A8" strokeWidth="1.2" fill="white" fillOpacity="0.15" />
      <circle cx="160" cy="72" r="4" stroke="#78C898" strokeWidth="1" fill="white" fillOpacity="0.12" />
      <circle cx="50" cy="152" r="5" stroke="#90C8A8" strokeWidth="1.2" fill="white" fillOpacity="0.15" />
      <circle cx="157" cy="148" r="4.5" stroke="#88D0A0" strokeWidth="1" fill="white" fillOpacity="0.12" />

      {/* Small dots accent */}
      <circle cx="130" cy="60" r="3" fill="#C8E880" fillOpacity="0.65" />
      <circle cx="48" cy="88" r="2.5" fill="#D8F090" fillOpacity="0.65" />
      <circle cx="167" cy="135" r="2" fill="#A8D870" fillOpacity="0.6" />
    </svg>
  );
}

// ─── 3. Mid 20s ── Floral · Rose Beige · Romantic Sophistication ─────────────
export function MidTwentiesIllustration({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="m-bg" cx="44%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#FFF7F2" />
          <stop offset="55%" stopColor="#F8DDD4" />
          <stop offset="100%" stopColor="#EDBAAC" />
        </radialGradient>
        <linearGradient id="m-bottle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8E0D8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#DFA8A0" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id="m-cap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8CCA0" />
          <stop offset="100%" stopColor="#C8A070" />
        </linearGradient>
        <radialGradient id="m-petal" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F8C8C0" />
          <stop offset="100%" stopColor="#E09090" />
        </radialGradient>
      </defs>

      {/* ── Background ── */}
      <circle cx="100" cy="100" r="100" fill="url(#m-bg)" />
      <circle cx="65" cy="58" r="50" fill="white" fillOpacity="0.15" />
      <circle cx="145" cy="152" r="40" fill="#E8A0A0" fillOpacity="0.10" />

      {/* ── Rose petals (scattered around bottle) ── */}
      {/* petal bottom-left large */}
      <ellipse cx="55" cy="140" rx="16" ry="24" fill="url(#m-petal)" fillOpacity="0.85" transform="rotate(-35 55 140)" />
      <ellipse cx="57" cy="136" rx="8" ry="14" fill="#F4D0C8" fillOpacity="0.55" transform="rotate(-35 57 136)" />
      {/* petal top-left */}
      <ellipse cx="62" cy="72" rx="13" ry="20" fill="url(#m-petal)" fillOpacity="0.75" transform="rotate(25 62 72)" />
      <ellipse cx="64" cy="70" rx="7" ry="11" fill="#F8D8D0" fillOpacity="0.5" transform="rotate(25 64 70)" />
      {/* petal right large */}
      <ellipse cx="150" cy="100" rx="14" ry="22" fill="url(#m-petal)" fillOpacity="0.80" transform="rotate(-15 150 100)" />
      <ellipse cx="152" cy="97" rx="7" ry="12" fill="#F4D0C8" fillOpacity="0.5" transform="rotate(-15 152 97)" />
      {/* petal top-right */}
      <ellipse cx="145" cy="60" rx="11" ry="17" fill="#F0B8B0" fillOpacity="0.70" transform="rotate(40 145 60)" />
      {/* petal bottom */}
      <ellipse cx="110" cy="160" rx="12" ry="18" fill="url(#m-petal)" fillOpacity="0.70" transform="rotate(-8 110 160)" />

      {/* ── Tiny 5-petal flowers ── */}
      {/* flower 1 (top area) */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <ellipse
            key={i}
            cx={72 + Math.cos(rad) * 6}
            cy={48 + Math.sin(rad) * 6}
            rx="4" ry="5.5"
            fill="#F8C0C0"
            transform={`rotate(${deg} ${72 + Math.cos(rad) * 6} ${48 + Math.sin(rad) * 6})`}
          />
        );
      })}
      <circle cx="72" cy="48" r="3.5" fill="#FFEEDD" />
      {/* flower 2 (bottom-right) */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <ellipse
            key={i}
            cx={155 + Math.cos(rad) * 5.5}
            cy={148 + Math.sin(rad) * 5.5}
            rx="3.5" ry="5"
            fill="#F8B8B8"
            transform={`rotate(${deg} ${155 + Math.cos(rad) * 5.5} ${148 + Math.sin(rad) * 5.5})`}
          />
        );
      })}
      <circle cx="155" cy="148" r="3" fill="#FFF0E8" />

      {/* ── Perfume bottle – tall elegant rectangle ── */}
      {/* bottle body */}
      <rect x="85" y="76" width="28" height="60" rx="6" fill="url(#m-bottle)" />
      {/* glass shine – main */}
      <rect x="88" y="79" width="8" height="52" rx="4" fill="white" fillOpacity="0.28" />
      {/* glass shine – secondary */}
      <rect x="106" y="88" width="3.5" height="38" rx="1.75" fill="white" fillOpacity="0.14" />
      {/* decorative label stripe */}
      <rect x="85" y="106" width="28" height="1.5" rx="0.75" fill="#C89888" fillOpacity="0.35" />
      <rect x="85" y="110" width="28" height="0.8" rx="0.4" fill="#C89888" fillOpacity="0.25" />
      {/* neck */}
      <rect x="91" y="64" width="16" height="14" rx="4" fill="#E8C0B0" />
      {/* cap – elegant elongated */}
      <rect x="87" y="44" width="24" height="22" rx="5" fill="url(#m-cap)" />
      {/* cap facets */}
      <rect x="87" y="44" width="24" height="8" rx="5" fill="#F0D8B0" />
      {/* cap highlight */}
      <ellipse cx="96" cy="52" rx="5" ry="7" fill="white" fillOpacity="0.32" />

      {/* ── Pearl dots accent ── */}
      <circle cx="46" cy="105" r="4" fill="#F8E0D8" stroke="#DFB0A8" strokeWidth="1" />
      <circle cx="46" cy="105" r="1.5" fill="white" fillOpacity="0.7" />
      <circle cx="160" cy="80" r="3.5" fill="#F8DCD4" stroke="#DFACA0" strokeWidth="1" />
      <circle cx="160" cy="80" r="1.2" fill="white" fillOpacity="0.7" />
      <circle cx="52" cy="170" r="3" fill="#F8D8D0" stroke="#DFA898" strokeWidth="0.8" />
      <circle cx="52" cy="170" r="1" fill="white" fillOpacity="0.7" />
    </svg>
  );
}

// ─── 4. Late 20s ── Woody · Olive · Amber · Calm Refined Luxury ──────────────
export function LateTwentiesIllustration({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="l-bg" cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#FAF3E2" />
          <stop offset="55%" stopColor="#ECDAB0" />
          <stop offset="100%" stopColor="#D4B878" />
        </radialGradient>
        <linearGradient id="l-bottle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B7055" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#4A3828" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="l-cap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B5540" />
          <stop offset="100%" stopColor="#3A2818" />
        </linearGradient>
        <linearGradient id="l-amber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0C860" />
          <stop offset="100%" stopColor="#C89030" />
        </linearGradient>
      </defs>

      {/* ── Background ── */}
      <circle cx="100" cy="100" r="100" fill="url(#l-bg)" />
      <circle cx="62" cy="58" r="48" fill="white" fillOpacity="0.10" />
      <circle cx="150" cy="155" r="42" fill="#C89848" fillOpacity="0.08" />

      {/* ── Olive branch (left side) ── */}
      {/* main stem */}
      <path
        d="M48 160 Q58 135 65 110 Q72 85 78 62"
        stroke="#7B8B60"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* leaves along stem */}
      {/* leaf pair 1 */}
      <ellipse cx="55" cy="148" rx="8" ry="14" fill="#7B9060" transform="rotate(-40 55 148)" />
      <ellipse cx="69" cy="142" rx="7.5" ry="13" fill="#6B8050" transform="rotate(30 69 142)" />
      {/* leaf pair 2 */}
      <ellipse cx="60" cy="118" rx="7" ry="12" fill="#88A068" transform="rotate(-35 60 118)" />
      <ellipse cx="74" cy="112" rx="6.5" ry="11" fill="#78906A" transform="rotate(35 74 112)" />
      {/* leaf pair 3 */}
      <ellipse cx="65" cy="90" rx="6" ry="11" fill="#80A060" transform="rotate(-28 65 90)" />
      <ellipse cx="78" cy="82" rx="5.5" ry="10" fill="#6A9050" transform="rotate(42 78 82)" />
      {/* leaf top */}
      <ellipse cx="70" cy="65" rx="5" ry="9" fill="#8AAA68" transform="rotate(-20 70 65)" />
      {/* tiny olive fruits */}
      <ellipse cx="50" cy="143" rx="3.5" ry="5" fill="#6B8858" />
      <ellipse cx="65" cy="107" rx="3" ry="4.5" fill="#7A9865" />

      {/* ── Amber resin drops (right side) ── */}
      {/* large drop */}
      <path d="M155 75 Q162 85 162 95 Q162 108 155 113 Q148 108 148 95 Q148 85 155 75Z" fill="url(#l-amber)" />
      <ellipse cx="153" cy="87" rx="3.5" ry="7" fill="#FFE090" fillOpacity="0.5" />
      {/* medium drop */}
      <path d="M162 118 Q167 126 167 133 Q167 142 162 146 Q157 142 157 133 Q157 126 162 118Z" fill="#C89038" fillOpacity="0.85" />
      <ellipse cx="160" cy="127" rx="2.5" ry="5" fill="#F0D070" fillOpacity="0.45" />
      {/* small drop */}
      <path d="M144 140 Q148 146 148 151 Q148 157 144 160 Q140 157 140 151 Q140 146 144 140Z" fill="#D4A040" fillOpacity="0.80" />

      {/* ── Perfume bottle – minimalist faceted dark ── */}
      {/* bottle body */}
      <rect x="84" y="70" width="30" height="68" rx="5" fill="url(#l-bottle)" />
      {/* glass amber tint highlights */}
      <rect x="87" y="73" width="7" height="60" rx="3.5" fill="#C89048" fillOpacity="0.18" />
      <rect x="87" y="73" width="7" height="60" rx="3.5" fill="white" fillOpacity="0.11" />
      {/* facet line */}
      <line x1="104" y1="72" x2="104" y2="136" stroke="#6A5040" strokeWidth="1" strokeOpacity="0.5" />
      {/* right facet shimmer */}
      <rect x="105" y="75" width="6" height="58" rx="3" fill="#C89050" fillOpacity="0.12" />
      {/* subtle gold label area */}
      <rect x="84" y="108" width="30" height="18" rx="0" fill="#C89048" fillOpacity="0.08" />
      <rect x="84" y="108" width="30" height="1" fill="#C89048" fillOpacity="0.3" />
      <rect x="84" y="126" width="30" height="1" fill="#C89048" fillOpacity="0.3" />
      {/* neck */}
      <rect x="91" y="58" width="16" height="14" rx="3" fill="#6A5438" />
      <rect x="92" y="59" width="5" height="11" rx="2.5" fill="#80704A" fillOpacity="0.35" />
      {/* cap – flat matte dark */}
      <rect x="86" y="40" width="26" height="20" rx="4" fill="url(#l-cap)" />
      {/* cap top ridge */}
      <rect x="86" y="40" width="26" height="6" rx="4" fill="#7A6050" />
      {/* subtle cap highlight */}
      <rect x="89" y="42" width="7" height="14" rx="3.5" fill="white" fillOpacity="0.10" />
      {/* cap bottom edge */}
      <rect x="86" y="57" width="26" height="2" rx="1" fill="#28180A" fillOpacity="0.4" />

      {/* ── Soft wood grain dots (background texture) ── */}
      {[
        [38, 80], [42, 100], [36, 122], [170, 58], [172, 78], [168, 96],
        [165, 165], [42, 165], [120, 170], [80, 172],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={1.4}
          fill="#B89050"
          fillOpacity={0.28}
        />
      ))}

      {/* ── Gold accent circles ── */}
      <circle cx="136" cy="62" r="5" stroke="#C89048" strokeWidth="1.2" fill="none" fillOpacity="0.6" />
      <circle cx="136" cy="62" r="2" fill="#E0B050" fillOpacity="0.45" />
      <circle cx="42" cy="56" r="4" stroke="#B88840" strokeWidth="1" fill="none" fillOpacity="0.5" />
    </svg>
  );
}

// ─── Map helper: returns the correct illustration for a given AGE_RANGE label ──
export function AgeIllustration({
  ageLabel,
  size = 48,
  className,
}: {
  ageLabel: string;
  size?: number;
  className?: string;
}) {
  switch (ageLabel) {
    case '10대':
      return <TeenIllustration size={size} className={className} />;
    case '20대 초반':
      return <EarlyTwentiesIllustration size={size} className={className} />;
    case '20대 중반':
      return <MidTwentiesIllustration size={size} className={className} />;
    case '20대 후반':
      return <LateTwentiesIllustration size={size} className={className} />;
    default:
      // Fallback: neutral warm circle for 30대, 40대+ etc.
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <defs>
            <radialGradient id="fb-bg" cx="42%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#F5F3EF" />
              <stop offset="100%" stopColor="#E0D8CC" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="url(#fb-bg)" />
          {/* simple minimalist bottle */}
          <rect x="82" y="72" width="36" height="70" rx="8" fill="#C4B8A0" fillOpacity="0.8" />
          <rect x="85" y="75" width="10" height="62" rx="5" fill="white" fillOpacity="0.22" />
          <rect x="88" y="58" width="24" height="16" rx="4" fill="#A89880" />
          <rect x="85" y="48" width="30" height="12" rx="5" fill="#8A7860" />
        </svg>
      );
  }
}

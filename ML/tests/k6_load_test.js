import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ─────────────────────────────────────────
// 커스텀 메트릭
// ─────────────────────────────────────────
const errorRate = new Rate("error_rate");
const textRecommendDuration = new Trend("text_recommend_duration", true);

// ─────────────────────────────────────────
// 테스트 옵션
// ─────────────────────────────────────────
export const options = {
  scenarios: {
    text_recommend: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 5 },   // 워밍업
        { duration: "1m",  target: 10 },  // 부하 증가
        { duration: "30s", target: 10 },  // 유지
        { duration: "20s", target: 0 },   // 쿨다운
      ],
      exec: "testTextRecommend",
    },
  },
  thresholds: {
    http_req_duration:        ["p(95)<30000"],
    text_recommend_duration:  ["p(95)<30000"],
    error_rate:               ["rate<0.05"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";

// ─────────────────────────────────────────
// 텍스트 추천 테스트 데이터
// ─────────────────────────────────────────
const TEXT_PAYLOADS = [
  { keyword: "신선하고 시트러스한 여름 느낌", note: "TOP",    price: 300000 },
  { keyword: "따뜻하고 우디한 겨울 향수",     note: "BASE",   price: 150000 },
  { keyword: "플로럴하고 달콤한 로즈 향",     note: "MIDDLE", price: 100000 },
  { keyword: "머스크향이 은은한 향수",         note: "MIDDLE", price: 300000 },
  { keyword: "오리엔탈 스파이시 향",           note: "BASE",   price: 200000 },
];

// ─────────────────────────────────────────
// 멤버 추천 테스트 데이터 (실제 존재하는 member_id로 교체)
// ─────────────────────────────────────────
const MEMBER_IDS = [1, 2, 3, 14, 15];

// ─────────────────────────────────────────
// 시나리오: POST /api/v1/recommend/text
// ─────────────────────────────────────────
export function testTextRecommend() {
  const payload = TEXT_PAYLOADS[Math.floor(Math.random() * TEXT_PAYLOADS.length)];
  const body = JSON.stringify(payload);
  const params = {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "text_recommend" },
  };

  const res = http.post(`${BASE_URL}/api/v1/recommend/text`, body, params);

  textRecommendDuration.add(res.timings.duration);

  const ok = check(res, {
    "text: status 200":              (r) => r.status === 200,
    "text: recommendations 존재":    (r) => {
      try {
        const json = r.json();
        return Array.isArray(json.recommendations) && json.recommendations.length > 0;
      } catch {
        return false;
      }
    },
    "text: perfume_id 포함":         (r) => {
      try {
        return r.json().recommendations[0].perfume_id !== undefined;
      } catch {
        return false;
      }
    },
    "text: reason 포함":             (r) => {
      try {
        return typeof r.json().recommendations[0].reason === "string";
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!ok);
  sleep(1);
}

// ─────────────────────────────────────────
// 시나리오: POST /api/v1/recommend/member
// ─────────────────────────────────────────
export function testMemberRecommend() {
  const memberId = MEMBER_IDS[Math.floor(Math.random() * MEMBER_IDS.length)];
  const body = JSON.stringify({ member_id: memberId });
  const params = {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "member_recommend" },
  };

  const res = http.post(`${BASE_URL}/api/v1/recommend/member`, body, params);

  textRecommendDuration.add(res.timings.duration);

  const ok = check(res, {
    "member: status 200 또는 404":   (r) => r.status === 200 || r.status === 404,
    "member: recommendations 존재":  (r) => {
      if (r.status !== 200) return true;  // 404는 정상 케이스 허용
      try {
        return Array.isArray(r.json().recommendations);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!ok);
  sleep(0.5);
}

// ─────────────────────────────────────────
// 기본 시나리오 (k6 run 시 --scenario 미지정 시 실행)
// ─────────────────────────────────────────
export default function () {
  testTextRecommend();
}

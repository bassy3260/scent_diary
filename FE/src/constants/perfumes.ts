/**
 * 향수 더미 데이터 — API 연결 시 perfumeApi.getList()로 교체
 * @see src/api/perfume.api.ts
 */
import type { Perfume } from '../types/perfume.types';

export const PERFUME_IMAGES = {
  amber:    'https://images.unsplash.com/photo-1765031117402-93b2e530edec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwZXJmdW1lJTIwYm90dGxlJTIwYW1iZXIlMjBnbGFzc3xlbnwxfHx8fDE3NzI3NzgwNDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  minimal:  'https://images.unsplash.com/photo-1761778304143-4c89e7dd2457?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwYm90dGxlJTIwbWluaW1hbGlzdCUyMHdoaXRlJTIwZWxlZ2FudHxlbnwxfHx8fDE3NzI3Nzk4NTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
  woody:    'https://images.unsplash.com/photo-1757313202626-8b763ce254a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWNoZSUyMHBlcmZ1bWUlMjBkYXJrJTIwd29vZHklMjBib3R0bGV8ZW58MXx8fHwxNzcyNzc5ODU2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  floral:   'https://images.unsplash.com/photo-1767131543879-73614ee63985?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwYm90dGxlJTIwY3J5c3RhbCUyMGNsZWFyJTIwcm9zZXxlbnwxfHx8fDE3NzI3Nzk4NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  citrus:   'https://images.unsplash.com/photo-1662466618522-61a1f2067299?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXRydXMlMjBiZXJnYW1vdCUyMGZyZXNoJTIwcGVyZnVtZXxlbnwxfHx8fDE3NzI3Nzk4NTd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  oriental: 'https://images.unsplash.com/photo-1771757333317-8023b0646881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmcmFncmFuY2UlMjBvcmllbnRhbCUyMG91ZHxlbnwxfHx8fDE3NzI3NzgwNTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  forest:   'https://images.unsplash.com/photo-1622596781860-8fb07ef95c70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXN0eSUyMGZvcmVzdCUyMG1vcm5pbmclMjBncmVlbiUyMG5hdHVyZXxlbnwxfHx8fDE3NzI3Nzk4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  gradient: 'https://images.unsplash.com/photo-1716032936129-6deb663e8ac9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHNvZnQlMjBncmFkaWVudCUyMHBhc3RlbCUyMHNtb2tlfGVufDF8fHx8MTc3Mjc3ODA1MHww&ixlib=rb-4.1.0&q=80&w=1080',
};

export const mockPerfumes: Perfume[] = [
  {
    id: '1', name: 'Santal 33', brand: 'Le Labo', image: PERFUME_IMAGES.woody,
    price: '₩420,000', family: 'Woody', familyColor: '#6B7B5E', score: 97,
    reason: '당신이 원했던 따뜻하고 깊은 숲의 공기. 산탈 33의 시더우드와 샌달우드가 그 분위기를 완벽하게 재현해요.',
    story: '오래된 숲을 걷는 것 같은 향. 카다멈의 선명한 첫인상 뒤로 크리미한 샌달우드가 천천히 드러나고, 몇 시간이 지나면 부드러운 레더와 머스크의 잔향만이 피부 위에 남아요.',
    seasonFit: ['가을', '겨울'], tpoFit: ['저녁', '데이트', '갤러리'],
    warmCool: 0.6, softBold: 0.3, longevity: 8, sillage: 7,
    topNotes: [{ name: 'Cardamom', description: '따뜻하고 스파이시한 첫 향' }, { name: 'Iris', description: '파우더리하고 우아한 꽃향' }, { name: 'Violet', description: '부드러운 그린 플로럴' }],
    middleNotes: [{ name: 'Ambrox', description: '따뜻한 앰버 분자, 피부 같은 질감' }, { name: 'Papyrus', description: '드라이한 우디 노트' }],
    baseNotes: [{ name: 'Sandalwood', description: '크리미하고 깊은 우드' }, { name: 'Cedar', description: '클린하고 날카로운 우디' }, { name: 'Leather', description: '부드러운 가죽의 깊이감' }, { name: 'Musk', description: '피부에 밀착되는 따뜻함' }],
    accords: [{ name: 'Woody', percentage: 82, color: '#6B7B5E' }, { name: 'Aromatic', percentage: 45, color: '#8BA4B8' }, { name: 'Musky', percentage: 38, color: '#B8A88A' }, { name: 'Leather', percentage: 25, color: '#C4956A' }],
    tags: ['따뜻한 우드', '조용한 럭셔리', '명상적'],
    reviews: [{ userName: '은우', rating: 5, comment: '조용한 숲속을 걷는 느낌. 진하지 않으면서도 오래 가요.', date: '2024.03.02' }, { userName: '서현', rating: 5, comment: '우디향 처음 써봤는데 이건 진짜 좋아요.', date: '2024.02.28' }, { userName: '민준', rating: 4, comment: '가격은 좀 있지만 그만한 값어치는 합니다.', date: '2024.02.20' }],
  },
  {
    id: '2', name: 'Blanche', brand: 'Byredo', image: PERFUME_IMAGES.minimal,
    price: '₩295,000', family: 'Floral', familyColor: '#B8A5C8', score: 94,
    reason: '깨끗하고 맑은 공기 같은 부드러움. 블랑쉬의 화이트 머스크와 알데하이드가 당신의 취향과 꼭 맞아요.',
    story: '오후 햇살에 말리는 하얀 빨래. 블랑쉬는 순수함과 새로운 시작의 감각을 향으로 담아냈어요.',
    seasonFit: ['봄', '여름'], tpoFit: ['데일리', '오피스', '브런치'],
    warmCool: -0.4, softBold: -0.6, longevity: 6, sillage: 4,
    topNotes: [{ name: 'Pink Pepper', description: '밝고 과일향이 감도는 페퍼' }, { name: 'Aldehyde', description: '비누 같은 깨끗한 청량감' }],
    middleNotes: [{ name: 'Peony', description: '부드럽고 로맨틱한 꽃향' }, { name: 'Violet', description: '섬세한 파우더리 플로럴' }],
    baseNotes: [{ name: 'White Musk', description: '깨끗하고 부드러운 온기' }, { name: 'Sandalwood', description: '잔잔한 크리미 우드' }, { name: 'Blonde Woods', description: '투명한 우디 어코드' }],
    accords: [{ name: 'Fresh', percentage: 76, color: '#8BA4B8' }, { name: 'Floral', percentage: 62, color: '#B8A5C8' }, { name: 'Musky', percentage: 48, color: '#D4C5A9' }, { name: 'Powdery', percentage: 30, color: '#C8A5A5' }],
    tags: ['클린', '에테리얼', '흰 셔츠'],
    reviews: [{ userName: '수아', rating: 5, comment: '화이트 머스크 좋아하는 사람은 무조건 좋아할 향.', date: '2024.03.01' }, { userName: '도윤', rating: 5, comment: '오피스용으로 최고.', date: '2024.02.25' }],
  },
  {
    id: '3', name: 'Oud Wood', brand: 'Tom Ford', image: PERFUME_IMAGES.oriental,
    price: '₩530,000', family: 'Oriental', familyColor: '#C4956A', score: 92,
    reason: '깊고 사색적인 향을 원했던 당신. 우드 우드의 풍부하고 스모키한 품격이 잘 어울려요.',
    story: '어두운 서재의 공기. 열대 숲의 희귀한 우드가 로즈우드의 실크 같은 따뜻함을 만나요.',
    seasonFit: ['가을', '겨울'], tpoFit: ['저녁', '포멀', '특별한 날'],
    warmCool: 0.8, softBold: 0.5, longevity: 9, sillage: 6,
    topNotes: [{ name: 'Rosewood', description: '매끄럽고 로지한 우디 오프닝' }, { name: 'Cardamom', description: '따뜻한 아로마틱 스파이스' }, { name: 'Sichuan Pepper', description: '톡 쏘는 밝은 스파이스' }],
    middleNotes: [{ name: 'Oud', description: '깊고 복합적인 레진 우드' }, { name: 'Vetiver', description: '그라운딩되는 어시 그린' }],
    baseNotes: [{ name: 'Tonka Bean', description: '바닐라 같은 달콤한 따뜻함' }, { name: 'Amber', description: '풍부한 레진의 온기' }, { name: 'Sandalwood', description: '감싸는 크리미한 마무리' }],
    accords: [{ name: 'Oud', percentage: 85, color: '#C4956A' }, { name: 'Woody', percentage: 70, color: '#6B7B5E' }, { name: 'Spicy', percentage: 42, color: '#B8A88A' }, { name: 'Sweet', percentage: 28, color: '#D4C5A9' }],
    tags: ['스모키', '소피스티케이티드', '깊은 밤'],
    reviews: [{ userName: '현우', rating: 5, comment: '우드 입문자에게 추천.', date: '2024.02.28' }, { userName: '예진', rating: 4, comment: '가격은 비싸지만 향은 확실해요.', date: '2024.02.22' }],
  },
  {
    id: '4', name: 'Bergamote 22', brand: 'Le Labo', image: PERFUME_IMAGES.citrus,
    price: '₩390,000', family: 'Citrus', familyColor: '#8BA4B8', score: 89,
    reason: '밝고 상쾌한 아침의 기운. 베르가못 22의 맑은 시트러스가 당신의 에너지와 잘 어울려요.',
    story: '지중해의 아침 7시. 햇살 가득한 테라스에서 마시는 얼그레이 한 모금.',
    seasonFit: ['봄', '여름'], tpoFit: ['데일리', '오피스', '아웃도어'],
    warmCool: -0.6, softBold: -0.3, longevity: 5, sillage: 5,
    topNotes: [{ name: 'Bergamot', description: '밝고 반짝이는 시트러스' }, { name: 'Grapefruit', description: '상큼하고 즙이 많은 시트러스' }, { name: 'Petitgrain', description: '그린하고 약간 쌉싸름한' }],
    middleNotes: [{ name: 'Cedar', description: '깨끗하고 구조적인 우디 하트' }, { name: 'Musk', description: '투명한 베이스 레이어' }],
    baseNotes: [{ name: 'Vetiver', description: '어시한 그린 깊이감' }, { name: 'Amber', description: '따뜻하고 달콤한 레진' }],
    accords: [{ name: 'Citrus', percentage: 88, color: '#B8A88A' }, { name: 'Aromatic', percentage: 50, color: '#8BA4B8' }, { name: 'Woody', percentage: 35, color: '#6B7B5E' }, { name: 'Green', percentage: 28, color: '#A3B18A' }],
    tags: ['햇살', '크리스프', '아침 루틴'],
    reviews: [{ userName: '지우', rating: 5, comment: '베르가못 향 좋아하시면 강추!', date: '2024.03.05' }, { userName: '시우', rating: 4, comment: '여름에 딱이에요.', date: '2024.02.27' }],
  },
  {
    id: '5', name: 'Rose 31', brand: 'Le Labo', image: PERFUME_IMAGES.floral,
    price: '₩420,000', family: 'Floral', familyColor: '#C8A5A5', score: 86,
    reason: '로맨틱하면서도 깊이 있는 감성. 로즈 31의 독특한 장미 해석이 당신의 세련된 취향과 맞아요.',
    story: '달콤함을 걷어내고, 쿠민의 따뜻함과 시더의 뼈대, 베티버의 날카로운 클린함을 더했어요.',
    seasonFit: ['봄', '가을'], tpoFit: ['데이트', '저녁', '문화생활'],
    warmCool: 0.2, softBold: 0.4, longevity: 7, sillage: 6,
    topNotes: [{ name: 'Cumin', description: '따뜻하고 앤벌한 스파이스' }, { name: 'Rose', description: '풍부한 다마스쿠스 로즈' }],
    middleNotes: [{ name: 'Cistus', description: '앰버처럼 따뜻한 레진' }, { name: 'Guaiac Wood', description: '스모키하고 달콤한 우드' }, { name: 'Cedar', description: '드라이한 구조적 우드' }],
    baseNotes: [{ name: 'Vetiver', description: '깊고 어시한 그린 마무리' }, { name: 'Amber', description: '따뜻하게 감싸는 드라이다운' }, { name: 'Musk', description: '깨끗하고 친밀한 베이스' }],
    accords: [{ name: 'Floral', percentage: 72, color: '#C8A5A5' }, { name: 'Woody', percentage: 58, color: '#6B7B5E' }, { name: 'Spicy', percentage: 40, color: '#C4956A' }, { name: 'Earthy', percentage: 32, color: '#B8A88A' }],
    tags: ['모던 로즈', '에지', '소피스티케이티드'],
    reviews: [{ userName: '소희', rating: 5, comment: '달콤한 장미향 싫어하는데 이건 좋아요.', date: '2024.03.03' }, { userName: '민서', rating: 4, comment: '큐민 향이 처음엔 낯설었는데 자꾸 생각나는 향.', date: '2024.02.26' }],
  },
];

export const mockRecommendationHistory = [
  {
    id: 'mock-rec-1',
    date: '2026.03.01',
    emotionText: '산뜻하지만 우디한 잔향이 남는 향',
    conditions: {
      gender: 'Unisex',
      ageRange: '20대',
      mood: ['Woody', 'Fresh'],
    },
    resultIds: ['1', '4', '2'],
  },
  {
    id: 'mock-rec-2',
    date: '2026.02.24',
    emotionText: '차분하고 포근한 무드의 데일리 향',
    conditions: {
      gender: 'Unisex',
      ageRange: '20대',
      mood: ['Musky', 'Soft'],
    },
    resultIds: ['2', '5', '1'],
  },
];

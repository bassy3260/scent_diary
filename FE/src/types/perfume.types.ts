export interface PerfumeNote {
  name: string;
  description: string;
}

export interface PerfumeAccord {
  name: string;
  percentage: number;
  color: string;
}

export interface PerfumeReview {
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Perfume {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: string;
  family: string;
  familyColor: string;
  score: number;
  reason: string;
  story: string;
  seasonFit: string[];
  tpoFit: string[];
  warmCool: number;
  softBold: number;
  longevity: number;
  sillage: number;
  topNotes: PerfumeNote[];
  middleNotes: PerfumeNote[];
  baseNotes: PerfumeNote[];
  accords: PerfumeAccord[];
  tags: string[];
  reviews?: PerfumeReview[];
}

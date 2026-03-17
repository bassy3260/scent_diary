export interface RecommendationHistory {
  id: string;
  date: string;
  emotionText: string;
  conditions: {
    season?: string;
    gender: string;
    ageRange?: string;
    mood: string[];
  };
  resultIds: string[];
}

package com.example.fragrance.util.perfume;

public class KoreanUtils {
    public static String getChosung(String text) {
        if (text == null) return "";
        StringBuilder sb = new StringBuilder();
        // 한글 초성 리스트 (19개)
        char[] chosungs = {
                'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
                'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
        };

        for (char c : text.toCharArray()) {
            if (c >= 0xAC00 && c <= 0xD7A3) { // 한글 유니코드 범위
                int base = c - 0xAC00;
                int chosungIdx = base / (28 * 21); // 초성 인덱스 계산
                sb.append(chosungs[chosungIdx]);
            } else {
                sb.append(c); // 한글이 아니면 숫자, 영어 등 그대로 유지
            }
        }
        return sb.toString();
    }
}

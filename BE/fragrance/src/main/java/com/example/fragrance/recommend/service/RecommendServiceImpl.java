package com.example.fragrance.recommend.service;

import com.example.fragrance.recommend.dto.FastApiRecommendResponse;
import com.example.fragrance.recommend.dto.RecommendHistoryDetailResponse;
import com.example.fragrance.recommend.dto.RecommendImageRequest;
import com.example.fragrance.recommend.dto.RecommendTextRequest;
import com.example.fragrance.recommend.entity.PerfumeRecommend;
import com.example.fragrance.recommend.entity.RecommendResult;
import com.example.fragrance.recommend.mapper.PerfumeRecommendMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class RecommendServiceImpl implements RecommendService{
    private final RestTemplate restTemplate; //final 필드들을 Lombok이 생성자로 만들어주고 Spring이 그 생성자로 의존성 중;ㅂ
    private final PerfumeRecommendMapper perfumeRecommendMapper;
    private final RecommendHistoryService recommendHistoryService;

    @Value("${fastapi.url}")
    private String fastapiUrl;

    @Override
    public RecommendHistoryDetailResponse getTextRecommendResponse(Long memberId, RecommendTextRequest request){
        // 파라미터를 fastAPI에게 보낸다, 데이터를 받는다.
        // restTemplate.postForObject(url, requestBody, ResponseType.class):
        Map<String, Object> body = new HashMap<>();
        body.put("keyword", request.getKeyword());
        body.put("price", request.getPrice());
        body.put("note", request.getNote() != null ? request.getNote().toUpperCase() : null);

        FastApiRecommendResponse fastApiRecommendResponse = restTemplate.postForObject(
                fastapiUrl+"/api/v1/recommend/text",
                body,
                FastApiRecommendResponse.class
        );

        System.out.println(fastApiRecommendResponse);
        // 2. DB 저장 후 결과 반환
        return saveAndReturn(memberId,fastApiRecommendResponse,request.getKeyword(),null);

    }

    @Override
    public RecommendHistoryDetailResponse getImageRecommedResponse(Long memberId, RecommendImageRequest request) {
        return null;
    }

    // 받아서 저장하는 로직 따로.
    private RecommendHistoryDetailResponse saveAndReturn(
            Long memberId,
            FastApiRecommendResponse fastapiResponse,
            String keyword,
            String imageRoute){

        RecommendResult recommendResult = RecommendResult.builder().memberId(memberId).keyword(keyword).imageRoute(imageRoute).build();
        perfumeRecommendMapper.insertRecommendResult(recommendResult);

        List<PerfumeRecommend> perfumeRecommends = fastapiResponse.getRecommendations().stream()
                .map(item -> PerfumeRecommend.builder()
                        .recommendResultId(recommendResult.getRecommendResultId())
                        .perfumeId(item.getPerfumeId())
                        .reasons(item.getReason())
                        .build()).collect(Collectors.toList());
        perfumeRecommendMapper.insertPerfumeRecommend(perfumeRecommends);

        return recommendHistoryService.getHistoryDetail(memberId,recommendResult.getRecommendResultId());
    }

}

package com.example.fragrance.util.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate
 * Spring에서 HTTP 요청을 보내는 클라이언트
 * 백엔드가 다른 서버에 HTTP요청을 날릴 때 쓰는 도구
 * HTTP요청 보낼때 직접 소켓 열고 프로토콜 파싱하고.. 이러면 너무 힘들다
 * RestTemplate이 이걸 추상화준다.
 */
@Configuration
public class RestTemplateConfig {

    // RestTemplate 는 Spring이 자동으로 만들어 주지 않는다.
    // @Configuration 클래스 안에서 @Bean으로 직접 등록해야 @Autowired 생성자 주입 가능..
    @Bean
    public RestTemplate restTemplate(){
        return new RestTemplate();
    }
}

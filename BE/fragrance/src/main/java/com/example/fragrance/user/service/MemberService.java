package com.example.fragrance.user.service;

import com.example.fragrance.user.dto.LoginResponse;
import com.example.fragrance.user.dto.SignUpRequest;
import com.example.fragrance.user.dto.UserUpdateRequest;
import com.example.fragrance.user.entity.Member;
import com.example.fragrance.user.mapper.MemberMapper;
import com.example.fragrance.util.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.NoSuchElementException;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MemberService {

    private final MemberMapper memberMapper;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    private static final long ACCESS_TOKEN_EXPIRE_TIME = 1000 * 60 * 60 * 24; // 24시간
    private static final long REFRESH_TOKEN_EXPIRE_TIME = 1000L * 60 * 60 * 24 * 14; // 14일

    public LoginResponse login(String userId, String password) {
        Member member = memberMapper.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        // 암호화된 비밀번호 대조
        if (!passwordEncoder.matches(password, member.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        // Access Token 생성
        String accessToken = jwtUtil.generateToken(member.getMemberId(), ACCESS_TOKEN_EXPIRE_TIME);

        // Refresh Token 생성
        String refreshToken = jwtUtil.generateToken(member.getMemberId(), REFRESH_TOKEN_EXPIRE_TIME);

        // Redis에 Refresh Token 저장 (Key: RT:memberId, Value: token, 유효기간: 14일)
        redisTemplate.opsForValue().set(
                "RT:" + member.getMemberId(),
                refreshToken,
                REFRESH_TOKEN_EXPIRE_TIME,
                TimeUnit.MILLISECONDS
        );

        return new LoginResponse(accessToken);
    }

    @Transactional
    public void signUp(SignUpRequest request) {
        // 아이디 중복 체크
        if (memberMapper.findById(request.getId()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        Member member = new Member();
        member.setId(request.getId());
        member.setPassword(encodedPassword); // 암호화된 비밀번호
        member.setBirthYear(request.getBirthYear());
        member.setGender(request.getGender());
        member.setNickname(request.getNickname());

        // DB 저장
        memberMapper.save(member);
    }

    @Transactional(readOnly = true)
    public Member getMyInfo(Long loginId) {
        return memberMapper.findByMemberId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
    }

    @Transactional
    public void logout(String memberId) {
        // Redis 에서 해당 사용자의 Refresh Token 삭제
        redisTemplate.delete("RT:" + memberId);
    }

    @Transactional
    public void updateMyInfo(String memberId, UserUpdateRequest request) {
        // 해당 회원이 존재하는지 확인
        Member member = memberMapper.findByMemberId(Long.parseLong(memberId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 정보 업데이트
        member.setNickname(request.getNickname());
        member.setBirthYear(request.getBirthYear());
        member.setGender(request.getGender());

        memberMapper.updateMember(member);
    }

    @Transactional
    public void deleteUser(Long memberId) {
        // 회원 정보 Soft Delete
        int result = memberMapper.softDeleteMember(memberId);

        if (result == 0) {
            throw new NoSuchElementException("존재하지 않는 회원입니다.");
        }

        // 연관 데이터 Soft Delete (추천결과, 소장한 향수, 찜, 일기, 시향일지)
        // 리뷰는 삭제하지 않음
        memberMapper.softDeleteMemberData(memberId);

        redisTemplate.delete("RT:" + memberId);

        log.info("회원 탈퇴 완료 - MemberID: {}", memberId);
    }

}
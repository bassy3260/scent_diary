package com.example.fragrance.user.controller;

import com.example.fragrance.user.dto.LoginResponse;
import com.example.fragrance.user.dto.SignUpRequest;
import com.example.fragrance.user.dto.UserUpdateRequest;
import com.example.fragrance.user.entity.Member;
import com.example.fragrance.user.service.MemberService;
import com.example.fragrance.util.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            LoginResponse token = authService.login(request.get("id"), request.get("password"));
            return ResponseEntity.ok(ApiResponse.ok("SUCCESS", token));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody SignUpRequest request) {
        authService.signUp(request);
        return ResponseEntity.ok(ApiResponse.ok("회원가입이 완료되었습니다."));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal String memberId) {
        if (memberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 없습니다.");
        }

        authService.logout(memberId);

        return ResponseEntity.ok(ApiResponse.ok("성공적으로 로그아웃 되었습니다."));
    }

}
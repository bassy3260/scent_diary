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
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class MyMemberController {

    private final MemberService userService;

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @AuthenticationPrincipal String loginId
    ) {
        Long memberId = Long.parseLong(loginId);

        userService.deleteUser(memberId);

        return ResponseEntity.ok(ApiResponse.ok("회원 탈퇴가 완료되었습니다."));
    }
}
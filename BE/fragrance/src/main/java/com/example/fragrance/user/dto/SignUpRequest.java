package com.example.fragrance.user.dto;

import com.example.fragrance.user.entity.Gender;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignUpRequest {
    private String id;
    private String password;
    private Long birthYear;
    private Gender gender;
    private String nickname;
}
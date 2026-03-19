package com.example.fragrance.user.dto;

import com.example.fragrance.user.entity.Gender;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserUpdateRequest {
    private String password;
    private Long birthYear;
    private Gender gender;
    private String nickname;
}
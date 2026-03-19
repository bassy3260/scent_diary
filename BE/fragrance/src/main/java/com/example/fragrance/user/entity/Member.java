package com.example.fragrance.user.entity;

import com.example.fragrance.util.common.common;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor 
@SuperBuilder
public class Member extends common {

    private Long memberId;
    private String id;
    private String password;
    private Long birthYear;
    private Gender gender;
    private String nickname;
}

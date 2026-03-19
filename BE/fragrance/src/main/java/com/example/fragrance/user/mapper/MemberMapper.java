package com.example.fragrance.user.mapper;

import com.example.fragrance.user.entity.Member;
import org.apache.ibatis.annotations.Mapper;

import java.util.Optional;

@Mapper
public interface MemberMapper {
    Optional<Member> findById(String id);
    Optional<Member> findByMemberId(Long memberId);
    void insertMember(Member member);
    void save(Member member);

    void updateMember(Member member);

    int softDeleteMember(Long memberId);

    void softDeleteMemberData(Long memberId);
}

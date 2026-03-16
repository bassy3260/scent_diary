package com.example.fragrance.perfume.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.example.fragrance.perfume.dto.MemberPerfumeDto;

@Mapper
public interface MemberPerfumeMapper {

	List<MemberPerfumeDto> findOwnedPerfumes(
		@Param("memberId") Long memberId,
		@Param("offset") int offset,
		@Param("size") int size
	);

	long countOwnedPerfumes(@Param("memberId") Long memberId);

	int softDeleteMemberPerfume(
		@Param("memberPerfumeId") Long memberPerfumeId,
		@Param("memberId") Long memberId
	);
}
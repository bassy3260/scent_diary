package com.example.fragrance.likes.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.example.fragrance.likes.dto.LikedPerfume;

@Mapper
public interface LikesMapper {

	List<LikedPerfume> findLikedPerfumes(
		@Param("memberId") Long memberId,
		@Param("offset") int offset,
		@Param("size") int size
	);

	long countLikedPerfumes(@Param("memberId") Long memberId);

	int hardDeleteLikes(
		@Param("likesId") Long likesId,
		@Param("memberId") Long memberId
	);

	boolean existsLike(@Param("userId") Long userId, @Param("perfumeId") Long perfumeId);

	void insertLike(@Param("userId") Long userId, @Param("perfumeId") Long perfumeId);

	void deleteLike(@Param("userId") Long userId, @Param("perfumeId") Long perfumeId);
}

package com.example.fragrance.likes.service;

import java.util.List;

import com.example.fragrance.likes.dto.LikedPerfume;
import com.example.fragrance.likes.dto.LikedPerfumeListResponse;

public interface LikesService {
	LikedPerfumeListResponse getLikedPerfumes(Long memberId, int page, int size);
	void deleteLikes(Long likesId, Long memberId);
	String toggleLike(Long userId, Long perfumeId);
	List<LikedPerfume> getTopLikedPerfumes();
}

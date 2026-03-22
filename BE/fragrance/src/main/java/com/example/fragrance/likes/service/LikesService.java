package com.example.fragrance.likes.service;

import com.example.fragrance.likes.dto.LikedPerfumeListResponse;

public interface LikesService {
	public LikedPerfumeListResponse getLikedPerfumes(Long memberId, int page, int size);
	public void deleteLikes(Long likesId, Long memberId);

	public String toggleLike(Long userId, Long perfumeId);
}

package com.example.fragrance.likes.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.fragrance.likes.dto.LikedPerfume;
import com.example.fragrance.likes.dto.LikedPerfumeListResponse;
import com.example.fragrance.likes.mapper.LikesMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LikesServiceImpl implements LikesService{
	private final LikesMapper likesMapper;

	public LikedPerfumeListResponse getLikedPerfumes(Long memberId, int page, int size) {
		int offset = page * size;
		List<LikedPerfume> perfumes = likesMapper.findLikedPerfumes(memberId, offset, size);
		long totalElements = likesMapper.countLikedPerfumes(memberId);
		int totalPages = (int) Math.ceil((double) totalElements / size);
		return new LikedPerfumeListResponse(perfumes, page, size, totalElements, totalPages);
	}

	public void deleteLikes(Long likesId, Long memberId) {
		int affected = likesMapper.hardDeleteLikes(likesId, memberId);
		if (affected == 0) {
			throw new IllegalArgumentException("찜한 향수를 찾을 수 없거나 삭제 권한이 없습니다.");
		}
	}
}

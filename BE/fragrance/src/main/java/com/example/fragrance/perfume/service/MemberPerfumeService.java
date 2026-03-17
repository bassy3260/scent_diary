package com.example.fragrance.perfume.service;

import com.example.fragrance.perfume.dto.MemberPerfumeListResponse;

public interface MemberPerfumeService {
	MemberPerfumeListResponse getOwnedPerfumes(Long memberId, int page, int size);
	void deleteMemberPerfume(Long memberPerfumeId, Long memberId);
	String insertCollect(Long memberId, Long perfumeId);
}


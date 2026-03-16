package com.example.fragrance.perfume.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.fragrance.perfume.dto.MemberPerfumeDto;
import com.example.fragrance.perfume.dto.MemberPerfumeListResponse;
import com.example.fragrance.perfume.mapper.MemberPerfumeMapper;

import lombok.RequiredArgsConstructor;

public interface MemberPerfumeService {
	MemberPerfumeListResponse getOwnedPerfumes(Long memberId, int page, int size);
	void deleteMemberPerfume(Long memberPerfumeId, Long memberId);
}


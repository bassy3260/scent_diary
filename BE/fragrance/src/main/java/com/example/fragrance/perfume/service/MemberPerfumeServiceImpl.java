package com.example.fragrance.perfume.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.fragrance.perfume.dto.MemberPerfumeDto;
import com.example.fragrance.perfume.dto.MemberPerfumeListResponse;
import com.example.fragrance.perfume.mapper.MemberPerfumeMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberPerfumeServiceImpl implements MemberPerfumeService {

	private final MemberPerfumeMapper memberPerfumeMapper;

	@Override
	public MemberPerfumeListResponse getOwnedPerfumes(Long memberId, int page, int size) {
		int offset = page * size;
		List<MemberPerfumeDto> perfumes = memberPerfumeMapper.findOwnedPerfumes(memberId, offset, size);
		long totalElements = memberPerfumeMapper.countOwnedPerfumes(memberId);
		int totalPages = (int) Math.ceil((double) totalElements / size);
		return new MemberPerfumeListResponse(perfumes, page, size, totalElements, totalPages);
	}

	@Override
	public void deleteMemberPerfume(Long memberPerfumeId, Long memberId) {
		int affected = memberPerfumeMapper.hardDeleteMemberPerfume(memberPerfumeId, memberId);
		if (affected == 0) {
			throw new IllegalArgumentException("소장한 향수를 찾을 수 없거나 삭제 권한이 없습니다.");
		}
	}
}
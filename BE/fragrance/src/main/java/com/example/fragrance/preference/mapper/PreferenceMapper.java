package com.example.fragrance.preference.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.example.fragrance.preference.dto.PreferenceAccordDto;
import com.example.fragrance.preference.dto.PreferenceNoteDto;

@Mapper
public interface PreferenceMapper {

	long countOwnedPerfumes(@Param("memberId") Long memberId);

	List<PreferenceAccordDto> findTopAccords(@Param("memberId") Long memberId);

	List<PreferenceNoteDto> findTopNotes(@Param("memberId") Long memberId);

	List<PreferenceNoteDto> findTopNotesByLevel(
		@Param("memberId") Long memberId,
		@Param("noteLevel") String noteLevel
	);
}
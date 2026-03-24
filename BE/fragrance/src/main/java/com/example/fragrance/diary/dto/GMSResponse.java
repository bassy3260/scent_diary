package com.example.fragrance.diary.dto;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class GMSResponse {
	private List<Choice> choices;

	@Getter
	@NoArgsConstructor
	public static class Choice {
		private Message message;
	}

	@Getter
	@NoArgsConstructor
	public static class Message {
		private String content;
	}
}
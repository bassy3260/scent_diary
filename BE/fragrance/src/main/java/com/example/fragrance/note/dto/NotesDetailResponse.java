package com.example.fragrance.note.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class NotesDetailResponse {
    private List<String> top;
    private List<String> middle;
    private List<String> base;
    private List<String> single;
}

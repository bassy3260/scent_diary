package com.example.fragrance.note.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotesDetailResponse {
    @Builder.Default
    private List<String> top = new ArrayList<>();;
    @Builder.Default
    private List<String> middle = new ArrayList<>();;
    @Builder.Default
    private List<String> base = new ArrayList<>();;
    @Builder.Default
    private List<String> single = new ArrayList<>();;
}

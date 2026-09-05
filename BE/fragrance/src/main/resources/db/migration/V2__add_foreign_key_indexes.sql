-- Postgres does not auto-index FK columns (unlike the PK side).
-- These columns were being joined/filtered with a Seq Scan; add indexes
-- so lookups and the member-withdrawal cascade updates scale with data volume.

CREATE INDEX idx_diary_member_id ON public.diary(member_id);
CREATE INDEX idx_diary_perfume_id ON public.diary(perfume_id);
CREATE INDEX idx_diary_image_diary_id ON public.diary_image(diary_id);
CREATE INDEX idx_review_member_id ON public.review(member_id);
CREATE INDEX idx_review_perfume_id ON public.review(perfume_id);
CREATE INDEX idx_perfume_note_perfume_id ON public.perfume_note(perfume_id);
CREATE INDEX idx_perfume_note_note_id ON public.perfume_note(note_id);
CREATE INDEX idx_perfume_accord_perfume_id ON public.perfume_accord(perfume_id);
CREATE INDEX idx_perfume_accord_accord_id ON public.perfume_accord(accord_id);
CREATE INDEX idx_try_diary_member_id ON public.try_diary(member_id);
CREATE INDEX idx_try_diary_perfume_perfume_id ON public.try_diary_perfume(perfume_id);
CREATE INDEX idx_try_diary_perfume_try_diary_id ON public.try_diary_perfume(try_diary_id);
CREATE INDEX idx_recommend_result_member_id ON public.recommend_result(member_id);
CREATE INDEX idx_perfume_recommend_recommend_result_id ON public.perfume_recommend(recommend_result_id);
CREATE INDEX idx_perfume_recommend_perfume_id ON public.perfume_recommend(perfume_id);
-- likes/member_perfume have a composite UNIQUE(member_id, perfume_id), which only
-- serves lookups keyed on member_id (the leading column); perfume_id-first lookups
-- (e.g. "who liked/collected this perfume") still needed their own index.
CREATE INDEX idx_likes_perfume_id ON public.likes(perfume_id);
CREATE INDEX idx_member_perfume_perfume_id ON public.member_perfume(perfume_id);

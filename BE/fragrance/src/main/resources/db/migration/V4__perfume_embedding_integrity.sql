-- perfume_embedding.perfume_id was `integer` while perfume.perfume_id is `bigint`,
-- and had no FK back to perfume at all -- nothing stopped an embedding row from
-- pointing at a perfume_id that doesn't exist. Align the type and add the FK.

ALTER TABLE public.perfume_embedding ALTER COLUMN perfume_id TYPE bigint;
ALTER TABLE public.perfume_embedding
    ADD CONSTRAINT fk_perfume_embedding_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id);

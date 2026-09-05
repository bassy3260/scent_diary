-- Baseline snapshot of the schema as it existed before Flyway was introduced
-- (captured via `pg_dump --schema-only` against the local DB on 2026-09-05).
-- On a DB that already has this schema, Flyway is configured with
-- baseline-on-migrate + baseline-version so this file is recorded as applied
-- without being re-run. On a brand-new empty DB it runs for real.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

CREATE TYPE public.age_enum AS ENUM (
    '10s',
    '20s_early',
    '20s_mid',
    '20s_late',
    '30s',
    '40s_above'
);

CREATE TYPE public.gender_enum AS ENUM (
    'FEMALE',
    'MALE',
    'NONE'
);

CREATE TYPE public.note_level_enum AS ENUM (
    'TOP',
    'MIDDLE',
    'BASE',
    'SINGLE'
);

CREATE TYPE public.season_type AS ENUM (
    'spring',
    'summer',
    'fall',
    'winter'
);

CREATE TYPE public.sillage_type AS ENUM (
    'strong',
    'middle',
    'weak'
);

CREATE TABLE public.accord (
    accord_id bigint GENERATED ALWAYS AS IDENTITY,
    accord_name character varying(255),
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.diary (
    diary_id bigint GENERATED ALWAYS AS IDENTITY,
    member_id bigint NOT NULL,
    perfume_id bigint NOT NULL,
    title character varying(100),
    detail text,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.diary_image (
    diary_image_id bigint GENERATED ALWAYS AS IDENTITY,
    diary_id bigint NOT NULL,
    image_route character varying(255) NOT NULL,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.likes (
    likes_id bigint GENERATED ALWAYS AS IDENTITY,
    member_id bigint NOT NULL,
    perfume_id bigint NOT NULL,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public."member" (
    member_id bigint GENERATED ALWAYS AS IDENTITY,
    id character varying(45) NOT NULL,
    password character varying(200) NOT NULL,
    birth_year bigint,
    gender public.gender_enum NOT NULL,
    nickname character varying(45),
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.member_perfume (
    member_perfume_id bigint GENERATED ALWAYS AS IDENTITY,
    member_id bigint NOT NULL,
    perfume_id bigint NOT NULL,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.note (
    note_id bigint GENERATED ALWAYS AS IDENTITY,
    note_name character varying(255) NOT NULL,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.perfume (
    perfume_id bigint GENERATED ALWAYS AS IDENTITY,
    image_route character varying(255),
    perfume_name character varying(255),
    brand character varying(255),
    price integer,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false,
    description character varying(1000),
    url character varying(1000)
);

CREATE TABLE public.perfume_accord (
    perfume_accord_id bigint GENERATED ALWAYS AS IDENTITY,
    accord_id bigint NOT NULL,
    perfume_id bigint NOT NULL,
    accord_order bigint,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

-- perfume_id is intentionally `integer` (not bigint) and has no FK here --
-- this is the real pre-existing state; both are corrected in V4.
CREATE TABLE public.perfume_embedding (
    perfume_id integer NOT NULL,
    content text,
    accords text[],
    main_accord text,
    accord_embedding public.vector(1024),
    top_embedding public.vector(1024),
    middle_embedding public.vector(1024),
    base_embedding public.vector(1024),
    single_embedding public.vector(1024),
    desc_embedding public.vector(1024)
);

CREATE TABLE public.perfume_note (
    perfume_note_id bigint GENERATED ALWAYS AS IDENTITY,
    perfume_id bigint NOT NULL,
    note_id bigint NOT NULL,
    note_level public.note_level_enum NOT NULL,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.perfume_recommend (
    perfume_recommend_id bigint GENERATED ALWAYS AS IDENTITY,
    recommend_result_id bigint NOT NULL,
    perfume_id bigint NOT NULL,
    reasons text,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.recommend_result (
    recommend_result_id bigint GENERATED ALWAYS AS IDENTITY,
    member_id bigint NOT NULL,
    keyword character varying(255),
    image_route character varying(255),
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.review (
    review_id bigint GENERATED ALWAYS AS IDENTITY,
    detail text,
    member_id bigint NOT NULL,
    perfume_id bigint NOT NULL,
    rating smallint,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.try_diary (
    try_diary_id bigint GENERATED ALWAYS AS IDENTITY,
    member_id bigint NOT NULL,
    title character varying(100),
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false
);

CREATE TABLE public.try_diary_perfume (
    try_diary_perfume_id bigint GENERATED ALWAYS AS IDENTITY,
    perfume_id bigint NOT NULL,
    try_diary_id bigint NOT NULL,
    description text,
    create_time timestamp without time zone,
    modify_time timestamp without time zone,
    delete_time timestamp without time zone,
    is_delete boolean DEFAULT false,
    place character varying(255),
    lasting integer,
    sillage public.sillage_type,
    season public.season_type
);

ALTER TABLE ONLY public.accord ADD CONSTRAINT accord_pkey PRIMARY KEY (accord_id);
ALTER TABLE ONLY public.diary_image ADD CONSTRAINT diary_image_pkey PRIMARY KEY (diary_image_id);
ALTER TABLE ONLY public.diary ADD CONSTRAINT diary_pkey PRIMARY KEY (diary_id);
ALTER TABLE ONLY public.likes ADD CONSTRAINT likes_member_id_perfume_id_key UNIQUE (member_id, perfume_id);
ALTER TABLE ONLY public.likes ADD CONSTRAINT likes_pkey PRIMARY KEY (likes_id);
-- member_id_key (plain UNIQUE) reflects the real pre-existing state; V3 replaces
-- it with a partial unique index so soft-deleted ids can be reused.
ALTER TABLE ONLY public."member" ADD CONSTRAINT member_id_key UNIQUE (id);
ALTER TABLE ONLY public.member_perfume ADD CONSTRAINT member_perfume_member_id_perfume_id_key UNIQUE (member_id, perfume_id);
ALTER TABLE ONLY public.member_perfume ADD CONSTRAINT member_perfume_pkey PRIMARY KEY (member_perfume_id);
ALTER TABLE ONLY public."member" ADD CONSTRAINT member_pkey PRIMARY KEY (member_id);
ALTER TABLE ONLY public.note ADD CONSTRAINT note_pkey PRIMARY KEY (note_id);
ALTER TABLE ONLY public.perfume_accord ADD CONSTRAINT perfume_accord_pkey PRIMARY KEY (perfume_accord_id);
ALTER TABLE ONLY public.perfume_embedding ADD CONSTRAINT perfume_embedding_pkey PRIMARY KEY (perfume_id);
ALTER TABLE ONLY public.perfume_note ADD CONSTRAINT perfume_note_pkey PRIMARY KEY (perfume_note_id);
ALTER TABLE ONLY public.perfume ADD CONSTRAINT perfume_pkey PRIMARY KEY (perfume_id);
ALTER TABLE ONLY public.perfume_recommend ADD CONSTRAINT perfume_recommend_pkey PRIMARY KEY (perfume_recommend_id);
ALTER TABLE ONLY public.recommend_result ADD CONSTRAINT recommend_result_pkey PRIMARY KEY (recommend_result_id);
ALTER TABLE ONLY public.review ADD CONSTRAINT review_pkey PRIMARY KEY (review_id);
ALTER TABLE ONLY public.try_diary_perfume ADD CONSTRAINT try_diary_perfume_pkey PRIMARY KEY (try_diary_perfume_id);
ALTER TABLE ONLY public.try_diary ADD CONSTRAINT try_diary_pkey PRIMARY KEY (try_diary_id);

ALTER TABLE ONLY public.diary_image ADD CONSTRAINT fk_diary_image_diary FOREIGN KEY (diary_id) REFERENCES public.diary(diary_id);
ALTER TABLE ONLY public.diary ADD CONSTRAINT fk_diary_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id);
ALTER TABLE ONLY public.diary ADD CONSTRAINT fk_diary_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id);
ALTER TABLE ONLY public.likes ADD CONSTRAINT fk_likes_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id);
ALTER TABLE ONLY public.likes ADD CONSTRAINT fk_likes_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.member_perfume ADD CONSTRAINT fk_member_perfume_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id);
ALTER TABLE ONLY public.member_perfume ADD CONSTRAINT fk_member_perfume_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.perfume_accord ADD CONSTRAINT fk_perfume_accord_accord FOREIGN KEY (accord_id) REFERENCES public.accord(accord_id);
ALTER TABLE ONLY public.perfume_accord ADD CONSTRAINT fk_perfume_accord_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.perfume_note ADD CONSTRAINT fk_perfume_note_note FOREIGN KEY (note_id) REFERENCES public.note(note_id);
ALTER TABLE ONLY public.perfume_note ADD CONSTRAINT fk_perfume_note_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.perfume_recommend ADD CONSTRAINT fk_perfume_recommend_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.perfume_recommend ADD CONSTRAINT fk_perfume_recommend_result FOREIGN KEY (recommend_result_id) REFERENCES public.recommend_result(recommend_result_id);
ALTER TABLE ONLY public.recommend_result ADD CONSTRAINT fk_recommend_result_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id);
ALTER TABLE ONLY public.review ADD CONSTRAINT fk_review_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id);
ALTER TABLE ONLY public.review ADD CONSTRAINT fk_review_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id);
ALTER TABLE ONLY public.try_diary ADD CONSTRAINT fk_try_diary_member FOREIGN KEY (member_id) REFERENCES public."member"(member_id);
ALTER TABLE ONLY public.try_diary_perfume ADD CONSTRAINT fk_try_diary_perfume_perfume FOREIGN KEY (perfume_id) REFERENCES public.perfume(perfume_id);
ALTER TABLE ONLY public.try_diary_perfume ADD CONSTRAINT fk_try_diary_perfume_try_diary FOREIGN KEY (try_diary_id) REFERENCES public.try_diary(try_diary_id);
